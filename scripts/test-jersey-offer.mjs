/**
 * Static contract checks for the Snipcart -> Printful purchase path.
 * Run after `npm run build` so Snipcart's crawlable product metadata is
 * checked in the same HTML that will be deployed.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { kitSlugForName, isOrnamentName, ornamentUrl } from '../src/lib/kits.mjs';
import { sanitizeCity } from '../src/lib/ornamentArt.mjs';
import { kitConfig } from '../src/lib/jerseyBack.mjs';
import { BACKS, mooseBack } from './kit-designs-2026-10.mjs';
import { BACKS as HOLIDAY_BACKS } from './kit-designs-holiday-2026.mjs';

const root = resolve(import.meta.dirname, '..');
const builtPage = resolve(root, 'dist/client/personalized-long-distance-jersey/index.html');
assert.ok(existsSync(builtPage), 'Build the site before running the jersey offer checks');

const html = readFileSync(builtPage, 'utf8');
const catalog = JSON.parse(readFileSync(resolve(root, 'src/data/catalog.json'), 'utf8'));
const webhook = readFileSync(resolve(root, 'src/pages/api/snipcart-webhook.ts'), 'utf8');
const homepage = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
const giftGuide = readFileSync(resolve(root, 'src/content/blog/long-distance-relationship-gifts.md'), 'utf8');

// The page picks cards by kit, so check whatever it rendered against the catalog.
const ids = [...new Set([...html.matchAll(/data-item-id="(\d+)"/g)].map((m) => m[1]))];
assert.ok(ids.length >= 4, `At least four personalized jerseys are offered (found ${ids.length})`);
for (const retired of ['443266945', '437126197']) {
  assert.ok(!ids.includes(retired), `Retired kit ${retired} (Coordinates/Orange) is not offered`);
  assert.ok(!catalog.products.some((item) => item.id === retired), `Retired kit ${retired} is out of the catalog`);
}
const offerPage = readFileSync(resolve(root, 'src/pages/personalized-long-distance-jersey.astro'), 'utf8');
assert.ok(offerPage.includes('Each of you wears half.'), 'Other Half A and B are presented as a pair');

// October 2026 kits resolve from their Printful product names...
for (const [name, kit] of [
  ['Far Fox — Long Distance FC Jersey (Other Half A)', 'otherhalfa'],
  ['Far Fox — Long Distance FC Jersey (Other Half B)', 'otherhalfb'],
  ['Far Fox — Long Distance FC Jersey (Morse Hoops)', 'morse'],
  ['Far Fox — Long Distance FC Jersey (Coordinates)', 'chart'],
  ['Far Fox — Long Distance FC Jersey (Orange)', 'orange'],
  ['Far Fox — Long Distance FC Jersey (Moose Lodge)', 'moose-blush'],
  ['Far Fox — Long Distance FC Jersey (Moose Lodge – Blush)', 'moose-blush'],
  ['Far Fox — Long Distance FC Jersey (Flyway)', 'flyway'],
  // Until the Printful product is renamed it keeps resolving to the retired kit.
  ['Far Fox — Long Distance FC Jersey (Mardi Gras)', 'mardigras'],
  // Non-jersey products must never be treated as personalizable kits.
  ['Far Fox — Morse "I Love You" Tee', null],
  ['Far Fox — I Moose You Mug', null],
]) {
  assert.equal(kitSlugForName(name), kit, `${name} maps to ${kit}`);
}
// ...and their personalized backs use exactly the handoff's lettering config.
// `moose` in BACKS is the unlaunched Lodge colorway; only Blush ships, as moose-blush.
for (const [kit, expected] of Object.entries(BACKS).filter(([kit]) => kit !== 'moose')) {
  assert.deepEqual({ ...kitConfig(kit) }, expected, `jerseyBack.mjs ${kit} matches BACKS in kit-designs-2026-10.mjs`);
}
// Holiday 2026 kits: the renderer's lettering matches the designs, and the product names map to them.
for (const [kit, expected] of Object.entries(HOLIDAY_BACKS).filter(([kit]) => kit !== 'mistletoe')) {
  assert.deepEqual({ ...kitConfig(kit) }, expected, `jerseyBack.mjs ${kit} matches BACKS in kit-designs-holiday-2026.mjs`);
}
for (const [name, kit] of [['Long Distance FC Jersey (Cobweb)', 'cobweb'], ['Long Distance FC Jersey (Candy Corn)', 'candycorn'], ['Long Distance FC Jersey (Fair Isle)', 'fairisle'], ['Long Distance FC Jersey (Red Nose)', 'rednose']]) {
  assert.equal(kitSlugForName(name), kit, `${name} gets the ${kit} back`);
}
// The ornament: only it takes cities, the inputs print safely, and the webhook swaps in the personalised file.
assert.ok(isOrnamentName('"Miles Apart" Heart Ornament') && !isOrnamentName('Heart Eyes Mug'));
assert.equal(sanitizeCity('  são   paulo <script>'), 'SÃO PAULO SCRIPT');
assert.equal(sanitizeCity('Llanfairpwllgwyngyll'), 'LLANFAIRPWLLGWYN', 'cities are capped at 16 characters');
assert.equal(ornamentUrl('NEW YORK', 'LONDON'), 'https://lovefarfox.com/api/ornament.png?top=NEW+YORK&bottom=LONDON');
assert.match(webhook, /isOrnamentName\(productName\) && \(cityA \|\| cityB\)/, 'the webhook prints personalised ornaments');
assert.deepEqual({ ...kitConfig('moose-blush') }, mooseBack('blush'), 'jerseyBack.mjs moose-blush matches mooseBack("blush")');
assert.equal(kitConfig('moose'), null, 'Only the Blush Moose Lodge colorway is configured');
// Retired kits keep a back so existing orders still render.
for (const kit of ['chart', 'orange']) assert.ok(kitConfig(kit), `${kit} still renders a back`);

for (const id of ids) {
  const product = catalog.products.find((item) => item.id === id);
  assert.ok(product, `Featured product ${id} is present in the Printful catalog`);
  assert.ok(product.sizes?.length, `${id} has purchasable sizes`);
  assert.match(html, new RegExp(`data-item-id="${id}"`), `${id} is crawlable by Snipcart`);
  assert.match(html, new RegExp(`data-item-price="${product.price}"`), `${id} price matches the catalog`);
}

for (const field of ['Size', 'Name', 'Number']) {
  assert.ok(html.includes(`data-item-custom`) && html.includes(`name="${field}"`), `${field} custom field is rendered`);
  assert.ok(webhook.includes(`fv('${field.toLowerCase()}')`), `${field} is consumed by the fulfillment webhook`);
}

assert.ok(
  html.includes('data-item-url="/personalized-long-distance-jersey/"'),
  'Snipcart validates products against the focused offer URL',
);
assert.ok(webhook.includes('backUrl(kit, name, number)'), 'Personalized artwork is forwarded to Printful');

for (const event of [
  'jersey_offer_view',
  'jersey_design_view',
  'jersey_personalized',
  'jersey_add_to_cart',
  'jersey_purchase',
]) {
  assert.ok(html.includes(event), `${event} analytics event is included`);
}

assert.ok(homepage.includes('/personalized-long-distance-jersey'), 'Homepage routes visitors to the offer');
assert.ok(giftGuide.includes('](/personalized-long-distance-jersey/)'), 'Gift guide routes high-intent readers to the offer');

console.log(`Jersey offer contract passed for ${ids.length} products.`);
