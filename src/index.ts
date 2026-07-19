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
// v1.1.0 — brand-direction intake
export * from "./brand-direction.js";
export * from "./palette.js";
// v1.2.0 — OKLCH palette derivation (background moods, per-slot overrides, contrast audit)
export * from "./color.js";
export * from "./structure.js";
export * from "./brand-intake.js";
// v1.4.0 — portal account record (client → site(s) source of truth)
export * from "./account.js";
