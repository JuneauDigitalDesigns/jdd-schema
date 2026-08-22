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

import type { VerticalId } from "./verticals.js";
import { INDUSTRY_MENUS, type MenuService } from "./industry-menu.js";
import { DEFAULT_STRUCTURE, type DefaultStructure } from "./structure.js";

export interface VerticalPromptDef {
  /** The copywriter's role + general writing rules for this vertical. */
  role: string;
  /**
   * Vertical-specific constraints beyond the general rules — e.g. the health vertical's "no
   * medical claims / no outcome promises" block. Empty string for verticals with none.
   */
  guardrails: string;
  /** Clichéd phrases the copywriter must never use, e.g. "top-notch", "one-stop shop". */
  forbidden: string[];
}

export interface VerticalDef {
  id: string;
  label: string;
  /**
   * Set only on a custom vertical (one not in VERTICAL_IDS). Names the built-in it was
   * cloned from, so the console can fall back to that vertical's preset SiteContent,
   * placeholder images, and suggested palettes for anything the clone didn't override.
   */
  baseVerticalId?: VerticalId;
  services: MenuService[];
  differentiators: string[];
  customers: string[];
  prompt: VerticalPromptDef;
  /** Section cardinalities this vertical's preset seeds. Falls back to DEFAULT_STRUCTURE. */
  structure: Partial<DefaultStructure>;
}

/**
 * Console `.state/verticals.json` shape — the per-machine layer over the six built-ins.
 * `overrides` edits an existing built-in (id must match a BUILT_IN_VERTICALS entry);
 * `customs` are new verticals the operator created, each carrying a `baseVerticalId`.
 */
export interface VerticalOverrides {
  overrides: Array<Partial<VerticalDef> & { id: string }>;
  customs: VerticalDef[];
}

const HOME_SERVICE_ROLE = `You are the JDD Brand Copywriter — a senior conversion copywriter for local home-service businesses.

Write real, specific, benefit-led marketing copy grounded in the business facts and the industry vertical you are given. Rules:
- Specific over vague; benefits over features; active voice; plain language a homeowner uses.
- Ground every claim in the provided facts. Never invent licenses, awards, prices, phone numbers, addresses, or named companies.
- Only include a business name, phone, email, address, or license/credential when it appears in the provided website notes or operator details — otherwise omit those fields entirely.
- Match the exact section counts you are asked for.
- Testimonials must read like real first-person homeowner quotes; use a first name + last initial and a plausible role, never a fabricated named company.
- SEO: title <= 60 chars (include the business name and city when known), description <= 155 chars.`;

const HEALTH_ROLE = `You are the JDD Brand Copywriter — a senior conversion copywriter for local health & wellness practices.

Write warm, reassuring, benefit-led marketing copy grounded in the business facts you are given. Rules:
- Patient/client-centered and welcoming; plain, calm language; active voice.
- Ground every claim in the provided facts. Never invent licenses, credentials, awards, prices, phone numbers, addresses, or named companies.
- Only include a business name, phone, email, address, or license/credential when it appears in the provided website notes or operator details — otherwise omit those fields entirely.
- Match the exact section counts you are asked for.
- Testimonials must read like real first-person client quotes about experience and feeling supported (never about medical outcomes); use a first name + last initial and a plausible role.
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

function promptFor(id: string): VerticalPromptDef {
  if (id === "health") {
    return { role: HEALTH_ROLE, guardrails: HEALTH_GUARDRAILS, forbidden: HEALTH_FORBIDDEN };
  }
  return { role: HOME_SERVICE_ROLE, guardrails: "", forbidden: HOME_SERVICE_FORBIDDEN };
}

/** The six shipped verticals, built from INDUSTRY_MENUS + the copywriter prompt data above. */
export const BUILT_IN_VERTICALS: VerticalDef[] = INDUSTRY_MENUS.map((menu) => ({
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
export function mergeVerticalOverrides(
  builtins: VerticalDef[],
  o: VerticalOverrides | null | undefined,
): VerticalDef[] {
  if (!o) return builtins;
  const overrideById = new Map(o.overrides.map((ov) => [ov.id, ov]));
  const merged = builtins.map((base) => {
    const ov = overrideById.get(base.id);
    return ov ? { ...base, ...ov } : base;
  });
  const builtinIds = new Set(builtins.map((b) => b.id));
  const customs = (o.customs ?? []).filter((c) => !builtinIds.has(c.id));
  return [...merged, ...customs];
}
