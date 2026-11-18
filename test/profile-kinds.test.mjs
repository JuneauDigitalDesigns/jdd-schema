// v1.39.0 (2026-11-17): LinkedIn, YouTube, TikTok and X become profile kinds of their own.
//
// The lead card already offered them, but PROFILE_KINDS stopped at google, facebook, yelp, bbb,
// angi, nextdoor and instagram, so each was stored as "other". A footer could then only guess the
// platform from the address, and the intake rejected the kind outright. Each now has its own kind,
// in the footer's display order, with "other" still last.
import { test } from "node:test";
import assert from "node:assert/strict";
import { PROFILE_KINDS, SITE_TYPES_SOURCE, zBrandIntakeSubmission, mapBrandIntakeToIntake } from "../dist/index.js";

const NEW = ["linkedin", "youtube", "tiktok", "x"];

function intake(profiles) {
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
    notableClients: "",
    certifications: "",
    businessHours: "Mon–Fri 7–6",
    serviceArea: "Juneau, Douglas",
    agentName: "Mia",
    serviceList: [{ name: "AC Repair", tag: "HVAC" }],
    brandDirection: {
      differentiators: "Same-day diagnostics",
      targetCustomer: "Homeowners",
      vibe: ["Modern"],
      tone: ["Friendly"],
      adjectives: ["fast"],
      references: "",
      forbidden: "",
    },
    palette: { mode: "custom", baseColor: "#0F1B2D", accentColor: "#1E6FBF" },
    hasLogo: false,
    images: {},
    existingWebsiteUrl: "",
    announcement: "",
    profiles,
  };
}

test("LinkedIn, YouTube, TikTok and X are profile kinds, before 'other'", () => {
  for (const k of NEW) assert.ok(PROFILE_KINDS.includes(k), `${k} is not a profile kind`);
  assert.equal(PROFILE_KINDS.at(-1), "other");
  assert.deepEqual(
    PROFILE_KINDS,
    ["google", "facebook", "yelp", "bbb", "angi", "nextdoor", "instagram", "linkedin", "youtube", "tiktok", "x", "other"],
  );
});

test("the intake accepts each new kind and carries it onto the site", () => {
  const profiles = [
    { kind: "linkedin", url: "https://www.linkedin.com/company/peak-home" },
    { kind: "youtube", url: "https://www.youtube.com/@peakhome" },
    { kind: "tiktok", url: "https://www.tiktok.com/@peakhome" },
    { kind: "x", url: "https://x.com/peakhome" },
  ];
  const res = zBrandIntakeSubmission.safeParse(intake(profiles));
  assert.equal(res.success, true, JSON.stringify(res.error?.issues?.slice(0, 2)));
  const site = mapBrandIntakeToIntake(res.data).sites[0];
  assert.deepEqual(site.extensions.profiles.map((p) => p.kind), NEW);
});

test("the client repo's inlined types list exactly the same kinds", () => {
  const m = /kind: ((?:"[a-z]+"(?: \| )?)+);/.exec(SITE_TYPES_SOURCE.slice(SITE_TYPES_SOURCE.indexOf("ProfileLink")));
  assert.ok(m, "no ProfileLink kind union in SITE_TYPES_SOURCE");
  assert.deepEqual(m[1].split(" | ").map((s) => s.replace(/"/g, "")), [...PROFILE_KINDS]);
});
