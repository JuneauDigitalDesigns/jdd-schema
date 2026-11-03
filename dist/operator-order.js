/**
 * Operator orders: a client closed by Xander on a sales call rather than through self-serve.
 *
 * Self-serve decides "who is buying what" from an authenticated browser session and writes it
 * to a purchase intent. On a call there is no client login, so the operator states it, and
 * this record is where it is written down. It replaces the purchase intent on that path; it
 * does NOT replace the agreement — terms acceptance is still an `AgreementRecord`, with an
 * `acceptance` of `verbal-operator`.
 *
 * Shared here, not copied into the two apps, because three readers must agree on it exactly:
 * the agency (which writes it), the console wizard (which resumes from it), and the console's
 * client cards (which render readiness from it). Two copies of "which step comes next" is how
 * a resumed close skips a step or offers a second charge.
 *
 * Pure: types, zod, and decisions. All I/O lives in the apps.
 */
import { z } from "zod";
// ── Status ──────────────────────────────────────────────────────────────────
export const ORDER_STATUSES = [
    "draft",
    "terms-accepted",
    "awaiting-payment",
    "paid",
    "fulfilled",
    "expired",
    "cancelled",
];
/**
 * The legal status moves. Anything else is refused at write time.
 *
 * `expired → awaiting-payment` is the resend: a Checkout Session lives 24 hours, and a client
 * who paid nothing on the call can still be sent a fresh link. Nothing leaves `fulfilled` or
 * `cancelled` — a paid order that needs changing is a plan change, not an edit, and a cancelled
 * one is replaced by a new order so the agreement on file always matches what was charged.
 */
const TRANSITIONS = {
    draft: ["terms-accepted", "cancelled"],
    "terms-accepted": ["awaiting-payment", "cancelled"],
    "awaiting-payment": ["paid", "expired", "cancelled"],
    expired: ["awaiting-payment", "cancelled"],
    paid: ["fulfilled"],
    fulfilled: [],
    cancelled: [],
};
/** True when `from → to` is a legal move. Same-status writes are always allowed (field edits). */
export function canTransition(from, to) {
    return from === to || TRANSITIONS[from].includes(to);
}
/** Statuses that mean money has moved. */
export function isOrderPaid(status) {
    return status === "paid" || status === "fulfilled";
}
// ── Record ──────────────────────────────────────────────────────────────────
export const ORDER_KEY_PREFIX = "jdd:order:";
export const orderKey = (id) => `${ORDER_KEY_PREFIX}${id}`;
export const orderByLeadKey = (leadId) => `jdd:order-by-lead:${leadId}`;
export const slugClaimKey = (slug) => `jdd:slug-claim:${slug}`;
export const payCodeKey = (code) => `jdd:pay:${code}`;
export const ORDERS_INDEX_KEY = "jdd:orders:index";
const zPlan = z.enum(["starter", "growth", "enterprise"]);
export const zOperatorOrder = z.object({
    id: z.string().min(1),
    version: z.literal(1),
    source: z.literal("operator-call"),
    status: z.enum(ORDER_STATUSES),
    leadId: z.string().min(1),
    /** Locked at creation. Every system — portal site, clients/ folder, A2P record — uses it. */
    siteSlug: z.string().min(1),
    plan: zPlan,
    period: z.enum(["monthly", "annual"]),
    pricing: z.object({ kind: z.literal("standard") }),
    client: z.object({
        legalName: z.string().min(1),
        dba: z.string().optional(),
        contactName: z.string().min(1),
        /** Normalized. Becomes the portal account key. */
        email: z.string().min(1),
        phone: z.string().min(1),
    }),
    /** Vertical preset id: seeds clients/<slug>/site.ts and the A2P industry default. */
    vertical: z.string().min(1),
    receptionistMode: z.enum(["forwarded", "published", "declined"]).optional(),
    /** The client's existing business line, when `forwarded`. As typed; normalized at use. */
    forwardingNumber: z.string().optional(),
    operator: z.string().min(1),
    /** Auto-filled from the lead's phone and the acceptance time; editable later in /manage. */
    callRef: z.string().optional(),
    agreementId: z.string().optional(),
    agreementKind: z.enum(["master", "addendum"]).optional(),
    payment: z
        .object({
        method: z.enum(["link", "dashboard-moto"]),
        stripeCustomerId: z.string(),
        checkoutSessionId: z.string().optional(),
        checkoutUrl: z.string().optional(),
        shortCode: z.string().optional(),
        expiresAt: z.number().optional(),
        subscriptionId: z.string().optional(),
        amountTotal: z.number().optional(),
        paidAt: z.number().optional(),
        /** Stripe recorded the client ticking the ToS box on its own page. */
        tosAcceptedOnStripe: z.boolean().optional(),
    })
        .optional(),
    invite: z
        .object({
        kind: z.enum(["invitation", "existing-login"]),
        invitationId: z.string().optional(),
        sentAt: z.number(),
    })
        .optional(),
    fulfilledAt: z.number().optional(),
    /** The console has created clients/<slug>/ and linked the lead. */
    convertedAt: z.number().optional(),
    events: z.array(z.object({ at: z.number(), kind: z.string(), text: z.string() })),
    createdAt: z.number(),
    updatedAt: z.number(),
});
/**
 * Plans that register for A2P during the close. Starter and web-only send no customer-facing
 * messages, so they have no SMS step at all.
 */
