// v1.42.0 (Xander, 2026-11-19): two logos, not one. "The icon that goes in the nav bar is different
// than the one that goes in the footer ... the one in the nav bar would be a monogram, and then the
// one in the footer would be a word mark."
//
// - The submission carries `images.monogram` beside `images.logo` (the wordmark, as before).
// - The site carries it as `images.nav.logoImage`; `images.footer.logoImage` stays the wordmark, so a
//   site made before this, with its one logo, keeps it in the footer and shows the name alone in the
//   nav until a monogram is added (his call, 2026-11-19).
// - A missing monogram is not flagged: it is optional, like the logo itself is now.
// - The wordmark never fills the monogram's place.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mapBrandIntakeToIntake, zBrandIntakeSubmission, SITE_TYPES_SOURCE } from "../dist/index.js";

function sub(overrides = {}) {
  return {
    selectedPlan: "growth",
    brandName: "Autobridge Car Detailing",
    email: "office@example.com",
    phone: "(407) 555-0142",
    address: "1180 W Fairbanks Ave, Winter Park, FL 32789",
    industry: "car-detailing",
    serviceArea: "Winter Park, Maitland",
    serviceList: [{ name: "Interior Detail", tag: "Interior" }],
    brandDirection: { differentiators: "", targetCustomer: "", vibe: [], tone: [], adjectives: [], references: "", forbidden: "" },
    palette: { mode: "custom", baseColor: "#0F1B2D", accentColor: "#1E6FBF" },
    hasLogo: true,
    images: { heroSlides: [] },
    existingWebsiteUrl: "",
    ...overrides,
  };
}
const site = (o) => mapBrandIntakeToIntake(sub(o)).sites[0];
const img = (name) => ({ url: `https://blob.example/${name}.svg`, filename: `${name}.svg`, alt: "" });

test("the submission accepts a monogram beside the logo, and keeps it", () => {
  const parsed = zBrandIntakeSubmission.parse(sub({ images: { heroSlides: [], logo: img("wordmark"), monogram: img("monogram") } }));
  assert.deepEqual(parsed.images.monogram, img("monogram"));
  assert.deepEqual(parsed.images.logo, img("wordmark"));
});

test("the monogram goes to the nav, the logo stays the footer's wordmark", () => {
  const s = site({ images: { heroSlides: [], logo: img("wordmark"), monogram: img("monogram") } });
  assert.equal(s.images.nav.logoImage, "https://blob.example/monogram.svg");
  assert.equal(s.images.footer.logoImage, "https://blob.example/wordmark.svg");
});

test("a wordmark alone never fills the nav's monogram", () => {
  const s = site({ images: { heroSlides: [], logo: img("wordmark") } });
  assert.equal(s.images.footer.logoImage, "https://blob.example/wordmark.svg");
  assert.equal(s.images.nav?.logoImage, undefined);
});

test("a monogram alone is carried, with no wordmark invented", () => {
  const s = site({ images: { heroSlides: [], monogram: img("monogram") } });
  assert.equal(s.images.nav.logoImage, "https://blob.example/monogram.svg");
  assert.equal(s.images.footer.logoImage, undefined);
});

test("a blank monogram is no monogram", () => {
  const s = site({ images: { heroSlides: [], monogram: { url: "  ", filename: "", alt: "" } } });
  assert.equal(s.images.nav?.logoImage, undefined);
});

test("a missing monogram is not flagged", () => {
  const s = site({ images: { heroSlides: [], logo: img("wordmark") } });
  const missing = s._meta.missing_fields.join(" ");
  assert.doesNotMatch(missing, /monogram|images\.nav/);
});

test("the site types the console reads declare the nav's monogram, optional", () => {
  assert.match(SITE_TYPES_SOURCE, /nav\?: +\{ logoImage\?: string \};/);
  assert.match(SITE_TYPES_SOURCE, /footer: +\{ logoImage\?: string \};/);
});
