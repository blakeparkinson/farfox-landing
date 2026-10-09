/**
 * Far Fox Christmas ornament: Printful ceramic heart, 2-side print (catalog 900, variant 23144).
 * The same file prints on both faces. Print file is 978×972 (written at 2×); the design is drawn in
 * that space and previewed through Printful's own heart template so nothing important hits the rim.
 *
 *   node scripts/make-ornament.mjs [--preview out.jpg] [--top "NEW YORK"] [--bottom "LONDON"]
 *
 * Writes public/shop/designs/ornament-2026/ornament-heart.png (the stock design).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { foxyImage } from './foxy-art.mjs';

const W = 978, H = 972, SCALE = 2;
const OUT = new URL('../public/shop/designs/ornament-2026/', import.meta.url);
export const ORNAMENT = { pine: '#123B2A', pineLight: '#1F5A40', cream: '#F7EFE0', red: '#C8283A', gold: '#E2B44C', year: 2026 };
// Printful template 907656: the heart window sits at (233, 241), 2536×2520, in a 3000 px mockup.
const TEMPLATE = { url: 'https://files.cdn.printful.com/o/upload/api-template/8c/8cecf7c7efa6f0f7a372744cb6e6baf0?v=1748928621', left: 233, top: 241, w: 2536, h: 2520 };

async function loadFonts() {
  const files = [];
  for (const [family, query] of [['oswald', 'Oswald:wght@600'], ['playfair-italic', 'Playfair+Display:ital,wght@1,600']]) {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
    const url = css.match(/url\((https:[^)]+\.ttf)\)/)[1];
    const file = join(tmpdir(), `farfox-${family}.ttf`);
    await writeFile(file, Buffer.from(await fetch(url).then((r) => r.arrayBuffer())));
    files.push(file);
  }
  return files;
}

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
export function ornamentSvg(foxy, { top = 'MILES APART', bottom = 'CLOSE AT HEART' } = {}) {
  // The hanging hole sits at about (489, 176), so nothing goes above Foxy's hat.
  const fw = 336, fx = (W - fw) / 2, fy = 228;
  const line = (text, y, size) => `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="${size}" letter-spacing="${size * 0.12}" fill="${ORNAMENT.cream}">${esc(text)}</text>`;
  const fit = (text) => Math.min(60, Math.floor((520 / Math.max(6, String(text).length)) * 1.55));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><radialGradient id="glow" cx="0.5" cy="0.42" r="0.55"><stop offset="0" stop-color="${ORNAMENT.pineLight}"/><stop offset="1" stop-color="${ORNAMENT.pine}"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>${snow(42, 70)}${sparkle(215, 300, 34)}${sparkle(770, 270, 26)}${sparkle(820, 420, 16)}
    <image href="${foxy.href}" x="${fx}" y="${fy}" width="${fw}" height="${fw * foxy.aspect}"/>
    ${hat(fx, fy, fw)}
    ${line(top, 656, fit(top))}
    <g transform="translate(${W / 2} 688)"><path d="M-150 0 H-30 M30 0 H150" stroke="${ORNAMENT.gold}" stroke-width="3"/><path transform="translate(-16 -15) scale(0.32)" d="M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z" fill="${ORNAMENT.red}"/></g>
    ${line(bottom, 750, fit(bottom) * 0.82)}
    <text x="${W / 2}" y="811" text-anchor="middle" font-family="Playfair Display" font-style="italic" font-weight="600" font-size="36" fill="${ORNAMENT.gold}">Christmas ${ORNAMENT.year}</text>
  </svg>`;
}

export async function renderOrnament(text) {
  const fontFiles = await loadFonts();
  const foxy = await foxyImage('letter');
  const markup = ornamentSvg(foxy, text);
  return Buffer.from(new Resvg(markup, { fitTo: { mode: 'width', value: W * SCALE }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Oswald' } }).render().asPng());
}

async function preview(designs, out) {
  const overlay = Buffer.from(await fetch(TEMPLATE.url).then((r) => r.arrayBuffer()));
  const tiles = [];
  for (const png of designs) {
    const art = await sharp(png).resize(TEMPLATE.w, TEMPLATE.h).toBuffer();
    const full = await sharp({ create: { width: 3000, height: 3000, channels: 4, background: '#f4f1ec' } })
      .composite([{ input: art, left: TEMPLATE.left, top: TEMPLATE.top }, { input: overlay, left: 0, top: 0 }]).png().toBuffer();
    tiles.push(await sharp(full).resize(700).png().toBuffer());
  }
  await sharp({ create: { width: 700 * tiles.length, height: 700, channels: 3, background: '#f4f1ec' } })
    .composite(tiles.map((input, i) => ({ input, left: i * 700, top: 0 }))).jpeg({ quality: 70 }).toFile(out);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
  await mkdir(OUT, { recursive: true });
  const stock = await renderOrnament();
  await writeFile(new URL('ornament-heart.png', OUT), stock);
  console.log('[ornament] ornament-heart.png written');
  if (arg('--preview')) {
    const personal = await renderOrnament({ top: arg('--top') || 'NEW YORK', bottom: arg('--bottom') || 'LONDON' });
    await preview([stock, personal], arg('--preview'));
    console.log(`[ornament] preview → ${arg('--preview')}`);
  }
}
