// Which towns earn their own page (/areas/<town>) and which town + service pairs earn a spoke
// (/areas/<town>/<service>). Xander's local SEO decisions, 2026-11-12 (local-seo-architecture-
// decisions.md in the shared notes):
//   L4  home is the main city's hub, and the service pages are its spokes, so the main city never
//       gets a town page or a spoke (two pages aiming at the same words);
//   L6  a gate decides, capped at 10: the town is one of the client's own, it is not the main
//       city, and it has 3+ town facts of 2+ kinds (a job photo, a review, a sourced note);
//   L9  an operator's town note counts only with its source link;
//   L14 caps per page type: service pages 11, town pages 10, spokes 15.
// A town page with nothing local to say is what Google's spam policy calls a doorway, so the gate
// is on real facts only, never on how many towns the client lists. ONE implementation: the agency
// wizard, the console intake and the export all import it, like the service-page gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PAGE_CAPS,
  AREA_FACTS_MIN,
  AREA_KINDS_MIN,
  SPOKE_FACTS_MIN,
  TOP_TOWNS_MAX,
  townSlug,
  townSlugs,
  canonicalTown,
  isMainCity,
  areaPageFacts,
  qualifiesForAreaPage,
  pickAreaPages,
  spokePageFacts,
  qualifiesForSpokePage,
} from '../dist/index.js';

const photo = (town, extra = {}) => ({ t: '', loc: town, yr: null, scope: '', size: '', caption: town, image: { url: `/img/${town}-${Math.random()}`, alt: town }, town, ...extra });
const review = (town, extra = {}) => ({ q: `Great work in ${town}.`, a: 'Dana P.', r: '', stars: 5, town, ...extra });
const note = (town, extra = {}) => ({ town, text: 'The county asks for a permit before a water heater swap.', sourceUrl: 'https://example.gov/permits', ...extra });

const site = ({ projects = [], reviews = [], notes = [], topTowns, address = '1180 W Fairbanks Ave, Clermont, FL 34711', services } = {}) => ({
  brand: { address },
  services: {
    items: services ?? [
      { t: 'AC Repair', slug: 'ac-repair', included: ['Diagnosis', 'Refrigerant check', 'Repair'], priceFrom: '$89' },
      { t: 'Duct Cleaning', slug: 'duct-cleaning' },
    ],
  },
  extensions: {
    serviceArea: ['Clermont', 'Minneola', 'Groveland', 'Winter Garden', 'Mascotte'],
    ...(topTowns ? { topTowns } : {}),
    townNotes: notes,
  },
  testimonials: { items: reviews },
  work: { projects },
});

test('the caps per page type are the ones Xander set (L14)', () => {
  assert.deepEqual({ ...PAGE_CAPS }, { service: 11, area: 10, spoke: 15 });
  assert.equal(AREA_FACTS_MIN, 3);
  assert.equal(AREA_KINDS_MIN, 2);
  assert.equal(SPOKE_FACTS_MIN, 2);
  assert.equal(TOP_TOWNS_MAX, 3);
});

test('a town with no facts gets no page, however many towns the client lists', () => {
  assert.equal(qualifiesForAreaPage(site(), 'Minneola'), false);
  assert.deepEqual(pickAreaPages(site()), []);
});

test('two job photos and a review from the town qualify (3 facts, 2 kinds)', () => {
  const c = site({ projects: [photo('Minneola'), photo('Minneola')], reviews: [review('Minneola')] });
  assert.equal(qualifiesForAreaPage(c, 'Minneola'), true);
  const f = areaPageFacts(c, 'Minneola');
  assert.equal(f.count, 3);
  assert.deepEqual(f.have, ['job', 'review']);
});

test('three facts of ONE kind are not enough: 3 photos alone stay a list entry', () => {
  const c = site({ projects: [photo('Minneola'), photo('Minneola'), photo('Minneola')] });
  assert.equal(qualifiesForAreaPage(c, 'Minneola'), false);
});

test('two kinds but only two facts are not enough', () => {
  const c = site({ projects: [photo('Minneola')], reviews: [review('Minneola')] });
  assert.equal(qualifiesForAreaPage(c, 'Minneola'), false);
});

test('the main city never gets a town page, whatever its facts (L4: home is its hub)', () => {
  const rich = { projects: [photo('Clermont'), photo('Clermont')], reviews: [review('Clermont'), review('Clermont')] };
  const c = site(rich);
  assert.equal(isMainCity(c, 'Clermont'), true);
  assert.equal(isMainCity(c, 'clermont '), true, 'matched as the client spells it, any case');
  assert.equal(qualifiesForAreaPage(c, 'Clermont'), false);
  assert.deepEqual(pickAreaPages(c), []);
  // A service-area business with no street: the main city is the address locality all the same.
  const sab = site({ ...rich, address: 'Clermont, FL 34711' });
  assert.equal(qualifiesForAreaPage(sab, 'Clermont'), false);
});

test('without an address the main city is the first town served, as primaryCity says', () => {
  const c = site({ address: '', projects: [photo('Clermont'), photo('Clermont')], reviews: [review('Clermont')] });
  assert.equal(isMainCity(c, 'Clermont'), true);
  assert.equal(qualifiesForAreaPage(c, 'Clermont'), false);
});

