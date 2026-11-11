import { test } from "node:test";
import assert from "node:assert/strict";
import { toE164, samePhone } from "../dist/index.js";

test("already-E.164 numbers pass through unchanged", () => {
  assert.equal(toE164("+12075550199"), "+12075550199");
  assert.equal(toE164("+442071838750"), "+442071838750");
});

test("10-digit US numbers gain +1", () => {
  assert.equal(toE164("2075550199"), "+12075550199");
});

test("11-digit numbers starting 1 gain +", () => {
  assert.equal(toE164("12075550199"), "+12075550199");
});

test("punctuation and whitespace are ignored", () => {
  assert.equal(toE164("  (207) 555-0199 "), "+12075550199");
  assert.equal(toE164("207.555.0199"), "+12075550199");
});

test("unparseable input returns null, never a guess", () => {
  // A nearly-right number is a call that fails. Callers must handle the ambiguity rather
  // than have something unusable written into Twilio on their behalf.
  for (const bad of ["", "   ", "555-0199", "abc", "+", "1", null, undefined]) {
    assert.equal(toE164(bad), null, `expected null for ${JSON.stringify(bad)}`);
  }
});

// ── samePhone: the comparison the portal drift check runs on ────────────────

test("formatting differences are not drift", () => {
  // Without this, every client whose portal profile is punctuated differently from their
  // .env.local would carry a permanent false warning.
  assert.equal(samePhone("(207) 555-0199", "+12075550199"), true);
  assert.equal(samePhone("207-555-0199", "2075550199"), true);
});

test("genuinely different numbers are drift", () => {
  assert.equal(samePhone("+12075550199", "+12077763277"), false);
});

test("two unparseable values are not equal even when identical", () => {
  // If we cannot tell what either one dials, we cannot claim they agree.
  assert.equal(samePhone("nonsense", "nonsense"), false);
});

test("a missing value is never equal to a present one", () => {
  assert.equal(samePhone(null, "+12075550199"), false);
  assert.equal(samePhone("+12075550199", undefined), false);
  assert.equal(samePhone(null, null), false);
});

test("the two historical regexes agree on every realistic input", () => {
  // Four call sites used /^\+\d{8,15}$/ and a fifth used /^\+[1-9]\d{7,14}$/. This pins the
  // behaviour that was consolidated, so a future edit can't quietly reintroduce the split.
  assert.equal(toE164("+12075550199"), "+12075550199");
  assert.equal(toE164("+441234567"), "+441234567"); // 9 digits, inside both bounds
});

// v1.33.3: the onboarding form stores bare digits and the templates printed them as is. Tracewell's
// test site read "4075550177" in its nav, hero, Contact and footer (E2E-ONBOARDING-TEST-2026-11-10, F-D6).
import { formatPhoneDisplay, phoneHref } from "../dist/index.js";

test("formatPhoneDisplay writes a North American number the way a site prints it", () => {
  assert.equal(formatPhoneDisplay("4075550177"), "(407) 555-0177");
  assert.equal(formatPhoneDisplay("+14075550177"), "(407) 555-0177");
  assert.equal(formatPhoneDisplay(" 407.555.0177 "), "(407) 555-0177");
  assert.equal(formatPhoneDisplay("(407) 555-0177"), "(407) 555-0177");
});

test("formatPhoneDisplay never guesses at a number toE164 can't read", () => {
  assert.equal(formatPhoneDisplay("+44 20 7946 0958"), "+44 20 7946 0958");
  assert.equal(formatPhoneDisplay("555-0177"), "555-0177");
  assert.equal(formatPhoneDisplay(""), "");
  assert.equal(formatPhoneDisplay(undefined), "");
});

test("phoneHref dials E.164, and no number gives no link", () => {
  assert.equal(phoneHref("4075550177"), "tel:+14075550177");
  assert.equal(phoneHref("(407) 555-0177"), "tel:+14075550177");
  assert.equal(phoneHref("555-0177"), "tel:5550177");
  assert.equal(phoneHref(""), "");
});

