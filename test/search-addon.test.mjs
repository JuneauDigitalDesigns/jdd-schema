// The Search add-on ($197 a month, per site; Search Console session, 2026-11-16) is billed as a
// second item on the site's Stripe subscription. The agency's Stripe webhook mirrors it onto the
// site as `searchAddon`, and the weekly search job, notices and facts wizard gate on that. Sales
// calls take it as `OperatorOrder.addons.search`.
//
// On v1.36.0 these fail: zod strips unknown keys, so `getAccount` dropped `searchAddon` on every
// read and nothing could ever see the add-on as on, and an order's `addons` vanished the same way.
import { test } from "node:test";
import assert from "node:assert/strict";
import { upsertSite, zOperatorOrder, zPortalAccount } from "../dist/index.js";

const NOW = 1_700_000_000_000;
const site = (extra = {}) => ({
  slug: "acme",
  plan: "growth",
  status: "live",
  addedAt: NOW,
  ...extra,
});
const account = (sites) => ({ email: "a@b.c", sites, createdAt: NOW, updatedAt: NOW });

test("a site's search add-on survives a read of the account", () => {
  const active = { status: "active", since: NOW };
  const ending = { status: "ending", since: NOW, endsAt: NOW + 86_400_000 };
  const scheduled = { status: "scheduled", since: NOW, startsAt: NOW + 86_400_000 };
  for (const searchAddon of [active, ending, scheduled]) {
    const parsed = zPortalAccount.parse(account([site({ searchAddon })]));
    assert.deepEqual(parsed.sites[0].searchAddon, searchAddon);
  }
  // Absent means no add-on, and parses as before.
  assert.equal(zPortalAccount.parse(account([site()])).sites[0].searchAddon, undefined);
});

// The Search Console session gates on "scheduled means not on yet" and shows "Starts {date}"
// (D3, 2026-11-16). A scheduled add-on with no date would show "Starts undefined".
test("a scheduled add-on must say when it starts", () => {
  assert.throws(() => zPortalAccount.parse(account([site({ searchAddon: { status: "scheduled", since: NOW } })])));
});

test("only the three states are accepted", () => {
  assert.throws(() => zPortalAccount.parse(account([site({ searchAddon: { status: "on", since: NOW } })])));
  assert.throws(() => zPortalAccount.parse(account([site({ searchAddon: { status: "active" } })])));
});

test("upsertSite writes and keeps the add-on like any other site field", () => {
  const acct = account([site()]);
  const on = upsertSite(acct, { slug: "acme", searchAddon: { status: "active", since: NOW } }, NOW + 1);
  assert.equal(on.sites[0].searchAddon?.status, "active");
  // A later write about something else leaves it alone.
  const later = upsertSite(on, { slug: "acme", plan: "starter" }, NOW + 2);
  assert.equal(later.sites[0].searchAddon?.status, "active");
});

test("an operator order can carry the add-on, and orders without it still parse", () => {
  const shape = zOperatorOrder.shape;
  assert.ok("addons" in shape, "OperatorOrder has addons");
  assert.deepEqual(shape.addons.parse({ search: true }), { search: true });
  assert.equal(shape.addons.parse(undefined), undefined);
});
