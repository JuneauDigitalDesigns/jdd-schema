/**
 * Runtime validators for the two trust boundaries:
 *   - zOnboardingSubmission — the agency POST /api/onboarding handler.
 *   - zIntake / zQueuedIntake — the console intake/import handler.
 *
 * These are intentionally structural (not exhaustive on every copy field) so
 * they reject malformed envelopes without rejecting valid, partially-filled
 * submissions. Deep copy objects use passthrough; the mapper owns their shape.
 */

import { z } from "zod";

const plan = z.enum(["starter", "growth", "enterprise"]);

export const zImageMeta = z.object({
  url: z.string(),
  filename: z.string(),
  alt: z.string(),
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

export const zIntake = z.object({
  plan,
  siteCount: z.number().int().positive().optional(),
  sites: z.array(zSiteContent).min(1),
});

export const zQueuedIntake = z.object({
  id: z.string(),
  receivedAt: z.number(),
  status: z.enum(["pending", "imported"]),
  plan: z.string(),
  brandName: z.string(),
  slugGuess: z.string(),
  sessionId: z.string(),
  intake: zIntake,
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

export const zPalettePick = z.object({
  mode: z.enum(["preset", "custom"]),
  presetId: z.string().optional(),
  baseColor: z.string().optional(),
  accentColor: z.string().optional(),
});

const zServiceEntry = z.object({ name: z.string(), tag: z.string().default("") });

export const zBrandIntakeSubmission = z
  .object({
    selectedPlan: plan,
    brandName: z.string().default(""),
    brandShort: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    address: z.string().default(""),
    license: z.string().default(""),
    industry: z.string().default(""),
    established: z.string().default(""),
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
        heroSlides: z.array(zImageMeta).default([]),
        aboutFeature: zImageMeta.optional(),
      })
      .passthrough(),
    existingWebsiteUrl: z.string().default(""),
    announcement: z.string().default(""),
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
  .passthrough();
