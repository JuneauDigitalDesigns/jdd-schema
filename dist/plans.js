/**
 * The plan ids, their display names and their order: the one copy every repo reads.
 *
 * v1.45.0 (decided 2026-11-24). A website-only plan became a product of its own, with its own
 * price, so it needed its own id. The id `starter` kept its meaning ("with the receptionist"),
 * because every stored record, Stripe subscription and agreement that says `starter` already
 * means that. What changed is its display name:
 *
 *   | id           | shown as                    | short form     |
 *   | ------------ | --------------------------- | -------------- |
 *   | `website`    | Starter                     | Starter        |
 *   | `starter`    | Starter + AI Receptionist   | Starter + AI   |
 *   | `growth`     | Growth                      | Growth         |
 *   | `enterprise` | Enterprise                  | Enterprise     |
 *
 * So the id `starter` is no longer displayed as "Starter". **No UI may build a plan name from
 * the id.** Read `PLAN_LABELS`. The short form is for tight chips only.
 *
 * This module imports nothing, so `agreement.ts` can use these values at module load without
 * a cycle through `account.ts`.
 */
/** Every plan id, cheapest first. */
export const PLAN_IDS = ["website", "starter", "growth", "enterprise"];
export const PLAN_LABELS = {
    website: { name: "Starter", short: "Starter" },
    starter: { name: "Starter + AI Receptionist", short: "Starter + AI" },
    growth: { name: "Growth", short: "Growth" },
    enterprise: { name: "Enterprise", short: "Enterprise" },
};
/**
 * The plans in order. A higher rank is a higher plan, so moving up the rank is an upgrade.
 *
 * One shared map. It replaced two copies that had already diverged in shape: the schema's
 * `TIER_RANK` in agreement.ts and the agency's `PLAN_RANK` in billing-periods.mjs.
 */
export const PLAN_RANK = {
    website: 0,
    starter: 1,
    growth: 2,
    enterprise: 3,
};
/**
 * Does this plan include the AI receptionist?
 *
 * Written as an explicit list, so a value this version does not know reads as "no
 * receptionist" rather than buying a number for it. This is the plan's answer only. A site on
 * the legacy shape (`starter` with mode `declined`) has no receptionist either: ask
 * `isWebOnly(site)` when you hold a site.
 */
export function planHasReceptionist(plan) {
    return plan === "starter" || plan === "growth" || plan === "enterprise";
}
//# sourceMappingURL=plans.js.map