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
import { type MasterAgreementRef } from "./agreement.js";
export type PortalPlan = "starter" | "growth" | "enterprise";
export type PortalSiteStatus = "pending-onboarding" | "building" | "live";
/** One site belonging to an account. */
export interface PortalSite {
    slug: string;
    name?: string;
    canonical?: string;
    plan: PortalPlan;
    /**
     * "pending-onboarding" = payment received, wizard not yet submitted;
     * "building" = wizard submitted, not provisioned yet;
     * "live" = provisioned.
     */
    status: PortalSiteStatus;
    airtableBaseId?: string | null;
    vercelProjectId?: string | null;
    /**
     * Retell agent backing this site's voice receptionist. Written by onboard.js at
     * provisioning; absent on starter sites, which have no agent.
     *
     * This is the join key between an account and its call records. Retell is the
     * authoritative source for usage — the Airtable call log is lossy (it depends on a
     * post-call automation that can silently miss rows), so minute accounting reads
     * Retell directly and needs the agent id here rather than in a client-local
     * `.env.local` the portal cannot see.
     */
    retellAgentId?: string | null;
    addedAt: number;
    /** Stripe checkout session ID — set at payment time, used to link back to the wizard. */
    sessionId?: string;
    /** Agreement signer email — reminder target before onboarding is complete. */
    signerEmail?: string;
    /** Agreement signer name — for email personalization. */
    signerName?: string;
    /**
     * Epoch ms when the wizard was submitted. Null means payment is captured but the
     * wizard hasn't been filled. Undefined means this is a pre-feature record.
     */
    onboardingCompletedAt?: number | null;
    /** Stripe subscription ID — resolved lazily from the checkout session and persisted. */
    stripeSubscriptionId?: string;
    /**
     * Stripe customer ID for this site.
     *
     * Historical and per-site: checkout used to pass `customer_email`, which mints a **new**
     * Customer per purchase, so a multi-site client accumulated one of these per site.
     * `PortalAccount.stripeCustomerId` is the going-forward home. This stays for records that
     * predate it, and because consolidation has to know which Customer each existing
     * subscription actually lives on.
     */
    stripeCustomerId?: string;
    /**
     * The signed agreement authorising this specific site — the master for a client's first
     * purchase, an addendum for every one after.
     *
     * Copied onto the site because `agreement:{id}` is written with a 30-day TTL, so after a
     * month there was no way to answer "which terms authorised this site". The record itself is
     * also persisted past its TTL once payment clears; these fields are what the portal and
     * console read.
     */
    agreementId?: string;
    agreementPdfUrl?: string;
    agreementVersion?: string;
    /** The `jdd:purchase:{id}` intent this site came from. Absent on pre-cutover sites. */
    purchaseId?: string;
    /**
     * Client's consent to appear in the FeaturedSites homepage section.
     * Set when the client opts in via the portal. Nothing appears publicly until
     * Xander captures a screenshot and publishes via the console.
     */
    featured?: {
        optedInAt: number;
        quote?: string;
        showName: boolean;
        showLink: boolean;
    };
    /** Epoch ms when the client submitted a cancellation request. */
    cancelRequestedAt?: number;
    /** Epoch ms of the first billing boundary ≥ now + notice period — the Stripe cancel_at. */
    cancelEffectiveAt?: number;
}
/** Everything needed to add or update a site; only `slug` is required. */
export type PortalSiteInput = Partial<PortalSite> & {
    slug: string;
};
export interface PortalAccount {
    /** Normalized (trimmed + lowercased) email — the record key. */
    email: string;
    /** Linked on the client's first authenticated portal load. */
    clerkUserId?: string | null;
    /**
     * The one Stripe Customer every purchase on this account bills to.
     *
     * Account-level rather than per-site because `customer_email` on a Checkout Session mints
     * a fresh Customer each time: a client who bought three sites ended up with three
     * Customers, three payment methods and three unrelated invoice streams, and no way to show
     * them one bill. Resolved lazily — from an existing subscription for accounts that predate
     * this, otherwise created at first checkout.
     */
    stripeCustomerId?: string;
    /**
     * The governing agreement every addendum on this account hangs off.
     *
     * Absent on accounts that predate the master/addendum split — `legacyMasterFrom(sites)`
     * reconstructs one from what they are already being billed for rather than demanding a
     * signature from a client who plainly already gave one.
     */
    masterAgreement?: MasterAgreementRef;
    sites: PortalSite[];
    createdAt: number;
    updatedAt: number;
    /** Editable contact details. Account email is read-only (it is the KV key + Clerk link). */
    profile?: {
        contactName?: string;
        contactPhone?: string;
        updatedAt: number;
    };
}
export declare const zPortalSite: z.ZodObject<{
    slug: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    canonical: z.ZodOptional<z.ZodString>;
    plan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    status: z.ZodEnum<["pending-onboarding", "building", "live"]>;
    airtableBaseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    vercelProjectId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    retellAgentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    addedAt: z.ZodNumber;
    sessionId: z.ZodOptional<z.ZodString>;
    signerEmail: z.ZodOptional<z.ZodString>;
    signerName: z.ZodOptional<z.ZodString>;
    onboardingCompletedAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stripeSubscriptionId: z.ZodOptional<z.ZodString>;
    stripeCustomerId: z.ZodOptional<z.ZodString>;
    agreementId: z.ZodOptional<z.ZodString>;
    agreementPdfUrl: z.ZodOptional<z.ZodString>;
    agreementVersion: z.ZodOptional<z.ZodString>;
    purchaseId: z.ZodOptional<z.ZodString>;
    featured: z.ZodOptional<z.ZodObject<{
        optedInAt: z.ZodNumber;
        quote: z.ZodOptional<z.ZodString>;
        showName: z.ZodBoolean;
        showLink: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        optedInAt: number;
        showName: boolean;
        showLink: boolean;
        quote?: string | undefined;
    }, {
        optedInAt: number;
        showName: boolean;
        showLink: boolean;
        quote?: string | undefined;
    }>>;
    cancelRequestedAt: z.ZodOptional<z.ZodNumber>;
    cancelEffectiveAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "pending-onboarding" | "building" | "live";
    slug: string;
    plan: "starter" | "growth" | "enterprise";
    addedAt: number;
    agreementId?: string | undefined;
    name?: string | undefined;
    canonical?: string | undefined;
    airtableBaseId?: string | null | undefined;
    vercelProjectId?: string | null | undefined;
    retellAgentId?: string | null | undefined;
    sessionId?: string | undefined;
    signerEmail?: string | undefined;
    signerName?: string | undefined;
    onboardingCompletedAt?: number | null | undefined;
    stripeSubscriptionId?: string | undefined;
    stripeCustomerId?: string | undefined;
    agreementPdfUrl?: string | undefined;
    agreementVersion?: string | undefined;
    purchaseId?: string | undefined;
    featured?: {
        optedInAt: number;
        showName: boolean;
        showLink: boolean;
        quote?: string | undefined;
    } | undefined;
    cancelRequestedAt?: number | undefined;
    cancelEffectiveAt?: number | undefined;
}, {
    status: "pending-onboarding" | "building" | "live";
    slug: string;
    plan: "starter" | "growth" | "enterprise";
    addedAt: number;
    agreementId?: string | undefined;
    name?: string | undefined;
    canonical?: string | undefined;
    airtableBaseId?: string | null | undefined;
    vercelProjectId?: string | null | undefined;
    retellAgentId?: string | null | undefined;
    sessionId?: string | undefined;
    signerEmail?: string | undefined;
    signerName?: string | undefined;
    onboardingCompletedAt?: number | null | undefined;
    stripeSubscriptionId?: string | undefined;
    stripeCustomerId?: string | undefined;
    agreementPdfUrl?: string | undefined;
    agreementVersion?: string | undefined;
    purchaseId?: string | undefined;
    featured?: {
        optedInAt: number;
        showName: boolean;
        showLink: boolean;
        quote?: string | undefined;
    } | undefined;
    cancelRequestedAt?: number | undefined;
    cancelEffectiveAt?: number | undefined;
}>;
export declare const zPortalAccount: z.ZodObject<{
    email: z.ZodString;
    clerkUserId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    stripeCustomerId: z.ZodOptional<z.ZodString>;
    masterAgreement: z.ZodOptional<z.ZodObject<{
        agreementId: z.ZodNullable<z.ZodString>;
        version: z.ZodString;
        tierCeiling: z.ZodEnum<["starter", "growth", "enterprise"]>;
        signedAt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        agreementId: string | null;
        version: string;
        tierCeiling: "starter" | "growth" | "enterprise";
        signedAt: number;
    }, {
        agreementId: string | null;
        version: string;
        tierCeiling: "starter" | "growth" | "enterprise";
        signedAt: number;
    }>>;
    sites: z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        canonical: z.ZodOptional<z.ZodString>;
        plan: z.ZodEnum<["starter", "growth", "enterprise"]>;
        status: z.ZodEnum<["pending-onboarding", "building", "live"]>;
        airtableBaseId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        vercelProjectId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        retellAgentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        addedAt: z.ZodNumber;
        sessionId: z.ZodOptional<z.ZodString>;
        signerEmail: z.ZodOptional<z.ZodString>;
        signerName: z.ZodOptional<z.ZodString>;
        onboardingCompletedAt: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        stripeSubscriptionId: z.ZodOptional<z.ZodString>;
        stripeCustomerId: z.ZodOptional<z.ZodString>;
        agreementId: z.ZodOptional<z.ZodString>;
        agreementPdfUrl: z.ZodOptional<z.ZodString>;
        agreementVersion: z.ZodOptional<z.ZodString>;
        purchaseId: z.ZodOptional<z.ZodString>;
        featured: z.ZodOptional<z.ZodObject<{
            optedInAt: z.ZodNumber;
            quote: z.ZodOptional<z.ZodString>;
            showName: z.ZodBoolean;
            showLink: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            optedInAt: number;
            showName: boolean;
            showLink: boolean;
            quote?: string | undefined;
        }, {
            optedInAt: number;
            showName: boolean;
            showLink: boolean;
            quote?: string | undefined;
        }>>;
        cancelRequestedAt: z.ZodOptional<z.ZodNumber>;
        cancelEffectiveAt: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        status: "pending-onboarding" | "building" | "live";
        slug: string;
        plan: "starter" | "growth" | "enterprise";
        addedAt: number;
        agreementId?: string | undefined;
        name?: string | undefined;
        canonical?: string | undefined;
        airtableBaseId?: string | null | undefined;
        vercelProjectId?: string | null | undefined;
        retellAgentId?: string | null | undefined;
        sessionId?: string | undefined;
        signerEmail?: string | undefined;
        signerName?: string | undefined;
        onboardingCompletedAt?: number | null | undefined;
        stripeSubscriptionId?: string | undefined;
        stripeCustomerId?: string | undefined;
        agreementPdfUrl?: string | undefined;
        agreementVersion?: string | undefined;
        purchaseId?: string | undefined;
        featured?: {
            optedInAt: number;
            showName: boolean;
            showLink: boolean;
            quote?: string | undefined;
        } | undefined;
        cancelRequestedAt?: number | undefined;
        cancelEffectiveAt?: number | undefined;
    }, {
        status: "pending-onboarding" | "building" | "live";
        slug: string;
        plan: "starter" | "growth" | "enterprise";
        addedAt: number;
        agreementId?: string | undefined;
        name?: string | undefined;
        canonical?: string | undefined;
        airtableBaseId?: string | null | undefined;
        vercelProjectId?: string | null | undefined;
        retellAgentId?: string | null | undefined;
        sessionId?: string | undefined;
        signerEmail?: string | undefined;
        signerName?: string | undefined;
        onboardingCompletedAt?: number | null | undefined;
        stripeSubscriptionId?: string | undefined;
        stripeCustomerId?: string | undefined;
        agreementPdfUrl?: string | undefined;
        agreementVersion?: string | undefined;
        purchaseId?: string | undefined;
        featured?: {
            optedInAt: number;
            showName: boolean;
            showLink: boolean;
            quote?: string | undefined;
        } | undefined;
        cancelRequestedAt?: number | undefined;
        cancelEffectiveAt?: number | undefined;
    }>, "many">;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    profile: z.ZodOptional<z.ZodObject<{
        contactName: z.ZodOptional<z.ZodString>;
        contactPhone: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        updatedAt: number;
        contactName?: string | undefined;
        contactPhone?: string | undefined;
    }, {
        updatedAt: number;
        contactName?: string | undefined;
        contactPhone?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    sites: {
        status: "pending-onboarding" | "building" | "live";
        slug: string;
        plan: "starter" | "growth" | "enterprise";
        addedAt: number;
        agreementId?: string | undefined;
        name?: string | undefined;
        canonical?: string | undefined;
        airtableBaseId?: string | null | undefined;
        vercelProjectId?: string | null | undefined;
        retellAgentId?: string | null | undefined;
        sessionId?: string | undefined;
        signerEmail?: string | undefined;
        signerName?: string | undefined;
        onboardingCompletedAt?: number | null | undefined;
        stripeSubscriptionId?: string | undefined;
        stripeCustomerId?: string | undefined;
        agreementPdfUrl?: string | undefined;
        agreementVersion?: string | undefined;
        purchaseId?: string | undefined;
        featured?: {
            optedInAt: number;
            showName: boolean;
            showLink: boolean;
            quote?: string | undefined;
        } | undefined;
        cancelRequestedAt?: number | undefined;
        cancelEffectiveAt?: number | undefined;
    }[];
    createdAt: number;
    updatedAt: number;
    stripeCustomerId?: string | undefined;
    clerkUserId?: string | null | undefined;
    masterAgreement?: {
        agreementId: string | null;
        version: string;
        tierCeiling: "starter" | "growth" | "enterprise";
        signedAt: number;
    } | undefined;
    profile?: {
        updatedAt: number;
        contactName?: string | undefined;
        contactPhone?: string | undefined;
    } | undefined;
}, {
    email: string;
    sites: {
        status: "pending-onboarding" | "building" | "live";
        slug: string;
        plan: "starter" | "growth" | "enterprise";
        addedAt: number;
        agreementId?: string | undefined;
        name?: string | undefined;
        canonical?: string | undefined;
        airtableBaseId?: string | null | undefined;
        vercelProjectId?: string | null | undefined;
        retellAgentId?: string | null | undefined;
        sessionId?: string | undefined;
        signerEmail?: string | undefined;
        signerName?: string | undefined;
        onboardingCompletedAt?: number | null | undefined;
        stripeSubscriptionId?: string | undefined;
        stripeCustomerId?: string | undefined;
        agreementPdfUrl?: string | undefined;
        agreementVersion?: string | undefined;
        purchaseId?: string | undefined;
        featured?: {
            optedInAt: number;
            showName: boolean;
            showLink: boolean;
            quote?: string | undefined;
        } | undefined;
        cancelRequestedAt?: number | undefined;
        cancelEffectiveAt?: number | undefined;
    }[];
    createdAt: number;
    updatedAt: number;
    stripeCustomerId?: string | undefined;
    clerkUserId?: string | null | undefined;
    masterAgreement?: {
        agreementId: string | null;
        version: string;
        tierCeiling: "starter" | "growth" | "enterprise";
        signedAt: number;
    } | undefined;
    profile?: {
        updatedAt: number;
        contactName?: string | undefined;
        contactPhone?: string | undefined;
    } | undefined;
}>;
export declare const ACCOUNT_KEY_PREFIX = "jdd:account:";
export declare const ACCOUNT_BY_USER_KEY_PREFIX = "jdd:account-by-user:";
/**
 * Trim + lowercase only. Deliberately NOT Gmail dot/plus-alias folding — that would
 * silently merge genuinely different accounts, which is worse than missing a match.
 */
