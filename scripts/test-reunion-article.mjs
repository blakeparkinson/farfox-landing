import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist/client');
const slug = 'long-distance-reunion-checklist';
const path = `/blog/${slug}/`;
const html = readFileSync(resolve(dist, `blog/${slug}/index.html`), 'utf8');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.match(html, /rel="canonical" href="https:\/\/lovefarfox.com\/blog\/long-distance-reunion-checklist\/"/);
assert.match(html, /"datePublished":"2026-09-15"/);
assert.match(html, /FAQPage/);
assert.match(html, /href="\/reunion-countdown\/"/);
assert.match(html, /data-website-id="9094af54-517f-4e51-bc4b-f2bf5f86d7f8"/);
assert.match(readFileSync(resolve(dist, 'sitemap-0.xml'), 'utf8'), /long-distance-reunion-checklist/);
for (const page of ['blog', 'reunion-countdown', 'blog/meeting-long-distance-partner-first-time', 'blog/post-visit-blues-long-distance-relationship']) {
  assert.ok(readFileSync(resolve(dist, page, 'index.html'), 'utf8').includes(`href="${path}"`), `${page} links to article`);
}
for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
  const target = resolve(dist, href.slice(1));
  assert.ok(existsSync(target) || existsSync(`${target}.html`), `Internal target exists: ${href}`);
}
const og = readFileSync(resolve(dist, `blog/${slug}/og.png`));
assert.equal(og.readUInt32BE(16), 1200);
assert.equal(og.readUInt32BE(20), 630);
const pins = JSON.parse(readFileSync(resolve(root, 'docs/growth/reunion-pins.json'), 'utf8'));
assert.equal(pins.length, 3);
assert.equal(new Set(pins.map(pin => pin.id)).size, 3);
for (const pin of pins) {
  assert.ok(pin.title.length <= 100 && pin.description.length <= 800);
  const url = new URL(pin.link);
  assert.equal(url.pathname, path);
  assert.equal(url.searchParams.get('utm_content'), pin.id);
  assert.equal(url.searchParams.get('utm_source'), 'pinterest');
}
console.log('Reunion article: metadata, sitemap, links, social card, tracker and three pin drafts passed.');
