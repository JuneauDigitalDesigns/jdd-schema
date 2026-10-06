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
/** The support lifecycle. Operator may set any; the client may only reopen or confirm-close. */
export declare const TICKET_STATUSES: readonly ["open", "in_progress", "waiting_on_client", "resolved", "closed"];
export type TicketStatus = (typeof TICKET_STATUSES)[number];
/** Triage buckets the client picks from when opening a ticket. */
export declare const TICKET_CATEGORIES: readonly ["billing", "technical", "content", "voice_agent", "other"];
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
/** One entry in a ticket's audit trail — status changes and system events. Server-stamped. */
export interface TicketActivity {
    at: number;
    kind: string;
    text: string;
}
/** One message in the client↔operator conversation thread. */
export interface TicketMessage {
    at: number;
    author: "client" | "operator";
    text: string;
}
export interface Ticket {
    id: string;
    /** Epoch ms — doubles as the sorted-set score. */
    createdAt: number;
    /** Epoch ms of the last mutation; absent until first patched. */
    updatedAt?: number;
    /** Normalized account email — stamped server-side from resolvePortalRequest, never the client body. */
    accountEmail: string;
    /** The site this ticket is about — stamped server-side from the resolved `?site=` slug. */
    siteSlug: string;
    status: TicketStatus;
    subject: string;
    category: TicketCategory;
    /** Fractional sort position within its board column; absent = never dragged. */
    order?: number;
    /** Audit of status changes / system events. Append-only. */
    activity: TicketActivity[];
    /** The conversation thread. Append-only. */
    messages: TicketMessage[];
}
export declare const zTicketActivity: z.ZodObject<{
    at: z.ZodNumber;
    kind: z.ZodString;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    at: number;
    kind: string;
    text: string;
}, {
    at: number;
    kind: string;
    text: string;
}>;
export declare const zTicketMessage: z.ZodObject<{
    at: z.ZodNumber;
    author: z.ZodEnum<["client", "operator"]>;
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    at: number;
    text: string;
    author: "client" | "operator";
}, {
    at: number;
    text: string;
    author: "client" | "operator";
}>;
export declare const zTicket: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodOptional<z.ZodNumber>;
    accountEmail: z.ZodString;
    siteSlug: z.ZodString;
    status: z.ZodEnum<["open", "in_progress", "waiting_on_client", "resolved", "closed"]>;
    subject: z.ZodString;
    category: z.ZodEnum<["billing", "technical", "content", "voice_agent", "other"]>;
    order: z.ZodOptional<z.ZodNumber>;
    activity: z.ZodArray<z.ZodObject<{
        at: z.ZodNumber;
        kind: z.ZodString;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        at: number;
        kind: string;
        text: string;
    }, {
        at: number;
        kind: string;
        text: string;
    }>, "many">;
    messages: z.ZodArray<z.ZodObject<{
        at: z.ZodNumber;
        author: z.ZodEnum<["client", "operator"]>;
        text: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        at: number;
        text: string;
        author: "client" | "operator";
    }, {
        at: number;
        text: string;
        author: "client" | "operator";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "closed" | "open" | "in_progress" | "waiting_on_client" | "resolved";
    createdAt: number;
    id: string;
    siteSlug: string;
    accountEmail: string;
    subject: string;
    category: "other" | "billing" | "technical" | "content" | "voice_agent";
    activity: {
        at: number;
        kind: string;
        text: string;
    }[];
    messages: {
        at: number;
        text: string;
        author: "client" | "operator";
    }[];
    updatedAt?: number | undefined;
    order?: number | undefined;
}, {
    status: "closed" | "open" | "in_progress" | "waiting_on_client" | "resolved";
    createdAt: number;
    id: string;
    siteSlug: string;
    accountEmail: string;
    subject: string;
    category: "other" | "billing" | "technical" | "content" | "voice_agent";
    activity: {
        at: number;
        kind: string;
        text: string;
    }[];
    messages: {
        at: number;
        text: string;
        author: "client" | "operator";
    }[];
    updatedAt?: number | undefined;
    order?: number | undefined;
}>;
export declare const TICKET_KEY_PREFIX = "jdd:ticket:item:";
export declare const TICKET_INDEX = "jdd:ticket:index";
export declare function ticketKey(id: string): string;
/**
 * Mint a brand-new ticket from a client submission.
 *
 * Seeds the audit trail with a `created` entry and the thread with the submitted body as the
 * client's first message, so a ticket is never empty. `createdAt` doubles as the index score;
 * status always starts `open`. The `id` (a UUID) is supplied by the caller — this package has
 * no `crypto` global, and the consumers already run where `crypto.randomUUID()` exists.
 */
export declare function createTicket(input: {
    id: string;
    accountEmail: string;
    siteSlug: string;
    subject: string;
    category: TicketCategory;
    body: string;
    now?: number;
}): Ticket;
/**
 * Change a ticket's status, appending an audit entry and bumping `updatedAt`. Returns a new
 * object; never mutates the input. A no-op status (same as current) still records the touch.
 */
export declare function applyTicketStatus(ticket: Ticket, status: TicketStatus, now?: number): Ticket;
/** Append a message to the thread and bump `updatedAt`. Returns a new object. */
export declare function appendTicketMessage(ticket: Ticket, msg: {
    author: "client" | "operator";
    text: string;
}, now?: number): Ticket;
/**
 * Append one or many entries to the audit trail. Callers describe the change; this stamps the
 * time. Mirrors `patchLead`'s activity handling. Returns a new object.
 */
export declare function appendTicketActivity(ticket: Ticket, entry: {
    kind: string;
    text: string;
} | {
    kind: string;
    text: string;
}[], now?: number): Ticket;
//# sourceMappingURL=ticket.d.ts.map