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
import type { A2pStatus, PortalPlan, PortalSite, ReceptionistMode } from "./account.js";
export declare const ORDER_STATUSES: readonly ["draft", "terms-accepted", "awaiting-payment", "paid", "fulfilled", "expired", "cancelled"];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
/** True when `from → to` is a legal move. Same-status writes are always allowed (field edits). */
export declare function canTransition(from: OrderStatus, to: OrderStatus): boolean;
/** Statuses that mean money has moved. */
export declare function isOrderPaid(status: OrderStatus): boolean;
export declare const ORDER_KEY_PREFIX = "jdd:order:";
export declare const orderKey: (id: string) => string;
export declare const orderByLeadKey: (leadId: string) => string;
export declare const slugClaimKey: (slug: string) => string;
export declare const payCodeKey: (code: string) => string;
export declare const ORDERS_INDEX_KEY = "jdd:orders:index";
export declare const zOperatorOrder: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodLiteral<1>;
    source: z.ZodLiteral<"operator-call">;
    status: z.ZodEnum<["draft", "terms-accepted", "awaiting-payment", "paid", "fulfilled", "expired", "cancelled"]>;
    leadId: z.ZodString;
    /** Locked at creation. Every system — portal site, clients/ folder, A2P record — uses it. */
    siteSlug: z.ZodString;
    plan: z.ZodEnum<["starter", "growth", "enterprise"]>;
    period: z.ZodEnum<["monthly", "annual"]>;
    pricing: z.ZodObject<{
        kind: z.ZodLiteral<"standard">;
    }, "strip", z.ZodTypeAny, {
        kind: "standard";
    }, {
        kind: "standard";
    }>;
    client: z.ZodObject<{
        legalName: z.ZodString;
        dba: z.ZodOptional<z.ZodString>;
        /** "LLC", "Corporation", … — the agreement names the client as "a {entityType} located at …". */
        entityType: z.ZodString;
        /** The business address the agreement names. Also prefills the A2P address. */
        address: z.ZodString;
        contactName: z.ZodString;
        /** The signer's title on the agreement. */
        contactTitle: z.ZodString;
        /** Normalized. Becomes the portal account key. */
        email: z.ZodString;
        phone: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        contactName: string;
        phone: string;
        address: string;
        legalName: string;
        entityType: string;
        contactTitle: string;
        dba?: string | undefined;
    }, {
        email: string;
        contactName: string;
        phone: string;
        address: string;
        legalName: string;
        entityType: string;
        contactTitle: string;
        dba?: string | undefined;
    }>;
    /** Vertical preset id: seeds clients/<slug>/site.ts and the A2P industry default. */
    vertical: z.ZodString;
    receptionistMode: z.ZodOptional<z.ZodEnum<["forwarded", "published", "declined"]>>;
    /** The client's existing business line, when `forwarded`. As typed; normalized at use. */
    forwardingNumber: z.ZodOptional<z.ZodString>;
    operator: z.ZodString;
    /** Auto-filled from the lead's phone and the acceptance time; editable later in /manage. */
    callRef: z.ZodOptional<z.ZodString>;
    agreementId: z.ZodOptional<z.ZodString>;
    agreementKind: z.ZodOptional<z.ZodEnum<["master", "addendum"]>>;
    payment: z.ZodOptional<z.ZodObject<{
        method: z.ZodEnum<["link", "dashboard-moto"]>;
        stripeCustomerId: z.ZodString;
        checkoutSessionId: z.ZodOptional<z.ZodString>;
        checkoutUrl: z.ZodOptional<z.ZodString>;
        shortCode: z.ZodOptional<z.ZodString>;
        expiresAt: z.ZodOptional<z.ZodNumber>;
        subscriptionId: z.ZodOptional<z.ZodString>;
        amountTotal: z.ZodOptional<z.ZodNumber>;
        paidAt: z.ZodOptional<z.ZodNumber>;
        /** Stripe recorded the client ticking the ToS box on its own page. */
        tosAcceptedOnStripe: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        stripeCustomerId: string;
        method: "link" | "dashboard-moto";
        checkoutSessionId?: string | undefined;
        checkoutUrl?: string | undefined;
        shortCode?: string | undefined;
        expiresAt?: number | undefined;
        subscriptionId?: string | undefined;
        amountTotal?: number | undefined;
        paidAt?: number | undefined;
        tosAcceptedOnStripe?: boolean | undefined;
    }, {
        stripeCustomerId: string;
        method: "link" | "dashboard-moto";
        checkoutSessionId?: string | undefined;
        checkoutUrl?: string | undefined;
        shortCode?: string | undefined;
        expiresAt?: number | undefined;
        subscriptionId?: string | undefined;
        amountTotal?: number | undefined;
        paidAt?: number | undefined;
        tosAcceptedOnStripe?: boolean | undefined;
    }>>;
    invite: z.ZodOptional<z.ZodObject<{
        kind: z.ZodEnum<["invitation", "existing-login"]>;
        invitationId: z.ZodOptional<z.ZodString>;
        sentAt: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        kind: "invitation" | "existing-login";
        sentAt: number;
        invitationId?: string | undefined;
    }, {
        kind: "invitation" | "existing-login";
        sentAt: number;
        invitationId?: string | undefined;
    }>>;
    fulfilledAt: z.ZodOptional<z.ZodNumber>;
    /** The console has created clients/<slug>/ and linked the lead. */
    convertedAt: z.ZodOptional<z.ZodNumber>;
    events: z.ZodArray<z.ZodObject<{
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
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    version: 1;
    status: "draft" | "terms-accepted" | "awaiting-payment" | "paid" | "fulfilled" | "expired" | "cancelled";
    plan: "starter" | "growth" | "enterprise";
    createdAt: number;
    updatedAt: number;
    client: {
        email: string;
        contactName: string;
        phone: string;
        address: string;
        legalName: string;
        entityType: string;
        contactTitle: string;
        dba?: string | undefined;
    };
    id: string;
    source: "operator-call";
    leadId: string;
    siteSlug: string;
    operator: string;
    period: "monthly" | "annual";
    pricing: {
        kind: "standard";
    };
    vertical: string;
    events: {
        at: number;
        kind: string;
        text: string;
    }[];
    agreementId?: string | undefined;
    receptionistMode?: "forwarded" | "published" | "declined" | undefined;
    forwardingNumber?: string | undefined;
    callRef?: string | undefined;
    agreementKind?: "master" | "addendum" | undefined;
    payment?: {
        stripeCustomerId: string;
        method: "link" | "dashboard-moto";
        checkoutSessionId?: string | undefined;
        checkoutUrl?: string | undefined;
        shortCode?: string | undefined;
        expiresAt?: number | undefined;
        subscriptionId?: string | undefined;
        amountTotal?: number | undefined;
        paidAt?: number | undefined;
        tosAcceptedOnStripe?: boolean | undefined;
    } | undefined;
    invite?: {
        kind: "invitation" | "existing-login";
        sentAt: number;
        invitationId?: string | undefined;
    } | undefined;
    fulfilledAt?: number | undefined;
    convertedAt?: number | undefined;
}, {
    version: 1;
    status: "draft" | "terms-accepted" | "awaiting-payment" | "paid" | "fulfilled" | "expired" | "cancelled";
    plan: "starter" | "growth" | "enterprise";
    createdAt: number;
    updatedAt: number;
    client: {
        email: string;
        contactName: string;
        phone: string;
        address: string;
        legalName: string;
        entityType: string;
        contactTitle: string;
        dba?: string | undefined;
    };
    id: string;
    source: "operator-call";
    leadId: string;
    siteSlug: string;
    operator: string;
    period: "monthly" | "annual";
    pricing: {
        kind: "standard";
    };
    vertical: string;
    events: {
        at: number;
        kind: string;
        text: string;
    }[];
    agreementId?: string | undefined;
    receptionistMode?: "forwarded" | "published" | "declined" | undefined;
    forwardingNumber?: string | undefined;
    callRef?: string | undefined;
    agreementKind?: "master" | "addendum" | undefined;
    payment?: {
        stripeCustomerId: string;
        method: "link" | "dashboard-moto";
        checkoutSessionId?: string | undefined;
        checkoutUrl?: string | undefined;
        shortCode?: string | undefined;
        expiresAt?: number | undefined;
        subscriptionId?: string | undefined;
        amountTotal?: number | undefined;
        paidAt?: number | undefined;
        tosAcceptedOnStripe?: boolean | undefined;
    } | undefined;
    invite?: {
        kind: "invitation" | "existing-login";
        sentAt: number;
        invitationId?: string | undefined;
    } | undefined;
    fulfilledAt?: number | undefined;
    convertedAt?: number | undefined;
}>;
export type OperatorOrder = z.infer<typeof zOperatorOrder>;
export type CloseStep = "order" | "terms" | "payment" | "setup" | "sms" | "done";
/**
 * Plans that register for A2P during the close. Starter and web-only send no customer-facing
 * messages, so they have no SMS step at all.
 */
export declare function closeHasSmsStep(plan: PortalPlan): boolean;
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
export declare function resumeStepFor(input: {
    order: OperatorOrder | null;
    a2pStatus: A2pStatus | null;
}): CloseStep;
export type ReadinessTone = "ok" | "wait" | "warn" | "bad" | "off";
export type ReadinessId = "payment" | "onboarding" | "sms-brand" | "sms-campaign";
export interface ReadinessLight {
    id: ReadinessId;
    label: string;
    value: string;
    tone: ReadinessTone;
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
export declare function readinessFor(input: {
    order: OperatorOrder | null;
    site: Pick<PortalSite, "status" | "onboardingCompletedAt"> | null;
    clientSignedIn: boolean;
    plan: PortalPlan;
    a2pStatus: A2pStatus | null;
    a2pNeedsEin?: boolean;
}): ReadinessLight[];
/** Narrowing helper for the receptionist field, shared by both validators. */
export declare function isReceptionistMode(value: unknown): value is ReceptionistMode;
//# sourceMappingURL=operator-order.d.ts.map