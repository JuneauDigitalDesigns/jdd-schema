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
  assert.equal(site.about.stats.length, DEFAULT_STRUCTURE.stats);
  assert.equal(site.faq.items.length, DEFAULT_STRUCTURE.faq);
  assert.equal(site.testimonials.items.length, DEFAULT_STRUCTURE.testimonials);
  assert.equal(site.hero.heroBullets.length, DEFAULT_STRUCTURE.heroBullets);
  assert.equal(site.hero.frictionReducers.length, DEFAULT_STRUCTURE.heroFrictionReducers);
  assert.equal(site.finalCta.frictionReducers.length, DEFAULT_STRUCTURE.ctaFrictionReducers);
  assert.equal(site.services.items.length, 2); // one per serviceList entry
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
