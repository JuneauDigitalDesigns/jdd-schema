/**
 * What the onboarding wizard OFFERS a client, per industry.
 *
 * The wizard used to be ~30 blank inputs. A service-business owner opening it had to invent
 * their own services, describe their own differentiators and articulate their own tone from
 * nothing — which is a writing assignment, not an onboarding form. This is the material that
 * lets them click instead: chips they recognise, with free text kept as an escape hatch
 * rather than the only route.
 *
 * ── Seeded from the console's VERTICAL_PRESETS, then widened ─────────────────
 *
 * Those six preset sites carry real, well-written services, and they are where these lists
 * started. But a preset shows exactly six services because that is what fits a demo page,
 * and an actual plumber offers more than six things. So each menu is curated beyond its
 * preset: the preset entries are the spine, the rest fill in what a real business in that
 * trade would also want listed.
 *
 * They deliberately are NOT generated from VERTICAL_PRESETS at build time. That would keep
 * them in sync at the cost of pinning every client to one demo page's idea of the trade,
 * and the whole point is to offer more than any single example site shows.
 *
 * ── This module holds no colours ────────────────────────────────────────────
 *
 * Palette recommendations live on the presets themselves (`verticals` on PRESET_DEFS, read
 * via `palettesForVertical`), NOT as a `paletteIds` array here. One relationship expressed
 * in two places is the drift pattern that has already produced real bugs in this codebase —
 * five copies of `toE164`, four of the Vercel host transform, each pair quietly disagreeing.
 * The relationship is "this palette suits these trades", so it lives with the palette.
 */
import type { VerticalId } from "./verticals.js";
/** One selectable service. `tag` doubles as the category shown on the built site. */
export interface MenuService {
    label: string;
    tag: string;
}
export interface IndustryMenu {
    id: VerticalId;
    label: string;
    /** Multi-select chips. The client ticks what they offer and can add their own. */
    services: MenuService[];
    /** "What sets you apart" chips — the highest-value copy input we collect. */
    differentiators: string[];
    /** "Who you serve" chips. */
    customers: string[];
}
/**
 * Tone options, shared across every industry.
 *
 * Not per-industry on purpose: how a business wants to sound is a choice about them, not
 * about their trade. A plumber can be warm or clinical, and offering "friendly" only to
 * health businesses would quietly make that decision for them.
 *
 * This one picker replaces the wizard's three overlapping questions — `vibe` chips, `tone`
 * chips and free-text `adjectives` — which all collapsed into the same paragraph of the
 * copywriter prompt anyway.
 */
export declare const VOICE_OPTIONS: string[];
/** Industry menus, keyed by the same ids the console uses as VerticalId. */
export declare const INDUSTRY_MENUS: IndustryMenu[];
/**
 * The menu for an industry, or `null` when there isn't one.
 *
 * `null` is the signal for the wizard's free-text fallback — a client who picks "Other" gets
 * the same steps with plain inputs instead of chips. Returning an empty menu instead would
 * render a step offering nothing, which reads as broken rather than as "describe it yourself".
 */
export declare function menuFor(industry: string | undefined | null): IndustryMenu | null;
/** An industry's own differentiators plus the ones that apply to any local trade. */
export declare function differentiatorsFor(industry: string | undefined | null): string[];
/** An industry's own customer types plus the common ones. */
export declare function customersFor(industry: string | undefined | null): string[];
/**
 * Join selected chips and any free text into one line.
 *
 * The wizard collects structure but `BrandDirection.differentiators` and `.targetCustomer`
 * are strings that flow into `brandDirectionToDetails` and on into the copywriter prompt.
 * Joining here rather than changing those fields means nothing downstream has to change —
 * the prompt, the mapper and the console all keep working untouched.
 */
export declare function joinChoices(selected: string[], freeText?: string): string;
//# sourceMappingURL=industry-menu.d.ts.map