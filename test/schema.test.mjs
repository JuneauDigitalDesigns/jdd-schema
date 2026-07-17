import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapPayloadToIntake,
  zIntake,
  zOnboardingSubmission,
  SITE_TYPES_SOURCE,
} from "../dist/index.js";

/** A complete-but-mostly-empty submission; fill only what a test needs. */
function sampleSubmission(overrides = {}) {
  return {
    selectedPlan: "growth",
    contact: {
      brandName: "Peak Home Services",
      brandLong: "Peak Home Services LLC",
      brandShort: "Peak",
      email: "owner@peak.com",
      phone: "(930) 222-1343",
      address: "318 Glacier Ave, Juneau, AK",
      license: "AK-GC-2019",
      websiteType: "marketing",
    },
    businessDetails: {
      industry: "HVAC",
      established: "2011",
      brandTagline: "Reliable service, every season.",
      usp: "Same-day diagnostics",
      notableClients: "City of Juneau, Bergmann Properties",
      certifications: "EPA 608, NATE",
      awards: "",
      businessHours: "Mon–Fri 7–6",
    },
    branding: {
      paletteAccent: "#1E6FBF", paletteBg: "#FFFFFF", paletteBgSoft: "#F0F5FB",
      paletteInk: "#0F1B2D", paletteInkSoft: "#4A5568", paletteRule: "#CBD5E1", hasLogo: "yes",
    },
    announcement: "",
    seo: { seoTitle: "Peak | HVAC", seoDescription: "Juneau HVAC", seoCanonical: "", googleAnalyticsId: "", facebookPixelId: "" },
    extensions: { mapsUrl: "", bookingUrl: "", portalUrl: "" },
    socialMedia: { linkedin: "", instagram: "", facebook: "", youtube: "" },
    hero: {
      heroEyebrow: "", heroHeadline: "Comfort You Can Count On", heroHeadlineEmphasis: "Count On",
      heroSub: "Done right the first time.", heroCta: "", heroSecondaryCta: "", heroBadge: "", heroFrictionReducers: [],
    },
    about: { aboutEyebrow: "", aboutTitle: "", aboutBody: "Since 2011.", pillars: [], stats: [] },
    servicesSection: { servicesEyebrow: "", servicesTitle: "", servicesSub: "" },
    work: { workEyebrow: "", workTitle: "", workSub: "", projects: [] },
    testimonialsMeta: { testimonialsEyebrow: "", testimonialsTitle: "" },
    faqMeta: { faqEyebrow: "", faqTitle: "", faqSub: "" },
    finalCta: { finalCtaEyebrow: "", finalCtaHeadline: "", finalCtaSub: "", finalCtaCta: "", finalCtaSecondary: "", finalCtaFrictionReducers: [] },
    footer: { footerBlurb: "", footerLegal: "" },
    images: { heroSlides: [] },
    services: [{ t: "AC Repair", tag: "HVAC", d: "Fast fixes", images: [] }],
    testimonials: [],
    heroBullets: [],
    faqs: [],
    ...overrides,
  };
}

test("mapPayloadToIntake produces a valid single-site Intake", () => {
  const intake = mapPayloadToIntake(sampleSubmission());
  assert.equal(zIntake.safeParse(intake).success, true);
  assert.equal(intake.plan, "growth");
  assert.equal(intake.siteCount, 1);
  assert.equal(intake.sites.length, 1);
  assert.equal(intake.sites[0].brand.name, "Peak Home Services");
  assert.equal(intake.sites[0].brand.short, "Peak");
  assert.equal(intake.sites[0].brand.phoneHref, "tel:9302221343");
});

test("empty required facts land in _meta.missing_fields", () => {
  const intake = mapPayloadToIntake(
    sampleSubmission({ testimonials: [], faqs: [] }),
  );
  const mf = intake.sites[0]._meta.missing_fields;
  assert.ok(mf.includes("testimonials.items"));
  assert.ok(mf.includes("faq.items"));
});

test("enterprise with additional sites yields an N-site cluster", () => {
  const intake = mapPayloadToIntake(
    sampleSubmission({
      selectedPlan: "enterprise",
      additionalSites: [
        {
          brandName: "Peak North", brandShort: "PeakN", brandTagline: "t", email: "n@peak.com",
          phone: "9070000000", address: "1 Main", paletteAccent: "#111", paletteBg: "#fff",
          paletteBgSoft: "#eee", paletteInk: "#000", paletteInkSoft: "#333", paletteRule: "#ccc",
          heroHeadline: "North", heroSub: "sub", businessHours: "", usp: "u", services: [], faqs: [],
        },
      ],
    }),
  );
  assert.equal(intake.plan, "enterprise");
  assert.equal(intake.siteCount, 2);
  assert.equal(intake.sites[1].brand.name, "Peak North");
  assert.deepEqual(intake.sites[0]._meta.siblingSlugs, ["peak-2"]);
});

test("zOnboardingSubmission accepts a well-formed payload", () => {
  assert.equal(zOnboardingSubmission.safeParse(sampleSubmission()).success, true);
});

test("SITE_TYPES_SOURCE is self-contained and defines SiteContent", () => {
  assert.ok(SITE_TYPES_SOURCE.includes("export interface SiteContent"));
  assert.ok(SITE_TYPES_SOURCE.includes("export interface BrandContent"));
  // Must NOT import from the package — client repos have to stay dependency-free.
  assert.ok(!SITE_TYPES_SOURCE.includes("@jdd/schema"));
  assert.ok(!/\bimport\b/.test(SITE_TYPES_SOURCE));
});
