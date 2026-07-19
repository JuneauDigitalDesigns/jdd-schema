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

export type PortalPlan = "starter" | "growth" | "enterprise";
export type PortalSiteStatus = "building" | "live";

/** One site belonging to an account. */
export interface PortalSite {
  slug: string;
  name?: string;
  canonical?: string;
  plan: PortalPlan;
  /** "building" = onboarded, not provisioned yet; "live" = provisioned. */
  status: PortalSiteStatus;
  airtableBaseId?: string | null;
  vercelProjectId?: string | null;
  addedAt: number; // epoch ms
}

/** Everything needed to add or update a site; only `slug` is required. */
export type PortalSiteInput = Partial<PortalSite> & { slug: string };

export interface PortalAccount {
  /** Normalized (trimmed + lowercased) email — the record key. */
  email: string;
  /** Linked on the client's first authenticated portal load. */
  clerkUserId?: string | null;
  sites: PortalSite[];
  createdAt: number;
  updatedAt: number;
}

export const zPortalSite = z.object({
  slug: z.string().min(1),
  name: z.string().optional(),
  canonical: z.string().optional(),
  plan: z.enum(["starter", "growth", "enterprise"]),
  status: z.enum(["building", "live"]),
  airtableBaseId: z.string().nullable().optional(),
  vercelProjectId: z.string().nullable().optional(),
  addedAt: z.number(),
});

export const zPortalAccount = z.object({
  email: z.string().min(1),
  clerkUserId: z.string().nullable().optional(),
  sites: z.array(zPortalSite),
  createdAt: z.number(),
  updatedAt: z.number(),
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

// ── Derived view helpers (shared by the portal UI + API routes) ─────────────

/** Whether a site's plan + provisioning make the Call Log tab meaningful. */
export function siteHasCallData(site: PortalSite): boolean {
  return site.plan !== "starter" && Boolean(site.airtableBaseId);
}

/** Whether a site has Vercel Web Analytics wired up. */
export function siteHasTraffic(site: PortalSite): boolean {
  return Boolean(site.vercelProjectId);
}
