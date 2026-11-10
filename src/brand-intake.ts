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
  Stat,
  CustomerQuestion,
  ProfileLink,
  Project,
  ServiceItem,
} from "./site.js";
import type { Intake } from "./intake.js";
import type { ImageMeta } from "./submission.js";
import { BrandDirection } from "./brand-direction.js";
import { DEFAULT_STRUCTURE } from "./structure.js";
import { PalettePick, resolvePalette } from "./palette.js";
import { PROFILE_KINDS, type ProfileKind } from "./profiles.js";
import { serviceSlug } from "./service-pages.js";

/**
 * One service the client offers: name + short category tag, plus (v1.32.0, 2026-11-10) the
 * optional facts its own page is built from. Nested here so the submission needs no key scheme.
 * All client-supplied; blank or absent means not given, never filled in.
 */
export interface ServiceEntry {
  name: string;
  tag: string;
  included?: string[];
  typicalJobs?: string[];
  /** Towns for this service: a subset of `serviceArea`. Absent = not narrowed. */
  areas?: string[];
  /** Also unioned into the site-wide brandsCarried. */
  brands?: string[];
  /** Wins over the old name-keyed `servicePrices`. */
  priceFrom?: string;
  /** Real job photos for this service. Mapped to work.projects[] tagged with its slug. */
  photos?: ImageMeta[];
  /** Questions customers ask about this service, with the client's answer (may be blank). */
  questions?: { q: string; a: string }[];
}

export interface BrandIntakeSubmission {
  selectedPlan: "starter" | "growth" | "enterprise";
  /**
   * The activation choice from the wizard's activation step.
   *
   * Stated, never inferred. The receptionist only answers once the business line points at
   * the JDD number, so this decides whether provisioning buys a number at all, and
   * `declined` is the web-only variant. Optional on the type because a client who was
   * mid-form when the activation step deployed still submits the old shape; an absent value
   * means "not yet asked" and must never be read as `declined`.
   */
  receptionistMode?: "forwarded" | "published" | "declined";

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

  // ── vertical-templates-v1 (PLAN §3.2, 2026-10-28) ──
  //
  // What a vertical's bespoke template needs beyond the fields above — see TemplateSlots in
  // industry-menu.ts for which industry's wizard step asks for which of these. All client-
  // supplied facts, never generated by the console's copywriter (PLAN D4): a statistic, a
  // promotional promise to the client's own customers, and a seasonal service claim are all
  // things we are forbidden from inventing. Absent/blank → the template hides the slot (PLAN
  // D5) and `missing_fields` records it, same as the decision-29 facts above.
  /** Each entry's `label` travels with the submission rather than being re-derived from
   *  TemplateSlots by key, so this module stays independent of industry-menu.ts. */
  stats?: { key: string; value: string; label: string }[];
  /**
   * Adapted from the PLAN's sketch to the REAL `ExtensionsContent.reviewBadge` shape
   * (`{rating: number, count: number, url: string} | null`) rather than the richer
   * `{score, count, sources[]}` the plan illustrated — `reviewBadge` has no field for a
   * per-source breakdown, so a submission can't carry one yet. `score`/`count` arrive as
   * strings off the form; the mapper parses them.
   */
  reviewAggregate?: { score: string; count: string; url?: string } | null;
  /** Keyed by the service's own `name` in `serviceList`, so the mapper can match a price to
   *  the right ServiceItem without a second id scheme. */
  servicePrices?: Record<string, string>;
  /** `{key, label, body}` mirrors AboutContent.seasons almost exactly — the wizard already has
   *  each season's label from TemplateSlots when it renders the step, so it can submit it
   *  directly rather than the mapper re-deriving it. A blank/absent `body` means the client
   *  doesn't run that season's programme; it is dropped, not carried through empty. */
  seasons?: { key: string; label: string; body: string }[];
  serviceRadiusMiles?: string;
  offerBadge?: string;

