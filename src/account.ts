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
import { zMasterAgreementRef, type MasterAgreementRef } from "./agreement.js";

export type PortalPlan = "starter" | "growth" | "enterprise";
export type PortalSiteStatus = "pending-onboarding" | "building" | "live";

/**
 * How the client activated, or refused, the AI receptionist.
 *
 * Captured as an explicit step in onboarding rather than inferred, because the receptionist
 * only answers once the business line actually points at the JDD number, and "nobody
 * forwarded the line" and "the client declined a receptionist" are different facts with
 * different remedies. The first is a nudge; the second is a web-only client who must never be
 * billed for minutes or promised a call log.
 *
 * `declined` is the web-only variant. It is deliberately **not** a fourth `PortalPlan`: the
 * price is identical to Starter, so it is a property of a Starter site rather than a product
 * of its own, and widening the plan union would ripple into every exhaustive switch,
 * `canAddPlan`, `meteringGroups` and the account record.
 */
export type ReceptionistMode = "forwarded" | "published" | "declined";

/**
 * A2P 10DLC registration progress for one site.
 *
 * Linear except for `failed`, which is reachable from any pending state and needs a human.
 * `not-applicable` is terminal for tiers that never register — see `PortalSite.a2pStatus`.
 */
export type A2pStatus =
  | "not-applicable"
  | "none"
  | "profile-pending"
  | "profile-approved"
  | "brand-pending"
  | "brand-approved"
  | "campaign-pending"
  | "verified"
  | "failed";

export const A2P_STATUSES = [
  "not-applicable",
  "none",
  "profile-pending",
  "profile-approved",
  "brand-pending",
  "brand-approved",
  "campaign-pending",
  "verified",
  "failed",
] as const satisfies ReadonlyArray<A2pStatus>;

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
   * provisioning; absent only on web-only sites, which have no agent.
   *
   * Every plan tier includes a receptionist as of the 2026-10-12 reprice, so an absent agent
   * on a non-web-only site is drift to investigate, not an expected state for a tier.
   *
   * This is the join key between an account and its call records. Retell is the
   * authoritative source for usage — the Airtable call log is lossy (it depends on a
   * post-call automation that can silently miss rows), so minute accounting reads
   * Retell directly and needs the agent id here rather than in a client-local
   * `.env.local` the portal cannot see.
   */
  retellAgentId?: string | null;
  /**
   * The activation choice from onboarding. Undefined on records that predate the step;
   * treat undefined as "not yet asked", **never** as "declined" — defaulting to declined
   * would silently strip a paid-for receptionist from every pre-feature client.
   */
  receptionistMode?: ReceptionistMode;
  /** Epoch ms the choice was recorded. */
  receptionistChoiceAt?: number;
  addedAt: number; // epoch ms
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
  /**
   * The business's Google review link, used by the portal's review-request SMS.
   *
   * Admin-managed — set at onboarding or via the console's manage route, never editable in the
   * client portal — so the link a client's customers receive is one we vetted. The portal reads
   * it read-only to compose the review text; when it's absent the composer tells the client to
   * contact us rather than offering an edit field.
   */
  googleReviewUrl?: string;
  /**
   * The client's provisioned Twilio number, E.164. Written by onboard.js at provisioning.
   *
   * The portal needs it to send customer-facing SMS *from the client's own number*; it cannot
   * read `clients/{slug}/.env.local`, so the value has to live here too.
   */
  twilioNumber?: string | null;
  /**
   * The client's **own** Messaging Service, carrying their `CUSTOMER_CARE` campaign.
   *
   * Deliberately not named `TWILIO_MESSAGING_SERVICE_SID`: that env var stays JDD's shared
   * Account-lane service (owner alerts). Mixing the two would let environment resolution order
   * decide which campaign a message sends under — a silent compliance bug that only surfaces as
   * carrier filtering weeks later. Mirrors `CLIENT_MESSAGING_SERVICE_SID` in the client env.
   */
  messagingServiceSid?: string | null;
  /**
   * Where this client is in A2P 10DLC registration.
   *
   * `not-applicable` is a real terminal state, not a null: Starter and web-only never register
   * because they send no customer-facing messages. Without it they sit in `none` forever and any
   * "is registration done?" check reads them as perpetually pending — the same trap as
   * `receptionistMode` being absent versus explicitly `declined`. State it, never infer it.
   *
   * Written by the A2P workstream (onboard.js advances it, the poller updates it). The portal
   * only reads it, to gate customer-facing messaging and to render the ~3-week wait as progress.
   */
  a2pStatus?: A2pStatus;
  /** Epoch ms when the client submitted a cancellation request. */
  cancelRequestedAt?: number;
  /** Epoch ms of the first billing boundary ≥ now + notice period — the Stripe cancel_at. */
  cancelEffectiveAt?: number;
}

