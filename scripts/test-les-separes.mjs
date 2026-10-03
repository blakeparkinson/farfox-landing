import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { LES_SEPARES, colorwayExternalId, kitSlugForName, pickVariant, variantColor, variantColorway } from '../src/lib/kits.mjs';

const NAME = 'Far Fox — Long Distance FC Jersey (Les Séparés)';
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'];

// No number on the back: the product must never be treated as a personalizable kit.
assert.equal(kitSlugForName(NAME), null, 'Les Séparés is not personalizable');

// Colourways are unique and every one has its print files.
const keys = LES_SEPARES.colorways.map((c) => c.key), labels = LES_SEPARES.colorways.map((c) => c.label);
assert.equal(new Set(keys).size, keys.length, 'colourway keys are unique');
assert.equal(new Set(labels).size, labels.length, 'colourway labels are unique');
for (const key of keys) {
  for (const file of [`${key}-front.jpg`, `${key}-back.jpg`, `${key}-sleeve.png`, `${key}-label.png`]) {
    assert.ok(existsSync(new URL(`../public/shop/designs/les-separes/${file}`, import.meta.url)), `${file} exists`);
  }
}

// Tagged variants resolve to their colourway; untagged ones keep Printful's colour.
assert.deepEqual(variantColorway({ external_id: 'les-separes--night--M' }), LES_SEPARES.colorways[0]);
assert.equal(variantColor({ external_id: 'les-separes--pink--2XL', color: 'White' }), 'Fox Pink');
assert.equal(variantColor({ external_id: '6abaa7bdc95692', color: 'White' }), 'White', 'untagged variant keeps its colour');
assert.equal(variantColorway({ external_id: 'les-separes--teal--M' }), null, 'unknown colourway is not invented');
assert.equal(variantColorway({ external_id: 'other-kit--night--M' }), null, 'unknown kit is not invented');

// The webhook's pick: the shopper's colour + size select exactly that variant.
const variants = LES_SEPARES.colorways.flatMap(({ key }) => SIZES.map((size, i) => ({ id: `${key}-${size}`, size, color: 'White', external_id: colorwayExternalId(LES_SEPARES.kit, key, size), i })));
for (const { key, label } of LES_SEPARES.colorways) {
  for (const size of SIZES) assert.equal(pickVariant(variants, size, label).id, `${key}-${size}`, `${label} / ${size}`);
}
assert.equal(pickVariant(variants, 'M', 'fox purple').id, 'lavender-M', 'colour match ignores case');

// Ordinary products behave as before.
const tee = [{ id: 1, size: 'M', color: 'White' }, { id: 2, size: 'M', color: 'Black' }, { id: 3, size: 'L', color: 'Black' }];
assert.equal(pickVariant(tee, 'M', 'Black').id, 2);
assert.equal(pickVariant(tee, 'L', null).id, 3);
assert.equal(pickVariant(tee, null, 'Black').id, 2);
assert.equal(pickVariant(tee, null, null).id, 1);
assert.equal(pickVariant([], 'M', 'Black'), null);

console.log('les-separes: ok');
