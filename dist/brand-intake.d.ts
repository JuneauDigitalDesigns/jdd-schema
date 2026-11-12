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
import type { Intake } from "./intake.js";
import type { ImageMeta } from "./submission.js";
import { BrandDirection } from "./brand-direction.js";
import { PalettePick } from "./palette.js";
import { type ProfileKind } from "./profiles.js";
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
    /** How long the job usually takes, in the client's words ("Half a day"). Optional, not flagged. */
    duration?: string;
    priceFrom?: string;
    /** Real job photos for this service. Mapped to work.projects[] tagged with its slug. */
    photos?: ImageMeta[];
    /** Questions customers ask about this service, with the client's answer (may be blank). */
    questions?: {
        q: string;
        a: string;
    }[];
    /** v1.34.0: Q5 "What makes this job cost more or less?". Never a price. Flagged when blank. */
    priceFactors?: string[];
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
    brandName: string;
    brandShort?: string;
    /** v1.33.3: the client's own tagline, one line, at most 80 characters (the agency wizard caps it).
     *  Blank or absent: `brand.tagline` stays empty and is flagged, never filled from a preset. */
    tagline?: string;
    email: string;
    phone: string;
    address: string;
    license?: string;
    industry: string;
    /**
     * decision 29: `established` and `serviceArea` (and `license` above), plus the three new fields
     * below, are ASKED again by the wizard — they are the specifics that stop a site reading as
     * AI-made. The copywriter is still forbidden from inventing any of them; an unsupplied one is
     * flagged in `_meta.missing_fields`, never filled. `notableClients`, `certifications` and
     * `businessHours` remain recovered-or-optional (website scan / console).
     */
    established?: string;
    ownerName?: string;
    brandsCarried?: string;
    responseTime?: string;
    notableClients?: string;
    certifications?: string;
    businessHours?: string;
    serviceArea?: string;
    agentName?: string;
    serviceList: ServiceEntry[];
    brandDirection: BrandDirection;
    palette: PalettePick;
    hasLogo: boolean;
    images: {
        logo?: ImageMeta;
        heroSlides: ImageMeta[];
        aboutFeature?: ImageMeta;
    };
    existingWebsiteUrl: string;
    /** No longer asked; it's a post-launch promo, editable in the console any time. */
    announcement?: string;
    /** Each entry's `label` travels with the submission rather than being re-derived from
     *  TemplateSlots by key, so this module stays independent of industry-menu.ts. */
    stats?: {
        key: string;
        value: string;
        label: string;
    }[];
    /**
     * Adapted from the PLAN's sketch to the REAL `ExtensionsContent.reviewBadge` shape
     * (`{rating: number, count: number, url: string} | null`) rather than the richer
     * `{score, count, sources[]}` the plan illustrated — `reviewBadge` has no field for a
     * per-source breakdown, so a submission can't carry one yet. `score`/`count` arrive as
     * strings off the form; the mapper parses them.
     */
    reviewAggregate?: {
        score: string;
        count: string;
        url?: string;
    } | null;
    /** Keyed by the service's own `name` in `serviceList`, so the mapper can match a price to
     *  the right ServiceItem without a second id scheme. */
    servicePrices?: Record<string, string>;
    /** `{key, label, body}` mirrors AboutContent.seasons almost exactly — the wizard already has
     *  each season's label from TemplateSlots when it renders the step, so it can submit it
     *  directly rather than the mapper re-deriving it. A blank/absent `body` means the client
     *  doesn't run that season's programme; it is dropped, not carried through empty. */
    seasons?: {
        key: string;
        label: string;
        body: string;
    }[];
    serviceRadiusMiles?: string;
    offerBadge?: string;
    /** True for a service-area business: customers do NOT come to the address, the business
     *  travels to them, so the street address is shown nowhere on the site (city, state and ZIP
     *  only). False: the address is a place customers visit and is shown. */
    serviceAreaBusiness?: boolean;
    /** The business's own profiles that exist. Google Business Profile is kind "google". */
    profiles?: {
        kind: ProfileKind;
        url: string;
        label?: string;
    }[];
    /** Questions about the business in general (per-service ones nest on serviceList[i]). */
    customerQuestions?: {
        q: string;
        a: string;
    }[];
    /** v1.34.0: Q2 "Which towns do you get the most work from?". Up to 3 of `serviceArea`. */
    topTowns?: string[];
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
/**
 * Convert a v1.1.0 brand-intake submission into an Intake envelope. Single-site
 * for starter/growth; N-site for enterprise (additional sites inherit typography
 * + footer scaffolding from the primary but carry their own brand/palette/direction).
 */
export declare function mapBrandIntakeToIntake(sub: BrandIntakeSubmission): Intake;
//# sourceMappingURL=brand-intake.d.ts.map