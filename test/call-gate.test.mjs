// The shared post-call gate and the call profile.
//
// jdd-ops runs the full set of recorded Retell outcomes against this gate (lib/call-outcomes.js +
// checkConnectedCallsOnly, which also evaluates the Make filter against it). These tests pin the
// two rules at the source, so a change here fails before any consumer moves its pin.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shouldLogCall,
  callCollectedSomething,
  callProfileProblems,
  callProfileKey,
  isMakeHookUrl,
  CALL_PROFILE_INDEX,
  CALL_LOG_TABLE,
} from "../dist/index.js";

const COMPLETED = { caller_name: "Dana", callback_number: "2075550100", caller_address: "1 Main St", caller_email: "", caller_priority: "callback", sms_consent: "granted" };
const DROPPED = { caller_name: "Dana", callback_number: "", caller_address: "", caller_email: "", caller_priority: "callback", sms_consent: "unknown" };
const analyzed = (call) => ({ event: "call_analyzed", call });
const ended = (direction, reason, in_voicemail, data) => ({
  direction,
  call_status: "ended",
  disconnection_reason: reason,
  call_analysis: { in_voicemail, custom_analysis_data: data },
});

test("a connected call that collected details is logged, inbound and callback alike", () => {
  assert.equal(shouldLogCall(analyzed(ended("inbound", "user_hangup", false, COMPLETED))), true);
  assert.equal(shouldLogCall(analyzed(ended("outbound", "agent_hangup", false, COMPLETED))), true);
});

test("2026-11-03: an unanswered callback is a lost lead", () => {
  assert.equal(shouldLogCall(analyzed({ direction: "outbound", call_status: "not_connected", disconnection_reason: "dial_no_answer" })), false);
  assert.equal(shouldLogCall(analyzed({ direction: "outbound", call_status: "error", disconnection_reason: "error_unknown" })), false);
  // Voicemail as it really shows up here: an ordinary hangup with in_voicemail true.
  assert.equal(shouldLogCall(analyzed(ended("outbound", "agent_hangup", true, COMPLETED))), false);
  assert.equal(shouldLogCall(analyzed(ended("outbound", "voicemail_reached", false, COMPLETED))), false);
  assert.equal(shouldLogCall(analyzed(ended("outbound", "ivr_reached", false, COMPLETED))), false);
});

test("2026-11-08: a call that dropped before anything useful was collected is dropped", () => {
  assert.equal(shouldLogCall(analyzed(ended("outbound", "user_hangup", false, DROPPED))), false);
  assert.equal(shouldLogCall(analyzed(ended("inbound", "user_hangup", false, { ...DROPPED, caller_name: "" }))), false);
  assert.equal(shouldLogCall(analyzed({ direction: "inbound", call_status: "ended", disconnection_reason: "user_hangup" })), false);
});

test("a name counts on inbound only: on a callback it comes from the opening line", () => {
  assert.equal(callCollectedSomething(ended("inbound", "user_hangup", false, DROPPED)), true);
  assert.equal(callCollectedSomething(ended("outbound", "user_hangup", false, DROPPED)), false);
  assert.equal(callCollectedSomething(ended(null, "user_hangup", false, DROPPED)), true); // web call
});

test("each signal alone is enough", () => {
  for (const extra of [
    { sms_consent: "granted" },
    { sms_consent: "declined" },
    { caller_priority: "emergency" },
    { caller_address: "1 Main St" },
    { caller_email: "d@example.test" },
    { callback_number: "2075550100" },
  ]) {
    assert.equal(shouldLogCall(analyzed(ended("outbound", "user_hangup", false, { ...DROPPED, ...extra }))), true, JSON.stringify(extra));
  }
});

test("only call_analyzed is logged: call_started and call_ended would add empty rows", () => {
  assert.equal(shouldLogCall({ event: "call_ended", call: ended("inbound", "user_hangup", false, COMPLETED) }), false);
  assert.equal(shouldLogCall({ event: "call_started", call: { direction: "inbound", call_status: "ongoing" } }), false);
  assert.equal(shouldLogCall({ event: "call_analyzed" }), false);
});

// ── call profile ────────────────────────────────────────────────────────────────────────────

const HOOK = "https://hook.us2.make.com/" + "a1b2c3d4".repeat(4);
const MASTER_HOOK = "https://hook.us2.make.com/" + "f9e8d7c6".repeat(4);
const profile = (over = {}) => ({
  v: 1,
  acctScope: "0123456789abcdef",
  siteSlug: "_e2e_test_growth",
  label: "E2E Test Growth",
  retellAgentId: "agent_0123456789abcdef",
  airtableBaseId: "appCLIENTbase0001",
  airtableTable: CALL_LOG_TABLE,
  siteColumn: null,
  hookUrl: HOOK,
  updatedAt: "2026-11-15T00:00:00.000Z",
  ...over,
});
const master = { airtableBaseId: "appMASTERbase0001", hookUrl: MASTER_HOOK };

test("a well-formed client profile has no problems", () => {
  assert.deepEqual(callProfileProblems(profile(), master), []);
  assert.deepEqual(callProfileProblems(profile({ siteColumn: "site-2" }), master), []);
});

test("Never wire a client to a master resource: the master base is refused", () => {
  const p = callProfileProblems(profile({ airtableBaseId: master.airtableBaseId }), master);
  assert.equal(p.length, 1);
  assert.match(p[0], /MASTER base/);
});

test("Never wire a client to a master resource: the master hook is refused, however it is written", () => {
  for (const hookUrl of [MASTER_HOOK, MASTER_HOOK + "/", MASTER_HOOK.toUpperCase().replace("HTTPS://HOOK.US2.MAKE.COM", "https://hook.us2.make.com")]) {
    const p = callProfileProblems(profile({ hookUrl }), master);
    assert.ok(p.some((x) => /MASTER scenario's hook/.test(x)), hookUrl.length + " chars");
  }
});

test("a problem never quotes the hook URL — it is a credential", () => {
  const p = callProfileProblems(profile({ hookUrl: MASTER_HOOK }), master).join(" ");
  assert.ok(!p.includes("f9e8d7c6"));
});

test("the reconcile POSTs only to a Make hook", () => {
  assert.equal(isMakeHookUrl(HOOK), true);
  assert.equal(isMakeHookUrl("https://hook.eu1.make.com/" + "x".repeat(32)), true);
  assert.equal(isMakeHookUrl("https://hook.integromat.com/" + "x".repeat(32)), true);
  for (const bad of [
    "http://hook.us2.make.com/" + "x".repeat(32),
    "https://hook.us2.make.com.evil.test/" + "x".repeat(32),
    "https://evil.test/hook.us2.make.com/" + "x".repeat(32),
    "https://user:pw@hook.us2.make.com/" + "x".repeat(32),
    "https://hook.us2.make.com:8443/" + "x".repeat(32),
    "https://hook.us2.make.com/short",
    "https://www.juneaudigitaldesigns.com/api/ingest/call",
    null,
  ]) {
    assert.equal(isMakeHookUrl(bad), false, String(bad).slice(0, 40));
  }
});

test("malformed ids are reported", () => {
  const p = callProfileProblems(profile({ retellAgentId: "nope", airtableBaseId: "base", acctScope: "x", siteColumn: " " }), master);
  assert.equal(p.length, 4);
});

test("keys are account-scoped and indexed", () => {
  assert.equal(callProfileKey("0123456789abcdef", "acme"), "jdd:callprofile:v1:0123456789abcdef:acme");
  assert.equal(CALL_PROFILE_INDEX, "jdd:callprofile:v1:index");
});
