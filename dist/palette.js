/**
 * Palette derivation + presets. The onboarding wizard no longer asks clients to
 * type 7 raw hex values. Instead they pick a named preset OR an accent + a
 * background mood, and the remaining slots are DERIVED here — deterministically,
 * so the console can re-derive an identical palette from the same pick.
 *
 * Derivation runs in OKLCH (see ./color.ts). The supporting slots take their hue
 * from the accent, so changing the accent visibly re-tints the whole palette
 * rather than just recoloring buttons. Clients who want exact control can pin
 * individual slots via `PalettePick.overrides`, which are applied last.
 */
import { contrast, hexToOklch, isDark, lerp, nudgeToContrast, oklchToHex, } from "./color.js";
const WHITE = "#FFFFFF";
const DEFAULT_INK = "#0F172A";
const DEFAULT_ACCENT = "#1E6FBF";
export const BACKGROUND_MOODS = [
    { id: "white", label: "Clean white", l: 1.0, c: 0.0, hue: 0, dark: false },
    { id: "warm", label: "Warm paper", l: 0.985, c: 0.012, hue: 75, dark: false },
    { id: "cool", label: "Cool tint", l: 0.98, c: 0.01, hue: 250, dark: false },
    { id: "soft-dark", label: "Soft dark", l: 0.26, c: 0.02, hue: "accent", dark: true },
    { id: "deep-dark", label: "Deep dark", l: 0.17, c: 0.028, hue: "accent", dark: true },
];
function moodSpec(mood) {
    return BACKGROUND_MOODS.find((m) => m.id === mood) ?? BACKGROUND_MOODS[0];
}
// ─── derivation ──────────────────────────────────────────────────────────────
/**
 * Best-contrasting foreground for `bg` from a candidate list, nudged into AA range
 * if none of the candidates get there on their own.
 */
function pickForeground(bg, candidates) {
    let best = candidates[0];
    let bestRatio = 0;
    for (const c of candidates) {
        if (!c)
            continue;
        const ratio = contrast(c, bg);
        if (ratio > bestRatio) {
            bestRatio = ratio;
            best = c;
        }
    }
    return bestRatio >= 4.5 ? best : nudgeToContrast(best, bg, 4.5);
}
/**
 * Derive a full BrandPalette from an accent, an ink anchor, and a background mood.
 *
 * `bgSoft` and `rule` are given the accent's hue at a low but *explicit* chroma —
 * the previous implementation mixed 5% accent into white, which was perceptually
 * invisible and made every palette read as the same white-and-gray site.
 *
 * On dark moods the supplied `ink` is ignored: a client-picked dark ink on a dark
 * background is unreadable, so ink is derived as a near-white tinted with the
 * accent hue. It remains pinnable through `overrides.ink`.
 */