/** Everything needed to add or update a site; only `slug` is required. */
export type PortalSiteInput = Partial<PortalSite> & { slug: string };

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

export const zPortalSite = z.object({
  slug: z.string().min(1),
  name: z.string().optional(),
  canonical: z.string().optional(),
  plan: z.enum(["starter", "growth", "enterprise"]),
  status: z.enum(["pending-onboarding", "building", "live"]),
  airtableBaseId: z.string().nullable().optional(),
  vercelProjectId: z.string().nullable().optional(),
  retellAgentId: z.string().nullable().optional(),
  receptionistMode: z.enum(["forwarded", "published", "declined"]).optional(),
  receptionistChoiceAt: z.number().optional(),
  addedAt: z.number(),
  sessionId: z.string().optional(),
  signerEmail: z.string().optional(),
  signerName: z.string().optional(),
  onboardingCompletedAt: z.number().nullable().optional(),
  stripeSubscriptionId: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  agreementId: z.string().optional(),
  agreementPdfUrl: z.string().optional(),
  agreementVersion: z.string().optional(),
  purchaseId: z.string().optional(),
  featured: z.object({
    optedInAt: z.number(),
    quote: z.string().optional(),
    showName: z.boolean(),
    showLink: z.boolean(),
  }).optional(),
  googleReviewUrl: z.string().optional(),
  twilioNumber: z.string().nullable().optional(),
  messagingServiceSid: z.string().nullable().optional(),
  a2pStatus: z.enum(A2P_STATUSES).optional(),
  cancelRequestedAt: z.number().optional(),
  cancelEffectiveAt: z.number().optional(),
});

