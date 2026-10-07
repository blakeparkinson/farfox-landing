/**
 * October 2026 baseball jersey (Printful AOP baseball jersey, catalog 792): one product, three colourways.
 * Every file is at its print area's exact size, so Printful never crops or scales one.
 * Front: "Far Fox" in a ballpark script with a tail swoosh, split around the button placket. Left sleeve:
 * a Foxy patch. Back: the personalised name + number layout from jerseyBack.mjs (143 by default).
 *
 * Writes public/shop/designs/baseball-2026-10/bb-<colourway>-{front,sleeve-left,sleeve-right,pattern,back}.png.
 * Usage: node scripts/make-baseball-2026-10.mjs [--preview out.jpg]
 *
 * File geometry, measured by rendering a labelled grid through Printful's mockup generator:
 *   front 5700×6900: visible x 800–4950; the placket hides x 2470–3000; chest band y 2000–3200.
 *   sleeves 5700×2250: the sleeve's outer line is x ≈ 2850; the left sleeve's front-facing half is x < 2850.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { BASEBALL } from '../src/lib/kits.mjs';
import { foxyImage, foxyTag } from './foxy-art.mjs';

const OUT = new URL('../public/shop/designs/baseball-2026-10/', import.meta.url);
await mkdir(OUT, { recursive: true });
const BODY = { w: 5700, h: 6900 }, SLEEVE = { w: 5700, h: 2250 };
const PLACKET = { left: 2470, right: 3000 };
const SCRIPT_BASELINE = 2900, SCRIPT_SIZE = 1180;
const SLEEVE_PATCH = { x: 2350, y: 1050, r: 330 };
const C = { cream: '#F4ECE0', plum: '#2D1B4E', pink: '#FF6B8A' };

// Each colourway: body, sleeves, pinstripe (or none), script fill + outline, patch colours.
const LOOKS = {
  cream: { body: C.cream, stripe: C.plum, sleeve: C.cream, sleeveStripe: C.plum, script: C.plum, outline: C.pink, patchRing: C.plum, patchRim: C.pink },
  plum: { body: C.plum, stripe: null, sleeve: C.plum, sleeveStripe: null, script: C.pink, outline: C.cream, patchRing: C.pink, patchRim: C.cream },
  pink: { body: C.pink, stripe: null, sleeve: C.cream, sleeveStripe: null, script: C.plum, outline: C.cream, patchRing: C.plum, patchRim: C.cream },
};

const fontFiles = [];
for (const [n, q] of [['yellowtail', 'Yellowtail'], ['oswald', 'Oswald:wght@700']]) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const f = join(tmpdir(), `baseball-${n}.ttf`);
  await writeFile(f, Buffer.from(await fetch(css.match(/url\((https:[^)]+\.ttf)\)/)[1]).then((r) => r.arrayBuffer())));
  fontFiles.push(f);
}
const render = (w, h, body) => Buffer.from(new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`, { fitTo: { mode: 'width', value: w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng());
const FOXY_HEAD = await foxyImage('head');

const PINSTRIPE_PITCH = 216, PINSTRIPE_W = 7;
const fabric = (w, h, bg, stripe) => {
  let lines = '';
  if (stripe) for (let x = 108; x < w; x += PINSTRIPE_PITCH) lines += `<rect x="${x - PINSTRIPE_W / 2}" y="0" width="${PINSTRIPE_W}" height="${h}" fill="${stripe}"/>`;
  return `<rect width="${w}" height="${h}" fill="${bg}"/>${lines}`;
};

/** "Far" ends before the placket and "Fox" starts after it; the tail swoosh runs under both. */
function chestScript(look) {
  const outline = (fill, extra = '') => `fill="${fill}" stroke="${look.outline}" stroke-width="70" stroke-linejoin="round" paint-order="stroke" ${extra}`;
  const word = (x, anchor, text) => `<text x="${x}" y="${SCRIPT_BASELINE}" text-anchor="${anchor}" font-family="Yellowtail" font-size="${SCRIPT_SIZE}" ${outline(look.script)}>${text}</text>`;
  const tail = `<path d="M 1000 3260 C 2000 3050 3400 3080 4900 2860 C 3500 3220 2100 3240 1000 3260 Z" ${outline(look.script)}/>`;
  return `${tail}${word(PLACKET.left - 60, 'end', 'Far')}${word(PLACKET.right + 70, 'start', 'Fox')}`;
}

