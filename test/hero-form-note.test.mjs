// v1.44.0 (Xander, 2026-11-20): the line under a lead form's heading is editable per site,
// `hero.formNote`. It was fixed template text ("Tell us what's going on. We'll call you right back.",
// and on lawn care "We'll call you back with a quote."). His default, the same on every trade, lives
// in the catalog; the field is optional so every existing site.ts still type-checks, and a site that
// never edits it shows the default.
//
// The check is the one a client repo's `next build` makes: an object literal against the types it
// ships with (SITE_TYPES_SOURCE), through the TypeScript compiler.
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { SITE_TYPES_SOURCE } from "../dist/index.js";

function diagnostics(extra) {
  const name = "site.ts";
  const text = `${SITE_TYPES_SOURCE}\n${extra}\n`;
  const opts = { strict: true, noEmit: true, types: [], lib: ["lib.es2022.d.ts"] };
  const host = ts.createCompilerHost(opts);
  const getSourceFile = host.getSourceFile;
  host.getSourceFile = (f, v) => (f === name ? ts.createSourceFile(f, text, v) : getSourceFile.call(host, f, v));
  return ts.getPreEmitDiagnostics(ts.createProgram([name], opts, host)).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

const HERO = `eyebrow: "", headline: "", headlineEmphasis: null, sub: "", formLabel: "", placeholder: "", cta: "", secondaryCta: "", trust: "", badge: null, frictionReducers: [], heroBullets: []`;

test("a client repo's own types accept hero.formNote, and a site without it", () => {
  assert.deepEqual(diagnostics(`const h: HeroContent = { ${HERO}, formNote: "Tell us what's going on. We'll call you right back." };`), []);
  assert.deepEqual(diagnostics(`const h: HeroContent = { ${HERO} };`), [], "a site made before it still type-checks");
});

test("it is text", () => {
  assert.ok(diagnostics(`const h: HeroContent = { ${HERO}, formNote: 1 };`).length > 0);
});
