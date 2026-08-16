/**
 * Findings — the one shape every reconcile check produces, and the rules for ranking them.
 *
 * The point of a single shape is that the console gains checks without gaining screens.
 * Eight unrelated gaps (a stale voiceUrl, a deactivated Make clone, an unbilled client, a
 * prompt edited in someone else's dashboard) all become rows in the same list, sorted by
 * the same rules, each carrying its own fix.
 *
 * ── Severity is about impact, not urgency ───────────────────────────────────
 *
 *   red      revenue or client-visible breakage — the site is down, calls aren't routing,
 *            payment is failing, they asked to cancel. Someone is losing something now.
 *   amber    drift or degradation — configuration has moved away from intended, or is
 *            heading somewhere bad. Nothing is broken yet.
 *   grey     informational — worth knowing, not worth doing anything about today.
 *   unknown  THE CHECK DID NOT RUN. Not a pass.
 *
 * `unknown` is a severity rather than an absence because the alternative is that a missing
 * credential or a rate limit renders as green. Both existing audits already reached this
 * conclusion independently — audit-analytics exits 2 when a live site's state can't be
 * determined, and audit-billing returns `driftSkipped` rather than an empty pass, on the
 * stated grounds that an unverifiable billing state must never render as a tick. This
 * encodes that rule once instead of per-script.
 */
import { z } from "zod";
export const SEVERITY_ORDER = ["red", "amber", "unknown", "grey"];
/**
 * `unknown` sorts ABOVE `grey`, deliberately.
 *
 * A check that could not run is more actionable than a note you have already accepted:
 * it usually means a credential is missing or a token expired, which is itself a small
 * outage in your ability to see the others. Burying it at the bottom would let the console
 * quietly go blind one vendor at a time.
 */
export function severityRank(severity) {
    const i = SEVERITY_ORDER.indexOf(severity);
    return i === -1 ? SEVERITY_ORDER.length : i;
}
const AREA_ORDER = ["site", "voice", "leads", "billing", "portal", "account"];
function areaRank(area) {
    const i = AREA_ORDER.indexOf(area);
    return i === -1 ? AREA_ORDER.length : i;
}
/** Severity first, then area, then site, then id — total and stable, so sweeps don't jitter. */
export function sortFindings(findings) {
    return [...findings].sort((a, b) => severityRank(a.severity) - severityRank(b.severity) ||
        areaRank(a.area) - areaRank(b.area) ||
        a.siteSlug.localeCompare(b.siteSlug) ||
        a.id.localeCompare(b.id));
}
/** Counts per severity, for roster badges and the briefing. */
export function severityCounts(findings) {
    const counts = { red: 0, amber: 0, grey: 0, unknown: 0 };
    for (const f of findings)
        counts[f.severity]++;
    return counts;
}
/**
 * The one finding to show when there is only room for one — the same "most urgent thing
 * wrong, or nothing" contract the console's attentionFor() already uses on the roster.
 */
export function worstFinding(findings) {
    return sortFindings(findings)[0] ?? null;
}
/**
 * Does this set justify the roster shouting? True only for genuine breakage — `unknown`
 * deliberately does not qualify, or an expired token would light up every client at once.
 */
export function hasBreakage(findings) {
    return findings.some((f) => f.severity === "red");
}
/**
 * Diff two sweeps into transitions.
 *
 * This is what makes the history meaningful rather than a log of every sweep: a problem
 * that persists across twenty sweeps produces exactly one `opened`. Without that, counting
 * "breakages in the last 30 days" would really count "times you opened the console while
 * something was broken", which is a measure of your habits, not the client's experience.
 */
export function diffFindings(previous, current, at) {
    const key = (f) => `${f.siteSlug}::${f.id}`;
    const before = new Map(previous.map((f) => [key(f), f]));
    const after = new Map(current.map((f) => [key(f), f]));
    const out = [];
    for (const [k, f] of after) {
        if (!before.has(k)) {
            out.push({ at, findingId: f.id, siteSlug: f.siteSlug, severity: f.severity, event: "opened", title: f.title });
        }
    }
    for (const [k, f] of before) {
        if (!after.has(k)) {
            out.push({ at, findingId: f.id, siteSlug: f.siteSlug, severity: f.severity, event: "closed", title: f.title });
        }
    }
    return out;
}
/**
 * Count breakages inside a rolling window, for the `at-risk` stage rule.
 *
 * Counts `opened` events at red severity only. `unknown` is excluded on purpose: a client
 * must not drift toward at-risk because a token expired on our side. That would move a
 * relationship's status on the strength of our own outage.
 */
export function countBreakages(history, since) {
    return history.filter((t) => t.at >= since && t.event === "opened" && t.severity === "red").length;
}
// ── Validation ──────────────────────────────────────────────────────────────
export const zSeverity = z.enum(["red", "amber", "grey", "unknown"]);
export const zFinding = z.object({
    id: z.string().min(1),
    severity: zSeverity,
    area: z.enum(["site", "voice", "leads", "billing", "portal", "account"]),
    siteSlug: z.string(),
    title: z.string(),
    detail: z.string(),
    expected: z.string().optional(),
    actual: z.string().optional(),
    fix: z
        .object({
        route: z.string(),
        body: z.unknown(),
        label: z.string(),
        destructive: z.boolean().optional(),
    })
        .optional(),
});
export const zFindingTransition = z.object({
    at: z.number(),
    findingId: z.string(),
    siteSlug: z.string(),
    severity: zSeverity,
    event: z.enum(["opened", "closed"]),
    title: z.string(),
});
//# sourceMappingURL=findings.js.map