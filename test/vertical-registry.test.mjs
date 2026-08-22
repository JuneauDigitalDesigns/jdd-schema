import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_VERTICALS,
  mergeVerticalOverrides,
  VERTICAL_IDS,
  INDUSTRY_MENUS,
} from "../dist/index.js";

// ── BUILT_IN_VERTICALS mirrors INDUSTRY_MENUS ───────────────────────────────

test("BUILT_IN_VERTICALS has exactly one entry per vertical, matching INDUSTRY_MENUS ids", () => {
  assert.deepEqual(
    BUILT_IN_VERTICALS.map((v) => v.id).sort(),
    [...VERTICAL_IDS].sort(),
  );
});

test("every built-in vertical's services/differentiators/customers match its industry menu exactly", () => {
  // BUILT_IN_VERTICALS is derived FROM INDUSTRY_MENUS (not the reverse) specifically so
  // this can never drift — a change to one menu should show up here automatically.
  for (const v of BUILT_IN_VERTICALS) {
    const menu = INDUSTRY_MENUS.find((m) => m.id === v.id);
    assert.ok(menu, `no industry menu for built-in vertical ${v.id}`);
    assert.deepEqual(v.services, menu.services);
    assert.deepEqual(v.differentiators, menu.differentiators);
    assert.deepEqual(v.customers, menu.customers);
  }
});

test("every built-in vertical carries a non-empty prompt role and no baseVerticalId", () => {
  for (const v of BUILT_IN_VERTICALS) {
    assert.ok(v.prompt.role.trim().length > 0, `${v.id} has an empty prompt role`);
    assert.equal(v.baseVerticalId, undefined, `${v.id} should not have a baseVerticalId`);
  }
});

test("only health carries guardrails text", () => {
  for (const v of BUILT_IN_VERTICALS) {
    if (v.id === "health") {
      assert.ok(v.prompt.guardrails.length > 0);
    } else {
      assert.equal(v.prompt.guardrails, "");
    }
  }
});

test("every built-in vertical's structure matches DEFAULT_STRUCTURE", () => {
  for (const v of BUILT_IN_VERTICALS) {
    assert.equal(v.structure.pillars, 3);
    assert.equal(v.structure.faq, 6);
  }
});

// ── mergeVerticalOverrides ───────────────────────────────────────────────────

test("mergeVerticalOverrides with no overrides returns the built-ins unchanged", () => {
  assert.deepEqual(mergeVerticalOverrides(BUILT_IN_VERTICALS, null), BUILT_IN_VERTICALS);
  assert.deepEqual(
    mergeVerticalOverrides(BUILT_IN_VERTICALS, { overrides: [], customs: [] }),
    BUILT_IN_VERTICALS,
  );
});

test("an override replaces only the fields it carries, on the matching built-in", () => {
  const merged = mergeVerticalOverrides(BUILT_IN_VERTICALS, {
    overrides: [{ id: "hvac", label: "Heating & Air" }],
    customs: [],
  });
  const hvac = merged.find((v) => v.id === "hvac");
  assert.equal(hvac.label, "Heating & Air");
  // Untouched fields survive.
  assert.deepEqual(hvac.services, BUILT_IN_VERTICALS.find((v) => v.id === "hvac").services);
  // Every other vertical is untouched.
  for (const v of merged) {
    if (v.id === "hvac") continue;
    assert.deepEqual(v, BUILT_IN_VERTICALS.find((b) => b.id === v.id));
  }
});

test("a custom vertical is appended after the built-ins", () => {
  const custom = {
    id: "landscaping-premium",
    label: "Premium Landscaping",
    baseVerticalId: "lawn-care",
    services: [],
    differentiators: [],
    customers: [],
    prompt: { role: "test role", guardrails: "", forbidden: [] },
    structure: {},
  };
  const merged = mergeVerticalOverrides(BUILT_IN_VERTICALS, { overrides: [], customs: [custom] });
  assert.equal(merged.length, BUILT_IN_VERTICALS.length + 1);
  assert.deepEqual(merged.at(-1), custom);
});

test("a custom vertical whose id collides with a built-in is dropped, not appended", () => {
  const colliding = {
    id: "hvac",
    label: "Fake HVAC",
    services: [],
    differentiators: [],
    customers: [],
    prompt: { role: "", guardrails: "", forbidden: [] },
    structure: {},
  };
  const merged = mergeVerticalOverrides(BUILT_IN_VERTICALS, { overrides: [], customs: [colliding] });
  assert.equal(merged.length, BUILT_IN_VERTICALS.length);
  assert.equal(merged.find((v) => v.id === "hvac").label, "HVAC / Heating & Cooling");
});
