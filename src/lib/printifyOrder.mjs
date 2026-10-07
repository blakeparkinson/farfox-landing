/**
 * Printify fulfilment helpers, shared by the Snipcart webhook and the catalog sync (plain JS, no deps).
 *
 * Printful products have numeric ids and Printify products 24-character hex ids, so a Snipcart line item's
 * id alone says which supplier makes it. Colour names are normalised the same way on both sides, so the
 * shop's swatch label is also the value the webhook matches against.
 */

const PRINTIFY_PRODUCT_ID = /^[0-9a-f]{24}$/;

export const isPrintifyItem = (item) => PRINTIFY_PRODUCT_ID.test(String(item?.id || ''));

/** Printify writes colours like "Charcoal Heather/ Black"; the shop shows "Charcoal Heather / Black". */
export const normaliseColour = (s) => String(s || '').replace(/\s*\/\s*/g, ' / ').replace(/\s+/g, ' ').trim();

/** The option titles (colour, size) of each enabled variant, read off the product's option table. */
export function printifyVariantOptions(product) {
  const titleOf = new Map();
  const kindOf = new Map();
  for (const opt of product?.options || []) {
    const kind = /colou?r/i.test(opt.name) ? 'colour' : /size/i.test(opt.name) ? 'size' : opt.name;
    for (const v of opt.values || []) { titleOf.set(v.id, v.title); kindOf.set(v.id, kind); }
  }
  return (product?.variants || []).filter((v) => v.is_enabled).map((v) => {
    const picked = { id: v.id, price: v.price, colour: null, size: null };
    for (const id of v.options || []) {
      if (kindOf.get(id) === 'colour') picked.colour = normaliseColour(titleOf.get(id));
      if (kindOf.get(id) === 'size') picked.size = titleOf.get(id);
    }
    return picked;
  });
}

/** The enabled variant for the shopper's colour + size, or null when that combination isn't made. */
export function pickPrintifyVariant(product, size, colour) {
  const variants = printifyVariantOptions(product);
  const wantColour = colour ? normaliseColour(colour).toLowerCase() : null;
  const wantSize = size ? String(size).trim().toLowerCase() : null;
  return variants.find((v) => (!wantColour || v.colour?.toLowerCase() === wantColour) && (!wantSize || v.size?.toLowerCase() === wantSize)) || null;
}

/** Snipcart's shipping address in Printify's shape. */
export function printifyAddress(ship = {}, email = '') {
  const [first, ...rest] = String(ship.fullName || ship.name || 'Customer').trim().split(/\s+/);
  return {
    first_name: first || 'Customer', last_name: rest.join(' ') || '-', email,
    phone: ship.phone || '', country: ship.country || '', region: ship.province || '',
    address1: ship.address1 || '', address2: ship.address2 || '', city: ship.city || '', zip: ship.postalCode || '',
  };
}

export function buildPrintifyOrder({ externalId, ship, email, lineItems }) {
  return {
    external_id: externalId,
    label: externalId,
    line_items: lineItems,
    shipping_method: 1,
    send_shipping_notification: false,
    address_to: printifyAddress(ship, email),
  };
}
