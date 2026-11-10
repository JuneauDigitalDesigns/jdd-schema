// SEO copy rules (Xander, 2026-11-10: D3, D4 + Appendix A, D5 layer 1, D6). The copywriter's
// role and rules are approved word for word, the scaffold's form label no longer promises a free
// estimate or a same-day reply, and nothing the model reads carries an em- or en-dash (models copy
// them, which is how 17 reached one client's home page).
import { test } from "node:test";
import assert from "node:assert/strict";
import { BUILT_IN_VERTICALS, INDUSTRY_MENUS, mapBrandIntakeToIntake } from "../dist/index.js";

const DASH = /[–—]/;

const APPROVED_ROLE =
  "You write the website for one local trade business. Your reader is a homeowner with a problem " +
  "who wants to know, fast, whether this business can fix it, where it works, and how to get in " +
  "touch. Answer that first, in plain words, then give the detail. Write only what the business " +
  "facts support. If a fact is missing, leave it out; never fill the gap.";

const APPROVED_RULES = [
  "- Open every section with the plain answer, then the detail.",
  '- Use the service names and the city from the facts. Name the city in the headline and the first sentence; elsewhere only when it helps the reader. Never list towns in a sentence. Never write "near me".',
  '- Never state a price, warranty, response time, year, licence, certification, brand, guarantee, "free estimate", "same day" or "24/7" unless the facts say it.',
  "- Short sentences, everyday words, the way the owner would say it to a customer.",
  '- Never use an em-dash or an en-dash. Use a full stop or a comma instead. Write ranges as "1 to 2".',
  "- No clichés.",
];

const homeService = BUILT_IN_VERTICALS.filter((v) => v.id !== "health");

test("every home-service vertical carries the approved role and rules, word for word", () => {
  assert.ok(homeService.length >= 5);
  for (const v of homeService) {
    const role = v.prompt.role;
    assert.ok(role.startsWith(APPROVED_ROLE), `${v.id}: role paragraph is not the approved text`);
    for (const rule of APPROVED_RULES) assert.ok(role.includes(rule), `${v.id}: missing rule ${rule}`);
    assert.ok(!/conversion copywriter/i.test(role), `${v.id}: still the old conversion-copywriter role`);
  }
});

test("nothing the copywriter reads carries an em- or en-dash", () => {
  for (const v of BUILT_IN_VERTICALS) {
    for (const [k, text] of Object.entries({ role: v.prompt.role, guardrails: v.prompt.guardrails, forbidden: v.prompt.forbidden.join(" ") })) {
      assert.ok(!DASH.test(text), `${v.id}.prompt.${k} has a dash`);
    }
  }
  // The chips the Brief stage compiles into the positioning paragraph, and service labels, which
  // can become a site's service names.
  for (const m of INDUSTRY_MENUS) {
    const strings = JSON.stringify(m);
    const hit = strings.match(new RegExp(`"[^"]*${DASH.source}[^"]*"`));
    assert.equal(hit, null, `${m.id} menu string has a dash: ${hit?.[0]}`);
  }
});

test("the scaffold's form label is the approved neutral placeholder (D3)", () => {
  const site = mapBrandIntakeToIntake({
    selectedPlan: "starter",
    brandName: "Peak",
    email: "o@peak.com",
    phone: "(930) 222-1343",
    address: "318 Glacier Ave, Juneau, AK",
    serviceList: [{ name: "AC Repair", tag: "HVAC" }],
    brandDirection: {},
    palette: { mode: "custom", baseColor: "#0F1B2D", accentColor: "#1E6FBF" },
  }).sites[0];
  assert.equal(site.hero.formLabel, "Tell us what you need.");
});
