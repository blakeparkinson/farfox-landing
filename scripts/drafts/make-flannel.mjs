// Far Fox Fireside Flannel: print files for Printful's All-Over Print Bomber (catalog 390).
// Panels 4650×5400 @150dpi (front, back, sleeves), ribbing "details" 7950×2700, inside label 375×150.
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const REPO = '/Users/blake/Projects/personal/farfox-landing';
const sharp = (await import(`${REPO}/node_modules/sharp/lib/index.js`)).default;
const { Resvg } = await import(`${REPO}/node_modules/@resvg/resvg-js/index.js`);
const OUT = new URL('./out/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const PANEL = { w: 4650, h: 5400 }, DETAILS = { w: 7950, h: 2700 }, LABEL = { w: 375 * 4, h: 150 * 4 };
const C = { plum: [45, 27, 78], pink: [255, 107, 138], orange: [255, 154, 92], blush: [255, 245, 240], purple: [120, 72, 190], deep: [33, 24, 43] };
// Half sett in px at 150 dpi, mirrored into a full repeat (≈6.6 in), like a real flannel tartan.
const HALF_SETT = [['plum', 190], ['pink', 72], ['plum', 12], ['pink', 72], ['plum', 30], ['orange', 15], ['plum', 30], ['purple', 50], ['blush', 9], ['purple', 50]];
const THREAD = 4; // px per thread: sets the twill grain

function settLookup() {
  const half = HALF_SETT.flatMap(([c, w]) => Array(w).fill(c));
  const full = [...half, ...half.slice().reverse()];
  return full.map((c) => C[c]);
}
const SETT = settLookup();

// Deterministic noise for the brushed nap.
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

/** Woven plaid: warp colour from x, weft from y; 2/2 twill decides which shows; nap adds fuzz. */
async function plaid(w, h, offsetX = 0) {
  const buf = Buffer.alloc(w * h * 3), n = SETT.length;
  for (let y = 0; y < h; y++) {
    const weft = SETT[y % n], ty = Math.floor(y / THREAD);
    for (let x = 0; x < w; x++) {
      const warp = SETT[((x + offsetX) % n + n) % n], tx = Math.floor((x + offsetX) / THREAD);
      const showWarp = ((tx + ty) & 3) < 2;
      const a = showWarp ? warp : weft, b = showWarp ? weft : warp;
      const nap = 0.88 + 0.24 * hash(x >> 1, y >> 1); // brushed fibres
      const i = (y * w + x) * 3;
      for (let c = 0; c < 3; c++) buf[i + c] = Math.max(0, Math.min(255, Math.round((a[c] * 0.82 + b[c] * 0.18) * nap)));
    }
  }
  // A whisper of blur softens thread edges into flannel nap.
  return sharp(buf, { raw: { width: w, height: h, channels: 3 } }).blur(0.8);
}

async function fonts() {
  const out = [];
  for (const [family, q] of [['oswald', 'Oswald:wght@600'], ['fell', 'IM+Fell+French+Canon:ital@1']]) {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
    const f = join(tmpdir(), `flannel-${family}.ttf`);
    await writeFile(f, Buffer.from(await fetch(css.match(/url\((https:[^)]+\.ttf)\)/)[1]).then((r) => r.arrayBuffer())));
    out.push(f);
  }
  return out;
}
const fontFiles = await fonts();
const svgPng = (markup, w) => Buffer.from(new Resvg(markup, { fitTo: { mode: 'width', value: w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng());

const FOX = (fill, cut) => `<polygon points="25,0 100,88 200,88 275,0 300,190 150,306 0,190" fill="${fill}"/>
  <polygon points="35,30 30,95 85,85" fill="${cut}"/><polygon points="265,30 270,95 215,85" fill="${cut}"/>
  <polygon points="72,140 125,152 120,175 70,162" fill="${cut}"/><polygon points="228,140 175,152 180,175 230,162" fill="${cut}"/>
  <polygon points="88,196 212,196 150,306" fill="none" stroke="${cut}" stroke-width="6"/><polygon points="137,226 163,226 150,248" fill="${cut}"/>`;

/** Woven chest label: cream, stitched border, plum fox and lettering. */
function chestPatch() {
  const W = 920, H = 420;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><filter id="sh"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.35"/></filter></defs>
    <rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="26" fill="#F4ECE0" filter="url(#sh)"/>
    <rect x="34" y="34" width="${W - 68}" height="${H - 68}" rx="16" fill="none" stroke="#2D1B4E" stroke-width="5" stroke-dasharray="18 12"/>
    <g transform="translate(70 103) scale(0.7)">${FOX('#2D1B4E', '#F4ECE0')}</g>
    <text x="590" y="215" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="104" letter-spacing="8" fill="#2D1B4E">FAR FOX</text>
    <text x="590" y="290" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="36" letter-spacing="7" fill="#E0557A">LONG DISTANCE CLUB</text>
  </svg>`;
}

/** Rib knit: plum with pink and orange tipping, vertical rib texture. */
async function ribbing() {
  const { w, h } = DETAILS;
  let stripes = '';
  for (const [y0, hh, col] of [[300, 70, '#FF6B8A'], [430, 34, '#FF9A5C'], [h - 500, 34, '#FF9A5C'], [h - 400, 70, '#FF6B8A']]) stripes += `<rect x="0" y="${y0}" width="${w}" height="${hh}" fill="${col}"/>`;
  let ribs = '';
  for (let x = 0; x < w; x += 18) ribs += `<rect x="${x}" y="0" width="7" height="${h}" fill="#000" fill-opacity="0.16"/>`;
  return svgPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#2D1B4E"/>${stripes}${ribs}</svg>`, w);
}

const insideLabel = () => `<svg xmlns="http://www.w3.org/2000/svg" width="${LABEL.w}" height="${LABEL.h}" viewBox="0 0 ${LABEL.w} ${LABEL.h}">
  <text x="${LABEL.w / 2}" y="300" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="210" fill="#2D1B4E">Worth every mile.</text>
  <text x="${LABEL.w / 2}" y="470" text-anchor="middle" font-family="Oswald" font-weight="600" font-size="90" letter-spacing="14" fill="#FF6B8A">FAR FOX</text></svg>`;

// Front: the sett's mirror point sits on the zip line so both halves match.
const halfLen = HALF_SETT.reduce((s, [, w]) => s + w, 0);
const frontOffset = halfLen - PANEL.w / 2;
const PATCH_AT = { left: 2780, top: 2250, w: 820 }; // wearer's left chest
const front = await (await plaid(PANEL.w, PANEL.h, frontOffset)).composite([{ input: svgPng(chestPatch(), PATCH_AT.w), left: PATCH_AT.left, top: PATCH_AT.top }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
await writeFile(OUT + 'flannel-front.jpg', front);
await writeFile(OUT + 'flannel-back.jpg', await (await plaid(PANEL.w, PANEL.h, frontOffset)).jpeg({ quality: 90, mozjpeg: true }).toBuffer());
await writeFile(OUT + 'flannel-sleeve.jpg', await (await plaid(PANEL.w, PANEL.h, 0)).jpeg({ quality: 90, mozjpeg: true }).toBuffer());
await writeFile(OUT + 'flannel-details.png', await sharp(await ribbing()).png({ compressionLevel: 9 }).toBuffer());
await writeFile(OUT + 'flannel-label.png', svgPng(insideLabel(), LABEL.w));
console.log('flannel files written');
