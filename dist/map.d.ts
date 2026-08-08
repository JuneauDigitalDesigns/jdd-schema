/**
 * Onboarding-form → Intake mapping. Extracted verbatim (v1.0.0) from the agency
 * site's app/lib/site-schema.ts so both repos share one mapper.
 *
 * Fields the form didn't provide are set to null (or sensible defaults for
 * non-nullable strings) and tracked in _meta.missing_fields per the JDD plan:
 * "never invent values for flagged fields — leave placeholders for human review."
 */
import type { SiteContent } from "./site.js";
import type { OnboardingSubmission } from "./submission.js";
import type { Intake } from "./intake.js";
/**
 * Convert the sanitized onboarding form submission into the canonical
 * SiteContent shape consumed by each client repo's src/data/site.ts.
 */
export declare function mapPayloadToSchema(p: OnboardingSubmission): SiteContent;
/**
 * Convert a submission to an Intake envelope. Single-site for starter/growth;
 * N-site for enterprise.
 */
export declare function mapPayloadToIntake(p: OnboardingSubmission): Intake;
//# sourceMappingURL=map.d.ts.map