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
  siteFeature,
  siteFeatures,
  buildPortalSiteEntries,
  isWebOnly,
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

// ── buildPortalSiteEntries: the rules both writers share ────────────────────

test("web-only sites never carry an Airtable base", () => {
  const [entry] = buildPortalSiteEntries({
    plan: "starter",
    status: "live",
    sharedAirtableBaseId: "appSHARED",
    sites: [{ slug: "solo", airtableBaseId: "appOWN", receptionistDeclined: true }],
  });
  assert.equal(entry.airtableBaseId, null);
});

test("a Starter site WITH a receptionist keeps its Airtable base", () => {
  // The 2026-10-12 reprice gave every tier a receptionist, so the blanking rule moved from
  // the plan to the declined flag. If this regresses, every console repair silently
  // disconnects a paying Starter client's call log — which is exactly the failure the
  // undefined-vs-null discipline in this module exists to prevent.
  const [entry] = buildPortalSiteEntries({
    plan: "starter",
    status: "live",
    sites: [{ slug: "solo", airtableBaseId: "appOWN", receptionistDeclined: false }],
  });
  assert.equal(entry.airtableBaseId, "appOWN");
});

test("enterprise sites all inherit the shared Airtable base", () => {
  const entries = buildPortalSiteEntries({
    plan: "enterprise",
    status: "live",
    sharedAirtableBaseId: "appSHARED",
    sites: [{ slug: "acme-1" }, { slug: "acme-2" }, { slug: "acme-3" }],
  });
  assert.deepEqual(
    entries.map((e) => e.airtableBaseId),
    ["appSHARED", "appSHARED", "appSHARED"],
  );
});

test("a site's own Airtable base wins over the shared one", () => {
  const [entry] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sharedAirtableBaseId: "appSHARED",
    sites: [{ slug: "solo", airtableBaseId: "appOWN" }],
  });
  assert.equal(entry.airtableBaseId, "appOWN");
});

test("an unresolved Airtable base is omitted, not nulled", () => {
  // The regression that motivated the guard. A writer with no view of the base — a console
  // repair on a client whose clients/{slug}/.env.local is missing — passes neither an own
  // nor a shared base. Writing `null` there would assert "I looked and there is none",
  // which is a claim it has no standing to make.
  const [entry] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [{ slug: "solo" }],
  });
  assert.ok(!("airtableBaseId" in entry), "must be absent, not null");
});

test("an omitted Airtable base preserves the stored one through upsertSite", () => {
  // End to end: this is the exact sequence that silently disconnected a client's Call Log.
  const acct = accountWith([site("alpha", { airtableBaseId: "appSTORED" })]);
  const [entry] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [{ slug: "alpha" }],
  });
  const next = upsertSite(acct, entry, NOW + 1);
  assert.equal(next.sites[0].airtableBaseId, "appSTORED");
});

// ── retellAgentId: the join key minute accounting reads ─────────────────────

test("web-only sites never carry a Retell agent", () => {
  // A web-only site has no voice agent at all. Asserting null (rather than omitting) also
  // clears an id left behind by an earlier activation choice.
  const [entry] = buildPortalSiteEntries({
    plan: "starter",
    status: "live",
    sites: [{ slug: "solo", retellAgentId: "agent_LEFTOVER", receptionistDeclined: true }],
  });
  assert.equal(entry.retellAgentId, null);
});

test("a declined entry also records the mode, so isWebOnly stays true on re-read", () => {
  // Writing null ids without the mode would make the NEXT read see a Starter site with no
  // agent, which `isWebOnly` reports as false — re-opening the call-log tab and putting the
  // site back into minute metering. The flag and the stored mode have to agree.
  const [entry] = buildPortalSiteEntries({
    plan: "starter",
    status: "live",
    sites: [{ slug: "solo", receptionistDeclined: true }],
  });
  assert.equal(entry.receptionistMode, "declined");
  assert.equal(isWebOnly({ ...entry, addedAt: NOW }), true);
});

