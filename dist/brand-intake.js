/**
 * The v1.1.0 onboarding payload — "one above minimum". The client provides facts
 * + brand direction only; NO marketing copy. `mapBrandIntakeToIntake` builds a
 * SiteContent SCAFFOLD: real facts, a derived palette, and correctly-SIZED empty
 * copy arrays (so the console copywriter knows how many pillars/FAQs/etc. to
 * write). The brand direction is stored on `_meta.brandDirection` so the console
 * can auto-prefill the copywriter's `details` without re-deriving it.
 *
 * This is additive to the legacy OnboardingSubmission / mapPayloadToIntake, which
 * remain until the agency form is rebuilt to post this shape.
 */
import { DEFAULT_STRUCTURE } from "./structure.js";
import { resolvePalette } from "./palette.js";
import { PROFILE_KINDS } from "./profiles.js";
import { serviceSlug } from "./service-pages.js";
import { formatPhoneDisplay, phoneHref } from "./phone.js";
// ─── helpers ──────────────────────────────────────────────────────────────────
function splitList(value) {
    return (value || "")
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
}
function orNull(value) {
    return value && value.trim() ? value : null;
}
function repeat(n, make) {
    return Array.from({ length: n }, make);
}
/**
 * Non-blank stats, mapped to the Stat shape (`{n, l}`). PLAN D4: a statistic is never
 * generated — this only ever passes through what the client supplied, and an entry with a
 * blank value is dropped rather than carried through as `{n: "", l: "..."}`, which would
 * render as an empty-looking tile instead of no tile at all.
 */
function statsFrom(stats) {
    return (stats ?? [])
        .filter((s) => s.value && s.value.trim())
        .map((s) => ({ n: s.value.trim(), l: (s.label ?? "").trim() }));
}
/**
 * The review aggregate, or null when the client supplied neither a score nor a count.
 * `ExtensionsContent.reviewBadge` wants numbers; the form posts strings, so this parses them
 * and treats an unparseable value the same as absent rather than shipping NaN into a client site.
 */
function reviewBadgeFrom(agg) {
    if (!agg)
        return null;
    const rating = parseFloat(agg.score);
    const count = parseInt(agg.count, 10);
    if (!Number.isFinite(rating) || !Number.isFinite(count))
        return null;
    return { rating, count, url: agg.url ?? "" };
}
/** Non-blank seasons only — PLAN D5/D14: we do not describe a season's service the client
 *  doesn't actually offer, so a season with no body is dropped, not carried through empty. */
function seasonsFrom(seasons) {
    const filled = (seasons ?? []).filter((s) => s.body && s.body.trim());
    return filled.length ? filled.map((s) => ({ key: s.key, label: s.label, body: s.body.trim() })) : null;
}
/** Trimmed, non-blank, de-duplicated (case-insensitively, first spelling kept). */
function cleanList(list) {
    const seen = new Set();
    const out = [];
    for (const raw of list ?? []) {
        const v = (raw ?? "").trim();
        if (!v || seen.has(v.toLowerCase()))
            continue;
        seen.add(v.toLowerCase());
        out.push(v);
    }
    return out;
}
function cleanQuestions(list) {
    return (list ?? [])
        .filter((x) => x && x.q && x.q.trim())
        .map((x) => ({ q: x.q.trim(), a: (x.a ?? "").trim() }));
}
/**
 * v1.32.0: the per-service facts, mapped. Returns the ServiceItems, the job photos as
 * work.projects tagged to their service, the questions (per-service ones tagged), the brands to
 * union into brandsCarried, and the missing_fields paths for the two core facts.
 *
 * A service's slug is written only when something is tagged to it (a photo or a question), per
 * service-page-spec.md §2: stored once, then never re-derived, so a later rename keeps the URL.
 * Areas are kept only when they name a town in the service area (spelled as the area spells it).
 */
