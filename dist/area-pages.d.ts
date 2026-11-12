/** L14: the most pages of each generated kind a site may have. Replaces the console's single
 *  MAX_PAGES = 16 for the generated kinds; the core pages are not counted here. */
export declare const PAGE_CAPS: Readonly<{
    readonly service: 11;
    readonly area: 10;
    readonly spoke: 15;
}>;
/** L6: a town page needs this many town facts ... */
export declare const AREA_FACTS_MIN = 3;
/** ... of at least this many kinds (a job photo, a review, a sourced note). */
export declare const AREA_KINDS_MIN = 2;
/** A spoke needs this many facts tagged to BOTH its town and its service. */
export declare const SPOKE_FACTS_MIN = 2;
/** Q2, "Which towns do you get the most work from?": pick up to 3. */
export declare const TOP_TOWNS_MAX = 3;
export type AreaFact = "job" | "review" | "note";
/**
 * The client's own spelling of a town ("minneola " -> "Minneola"), or '' when the client does not
 * cover it. Every town tag is matched through this, so a tag typed in another case still counts
 * and a town outside the service area never does.
 */
export declare function canonicalTown(content: unknown, town: unknown): string;
/** L4: true when `town` is the main city (primaryCity: the address locality, else the first town
 *  served). Home is that city's hub, and the service pages are its spokes. */
export declare function isMainCity(content: unknown, town: unknown): boolean;
/** The URL slug for a town (`/areas/<slug>`). `taken` holds slugs already used; a collision gets
 *  -2, -3. */
export declare function townSlug(town: string, taken?: Iterable<string>): string;
/** Slugs for every town served, in service-area order, collision-free. */
export declare function townSlugs(content: unknown): string[];
/** The real local facts a town has: job photos, reviews and sourced notes tagged to it. */
export declare function areaPageFacts(content: unknown, town: string): {
    count: number;
    have: AreaFact[];
    jobs: number;
    reviews: number;
    notes: number;
};
/** L4 + L6: true when the town earns a page of its own. */
export declare function qualifiesForAreaPage(content: unknown, town: string): boolean;
/**
 * The towns that get a page, at most `cap` (default PAGE_CAPS.area). Over the cap the towns with
 * the most facts win; ties go to the client's top towns (Q2, in their order), then to the service
 * area's order. Returned in service-area order, so pages sit in the order the client listed.
 */
export declare function pickAreaPages(content: unknown, cap?: number): string[];
/** The facts tagged to BOTH a town and a service: job photos and reviews. */
export declare function spokePageFacts(content: unknown, town: string, serviceIndex: number): {
    count: number;
    jobs: number;
    reviews: number;
};
/**
 * True when a town + service pair earns a spoke. Its town must earn a page (so never the main
 * city, L4), its service must earn a page, it needs SPOKE_FACTS_MIN facts tagged to both, and the
 * demand behind it must have been approved by Xander (Phase 3: a Search Console proposal he
 * approved). A spoke is never built on facts alone.
 */
export declare function qualifiesForSpokePage(content: unknown, town: string, serviceIndex: number, demandApproved: boolean): boolean;
//# sourceMappingURL=area-pages.d.ts.map