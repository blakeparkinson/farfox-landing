import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DIGITAL_MAP_PRICE,
  DIGITAL_MAP_SKU,
  mapInputFromCustomFields,
  renderCoupleMap,
  sanitizeMapInput,
} from '../src/lib/coupleMap.mjs';
import {
  fetchSnipcartOrder,
  isPaidOrder,
  mapDownloadUrl,
  mapInputFromOrder,
  mapNotification,
  partitionOrderItems,
} from '../src/lib/digitalMapOrder.mjs';
import {
  signEtsyRedemption,
  validateEtsyReceipt,
  verifyEtsyRedemption,
} from '../src/lib/etsyReceipt.mjs';

const root = resolve(import.meta.dirname, '..');
const builtPage = resolve(root, 'dist/client/personalized-long-distance-map/index.html');
assert.ok(existsSync(builtPage), 'Run npm run build before the digital map contract test');
const html = readFileSync(builtPage, 'utf8');
const webhook = readFileSync(resolve(root, 'src/pages/api/snipcart-webhook.ts'), 'utf8');

const input = sanitizeMapInput({
  from: '<b>New York</b>',
  to: 'London',
  fromLat: 999,
  fromLon: -74,
  toLat: 51.5,
  toLon: -0.12,
  names: '<script>A & B</script>',
  message: 'Same sky',
  palette: 'not-real',
});
assert.equal(input.from, 'bNew York/b');
assert.equal(input.fromLat, 90);
assert.equal(input.names.includes('<'), false);
assert.equal(input.palette, 'sunset');

const fields = [
  { name: 'From', value: 'New York, USA' },
  { name: 'To', value: 'London, UK' },
  { name: 'From Latitude', value: '40.7128' },
  { name: 'From Longitude', value: '-74.006' },
  { name: 'To Latitude', value: '51.5072' },
  { name: 'To Longitude', value: '-0.1276' },
  { name: 'Names', value: 'Alex & Jordan' },
  { name: 'Message', value: 'Still us.' },
  { name: 'Date', value: '2024' },
  { name: 'Palette', value: 'ocean' },
];
const parsed = mapInputFromCustomFields(fields);
assert.equal(parsed.fromLat, 40.7128);
assert.equal(parsed.palette, 'ocean');

const order = {
  token: 'order/token',
  paymentStatus: 'Paid',
  items: [
    { id: DIGITAL_MAP_SKU, customFields: fields },
    { id: 'physical-123', customFields: [] },
  ],
};
const partitioned = partitionOrderItems(order.items);
assert.equal(partitioned.digital.length, 1);
assert.equal(partitioned.physical.length, 1);
assert.ok(isPaidOrder(order));
assert.equal(isPaidOrder({ paymentStatus: 'Pending' }), false);
assert.equal(mapInputFromOrder(order).names, 'Alex & Jordan');
assert.equal(
  mapDownloadUrl('https://lovefarfox.com', order.token),
  'https://lovefarfox.com/api/couple-map-download.png?order=order%2Ftoken',
);
assert.match(mapNotification('https://lovefarfox.com', order.token).message, /order%2Ftoken/);

let requested;
const fetched = await fetchSnipcartOrder('paid-token', 'secret-key', async (url, options) => {
  requested = { url, options };
  return { ok: true, json: async () => order };
});
assert.equal(fetched.token, order.token);
assert.match(requested.url, /paid-token$/);
assert.match(requested.options.headers.Authorization, /^Basic /);

const redemption = signEtsyRedemption({ receiptId: '12345', exp: Date.now() + 60_000 }, 'redemption-secret');
assert.equal(verifyEtsyRedemption(redemption, 'redemption-secret').receiptId, '12345');
assert.equal(verifyEtsyRedemption(`${redemption}x`, 'redemption-secret'), null);
const etsyReceipt = await validateEtsyReceipt({
  receiptId: '12345',
  email: 'buyer@example.com',
  shopId: 'shop',
  listingId: '987',
  apiKey: 'key',
  accessToken: 'token',
  fetcher: async () => ({
    ok: true,
    json: async () => ({
      is_paid: true,
      is_canceled: false,
      buyer_email: 'buyer@example.com',
      transactions: [{ listing_id: 987 }],
    }),
  }),
});
assert.ok(etsyReceipt, 'Paid matching Etsy receipt can redeem the map');

const first = await renderCoupleMap(parsed, 400);
const second = await renderCoupleMap(parsed, 400);
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
assert.equal(hash(first), hash(second), 'Identical inputs must render deterministically');
assert.ok(first.length > 10_000, 'Rendered PNG must contain real artwork');

assert.ok(html.includes(`data-item-id="${DIGITAL_MAP_SKU}"`), 'Snipcart can crawl the digital SKU');
assert.ok(html.includes(`data-item-price="${DIGITAL_MAP_PRICE}"`), 'Built price matches the revenue model');
assert.ok(html.includes('data-item-shippable="false"'), 'Digital product never requests shipping');
for (const event of ['map_offer_view', 'map_preview_completed', 'map_checkout_started', 'map_purchase', 'map_download']) {
  assert.ok(html.includes(event), `${event} is instrumented`);
}
assert.ok(webhook.includes('partitionOrderItems(items)'), 'Webhook separates digital and physical fulfillment');
assert.ok(webhook.includes('emailMapDownload(order)'), 'Webhook emails the protected download');

console.log('Digital map product, payment authorization, rendering, and fulfillment contracts passed.');