function serviceDetailsFrom(serviceList, servicePrices, serviceArea) {
    const areaByLower = new Map(serviceArea.map((a) => [a.toLowerCase(), a]));
    const taken = [];
    const projects = [];
    const questions = [];
    const brands = [];
    const missing = [];
    const items = serviceList.map((s, i) => {
        const included = cleanList(s.included);
        const typicalJobs = cleanList(s.typicalJobs);
        const areas = cleanList(s.areas)
            .map((a) => areaByLower.get(a.toLowerCase()))
            .filter((a) => Boolean(a));
        const serviceBrands = cleanList(s.brands);
        const photos = (s.photos ?? []).filter((p) => p && p.url && p.url.trim());
        const qs = cleanQuestions(s.questions);
        const price = (s.priceFrom ?? "").trim() || (servicePrices?.[s.name] ?? "").trim();
        const duration = (s.duration ?? "").trim();
        if (included.length === 0)
            missing.push(`services.items.${i}.included`);
        if (typicalJobs.length === 0)
            missing.push(`services.items.${i}.typicalJobs`);
        const tagged = photos.length > 0 || qs.length > 0;
        const slug = serviceSlug({ t: s.name }, taken);
        taken.push(slug);
        // Every photo becomes a project tagged to the service (the page's proof block, and the
        // gate's photo fact). The form asks no caption: an uncaptioned photo's caption is the
        // service name, which is true and invented nothing, and is flagged so the console can
        // offer a better one. loc and yr stay blank, never guessed.
        for (const p of photos) {
            const given = (p.alt ?? "").trim();
            if (!given)
                missing.push(`work.projects.${projects.length}.caption`);
            const alt = given || s.name;
            projects.push({
                t: s.name, loc: "", yr: null, scope: s.name, size: "",
                caption: alt, // never empty: it is the photo's alt text
                image: { url: p.url, alt },
                service: slug,
            });
        }
        for (const q of qs)
            questions.push({ ...q, service: slug });
        brands.push(...serviceBrands);
        // Photo 1 is also the service's own picture (cards, page header, related-services
        // thumbnail). It stays a project too, so the gate's photo fact never counts `image`, which
        // can hold an operator's stock picture.
        const first = photos[0];
        const image = first ? { url: first.url, alt: (first.alt ?? "").trim() || s.name } : null;
        return {
            n: String(i + 1).padStart(2, "0"),
            t: s.name,
            d: "",
            tag: s.tag,
            image,
            priceFrom: price || null,
            ...(included.length ? { included } : {}),
            ...(typicalJobs.length ? { typicalJobs } : {}),
            ...(areas.length ? { areas } : {}),
            ...(serviceBrands.length ? { brands: serviceBrands } : {}),
            ...(duration ? { duration } : {}),
            ...(tagged ? { slug } : {}),
        };
    });
    return { items, projects, questions, brands, missing };
}
function profilesFrom(list) {
    const kinds = new Set(PROFILE_KINDS);
    const out = (list ?? [])
        .filter((p) => p && kinds.has(p.kind) && p.url && p.url.trim())
        .map((p) => ({
        kind: p.kind,
        url: p.url.trim(),
        ...(p.label && p.label.trim() ? { label: p.label.trim() } : {}),
    }));
    return out.length ? out : null;
}
const DEFAULT_TYPOGRAPHY = {
    fontSans: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontHeading: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    headingWeight: 700,
    bodyWeight: 400,
    headingTracking: "-0.01em",
    headingLineHeight: 1.2,
};
/** Empty copy fields at the RIGHT cardinality so the copywriter fills them in place. */
function buildScaffold(f, plan) {
    const S = DEFAULT_STRUCTURE;
    const missing = [];
    const flag = (path, ok) => {
        if (!ok)
            missing.push(path);
    };
    flag("brand.tagline", f.tagline && f.tagline.trim());
    flag("brand.phone", f.phone && f.phone.trim());
    flag("brand.email", f.email && f.email.trim());
    flag("brand.address", f.address && f.address.trim());
    flag("brand.license", f.license && f.license.trim());
    flag("brand.established", f.established && f.established.trim());
    // decision 29: the specificity fields. Flagged when blank so the no-inventing rule is visible
    // in the console's Intake checklist rather than silently producing a generic site.
    flag("extensions.serviceArea", f.serviceArea && f.serviceArea.trim());
    flag("extensions.ownerName", f.ownerName && f.ownerName.trim());
    flag("trust.logos", f.brandsCarried && f.brandsCarried.trim());
    flag("extensions.responseTime", f.responseTime && f.responseTime.trim());
    // Flag on the real value. This was hardcoded `true`, so a client who never picked an
    // industry was recorded as having answered — which mattered because the value was being
    // dropped entirely a few lines below, and the flag was the only trace it had been asked.
    flag("business.industry", f.industry && f.industry.trim());
    if (f.serviceList.length === 0)
        missing.push("services.items");
    if (!f.hasLogo)
        missing.push("branding.logo");
    if (!f.images || f.images.heroSlides.length === 0)
        missing.push("images.hero");
    if (!f.existingWebsiteUrl || !f.existingWebsiteUrl.trim())
        missing.push("existingWebsiteUrl");
    // vertical-templates-v1 (PLAN §3.3): flagged on the same "collected from intake, never
    // invented" footing as the decision-29 facts above — an unsupplied slot is a go-live
    // checklist item, not a silent gap, same reasoning as extensions.serviceArea.
    const resolvedStats = statsFrom(f.stats);
    const resolvedReviewBadge = reviewBadgeFrom(f.reviewAggregate);
    const resolvedSeasons = seasonsFrom(f.seasons);
    flag("about.stats", resolvedStats.length > 0);
    flag("extensions.reviewBadge", resolvedReviewBadge !== null);
    flag("about.seasons", resolvedSeasons !== null);
    flag("extensions.offerBadge", f.offerBadge && f.offerBadge.trim());
    flag("extensions.serviceRadiusMiles", f.serviceRadiusMiles && f.serviceRadiusMiles.trim());
    // v1.32.0: per-service facts and the site-wide SEO facts. Every blank one is flagged, whether
    // or not this form version asked it: the console tells "asked, left blank" (flagged) from
    // "never asked" (empty, unflagged) for older clients only by this list, so a NEW mapper must
    // flag unconditionally. Areas and brands are optional per service and are not flagged.
    const siteArea = f.serviceArea && f.serviceArea.trim() ? splitList(f.serviceArea) : [];
    const details = serviceDetailsFrom(f.serviceList, f.servicePrices, siteArea);
    missing.push(...details.missing);
    flag("services.priceFrom", details.items.some((it) => it.priceFrom));
    flag("extensions.serviceAreaBusiness", typeof f.serviceAreaBusiness === "boolean");
    const resolvedProfiles = profilesFrom(f.profiles);
    flag("extensions.profiles", resolvedProfiles !== null);
    const allQuestions = [...cleanQuestions(f.customerQuestions), ...details.questions];
    flag("extensions.customerQuestions", allQuestions.length > 0);
    const brandsCarried = cleanList([...(f.brandsCarried ? splitList(f.brandsCarried) : []), ...details.brands]);
    const serviceLinks = f.serviceList.map((s) => ({ label: s.name, href: "#services" }));
    const seo = {
        title: "",
        description: "",
        canonical: f.existingWebsiteUrl && f.existingWebsiteUrl.trim() ? f.existingWebsiteUrl.trim() : "",
        googleAnalyticsId: null,
        facebookPixelId: null,
    };
    return {
        brand: {
            name: f.brandName,
            short: f.brandShort && f.brandShort.trim() ? f.brandShort : f.brandName,
            long: f.brandName,
            established: orNull(f.established ?? ""),
            // One line: a stray line break from a pasted value becomes a space.
            tagline: (f.tagline ?? "").replace(/\s+/g, " ").trim(),
            phone: formatPhoneDisplay(f.phone),
            phoneHref: phoneHref(f.phone),
            email: f.email,
            address: f.address,
            license: orNull(f.license ?? ""),
            palette: resolvePalette(f.palette),
            typography: DEFAULT_TYPOGRAPHY,
        },
        nav: [
            { label: "About", href: "#about" },
            { label: "Services", href: "#services" },
            { label: "Work", href: "#work" },
            { label: "Reviews", href: "#testimonials" },
            { label: "FAQ", href: "#faq" },
            { label: "Book", href: "#cta" },
        ],
        announcement: orNull(f.announcement ?? ""),
        // Brands carried (decision 29) join notable clients in trust.logos, which is where TrustBadges
        // reads them; the HVAC preset relabels this to "Brands we install". Certifications stay in
        // extensions.trustBadges, as before.
        trust: { label: "Trusted by", logos: cleanList([...splitList(f.notableClients ?? ""), ...brandsCarried]) },
        hero: {
            eyebrow: "",
            headline: "",
            headlineEmphasis: null,
            sub: "",
            formLabel: "Tell us what you need.", // D3, approved word for word (2026-11-10): a neutral placeholder the copywriter overwrites; promises nothing
            placeholder: "Your email address",
            cta: "",
            secondaryCta: "",
            trust: "",
            badge: null,
            frictionReducers: repeat(S.heroFrictionReducers, () => ""),
            heroBullets: repeat(S.heroBullets, () => ({ value: "", label: "" })),
        },
        about: {
            eyebrow: "",
            title: "",
            body: "",
            pillars: repeat(S.pillars, () => ({ k: "", t: "", d: "" })),
            // vertical-templates-v1 (PLAN D4): client-supplied only, never the DEFAULT_STRUCTURE-sized
            // blank repeat the other copy arrays use — a statistic cannot be "written in place" by the
            // copywriter the way an empty FAQ or pillar can.
            stats: resolvedStats,
            seasons: resolvedSeasons,
        },
        services: {
            eyebrow: "",
            title: "",
            sub: "",
            items: details.items,
        },
        // Job photos arrive as projects tagged to their service (service-page-spec.md §4). The work
        // SECTION stays hidden: a photo-only project has no location or year to show there.
        work: { eyebrow: "", title: "", sub: "", projects: details.projects, hidden: true },
        testimonials: {
            eyebrow: "",
            title: "",
            items: repeat(S.testimonials, () => ({ q: "", a: "", r: "", company: null, stars: 5 })),
        },
        faq: {
            eyebrow: "",
            title: "",
            sub: "",
            items: repeat(S.faq, () => ({ q: "", a: "" })),
        },
        finalCta: {
            eyebrow: "",
            headline: "",
            headlineEmphasis: null,
            sub: "",
            cta: "",
            secondary: null,
            frictionReducers: repeat(S.ctaFrictionReducers, () => ""),
        },
        footer: {
            blurb: "",
            cols: [
                ...(serviceLinks.length ? [{ h: "Services", links: serviceLinks }] : []),
                {
                    h: "Company",
                    links: [
                        { label: "About Us", href: "#about" },
                        { label: "Our Work", href: "#work" },
                        { label: "Reviews", href: "#testimonials" },
                        { label: "FAQ", href: "#faq" },
                        { label: "Contact Us", href: "#cta" },
                    ],
                },
            ],
            social: [],
            legalLinks: [],
            legal: "",
        },
        seo,
        extensions: {
            trustBadges: f.certifications && f.certifications.trim() ? splitList(f.certifications) : null,
            reviewBadge: resolvedReviewBadge,
            contactDetails: f.address && f.address.trim() ? { address: f.address, mapsUrl: null } : null,
            hours: f.businessHours && f.businessHours.trim() ? { all: f.businessHours } : null,
            bookingUrl: null,
            portalUrl: null,
            agentName: orNull(f.agentName ?? ""),
            serviceArea: f.serviceArea && f.serviceArea.trim() ? splitList(f.serviceArea) : null,
            ownerName: orNull(f.ownerName ?? ""),
            brandsCarried: brandsCarried.length ? brandsCarried : null,
            responseTime: orNull(f.responseTime ?? ""),
            offerBadge: orNull(f.offerBadge ?? ""),
            serviceRadiusMiles: orNull(f.serviceRadiusMiles ?? ""),
            serviceAreaBusiness: typeof f.serviceAreaBusiness === "boolean" ? f.serviceAreaBusiness : null,
            customerQuestions: allQuestions.length ? allQuestions : null,
            profiles: resolvedProfiles,
        },
        images: {
            hero: {
                portrait: f.images?.heroSlides[0]?.url,
                slides: (f.images?.heroSlides ?? []).map((img) => ({ url: img.url, alt: img.alt })),
            },
            about: { feature: f.images?.aboutFeature?.url },
            testimonials: {},
            footer: { logoImage: f.images?.logo?.url },
        },
        _meta: {
            schema_version: "2.1",
            generated_at: new Date().toISOString(),
            variation: "D",
            is_placeholder: false,
            missing_fields: missing,
            selectedPlan: plan,
            brandDirection: f.brandDirection,
            // The client's own industry pick, carried through to the console.
            //
            // This type has always documented itself as "console maps this to a copywriter
            // VerticalId", but the value was never emitted — so the console couldn't see it and
            // the operator re-picked by hand what the client had already answered. That pick is
            // not cosmetic: it selects BOTH the preset baseline AND the system prompt the model
            // writes under.
            //
            // Emitted verbatim, including "other". Deciding what "other" means is the console's
            // job (fall back to a manual pick); a mapper that silently dropped or normalised it
            // would be making that call invisibly, which is how it got lost the first time.
            ...(f.industry && f.industry.trim() ? { industry: f.industry.trim() } : {}),
            ...(f.existingWebsiteUrl && f.existingWebsiteUrl.trim()
                ? { scrapeExistingWebsite: true, scrapeWebsiteDomain: f.existingWebsiteUrl.trim() }
                : {}),
        },
    };
}
/**
 * Convert a v1.1.0 brand-intake submission into an Intake envelope. Single-site
 * for starter/growth; N-site for enterprise (additional sites inherit typography
 * + footer scaffolding from the primary but carry their own brand/palette/direction).
 */
