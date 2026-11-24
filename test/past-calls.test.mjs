// v1.46.0 — past calls stay viewable after a downgrade to website (Xander, B4).
//
// A client who drops the receptionist keeps the calls it already answered. Before this, the
// first onboard re-run after a downgrade wrote the site as web-only, which nulls
// `airtableBaseId` and `retellAgentId`: the two ids the portal's call log, recording and
// transcript routes need. The history now lives on its own field, `callHistory`, which no
// writer clears, and a `pastCalls` feature says when the portal may show it.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createAccount,
  upsertSite,
  upsertSiteBySessionId,
  buildPortalSiteEntries,
  siteFeature,
  siteFeatures,
  zPortalSite,
  zPortalAccount,
} from "../dist/index.js";

const NOW = 1_700_000_000_000;
const ENDED = NOW + 1000;
const HISTORY = { airtableBaseId: "appCALLS", retellAgentId: "agent_OLD", endedAt: ENDED };

function site(overrides = {}) {
  return {
    slug: "acme",
    name: "Acme",
    plan: "website",
    status: "live",
    canonical: "https://acme.example",
    vercelProjectId: "prj_1",
    airtableBaseId: null,
    retellAgentId: null,
    receptionistMode: "declined",
    addedAt: NOW,
    ...overrides,
  };
}

test("zPortalSite keeps callHistory through a parse", () => {
  const parsed = zPortalSite.parse(site({ callHistory: HISTORY }));
  assert.deepEqual(parsed.callHistory, HISTORY);
  const noAgent = zPortalSite.parse(site({ callHistory: { ...HISTORY, retellAgentId: null } }));
  assert.equal(noAgent.callHistory.retellAgentId, null);
});

test("zPortalSite refuses a callHistory without a base", () => {
  assert.equal(zPortalSite.safeParse(site({ callHistory: { ...HISTORY, airtableBaseId: "" } })).success, false);
  assert.equal(zPortalSite.safeParse(site({ callHistory: { retellAgentId: null, endedAt: ENDED } })).success, false);
});

test("a site without callHistory still parses (v1.45.0 records)", () => {
  assert.equal(zPortalSite.safeParse(site()).success, true);
});

test("pastCalls: ready only for a web-only site that has callHistory", () => {
  assert.deepEqual(siteFeature(site({ callHistory: HISTORY }), "pastCalls"), { state: "ready" });
  // The legacy web-only shape counts too.
  assert.deepEqual(
    siteFeature(site({ plan: "starter", callHistory: HISTORY }), "pastCalls"),
    { state: "ready" },
  );
});

test("pastCalls: not-on-plan without history, or on a site that still has the receptionist", () => {
  assert.deepEqual(siteFeature(site(), "pastCalls"), { state: "not-on-plan" });
  // A receptionist site shows its calls through `calls`, never through `pastCalls`.
  const voice = site({
    plan: "starter",
    receptionistMode: "forwarded",
    airtableBaseId: "appLIVE",
    retellAgentId: "agent_LIVE",
    callHistory: HISTORY,
  });
  assert.deepEqual(siteFeature(voice, "pastCalls"), { state: "not-on-plan" });
});

test("siteFeatures includes pastCalls", () => {
  const all = siteFeatures(site({ callHistory: HISTORY }));
  assert.deepEqual(all.pastCalls, { state: "ready" });
  assert.deepEqual(all.calls, { state: "not-on-plan" });
});

test("a downgrade to website keeps callHistory through the onboard re-run", () => {
  // 1. A live Starter + AI site with its call base and agent.
  let account = {
    ...createAccount("owner@example.com", NOW),
    sites: [
      site({
        plan: "starter",
        receptionistMode: "forwarded",
        airtableBaseId: "appCALLS",
        retellAgentId: "agent_OLD",
      }),
    ],
  };

  // 2. The downgrade records the history and moves the plan.
  account = upsertSite(account, { slug: "acme", plan: "website", callHistory: HISTORY }, NOW + 1);

  // 3. onboard.js re-runs on the website plan: the entry nulls the live base and agent.
  const [entry] = buildPortalSiteEntries({
    plan: "website",
    status: "live",
    sites: [{ slug: "acme", receptionistDeclined: true }],
  });
  assert.equal("callHistory" in entry, false, "an entry never carries callHistory");
  account = upsertSite(account, entry, NOW + 2);

  const s = account.sites[0];
  assert.equal(s.airtableBaseId, null);
  assert.equal(s.retellAgentId, null);
  assert.deepEqual(s.callHistory, HISTORY);
  assert.deepEqual(siteFeature(s, "calls"), { state: "not-on-plan" });
  assert.deepEqual(siteFeature(s, "pastCalls"), { state: "ready" });
  assert.equal(zPortalAccount.safeParse(account).success, true);
});

test("upsertSite never clears callHistory, even when a writer passes null", () => {
  const account = { ...createAccount("owner@example.com", NOW), sites: [site({ callHistory: HISTORY })] };
  const afterNull = upsertSite(account, { slug: "acme", callHistory: null }, NOW + 1);
  assert.deepEqual(afterNull.sites[0].callHistory, HISTORY);
  const afterUndefined = upsertSite(account, { slug: "acme", callHistory: undefined, name: "Acme 2" }, NOW + 1);
  assert.deepEqual(afterUndefined.sites[0].callHistory, HISTORY);
  assert.equal(afterUndefined.sites[0].name, "Acme 2");
});

test("upsertSite can replace callHistory with a newer one", () => {
  const account = { ...createAccount("owner@example.com", NOW), sites: [site({ callHistory: HISTORY })] };
  const newer = { airtableBaseId: "appCALLS", retellAgentId: "agent_NEWER", endedAt: ENDED + 5 };
  const next = upsertSite(account, { slug: "acme", callHistory: newer }, NOW + 1);
  assert.deepEqual(next.sites[0].callHistory, newer);
});

test("a new site inserted with a null callHistory does not store the null", () => {
  const account = createAccount("owner@example.com", NOW);
  const next = upsertSite(account, { slug: "fresh", plan: "website", callHistory: null }, NOW);
  assert.equal("callHistory" in next.sites[0], false);
});

test("upsertSiteBySessionId never clears callHistory either", () => {
  const account = {
    ...createAccount("owner@example.com", NOW),
    sites: [site({ sessionId: "cs_1", callHistory: HISTORY })],
  };
  const next = upsertSiteBySessionId(account, "cs_1", { slug: "acme", callHistory: null }, NOW + 1);
  assert.deepEqual(next.sites[0].callHistory, HISTORY);
});
