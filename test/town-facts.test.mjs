// v1.34.0 (2026-11-12, Xander's local SEO decisions): the town facts as the onboarding form submits
// them and the console reads them.
//   Q1 "Which town was this job in?" under each photo  -> Project.town (and loc, the display line)
//   Q2 "Which towns do you get the most work from?"     -> extensions.topTowns (up to 3)
//   Q5 "What makes this job cost more or less?"         -> ServiceItem.priceFactors
//   Q6 "What happens on a typical visit" (console only) -> ServiceItem.typicalVisit
//   operator town notes, each with its source link      -> extensions.townNotes
//   a review's town (console only)                      -> Testimonial.town
// Every value is client- or operator-supplied; a blank is flagged, never filled, and a town is
// kept only when it is one the client covers, spelled as the service area spells it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mapBrandIntakeToIntake, zBrandIntakeSubmission, SITE_TYPES_SOURCE, qualifiesForAreaPage } from "../dist/index.js";

function sub(overrides = {}) {
  return {
    selectedPlan: "growth",
    brandName: "Coastline Heating & Air",
    email: "office@example.com",
    phone: "(407) 555-0142",
    address: "1180 W Fairbanks Ave, Clermont, FL 34711",
    industry: "HVAC",
    serviceArea: "Clermont, Minneola, Groveland",
    serviceList: [
      { name: "AC Repair", tag: "Cooling" },
      { name: "Duct Cleaning", tag: "Air quality" },
    ],
    brandDirection: {
      differentiators: "", targetCustomer: "", vibe: [], tone: [], adjectives: [], references: "", forbidden: "",
    },
    palette: { mode: "custom", baseColor: "#0F1B2D", accentColor: "#1E6FBF" },
    hasLogo: false,
    images: { heroSlides: [] },
    existingWebsiteUrl: "",
    ...overrides,
  };
}
const img = (n, town) => ({ url: `/u/${n}.jpg`, filename: `${n}.jpg`, alt: "", ...(town !== undefined ? { town } : {}) });
const site = (o) => mapBrandIntakeToIntake(sub(o)).sites[0];

test("Q1: a service photo's town lands on its project, as the area spells it", () => {
  const s = site({ serviceList: [{ name: "AC Repair", tag: "", photos: [img(1, "minneola"), img(2)] }] });
  const [a, b] = s.work.projects;
  assert.equal(a.town, "Minneola");
  assert.equal(a.loc, "Minneola", "the display line shows the town, never a street");
  assert.equal(a.service, "ac-repair");
  assert.equal(b.town, undefined, "no answer, no town: never guessed");
  assert.equal(b.loc, "");
});

test("Q1: a town the client does not cover is dropped, and 'Not sure' is no town", () => {
  const s = site({ serviceList: [{ name: "AC Repair", tag: "", photos: [img(1, "Orlando"), img(2, "")] }] });
  assert.deepEqual(s.work.projects.map((p) => p.town), [undefined, undefined]);
});

test("Q1: a general photo with a town becomes a job for that town; without one it stays a hero slide only", () => {
  const s = site({ images: { heroSlides: [img(1, "Groveland"), img(2)] } });
  assert.equal(s.images.hero.slides.length, 2, "both still lead the home page");
  assert.equal(s.work.projects.length, 1);
  const [p] = s.work.projects;
  assert.equal(p.town, "Groveland");
  assert.equal(p.service, undefined, "a general photo belongs to no service");
  assert.equal(p.image.url, "/u/1.jpg");
  assert.ok(s._meta.missing_fields.includes("work.projects.0.caption"), "the caption is flagged for the console");
});

test("town photos and a review can earn a town page end to end", () => {
  const s = site({ images: { heroSlides: [img(1, "Minneola"), img(2, "Minneola")] } });
  s.testimonials.items = [{ q: "Fixed our AC the same afternoon.", a: "Dana P.", r: "", stars: 5, town: "Minneola" }];
  assert.equal(qualifiesForAreaPage(s, "Minneola"), true);
});

test("Q2: top towns are kept in the area's spelling, deduped, at most 3; blank is flagged", () => {
  const s = site({ topTowns: ["groveland", "Orlando", "Minneola", "Groveland", "Clermont"] });
  assert.deepEqual(s.extensions.topTowns, ["Groveland", "Minneola", "Clermont"]);
  const none = site({});
  assert.equal(none.extensions.topTowns, null);
  assert.ok(none._meta.missing_fields.includes("extensions.topTowns"));
});

test("Q5: what changes the price is kept per service; a blank one is flagged", () => {
  const s = site({
    serviceList: [
      { name: "AC Repair", tag: "", priceFactors: [" Size of the home ", "", "How hard the unit is to reach"] },
      { name: "Duct Cleaning", tag: "" },
    ],
  });
  assert.deepEqual(s.services.items[0].priceFactors, ["Size of the home", "How hard the unit is to reach"]);
  assert.equal(s.services.items[1].priceFactors, undefined);
  assert.ok(s._meta.missing_fields.includes("services.items.1.priceFactors"));
  assert.ok(!s._meta.missing_fields.includes("services.items.0.priceFactors"));
});

test("the zod boundary keeps the new fields (zImageMeta and zServiceEntry are not passthrough)", () => {
  const parsed = zBrandIntakeSubmission.parse(sub({
    topTowns: ["Minneola"],
    images: { heroSlides: [img(1, "Minneola")] },
    serviceList: [{ name: "AC Repair", tag: "", priceFactors: ["Size of the home"], photos: [img(2, "Groveland")] }],
  }));
  assert.deepEqual(parsed.topTowns, ["Minneola"]);
  assert.equal(parsed.images.heroSlides[0].town, "Minneola");
  assert.deepEqual(parsed.serviceList[0].priceFactors, ["Size of the home"]);
  assert.equal(parsed.serviceList[0].photos[0].town, "Groveland");
});

test("client repos are typed for every new field (SITE_TYPES_SOURCE)", () => {
  for (const needle of ["town?: string", "topTowns?:", "townNotes?:", "priceFactors?:", "typicalVisit?:", "export interface TownNote", "sourceUrl: string"]) {
    assert.ok(SITE_TYPES_SOURCE.includes(needle), `SITE_TYPES_SOURCE lacks ${needle}`);
  }
});

test("an additional enterprise site does not inherit the primary's top towns (a town belongs to one site)", () => {
  const r = mapBrandIntakeToIntake(sub({
    selectedPlan: "enterprise",
    topTowns: ["Minneola"],
    additionalSites: [{
      brandName: "Coastline North", email: "", phone: "", address: "", businessHours: "",
      serviceList: [{ name: "AC Repair", tag: "" }],
      brandDirection: { differentiators: "", targetCustomer: "", vibe: [], tone: [], adjectives: [], references: "", forbidden: "" },
      palette: { mode: "custom", baseColor: "#0F1B2D", accentColor: "#1E6FBF" },
    }],
  }));
  assert.deepEqual(r.sites[0].extensions.topTowns, ["Minneola"]);
  assert.equal(r.sites[1].extensions.topTowns, null);
  assert.ok(r.sites[1]._meta.missing_fields.includes("extensions.topTowns"));
});