test("a Starter site WITH a receptionist keeps its Retell agent", () => {
  const [entry] = buildPortalSiteEntries({
    plan: "starter",
    status: "live",
    sites: [{ slug: "solo", retellAgentId: "agent_OWN", receptionistDeclined: false }],
  });
  assert.equal(entry.retellAgentId, "agent_OWN");
});

test("a voice site carries its own Retell agent", () => {
  const [entry] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [{ slug: "solo", retellAgentId: "agent_OWN" }],
  });
  assert.equal(entry.retellAgentId, "agent_OWN");
});

test("Retell agents are never shared between enterprise sites", () => {
  // Unlike the Airtable base, which enterprise sites pool, each site has its own
  // agent — so there is no shared fallback and one site's id must never leak to another.
  const entries = buildPortalSiteEntries({
    plan: "enterprise",
    status: "live",
    sharedAirtableBaseId: "appSHARED",
    sites: [
      { slug: "acme-1", retellAgentId: "agent_1" },
      { slug: "acme-2", retellAgentId: "agent_2" },
      { slug: "acme-3" },
    ],
  });
  assert.equal(entries[0].retellAgentId, "agent_1");
  assert.equal(entries[1].retellAgentId, "agent_2");
  assert.ok(!("retellAgentId" in entries[2]), "unresolved must be absent, not inherited");
});

test("an unresolved Retell agent is omitted, not nulled", () => {
  // Same standing argument as the Airtable base: a console repair that cannot read
  // clients/{slug}/.env.local has no basis to assert "this site has no agent".
  const [entry] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [{ slug: "solo" }],
  });
  assert.ok(!("retellAgentId" in entry), "must be absent, not null");
});

test("an omitted Retell agent preserves the stored one through upsertSite", () => {
  // If this regressed, usage accounting would lose the join key and silently
  // under-bill the client to zero minutes.
  const acct = accountWith([site("alpha", { retellAgentId: "agent_STORED" })]);
  const [entry] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [{ slug: "alpha" }],
  });
  const next = upsertSite(acct, entry, NOW + 1);
  assert.equal(next.sites[0].retellAgentId, "agent_STORED");
});

test("declining the receptionist still blanks a stored Airtable base", () => {
  // The counterpart: `null` from the declined branch IS a claim we can stand behind, so it
  // must survive the merge rather than being preserved away.
  const acct = accountWith([site("alpha", { airtableBaseId: "appSTORED" })]);
  const [entry] = buildPortalSiteEntries({
    plan: "starter",
    status: "live",
    sharedAirtableBaseId: "appSHARED",
    sites: [{ slug: "alpha", receptionistDeclined: true }],
  });
  const next = upsertSite(acct, entry, NOW + 1);
  assert.equal(next.sites[0].airtableBaseId, null);
});

test("canonical falls back to the resolved Vercel host, then is omitted", () => {
  const [own, fallback, neither] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [
      { slug: "a", canonical: "https://acme.com", fallbackCanonical: "https://a.vercel.app" },
      { slug: "b", canonical: "   ", fallbackCanonical: "https://b.vercel.app" },
      { slug: "c", canonical: null, fallbackCanonical: null },
    ],
  });
  assert.equal(own.canonical, "https://acme.com");
  assert.equal(fallback.canonical, "https://b.vercel.app");
  assert.ok(!("canonical" in neither), "canonical must be absent, not empty");
});

test("an omitted canonical does not blank one stored earlier", () => {
  // The console can't resolve a Vercel host; its repair write must not undo onboard.js.
  const acct = accountWith([site("alpha", { canonical: "https://acme.com" })]);
  const [entry] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [{ slug: "alpha" }],
  });
  const next = upsertSite(acct, entry, NOW + 1);
  assert.equal(next.sites[0].canonical, "https://acme.com");
});

