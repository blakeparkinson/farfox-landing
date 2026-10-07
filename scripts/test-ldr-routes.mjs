import assert from 'node:assert/strict';
import { ROUTES, routeBySlug, gapMinutes, gapSentence, awakeWindows, windowMinutes, bestCall, clock, yearOfGaps, flightHours, halfwayHubs, relatedRoutes } from '../src/lib/ldrRoutes.ts';

// One page per unordered pair, every slug unique and URL-safe, every route genuinely long-distance.
assert.ok(ROUTES.length >= 300, `${ROUTES.length} routes`);
assert.equal(new Set(ROUTES.map((r) => r.slug)).size, ROUTES.length, 'slugs are unique');
assert.equal(new Set(ROUTES.map((r) => [r.a.slug, r.b.slug].sort().join('|'))).size, ROUTES.length, 'no pair appears twice, either way round');
for (const r of ROUTES) {
  assert.match(r.slug, /^[a-z0-9-]+-to-[a-z0-9-]+$/, r.slug);
  assert.ok(r.km >= 700, `${r.slug} is long-distance`);
}
assert.ok(routeBySlug('sao-paulo-to-london') || routeBySlug('new-york-to-sao-paulo'), 'accents are dropped from slugs');

// Time differences come from the zone data, so daylight saving is right on any date.
const ny = routeBySlug('new-york-to-london');
assert.equal(gapMinutes(ny.a, ny.b, new Date('2026-01-15T12:00:00Z')), 300);
assert.equal(gapMinutes(ny.a, ny.b, new Date('2026-03-20T12:00:00Z')), 240, 'US clocks change three weeks before the UK');
assert.deepEqual(yearOfGaps(ny.a, ny.b, 2026), { usual: 300, others: [{ gap: 240, days: 28 }] });
assert.equal(gapSentence(ny.a, ny.b, 300), 'London is 5 hours ahead of New York');
const la = routeBySlug('new-york-to-los-angeles');
assert.equal(gapSentence(la.a, la.b, -180), 'Los Angeles is 3 hours behind New York');
assert.equal(gapMinutes(routeBySlug('toronto-to-mumbai').a, routeBySlug('toronto-to-mumbai').b, new Date('2026-07-15T12:00:00Z')), 570, 'half-hour zones');

// The shared waking hours, and the best call inside them, land in someone's evening.
assert.deepEqual(awakeWindows(300), [{ aFrom: 480, aTo: 1080, bFrom: 780, bTo: 1380 }]);
assert.equal(windowMinutes(awakeWindows(300)), 600);
assert.deepEqual(bestCall(awakeWindows(300), 300), { aFrom: 780, aTo: 900, bFrom: 1080, bTo: 1200 }, '1–3 PM in New York is 6–8 PM in London');
assert.equal(awakeWindows(600).length, 2, 'a 10-hour gap gives a morning and an evening window');
assert.equal(bestCall([], 720), null);
assert.equal(clock(0), '12 AM'); assert.equal(clock(13 * 60 + 30), '1:30 PM'); assert.equal(clock(1440 + 60), '1 AM');

// Distances, flights, halfway hubs and related links are sensible.
assert.ok(Math.abs(ny.km - 5570) < 30, `New York–London is about 5,570 km (${Math.round(ny.km)})`);
assert.equal(flightHours(ny.km), 7.5);
assert.equal(halfwayHubs(ny)[0].city, 'Reykjavík');
const related = relatedRoutes(ny);
assert.equal(related.length, 8);
for (const r of related) assert.ok([r.a.slug, r.b.slug].some((s) => s === 'new-york' || s === 'london'));
assert.ok(related.some((r) => r.a.slug !== 'new-york' && r.b.slug !== 'new-york'), 'related links include London routes, not only New York ones');
assert.ok(!relatedRoutes(structuredClone(ny)).some((r) => r.slug === ny.slug), 'a page never links to itself, even given a copy of its route');

console.log(`ldr routes: ${ROUTES.length} routes, all checks passed`);
