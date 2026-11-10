// The package must resolve from a CommonJS context too, not only from ESM `import`.
//
// The console's test runner (tsx) loads console .ts files through Node's CommonJS path. With only
// an "import" condition, `require("@jdd/schema")` there fails with ERR_PACKAGE_PATH_NOT_EXPORTED,
// so no console module that imports a schema VALUE could be unit-tested. Several console tests
// read component source as text for exactly this reason, and it blocked console/src/lib/
// servicePages.ts from becoming a re-export of this package's service-page rule (one rule, one
// place). A "default" condition fixes it without changing what ESM consumers get.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test('exports carry a "default" condition pointing at the same entry as "import"', () => {
  const root = pkg.exports["."];
  assert.equal(root.default, root.import);
  assert.equal(root.import, "./dist/index.js");
});

test("the package resolves by name from a CommonJS context", () => {
  // Self-reference by package name uses the exports map with the "require" conditions.
  const require = createRequire(import.meta.url);
  assert.match(require.resolve("@jdd/schema").replace(/\\/g, "/"), /\/dist\/index\.js$/);
});
