/**
 * The industry verticals, canonical.
 *
 * These ids are load-bearing in three places at once and must agree exactly:
 *
 *   1. the wizard's industry picker (agency site),
 *   2. `_meta.industry` on the intake, and
 *   3. the console's copywriter vertical — which selects BOTH the preset baseline AND the
 *      system prompt the model writes under.
 *
 * They already agreed by coincidence: the agency's `INDUSTRY_OPTIONS` and the console's
 * `VerticalId` union were written separately and happened to use the same six strings. That
 * is not a property worth relying on — nothing compared them, so nothing would have caught a
 * rename on one side, and the failure would have looked like the console quietly falling back
 * to a manual pick rather than an error.
 *
 * Kept as its own tiny module rather than living on `palette.ts` or `industry-menu.ts`
 * because both of those need it, and importing either from the other would be a cycle.
 */
export const VERTICAL_IDS = [
    "hvac",
    "roofing",
    "plumbing",
    "lawn-care",
    "car-detailing",
    "health",
];
/**
 * The value the wizard submits when none of the six fit.
 *
 * Deliberately a distinct constant rather than an empty string: "the client told us none of
 * these apply" and "the client hasn't answered yet" are different states, and the wizard's
 * free-text fallback keys off the first one.
 */
export const OTHER_INDUSTRY = "other";
/** Is this a vertical the console can map to a preset and a system prompt? */
export function isVerticalId(value) {
    return !!value && VERTICAL_IDS.includes(value);
}
//# sourceMappingURL=verticals.js.map