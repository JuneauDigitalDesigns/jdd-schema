/**
 * v1.34.0: which towns earn a page of their own (`/areas/<town>`), which town + service pairs earn
 * a spoke (`/areas/<town>/<service>`), and how many pages of each kind a site may have.
 *
 * Xander's local SEO decisions, 2026-11-12 (local-seo-architecture-decisions.md in the shared
 * session notes; proposal https://claude.ai/artifact/FHnwMommEU5asdQWa4JU1n):
 *   L4  Home is the main city's hub and the service pages are its spokes. So the main city never
 *       gets a town page or a spoke: two pages would aim at the same words.
 *   L6  A gate decides, capped at 10. A town qualifies when it is one of the client's own towns,
 *       is not the main city, and has 3+ town facts of 2+ kinds.
 *   L9  A town fact is a job photo tagged to the town, a real review tagged to it, or an operator
 *       note that carries its source link. Nothing generated ever counts.
 *   L14 Caps per page type: service pages 11, town pages 10, spokes 15.
 *
 * A town page that says nothing local is what Google's spam policy calls a doorway ("pages
 * targeted at specific regions or cities that funnel users to one page"), so the gate counts
 * real local facts only, never how many towns the client lists. A town that misses stays a plain
 * entry in the towns list, with no page and no link. Nothing is ever padded to pass.
 *
 * The ONE implementation, like the service-page gate beside it: the agency wizard, the console
 * intake and the export import it. Reads content structurally, so it works on any SiteContent
 * shape the console holds. Guarded by test/area-pages.test.mjs.
 */
import { primaryCity, qualifiesForServicePage, serviceSlugs } from "./service-pages.js";
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === "string" ? v.trim() : "");
/** L14: the most pages of each generated kind a site may have. Replaces the console's single
 *  MAX_PAGES = 16 for the generated kinds; the core pages are not counted here. */
export const PAGE_CAPS = Object.freeze({ service: 11, area: 10, spoke: 15 });
/** L6: a town page needs this many town facts ... */
export const AREA_FACTS_MIN = 3;
/** ... of at least this many kinds (a job photo, a review, a sourced note). */
export const AREA_KINDS_MIN = 2;
/** A spoke needs this many facts tagged to BOTH its town and its service. */
export const SPOKE_FACTS_MIN = 2;
/** Q2, "Which towns do you get the most work from?": pick up to 3. */
export const TOP_TOWNS_MAX = 3;
const HTTP_URL = /^https?:\/\/[^\s/]+\.[^\s]+$/i;
/** The towns the client covers, as the service area spells them. */
function serviceArea(content) {
    return arr(obj(obj(content).extensions).serviceArea).map(str).filter(Boolean);
}
/**
 * The client's own spelling of a town ("minneola " -> "Minneola"), or '' when the client does not
 * cover it. Every town tag is matched through this, so a tag typed in another case still counts
 * and a town outside the service area never does.
 */
export function canonicalTown(content, town) {
    const want = str(town).toLowerCase();
    if (!want)
        return "";
    return serviceArea(content).find((t) => t.toLowerCase() === want) ?? "";
}
/** L4: true when `town` is the main city (primaryCity: the address locality, else the first town
 *  served). Home is that city's hub, and the service pages are its spokes. */
