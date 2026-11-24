/**
 * Runtime validators for the two trust boundaries:
 *   - zOnboardingSubmission — the agency POST /api/onboarding handler.
 *   - zIntake / zQueuedIntake — the console intake/import handler. zIntake is a new intake and
 *     refuses a plan/receptionist mismatch; zQueuedIntake reads stored records and still
 *     accepts the legacy web-only Starter.
 *
 * These are intentionally structural (not exhaustive on every copy field) so
 * they reject malformed envelopes without rejecting valid, partially-filled
 * submissions. Deep copy objects use passthrough; the mapper owns their shape.
 */

import { z } from "zod";
import { PROFILE_KINDS } from "./profiles.js";
import { PLAN_IDS } from "./plans.js";
import { receptionistModeProblem } from "./intake.js";

const plan = z.enum(PLAN_IDS);

/**
 * The onboarding activation choice.
 *
 * Since v1.45.0 web-only is its own plan, `website`, where the mode is absent or `declined`.
 * On the other plans a new submission never says `declined`. `receptionistModeProblem` is the
 * rule, applied below to `zIntake` and `zBrandIntakeSubmission`.
 *
 * Optional rather than required, deliberately: a client who was mid-form when the activation
 * step deployed submits the old shape, and rejecting their submission outright would lose the
 * whole intake. An absent value means "not yet asked" and is resolved before provisioning,
 * which refuses to guess. It must never be defaulted to a choice the client did not make.
 */
const receptionistMode = z.enum(["forwarded", "published", "declined"]);

export const zImageMeta = z.object({
  url: z.string(),
  filename: z.string(),
  alt: z.string(),
  // v1.34.0: Q1, the town a job photo was taken in. Not passthrough, so it must be declared.
  town: z.string().optional(),
  // v1.41.0: the same job BEFORE the work, beside this photo (the after). The client's own upload.
  before: z.object({ url: z.string(), filename: z.string(), alt: z.string() }).optional(),
});

const svc = z.object({
  t: z.string(),
  tag: z.string(),
  d: z.string(),
  images: z.array(zImageMeta).default([]),
});

const faqPair = z.object({ q: z.string(), a: z.string() });

export const zAdditionalSiteEntry = z
  .object({
    brandName: z.string(),
    brandShort: z.string().default(""),
    brandTagline: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    address: z.string().default(""),
    paletteAccent: z.string().default(""),
    paletteBg: z.string().default(""),
    paletteBgSoft: z.string().default(""),
    paletteInk: z.string().default(""),
    paletteInkSoft: z.string().default(""),
    paletteRule: z.string().default(""),
    heroHeadline: z.string().default(""),
    heroSub: z.string().default(""),
    businessHours: z.string().default(""),
    usp: z.string().default(""),
    services: z.array(svc).default([]),
    faqs: z.array(faqPair).default([]),
  })
  .passthrough();

/**
 * Structural validation of the onboarding payload. Top-level shape is required;
 * nested objects allow unknown keys (passthrough) to stay forward-compatible.
 */
export const zOnboardingSubmission = z
  .object({
    selectedPlan: plan,
    contact: z.object({}).passthrough(),
    businessDetails: z.object({}).passthrough(),
    branding: z.object({}).passthrough(),
    announcement: z.string().optional().default(""),
    seo: z.object({}).passthrough(),
    extensions: z.object({}).passthrough(),
    socialMedia: z.object({}).passthrough(),
    hero: z.object({}).passthrough(),
    about: z.object({}).passthrough(),
    servicesSection: z.object({}).passthrough(),
    work: z.object({}).passthrough(),
    testimonialsMeta: z.object({}).passthrough(),
    faqMeta: z.object({}).passthrough(),
    finalCta: z.object({}).passthrough(),
    footer: z.object({}).passthrough(),
    images: z.object({}).passthrough(),
    services: z.array(svc).default([]),
    testimonials: z.array(z.object({}).passthrough()).default([]),
    heroBullets: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
    faqs: z.array(faqPair).default([]),
    additionalSites: z.array(zAdditionalSiteEntry).optional(),
    formMode: z.enum(["basic", "detailed"]).optional(),
    scrapeExistingWebsite: z.boolean().optional(),
    scrapeWebsiteDomain: z.string().optional(),
  })
  .passthrough();

/** Per-site _meta must at least carry the plan + missing_fields array. */
const zSiteMeta = z
  .object({
    schema_version: z.string(),
    missing_fields: z.array(z.string()),
    selectedPlan: plan,
  })
  .passthrough();

/** A site is validated structurally: brand + _meta present, rest passthrough. */
export const zSiteContent = z
  .object({
    brand: z.object({ name: z.string() }).passthrough(),
    _meta: zSiteMeta,
  })
  .passthrough();

/** v1.11.0 — SMS alert opt-in snapshot carried on the envelope. */
export const zSmsAlerts = z.object({
  consented: z.boolean(),
  phone: z.string().nullable(),
  consentedAt: z.string().nullable(),
});

// NOTE: zIntake has no .passthrough(), so a key absent from this object is silently
// dropped on parse. smsAlerts has to be declared here or onboard.js would receive an
// envelope that quietly lost it. receptionistMode was missing until v1.45.0, and was
// silently dropped for exactly that reason.
const zIntakeShape = z.object({
  plan,
  receptionistMode: receptionistMode.optional(),
  siteCount: z.number().int().positive().optional(),
  sites: z.array(zSiteContent).min(1),
  smsAlerts: zSmsAlerts.nullish(),
});

function planModeRefinement(planKey: "plan" | "selectedPlan", legacy: boolean) {
  return (val: Record<string, unknown>, ctx: z.RefinementCtx) => {
    const problem = receptionistModeProblem(
      String(val[planKey]),
      val.receptionistMode as z.infer<typeof receptionistMode> | undefined,
      { legacy },
    );
    if (problem) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["receptionistMode"], message: problem });
    }
  };
}

