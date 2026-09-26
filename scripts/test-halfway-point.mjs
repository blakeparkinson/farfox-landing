import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanLabel, distanceKm, fairestHubs, formatDistance, halfwayUrl, midpoint, readHalfway, validPoint } from '../src/lib/halfwayPoint.ts';

const newYork = { lat: 40.71, lon: -74.01 };
const london = { lat: 51.51, lon: -0.13 };
const losAngeles = { lat: 34.05, lon: -118.24 };
const sydney = { lat: -33.87, lon: 151.21 };
const paris = { lat: 48.86, lon: 2.35 };
const berlin = { lat: 52.52, lon: 13.40 };
const toronto = { lat: 43.65, lon: -79.38 };
const montreal = { lat: 45.50, lon: -73.57 };

assert.ok(Math.abs(distanceKm(newYork, london) - 5570) <= 15);
const quarter = midpoint({ lat: 0, lon: 0 }, { lat: 0, lon: 90 });
assert.ok(Math.abs(quarter.lat) < 1e-9);
assert.ok(Math.abs(quarter.lon - 45) < 1e-9);
const dateline = midpoint({ lat: 0, lon: 170 }, { lat: 0, lon: -170 });
assert.ok(Math.abs(Math.abs(dateline.lon) - 180) < 1e-9);
assert.ok(dateline.lon >= -180 && dateline.lon < 180);
assert.equal(fairestHubs(newYork, london)[0].city, 'Reykjavík');
assert.equal(fairestHubs(newYork, london).length, 2);
const laSydneyHubs = fairestHubs(losAngeles, sydney);
assert.equal(laSydneyHubs[0].city, 'Papeete');
assert.ok(laSydneyHubs.some(hub => hub.city === 'Honolulu'));
assert.equal(fairestHubs(paris, berlin)[0].city, 'Frankfurt');
assert.deepEqual(fairestHubs(toronto, montreal), []);
assert.equal(formatDistance(5570), '5,570 km (3,461 mi)');
assert.equal(validPoint(90, -180), true);
assert.equal(validPoint(90.01, 0), false);
assert.equal(validPoint(0, Infinity), false);
assert.equal(cleanLabel('\nhello\t'), 'hello');
assert.equal([...cleanLabel('🦊'.repeat(80))].length, 60);

const placeA = { label: "Zoë's place", lat: 40.714, lon: -74.015 };
const placeB = { label: '東京', lat: 35.689, lon: 139.692 };
const shared = new URL(halfwayUrl('https://lovefarfox.com', placeA, placeB));
assert.equal(shared.pathname, '/halfway-point-calculator/');
assert.equal(shared.searchParams.get('utm_campaign'), 'halfway_point');
assert.equal(shared.searchParams.get('utm_source'), 'partner_share');
assert.equal(shared.searchParams.get('utm_medium'), 'referral');
assert.equal(shared.searchParams.has('a'), false);
assert.equal(shared.searchParams.has('b'), false);
const shareParams = new URLSearchParams(shared.hash.slice(1));
assert.equal(shareParams.get('alat'), String(Math.round(placeA.lat * 100) / 100));
assert.equal(shareParams.get('alon'), String(Math.round(placeA.lon * 100) / 100));
assert.deepEqual(readHalfway(shared.hash), {
  a: { label: placeA.label, lat: 40.71, lon: -74.01 },
  b: { label: placeB.label, lat: 35.69, lon: 139.69 },
});
assert.throws(() => halfwayUrl('https://lovefarfox.com', { ...placeA, lat: 91 }, placeB));
for (const hash of [
  '',
  '#v=2&a=A&alat=10&alon=20&b=B&blat=30&blon=40',
  '#v=1&a=A&alat=91&alon=20&b=B&blat=30&blon=40',
  '#v=1&a=&alat=10&alon=20&b=B&blat=30&blon=40',
  `#${'a'.repeat(2001)}`,
]) assert.equal(readHalfway(hash), null);

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist/client');
const slug = 'halfway-point-calculator';
const path = `/${slug}/`;
const html = readFileSync(resolve(dist, slug, 'index.html'), 'utf8');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.match(html, /rel="canonical" href="https:\/\/lovefarfox\.com\/halfway-point-calculator\/"/);
assert.match(html, /FAQPage/);
assert.match(html, /data-app-cta="halfway_tool"/);
assert.match(readFileSync(resolve(dist, 'sitemap-0.xml'), 'utf8'), /halfway-point-calculator/);
let internalLinks = 0;
for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
  const target = resolve(dist, href.slice(1));
  assert.ok(existsSync(target) || existsSync(`${target}.html`), `Internal target exists: ${href}`);
  internalLinks++;
}
for (const page of [
  'tools',
  'reunion-countdown',
  'blog/long-distance-reunion-checklist',
  'blog/meeting-long-distance-partner-first-time',
]) {
  const source = readFileSync(resolve(dist, page, 'index.html'), 'utf8');
  assert.ok(source.includes(`href="${path}"`) || source.includes(`href="${path.slice(0, -1)}"`), `${page} links to calculator`);
}
for (const question of [
  'How do I find the halfway point between two cities?',
  'Why is our halfway point in the ocean?',
  'Is meeting halfway cheaper than one person visiting?',
  'Is it safe to meet a long-distance partner halfway for the first time?',
]) assert.ok(html.includes(question), `FAQ includes ${question}`);
for (const [name, a, b] of [
  ['New York–London', newYork, london],
  ['Los Angeles–Sydney', losAngeles, sydney],
  ['Paris–Berlin', paris, berlin],
  ['Toronto–Montreal', toronto, montreal],
]) {
  const ranked = fairestHubs(a, b);
  console.log(`${name}: ${ranked.length ? ranked.map(hub => `${hub.city} (${hub.fromKm.toFixed(1)}/${hub.toKm.toFixed(1)} km)`).join('; ') : 'no qualifying hubs'}`);
}
console.log(`Halfway calculator: math, hub ranking, partner-link validation, metadata, four inbound links and ${internalLinks} internal hrefs passed.`);
