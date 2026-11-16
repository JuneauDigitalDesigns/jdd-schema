/**
 * The intake envelope + the KV queue record that carries it between the agency
 * site (producer) and the jdd-ops console (consumer).
 */
import type { SiteContent } from "./site.js";
import type { ReceptionistMode } from "./account.js";
/**
 * The owner's opt-in to post-call summary texts, as it stood when onboarding was
 * submitted. Consumed by jdd-ops/onboard.js to decide whether to wire the Twilio module in
 * the cloned Make.com post-call scenario, and which number to point it at.
 *
 * Envelope-level, deliberately NOT on SiteContent._meta. Every field of SiteContent is
 * serialized into the generated client repo's src/data/site.ts, which lives on public
 * GitHub — putting an owner's personal mobile number there would publish it. The envelope
 * never leaves the intake queue.
 *
 * `consented: false` means no alerts: either they declined, or they opted out since. It is
 * a snapshot, not the authority; lib/sms-consent.ts in the agency site holds that.
 */
export interface SmsAlerts {
    consented: boolean;
    /** E.164, or null when not consented. */
    phone: string | null;
    /** ISO UTC of the consent this snapshot reflects, or null. */
    consentedAt: string | null;
}
/** Mapper output: siteCount is always populated. */
export interface Intake {
    plan: "starter" | "growth" | "enterprise";
    /**
     * Whether this client's receptionist is active, and how the business line reaches it.
     *
     * Stated, never inferred. The wrong inference spends money: assuming a receptionist buys a
     * Twilio number and stands up a Retell agent for a client who refused one, and assuming the
     * opposite silently delivers a website to a client who paid for a receptionist.
     *
     * Envelope-level rather than per-site, matching `smsAlerts`: it is a decision about the
     * client's phone line. An Enterprise client who wants a receptionist on some sites but not
     * others is a conversation, not a code path.
     *
     * Absent on intakes that predate the activation step. Provisioning refuses to guess.
     */
    receptionistMode?: ReceptionistMode;
    siteCount: number;
    sites: SiteContent[];
    smsAlerts?: SmsAlerts | null;
}
/**
 * The lead-capture mode a plan's website forms use, and the ONLY place the mapping lives.
 *
 * `email`  — starter (and web-only starter): the form collects an email and /api/contact
 *            Resends the owner a lead email (LEAD_DELIVERY_MODE=email).
 * `phone`  — growth / enterprise: the form collects a phone and /api/contact calls Retell
 *            create-phone-call so the agent dials the lead back (LEAD_DELIVERY_MODE=callback).
 *
 * Imported by the catalog form components, console/test/lead-mode-invariants.test.mjs, and
 * onboard.js's plan-consistency guard, so the mapping is impossible to drift between them.
 * This is the client-FORM mode; the server route keys off LEAD_DELIVERY_MODE, which onboard.js
 * derives from the same plan — see onboard.js:1358.
 */
export declare function leadModeFor(plan: "starter" | "growth" | "enterprise"): "email" | "phone";
/** Loader input (console export.ts): siteCount may be inferred from sites.length. */
export interface IntakeEnvelope {
    plan: "starter" | "growth" | "enterprise";
    receptionistMode?: ReceptionistMode;
    siteCount?: number;
    sites: SiteContent[];
    smsAlerts?: SmsAlerts | null;
}
/**
 * One record on the `jdd:intake:*` KV queue. Produced by
 * juneau-digital-designs/app/lib/intake-queue.ts, consumed by
 * jdd-ops/console/src/lib/intakeQueue.ts.
 */
export interface QueuedIntake {
    id: string;
    receivedAt: number;
    status: "pending" | "imported";
    plan: string;
    brandName: string;
    slugGuess: string;
    sessionId: string;
    intake: IntakeEnvelope;
    /**
     * The `jdd:order:{id}` operator order this signup's site came from: set when the client was
     * closed on a sales call (the console's close wizard). Copied from `PortalSite.orderId` when
     * the intake is queued, because the console sees the intake, not the account it belongs to.
     */
    orderId?: string;
    /**
     * The `jdd:purchase:{id}` intent this signup's site came from: set when the client bought on
     * the agency site themselves (self-serve). Copied from `PortalSite.purchaseId`.
     */
    purchaseId?: string;
}
/** How a signup reached JDD. Null for intakes queued before either id was stamped. */
export type IntakeOrigin = "operator-call" | "self-serve";
/**
 * Which path a queued signup came through, from the ids stamped at queue time.
 *
 * An order id always wins: an operator-closed site is the one path that writes one. A purchase
 * id alone is self-serve. Neither (an intake queued before 2026-11-16, or a pre-cutover site)
 * returns null, and the reader decides how to fall back; it never guesses "self-serve".
 */
export declare function intakeOrigin(rec: {
    orderId?: string | null;
    purchaseId?: string | null;
}): IntakeOrigin | null;
/** Compact summary for the console's Step 1 grid (no heavy `intake` payload). */
export interface IntakeSummary {
    id: string;
    brandName: string;
    plan: string;
    slugGuess: string;
    receivedAt: number;
    missingFieldsCount: number;
}
//# sourceMappingURL=intake.d.ts.map