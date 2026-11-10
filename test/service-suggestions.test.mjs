// v1.33.0 (Xander, 2026-11-10, "Move them now"): the approved suggestion chips live on the
// industry menu, so the agency onboarding form and the console intake show the same lists.
// Only approved batches: HVAC "AC Installation & Service" (all three) and "Furnace Repair &
// Replacement" (included and jobs; its questions were left empty on purpose).
import { test } from "node:test";
import assert from "node:assert/strict";
import { serviceSuggestions, INDUSTRY_MENUS } from "../dist/index.js";

test("approved HVAC lists, word for word, matched by label", () => {
  const ac = serviceSuggestions("hvac", "AC Installation & Service");
  assert.equal(ac.included.length, 9);
  assert.equal(ac.jobs[0], "AC blowing warm air");
  assert.equal(ac.questions[0], "Should I repair or replace my AC?");
  const furnace = serviceSuggestions("hvac", "  furnace repair & replacement ");
  assert.equal(furnace.included[0], "Safety inspection");
  assert.equal(furnace.jobs.length, 9);
  assert.deepEqual(furnace.questions, []);
});

test("no approved batch, a hand-typed name or a tag gives nothing", () => {
  assert.deepEqual(serviceSuggestions("hvac", "Heat Pump Installation"), { included: [], jobs: [], questions: [] });
  assert.deepEqual(serviceSuggestions("hvac", "AC Repair"), { included: [], jobs: [], questions: [] });
  assert.deepEqual(serviceSuggestions("hvac", "Cooling"), { included: [], jobs: [], questions: [] });
  assert.deepEqual(serviceSuggestions("plumbing", "AC Installation & Service"), { included: [], jobs: [], questions: [] });
});

test("only HVAC carries suggestions in this release", () => {
  const withAny = INDUSTRY_MENUS.flatMap((m) => m.services.filter((s) => s.included || s.jobs || s.questions).map((s) => `${m.id}:${s.label}`));
  assert.deepEqual(withAny.sort(), ["hvac:AC Installation & Service", "hvac:Furnace Repair & Replacement"]);
});