  // ── v1.32.0 (2026-11-10): SEO + service pages. Absent = not asked (an older form). ──
  /** True when customers are served at their address: the street address is then shown
   *  nowhere on the site. */
  serviceAreaBusiness?: boolean;
  /** The business's own profiles that exist. Google Business Profile is kind "google". */
  profiles?: { kind: ProfileKind; url: string; label?: string }[];
  /** Questions about the business in general (per-service ones nest on serviceList[i]). */
  customerQuestions?: { q: string; a: string }[];

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

/**
 * Non-blank stats, mapped to the Stat shape (`{n, l}`). PLAN D4: a statistic is never
 * generated — this only ever passes through what the client supplied, and an entry with a
 * blank value is dropped rather than carried through as `{n: "", l: "..."}`, which would
 * render as an empty-looking tile instead of no tile at all.
 */
function statsFrom(stats: { key: string; value: string; label: string }[] | undefined): Stat[] {
  return (stats ?? [])
    .filter((s) => s.value && s.value.trim())
    .map((s) => ({ n: s.value.trim(), l: (s.label ?? "").trim() }));
}

/**
 * The review aggregate, or null when the client supplied neither a score nor a count.
 * `ExtensionsContent.reviewBadge` wants numbers; the form posts strings, so this parses them
 * and treats an unparseable value the same as absent rather than shipping NaN into a client site.
 */
function reviewBadgeFrom(
  agg: { score: string; count: string; url?: string } | null | undefined,
): { rating: number; count: number; url: string } | null {
  if (!agg) return null;
  const rating = parseFloat(agg.score);
  const count = parseInt(agg.count, 10);
  if (!Number.isFinite(rating) || !Number.isFinite(count)) return null;
  return { rating, count, url: agg.url ?? "" };
}

/** Non-blank seasons only — PLAN D5/D14: we do not describe a season's service the client
 *  doesn't actually offer, so a season with no body is dropped, not carried through empty. */
function seasonsFrom(
  seasons: { key: string; label: string; body: string }[] | undefined,
): { key: string; label: string; body: string }[] | null {
  const filled = (seasons ?? []).filter((s) => s.body && s.body.trim());
  return filled.length ? filled.map((s) => ({ key: s.key, label: s.label, body: s.body.trim() })) : null;
}

/** Trimmed, non-blank, de-duplicated (case-insensitively, first spelling kept). */
function cleanList(list: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list ?? []) {
    const v = (raw ?? "").trim();
    if (!v || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out;
}

function cleanQuestions(list: { q: string; a: string }[] | undefined): { q: string; a: string }[] {
  return (list ?? [])
    .filter((x) => x && x.q && x.q.trim())
    .map((x) => ({ q: x.q.trim(), a: (x.a ?? "").trim() }));
}

/**
 * v1.32.0: the per-service facts, mapped. Returns the ServiceItems, the job photos as
 * work.projects tagged to their service, the questions (per-service ones tagged), the brands to
 * union into brandsCarried, and the missing_fields paths for the two core facts.
 *
 * A service's slug is written only when something is tagged to it (a photo or a question), per
 * service-page-spec.md §2: stored once, then never re-derived, so a later rename keeps the URL.
 * Areas are kept only when they name a town in the service area (spelled as the area spells it).
 */
function serviceDetailsFrom(
  serviceList: ServiceEntry[],
  servicePrices: Record<string, string> | undefined,
  serviceArea: string[],
): {
  items: ServiceItem[];
  projects: Project[];
  questions: CustomerQuestion[];
  brands: string[];
  missing: string[];
} {
  const areaByLower = new Map(serviceArea.map((a) => [a.toLowerCase(), a]));
  const taken: string[] = [];
  const projects: Project[] = [];
  const questions: CustomerQuestion[] = [];
  const brands: string[] = [];
  const missing: string[] = [];

  const items = serviceList.map((s, i): ServiceItem => {
    const included = cleanList(s.included);
    const typicalJobs = cleanList(s.typicalJobs);
    const areas = cleanList(s.areas)
      .map((a) => areaByLower.get(a.toLowerCase()))
      .filter((a): a is string => Boolean(a));
    const serviceBrands = cleanList(s.brands);
    const photos = (s.photos ?? []).filter((p) => p && p.url && p.url.trim());
    const qs = cleanQuestions(s.questions);
    const price = (s.priceFrom ?? "").trim() || (servicePrices?.[s.name] ?? "").trim();

    if (included.length === 0) missing.push(`services.items.${i}.included`);
    if (typicalJobs.length === 0) missing.push(`services.items.${i}.typicalJobs`);

    const tagged = photos.length > 0 || qs.length > 0;
    const slug = serviceSlug({ t: s.name }, taken);
    taken.push(slug);
    for (const p of photos) {
      const alt = (p.alt ?? "").trim() || s.name;
      projects.push({
        t: s.name, loc: "", yr: null, scope: s.name, size: "",
        caption: alt, // never empty: it is the photo's alt text
        image: { url: p.url, alt },
        service: slug,
      });
    }
    for (const q of qs) questions.push({ ...q, service: slug });
    brands.push(...serviceBrands);

    return {
      n: String(i + 1).padStart(2, "0"),
      t: s.name,
      d: "",
      tag: s.tag,
      image: null,
      priceFrom: price || null,
      ...(included.length ? { included } : {}),
      ...(typicalJobs.length ? { typicalJobs } : {}),
      ...(areas.length ? { areas } : {}),
      ...(serviceBrands.length ? { brands: serviceBrands } : {}),
      ...(tagged ? { slug } : {}),
    };
  });

  return { items, projects, questions, brands, missing };
}

function profilesFrom(list: { kind: ProfileKind; url: string; label?: string }[] | undefined): ProfileLink[] | null {
  const kinds = new Set<string>(PROFILE_KINDS);
  const out = (list ?? [])
    .filter((p) => p && kinds.has(p.kind) && p.url && p.url.trim())
    .map((p) => ({
      kind: p.kind,
      url: p.url.trim(),
      ...(p.label && p.label.trim() ? { label: p.label.trim() } : {}),
    }));
  return out.length ? out : null;
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
  // vertical-templates-v1 (PLAN §3.2) — see BrandIntakeSubmission for the shape rationale.
  stats?: { key: string; value: string; label: string }[];
  reviewAggregate?: { score: string; count: string; url?: string } | null;
  servicePrices?: Record<string, string>;
  seasons?: { key: string; label: string; body: string }[];
  serviceRadiusMiles?: string;
  offerBadge?: string;
  serviceAreaBusiness?: boolean;
  profiles?: { kind: ProfileKind; url: string; label?: string }[];
  customerQuestions?: { q: string; a: string }[];
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

  // vertical-templates-v1 (PLAN §3.3): flagged on the same "collected from intake, never
  // invented" footing as the decision-29 facts above — an unsupplied slot is a go-live
  // checklist item, not a silent gap, same reasoning as extensions.serviceArea.
  const resolvedStats = statsFrom(f.stats);
  const resolvedReviewBadge = reviewBadgeFrom(f.reviewAggregate);
  const resolvedSeasons = seasonsFrom(f.seasons);
  flag("about.stats", resolvedStats.length > 0);
  flag("extensions.reviewBadge", resolvedReviewBadge !== null);
  flag("about.seasons", resolvedSeasons !== null);
  flag("extensions.offerBadge", f.offerBadge && f.offerBadge.trim());
  flag("extensions.serviceRadiusMiles", f.serviceRadiusMiles && f.serviceRadiusMiles.trim());

  // v1.32.0: per-service facts and the site-wide SEO facts. Every blank one is flagged, whether
  // or not this form version asked it: the console tells "asked, left blank" (flagged) from
  // "never asked" (empty, unflagged) for older clients only by this list, so a NEW mapper must
  // flag unconditionally. Areas and brands are optional per service and are not flagged.
  const siteArea = f.serviceArea && f.serviceArea.trim() ? splitList(f.serviceArea) : [];
  const details = serviceDetailsFrom(f.serviceList, f.servicePrices, siteArea);
  missing.push(...details.missing);
  flag("services.priceFrom", details.items.some((it) => it.priceFrom));
  flag("extensions.serviceAreaBusiness", typeof f.serviceAreaBusiness === "boolean");
  const resolvedProfiles = profilesFrom(f.profiles);
  flag("extensions.profiles", resolvedProfiles !== null);
  const allQuestions = [...cleanQuestions(f.customerQuestions), ...details.questions];
  flag("extensions.customerQuestions", allQuestions.length > 0);
  const brandsCarried = cleanList([...(f.brandsCarried ? splitList(f.brandsCarried) : []), ...details.brands]);

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
    trust: { label: "Trusted by", logos: cleanList([...splitList(f.notableClients ?? ""), ...brandsCarried]) },
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
      // vertical-templates-v1 (PLAN D4): client-supplied only, never the DEFAULT_STRUCTURE-sized
      // blank repeat the other copy arrays use — a statistic cannot be "written in place" by the
      // copywriter the way an empty FAQ or pillar can.
      stats: resolvedStats,
      seasons: resolvedSeasons,
    },
    services: {
      eyebrow: "",
      title: "",
      sub: "",
      items: details.items,
    },
    // Job photos arrive as projects tagged to their service (service-page-spec.md §4). The work
    // SECTION stays hidden: a photo-only project has no location or year to show there.
    work: { eyebrow: "", title: "", sub: "", projects: details.projects, hidden: true },
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
      headlineEmphasis: null,
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
      reviewBadge: resolvedReviewBadge,
      contactDetails: f.address && f.address.trim() ? { address: f.address, mapsUrl: null } : null,
      hours: f.businessHours && f.businessHours.trim() ? { all: f.businessHours } : null,
      bookingUrl: null,
      portalUrl: null,
      agentName: orNull(f.agentName ?? ""),
      serviceArea: f.serviceArea && f.serviceArea.trim() ? splitList(f.serviceArea) : null,
      ownerName: orNull(f.ownerName ?? ""),
      brandsCarried: brandsCarried.length ? brandsCarried : null,
      responseTime: orNull(f.responseTime ?? ""),
      offerBadge: orNull(f.offerBadge ?? ""),
      serviceRadiusMiles: orNull(f.serviceRadiusMiles ?? ""),
      serviceAreaBusiness: typeof f.serviceAreaBusiness === "boolean" ? f.serviceAreaBusiness : null,
      customerQuestions: allQuestions.length ? allQuestions : null,
      profiles: resolvedProfiles,
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
      stats: sub.stats,
      reviewAggregate: sub.reviewAggregate,
      servicePrices: sub.servicePrices,
      seasons: sub.seasons,
      serviceRadiusMiles: sub.serviceRadiusMiles,
      offerBadge: sub.offerBadge,
      serviceAreaBusiness: sub.serviceAreaBusiness,
      profiles: sub.profiles,
      customerQuestions: sub.customerQuestions,
    },
    sub.selectedPlan,
  );

  const extras = (sub.additionalSites ?? []).filter((a) => a && a.brandName && a.brandName.trim());

  // Carried onto the envelope, not onto any site. Every field of SiteContent is serialized
  // into the generated client repo on public GitHub, and this one is both an operational
  // instruction and a commercial fact, so it belongs beside `smsAlerts` rather than in
  // `_meta`. Spread conditionally so an intake from a pre-activation-step draft stays
  // genuinely absent rather than becoming an explicit `undefined`, which `exactOptionalPropertyTypes`
  // and the console's zod round trip treat differently.
  const receptionist = sub.receptionistMode ? { receptionistMode: sub.receptionistMode } : {};

  if (sub.selectedPlan !== "enterprise" || extras.length === 0) {
    return {
      plan: sub.selectedPlan,
      ...receptionist,
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
          stats: sub.stats,
          reviewAggregate: sub.reviewAggregate,
          servicePrices: sub.servicePrices,
          seasons: sub.seasons,
          serviceRadiusMiles: sub.serviceRadiusMiles,
          offerBadge: sub.offerBadge,
          // v1.32.0: a business-level fact, inherited. Profiles and general questions are per brand,
          // so an additional site gets none (flagged missing) rather than the primary's.
          serviceAreaBusiness: sub.serviceAreaBusiness,
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

  return { plan: "enterprise", ...receptionist, siteCount, sites };
}
