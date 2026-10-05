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
  k: string; // icon key e.g. "shield" | "clock" | "tag" | "star", or legacy badge number "01"
  t: string; // title
  d: string; // one-sentence description
  icon?: string; // v1.5.0: explicit icon-registry key; falls back to `k` when unset
}

export interface Stat {
  n: string; // numeric value e.g. "96%"
  l: string; // label e.g. "Repeat-client rate"
}

export interface ServiceItem {
  n: string;    // "01", "02", …
  t: string;    // service name
  d: string;    // description (≤ 120 chars)
  tag: string;  // category badge
  icon?: string; // v1.5.0: explicit icon-registry key; falls back to `tag` lookup when unset
  image?: { url: string; alt: string } | null; // optional preview image
  detail?: string; // v2.2: 2–3 sentence expansion shown when the card is opened on the Services page
}

export interface Project {
  t: string;       // project title
  loc: string;     // city, state
  yr: string | null;      // year delivered
  scope: string;   // project type / category
  size: string;    // scale e.g. "240,000 sqft" or "18-unit building"
  caption: string; // image caption / placeholder label
  image?: { url: string; alt: string } | null; // optional card image
}

export interface Testimonial {
  q: string;        // quote text
  a: string;        // author name
  r: string;        // role
  company?: string | null; // company or location (optional, shown as secondary line)
  stars: number;    // 1–5
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FooterCol {
  h: string;           // column heading
  links: FooterLink[]; // v2.1: was string[]
}

export interface HeroContent {
  eyebrow: string;
  headline: string;
  headlineEmphasis: string | null; // substring of headline to render in accent color; null → no highlight
  sub: string;
  formLabel: string;
  placeholder: string;
  cta: string;
  secondaryCta: string;            // ghost link below form
  trust: string;
  badge: string | null;            // null → omit hero badge
  frictionReducers: string[];      // bullets under form; empty → omit
  heroBullets: Array<{ value: string; label: string }>;
}

export interface AboutContent {
  eyebrow: string;
  title: string;
  body: string;
  story?: string[]; // v2.2: multi-paragraph company story for the dedicated About page
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
  hidden: boolean; // true → hide section entirely
}

export interface TestimonialsContent {
  eyebrow: string;
  title: string;
  items: Testimonial[];
}

export interface FaqContent {
  eyebrow: string;
  title: string;
  sub: string;     // explanatory line under title
  items: FaqItem[];
}

export interface FinalCtaContent {
  eyebrow: string;
  headline: string;
  sub: string;
  cta: string;
  secondary: string | null; // null → omit "Or call…" line
  frictionReducers: string[];
}

export interface FooterContent {
  blurb: string;
  cols: FooterCol[];
  social: FooterLink[];    // v2.1: was string[]
  legalLinks: FooterLink[];
  legal: string;
}

export interface BrandPalette {
  accent:    string;
  accentFg?: string;   // text drawn on accent bg — defaults to "#ffffff"
  bg:        string;
  bgSoft:    string;
  ink:       string;
  inkSoft:   string;
  rule:      string;
}

export interface BrandTypography {
  fontSans:           string;
  fontHeading:        string;
  headingWeight:      number;
  bodyWeight:         number;
  headingTracking?:   string;
  headingLineHeight?: number;
}

export interface BrandContent {
  name:        string;
  short:       string;
  long:        string;
  established: string | null;
  tagline:     string;
  phone:       string;
  phoneHref:   string;
  email:       string;
  address:     string;
  license:     string | null;
  palette:     BrandPalette;
  typography:  BrandTypography;
}

export interface ElementStyle {
  color?: string;      // hex
  fontSize?: number;   // px
  fontWeight?: number; // 300–800
}

/** Per-section visual override (an override LAYER on the global brand palette/typography).
 *  Only the slots set here differ from global; text/ink stay global and are auto-derived. */
export interface SectionStyle {
  accent?:        string; // hex — per-section accent override
  bg?:            string; // hex — per-section background override
  bgSoft?:        string; // hex — per-section soft/alt background override
  headingWeight?: number; // 300–800
  scale?:         number; // section zoom, 0.85–1.2 (1 = unchanged)
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
  // Optional first name for the AI phone agent's persona (e.g. "Mia"). When
  // absent, onboard.js's prompt generator picks one and uses it consistently.
  agentName?: string | null;
  // Optional list of towns the business serves, used verbatim by the AI agent's
  // service-area section. When absent, it falls back to the city from `address`
  // plus "the surrounding area".
  serviceArea?: string[] | null;
}

export interface SiteImages {
  hero:         { portrait?: string; slides?: Array<{ url: string; alt: string }> };
  about:        { feature?: string };
  testimonials: { avatars?: string[] };
  footer:       { logoImage?: string };
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
  selectedPlan: "starter" | "growth" | "enterprise";
  siteIndex?: number;       // 1-based; set for Enterprise sites only
  siteCount?: number;       // total cluster size; set for Enterprise sites only
  siblingSlugs?: string[];  // other slug names in the same Enterprise cluster
  formMode?: "basic" | "detailed";   // onboarding mode the client selected
  scrapeExistingWebsite?: boolean;   // client asked to scrape an existing site (studio acts on this)
  scrapeWebsiteDomain?: string;      // domain to scrape, prefilled in the studio scrape panel
  brandDirection?: BrandDirection;   // v1.1: client's brand guidance → copywriter `details`
  industry?: string;                 // v1.16: client's industry pick → console copywriter vertical
  copyBrief?: CopyBrief;              // v1.19: the console Brief stage's saved inputs, operator-only
}

/** v2.2: the lightweight header that opens a non-home page (services, about, contact, …). */
export interface PageHeaderContent {
  eyebrow: string;
  title: string;
  sub: string;
  cta: { label: string; href: string } | null; // null → omit the button
}

/** v2.2: per-subpage content, keyed by route in SiteContent.subpages. Carries the page
 *  header copy and that page's own SEO. Home has no entry (it uses `hero` + site-level `seo`). */
export interface SubpageContent {
  header: PageHeaderContent;
  seo:    { title: string; description: string };
}

export interface SiteContent {
  brand:        BrandContent;
  nav:          NavItem[];
  announcement: string | null;
  trust:        { label: string; logos: string[] };
  hero:         HeroContent;
  about:        AboutContent;
  services:     ServicesContent;
  work:         WorkContent;
  testimonials: TestimonialsContent;
  faq:          FaqContent;
  finalCta:     FinalCtaContent;
  footer:       FooterContent;
  seo:          SeoContent;
  /** v2.2: per-route content for non-home pages (header + per-page SEO), keyed by route
   *  ("services", "about", "contact", optional 5th). Undefined for legacy single-page sites. */
  subpages?:    Record<string, SubpageContent>;
  extensions:   ExtensionsContent;
  images:       SiteImages;
  _meta:        ContentMeta;
  /** Per-element visual overrides, keyed by the same dotted path <E p="…"> uses.
   *  Nested tree mirroring content paths; leaves are ElementStyle. */
  overrides?:   Record<string, unknown>;
  /** Per-section visual overrides, keyed by stable section id (body sections) or
   *  'nav'/'footer' (chrome). Additive: absent = pre-v2.3 behavior (global palette only). */
  sectionStyles?: Record<string, SectionStyle>;
}

/** @deprecated Use BrandContent */
export type Brand = BrandContent;
