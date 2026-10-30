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

// ── crm: the tier split ─────────────────────────────────────────────────────

test("crm is not on plan for starter", () => {
  assert.equal(stateOf(site({ plan: "starter" }), "crm"), "not-on-plan");
});

test("crm is ready for growth and enterprise", () => {
  assert.equal(stateOf(site({ plan: "growth" }), "crm"), "ready");
  assert.equal(stateOf(site({ plan: "enterprise" }), "crm"), "ready");
});

test("crm does NOT require an airtable base — it holds web leads too", () => {
  assert.equal(stateOf(site({ airtableBaseId: null }), "crm"), "ready");
});

test("crm still waits for the site to be live", () => {
  assert.equal(stateOf(site({ status: "building" }), "crm"), "pending-build");
});

test("entitlement outranks build status, so a starter mid-build hears the truth", () => {
  assert.equal(stateOf(site({ plan: "starter", status: "building" }), "crm"), "not-on-plan");
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

test("messaging is not on plan for starter, regardless of a2p", () => {
  assert.equal(stateOf(site({ plan: "starter", a2pStatus: "verified" }), "messaging"), "not-on-plan");
});

test("messaging is connecting until the campaign verifies", () => {
  for (const a2p of ["none", "brand-pending", "campaign-pending", undefined]) {
    assert.equal(stateOf(site({ a2pStatus: a2p }), "messaging"), "connecting", String(a2p));
  }
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

test("siteFeatures returns all six features", () => {
  const all = siteFeatures(site());
  assert.deepEqual(Object.keys(all).sort(), [
    "calls",
    "crm",
    "leads",
    "messaging",
    "performance",
    "traffic",
  ]);
});
