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
export type Severity = "red" | "amber" | "grey" | "unknown";
/** Which part of the client's world a finding belongs to. Drives grouping in the UI. */
export type FindingArea = "site" | "voice" | "leads" | "billing" | "portal" | "account";
/** A one-click remediation the console knows how to perform. */
export interface FindingFix {
    /** Console API route that performs it. */
    route: string;
    /** POST body. */
    body: unknown;
    /** Button text — an imperative naming the effect, not "Fix". */
    label: string;
    /**
     * True when applying this is not trivially reversible, so the UI routes it through the
     * signed-preview confirmation instead of a single click.
     */
    destructive?: boolean;
}
export interface Finding {
    /**
     * Stable across sweeps for the same problem on the same site, e.g. `twilio.voiceUrl`.
     * This is what lets history record an OPEN and a CLOSE rather than an endless stream of
     * unrelated observations — and therefore what makes "how many times has this broken"
     * answerable at all.
     */
    id: string;
    severity: Severity;
    area: FindingArea;
    /** Which site this is about. Enterprise clients have several; single-site == the slug. */
    siteSlug: string;
    /** One line, already written for display. */
    title: string;
    /** The explanation, including what to do when there is no `fix`. */
    detail: string;
    expected?: string;
    actual?: string;
    fix?: FindingFix;
}
export declare const SEVERITY_ORDER: Severity[];
/**
 * `unknown` sorts ABOVE `grey`, deliberately.
 *
 * A check that could not run is more actionable than a note you have already accepted:
 * it usually means a credential is missing or a token expired, which is itself a small
 * outage in your ability to see the others. Burying it at the bottom would let the console
 * quietly go blind one vendor at a time.
 */
export declare function severityRank(severity: Severity): number;
/** Severity first, then area, then site, then id — total and stable, so sweeps don't jitter. */
export declare function sortFindings(findings: Finding[]): Finding[];
/** Counts per severity, for roster badges and the briefing. */
export declare function severityCounts(findings: Finding[]): Record<Severity, number>;
/**
 * The one finding to show when there is only room for one — the same "most urgent thing
 * wrong, or nothing" contract the console's attentionFor() already uses on the roster.
 */
export declare function worstFinding(findings: Finding[]): Finding | null;
/**
 * Does this set justify the roster shouting? True only for genuine breakage — `unknown`
 * deliberately does not qualify, or an expired token would light up every client at once.
 */
export declare function hasBreakage(findings: Finding[]): boolean;
/**
 * One sweep's output for one client.
 *
 * `checkedAt` is mandatory and always surfaced. A cached result presented without its age
 * is indistinguishable from a fresh one, and this console only sweeps when it is open — so
 * "how old is this" is a question the user genuinely needs answered every time.
 */
export interface ReconcileResult {
    slug: string;
    checkedAt: number;
    findings: Finding[];
    /** Vendors that could not be reached at all this sweep, by name. */
    unreachable: string[];
}
/** One open/close transition, appended to `jdd:reconcile:history:{slug}`. */
export interface FindingTransition {
    at: number;
    findingId: string;
    siteSlug: string;
    severity: Severity;
    event: "opened" | "closed";
    title: string;
}
/**
 * Diff two sweeps into transitions.
 *
 * This is what makes the history meaningful rather than a log of every sweep: a problem
 * that persists across twenty sweeps produces exactly one `opened`. Without that, counting
 * "breakages in the last 30 days" would really count "times you opened the console while
 * something was broken", which is a measure of your habits, not the client's experience.
 */
export declare function diffFindings(previous: Finding[], current: Finding[], at: number): FindingTransition[];
/**
 * Count breakages inside a rolling window, for the `at-risk` stage rule.
 *
 * Counts `opened` events at red severity only. `unknown` is excluded on purpose: a client
 * must not drift toward at-risk because a token expired on our side. That would move a
 * relationship's status on the strength of our own outage.
 */
export declare function countBreakages(history: FindingTransition[], since: number): number;
export declare const zSeverity: z.ZodEnum<["red", "amber", "grey", "unknown"]>;
export declare const zFinding: z.ZodObject<{
    id: z.ZodString;
    severity: z.ZodEnum<["red", "amber", "grey", "unknown"]>;
    area: z.ZodEnum<["site", "voice", "leads", "billing", "portal", "account"]>;
    siteSlug: z.ZodString;
    title: z.ZodString;
    detail: z.ZodString;
    expected: z.ZodOptional<z.ZodString>;
    actual: z.ZodOptional<z.ZodString>;
    fix: z.ZodOptional<z.ZodObject<{
        route: z.ZodString;
        body: z.ZodUnknown;
        label: z.ZodString;
        destructive: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        route: string;
        body?: unknown;
        destructive?: boolean | undefined;
    }, {
        label: string;
        route: string;
        body?: unknown;
        destructive?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    severity: "unknown" | "red" | "amber" | "grey";
    area: "portal" | "site" | "voice" | "leads" | "billing" | "account";
    siteSlug: string;
    title: string;
    detail: string;
    expected?: string | undefined;
    actual?: string | undefined;
    fix?: {
        label: string;
        route: string;
        body?: unknown;
        destructive?: boolean | undefined;
    } | undefined;
}, {
    id: string;
    severity: "unknown" | "red" | "amber" | "grey";
    area: "portal" | "site" | "voice" | "leads" | "billing" | "account";
    siteSlug: string;
    title: string;
    detail: string;
    expected?: string | undefined;
    actual?: string | undefined;
    fix?: {
        label: string;
        route: string;
        body?: unknown;
        destructive?: boolean | undefined;
    } | undefined;
}>;
export declare const zFindingTransition: z.ZodObject<{
    at: z.ZodNumber;
    findingId: z.ZodString;
    siteSlug: z.ZodString;
    severity: z.ZodEnum<["red", "amber", "grey", "unknown"]>;
    event: z.ZodEnum<["opened", "closed"]>;
    title: z.ZodString;
}, "strip", z.ZodTypeAny, {
    severity: "unknown" | "red" | "amber" | "grey";
    siteSlug: string;
    title: string;
    at: number;
    findingId: string;
    event: "opened" | "closed";
}, {
    severity: "unknown" | "red" | "amber" | "grey";
    siteSlug: string;
    title: string;
    at: number;
    findingId: string;
    event: "opened" | "closed";
}>;
//# sourceMappingURL=findings.d.ts.map