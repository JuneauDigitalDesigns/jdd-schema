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

export const SEVERITY_ORDER: Severity[] = ["red", "amber", "unknown", "grey"];

/**
 * `unknown` sorts ABOVE `grey`, deliberately.
 *
 * A check that could not run is more actionable than a note you have already accepted:
 * it usually means a credential is missing or a token expired, which is itself a small
 * outage in your ability to see the others. Burying it at the bottom would let the console
 * quietly go blind one vendor at a time.
 */
export function severityRank(severity: Severity): number {
  const i = SEVERITY_ORDER.indexOf(severity);
  return i === -1 ? SEVERITY_ORDER.length : i;
}

const AREA_ORDER: FindingArea[] = ["site", "voice", "leads", "billing", "portal", "account"];

function areaRank(area: FindingArea): number {
  const i = AREA_ORDER.indexOf(area);
  return i === -1 ? AREA_ORDER.length : i;
}

/** Severity first, then area, then site, then id — total and stable, so sweeps don't jitter. */
export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      areaRank(a.area) - areaRank(b.area) ||
      a.siteSlug.localeCompare(b.siteSlug) ||
      a.id.localeCompare(b.id),
  );
}

/** Counts per severity, for roster badges and the briefing. */
export function severityCounts(findings: Finding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = { red: 0, amber: 0, grey: 0, unknown: 0 };
  for (const f of findings) counts[f.severity]++;
  return counts;
}

/**
 * The one finding to show when there is only room for one — the same "most urgent thing
 * wrong, or nothing" contract the console's attentionFor() already uses on the roster.
 */
export function worstFinding(findings: Finding[]): Finding | null {
  return sortFindings(findings)[0] ?? null;
}

/**
 * Does this set justify the roster shouting? True only for genuine breakage — `unknown`
 * deliberately does not qualify, or an expired token would light up every client at once.
 */
export function hasBreakage(findings: Finding[]): boolean {
  return findings.some((f) => f.severity === "red");
}

// ── Reconcile results ───────────────────────────────────────────────────────

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
export function diffFindings(
  previous: Finding[],
  current: Finding[],
  at: number,
): FindingTransition[] {
  const key = (f: Finding) => `${f.siteSlug}::${f.id}`;
  const before = new Map(previous.map((f) => [key(f), f]));
  const after = new Map(current.map((f) => [key(f), f]));
  const out: FindingTransition[] = [];

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
export function countBreakages(
  history: FindingTransition[],
  since: number,
): number {
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
