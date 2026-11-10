// v1.32.0 (2026-11-10): the per-service facts a service's own page is built from, and the
// site-wide SEO facts, as the onboarding form submits them and the console intake reads them.
// Every value is client-supplied; a blank is flagged in _meta.missing_fields, never filled.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mapBrandIntakeToIntake,
  zBrandIntakeSubmission,
  qualifiesForServicePage,
  BUILT_IN_VERTICALS,
} from "../dist/index.js";

function sub(overrides = {}) {
  return {
    selectedPlan: "growth",
    brandName: "Coastline Heating & Air",
    email: "office@example.com",
    phone: "(407) 555-0142",
    address: "1180 W Fairbanks Ave, Winter Park, FL 32789",
    industry: "HVAC",
    serviceArea: "Winter Park, Maitland, Orlando",
    brandsCarried: "Trane",
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

const site = (o) => mapBrandIntakeToIntake(sub(o)).sites[0];

test("nested service facts land on the ServiceItem, trimmed, blanks and duplicates dropped", () => {
  const s = site({
    serviceList: [{
      name: "AC Repair", tag: "Cooling",
      included: [" Diagnostic ", "", "Refrigerant check", "diagnostic"],
      typicalJobs: ["Warm air from vents", "  "],
      brands: ["Carrier"],
    }],
  });
  const it = s.services.items[0];
  assert.deepEqual(it.included, ["Diagnostic", "Refrigerant check"]);
  assert.deepEqual(it.typicalJobs, ["Warm air from vents"]);
  assert.deepEqual(it.brands, ["Carrier"]);
});

test("absent facts stay absent: no empty arrays, no slug, nothing invented", () => {
  const it = site().services.items[0];
  for (const k of ["included", "typicalJobs", "areas", "brands", "slug", "page"]) {
    assert.equal(k in it, false, `${k} should be absent`);
  }
});

test("areas keep only towns in the service area, spelled as the area spells them", () => {
  const it = site({
    serviceList: [{ name: "AC Repair", tag: "", areas: ["winter park", "Tampa", "Maitland"] }],
  }).services.items[0];
  assert.deepEqual(it.areas, ["Winter Park", "Maitland"]);
});

test("a nested priceFrom wins; the old name-keyed servicePrices is the fallback", () => {
  const s = site({
    serviceList: [{ name: "AC Repair", tag: "", priceFrom: "$89" }, { name: "Duct Cleaning", tag: "" }],
    servicePrices: { "AC Repair": "$129", "Duct Cleaning": "$199" },
  });
  assert.equal(s.services.items[0].priceFrom, "$89");
  assert.equal(s.services.items[1].priceFrom, "$199");
  assert.equal(s._meta.missing_fields.includes("services.priceFrom"), false);
});

test("brands picked on a service are unioned into brandsCarried and trust.logos", () => {
  const s = site({ serviceList: [{ name: "AC Repair", tag: "", brands: ["Carrier", "trane"] }] });
  assert.deepEqual(s.extensions.brandsCarried, ["Trane", "Carrier"]);
  assert.deepEqual(s.trust.logos, ["Trane", "Carrier"]);
});

test("job photos become work.projects tagged with the service slug, captioned, slug stored", () => {
  const s = site({
    serviceList: [
      { name: "AC Repair & Tune-Up", tag: "", photos: [
        { url: "https://x/1.jpg", filename: "1.jpg", alt: "New condenser on a pad" },
        { url: "https://x/2.jpg", filename: "2.jpg", alt: "" },
      ] },
      { name: "Duct Cleaning", tag: "" },
    ],
  });
  const slug = s.services.items[0].slug;
  assert.equal(slug, "ac-repair-tune-up");
  assert.equal(s.services.items[1].slug, undefined, "nothing tagged to it, so no slug is stored yet");
  assert.equal(s.work.projects.length, 2);
  for (const p of s.work.projects) {
    assert.equal(p.service, slug);
    assert.ok(p.caption.trim(), "a photo's caption is its alt text and is never empty");
    assert.equal(p.image.alt, p.caption);
  }
  assert.equal(s.work.projects[1].caption, "AC Repair & Tune-Up");
  assert.equal(s.work.hidden, true);
  // An uncaptioned photo's caption is the service name, flagged for a better one; a client's
  // caption is not flagged.
  assert.ok(s._meta.missing_fields.includes("work.projects.1.caption"));
  assert.equal(s._meta.missing_fields.includes("work.projects.0.caption"), false);
});

test("photo 1 is also the service's own picture; every photo stays a tagged project", () => {
  const photo = (n, alt = "") => ({ url: `https://x/${n}.jpg`, filename: `${n}.jpg`, alt });
  const one = site({ serviceList: [{ name: "AC Repair", tag: "", photos: [photo(1)] }] });
  assert.deepEqual(one.services.items[0].image, { url: "https://x/1.jpg", alt: "AC Repair" });
  assert.equal(one.work.projects.length, 1);

  const three = site({ serviceList: [{ name: "AC Repair", tag: "", photos: [photo(1, "New condenser"), photo(2), photo(3)] }] });
  assert.deepEqual(three.services.items[0].image, { url: "https://x/1.jpg", alt: "New condenser" });
  assert.deepEqual(three.work.projects.map((p) => p.image.url), ["https://x/1.jpg", "https://x/2.jpg", "https://x/3.jpg"]);

  assert.equal(site().services.items[0].image, null, "no photo, no picture: never a placeholder");
});

test("questions: per-service ones are tagged with the slug, general ones are not, blanks dropped", () => {
  const s = site({
    serviceList: [{ name: "AC Repair", tag: "", questions: [{ q: "Is the diagnostic fee waived?", a: "" }, { q: " ", a: "x" }] }],
    customerQuestions: [{ q: "Do you offer financing?", a: "Yes." }],
  });
  assert.deepEqual(s.extensions.customerQuestions, [
    { q: "Do you offer financing?", a: "Yes." },
    { q: "Is the diagnostic fee waived?", a: "", service: "ac-repair" },
  ]);
  assert.equal(s.services.items[0].slug, "ac-repair");
});

test("tags and slugs agree with the shared service-page gate", () => {
  const s = site({
    serviceList: [{
      name: "AC Repair", tag: "",
      included: ["a", "b", "c"],
      questions: [{ q: "Is the diagnostic fee waived?", a: "" }],
    }],
  });
  assert.equal(qualifiesForServicePage(s, 0), true, "included (3+) plus a tagged question");
});

test("every blank new fact is flagged, so the console can tell 'not given' from 'not asked'", () => {
  const mf = site()._meta.missing_fields;
  for (const p of [
    "services.items.0.included", "services.items.0.typicalJobs",
    "services.items.1.included", "services.items.1.typicalJobs",
    "extensions.serviceAreaBusiness", "extensions.profiles", "extensions.customerQuestions",
  ]) {
    assert.ok(mf.includes(p), `${p} should be flagged`);
  }
  assert.equal(mf.some((p) => /\.areas$|\.brands$/.test(p)), false, "areas and brands are optional per service");
});

test("supplied site-wide facts map through and are not flagged; bad profiles are dropped", () => {
  const s = site({
    serviceAreaBusiness: false,
    profiles: [
      { kind: "google", url: " https://g.page/x " },
      { kind: "myspace", url: "https://myspace.com/x" },
      { kind: "yelp", url: "  " },
    ],
  });
  assert.equal(s.extensions.serviceAreaBusiness, false);
  assert.deepEqual(s.extensions.profiles, [{ kind: "google", url: "https://g.page/x" }]);
  const mf = s._meta.missing_fields;
  assert.equal(mf.includes("extensions.serviceAreaBusiness"), false, "false is an answer");
  assert.equal(mf.includes("extensions.profiles"), false);
  assert.equal(site().extensions.serviceAreaBusiness, null, "not asked stays null, never false");
});

test("the zod boundary keeps the nested service facts (zServiceEntry is not passthrough)", () => {
  const parsed = zBrandIntakeSubmission.parse(sub({
    serviceList: [{
      name: "AC Repair", tag: "Cooling",
      included: ["x"], typicalJobs: ["y"], areas: ["Maitland"], brands: ["Trane"], priceFrom: "$89",
      photos: [{ url: "u", filename: "f", alt: "a" }], questions: [{ q: "q?", a: "" }],
    }],
    serviceAreaBusiness: true,
    profiles: [{ kind: "facebook", url: "https://facebook.com/x" }],
    customerQuestions: [{ q: "q2?", a: "a" }],
  }));
  const e = parsed.serviceList[0];
  assert.deepEqual(
    [e.included, e.typicalJobs, e.areas, e.brands, e.priceFrom, e.photos.length, e.questions.length],
    [["x"], ["y"], ["Maitland"], ["Trane"], "$89", 1, 1],
  );
  assert.equal(parsed.serviceAreaBusiness, true);
  assert.equal(parsed.profiles[0].kind, "facebook");
  assert.equal(parsed.customerQuestions.length, 1);
});

test("no copywriter role still tells the model to write testimonials (decision 2026-11-10)", () => {
  assert.ok(BUILT_IN_VERTICALS.length > 0);
  for (const v of BUILT_IN_VERTICALS) {
    assert.ok(v.prompt.role.length > 0);
    assert.doesNotMatch(v.prompt.role, /testimonial/i, `${v.id} role mentions testimonials`);
  }
});

test("duration: the client's words, trimmed; absent when blank; never flagged; not a gate fact", () => {
  const s = site({ serviceList: [{ name: "AC Repair", tag: "", duration: "  Half a day " }, { name: "Duct Cleaning", tag: "", duration: " " }] });
  assert.equal(s.services.items[0].duration, "Half a day");
  assert.equal("duration" in s.services.items[1], false);
  assert.equal(s._meta.missing_fields.some((p) => p.endsWith(".duration")), false);
  // Xander's approved gate is unchanged: a duration adds no fact.
  const base = site({ serviceList: [{ name: "AC Repair", tag: "", included: ["a", "b", "c"] }] });
  const timed = site({ serviceList: [{ name: "AC Repair", tag: "", included: ["a", "b", "c"], duration: "Half a day" }] });
  assert.equal(qualifiesForServicePage(timed, 0), qualifiesForServicePage(base, 0));
  assert.equal(qualifiesForServicePage(timed, 0), false);
  // zServiceEntry is not passthrough: the field must be declared to survive parse.
  const parsed = zBrandIntakeSubmission.parse(sub({ serviceList: [{ name: "AC Repair", tag: "", duration: "A few days" }] }));
  assert.equal(parsed.serviceList[0].duration, "A few days");
});
