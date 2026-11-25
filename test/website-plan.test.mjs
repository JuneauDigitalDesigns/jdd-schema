// v1.45.0 — the website-only plan (`website`, shown as "Starter") becomes a real plan id.
//
// Decided 2026-11-24: a $97 website-only plan is the new "Starter", and today's `starter` id
// keeps meaning "with the receptionist", now shown as "Starter + AI Receptionist". Every case
// below pins one rule of that decision, and most pin a trap where the old code would quietly
// treat `website` as a receptionist plan: callbacks on, minutes metered, a number bought.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  PLAN_IDS,
  PLAN_LABELS,
  PLAN_RANK,
  planHasReceptionist,
  isWebOnly,
  siteFeature,
  buildPortalSiteEntries,
  createAccount,
  zPortalSite,
  zPortalAccount,
  leadModeFor,
  mapPayloadToIntake,
  mapBrandIntakeToIntake,
  zIntake,
  zQueuedIntake,
  zBrandIntakeSubmission,
  zOnboardingSubmission,
  zOperatorOrder,
  closeHasSmsStep,
  resumeStepFor,
  tierAtLeast,
  masterNeedsResign,
  raiseTierCeiling,
  legacyMasterFrom,
  zMasterAgreementRef,
  canAddPlan,
  voiceSitesOf,
  meteringGroups,
  SITE_TYPES_SOURCE,
} from "../dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOW = 1_700_000_000_000;

function site(overrides = {}) {
  return {
    slug: "web-co",
    name: "Web Co",
    plan: "website",
    status: "live",
    canonical: "https://webco.example",
    vercelProjectId: "prj_1",
    airtableBaseId: "appX",
    addedAt: NOW,
    ...overrides,
  };
}

// ── The plan list, labels and rank ──────────────────────────────────────────

test("PLAN_IDS lists the four plans, cheapest first", () => {
  assert.deepEqual([...PLAN_IDS], ["website", "starter", "growth", "enterprise"]);
});

test("PLAN_LABELS names every plan, and the ids are never the labels for the two Starters", () => {
  assert.deepEqual(Object.keys(PLAN_LABELS).sort(), [...PLAN_IDS].sort());
  for (const id of PLAN_IDS) {
    assert.ok(PLAN_LABELS[id].name.trim(), `${id} has a name`);
    assert.ok(PLAN_LABELS[id].short.trim(), `${id} has a short form`);
  }
  assert.equal(PLAN_LABELS.website.name, "Starter");
  assert.equal(PLAN_LABELS.website.short, "Starter");
  assert.equal(PLAN_LABELS.starter.name, "Starter + AI Receptionist");
  assert.equal(PLAN_LABELS.starter.short, "Starter + AI");
  assert.equal(PLAN_LABELS.growth.name, "Growth");
  assert.equal(PLAN_LABELS.enterprise.name, "Enterprise");
});

test("PLAN_RANK orders website < starter < growth < enterprise", () => {
  assert.deepEqual(PLAN_RANK, { website: 0, starter: 1, growth: 2, enterprise: 3 });
  assert.deepEqual(Object.keys(PLAN_RANK).sort(), [...PLAN_IDS].sort());
});

test("planHasReceptionist: every plan but website", () => {
  assert.equal(planHasReceptionist("website"), false);
  assert.equal(planHasReceptionist("starter"), true);
  assert.equal(planHasReceptionist("growth"), true);
  assert.equal(planHasReceptionist("enterprise"), true);
});

// ── isWebOnly and the feature gates ─────────────────────────────────────────

test("isWebOnly: the website plan is web-only with or without a stated mode", () => {
  assert.equal(isWebOnly(site()), true);
  assert.equal(isWebOnly(site({ receptionistMode: "declined" })), true);
});

test("isWebOnly: the legacy shape (starter + declined) still reads as web-only", () => {
  assert.equal(isWebOnly(site({ plan: "starter", receptionistMode: "declined" })), true);
});

