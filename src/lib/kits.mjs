/**
 * Pure, dependency-free kit helpers shared by the shop page (build time),
 * the fulfilment webhook, and the back generator. Keep this free of heavy
 * imports (satori/sharp) so importing it into an Astro page stays cheap.
 */
export const SITE = 'https://lovefarfox.com';

/** Map a Printful sync-product name → kit slug, or null if not personalizable. */
export function kitSlugForName(name) {
  const n = String(name || '').toLowerCase();
  // The Oct 2026 Ballpark jersey is one product in three colourways; kitForColour adds the colourway.
  if (/ballpark/.test(n)) return BASEBALL.kit;
  // Baseball kits (check before generic "jersey").
  if (/baseball/.test(n)) {
    if (/\(red\)/.test(n)) return 'bb-red';
    if (/\(royal\)/.test(n)) return 'bb-royal';
    return 'bb-home'; // the plain "Baseball Jersey" (home pinstripe)
  }
  // Soccer kits — October 2026 drop. Both need the jersey context: the shop
  // also sells a Morse "I Love You" Tee, which must not get a jersey back.
  if (/jersey/.test(n) && /other\s*half/.test(n)) return /\bb\)|kit\s*b|\(b\)/.test(n) ? 'otherhalfb' : 'otherhalfa';
  if (/jersey/.test(n) && /morse\s*hoops/.test(n)) return 'morse';
  // Moose Lodge launches in Blush only.
  if (/jersey/.test(n) && /moose/.test(n)) return 'moose-blush';
  if (/jersey/.test(n) && /flyway/.test(n)) return 'flyway';
  // Soccer kits.
  if (/flight\s*path/.test(n)) return 'flight';
  if (/same\s*stars/.test(n)) return 'stars';
  if (/twilight/.test(n)) return 'twilight';
  if (/drop\s*zone/.test(n)) return 'dropzone';
  if (/paradise/.test(n)) return 'paradise';
  if (/dalmatian/.test(n)) return 'dalmatian';
  if (/mardi\s*gras/.test(n)) return 'mardigras';
  if (/champions/.test(n)) return 'champions';
  if (/\(white\)/.test(n)) return 'white';
  // Retired Oct 2026 — kept so in-flight orders still resolve a back.
  if (/coordinates/.test(n)) return 'chart';
  if (/\(orange\)/.test(n)) return 'orange';
  return null;
}

/** The kit whose back a shopper gets for this product in this colour: colourway kits get one back per colourway. */
export function kitForColour(name, colour) {
  const kit = kitSlugForName(name);
  const colourways = COLORWAY_KITS[kit]?.colorways;
  if (!colourways) return kit;
  const pick = colourways.find((c) => c.label.toLowerCase() === String(colour || '').toLowerCase()) || colourways[0];
  return `${kit}-${pick.key}`;
}

/** Public URL Printful fetches to get a personalized back for this kit/name/number. */
export function backUrl(kit, name, number) {
  const q = new URLSearchParams({ kit, name: name || '', number: number || '' });
  return `${SITE}/api/jersey-back.png?${q.toString()}`;
}

// --- Colourway products ------------------------------------------------------
// All-over-print jerseys report one catalog colour ("White") for every variant, so a
// product sold in several colourways tags each sync variant's external_id as
// `<kit>--<colourway>--<size>`; the shop's colour picker and the order webhook read it.

/** Les Séparés: one product, five colourways from the Far Fox palette. First is the default;
 *  the two pinks are kept apart in the picker. */
export const LES_SEPARES = {
  kit: 'les-separes',
  colorways: [
    { key: 'night', label: 'Night', hex: '#21182B' },
    { key: 'pink', label: 'Fox Pink', hex: '#FF6B8A' },
    { key: 'plum', label: 'Plum', hex: '#2D1B4E' },
    { key: 'lavender', label: 'Fox Purple', hex: '#B76CFD' },
    { key: 'raspberry', label: 'Raspberry', hex: '#963655' },
  ],
};
/** The Long Distance Club baseball jersey (Oct 2026): one product, three colourways, each with its own back. */
export const BASEBALL = {
  kit: 'ldc-baseball',
  colorways: [
    { key: 'cream', label: 'Cream Pinstripe', hex: '#F4ECE0' },
    { key: 'plum', label: 'Plum', hex: '#2D1B4E' },
    { key: 'pink', label: 'Fox Pink', hex: '#FF6B8A' },
  ],
};
const COLORWAY_KITS = { [LES_SEPARES.kit]: LES_SEPARES, [BASEBALL.kit]: BASEBALL };

export const colorwayExternalId = (kit, colorway, size) => `${kit}--${colorway}--${size}`;

/** The colourway a sync variant is tagged with ({ key, label, hex }), or null. */
export function variantColorway(variant) {
  const m = /^([a-z0-9-]+?)--([a-z0-9]+)--/.exec(String(variant?.external_id || ''));
  return (m && COLORWAY_KITS[m[1]]?.colorways.find((c) => c.key === m[2])) || null;
}

/** The colour a shopper picks for this variant: its colourway label, else Printful's colour. */
export const variantColor = (variant) => variantColorway(variant)?.label || variant?.color || null;

/** Pick the sync variant for a chosen size + colour: both, then size, then colour, then first. */
export function pickVariant(variants, size, color) {
  const eq = (a, b) => !!b && String(a || '').toLowerCase() === String(b).toLowerCase();
  return (size && color && variants.find((v) => eq(v.size, size) && eq(variantColor(v), color)))
    || (size && variants.find((v) => eq(v.size, size)))
    || (color && variants.find((v) => eq(variantColor(v), color)))
    || variants[0] || null;
}
