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
// ─── helpers ──────────────────────────────────────────────────────────────────
function splitList(value) {
    return (value || "")
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
}
function phoneHrefFor(phone) {
    const digits = (phone || "").replace(/[^\d+]/g, "");
    return digits ? `tel:${digits}` : "";
}
function orNull(value) {
    return value && value.trim() ? value : null;
}
function repeat(n, make) {
    return Array.from({ length: n }, make);
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
            tagline: "",
            phone: f.phone,
            phoneHref: phoneHrefFor(f.phone),
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
        trust: { label: "Trusted by", logos: splitList([f.notableClients, f.brandsCarried].filter((x) => x && x.trim()).join("\n")) },
        hero: {
            eyebrow: "",
            headline: "",
            headlineEmphasis: null,
            sub: "",
            formLabel: "Get a free estimate — we'll reach out same day.",
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
            stats: repeat(S.stats, () => ({ n: "", l: "" })),
        },
        services: {
            eyebrow: "",
            title: "",
            sub: "",
            items: f.serviceList.map((s, i) => ({
                n: String(i + 1).padStart(2, "0"),
                t: s.name,
                d: "",
                tag: s.tag,
                image: null,
            })),
        },
        work: { eyebrow: "", title: "", sub: "", projects: [], hidden: true },
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
            reviewBadge: null,
            contactDetails: f.address && f.address.trim() ? { address: f.address, mapsUrl: null } : null,
            hours: f.businessHours && f.businessHours.trim() ? { all: f.businessHours } : null,
            bookingUrl: null,
            portalUrl: null,
            agentName: orNull(f.agentName ?? ""),
            serviceArea: f.serviceArea && f.serviceArea.trim() ? splitList(f.serviceArea) : null,
            ownerName: orNull(f.ownerName ?? ""),
            brandsCarried: f.brandsCarried && f.brandsCarried.trim() ? splitList(f.brandsCarried) : null,
            responseTime: orNull(f.responseTime ?? ""),
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
    }, sub.selectedPlan);
    const extras = (sub.additionalSites ?? []).filter((a) => a && a.brandName && a.brandName.trim());
    if (sub.selectedPlan !== "enterprise" || extras.length === 0) {
        return {
            plan: sub.selectedPlan,
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
    return { plan: "enterprise", siteCount, sites };
}
//# sourceMappingURL=brand-intake.js.map