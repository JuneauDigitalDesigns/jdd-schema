/**
 * SITE_TYPES_SOURCE — the raw TypeScript text of the SiteContent interface tree.
 *
 * Generated client repos must be self-contained (no @jdd/schema dependency on
 * their own Vercel deploy). The console's export.ts inlines THIS string ahead of
 * the serialized `export const CONTENT` so each client repo's src/data/site.ts
 * defines its own local `SiteContent` type. (R3 in the redesign plan.)
 *
 * Keep this identical to the interface declarations in ./site.ts. A drift test
 * (test/site-types-source.test.mjs) asserts every `export interface` name here
 * also exists in ./site.ts.
 */

export const SITE_TYPES_SOURCE = `/**
 * Single source of truth for all page content.
 * Schema v2.1 — aligned with Variation D (Conversion) design.
 */

// ─── TypeScript interfaces ────────────────────────────────────────────────────

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
  image?: { url: string; alt: string } | null; // optional preview image
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
  selectedPlan: "starter" | "growth" | "enterprise";
  siteIndex?: number;
  siteCount?: number;
  siblingSlugs?: string[];
  formMode?: "basic" | "detailed";
  scrapeExistingWebsite?: boolean;
  scrapeWebsiteDomain?: string;
  brandDirection?: {
    differentiators: string;
    targetCustomer: string;
    vibe: string[];
    tone: string[];
    adjectives: string[];
    references: string;
    forbidden: string;
  };
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
  extensions:   ExtensionsContent;
  images:       SiteImages;
  _meta:        ContentMeta;
  overrides?:   Record<string, unknown>;
}

/** @deprecated Use BrandContent */
export type Brand = BrandContent;
`;
