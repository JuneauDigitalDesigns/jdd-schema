import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ORDER_STATUSES,
  canTransition,
  resumeStepFor,
  readinessFor,
  zOperatorOrder,
  zPortalAccount,
} from "../dist/index.js";

const NOW = 1_700_000_000_000;

/** A paid, converted Growth order. Override to produce the case under test. */
function order(overrides = {}) {
  return {
    id: "ord_1",
    version: 1,
    source: "operator-call",
    status: "fulfilled",
    leadId: "lead_1",
    siteSlug: "rivera-plumbing",
    plan: "growth",
    period: "monthly",
    pricing: { kind: "standard" },
    client: {
      legalName: "Rivera Plumbing & Drain LLC",
      entityType: "LLC",
      address: "1420 Example Ave, Orlando, FL 32801",
      contactTitle: "Owner",
      contactName: "Marisol Rivera",
      email: "marisol@riverapd.example",
      phone: "+14075550143",
    },
    vertical: "plumbing",
    receptionistMode: "forwarded",
    forwardingNumber: "(407) 555-0188",
    operator: "xander",
    convertedAt: NOW,
    invite: { kind: "invitation", invitationId: "inv_1", sentAt: NOW },
    events: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

test("the fixture order parses", () => {
  assert.equal(zOperatorOrder.safeParse(order()).success, true);
});

// ── canTransition ───────────────────────────────────────────────────────────

test("canTransition: the happy path is legal end to end", () => {
  const path = ["draft", "terms-accepted", "awaiting-payment", "paid", "fulfilled"];
  for (let i = 1; i < path.length; i++) {
    assert.equal(canTransition(path[i - 1], path[i]), true, `${path[i - 1]} → ${path[i]}`);
  }
});

test("canTransition: an expired link can be resent, a fulfilled order can't move", () => {
  assert.equal(canTransition("awaiting-payment", "expired"), true);
  assert.equal(canTransition("expired", "awaiting-payment"), true);
  for (const to of ORDER_STATUSES) {
    if (to === "fulfilled") continue;
    assert.equal(canTransition("fulfilled", to), false, `fulfilled → ${to}`);
  }
});

test("canTransition: no skipping terms, and a paid order can never be cancelled", () => {
  // Skipping terms would charge a client who agreed to nothing; cancelling a paid order would
  // leave a live subscription behind a record that says it never happened.
  assert.equal(canTransition("draft", "awaiting-payment"), false);
  assert.equal(canTransition("draft", "paid"), false);
  assert.equal(canTransition("paid", "cancelled"), false);
  assert.equal(canTransition("cancelled", "draft"), false);
});

// ── resumeStepFor ───────────────────────────────────────────────────────────

test("resumeStepFor: one case per row of the resume table", () => {
  const cases = [
    [null, null, "order"],
    [order({ status: "draft" }), null, "order"],
    [order({ status: "terms-accepted" }), null, "payment"],
    [order({ status: "awaiting-payment" }), null, "payment"],
    [order({ status: "expired" }), null, "payment"],
    [order({ status: "paid", convertedAt: undefined }), null, "setup"],
    [order({ status: "fulfilled" }), "none", "sms"],
    [order({ status: "fulfilled" }), null, "sms"],
    [order({ status: "fulfilled" }), "profile-pending", "sms"],
    [order({ status: "fulfilled" }), "profile-approved", "sms"],
    [order({ status: "fulfilled" }), "failed", "sms"],
    [order({ status: "fulfilled" }), "brand-pending", "done"],
    [order({ status: "fulfilled" }), "verified", "done"],
  ];
  for (const [o, a2p, want] of cases) {
    assert.equal(resumeStepFor({ order: o, a2pStatus: a2p }), want, `${o?.status ?? "none"} / ${a2p}`);
  }
});

test("resumeStepFor: Starter never lands on the SMS step", () => {
  assert.equal(resumeStepFor({ order: order({ plan: "starter" }), a2pStatus: null }), "done");
});

// ── readinessFor ────────────────────────────────────────────────────────────

const values = (lights) => Object.fromEntries(lights.map((l) => [l.id, l.value]));

test("readinessFor: Starter shows SMS as not needed", () => {
  const lights = readinessFor({
    order: order({ plan: "starter" }),
    site: { status: "pending-onboarding", onboardingCompletedAt: null },
    clientSignedIn: false,
    plan: "starter",
    a2pStatus: null,
  });
  assert.deepEqual(values(lights), {
    payment: "Paid",
    onboarding: "Invite sent",
    "sms-brand": "Not needed",
    "sms-campaign": "Not needed",
  });
});

test("readinessFor: a registration saved without the EIN reads 'Needs EIN', not 'Not started'", () => {
  const lights = readinessFor({
    order: order(),
    site: { status: "building", onboardingCompletedAt: NOW },
    clientSignedIn: true,
    plan: "growth",
    a2pStatus: "none",
    a2pNeedsEin: true,
  });
  const brand = lights.find((l) => l.id === "sms-brand");
  assert.equal(brand.value, "Needs EIN");
  assert.equal(brand.tone, "warn");
  assert.equal(values(lights).onboarding, "Submitted");
});

test("readinessFor: an unpaid link is flagged, not shown as done", () => {
  const lights = readinessFor({
    order: order({ status: "awaiting-payment", convertedAt: undefined, invite: undefined }),
    site: null,
    clientSignedIn: false,
    plan: "growth",
    a2pStatus: null,
  });
  assert.deepEqual(values(lights), {
    payment: "Link sent",
    onboarding: "Not yet",
    "sms-brand": "Not started",
    "sms-campaign": "Up next",
  });
});

// ── PortalSite ──────────────────────────────────────────────────────────────

test("zPortalAccount keeps slugLocked and orderId through a parse", () => {
  // zPortalSite is a plain z.object, which strips unknown keys. Before these fields existed, the
  // first getAccount() after fulfilment dropped slugLocked, and portal onboarding renamed the
  // slug the A2P record and the clients/ folder were already keyed on.
  const parsed = zPortalAccount.parse({
    email: "marisol@riverapd.example",
    sites: [
      {
        slug: "rivera-plumbing",
        plan: "growth",
        status: "pending-onboarding",
        addedAt: NOW,
        orderId: "ord_1",
        slugLocked: true,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  });
  assert.equal(parsed.sites[0].slugLocked, true);
  assert.equal(parsed.sites[0].orderId, "ord_1");
});
