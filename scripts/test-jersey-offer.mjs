/**
 * Static contract checks for the Snipcart -> Printful purchase path.
 * Run after `npm run build` so Snipcart's crawlable product metadata is
 * checked in the same HTML that will be deployed.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const builtPage = resolve(root, 'dist/client/personalized-long-distance-jersey/index.html');
assert.ok(existsSync(builtPage), 'Build the site before running the jersey offer checks');

const html = readFileSync(builtPage, 'utf8');
const catalog = JSON.parse(readFileSync(resolve(root, 'src/data/catalog.json'), 'utf8'));
const webhook = readFileSync(resolve(root, 'src/pages/api/snipcart-webhook.ts'), 'utf8');
const homepage = readFileSync(resolve(root, 'src/pages/index.astro'), 'utf8');
const giftGuide = readFileSync(resolve(root, 'src/content/blog/long-distance-relationship-gifts.md'), 'utf8');

const ids = ['443266866', '443266945', '443213452', '443164966'];

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
  html.includes('data-item-url="/personalized-long-distance-jersey"'),
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
assert.ok(giftGuide.includes('](/personalized-long-distance-jersey)'), 'Gift guide routes high-intent readers to the offer');

console.log(`Jersey offer contract passed for ${ids.length} products.`);
