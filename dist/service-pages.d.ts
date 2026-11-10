/**
 * v1.32.0: moved here VERBATIM from jdd-ops console/src/lib/servicePages.ts (client-seo, draft PR
 * JDD-Ops#52, commits f25075d, def685d, 26dcfc6; copied at branch tip 889c5da) so the agency onboarding wizard, the console intake and
 * the export all import ONE implementation. The console keeps servicePages.ts as a re-export shim.
 * Copied, not rewritten: test/service-pages.test.mjs is that PR's test, unchanged but for the
 * import path, and its mutation checks (FACTS_MIN = 1, the old slugify) must still go red here.
 */
/**
 * Which services earn their own page, and at what URL (service-page-spec.md §1-§2, in the shared
 * session notes; Xander's decision of 2026-11-10 that each service gets a page under /services).
 *
 * A page per service only helps when each page has something of its own to say. Near-identical
 * pages that differ by a heading are what Google's spam policy calls doorways, so a service needs
 * real, client-supplied facts before it gets a page:
 *
 *   core:  `included` with 3+ items, or `typicalJobs` with 2+
 *   plus:  at least one more fact (the other core list, a starting price, brands, this service's
 *          own towns, or a real review / job photo / customer question tagged to it)
 *
 * A service that misses stays a plain card with no link anywhere (Xander 2026-11-10): no page,
 * no sitemap entry, not in related links, the footer or the Services menu. Nothing here generates
 * copy, and nothing is ever padded to pass.
 *
 * The ONE implementation: the export, the Studio's page wiring and intake-wizard's "this service
 * needs N more facts" hint all import it, the way onboard-checks.js serves both the suite and
 * the dry run. Reads content structurally so it works before the @jdd/schema fields land.
 * Guarded by test/service-page-gate.test.mjs.
 */
/** The names a fact is reported under, in the order the intake hint lists them. */
export type ServiceFact = 'included' | 'typicalJobs' | 'priceFrom' | 'brands' | 'areas' | 'review' | 'photo' | 'question';
export declare const INCLUDED_MIN = 3;
export declare const TYPICAL_JOBS_MIN = 2;
/** Core fact + one more. */
export declare const FACTS_MIN = 2;
/**
 * The URL slug for a service page (`/services/<slug>`). A valid stored `item.slug` wins, so a
 * renamed service keeps its published URL; otherwise it is derived from the name (at most five
 * words, no "&", "and" or "near me", no trailing stop word). `taken` holds slugs already assigned
 * on this site; a collision gets -2, -3.
 */
export declare function serviceSlug(item: {
    t?: unknown;
    slug?: unknown;
}, taken: Iterable<string>): string;
/** Slugs for every service, in order, collision-free. */
export declare function serviceSlugs(content: unknown): string[];
/** Which facts a service has, which it lacks, and how many it has. */
export declare function servicePageFacts(content: unknown, index: number): {
    count: number;
    core: boolean;
    have: ServiceFact[];
    missing: ServiceFact[];
};
/** True when the service has enough real facts for a page of its own. */
export declare function qualifiesForServicePage(content: unknown, index: number): boolean;
/**
 * The service indices that get a page, given how many page slots are left (MAX_PAGES minus the
 * site's other pages). Over the cap, the services with the most facts win; ties keep their
 * order. Returned in the services' original order, so pages sit in the order the client listed.
 */
export declare function pickServicePages(content: unknown, slotsLeft: number): number[];
/**
 * The one city a site names in service-page H1s ("{t} in {city}"), titles and intro sentences,
 * so the three never disagree. The locality of `brand.address` ("123 Main St, Clermont, FL
 * 34711" or, for a service-area business, "Clermont, FL 34711"), else the first service-area
 * town, else '' (the H1 is then the bare service name). Never guessed: a lone street is no city.
 */
export declare function primaryCity(content: unknown): string;
//# sourceMappingURL=service-pages.d.ts.map