test("isWebOnly: a receptionist plan without `declined` is not web-only", () => {
  assert.equal(isWebOnly(site({ plan: "starter" })), false);
  assert.equal(isWebOnly(site({ plan: "starter", receptionistMode: "forwarded" })), false);
  assert.equal(isWebOnly(site({ plan: "growth" })), false);
});

test("siteFeature: calls, crm, calendar and messaging are all not-on-plan for website; the inbox is ready", () => {
  const s = site({ a2pStatus: "verified" });
  assert.deepEqual(siteFeature(s, "calls"), { state: "not-on-plan" });
  assert.deepEqual(siteFeature(s, "crm"), { state: "not-on-plan" });
  assert.deepEqual(siteFeature(s, "calendar"), { state: "not-on-plan" });
  assert.deepEqual(siteFeature(s, "messaging"), { state: "not-on-plan" });
  assert.deepEqual(siteFeature(s, "leads"), { state: "ready" });
});

test("zPortalSite and zPortalAccount accept plan website", () => {
  assert.equal(zPortalSite.safeParse(site()).success, true);
  const account = { ...createAccount("owner@example.com", NOW), sites: [site()] };
  assert.equal(zPortalAccount.safeParse(account).success, true);
});

test("buildPortalSiteEntries: a website entry is written as declined, whatever the writer passed", () => {
  // The plan states the receptionist. A writer passing `false` for a website site must not
  // preserve an agent id or a call base that cannot exist.
  const [entry] = buildPortalSiteEntries({
    plan: "website",
    status: "live",
    sites: [{ slug: "web-co", airtableBaseId: "appX", retellAgentId: "agent_STRAY", receptionistDeclined: false }],
  });
  assert.equal(entry.plan, "website");
  assert.equal(entry.receptionistMode, "declined");
  assert.equal(entry.airtableBaseId, null);
  assert.equal(entry.retellAgentId, null);
});

// ── Lead form mode ──────────────────────────────────────────────────────────

test("leadModeFor: website and starter get email forms; only growth and enterprise call back", () => {
  assert.equal(leadModeFor("website"), "email");
  assert.equal(leadModeFor("starter"), "email");
  assert.equal(leadModeFor("growth"), "phone");
  assert.equal(leadModeFor("enterprise"), "phone");
});

test("leadModeFor: an unknown plan never turns callbacks on", () => {
  // The trap: "not starter" used to mean "phone". Callbacks are an explicit list.
  assert.equal(leadModeFor("bogus"), "email");
  assert.equal(leadModeFor(undefined), "email");
});

// ── The intake trust boundary ───────────────────────────────────────────────

/** A complete-but-mostly-empty submission, as in schema.test.mjs; fill only what a test needs. */
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
    seo: { seoTitle: "Peak | HVAC", seoDescription: "Juneau HVAC", seoCanonical: "", facebookPixelId: "" },
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


function intakeFor(plan, receptionistMode) {
  const intake = mapPayloadToIntake(sampleSubmission());
  const out = { ...intake, plan };
  if (receptionistMode !== undefined) out.receptionistMode = receptionistMode;
  return out;
}

test("zIntake keeps receptionistMode instead of silently dropping it", () => {
  const parsed = zIntake.parse(intakeFor("starter", "forwarded"));
  assert.equal(parsed.receptionistMode, "forwarded");
});

test("zIntake: website accepts no mode or declined, and refuses a receptionist mode", () => {
  assert.equal(zIntake.safeParse(intakeFor("website")).success, true);
  assert.equal(zIntake.safeParse(intakeFor("website", "declined")).success, true);
  assert.equal(zIntake.safeParse(intakeFor("website", "forwarded")).success, false);
  assert.equal(zIntake.safeParse(intakeFor("website", "published")).success, false);
});

test("zIntake: a receptionist plan refuses declined on a new submission", () => {
  for (const plan of ["starter", "growth", "enterprise"]) {
    assert.equal(zIntake.safeParse(intakeFor(plan, "declined")).success, false, plan);
    assert.equal(zIntake.safeParse(intakeFor(plan, "forwarded")).success, true, plan);
    assert.equal(zIntake.safeParse(intakeFor(plan)).success, true, `${plan} with no mode`);
  }
});

