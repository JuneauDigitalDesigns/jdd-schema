// SITE_TYPES_SOURCE must stay in sync with src/site.ts.
//
// The SiteContent type tree exists TWICE in this package: as real TypeScript in src/site.ts,
// which every consumer compiles against, and as the string constant SITE_TYPES_SOURCE in
// src/site-types-source.ts, which jdd-ops inlines verbatim as the types of each exported client
// repo's src/data/site.ts. site.ts has said "Keep the two in sync" since it was written, and
// nothing enforced it.
//
// It drifted. v1.24.0 added the decision-29 fields (ownerName, brandsCarried, responseTime) to
// ExtensionsContent, and v2.4 added local_images to ContentMeta, in site.ts only. The export then
// wrote `"ownerName": null` as DATA into client repos whose TYPES did not declare it, so the
// console compiled and every client repo failed `next build` at type-check:
//
//   ./src/components/catalog/about/AboutSticky.tsx:36
//   Type error: Property 'ownerName' does not exist on type 'ExtensionsContent'.
//
// Three catalog components read those fields (AboutSticky, AboutStory, TrustBadges), so any
// client site using one of them could not be built at all. This test is cheap and would have
// caught it the moment the field was added.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SITE_TYPES_SOURCE } from "../dist/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Top-level field names per exported interface/type, keyed by name.
 *
 * Deliberately shallow — only 2-space-indented members, so a nested object literal's own keys
 * don't leak into the parent. Comparing field NAMES rather than text is what lets the mirror
 * stay a condensed copy (doc comments trimmed, imported types inlined) while still being checked.
 */
function interfaceFields(source) {
  const out = new Map();
  for (const block of source.matchAll(/export (?:interface|type) (\w+)[^{]*\{([\s\S]*?)\n\}/g)) {
    const fields = [...block[2].matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
    out.set(block[1], new Set(fields));
  }
  return out;
}

const real = interfaceFields(readFileSync(join(ROOT, "src/site.ts"), "utf8"));
const mirror = interfaceFields(SITE_TYPES_SOURCE);

test("every interface in site.ts is present in SITE_TYPES_SOURCE", () => {
  const absent = [...real.keys()].filter((name) => !mirror.has(name));
  assert.deepEqual(
    absent,
    [],
    `src/site-types-source.ts is missing ${absent.join(", ")} — add them to SITE_TYPES_SOURCE.`,
  );
});

test("no interface exists only in SITE_TYPES_SOURCE", () => {
  const extra = [...mirror.keys()].filter((name) => !real.has(name));
  assert.deepEqual(
    extra,
    [],
    `SITE_TYPES_SOURCE declares ${extra.join(", ")}, which src/site.ts does not — it is a mirror, not a second schema.`,
  );
});

test("every field in site.ts is present on the same interface in SITE_TYPES_SOURCE", () => {
  const drift = [];
  for (const [name, fields] of real) {
    const mirrored = mirror.get(name);
    if (!mirrored) continue; // reported by the test above
    const missing = [...fields].filter((f) => !mirrored.has(f));
    if (missing.length) drift.push(`${name}: ${missing.join(", ")}`);
  }
  assert.deepEqual(
    drift,
    [],
    `SITE_TYPES_SOURCE is behind src/site.ts. Missing — ${drift.join(" | ")}. ` +
      `Client repos inline the mirror, so a field missing here fails their next build at type-check ` +
      `even though this package and the console compile fine.`,
  );
});

test("no field exists only in SITE_TYPES_SOURCE", () => {
  // The other direction matters too: a field only in the mirror types a client repo against
  // something the over-the-wire contract does not guarantee.
  const drift = [];
  for (const [name, fields] of mirror) {
    const actual = real.get(name);
    if (!actual) continue;
    const extra = [...fields].filter((f) => !actual.has(f));
    if (extra.length) drift.push(`${name}: ${extra.join(", ")}`);
  }
  assert.deepEqual(drift, [], `SITE_TYPES_SOURCE has fields src/site.ts does not — ${drift.join(" | ")}.`);
});

test("the fields that actually broke client builds are mirrored", () => {
  // Named explicitly so the regression is readable in the test output, not just implied by
  // the generic comparison above.
  for (const field of ["ownerName", "brandsCarried", "responseTime"]) {
    assert.ok(
      mirror.get("ExtensionsContent")?.has(field),
      `ExtensionsContent.${field} missing from SITE_TYPES_SOURCE`,
    );
  }
  assert.ok(
    mirror.get("ContentMeta")?.has("local_images"),
    "ContentMeta.local_images missing from SITE_TYPES_SOURCE",
  );
});
