/**
 * Pure, dependency-free kit helpers shared by the shop page (build time),
 * the fulfilment webhook, and the back generator. Keep this free of heavy
 * imports (satori/sharp) so importing it into an Astro page stays cheap.
 */
export const SITE = 'https://lovefarfox.com';

/** Map a Printful sync-product name → kit slug, or null if not personalizable. */
export function kitSlugForName(name) {
  const n = String(name || '').toLowerCase();
  if (/flight\s*path/.test(n)) return 'flight';
  if (/same\s*stars/.test(n)) return 'stars';
  if (/coordinates/.test(n)) return 'chart';
  if (/twilight/.test(n)) return 'twilight';
  return null;
}

/** Public URL Printful fetches to get a personalized back for this kit/name/number. */
export function backUrl(kit, name, number) {
  const q = new URLSearchParams({ kit, name: name || '', number: number || '' });
  return `${SITE}/api/jersey-back.png?${q.toString()}`;
}
