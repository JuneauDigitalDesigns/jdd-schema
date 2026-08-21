import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createAccount,
  isActiveSite,
  countActiveSites,
  canAddPlan,
  growthSitesForConsolidation,
  enterpriseSlotsRemaining,
  uniqueSlug,
  DEFAULT_PLAN_LIMITS,
} from "../dist/index.js";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function site(slug, plan, overrides = {}) {
  return { slug, name: slug, plan, status: "live", addedAt: NOW, ...overrides };
}

function accountWith(sites) {
  return { ...createAccount("owner@example.com", NOW), sites };
}

// ── isActiveSite / countActiveSites ─────────────────────────────────────────

test("a site with no cancellation is active", () => {
  assert.equal(isActiveSite(site("a", "growth"), NOW), true);
});

test("a cancellation that has not taken effect still occupies its slot", () => {
  // The client is still being billed and the site is still serving. Freeing the slot now
  // would let them exceed the cap for the whole notice period.
  const s = site("a", "growth", { cancelRequestedAt: NOW, cancelEffectiveAt: NOW + 60 * DAY });
  assert.equal(isActiveSite(s, NOW), true);
});

test("a cancellation that has taken effect frees the slot", () => {
  const s = site("a", "growth", { cancelEffectiveAt: NOW - 1 });
  assert.equal(isActiveSite(s, NOW), false);
});

test("countActiveSites counts only the requested plan", () => {
  const account = accountWith([
    site("a", "growth"),
    site("b", "starter"),
    site("c", "growth"),
    site("d", "enterprise"),
  ]);
  assert.equal(countActiveSites(account, "growth", NOW), 2);
  assert.equal(countActiveSites(account, "starter", NOW), 1);
  assert.equal(countActiveSites(account, "enterprise", NOW), 1);
});

// ── canAddPlan ──────────────────────────────────────────────────────────────

test("starter is never capped", () => {
  const many = accountWith(
    Array.from({ length: 12 }, (_, i) => site(`s${i}`, "starter")),
  );
  assert.equal(canAddPlan(many, "starter", DEFAULT_PLAN_LIMITS, NOW), null);
});

test("growth is allowed at zero and one existing growth site", () => {
  assert.equal(canAddPlan(accountWith([]), "growth", DEFAULT_PLAN_LIMITS, NOW), null);
  assert.equal(
    canAddPlan(accountWith([site("a", "growth")]), "growth", DEFAULT_PLAN_LIMITS, NOW),
    null,
  );
});

test("a third growth site is refused, and names the reason", () => {
  const account = accountWith([site("a", "growth"), site("b", "growth")]);
  assert.equal(
    canAddPlan(account, "growth", DEFAULT_PLAN_LIMITS, NOW),
    "growth-cap-reached",
  );
});

test("starter sites do not count toward the growth cap", () => {
  const account = accountWith([
    site("a", "growth"),
    site("b", "starter"),
    site("c", "starter"),
  ]);
  assert.equal(canAddPlan(account, "growth", DEFAULT_PLAN_LIMITS, NOW), null);
});

test("an effective cancellation frees a growth slot", () => {
  const account = accountWith([
    site("a", "growth"),
    site("b", "growth", { cancelEffectiveAt: NOW - 1 }),
  ]);
  assert.equal(canAddPlan(account, "growth", DEFAULT_PLAN_LIMITS, NOW), null);
});

test("a pending cancellation does not free a growth slot", () => {
  const account = accountWith([
    site("a", "growth"),
    site("b", "growth", { cancelEffectiveAt: NOW + DAY }),
  ]);
  assert.equal(
    canAddPlan(account, "growth", DEFAULT_PLAN_LIMITS, NOW),
    "growth-cap-reached",
  );
});

test("sites still pending their wizard count — buying is a billing decision", () => {
  const account = accountWith([
    site("a", "growth", { status: "pending-onboarding" }),
    site("b", "growth", { status: "building" }),
  ]);
  assert.equal(
    canAddPlan(account, "growth", DEFAULT_PLAN_LIMITS, NOW),
    "growth-cap-reached",
  );
});

test("enterprise is buyable once, then it is the ceiling", () => {
  assert.equal(canAddPlan(accountWith([]), "enterprise", DEFAULT_PLAN_LIMITS, NOW), null);
  const onEnterprise = accountWith([site("a", "enterprise")]);
  assert.equal(
    canAddPlan(onEnterprise, "enterprise", DEFAULT_PLAN_LIMITS, NOW),
    "enterprise-cap-reached",
  );
});

test("two growth sites do not block buying enterprise — that is the upsell", () => {
  const account = accountWith([site("a", "growth"), site("b", "growth")]);
  assert.equal(canAddPlan(account, "enterprise", DEFAULT_PLAN_LIMITS, NOW), null);
});

test("an enterprise client may still add starter sites", () => {
  const account = accountWith([
    site("a", "enterprise"),
    site("b", "enterprise"),
    site("c", "enterprise"),
  ]);
  assert.equal(canAddPlan(account, "starter", DEFAULT_PLAN_LIMITS, NOW), null);
});

test("limits are injectable, so Schedule A stays the source of truth", () => {
  const account = accountWith([site("a", "growth")]);
  assert.equal(
    canAddPlan(account, "growth", { growthSitesPerAccount: 1, enterpriseSites: 3 }, NOW),
    "growth-cap-reached",
  );
});

// ── growthSitesForConsolidation ─────────────────────────────────────────────

test("consolidation absorbs exactly the active growth sites", () => {
  const account = accountWith([
    site("a", "growth"),
    site("b", "starter"),
    site("c", "growth"),
    site("d", "growth", { cancelEffectiveAt: NOW - 1 }),
  ]);
  assert.deepEqual(
    growthSitesForConsolidation(account, NOW).map((s) => s.slug),
    ["a", "c"],
  );
});

// ── enterpriseSlotsRemaining ────────────────────────────────────────────────

test("enterprise slots count down and never go negative", () => {
  assert.equal(enterpriseSlotsRemaining(accountWith([]), DEFAULT_PLAN_LIMITS, NOW), 3);
  const two = accountWith([site("a", "enterprise"), site("b", "enterprise")]);
  assert.equal(enterpriseSlotsRemaining(two, DEFAULT_PLAN_LIMITS, NOW), 1);
  const four = accountWith(
    ["a", "b", "c", "d"].map((s) => site(s, "enterprise")),
  );
  assert.equal(enterpriseSlotsRemaining(four, DEFAULT_PLAN_LIMITS, NOW), 0);
});

// ── uniqueSlug ──────────────────────────────────────────────────────────────

test("an unused slug is returned unchanged", () => {
  const account = accountWith([site("acme", "growth")]);
  assert.equal(uniqueSlug("bravo", account), "bravo");
});

test("a colliding slug is suffixed rather than rejected", () => {
  const account = accountWith([site("acme", "growth")]);
  assert.equal(uniqueSlug("acme", account), "acme-2");
});

test("suffixing keeps counting past an existing suffix", () => {
  const account = accountWith([site("acme", "growth"), site("acme-2", "starter")]);
  assert.equal(uniqueSlug("acme", account), "acme-3");
});

test("a site does not collide with itself when it is being renamed in place", () => {
  // The wizard rewrites a pending site's placeholder slug; without the exception the site
  // would be treated as its own collision and get a pointless -2.
  const account = accountWith([site("acme", "growth")]);
  assert.equal(uniqueSlug("acme", account, "acme"), "acme");
});
