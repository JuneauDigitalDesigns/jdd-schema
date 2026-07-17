/**
 * BrandDirection — the brand-identity guidance the client provides instead of
 * authoring copy. It is stored on `_meta.brandDirection` and compiled into the
 * free-text `details` string the console's brand copywriter consumes.
 */

export interface BrandDirection {
  /** What makes the business different — the single most important guidance (was `usp`). */
  differentiators: string;
  /** One line describing who the ideal customer is. */
  targetCustomer: string;
  /** Vibe chips, e.g. ["Modern", "Bold"]. */
  vibe: string[];
  /** Tone-of-voice chips, e.g. ["Friendly", "Professional"]. */
  tone: string[];
  /** 3–5 free-form brand adjectives. */
  adjectives: string[];
  /** Sites/brands the client admires (free text). */
  references: string;
  /** Words/claims to avoid (feeds the copywriter's anti-cliché / forbidden rules). */
  forbidden: string;
}

/** An empty BrandDirection — handy default for form state and additional sites. */
export const EMPTY_BRAND_DIRECTION: BrandDirection = {
  differentiators: "",
  targetCustomer: "",
  vibe: [],
  tone: [],
  adjectives: [],
  references: "",
  forbidden: "",
};

/**
 * Compile a BrandDirection into the free-text `details` guidance the copywriter
 * accepts (jdd-ops buildCopyUserMessage's `details` argument). Only non-empty
 * fields are included, so a sparsely-filled intake produces terse guidance
 * rather than a wall of empty labels.
 */
export function brandDirectionToDetails(bd: BrandDirection | undefined | null): string {
  if (!bd) return "";
  const lines: string[] = [];
  const trim = (s: string) => (s || "").trim();
  const list = (a: string[]) => (a || []).map((x) => x.trim()).filter(Boolean);

  if (trim(bd.differentiators)) lines.push(`What makes them different: ${trim(bd.differentiators)}`);
  if (trim(bd.targetCustomer)) lines.push(`Target customer: ${trim(bd.targetCustomer)}`);
  if (list(bd.vibe).length) lines.push(`Desired visual vibe: ${list(bd.vibe).join(", ")}`);
  if (list(bd.tone).length) lines.push(`Tone of voice: ${list(bd.tone).join(", ")}`);
  if (list(bd.adjectives).length) lines.push(`Brand adjectives: ${list(bd.adjectives).join(", ")}`);
  if (trim(bd.references)) lines.push(`Brands/sites they admire: ${trim(bd.references)}`);
  if (trim(bd.forbidden)) lines.push(`Avoid (words / claims / styles): ${trim(bd.forbidden)}`);

  return lines.join("\n");
}
