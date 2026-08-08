/**
 * DEFAULT_STRUCTURE — the section cardinalities the producer seeds and the
 * console's copywriter reads. The copywriter (jdd-ops generate-copy) decides how
 * many pillars / stats / FAQs / etc. to write from the LENGTH of the seeded
 * arrays, so producer and console must agree on these counts.
 *
 * services count is dynamic (one per client-provided service), so it is not here.
 */
export declare const DEFAULT_STRUCTURE: {
    readonly pillars: 3;
    readonly stats: 4;
    readonly faq: 6;
    readonly testimonials: 3;
    readonly heroBullets: 3;
    readonly heroFrictionReducers: 3;
    readonly ctaFrictionReducers: 3;
};
export type DefaultStructure = typeof DEFAULT_STRUCTURE;
//# sourceMappingURL=structure.d.ts.map