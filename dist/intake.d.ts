/**
 * The intake envelope + the KV queue record that carries it between the agency
 * site (producer) and the jdd-ops console (consumer).
 */
import type { SiteContent } from "./site.js";
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
    siteCount: number;
    sites: SiteContent[];
    smsAlerts?: SmsAlerts | null;
}
/** Loader input (console export.ts): siteCount may be inferred from sites.length. */
export interface IntakeEnvelope {
    plan: "starter" | "growth" | "enterprise";
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
}
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