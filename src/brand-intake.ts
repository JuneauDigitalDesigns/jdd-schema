/**
 * The v1.1.0 onboarding payload — "one above minimum". The client provides facts
 * + brand direction only; NO marketing copy. `mapBrandIntakeToIntake` builds a
 * SiteContent SCAFFOLD: real facts, a derived palette, and correctly-SIZED empty
 * copy arrays (so the console copywriter knows how many pillars/FAQs/etc. to
 * write). The brand direction is stored on `_meta.brandDirection` so the console
 * can auto-prefill the copywriter's `details` without re-deriving it.
 *
 * This is additive to the legacy OnboardingSubmission / mapPayloadToIntake, which
 * remain until the agency form is rebuilt to post this shape.
 */

import type {
  BrandContent,
  FooterLink,
  SeoContent,
  SiteContent,
} from "./site.js";
import type { Intake } from "./intake.js";
import type { ImageMeta } from "./submission.js";
import { BrandDirection } from "./brand-direction.js";
import { DEFAULT_STRUCTURE } from "./structure.js";
import { PalettePick, resolvePalette } from "./palette.js";

/** One service the client offers — name + short category tag, no description. */
export interface ServiceEntry {
  name: string;
  tag: string;
}

export interface BrandIntakeSubmission {
  selectedPlan: "starter" | "growth" | "enterprise";

  // ── Contact facts ──
  //
  // The optional ones below are no longer ASKED by the wizard as of the chip-first rebuild.
  // They stay on the type rather than being deleted for two reasons: a client who was
  // mid-form when the new wizard deployed still submits the old shape, and the fields
  // remain legitimate values for the console or a website scan to fill in later.
  brandName: string;
  brandShort?: string; // derived from brandName when absent
  email: string;
  phone: string;
  address: string;
  license?: string;

  // ── Business facts ──
  industry: string; // console maps this to a copywriter VerticalId
  /**
   * decision 29: `established` and `serviceArea` (and `license` above), plus the three new fields
   * below, are ASKED again by the wizard — they are the specifics that stop a site reading as
   * AI-made. The copywriter is still forbidden from inventing any of them; an unsupplied one is
   * flagged in `_meta.missing_fields`, never filled. `notableClients`, `certifications` and
   * `businessHours` remain recovered-or-optional (website scan / console).
   */
  established?: string;
  ownerName?: string;     // owner first or full name (About page + owner-photo caption)
  brandsCarried?: string; // comma/newline list of equipment brands installed/serviced
  responseTime?: string;  // the client's own words, e.g. "under 60 minutes"
  notableClients?: string; // comma/newline list
  certifications?: string; // comma/newline list
  businessHours?: string;
  serviceArea?: string; // comma/newline list of towns
  agentName?: string; // AI phone-agent persona first name; defaults in the console
  serviceList: ServiceEntry[];

  // ── Brand direction (compiled into the copywriter's `details`) ──
  brandDirection: BrandDirection;

  // ── Look & feel ──
  palette: PalettePick;
  hasLogo: boolean;
  images: { logo?: ImageMeta; heroSlides: ImageMeta[]; aboutFeature?: ImageMeta };

  // ── Existing site (fed to the copywriter's `url` scan) ──
  existingWebsiteUrl: string;

  // ── Optional ──
  /** No longer asked; it's a post-launch promo, editable in the console any time. */
  announcement?: string;

  // ── Enterprise only ──
  additionalSites?: AdditionalBrandSite[];
}

