/**
 * Client record — one durable object per *relationship*, spanning lead → live → churn.
 *
 *   Key   `jdd:client:{id}`              — the record
 *   Index `jdd:client:index`             — sorted set, score = createdAt
 *   Index `jdd:client:by-slug:{slug}`    — → id
 *   Index `jdd:client:by-email:{email}`  — → id
 *
 * Why this exists alongside PortalAccount: the account record answers "which sites does
 * this login own", which only becomes true *after* someone pays. It cannot represent a
 * prospect, it has no notion of churn, and it is keyed on an email the client controls.
 * The console needed something that starts at first contact and never ends, so a lead and
 * a client stop being two different populations joined by a slug-guessing heuristic.
 *
 * Keyed on a generated `id`, not the slug. The slug is a *property* here — which is what
 * makes renaming a client safe, and what lets a record exist before any folder does.
 *
 * ── What this record deliberately does NOT hold ──────────────────────────────
 *
 * MRR, renewal date, payment state, and plan are **absent on purpose**. Stripe owns them,
 * and a copy here would be a second source of truth that silently goes stale — the exact
 * failure this whole model exists to remove. Those are gathered at reconcile time and
 * cached with a `checkedAt` the UI can show. Only genuinely *accumulated* history, which
 * no vendor will tell you retroactively, persists in `ledger`.
 *
 * Everything here is a **pure** function over plain data — no Redis, no network — so the
 * stage rules can be unit tested. Store wrappers live in the consumers.
 */
import { z } from "zod";
export const STAGE_ORDER = [
    "lead",
    "won",
    "building",
    "provisioned",
    "live",
    "at-risk",
    "dormant",
    "cancelling",
    "churned",
];
/** Stages that mean money is (or should be) arriving. */
export const PAYING_STAGES = ["live", "at-risk", "dormant", "cancelling"];
export const CLIENT_KEY_PREFIX = "jdd:client:";
export const CLIENT_INDEX_KEY = "jdd:client:index";
export const CLIENT_BY_SLUG_PREFIX = "jdd:client:by-slug:";
export const CLIENT_BY_EMAIL_PREFIX = "jdd:client:by-email:";
export function clientKey(id) {
    return `${CLIENT_KEY_PREFIX}${id}`;
}
export function clientBySlugKey(slug) {
    return `${CLIENT_BY_SLUG_PREFIX}${slug}`;
}
/** Matches accountKey's normalization, or the two indexes disagree for the same person. */
export function clientByEmailKey(email) {
    return `${CLIENT_BY_EMAIL_PREFIX}${email.trim().toLowerCase()}`;
}
/** Breakages inside the window before a live client counts as at-risk. */
export const AT_RISK_BREAKAGE_THRESHOLD = 2;
function stageFromDisk(disk) {
    switch (disk) {
        case "live":
            return "live";
        case "provisioned":
        case "portal-pending":
            return "provisioned";
        default:
            return "building";
    }
}
/**
 * The single stage, from all available evidence. **First match wins** — the same shape as
 * `attentionFor()` in the console, and for the same reason: a relationship that is both
 * cancelling and at-risk reads as "cancelling", which is the one you would act on.
 *
 * The rule order is the contract. It is covered case-by-case in the tests, so changing the
 * order without changing the tests will fail rather than quietly re-classify every client.
 */
export function deriveStage(evidence, now = Date.now()) {
    const { stageOverride = null, cancel = null, subscription = null, disk = null, portal = null, breakages30d = 0, hasClientFolder = false, hasPaid = false, } = evidence;
    // 1 — an operator has said otherwise, and a human beats a heuristic.
    if (stageOverride) {
        return { stage: stageOverride, reason: "Set manually", unbilled: false };
    }
    // 2/3 — a cancellation in flight outranks everything about how healthy the site is.
    if (cancel) {
        return now >= cancel.effectiveAt
            ? { stage: "churned", reason: "Cancellation took effect", unbilled: false }
            : { stage: "cancelling", reason: "Cancellation requested, in notice period", unbilled: false };
    }
    // 4 — payment trouble or a pattern of breakage. Both are "they may be about to leave".
    if (subscription === "trouble") {
        return { stage: "at-risk", reason: "Payment failing", unbilled: false };
    }
    if (subscription === "active" && breakages30d >= AT_RISK_BREAKAGE_THRESHOLD) {
        return {
            stage: "at-risk",
            reason: `${breakages30d} infra breakages in 30 days`,
            unbilled: false,
        };
    }
    if (subscription === "active") {
        // 5 — both sides agree it shipped.
        if (disk === "live" && portal === "live") {
            return { stage: "live", reason: "Provisioned and handed off", unbilled: false };
        }
        // 6 — paying, still being built. Disk alone must NOT reach `live`: when disk says live
        // and the portal record does not, the honest answer is that provisioning finished and
        // the handoff did not. Falling through to stageFromDisk() here would return "live" and
        // paper over precisely the disk↔portal disagreement this model exists to surface.
        if (disk === "live") {
            return {
                stage: "provisioned",
                reason: "Built, but the portal record isn't live yet",
                unbilled: false,
            };
        }
        return {
            stage: stageFromDisk(disk),
            reason: "Paid, provisioning in progress",
            unbilled: false,
        };
    }
    // 7 — paid, but nothing exists on disk yet: pending-onboarding, or an unimported intake.
    if (hasPaid && !hasClientFolder) {
        return { stage: "won", reason: "Paid, awaiting onboarding", unbilled: false };
    }
    // 8 — a folder with no subscription behind it. Report what disk says AND flag it; calling
    // a client with a live site a "lead" because Stripe came back empty would hide the fact
    // that they are being served for free.
    if (hasClientFolder) {
        return {
            stage: stageFromDisk(disk),
            reason: subscription === "ended" ? "Subscription ended" : "No subscription found",
            unbilled: subscription !== "ended",
        };
    }
    // 9 — nothing paid, nothing built.
    return { stage: "lead", reason: "No payment yet", unbilled: false };
}
export function createClientRecord(input, now = Date.now()) {
    return {
        id: input.id,
        email: input.email.trim().toLowerCase(),
        slug: input.slug ?? null,
        siteSlugs: input.siteSlugs ?? (input.slug ? [input.slug] : []),
        leadId: input.leadId ?? null,
        stage: input.stage ?? "lead",
        stageUpdatedAt: now,
        stageOverride: null,
        ledger: { ltvCents: 0, firstPaidAt: null, overages: [] },
        createdAt: now,
        updatedAt: now,
    };
}
/**
 * Apply a derived stage, moving `stageUpdatedAt` **only when the stage actually changes**.
 * A reconcile sweep over a settled roster should not rewrite every timestamp — otherwise
 * "how long has this been live" becomes "when did you last open the console".
 */
