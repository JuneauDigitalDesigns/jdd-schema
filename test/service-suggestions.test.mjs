// v1.33.0 (Xander, 2026-11-10, "Move them now"): the approved suggestion chips live on the
// industry menu, so the agency onboarding form and the console intake show the same lists.
// v1.33.1: HVAC batch 2, approved as drafted on 2026-11-10 ("Approve all as drafted"): the other
// ten HVAC services and Furnace's questions. HVAC is complete; no other trade has a batch yet.
//
// test/fixtures/hvac-suggestions-approved.json is the approved set exactly as Xander signed it off
// (exported from the agency's wizard/service-suggestions.ts on agency PR #93). The menu must match
// it string for string.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { serviceSuggestions, INDUSTRY_MENUS } from "../dist/index.js";

const approved = JSON.parse(readFileSync(new URL("./fixtures/hvac-suggestions-approved.json", import.meta.url), "utf8"));
const NONE = { included: [], jobs: [], questions: [] };

test("HVAC suggestions match the approved set word for word", () => {
  const hvac = INDUSTRY_MENUS.find((m) => m.id === "hvac");
  const labels = hvac.services.map((s) => s.label);
  assert.deepEqual(Object.keys(approved), ["hvac"]);
  assert.deepEqual(Object.keys(approved.hvac).sort(), [...labels].sort(), "approved set covers exactly the HVAC menu");
  for (const label of labels) {
    assert.deepEqual(serviceSuggestions("hvac", label), approved.hvac[label], label);
  }
});

test("matched by label, trimmed and case-insensitive", () => {
  const furnace = serviceSuggestions("hvac", "  furnace repair & replacement ");
  assert.deepEqual(furnace, approved.hvac["Furnace Repair & Replacement"]);
  assert.equal(furnace.questions[0], "Should I repair or replace my furnace?");
});

test("a hand-typed name, a tag or a trade with no batch gives nothing", () => {
  assert.deepEqual(serviceSuggestions("hvac", "AC Repair"), NONE);
  assert.deepEqual(serviceSuggestions("hvac", "Cooling"), NONE);
  assert.deepEqual(serviceSuggestions("plumbing", "AC Installation & Service"), NONE);
  assert.deepEqual(serviceSuggestions("plumbing", "Drain Clearing"), NONE);
});

test("only HVAC carries suggestions in this release", () => {
  const withAny = INDUSTRY_MENUS.flatMap((m) => m.services.filter((s) => s.included || s.jobs || s.questions).map(() => m.id));
  assert.deepEqual([...new Set(withAny)], ["hvac"]);
});
