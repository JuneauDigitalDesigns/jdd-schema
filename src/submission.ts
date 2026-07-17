/**
 * The onboarding-form payload — what juneau-digital-designs/app/onboarding POSTs
 * to /api/onboarding. `mapPayloadToIntake` (./map.ts) converts this into the
 * canonical Intake envelope.
 *
 * v1.0.0: extracted verbatim from the agency site's app/lib/site-schema.ts with
 * no field changes. The brand-direction fields land in v1.1.0.
 */

export type ImageMeta = { url: string; filename: string; alt: string };

export interface OnboardingSubmission {
  selectedPlan: "starter" | "growth" | "enterprise";
  contact: {
    brandName: string;
    brandLong: string;
    brandShort: string;
    email: string;
    phone: string;
    address: string;
    license: string;
    websiteType: string;
  };
  businessDetails: {
    industry: string;
    established: string;
    brandTagline: string;
    usp: string;
    notableClients: string;
    certifications: string;
    awards: string;
    businessHours: string;
  };
  branding: {
    paletteAccent: string;
    paletteBg: string;
    paletteBgSoft: string;
    paletteInk: string;
    paletteInkSoft: string;
    paletteRule: string;
    hasLogo: string;
  };
  announcement: string;
  seo: {
    seoTitle: string;
    seoDescription: string;
    seoCanonical: string;
    googleAnalyticsId: string;
    facebookPixelId: string;
  };
  extensions: { mapsUrl: string; bookingUrl: string; portalUrl: string };
  socialMedia: { linkedin: string; instagram: string; facebook: string; youtube: string };
  hero: {
    heroEyebrow: string;
    heroHeadline: string;
    heroHeadlineEmphasis: string;
    heroSub: string;
    heroCta: string;
    heroSecondaryCta: string;
    heroBadge: string;
    heroFrictionReducers: string[];
  };
  about: {
    aboutEyebrow: string;
    aboutTitle: string;
    aboutBody: string;
    pillars: Array<{ k: string; t: string; d: string }>;
    stats: Array<{ n: string; l: string }>;
  };
  servicesSection: { servicesEyebrow: string; servicesTitle: string; servicesSub: string };
  work: {
    workEyebrow: string;
    workTitle: string;
    workSub: string;
    projects: Array<{
      t: string;
      loc: string;
      yr: string;
      scope: string;
      size: string;
      caption: string;
      image?: ImageMeta;
    }>;
  };
  testimonialsMeta: { testimonialsEyebrow: string; testimonialsTitle: string };
  faqMeta: { faqEyebrow: string; faqTitle: string; faqSub: string };
  finalCta: {
    finalCtaEyebrow: string;
    finalCtaHeadline: string;
    finalCtaSub: string;
    finalCtaCta: string;
    finalCtaSecondary: string;
    finalCtaFrictionReducers: string[];
  };
  footer: { footerBlurb: string; footerLegal: string };
  images: { heroSlides: ImageMeta[]; logo?: ImageMeta; aboutFeature?: ImageMeta };
  services: Array<{ t: string; tag: string; d: string; images: ImageMeta[] }>;
  testimonials: Array<{
    q: string;
    a: string;
    r: string;
    company: string;
    stars: number;
  }>;
  heroBullets: Array<{ value: string; label: string }>;
  faqs: Array<{ q: string; a: string }>;
  /**
   * Enterprise tier only: additional sites beyond the primary. Each entry
   * uses a reduced field set; missing fields inherit from the primary site
   * during mapping.
   */
  additionalSites?: AdditionalSiteEntry[];
  /** Basic vs. Detailed onboarding mode selected by the client. */
  formMode?: "basic" | "detailed";
  /** Whether the client wants their existing website scraped for content. */
  scrapeExistingWebsite?: boolean;
  /** Domain of existing website to scrape (when scrapeExistingWebsite is true). */
  scrapeWebsiteDomain?: string;
}

export interface AdditionalSiteEntry {
  brandName: string;
  brandShort: string;
  brandTagline: string;
  email: string;
  phone: string;
  address: string;
  paletteAccent: string;
  paletteBg: string;
  paletteBgSoft: string;
  paletteInk: string;
  paletteInkSoft: string;
  paletteRule: string;
  heroHeadline: string;
  heroSub: string;
  businessHours: string;
  usp: string;
  services: Array<{ t: string; tag: string; d: string; images: ImageMeta[] }>;
  faqs: Array<{ q: string; a: string }>;
}
