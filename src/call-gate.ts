/**
 * Which finished receptionist calls belong in a client's call log, and what the agency needs to
 * know to check that they got there.
 *
 * ── The gate ────────────────────────────────────────────────────────────────────────────────
 * Two operator rules decide whether a call produces an Airtable row and an owner text:
 *   - 2026-11-03: **an unanswered callback is a lost lead.** No answer, busy, failed, voicemail
 *     or an IVR produces nothing.
 *   - 2026-11-08: **a call that drops before anything useful is collected counts the same.**
 *     "Useful" is what the agent took down. `caller_name` counts on inbound only: on a callback
 *     it comes from the opening line, not from the caller.
 *
 * The rule had one home, jdd-ops `lib/call-outcomes.js`, which the post-call Make filter is
 * tested against. The agency's client-call reconcile has to apply the same rule before it
 * replays a call, or it would replay exactly the calls the filter drops on purpose. Two copies
 * would drift, so it lives here and both import it. jdd-ops' `postCallGateFilter` (the same rule
 * in Make's filter shape) and `checkConnectedCallsOnly` (which evaluates that filter against
 * every recorded outcome and fails where it disagrees with `shouldLogCall`) keep it honest.
 *
 * ── The call profile ────────────────────────────────────────────────────────────────────────
 * The agency holds no copy of a client's post-call wiring: the clone's webhook lives in the
 * client's `.env.local` on the ops machine. jdd-ops publishes this profile to the agency's KV
 * (onboard.js, the console export, and a backfill script), and the reconcile reads it.
 */

/** Retell's webhook body: `{ event, call }`. Loose on purpose: it is vendor data. */
export interface RetellWebhookPayload {
  event?: string;
  call?: RetellCallLike | null;
}

export interface RetellCallLike {
  call_id?: string;
  agent_id?: string;
  direction?: string | null;
  call_status?: string;
  disconnection_reason?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  call_analysis?: {
    in_voicemail?: boolean;
    custom_analysis_data?: Record<string, unknown> | null;
  } | null;
  [key: string]: unknown;
}

/** Did the agent take anything down? The signal groups of jdd-ops' `postCallGateFilter`. */
export function callCollectedSomething(call: RetellCallLike | null | undefined): boolean {
  const d = (call?.call_analysis?.custom_analysis_data ?? {}) as Record<string, unknown>;
  const filled = (k: string) => Boolean(d[k]);
  return (
    d.sms_consent === "granted" ||
    d.sms_consent === "declined" ||
    d.caller_priority === "emergency" ||
    filled("caller_address") ||
    filled("caller_email") ||
    filled("callback_number") ||
    (call?.direction !== "outbound" && filled("caller_name"))
  );
}

/** Should this finished call have a row in the client's call log (and brief the owner)? */
export function shouldLogCall({ event, call }: RetellWebhookPayload): boolean {
  if (event !== "call_analyzed") return false;
  if (call?.call_status !== "ended") return false; // not_connected, error, ongoing
  if (call.call_analysis?.in_voicemail === true) return false;
  if (call.disconnection_reason === "voicemail_reached" || call.disconnection_reason === "ivr_reached") return false;
  return callCollectedSomething(call);
}

// ── The call profile ────────────────────────────────────────────────────────────────────────

export const CALL_PROFILE_VERSION = 1 as const;

/** The table every client base logs calls into (jdd-ops `lib/call-log-fields.js`). */
export const CALL_LOG_TABLE = "Call Log";

/**
 * One site's post-call wiring, as the agency's reconcile needs it.
 *
 * `hookUrl` is a credential in effect: anyone holding it can write rows into the client's log.
 * It lives in KV only and is never printed, logged or returned by an API.
 */
