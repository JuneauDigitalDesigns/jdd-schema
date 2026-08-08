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
import type { BrandPalette } from "./site.js";
/** Background character. Determines lightness/chroma of `bg`, and whether the palette is dark. */
export type BackgroundMood = "white" | "warm" | "cool" | "soft-dark" | "deep-dark";
/** How the client chose their palette. */
export interface PalettePick {
    mode: "preset" | "custom";
    /** Preset id (when mode === "preset"). */
    presetId?: string;
    /** Dark ink/text anchor (when mode === "custom"). Ignored for dark moods. */
    baseColor?: string;
    /** Accent / brand color (when mode === "custom"). */
    accentColor?: string;
    /** Background character. Absent means "white" — keeps pre-1.2 picks resolving unchanged. */
    bgMood?: BackgroundMood;
    /** Per-slot manual pins from the wizard's advanced panel. Applied after derivation. */
    overrides?: Partial<BrandPalette>;
}
interface MoodSpec {
    id: BackgroundMood;
    label: string;
    /** OKLCH lightness of the background. */
    l: number;
    /** OKLCH chroma of the background. */
    c: number;
    /** Fixed hue in degrees, or "accent" to inherit the accent's hue. */
    hue: number | "accent";
    dark: boolean;
}
export declare const BACKGROUND_MOODS: MoodSpec[];
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
export declare function derivePalette(accent: string, ink?: string, bgMood?: BackgroundMood): BrandPalette;
export interface ContrastIssue {
    /** The slot the client should change. */
    slot: keyof BrandPalette;
    /** The slot it was measured against. */
    against: keyof BrandPalette;
    ratio: number;
    required: number;
    /** A same-hue replacement for `slot` that meets `required`. */
    suggestion: string;
    label: string;
}
/**
 * Report every pairing that falls below WCAG AA, with a same-hue fix for each.
 * Advisory only — the wizard warns but never blocks, and never silently rewrites
 * a client's chosen hex.
 */
export declare function auditPalette(p: BrandPalette): ContrastIssue[];
/** True when the palette's background is dark, so consumers can flip assumptions. */
export declare function isDarkPalette(p: BrandPalette): boolean;
/** The inputs a preset was derived from. */
export interface PaletteSource {
    accent: string;
    /** Omitted on dark moods, where ink is derived rather than chosen. */
    ink?: string;
    bgMood: BackgroundMood;
}
export interface PalettePreset {
    id: string;
    label: string;
    palette: BrandPalette;
    /**
     * The inputs that produced `palette`. The wizard seeds custom mode from these
     * when a client opts to adjust a preset — seeding from the resolved colors
     * instead would pin the accent without re-deriving bgSoft/rule.
     */
    source: PaletteSource;
}
export declare const PALETTE_PRESETS: PalettePreset[];
export declare const DEFAULT_PALETTE_PRESET_ID = "ocean-blue";
export declare function presetById(id: string | undefined): PalettePreset | undefined;
/**
 * Convert a preset into an editable custom pick, remembering which preset it came
 * from. `resolvePalette(presetToPick(id))` is byte-identical to that preset's
 * palette, so opening the wizard's adjust screen never shifts a client's colors
 * before they've touched anything.
 *
 * `presetId` is carried through custom mode purely as provenance — resolvePalette
 * ignores it once mode is "custom".
 */
export declare function presetToPick(id: string | undefined): PalettePick;
/**
 * Resolve a client's PalettePick into a concrete BrandPalette. Falls back to the
 * default preset if the pick is empty or references an unknown preset. Overrides
 * apply to preset picks too, so a client can start from a preset and pin one slot.
 */
export declare function resolvePalette(pick: PalettePick | undefined): BrandPalette;
export {};
//# sourceMappingURL=palette.d.ts.map