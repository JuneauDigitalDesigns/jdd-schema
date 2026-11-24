/**
 * The intake envelope + the KV queue record that carries it between the agency
 * site (producer) and the jdd-ops console (consumer).
 */
/**
 * The lead-capture mode a plan's website forms use, and the ONLY place the mapping lives.
 *
 * `email`  — website and starter: the form collects an email, and /api/contact records the
 *            lead in the client's portal inbox (LEAD_DELIVERY_MODE=portal, LEAD_CALLBACK=off).
 *            No call is placed. "email" names the field the form collects, not the delivery:
 *            leads stopped going out by email when the portal inbox shipped.
 * `phone`  — growth / enterprise: the form collects a phone, the lead lands in the portal
 *            the same way, and the agent also dials the lead back (LEAD_CALLBACK=on).
 *
 * Callbacks are an explicit Growth/Enterprise list, never "not starter": a plan this version
 * does not know, `website` included before v1.45.0, must never get a phone-mode form with a
 * consent box for an AI call that will never come.
 *
 * Imported by the catalog form components, console/test/lead-mode-invariants.test.mjs, and
 * onboard.js's plan-consistency guard, so the mapping is impossible to drift between them.
 * This is the client-FORM mode; the server route keys off the env onboard.js derives from the
 * same plan.
 */
export function leadModeFor(plan) {
    return plan === "growth" || plan === "enterprise" ? "phone" : "email";
}
/**
 * Why this plan and receptionist mode may not go together, or null when they may.
 *
 * One rule for every reader, so the onboarding POST, the console import and onboard.js refuse
 * the same pairs with the same words:
 *  - `website`: the plan decides the receptionist, so the mode is absent or `declined`.
 *  - `starter`, `growth`, `enterprise`: a new submission never says `declined`. Web-only is
 *    sold as the website plan now, at its own price.
 *
 * `legacy: true` is for reading stored records only (the intake queue). It also accepts
 * `starter` + `declined`, the web-only shape from before `website` existed, so a record
 * written then still reads. Never pass it on a path that accepts a new submission.
 */
export function receptionistModeProblem(plan, mode, opts = {}) {
    if (plan === "website") {
        return mode == null || mode === "declined"
            ? null
            : `The website plan has no receptionist, so receptionistMode "${mode}" cannot be set on it.`;
    }
    if (mode === "declined") {
        if (opts.legacy && plan === "starter")
            return null;
        return `receptionistMode "declined" is not a choice on the ${plan} plan. Sell the website plan instead.`;
    }
    return null;
}
/**
 * Which path a queued signup came through, from the ids stamped at queue time.
 *
 * An order id always wins: an operator-closed site is the one path that writes one. A purchase
 * id alone is self-serve. Neither (an intake queued before 2026-11-16, or a pre-cutover site)
 * returns null, and the reader decides how to fall back; it never guesses "self-serve".
 */
export function intakeOrigin(rec) {
    if (rec.orderId)
        return "operator-call";
    if (rec.purchaseId)
        return "self-serve";
    return null;
}
//# sourceMappingURL=intake.js.map