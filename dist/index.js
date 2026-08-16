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
// v1.6.0 — buildPortalSiteEntries: shared entry rules for onboard.js + the console
// v1.10.0 — PortalSite.retellAgentId: the join key minute accounting reads
export * from "./account.js";
// v1.11.0 — Intake.smsAlerts: the owner's post-call SMS opt-in, carried to onboard.js
// v1.12.0 — ClientRecord: one durable record per relationship, lead → live → churn, plus
//           the stage-precedence rules the console derives its lifecycle from.
export * from "./client-record.js";
// v1.13.0 — Findings: the one shape every reconcile check produces, its severity ranking,
//           and the sweep-diffing that turns repeated observations into open/close history.
export * from "./findings.js";
// v1.14.0 — Vercel project-name and hostname derivation, shared so the transform stops
//           being copied (four inline copies, three of them wrong, caused a live bug).
export * from "./vercel-host.js";
// v1.15.0 — phone normalization + comparison, shared (five copies, already diverged).
export * from "./phone.js";
//# sourceMappingURL=index.js.map