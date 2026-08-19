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
/** One service the client offers — name + short category tag, no description. */
export interface ServiceEntry {
    name: string;
    tag: string;
}
export interface BrandIntakeSubmission {
    selectedPlan: "starter" | "growth" | "enterprise";
    brandName: string;
    brandShort?: string;
    email: string;
    phone: string;
    address: string;
    license?: string;
    industry: string;
    /**
     * No longer asked. Recovered from the website scan when the client has an existing site,
     * otherwise filled in the console — or genuinely absent, which is the honest outcome for
     * a new business with no trust history yet. The copywriter is forbidden from inventing
     * any of these.
     */
    established?: string;
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