export function closeHasSmsStep(plan) {
    return plan === "growth" || plan === "enterprise";
}
/**
 * Where a close wizard opens, from the records alone.
 *
 * The wizard keeps no state of its own: everything it needs to resume is in the order and the
 * A2P record, so a close abandoned mid-call opens again exactly where it stopped, and nothing
 * before that point can be redone (no second terms acceptance, no second charge).
 *
 * `a2pStatus` is the A2P chain's `portalStatusFor(record)`, or null when there is no record.
 * The SMS step stays the resume point until the brand is filed — `none` and `failed` need the
 * form, and the two bundle-review states are where "Refresh" and "File brand" live.
 */
export function resumeStepFor(input) {
    const { order, a2pStatus } = input;
    if (!order)
        return "order";
    switch (order.status) {
        case "draft":
        case "cancelled":
            return "order";
        case "terms-accepted":
        case "awaiting-payment":
        case "expired":
            return "payment";
        case "paid":
        case "fulfilled":
            break;
    }
    if (!order.convertedAt)
        return "setup";
    if (!closeHasSmsStep(order.plan))
        return "done";
    const status = a2pStatus ?? "none";
    const smsUnfinished = ["none", "failed", "profile-pending", "profile-approved"];
    return smsUnfinished.includes(status) ? "sms" : "done";
}
/**
 * The four lights on a closed client's card: Payment · Onboarding · SMS brand · SMS campaign.
 *
 * Every input is a record we already hold — the order, the portal site and account, and the
 * A2P status — so the roster can render this without calling Stripe or Twilio.
 *
 * `a2pNeedsEin` is the one fact `portalStatusFor` cannot express: the registration was saved
 * without the business identity (the EIN step), so nothing has been submitted and the next
 * move is the operator's, not the carrier's.
 */
export function readinessFor(input) {
    const { order, site, clientSignedIn, plan, a2pStatus, a2pNeedsEin } = input;
    const payment = (() => {
        if (!order)
            return site ? { value: "Paid", tone: "ok" } : { value: "Not yet", tone: "off" };
        switch (order.status) {
            case "paid":
            case "fulfilled":
                return { value: "Paid", tone: "ok" };
            case "awaiting-payment":
                return { value: "Link sent", tone: "warn" };
            case "expired":
                return { value: "Link expired", tone: "warn" };
            case "cancelled":
                return { value: "Cancelled", tone: "off" };
            default:
                return { value: "Not yet", tone: "off" };
        }
    })();
    const onboarding = (() => {
        if (site && (site.onboardingCompletedAt || site.status !== "pending-onboarding")) {
            return { value: "Submitted", tone: "ok" };
        }
        if (clientSignedIn)
            return { value: "Signed in", tone: "wait" };
        if (order?.invite)
            return { value: "Invite sent", tone: "wait" };
        return { value: "Not yet", tone: "off" };
    })();
    const registers = closeHasSmsStep(plan);
    const status = a2pStatus ?? "none";
    const brand = (() => {
        if (!registers || status === "not-applicable")
            return { value: "Not needed", tone: "off" };
        if (status === "failed")
            return { value: "Failed", tone: "bad" };
        if (status === "none") {
            return a2pNeedsEin ? { value: "Needs EIN", tone: "warn" } : { value: "Not started", tone: "off" };
        }
        if (status === "profile-pending" || status === "profile-approved")
            return { value: "In review", tone: "wait" };
        if (status === "brand-pending")
            return { value: "Brand pending", tone: "wait" };
        return { value: "Approved", tone: "ok" };
    })();
    const campaign = (() => {
        if (!registers || status === "not-applicable")
            return { value: "Not needed", tone: "off" };
        if (status === "campaign-pending")
            return { value: "Pending", tone: "wait" };
        if (status === "verified")
            return { value: "Verified", tone: "ok" };
        return { value: "Up next", tone: "off" };
    })();
    return [
        { id: "payment", label: "Payment", ...payment },
        { id: "onboarding", label: "Onboarding", ...onboarding },
        { id: "sms-brand", label: "SMS brand", ...brand },
        { id: "sms-campaign", label: "SMS campaign", ...campaign },
    ];
}
/** Narrowing helper for the receptionist field, shared by both validators. */
export function isReceptionistMode(value) {
    return value === "forwarded" || value === "published" || value === "declined";
}
//# sourceMappingURL=operator-order.js.map