test("vercelProjectId: undefined is omitted, null is kept", () => {
  const [absent, resolved] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [{ slug: "a" }, { slug: "b", vercelProjectId: null }],
  });
  assert.ok(!("vercelProjectId" in absent), "undefined must be omitted so upsert preserves");
  assert.equal(resolved.vercelProjectId, null);
});

test("an omitted vercelProjectId preserves the stored one through upsertSite", () => {
  const acct = accountWith([site("alpha", { vercelProjectId: "prj_a" })]);
  const [entry] = buildPortalSiteEntries({
    plan: "growth",
    status: "live",
    sites: [{ slug: "alpha" }],
  });
  const next = upsertSite(acct, entry, NOW + 1);
  assert.equal(next.sites[0].vercelProjectId, "prj_a");
});

test("plan and status apply uniformly to every site", () => {
  const entries = buildPortalSiteEntries({
    plan: "enterprise",
    status: "building",
    sites: [{ slug: "a" }, { slug: "b" }],
  });
  assert.deepEqual(entries.map((e) => e.plan), ["enterprise", "enterprise"]);
  assert.deepEqual(entries.map((e) => e.status), ["building", "building"]);
});

test("entries round-trip through upsertSite into a valid account", () => {
  const entries = buildPortalSiteEntries({
    plan: "enterprise",
    status: "live",
    sharedAirtableBaseId: "appSHARED",
    sites: [
      { slug: "acme-1", name: "Acme North", canonical: "https://north.acme.com", vercelProjectId: "prj_1" },
      { slug: "acme-2", name: "Acme South", fallbackCanonical: "https://acme-2.vercel.app", vercelProjectId: "prj_2" },
    ],
  });
  let acct = createAccount("owner@example.com", NOW);
  for (const e of entries) acct = upsertSite(acct, e, NOW);
  assert.equal(zPortalAccount.safeParse(acct).success, true);
  assert.deepEqual(acct.sites.map((s) => s.slug), ["acme-1", "acme-2"]);
  assert.equal(acct.sites[1].canonical, "https://acme-2.vercel.app");
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

// ── Feature availability ────────────────────────────────────────────────────

/** Shorthand: the state string for one feature on a site built from `overrides`. */
function featureState(overrides, feature) {
  return siteFeature(site("a", overrides), feature).state;
}

test("siteFeature: a fully provisioned growth site is ready across the board", () => {
  const wired = {
    plan: "growth",
    status: "live",
    airtableBaseId: "app1",
    vercelProjectId: "prj1",
    canonical: "https://example.com",
    // Provisioning alone does not unlock customer-facing SMS — the client's own A2P campaign
    // has to verify first, which takes 13–20 business days after launch.
    a2pStatus: "verified",
  };
  assert.deepEqual(siteFeatures(site("a", wired)), {
    calls: { state: "ready" },
    traffic: { state: "ready" },
    performance: { state: "ready" },
    leads: { state: "ready" },
    crm: { state: "ready" },
    messaging: { state: "ready" },
  });
});

test("siteFeature: a day-one growth site has everything but messaging", () => {
  // The realistic launch state: fully provisioned, A2P registration still pending. This is what
  // a Growth client actually sees for their first ~3 weeks, and it must read as progress.
  const dayOne = {
    plan: "growth",
    status: "live",
    airtableBaseId: "app1",
    vercelProjectId: "prj1",
    canonical: "https://example.com",
    a2pStatus: "brand-pending",
  };
  assert.deepEqual(siteFeatures(site("a", dayOne)), {
    calls: { state: "ready" },
    traffic: { state: "ready" },
    performance: { state: "ready" },
    leads: { state: "ready" },
    crm: { state: "ready" },
    messaging: { state: "connecting" },
  });
});

test("siteFeature: entitlement exclusion outranks build status", () => {
  // The precedence that makes this model worth having. A web-only site mid-build must be
  // told it has no call data — NOT "pending-build", which promises a feature it will never
  // receive no matter how long it waits.
  const webOnly = { plan: "starter", receptionistMode: "declined" };
  assert.equal(featureState({ ...webOnly, status: "building" }, "calls"), "not-on-plan");
  assert.equal(featureState({ ...webOnly, status: "live" }, "calls"), "not-on-plan");
  assert.equal(
    featureState({ ...webOnly, status: "live", airtableBaseId: "app1" }, "calls"),
    "not-on-plan",
    "even a stray stored base cannot grant a web-only site call data",
  );
});

test("siteFeature: a Starter site is no longer excluded from calls", () => {
  // The reprice gave every tier a receptionist. A Starter site mid-build is pending, not
  // excluded, and once live with a base it is ready — same as Growth.
  assert.equal(featureState({ plan: "starter", status: "building" }, "calls"), "pending-build");
  assert.equal(featureState({ plan: "starter", status: "live" }, "calls"), "connecting");
  assert.equal(
    featureState({ plan: "starter", status: "live", airtableBaseId: "app1" }, "calls"),
    "ready",
  );
});

test("siteFeature: an unasked activation choice does not strip call data", () => {
  // Pre-activation-step records have no `receptionistMode`. Reading undefined as "declined"
  // would retroactively remove the call log from every client who onboarded before the step
  // existed, so absent must mean "not yet asked".
  assert.equal(
    featureState({ plan: "starter", status: "live", airtableBaseId: "app1" }, "calls"),
    "ready",
  );
});

test("siteFeature: traffic and performance ship on every tier, web-only included", () => {
  const webOnlyLive = {
    plan: "starter",
    receptionistMode: "declined",
    status: "live",
    vercelProjectId: "prj1",
    canonical: "https://example.com",
  };
  assert.equal(featureState(webOnlyLive, "traffic"), "ready");
  assert.equal(featureState(webOnlyLive, "performance"), "ready");
});

test("siteFeature: an unbuilt site is pending-build regardless of stored ids", () => {
  for (const status of ["pending-onboarding", "building"]) {
    const s = { plan: "growth", status, airtableBaseId: "app1", vercelProjectId: "prj1", canonical: "https://x.com" };
    assert.equal(featureState(s, "calls"), "pending-build", status);
    assert.equal(featureState(s, "traffic"), "pending-build", status);
    assert.equal(featureState(s, "performance"), "pending-build", status);
  }
});

test("siteFeature: live but missing its id is 'connecting', not 'pending-build'", () => {
  // This is our drift, and the copy the client sees differs — so the states must differ.
  const live = { plan: "growth", status: "live" };
  assert.equal(featureState({ ...live, airtableBaseId: null }, "calls"), "connecting");
  assert.equal(featureState({ ...live, vercelProjectId: null }, "traffic"), "connecting");
  assert.equal(featureState({ ...live, canonical: undefined }, "performance"), "connecting");
});

test("siteFeature: blank and whitespace-only ids count as missing", () => {
  const live = { plan: "growth", status: "live" };
  assert.equal(featureState({ ...live, airtableBaseId: "" }, "calls"), "connecting");
  assert.equal(featureState({ ...live, vercelProjectId: "   " }, "traffic"), "connecting");
  assert.equal(featureState({ ...live, canonical: "  " }, "performance"), "connecting");
});

test("siteFeature: each feature reads its own id and ignores the others", () => {
  // A site can be partially connected; one missing id must not gate an unrelated tab.
  const partial = {
    plan: "growth",
    status: "live",
    airtableBaseId: "app1",
    vercelProjectId: null,
    canonical: "https://example.com",
  };
  assert.equal(featureState(partial, "calls"), "ready");
  assert.equal(featureState(partial, "traffic"), "connecting");
  assert.equal(featureState(partial, "performance"), "ready");
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
