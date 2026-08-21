/**
 * Master agreement + per-site addenda.
 *
 * A client signs the full Master Services Agreement once. Every site they buy after that is
 * authorised by a short addendum that names the site, its plan, and the entity contracting
 * for it, and incorporates the master by reference.
 *
 * The reason for the split is not just friction. A client's second site is often bought by a
 * *different legal entity* — another LLC, another brand they own — and making them re-sign
 * the whole master with different entity details would either overwrite the first entity's
 * record or produce two masters with no stated relationship. The addendum is the right shape
 * for that: one governing agreement, one signed instrument per site, each naming its own
 * contracting party.
 *
 * This module holds only the *rules* about when a master is still good. The documents
 * themselves live in the agency app's legal module, next to the terms they render.
 */
import { z } from "zod";
import type { PortalPlan } from "./account.js";
export type AgreementKind = "master" | "addendum";
/**
 * Version recorded for accounts that predate the master/addendum split.
 *
 * These clients signed a full agreement, but `agreement:{id}` carried a 30-day TTL, so for
 * most of them the record is simply gone. Treating them as holding a valid master is
 * deliberate: they *did* sign, and forcing a long-standing client to re-sign the full terms
 * in order to add a $117 starter site punishes exactly the people worth keeping. A real terms
 * bump still triggers a re-sign for them, like anyone else.
 */
export declare const LEGACY_AGREEMENT_VERSION = "legacy";
/** The pointer an account keeps to its governing agreement. */
export interface MasterAgreementRef {
    /** `agreement:{id}`. Null for a reconstructed pre-cutover master. */
    agreementId: string | null;
    /** `TERMS_VERSION` at signing, or `LEGACY_AGREEMENT_VERSION`. */
    version: string;
    /**
     * The highest plan this master's terms actually cover.
     *
     * Terms differ per plan (the agency's `getTermsForPlan` resolves a different body and
     * Schedule A for each), so a master signed on Starter terms does not authorise an
     * Enterprise site. Buying above the ceiling raises it, and raising it means signing the
     * full terms for the new tier rather than bolting an addendum onto terms that never
     * contemplated it.
     */
    tierCeiling: PortalPlan;
    /** Epoch ms. */
    signedAt: number;
}
export declare const zMasterAgreementRef: z.ZodObject<{
    agreementId: z.ZodNullable<z.ZodString>;
    version: z.ZodString;
    tierCeiling: z.ZodEnum<["starter", "growth", "enterprise"]>;
    signedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    agreementId: string | null;
    version: string;
    tierCeiling: "starter" | "growth" | "enterprise";
    signedAt: number;
}, {
    agreementId: string | null;
    version: string;
    tierCeiling: "starter" | "growth" | "enterprise";
    signedAt: number;
}>;
/** Is `a` at least as high a tier as `b`? */
export declare function tierAtLeast(a: PortalPlan, b: PortalPlan): boolean;
/**
 * Must the client sign the full master again, rather than a short addendum?
 *
 * Two reasons only, and both are about the *terms*, not the client:
 *   1. the terms have changed since they signed, so the document they agreed to is not the
 *      one now in force; or
 *   2. they are buying above what their master covers, whose terms are materially different.
 *
 * Explicitly **not** a reason: different legal entity, different address, different signer.
 * That is the case the addendum exists for — it carries its own entity block. Requiring a new
 * master there would silently rewrite the first entity's contracting details.
 *
 * A missing master always means yes.
 */
export declare function masterNeedsResign(master: MasterAgreementRef | null | undefined, currentVersion: string, requestedPlan: PortalPlan): boolean;
/**
 * The master an account should hold after signing for `plan` — the ceiling only ever rises.
 *
 * A client who signs Enterprise terms and later buys a starter keeps the Enterprise ceiling,
 * so the starter is an addendum rather than a pointless re-sign.
 */
export declare function raiseTierCeiling(master: MasterAgreementRef, plan: PortalPlan): MasterAgreementRef;
/**
 * Reconstruct a master for an account that predates this feature, from the sites it holds.
 *
 * The ceiling is the highest plan they are already being billed for: they demonstrably signed
 * something that authorised it. Returns null for an account with no sites, which has nothing
 * to infer from and genuinely needs a first signature.
 */
export declare function legacyMasterFrom(sites: Array<{
    plan: PortalPlan;
    addedAt: number;
}>): MasterAgreementRef | null;
//# sourceMappingURL=agreement.d.ts.map