export function mapBrandIntakeToIntake(sub) {
    const primary = buildScaffold({
        brandName: sub.brandName,
        brandShort: sub.brandShort,
        tagline: sub.tagline,
        industry: sub.industry,
        email: sub.email,
        phone: sub.phone,
        address: sub.address,
        license: sub.license,
        established: sub.established,
        ownerName: sub.ownerName,
        brandsCarried: sub.brandsCarried,
        responseTime: sub.responseTime,
        businessHours: sub.businessHours,
        serviceArea: sub.serviceArea,
        agentName: sub.agentName,
        certifications: sub.certifications,
        notableClients: sub.notableClients,
        announcement: sub.announcement,
        serviceList: sub.serviceList,
        brandDirection: sub.brandDirection,
        palette: sub.palette,
        hasLogo: sub.hasLogo,
        images: sub.images,
        existingWebsiteUrl: sub.existingWebsiteUrl,
        stats: sub.stats,
        reviewAggregate: sub.reviewAggregate,
        servicePrices: sub.servicePrices,
        seasons: sub.seasons,
        serviceRadiusMiles: sub.serviceRadiusMiles,
        offerBadge: sub.offerBadge,
        serviceAreaBusiness: sub.serviceAreaBusiness,
        profiles: sub.profiles,
        customerQuestions: sub.customerQuestions,
    }, sub.selectedPlan);
    const extras = (sub.additionalSites ?? []).filter((a) => a && a.brandName && a.brandName.trim());
    // Carried onto the envelope, not onto any site. Every field of SiteContent is serialized
    // into the generated client repo on public GitHub, and this one is both an operational
    // instruction and a commercial fact, so it belongs beside `smsAlerts` rather than in
    // `_meta`. Spread conditionally so an intake from a pre-activation-step draft stays
    // genuinely absent rather than becoming an explicit `undefined`, which `exactOptionalPropertyTypes`
    // and the console's zod round trip treat differently.
    const receptionist = sub.receptionistMode ? { receptionistMode: sub.receptionistMode } : {};
    if (sub.selectedPlan !== "enterprise" || extras.length === 0) {
        return {
            plan: sub.selectedPlan,
            ...receptionist,
            siteCount: 1,
            sites: [{ ...primary, _meta: { ...primary._meta, siteIndex: 1, siteCount: 1, siblingSlugs: [] } }],
        };
    }
    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const baseSlug = slugify(primary.brand.short || primary.brand.name);
    const siteCount = extras.length + 1;
    const allSlugs = Array.from({ length: siteCount }, (_, i) => `${baseSlug}-${i + 1}`);
    const sites = [
        { ...primary, _meta: { ...primary._meta, siteIndex: 1, siteCount, siblingSlugs: allSlugs.slice(1) } },
        ...extras.map((entry, i) => {
            const site = buildScaffold({
                brandName: entry.brandName,
                brandShort: entry.brandShort,
                email: entry.email,
                phone: entry.phone,
                address: entry.address,
                businessHours: entry.businessHours,
                serviceList: entry.serviceList,
                brandDirection: entry.brandDirection,
                palette: entry.palette,
                // Additional sites inherit fact defaults not collected per-site.
                established: sub.established,
                ownerName: sub.ownerName,
                brandsCarried: sub.brandsCarried,
                responseTime: sub.responseTime,
                serviceArea: sub.serviceArea,
                agentName: sub.agentName,
                certifications: sub.certifications,
                notableClients: sub.notableClients,
                hasLogo: sub.hasLogo,
                images: { heroSlides: [] },
                existingWebsiteUrl: "",
                stats: sub.stats,
                reviewAggregate: sub.reviewAggregate,
                servicePrices: sub.servicePrices,
                seasons: sub.seasons,
                serviceRadiusMiles: sub.serviceRadiusMiles,
                offerBadge: sub.offerBadge,
                // v1.32.0: a business-level fact, inherited. Profiles and general questions are per brand,
                // so an additional site gets none (flagged missing) rather than the primary's.
                serviceAreaBusiness: sub.serviceAreaBusiness,
            }, "enterprise");
            return {
                ...site,
                _meta: {
                    ...site._meta,
                    siteIndex: i + 2,
                    siteCount,
                    siblingSlugs: allSlugs.filter((_, j) => j !== i + 1),
                },
            };
        }),
    ];
    return { plan: "enterprise", ...receptionist, siteCount, sites };
}
//# sourceMappingURL=brand-intake.js.map