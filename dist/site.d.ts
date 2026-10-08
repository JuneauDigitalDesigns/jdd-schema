/**
 * Canonical page-content schema — the single source of truth for the JDD
 * over-the-wire contract. Extracted from jdd-ops/console/src/data/site.ts (the
 * superset: it carries `overrides`, `ElementStyle`, and the AI-agent extension
 * fields the agency mirror lacked).
 *
 * Schema v2.1 — aligned with Variation D (Conversion) design.
 *
 * NOTE: the *text* of these interfaces is mirrored in ./site-types-source.ts as
 * SITE_TYPES_SOURCE so generated client repos can inline it and stay
 * dependency-free (see that file). Keep the two in sync.
 */
import type { BrandDirection } from "./brand-direction.js";
import type { CopyBrief } from "./copy-brief.js";
export interface NavItem {
    label: string;
    href: string;
}
/** A labeled hyperlink used in footer columns, social links, and legal links. */
export interface FooterLink {
    label: string;
    href: string;
}
export interface Pillar {
    k: string;
    t: string;
    d: string;
    icon?: string;
}
export interface Stat {
    n: string;
    l: string;
}
export interface ServiceItem {
    n: string;
    t: string;
    d: string;
    tag: string;
    icon?: string;
    image?: {
        url: string;
        alt: string;
    } | null;
    detail?: string;
}
export interface Project {
    t: string;
    loc: string;
    yr: string | null;
    scope: string;
    size: string;
    caption: string;
    image?: {
        url: string;
        alt: string;
    } | null;
}
export interface Testimonial {
    q: string;
    a: string;
    r: string;
    company?: string | null;
    stars: number;
}
export interface FaqItem {
    q: string;
    a: string;
}
export interface FooterCol {
    h: string;
    links: FooterLink[];
}
export interface HeroContent {
    eyebrow: string;
    headline: string;
    headlineEmphasis: string | null;
    sub: string;
    formLabel: string;
    placeholder: string;
    cta: string;
    secondaryCta: string;
    trust: string;
    badge: string | null;
    frictionReducers: string[];
    heroBullets: Array<{
        value: string;
        label: string;
    }>;
}
export interface AboutContent {
    eyebrow: string;
    title: string;
    body: string;
    story?: string[];
    pillars: Pillar[];
    stats: Stat[];
}
export interface ServicesContent {
    eyebrow: string;
    title: string;
    sub: string;
    items: ServiceItem[];
}
export interface WorkContent {
    eyebrow: string;
    title: string;
    sub: string;
    projects: Project[];
    hidden: boolean;
}
export interface TestimonialsContent {
    eyebrow: string;
    title: string;
    items: Testimonial[];
}
export interface FaqContent {
    eyebrow: string;
    title: string;
    sub: string;
    items: FaqItem[];
}
export interface FinalCtaContent {
    eyebrow: string;
    headline: string;
    sub: string;
    cta: string;
    secondary: string | null;
    frictionReducers: string[];
}
export interface FooterContent {
    blurb: string;
    cols: FooterCol[];
    social: FooterLink[];
    legalLinks: FooterLink[];
    legal: string;
}
export interface BrandPalette {
    accent: string;
    accentFg?: string;
    bg: string;
    bgSoft: string;
    ink: string;
    inkSoft: string;
    rule: string;
}
export interface BrandTypography {
    fontSans: string;
    fontHeading: string;
    headingWeight: number;
    bodyWeight: number;
    headingTracking?: string;
    headingLineHeight?: number;
}
export interface BrandContent {
    name: string;
    short: string;
    long: string;
    established: string | null;
    tagline: string;
    phone: string;
    phoneHref: string;
    email: string;
    address: string;
    license: string | null;
    palette: BrandPalette;
    typography: BrandTypography;
}
export interface ElementStyle {
    color?: string;
    fontSize?: number;
    fontWeight?: number;
}
/** Per-section visual override (an override LAYER on the global brand palette/typography).
 *  Only the slots set here differ from global; text/ink stay global and are auto-derived. */