export declare function normalizeEmail(email: string): string;
export declare function accountKey(email: string): string;
export declare function accountByUserKey(clerkUserId: string): string;
/** An empty account for a brand-new email. */
export declare function createAccount(email: string, now?: number): PortalAccount;
/**
 * Add a site, or update it in place when the slug already exists — **always preserving
 * every other site**. This is the invariant that makes provisioning/repairing one site
 * safe for a multi-site account.
 *
 * Updates merge only *defined* fields, so a partial upsert (e.g. onboard.js supplying
 * airtableBaseId later) never blanks values set earlier. `addedAt` is preserved on update.
 * On insert, `plan` defaults to "starter" and `status` to "building".
 */
export declare function upsertSite(account: PortalAccount, site: PortalSiteInput, now?: number): PortalAccount;
/** Whether a site's wizard has been submitted (payment captured + form filled). */
export declare function isSiteOnboarded(site: PortalSite): boolean;
/**
 * Locate and update a pending site by sessionId, merging only defined fields.
 * Used by the portal submission route to convert a `pending-onboarding` site into
 * `building` and fill in the real slug/name from the wizard. Falls back to
 * slug-based upsert when no site has that sessionId (handles the old flow).
 */
export declare function upsertSiteBySessionId(account: PortalAccount, sessionId: string, updates: PortalSiteInput, now?: number): PortalAccount;
/** Remove a site by slug, preserving the rest. */
export declare function removeSite(account: PortalAccount, slug: string, now?: number): PortalAccount;
/**
 * Pick the site a request is scoped to: the `?site=` slug when it matches, else the
 * primary (first) site. Null only when the account has no sites at all.
 */
