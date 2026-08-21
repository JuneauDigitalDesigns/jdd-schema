import { test } from "node:test";
import assert from "node:assert/strict";
import {
  voiceSitesOf,
  meteringGroups,
  meteringGroupFor,
  ENTERPRISE_GROUP_REF,
} from "../dist/index.js";

// The real Schedule A numbers: Growth 350/site, Enterprise 1,050 pooled across up to 3.
const CAPS = { growth: 350, enterprise: 1050 };
const NOW = 1_700_000_000_000;

function site(slug, plan, overrides = {}) {
  return {
    slug,
    name: slug,
    plan,
    status: "live",
    retellAgentId: `agent_${slug}`,
    addedAt: NOW,
    ...overrides,
  };
}

// ── voiceSitesOf ────────────────────────────────────────────────────────────

test("starter sites never meter — they have no agent to meter", () => {
  const sites = [site("a", "starter", { retellAgentId: null }), site("b", "growth")];
  assert.deepEqual(voiceSitesOf(sites).map((s) => s.slug), ["b"]);
});

test("a site without a provisioned agent does not meter", () => {
  assert.deepEqual(voiceSitesOf([site("a", "growth", { retellAgentId: null })]), []);
});

test("pending-onboarding is excluded, building is not", () => {
  // The agent answers the phone from the moment onboard.js creates it, whether or not the
  // website has finished deploying — but a client who hasn't filled the wizard has no agent.
  const sites = [
    site("pending", "growth", { status: "pending-onboarding" }),
    site("building", "growth", { status: "building" }),
    site("live", "growth", { status: "live" }),
  ];
  assert.deepEqual(voiceSitesOf(sites).map((s) => s.slug), ["building", "live"]);
});

// ── meteringGroups: the distinction the money depends on ────────────────────

test("one growth site is one group at its own cap", () => {
  const groups = meteringGroups([site("a", "growth")], CAPS);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].ref, "a");
  assert.equal(groups[0].cap, 350);
  assert.deepEqual(groups[0].sites.map((s) => s.slug), ["a"]);
});

test("TWO growth sites are TWO groups of 350 — the pools never meet", () => {
  // The bug this replaces summed both sites against a single 350 cap, so a client paying
  // 2 x $297 received one allowance and the second site's overage vanished.
  const groups = meteringGroups([site("a", "growth"), site("b", "growth")], CAPS);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((g) => g.ref), ["a", "b"]);
  assert.deepEqual(groups.map((g) => g.cap), [350, 350]);
  assert.deepEqual(groups.map((g) => g.sites.length), [1, 1]);
  assert.equal(
    groups[0].sites.some((s) => s.slug === "b"),
    false,
    "site A's group must not see site B",
  );
  assert.equal(
    groups[1].sites.some((s) => s.slug === "a"),
    false,
    "site B's group must not see site A",
  );
});

test("three enterprise sites are ONE pooled group of 1,050", () => {
  const groups = meteringGroups(
    [site("a", "enterprise"), site("b", "enterprise"), site("c", "enterprise")],
    CAPS,
  );
  assert.equal(groups.length, 1);
  assert.equal(groups[0].ref, ENTERPRISE_GROUP_REF);
  assert.equal(groups[0].cap, 1050);
  assert.deepEqual(groups[0].sites.map((s) => s.slug), ["a", "b", "c"]);
});

test("enterprise pooling totals exactly three growth allowances", () => {
  // Not a coincidence worth losing: 1,050 = 3 x 350 is what makes the upsell honest.
  assert.equal(CAPS.enterprise, CAPS.growth * 3);
});

test("a stalled consolidation yields both an enterprise pool and a leftover growth group", () => {
  // Mid-consolidation some sites have moved to enterprise and some have not. The old code
  // took voiceSites[0].plan and applied one cap to all of them, which was wrong whichever
  // site happened to be first.
  const groups = meteringGroups(
    [site("old", "growth"), site("new1", "enterprise"), site("new2", "enterprise")],
    CAPS,
  );
  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.map((g) => [g.ref, g.cap]),
    [["old", 350], [ENTERPRISE_GROUP_REF, 1050]],
  );
});

test("starters alongside voice sites change nothing", () => {
  const groups = meteringGroups(
    [site("s1", "starter", { retellAgentId: null }), site("g", "growth")],
    CAPS,
  );
  assert.deepEqual(groups.map((g) => g.ref), ["g"]);
});

test("an account with no voice sites has no allowances", () => {
  assert.deepEqual(meteringGroups([site("s", "starter", { retellAgentId: null })], CAPS), []);
  assert.deepEqual(meteringGroups([], CAPS), []);
});

test("the enterprise ref is stable as the bundle's membership changes", () => {
  // A ref derived from sites[0].slug would move here, resetting the period's billing flag
  // and re-invoicing an overage that was already charged.
  const two = meteringGroups([site("a", "enterprise"), site("b", "enterprise")], CAPS);
  const dropped = meteringGroups([site("b", "enterprise")], CAPS);
  assert.equal(two[0].ref, dropped[0].ref);
});

test("caps are injected, so Schedule A stays the source of truth", () => {
  const groups = meteringGroups([site("a", "growth")], { growth: 500, enterprise: 1500 });
  assert.equal(groups[0].cap, 500);
});

// ── meteringGroupFor ────────────────────────────────────────────────────────

test("each growth site resolves to its own allowance", () => {
  const sites = [site("a", "growth"), site("b", "growth")];
  assert.equal(meteringGroupFor(sites, "a", CAPS).ref, "a");
  assert.equal(meteringGroupFor(sites, "b", CAPS).ref, "b");
});

test("every enterprise site resolves to the same pooled allowance", () => {
  const sites = [site("a", "enterprise"), site("b", "enterprise")];
  assert.equal(meteringGroupFor(sites, "a", CAPS).ref, ENTERPRISE_GROUP_REF);
  assert.equal(meteringGroupFor(sites, "b", CAPS).ref, ENTERPRISE_GROUP_REF);
});

test("a site with no allowance resolves to null rather than someone else's", () => {
  const sites = [site("a", "growth"), site("s", "starter", { retellAgentId: null })];
  assert.equal(meteringGroupFor(sites, "s", CAPS), null);
  assert.equal(meteringGroupFor(sites, "nonexistent", CAPS), null);
});
