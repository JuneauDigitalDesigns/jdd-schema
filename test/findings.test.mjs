import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sortFindings,
  severityCounts,
  severityRank,
  worstFinding,
  hasBreakage,
  diffFindings,
  countBreakages,
  zFinding,
} from "../dist/index.js";

const NOW = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function finding(id, overrides = {}) {
  return {
    id,
    severity: "amber",
    area: "site",
    siteSlug: "acme",
    title: id,
    detail: "",
    ...overrides,
  };
}

// ── ranking ─────────────────────────────────────────────────────────────────

test("unknown outranks grey", () => {
  // A check that could not run usually means a credential died, which is a small outage in
  // the ability to see everything else. Burying it under accepted notes lets the console go
  // blind one vendor at a time.
  assert.ok(severityRank("unknown") < severityRank("grey"));
});

test("red outranks everything", () => {
  for (const s of ["amber", "unknown", "grey"]) {
    assert.ok(severityRank("red") < severityRank(s));
  }
});

test("sortFindings is severity, then area, then site, then id", () => {
  const sorted = sortFindings([
    finding("z", { severity: "grey" }),
    finding("b", { severity: "red", area: "voice" }),
    finding("a", { severity: "red", area: "site" }),
    finding("c", { severity: "unknown" }),
  ]);
  assert.deepEqual(sorted.map((f) => f.id), ["a", "b", "c", "z"]);
});

test("sortFindings is stable across identical inputs", () => {
  // A sweep that reorders rows for no reason makes the list impossible to scan.
  const input = [finding("b"), finding("a"), finding("c")];
  assert.deepEqual(sortFindings(input).map((f) => f.id), sortFindings(input).map((f) => f.id));
});

test("sortFindings does not mutate its argument", () => {
  const input = [finding("b"), finding("a")];
  sortFindings(input);
  assert.deepEqual(input.map((f) => f.id), ["b", "a"]);
});

test("severityCounts always reports all four keys", () => {
  // The briefing renders from this; a missing key would render as undefined, not 0.
  assert.deepEqual(severityCounts([]), { red: 0, amber: 0, grey: 0, unknown: 0 });
});

test("worstFinding returns null on an empty set", () => {
  assert.equal(worstFinding([]), null);
});

test("hasBreakage is true only for red", () => {
  assert.equal(hasBreakage([finding("a", { severity: "unknown" })]), false);
  assert.equal(hasBreakage([finding("a", { severity: "amber" })]), false);
  assert.equal(hasBreakage([finding("a", { severity: "red" })]), true);
});

test("an expired token does not make every client look broken", () => {
  // Every check unknown, because one credential died. The roster must not shout.
  const allUnknown = ["a", "b", "c"].map((id) => finding(id, { severity: "unknown" }));
  assert.equal(hasBreakage(allUnknown), false);
});

// ── diffing ─────────────────────────────────────────────────────────────────

test("a problem that persists across sweeps opens exactly once", () => {
  // Otherwise "breakages in 30 days" counts how often you opened the console, not how
  // often the client's site actually broke.
  const f = [finding("twilio.voiceUrl", { severity: "red" })];
  assert.equal(diffFindings([], f, NOW).length, 1);
  assert.equal(diffFindings(f, f, NOW + DAY).length, 0);
  assert.equal(diffFindings(f, f, NOW + 2 * DAY).length, 0);
});

test("clearing a finding records a close", () => {
  const f = [finding("make.inactive", { severity: "red" })];
  const [t] = diffFindings(f, [], NOW);
  assert.equal(t.event, "closed");
  assert.equal(t.findingId, "make.inactive");
});

test("the same finding id on two sites is two separate problems", () => {
  // Enterprise: site-1 and site-2 each have their own voiceUrl, and one being wrong says
  // nothing about the other.
  const before = [finding("twilio.voiceUrl", { siteSlug: "acme-1" })];
  const after = [
    finding("twilio.voiceUrl", { siteSlug: "acme-1" }),
    finding("twilio.voiceUrl", { siteSlug: "acme-2" }),
  ];
  const ts = diffFindings(before, after, NOW);
  assert.equal(ts.length, 1);
  assert.equal(ts[0].siteSlug, "acme-2");
  assert.equal(ts[0].event, "opened");
});

test("a flap produces open, close, open", () => {
  const f = [finding("site.down", { severity: "red" })];
  const events = [
    ...diffFindings([], f, NOW),
    ...diffFindings(f, [], NOW + DAY),
    ...diffFindings([], f, NOW + 2 * DAY),
  ];
  assert.deepEqual(events.map((e) => e.event), ["opened", "closed", "opened"]);
});

// ── breakage counting (drives the at-risk stage rule) ───────────────────────

test("countBreakages counts red opens inside the window only", () => {
  const history = [
    { at: NOW - 40 * DAY, findingId: "a", siteSlug: "acme", severity: "red", event: "opened", title: "" },
    { at: NOW - 10 * DAY, findingId: "b", siteSlug: "acme", severity: "red", event: "opened", title: "" },
    { at: NOW - 5 * DAY, findingId: "b", siteSlug: "acme", severity: "red", event: "closed", title: "" },
    { at: NOW - 2 * DAY, findingId: "c", siteSlug: "acme", severity: "red", event: "opened", title: "" },
  ];
  assert.equal(countBreakages(history, NOW - 30 * DAY), 2);
});

test("countBreakages ignores unknown-severity opens", () => {
  // A client must never drift toward at-risk because a token expired on OUR side — that
  // would move their status on the strength of our own outage.
  const history = [
    { at: NOW - DAY, findingId: "a", siteSlug: "acme", severity: "unknown", event: "opened", title: "" },
    { at: NOW - DAY, findingId: "b", siteSlug: "acme", severity: "unknown", event: "opened", title: "" },
    { at: NOW - DAY, findingId: "c", siteSlug: "acme", severity: "amber", event: "opened", title: "" },
  ];
  assert.equal(countBreakages(history, NOW - 30 * DAY), 0);
});

// ── validation ──────────────────────────────────────────────────────────────

test("a finding with a fix validates", () => {
  const f = finding("twilio.voiceUrl", {
    severity: "red",
    fix: { route: "/api/manage/twilio/repair", body: { slug: "acme" }, label: "Re-point voiceUrl" },
  });
  assert.equal(zFinding.safeParse(f).success, true);
});

test("an unknown severity is rejected", () => {
  assert.equal(zFinding.safeParse(finding("a", { severity: "orange" })).success, false);
});