export const zPortalAccount = z.object({
  email: z.string().min(1),
  clerkUserId: z.string().nullable().optional(),
  stripeCustomerId: z.string().optional(),
  masterAgreement: zMasterAgreementRef.optional(),
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
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function accountKey(email: string): string {
  return `${ACCOUNT_KEY_PREFIX}${normalizeEmail(email)}`;
}

export function accountByUserKey(clerkUserId: string): string {
  return `${ACCOUNT_BY_USER_KEY_PREFIX}${clerkUserId}`;
}

// ── Pure operations ─────────────────────────────────────────────────────────

/** An empty account for a brand-new email. */
export function createAccount(email: string, now: number = Date.now()): PortalAccount {
  return {
    email: normalizeEmail(email),
    clerkUserId: null,
    sites: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** Copy of `o` with `undefined` values dropped, so a partial update never blanks a field. */
function definedOnly<T extends object>(o: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined) (out as Record<string, unknown>)[k] = v;
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
export function upsertSite(
  account: PortalAccount,
  site: PortalSiteInput,
  now: number = Date.now(),
): PortalAccount {
  const idx = account.sites.findIndex((s) => s.slug === site.slug);

  let sites: PortalSite[];
  if (idx === -1) {
    const created: PortalSite = {
      plan: "starter",
      status: "building",
      ...definedOnly(site),
      slug: site.slug,
      addedAt: site.addedAt ?? now,
    } as PortalSite;
    sites = [...account.sites, created];
  } else {
    sites = account.sites.map((s, i) =>
      i === idx ? ({ ...s, ...definedOnly(site), addedAt: s.addedAt } as PortalSite) : s,
    );
  }

  return { ...account, sites, updatedAt: now };
}

/**
 * A web-only site: Starter, with the receptionist explicitly refused.
 *
 * One predicate, because three separate places need this answer and a fourth copy of
 * `plan === "starter" && mode === "declined"` would eventually disagree: feature gating,
 * minute metering, and provisioning. Undefined mode is **not** web-only, so a client who has
 * not reached the activation step yet keeps the full entitlement they paid for.
 */
export function isWebOnly(site: PortalSite): boolean {
  return site.plan === "starter" && site.receptionistMode === "declined";
}

/** Whether a site's wizard has been submitted (payment captured + form filled). */
export function isSiteOnboarded(site: PortalSite): boolean {
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
export function upsertSiteBySessionId(
  account: PortalAccount,
  sessionId: string,
  updates: PortalSiteInput,
  now: number = Date.now(),
): PortalAccount {
  const idx = account.sites.findIndex((s) => s.sessionId === sessionId);
  if (idx === -1) {
    return upsertSite(account, updates, now);
  }
  const existing = account.sites[idx];
  const merged: PortalSite = {
    ...existing,
    ...definedOnly(updates),
    addedAt: existing.addedAt,
  } as PortalSite;
  const sites = [
    ...account.sites.slice(0, idx),
    merged,
    ...account.sites.slice(idx + 1),
  ];
  return { ...account, sites, updatedAt: now };
}

/** Remove a site by slug, preserving the rest. */
export function removeSite(
  account: PortalAccount,
  slug: string,
  now: number = Date.now(),
): PortalAccount {
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
export function resolveSite(
  account: PortalAccount,
  siteParam?: string | null,
): PortalSite | null {
  if (account.sites.length === 0) return null;
  if (siteParam) {
    const match = account.sites.find((s) => s.slug === siteParam);
    if (match) return match;
  }
  return account.sites[0] ?? null;
}

// ── Legacy migration ────────────────────────────────────────────────────────

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
export function accountFromLegacyMetadata(
  email: string,
  meta: LegacyPortalMetadata | null | undefined,
  now: number = Date.now(),
): PortalAccount | null {
  if (!meta) return null;

  const account = createAccount(email, now);
  const accountPlan: PortalPlan = meta.plan ?? "starter";
  const accountStatus: PortalSiteStatus = meta.status ?? "live";

  if (meta.sites && meta.sites.length > 0) {
    const sites: PortalSite[] = meta.sites.map((s) => ({
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

  if (!meta.slug) return null;

  const single: PortalSite = {
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

// ── Entry building (shared by every writer) ─────────────────────────────────

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
  /**
   * Whether this client refused the receptionist. **Required: state it, never infer it.**
   *
   * Not optional on purpose. An optional flag with a `false` default is exactly the inference
   * this is meant to prevent, and the wrong value costs money in both directions: `false` on a
   * web-only site preserves an agent id that should not exist, and `true` on a real Starter
   * site blanks an agent that was paid for and provisioned. Both writers (onboard.js and the
   * console repair tool) know the answer, so both must say it.
   *
   * This was previously derived from `plan === "starter"`, which was correct only while
   * Starter had no receptionist. After the 2026-10-12 reprice every tier has one, so deriving
   * it from the plan would wipe a Starter agent on every console repair.
   */
  receptionistDeclined: boolean;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
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
 *  - **Airtable base** — web-only sites get an explicit `null` (call data cannot exist for
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
export function buildPortalSiteEntries(input: {
  plan: PortalPlan;
  status: PortalSiteStatus;
  sharedAirtableBaseId?: string | null;
  sites: PortalEntrySource[];
}): PortalSiteInput[] {
  const { plan, status, sharedAirtableBaseId = null, sites } = input;

  return sites.map((s) => {
    const entry: PortalSiteInput = { slug: s.slug, plan, status };

    if (s.name !== undefined) entry.name = s.name;

    const canonical = firstNonEmpty(s.canonical, s.fallbackCanonical);
    if (canonical !== undefined) entry.canonical = canonical;

    if (s.receptionistDeclined) {
      // A web-only site genuinely has no call data — assert that, don't preserve a stale base.
      entry.airtableBaseId = null;
      // Same reasoning: a web-only site has no voice agent at all, so assert the absence
      // rather than preserving an id left over from a downgrade or an earlier choice.
      entry.retellAgentId = null;
      entry.receptionistMode = "declined";
    } else {
      const resolved = s.airtableBaseId ?? sharedAirtableBaseId;
      // Omit when unresolved so `upsertSite` preserves whatever is already stored.
      if (resolved !== undefined && resolved !== null) entry.airtableBaseId = resolved;
      // Unlike the base, an agent is never shared between sites — each has its own.
      if (s.retellAgentId !== undefined && s.retellAgentId !== null) {
        entry.retellAgentId = s.retellAgentId;
      }
    }

    if (s.vercelProjectId !== undefined) entry.vercelProjectId = s.vercelProjectId;

    return entry;
  });
}

// ── Feature availability (shared by the portal UI + API routes + ops tooling) ─

/** A portal feature whose availability depends on the client's lifecycle stage. */
export type PortalFeature =
  | "calls"
  | "traffic"
  | "performance"
  /** The Inbox — raw inbound (calls + web-form leads). Every tier, including web-only. */
  | "leads"
  /** The customer CRM. Growth and Enterprise only. */
  | "crm"
  /** Customer-facing SMS. Needs `crm` *and* a verified A2P campaign. */
  | "messaging";

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
  | { state: "ready" }
  /** The plan genuinely excludes it. No amount of provisioning will turn it on. */
  | { state: "not-on-plan" }
  /** The site isn't provisioned yet, so there is nothing to connect to. */
  | { state: "pending-build" }
  /** The site is live but we haven't finished wiring this up. Our drift, not the client's. */
  | { state: "connecting" };

/**
 * Which stored id each feature needs before it can be queried.
 *
 * **Partial on purpose.** `leads` and `crm` have no required id: the Inbox reads web-form leads
 * from KV (web-only sites have no Airtable base and never will), and the CRM holds those same
 * leads alongside calls. Inventing a requirement to satisfy a total `Record` is exactly how
 * `calls` ended up gated on an Airtable id. A missing entry means "nothing to connect" and the
 * check at step 3 is skipped.
 */
const FEATURE_REQUIREMENT: Partial<Record<PortalFeature, keyof PortalSite>> = {
  calls: "airtableBaseId",
  traffic: "vercelProjectId",
  // PageSpeed measures a URL; without a canonical there is nothing to score.
  performance: "canonical",
};

/** Tiers that include the customer CRM and customer-facing messaging. */
function hasCrmPlan(site: PortalSite): boolean {
  return site.plan === "growth" || site.plan === "enterprise";
}

/**
 * Resolve one feature for one site.
 *
 * The order is load-bearing and deliberately **entitlement → build status → connection →
 * ready**. Entitlement exclusion outranks build status so a web-only site mid-build hears the
 * truth about what it bought rather than a promise of call data it will never receive.
 */
export function siteFeature(site: PortalSite, feature: PortalFeature): FeatureAvailability {
  // 1. Entitlement. Every tier now includes the receptionist, so the plan alone no longer
  // decides this: only a client who refused one has no call data, and never will.
  if (feature === "calls" && isWebOnly(site)) return { state: "not-on-plan" };

  // The CRM and customer messaging are the one genuine tier split. Deliberately NOT gated on
  // `airtableBaseId`: the CRM holds web-form leads too, so a live Growth site whose call base
  // isn't wired yet would otherwise hide a board the client can already use.
  if ((feature === "crm" || feature === "messaging") && !hasCrmPlan(site)) {
    return { state: "not-on-plan" };
  }

  // 2. Build status. Nothing is connectable before the site is provisioned.
  if (site.status !== "live") return { state: "pending-build" };

  // 3. Customer-facing SMS additionally waits on the client's own A2P campaign — 13–20 business
  // days. `failed` maps to `connecting` rather than a new state: every consumer switches
  // exhaustively on the four, and a registration failure is an operator problem surfaced in the
  // console, not something the client can act on.
  if (feature === "messaging" && site.a2pStatus !== "verified") {
    return { state: "connecting" };
  }

  // 4. Connection. Live, but the id this feature needs was never recorded. Features with no
  // requirement (leads, crm) skip this entirely — see FEATURE_REQUIREMENT.
  const requiredKey = FEATURE_REQUIREMENT[feature];
  if (requiredKey) {
    const required = site[requiredKey];
    if (typeof required !== "string" || !required.trim()) return { state: "connecting" };
  }

  return { state: "ready" };
}

/** Every feature for one site, for callers that need the whole picture at once. */
export function siteFeatures(site: PortalSite): Record<PortalFeature, FeatureAvailability> {
  return {
    calls: siteFeature(site, "calls"),
    traffic: siteFeature(site, "traffic"),
    performance: siteFeature(site, "performance"),
    leads: siteFeature(site, "leads"),
    crm: siteFeature(site, "crm"),
    messaging: siteFeature(site, "messaging"),
  };
}
