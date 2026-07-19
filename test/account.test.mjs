import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeEmail,
  accountKey,
  accountByUserKey,
  createAccount,
  upsertSite,
  removeSite,
  resolveSite,
  accountFromLegacyMetadata,
  siteHasCallData,
  siteHasTraffic,
  zPortalAccount,
} from "../dist/index.js";

const NOW = 1_700_000_000_000;

function accountWith(sites, now = NOW) {
  return { ...createAccount("owner@example.com", now), sites };
}

function site(slug, overrides = {}) {
  return {
    slug,
    name: slug,
    plan: "growth",
    status: "live",
    airtableBaseId: null,
    vercelProjectId: null,
    addedAt: NOW,
    ...overrides,
  };
}

// ── normalizeEmail / keys ───────────────────────────────────────────────────

test("normalizeEmail trims and lowercases", () => {
  assert.equal(normalizeEmail("  Owner@Example.COM "), "owner@example.com");
});

test("normalizeEmail does NOT fold gmail dots or +aliases", () => {
  // Deliberate: folding would silently merge genuinely different accounts.
  assert.equal(normalizeEmail("a.b+tag@gmail.com"), "a.b+tag@gmail.com");
  assert.notEqual(normalizeEmail("a.b@gmail.com"), normalizeEmail("ab@gmail.com"));
});

test("keys are namespaced and normalized", () => {
  assert.equal(accountKey(" Owner@Example.com "), "jdd:account:owner@example.com");
  assert.equal(accountByUserKey("user_123"), "jdd:account-by-user:user_123");
});

// ── upsertSite: the multi-site invariant ────────────────────────────────────

test("upsertSite appends a new site", () => {
  const acct = accountWith([site("alpha")]);
  const next = upsertSite(acct, { slug: "beta", plan: "starter", status: "building" }, NOW + 1);

  assert.deepEqual(next.sites.map((s) => s.slug), ["alpha", "beta"]);
  assert.equal(next.sites[1].plan, "starter");
  assert.equal(next.sites[1].status, "building");
  assert.equal(next.updatedAt, NOW + 1);
});

test("upsertSite updates in place and PRESERVES every other site", () => {
  // This is the invariant that today's replace-semantics violates: repairing or
  // provisioning site B must never drop site A.
  const acct = accountWith([site("alpha"), site("beta", { status: "building" }), site("gamma")]);
  const next = upsertSite(acct, { slug: "beta", status: "live", vercelProjectId: "prj_b" }, NOW + 1);

  assert.deepEqual(next.sites.map((s) => s.slug), ["alpha", "beta", "gamma"]);
  assert.equal(next.sites[1].status, "live");
  assert.equal(next.sites[1].vercelProjectId, "prj_b");
  // Neighbours untouched.
  assert.deepEqual(next.sites[0], acct.sites[0]);
  assert.deepEqual(next.sites[2], acct.sites[2]);
});

test("upsertSite merges only defined fields — a partial update never blanks data", () => {
  // onboard.js supplies airtableBaseId later; it must not wipe name/canonical/plan.
  const acct = accountWith([
    site("alpha", { name: "Alpha Co", canonical: "https://alpha.com", plan: "growth" }),
  ]);
  const next = upsertSite(acct, { slug: "alpha", airtableBaseId: "app123" }, NOW + 1);

  const s = next.sites[0];
  assert.equal(s.airtableBaseId, "app123");
  assert.equal(s.name, "Alpha Co");
  assert.equal(s.canonical, "https://alpha.com");
  assert.equal(s.plan, "growth");
});

test("upsertSite preserves addedAt on update but sets it on insert", () => {
  const acct = accountWith([site("alpha", { addedAt: 111 })]);

  const updated = upsertSite(acct, { slug: "alpha", status: "live" }, NOW + 5);
  assert.equal(updated.sites[0].addedAt, 111, "addedAt preserved on update");

  const inserted = upsertSite(acct, { slug: "beta" }, NOW + 5);
  assert.equal(inserted.sites[1].addedAt, NOW + 5, "addedAt stamped on insert");
});

test("upsertSite is immutable — the input account is not mutated", () => {
  const acct = accountWith([site("alpha")]);
  const before = JSON.parse(JSON.stringify(acct));
  upsertSite(acct, { slug: "beta" }, NOW + 1);
  assert.deepEqual(acct, before);
});

test("upsertSite defaults a brand-new site to starter/building", () => {
  const next = upsertSite(createAccount("o@e.com", NOW), { slug: "solo" }, NOW);
  assert.equal(next.sites[0].plan, "starter");
  assert.equal(next.sites[0].status, "building");
});

test("removeSite drops only the named slug", () => {
  const acct = accountWith([site("alpha"), site("beta")]);
  const next = removeSite(acct, "alpha", NOW + 1);
  assert.deepEqual(next.sites.map((s) => s.slug), ["beta"]);
});

// ── resolveSite ─────────────────────────────────────────────────────────────

test("resolveSite returns the requested site", () => {
  const acct = accountWith([site("alpha"), site("beta")]);
  assert.equal(resolveSite(acct, "beta").slug, "beta");
});