/** Enterprise additional site — facts + palette + direction; copy is generated. */
export interface AdditionalBrandSite {
  brandName: string;
  brandShort: string;
  email: string;
  phone: string;
  address: string;
  businessHours: string;
  serviceList: ServiceEntry[];
  palette: PalettePick;
  brandDirection: BrandDirection;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function splitList(value: string): string[] {
  return (value || "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function phoneHrefFor(phone: string): string {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function orNull(value: string): string | null {
  return value && value.trim() ? value : null;
}

function repeat<T>(n: number, make: () => T): T[] {
  return Array.from({ length: n }, make);
}

const DEFAULT_TYPOGRAPHY: BrandContent["typography"] = {
  fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontHeading: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headingWeight: 700,
  bodyWeight: 400,
  headingTracking: "-0.01em",
  headingLineHeight: 1.2,
};

interface SiteFacts {
  brandName: string;
  /**
   * Optional now the wizard no longer asks for it. `buildScaffold` falls back to
   * `brandName`, which is what the old field defaulted to anyway.
   */
  brandShort?: string;
  /** The client's industry pick. Carried onto `_meta` for the console's vertical. */
  industry?: string;
  email: string;
  phone: string;
  address: string;
  license?: string;
  established?: string;
  ownerName?: string;
  brandsCarried?: string;
  responseTime?: string;
  businessHours?: string;
  serviceArea?: string;
  agentName?: string;
  certifications?: string;
  notableClients?: string;
  announcement?: string;
  serviceList: ServiceEntry[];
  brandDirection: BrandDirection;
  palette: PalettePick;
  hasLogo?: boolean;
  images?: { logo?: ImageMeta; heroSlides: ImageMeta[]; aboutFeature?: ImageMeta };
  existingWebsiteUrl?: string;
}

/** Empty copy fields at the RIGHT cardinality so the copywriter fills them in place. */
function buildScaffold(f: SiteFacts, plan: SiteContent["_meta"]["selectedPlan"]): SiteContent {
  const S = DEFAULT_STRUCTURE;
  const missing: string[] = [];
  const flag = (path: string, ok: unknown) => {
    if (!ok) missing.push(path);
  };
  flag("brand.phone", f.phone && f.phone.trim());
  flag("brand.email", f.email && f.email.trim());
  flag("brand.address", f.address && f.address.trim());
  flag("brand.license", f.license && f.license.trim());
  flag("brand.established", f.established && f.established.trim());
  // decision 29: the specificity fields. Flagged when blank so the no-inventing rule is visible
  // in the console's Intake checklist rather than silently producing a generic site.
  flag("extensions.serviceArea", f.serviceArea && f.serviceArea.trim());
  flag("extensions.ownerName", f.ownerName && f.ownerName.trim());
  flag("trust.logos", f.brandsCarried && f.brandsCarried.trim());
  flag("extensions.responseTime", f.responseTime && f.responseTime.trim());
  // Flag on the real value. This was hardcoded `true`, so a client who never picked an
  // industry was recorded as having answered — which mattered because the value was being
  // dropped entirely a few lines below, and the flag was the only trace it had been asked.
  flag("business.industry", f.industry && f.industry.trim());
  if (f.serviceList.length === 0) missing.push("services.items");
  if (!f.hasLogo) missing.push("branding.logo");
  if (!f.images || f.images.heroSlides.length === 0) missing.push("images.hero");
  if (!f.existingWebsiteUrl || !f.existingWebsiteUrl.trim()) missing.push("existingWebsiteUrl");

  const serviceLinks: FooterLink[] = f.serviceList.map((s) => ({ label: s.name, href: "#services" }));
  const seo: SeoContent = {
    title: "",
    description: "",
    canonical: f.existingWebsiteUrl && f.existingWebsiteUrl.trim() ? f.existingWebsiteUrl.trim() : "",
    googleAnalyticsId: null,
    facebookPixelId: null,
  };

  return {
    brand: {
      name: f.brandName,
      short: f.brandShort && f.brandShort.trim() ? f.brandShort : f.brandName,
      long: f.brandName,
      established: orNull(f.established ?? ""),
      tagline: "",
      phone: f.phone,
      phoneHref: phoneHrefFor(f.phone),
      email: f.email,
      address: f.address,
      license: orNull(f.license ?? ""),
      palette: resolvePalette(f.palette),
      typography: DEFAULT_TYPOGRAPHY,
    },
    nav: [
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Work", href: "#work" },
      { label: "Reviews", href: "#testimonials" },
      { label: "FAQ", href: "#faq" },
      { label: "Book", href: "#cta" },
    ],
    announcement: orNull(f.announcement ?? ""),
    // Brands carried (decision 29) join notable clients in trust.logos, which is where TrustBadges
    // reads them; the HVAC preset relabels this to "Brands we install". Certifications stay in
    // extensions.trustBadges, as before.
    trust: { label: "Trusted by", logos: splitList([f.notableClients, f.brandsCarried].filter((x) => x && x.trim()).join("\n")) },
    hero: {
      eyebrow: "",
      headline: "",
      headlineEmphasis: null,
      sub: "",
      formLabel: "Get a free estimate — we'll reach out same day.",
      placeholder: "Your email address",
      cta: "",
      secondaryCta: "",
      trust: "",
      badge: null,
      frictionReducers: repeat(S.heroFrictionReducers, () => ""),
      heroBullets: repeat(S.heroBullets, () => ({ value: "", label: "" })),
    },
    about: {
      eyebrow: "",
      title: "",
      body: "",
      pillars: repeat(S.pillars, () => ({ k: "", t: "", d: "" })),
      stats: repeat(S.stats, () => ({ n: "", l: "" })),
    },
    services: {
      eyebrow: "",
      title: "",
      sub: "",
      items: f.serviceList.map((s, i) => ({
        n: String(i + 1).padStart(2, "0"),
        t: s.name,
        d: "",
        tag: s.tag,
        image: null,
      })),
    },
    work: { eyebrow: "", title: "", sub: "", projects: [], hidden: true },
    testimonials: {
      eyebrow: "",
      title: "",
      items: repeat(S.testimonials, () => ({ q: "", a: "", r: "", company: null, stars: 5 })),
    },
    faq: {
      eyebrow: "",
      title: "",
      sub: "",
      items: repeat(S.faq, () => ({ q: "", a: "" })),
    },
    finalCta: {
      eyebrow: "",
      headline: "",
      sub: "",
      cta: "",
      secondary: null,
      frictionReducers: repeat(S.ctaFrictionReducers, () => ""),
    },
    footer: {
      blurb: "",
      cols: [
        ...(serviceLinks.length ? [{ h: "Services", links: serviceLinks }] : []),
        {
          h: "Company",
          links: [
            { label: "About Us", href: "#about" },
            { label: "Our Work", href: "#work" },
            { label: "Reviews", href: "#testimonials" },
            { label: "FAQ", href: "#faq" },
            { label: "Contact Us", href: "#cta" },
          ],
        },
      ],
      social: [],
      legalLinks: [],
      legal: "",
    },
    seo,
    extensions: {
      trustBadges: f.certifications && f.certifications.trim() ? splitList(f.certifications) : null,
      reviewBadge: null,
      contactDetails: f.address && f.address.trim() ? { address: f.address, mapsUrl: null } : null,
      hours: f.businessHours && f.businessHours.trim() ? { all: f.businessHours } : null,
      bookingUrl: null,
      portalUrl: null,
      agentName: orNull(f.agentName ?? ""),
      serviceArea: f.serviceArea && f.serviceArea.trim() ? splitList(f.serviceArea) : null,
      ownerName: orNull(f.ownerName ?? ""),
      brandsCarried: f.brandsCarried && f.brandsCarried.trim() ? splitList(f.brandsCarried) : null,
      responseTime: orNull(f.responseTime ?? ""),
    },
    images: {
      hero: {
        portrait: f.images?.heroSlides[0]?.url,
        slides: (f.images?.heroSlides ?? []).map((img) => ({ url: img.url, alt: img.alt })),
      },
      about: { feature: f.images?.aboutFeature?.url },
      testimonials: {},
      footer: { logoImage: f.images?.logo?.url },
    },
    _meta: {
      schema_version: "2.1",
      generated_at: new Date().toISOString(),
      variation: "D",
      is_placeholder: false,
      missing_fields: missing,
      selectedPlan: plan,
      brandDirection: f.brandDirection,
      // The client's own industry pick, carried through to the console.
      //
      // This type has always documented itself as "console maps this to a copywriter
      // VerticalId", but the value was never emitted — so the console couldn't see it and
      // the operator re-picked by hand what the client had already answered. That pick is
      // not cosmetic: it selects BOTH the preset baseline AND the system prompt the model
      // writes under.
      //
      // Emitted verbatim, including "other". Deciding what "other" means is the console's
      // job (fall back to a manual pick); a mapper that silently dropped or normalised it
      // would be making that call invisibly, which is how it got lost the first time.
      ...(f.industry && f.industry.trim() ? { industry: f.industry.trim() } : {}),
      ...(f.existingWebsiteUrl && f.existingWebsiteUrl.trim()
        ? { scrapeExistingWebsite: true, scrapeWebsiteDomain: f.existingWebsiteUrl.trim() }
        : {}),
    },
  };
}

/**
 * Convert a v1.1.0 brand-intake submission into an Intake envelope. Single-site
 * for starter/growth; N-site for enterprise (additional sites inherit typography
 * + footer scaffolding from the primary but carry their own brand/palette/direction).
 */
export function mapBrandIntakeToIntake(sub: BrandIntakeSubmission): Intake {
  const primary = buildScaffold(
    {
      brandName: sub.brandName,
      brandShort: sub.brandShort,
      industry: sub.industry,
      email: sub.email,
      phone: sub.phone,
      address: sub.address,
      license: sub.license,
      established: sub.established,
      ownerName: sub.ownerName,
      brandsCarried: sub.brandsCarried,
      responseTime: sub.responseTime,
      businessHours: sub.businessHours,
      serviceArea: sub.serviceArea,
      agentName: sub.agentName,
      certifications: sub.certifications,
      notableClients: sub.notableClients,
      announcement: sub.announcement,
      serviceList: sub.serviceList,
      brandDirection: sub.brandDirection,
      palette: sub.palette,
      hasLogo: sub.hasLogo,
      images: sub.images,
      existingWebsiteUrl: sub.existingWebsiteUrl,
    },
    sub.selectedPlan,
  );

  const extras = (sub.additionalSites ?? []).filter((a) => a && a.brandName && a.brandName.trim());
  if (sub.selectedPlan !== "enterprise" || extras.length === 0) {
    return {
      plan: sub.selectedPlan,
      siteCount: 1,
      sites: [{ ...primary, _meta: { ...primary._meta, siteIndex: 1, siteCount: 1, siblingSlugs: [] } }],
    };
  }

  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const baseSlug = slugify(primary.brand.short || primary.brand.name);
  const siteCount = extras.length + 1;
  const allSlugs = Array.from({ length: siteCount }, (_, i) => `${baseSlug}-${i + 1}`);

  const sites: SiteContent[] = [
    { ...primary, _meta: { ...primary._meta, siteIndex: 1, siteCount, siblingSlugs: allSlugs.slice(1) } },
    ...extras.map((entry, i) => {
      const site = buildScaffold(
        {
          brandName: entry.brandName,
          brandShort: entry.brandShort,
          email: entry.email,
          phone: entry.phone,
          address: entry.address,
          businessHours: entry.businessHours,
          serviceList: entry.serviceList,
          brandDirection: entry.brandDirection,
          palette: entry.palette,
          // Additional sites inherit fact defaults not collected per-site.
          established: sub.established,
          ownerName: sub.ownerName,
          brandsCarried: sub.brandsCarried,
          responseTime: sub.responseTime,
          serviceArea: sub.serviceArea,
          agentName: sub.agentName,
          certifications: sub.certifications,
          notableClients: sub.notableClients,
          hasLogo: sub.hasLogo,
          images: { heroSlides: [] },
          existingWebsiteUrl: "",
        },
        "enterprise",
      );
      return {
        ...site,
        _meta: {
          ...site._meta,
          siteIndex: i + 2,
          siteCount,
          siblingSlugs: allSlugs.filter((_, j) => j !== i + 1),
        },
      };
    }),
  ];

  return { plan: "enterprise", siteCount, sites };
}
