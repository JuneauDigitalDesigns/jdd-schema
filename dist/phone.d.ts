/**
 * Phone normalization and comparison.
 *
 * Shared for the same reason `vercel-host.ts` is: it was copied five times, and the copies
 * had already diverged. Four agreed on `/^\+\d{8,15}$/`; a fifth, written later, used
 * `/^\+[1-9]\d{7,14}$/` — a different length bound and a different view of whether a
 * leading zero is acceptable. Nothing compared them, so nothing noticed, which is precisely
 * how the voiceUrl transform ended up wrong in three places at once.
 *
 * ── One copy that deliberately stays a copy ─────────────────────────────────
 *
 * `jdd-ops/lib/site-routes/*.ts` keep their own inline `toE164`. Those files are written
 * verbatim into each CLIENT repo by onboard.js, and a client repo has no dependency on
 * @jdd/schema — importing from here would break every generated site at build time. They
 * are standalone on purpose; this note exists so the next person to find them doesn't
 * "helpfully" consolidate them too.
 */
/**
 * E.164, or null when the input isn't a number we can dial.
 *
 * Returns null rather than a best guess. A phone number that is nearly right is not
 * useful — it is a call that fails — so callers are made to handle the ambiguity instead of
 * writing something unusable into Twilio.
 */
export declare function toE164(raw: string | null | undefined): string | null;
/**
 * Do two numbers refer to the same line?
 *
 * Compares on normalized digits so `(207) 555-0199`, `207-555-0199` and `+12075550199` are
 * one number, not three. Formatting differences are not drift, and reporting them as such
 * would put a permanent false warning next to every client whose portal profile happens to
 * be punctuated differently from their `.env.local`.
 *
 * Two unparseable values are NOT equal, even if their raw strings match: if we cannot tell
 * what either one dials, we cannot claim they agree.
 */
export declare function samePhone(a: string | null | undefined, b: string | null | undefined): boolean;
/**
 * A phone number as a website prints it: `(407) 555-0177` for a North American number, the
 * input trimmed otherwise. v1.33.3.
 *
 * The agency's onboarding form stores what the client typed, usually bare digits, and the
 * templates print `brand.phone` as is: Tracewell's test site read "4075550177" in the nav, the
 * hero, Contact and the footer (E2E-ONBOARDING-TEST-2026-11-10, F-D6). buildScaffold now writes
 * this form, and jdd-ops applies the same function to content it already holds.
 *
 * Presentation only: what counts as a dialable number is still `toE164`'s call alone, so this adds
 * no second opinion. A number it can't read is returned as typed, never guessed at. This replaces
 * onboard.js's private `formatPhoneForDisplay`, which did the same for the Twilio number.
 */
export declare function formatPhoneDisplay(raw: string | null | undefined): string;
/**
 * The `tel:` link for a number: E.164 when `toE164` can read it (`tel:+14075550177`), else the
 * digits as typed, else "" (no number, so no dead link). v1.33.3: it was `tel:4075550177`, which
 * most phones dial but which isn't E.164.
 */
export declare function phoneHref(raw: string | null | undefined): string;
//# sourceMappingURL=phone.d.ts.map