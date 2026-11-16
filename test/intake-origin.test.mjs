// How a queued signup reached JDD (v1.36.0, 2026-11-16).
//
// The console's Clients badge counts self-serve signups. Before the agency stamped an id on the
// queued intake, the console could only tell a call close from self-serve by an indirect rule, so
// the reader must be able to tell "no id stamped yet" apart from "self-serve" and fall back.
import { test } from "node:test";
import assert from "node:assert/strict";
import { intakeOrigin } from "../dist/index.js";

test("an order id means the client was closed on a call, even with a purchase id", () => {
  assert.equal(intakeOrigin({ orderId: "ord_1" }), "operator-call");
  assert.equal(intakeOrigin({ orderId: "ord_1", purchaseId: "pur_1" }), "operator-call");
});

test("a purchase id alone is self-serve", () => {
  assert.equal(intakeOrigin({ purchaseId: "pur_1" }), "self-serve");
  assert.equal(intakeOrigin({ orderId: null, purchaseId: "pur_1" }), "self-serve");
});

test("neither id is unknown, never self-serve", () => {
  assert.equal(intakeOrigin({}), null);
  assert.equal(intakeOrigin({ orderId: "", purchaseId: "" }), null);
});
