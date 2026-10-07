import assert from 'node:assert/strict';
import { isPrintifyItem, normaliseColour, pickPrintifyVariant, printifyAddress, buildPrintifyOrder, printifyVariantOptions } from '../src/lib/printifyOrder.mjs';

// A Printify product id routes to Printify; Printful's numeric ids and the digital map do not.
assert.equal(isPrintifyItem({ id: '6ac56a091644af57a506ee5b' }), true);
assert.equal(isPrintifyItem({ id: '478761994' }), false);
assert.equal(isPrintifyItem({ id: 'couple-map-digital' }), false);
assert.equal(isPrintifyItem({}), false);

// Printify's colour spelling and the shop's swatch label are the same value once normalised.
assert.equal(normaliseColour('Charcoal Heather/ Black'), 'Charcoal Heather / Black');
assert.equal(normaliseColour('Red / Black'), 'Red / Black');

// The shape Printify returns for a product: option tables plus variants that reference them by id.
const product = {
  options: [
    { name: 'Colors', type: 'color', values: [{ id: 1, title: 'Charcoal Heather/ Black' }, { id: 2, title: 'Red / Black' }] },
    { name: 'Sizes', type: 'size', values: [{ id: 10, title: 'M' }, { id: 11, title: '2XL' }, { id: 12, title: '3XL' }] },
  ],
  variants: [
    { id: 101, price: 8900, is_enabled: true, options: [1, 10] },
    { id: 102, price: 8900, is_enabled: true, options: [1, 11] },
    { id: 103, price: 8900, is_enabled: true, options: [2, 10] },
    { id: 104, price: 8900, is_enabled: false, options: [2, 12] },
  ],
};
assert.equal(printifyVariantOptions(product).length, 3, 'disabled variants are never offered');
assert.equal(pickPrintifyVariant(product, 'M', 'Red / Black').id, 103);
assert.equal(pickPrintifyVariant(product, '2XL', 'Charcoal Heather / Black').id, 102);
assert.equal(pickPrintifyVariant(product, 'm', 'red/black').id, 103, 'case and slash spacing do not matter');
assert.equal(pickPrintifyVariant(product, '3XL', 'Red / Black'), null, 'a combination that is not made is not substituted');
assert.equal(pickPrintifyVariant(product, '2XL', 'Red / Black'), null);

// Snipcart's address in Printify's shape; a one-word name still has a last name.
assert.deepEqual(printifyAddress({ fullName: 'Ada Lovelace King', address1: '1 Main St', city: 'Austin', province: 'TX', country: 'US', postalCode: '78701' }, 'a@b.co'),
  { first_name: 'Ada', last_name: 'Lovelace King', email: 'a@b.co', phone: '', country: 'US', region: 'TX', address1: '1 Main St', address2: '', city: 'Austin', zip: '78701' });
assert.equal(printifyAddress({ fullName: 'Cher' }).last_name, '-');

const order = buildPrintifyOrder({ externalId: 'snipcart-abc', ship: { fullName: 'A B' }, email: 'a@b.co', lineItems: [{ product_id: 'x', variant_id: 1, quantity: 1 }] });
assert.equal(order.external_id, 'snipcart-abc');
assert.equal(order.send_shipping_notification, false);
assert.equal(order.line_items.length, 1);

console.log('printify order: all checks passed');
