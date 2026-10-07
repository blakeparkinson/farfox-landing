import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRODUCT_COPY, PAIRS, kindOf, productPath, productTitle, relatedProducts, merchantFeedItems, merchantFeedXml } from '../src/lib/productPages.ts';

const products = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8')).products;

// Every product has its own copy, a kind with facts, and a unique, clean URL.
for (const p of products) {
  assert.ok(PRODUCT_COPY[p.id], `${p.name} has product copy`);
  assert.ok(kindOf(p).facts.length >= 3, `${p.name} has details`);
  assert.match(productPath(p), /^\/shop\/[a-z0-9-]+\/$/, productPath(p));
  assert.ok(!productTitle(p).includes('"') && productTitle(p).startsWith('Far Fox '), productTitle(p));
}
assert.equal(new Set(products.map(productPath)).size, products.length, 'product URLs are unique');
assert.equal(productPath({ name: 'Pocket Tee' }), '/shop/pocket-tee/');
assert.equal(productPath({ name: 'Long Distance FC Jersey (Les Séparés)' }), '/shop/long-distance-fc-jersey-les-separes/', 'accents fold into the word');
assert.equal(productPath({ name: 'Morse "I Love You" Tee' }), '/shop/morse-i-love-you-tee/');
assert.equal(productTitle({ name: 'Far Fox Airways Mug' }), 'Far Fox Airways Mug');

// Pairs point at each other, and each half recommends its other half first.
const ids = new Set(products.map((p) => p.id));
for (const [a, b] of Object.entries(PAIRS)) {
  assert.equal(PAIRS[b], a, `${a} and ${b} pair both ways`);
  if (ids.has(a) && ids.has(b)) assert.equal(relatedProducts(products.find((p) => p.id === a), products)[0].id, b);
}
for (const p of products) assert.ok(!relatedProducts(p, products).some((r) => r.id === p.id), `${p.name} never recommends itself`);

// One feed item per colour and size, with ids Merchant Center accepts and links that open on the variant.
const items = merchantFeedItems(products);
const expected = products.reduce((n, p) => n + Math.max(1, p.colors?.length ?? 0) * Math.max(1, p.sizes?.length ?? 0), 0);
assert.equal(items.length, expected);
assert.equal(new Set(items.map((i) => i.id)).size, items.length, 'feed ids are unique');
for (const i of items) {
  assert.ok(i.id.length <= 50, `${i.id} fits Merchant Center's 50-character id limit`);
  assert.ok(i.title.length <= 150 && i.description.length <= 5000, i.id);
  assert.match(i.price, /^\d+\.\d{2} USD$/);
  assert.match(i.imageLink, /^https:\/\/lovefarfox\.com\/.+\.png$/);
  if (i.apparel) assert.ok(i.color && i.size, `${i.id} apparel has colour and size`);
}
const tee = items.find((i) => i.title === 'Far Fox Pocket Tee, Berry, XL');
assert.equal(tee.link, 'https://lovefarfox.com/shop/pocket-tee/?color=Berry&size=XL');
assert.ok(tee.imageLink.includes('berry'), 'a variant item shows that colour');
const xml = merchantFeedXml(items);
assert.ok(xml.startsWith('<?xml') && xml.includes('xmlns:g="http://base.google.com/ns/1.0"'));
assert.equal(xml.split('<item>').length - 1, items.length);
assert.ok(!/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml), 'every ampersand is escaped');

console.log(`product pages: ${products.length} pages, ${items.length} feed items, all checks passed`);
