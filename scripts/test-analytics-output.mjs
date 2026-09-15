import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('../dist/client/', import.meta.url);
let checked = 0;
function check(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { check(path); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const html = readFileSync(path, 'utf8');
    if (!html.includes('/acquisition.js')) continue; // Layout-backed pages only.
    const tags = [...html.matchAll(/<script\b[^>]*>/g)].map(match => match[0]);
    const trackers = tags.filter(tag => tag.includes('https://cloud.umami.is/script.js'));
    assert.equal(trackers.length, 1, `${path}: exactly one direct tracker required`);
    assert.match(trackers[0], /data-website-id="9094af54-517f-4e51-bc4b-f2bf5f86d7f8"/);
    assert.match(trackers[0], /data-exclude-hash="true"/);
    assert.doesNotMatch(trackers[0], /type="module"/);
    assert.ok(html.includes('/analytics-privacy.js'), `${path}: Vercel privacy hook missing`);
    checked++;
  }
}
check(root.pathname);
assert.ok(checked > 20, 'Expected built site, not an empty fixture');
console.log(`Analytics production output: ${checked} pages preserve the classic tracker, website ID and hash privacy.`);
