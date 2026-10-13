import { test } from "node:test";
import assert from "node:assert/strict";
import {
  voiceSitesOf,
  meteringGroups,
  meteringGroupFor,
  ENTERPRISE_GROUP_REF,
} from "../dist/index.js";

// The real Schedule A numbers: Starter 100/site, Growth 350/site, Enterprise 1,050 pooled
// across up to 3. Starter joined in the 2026-10-12 reprice, which gave every tier a
// receptionist.
const CAPS = { starter: 100, growth: 350, enterprise: 1050 };
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

test("a Starter site with a provisioned agent DOES meter", () => {
  // The reprice gave Starter a receptionist, so the plan no longer disqualifies a site.
  const sites = [site("a", "starter"), site("b", "growth")];
  assert.deepEqual(voiceSitesOf(sites).map((s) => s.slug), ["a", "b"]);
});

test("a web-only site never meters, even with a stray agent id", () => {
  // What disqualifies a site is a declined receptionist, not its tier. The stray id case is
  // real: an earlier activation choice, or a repair that wrote one before the mode was set.
  const sites = [
    site("web", "starter", { receptionistMode: "declined", retellAgentId: "agent_STRAY" }),
    site("b", "growth"),
  ];
  assert.deepEqual(voiceSitesOf(sites).map((s) => s.slug), ["b"]);
});

test("an externally-managed Starter site with no agent still does not meter", () => {
  // atlantic-compressor and air-service-florida are linked as plan "starter" with no agent
  // and are billed off-platform. They must stay out of minute accounting on the strength of
  // the missing agent alone, whatever their activation mode says.
  const sites = [site("atlantic", "starter", { retellAgentId: null }), site("b", "growth")];
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

test("one Starter site is one group at its own 100-minute cap", () => {
  const groups = meteringGroups([site("a", "starter")], CAPS);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].ref, "a");
  assert.equal(groups[0].plan, "starter");
  assert.equal(groups[0].cap, 100);
});

test("Starter and Growth on one account are TWO groups and never pool", () => {
  // Starter meters per site exactly like Growth. If these merged, a Starter client's minutes
  // would draw on a Growth allowance they never bought, and the overage would land on the
  // wrong subscription.
  const groups = meteringGroups([site("s", "starter"), site("g", "growth")], CAPS);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((g) => [g.ref, g.cap]), [["s", 100], ["g", 350]]);
  assert.equal(groups[0].sites.some((x) => x.slug === "g"), false);
  assert.equal(groups[1].sites.some((x) => x.slug === "s"), false);
});

test("two Starter sites are two separate 100-minute allowances", () => {
  const groups = meteringGroups([site("a", "starter"), site("b", "starter")], CAPS);
  assert.deepEqual(groups.map((g) => [g.ref, g.cap]), [["a", 100], ["b", 100]]);
});

test("a web-only site contributes no allowance", () => {
  const groups = meteringGroups(
    [site("web", "starter", { receptionistMode: "declined" }), site("g", "growth")],
    CAPS,
  );
  assert.deepEqual(groups.map((g) => g.ref), ["g"]);
});

test("an account with no voice sites has no allowances", () => {
  assert.deepEqual(meteringGroups([site("s", "starter", { retellAgentId: null })], CAPS), []);
  assert.deepEqual(meteringGroups([], CAPS), []);
});

test("a zero cap skips the group rather than metering everything as overage", () => {
  // A plan whose included minutes are 0 is not the same as "track this site against nothing".
  // Grouping at cap 0 would bill every second from the first call as overage.
  assert.deepEqual(meteringGroups([site("a", "starter")], { ...CAPS, starter: 0 }), []);
});

test("the enterprise ref is stable as the bundle's membership changes", () => {
  // A ref derived from sites[0].slug would move here, resetting the period's billing flag
  // and re-invoicing an overage that was already charged.
  const two = meteringGroups([site("a", "enterprise"), site("b", "enterprise")], CAPS);
  const dropped = meteringGroups([site("b", "enterprise")], CAPS);
  assert.equal(two[0].ref, dropped[0].ref);
});

test("caps are injected, so Schedule A stays the source of truth", () => {
  const groups = meteringGroups([site("a", "growth")], { starter: 100, growth: 500, enterprise: 1500 });
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

test("a Starter site resolves to its own allowance, not a Growth sibling's", () => {
  const sites = [site("g", "growth"), site("s", "starter")];
  const group = meteringGroupFor(sites, "s", CAPS);
  assert.equal(group.ref, "s");
  assert.equal(group.cap, 100);
});
