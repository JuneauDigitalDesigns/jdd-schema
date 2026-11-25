import { test } from "node:test";
import assert from "node:assert/strict";
import { siteFeature, siteFeatures } from "../dist/index.js";

const NOW = 1_700_000_000_000;

/** A live, fully-wired site. Override to produce the case under test. */
function site(overrides = {}) {
  return {
    slug: "acme",
    name: "Acme",
    plan: "growth",
    status: "live",
    addedAt: NOW,
    canonical: "https://acme.test",
    airtableBaseId: "appXXXX",
    vercelProjectId: "prj_XXXX",
    a2pStatus: "verified",
    ...overrides,
  };
}

const stateOf = (s, f) => siteFeature(s, f).state;

// ── the tier matrix (v1.47.0, Xander 2026-11-25) ────────────────────────────

/**
 * Each plan shape on a live, fully wired site with a verified campaign, so entitlement is the
 * only thing that can differ. `legacy web-only` is the pre-`website` shape: id `starter`, mode
 * `declined`. It is a website client and must read exactly like `website`.
 */
const NONE = { crm: "not-on-plan", calendar: "not-on-plan", messaging: "not-on-plan" };
const SHAPES = [
  ["website", { plan: "website" }, NONE],
  ["legacy web-only", { plan: "starter", receptionistMode: "declined" }, NONE],
  ["starter", { plan: "starter" }, { crm: "ready", calendar: "not-on-plan", messaging: "not-on-plan" }],
  ["growth", { plan: "growth" }, { crm: "ready", calendar: "ready", messaging: "ready" }],
  ["enterprise", { plan: "enterprise" }, { crm: "ready", calendar: "ready", messaging: "ready" }],
];

for (const [name, overrides, expected] of SHAPES) {
  test(`tier matrix: ${name} on a live site`, () => {
    const s = site(overrides);
    for (const feature of ["crm", "calendar", "messaging"]) {
      assert.equal(stateOf(s, feature), expected[feature], `${name} ${feature}`);
    }
  });
}

// ── crm: every plan with a receptionist ─────────────────────────────────────

test("crm is ready for Starter + AI, growth and enterprise", () => {
  assert.equal(stateOf(site({ plan: "starter" }), "crm"), "ready");
  assert.equal(stateOf(site({ plan: "growth" }), "crm"), "ready");
  assert.equal(stateOf(site({ plan: "enterprise" }), "crm"), "ready");
});

test("crm on starter is ready for every receptionist mode except declined", () => {
  for (const mode of ["forwarded", "published", undefined]) {
    assert.equal(stateOf(site({ plan: "starter", receptionistMode: mode }), "crm"), "ready", String(mode));
  }
});

test("crm is NOT gated on the plan id alone: legacy starter + declined is web-only", () => {
  // The id is `starter`, the plan that now has the board. The site is still a website client,
  // so a gate reading `plan` alone would hand it the Customers board.
  const legacy = site({ plan: "starter", receptionistMode: "declined" });
  assert.equal(stateOf(legacy, "crm"), "not-on-plan");
  assert.equal(stateOf({ ...legacy, status: "building" }, "crm"), "not-on-plan");
});

test("crm on a Starter + AI site that is not live yet is pending-build", () => {
  for (const status of ["pending-onboarding", "building"]) {
    assert.equal(stateOf(site({ plan: "starter", status }), "crm"), "pending-build", status);
  }
});

test("crm does NOT require an airtable base — it holds web leads too", () => {
  assert.equal(stateOf(site({ airtableBaseId: null }), "crm"), "ready");
});

test("crm still waits for the site to be live", () => {
  assert.equal(stateOf(site({ status: "building" }), "crm"), "pending-build");
});

test("entitlement outranks build status, so a website site mid-build hears the truth", () => {
  assert.equal(stateOf(site({ plan: "website", status: "building" }), "crm"), "not-on-plan");
});

// ── calendar: Growth and Enterprise, no required id ─────────────────────────