export declare function resolveSite(account: PortalAccount, siteParam?: string | null): PortalSite | null;
/** The old Clerk `publicMetadata` shape we're migrating away from. */
export interface LegacyPortalMetadata {
    slug?: string;
    name?: string;
    plan?: PortalPlan;
    status?: PortalSiteStatus;
    canonical?: string;
    airtableBaseId?: string | null;
    vercelProjectId?: string | null;
    sites?: Array<{
        slug: string;
        name?: string;
        canonical?: string;
        plan?: PortalPlan;
        status?: PortalSiteStatus;
        airtableBaseId?: string | null;
        vercelProjectId?: string | null;
    }>;
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
export declare function accountFromLegacyMetadata(email: string, meta: LegacyPortalMetadata | null | undefined, now?: number): PortalAccount | null;
/**
 * One site as its *writer* knows it, before the account-level rules are applied.
 *
 * Deliberately looser than PortalSite: `undefined` and `null` mean different things here.
 * `undefined` = "I could not resolve this, preserve whatever is stored"; `null` = "I looked
 * and there is nothing". That distinction is load-bearing for the console, which is not
 * Vercel-credentialed and must not blank a `vercelProjectId` onboard.js resolved earlier.
 */
export interface PortalEntrySource {
    slug: string;
    name?: string;
    /** From the site's `seo.canonical`. Empty/whitespace counts as absent. */
    canonical?: string | null;
    /** The site's own base. Enterprise sites leave this unset and inherit the shared one. */
    airtableBaseId?: string | null;
    /** Omit to preserve the stored value; `null` means "resolved, not found". */
    vercelProjectId?: string | null;
    /** The site's Retell agent. Omit to preserve the stored value. */
    retellAgentId?: string | null;
    /** Resolved `.vercel.app` host, used only when `canonical` is absent. Never a guess. */
    fallbackCanonical?: string | null;
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
export declare function buildPortalSiteEntries(input: {
    plan: PortalPlan;
    status: PortalSiteStatus;
    sharedAirtableBaseId?: string | null;
    sites: PortalEntrySource[];
}): PortalSiteInput[];
/** A portal feature whose availability depends on the client's lifecycle stage. */
export type PortalFeature = "calls" | "traffic" | "performance";
/**
 * *Why* a feature is or isn't usable — not just whether it is.
 *
 * This replaced a pair of booleans (`siteHasCallData` / `siteHasTraffic`) that collapsed
 * three unrelated situations into one `false`. The portal rendered that single `false`
 * with the tooltip "Not available on this site's plan", which told Growth clients whose
 * sites were still being built that they hadn't paid for a feature they had. Callers need
 * the reason, so the reason is the return value.
 */
export type FeatureAvailability = 
/** Wired up and safe to query. */
{
    state: "ready";
}
/** The plan genuinely excludes it. No amount of provisioning will turn it on. */
 | {
    state: "not-on-plan";
}
/** The site isn't provisioned yet, so there is nothing to connect to. */
 | {
    state: "pending-build";
}
/** The site is live but we haven't finished wiring this up. Our drift, not the client's. */
 | {
    state: "connecting";
};
/**
 * Resolve one feature for one site.
 *
 * The order is load-bearing and deliberately **plan → build status → connection → ready**.
 * Plan exclusion outranks build status so a Starter site mid-build hears the truth about
 * its plan rather than a promise of call data it will never receive.
 */
export declare function siteFeature(site: PortalSite, feature: PortalFeature): FeatureAvailability;
/** Every feature for one site, for callers that need the whole picture at once. */
export declare function siteFeatures(site: PortalSite): Record<PortalFeature, FeatureAvailability>;
//# sourceMappingURL=account.d.ts.map