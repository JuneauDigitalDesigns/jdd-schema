/**
 * Which minutes belong to whom.
 *
 * **Starter and Growth minutes are per site. Enterprise minutes are pooled.** That one
 * distinction is what this module exists to encode, and getting it wrong costs real money in
 * both directions:
 *
 *   - Starter and Growth are each sold as one receptionist for one business, with 100 and 350
 *     included minutes respectively. Two such sites are two separate purchases with two
 *     separate allowances that never see each other: a quiet site cannot subsidise a busy one,
 *     and each overruns on its own.
 *   - Enterprise is sold as one bundle whose minutes are explicitly "pooled across all sites"
 *     (Schedule A), so every site in the bundle draws on a single allowance.
 *
 * Starter joined this module in the 2026-10-12 reprice, which gave every tier a receptionist.
 * Before that it had no agent and could not consume a minute, so it was not representable here.
 *
 * Both the billing cron and the portal usage tile run on these groups. They must never
 * disagree: a client shown one figure and invoiced another is a refund and a lost customer.
 *
 * Pure, so the arithmetic that decides invoices can be unit tested without Retell, Stripe or
 * Redis. Caps are injected rather than hardcoded — the source of truth for "how many minutes
 * does this plan include" is Schedule A of the agreement the client signed, which lives with
 * the terms in the agency app.
 */
import { isWebOnly } from "./account.js";
/**
 * Group ref for the pooled Enterprise allowance.
 *
 * A constant rather than a member slug because the pool outlives any one site: a site can
 * join or leave the bundle without the allowance moving, whereas a ref derived from
 * `sites[0].slug` would silently reset that period's warning and billing flags when the
 * membership changed — re-sending warnings, and re-invoicing an overage already charged.
 */
export const ENTERPRISE_GROUP_REF = "enterprise";
/**
 * The sites on an account whose minutes count against an allowance.
 *
 * A site still in `pending-onboarding` has no agent answering anything yet, so metering it
 * would bill a client for a receptionist they do not have. Everything else with a
 * provisioned agent counts, including `building` — the agent is live on the phone number
 * from the moment onboard.js creates it, whether or not the website has finished deploying.
 *
 * The plan check that used to live here is gone: every tier can consume minutes now, so the
 * tier tells you nothing. `isWebOnly` replaces it, and `Boolean(s.retellAgentId)` still
 * carries the "actually provisioned" requirement, which is what keeps the two externally
 * managed Starter sites (no agent, billed off-platform) out of minute accounting.
 */
export function voiceSitesOf(sites) {
    return sites.filter((s) => !isWebOnly(s) &&
        Boolean(s.retellAgentId) &&
        s.status !== "pending-onboarding");
}
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
 * Per-site groups come out in `sites` order so the result is stable across runs.
 */
export function meteringGroups(sites, caps) {
    const voice = voiceSitesOf(sites);
    const groups = [];
    // Starter and Growth both meter per site, each against its own cap. A zero cap means the
    // plan includes no minutes, which is not the same as "no allowance to track" — it would
    // bill every second as overage — so such a site is skipped rather than grouped at 0.
    for (const site of voice) {
        if (site.plan === "enterprise")
            continue;
        const cap = site.plan === "starter" ? caps.starter : caps.growth;
        if (!cap)
            continue;
        groups.push({ ref: site.slug, plan: site.plan, sites: [site], cap });
    }
    const enterprise = voice.filter((s) => s.plan === "enterprise");
    if (enterprise.length > 0 && caps.enterprise) {
        groups.push({
            ref: ENTERPRISE_GROUP_REF,
            plan: "enterprise",
            sites: enterprise,
            cap: caps.enterprise,
        });
    }
    return groups;
}
/** The allowance a given site draws on, or null when it has no voice agent. */
export function meteringGroupFor(sites, slug, caps) {
    return (meteringGroups(sites, caps).find((g) => g.sites.some((s) => s.slug === slug)) ?? null);
}
//# sourceMappingURL=metering.js.map