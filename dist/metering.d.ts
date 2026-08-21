/**
 * Which minutes belong to whom.
 *
 * **Growth minutes are per site. Enterprise minutes are pooled.** That one distinction is
 * what this module exists to encode, and getting it wrong costs real money in both
 * directions:
 *
 *   - Growth is sold as one receptionist for one business, with 350 included minutes. Two
 *     Growth sites are two separate purchases with two separate allowances that never see
 *     each other: a quiet site cannot subsidise a busy one, and each overruns on its own.
 *   - Enterprise is sold as one bundle whose minutes are explicitly "pooled across all sites"
 *     (Schedule A), so every site in the bundle draws on a single allowance.
 *
 * Both the billing cron and the portal usage tile run on these groups. They must never
 * disagree: a client shown one figure and invoiced another is a refund and a lost customer.
 *
 * Pure, so the arithmetic that decides invoices can be unit tested without Retell, Stripe or
 * Redis. Caps are injected rather than hardcoded — the source of truth for "how many minutes
 * does this plan include" is Schedule A of the agreement the client signed, which lives with
 * the terms in the agency app.
 */
import type { PortalSite } from "./account.js";
/** A site that can actually consume minutes. */
export type VoicePlan = "growth" | "enterprise";
/**
 * Group ref for the pooled Enterprise allowance.
 *
 * A constant rather than a member slug because the pool outlives any one site: a site can
 * join or leave the bundle without the allowance moving, whereas a ref derived from
 * `sites[0].slug` would silently reset that period's warning and billing flags when the
 * membership changed — re-sending warnings, and re-invoicing an overage already charged.
 */
export declare const ENTERPRISE_GROUP_REF = "enterprise";
/** Included minutes per plan, from Schedule A. */
export interface MinuteCaps {
    growth: number;
    enterprise: number;
}
/** One allowance: the sites that draw on it, and how many minutes it holds. */
export interface MeteringGroup {
    /**
     * Stable identifier for this allowance, used to scope cache and idempotency keys.
     * A Growth site's own slug, or `ENTERPRISE_GROUP_REF` for the pooled bundle.
     */
    ref: string;
    plan: VoicePlan;
    sites: PortalSite[];
    cap: number;
}
/**
 * The sites on an account whose minutes count against an allowance.
 *
 * A site still in `pending-onboarding` has no agent answering anything yet, so metering it
 * would bill a client for a receptionist they do not have. Everything else with a
 * provisioned agent counts, including `building` — the agent is live on the phone number
 * from the moment onboard.js creates it, whether or not the website has finished deploying.
 */
export declare function voiceSitesOf(sites: PortalSite[]): PortalSite[];
/**
 * Split an account's voice sites into the allowances they actually draw on.
 *
 * Everything upstream of this used to treat an account as having exactly one allowance,
 * derived from `voiceSites[0].plan`. For a client with two Growth sites that merged the two
 * pools *and* capped them at 350 between them — so they paid twice and received one
 * allowance, were metered against whichever subscription happened to be found first, and
 * collided on a single account-scoped idempotency key, which meant the second site's overage
 * was never invoiced at all.
 *
 * Growth groups come out in `sites` order so the result is stable across runs.
 */
export declare function meteringGroups(sites: PortalSite[], caps: MinuteCaps): MeteringGroup[];
/** The allowance a given site draws on, or null when it has no voice agent. */
export declare function meteringGroupFor(sites: PortalSite[], slug: string, caps: MinuteCaps): MeteringGroup | null;
//# sourceMappingURL=metering.d.ts.map