import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapBrandIntakeToIntake,
  brandDirectionToDetails,
  derivePalette,
  resolvePalette,
  DEFAULT_STRUCTURE,
  zBrandIntakeSubmission,
} from "../dist/index.js";

function sampleIntake(overrides = {}) {
  return {
    selectedPlan: "growth",
    brandName: "Peak Home Services",
    brandShort: "Peak",
    email: "owner@peak.com",
    phone: "(930) 222-1343",
    address: "318 Glacier Ave, Juneau, AK",
    license: "AK-GC-2019",
    industry: "HVAC",
    established: "2011",
    notableClients: "City of Juneau, Bergmann Properties",
    certifications: "EPA 608, NATE",
    businessHours: "Mon–Fri 7–6",
    serviceArea: "Juneau, Douglas",
    agentName: "Mia",
    serviceList: [
      { name: "AC Repair", tag: "HVAC" },
      { name: "Furnace Install", tag: "Heating" },
    ],
    brandDirection: {
      differentiators: "Same-day diagnostics with a price-lock guarantee",
      targetCustomer: "Homeowners who hate surprise invoices",
      vibe: ["Modern", "Trustworthy"],
      tone: ["Friendly", "Professional"],
      adjectives: ["fast", "honest", "local"],
      references: "Mercury Insurance site",
      forbidden: "top-notch, one-stop shop",
    },
    palette: { mode: "custom", baseColor: "#0F1B2D", accentColor: "#1E6FBF" },
    hasLogo: true,
    images: { heroSlides: [{ url: "https://x.public.blob.vercel-storage.com/h.jpg", filename: "h.jpg", alt: "hero" }] },
    existingWebsiteUrl: "https://peakhomeservices.com",
    announcement: "",
    ...overrides,
  };
}

test("scaffold seeds copy arrays at DEFAULT_STRUCTURE cardinality", () => {
  const site = mapBrandIntakeToIntake(sampleIntake()).sites[0];
  assert.equal(site.about.pillars.length, DEFAULT_STRUCTURE.pillars);
  assert.equal(site.faq.items.length, DEFAULT_STRUCTURE.faq);
  assert.equal(site.testimonials.items.length, DEFAULT_STRUCTURE.testimonials);
  assert.equal(site.hero.heroBullets.length, DEFAULT_STRUCTURE.heroBullets);
  assert.equal(site.hero.frictionReducers.length, DEFAULT_STRUCTURE.heroFrictionReducers);
  assert.equal(site.finalCta.frictionReducers.length, DEFAULT_STRUCTURE.ctaFrictionReducers);
  assert.equal(site.services.items.length, 2); // one per serviceList entry
});

test("about.stats is NOT seeded at DEFAULT_STRUCTURE cardinality (PLAN D4, 2026-10-28)", () => {
  // Every other copy array is deliberately seeded blank-but-sized so the copywriter knows how
  // many pillars/FAQs/etc. to WRITE. Stats is the one exception: a statistic is a fact about
  // the business, never something the copywriter originates, so there is no "write it in
  // place" cardinality to seed — an unanswered stats step must produce zero tiles, not four
  // blank ones a less careful prompt could fill with invented numbers.
  const unsubmitted = mapBrandIntakeToIntake(sampleIntake()).sites[0];
  assert.deepEqual(unsubmitted.about.stats, []);
  assert.equal(unsubmitted._meta.missing_fields.includes("about.stats"), true);

  const submitted = mapBrandIntakeToIntake(
    sampleIntake({
      stats: [
        { key: "emergencyAvailability", value: "24/7", label: "Emergency service" },
        { key: "yearsTrading", value: "18+", label: "Years in business" },
      ],
    }),
  ).sites[0];
  assert.deepEqual(submitted.about.stats, [
    { n: "24/7", l: "Emergency service" },
    { n: "18+", l: "Years in business" },
  ]);
  assert.equal(submitted._meta.missing_fields.includes("about.stats"), false);
});

