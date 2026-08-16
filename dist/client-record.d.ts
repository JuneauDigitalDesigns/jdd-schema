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
import type { PortalSiteStatus } from "./account.js";
/**
 * Where a relationship stands. Ordered: earlier stages precede later ones, and the
 * post-live stages are the retention layer the console previously had no vocabulary for.
 */
export type Stage = "lead" | "won" | "building" | "provisioned" | "live" | "at-risk" | "dormant" | "cancelling" | "churned";
export declare const STAGE_ORDER: Stage[];
/** Stages that mean money is (or should be) arriving. */
export declare const PAYING_STAGES: Stage[];
/** One billing period that exceeded the plan's minute cap. */
export interface OveragePeriod {
    /** Epoch ms — end of the billing period this overage belongs to. */
    periodEnd: number;
    /** Minutes over the cap. */
    minutes: number;
    /** What was actually billed for them, in cents. */
    billedCents: number;
}
/**
 * Accumulated history only. Every field here answers a question no vendor API will answer
 * retroactively, which is the sole test for whether something belongs on the record rather
 * than in the reconcile cache.
 */
export interface ClientLedger {
    /** Total collected, in cents. */
    ltvCents: number;
    /** Epoch ms of the first successful payment; null before one. */
    firstPaidAt: number | null;
    overages: OveragePeriod[];
}
export interface ClientRecord {
    /** Stable and opaque. Survives slug renames and email changes. */
    id: string;
    /** Join key to `jdd:account:{email}`. Normalized. */
    email: string;
    /** `clients/{slug}` folder. Null until the lead converts. */
    slug: string | null;
    /**
     * Every provisionable site. Enterprise: `baseSlug-1..N`. Single-site: `[slug]`.
     * Reconcile iterates this — a per-client-only sweep silently skips an enterprise
     * client's second and third sites.
     */
    siteSlugs: string[];
    /** Hard link to `jdd:lead:item:{leadId}`. Null for clients that never were a lead here. */
    leadId: string | null;
    stage: Stage;
    stageUpdatedAt: number;
    /**
     * Operator-set stage, which wins over every derived rule. Also the *only* way to reach
     * `dormant`: the automatic triggers we chose are all at-risk-shaped (payment trouble,
     * repeated breakage), and none of them describes a client who is simply quiet.
     */
    stageOverride: Stage | null;
    ledger: ClientLedger;
    createdAt: number;
    updatedAt: number;
}
export declare const CLIENT_KEY_PREFIX = "jdd:client:";
export declare const CLIENT_INDEX_KEY = "jdd:client:index";
export declare const CLIENT_BY_SLUG_PREFIX = "jdd:client:by-slug:";
export declare const CLIENT_BY_EMAIL_PREFIX = "jdd:client:by-email:";
export declare function clientKey(id: string): string;
export declare function clientBySlugKey(slug: string): string;
/** Matches accountKey's normalization, or the two indexes disagree for the same person. */
export declare function clientByEmailKey(email: string): string;
/** What `clients.ts deriveStatus()` reports from the folder on disk. */
export type DiskStatus = "needs-build" | "ready" | "provisioned" | "portal-pending" | "live" | "unknown";
/**
 * Stripe subscription states we care about, collapsed to the three that change behaviour.
 * `null` means no subscription was found at all — which is NOT the same as a cancelled
 * one, and is the case that produces `unbilled`.
 */
export type SubscriptionHealth = "active" | "trouble" | "ended" | null;
/** Everything the stage rules read. Assembled by the caller; this module stays pure. */
export interface StageEvidence {
    stageOverride?: Stage | null;
    /** Portal cancel signal — `jdd:cancel-request:{slug}`. */
    cancel?: {
        requestedAt: number;
        effectiveAt: number;
    } | null;
    subscription?: SubscriptionHealth;
    disk?: DiskStatus | null;
    portal?: PortalSiteStatus | null;
    /**
     * Infra breakages inside the rolling window, counted from reconcile history. Two or more
     * means the client has had a bad experience whether or not they have said so.
     */
    breakages30d?: number;
    /** Whether a `clients/{slug}` folder exists. */
    hasClientFolder?: boolean;
    /** Whether payment was ever captured — covers pending-onboarding and pending intakes. */
    hasPaid?: boolean;
}
export interface StageResult {
    stage: Stage;
    /** Which rule fired, for the lifecycle spine and for debugging a surprising stage. */
    reason: string;
    /**
     * A folder exists but no subscription backs it. The stage still reflects reality —
     * never silently downgraded to `lead` — and the caller raises this as a red finding.
     */
    unbilled: boolean;
}
/** Breakages inside the window before a live client counts as at-risk. */
export declare const AT_RISK_BREAKAGE_THRESHOLD = 2;
/**
 * The single stage, from all available evidence. **First match wins** — the same shape as
 * `attentionFor()` in the console, and for the same reason: a relationship that is both
 * cancelling and at-risk reads as "cancelling", which is the one you would act on.
 *
 * The rule order is the contract. It is covered case-by-case in the tests, so changing the
 * order without changing the tests will fail rather than quietly re-classify every client.
 */
export declare function deriveStage(evidence: StageEvidence, now?: number): StageResult;
export interface CreateClientRecordInput {
    id: string;
    email: string;
    slug?: string | null;
    siteSlugs?: string[];
    leadId?: string | null;
    stage?: Stage;
}
export declare function createClientRecord(input: CreateClientRecordInput, now?: number): ClientRecord;
/**
 * Apply a derived stage, moving `stageUpdatedAt` **only when the stage actually changes**.
 * A reconcile sweep over a settled roster should not rewrite every timestamp — otherwise
 * "how long has this been live" becomes "when did you last open the console".
 */