test("zIntake: the starter + declined refusal names the website plan", () => {
  const res = zIntake.safeParse(intakeFor("starter", "declined"));
  assert.equal(res.success, false);
  assert.match(res.error.issues.map((i) => i.message).join(" "), /website/);
});

test("zQueuedIntake: a stored legacy starter + declined intake still reads", () => {
  // The queue holds records written before website existed. Refusing them on read would strand
  // them; new ones cannot be made, because the onboarding POST refuses the shape.
  const record = {
    id: "q1",
    receivedAt: NOW,
    status: "pending",
    plan: "starter",
    brandName: "Peak",
    slugGuess: "peak",
    sessionId: "cs_1",
    intake: intakeFor("starter", "declined"),
  };
  const parsed = zQueuedIntake.parse(record);
  assert.equal(parsed.intake.receptionistMode, "declined");
  const bad = { ...record, intake: intakeFor("website", "forwarded") };
  assert.equal(zQueuedIntake.safeParse(bad).success, false);
});

function brandSubmission(overrides = {}) {
  return {
    selectedPlan: "website",
    brandName: "Web Co",
    brandDirection: {},
    palette: { mode: "preset", presetId: "slate" },
    images: { heroSlides: [] },
    ...overrides,
  };
}

test("zBrandIntakeSubmission accepts selectedPlan website", () => {
  assert.equal(zBrandIntakeSubmission.safeParse(brandSubmission()).success, true);
  assert.equal(
    zBrandIntakeSubmission.safeParse(brandSubmission({ receptionistMode: "declined" })).success,
    true,
  );
});

test("zBrandIntakeSubmission refuses website + a receptionist mode and starter + declined", () => {
  assert.equal(
    zBrandIntakeSubmission.safeParse(brandSubmission({ receptionistMode: "forwarded" })).success,
    false,
  );
  assert.equal(
    zBrandIntakeSubmission.safeParse(
      brandSubmission({ selectedPlan: "starter", receptionistMode: "declined" }),
    ).success,
    false,
  );
});

test("the mapper carries the website plan onto the envelope", () => {
  const intake = mapBrandIntakeToIntake(zBrandIntakeSubmission.parse(brandSubmission()));
  assert.equal(intake.plan, "website");
  assert.equal(intake.sites[0]._meta.selectedPlan, "website");
});

test("zOnboardingSubmission accepts selectedPlan website", () => {
  assert.equal(zOnboardingSubmission.safeParse(sampleSubmission({ selectedPlan: "website" })).success, true);
});

// ── Operator orders ─────────────────────────────────────────────────────────

