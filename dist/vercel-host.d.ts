/**
 * Project name and hostname derivation for Vercel.
 *
 * Pure string logic, shared rather than copied — because copying it is what caused the bug
 * this module exists to prevent. The underscore transform lived inline in four places
 * (onboard.js twice, resolveVercelHost, and the console's runbook content), three of them
 * agreed on a rule that was wrong, and the fourth had drifted further still by skipping
 * sanitization entirely. Nothing detected the disagreement because nothing compared them.
 *
 * `lib/vercel-sync.js` re-exports both so its callers keep their existing import surface.
 */
/**
 * Vercel project names are lowercase and may contain only `a–z`, `0–9`, `.`, `_`, `-`;
 * they cannot start with `.`, `_` or `-`, cannot contain three or more consecutive hyphens,
 * and are capped at 100 characters.
 *
 * Client slugs — especially fixtures like `_e2e-growth` — violate these, so a safe project
 * name is derived while the original slug (and therefore the GitHub repo name and the
 * `clients/{slug}` folder) is left untouched.
 */
export declare function sanitizeProjectName(slug: string): string;
/**
 * The `.vercel.app` hostname a project is served on.
 *
 * A DNS label may contain only `a-z`, `0-9` and `-`, so Vercel **removes** every other
 * character from the project name when building the alias. It does NOT substitute hyphens.
 * Verified against the live account:
 *
 *   e2e_test_growth        → e2etestgrowth.vercel.app            (underscores dropped)
 *   juneau-digital-designs → juneau-digital-designs.vercel.app   (hyphens preserved)
 *   jdd-kanban             → jdd-kanban.vercel.app
 *
 * The previous rule, `sanitizeProjectName(slug).replace(/_/g, "-")`, yields
 * `e2e-test-growth` — a host that does not exist. onboard.js used it to set each new
 * number's Twilio voiceUrl, so any client slug containing an underscore had its inbound
 * calls pointed at nothing, failing with no error surfacing on our side at all.
 *
 * BEST EFFORT. Vercel appends a hash when a generated alias would collide or exceed the
 * label length limit, so a derived host can still be wrong. Any caller that *can* ask the
 * API should prefer `listProjectDomains`; this covers the window before the project exists,
 * which is exactly when onboard.js buys the number.
 */
export declare function vercelAppHost(slug: string): string;
/** The full voice webhook URL for a site, given its slug. */
export declare function vercelVoiceUrl(slug: string): string;
//# sourceMappingURL=vercel-host.d.ts.map