/**
 * Portal account — the single source of truth for the client → site(s) mapping.
 *
 * Previously this lived in Clerk `publicMetadata`, which is browser-readable and had
 * multiple writers (onboarding, the Clerk webhook, the portal, onboard.js, the repair
 * tool) doing read-modify-write on the same object. That leaked infra IDs to the client
 * and raced. The account record replaces it:
 *
 *   Key   `jdd:account:{normalizedEmail}`        — the record
 *   Index `jdd:account-by-user:{clerkUserId}`    — → normalized email
 *
 * Keyed by email because the email is known at onboarding time, *before* the client has
 * signed up — so one record serves both the pending and live cases.
 *
 * Writers: juneau-digital-designs (onboarding), jdd-ops/onboard.js (provisioning),
 *          jdd-ops/console (/manage repair).
 * Reader:  juneau-digital-designs /portal (read-only on the hot path).
 *
 * Everything in this module is a **pure** function over plain data so it can be unit
 * tested without Clerk, Redis, or a network. The store wrappers live in the consumers.
 */
import { z } from "zod";
export const zPortalSite = z.object({
    slug: z.string().min(1),
    name: z.string().optional(),
    canonical: z.string().optional(),
    plan: z.enum(["starter", "growth", "enterprise"]),
    status: z.enum(["pending-onboarding", "building", "live"]),
    airtableBaseId: z.string().nullable().optional(),
    vercelProjectId: z.string().nullable().optional(),
    addedAt: z.number(),
    sessionId: z.string().optional(),
    signerEmail: z.string().optional(),
    signerName: z.string().optional(),
    onboardingCompletedAt: z.number().nullable().optional(),
    stripeSubscriptionId: z.string().optional(),
    stripeCustomerId: z.string().optional(),
    featured: z.object({
        optedInAt: z.number(),
        quote: z.string().optional(),
        showName: z.boolean(),
        showLink: z.boolean(),
    }).optional(),
    cancelRequestedAt: z.number().optional(),
    cancelEffectiveAt: z.number().optional(),
});
export const zPortalAccount = z.object({
    email: z.string().min(1),
    clerkUserId: z.string().nullable().optional(),
    sites: z.array(zPortalSite),
    createdAt: z.number(),
    updatedAt: z.number(),
    profile: z.object({
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        updatedAt: z.number(),
    }).optional(),
});
// ── Keys ────────────────────────────────────────────────────────────────────
export const ACCOUNT_KEY_PREFIX = "jdd:account:";
export const ACCOUNT_BY_USER_KEY_PREFIX = "jdd:account-by-user:";
/**
 * Trim + lowercase only. Deliberately NOT Gmail dot/plus-alias folding — that would
 * silently merge genuinely different accounts, which is worse than missing a match.
 */
export function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
export function accountKey(email) {
    return `${ACCOUNT_KEY_PREFIX}${normalizeEmail(email)}`;
}
export function accountByUserKey(clerkUserId) {
    return `${ACCOUNT_BY_USER_KEY_PREFIX}${clerkUserId}`;
}
// ── Pure operations ─────────────────────────────────────────────────────────
/** An empty account for a brand-new email. */
export function createAccount(email, now = Date.now()) {
    return {
        email: normalizeEmail(email),
        clerkUserId: null,
        sites: [],
        createdAt: now,
        updatedAt: now,
    };
}
/** Copy of `o` with `undefined` values dropped, so a partial update never blanks a field. */
function definedOnly(o) {
    const out = {};
    for (const [k, v] of Object.entries(o)) {
        if (v !== undefined)
            out[k] = v;
    }
    return out;
}
/**
 * Add a site, or update it in place when the slug already exists — **always preserving
 * every other site**. This is the invariant that makes provisioning/repairing one site
 * safe for a multi-site account.
 *
 * Updates merge only *defined* fields, so a partial upsert (e.g. onboard.js supplying
 * airtableBaseId later) never blanks values set earlier. `addedAt` is preserved on update.
 * On insert, `plan` defaults to "starter" and `status` to "building".
 */
