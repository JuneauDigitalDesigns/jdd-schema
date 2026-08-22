/**
 * CopyBrief — the durable record of what the console's Brief stage (Intake, jdd-ops
 * console) assembled to guide AI copy generation for one client, persisted at
 * `_meta.copyBrief` on that client's site.ts.
 *
 * Kept deliberately thin here: this is the WIRE shape that survives a save/reload and an
 * export-time strip (writeSiteContent deletes `_meta.copyBrief` before it reaches a client
 * repo — it is operator-only). The richer runtime shape the console computes per render
 * (ResolvedBlock, with defaultText/edited/parts) lives in the console's own
 * src/lib/copy-brief/types.ts and is derived from this one plus live content — it is not
 * itself persisted, so it has no business being schema.
 */
export {};
//# sourceMappingURL=copy-brief.js.map