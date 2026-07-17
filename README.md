# @jdd/schema

Single source of truth for the Juneau Digital Designs onboarding **wire contract** —
the canonical `SiteContent` schema, the `Intake` envelope, the onboarding-form
`OnboardingSubmission` payload, the `mapPayloadToIntake` mapper, and zod validators.

Both repos consume this package instead of each maintaining a hand-synced mirror:

- **Producer** — `juneau-digital-designs` (agency site): `POST /api/onboarding`
  maps the form payload to an `Intake` and enqueues it on the `jdd:intake:*` KV queue.
- **Consumer** — `jdd-ops/console`: pulls the queue, writes `clients/<slug>/site.ts`,
  then `onboard.js` provisions from it.

## Install

Both repos depend on it by pinned tag (public repo → zero-auth Vercel install):

```jsonc
// package.json
"dependencies": {
  "@jdd/schema": "github:JuneauDigitalDesigns/jdd-schema#v1.0.0"
}
```

Bump the tag in **both** `package.json` files when the contract changes — that
deliberate two-line bump is what replaces the old sync-by-comment drift.

## Exports

| Export | Kind | Notes |
|---|---|---|
| `SiteContent`, `BrandContent`, `BrandPalette`, … | types | canonical page-content schema (v2.1, Variation D) |
| `Intake`, `IntakeEnvelope`, `QueuedIntake`, `IntakeSummary` | types | the envelope + KV queue record |
| `OnboardingSubmission`, `AdditionalSiteEntry`, `ImageMeta` | types | the onboarding-form payload |
| `mapPayloadToSchema`, `mapPayloadToIntake` | fns | form → canonical SiteContent / Intake |
| `zOnboardingSubmission`, `zIntake`, `zQueuedIntake`, … | zod | runtime validation at the two trust boundaries |
| `SITE_TYPES_SOURCE` | string | raw interface text the console inlines into self-contained client repos (R3) |

## Build

`prepare` runs `tsc` on install, so `github:` installs build automatically.

```bash
npm install
npm run build       # emit dist/
npm run typecheck   # tsc --noEmit
npm test            # node --test
```

## Versioning

- `v1.0.0` — faithful extraction of the existing types + mapper (no behavior change).
- `v1.1.0` — adds `BrandDirection`, `_meta.brandDirection`, `DEFAULT_STRUCTURE`,
  `derivePalette`, `brandDirectionToDetails`; mapper seeds structural counts and
  stops flagging copy fields.
