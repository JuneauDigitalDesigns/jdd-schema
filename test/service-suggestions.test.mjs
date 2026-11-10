// v1.33.0 (Xander, 2026-11-10, "Move them now"): the approved suggestion chips live on the
// industry menu, so the agency onboarding form and the console intake show the same lists.
// v1.33.1: HVAC batch 2, approved as drafted on 2026-11-10 ("Approve all as drafted"): the other
// ten HVAC services and Furnace's questions. HVAC is complete.
// v1.33.2: every other trade (roofing, plumbing, lawn-care, car-detailing, health), one batch per
// trade, all approved as drafted on 2026-11-10 ("Approve all as drafted"). Every trade is complete.
//
// The fixtures are the approved sets exactly as Xander signed them off:
// - test/fixtures/hvac-suggestions-approved.json (exported from the agency's wizard on PR #93);
// - test/fixtures/trade-suggestions-approved.json (the review page's draft, approved unchanged).
// The menu must match them string for string.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { serviceSuggestions, INDUSTRY_MENUS } from "../dist/index.js";

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const approved = { ...fixture("hvac-suggestions-approved.json"), ...fixture("trade-suggestions-approved.json") };
const NONE = { included: [], jobs: [], questions: [] };

test("the approved sets cover exactly the trades on the menu", () => {
  assert.deepEqual(Object.keys(approved).sort(), INDUSTRY_MENUS.map((m) => m.id).sort());
});

for (const menu of INDUSTRY_MENUS) {
  test(`${menu.id} suggestions match the approved set word for word`, () => {
    const labels = menu.services.map((s) => s.label);
    assert.deepEqual(Object.keys(approved[menu.id]).sort(), [...labels].sort(), `approved set covers exactly the ${menu.id} menu`);
    for (const label of labels) {
      assert.deepEqual(serviceSuggestions(menu.id, label), approved[menu.id][label], `${menu.id} / ${label}`);
    }
  });
}

test("matched by label, trimmed and case-insensitive", () => {
  const furnace = serviceSuggestions("hvac", "  furnace repair & replacement ");
  assert.deepEqual(furnace, approved.hvac["Furnace Repair & Replacement"]);
  assert.equal(furnace.questions[0], "Should I repair or replace my furnace?");
  assert.deepEqual(serviceSuggestions("plumbing", "drain clearing"), approved.plumbing["Drain Clearing"]);
});

test("a hand-typed name, a tag or another trade's service gives nothing", () => {
  assert.deepEqual(serviceSuggestions("hvac", "AC Repair"), NONE);
  assert.deepEqual(serviceSuggestions("hvac", "Cooling"), NONE);
  assert.deepEqual(serviceSuggestions("plumbing", "AC Installation & Service"), NONE);
  assert.deepEqual(serviceSuggestions("roofing", "Repairs"), NONE);
  assert.deepEqual(serviceSuggestions("unknown-trade", "Drain Clearing"), NONE);
});

test("no list repeats a chip or uses an en or em dash", () => {
  for (const menu of INDUSTRY_MENUS) for (const s of menu.services) for (const list of ["included", "jobs", "questions"]) {
    const items = s[list] ?? [];
    assert.equal(new Set(items).size, items.length, `${menu.id} / ${s.label} / ${list} repeats a chip`);
    for (const item of items) assert.doesNotMatch(item, /[–—]/, `${item} has a long dash`);
  }
});
