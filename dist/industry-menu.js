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
            // Suggestions, approved word for word by Xander, one trade per batch:
            // - batch 1 (v1.33.0): AC, and Furnace's included and jobs lists, on the onboarding copy deck
            //   approved "as drafted", 2026-11-10;
            // - batch 2 (v1.33.1): the other ten services and Furnace's questions, "Approve all as
            //   drafted", 2026-11-10. HVAC is complete. test/fixtures/hvac-suggestions-approved.json pins it.
            {
                label: "Furnace Repair & Replacement", tag: "Heating",
                included: [
                    "Safety inspection", "Carbon monoxide check", "Repairs on all brands", "Igniter and flame sensor", "Blower motor repair",
                    "Removal of the old furnace", "Permit and inspection", "Heat exchanger check", "Thermostat check", "Filter change", "Startup and testing",
                ],
                jobs: [
                    "No heat", "Furnace won't turn on", "Burning smell", "Strange noises", "Turns on and off a lot",
                    "High gas bills", "Pilot light keeps going out", "Carbon monoxide alarm", "Furnace over 15 years old",
                ],
                questions: [
                    "Should I repair or replace my furnace?", "How long does a new furnace take to put in?",
                    "What size furnace does my home need?", "Is my furnace safe to keep running?",
                    "Do you service all brands?", "How soon can you come out?",
                ],
            },
            {
                label: "AC Installation & Service", tag: "Cooling",
                included: [
                    "Sizing for your home", "Removal of the old unit", "Permit and inspection", "New thermostat",
                    "Refrigerant line set", "Startup and testing", "Warranty registration", "Repairs on all brands", "Diagnostic visit",
                ],
                jobs: [
                    "AC blowing warm air", "AC won't turn on", "Water leaking from the unit", "Ice on the lines",
                    "Loud or strange noises", "High electric bills", "Some rooms too hot", "System over 10 years old",
                ],
                questions: [
                    "Should I repair or replace my AC?", "How long does a new AC take to put in?", "What size AC does my home need?",
                    "Do you service all brands?", "How soon can you come out?", "Do you offer financing?",
                ],
            },
            {
                label: "Heat Pump Installation", tag: "Heat Pump",
                included: [
                    "Sizing for your home", "Removal of the old system", "Permit and inspection", "New thermostat",
                    "Refrigerant line set", "Electrical hookup", "Pad or wall bracket", "Startup and testing",
                    "Warranty registration", "Rebate paperwork", "Repairs on all brands",
                ],
                jobs: [
                    "Heat pump not heating", "Heat pump not cooling", "Ice on the outdoor unit", "Runs all the time",
                    "Blowing cold air in winter", "Loud or strange noises", "High electric bills",
                    "Want to switch from gas or oil", "Old system needs replacing",
                ],
                questions: [
                    "Does a heat pump work when it's very cold?", "Can a heat pump replace my furnace?",
                    "What size heat pump does my home need?", "Should I repair or replace my heat pump?",
                    "Are there rebates for heat pumps?", "How long does a new heat pump take to put in?",
                ],
            },
            {
                label: "Maintenance Plans", tag: "Maintenance",
                included: [
                    "Spring and fall tune-ups", "Filter change", "Coil cleaning", "Drain line flush",
                    "Refrigerant level check", "Electrical and safety check", "Thermostat check", "Priority scheduling",
                    "Reminder before each visit", "Written report after each visit", "Covers all brands",
                ],
                jobs: [
                    "Haven't had a tune-up in years", "Want fewer breakdowns", "New system to keep up",
                    "Warranty needs yearly service", "Want lower energy bills", "Rental properties to keep up",
                    "Older system to keep running",
                ],
                questions: [
                    "How often should my system be serviced?", "What's included in a tune-up?",
                    "Do I need a plan to keep my warranty?", "Does the plan cover repairs?",
                    "Does it cover heating and cooling?", "Can I cancel anytime?",
                ],
            },
            {
                label: "Duct Cleaning & Sealing", tag: "Air Quality",
                included: [
                    "Supply and return duct cleaning", "Vent and register cleaning", "Blower cleaning",
                    "Before and after photos", "Duct sealing", "Leak testing", "Duct insulation", "Repair of damaged ducts",
                    "Dryer vent cleaning", "Filter change",
                ],
                jobs: [
                    "Dust everywhere", "Musty smell from the vents", "Weak airflow", "Some rooms too hot or cold",
                    "Just finished a remodel", "Just moved in", "Allergies acting up", "Pests in the ducts",
                    "High energy bills",
                ],
                questions: [
                    "How often should ducts be cleaned?", "How long does duct cleaning take?",
                    "Will it make a mess in my home?", "Do I need to be home?", "Will sealing my ducts lower my bills?",
                    "Can you show me what you found?",
                ],
            },
            {
                label: "24/7 Emergency Service", tag: "Emergency",
                included: [
                    "Nights, weekends and holidays", "Diagnostic visit", "Repairs on all brands",
                    "Common parts on the truck", "Safety check", "Price before work starts",
                    "Temporary fix while parts come in",
                ],
                jobs: [
                    "No heat", "No AC", "Burning smell", "Carbon monoxide alarm", "Water leaking from the unit",
                    "System won't turn on", "Breaker keeps tripping", "Loud banging noise",
                ],
                questions: [
                    "Can you come out tonight?", "Do you charge more after hours?", "How soon can you get here?",
                    "What should I do until you arrive?", "Do you work weekends and holidays?", "Do you service all brands?",
                ],
            },
            {
                label: "Thermostat Installation", tag: "Controls",
                included: [
                    "Smart thermostat setup", "Programmable thermostat", "Wi-Fi and app setup", "Compatibility check",
                    "Wiring check", "New thermostat wire if needed", "Removal of the old thermostat", "Schedule setup",
                    "Zoning controls", "Walkthrough of how to use it",
                ],
                jobs: [
                    "Thermostat screen is blank", "System ignores the thermostat", "Wrong temperature reading",
                    "Thermostat keeps resetting", "Want a smart thermostat", "Want to control it from my phone",
                    "Upstairs and downstairs never match",
                ],
                questions: [
                    "Will a smart thermostat work with my system?", "Can you install one I already bought?",
                    "Do I need a new wire for a smart thermostat?", "Can I control it from my phone?",
                    "How long does it take to put in?",
                ],
            },
            {
                label: "Indoor Air Quality", tag: "Air Quality",
                included: [
                    "Air quality check", "Whole-home air purifier", "UV light", "Whole-home humidifier",
                    "Whole-home dehumidifier", "Better air filters", "Fresh air ventilation", "Duct cleaning",
                    "Filter change",
                ],
                jobs: [
                    "Allergies acting up", "Dust everywhere", "Musty smell", "Air feels too dry", "Too humid inside",
                    "Mold near the vents", "Stuffy rooms", "Pet hair and odors", "Someone at home has asthma",
                ],
                questions: [
                    "Will an air purifier help my allergies?", "What filter should I use?",
                    "How often should I change my filter?", "Do UV lights help?", "Can you test the air in my home?",
                    "Do I need a humidifier or a dehumidifier?",
                ],
            },
            {
                label: "Boiler Service", tag: "Heating",
                included: [
                    "Safety inspection", "Carbon monoxide check", "Repairs on all brands", "Burner cleaning",
                    "Pressure and valve check", "Circulator pump repair", "Radiator bleeding", "Expansion tank check",
                    "Removal of the old boiler", "Permit and inspection", "Startup and testing",
                ],
                jobs: [
                    "No heat", "No hot water", "Radiators stay cold", "Boiler leaking", "Banging or gurgling pipes",
                    "Pilot light keeps going out", "Pressure too high or too low", "Carbon monoxide alarm",
                    "High gas or oil bills",
                ],
                questions: [
                    "Should I repair or replace my boiler?", "How often should a boiler be serviced?",
                    "Why are some radiators cold?", "Do you work on gas and oil boilers?", "How soon can you come out?",
                    "Do you offer financing?",
                ],
            },
            {
                label: "Mini-Split Systems", tag: "Cooling",
                included: [
                    "Sizing for each room", "Indoor and outdoor units", "Wall or ceiling mounting", "Refrigerant line set",
                    "Electrical hookup", "Condensate drain line", "Remote or app setup", "Permit and inspection",
                    "Startup and testing", "Filter and coil cleaning", "Repairs on all brands",
                ],
                jobs: [
                    "Room with no ductwork", "Garage or addition to heat or cool", "One room always too hot",
                    "Mini-split not cooling", "Water dripping from the indoor unit", "Blinking lights on the unit",
                    "Bad smell when it runs", "Window units to replace", "Remote not working",
                ],
                questions: [
                    "Do I need ductwork for a mini-split?", "How many indoor units do I need?",
                    "Can one system heat and cool?", "Where does the indoor unit go?", "How do I clean the filters?",
                    "Do you service all brands?",
                ],
            },
            {
                label: "Commercial HVAC", tag: "Commercial",
                included: [
                    "Rooftop units", "Split systems", "Preventive maintenance", "Repairs on all brands",
                    "Service after hours", "Building controls", "Make-up air units", "Replacement planning",
                    "Permit and inspection", "Written report after each visit", "Service for more than one site",
                ],
                jobs: [
                    "Rooftop unit down", "Office too hot", "Store too cold", "Tenants complaining",
                    "Water leaking from the ceiling", "High utility bills", "Need a maintenance contract",
                    "Failed inspection", "Equipment near the end of its life",
                ],
                questions: [
                    "Do you work after hours?", "Do you offer maintenance contracts?", "Do you service rooftop units?",
                    "Can you handle more than one location?", "How fast can you respond to a call?",
                    "Do you carry commercial insurance?",
                ],
            },
            {
                label: "Energy Efficiency Audits", tag: "Efficiency",
                included: [
                    "Whole-home walkthrough", "Blower door test", "Duct leak testing", "Infrared camera scan",
                    "Insulation check", "Air leak check", "Equipment efficiency check", "Written report",
                    "Upgrade recommendations", "Rebate paperwork",
                ],
                jobs: [
                    "High energy bills", "Drafty rooms", "Some rooms too hot or cold", "Home hard to heat",
                    "Home hard to cool", "Planning to replace my system", "Want to use less energy",
                    "Buying or selling a home",
                ],
                questions: [
                    "What happens during an energy audit?", "How long does an audit take?", "Will it lower my bills?",
                    "Are there rebates for upgrades?", "Do I get a written report?", "Do I need to be home?",
                ],
            },
        ],
        differentiators: [
            "24/7 emergency callouts",
            "Manufacturer-certified technicians",
            "Price-lock guarantee",
            "Financing on new systems",
        ],
        customers: ["Homeowners with aging systems", "Landlords and property managers"],
        templateSlots: {
            stats: [
                { key: "emergencyAvailability", prompt: "What's your emergency availability?", example: "24/7" },
                { key: "yearsTrading", prompt: "How many years have you been in business?", example: "18+" },
                { key: "rating", prompt: "Your average review rating and count", example: "4.9★ from 180+ reviews" },
                { key: "coverageTowns", prompt: "How many towns or cities do you cover?", example: "12" },
            ],
            reviewAggregate: true,
            hoursPerDay: false,
            priceFrom: false,
            seasons: null,
            serviceRadius: false,
            offerBadge: false,
        },
    },
    {
        id: "roofing",
        label: "Roofing",
        services: [
            // Suggestions: approved word for word by Xander, "Approve all as drafted", 2026-11-10 (v1.33.2).
            // test/fixtures/trade-suggestions-approved.json pins them.
            {
                label: "Roof Replacement", tag: "Replacement",
                included: [
                    "Roof inspection before the quote", "Removal of the old roof", "Deck repair where needed",
                    "Underlayment", "Ice and water shield", "Drip edge and flashing", "Ridge vents", "New shingles",
                    "Permit and inspection", "Cleanup and nail sweep", "Haul away of old materials",
                ],
                jobs: [
                    "Roof is leaking", "Missing or curling shingles", "Granules in the gutters", "Sagging roof",
                    "Light through the attic boards", "Moss or rot on the roof", "Roof near the end of its life",
                    "Selling my home", "Insurance asked for a new roof",
                ],
                questions: [
                    "Should I repair or replace my roof?", "How long does a new roof take?", "Can you go over my old roof?",
                    "What roofing materials do you use?", "Do I need to be home?", "Do you offer financing?",
                ],
            },
            {
                label: "Storm Damage Repair", tag: "Storm Repair",
                included: [
                    "Roof inspection after the storm", "Photos of the damage", "Emergency tarping", "Shingle replacement",
                    "Flashing repair", "Gutter repair", "Vent and pipe boot repair", "Help with your insurance claim",
                    "Cleanup of debris",
                ],
                jobs: [
                    "Shingles blown off", "Hail damage", "Tree fell on the roof", "Leak after a storm",
                    "Water stain on the ceiling", "Dented gutters or vents", "Insurance adjuster coming out",
                    "Neighbors getting new roofs",
                ],
                questions: [
                    "Is my roof damaged after the storm?", "Will insurance cover my roof?",
                    "Can you meet my insurance adjuster?", "How soon can you look at it?",
                    "What should I do until it's fixed?", "Do I have to pay before insurance pays?",
                ],
            },
            {
                label: "Roof Inspection", tag: "Inspection",
                included: [
                    "Full roof walk", "Attic check", "Flashing and vent check", "Gutter check", "Photos of what we find",
                    "Written report", "Repair recommendations", "Estimate of roof life left",
                ],
                jobs: [
                    "Buying or selling a home", "Insurance asked for an inspection", "Roof is getting older",
                    "After a big storm", "Water spots on the ceiling", "Before adding solar panels", "Want peace of mind",
                ],
                questions: [
                    "What do you check during an inspection?", "How long does an inspection take?",
                    "Do I get a written report?", "Do I need to be home?", "Will you get up on the roof?",
                    "Can you inspect for a home sale?",
                ],
            },
            {
                label: "Gutter Installation", tag: "Gutters",
                included: [
                    "Seamless gutters", "Downspouts", "Gutter guards", "Removal of old gutters", "Fascia repair",
                    "Color matching", "Hangers and brackets", "Downspout extensions", "Gutter cleaning", "Gutter repair",
                ],
                jobs: [
                    "Gutters overflowing", "Gutters pulling away", "Water pooling by the house", "Leaking seams",
                    "Clogged downspouts", "Basement getting wet", "Rotting fascia", "Tired of cleaning gutters",
                ],
                questions: [
                    "Do I need gutter guards?", "What size gutters do I need?", "Can you match my house color?",
                    "How long does gutter install take?", "Do you clean gutters too?", "Can you fix my gutters instead?",
                ],
            },
            {
                label: "Flat Roofing", tag: "Commercial",
                included: [
                    "Roof inspection", "TPO roofing", "EPDM rubber roofing", "Modified bitumen", "Roof coating",
                    "Leak repair", "Drain and scupper repair", "Insulation", "Flashing repair", "Removal of the old roof",
                ],
                jobs: [
                    "Water ponding on the roof", "Leak in the building", "Blisters or cracks", "Seams pulling apart",
                    "Roof coating worn out", "Clogged roof drains", "High cooling bills", "Roof near the end of its life",
                ],
                questions: [
                    "Should I repair, coat or replace my flat roof?", "What flat roof material is best?",
                    "How long does a flat roof last?", "Can you work while we stay open?",
                    "Do you work on commercial buildings?", "Do you offer maintenance?",
                ],
            },
            {
                label: "Emergency Tarping", tag: "Emergency",
                included: [
                    "Tarp over the damaged area", "Tarp secured against wind", "Photos for your insurance", "Debris removal",
                    "Interior leak check", "Repair quote after", "Nights and weekends",
                ],
                jobs: [
                    "Roof leaking right now", "Tree on the roof", "Shingles torn off in a storm", "Hole in the roof",
                    "Water coming through the ceiling", "Fire damage",
                ],
                questions: [
                    "Can you come out today?", "How long can a tarp stay on?", "Will insurance pay for the tarp?",
                    "What should I do until you get here?", "Do you work nights and weekends?",
                ],
            },
            {
                label: "Shingle Repair", tag: "Repairs",
                included: [
                    "Replacing missing shingles", "Shingle matching", "Flashing repair", "Pipe boot replacement",
                    "Vent repair", "Sealing around chimneys", "Leak tracing", "Small deck repairs", "Roof inspection",
                ],
                jobs: [
                    "A few shingles missing", "Small leak", "Shingle flapping in the wind", "Leak around the chimney",
                    "Leak around a vent pipe", "Water stain on the ceiling", "Nail pops", "Cracked or curling shingles",
                ],
                questions: [
                    "Can you match my shingles?", "Should I repair or replace my roof?", "Can you find where the leak is?",
                    "How soon can you come out?", "Do you do small repairs?", "Do you charge to come look?",
                ],
            },
            {
                label: "Metal Roofing", tag: "Metal",
                included: [
                    "Standing seam metal", "Metal shingles", "Removal of the old roof", "Underlayment", "Trim and flashing",
                    "Snow guards", "Color choice", "Ridge vent", "Metal roof repair", "Cleanup and haul away",
                ],
                jobs: [
                    "Want a roof that lasts longer", "Tired of replacing shingles", "Leaking metal roof",
                    "Loose screws or panels", "Rust spots", "Noisy roof in the wind", "Building a barn or shed",
                    "High cooling bills",
                ],
                questions: [
                    "Is metal roofing worth the cost?", "Is a metal roof loud in the rain?",
                    "Can metal go over my shingles?", "What colors can I pick?",
                    "How long does a metal roof take to put on?", "Does a metal roof attract lightning?",
                ],
            },
            {
                label: "Skylight Installation", tag: "Skylights",
                included: [
                    "New skylights", "Skylight replacement", "Flashing kit", "Leak repair", "Interior drywall finish",
                    "Sun tunnels", "Venting skylights", "Blinds or shades", "Removal of the old skylight",
                ],
                jobs: [
                    "Skylight is leaking", "Fogged or cracked glass", "Dark room needs light", "Old skylight to replace",
                    "Getting a new roof", "Room gets too hot",
                ],
                questions: [
                    "Will a skylight leak?", "Can you add a skylight with my new roof?", "What's a sun tunnel?",
                    "Can a skylight open for fresh air?", "Do I need a permit?", "How long does it take to put in?",
                ],
            },
            {
                label: "Siding", tag: "Exterior",
                included: [
                    "Vinyl siding", "Fiber cement siding", "Wood siding repair", "Removal of old siding", "House wrap",
                    "Trim and soffit", "Fascia", "Window and door trim", "Color matching", "Cleanup and haul away",
                ],
                jobs: [
                    "Cracked or loose siding", "Siding blown off in a storm", "Rot or soft spots", "Faded siding",
                    "Peeling paint", "Drafty rooms", "Pests getting in", "Selling my home",
                ],
                questions: [
                    "Which siding is best for my home?", "Can you replace just one section?",
                    "Can you match my current siding?", "How long does new siding take?", "Do you do soffit and fascia too?",
                    "Do you offer financing?",
                ],
            },
            {
                label: "Insurance Claim Assistance", tag: "Claims",
                included: [
                    "Roof inspection", "Photos of the damage", "Written damage report", "Meeting your adjuster",
                    "Help with claim paperwork", "Repair estimate for insurance", "Updates while your claim is open",
                ],
                jobs: [
                    "Storm damaged my roof", "Hail hit my area", "Not sure if I have a claim", "Adjuster coming out",
                    "Claim was denied", "Insurance payout seems low",
                ],
                questions: [
                    "Is my roof damage covered?", "Should I call my insurance first?", "Can you meet the adjuster?",
                    "What if my claim is denied?", "Do I still pay my deductible?", "How long does a claim take?",
                ],
            },
        ],
        differentiators: [
            "We handle the insurance claim for you",
            "Workmanship warranty",
            "Free drone roof inspection",
            "Storm response within 24 hours",
        ],
        customers: ["Homeowners after a storm", "Commercial property owners"],
        templateSlots: {
            stats: [
                { key: "roofsReplaced", prompt: "How many roofs have you replaced?", example: "500+" },
                { key: "warrantyYears", prompt: "How many years is your workmanship warranty?", example: "30 yr" },
                { key: "rating", prompt: "Your average review rating and count", example: "4.9★ from 211 reviews" },
                { key: "typicalJobDays", prompt: "How many days does a typical job take?", example: "1 to 2" },
            ],
            reviewAggregate: true,
            hoursPerDay: false,
            priceFrom: false,
            seasons: null,
            serviceRadius: false,
            offerBadge: false,
        },
    },
    {
        id: "plumbing",
        label: "Plumbing",
        services: [
            // Suggestions: approved word for word by Xander, "Approve all as drafted", 2026-11-10 (v1.33.2).
            // test/fixtures/trade-suggestions-approved.json pins them.
            {
                label: "Leak Detection & Repair", tag: "Repairs",
                included: [
                    "Leak tracing", "Pipe repair", "Fixture repair", "Slab leak detection", "Moisture check",
                    "Water pressure test", "Shutoff valve repair", "Drywall access", "Diagnostic visit",
                ],
                jobs: [
                    "Water bill went up", "Water spot on the ceiling", "Sound of running water", "Wet floor or carpet",
                    "Mold or musty smell", "Low water pressure", "Warm spot on the floor", "Leak under the sink",
                    "Toilet keeps running",
                ],
                questions: [
                    "How do you find a hidden leak?", "Will you have to cut into my walls?",
                    "Can a leak raise my water bill?", "How soon can you come out?", "Do you work with insurance?",
                    "Can you fix it on the same visit?",
                ],
            },
            {
                label: "Drain Clearing", tag: "Drains",
                included: [
                    "Sink drains", "Tub and shower drains", "Toilet clogs", "Main line clearing", "Drain snaking",
                    "Hydro jetting", "Camera inspection", "Floor drains", "Cleanout access",
                ],
                jobs: [
                    "Slow drain", "Clogged toilet", "Sink won't drain", "Shower backing up", "Gurgling drains",
                    "Bad smell from the drain", "Water coming up in the tub", "Several drains clogged at once",
                ],
                questions: [
                    "What's causing my drains to clog?", "Is hydro jetting safe for my pipes?",
                    "Can you show me the camera footage?", "Should I use drain cleaner?", "How soon can you come out?",
                    "How can I keep my drains clear?",
                ],
            },
            {
                label: "Water Heater Services", tag: "Water Heater",
                included: [
                    "Tank water heaters", "Tankless water heaters", "Water heater repair", "Flushing and maintenance",
                    "Removal of the old heater", "Permit and inspection", "Expansion tank", "Gas and electric",
                    "Sizing for your home", "Startup and testing",
                ],
                jobs: [
                    "No hot water", "Hot water runs out fast", "Water heater leaking", "Rumbling or popping noise",
                    "Rusty or smelly water", "Pilot light won't stay lit", "Water too hot or not hot enough",
                    "Old water heater", "Want a tankless heater",
                ],
                questions: [
                    "Should I repair or replace my water heater?", "Is tankless right for my home?",
                    "What size water heater do I need?", "How long does a new water heater take to put in?",
                    "How often should it be flushed?", "Do you service all brands?",
                ],
            },
            {
                label: "Emergency Plumbing", tag: "Emergency",
                included: [
                    "Nights, weekends and holidays", "Water shutoff", "Burst pipe repair", "Leak repair", "Clog clearing",
                    "Sewer backup", "Water heater problems", "Price before work starts", "Temporary fix while parts come in",
                ],
                jobs: [
                    "Burst pipe", "Water flooding the floor", "Toilet overflowing", "Sewer backing up", "No water",
                    "No hot water", "Frozen pipes", "Leak I can't stop",
                ],
                questions: [
                    "Can you come out tonight?", "Do you charge more after hours?", "How do I shut off my water?",
                    "What should I do until you arrive?", "Do you work weekends and holidays?", "How soon can you get here?",
                ],
            },
            {
                label: "Pipe Installation", tag: "Installation",
                included: [
                    "New water lines", "Drain and vent lines", "PEX piping", "Copper piping", "PVC drain piping",
                    "Shutoff valves", "Outdoor faucets", "Ice maker and washer lines", "Permit and inspection",
                    "Pressure testing",
                ],
                jobs: [
                    "Remodeling a room", "Adding a bathroom", "Moving a sink", "New appliance hookup",
                    "Need an outdoor faucet", "Old pipes failing", "Building an addition",
                ],
                questions: [
                    "Which pipe material is best?", "Do I need a permit?", "Can you work with my contractor?",
                    "Will you need to open walls?", "How long will the water be off?",
                ],
            },
            {
                label: "Bathroom & Kitchen Remodel", tag: "Remodel",
                included: [
                    "Fixture installation", "Sink and faucet install", "Toilet installation", "Tub and shower install",
                    "Shower valve replacement", "Moving drain and water lines", "Dishwasher hookup", "Garbage disposal",
                    "Permit and inspection", "Working with your contractor",
                ],
                jobs: [
                    "Updating a bathroom", "New kitchen", "Tub to shower conversion", "Moving the sink or toilet",
                    "Adding a second sink", "Old fixtures to replace", "Making a bathroom easier to use",
                ],
                questions: [
                    "Can you move my plumbing?", "Do you work with my contractor?", "Can I buy my own fixtures?",
                    "Do I need a permit?", "How long will my bathroom be out of use?", "Do you do the tile and cabinets?",
                ],
            },
            {
                label: "Sewer Line Repair", tag: "Sewer",
                included: [
                    "Camera inspection", "Locating the line", "Sewer line repair", "Sewer line replacement",
                    "Trenchless repair", "Root removal", "Hydro jetting", "Cleanout install", "Permit and inspection",
                    "Yard restoration",
                ],
                jobs: [
                    "Sewer backing up", "Several drains slow at once", "Gurgling toilet", "Sewage smell in the yard",
                    "Soggy spot in the yard", "Tree roots in the line", "Buying a home", "Old clay or cast iron pipe",
                ],
                questions: [
                    "Do you have to dig up my yard?", "What is trenchless repair?", "Can you show me the camera footage?",
                    "Who owns the sewer line?", "How long will I be without a toilet?", "Does insurance cover sewer lines?",
                ],
            },
            {
                label: "Repiping", tag: "Repiping",
                included: [
                    "Whole home repiping", "PEX or copper", "New shutoff valves", "Removal of old pipes where needed",
                    "Drywall patching", "Permit and inspection", "Pressure testing", "Water heater connections",
                ],
                jobs: [
                    "Pipes keep leaking", "Rusty or discolored water", "Low water pressure", "Old galvanized pipes",
                    "Polybutylene pipes", "Water tastes like metal", "Insurance asked me to repipe",
                    "Pinhole leaks in copper",
                ],
                questions: [
                    "How long does repiping take?", "Will I have water during the job?", "Do you patch the walls after?",
                    "Is PEX or copper better?", "Do I need to move out?", "Do I need a permit?",
                ],
            },
            {
                label: "Water Filtration", tag: "Filtration",
                included: [
                    "Water testing", "Whole home filter", "Under sink filter", "Reverse osmosis", "Water softener",
                    "Iron and sulfur filters", "UV treatment", "Filter changes", "Installation and setup",
                ],
                jobs: [
                    "Hard water spots", "Water smells like eggs", "Water tastes bad", "Chlorine taste", "Scale on fixtures",
                    "Stained sinks and tubs", "Well water concerns", "Dry skin and hair",
                ],
                questions: [
                    "Do I need a softener or a filter?", "Can you test my water?", "How often do filters need changing?",
                    "Is reverse osmosis worth it?", "Will a filter lower my water pressure?", "Do you work on well water?",
                ],
            },
            {
                label: "Sump Pumps", tag: "Sump Pump",
                included: [
                    "New sump pump", "Sump pump replacement", "Battery backup pump", "Check valve", "Discharge line",
                    "Sump pit install", "High water alarm", "Pump testing", "Sump pump repair",
                ],
                jobs: [
                    "Basement flooding", "Pump runs all the time", "Pump won't turn on", "Loud or rattling pump",
                    "Water in the basement after rain", "Power outages during storms", "Old pump", "Pump alarm going off",
                ],
                questions: [
                    "Do I need a battery backup?", "How often should a sump pump be replaced?",
                    "Why does my pump run so much?", "Can you test my pump?", "What size pump do I need?",
                    "How soon can you come out?",
                ],
            },
            {
                label: "Gas Line Services", tag: "Gas",
                included: [
                    "Gas leak check", "Gas line repair", "New gas lines", "Range and dryer hookups", "Water heater gas line",
                    "Grill and fire pit lines", "Generator hookup", "Shutoff valves", "Pressure testing",
                    "Permit and inspection",
                ],
                jobs: [
                    "Gas smell near an appliance", "New gas range", "Gas dryer hookup", "Outdoor grill line",
                    "Adding a generator", "Switching to gas", "Failed gas inspection",
                ],
                questions: [
                    "What should I do if I smell gas?", "Do I need a permit for a gas line?",
                    "Can you hook up my new stove?", "Can you run a line to my grill?", "Is my gas line safe?",
                    "Do you work on propane?",
                ],
            },
            {
                label: "Backflow Testing", tag: "Testing",
                included: [
                    "Yearly backflow test", "Backflow test report", "Backflow repair", "New backflow device",
                    "Irrigation backflow", "Fire line backflow", "Reminder when the test is due", "Permit and inspection",
                ],
                jobs: [
                    "City sent a test notice", "Backflow test due", "Failed backflow test", "New irrigation system",
                    "Leaking backflow device", "Opening a business",
                ],
                questions: [
                    "Why do I need a backflow test?", "How often is a test needed?", "Do you send the report to the city?",
                    "What if my device fails?", "Do I need to be there?", "How long does the test take?",
                ],
            },
        ],
        differentiators: [
            "24/7 emergency callouts",
            "Flat-rate pricing before we start",
            "Clean-up included",
            "No overtime charges",
        ],
        customers: ["Homeowners", "Restaurants and food service"],
        templateSlots: {
            stats: [
                { key: "availability", prompt: "What's your availability?", example: "24/7" },
                { key: "avgArrivalTime", prompt: "Average emergency arrival time", example: "60 min" },
                { key: "rating", prompt: "Your average review rating and count", example: "4.9★ from 240+ reviews" },
                { key: "yearsLicensed", prompt: "How many years have you been licensed in your area?", example: "15+" },
            ],
            reviewAggregate: true,
            hoursPerDay: false,
            priceFrom: false,
            seasons: null,
            serviceRadius: false,
            offerBadge: false,
        },
    },
    {
        id: "lawn-care",
        label: "Lawn Care / Landscaping",
        services: [
            // Suggestions: approved word for word by Xander, "Approve all as drafted", 2026-11-10 (v1.33.2).
            // test/fixtures/trade-suggestions-approved.json pins them.
            {
                label: "Lawn Mowing", tag: "Maintenance",
                included: [
                    "Mowing", "Edging", "Trimming", "Blowing off walks and drives", "Bagging clippings",
                    "Mulching clippings", "Weekly or every other week", "Mowing height set for your grass",
                ],
                jobs: [
                    "No time to mow", "Grass getting too long", "Moving into a new home", "Going on vacation",
                    "Rental property upkeep", "Getting the house ready to sell", "Need help keeping up the yard",
                    "HOA notice",
                ],
                questions: [
                    "How often will you mow?", "Do I need to be home?", "Do you bag the clippings?",
                    "What if it rains on my day?", "Do I have to sign a contract?", "Can I pause service?",
                ],
            },
            {
                label: "Fertilization", tag: "Treatments",
                included: [
                    "Seasonal fertilizer", "Soil test", "Lime treatment", "Weed control", "Grub control",
                    "Slow release fertilizer", "Program for your grass type", "Overseeding", "Notes after each visit",
                ],
                jobs: [
                    "Thin or patchy lawn", "Yellow grass", "Lawn won't green up", "Weeds taking over",
                    "New lawn needs feeding", "Want a thicker lawn", "Grubs in the lawn",
                ],
                questions: [
                    "How often do you fertilize?", "Is it safe for pets and kids?", "How long until I can walk on it?",
                    "Should I water after?", "When will I see results?", "Do you offer organic options?",
                ],
            },
            {
                label: "Weed Control & Treatments", tag: "Weed Control",
                included: [
                    "Pre-emergent weed control", "Spot weed spraying", "Crabgrass control", "Broadleaf weed control",
                    "Weed control in beds", "Weed pulling in beds", "Grub control", "Insect control",
                    "Lawn disease treatment",
                ],
                jobs: [
                    "Dandelions everywhere", "Crabgrass", "Clover taking over", "Weeds in flower beds",
                    "Weeds in cracks and walks", "Brown patches", "Grubs", "Fire ants",
                ],
                questions: [
                    "Is it safe for pets and kids?", "How soon will the weeds die?", "Do you pull weeds in beds?",
                    "How many treatments do I need?", "What if weeds come back?", "Should I mow before you spray?",
                ],
            },
            {
                label: "Core Aeration", tag: "Aeration",
                included: [
                    "Core aeration", "Overseeding", "Marking sprinkler heads", "Slit seeding", "Starter fertilizer",
                    "Topdressing", "Cleanup after",
                ],
                jobs: [
                    "Hard packed soil", "Water runs off the lawn", "Thin grass", "Thatch buildup", "Bare spots",
                    "Heavy foot traffic", "Lawn struggles every summer",
                ],
                questions: [
                    "When is the best time to aerate?", "Should I overseed too?", "What do I do with the plugs?",
                    "Do I need to water after?", "Do you mark my sprinkler heads?", "How often should I aerate?",
                ],
            },
            {
                label: "Leaf Removal", tag: "Seasonal",
                included: [
                    "Leaf blowing", "Leaf mulching", "Bed and corner cleanout", "Gutter leaf cleanout",
                    "Bagging and haul away", "Curbside piles", "Weekly fall visits", "Final cleanup",
                ],
                jobs: [
                    "Leaves covering the lawn", "Lots of trees", "Leaves in the beds", "Clogged gutters",
                    "No time this fall", "HOA notice", "Getting ready for snow",
                ],
                questions: [
                    "Do you haul the leaves away?", "Can you leave them at the curb?", "How many visits will I need?",
                    "Do you clean gutters too?", "Can you mulch them into the lawn?", "When should I book?",
                ],
            },
            {
                label: "Landscape Edging", tag: "Detail",
                included: [
                    "Edging along walks and drives", "Bed edging", "Natural spade edge", "Steel edging",
                    "Stone or paver edging", "Plastic edging", "Bed reshaping", "Mulch refresh",
                ],
                jobs: [
                    "Grass creeping into beds", "Messy bed lines", "Want a cleaner look", "Mulch washing out", "New beds",
                    "Getting the house ready to sell",
                ],
                questions: [
                    "What edging lasts longest?", "Can you reshape my beds?", "How often does edging need redoing?",
                    "Do you add mulch too?", "Can you match my existing edging?",
                ],
            },
            {
                label: "Mulching", tag: "Beds",
                included: [
                    "Hardwood mulch", "Pine straw", "Rock or stone", "Bed cleanup first", "Weed barrier", "Bed edging",
                    "Color choice", "Delivery and spreading", "Haul away of old mulch",
                ],
                jobs: [
                    "Faded mulch", "Weeds in the beds", "Bare beds", "Soil drying out", "Spring refresh",
                    "Getting the house ready to sell", "New landscaping",
                ],
                questions: [
                    "How deep should mulch be?", "What mulch colors do you carry?", "Do you remove the old mulch?",
                    "How often should I mulch?", "Do you pull weeds first?", "Is rock or mulch better?",
                ],
            },
            {
                label: "Hedge & Shrub Trimming", tag: "Trimming",
                included: [
                    "Hedge shaping", "Shrub trimming", "Small tree pruning", "Overgrown shrub cutback",
                    "Removal of dead branches", "Cleanup and haul away", "Shrub removal", "Seasonal visits",
                ],
                jobs: [
                    "Overgrown hedges", "Shrubs blocking windows", "Bushes over the walkway", "Dead branches",
                    "Shrubs looking shaggy", "Hedge needs reshaping", "Getting the house ready to sell",
                ],
                questions: [
                    "When is the best time to trim?", "Can you bring back an overgrown hedge?",
                    "Do you haul the clippings away?", "Do you trim trees too?", "How often should shrubs be trimmed?",
                    "Can you remove a shrub?",
                ],
            },
            {
                label: "Seasonal Cleanups", tag: "Seasonal",
                included: [
                    "Spring cleanup", "Fall cleanup", "Leaf removal", "Bed cleanout", "Cutting back perennials",
                    "Shrub trimming", "First or last mow", "Gutter cleanout", "Debris haul away", "Mulch refresh",
                ],
                jobs: [
                    "Yard looks messy after winter", "Leaves everywhere", "Beds full of debris", "Getting ready for spring",
                    "Closing up for winter", "Storm debris", "Getting the house ready to sell",
                ],
                questions: [
                    "What's in a spring cleanup?", "What's in a fall cleanup?", "Do you haul everything away?",
                    "When should I book?", "Can you add mulch too?", "Is it a one-time visit?",
                ],
            },
            {
                label: "Irrigation & Sprinklers", tag: "Irrigation",
                included: [
                    "Sprinkler repair", "New sprinkler systems", "Spring startup", "Fall winterizing",
                    "Controller programming", "Smart controller install", "Head and nozzle replacement", "Leak repair",
                    "Drip irrigation", "Backflow testing",
                ],
                jobs: [
                    "Broken sprinkler head", "Dry or brown spots", "Zone won't turn on", "Water pooling in the yard",
                    "Water bill too high", "Controller not working", "System needs winterizing", "Spring startup",
                ],
                questions: [
                    "When should I winterize?", "How often should I water?", "Can you add a zone?",
                    "Do you install smart controllers?", "Why is one zone not working?", "Do you do backflow testing?",
                ],
            },
            {
                label: "Snow Removal", tag: "Winter",
                included: [
                    "Driveway plowing", "Sidewalk shoveling", "Salt and ice melt", "Walkway clearing", "Steps and porches",
                    "Commercial lots", "Snow stakes", "Seasonal contract or per visit", "Roof snow removal",
                ],
                jobs: [
                    "Can't shovel myself", "Driveway snowed in", "Icy walkways", "Business needs a clear lot",
                    "Away for the winter", "Need help after a big storm",
                ],
                questions: [
                    "When do you come out after a storm?", "Do you salt too?", "Is it a season contract or per storm?",
                    "Do you do sidewalks?", "What if the plow damages my lawn?", "How much snow before you plow?",
                ],
            },
            {
                label: "Landscape Design", tag: "Design",
                included: [
                    "Site visit", "Design plan", "Plant selection", "New beds", "Pavers and walkways", "Retaining walls",
                    "Landscape lighting", "Sod or seed", "Irrigation", "Installation",
                ],
                jobs: [
                    "Bare yard", "New construction home", "Outdated landscaping", "Want more privacy", "Drainage problems",
                    "Want less upkeep", "Selling my home", "Want an outdoor living space",
                ],
                questions: [
                    "Do you do the install too?", "Can you work in phases?", "What plants grow well here?",
                    "How long does a design take?", "Can you design for low upkeep?", "Do you do hardscapes?",
                ],
            },
        ],
        differentiators: [
            "Recurring plans, no contracts",
            "Same crew every visit",
            "Pet- and child-safe treatments",
            "Text-ahead arrival notice",
        ],
        customers: ["Homeowners", "HOAs and communities"],
        // Carries BOTH stats and seasons (PLAN D14, 2026-10-28 resolution): the template's under-hero
        // slot renders a conventional trust stat band, and a separate, slimmer season rail beneath it
        // — demoted from an earlier four-card treatment that was too loud for that slot. Each prompt
        // below must make clear that a blank answer is fine; a client with no seasonal programme
        // gets no rail at all (D5), never an invented one.
        templateSlots: {
            stats: [
                { key: "lawnsServicedWeekly", prompt: "How many lawns do you service in a typical week?", example: "1,400+" },
                { key: "yearsTrading", prompt: "How many years have you been in business?", example: "12 yr" },
                { key: "rating", prompt: "Your average review rating and count", example: "4.9★ from 164 reviews" },
                { key: "neighbourhoods", prompt: "How many neighbourhoods or routes do you cover?", example: "10" },
            ],
            reviewAggregate: true,
            hoursPerDay: false,
            priceFrom: true,
            seasons: [
                { key: "spring", label: "Spring", prompt: "What do you include in your spring service? Leave blank if you don't offer one." },
                { key: "summer", label: "Summer", prompt: "What do you include in your summer service? Leave blank if you don't offer one." },
                { key: "fall", label: "Fall", prompt: "What do you include in your fall service? Leave blank if you don't offer one." },
                { key: "winter", label: "Winter", prompt: "What do you include in your winter service? Leave blank if you don't offer one." },
            ],
            serviceRadius: false,
            offerBadge: true,
        },
    },
    {
        id: "car-detailing",
        label: "Car Detailing / Auto",
        services: [
            // Suggestions: approved word for word by Xander, "Approve all as drafted", 2026-11-10 (v1.33.2).
            // test/fixtures/trade-suggestions-approved.json pins them.
            {
                label: "Interior Detailing", tag: "Interior",
                included: [
                    "Full vacuum", "Seat shampoo", "Carpet and mat cleaning", "Leather cleaning and conditioning",
                    "Dashboard and console wipe down", "Door panels", "Inside windows", "Steam cleaning", "Stain treatment",
                    "Pet hair removal", "Air vent cleaning",
                ],
                jobs: [
                    "Kids made a mess", "Pet hair everywhere", "Spilled coffee or soda", "Car smells bad",
                    "Stains on the seats", "Selling my car", "Car hasn't been cleaned in a while",
                    "Sand and dirt in the carpet",
                ],
                questions: [
                    "How long does an interior detail take?", "Can you get out stains?", "Can you remove pet hair?",
                    "Do you clean leather?", "Will the seats be wet after?", "Do I need to be there?",
                ],
            },
            {
                label: "Exterior Hand Wash", tag: "Exterior",
                included: [
                    "Hand wash", "Wheel and tire cleaning", "Tire shine", "Door jambs", "Bug and tar removal", "Hand dry",
                    "Outside windows", "Spray wax", "Trim dressing", "Clay bar",
                ],
                jobs: [
                    "Car is dirty", "Bugs on the front", "Tree sap", "Bird droppings", "Brake dust on the wheels",
                    "Road salt", "Don't want a tunnel wash", "Getting ready for an event",
                ],
                questions: [
                    "Is it a hand wash only?", "How often should I wash my car?", "Is it safe for a coated car?",
                    "Do you wax too?", "How long does it take?", "Do you need water or power from me?",
                ],
            },
            {
                label: "Ceramic Coating", tag: "Protection",
                included: [
                    "Wash and decontamination", "Clay bar", "Paint correction before coating", "Ceramic coating on paint",
                    "Wheel coating", "Glass coating", "Trim coating", "Care instructions",
                ],
                jobs: [
                    "Want a lasting shine", "New car to protect", "Want easier washing", "Paint fading", "Water spots",
                    "Tired of waxing",
                ],
                questions: [
                    "How long does ceramic coating last?", "Is ceramic coating better than wax?",
                    "Do you correct the paint first?", "How do I wash a coated car?", "How long until I can drive it?",
                    "Do you coat wheels and glass?",
                ],
            },
            {
                label: "Paint Correction", tag: "Correction",
                included: [
                    "Paint inspection", "Wash and clay bar", "Swirl removal", "Scratch removal", "Oxidation removal",
                    "Machine polishing", "Water spot removal", "Paint depth check", "Sealant or wax after",
                ],
                jobs: [
                    "Swirl marks", "Light scratches", "Dull or faded paint", "Water spots", "Hazy clear coat",
                    "Buffer marks", "Getting ready to sell", "Before a ceramic coating",
                ],
                questions: [
                    "Can every scratch come out?", "How long does paint correction take?",
                    "How many polishing steps do I need?", "Will it hurt my clear coat?", "Should I coat it after?",
                    "Do I need to leave the car?",
                ],
            },
            {
                label: "Engine Bay Detailing", tag: "Engine Bay",
                included: [
                    "Degreasing", "Gentle rinse", "Plastic and rubber dressing", "Covering sensitive parts",
                    "Hose and cover cleaning", "Hand detail of hard spots", "Air dry",
                ],
                jobs: [
                    "Greasy engine", "Selling my car", "Car show coming up", "Oil leak cleanup",
                    "Leaves and debris in the bay", "Want to spot leaks easier",
                ],
                questions: [
                    "Is engine cleaning safe?", "Do you cover the electrical parts?", "How long does it take?",
                    "Does the engine need to cool first?", "Can you clean oil stains?",
                ],
            },
            {
                label: "Mobile Service", tag: "Mobile",
                included: [
                    "We come to your home", "We come to your work", "Our own water and power", "Interior and exterior",
                    "Fleet and group bookings", "Flexible times",
                ],
                jobs: [
                    "No time to drop off the car", "Busy work schedule", "No way to get to a shop", "Several cars at once",
                    "Want it done at the office",
                ],
                questions: [
                    "Do you need my water or power?", "Can you work in my apartment lot?", "What if it rains?",
                    "Do I need to be there?", "How much space do you need?", "Do you come to my work?",
                ],
            },
            {
                label: "Headlight Restoration", tag: "Restoration",
                included: [
                    "Sanding off the yellow layer", "Polishing", "UV sealant", "Both headlights", "Taillight polishing",
                    "Fog light polishing",
                ],
                jobs: [
                    "Yellow or cloudy headlights", "Dim lights at night", "Failed inspection", "Selling my car",
                    "Car looks older than it is",
                ],
                questions: [
                    "How long does restoration last?", "Is it cheaper than new headlights?",
                    "Will it help with night driving?", "How long does it take?", "Do you seal them after?",
                ],
            },
            {
                label: "Odor Removal", tag: "Interior",
                included: [
                    "Finding the source", "Deep vacuum", "Shampoo and extraction", "Ozone treatment", "Enzyme treatment",
                    "Cabin air filter change", "Vent cleaning", "Headliner cleaning",
                ],
                jobs: [
                    "Smoke smell", "Pet smell", "Spilled milk", "Mildew smell", "Food smell", "Wet carpet smell",
                    "Used car that smells",
                ],
                questions: [
                    "Can you get rid of smoke smell?", "Is ozone treatment safe?", "How long until the smell is gone?",
                    "Will the smell come back?", "Do I need to air out the car after?",
                ],
            },
            {
                label: "Paint Protection Film", tag: "Protection",
                included: [
                    "Front bumper", "Full front end", "Full body", "Door edges and cups", "Rocker panels", "Headlights",
                    "Paint prep first", "Self-healing film", "Custom cut film",
                ],
                jobs: [
                    "Rock chips on the front", "New car to protect", "Lots of highway driving", "Door dings at work",
                    "Want to keep the paint like new", "Track days",
                ],
                questions: [
                    "How long does film last?", "Will the film turn yellow?", "Can you see the film?",
                    "Should I get film or ceramic coating?", "Can I wash it normally?", "How long does install take?",
                ],
            },
            {
                label: "Fleet Detailing", tag: "Fleet",
                included: [
                    "On site service", "Interior and exterior", "Scheduled visits", "Work trucks and vans",
                    "Box truck washing", "Equipment washing", "One invoice for all vehicles", "After hours service",
                ],
                jobs: [
                    "Company vehicles look dirty", "Vans customers see every day", "Dealer lot cars",
                    "Rental or rideshare cars", "Vehicles back from a job",
                ],
                questions: [
                    "Do you come to our lot?", "Can you work after hours?", "Do you offer a set schedule?",
                    "Can we get one invoice?", "How many vehicles can you do in a day?", "Do you wash trucks and equipment?",
                ],
            },
            {
                label: "Pre-Sale Detail", tag: "Resale",
                included: [
                    "Full interior detail", "Exterior wash and wax", "Engine bay cleaning", "Headlight restoration",
                    "Odor removal", "Paint polish", "Tire and trim dressing", "Photo ready finish",
                ],
                jobs: [
                    "Selling my car", "Trading in my car", "Returning a lease", "Taking listing photos",
                    "Car smells or is stained",
                ],
                questions: [
                    "Will a detail help me sell my car?", "How far before the sale should I book?",
                    "Can you fix small scratches?", "Do you do headlights?", "How long does it take?",
                ],
            },
        ],
        differentiators: [
            "We come to you",
            "Before-and-after photos every time",
            "Only pH-neutral products",
            "Satisfaction guaranteed or we redo it",
        ],
        customers: ["Car enthusiasts", "Dealerships and fleets", "Everyday drivers"],
        templateSlots: {
            stats: [
                { key: "vehiclesDetailed", prompt: "How many vehicles have you detailed?", example: "2,400+" },
                { key: "coatingDurability", prompt: "How many years does your ceramic coating last?", example: "5 yr" },
                { key: "rating", prompt: "Your average review rating and count", example: "5.0★ from 190 reviews" },
                { key: "mobileCoverage", prompt: "What share of jobs can you do mobile, on-site?", example: "100%" },
            ],
            reviewAggregate: true,
            hoursPerDay: false,
            // Price-from figures and a mobile radius are both facts about the business (PLAN D15):
            // never invented, and a client who leaves one blank gets that package's tag with no price,
            // or the radius statement with no distance, rather than a placeholder like "Call" or "$0".
            priceFrom: true,
            seasons: null,
            serviceRadius: true,
            offerBadge: false,
        },
    },
    {
        id: "health",
        label: "Health & Wellness",
        services: [
            // Suggestions: approved word for word by Xander, "Approve all as drafted", 2026-11-10 (v1.33.2).
            // test/fixtures/trade-suggestions-approved.json pins them.
            {
                label: "Initial Wellness Consultation", tag: "Consultation",
                included: [
                    "Health history review", "Goal setting", "Lifestyle review", "Time for your questions",
                    "Written next steps", "Plan options", "Virtual or in person",
                ],
                jobs: [
                    "Low energy", "Want to feel better", "Feeling stressed", "Trouble sleeping", "Not sure where to start",
                    "Want a plan", "Getting back on track",
                ],
                questions: [
                    "What happens at the first visit?", "How long is the consultation?", "What should I bring?",
                    "Can I do it online?", "Do you take insurance?", "Who will I meet with?",
                ],
            },
            {
                label: "Personalized Care Plans", tag: "Planning",
                included: [
                    "Plan built around your goals", "Nutrition guidance", "Movement plan", "Sleep habits", "Stress tools",
                    "Check in schedule", "Progress tracking", "Plan updates as you go",
                ],
                jobs: [
                    "Tried things on my own", "Want a clear plan", "Busy schedule", "Want accountability", "Changing habits",
                    "Getting back on track",
                ],
                questions: [
                    "How is my plan made?", "How often will we check in?", "Can the plan change?",
                    "How long does a plan run?", "What do I need to do at home?",
                ],
            },
            {
                label: "Ongoing Wellness Support", tag: "Support",
                included: [
                    "Regular check ins", "Messaging between visits", "Progress reviews", "Plan adjustments", "Reminders",
                    "Resources and handouts",
                ],
                jobs: [
                    "Want accountability", "Keeping new habits", "Staying on track", "Hit a plateau", "Life got busy",
                ],
                questions: [
                    "How often do we meet?", "Can I message between visits?", "Can I pause or cancel?",
                    "Is there a membership?", "What if I miss a session?",
                ],
            },
            {
                label: "Lifestyle & Nutrition Guidance", tag: "Lifestyle",
                included: [
                    "Eating habits review", "Meal planning help", "Grocery list ideas", "Healthy swaps", "Food journaling",
                    "Hydration habits", "Recipes", "Check ins",
                ],
                jobs: [
                    "Want to eat better", "Low energy", "Too much takeout", "Cooking for a family", "Busy schedule",
                    "Weight goals", "Cravings",
                ],
                questions: [
                    "Do I have to follow a strict diet?", "Can you work with food allergies?", "Do you make meal plans?",
                    "Is this for weight loss?", "How often do we meet?",
                ],
            },
            {
                label: "Stress & Recovery Sessions", tag: "Recovery",
                included: [
                    "Breathing techniques", "Relaxation practice", "Guided sessions", "Recovery planning", "Stress tracking",
                    "Tools to use at home",
                ],
                jobs: [
                    "Feeling stressed", "Burned out", "Trouble relaxing", "Tension in the body", "Busy work life",
                    "Recovering after a hard season",
                ],
                questions: [
                    "What happens in a session?", "How long is a session?", "How many sessions will I need?",
                    "Can I do this online?", "What should I wear?",
                ],
            },
            {
                label: "Virtual & In-Person Visits", tag: "Telehealth",
                included: [
                    "Video visits", "In person visits", "Phone check ins", "Online booking", "Reminders before visits",
                    "Secure messaging",
                ],
                jobs: [
                    "Busy schedule", "Live far away", "Prefer to meet in person", "Traveling", "Want flexible times",
                ],
                questions: [
                    "Do you offer online visits?", "What do I need for a video visit?",
                    "Are online visits the same as in person?", "How do I book?", "Do you have evening or weekend times?",
                ],
            },
            {
                label: "Group Programs", tag: "Groups",
                included: [
                    "Small group sessions", "Guided program", "Group check ins", "Materials and handouts",
                    "Online or in person", "Support from the group",
                ],
                jobs: [
                    "Want support from others", "Like a set schedule", "Starting with a friend", "Want motivation",
                ],
                questions: [
                    "How big are the groups?", "How long does the program run?", "When does the next group start?",
                    "Can I join with a friend?", "Is it online or in person?",
                ],
            },
            {
                label: "Corporate Wellness", tag: "Corporate",
                included: [
                    "Workshops", "Lunch and learns", "Wellness challenges", "On site sessions", "Virtual sessions",
                    "Employee check ins", "Program planning", "Summary reports for leaders",
                ],
                jobs: [
                    "Team stress", "Low morale", "Burnout at work", "Updating our benefits", "Remote team",
                    "Planning a wellness month",
                ],
                questions: [
                    "Do you come on site?", "Can you run sessions online?", "How big a team can you work with?",
                    "Can you tailor it to our team?", "How do we get started?",
                ],
            },
            {
                label: "Movement & Mobility", tag: "Movement",
                included: [
                    "Movement check", "Stretching routines", "Mobility work", "Home exercise plan", "Posture habits",
                    "Guided sessions", "Progress tracking",
                ],
                jobs: [
                    "Feeling stiff", "Sitting all day", "Want to move more", "Getting back into exercise",
                    "Worried about balance", "Staying active as I age",
                ],
                questions: [
                    "Do I need to be fit to start?", "What should I wear?", "Can I do this at home?",
                    "How often should I come?", "Is this physical therapy?",
                ],
            },
            {
                label: "Sleep Support", tag: "Sleep",
                included: [
                    "Sleep habits review", "Bedtime routine plan", "Sleep journal", "Stress tools", "Bedroom setup tips",
                    "Check ins",
                ],
                jobs: [
                    "Trouble falling asleep", "Waking up at night", "Tired during the day", "Shift work",
                    "Busy mind at night", "Want better rest",
                ],
                questions: [
                    "Is this a sleep study?", "How long until I sleep better?", "Do I need to see a doctor first?",
                    "Can we meet online?", "What will I do at home?",
                ],
            },
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
/**
 * v1.33.0: the approved suggestions for one service, matched by its menu LABEL (case-insensitive,
 * trimmed). Never by tag: tags repeat inside a trade (HVAC has "Heating" and "Air Quality" twice).
 * A service typed in by hand, or one with no approved batch, gets empty lists.
 */
export function serviceSuggestions(industry, serviceLabel) {
    const key = (serviceLabel ?? "").trim().toLowerCase();
    const hit = key ? menuFor(industry)?.services.find((s) => s.label.trim().toLowerCase() === key) : undefined;
    return { included: hit?.included ?? [], jobs: hit?.jobs ?? [], questions: hit?.questions ?? [] };
}
//# sourceMappingURL=industry-menu.js.map