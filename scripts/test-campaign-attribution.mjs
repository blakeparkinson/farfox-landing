import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { campaignAttribution } from '../src/lib/campaignAttribution.ts';
const source = readFileSync(new URL('../public/acquisition.js', import.meta.url), 'utf8');
const storage = new Map();
function visit(search) {
  const window = {};
  runInNewContext(source, { window, location: { search }, URLSearchParams, sessionStorage: {
    getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value),
  }});
  return campaignAttribution(window.farfoxAcquisition, new URLSearchParams(search));
}
const first = visit('?utm_source=pinterest&utm_medium=pin&utm_campaign=pinterest_growth_01&utm_content=03-date-night');
assert.equal(first.content, '03-date-night');
assert.deepEqual(visit('?utm_source=blog&utm_medium=onsite&utm_campaign=love_profile_loop'), first);
assert.deepEqual(visit(''), first);
assert.equal(visit('?utm_source=pinterest&utm_medium=pin&utm_content=09-texting-games').content, '09-texting-games');
assert.equal(visit('').campaign, '');
assert.equal(campaignAttribution({}, new URLSearchParams()).source, 'direct');
assert.equal(Object.keys(campaignAttribution({ name: 'private' }, new URLSearchParams('email=private'))).length, 5);
// Preserve the storage/error/privacy regressions covered by the original suite.
assert.equal(visit('?utm_source=pinterest&utm_medium=organic_social&utm_campaign=maps&names=Private').campaign, 'maps');
assert.equal([...storage.values()].join('').includes('Private'), false);
assert.equal(visit('?utm_source=google&utm_medium=cpc').campaign, '');
storage.set('farfox_acquisition_v1', 'invalid json');
assert.equal(visit('').source, 'direct');
const blockedWindow = {};
runInNewContext(source, { window: blockedWindow, location: { search: '?utm_source=pinterest' }, URLSearchParams,
  sessionStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } },
});
assert.equal(blockedWindow.farfoxAcquisition.utm_source, 'pinterest');
assert.equal(visit('?utm_source=' + 'x'.repeat(300)).source.length, 200);
console.log('Campaign attribution: pin → blog → quiz, replacement, direct and field allowlist passed.');
