import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clientKey,
  clientBySlugKey,
  clientByEmailKey,
  createClientRecord,
  deriveStage,
  applyStage,
  setStageOverride,
  linkLead,
  attachSlug,
  recordOverage,
  recordPayment,
  tenureMonths,
  zClientRecord,
  STAGE_ORDER,
  AT_RISK_BREAKAGE_THRESHOLD,
} from "../dist/index.js";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function record(overrides = {}) {
  return { ...createClientRecord({ id: "c_1", email: "owner@example.com" }, NOW), ...overrides };
}

// ── keys ────────────────────────────────────────────────────────────────────

test("keys use the jdd: namespace", () => {
  assert.equal(clientKey("c_1"), "jdd:client:c_1");
  assert.equal(clientBySlugKey("hgco"), "jdd:client:by-slug:hgco");
});

test("clientByEmailKey normalizes the same way accountKey does", () => {
  // If these disagree, the two indexes point at different people for the same human.
  assert.equal(clientByEmailKey("  Owner@Example.COM "), "jdd:client:by-email:owner@example.com");
});

// ── stage precedence: rule by rule, in order ────────────────────────────────

test("1 — operator override beats every derived rule", () => {
  const r = deriveStage(
    {
      stageOverride: "dormant",
      cancel: { requestedAt: NOW - DAY, effectiveAt: NOW - 1 },
      subscription: "trouble",
      hasClientFolder: true,
    },
    NOW,
  );
  assert.equal(r.stage, "dormant");
  assert.equal(r.unbilled, false);
});

test("dormant is reachable ONLY by override", () => {
  // No combination of automatic evidence should produce it — the triggers we chose
  // (payment trouble, repeated breakage) are all at-risk-shaped.
  const combos = [
    { subscription: "active", hasClientFolder: true, disk: "live", portal: "live" },
    { subscription: "active", hasClientFolder: true, breakages30d: 9 },
    { subscription: "trouble", hasClientFolder: true },
    { subscription: null, hasClientFolder: true, disk: "live" },
    { hasPaid: true },
    {},
  ];
  for (const c of combos) {
    assert.notEqual(deriveStage(c, NOW).stage, "dormant");
  }
});

test("2 — cancellation past its effective date is churned", () => {
  const r = deriveStage(
    { cancel: { requestedAt: NOW - 40 * DAY, effectiveAt: NOW - DAY }, subscription: "active" },
    NOW,
  );
  assert.equal(r.stage, "churned");
});

test("3 — cancellation still in notice is cancelling, and outranks at-risk", () => {
  const r = deriveStage(
    {
      cancel: { requestedAt: NOW - DAY, effectiveAt: NOW + 20 * DAY },
      subscription: "trouble",
      breakages30d: 5,
    },
    NOW,
  );
  assert.equal(r.stage, "cancelling");
});

test("4 — payment trouble is at-risk", () => {
  assert.equal(deriveStage({ subscription: "trouble", hasClientFolder: true }, NOW).stage, "at-risk");
});

test("4 — repeated breakage on an active sub is at-risk at the threshold, not below", () => {
  const base = { subscription: "active", hasClientFolder: true, disk: "live", portal: "live" };
  assert.equal(
    deriveStage({ ...base, breakages30d: AT_RISK_BREAKAGE_THRESHOLD - 1 }, NOW).stage,
    "live",
  );
  assert.equal(deriveStage({ ...base, breakages30d: AT_RISK_BREAKAGE_THRESHOLD }, NOW).stage, "at-risk");
});

test("5 — live requires BOTH disk and portal to agree", () => {
  const base = { subscription: "active", hasClientFolder: true };
  assert.equal(deriveStage({ ...base, disk: "live", portal: "live" }, NOW).stage, "live");
});

test("5 — portal lagging disk does not claim live", () => {
  // Disk shipped but the portal record was never updated. Claiming live here would hide
  // exactly the drift gap 12 exists to surface.
  const r = deriveStage(
    { subscription: "active", hasClientFolder: true, disk: "live", portal: "building" },
    NOW,
  );
  assert.notEqual(r.stage, "live");
});

test("6 — paying and mid-provisioning maps disk status onto a stage", () => {
  const base = { subscription: "active", hasClientFolder: true, portal: "building" };
  assert.equal(deriveStage({ ...base, disk: "needs-build" }, NOW).stage, "building");
  assert.equal(deriveStage({ ...base, disk: "ready" }, NOW).stage, "building");
  assert.equal(deriveStage({ ...base, disk: "provisioned" }, NOW).stage, "provisioned");
  assert.equal(deriveStage({ ...base, disk: "portal-pending" }, NOW).stage, "provisioned");
});

test("7 — paid with no folder yet is won", () => {
  const r = deriveStage({ hasPaid: true, hasClientFolder: false }, NOW);
  assert.equal(r.stage, "won");
});

test("8 — a folder with no subscription keeps its real stage AND flags unbilled", () => {
  // The whole point: never silently downgrade a live client to "lead" because Stripe
  // came back empty. They are being served for free and that must be visible.
  const r = deriveStage({ hasClientFolder: true, disk: "live", subscription: null }, NOW);
  assert.equal(r.stage, "live");
  assert.equal(r.unbilled, true);
});