function order(overrides = {}) {
  return {
    id: "ord_1",
    version: 1,
    source: "operator-call",
    status: "fulfilled",
    leadId: "lead_1",
    siteSlug: "web-co",
    plan: "website",
    period: "monthly",
    pricing: { kind: "standard" },
    client: {
      legalName: "Web Co LLC",
      entityType: "LLC",
      address: "1 Example Ave, Orlando, FL 32801",
      contactTitle: "Owner",
      contactName: "Pat Example",
      email: "pat@webco.example",
      phone: "+14075550100",
    },
    vertical: "plumbing",
    operator: "xander",
    convertedAt: NOW,
    events: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

test("zOperatorOrder: a website order parses with no receptionist mode", () => {
  assert.equal(zOperatorOrder.safeParse(order()).success, true);
});

test("zOperatorOrder: a website order refuses a receptionist mode", () => {
  for (const mode of ["forwarded", "published", "declined"]) {
    assert.equal(zOperatorOrder.safeParse(order({ receptionistMode: mode })).success, false, mode);
  }
});

test("zOperatorOrder: a legacy starter + declined order still parses", () => {
  assert.equal(
    zOperatorOrder.safeParse(order({ plan: "starter", receptionistMode: "declined" })).success,
    true,
  );
});

test("a website close has no SMS step and resumes at done", () => {
  assert.equal(closeHasSmsStep("website"), false);
  assert.equal(resumeStepFor({ order: order(), a2pStatus: null }), "done");
});

// ── Agreements ──────────────────────────────────────────────────────────────

function master(tierCeiling) {
  return { agreementId: "agr_1", version: "v7", tierCeiling, signedAt: NOW };
}

test("tierAtLeast: website sits below starter", () => {
  assert.equal(tierAtLeast("starter", "website"), true);
  assert.equal(tierAtLeast("website", "starter"), false);
  assert.equal(tierAtLeast("website", "website"), true);
  assert.equal(tierAtLeast("enterprise", "website"), true);
});

test("a website master must re-sign for Starter + AI, and the ceiling rises", () => {
  assert.equal(zMasterAgreementRef.safeParse(master("website")).success, true);
  assert.equal(masterNeedsResign(master("website"), "v7", "starter"), true);
  assert.equal(masterNeedsResign(master("website"), "v7", "growth"), true);
  assert.equal(masterNeedsResign(master("website"), "v7", "website"), false);
  assert.equal(masterNeedsResign(master("starter"), "v7", "website"), false);
  assert.equal(raiseTierCeiling(master("website"), "starter").tierCeiling, "starter");
  assert.equal(raiseTierCeiling(master("starter"), "website").tierCeiling, "starter");
});

test("legacyMasterFrom starts the ceiling at the lowest plan", () => {
  assert.equal(legacyMasterFrom([{ plan: "website", addedAt: NOW }]).tierCeiling, "website");
  assert.equal(
    legacyMasterFrom([{ plan: "website", addedAt: NOW }, { plan: "starter", addedAt: NOW }]).tierCeiling,
    "starter",
  );
  assert.equal(
    legacyMasterFrom([{ plan: "growth", addedAt: NOW }, { plan: "website", addedAt: NOW }]).tierCeiling,
    "growth",
  );
});

// ── Entitlements and metering ───────────────────────────────────────────────

test("canAddPlan: website is unlimited per account, like Starter", () => {
  const account = {
    ...createAccount("owner@example.com", NOW),
    sites: [site({ slug: "a" }), site({ slug: "b" }), site({ slug: "c" })],
  };
  assert.equal(canAddPlan(account, "website"), null);
});

test("a website site is never metered, even with a stray agent id", () => {
  const stray = site({ retellAgentId: "agent_STRAY" });
  assert.deepEqual(voiceSitesOf([stray]), []);
  const caps = { starter: 100, growth: 350, enterprise: 1050 };
  assert.deepEqual(meteringGroups([stray], caps), []);
  // Next to a real Starter + AI site, only that one gets an allowance.
  const groups = meteringGroups([stray, site({ slug: "s", plan: "starter", retellAgentId: "agent_S" })], caps);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].ref, "s");
  assert.equal(groups[0].cap, 100);
});

// ── The selectedPlan unions ─────────────────────────────────────────────────

test("every selectedPlan and plan union names website", () => {
  // Types are erased at runtime, so read the source. A union left at three members makes a
  // client repo's `_meta.selectedPlan: "website"` fail its build at type-check.
  // Only type declarations: a string-literal union, not a value such as `selectedPlan: plan,`.
  const union = /(?:selectedPlan|plan)\??:\s*("[a-z]+"(?:\s*\|\s*"[a-z]+")+);/g;
  const files = ["src/site.ts", "src/brand-intake.ts", "src/submission.ts", "src/intake.ts"];
  for (const file of files) {
    const src = readFileSync(join(ROOT, file), "utf8");
    const found = [...src.matchAll(union)].filter((m) => m[1].includes('"growth"'));
    assert.ok(found.length > 0, `${file} declares a plan union`);
    for (const m of found) assert.match(m[1], /"website"/, `${file}: ${m[1]}`);
  }
  const mirror = [...SITE_TYPES_SOURCE.matchAll(/selectedPlan:\s*([^;]+);/g)];
  assert.ok(mirror.length > 0);
  for (const m of mirror) assert.match(m[1], /"website"/, `SITE_TYPES_SOURCE: ${m[1]}`);
});