test("calendar is not on plan for Starter + AI, even mid-build", () => {
  assert.equal(stateOf(site({ plan: "starter" }), "calendar"), "not-on-plan");
  assert.equal(stateOf(site({ plan: "starter", status: "building" }), "calendar"), "not-on-plan");
});

test("calendar waits for the site to be live on growth and enterprise", () => {
  assert.equal(stateOf(site({ plan: "growth", status: "building" }), "calendar"), "pending-build");
  assert.equal(stateOf(site({ plan: "enterprise", status: "pending-onboarding" }), "calendar"), "pending-build");
});

test("calendar needs no stored id and no campaign", () => {
  const bare = { slug: "bare", plan: "growth", status: "live", addedAt: NOW, a2pStatus: "none" };
  assert.equal(stateOf(bare, "calendar"), "ready");
});

// ── leads: every tier, no required id ───────────────────────────────────────

test("leads is ready on every tier once live, including web-only", () => {
  for (const plan of ["starter", "growth", "enterprise"]) {
    assert.equal(stateOf(site({ plan }), "leads"), "ready", plan);
  }
  const webOnly = site({ plan: "starter", receptionistMode: "declined", airtableBaseId: null });
  assert.equal(stateOf(webOnly, "leads"), "ready");
});

test("leads needs no stored id — a bare live site is enough", () => {
  const bare = {
    slug: "bare",
    plan: "starter",
    status: "live",
    addedAt: NOW,
  };
  assert.equal(stateOf(bare, "leads"), "ready");
});

test("leads still waits for the site to be live", () => {
  assert.equal(stateOf(site({ status: "pending-onboarding" }), "leads"), "pending-build");
});

// ── messaging: crm + a verified campaign ────────────────────────────────────

test("messaging is not on plan for Starter + AI, regardless of a2p", () => {
  assert.equal(stateOf(site({ plan: "starter", a2pStatus: "verified" }), "messaging"), "not-on-plan");
});

test("growth messaging is connecting until the campaign verifies, then ready", () => {
  for (const a2p of ["none", "brand-pending", "campaign-pending", undefined]) {
    assert.equal(stateOf(site({ a2pStatus: a2p }), "messaging"), "connecting", String(a2p));
  }
  assert.equal(stateOf(site({ a2pStatus: "verified" }), "messaging"), "ready");
});

test("a failed registration reads as connecting, not a new state", () => {
  // Deliberate: FeatureAvailability has exactly four variants and every consumer switches
  // exhaustively. A failed registration is an operator problem, surfaced in the console.
  assert.equal(stateOf(site({ a2pStatus: "failed" }), "messaging"), "connecting");
});

test("messaging is ready only when growth+ and verified", () => {
  assert.equal(stateOf(site({ plan: "growth", a2pStatus: "verified" }), "messaging"), "ready");
  assert.equal(stateOf(site({ plan: "enterprise", a2pStatus: "verified" }), "messaging"), "ready");
});

test("not-applicable is not verified — it must never unlock messaging", () => {
  assert.equal(stateOf(site({ a2pStatus: "not-applicable" }), "messaging"), "connecting");
});

// ── the existing gates must not regress ─────────────────────────────────────

test("calls is unchanged: web-only is excluded, a missing base is connecting", () => {
  const webOnly = site({ plan: "starter", receptionistMode: "declined" });
  assert.equal(stateOf(webOnly, "calls"), "not-on-plan");
  assert.equal(stateOf(site({ airtableBaseId: null }), "calls"), "connecting");
  assert.equal(stateOf(site({ plan: "starter" }), "calls"), "ready");
});

test("siteFeatures returns all eight features", () => {
  const all = siteFeatures(site());
  assert.deepEqual(Object.keys(all).sort(), [
    "calendar", // v1.47.0
    "calls",
    "crm",
    "leads",
    "messaging",
    "pastCalls", // v1.46.0
    "performance",
    "traffic",
  ]);
});