function sleevePatch(look) {
  const { x, y, r } = SLEEVE_PATCH, inner = r * 0.68, top = r * 0.8;
  return `<defs><path id="pa" d="M ${x - top} ${y} A ${top} ${top} 0 0 1 ${x + top} ${y}"/><clipPath id="pd"><circle cx="${x}" cy="${y}" r="${inner}"/></clipPath></defs>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${look.patchRim}"/><circle cx="${x}" cy="${y}" r="${r - 24}" fill="${look.patchRing}"/>
    <circle cx="${x}" cy="${y}" r="${r - 40}" fill="none" stroke="${C.cream}" stroke-opacity="0.8" stroke-width="6" stroke-dasharray="16 11"/>
    <circle cx="${x}" cy="${y}" r="${inner}" fill="${C.cream}"/>
    ${foxyTag(FOXY_HEAD, x, y - inner * 0.62, inner * 1.36, 'clip-path="url(#pd)"')}
    <text font-family="Oswald" font-weight="700" font-size="74" letter-spacing="14" fill="${C.cream}" text-anchor="middle"><textPath href="#pa" startOffset="50%">FAR FOX</textPath></text>`;
}

// The default back comes from the live personalised-back renderer, fed this colourway's pattern from disk.
async function defaultBack(kit, patternPng) {
  const { renderJerseyBack } = await import('../src/lib/jerseyBack.mjs');
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => (String(url).endsWith(`${kit}-pattern.png`) ? new Response(patternPng) : realFetch(url, init));
  try { return await renderJerseyBack({ kit, name: '', number: '', size: BODY.w }); } finally { globalThis.fetch = realFetch; }
}

const previewOut = process.argv.includes('--preview') ? process.argv[process.argv.indexOf('--preview') + 1] : null;
const tiles = [];
for (const { key } of BASEBALL.colorways) {
  const look = LOOKS[key], kit = `${BASEBALL.kit}-${key}`;
  const files = {
    front: render(BODY.w, BODY.h, `${fabric(BODY.w, BODY.h, look.body, look.stripe)}${chestScript(look)}`),
    'sleeve-left': render(SLEEVE.w, SLEEVE.h, `${fabric(SLEEVE.w, SLEEVE.h, look.sleeve, look.sleeveStripe)}${sleevePatch(look)}`),
    'sleeve-right': render(SLEEVE.w, SLEEVE.h, fabric(SLEEVE.w, SLEEVE.h, look.sleeve, look.sleeveStripe)),
    pattern: render(BODY.w, BODY.h, fabric(BODY.w, BODY.h, look.body, look.stripe)),
  };
  files.back = await defaultBack(kit, files.pattern);
  for (const [part, png] of Object.entries(files)) await writeFile(new URL(`${kit}-${part}.png`, OUT), await sharp(png).png({ compressionLevel: 9 }).toBuffer());
  console.log(`[baseball] ${kit}: ${Object.keys(files).join(', ')}`);
  if (previewOut) tiles.push(await sharp(files.front).extract({ left: 700, top: 1600, width: 4400, height: 2200 }).resize(800).toBuffer());
}
if (previewOut) {
  await sharp({ create: { width: 800, height: 400 * tiles.length, channels: 3, background: '#fff' } })
    .composite(tiles.map((input, i) => ({ input, left: 0, top: i * 400 }))).jpeg({ quality: 70 }).toFile(previewOut);
  console.log(`[baseball] preview → ${previewOut}`);
}
