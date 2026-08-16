import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeProjectName, vercelAppHost, vercelVoiceUrl } from "../dist/index.js";

// ── sanitizeProjectName ─────────────────────────────────────────────────────

test("sanitizeProjectName strips leading punctuation", () => {
  assert.equal(sanitizeProjectName("_e2e-growth"), "e2e-growth");
});

test("sanitizeProjectName lowercases and replaces illegal characters", () => {
  assert.equal(sanitizeProjectName("Acme Plumbing!"), "acme-plumbing");
});

test("sanitizeProjectName collapses 3+ hyphens and trims trailing punctuation", () => {
  assert.equal(sanitizeProjectName("a----b_"), "a--b");
});

test("sanitizeProjectName never returns empty", () => {
  assert.equal(sanitizeProjectName("___"), "project");
});

// ── vercelAppHost ───────────────────────────────────────────────────────────
//
// These four are the real hosts from the live Vercel account. They are the reason this
// module exists: the previous rule hyphenated underscores and produced hostnames that do
// not resolve, which pointed every affected client's inbound calls at nothing.

test("underscores are DROPPED, not hyphenated", () => {
  assert.equal(vercelAppHost("e2e_test_growth"), "e2etestgrowth");
  assert.equal(vercelAppHost("_e2e_test_growth"), "e2etestgrowth");
});

test("hyphens are preserved", () => {
  assert.equal(vercelAppHost("juneau-digital-designs"), "juneau-digital-designs");
  assert.equal(vercelAppHost("jdd-kanban"), "jdd-kanban");
  assert.equal(vercelAppHost("arthur-s-plumbing"), "arthur-s-plumbing");
});

test("the old rule is not silently reintroduced", () => {
  // Guards the exact regression: sanitizeProjectName(slug).replace(/_/g, '-').
  assert.notEqual(vercelAppHost("e2e_test_growth"), "e2e-test-growth");
});

test("dots are dropped — they are not valid inside a DNS label", () => {
  assert.equal(vercelAppHost("foo.bar"), "foobar");
});

test("a host never starts or ends with a hyphen", () => {
  // sanitizeProjectName can leave a leading hyphen when the slug began with an illegal
  // character; a label with one is invalid, so it must be trimmed after stripping.
  const host = vercelAppHost("!weird!");
  assert.doesNotMatch(host, /^-|-$/);
});

test("vercelAppHost never returns empty", () => {
  assert.equal(vercelAppHost("___"), "project");
});

// ── vercelVoiceUrl ──────────────────────────────────────────────────────────

test("vercelVoiceUrl matches what onboard.js sets on the number", () => {
  assert.equal(
    vercelVoiceUrl("_e2e_test_growth"),
    "https://e2etestgrowth.vercel.app/api/voice",
  );
});
