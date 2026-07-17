/**
 * @jdd/schema — the single source of truth for the JDD onboarding wire contract.
 *
 * Producer: juneau-digital-designs (agency site) — POST /api/onboarding maps the
 *           form payload to an Intake and enqueues it on the KV queue.
 * Consumer: jdd-ops/console — pulls the queue, writes clients/<slug>/site.ts,
 *           then onboard.js provisions from it.
 */

export * from "./site.js";
export * from "./submission.js";
export * from "./intake.js";
export * from "./map.js";
export * from "./zod.js";
export * from "./site-types-source.js";
