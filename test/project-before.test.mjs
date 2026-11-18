// v1.41.0 (Xander, 2026-11-18): a job photo can carry the same job BEFORE the work. The job photo
// itself stays `image` (the after), so every reader that only knows `image` keeps working, and the
// pressure washing Before and After section splits a real pair by its clean line. A before photo is
// the client's own upload, never staged or stock, and it only exists beside an after photo.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mapBrandIntakeToIntake, zBrandIntakeSubmission, SITE_TYPES_SOURCE } from "../dist/index.js";

function sub(overrides = {}) {
  return {
    selectedPlan: "growth",
    brandName: "Lakeside Pressure Washing",
    email: "office@example.com",
    phone: "(407) 555-0142",
    address: "1180 W Fairbanks Ave, Winter Park, FL 32789",
    industry: "pressure-washing",
    serviceArea: "Winter Park, Maitland",
    serviceList: [{ name: "Driveway & Sidewalk Cleaning", tag: "Concrete" }],
    brandDirection: { differentiators: "", targetCustomer: "", vibe: [], tone: [], adjectives: [], references: "", forbidden: "" },
    palette: { mode: "custom", baseColor: "#0F1B2D", accentColor: "#1E6FBF" },
    hasLogo: false,
    images: { heroSlides: [] },
    existingWebsiteUrl: "",
    ...overrides,
  };
}
const site = (o) => mapBrandIntakeToIntake(sub(o)).sites[0];
const after = (n, extra = {}) => ({ url: `https://blob.example/after-${n}.jpg`, filename: `after-${n}.jpg`, alt: "", ...extra });
const before = (n, alt = "") => ({ url: `https://blob.example/before-${n}.jpg`, filename: `before-${n}.jpg`, alt });

test("the submission accepts a before photo on a job photo, and keeps it", () => {
  const raw = sub({ serviceList: [{ name: "Driveway & Sidewalk Cleaning", tag: "Concrete", photos: [after(1, { before: before(1) })] }] });
  const parsed = zBrandIntakeSubmission.parse(raw);
  assert.deepEqual(parsed.serviceList[0].photos[0].before, before(1));
});

test("a service photo with a before photo becomes one job with both images", () => {
  const s = site({ serviceList: [{ name: "Driveway & Sidewalk Cleaning", tag: "Concrete", photos: [after(1, { alt: "Driveway in Maitland", before: before(1) })] }] });
  const [p] = s.work.projects;
  assert.deepEqual(p.image, { url: "https://blob.example/after-1.jpg", alt: "Driveway in Maitland" });
  // An uncaptioned before photo takes the job's own caption: true, and nothing invented.
  assert.deepEqual(p.before, { url: "https://blob.example/before-1.jpg", alt: "Driveway in Maitland" });
});

test("a before photo's own alt is kept", () => {
  const s = site({ serviceList: [{ name: "Driveway & Sidewalk Cleaning", tag: "Concrete", photos: [after(1, { before: before(1, "Stained driveway") })] }] });
  assert.equal(s.work.projects[0].before.alt, "Stained driveway");
});

test("no before photo, or a blank one, leaves the job a single photo", () => {
  const s = site({ serviceList: [{ name: "Driveway & Sidewalk Cleaning", tag: "Concrete", photos: [after(1), after(2, { before: { url: "  ", filename: "", alt: "" } })] }] });
  for (const p of s.work.projects) assert.equal("before" in p, false, JSON.stringify(p));
});

test("a town job photo carries its before photo too", () => {
  const s = site({ images: { heroSlides: [after(1, { town: "Maitland", before: before(1) })] } });
  const p = s.work.projects.find((x) => x.town === "Maitland");
  assert.equal(p.before.url, "https://blob.example/before-1.jpg");
});

test("the site types the console reads declare it", () => {
  assert.match(SITE_TYPES_SOURCE, /before\?: \{ url: string; alt: string \} \| null;/);
});