/** A new intake: the plan and the receptionist mode must agree (`receptionistModeProblem`). */
export const zIntake = zIntakeShape.superRefine(planModeRefinement("plan", false));

/**
 * A stored intake on the queue. Same shape, but it still reads the legacy `starter` +
 * `declined` web-only shape, so a record queued before v1.45.0 is not stranded. New ones cannot
 * be made: the onboarding POST parses `zBrandIntakeSubmission`, which refuses the pair.
 */
const zStoredIntake = zIntakeShape.superRefine(planModeRefinement("plan", true));

export const zQueuedIntake = z.object({
  id: z.string(),
  receivedAt: z.number(),
  status: z.enum(["pending", "imported"]),
  plan: z.string(),
  brandName: z.string(),
  slugGuess: z.string(),
  sessionId: z.string(),
  intake: zStoredIntake,
});

// ─── v1.1.0 — brand-direction intake ─────────────────────────────────────────

export const zBrandDirection = z.object({
  differentiators: z.string().default(""),
  targetCustomer: z.string().default(""),
  vibe: z.array(z.string()).default([]),
  tone: z.array(z.string()).default([]),
  adjectives: z.array(z.string()).default([]),
  references: z.string().default(""),
  forbidden: z.string().default(""),
});

const zHex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const zPalettePick = z.object({
  mode: z.enum(["preset", "custom"]),
  presetId: z.string().optional(),
  baseColor: z.string().optional(),
  accentColor: z.string().optional(),
  // v1.2 — absent bgMood means "white", so pre-1.2 picks validate unchanged.
  bgMood: z.enum(["white", "warm", "cool", "soft-dark", "deep-dark"]).optional(),
  overrides: z
    .object({
      accent: zHex.optional(),
      accentFg: zHex.optional(),
      accent2: zHex.optional(),
      bg: zHex.optional(),
      bgSoft: zHex.optional(),
      ink: zHex.optional(),
      inkSoft: zHex.optional(),
      rule: zHex.optional(),
    })
    .optional(),
});

// v1.32.0: per-service facts, nested so the submission needs no key scheme. This object is NOT
// passthrough, so every nested field must be declared here or parse silently drops it.
const zQuestion = z.object({ q: z.string(), a: z.string().default("") });
const zServiceEntry = z.object({
  name: z.string(),
  tag: z.string().default(""),
  included: z.array(z.string()).optional(),
  typicalJobs: z.array(z.string()).optional(),
  areas: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  duration: z.string().optional(),
  priceFrom: z.string().optional(),
  photos: z.array(zImageMeta).optional(),
  questions: z.array(zQuestion).optional(),
  priceFactors: z.array(z.string()).optional(), // v1.34.0: Q5
});
const zProfileLink = z.object({
  kind: z.enum(PROFILE_KINDS),
  url: z.string(),
  label: z.string().optional(),
});

export const zBrandIntakeSubmission = z
  .object({
    selectedPlan: plan,
    receptionistMode: receptionistMode.optional(),
    brandName: z.string().default(""),
    brandShort: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    address: z.string().default(""),
    license: z.string().default(""),
    industry: z.string().default(""),
    established: z.string().default(""),
    ownerName: z.string().default(""),
    brandsCarried: z.string().default(""),
    responseTime: z.string().default(""),
    notableClients: z.string().default(""),
    certifications: z.string().default(""),
    businessHours: z.string().default(""),
    serviceArea: z.string().default(""),
    agentName: z.string().default(""),
    serviceList: z.array(zServiceEntry).default([]),
    brandDirection: zBrandDirection,
    palette: zPalettePick,
    hasLogo: z.boolean().default(false),
    images: z
      .object({
        logo: zImageMeta.optional(),
        monogram: zImageMeta.optional(),
        heroSlides: z.array(zImageMeta).default([]),
        aboutFeature: zImageMeta.optional(),
      })
      .passthrough(),
    existingWebsiteUrl: z.string().default(""),
    announcement: z.string().default(""),
    // vertical-templates-v1 (PLAN §3.2, 2026-10-28). Structural, same level of rigor as
    // serviceList above — not deep copy-field validation (the mapper owns that), but real
    // shape checks rather than the passthrough a plain copy blob would get.
    stats: z
      .array(z.object({ key: z.string(), value: z.string(), label: z.string() }))
      .optional(),
    reviewAggregate: z
      .object({ score: z.string(), count: z.string(), url: z.string().optional() })
      .nullable()
      .optional(),
    servicePrices: z.record(z.string()).optional(),
    seasons: z
      .array(z.object({ key: z.string(), label: z.string(), body: z.string() }))
      .optional(),
    serviceRadiusMiles: z.string().optional(),
    offerBadge: z.string().optional(),
    // v1.32.0 (2026-11-10): site-wide SEO facts. Absent = not asked (an older form).
    serviceAreaBusiness: z.boolean().optional(),
    profiles: z.array(zProfileLink).optional(),
    customerQuestions: z.array(zQuestion).optional(),
    // v1.34.0 (local SEO, 2026-11-12): Q2, the towns the client gets the most work from.
    topTowns: z.array(z.string()).optional(),
    additionalSites: z
      .array(
        z
          .object({
            brandName: z.string(),
            brandShort: z.string().default(""),
            email: z.string().default(""),
            phone: z.string().default(""),
            address: z.string().default(""),
            businessHours: z.string().default(""),
            serviceList: z.array(zServiceEntry).default([]),
            palette: zPalettePick,
            brandDirection: zBrandDirection,
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough()
  .superRefine(planModeRefinement("selectedPlan", false));
