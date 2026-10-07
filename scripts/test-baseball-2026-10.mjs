import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { BASEBALL, colorwayExternalId, kitForColour, kitSlugForName, pickVariant, variantColor } from '../src/lib/kits.mjs';
import { isKnownKit, renderJerseyBack } from '../src/lib/jerseyBack.mjs';

const NAME = 'Far Fox — Ballpark Baseball Jersey';

// The Ballpark jersey is personalisable, and each colourway has its own back.
assert.equal(kitSlugForName(NAME), BASEBALL.kit);
for (const { key, label } of BASEBALL.colorways) {
  assert.equal(kitForColour(NAME, label), `${BASEBALL.kit}-${key}`);
  assert.ok(isKnownKit(`${BASEBALL.kit}-${key}`), `${key} has a back config`);
  for (const part of ['front', 'back', 'sleeve-left', 'sleeve-right', 'pattern']) {
    assert.ok(existsSync(new URL(`../public/shop/designs/baseball-2026-10/${BASEBALL.kit}-${key}-${part}.png`, import.meta.url)), `${key} ${part} exists`);
  }
}
assert.equal(kitForColour(NAME, 'Teal'), `${BASEBALL.kit}-cream`, 'an unknown colour falls back to the first colourway');
assert.equal(kitForColour(NAME, null), `${BASEBALL.kit}-cream`);

// The old single-colour kits keep resolving, so in-flight orders still get their back.
assert.equal(kitForColour('Far Fox — Long Distance Club Baseball Jersey (Red)', 'White'), 'bb-red');
assert.equal(kitForColour('Far Fox — Long Distance Club Baseball Jersey', 'White'), 'bb-home');
assert.equal(kitForColour('Far Fox — Long Distance FC Jersey (Les Séparés)', 'Plum'), null, 'Les Séparés is still not personalisable');

// The webhook's pick: the shopper's colour + size select that colourway's variant, whose colour gives its back.
const variants = BASEBALL.colorways.flatMap(({ key }) => ['M', 'XL'].map((size) => ({ id: `${key}-${size}`, size, color: 'White', external_id: colorwayExternalId(BASEBALL.kit, key, size) })));
const plumXL = pickVariant(variants, 'XL', 'Plum');
assert.equal(plumXL.id, 'plum-XL');
assert.equal(kitForColour(NAME, variantColor(plumXL)), `${BASEBALL.kit}-plum`);

// A personalised back renders at the print area's proportions (5700×6900), never square.
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const m = /baseball-2026-10\/(.+-pattern\.png)$/.exec(String(url));
  return m ? new Response(readFileSync(new URL(`../public/shop/designs/baseball-2026-10/${m[1]}`, import.meta.url))) : realFetch(url, init);
};
try {
  const png = await renderJerseyBack({ kit: `${BASEBALL.kit}-pink`, name: 'Amanda', number: '7', size: 570 });
  const meta = await sharp(png).metadata();
  assert.deepEqual([meta.width, meta.height], [570, 690]);
} finally {
  globalThis.fetch = realFetch;
}

console.log('baseball 2026-10: ok');
