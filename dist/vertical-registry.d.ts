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
import { type MenuService } from "./industry-menu.js";
import { type DefaultStructure } from "./structure.js";
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
    overrides: Array<Partial<VerticalDef> & {
        id: string;
    }>;
    customs: VerticalDef[];
}
/** The six shipped verticals, built from INDUSTRY_MENUS + the copywriter prompt data above. */
export declare const BUILT_IN_VERTICALS: VerticalDef[];
/**
 * Layer console-side overrides and custom verticals over the built-ins.
 *
 * An override entry replaces only the keys it carries (shallow per top-level VerticalDef
 * field — e.g. `{ id: "hvac", prompt: {...} }` replaces the whole `prompt` object, it does
 * not merge role/guardrails/forbidden individually). Customs are appended after the
 * (possibly overridden) built-ins; a custom id colliding with a built-in id is dropped,
 * since resolveVerticals() callers key lookups by id.
 */
export declare function mergeVerticalOverrides(builtins: VerticalDef[], o: VerticalOverrides | null | undefined): VerticalDef[];
//# sourceMappingURL=vertical-registry.d.ts.map