export function upsertSite(account, site, now = Date.now()) {
    const idx = account.sites.findIndex((s) => s.slug === site.slug);
    let sites;
    if (idx === -1) {
        const created = {
            plan: "starter",
            status: "building",
            ...definedOnly(site),
            slug: site.slug,
            addedAt: site.addedAt ?? now,
        };
        sites = [...account.sites, created];
    }
    else {
        sites = account.sites.map((s, i) => i === idx ? { ...s, ...definedOnly(site), addedAt: s.addedAt } : s);
    }
    return { ...account, sites, updatedAt: now };
}
/** Whether a site's wizard has been submitted (payment captured + form filled). */
export function isSiteOnboarded(site) {
    // Explicit null = payment captured, wizard not filled.
    // Undefined = pre-feature record; treat as onboarded so old clients are unaffected.
    return site.onboardingCompletedAt !== null && site.onboardingCompletedAt !== 0;
}
/**
 * Locate and update a pending site by sessionId, merging only defined fields.
 * Used by the portal submission route to convert a `pending-onboarding` site into
 * `building` and fill in the real slug/name from the wizard. Falls back to
 * slug-based upsert when no site has that sessionId (handles the old flow).
 */
export function upsertSiteBySessionId(account, sessionId, updates, now = Date.now()) {
    const idx = account.sites.findIndex((s) => s.sessionId === sessionId);
    if (idx === -1) {
        return upsertSite(account, updates, now);
    }
    const existing = account.sites[idx];
    const merged = {
        ...existing,
        ...definedOnly(updates),
        addedAt: existing.addedAt,
    };
    const sites = [
        ...account.sites.slice(0, idx),
        merged,
        ...account.sites.slice(idx + 1),
    ];
    return { ...account, sites, updatedAt: now };
}
/** Remove a site by slug, preserving the rest. */
export function removeSite(account, slug, now = Date.now()) {
    return {
        ...account,
        sites: account.sites.filter((s) => s.slug !== slug),
        updatedAt: now,
    };
}
/**
 * Pick the site a request is scoped to: the `?site=` slug when it matches, else the
 * primary (first) site. Null only when the account has no sites at all.
 */
export function resolveSite(account, siteParam) {
    if (account.sites.length === 0)
        return null;
    if (siteParam) {
        const match = account.sites.find((s) => s.slug === siteParam);
        if (match)
            return match;
    }
    return account.sites[0] ?? null;
}
/**
 * Build an account from legacy Clerk metadata (lazy, one-time migration).
 *
 * Two legacy shapes:
 *  - **single-site**: top-level slug/plan/canonical/... and no `sites[]`.
 *  - **enterprise**: top-level slug is the *base* slug (not a real site) and `sites[]`
 *    holds the actual sites, whose entries predate per-site `plan`/`status` and share the
 *    account-level Airtable base.
 *
 * A missing `status` means the client predates the building/live flag ⇒ treat as "live",
 * matching the portal's existing backward-compatible behaviour.
 *
 * Returns null when there's nothing to migrate.
 */
