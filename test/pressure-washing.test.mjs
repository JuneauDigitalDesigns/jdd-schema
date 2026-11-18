// v1.40.0: pressure washing, the seventh vertical. Everything here was approved by Xander word for
// word on 2026-11-18 from the mockup canvas ("Overall it looks very good"): the tile label (W44),
// the service list and tags (M1 to M8), the differentiator and customer chips (M9, M10), the template
// slots and stat prompts (W62), and the copywriter rules (G1 to G6, with no exception on G1 and G6).
// Each service's suggestion chips are pinned in fixtures/trade-suggestions-approved.json.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERTICAL_IDS,
  isVerticalId,
  menuFor,
  differentiatorsFor,
  customersFor,
  palettesForVertical,
  BUILT_IN_VERTICALS,
} from "../dist/index.js";

const PW = "pressure-washing";

test("pressure washing is a vertical, listed after car detailing and before health", () => {
  assert.ok(isVerticalId(PW));
  assert.deepEqual(VERTICAL_IDS, ["hvac", "roofing", "plumbing", "lawn-care", "car-detailing", PW, "health"]);
});

test("the menu carries the approved tile label, services and tags in order", () => {
  const menu = menuFor(PW);
  assert.ok(menu, "pressure washing has a menu");
  assert.equal(menu.label, "Pressure Washing / Soft Washing");
  assert.deepEqual(
    menu.services.map((s) => [s.label, s.tag]),
    [
      ["House Washing", "House"],
      ["Roof Soft Washing", "Roof"],
      ["Driveway & Sidewalk Cleaning", "Concrete"],
      ["Paver Cleaning & Sealing", "Pavers"],
      ["Pool Deck & Patio Cleaning", "Patio"],
      ["Deck & Fence Cleaning", "Wood"],
      ["Gutter Brightening", "Gutters"],
      ["Commercial Pressure Washing", "Commercial"],
    ],
  );
});

test("its own differentiator and customer chips come first, word for word", () => {
  assert.deepEqual(menuFor(PW).differentiators, [
    "Soft washing for siding and roofs",
    "Before-and-after photos every time",
    "We cover plants and rinse them after",
    "Free quotes",
  ]);
  assert.deepEqual(menuFor(PW).customers, ["Homeowners", "Property managers and HOAs", "Businesses and storefronts"]);
  assert.equal(differentiatorsFor(PW)[0], "Soft washing for siding and roofs");
  assert.equal(customersFor(PW)[1], "Property managers and HOAs");
});

test("the template asks only for what its slots show", () => {
  assert.deepEqual(menuFor(PW).templateSlots, {
    stats: [
      { key: "propertiesCleaned", prompt: "About how many properties have you cleaned?", example: "800+" },
      { key: "quoteTurnaround", prompt: "How soon do you usually send a quote?", example: "Same day" },
      { key: "rating", prompt: "Your average review rating and count", example: "4.9★ from 180+ reviews" },
    ],
    reviewAggregate: true,
    hoursPerDay: false,
    priceFrom: true,
    seasons: null,
    serviceRadius: true,
    offerBadge: false,
  });
});

test("the copywriter gets the home-service role plus the approved pressure washing rules", () => {
  const pw = BUILT_IN_VERTICALS.find((v) => v.id === PW);
  const hvac = BUILT_IN_VERTICALS.find((v) => v.id === "hvac");
  assert.equal(pw.prompt.role, hvac.prompt.role);
  assert.deepEqual(pw.prompt.forbidden, hvac.prompt.forbidden);
  assert.equal(
    pw.prompt.guardrails,
    [
      "PRESSURE WASHING RULES:",
      "- Never promise that a stain will come out. Oil, rust and old stains often only lighten, so say the business treats them.",
      "- Never describe a roof, siding, stucco, a painted surface or wood being cleaned with high pressure. When the facts say the business soft washes, say those surfaces are soft washed at low pressure.",
      "- Never call a cleaning product or method safe, gentle, non-toxic, eco-friendly, green, biodegradable, or safe for pets, children or plants, unless the facts say it.",
      "- Never say how long a clean or a sealer will last, or that algae, mildew or streaks won't come back.",
      "- Mention covering or rinsing plants, protecting windows or cars, collecting runoff, or bringing water only when the facts say the business does it.",
      "- Never promise no damage, or that a method is safe for every surface.",
    ].join("\n"),
  );
  assert.doesNotMatch(pw.prompt.guardrails, /[–—]/, "no em or en dash: models copy them");
});

test("the wizard opens on the palettes closest to the approved look, teal first", () => {
  assert.deepEqual(palettesForVertical(PW).map((p) => p.id), ["teal", "graphite"]);
});
