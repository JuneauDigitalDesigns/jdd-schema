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
    plan: "website" | "starter" | "growth" | "enterprise";
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
     *
     * On `plan: "website"` the plan states it: absent or `declined`, never anything else. On the
     * other plans a new intake never says `declined` (that is the legacy web-only shape; sell the
     * website plan instead). `zIntake` enforces both.
     */
    receptionistMode?: ReceptionistMode;
    siteCount: number;
    sites: SiteContent[];
    smsAlerts?: SmsAlerts | null;
}
/**
 * The lead-capture mode a plan's website forms use, and the ONLY place the mapping lives.
 *
 * `email`  — website and starter: the form collects an email, and /api/contact records the
 *            lead in the client's portal inbox (LEAD_DELIVERY_MODE=portal, LEAD_CALLBACK=off).
 *            No call is placed. "email" names the field the form collects, not the delivery:
 *            leads stopped going out by email when the portal inbox shipped.
 * `phone`  — growth / enterprise: the form collects a phone, the lead lands in the portal
 *            the same way, and the agent also dials the lead back (LEAD_CALLBACK=on).
 *
 * Callbacks are an explicit Growth/Enterprise list, never "not starter": a plan this version
 * does not know, `website` included before v1.45.0, must never get a phone-mode form with a
 * consent box for an AI call that will never come.
 *
 * Imported by the catalog form components, console/test/lead-mode-invariants.test.mjs, and
 * onboard.js's plan-consistency guard, so the mapping is impossible to drift between them.
 * This is the client-FORM mode; the server route keys off the env onboard.js derives from the
 * same plan.
 */
export declare function leadModeFor(plan: "website" | "starter" | "growth" | "enterprise"): "email" | "phone";
/**
 * Why this plan and receptionist mode may not go together, or null when they may.
 *
 * One rule for every reader, so the onboarding POST, the console import and onboard.js refuse
 * the same pairs with the same words:
 *  - `website`: the plan decides the receptionist, so the mode is absent or `declined`.
 *  - `starter`, `growth`, `enterprise`: a new submission never says `declined`. Web-only is
 *    sold as the website plan now, at its own price.
 *
 * `legacy: true` is for reading stored records only (the intake queue). It also accepts
 * `starter` + `declined`, the web-only shape from before `website` existed, so a record
 * written then still reads. Never pass it on a path that accepts a new submission.
 */
export declare function receptionistModeProblem(plan: string, mode: ReceptionistMode | undefined | null, opts?: {
    legacy?: boolean;
}): string | null;
/** Loader input (console export.ts): siteCount may be inferred from sites.length. */
export interface IntakeEnvelope {
    plan: "website" | "starter" | "growth" | "enterprise";
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