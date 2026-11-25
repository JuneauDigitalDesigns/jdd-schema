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
// v1.32.0 - profile kinds + review sources, and the service-page gate (moved from the console)
export * from "./profiles.js";
export * from "./service-pages.js";
// v1.34.0 - town pages, spokes and the caps per page type (local SEO, 2026-11-12)
export * from "./area-pages.js";
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
// v1.16.0 — canonical vertical ids + the industry menu the wizard offers as chips, so the
//           client picks instead of typing; plus palette tagging by trade.
export * from "./verticals.js";
export * from "./industry-menu.js";
// v1.17.0 — the purchase gate moved in front of the agreement, so "what may this account buy
//           next" became a real question with three callers (the gate, the upsell, the
//           in-portal upgrade CTA). `entitlements` answers it once — starter unlimited,
//           growth capped at two, enterprise as the ceiling — and `agreement` holds the
//           master-vs-addendum rules that decide what they actually sign.
export * from "./entitlements.js";
export * from "./agreement.js";
// v1.18.0 — metering groups. Growth minutes are per site, Enterprise minutes are pooled;
//           treating an account as one allowance merged two Growth clients' pools, capped
//           them at 350 between them, and dropped the second site's overage entirely.
export * from "./metering.js";
// v1.19.0 — vertical-registry: the copywriter prompt (role/guardrails/forbidden) and
//           structure counts per vertical, layered with INDUSTRY_MENUS' existing
//           services/differentiators/customers; plus CopyBrief, the durable shape of the
//           console's Brief-stage inputs, persisted at _meta.copyBrief.
export * from "./vertical-registry.js";
export * from "./copy-brief.js";
// v1.21.0 — support tickets. The durable record + pure ops behind the portal's Support tab
//           and the console's /tickets board, bridged by KV like the lead funnel. Standalone:
//           its own `jdd:ticket:*` keys, no change to any existing schema or record.
export * from "./ticket.js";
// v1.24.0 — the 2026-10-12 reprice gave EVERY tier the AI receptionist, so "does this site
//           have a voice agent" stopped being answerable from the plan. `ReceptionistMode`
//           + `isWebOnly` replace `plan === "starter"` as the gate in three places that each
//           had their own copy of it: `buildPortalSiteEntries` (which actively nulled a
//           Starter agent, so a console repair wiped one that had been provisioned),
//           `siteFeature`, and `voiceSitesOf`. Starter also became meterable: `MinuteCaps`
//           and `VoicePlan` carry it, metered per site like Growth, never pooled.
//           Web-only was then `plan: "starter"` + mode `declined` at Starter's price. Superseded
//           in v1.45.0: web-only is its own plan, `website`; the declined shape is read only.
// v1.30.0 — CRM v2 + web-form lead capture.
//           `WebLead`: form inquiries captured into the portal, replacing Resend email
//           delivery. Keyed on `normalizeE164(phone)` so a form submission and a call from
//           the same person collapse onto one customer rather than two.
//           `PortalSite.twilioNumber` / `.messagingServiceSid`: the portal cannot read a
//           client's .env.local, so the sender and the client's OWN Messaging Service have to
//           live on the record. The service is per-client after the ISV migration — the master
//           TWILIO_MESSAGING_SERVICE_SID stays JDD's Account-lane service for owner alerts.
//           `PortalSite.a2pStatus`: registration progress, with `not-applicable` as a real
//           terminal state for tiers that never register.
//           Three new gates: `leads` (all tiers, no required id), `crm` and `messaging`
//           (growth/enterprise; messaging additionally waits on a verified A2P campaign).
//           FEATURE_REQUIREMENT became Partial — leads and crm genuinely require nothing.
export * from "./lead.js";
// v1.31.0 — operator orders: a client closed on a sales call. `OperatorOrder` replaces the
//           purchase intent on that path (the operator states who is buying, since the client
//           never signs in). `resumeStepFor` and `readinessFor` live here so the agency, the
//           close wizard and the client cards cannot disagree about where a close stands.
//           `PortalSite.slugLocked` / `.orderId`: an operator-closed site keeps its slug through
//           onboarding. zPortalSite is a plain object, so without these fields a read would
//           silently strip them.
export * from "./operator-order.js";
// v1.35.0 — the client call log's gate and the call profile. `shouldLogCall` is the one rule for
//           "should this finished call have a row": jdd-ops' Make filter is tested against it and
//           the agency's client-call reconcile applies it before replaying anything, so a call
//           the filter drops on purpose is never replayed. `CallProfile` is what jdd-ops
//           publishes to KV per site so the reconcile can find the agent, base and clone hook,
//           and `callProfileProblems` refuses a master base or the master hook.
export * from "./call-gate.js";
// v1.45.0 — the website-only plan (decided 2026-11-24). `website` is a fourth plan id, shown as
//           "Starter", with no number, agent, call log, CRM or minutes. `starter` keeps its id
//           and its receptionist and is now shown as "Starter + AI Receptionist" ("Starter + AI"
//           on tight chips). plans.ts holds the one copy of `PLAN_IDS`, `PLAN_LABELS`,
//           `PLAN_RANK` (website 0 < starter 1 < growth 2 < enterprise 3, replacing agreement's
//           `TIER_RANK`) and `planHasReceptionist`; never display a plan id.
//           `isWebOnly` = `website`, or the legacy `starter` + `declined` (read only, never written).
//           `leadModeFor` gives phone forms to Growth/Enterprise only, as an explicit list.
//           `zIntake` now declares `receptionistMode` (it was silently dropped), and
//           `receptionistModeProblem` refuses `website` + a receptionist mode and a new
//           `declined` on any other plan; the intake queue and operator orders still read the
//           legacy declined Starter. `canAddPlan("website")` is unlimited; a `website` site is
//           never metered; a `website` operator order carries no `receptionistMode`.
export * from "./plans.js";
// v1.46.0 — past calls stay viewable after a downgrade to website (Xander, B4). The first onboard
//           re-run after a downgrade nulls a web-only site's `airtableBaseId` and `retellAgentId`,
//           which the portal's call log, recording and transcript routes read. The downgrade now
//           copies them to `PortalSite.callHistory` ({ airtableBaseId, retellAgentId, endedAt }),
//           which `upsertSite` never clears (a null is ignored) and `buildPortalSiteEntries` never
//           emits. New `PortalFeature` "pastCalls": ready only for a web-only site with history.
// v1.47.0 — the Customers board moves down to Starter + AI Receptionist (Xander, 2026-11-25).
//           `crm` (customers, notes, jobs, job values, tags, follow-up reminders) is now every
//           plan with a receptionist: `starter`, `growth` or `enterprise`, and not `isWebOnly`, so
//           the legacy `starter` + `declined` shape stays `not-on-plan` like `website`. New
//           `PortalFeature` "calendar" (bookings and appointments): Growth and Enterprise only,
//           no required id, the usual entitlement → pending-build → ready order. `messaging`
//           (customer texting + review requests) is unchanged: Growth and Enterprise, and
//           `connecting` until the A2P campaign verifies. `hasCrmPlan` became two helpers,
//           `hasCustomersEntitlement` and `hasGrowthEntitlement`. A consumer with an exhaustive
//           `Record<PortalFeature, …>` needs a `calendar` entry.
//# sourceMappingURL=index.js.map