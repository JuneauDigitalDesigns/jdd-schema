/**
 * What the onboarding wizard OFFERS a client, per industry.
 *
 * The wizard used to be ~30 blank inputs. A service-business owner opening it had to invent
 * their own services, describe their own differentiators and articulate their own tone from
 * nothing — which is a writing assignment, not an onboarding form. This is the material that
 * lets them click instead: chips they recognise, with free text kept as an escape hatch
 * rather than the only route.
 *
 * ── Seeded from the console's VERTICAL_PRESETS, then widened ─────────────────
 *
 * Those six preset sites carry real, well-written services, and they are where these lists
 * started. But a preset shows exactly six services because that is what fits a demo page,
 * and an actual plumber offers more than six things. So each menu is curated beyond its
 * preset: the preset entries are the spine, the rest fill in what a real business in that
 * trade would also want listed.
 *
 * They deliberately are NOT generated from VERTICAL_PRESETS at build time. That would keep
 * them in sync at the cost of pinning every client to one demo page's idea of the trade,
 * and the whole point is to offer more than any single example site shows.
 *
 * ── This module holds no colours ────────────────────────────────────────────
 *
 * Palette recommendations live on the presets themselves (`verticals` on PRESET_DEFS, read
 * via `palettesForVertical`), NOT as a `paletteIds` array here. One relationship expressed
 * in two places is the drift pattern that has already produced real bugs in this codebase —
 * five copies of `toE164`, four of the Vercel host transform, each pair quietly disagreeing.
 * The relationship is "this palette suits these trades", so it lives with the palette.
 */
/**
 * Tone options, shared across every industry.
 *
 * Not per-industry on purpose: how a business wants to sound is a choice about them, not
 * about their trade. A plumber can be warm or clinical, and offering "friendly" only to
 * health businesses would quietly make that decision for them.
 *
 * This one picker replaces the wizard's three overlapping questions — `vibe` chips, `tone`
 * chips and free-text `adjectives` — which all collapsed into the same paragraph of the
 * copywriter prompt anyway.
 */
export const VOICE_OPTIONS = [
    "Friendly",
    "Straight-talking",
    "Professional",
    "Warm",
    "Confident",
    "Reassuring",
    "No-nonsense",
    "Local and personal",
    "Premium",
    "Approachable",
];
/**
 * Differentiators that apply to almost any local trade.
 *
 * Merged into every industry's own list rather than repeated in each, so adding "Financing
 * available" is one edit instead of six.
 */
