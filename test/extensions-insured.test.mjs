// v1.43.0 (2026-11-19): `extensions.insured` is declared. The console's intake has written it since
// 2026-11-14 (the Business step's tick under License; the site says "Licensed & insured" only when it
// is true), and the template reads it (src/lib/insured.ts), but ExtensionsContent never named it. A
// client repo inlines SITE_TYPES_SOURCE as its own types, so _e2e_test_starter's export failed its
// build: "'insured' does not exist in type 'ExtensionsContent'" at `"insured": false`.
//
// The check is the one `next build` made: an object literal with `insured` against the types a
// client repo ships with, through the TypeScript compiler.
import { test } from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { SITE_TYPES_SOURCE } from "../dist/index.js";

function diagnostics(extra) {
  const name = "site.ts";
  const text = `${SITE_TYPES_SOURCE}\n${extra}\n`;
  const host = ts.createCompilerHost({ strict: true, noEmit: true });
  const getSourceFile = host.getSourceFile;
  host.getSourceFile = (f, v) => (f === name ? ts.createSourceFile(f, text, v) : getSourceFile.call(host, f, v));
  const program = ts.createProgram([name], { strict: true, noEmit: true, types: [], lib: ["lib.es2022.d.ts"] }, host);
  return ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

const BASE = "trustBadges: null, reviewBadge: null, contactDetails: null, hours: null, bookingUrl: null, portalUrl: null";

test("a client repo's own types accept extensions.insured, true, false or unset", () => {
  for (const v of ["true", "false", "null"]) {
    assert.deepEqual(diagnostics(`const e: ExtensionsContent = { ${BASE}, insured: ${v} };`), [], `insured: ${v}`);
  }
  assert.deepEqual(diagnostics(`const e: ExtensionsContent = { ${BASE} };`), [], "unset: a site made before it still type-checks");
});

test("it is a yes or no, not free text", () => {
  assert.ok(diagnostics(`const e: ExtensionsContent = { ${BASE}, insured: "yes" };`).length > 0);
});