export declare function applyStage(record: ClientRecord, result: StageResult, now?: number): ClientRecord;
/** Set or clear the operator override. Clearing hands the record back to the rules. */
export declare function setStageOverride(record: ClientRecord, stage: Stage | null, now?: number): ClientRecord;
/** Attach the originating lead. Both directions are written by the caller. */
export declare function linkLead(record: ClientRecord, leadId: string, now?: number): ClientRecord;
/**
 * Bind a converted lead to its client folder. Sets `siteSlugs` too, since a single-site
 * client's site slug *is* the base slug and forgetting that is what would make reconcile
 * skip it entirely.
 */
export declare function attachSlug(record: ClientRecord, slug: string, siteSlugs?: string[], now?: number): ClientRecord;
/**
 * Record an overage for a billing period, replacing any entry for the same `periodEnd`.
 * Idempotent by period so re-running the metering cron can't double-count — which would
 * inflate the number you quote in an upsell conversation.
 */
export declare function recordOverage(record: ClientRecord, entry: OveragePeriod, now?: number): ClientRecord;
/** Add a collected payment, setting `firstPaidAt` the first time only. */
export declare function recordPayment(record: ClientRecord, cents: number, at: number, now?: number): ClientRecord;
/** Whole months since the first payment; 0 before one. */
export declare function tenureMonths(record: ClientRecord, now?: number): number;
export declare const zStage: z.ZodEnum<["lead", "won", "building", "provisioned", "live", "at-risk", "dormant", "cancelling", "churned"]>;
export declare const zOveragePeriod: z.ZodObject<{
    periodEnd: z.ZodNumber;
    minutes: z.ZodNumber;
    billedCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    periodEnd: number;
    minutes: number;
    billedCents: number;
}, {
    periodEnd: number;
    minutes: number;
    billedCents: number;
}>;
export declare const zClientLedger: z.ZodObject<{
    ltvCents: z.ZodNumber;
    firstPaidAt: z.ZodNullable<z.ZodNumber>;
    overages: z.ZodDefault<z.ZodArray<z.ZodObject<{
        periodEnd: z.ZodNumber;
        minutes: z.ZodNumber;
        billedCents: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        periodEnd: number;
        minutes: number;
        billedCents: number;
    }, {
        periodEnd: number;
        minutes: number;
        billedCents: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    ltvCents: number;
    firstPaidAt: number | null;
    overages: {
        periodEnd: number;
        minutes: number;
        billedCents: number;
    }[];
}, {
    ltvCents: number;
    firstPaidAt: number | null;
    overages?: {
        periodEnd: number;
        minutes: number;
        billedCents: number;
    }[] | undefined;
}>;
export declare const zClientRecord: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    slug: z.ZodNullable<z.ZodString>;
    siteSlugs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    leadId: z.ZodNullable<z.ZodString>;
    stage: z.ZodEnum<["lead", "won", "building", "provisioned", "live", "at-risk", "dormant", "cancelling", "churned"]>;
    stageUpdatedAt: z.ZodNumber;
    stageOverride: z.ZodNullable<z.ZodEnum<["lead", "won", "building", "provisioned", "live", "at-risk", "dormant", "cancelling", "churned"]>>;
    ledger: z.ZodObject<{
        ltvCents: z.ZodNumber;
        firstPaidAt: z.ZodNullable<z.ZodNumber>;
        overages: z.ZodDefault<z.ZodArray<z.ZodObject<{
            periodEnd: z.ZodNumber;
            minutes: z.ZodNumber;
            billedCents: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            periodEnd: number;
            minutes: number;
            billedCents: number;
        }, {
            periodEnd: number;
            minutes: number;
            billedCents: number;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        ltvCents: number;
        firstPaidAt: number | null;
        overages: {
            periodEnd: number;
            minutes: number;
            billedCents: number;
        }[];
    }, {
        ltvCents: number;
        firstPaidAt: number | null;
        overages?: {
            periodEnd: number;
            minutes: number;
            billedCents: number;
        }[] | undefined;
    }>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    slug: string | null;
    email: string;
    createdAt: number;
    updatedAt: number;
    id: string;
    stageOverride: "building" | "live" | "lead" | "won" | "provisioned" | "at-risk" | "dormant" | "cancelling" | "churned" | null;
    siteSlugs: string[];
    leadId: string | null;
    stage: "building" | "live" | "lead" | "won" | "provisioned" | "at-risk" | "dormant" | "cancelling" | "churned";
    stageUpdatedAt: number;
    ledger: {
        ltvCents: number;
        firstPaidAt: number | null;
        overages: {
            periodEnd: number;
            minutes: number;
            billedCents: number;
        }[];
    };
}, {
    slug: string | null;
    email: string;
    createdAt: number;
    updatedAt: number;
    id: string;
    stageOverride: "building" | "live" | "lead" | "won" | "provisioned" | "at-risk" | "dormant" | "cancelling" | "churned" | null;
    leadId: string | null;
    stage: "building" | "live" | "lead" | "won" | "provisioned" | "at-risk" | "dormant" | "cancelling" | "churned";
    stageUpdatedAt: number;
    ledger: {
        ltvCents: number;
        firstPaidAt: number | null;
        overages?: {
            periodEnd: number;
            minutes: number;
            billedCents: number;
        }[] | undefined;
    };
    siteSlugs?: string[] | undefined;
}>;
//# sourceMappingURL=client-record.d.ts.map