import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ticketKey,
  TICKET_INDEX,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  createTicket,
  applyTicketStatus,
  appendTicketMessage,
  appendTicketActivity,
  zTicket,
} from "../dist/index.js";

const base = () =>
  createTicket({
    id: "t-1",
    accountEmail: "client@example.com",
    siteSlug: "acme",
    subject: "Phones not ringing",
    category: "voice_agent",
    body: "No calls are coming through since yesterday.",
    now: 1000,
  });

test("ticketKey is namespaced and TICKET_INDEX is the shared sorted set", () => {
  assert.equal(ticketKey("abc"), "jdd:ticket:item:abc");
  assert.equal(TICKET_INDEX, "jdd:ticket:index");
});

test("status + category vocabularies are the agreed runtime values", () => {
  assert.deepEqual(TICKET_STATUSES, [
    "open",
    "in_progress",
    "waiting_on_client",
    "resolved",
    "closed",
  ]);
  assert.deepEqual(TICKET_CATEGORIES, [
    "billing",
    "technical",
    "content",
    "voice_agent",
    "other",
  ]);
});

test("createTicket seeds an open status, a created activity entry, and the body as the first client message", () => {
  const t = base();
  assert.equal(t.status, "open");
  assert.equal(t.createdAt, 1000);
  assert.equal(t.updatedAt, 1000);
  assert.equal(t.accountEmail, "client@example.com");
  assert.equal(t.siteSlug, "acme");
  assert.equal(t.activity.length, 1);
  assert.equal(t.activity[0].kind, "created");
  assert.equal(t.messages.length, 1);
  assert.deepEqual(t.messages[0], {
    at: 1000,
    author: "client",
    text: "No calls are coming through since yesterday.",
  });
  // The minted shape must round-trip through the schema the stores validate against.
  assert.equal(zTicket.safeParse(t).success, true);
});

test("applyTicketStatus is immutable, records an audit entry, and bumps updatedAt", () => {
  const t = base();
  const next = applyTicketStatus(t, "waiting_on_client", 2000);
  assert.equal(t.status, "open"); // input untouched
  assert.equal(next.status, "waiting_on_client");
  assert.equal(next.updatedAt, 2000);
  assert.equal(next.activity.length, 2);
  assert.equal(next.activity[1].kind, "status");
});

test("appendTicketMessage adds to the thread and bumps updatedAt without touching the input", () => {
  const t = base();
  const next = appendTicketMessage(t, { author: "operator", text: "Looking now." }, 3000);
  assert.equal(t.messages.length, 1);
  assert.equal(next.messages.length, 2);
  assert.deepEqual(next.messages[1], { at: 3000, author: "operator", text: "Looking now." });
  assert.equal(next.updatedAt, 3000);
});

test("appendTicketActivity accepts one or many entries", () => {
  const t = base();
  const one = appendTicketActivity(t, { kind: "note", text: "paged on-call" }, 4000);
  assert.equal(one.activity.length, 2);
  const many = appendTicketActivity(t, [
    { kind: "note", text: "a" },
    { kind: "note", text: "b" },
  ], 5000);
  assert.equal(many.activity.length, 3);
  assert.equal(many.activity[2].text, "b");
});

test("zTicket rejects an unknown status", () => {
  const t = { ...base(), status: "escalated" };
  assert.equal(zTicket.safeParse(t).success, false);
});
