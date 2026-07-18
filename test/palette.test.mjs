import { test } from "node:test";
import assert from "node:assert/strict";
import {
  auditPalette,
  BACKGROUND_MOODS,
  contrast,
  derivePalette,
  hexToOklch,
  isDark,
  nudgeToContrast,
  oklchToHex,
  PALETTE_PRESETS,
  presetById,
  presetToPick,
  resolvePalette,
} from "../dist/index.js";

const SAMPLES = [
  "#FFFFFF", "#000000", "#1E6FBF", "#D97706", "#15803D",
  "#B91C1C", "#0F172A", "#60A5FA", "#7C3AED", "#0F766E",
];

function channels(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

test("hexToOklch/oklchToHex round-trips within 1/255 per channel", () => {
  for (const hex of SAMPLES) {
    const back = oklchToHex(hexToOklch(hex));
    const a = channels(hex);
    const b = channels(back);
    for (let i = 0; i < 3; i++) {
      assert.ok(
        Math.abs(a[i] - b[i]) <= 1,
        `${hex} → ${back}: channel ${i} drifted by ${Math.abs(a[i] - b[i])}`,
      );
    }
  }
});

test("contrast matches WCAG anchors", () => {
  assert.ok(Math.abs(contrast("#FFFFFF", "#000000") - 21) < 0.01);
  assert.equal(Math.round(contrast("#FFFFFF", "#FFFFFF")), 1);
});

test("oklchToHex brings out-of-gamut chroma back into sRGB", () => {
  // Chroma 0.4 at a dark lightness is far outside sRGB. Without the clamp loop
  // the linear channels overflow and the naive byte clamp mangles the color.
  const hex = oklchToHex({ l: 0.2, c: 0.4, h: 250 });
  assert.match(hex, /^#[0-9A-F]{6}$/);
  const back = hexToOklch(hex);
  assert.ok(back.c < 0.4, `chroma was not reduced (${back.c})`);
  assert.ok(Math.abs(back.l - 0.2) < 0.03, `lightness drifted to ${back.l}`);
});

test("oklchToHex preserves hue at in-gamut lightness", () => {
  // Near-black colors quantize to a handful of byte values, so hue is only
  // meaningfully round-trippable away from the extremes.
  for (const h of [30, 75, 145, 250, 320]) {
    const back = hexToOklch(oklchToHex({ l: 0.55, c: 0.1, h }));
    assert.ok(Math.abs(back.h - h) < 2, `hue ${h} came back as ${back.h}`);
  }
});

test("nudgeToContrast reaches the target and preserves hue", () => {
  const fixed = nudgeToContrast("#FFEE88", "#FFFFFF", 4.5);
  assert.ok(contrast(fixed, "#FFFFFF") >= 4.5, `only got ${contrast(fixed, "#FFFFFF")}`);
  const dh = Math.abs(hexToOklch(fixed).h - hexToOklch("#FFEE88").h);
  assert.ok(dh < 12, `hue drifted by ${dh}`);
});

// ─── back-compat ─────────────────────────────────────────────────────────────

test("a pre-1.2 custom pick still resolves to a white background", () => {
  const p = resolvePalette({
    mode: "custom",
    accentColor: "#1E6FBF",
    baseColor: "#0F172A",
  });
  assert.equal(p.bg, "#FFFFFF");
  assert.equal(p.accent, "#1E6FBF");
  assert.equal(p.ink, "#0F172A");
});

test("an empty pick still resolves to the ocean-blue preset", () => {
  assert.deepEqual(
    resolvePalette(undefined),
    PALETTE_PRESETS.find((p) => p.id === "ocean-blue").palette,
  );
});

// ─── the actual bug ──────────────────────────────────────────────────────────

test("supporting slots carry the accent hue, so changing accent re-tints them", () => {
  const blue = derivePalette("#1E6FBF", "#0F172A");
  const amber = derivePalette("#D97706", "#0F172A");

  for (const slot of ["bgSoft", "rule"]) {
    assert.notEqual(blue[slot], amber[slot], `${slot} did not change with the accent`);
    const dh = Math.abs(hexToOklch(blue[slot]).h - hexToOklch(amber[slot]).h);
    assert.ok(dh > 30, `${slot} hue barely moved (${dh}°)`);
  }
});

test("bgSoft is actually distinguishable from bg", () => {
  const p = derivePalette("#1E6FBF", "#0F172A");
  // The old implementation produced a bgSoft ~1/255 from white.
  const [r1, g1, b1] = channels(p.bg);
  const [r2, g2, b2] = channels(p.bgSoft);
  const delta = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
  assert.ok(delta >= 8, `bgSoft is only ${delta} away from bg`);
});

// ─── moods ───────────────────────────────────────────────────────────────────

test("dark moods produce a dark bg with light, legible ink", () => {
  for (const mood of ["soft-dark", "deep-dark"]) {
    const p = derivePalette("#60A5FA", "#0F172A", mood);
    assert.ok(isDark(p.bg), `${mood} bg ${p.bg} is not dark`);
    assert.ok(!isDark(p.ink), `${mood} ink ${p.ink} is not light`);
    assert.ok(
      contrast(p.ink, p.bg) >= 4.5,
      `${mood} ink/bg contrast only ${contrast(p.ink, p.bg)}`,
    );
  }
});

test("every mood id in BACKGROUND_MOODS derives a valid palette", () => {
  for (const m of BACKGROUND_MOODS) {
    const p = derivePalette("#0F766E", "#0F172A", m.id);
    for (const [slot, hex] of Object.entries(p)) {
      assert.match(hex, /^#[0-9A-F]{6}$/, `${m.id}.${slot} = ${hex}`);
    }
  }
});

// ─── audit + overrides ───────────────────────────────────────────────────────

test("auditPalette flags a washed-out accent and suggests a working fix", () => {
  const p = derivePalette("#FFEE88", "#0F172A");
  const issues = auditPalette(p);
  const accentIssue = issues.find((i) => i.slot === "accent" && i.against === "bg");
  assert.ok(accentIssue, "expected an accent-on-background issue");
  assert.ok(contrast(accentIssue.suggestion, p.bg) >= accentIssue.required);
});

test("a healthy palette reports no issues", () => {
  assert.deepEqual(auditPalette(derivePalette("#1E6FBF", "#0F172A")), []);
});

test("overrides win over derivation, on presets too", () => {
  const custom = resolvePalette({
    mode: "custom",
    accentColor: "#1E6FBF",
    overrides: { rule: "#ABCDEF" },
  });
  assert.equal(custom.rule, "#ABCDEF");

  const preset = resolvePalette({ mode: "preset", presetId: "forest", overrides: { bg: "#101010" } });
  assert.equal(preset.bg, "#101010");
  assert.equal(preset.accent, PALETTE_PRESETS.find((p) => p.id === "forest").palette.accent);
});

// ─── preset → editable pick round-trip ───────────────────────────────────────

test("presetToPick round-trips every preset byte-identically", () => {
  // This is what guarantees that clicking "Let me adjust" in the wizard doesn't
  // shift a client's colors before they've changed anything.
  for (const preset of PALETTE_PRESETS) {
    assert.deepEqual(
      resolvePalette(presetToPick(preset.id)),
      preset.palette,
      `${preset.id} did not survive the round-trip`,
    );
  }
});

test("presetToPick yields an editable custom pick that remembers its origin", () => {
  const pick = presetToPick("forest");
  assert.equal(pick.mode, "custom");
  assert.equal(pick.presetId, "forest");
  assert.equal(pick.accentColor, "#15803D");
  assert.equal(pick.bgMood, "white");
});

test("presetToPick on a dark preset omits ink and still round-trips", () => {
  const pick = presetToPick("midnight");
  assert.equal(pick.bgMood, "deep-dark");
  assert.equal(pick.baseColor, undefined, "dark presets derive ink, so none should be pinned");
  assert.deepEqual(resolvePalette(pick), presetById("midnight").palette);
});

test("presetToPick falls back to the default preset for an unknown id", () => {
  assert.deepEqual(
    resolvePalette(presetToPick("no-such-preset")),
    presetById("ocean-blue").palette,
  );
});

test("every preset's palette matches a fresh derive from its own source", () => {
  for (const p of PALETTE_PRESETS) {
    assert.deepEqual(
      p.palette,
      derivePalette(p.source.accent, p.source.ink, p.source.bgMood),
      `${p.id} palette has drifted from its source`,
    );
  }
});

test("accentFg is always set and always legible on the accent", () => {
  for (const preset of PALETTE_PRESETS) {
    assert.ok(preset.accentFg !== null);
    const p = preset.palette;
    assert.ok(p.accentFg, `${preset.id} has no accentFg`);
    assert.ok(
      contrast(p.accentFg, p.accent) >= 3.0,
      `${preset.id} accentFg/accent contrast only ${contrast(p.accentFg, p.accent)}`,
    );
  }
});
