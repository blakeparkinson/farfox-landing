import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PICKLEBALL_CITIES, pickleballCityOptions, citySelectionUrl, showInShop } from '../src/lib/pickleballCities.ts';
import { merchantFeedItems, productPath, kindOf } from '../src/lib/productPages.ts';

const products = JSON.parse(readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8')).products;
const editions = PICKLEBALL_CITIES.map(city => products.find(p => p.name === city.name));
assert.ok(editions.every(Boolean), 'all five city editions exist');
assert.equal(new Set(editions.map(p => p.id)).size, 5, 'each city routes to a distinct fulfillment product');
assert.equal(editions[0].id, '490239643', 'existing New York product and past orders keep their identity');
assert.equal(editions.filter(showInShop).length, 1, 'one Pickleball Club card in the shop');
for (const product of editions) {
  assert.equal(pickleballCityOptions(product, products).length, 5);
  assert.equal(product.price, 59);
  assert.match(kindOf(product).facts.join(' '), /Comfort Colors 1566/);
  assert.deepEqual(product.colors.map(c => c.name).sort(), ['Blue Jean', 'Blue Spruce', 'Butter', 'Crimson', 'Grey', 'Orchid', 'Pepper', 'Seafoam', 'True Navy']);
  for (const color of product.colors) {
    assert.ok(color.image && color.back, `${product.name} ${color.name} has both garment views`);
    for (const image of [color.image, color.back]) assert.ok(readFileSync(new URL(`../public${image}`, import.meta.url)).length > 0, `${image} exists`);
  }
  for (const color of product.colors) for (const size of color.sizes ?? product.sizes) {
    const url = new URL(citySelectionUrl(product, { color: color.name, size }), 'https://lovefarfox.com');
    assert.equal(url.pathname, productPath(product));
    assert.equal(url.searchParams.get('color'), color.name);
    assert.equal(url.searchParams.get('size'), size);
    assert.equal(url.searchParams.get('view'), 'back');
  }
  const unavailable = new URL(citySelectionUrl(product, { color: 'Invented', size: '99XL' }), 'https://lovefarfox.com');
  assert.equal(unavailable.searchParams.get('color'), product.colors[0].name);
  assert.ok((product.colors[0].sizes ?? product.sizes).includes(unavailable.searchParams.get('size')));
  const feed = merchantFeedItems([product]);
  assert.equal(feed.length, product.colors.reduce((n, c) => n + (c.sizes ?? product.sizes).length, 0));
  assert.ok(feed.every(i => i.link.includes(productPath(product))), 'shopping links open the correct city');
}
assert.deepEqual(pickleballCityOptions(products.find(p => p.id === '490151911'), products), [], 'Bowling has no Pickleball city picker');
// When an edition lacks the requested size in one colour, choose a valid size for that colour.
const limited = { ...editions[1], colors: [{ name: 'Pepper', hex: '#514f4c', sizes: ['M', 'L'] }] };
assert.equal(new URL(citySelectionUrl(limited, { color: 'Pepper', size: '3XL' }), 'https://lovefarfox.com').searchParams.get('size'), 'M');
console.log('Pickleball cities: distinct products, city navigation, available options, grouped shop and feed checks passed');
