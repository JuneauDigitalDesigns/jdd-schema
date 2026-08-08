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
export declare function hexToRgb(hex: string): {
    r: number;
    g: number;
    b: number;
};
export declare function rgbToHex({ r, g, b }: {
    r: number;
    g: number;
    b: number;
}): string;
export declare function hexToOklch(hex: string): Oklch;
/**
 * OKLCH → hex, reducing chroma until the color fits in sRGB. Without this pass,
 * high-chroma darks and lights fall outside the gamut and the naive byte clamp
 * shifts their hue badly (a vivid dark blue clips to purple).
 */
export declare function oklchToHex(o: Oklch): string;
export declare function relLuminance(hex: string): number;
/** WCAG 2.1 contrast ratio between two colors, 1 (identical) → 21 (black/white). */
export declare function contrast(a: string, b: string): number;
export declare function isDark(hex: string): boolean;
/**
 * Push `fg` away from `bg` in OKLCH lightness until it meets `target` contrast.
 * Hue and chroma are preserved, so the client's color stays recognizably theirs —
 * it just gets light or dark enough to read. Returns `fg` unchanged if the target
 * is unreachable (e.g. a mid-gray background where neither direction gets there).
 */
export declare function nudgeToContrast(fg: string, bg: string, target: number): string;
/** Linear interpolation between two numbers. */
export declare function lerp(a: number, b: number, t: number): number;
//# sourceMappingURL=color.d.ts.map