export interface SectionStyle {
    accent?: string;
    bg?: string;
    bgSoft?: string;
    headingWeight?: number;
    scale?: number;
}
export interface SeoContent {
    title: string;
    description: string;
    canonical: string;
    googleAnalyticsId: string | null;
    facebookPixelId: string | null;
}
export interface ExtensionsContent {
    trustBadges: string[] | null;
    reviewBadge: {
        rating: number;
        count: number;
        url: string;
    } | null;
    contactDetails: {
        address: string;
        mapsUrl: string | null;
    } | null;
    hours: Record<string, string> | null;
    bookingUrl: string | null;
    portalUrl: string | null;
    agentName?: string | null;
    serviceArea?: string[] | null;
    ownerName?: string | null;
    brandsCarried?: string[] | null;
    responseTime?: string | null;
}
export interface SiteImages {
    hero: {
        portrait?: string;
        slides?: Array<{
            url: string;
            alt: string;
        }>;
    };
    about: {
        feature?: string;
    };
    testimonials: {
        avatars?: string[];
    };
    footer: {
        logoImage?: string;
    };
}
export interface ContentMeta {
    schema_version: string;
    generated_at: string;
    variation: "D";
    is_placeholder: boolean;
    missing_fields: string[];
    /** Dotted paths of image slots filled with placeholder stock at export, e.g.
     *  "images.about.feature". Lets a re-export re-evaluate its own output, and lets
     *  downstream tooling tell a placeholder photo from a real client one. */
    placeholder_images?: string[];
    /** v2.4: original image URL -> localized "/img/<hash>" base, written by the export image
     *  pipeline when it fetches and re-emits an image into the client repo's /public. The hash
     *  carries no provenance, so this map is the only thing that can tell a localized placeholder
     *  (one whose original URL was curated stock) from a localized real client photo on re-export.
     *  Merged (never replaced) across exports so a slot localized earlier keeps its entry. */
    local_images?: Record<string, string>;
    selectedPlan: "starter" | "growth" | "enterprise";
    siteIndex?: number;
    siteCount?: number;
    siblingSlugs?: string[];
    formMode?: "basic" | "detailed";
    scrapeExistingWebsite?: boolean;
    scrapeWebsiteDomain?: string;
    brandDirection?: BrandDirection;
    industry?: string;
    copyBrief?: CopyBrief;
}
/** v2.2: the lightweight header that opens a non-home page (services, about, contact, …). */
export interface PageHeaderContent {
    eyebrow: string;
    title: string;
    sub: string;
    cta: {
        label: string;
        href: string;
    } | null;
}
/** v2.2: per-subpage content, keyed by route in SiteContent.subpages. Carries the page
 *  header copy and that page's own SEO. Home has no entry (it uses `hero` + site-level `seo`). */
export interface SubpageContent {
    header: PageHeaderContent;
    seo: {
        title: string;
        description: string;
    };
}
export interface SiteContent {
    brand: BrandContent;
    nav: NavItem[];
    announcement: string | null;
    trust: {
        label: string;
        logos: string[];
    };
    hero: HeroContent;
    about: AboutContent;
    services: ServicesContent;
    work: WorkContent;
    testimonials: TestimonialsContent;
    faq: FaqContent;
    finalCta: FinalCtaContent;
    footer: FooterContent;
    seo: SeoContent;
    /** v2.2: per-route content for non-home pages (header + per-page SEO), keyed by route
     *  ("services", "about", "contact", optional 5th). Undefined for legacy single-page sites. */
    subpages?: Record<string, SubpageContent>;
    extensions: ExtensionsContent;
    images: SiteImages;
    _meta: ContentMeta;
    /** Per-element visual overrides, keyed by the same dotted path <E p="…"> uses.
     *  Nested tree mirroring content paths; leaves are ElementStyle. */
    overrides?: Record<string, unknown>;
    /** Per-section visual overrides, keyed by stable section id (body sections) or
     *  'nav'/'footer' (chrome). Additive: absent = pre-v2.3 behavior (global palette only). */
    sectionStyles?: Record<string, SectionStyle>;
}
/** @deprecated Use BrandContent */
export type Brand = BrandContent;
//# sourceMappingURL=site.d.ts.map