test('a town the client does not cover never gets a page', () => {
  const c = site({ projects: [photo('Orlando'), photo('Orlando')], reviews: [review('Orlando')] });
  assert.equal(canonicalTown(c, 'Orlando'), '');
  assert.equal(qualifiesForAreaPage(c, 'Orlando'), false);
});

test('town tags match the service-area spelling, any case', () => {
  const c = site({ projects: [photo('minneola'), photo('MINNEOLA')], reviews: [review(' Minneola ')] });
  assert.equal(canonicalTown(c, 'minneola'), 'Minneola');
  assert.equal(qualifiesForAreaPage(c, 'Minneola'), true);
});

test('an operator note counts only with a source link (L9)', () => {
  const base = { projects: [photo('Groveland'), photo('Groveland')] };
  assert.equal(qualifiesForAreaPage(site({ ...base, notes: [note('Groveland')] }), 'Groveland'), true);
  assert.equal(qualifiesForAreaPage(site({ ...base, notes: [note('Groveland', { sourceUrl: '' })] }), 'Groveland'), false);
  assert.equal(qualifiesForAreaPage(site({ ...base, notes: [note('Groveland', { sourceUrl: 'county website' })] }), 'Groveland'), false);
  assert.equal(qualifiesForAreaPage(site({ ...base, notes: [note('Groveland', { text: '  ' })] }), 'Groveland'), false);
});

test('a photo with no image and a review with no words are not facts', () => {
  const c = site({
    projects: [photo('Minneola'), photo('Minneola', { image: null }), photo('Minneola', { image: { url: '', alt: '' } })],
    reviews: [review('Minneola'), review('Minneola', { q: '' })],
  });
  assert.deepEqual(areaPageFacts(c, 'Minneola'), { count: 2, have: ['job', 'review'], jobs: 1, reviews: 1, notes: 0 });
  assert.equal(qualifiesForAreaPage(c, 'Minneola'), false);
});

test('over the cap, the towns with the most facts win; ties go to the top towns (Q2), then the list order', () => {
  const towns = ['Minneola', 'Groveland', 'Winter Garden', 'Mascotte'];
  const projects = [];
  const reviews = [];
  // Minneola 4 facts; the other three 3 each.
  for (const t of towns) { projects.push(photo(t), photo(t)); reviews.push(review(t)); }
  projects.push(photo('Minneola'));
  const c = site({ projects, reviews, topTowns: ['Mascotte'] });
  assert.deepEqual(pickAreaPages(c), ['Minneola', 'Groveland', 'Winter Garden', 'Mascotte'], 'all qualify: returned in service-area order');
  assert.deepEqual(pickAreaPages(c, 2), ['Minneola', 'Mascotte'], 'most facts first, then the client\'s top town');
  assert.deepEqual(pickAreaPages(c, 0), []);
});

test('the default cap is 10 town pages', () => {
  const area = Array.from({ length: 12 }, (_, i) => `Town ${String.fromCharCode(65 + i)}`);
  const c = site({});
  c.extensions.serviceArea = ['Clermont', ...area];
  c.work.projects = area.flatMap((t) => [photo(t), photo(t)]);
  c.testimonials.items = area.map((t) => review(t));
  assert.equal(pickAreaPages(c).length, 10);
});

test('town slugs are lowercase words joined by hyphens, collision-free', () => {
  assert.equal(townSlug('Winter Garden'), 'winter-garden');
  assert.equal(townSlug("St. Cloud"), 'st-cloud');
  assert.equal(townSlug("Coeur d'Alene"), 'coeur-dalene');
  assert.equal(townSlug('Minneola', ['minneola']), 'minneola-2');
  assert.deepEqual(townSlugs(site()), ['clermont', 'minneola', 'groveland', 'winter-garden', 'mascotte']);
});

test('a spoke needs its town page, its service page, 2 facts tagged to both, and approved demand', () => {
  const rich = {
    projects: [photo('Minneola', { service: 'ac-repair' }), photo('Minneola')],
    reviews: [review('Minneola', { service: 'ac-repair' })],
  };
  const c = site(rich);
  assert.equal(qualifiesForAreaPage(c, 'Minneola'), true);
  assert.deepEqual(spokePageFacts(c, 'Minneola', 0), { count: 2, jobs: 1, reviews: 1 });
  assert.equal(qualifiesForSpokePage(c, 'Minneola', 0, true), true);
  assert.equal(qualifiesForSpokePage(c, 'Minneola', 0, false), false, 'never without approved demand (Phase 3)');
  // Duct Cleaning has no page of its own, so no spoke either.
  assert.equal(qualifiesForSpokePage(c, 'Minneola', 1, true), false);
});

test('a spoke with one shared fact is refused', () => {
  const c = site({ projects: [photo('Minneola', { service: 'ac-repair' }), photo('Minneola')], reviews: [review('Minneola')] });
  assert.equal(spokePageFacts(c, 'Minneola', 0).count, 1);
  assert.equal(qualifiesForSpokePage(c, 'Minneola', 0, true), false);
});

test('no spoke for the main city: the service page already is it (L4)', () => {
  const c = site({
    projects: [photo('Clermont', { service: 'ac-repair' }), photo('Clermont', { service: 'ac-repair' })],
    reviews: [review('Clermont', { service: 'ac-repair' })],
  });
  assert.equal(qualifiesForSpokePage(c, 'Clermont', 0, true), false);
});