export function derivePalette(accent, ink = DEFAULT_INK, bgMood = "white") {
    const accentHex = accent && accent.trim() ? accent.trim() : DEFAULT_ACCENT;
    const mood = moodSpec(bgMood);
    const A = hexToOklch(accentHex);
    const bg = oklchToHex({
        l: mood.l,
        c: mood.c,
        h: mood.hue === "accent" ? A.h : mood.hue,
    });
    const inkHex = mood.dark
        ? oklchToHex({ l: 0.95, c: 0.01, h: A.h })
        : ink && ink.trim()
            ? ink.trim()
            : DEFAULT_INK;
    const K = hexToOklch(inkHex);
    const BG = hexToOklch(bg);
    const inkSoft = oklchToHex({
        l: lerp(K.l, BG.l, 0.38),
        c: K.c * 0.85,
        h: K.h,
    });
    const rule = oklchToHex({
        l: lerp(K.l, BG.l, 0.86),
        c: 0.018,
        h: A.h,
    });
    const bgSoft = oklchToHex({
        l: lerp(BG.l, K.l, 0.045),
        c: 0.02,
        h: A.h,
    });
    // Set explicitly rather than left undefined — the wizard preview and the
    // deployed site used to resolve this independently and could disagree.
    //
    // `bg` is in the running because on dark palettes both white and ink are light,
    // and a light accent (e.g. a pale blue) would leave a button with no legible
    // label at all. If nothing clears AA outright, nudge the best candidate.
    const accentFg = pickForeground(accentHex, [WHITE, inkHex, bg]);
    return { accent: accentHex, accentFg, bg, bgSoft, ink: inkHex, inkSoft, rule };
}
const CONTRAST_RULES = [
    { slot: "ink", against: "bg", required: 4.5, label: "Body text on background" },
    { slot: "inkSoft", against: "bg", required: 4.5, label: "Muted text on background" },
    { slot: "accentFg", against: "accent", required: 4.5, label: "Button label on accent" },
    { slot: "accent", against: "bg", required: 3.0, label: "Accent on background" },
];
/**
 * Report every pairing that falls below WCAG AA, with a same-hue fix for each.
 * Advisory only — the wizard warns but never blocks, and never silently rewrites
 * a client's chosen hex.
 */
export function auditPalette(p) {
    const issues = [];
    for (const rule of CONTRAST_RULES) {
        const fg = p[rule.slot];
        const bg = p[rule.against];
        if (!fg || !bg)
            continue;
        const ratio = contrast(fg, bg);
        if (ratio >= rule.required)
            continue;
        issues.push({
            slot: rule.slot,
            against: rule.against,
            ratio: Math.round(ratio * 100) / 100,
            required: rule.required,
            suggestion: nudgeToContrast(fg, bg, rule.required),
            label: rule.label,
        });
    }
    return issues;
}
/** True when the palette's background is dark, so consumers can flip assumptions. */
export function isDarkPalette(p) {
    return isDark(p.bg);
}
/**
 * Preset definitions. Each palette is derived from its own `source` below rather
 * than written out separately, so the two can never drift apart.
 */
/**
 * `verticals` is which trades a palette SUITS, and it lives here rather than as a list of
 * palette ids on each industry menu. The relationship is "this colourway fits these trades",
 * so it belongs with the colourway — and expressing one relationship in two places is the
 * drift pattern that has already caused real bugs in this codebase (five copies of `toE164`,
 * four of the Vercel host transform, each pair quietly disagreeing).
 *
 * A tag decides only what is shown FIRST. Every palette stays selectable for every industry
 * behind "see all", so this narrows the opening choice without taking one away.
 */
const PRESET_DEFS = [
    // Warm and high-energy — reads as urgency and physical trade work.
    { id: "slate-amber", label: "Slate & Amber", source: { accent: "#D97706", ink: "#0F172A", bgMood: "white" }, verticals: ["hvac", "roofing", "lawn-care"] },
    // The default for a reason: trustworthy and unobjectionable in any trade.
    { id: "ocean-blue", label: "Ocean Blue", source: { accent: "#1E6FBF", ink: "#0F1B2D", bgMood: "white" }, verticals: ["plumbing", "hvac", "health", "roofing"] },
    { id: "forest", label: "Forest", source: { accent: "#15803D", ink: "#14261B", bgMood: "white" }, verticals: ["lawn-care", "health"] },
    { id: "warm-sand", label: "Warm Sand", source: { accent: "#B45309", ink: "#2A2118", bgMood: "warm" }, verticals: ["roofing", "lawn-care"] },
    { id: "classic-navy", label: "Classic Navy", source: { accent: "#1E3A8A", ink: "#111827", bgMood: "white" }, verticals: ["plumbing", "roofing", "car-detailing"] },
    // Emergency red — right for the trades people call in a crisis.
    { id: "crimson", label: "Crimson", source: { accent: "#B91C1C", ink: "#1F1315", bgMood: "white" }, verticals: ["plumbing", "hvac"] },
    { id: "teal", label: "Teal", source: { accent: "#0F766E", ink: "#0B2422", bgMood: "cool" }, verticals: ["health", "car-detailing"] },
    { id: "graphite", label: "Graphite", source: { accent: "#4B5563", ink: "#111827", bgMood: "white" }, verticals: ["car-detailing"] },
    // Dark themes flatter strong imagery and punish thin content, so they go to the trades
    // that reliably have photography rather than to everyone.
    { id: "midnight", label: "Midnight", source: { accent: "#60A5FA", bgMood: "deep-dark" }, verticals: ["car-detailing", "health"] },
    { id: "carbon", label: "Carbon", source: { accent: "#F59E0B", bgMood: "soft-dark" }, verticals: ["car-detailing"] },
];
export const PALETTE_PRESETS = PRESET_DEFS.map(({ id, label, source, verticals }) => ({
    id,
    label,
    source,
    verticals,
    palette: derivePalette(source.accent, source.ink, source.bgMood),
}));
/**
 * Palettes worth showing first for a trade, or all of them when we have no opinion.
 *
 * Falls back to the full set for an unknown or "other" industry rather than returning
 * nothing — a colour step that renders zero options reads as broken, and a client who
 * doesn't fit our six trades still needs to pick a colour.
 */
