/**
 * The Far Fox Christmas ornament artwork (Printful ceramic heart, catalog 900, variant 23144), as pure SVG so
 * the print-file script and the live /api/ornament.png route draw exactly the same thing. Drawn in the
 * 978×972 print-file space; the hanging hole sits at about (489, 176), so nothing goes above Foxy's hat.
 */
export const W = 978, H = 972;
export const DEFAULT_TEXT = { top: 'MILES APART', bottom: 'CLOSE AT HEART' };
export const CITY_MAX = 16;
const HEART_D = 'M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z';

/** City names as they print: letters (accents kept), digits, spaces and .'-&, uppercased, at most 16 characters. */
export const sanitizeCity = (value) => String(value || '').normalize('NFC').toUpperCase().replace(/[^\p{L}\p{N} .'&-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, CITY_MAX);

export const ORNAMENT = { pine: '#123B2A', pineLight: '#1F5A40', cream: '#F7EFE0', red: '#C8283A', gold: '#E2B44C', year: 2026 };

function snow(seed, count) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: count }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H).toFixed(0)}" r="${(2 + r() * 5).toFixed(1)}" fill="${ORNAMENT.cream}" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`).join('');
}

/** Santa hat over Foxy's head, between the ears, flopping to the right. Coordinates are Foxy-relative (0–1). */
function hat(x, y, w) {
  const p = (fx, fy) => `${(x + fx * w).toFixed(1)} ${(y + fy * w).toFixed(1)}`;
  return `<path d="M${p(0.3, 0.215)} C ${p(0.34, 0.08)} ${p(0.52, -0.02)} ${p(0.7, 0.0)} C ${p(0.82, 0.02)} ${p(0.9, 0.1)} ${p(0.88, 0.2)} C ${p(0.8, 0.12)} ${p(0.72, 0.12)} ${p(0.7, 0.215)} Z" fill="${ORNAMENT.red}"/>
    <circle cx="${x + 0.885 * w}" cy="${y + 0.215 * w}" r="${0.055 * w}" fill="${ORNAMENT.cream}"/>
    <rect x="${x + 0.27 * w}" y="${y + 0.185 * w}" width="${0.46 * w}" height="${0.075 * w}" rx="${0.037 * w}" fill="${ORNAMENT.cream}"/>`;
}

const sparkle = (x, y, r) => `<path transform="translate(${x} ${y})" d="M0 ${-r} C ${r * 0.14} ${-r * 0.14} ${r * 0.14} ${-r * 0.14} ${r} 0 C ${r * 0.14} ${r * 0.14} ${r * 0.14} ${r * 0.14} 0 ${r} C ${-r * 0.14} ${r * 0.14} ${-r * 0.14} ${r * 0.14} ${-r} 0 C ${-r * 0.14} ${-r * 0.14} ${-r * 0.14} ${-r * 0.14} 0 ${-r} Z" fill="${ORNAMENT.gold}"/>`;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export function ornamentSvg(foxy, { top, bottom, preview = false } = {}) {
  top = sanitizeCity(top) || DEFAULT_TEXT.top;
  bottom = sanitizeCity(bottom) || DEFAULT_TEXT.bottom;
  // The hanging hole sits at about (489, 176), so nothing goes above Foxy's hat.
  const fw = 336, fx = (W - fw) / 2, fy = 228;
  const line = (text, y, size) => `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="${size}" letter-spacing="${size * 0.12}" fill="${ORNAMENT.cream}">${esc(text)}</text>`;
  const fit = (text) => Math.min(60, Math.floor((520 / Math.max(6, String(text).length)) * 1.55));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>${preview ? `<clipPath id="heart"><path transform="scale(${W / 100} ${H / 90})" d="${HEART_D}"/></clipPath>` : ''}<radialGradient id="glow" cx="0.5" cy="0.42" r="0.55"><stop offset="0" stop-color="${ORNAMENT.pineLight}"/><stop offset="1" stop-color="${ORNAMENT.pine}"/></radialGradient></defs>
    <g${preview ? ' clip-path="url(#heart)"' : ''}><rect width="${W}" height="${H}" fill="url(#glow)"/>${snow(42, 70)}${sparkle(215, 300, 34)}${sparkle(770, 270, 26)}${sparkle(820, 420, 16)}
    <image href="${foxy.href}" x="${fx}" y="${fy}" width="${fw}" height="${fw * foxy.aspect}"/>
    ${hat(fx, fy, fw)}
    ${line(top, 656, fit(top))}
    <g transform="translate(${W / 2} 688)"><path d="M-150 0 H-30 M30 0 H150" stroke="${ORNAMENT.gold}" stroke-width="3"/><path transform="translate(-16 -15) scale(0.32)" d="${HEART_D}" fill="${ORNAMENT.red}"/></g>
    ${line(bottom, 750, fit(bottom) * 0.82)}
    <text x="${W / 2}" y="811" text-anchor="middle" font-family="Playfair Display" font-style="italic" font-weight="600" font-size="36" fill="${ORNAMENT.gold}">Christmas ${ORNAMENT.year}</text></g>
  </svg>`;
}
