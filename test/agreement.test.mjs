import { test } from "node:test";
import assert from "node:assert/strict";
import {
  tierAtLeast,
  masterNeedsResign,
  raiseTierCeiling,
  legacyMasterFrom,
  zMasterAgreementRef,
  LEGACY_AGREEMENT_VERSION,
} from "../dist/index.js";

const NOW = 1_700_000_000_000;
const V4 = "v4";

function master(overrides = {}) {
  return {
    agreementId: "agr_1",
    version: V4,
    tierCeiling: "growth",
    signedAt: NOW,
    ...overrides,
  };
}

// ── tierAtLeast ─────────────────────────────────────────────────────────────

test("tier ranking is starter < growth < enterprise", () => {
  assert.equal(tierAtLeast("enterprise", "starter"), true);
  assert.equal(tierAtLeast("growth", "growth"), true);
  assert.equal(tierAtLeast("starter", "growth"), false);
});

// ── masterNeedsResign ───────────────────────────────────────────────────────

test("no master means a full signature", () => {
  assert.equal(masterNeedsResign(null, V4, "starter"), true);
  assert.equal(masterNeedsResign(undefined, V4, "starter"), true);
});

test("a current master at or above the requested tier takes an addendum", () => {
  assert.equal(masterNeedsResign(master(), V4, "starter"), false);
  assert.equal(masterNeedsResign(master(), V4, "growth"), false);
  assert.equal(
    masterNeedsResign(master({ tierCeiling: "enterprise" }), V4, "growth"),
    false,
  );
});

test("a terms version bump forces a fresh master", () => {
  assert.equal(masterNeedsResign(master(), "v5", "starter"), true);
});

test("buying above the ceiling forces a fresh master", () => {
  // Terms and Schedule A differ per plan, so growth terms never contemplated enterprise.
  assert.equal(masterNeedsResign(master({ tierCeiling: "growth" }), V4, "enterprise"), true);
  assert.equal(masterNeedsResign(master({ tierCeiling: "starter" }), V4, "growth"), true);
});

test("a legacy master is honoured until the terms actually change", () => {
  const legacy = master({ agreementId: null, version: LEGACY_AGREEMENT_VERSION });
  // Their own version never equals the current one, so a legacy record always re-signs on a
  // real purchase — which is the conservative half. What it must NOT do is 500 or crash.
  assert.equal(masterNeedsResign(legacy, LEGACY_AGREEMENT_VERSION, "starter"), false);
  assert.equal(masterNeedsResign(legacy, V4, "starter"), true);
});

// ── raiseTierCeiling ────────────────────────────────────────────────────────

test("the ceiling rises but never falls", () => {
  const m = master({ tierCeiling: "growth" });
  assert.equal(raiseTierCeiling(m, "enterprise").tierCeiling, "enterprise");
  assert.equal(raiseTierCeiling(m, "starter").tierCeiling, "growth");
});

test("raising to the same tier returns the identical object", () => {
  const m = master({ tierCeiling: "growth" });
  assert.equal(raiseTierCeiling(m, "growth"), m);
});

// ── legacyMasterFrom ────────────────────────────────────────────────────────

test("a pre-cutover account infers its ceiling from what it already pays for", () => {
  const inferred = legacyMasterFrom([
    { plan: "starter", addedAt: NOW + 500 },
    { plan: "growth", addedAt: NOW },
  ]);
  assert.equal(inferred.tierCeiling, "growth");
  assert.equal(inferred.version, LEGACY_AGREEMENT_VERSION);
  assert.equal(inferred.agreementId, null);
  assert.equal(inferred.signedAt, NOW, "dates from the earliest site");
});

test("an account with no sites has nothing to infer from", () => {
  assert.equal(legacyMasterFrom([]), null);
});

// ── zod ─────────────────────────────────────────────────────────────────────

test("the master ref round-trips through its zod schema", () => {
  const parsed = zMasterAgreementRef.safeParse(master());
  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data, master());
});

test("a null agreementId is valid — reconstructed masters have no record", () => {
  assert.equal(zMasterAgreementRef.safeParse(master({ agreementId: null })).success, true);
});
