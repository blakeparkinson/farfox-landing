import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]);
}
for (const path of files('src').filter(path => /\.(astro|ts)$/.test(path))) {
  assert.ok(!/\/(?:fox-(?:logo|face|letter|sleeping)|og-image)\.png/.test(readFileSync(path, 'utf8')), `Old branding referenced in ${path}`);
}
for (const [name, size] of [['face', 512], ['letter', 640], ['icon', 180]]) {
  const png = readFileSync(`public/brand/foxy-${name}-v1.png`);
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
  assert.equal(png[25], 6, 'Approved PNG export retains alpha');
}
for (const name of ['face', 'icon']) {
  assert.deepEqual(readFileSync(`src/assets/foxy-${name}-v1.png`), readFileSync(`public/brand/foxy-${name}-v1.png`), 'Page and social-card artwork match');
}
const card = readFileSync('dist/client/brand-preview.png');
assert.equal(card.readUInt32BE(16), 1200);
assert.equal(card.readUInt32BE(20), 630);
console.log('Approved Foxy assets, page references, transparency, and social-card dimensions passed.');
