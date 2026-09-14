import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page = slug => readFileSync(new URL(`../dist/client/blog/${slug}/index.html`, import.meta.url), 'utf8');
const game = page('long-distance-relationship-games');
assert.match(game, /id="couples-game"/);
assert.match(game, /foxy-letter-v1.png/);
assert.match(game, /Auto-advance/);
assert.match(game, /<noscript>/);
assert.match(game, /data-pick="0" disabled/);
assert.match(game, /data-pick="1" disabled/);
assert.match(game, /no login/);
for (const slug of ['long-distance-relationship-statistics', 'long-distance-relationship-timeline', 'love-letter-prompts-long-distance']) {
  const html = page(slug);
  assert.match(html, /Updated September 14, 2026/);
  assert.match(html, /"dateModified":"2026-09-14"/);
  assert.ok(!html.includes('id="couples-game"'), 'Only games article mounts the game');
  assert.ok(html.includes(`/blog/${slug}`), 'Existing canonical route retained');
}
const stats = page('long-distance-relationship-statistics');
assert.match(stats, /10.1111\/j.1545-5300.2012.01418.x/);
assert.ok(!stats.includes('single strongest predictor. Couples'));
console.log('Growth pages: SSR fallback, brand, update metadata and source links passed.');
