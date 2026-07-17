/**
 * Palette derivation + presets. The onboarding wizard no longer asks clients to
 * type 7 raw hex values. Instead they pick a named preset OR two colors (an ink
 * anchor + an accent), and the remaining slots are DERIVED here — deterministically,
 * so the console can re-derive an identical palette from the same pick.
 */

import type { BrandPalette } from "./site.js";

/** How the client chose their palette. */
export interface PalettePick {
  mode: "preset" | "custom";
  /** Preset id (when mode === "preset"). */
  presetId?: string;
  /** Dark ink/text anchor (when mode === "custom"). */
  baseColor?: string;
  /** Accent / brand color (when mode === "custom"). */
  accentColor?: string;
}

// ─── hex helpers ─────────────────────────────────────────────────────────────

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = (hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full || "000000", 16);
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return (
    "#" +
    [r, g, b].map((x) => clampByte(x).toString(16).padStart(2, "0")).join("")
  ).toUpperCase();
}

/** Blend `from` toward `to` by amount `t` (0 = from, 1 = to). */
function mix(from: string, to: string, t: number): string {
  const A = hexToRgb(from);
  const B = hexToRgb(to);
  return rgbToHex({
    r: A.r + (B.r - A.r) * t,
    g: A.g + (B.g - A.g) * t,
    b: A.b + (B.b - A.b) * t,
  });
}

const WHITE = "#FFFFFF";
const DEFAULT_INK = "#0F172A";
const DEFAULT_ACCENT = "#1E6FBF";

/**
 * Derive a full BrandPalette from an accent + a dark ink anchor. Light theme:
 * white background, a faint accent-tinted soft background, and ink/inkSoft/rule
 * stepped from the ink toward white.
 */
export function derivePalette(accent: string, ink: string = DEFAULT_INK): BrandPalette {
  const a = accent && accent.trim() ? accent.trim() : DEFAULT_ACCENT;
  const k = ink && ink.trim() ? ink.trim() : DEFAULT_INK;
  return {
    accent: a,
    bg: WHITE,
    bgSoft: mix(WHITE, a, 0.05),
    ink: k,
    inkSoft: mix(k, WHITE, 0.42),
    rule: mix(k, WHITE, 0.86),
  };
}

// ─── named presets ───────────────────────────────────────────────────────────

export interface PalettePreset {
  id: string;
  label: string;
  palette: BrandPalette;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  { id: "slate-amber", label: "Slate & Amber", palette: derivePalette("#D97706", "#0F172A") },
  { id: "ocean-blue", label: "Ocean Blue", palette: derivePalette("#1E6FBF", "#0F1B2D") },
  { id: "forest", label: "Forest", palette: derivePalette("#15803D", "#14261B") },
  { id: "warm-sand", label: "Warm Sand", palette: derivePalette("#B45309", "#2A2118") },
  { id: "classic-navy", label: "Classic Navy", palette: derivePalette("#1E3A8A", "#111827") },
  { id: "crimson", label: "Crimson", palette: derivePalette("#B91C1C", "#1F1315") },
  { id: "teal", label: "Teal", palette: derivePalette("#0F766E", "#0B2422") },
  { id: "graphite", label: "Graphite", palette: derivePalette("#4B5563", "#111827") },
];

export const DEFAULT_PALETTE_PRESET_ID = "ocean-blue";

export function presetById(id: string | undefined): PalettePreset | undefined {
  return PALETTE_PRESETS.find((p) => p.id === id);
}

/**
 * Resolve a client's PalettePick into a concrete BrandPalette. Falls back to the
 * default preset if the pick is empty or references an unknown preset.
 */
export function resolvePalette(pick: PalettePick | undefined): BrandPalette {
  if (pick && pick.mode === "custom") {
    return derivePalette(pick.accentColor ?? DEFAULT_ACCENT, pick.baseColor ?? DEFAULT_INK);
  }
  const preset = presetById(pick?.presetId) ?? presetById(DEFAULT_PALETTE_PRESET_ID);
  return preset ? preset.palette : derivePalette(DEFAULT_ACCENT);
}