test("resolveSite falls back to the primary for missing/unknown params", () => {
  const acct = accountWith([site("alpha"), site("beta")]);
  assert.equal(resolveSite(acct, null).slug, "alpha");
  assert.equal(resolveSite(acct, "nope").slug, "alpha");
});

test("resolveSite returns null for an account with no sites", () => {
  assert.equal(resolveSite(createAccount("o@e.com", NOW), "alpha"), null);
});

// ── Legacy migration ────────────────────────────────────────────────────────

test("legacy single-site metadata migrates, defaulting missing status to live", () => {
  // Clients predating the building/live flag must keep rendering the live dashboard.
  const acct = accountFromLegacyMetadata(
    "Owner@Example.com",
    {
      slug: "acme",
      name: "Acme Co",
      plan: "growth",
      canonical: "https://acme.com",
      airtableBaseId: "appACME",
      vercelProjectId: "prj_acme",
    },
    NOW,
  );

  assert.equal(acct.email, "owner@example.com");
  assert.equal(acct.sites.length, 1);
  assert.deepEqual(acct.sites[0], {
    slug: "acme",
    name: "Acme Co",
    canonical: "https://acme.com",
    plan: "growth",
    status: "live",
    airtableBaseId: "appACME",
    vercelProjectId: "prj_acme",
    addedAt: NOW,
  });
});

test("legacy building client keeps its building status", () => {
  const acct = accountFromLegacyMetadata(
    "o@e.com",
    { slug: "new-co", plan: "starter", status: "building" },
    NOW,
  );
  assert.equal(acct.sites[0].status, "building");
});

test("legacy enterprise migrates sites[] and inherits plan + shared Airtable base", () => {
  // Enterprise entries predate per-site plan/status, and the base slug is NOT a site.
  const acct = accountFromLegacyMetadata(
    "o@e.com",
    {
      slug: "bigco",
      plan: "enterprise",
      airtableBaseId: "appSHARED",
      sites: [
        { slug: "bigco-1", name: "One", canonical: "https://one.com", vercelProjectId: "prj1" },
        { slug: "bigco-2", name: "Two", canonical: "https://two.com", vercelProjectId: "prj2" },
      ],
    },
    NOW,
  );

  assert.deepEqual(acct.sites.map((s) => s.slug), ["bigco-1", "bigco-2"]);
  for (const s of acct.sites) {
    assert.equal(s.plan, "enterprise", "inherits account plan");
    assert.equal(s.status, "live", "missing status ⇒ live");
    assert.equal(s.airtableBaseId, "appSHARED", "shares the account base");
  }
  assert.equal(acct.sites[0].vercelProjectId, "prj1");
  assert.equal(acct.sites[1].vercelProjectId, "prj2");
});

test("legacy per-site plan/status override the account-level values", () => {
  const acct = accountFromLegacyMetadata(
    "o@e.com",
    {
      slug: "base",
      plan: "starter",
      sites: [
        { slug: "a", plan: "growth", status: "live" },
        { slug: "b", status: "building" },
      ],
    },
    NOW,
  );
  assert.equal(acct.sites[0].plan, "growth");
  assert.equal(acct.sites[1].plan, "starter", "falls back to account plan");
  assert.equal(acct.sites[1].status, "building");
});

test("accountFromLegacyMetadata returns null when there is nothing to migrate", () => {
  assert.equal(accountFromLegacyMetadata("o@e.com", null, NOW), null);
  assert.equal(accountFromLegacyMetadata("o@e.com", {}, NOW), null);
  assert.equal(accountFromLegacyMetadata("o@e.com", { plan: "growth" }, NOW), null);
});

// ── Derived view helpers ────────────────────────────────────────────────────

test("siteHasCallData requires a non-starter plan AND a base", () => {
  assert.equal(siteHasCallData(site("a", { plan: "growth", airtableBaseId: "app1" })), true);
  assert.equal(siteHasCallData(site("a", { plan: "starter", airtableBaseId: "app1" })), false);
  assert.equal(siteHasCallData(site("a", { plan: "growth", airtableBaseId: null })), false);
});

test("siteHasTraffic requires a vercel project", () => {
  assert.equal(siteHasTraffic(site("a", { vercelProjectId: "prj" })), true);
  assert.equal(siteHasTraffic(site("a", { vercelProjectId: null })), false);
});

// ── Schema validation ───────────────────────────────────────────────────────

test("migrated + upserted accounts satisfy zPortalAccount", () => {
  const legacy = accountFromLegacyMetadata("o@e.com", { slug: "acme", plan: "growth" }, NOW);
  const next = upsertSite(legacy, { slug: "beta", plan: "starter", status: "building" }, NOW + 1);
  assert.doesNotThrow(() => zPortalAccount.parse(next));
});

test("zPortalAccount rejects an invalid plan", () => {
  const bad = accountWith([site("a", { plan: "platinum" })]);
  assert.throws(() => zPortalAccount.parse(bad));
});
