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
 */
export function voiceSitesOf(sites) {
    return sites.filter((s) => (s.plan === "growth" || s.plan === "enterprise") &&
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
 * Growth groups come out in `sites` order so the result is stable across runs.
 */
export function meteringGroups(sites, caps) {
    const voice = voiceSitesOf(sites);
    const groups = [];
    for (const site of voice) {
        if (site.plan !== "growth")
            continue;
        if (!caps.growth)
            continue;
        groups.push({ ref: site.slug, plan: "growth", sites: [site], cap: caps.growth });
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