export interface CallProfile {
  v: typeof CALL_PROFILE_VERSION;
  /** Portal account scope (`accountScope(email)`), the same scope every portal key uses. */
  acctScope: string;
  siteSlug: string;
  /** What the console calls the site: the brand name, else the slug. */
  label: string;
  retellAgentId: string;
  airtableBaseId: string;
  airtableTable: string;
  /** Enterprise only: the `Site` column value this site's clone writes (its portal slug). */
  siteColumn: string | null;
  /** The client's own Make clone webhook. Sensitive. */
  hookUrl: string;
  updatedAt: string;
}

/** `jdd:callprofile:v1:{acctScope}:{siteSlug}`. Slugs are unique only within an account. */
export const callProfileKey = (acctScope: string, siteSlug: string) => `jdd:callprofile:v1:${acctScope}:${siteSlug}`;

/** A KV set of every published profile's key, so the reconcile never SCANs. */
export const CALL_PROFILE_INDEX = "jdd:callprofile:v1:index";

/**
 * Make's webhook hosts: `hook.{zone}.make.com` (and the legacy `hook.integromat.com`). The
 * reconcile POSTs a call to whatever the profile says, so it must be a Make hook and nothing else.
 */
export function isMakeHookUrl(raw: unknown): boolean {
  // A whole-string match rather than URL parsing: this package targets ES2021 with no DOM lib,
  // and an anchored pattern leaves no room for userinfo, a port, a query or a look-alike host.
  return typeof raw === "string" && MAKE_HOOK.test(raw.trim());
}
const MAKE_HOOK = /^https:\/\/hook\.(?:[a-z0-9-]+\.)?(?:make\.com|integromat\.com)\/[A-Za-z0-9]{16,}\/?$/;

const sameHook = (a: string, b: string) => {
  const norm = (s: string) => s.trim().replace(/\/+$/, "").toLowerCase();
  return norm(a) === norm(b);
};

/**
 * Everything wrong with a profile, or `[]`. Never quotes the hook URL.
 *
 * "Never wire a client to a master resource" (jdd-ops CLAUDE.md): a client whose base is the
 * master base, or whose webhook is the master scenario's hook, looks like a working client whose
 * calls land in someone else's log. A replay through the master hook would write a client's call
 * into the master base, so both refuse. `master` values that are unknown can't be checked, and
 * the caller decides whether that is acceptable (publishing refuses; see jdd-ops).
 */
export function callProfileProblems(
  p: Partial<CallProfile> | null | undefined,
  master: { airtableBaseId?: string | null; hookUrl?: string | null } = {},
): string[] {
  if (!p || typeof p !== "object") return ["no profile"];
  const out: string[] = [];
  const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  if (p.v !== CALL_PROFILE_VERSION) out.push(`version is ${String(p.v)}, expected ${CALL_PROFILE_VERSION}`);
  if (!/^[0-9a-f]{16}$/.test(s(p.acctScope))) out.push("acctScope is not an account scope");
  if (!s(p.siteSlug)) out.push("siteSlug is empty");
  if (!/^agent_[A-Za-z0-9]+$/.test(s(p.retellAgentId))) out.push("retellAgentId is not a Retell agent id");
  if (!/^app[A-Za-z0-9]{14}$/.test(s(p.airtableBaseId))) out.push("airtableBaseId is not an Airtable base id");
  if (!s(p.airtableTable)) out.push("airtableTable is empty");
  if (p.siteColumn !== null && p.siteColumn !== undefined && !s(p.siteColumn)) out.push("siteColumn is blank");
  if (!isMakeHookUrl(p.hookUrl)) out.push("hookUrl is not a Make webhook URL");
  if (master.airtableBaseId && s(p.airtableBaseId) === master.airtableBaseId.trim()) {
    out.push("airtableBaseId is the MASTER base — this client's calls would land in the master log");
  }
  if (master.hookUrl && typeof p.hookUrl === "string" && sameHook(p.hookUrl, master.hookUrl)) {
    out.push("hookUrl is the MASTER scenario's hook — a replay would write into the master log");
  }
  return out;
}