export function applyStage(record, result, now = Date.now()) {
    if (record.stage === result.stage)
        return record;
    return { ...record, stage: result.stage, stageUpdatedAt: now, updatedAt: now };
}
/** Set or clear the operator override. Clearing hands the record back to the rules. */
export function setStageOverride(record, stage, now = Date.now()) {
    return { ...record, stageOverride: stage, updatedAt: now };
}
/** Attach the originating lead. Both directions are written by the caller. */
export function linkLead(record, leadId, now = Date.now()) {
    return { ...record, leadId, updatedAt: now };
}
/**
 * Bind a converted lead to its client folder. Sets `siteSlugs` too, since a single-site
 * client's site slug *is* the base slug and forgetting that is what would make reconcile
 * skip it entirely.
 */
export function attachSlug(record, slug, siteSlugs, now = Date.now()) {
    return {
        ...record,
        slug,
        siteSlugs: siteSlugs?.length ? siteSlugs : [slug],
        updatedAt: now,
    };
}
/**
 * Record an overage for a billing period, replacing any entry for the same `periodEnd`.
 * Idempotent by period so re-running the metering cron can't double-count — which would
 * inflate the number you quote in an upsell conversation.
 */
export function recordOverage(record, entry, now = Date.now()) {
    const overages = record.ledger.overages.filter((o) => o.periodEnd !== entry.periodEnd);
    overages.push(entry);
    overages.sort((a, b) => a.periodEnd - b.periodEnd);
    return { ...record, ledger: { ...record.ledger, overages }, updatedAt: now };
}
/** Add a collected payment, setting `firstPaidAt` the first time only. */
export function recordPayment(record, cents, at, now = Date.now()) {
    return {
        ...record,
        ledger: {
            ...record.ledger,
            ltvCents: record.ledger.ltvCents + cents,
            firstPaidAt: record.ledger.firstPaidAt ?? at,
        },
        updatedAt: now,
    };
}
/** Whole months since the first payment; 0 before one. */
export function tenureMonths(record, now = Date.now()) {
    const from = record.ledger.firstPaidAt;
    if (!from || now <= from)
        return 0;
    const start = new Date(from);
    const end = new Date(now);
    let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
        (end.getUTCMonth() - start.getUTCMonth());
    if (end.getUTCDate() < start.getUTCDate())
        months--;
    return Math.max(0, months);
}
// ── Validation ──────────────────────────────────────────────────────────────
export const zStage = z.enum([
    "lead",
    "won",
    "building",
    "provisioned",
    "live",
    "at-risk",
    "dormant",
    "cancelling",
    "churned",
]);
export const zOveragePeriod = z.object({
    periodEnd: z.number(),
    minutes: z.number(),
    billedCents: z.number(),
});
export const zClientLedger = z.object({
    ltvCents: z.number(),
    firstPaidAt: z.number().nullable(),
    overages: z.array(zOveragePeriod).default([]),
});
export const zClientRecord = z.object({
    id: z.string().min(1),
    email: z.string().min(1),
    slug: z.string().nullable(),
    siteSlugs: z.array(z.string()).default([]),
    leadId: z.string().nullable(),
    stage: zStage,
    stageUpdatedAt: z.number(),
    stageOverride: zStage.nullable(),
    ledger: zClientLedger,
    createdAt: z.number(),
    updatedAt: z.number(),
});
//# sourceMappingURL=client-record.js.map