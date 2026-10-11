import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Run after the build: the pages that carry the most photos stay light, and every optimised image exists.
const root = 'dist/client';
const BUDGET_MB = { 'shop/index.html': 3, 'index.html': 1.5, 'shop/pocket-tee/index.html': 0.6 };
for (const [page, budget] of Object.entries(BUDGET_MB)) {
  const html = readFileSync(join(root, page), 'utf8');
  const srcs = [...html.matchAll(/<img[^>]+src="(\/[^"]+)"/g)].map((m) => m[1]);
  for (const src of srcs.filter((s) => s.startsWith('/opt/'))) assert.ok(existsSync(join(root, src)), `${src} was generated`);
  const mb = srcs.reduce((sum, src) => sum + (existsSync(join(root, src)) ? statSync(join(root, src)).size : 0), 0) / 1e6;
  assert.ok(mb <= budget, `${page} images weigh ${mb.toFixed(2)} MB, over the ${budget} MB budget`);
  assert.ok(!srcs.some((s) => /^\/shop\/.+\.png$/.test(s)), `${page} shows no full-size shop PNGs`);
}
const shop = readFileSync(join(root, 'shop/index.html'), 'utf8');
assert.match(shop, /data-item-image="https:\/\/lovefarfox\.com\/shop\/[^"]+\.png"/, 'Snipcart keeps the full-size product photo');
console.log('image weight: all pages within budget');