export function palettesForVertical(vertical) {
    if (!vertical)
        return PALETTE_PRESETS;
    const matched = PALETTE_PRESETS.filter((p) => p.verticals?.includes(vertical));
    return matched.length ? matched : PALETTE_PRESETS;
}
export const DEFAULT_PALETTE_PRESET_ID = "ocean-blue";
export function presetById(id) {
    return PALETTE_PRESETS.find((p) => p.id === id);
}
/**
 * Convert a preset into an editable custom pick, remembering which preset it came
 * from. `resolvePalette(presetToPick(id))` is byte-identical to that preset's
 * palette, so opening the wizard's adjust screen never shifts a client's colors
 * before they've touched anything.
 *
 * `presetId` is carried through custom mode purely as provenance — resolvePalette
 * ignores it once mode is "custom".
 */
export function presetToPick(id) {
    const preset = presetById(id) ?? presetById(DEFAULT_PALETTE_PRESET_ID);
    if (!preset)
        return { mode: "custom", accentColor: DEFAULT_ACCENT, bgMood: "white" };
    return {
        mode: "custom",
        presetId: preset.id,
        accentColor: preset.source.accent,
        baseColor: preset.source.ink,
        bgMood: preset.source.bgMood,
    };
}
const PALETTE_SLOTS = [
    "accent",
    "accentFg",
    "bg",
    "bgSoft",
    "ink",
    "inkSoft",
    "rule",
];
/** Apply the client's manual pins over a derived palette. */
function applyOverrides(base, overrides) {
    if (!overrides)
        return base;
    const out = { ...base };
    for (const slot of PALETTE_SLOTS) {
        const v = overrides[slot];
        if (typeof v === "string" && v.trim())
            out[slot] = v.trim();
    }
    return out;
}
/**
 * Resolve a client's PalettePick into a concrete BrandPalette. Falls back to the
 * default preset if the pick is empty or references an unknown preset. Overrides
 * apply to preset picks too, so a client can start from a preset and pin one slot.
 */
export function resolvePalette(pick) {
    if (pick && pick.mode === "custom") {
        return applyOverrides(derivePalette(pick.accentColor ?? DEFAULT_ACCENT, pick.baseColor ?? DEFAULT_INK, pick.bgMood ?? "white"), pick.overrides);
    }
    const preset = presetById(pick?.presetId) ?? presetById(DEFAULT_PALETTE_PRESET_ID);
    const base = preset ? preset.palette : derivePalette(DEFAULT_ACCENT);
    return applyOverrides(base, pick?.overrides);
}
//# sourceMappingURL=palette.js.map