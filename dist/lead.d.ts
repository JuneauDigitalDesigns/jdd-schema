import { z } from "zod";
/**
 * A web-form enquiry captured into the client portal.
 *
 * Replaces the old Resend-email delivery, where a lead existed only as an HTML email and was
 * gone the moment the owner deleted it. Every tier captures these — including web-only, which
 * has no Airtable base and never will, which is why the `leads` feature gate requires no
 * stored id.
 *
 * **Contact identity is `normalizeE164(phone)`** — the same id the CRM groups calls by. That is
 * deliberate and load-bearing: a form submission and a phone call from the same person collapse
 * onto one customer instead of two. Do not invent a lead-specific identifier.
 *
 * Shape owned by `PLAN-portal-form-capture.md` §3; declared here so the producer (client site
 * → ingest route) and the consumer (portal Inbox) cannot drift.
 */
export interface WebLead {
    /** ULID — sortable by creation time. Two identical enquiries an hour apart are two leads. */
    leadId: string;
    slug: string;
    name: string | null;
    /** E.164 when parseable; the raw input is kept separately so nothing is silently lost. */
    phone: string | null;
    phoneRaw: string | null;
    email: string | null;
    message: string | null;
    /** Anything else the form posted, labelled. */
    fields: Record<string, string>;
    createdAt: string;
    /** Set when the owner opens it. The Inbox's read/unread state — do not add a second one. */
    readAt: string | null;
    source: "web-form";
    /** Growth/Enterprise: did the Retell callback actually get placed. */
    callbackPlaced: boolean;
}
export declare const zWebLead: z.ZodObject<{
    leadId: z.ZodString;
    slug: z.ZodString;
    name: z.ZodNullable<z.ZodString>;
    phone: z.ZodNullable<z.ZodString>;
    phoneRaw: z.ZodNullable<z.ZodString>;
    email: z.ZodNullable<z.ZodString>;
    message: z.ZodNullable<z.ZodString>;
    fields: z.ZodRecord<z.ZodString, z.ZodString>;
    createdAt: z.ZodString;
    readAt: z.ZodNullable<z.ZodString>;
    source: z.ZodLiteral<"web-form">;
    callbackPlaced: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    message: string | null;
    slug: string;
    name: string | null;
    email: string | null;
    createdAt: string;
    phone: string | null;
    source: "web-form";
    leadId: string;
    phoneRaw: string | null;
    fields: Record<string, string>;
    readAt: string | null;
    callbackPlaced: boolean;
}, {
    message: string | null;
    slug: string;
    name: string | null;
    email: string | null;
    createdAt: string;
    phone: string | null;
    source: "web-form";
    leadId: string;
    phoneRaw: string | null;
    fields: Record<string, string>;
    readAt: string | null;
    callbackPlaced: boolean;
}>;
//# sourceMappingURL=lead.d.ts.map