/**
 * Onboarding-form → Intake mapping. Extracted verbatim (v1.0.0) from the agency
 * site's app/lib/site-schema.ts so both repos share one mapper.
 *
 * Fields the form didn't provide are set to null (or sensible defaults for
 * non-nullable strings) and tracked in _meta.missing_fields per the JDD plan:
 * "never invent values for flagged fields — leave placeholders for human review."
 */

import type { FooterLink, SiteContent } from "./site.js";
import type { AdditionalSiteEntry, OnboardingSubmission } from "./submission.js";
import type { Intake } from "./intake.js";

function or(value: string, fallback: string): string {
  return value && value.trim() ? value : fallback;
}

function orNull(value: string): string | null {
  return value && value.trim() ? value : null;
}

function phoneHrefFor(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

/**
 * Convert the sanitized onboarding form submission into the canonical
 * SiteContent shape consumed by each client repo's src/data/site.ts.
 */
export function mapPayloadToSchema(p: OnboardingSubmission): SiteContent {
  const missing: string[] = [];
  const flag = (path: string, val: string) => {
    if (!val || !val.trim()) missing.push(path);
  };

  if (p.formMode === "basic") {
    // Basic mode — all non-contact fields are intentionally skipped; flag all for human review
    missing.push(
      "business.industry", "business.established", "brand.tagline", "business.usp",
      "business.notableClients", "business.businessHours", "business.certifications", "business.awards",
      "branding.palette", "branding.hasLogo", "branding.logo",
      "announcement",
      "seo.title", "seo.description", "seo.canonical", "seo.googleAnalyticsId", "seo.facebookPixelId",
      "extensions.mapsUrl", "extensions.bookingUrl", "extensions.portalUrl",
      "social.linkedin", "social.instagram", "social.facebook", "social.youtube",
      "hero.eyebrow", "hero.headline", "hero.headlineEmphasis", "hero.sub",
      "hero.cta", "hero.secondaryCta", "hero.badge", "hero.frictionReducers", "hero.bullets", "hero.slides",
      "about.eyebrow", "about.title", "about.body", "about.pillars", "about.stats", "about.featureImage",
      "services.eyebrow", "services.title", "services.sub", "services.items",
      "work.eyebrow", "work.title", "work.sub", "work.projects",
      "testimonials.eyebrow", "testimonials.title", "testimonials.items",
      "faq.eyebrow", "faq.title", "faq.sub", "faq.items",
      "finalCta.eyebrow", "finalCta.headline", "finalCta.sub", "finalCta.cta", "finalCta.secondary", "finalCta.frictionReducers",
      "footer.blurb", "footer.legal",
    );
  } else {
    // Detailed / default mode — flag only genuinely empty required fields
    flag("brand.tagline", p.businessDetails.brandTagline);
    flag("brand.address", p.contact.address);
    flag("hero.headline", p.hero.heroHeadline);
    flag("hero.sub", p.hero.heroSub);
    flag("about.body", p.about.aboutBody);
    flag("seo.title", p.seo.seoTitle);
    flag("seo.description", p.seo.seoDescription);

    if (p.services.length === 0) missing.push("services.items");
    if (p.testimonials.length === 0) missing.push("testimonials.items");
    if (p.faqs.length === 0) missing.push("faq.items");
  }

  return {
    brand: {
      name: p.contact.brandName,
      short: or(p.contact.brandShort, p.contact.brandName),
      long: or(p.contact.brandLong, p.contact.brandName),
      established: orNull(p.businessDetails.established),
      tagline: p.businessDetails.brandTagline,
      phone: p.contact.phone,
      phoneHref: phoneHrefFor(p.contact.phone),
      email: p.contact.email,
      address: p.contact.address,
      license: orNull(p.contact.license),
      palette: {
        accent: p.branding.paletteAccent,
        bg: p.branding.paletteBg,
        bgSoft: p.branding.paletteBgSoft,
        ink: p.branding.paletteInk,
        inkSoft: p.branding.paletteInkSoft,
        rule: p.branding.paletteRule,
      },
      typography: {
        fontSans:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontHeading:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        headingWeight: 700,
        bodyWeight: 400,
        headingTracking: "-0.01em",
        headingLineHeight: 1.2,
      },
    },
    nav: [
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Work", href: "#work" },
      { label: "Reviews", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
      { label: "Book", href: "#cta" },
    ],
    announcement: orNull(p.announcement),
    trust: {
      label: "Trusted by",
      logos: p.businessDetails.notableClients
        ? p.businessDetails.notableClients.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
        : [],
    },
    hero: {
      eyebrow: p.hero.heroEyebrow,
      headline: p.hero.heroHeadline,
      headlineEmphasis: orNull(p.hero.heroHeadlineEmphasis),
      sub: p.hero.heroSub,
      formLabel: "Get a free estimate — we'll reach out same day.",
      placeholder: "Your email address",
      cta: or(p.hero.heroCta, "Get Started"),
      secondaryCta: or(p.hero.heroSecondaryCta, `Call ${p.contact.phone}`),
      trust: p.businessDetails.usp,
      badge: orNull(p.hero.heroBadge),
      frictionReducers: p.hero.heroFrictionReducers,
      heroBullets: p.heroBullets,
    },
    about: {
      eyebrow: p.about.aboutEyebrow,
      title: p.about.aboutTitle,
      body: p.about.aboutBody,
      pillars: p.about.pillars,
      stats: p.about.stats,
    },
    services: {
      eyebrow: p.servicesSection.servicesEyebrow,
      title: p.servicesSection.servicesTitle,
      sub: p.servicesSection.servicesSub,
      items: p.services.map((s, i) => ({
        n: String(i + 1).padStart(2, "0"),
        t: s.t,
        d: s.d,
        tag: s.tag,
        image: s.images[0]
          ? { url: s.images[0].url, alt: s.images[0].alt }
          : null,
      })),
    },
    work: {
      eyebrow: p.work.workEyebrow,
      title: p.work.workTitle,
      sub: p.work.workSub,
      hidden: p.work.projects.length === 0,
      projects: p.work.projects.map((pr) => ({
        t: pr.t,
        loc: pr.loc,
        yr: orNull(pr.yr),
        scope: pr.scope,
        size: pr.size,
        caption: pr.caption,
        image: pr.image
          ? { url: pr.image.url, alt: pr.image.alt }
          : null,
      })),
    },
    testimonials: {
      eyebrow: p.testimonialsMeta.testimonialsEyebrow,
      title: p.testimonialsMeta.testimonialsTitle,
      items: p.testimonials.map((t) => ({
        q: t.q,
        a: t.a,
        r: t.r,
        company: orNull(t.company),
        stars: t.stars,
      })),
    },
    faq: {
      eyebrow: p.faqMeta.faqEyebrow,
      title: p.faqMeta.faqTitle,
      sub: p.faqMeta.faqSub,
      items: p.faqs,
    },
    finalCta: {
      eyebrow: p.finalCta.finalCtaEyebrow,
      headline: p.finalCta.finalCtaHeadline,
      sub: p.finalCta.finalCtaSub,
      cta: p.finalCta.finalCtaCta,
      secondary: orNull(p.finalCta.finalCtaSecondary),
      frictionReducers: p.finalCta.finalCtaFrictionReducers,
    },
    footer: {
      blurb: p.footer.footerBlurb,
      cols: (() => {
        const serviceLinks = p.services.map((s) => ({ label: s.t, href: "#services" }));
        const companyLinks = [
          { label: "About Us", href: "#about" },
          { label: "Our Work", href: "#work" },
          { label: "Reviews", href: "#testimonials" },
          { label: "FAQ", href: "#faq" },
          { label: "Contact Us", href: "#cta" },
        ];
        const cols = [];
        if (serviceLinks.length) cols.push({ h: "Services", links: serviceLinks });
        cols.push({ h: "Company", links: companyLinks });
        return cols;
      })(),
      social: [
        p.socialMedia.linkedin
          ? { label: "LinkedIn", href: p.socialMedia.linkedin }
          : null,
        p.socialMedia.instagram
          ? { label: "Instagram", href: p.socialMedia.instagram }
          : null,
        p.socialMedia.facebook
          ? { label: "Facebook", href: p.socialMedia.facebook }
          : null,
        p.socialMedia.youtube
          ? { label: "YouTube", href: p.socialMedia.youtube }
          : null,
      ].filter((x): x is FooterLink => x !== null),
      legalLinks: [],
      legal: p.footer.footerLegal,
    },
    seo: {
      title: p.seo.seoTitle,
      description: p.seo.seoDescription,
      canonical: p.seo.seoCanonical,
      googleAnalyticsId: orNull(p.seo.googleAnalyticsId),
      facebookPixelId: orNull(p.seo.facebookPixelId),
    },
    extensions: {
      trustBadges: p.businessDetails.certifications
        ? p.businessDetails.certifications.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
        : null,
      reviewBadge: null,
      contactDetails: p.contact.address
        ? { address: p.contact.address, mapsUrl: orNull(p.extensions.mapsUrl) }
        : null,
      hours: p.businessDetails.businessHours
        ? { all: p.businessDetails.businessHours }
        : null,
      bookingUrl: orNull(p.extensions.bookingUrl),
      portalUrl: orNull(p.extensions.portalUrl),
    },
    images: {
      hero: {
        portrait: p.images.heroSlides[0]?.url,
        slides: p.images.heroSlides.map((img) => ({ url: img.url, alt: img.alt })),
      },
      about: { feature: p.images.aboutFeature?.url },
      testimonials: {},
      footer: { logoImage: p.images.logo?.url },
    },
    _meta: {
      schema_version: "2.1",
      generated_at: new Date().toISOString(),
      variation: "D",
      is_placeholder: false,
      missing_fields: missing,
      selectedPlan: p.selectedPlan,
      ...(p.formMode ? { formMode: p.formMode } : {}),
      ...(p.scrapeExistingWebsite != null ? { scrapeExistingWebsite: p.scrapeExistingWebsite } : {}),
      ...(p.scrapeWebsiteDomain ? { scrapeWebsiteDomain: p.scrapeWebsiteDomain } : {}),
    },
  };
}

/**
 * Build an additional Enterprise site by overlaying a reduced-form entry on
 * top of the primary site's content. Anything not in the additional-site form
 * inherits from the primary site (typography, SEO defaults, footer copy, nav).
 */
function buildAdditionalSite(
  primary: SiteContent,
  add: AdditionalSiteEntry,
  siteIndex: number,
  siteCount: number,
  siblingSlugs: string[],
): SiteContent {
  const missing: string[] = [];
  const flag = (path: string, val: string) => {
    if (!val || !val.trim()) missing.push(path);
  };
  flag("brand.tagline", add.brandTagline);
  flag("brand.address", add.address);
  flag("hero.headline", add.heroHeadline);
  flag("hero.sub", add.heroSub);
  if (add.services.length === 0) missing.push("services.items");
  if (add.faqs.length === 0) missing.push("faq.items");

  return {
    ...primary,
    brand: {
      ...primary.brand,
      name: add.brandName,
      short: or(add.brandShort, add.brandName),
      long: add.brandName,
      tagline: add.brandTagline,
      phone: add.phone,
      phoneHref: phoneHrefFor(add.phone),
      email: add.email,
      address: add.address,
      palette: {
        accent: add.paletteAccent,
        bg: add.paletteBg,
        bgSoft: add.paletteBgSoft,
        ink: add.paletteInk,
        inkSoft: add.paletteInkSoft,
        rule: add.paletteRule,
      },
    },
    hero: {
      ...primary.hero,
      headline: add.heroHeadline,
      sub: add.heroSub,
      trust: add.usp,
    },
    services: {
      ...primary.services,
      items: add.services.map((s, i) => ({
        n: String(i + 1).padStart(2, "0"),
        t: s.t,
        d: s.d,
        tag: s.tag,
        image: s.images[0]
          ? { url: s.images[0].url, alt: s.images[0].alt }
          : null,
      })),
    },
    faq: {
      ...primary.faq,
      items: add.faqs,
    },
    extensions: {
      ...primary.extensions,
      contactDetails: add.address
        ? { address: add.address, mapsUrl: null }
        : null,
      hours: add.businessHours ? { all: add.businessHours } : null,
    },
    _meta: {
      ...primary._meta,
      generated_at: new Date().toISOString(),
      missing_fields: missing,
      siteIndex,
      siteCount,
      siblingSlugs,
    },
  };
}

/**
 * Convert a submission to an Intake envelope. Single-site for starter/growth;
 * N-site for enterprise.
 */
export function mapPayloadToIntake(p: OnboardingSubmission): Intake {
  const primary = mapPayloadToSchema(p);
  const additionalEntries = (p.additionalSites ?? []).filter((a) => a && a.brandName);

  if (p.selectedPlan !== "enterprise" || additionalEntries.length === 0) {
    return {
      plan: p.selectedPlan,
      siteCount: 1,
      sites: [
        {
          ...primary,
          _meta: { ...primary._meta, siteIndex: 1, siteCount: 1, siblingSlugs: [] },
        },
      ],
    };
  }

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const baseSlug = slugify(primary.brand.short || primary.brand.name);
  const allSiteShorts = [primary.brand.short, ...additionalEntries.map((a) => or(a.brandShort, a.brandName))];
  const siteCount = allSiteShorts.length;
  const allSlugs = allSiteShorts.map((_, i) => `${baseSlug}-${i + 1}`);

  const sites: SiteContent[] = [
    {
      ...primary,
      _meta: {
        ...primary._meta,
        siteIndex: 1,
        siteCount,
        siblingSlugs: allSlugs.slice(1),
      },
    },
    ...additionalEntries.map((entry, i) =>
      buildAdditionalSite(
        primary,
        entry,
        i + 2,
        siteCount,
        allSlugs.filter((_, j) => j !== i + 1),
      ),
    ),
  ];

  return { plan: "enterprise", siteCount, sites };
}
