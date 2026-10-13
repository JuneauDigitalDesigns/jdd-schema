/**
 * The intake envelope + the KV queue record that carries it between the agency
 * site (producer) and the jdd-ops console (consumer).
 */
/**
 * The lead-capture mode a plan's website forms use, and the ONLY place the mapping lives.
 *
 * `email`  — starter (and web-only starter): the form collects an email and /api/contact
 *            Resends the owner a lead email (LEAD_DELIVERY_MODE=email).
 * `phone`  — growth / enterprise: the form collects a phone and /api/contact calls Retell
 *            create-phone-call so the agent dials the lead back (LEAD_DELIVERY_MODE=callback).
 *
 * Imported by the catalog form components, console/test/lead-mode-invariants.test.mjs, and
 * onboard.js's plan-consistency guard, so the mapping is impossible to drift between them.
 * This is the client-FORM mode; the server route keys off LEAD_DELIVERY_MODE, which onboard.js
 * derives from the same plan — see onboard.js:1358.
 */
export function leadModeFor(plan) {
    return plan === "starter" ? "email" : "phone";
}
//# sourceMappingURL=intake.js.map