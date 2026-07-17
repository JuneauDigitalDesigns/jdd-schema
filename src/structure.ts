/**
 * DEFAULT_STRUCTURE — the section cardinalities the producer seeds and the
 * console's copywriter reads. The copywriter (jdd-ops generate-copy) decides how
 * many pillars / stats / FAQs / etc. to write from the LENGTH of the seeded
 * arrays, so producer and console must agree on these counts.
 *
 * services count is dynamic (one per client-provided service), so it is not here.
 */
export const DEFAULT_STRUCTURE = {
  pillars: 3,
  stats: 4,
  faq: 6,
  testimonials: 3,
  heroBullets: 3,
  heroFrictionReducers: 3,
  ctaFrictionReducers: 3,
} as const;

export type DefaultStructure = typeof DEFAULT_STRUCTURE;
