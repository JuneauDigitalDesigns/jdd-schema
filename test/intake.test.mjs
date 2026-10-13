import { test } from "node:test";
import assert from "node:assert/strict";
import { leadModeFor } from "../dist/index.js";

test("leadModeFor: starter is email-capture", () => {
  assert.equal(leadModeFor("starter"), "email");
});

test("leadModeFor: growth and enterprise are phone-capture", () => {
  assert.equal(leadModeFor("growth"), "phone");
  assert.equal(leadModeFor("enterprise"), "phone");
});
