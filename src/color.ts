/**
 * Color math for palette derivation. Hand-rolled on purpose — @jdd/schema stays
 * zero-dependency so both the wizard and the console can import it without
 * pulling a color library into either bundle.
 *
 * Everything derived here goes through OKLCH rather than sRGB. The old linear
 * `mix()` desaturated through a muddy midpoint and had no concept of hue, which
 * is why a client's accent choice never visibly reached the supporting slots.
 * OKLCH is perceptually uniform: holding L and C while swapping H gives colors
 * of genuinely equal weight, which is exactly what a coordinated palette needs.
 */

export interface Oklch {
  /** Perceptual lightness, 0 (black) → 1 (white). */
  l: number;
  /** Chroma, 0 (gray) → ~0.4 (most saturated sRGB can hold). */
  c: number;
  /** Hue angle in degrees, 0–360. */
  h: number;
}

// ─── hex ⇄ rgb ───────────────────────────────────────────────────────────────

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = (hex || "").replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full || "000000", 16);
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  return (
    "#" + [r, g, b].map((x) => clampByte(x).toString(16).padStart(2, "0")).join("")
  ).toUpperCase();
}

// ─── sRGB companding ─────────────────────────────────────────────────────────

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function fromLinear(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// ─── OKLab / OKLCH (Björn Ottosson) ──────────────────────────────────────────

export function hexToOklch(hex: string): Oklch {
  const { r, g, b } = hexToRgb(hex);
  const lr = toLinear(r / 255);
  const lg = toLinear(g / 255);
  const lb = toLinear(b / 255);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;

  return { l: L, c, h };
}

/** Linear-RGB triple for an OKLCH color, before gamut clamping. */
function oklchToLinearRgb({ l, c, h }: Oklch): { r: number; g: number; b: number } {
  const rad = (h * Math.PI) / 180;
  const A = Math.cos(rad) * c;
  const B = Math.sin(rad) * c;

  const l_ = l + 0.3963377774 * A + 0.2158037573 * B;
  const m_ = l - 0.1055613458 * A - 0.0638541728 * B;
  const s_ = l - 0.0894841775 * A - 1.291485548 * B;

  const L = l_ * l_ * l_;
  const M = m_ * m_ * m_;
  const S = s_ * s_ * s_;

  return {
    r: 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S,
    g: -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S,
    b: -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S,
  };
}

/**
 * OKLCH → hex, reducing chroma until the color fits in sRGB. Without this pass,
 * high-chroma darks and lights fall outside the gamut and the naive byte clamp
 * shifts their hue badly (a vivid dark blue clips to purple).
 */
export function oklchToHex(o: Oklch): string {
  const l = Math.max(0, Math.min(1, o.l));
  let c = Math.max(0, o.c);
  const h = ((o.h % 360) + 360) % 360;

  let lin = oklchToLinearRgb({ l, c, h });
  for (let i = 0; i < 20; i++) {
    const inGamut =
      lin.r >= -1e-4 && lin.r <= 1 + 1e-4 &&
      lin.g >= -1e-4 && lin.g <= 1 + 1e-4 &&
      lin.b >= -1e-4 && lin.b <= 1 + 1e-4;
    if (inGamut || c === 0) break;
    c *= 0.95;
    lin = oklchToLinearRgb({ l, c, h });
  }

  return rgbToHex({
    r: fromLinear(Math.max(0, Math.min(1, lin.r))) * 255,
    g: fromLinear(Math.max(0, Math.min(1, lin.g))) * 255,
    b: fromLinear(Math.max(0, Math.min(1, lin.b))) * 255,
  });
}

// ─── WCAG contrast ───────────────────────────────────────────────────────────

export function relLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * toLinear(r / 255) +
    0.7152 * toLinear(g / 255) +
    0.0722 * toLinear(b / 255)
  );
}

/** WCAG 2.1 contrast ratio between two colors, 1 (identical) → 21 (black/white). */
export function contrast(a: string, b: string): number {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export function isDark(hex: string): boolean {
  return relLuminance(hex) < 0.18;
}

/**
 * Push `fg` away from `bg` in OKLCH lightness until it meets `target` contrast.
 * Hue and chroma are preserved, so the client's color stays recognizably theirs —
 * it just gets light or dark enough to read. Returns `fg` unchanged if the target
 * is unreachable (e.g. a mid-gray background where neither direction gets there).
 */
export function nudgeToContrast(fg: string, bg: string, target: number): string {
  if (contrast(fg, bg) >= target) return fg;

  const start = hexToOklch(fg);
  // Move away from the background: darken against a light bg, lighten against a dark one.
  const dir = relLuminance(bg) > relLuminance(fg) ? -1 : 1;

  let best = fg;
  let bestRatio = contrast(fg, bg);

  for (let i = 1; i <= 50; i++) {
    const l = start.l + dir * 0.02 * i;
    if (l < 0 || l > 1) break;
    const candidate = oklchToHex({ ...start, l });
    const ratio = contrast(candidate, bg);
    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = candidate;
    }
    if (ratio >= target) return candidate;
  }

  return bestRatio > contrast(fg, bg) ? best : fg;
}

// ─── small helpers used by derivation ────────────────────────────────────────

/** Linear interpolation between two numbers. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