const COMMON_DIFFERENTIATORS = [
    "Licensed and insured",
    "Free estimates",
    "Upfront pricing, no surprises",
    "Family-owned and operated",
    "Same-day service",
    "Satisfaction guaranteed",
    "Financing available",
    "Locally owned",
];
const COMMON_CUSTOMERS = [
    "Homeowners",
    "Property managers",
    "Small businesses",
    "Commercial clients",
    "New construction",
];
/** Industry menus, keyed by the same ids the console uses as VerticalId. */
export const INDUSTRY_MENUS = [
    {
        id: "hvac",
        label: "HVAC / Heating & Cooling",
        services: [
            { label: "Furnace Repair & Replacement", tag: "Heating" },
            { label: "AC Installation & Service", tag: "Cooling" },
            { label: "Heat Pump Installation", tag: "Heat Pump" },
            { label: "Maintenance Plans", tag: "Maintenance" },
            { label: "Duct Cleaning & Sealing", tag: "Air Quality" },
            { label: "24/7 Emergency Service", tag: "Emergency" },
            { label: "Thermostat Installation", tag: "Controls" },
            { label: "Indoor Air Quality", tag: "Air Quality" },
            { label: "Boiler Service", tag: "Heating" },
            { label: "Mini-Split Systems", tag: "Cooling" },
            { label: "Commercial HVAC", tag: "Commercial" },
            { label: "Energy Efficiency Audits", tag: "Efficiency" },
        ],
        differentiators: [
            "24/7 emergency callouts",
            "Manufacturer-certified technicians",
            "Price-lock guarantee",
            "Financing on new systems",
        ],
        customers: ["Homeowners with aging systems", "Landlords and property managers"],
    },
    {
        id: "roofing",
        label: "Roofing",
        services: [
            { label: "Roof Replacement", tag: "Replacement" },
            { label: "Storm Damage Repair", tag: "Storm Repair" },
            { label: "Roof Inspection", tag: "Inspection" },
            { label: "Gutter Installation", tag: "Gutters" },
            { label: "Flat Roofing", tag: "Commercial" },
            { label: "Emergency Tarping", tag: "Emergency" },
            { label: "Shingle Repair", tag: "Repairs" },
            { label: "Metal Roofing", tag: "Metal" },
            { label: "Skylight Installation", tag: "Skylights" },
            { label: "Siding", tag: "Exterior" },
            { label: "Insurance Claim Assistance", tag: "Claims" },
        ],
        differentiators: [
            "We handle the insurance claim for you",
            "Workmanship warranty",
            "Free drone roof inspection",
            "Storm response within 24 hours",
        ],
        customers: ["Homeowners after a storm", "Commercial property owners"],
    },
    {
        id: "plumbing",
        label: "Plumbing",
        services: [
            { label: "Leak Detection & Repair", tag: "Repairs" },
            { label: "Drain Clearing", tag: "Drains" },
            { label: "Water Heater Services", tag: "Water Heater" },
            { label: "Emergency Plumbing", tag: "Emergency" },
            { label: "Pipe Installation", tag: "Installation" },
            { label: "Bathroom & Kitchen Remodel", tag: "Remodel" },
            { label: "Sewer Line Repair", tag: "Sewer" },
            { label: "Repiping", tag: "Repiping" },
            { label: "Water Filtration", tag: "Filtration" },
            { label: "Sump Pumps", tag: "Sump Pump" },
            { label: "Gas Line Services", tag: "Gas" },
            { label: "Backflow Testing", tag: "Testing" },
        ],
        differentiators: [
            "24/7 emergency callouts",
            "Flat-rate pricing before we start",
            "Clean-up included",
            "No overtime charges",
        ],
        customers: ["Homeowners", "Restaurants and food service"],
    },
    {
        id: "lawn-care",
        label: "Lawn Care / Landscaping",
        services: [
            { label: "Lawn Mowing", tag: "Maintenance" },
            { label: "Fertilization", tag: "Treatments" },
            { label: "Weed Control & Treatments", tag: "Weed Control" },
            { label: "Core Aeration", tag: "Aeration" },
            { label: "Leaf Removal", tag: "Seasonal" },
            { label: "Landscape Edging", tag: "Detail" },
            { label: "Mulching", tag: "Beds" },
            { label: "Hedge & Shrub Trimming", tag: "Trimming" },
            { label: "Seasonal Cleanups", tag: "Seasonal" },
            { label: "Irrigation & Sprinklers", tag: "Irrigation" },
            { label: "Snow Removal", tag: "Winter" },
            { label: "Landscape Design", tag: "Design" },
        ],
        differentiators: [
            "Recurring plans, no contracts",
            "Same crew every visit",
            "Pet- and child-safe treatments",
            "Text-ahead arrival notice",
        ],
        customers: ["Homeowners", "HOAs and communities"],
    },
    {
        id: "car-detailing",
        label: "Car Detailing / Auto",
        services: [
            { label: "Interior Detailing", tag: "Interior" },
            { label: "Exterior Hand Wash", tag: "Exterior" },
            { label: "Ceramic Coating", tag: "Protection" },
            { label: "Paint Correction", tag: "Correction" },
            { label: "Engine Bay Detailing", tag: "Engine Bay" },
            { label: "Mobile Service", tag: "Mobile" },
            { label: "Headlight Restoration", tag: "Restoration" },
            { label: "Odor Removal", tag: "Interior" },
            { label: "Paint Protection Film", tag: "Protection" },
            { label: "Fleet Detailing", tag: "Fleet" },
            { label: "Pre-Sale Detail", tag: "Resale" },
        ],
        differentiators: [
            "We come to you",
            "Before-and-after photos every time",
            "Only pH-neutral products",
            "Satisfaction guaranteed or we redo it",
        ],
        customers: ["Car enthusiasts", "Dealerships and fleets", "Everyday drivers"],
    },
    {
        id: "health",
        label: "Health & Wellness",
        services: [
            { label: "Initial Wellness Consultation", tag: "Consultation" },
            { label: "Personalized Care Plans", tag: "Planning" },
            { label: "Ongoing Wellness Support", tag: "Support" },
            { label: "Lifestyle & Nutrition Guidance", tag: "Lifestyle" },
            { label: "Stress & Recovery Sessions", tag: "Recovery" },
            { label: "Virtual & In-Person Visits", tag: "Telehealth" },
            { label: "Group Programs", tag: "Groups" },
            { label: "Corporate Wellness", tag: "Corporate" },
            { label: "Movement & Mobility", tag: "Movement" },
            { label: "Sleep Support", tag: "Sleep" },
        ],
        differentiators: [
            "First consultation is free",
            "Evening and weekend availability",
            "Virtual visits available",
            "Plans tailored to you, not a template",
        ],
        customers: ["Busy professionals", "Anyone starting a health journey", "Employers"],
    },
];
/**
 * The menu for an industry, or `null` when there isn't one.
 *
 * `null` is the signal for the wizard's free-text fallback — a client who picks "Other" gets
 * the same steps with plain inputs instead of chips. Returning an empty menu instead would
 * render a step offering nothing, which reads as broken rather than as "describe it yourself".
 */
export function menuFor(industry) {
    if (!industry)
        return null;
    return INDUSTRY_MENUS.find((m) => m.id === industry) ?? null;
}
/** An industry's own differentiators plus the ones that apply to any local trade. */
export function differentiatorsFor(industry) {
    const menu = menuFor(industry);
    return menu ? [...menu.differentiators, ...COMMON_DIFFERENTIATORS] : [...COMMON_DIFFERENTIATORS];
}
/** An industry's own customer types plus the common ones. */
export function customersFor(industry) {
    const menu = menuFor(industry);
    return menu ? [...menu.customers, ...COMMON_CUSTOMERS] : [...COMMON_CUSTOMERS];
}
/**
 * Join selected chips and any free text into one line.
 *
 * The wizard collects structure but `BrandDirection.differentiators` and `.targetCustomer`
 * are strings that flow into `brandDirectionToDetails` and on into the copywriter prompt.
 * Joining here rather than changing those fields means nothing downstream has to change —
 * the prompt, the mapper and the console all keep working untouched.
 */
export function joinChoices(selected, freeText) {
    const parts = [...selected.map((s) => s.trim()).filter(Boolean)];
    const extra = (freeText ?? "").trim();
    if (extra)
        parts.push(extra);
    return parts.join(". ");
}
//# sourceMappingURL=industry-menu.js.map