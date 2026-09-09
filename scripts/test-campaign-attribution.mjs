import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const code = readFileSync(new URL('../public/acquisition.js', import.meta.url), 'utf8');
let saved = null;
const storage = { getItem: () => saved, setItem: (_, value) => { saved = value; } };
function visit(search, sessionStorage = storage) {
  const window = {};
  runInNewContext(code, { location: { search }, sessionStorage, URLSearchParams, window });
  return window.farfoxAcquisition;
}
assert.equal(visit('?utm_source=pinterest&utm_medium=organic_social&utm_campaign=maps&names=Private').utm_campaign, 'maps');
assert.equal(visit('').utm_source, 'pinterest');
assert.equal(visit('?utm_source=homepage&utm_medium=onsite&utm_campaign=quiz').utm_campaign, 'maps');
assert.equal(saved.includes('Private'), false);
assert.equal(visit('?utm_source=google&utm_medium=cpc').utm_campaign, undefined);
assert.equal(visit('').utm_source, 'google');
saved = 'invalid json';
assert.equal(visit('').utm_source, undefined);
const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
assert.equal(visit('?utm_source=pinterest', blocked).utm_source, 'pinterest');
assert.equal(visit('?utm_source=' + 'x'.repeat(300)).utm_source.length, 200);
console.log('Campaign persistence, internal promotions, replacement, privacy, and blocked-storage checks passed.');
