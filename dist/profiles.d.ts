/**
 * v1.32.0 (2026-11-10): the closed lists behind ExtensionsContent.profiles and
 * Testimonial.source. Kept out of site.ts because test/site-types-mirror.test.mjs reads
 * site.ts's `export interface|type X {` blocks with a regex, and a bare union type alias there
 * would swallow the next interface's body. SITE_TYPES_SOURCE inlines both unions instead.
 */
/** A business profile on another site. 'google' is the Google Business Profile. Order is the
 *  footer's and the intake's display order (GBP first; see the client-seo research notes). */
export declare const PROFILE_KINDS: readonly ["google", "facebook", "yelp", "bbb", "angi", "nextdoor", "instagram", "other"];
export type ProfileKind = (typeof PROFILE_KINDS)[number];
/** Where a real customer review came from. A review is the customer's own words, supplied by
 *  the client or copied from a profile, never written by the copywriter. */
export declare const REVIEW_SOURCES: readonly ["google", "yelp", "facebook", "client", "other"];
export type ReviewSource = (typeof REVIEW_SOURCES)[number];
//# sourceMappingURL=profiles.d.ts.map