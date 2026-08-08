/**
 * BrandDirection — the brand-identity guidance the client provides instead of
 * authoring copy. It is stored on `_meta.brandDirection` and compiled into the
 * free-text `details` string the console's brand copywriter consumes.
 */
export interface BrandDirection {
    /** What makes the business different — the single most important guidance (was `usp`). */
    differentiators: string;
    /** One line describing who the ideal customer is. */
    targetCustomer: string;
    /** Vibe chips, e.g. ["Modern", "Bold"]. */
    vibe: string[];
    /** Tone-of-voice chips, e.g. ["Friendly", "Professional"]. */
    tone: string[];
    /** 3–5 free-form brand adjectives. */
    adjectives: string[];
    /** Sites/brands the client admires (free text). */
    references: string;
    /** Words/claims to avoid (feeds the copywriter's anti-cliché / forbidden rules). */
    forbidden: string;
}
/** An empty BrandDirection — handy default for form state and additional sites. */
export declare const EMPTY_BRAND_DIRECTION: BrandDirection;
/**
 * Compile a BrandDirection into the free-text `details` guidance the copywriter
 * accepts (jdd-ops buildCopyUserMessage's `details` argument). Only non-empty
 * fields are included, so a sparsely-filled intake produces terse guidance
 * rather than a wall of empty labels.
 */
export declare function brandDirectionToDetails(bd: BrandDirection | undefined | null): string;
//# sourceMappingURL=brand-direction.d.ts.map