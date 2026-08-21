/**
 * What may this account buy next?
 *
 * One definition, shared by every layer that can start or refuse a purchase: the `/start`
 * gate, the Enterprise upsell, and the in-portal "upgrade this site" CTA. They were going to
 * grow three copies of the same arithmetic, and the copies would have disagreed — the same
 * failure `upgradeBlockReason` in the agency app was written to prevent.
 *
 * Follows that function's shape deliberately: return the *reason* rather than a boolean, so
 * each caller can word its own refusal, and so "why can't I buy this" is answerable without
 * re-deriving anything.
 *
 * The rules:
 *   - **Starter** — unlimited. Cheap to build and run; more of them is good news.
 *   - **Growth** — at most two per account. A third is the moment Enterprise becomes the
 *     better deal for both sides, so it is refused and upsold rather than sold.
 *   - **Enterprise** — the ceiling. One bundle per account, covering `enterpriseSites` sites.
 *     A client who needs more is a conversation, not a code path.
 *
 * Enterprise and Starter coexist: an Enterprise client adding a cheap starter site is a
 * perfectly good outcome and is not blocked.
 *
 * Everything here is pure and synchronous, so it can gate a server render without a network
 * round trip.
 */

import type { PortalAccount, PortalPlan, PortalSite } from "./account.js";

/**
 * Account-level purchase limits.
 *
 * Deliberately injected rather than hardcoded. `enterpriseSites` mirrors Schedule A's
 * `maxSites`, which lives in the agency app's legal module — the source of truth is the
 * contract the client signs, and a second copy of "3" in this package would be free to drift
 * from it. `growthSitesPerAccount` has no such home: it is a commercial rule about accounts,
 * not a term of any single agreement, so it lives here and only here.
 */
export interface PlanLimits {
  /** Growth sites one account may hold before Enterprise is the only way up. */
  growthSitesPerAccount: number;
  /** Sites covered by one Enterprise agreement. Mirror of Schedule A's `maxSites`. */
  enterpriseSites: number;
}

export const DEFAULT_PLAN_LIMITS: PlanLimits = {
  growthSitesPerAccount: 2,
  enterpriseSites: 3,
};

export type AddPlanBlock =
  /** Already at the Growth ceiling — the caller should render the Enterprise upsell. */
  | "growth-cap-reached"
  /** Already on Enterprise, which is the top of the self-serve ladder. */
  | "enterprise-cap-reached";

/**
 * Does this site still occupy a slot?
 *
 * A cancellation that has not taken effect yet still counts: the client is still being billed
 * and the site is still serving, so letting them buy a replacement now would put them over
 * the cap for the remainder of the notice period (60 days on Enterprise). Once
 * `cancelEffectiveAt` has passed, the slot is free.
 */
export function isActiveSite(site: PortalSite, now: number = Date.now()): boolean {
  return !(typeof site.cancelEffectiveAt === "number" && site.cancelEffectiveAt <= now);
}

/** Active sites on this account currently held at `plan`. */
export function countActiveSites(
  account: PortalAccount,
  plan: PortalPlan,
  now: number = Date.now(),
): number {
  return account.sites.filter((s) => s.plan === plan && isActiveSite(s, now)).length;
}

/**
 * May this account buy another site at `plan` right now? Null means yes.
 *
 * Note what is deliberately *not* considered: whether existing sites are live, building or
 * still pending their wizard. Buying is a billing decision and provisioning is a separate
 * track — a client mid-build who wants a second site should not have to wait for the first
 * one to finish to give us more money.
 */
export function canAddPlan(
  account: PortalAccount,
  plan: PortalPlan,
  limits: PlanLimits = DEFAULT_PLAN_LIMITS,
  now: number = Date.now(),
): AddPlanBlock | null {
  if (plan === "starter") return null;

  if (plan === "growth") {
    return countActiveSites(account, "growth", now) >= limits.growthSitesPerAccount
      ? "growth-cap-reached"
      : null;
  }

  // Enterprise. One bundle per account: a client who already has one and wants more sites
  // inside it, or a second bundle, is past what self-serve should decide.
  return countActiveSites(account, "enterprise", now) > 0 ? "enterprise-cap-reached" : null;
}

/**
 * The Growth sites that a move to Enterprise would absorb.
 *
 * Consolidation cancels these and reopens them under one Enterprise subscription, so this is
 * both the list the upsell names back to the client and the list the consolidation routine
 * iterates. One function so the page and the billing change cannot disagree about which sites
 * are involved — which is the kind of mismatch that cancels a subscription nobody meant to
 * touch.
 */
export function growthSitesForConsolidation(
  account: PortalAccount,
  now: number = Date.now(),
): PortalSite[] {
  return account.sites.filter((s) => s.plan === "growth" && isActiveSite(s, now));
}

/**
 * Slots left inside an existing Enterprise bundle.
 *
 * Distinct from `canAddPlan("enterprise")`, which answers "may they *buy* Enterprise". This
 * answers "may another site be added under the Enterprise agreement they already hold", which
 * is what the portal needs once they are on it.
 */
export function enterpriseSlotsRemaining(
  account: PortalAccount,
  limits: PlanLimits = DEFAULT_PLAN_LIMITS,
  now: number = Date.now(),
): number {
  return Math.max(0, limits.enterpriseSites - countActiveSites(account, "enterprise", now));
}

/**
 * A slug for a new site that no other site on the account already holds.
 *
 * The wizard derives the slug from whatever brand name the client typed, and nothing checked
 * it: two sites under one account could end up with the same slug, after which `resolveSite`
 * and `upsertSite` — both slug-keyed — silently operate on whichever came first. Suffixes
 * rather than rejects, because the client is mid-wizard and a naming collision is not their
 * problem to solve.
 *
 * Scoped to the account. Global uniqueness across every client is enforced at provisioning,
 * where the folder and the Vercel project are actually created.
 */
export function uniqueSlug(base: string, account: PortalAccount, exceptSlug?: string): string {
  const taken = new Set(
    account.sites.map((s) => s.slug).filter((s) => s !== exceptSlug),
  );
  if (!taken.has(base)) return base;

  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