export function isMainCity(content, town) {
    const main = primaryCity(content).toLowerCase();
    return main !== "" && str(town).toLowerCase() === main;
}
function slugBase(name) {
    return (name
        .toLowerCase()
        .replace(/['’]/g, "")
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .join("-")
        .slice(0, 60)
        .replace(/-+$/, "") || "town");
}
/** The URL slug for a town (`/areas/<slug>`). `taken` holds slugs already used; a collision gets
 *  -2, -3. */
export function townSlug(town, taken = []) {
    const used = new Set(taken);
    const base = slugBase(str(town));
    if (!used.has(base))
        return base;
    for (let n = 2;; n++) {
        const candidate = `${base}-${n}`;
        if (!used.has(candidate))
            return candidate;
    }
}
/** Slugs for every town served, in service-area order, collision-free. */
export function townSlugs(content) {
    const out = [];
    for (const t of serviceArea(content))
        out.push(townSlug(t, out));
    return out;
}
const tagged = (content, town, x) => canonicalTown(content, x.town) === town && town !== "";
const hasImage = (p) => str(obj(p.image).url) !== "";
function townJobs(content, town) {
    return arr(obj(obj(content).work).projects).map(obj).filter((p) => tagged(content, town, p) && hasImage(p));
}
function townReviews(content, town) {
    return arr(obj(obj(content).testimonials).items).map(obj).filter((r) => tagged(content, town, r) && str(r.q) !== "");
}
function townNotes(content, town) {
    return arr(obj(obj(content).extensions).townNotes)
        .map(obj)
        .filter((n) => tagged(content, town, n) && str(n.text) !== "" && HTTP_URL.test(str(n.sourceUrl)));
}
/** The real local facts a town has: job photos, reviews and sourced notes tagged to it. */
export function areaPageFacts(content, town) {
    const t = canonicalTown(content, town);
    const jobs = townJobs(content, t).length;
    const reviews = townReviews(content, t).length;
    const notes = townNotes(content, t).length;
    const have = [];
    if (jobs)
        have.push("job");
    if (reviews)
        have.push("review");
    if (notes)
        have.push("note");
    return { count: jobs + reviews + notes, have, jobs, reviews, notes };
}
/** L4 + L6: true when the town earns a page of its own. */
export function qualifiesForAreaPage(content, town) {
    const t = canonicalTown(content, town);
    if (!t || isMainCity(content, t))
        return false;
    const f = areaPageFacts(content, t);
    return f.count >= AREA_FACTS_MIN && f.have.length >= AREA_KINDS_MIN;
}
/**
 * The towns that get a page, at most `cap` (default PAGE_CAPS.area). Over the cap the towns with
 * the most facts win; ties go to the client's top towns (Q2, in their order), then to the service
 * area's order. Returned in service-area order, so pages sit in the order the client listed.
 */
export function pickAreaPages(content, cap = PAGE_CAPS.area) {
    const area = serviceArea(content);
    const top = arr(obj(obj(content).extensions).topTowns).map((t) => canonicalTown(content, t)).filter(Boolean);
    const rank = (t) => {
        const i = top.indexOf(t);
        return i < 0 ? top.length : i;
    };
    const ranked = area
        .map((t, i) => ({ t, i, count: areaPageFacts(content, t).count }))
        .filter((x) => qualifiesForAreaPage(content, x.t))
        .sort((a, b) => b.count - a.count || rank(a.t) - rank(b.t) || a.i - b.i);
    const keep = new Set(ranked.slice(0, Math.max(0, cap)).map((x) => x.t));
    return area.filter((t) => keep.has(t));
}
/** The facts tagged to BOTH a town and a service: job photos and reviews. */
export function spokePageFacts(content, town, serviceIndex) {
    const t = canonicalTown(content, town);
    const slug = serviceSlugs(content)[serviceIndex] ?? "";
    const ofService = (x) => slug !== "" && str(x.service) === slug;
    const jobs = townJobs(content, t).filter(ofService).length;
    const reviews = townReviews(content, t).filter(ofService).length;
    return { count: jobs + reviews, jobs, reviews };
}
/**
 * True when a town + service pair earns a spoke. Its town must earn a page (so never the main
 * city, L4), its service must earn a page, it needs SPOKE_FACTS_MIN facts tagged to both, and the
 * demand behind it must have been approved by Xander (Phase 3: a Search Console proposal he
 * approved). A spoke is never built on facts alone.
 */
export function qualifiesForSpokePage(content, town, serviceIndex, demandApproved) {
    if (!demandApproved)
        return false;
    if (!qualifiesForAreaPage(content, town))
        return false;
    if (!qualifiesForServicePage(content, serviceIndex))
        return false;
    return spokePageFacts(content, town, serviceIndex).count >= SPOKE_FACTS_MIN;
}
//# sourceMappingURL=area-pages.js.map