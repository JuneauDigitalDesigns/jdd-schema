import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INDUSTRY_MENUS,
  VERTICAL_IDS,
  OTHER_INDUSTRY,
  isVerticalId,
  menuFor,
  differentiatorsFor,
  customersFor,
  joinChoices,
  VOICE_OPTIONS,
  PALETTE_PRESETS,
  palettesForVertical,
  mapBrandIntakeToIntake,
} from "../dist/index.js";

// ── the menus themselves ────────────────────────────────────────────────────

test("every vertical has a menu, and every menu is a vertical", () => {
  // The wizard renders chips per industry; a vertical with no menu would show an empty
  // step, which reads as broken rather than as "describe it yourself".
  assert.deepEqual(
    INDUSTRY_MENUS.map((m) => m.id).sort(),
    [...VERTICAL_IDS].sort(),
  );
});

test("no menu is thinner than the preset it was seeded from", () => {
  // The presets ship six services each because that's what fits a demo page. These menus
  // exist to offer more than one example site's idea of a trade.
  for (const m of INDUSTRY_MENUS) {
    assert.ok(m.services.length > 6, `${m.id} has only ${m.services.length} services`);
  }
});

test("every service carries a non-empty label and tag", () => {
  // `tag` becomes the category shown on the built site, so a blank one ships to a client.
  for (const m of INDUSTRY_MENUS) {
    for (const s of m.services) {
      assert.ok(s.label.trim(), `${m.id} has a service with no label`);
      assert.ok(s.tag.trim(), `${m.id}/${s.label} has no tag`);
    }
  }
});

test("no duplicate service labels within an industry", () => {
  for (const m of INDUSTRY_MENUS) {
    const labels = m.services.map((s) => s.label);
    assert.equal(new Set(labels).size, labels.length, `${m.id} repeats a service`);
  }
});

test("menuFor returns null for 'other' and for junk", () => {
  // null is the wizard's signal to fall back to free text. An empty menu would render a
  // step offering nothing at all.
  assert.equal(menuFor(OTHER_INDUSTRY), null);
  assert.equal(menuFor("basket-weaving"), null);
  assert.equal(menuFor(""), null);
  assert.equal(menuFor(undefined), null);
});

test("differentiators and customers always return something, even for 'other'", () => {
  // A client who doesn't fit our six trades still needs options, so the common set stands
  // alone rather than the step going blank.
  assert.ok(differentiatorsFor(OTHER_INDUSTRY).length > 0);
  assert.ok(customersFor(OTHER_INDUSTRY).length > 0);
  assert.ok(differentiatorsFor("hvac").length > differentiatorsFor(OTHER_INDUSTRY).length);
});

test("VOICE_OPTIONS is shared, not per-industry", () => {
  // How a business wants to sound is a choice about them, not their trade. Offering
  // "friendly" only to health businesses would make that decision for them.
  assert.ok(VOICE_OPTIONS.length >= 6);
});

test("isVerticalId rejects 'other'", () => {
  assert.equal(isVerticalId("hvac"), true);
  assert.equal(isVerticalId(OTHER_INDUSTRY), false);
  assert.equal(isVerticalId(undefined), false);
});

// ── palette tagging ─────────────────────────────────────────────────────────

test("every vertical surfaces at least two palettes", () => {
  for (const v of VERTICAL_IDS) {
    assert.ok(palettesForVertical(v).length >= 2, `${v} has too few palettes`);
  }
});

test("palettesForVertical falls back to all of them for unknown industries", () => {
  // A colour step rendering zero options reads as broken, and an "other" client still
  // needs to pick a colour.
  assert.equal(palettesForVertical(OTHER_INDUSTRY).length, PALETTE_PRESETS.length);
  assert.equal(palettesForVertical(undefined).length, PALETTE_PRESETS.length);
});

test("every tagged vertical is a real vertical", () => {
  // A typo'd tag would silently vanish from that trade's picker rather than erroring.
  for (const p of PALETTE_PRESETS) {
    for (const v of p.verticals ?? []) {
      assert.ok(VERTICAL_IDS.includes(v), `palette ${p.id} tags unknown vertical "${v}"`);
    }
  }
});

// ── joinChoices ─────────────────────────────────────────────────────────────

test("joinChoices merges chips and free text into one line", () => {
  assert.equal(joinChoices(["Same-day service", "Free estimates"]), "Same-day service. Free estimates");
  assert.equal(joinChoices(["Licensed"], "We answer the phone."), "Licensed. We answer the phone.");
});

test("joinChoices tolerates empty input on either side", () => {
  assert.equal(joinChoices([], ""), "");
  assert.equal(joinChoices([], "just this"), "just this");
  assert.equal(joinChoices(["just this"], "   "), "just this");
});

// ── industry survives the mapping ───────────────────────────────────────────

function submission(overrides = {}) {
  return {
    selectedPlan: "growth",
    brandName: "Peak Home Services",
    email: "owner@peak.com",
    phone: "2075550142",
    address: "318 Glacier Ave",
    industry: "hvac",
    serviceList: [{ name: "AC Repair", tag: "Cooling" }],
    brandDirection: {
      differentiators: "Same-day service",
      targetCustomer: "Homeowners",
      vibe: [],
      tone: ["Friendly"],
      adjectives: [],
      references: "",
      forbidden: "",
    },
    palette: { mode: "preset", presetId: "ocean-blue" },
    hasLogo: false,
    images: { heroSlides: [] },
    existingWebsiteUrl: "",
    ...overrides,
  };
}

test("industry reaches _meta so the console can pick the vertical", () => {
  // This is the whole point: it used to be declared, flagged, and then dropped, so the
  // operator re-picked by hand what the client had already answered.
  const intake = mapBrandIntakeToIntake(submission());
  assert.equal(intake.sites[0]._meta.industry, "hvac");
});

test("'other' is carried through verbatim, not dropped or normalised", () => {
  // Deciding what "other" means is the console's job (fall back to a manual pick). A
  // mapper that swallowed it would be making that call invisibly.
  const intake = mapBrandIntakeToIntake(submission({ industry: OTHER_INDUSTRY }));
  assert.equal(intake.sites[0]._meta.industry, OTHER_INDUSTRY);
});

test("a blank industry is flagged as missing rather than recorded as answered", () => {
  const intake = mapBrandIntakeToIntake(submission({ industry: "" }));
  assert.ok(intake.sites[0]._meta.missing_fields.includes("business.industry"));
  assert.equal(intake.sites[0]._meta.industry, undefined);
});

test("a submission omitting every trimmed field still maps", () => {
  // A client mid-form when the new wizard deploys submits the old shape; this must not
  // throw at the moment they press submit.
  const lean = submission();
  for (const k of ["brandShort", "license", "established", "notableClients",
                   "certifications", "businessHours", "serviceArea", "agentName",
                   "announcement"]) {
    delete lean[k];
  }
  const intake = mapBrandIntakeToIntake(lean);
  assert.equal(intake.sites[0].brand.name, "Peak Home Services");
  // brandShort falls back to the full name rather than emptying the nav/logo slot.
  assert.equal(intake.sites[0].brand.short, "Peak Home Services");
});

test("brandDirection still reaches _meta alongside industry", () => {
  const intake = mapBrandIntakeToIntake(submission());
  assert.equal(intake.sites[0]._meta.brandDirection.differentiators, "Same-day service");
});
