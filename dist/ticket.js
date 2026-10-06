/**
 * Support ticket — the durable record behind the portal's Support tab and the console's
 * /tickets board.
 *
 *   Key   `jdd:ticket:item:{id}`   — the record
 *   Index `jdd:ticket:index`       — sorted set, score = createdAt epoch ms (newest-first)
 *
 * The same KV bridge the lead funnel uses: the agency site / portal is the client-facing
 * producer/consumer (create, add a message, reopen, confirm-close — scoped server-side to
 * one accountEmail + siteSlug), and jdd-ops/console is the operator consumer (full CRUD,
 * any status). Both apps import this module; the store wrappers (get/list/save/delete) live
 * in each consumer, exactly like `account.ts`.
 *
 * Everything here is a **pure** function over plain data so it can be unit tested without
 * Redis or a network. There is deliberately no TTL: support history is durable state, like
 * `jdd:lead:*` and the account record — not a transient claim queue.
 *
 * This module is standalone: it imports nothing from the other schema modules and is parsed
 * only by the ticket stores, so there is no cross-schema key-stripping to worry about. Keep
 * every persisted field in `zTicket` or a read-modify-write will silently drop it.
 */
import { z } from "zod";
// ── Status & category vocabularies (runtime VALUES the board + UI both need) ──
/** The support lifecycle. Operator may set any; the client may only reopen or confirm-close. */
export const TICKET_STATUSES = [
    "open",
    "in_progress",
    "waiting_on_client",
    "resolved",
    "closed",
];
/** Triage buckets the client picks from when opening a ticket. */
export const TICKET_CATEGORIES = [
    "billing",
    "technical",
    "content",
    "voice_agent",
    "other",
];
export const zTicketActivity = z.object({
    at: z.number(),
    kind: z.string(),
    text: z.string(),
});
export const zTicketMessage = z.object({
    at: z.number(),
    author: z.enum(["client", "operator"]),
    text: z.string(),
});
export const zTicket = z.object({
    id: z.string().min(1),
    createdAt: z.number(),
    updatedAt: z.number().optional(),
    accountEmail: z.string().min(1),
    siteSlug: z.string().min(1),
    status: z.enum(TICKET_STATUSES),
    subject: z.string().min(1),
    category: z.enum(TICKET_CATEGORIES),
    order: z.number().optional(),
    activity: z.array(zTicketActivity),
    messages: z.array(zTicketMessage),
});
// ── Keys ────────────────────────────────────────────────────────────────────
export const TICKET_KEY_PREFIX = "jdd:ticket:item:";
export const TICKET_INDEX = "jdd:ticket:index";
export function ticketKey(id) {
    return `${TICKET_KEY_PREFIX}${id}`;
}
// ── Pure operations ─────────────────────────────────────────────────────────
/**
 * Mint a brand-new ticket from a client submission.
 *
 * Seeds the audit trail with a `created` entry and the thread with the submitted body as the
 * client's first message, so a ticket is never empty. `createdAt` doubles as the index score;
 * status always starts `open`. The `id` (a UUID) is supplied by the caller — this package has
 * no `crypto` global, and the consumers already run where `crypto.randomUUID()` exists.
 */
export function createTicket(input) {
    const now = input.now ?? Date.now();
    return {
        id: input.id,
        createdAt: now,
        updatedAt: now,
        accountEmail: input.accountEmail,
        siteSlug: input.siteSlug,
        status: "open",
        subject: input.subject,
        category: input.category,
        activity: [{ at: now, kind: "created", text: "Ticket opened" }],
        messages: [{ at: now, author: "client", text: input.body }],
    };
}
/**
 * Change a ticket's status, appending an audit entry and bumping `updatedAt`. Returns a new
 * object; never mutates the input. A no-op status (same as current) still records the touch.
 */
export function applyTicketStatus(ticket, status, now = Date.now()) {
    return {
        ...ticket,
        status,
        updatedAt: now,
        activity: [
            ...(Array.isArray(ticket.activity) ? ticket.activity : []),
            { at: now, kind: "status", text: `Status → ${status}` },
        ],
    };
}
/** Append a message to the thread and bump `updatedAt`. Returns a new object. */
export function appendTicketMessage(ticket, msg, now = Date.now()) {
    return {
        ...ticket,
        updatedAt: now,
        messages: [
            ...(Array.isArray(ticket.messages) ? ticket.messages : []),
            { at: now, author: msg.author, text: msg.text },
        ],
    };
}
/**
 * Append one or many entries to the audit trail. Callers describe the change; this stamps the
 * time. Mirrors `patchLead`'s activity handling. Returns a new object.
 */
export function appendTicketActivity(ticket, entry, now = Date.now()) {
    const entries = Array.isArray(entry) ? entry : [entry];
    return {
        ...ticket,
        updatedAt: now,
        activity: [
            ...(Array.isArray(ticket.activity) ? ticket.activity : []),
            ...entries.map((e) => ({ at: now, kind: e.kind, text: e.text })),
        ],
    };
}
//# sourceMappingURL=ticket.js.map