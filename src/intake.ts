/**
 * The intake envelope + the KV queue record that carries it between the agency
 * site (producer) and the jdd-ops console (consumer).
 */

import type { SiteContent } from "./site.js";

/** Mapper output: siteCount is always populated. */
export interface Intake {
  plan: "starter" | "growth" | "enterprise";
  siteCount: number;
  sites: SiteContent[];
}

/** Loader input (console export.ts): siteCount may be inferred from sites.length. */
export interface IntakeEnvelope {
  plan: "starter" | "growth" | "enterprise";
  siteCount?: number;
  sites: SiteContent[];
}

/**
 * One record on the `jdd:intake:*` KV queue. Produced by
 * juneau-digital-designs/app/lib/intake-queue.ts, consumed by
 * jdd-ops/console/src/lib/intakeQueue.ts.
 */
export interface QueuedIntake {
  id: string;
  receivedAt: number; // epoch ms — doubles as the sorted-set score
  status: "pending" | "imported";
  plan: string;
  brandName: string;
  slugGuess: string;
  sessionId: string;
  intake: IntakeEnvelope; // the full Intake envelope { plan, siteCount, sites }
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