test("8 — an ENDED subscription is not 'unbilled'", () => {
  // Nothing to fix: they left. Unbilled means "should be paying and isn't".
  const r = deriveStage({ hasClientFolder: true, disk: "live", subscription: "ended" }, NOW);
  assert.equal(r.unbilled, false);
  assert.match(r.reason, /ended/i);
});

test("9 — nothing paid, nothing built is a lead", () => {
  const r = deriveStage({}, NOW);
  assert.equal(r.stage, "lead");
  assert.equal(r.unbilled, false);
});

test("every derived stage is a member of STAGE_ORDER", () => {
  const cases = [
    {},
    { hasPaid: true },
    { hasClientFolder: true, disk: "live" },
    { subscription: "active", hasClientFolder: true, disk: "live", portal: "live" },
    { subscription: "trouble" },
    { cancel: { requestedAt: NOW, effectiveAt: NOW + DAY } },
    { cancel: { requestedAt: NOW, effectiveAt: NOW - DAY } },
  ];
  for (const c of cases) {
    assert.ok(STAGE_ORDER.includes(deriveStage(c, NOW).stage));
  }
});

// ── enterprise ──────────────────────────────────────────────────────────────

test("attachSlug on an enterprise client keeps every site slug", () => {
  const r = attachSlug(record(), "acme", ["acme-1", "acme-2", "acme-3"], NOW);
  assert.equal(r.slug, "acme");
  assert.deepEqual(r.siteSlugs, ["acme-1", "acme-2", "acme-3"]);
});

test("attachSlug on a single-site client defaults siteSlugs to the base slug", () => {
  // Reconcile iterates siteSlugs; leaving it empty would silently check nothing.
  const r = attachSlug(record(), "hgco", undefined, NOW);
  assert.deepEqual(r.siteSlugs, ["hgco"]);
});

// ── stage application ───────────────────────────────────────────────────────

test("applyStage does not move stageUpdatedAt when the stage is unchanged", () => {
  // A sweep over a settled roster must not rewrite timestamps, or "how long has this
  // been live" degrades into "when did you last open the console".
  const before = record({ stage: "live", stageUpdatedAt: NOW - 90 * DAY });
  const after = applyStage(before, { stage: "live", reason: "x", unbilled: false }, NOW);
  assert.equal(after.stageUpdatedAt, NOW - 90 * DAY);
  assert.equal(after, before);
});

test("applyStage moves the timestamp on a real transition", () => {
  const before = record({ stage: "live", stageUpdatedAt: NOW - 90 * DAY });
  const after = applyStage(before, { stage: "at-risk", reason: "x", unbilled: false }, NOW);
  assert.equal(after.stage, "at-risk");
  assert.equal(after.stageUpdatedAt, NOW);
});

test("clearing the override hands the record back to the rules", () => {
  const r = setStageOverride(record({ stageOverride: "dormant" }), null, NOW);
  assert.equal(r.stageOverride, null);
  assert.equal(deriveStage({ stageOverride: r.stageOverride, hasPaid: true }, NOW).stage, "won");
});

// ── ledger ──────────────────────────────────────────────────────────────────

test("recordOverage is idempotent per billing period", () => {
  // Re-running the metering cron must not double-count, or the upsell number is wrong.
  let r = record();
  r = recordOverage(r, { periodEnd: NOW, minutes: 40, billedCents: 2000 }, NOW);
  r = recordOverage(r, { periodEnd: NOW, minutes: 55, billedCents: 2750 }, NOW);
  assert.equal(r.ledger.overages.length, 1);
  assert.equal(r.ledger.overages[0].minutes, 55);
});

test("recordOverage keeps periods sorted oldest first", () => {
  let r = record();
  r = recordOverage(r, { periodEnd: NOW + 60 * DAY, minutes: 1, billedCents: 50 }, NOW);
  r = recordOverage(r, { periodEnd: NOW, minutes: 2, billedCents: 100 }, NOW);
  assert.deepEqual(
    r.ledger.overages.map((o) => o.periodEnd),
    [NOW, NOW + 60 * DAY],
  );
});

test("recordPayment accumulates and sets firstPaidAt once", () => {
  let r = recordPayment(record(), 29900, NOW, NOW);
  r = recordPayment(r, 29900, NOW + 30 * DAY, NOW + 30 * DAY);
  assert.equal(r.ledger.ltvCents, 59800);
  assert.equal(r.ledger.firstPaidAt, NOW);
});

test("tenureMonths is 0 before any payment", () => {
  assert.equal(tenureMonths(record(), NOW), 0);
});

test("tenureMonths counts whole months only", () => {
  const paid = recordPayment(record(), 100, Date.UTC(2026, 0, 15), NOW);
  assert.equal(tenureMonths(paid, Date.UTC(2026, 2, 14)), 1); // a day short of 2
  assert.equal(tenureMonths(paid, Date.UTC(2026, 2, 15)), 2);
});

// ── validation ──────────────────────────────────────────────────────────────

test("a freshly created record validates", () => {
  const parsed = zClientRecord.safeParse(createClientRecord({ id: "c_1", email: "A@B.com" }, NOW));
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.email, "a@b.com");
});

test("an unknown stage is rejected", () => {
  const bad = { ...record(), stage: "vibing" };
  assert.equal(zClientRecord.safeParse(bad).success, false);
});

test("linkLead records the reverse link", () => {
  assert.equal(linkLead(record(), "lead_9", NOW).leadId, "lead_9");
});
