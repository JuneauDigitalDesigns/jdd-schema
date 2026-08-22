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

export type CopyBriefBlockId =
  | "role"
  | "guardrails"
  | "facts"
  | "clientWords"
  | "website"
  | "positioning"
  | "offers"
  | "forbidden"
  | "structure"
  | "sections"
  | "custom";

export interface CopyBriefBlock {
  enabled: boolean;
  /**
   * Operator overrides, keyed by sub-part id for blocks with addressable parts (see
   * ResolvedBlock on the console side). A block with no overrides uses its resolved default
   * entirely.
   *
   * String values are prose overrides (role/guardrails text, a client-words line, scan
   * notes, a per-section instruction). String-array values are chip selections (positioning's
   * services/differentiators/customers, offers' proof points and service-area towns,
   * forbidden's word list) — kept as the actual ticked set, not a joined string, so reopening
   * the brief shows exactly which chips were checked rather than only their compiled text.
   */
  overrides?: Record<string, string | string[]>;
}

/**
 * An operator-added field beyond the standard blocks. `kind` decides which channel of the
 * compiled prompt it lands in: `fact` → the business-facts JSON, `instruction` → the rules
 * list, `forbidden` → the anti-rules, `reference` → an "imitate this voice" example.
 */
export interface CopyBriefCustomField {
  id: string;
  kind: "fact" | "instruction" | "forbidden" | "reference";
  label: string;
  value: string;
  /** Section ids (console's Section type) this field applies to. Empty = the whole brief. */
  sections: string[];
}

export interface CopyBrief {
  blocks: Partial<Record<CopyBriefBlockId, CopyBriefBlock>>;
  customFields: CopyBriefCustomField[];
  /** The one URL scanned for website notes, shared by the `website` block. */
  websiteUrl?: string;
  /** Per-section count overrides (pillars, stats, faq, testimonials, hero bullets, …),
   *  keyed by the same names as DEFAULT_STRUCTURE (structure.ts). Absent = use the default
   *  or, when the intake already supplied real content at that count, the locked value. */
  structureOverrides?: Record<string, number>;
  /** Section ids (console's Section type) ticked for the next generation run. */
  tickedSections?: string[];
  lastRunAt?: string;
}