export function accountFromLegacyMetadata(email, meta, now = Date.now()) {
    if (!meta)
        return null;
    const account = createAccount(email, now);
    const accountPlan = meta.plan ?? "starter";
    const accountStatus = meta.status ?? "live";
    if (meta.sites && meta.sites.length > 0) {
        const sites = meta.sites.map((s) => ({
            slug: s.slug,
            name: s.name,
            canonical: s.canonical,
            plan: s.plan ?? accountPlan,
            status: s.status ?? accountStatus,
            // Enterprise sites share the account-level Airtable base.
            airtableBaseId: s.airtableBaseId ?? meta.airtableBaseId ?? null,
            vercelProjectId: s.vercelProjectId ?? null,
            addedAt: now,
        }));
        return { ...account, sites };
    }
    if (!meta.slug)
        return null;
    const single = {
        slug: meta.slug,
        name: meta.name,
        canonical: meta.canonical,
        plan: accountPlan,
        status: accountStatus,
        airtableBaseId: meta.airtableBaseId ?? null,
        vercelProjectId: meta.vercelProjectId ?? null,
        addedAt: now,
    };
    return { ...account, sites: [single] };
}
function firstNonEmpty(...values) {
    for (const v of values) {
        if (typeof v === "string" && v.trim())
            return v.trim();
    }
    return undefined;
}
/**
 * Turn a writer's view of a client's sites into `upsertSite` inputs.
 *
 * This exists because onboard.js (provisioning) and the console's /manage repair tool both
 * write the same account record, and had each grown their own version of these rules —
 * onboard.js hardcoding `status: "live"` and taking `canonical` raw, the console deriving
 * status from disk and applying its own base-sharing fallback. Same reasoning as `upsertSite`:
 * one pure, tested implementation so the two writers cannot drift.
 *
 * The rules:
 *  - **Airtable base** — starter sites get an explicit `null` (call data cannot exist for
 *    them). Everything else takes the site's own base, falling back to the shared one
 *    enterprise sites inherit — and when *neither* resolves the key is **omitted**, exactly
 *    like `canonical` and `vercelProjectId`. It used to be written as `null` unconditionally,
 *    which meant a writer that simply couldn't see the base (a console repair on a client
 *    with no `clients/{slug}/.env.local`) would blank a base id onboard.js had resolved
 *    earlier. That is the `undefined` vs `null` distinction above, and it applies here too.
 *  - **canonical** — the site's own, else the resolved Vercel host, else the key is *omitted*
 *    so a partial upsert never blanks a canonical a different writer set earlier.
 *  - **vercelProjectId** — passed through, and omitted entirely when `undefined`.
 *  - **plan / status** — applied uniformly; the caller decides them, since only the caller
 *    knows whether it is looking at disk state or a live deploy result.
 */
export function buildPortalSiteEntries(input) {
    const { plan, status, sharedAirtableBaseId = null, sites } = input;
    return sites.map((s) => {
        const entry = { slug: s.slug, plan, status };
        if (s.name !== undefined)
            entry.name = s.name;
        const canonical = firstNonEmpty(s.canonical, s.fallbackCanonical);
        if (canonical !== undefined)
            entry.canonical = canonical;
        if (plan === "starter") {
            // Starter genuinely has no call data — assert that, don't preserve a stale base.
            entry.airtableBaseId = null;
        }
        else {
            const resolved = s.airtableBaseId ?? sharedAirtableBaseId;
            // Omit when unresolved so `upsertSite` preserves whatever is already stored.
            if (resolved !== undefined && resolved !== null)
                entry.airtableBaseId = resolved;
        }
        if (s.vercelProjectId !== undefined)
            entry.vercelProjectId = s.vercelProjectId;
        return entry;
    });
}
/** Which stored id each feature needs before it can be queried. */
const FEATURE_REQUIREMENT = {
    calls: "airtableBaseId",
    traffic: "vercelProjectId",
    // PageSpeed measures a URL; without a canonical there is nothing to score.
    performance: "canonical",
};
/**
 * Resolve one feature for one site.
 *
 * The order is load-bearing and deliberately **plan → build status → connection → ready**.
 * Plan exclusion outranks build status so a Starter site mid-build hears the truth about
 * its plan rather than a promise of call data it will never receive.
 */
export function siteFeature(site, feature) {
    // 1. Plan. Only call data is plan-gated today; traffic and performance ship on every tier.
    if (feature === "calls" && site.plan === "starter")
        return { state: "not-on-plan" };
    // 2. Build status. Nothing is connectable before the site is provisioned.
    if (site.status !== "live")
        return { state: "pending-build" };
    // 3. Connection. Live, but the id this feature needs was never recorded.
    const required = site[FEATURE_REQUIREMENT[feature]];
    if (typeof required !== "string" || !required.trim())
        return { state: "connecting" };
    return { state: "ready" };
}
/** Every feature for one site, for callers that need the whole picture at once. */
export function siteFeatures(site) {
    return {
        calls: siteFeature(site, "calls"),
        traffic: siteFeature(site, "traffic"),
        performance: siteFeature(site, "performance"),
    };
}
//# sourceMappingURL=account.js.map