test("copy fields empty; facts + palette + service names present", () => {
  const site = mapBrandIntakeToIntake(sampleIntake()).sites[0];
  assert.equal(site.hero.headline, "");
  assert.equal(site.about.body, "");
  assert.equal(site.faq.items[0].q, "");
  // facts preserved verbatim
  assert.equal(site.brand.phone, "(930) 222-1343");
  assert.equal(site.brand.phoneHref, "tel:9302221343");
  assert.equal(site.brand.email, "owner@peak.com");
  assert.equal(site.services.items[0].t, "AC Repair");
  assert.equal(site.services.items[0].tag, "HVAC");
  assert.equal(site.services.items[0].d, ""); // description is copywriter's job
  // palette derived from the 2-color pick
  assert.equal(site.brand.palette.accent, "#1E6FBF");
  assert.equal(site.brand.palette.bg, "#FFFFFF");
  assert.ok(/^#[0-9A-F]{6}$/.test(site.brand.palette.rule));
});

test("brand direction is stashed on _meta and scan url captured", () => {
  const site = mapBrandIntakeToIntake(sampleIntake()).sites[0];
  assert.equal(site._meta.brandDirection.differentiators, "Same-day diagnostics with a price-lock guarantee");
  assert.equal(site._meta.scrapeExistingWebsite, true);
  assert.equal(site._meta.scrapeWebsiteDomain, "https://peakhomeservices.com");
});

test("only facts (never copy) land in missing_fields", () => {
  const site = mapBrandIntakeToIntake(
    sampleIntake({ phone: "", license: "", hasLogo: false, images: { heroSlides: [] }, existingWebsiteUrl: "", serviceList: [] }),
  ).sites[0];
  const mf = site._meta.missing_fields;
  assert.ok(mf.includes("brand.phone"));
  assert.ok(mf.includes("brand.license"));
  assert.ok(mf.includes("branding.logo"));
  assert.ok(mf.includes("images.hero"));
  assert.ok(mf.includes("existingWebsiteUrl"));
  assert.ok(mf.includes("services.items"));
  // never flags copy sections
  assert.ok(!mf.some((m) => m.startsWith("hero.") || m.startsWith("about.body") || m.startsWith("faq.")));
});

test("brandDirectionToDetails compiles only non-empty fields", () => {
  const details = brandDirectionToDetails(sampleIntake().brandDirection);
  assert.ok(details.includes("What makes them different: Same-day diagnostics"));
  assert.ok(details.includes("Tone of voice: Friendly, Professional"));
  assert.ok(details.includes("Avoid (words / claims / styles): top-notch, one-stop shop"));
  // empty direction → empty string
  assert.equal(brandDirectionToDetails({ differentiators: "", targetCustomer: "", vibe: [], tone: [], adjectives: [], references: "", forbidden: "" }), "");
});

test("derivePalette + resolvePalette return complete palettes", () => {
  const p = derivePalette("#1E6FBF", "#0F1B2D");
  for (const k of ["accent", "bg", "bgSoft", "ink", "inkSoft", "rule"]) {
    assert.ok(/^#[0-9A-F]{6}$/.test(p[k]), `${k} = ${p[k]}`);
  }
  const preset = resolvePalette({ mode: "preset", presetId: "forest" });
  assert.ok(/^#[0-9A-F]{6}$/.test(preset.accent));
  // unknown preset falls back, never throws
  assert.ok(resolvePalette({ mode: "preset", presetId: "nope" }).accent);
});

test("enterprise builds an N-site cluster with per-site palettes", () => {
  const intake = mapBrandIntakeToIntake(
    sampleIntake({
      selectedPlan: "enterprise",
      additionalSites: [
        {
          brandName: "Peak North", brandShort: "PeakN", email: "n@peak.com", phone: "9070000000",
          address: "1 Main", businessHours: "", serviceList: [{ name: "Roofing", tag: "Roof" }],
          palette: { mode: "preset", presetId: "crimson" },
          brandDirection: { differentiators: "", targetCustomer: "", vibe: [], tone: [], adjectives: [], references: "", forbidden: "" },
        },
      ],
    }),
  );
  assert.equal(intake.plan, "enterprise");
  assert.equal(intake.siteCount, 2);
  assert.equal(intake.sites[1].brand.name, "Peak North");
  assert.deepEqual(intake.sites[0]._meta.siblingSlugs, ["peak-2"]);
  assert.equal(intake.sites[1].services.items.length, 1);
});

test("zBrandIntakeSubmission validates a well-formed payload", () => {
  assert.equal(zBrandIntakeSubmission.safeParse(sampleIntake()).success, true);
});

// ── receptionistMode: the activation choice, carried to provisioning ─────────

test("receptionistMode survives the zod round trip", () => {
  // The failure this guards is silent: zod strips unknown keys, so a field the wizard sends
  // but the schema does not declare simply vanishes, with no error anywhere. Provisioning
  // would then refuse to run for want of a choice the client actually made.
  for (const mode of ["forwarded", "published", "declined"]) {
    const parsed = zBrandIntakeSubmission.parse(sampleIntake({ receptionistMode: mode }));
    assert.equal(parsed.receptionistMode, mode, mode);
  }
});

test("an unrecognised receptionistMode is rejected, not coerced", () => {
  const res = zBrandIntakeSubmission.safeParse(sampleIntake({ receptionistMode: "maybe" }));
  assert.equal(res.success, false);
});

test("receptionistMode is optional, so a pre-activation-step draft still parses", () => {
  // A client mid-form when the step deployed submits the old shape. Rejecting it would lose
  // the entire intake over a field we can resolve at provisioning time.
  const res = zBrandIntakeSubmission.safeParse(sampleIntake());
  assert.equal(res.success, true);
  assert.equal(res.data.receptionistMode, undefined);
});

test("the mapper carries receptionistMode onto the envelope, not onto any site", () => {
  // Envelope-level on purpose: every field of SiteContent is serialized into the generated
  // client repo on public GitHub.
  const intake = mapBrandIntakeToIntake(sampleIntake({ receptionistMode: "forwarded" }));
  assert.equal(intake.receptionistMode, "forwarded");
  assert.equal("receptionistMode" in intake.sites[0], false);
});

test("an absent receptionistMode stays absent rather than becoming undefined", () => {
  // `{}` and `{ receptionistMode: undefined }` differ to a consumer checking `in`, and the
  // latter trips exactOptionalPropertyTypes.
  const intake = mapBrandIntakeToIntake(sampleIntake());
  assert.equal("receptionistMode" in intake, false);
});

test("reviewAggregate maps score/count strings to the numeric ExtensionsContent.reviewBadge shape", () => {
  const site = mapBrandIntakeToIntake(
    sampleIntake({ reviewAggregate: { score: "4.9", count: "184", url: "https://g.page/x" } }),
  ).sites[0];
  assert.deepEqual(site.extensions.reviewBadge, { rating: 4.9, count: 184, url: "https://g.page/x" });
  assert.equal(site.services.items[0].priceFrom, null); // unrelated field stays unaffected
});

test("an unparseable reviewAggregate maps to null, not NaN, and is flagged missing", () => {
  const site = mapBrandIntakeToIntake(
    sampleIntake({ reviewAggregate: { score: "not-a-number", count: "184" } }),
  ).sites[0];
  assert.equal(site.extensions.reviewBadge, null);
  assert.ok(site._meta.missing_fields.includes("extensions.reviewBadge"));
});

test("an absent reviewAggregate maps to null and is flagged missing", () => {
  const site = mapBrandIntakeToIntake(sampleIntake()).sites[0];
  assert.equal(site.extensions.reviewBadge, null);
  assert.ok(site._meta.missing_fields.includes("extensions.reviewBadge"));
});

test("seasons with a blank body are dropped; a fully blank submission maps to null and is flagged", () => {
  const blank = mapBrandIntakeToIntake(sampleIntake()).sites[0];
  assert.equal(blank.about.seasons, null);
  assert.ok(blank._meta.missing_fields.includes("about.seasons"));

  const partial = mapBrandIntakeToIntake(
    sampleIntake({
      seasons: [
        { key: "spring", label: "Spring", body: "Pre-emergent and first feed" },
        { key: "summer", label: "Summer", body: "" }, // the client runs no summer programme
      ],
    }),
  ).sites[0];
  assert.deepEqual(partial.about.seasons, [{ key: "spring", label: "Spring", body: "Pre-emergent and first feed" }]);
  assert.equal(partial._meta.missing_fields.includes("about.seasons"), false);
});

test("servicePrices maps onto the matching ServiceItem by name; unmatched services get null", () => {
  const site = mapBrandIntakeToIntake(
    sampleIntake({ servicePrices: { "AC Repair": "from $129" } }),
  ).sites[0];
  assert.equal(site.services.items.find((i) => i.t === "AC Repair").priceFrom, "from $129");
  assert.equal(site.services.items.find((i) => i.t === "Furnace Install").priceFrom, null);
  assert.ok(site._meta.missing_fields.includes("services.priceFrom") === false);
});

test("offerBadge and serviceRadiusMiles map straight through to extensions and flag when blank", () => {
  const filled = mapBrandIntakeToIntake(
    sampleIntake({ offerBadge: "First mow free", serviceRadiusMiles: "25" }),
  ).sites[0];
  assert.equal(filled.extensions.offerBadge, "First mow free");
  assert.equal(filled.extensions.serviceRadiusMiles, "25");

  const blank = mapBrandIntakeToIntake(sampleIntake()).sites[0];
  assert.equal(blank.extensions.offerBadge, null);
  assert.equal(blank.extensions.serviceRadiusMiles, null);
  assert.ok(blank._meta.missing_fields.includes("extensions.offerBadge"));
  assert.ok(blank._meta.missing_fields.includes("extensions.serviceRadiusMiles"));
});

test("zBrandIntakeSubmission accepts the vertical-templates-v1 fields with real shape checks", () => {
  const res = zBrandIntakeSubmission.safeParse(
    sampleIntake({
      stats: [{ key: "yearsTrading", value: "18+", label: "Years in business" }],
      reviewAggregate: { score: "4.9", count: "184" },
      servicePrices: { "AC Repair": "from $129" },
      seasons: [{ key: "spring", label: "Spring", body: "First feed" }],
      serviceRadiusMiles: "25",
      offerBadge: "First mow free",
    }),
  );
  assert.equal(res.success, true);
});

test("zBrandIntakeSubmission rejects a malformed stats entry rather than passing it through", () => {
  // Confirms these fields are REAL zod shapes, not just carried by the object's .passthrough() —
  // a stats entry missing `value` should fail validation, not sail through unchecked.
  const res = zBrandIntakeSubmission.safeParse(
    sampleIntake({ stats: [{ key: "yearsTrading", label: "Years in business" }] }),
  );
  assert.equal(res.success, false);
});
