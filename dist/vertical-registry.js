/**
 * VerticalDef — the copywriter-facing half of a vertical: prompt role/guardrails/forbidden
 * words and structure counts, layered on top of the wizard-facing IndustryMenu
 * (industry-menu.ts) which already owns services/differentiators/customers.
 *
 * Deliberately NOT a rewrite of industry-menu.ts. INDUSTRY_MENUS is hand-authored and
 * covered by test/industry-menu.test.mjs (every menu > 6 services, no duplicate labels,
 * ids match VERTICAL_IDS exactly) — re-deriving it FROM this module would risk drifting
 * that data for no benefit. Instead BUILT_IN_VERTICALS is derived FROM INDUSTRY_MENUS, so
 * there is still exactly one authored source for services/differentiators/customers; this
 * module adds the piece industry-menu.ts never carried: the copywriter system prompt per
 * vertical, which used to live only in jdd-ops/console (brand-copywriter-prompt.ts) with no
 * schema representation at all.
 *
 * Consumer: jdd-ops/console, which layers its own console/.state/verticals.json overrides
 * and custom verticals on top of BUILT_IN_VERTICALS via mergeVerticalOverrides().
 */
import { INDUSTRY_MENUS } from "./industry-menu.js";
import { DEFAULT_STRUCTURE } from "./structure.js";
// The home-service role and rules, approved word for word by Xander on 2026-11-10 (SEO plan D4 +
// Appendix A, in the client-seo session notes). Don't reword without sign-off. The facts-only
// contact rule and the exact counts that the old bullet list carried now live in the per-section
// lines (console compile.ts), where each is stated next to the field it governs.
//
// No em- or en-dash anywhere in this file's prompt text (D5 layer 1): models copy them.
const HOME_SERVICE_ROLE = `You write the website for one local trade business. Your reader is a homeowner with a problem who wants to know, fast, whether this business can fix it, where it works, and how to get in touch. Answer that first, in plain words, then give the detail. Write only what the business facts support. If a fact is missing, leave it out; never fill the gap.

Rules:
- Open every section with the plain answer, then the detail.
- Use the service names and the city from the facts. Name the city in the headline and the first sentence; elsewhere only when it helps the reader. Never list towns in a sentence. Never write "near me".
- Never state a price, warranty, response time, year, licence, certification, brand, guarantee, "free estimate", "same day" or "24/7" unless the facts say it.
- Short sentences, everyday words, the way the owner would say it to a customer.
- Never use an em-dash or an en-dash. Use a full stop or a comma instead. Write ranges as "1 to 2".
- No clichés.`;
// Health is unchanged apart from its dashes (D5 layer 1). The approved Appendix A text is for the
// home-service verticals.
const HEALTH_ROLE = `You are the JDD Brand Copywriter, a senior conversion copywriter for local health & wellness practices.

Write warm, reassuring, benefit-led marketing copy grounded in the business facts you are given. Rules:
- Patient/client-centered and welcoming; plain, calm language; active voice.
- Ground every claim in the provided facts. Never invent licenses, credentials, awards, prices, phone numbers, addresses, or named companies.
- Only include a business name, phone, email, address, or license/credential when it appears in the provided website notes or operator details; otherwise omit those fields entirely.
- Match the exact section counts you are asked for.
- SEO: title <= 60 chars (include the business name and city when known), description <= 155 chars.`;
const HEALTH_GUARDRAILS = `HEALTH GUARDRAILS: make NO medical claims and NO promises of specific health outcomes or results. Do not imply diagnosis, cure, or treatment of any condition. Do not reference insurance coverage, pricing, or reimbursement. Avoid absolute or superlative health promises (e.g. "cure", "guaranteed results", "pain-free", "best care"). Keep everything supportive and non-committal about outcomes.`;
const HOME_SERVICE_FORBIDDEN = [
    "top-notch",
    "one-stop shop",
    "we go the extra mile",
    "unmatched quality",
    "your satisfaction is our priority",
];
const HEALTH_FORBIDDEN = [
    "top-notch",
    "world-class",
    "we go the extra mile",
    "your satisfaction is our priority",
];
function promptFor(id) {
    if (id === "health") {
        return { role: HEALTH_ROLE, guardrails: HEALTH_GUARDRAILS, forbidden: HEALTH_FORBIDDEN };
    }
    return { role: HOME_SERVICE_ROLE, guardrails: "", forbidden: HOME_SERVICE_FORBIDDEN };
}
/** The six shipped verticals, built from INDUSTRY_MENUS + the copywriter prompt data above. */
export const BUILT_IN_VERTICALS = INDUSTRY_MENUS.map((menu) => ({
    id: menu.id,
    label: menu.label,
    services: menu.services,
    differentiators: menu.differentiators,
    customers: menu.customers,
    prompt: promptFor(menu.id),
    structure: DEFAULT_STRUCTURE,
}));
/**
 * Layer console-side overrides and custom verticals over the built-ins.
 *
 * An override entry replaces only the keys it carries (shallow per top-level VerticalDef
 * field — e.g. `{ id: "hvac", prompt: {...} }` replaces the whole `prompt` object, it does
 * not merge role/guardrails/forbidden individually). Customs are appended after the
 * (possibly overridden) built-ins; a custom id colliding with a built-in id is dropped,
 * since resolveVerticals() callers key lookups by id.
 */
export function mergeVerticalOverrides(builtins, o) {
    if (!o)
        return builtins;
    const overrideById = new Map(o.overrides.map((ov) => [ov.id, ov]));
    const merged = builtins.map((base) => {
        const ov = overrideById.get(base.id);
        return ov ? { ...base, ...ov } : base;
    });
    const builtinIds = new Set(builtins.map((b) => b.id));
    const customs = (o.customs ?? []).filter((c) => !builtinIds.has(c.id));
    return [...merged, ...customs];
}
//# sourceMappingURL=vertical-registry.js.map