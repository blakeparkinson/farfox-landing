import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page = slug => readFileSync(new URL(`../dist/client/blog/${slug}/index.html`, import.meta.url), 'utf8');
const game = page('long-distance-relationship-games');
assert.match(game, /id="couples-game"/);
assert.match(game, /foxy-letter-v1.png/);
assert.match(game, /Auto-advance/);
assert.match(game, /Copy partner link/);
assert.match(game, /They answer before seeing your choice/);
assert.match(game, /<noscript>/);
assert.match(game, /data-pick="0" disabled/);
assert.match(game, /data-pick="1" disabled/);
assert.match(game, /no login/);
const updatedPages = new Map([
  ['long-distance-relationship-statistics', 'September 16, 2026'],
  ['long-distance-relationship-time-zones', 'September 16, 2026'],
  ['meeting-long-distance-partner-first-time', 'September 16, 2026'],
  ['long-distance-relationship-timeline', 'September 14, 2026'],
  ['love-letter-prompts-long-distance', 'September 14, 2026'],
]);
for (const [slug, date] of updatedPages) {
  const html = page(slug);
  assert.ok(html.includes(`Updated ${date}`));
  const iso = date.includes('16') ? '2026-09-16' : '2026-09-14';
  assert.ok(html.includes(`"dateModified":"${iso}"`));
  assert.ok(!html.includes('id="couples-game"'), 'Only games article mounts the game');
  assert.ok(html.includes(`/blog/${slug}`), 'Existing canonical route retained');
}
const stats = page('long-distance-relationship-statistics');
assert.match(stats, /10.1111\/j.1545-5300.2012.01418.x/);
assert.ok(!stats.includes('single strongest predictor. Couples'));
assert.match(stats, /What Studies Show/);
assert.match(page('long-distance-relationship-time-zones'), /Compare your cities with the free time-zone calculator/);
assert.match(page('meeting-long-distance-partner-first-time'), /Keep control of your own travel home/);
console.log('Growth pages: SSR fallback, brand, update metadata and source links passed.');
