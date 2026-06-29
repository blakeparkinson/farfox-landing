/**
 * Pure, dependency-free kit helpers shared by the shop page (build time),
 * the fulfilment webhook, and the back generator. Keep this free of heavy
 * imports (satori/sharp) so importing it into an Astro page stays cheap.
 */
export const SITE = 'https://lovefarfox.com';

/** Map a Printful sync-product name → kit slug, or null if not personalizable. */
export function kitSlugForName(name) {
  const n = String(name || '').toLowerCase();
  // Baseball kits (check before generic "jersey").
  if (/baseball/.test(n)) {
    if (/\(red\)/.test(n)) return 'bb-red';
    if (/\(royal\)/.test(n)) return 'bb-royal';
    return 'bb-home'; // the plain "Baseball Jersey" (home pinstripe)
  }
  // Soccer kits.
  if (/flight\s*path/.test(n)) return 'flight';
  if (/same\s*stars/.test(n)) return 'stars';
  if (/coordinates/.test(n)) return 'chart';
  if (/twilight/.test(n)) return 'twilight';
  if (/drop\s*zone/.test(n)) return 'dropzone';
  if (/paradise/.test(n)) return 'paradise';
  if (/champions/.test(n)) return 'champions';
  if (/\(orange\)/.test(n)) return 'orange';
  if (/\(white\)/.test(n)) return 'white';
  return null;
}

/** Public URL Printful fetches to get a personalized back for this kit/name/number. */
export function backUrl(kit, name, number) {
  const q = new URLSearchParams({ kit, name: name || '', number: number || '' });
  return `${SITE}/api/jersey-back.png?${q.toString()}`;
}
