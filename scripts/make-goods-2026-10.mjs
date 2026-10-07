/**
 * October 2026 redo of the shop's mugs, art prints and stickers with the approved Foxy (foxy-art.mjs).
 * Writes public/shop/designs/goods-2026-10/*.png at Printful's print-file sizes (300 dpi):
 *   mugs (catalog 19)        2700×1050 wrap. The two faces a viewer sees, handle left or right, are
 *                            centred on x 675 and x 2025, so every mug carries a design on each.
 *   art prints (catalog 1)   3507×4962 (11.69″×16.54″ portrait)
 *   sticker sheets (505)     1750×2482, transparent; Printful kiss-cuts around each sticker
 *   die-cut stickers (957)   600×600 (2″), transparent
 * Usage: node scripts/make-goods-2026-10.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { foxyImage, foxyTag } from './foxy-art.mjs';

const OUT = new URL('../public/shop/designs/goods-2026-10/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });
const C = { plum: '#2D1B4E', night: '#21182B', mid: '#4A3470', far: '#6B5294', pink: '#FF6B8A', blush: '#FFB2C6', cream: '#FFF5F0', paper: '#F7EDE2', purple: '#B76CFD' };
const RAINBOW = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'];
const MUG = { w: 2700, h: 1050, faces: [675, 2025] }, PRINT = { w: 3507, h: 4962 }, SHEET = { w: 1750, h: 2482 }, DIECUT = 600;

const fontFiles = [];
for (const [n, q] of [['nunito9', 'Nunito:wght@900'], ['nunito7', 'Nunito:wght@700'], ['graduate', 'Graduate'], ['fell', 'IM+Fell+French+Canon:ital@1']]) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const f = join(tmpdir(), `goods-${n}.ttf`);
  await writeFile(f, Buffer.from(await fetch(css.match(/url\((https:[^)]+\.ttf)\)/)[1]).then((r) => r.arrayBuffer())));
  fontFiles.push(f);
}
const png = (w, h, body) => Buffer.from(new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`, { fitTo: { mode: 'width', value: w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng());
const F = Object.fromEntries(await Promise.all(['head', 'headClosed', 'headSad', 'idle', 'letter'].map(async (p) => [p, await foxyImage(p)])));

// --- shared drawing -----------------------------------------------------------------------------------
const HEART = 'M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z';
const heart = (x, y, size, fill, extra = '') => `<path transform="translate(${x - size / 2} ${y - size * 0.45}) scale(${size / 100})" d="${HEART}" fill="${fill}" ${extra}/>`;
const text = (x, y, t, { size, font = 'Nunito', weight = 900, fill = C.plum, anchor = 'middle', spacing = 0, italic = false, extra = '' }) =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${font}" font-weight="${weight}" ${italic ? 'font-style="italic"' : ''} font-size="${size}" letter-spacing="${spacing}" fill="${fill}" ${extra}>${t}</text>`;
const fell = (x, y, t, size, fill = C.plum) => text(x, y, t, { size, font: 'IM FELL French Canon', weight: 400, italic: true, fill });
const PLANE = 'M50 0 L56 34 L96 56 L96 64 L56 52 L54 80 L66 90 L66 96 L50 91 L34 96 L34 90 L46 80 L44 52 L4 64 L4 56 L44 34 Z';
const plane = (cx, cy, size, fill, deg = 90) => `<path transform="translate(${cx} ${cy}) rotate(${deg}) translate(${-size / 2} ${-size / 2}) scale(${size / 100})" d="${PLANE}" fill="${fill}"/>`;
/** A crescent: a disc with an offset disc cut out of it. */
let maskId = 0;
const crescent = (cx, cy, r, fill, bg) => { const id = `cr${maskId++}`;
  return `<mask id="${id}"><rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" fill="#fff"/><circle cx="${cx + r * 0.42}" cy="${cy - r * 0.18}" r="${r * 0.86}" fill="#000"/></mask><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" mask="url(#${id})"/>`; };
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
const stars = (w, h, n, seed, fill, maxR) => { const r = rng(seed); let s = '';
  for (let i = 0; i < n; i++) s += `<circle cx="${(r() * w).toFixed(0)}" cy="${(r() * h).toFixed(0)}" r="${(2 + r() * maxR).toFixed(1)}" fill="${fill}" fill-opacity="${(0.45 + r() * 0.55).toFixed(2)}"/>`;
  return s; };
const night = (w, h, id) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.night}"/><stop offset="1" stop-color="${C.mid}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${id})"/>`;
const rainbowBand = (x, y, w, stripe) => RAINBOW.map((c, i) => `<rect x="${x}" y="${y + i * stripe}" width="${w}" height="${stripe}" fill="${c}"/>`).join('');

/** A sticker: the artwork on a white border that follows its outline, so the kiss-cut has a clean edge. */
async function stickerize(buf, border) {
  const { width, height } = await sharp(buf).metadata();
  const pad = border * 2;
  const art = await sharp(buf).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  // Two passes: within one pipeline sharp thresholds before it blurs, which leaves a soft, half-transparent edge.
  const spread = await sharp(art).extractChannel('alpha').blur(border * 0.6).png().toBuffer();
  const alpha = await sharp(spread).threshold(12).toColourspace('b-w').png().toBuffer();
  const white = await sharp({ create: { width: width + pad * 2, height: height + pad * 2, channels: 3, background: '#ffffff' } }).joinChannel(alpha).png().toBuffer();
  return sharp(white).composite([{ input: art }]).png().toBuffer();
}
/** Lay stickers into a grid of cells, each scaled to fit its cell. */
async function sheet(stickers, cols, rows) {
  const cw = Math.floor(SHEET.w / cols), ch = Math.floor(SHEET.h / rows), inset = 50;
  const placed = [];
  for (const [i, buf] of stickers.entries()) {
    const fit = await sharp(buf).resize({ width: cw - inset * 2, height: ch - inset * 2, fit: 'inside' }).png().toBuffer();
    const m = await sharp(fit).metadata();
    placed.push({ input: fit, left: (i % cols) * cw + Math.round((cw - m.width) / 2), top: Math.floor(i / cols) * ch + Math.round((ch - m.height) / 2) });
  }
  return sharp({ create: { width: SHEET.w, height: SHEET.h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(placed).png().toBuffer();
}
const art = (w, h, body) => png(w, h, body);

// --- mugs -------------------------------------------------------------------------------------------
// The shop's main mug photo (handle on the right) shows face R, so R carries the first half of a two-part phrase.
const [L, R] = MUG.faces;
function scatterHearts(cx, seed) { const r = rng(seed); let s = '';
  for (const [dx, dy, sz] of [[-430, 220, 120], [400, 160, 95], [-380, 640, 80], [420, 600, 110], [-250, 90, 60], [300, 820, 60]]) s += heart(cx + dx, dy, sz, r() > 0.5 ? C.pink : C.purple);
  return s; }
const mugs = {
  'mug-hearteyes': art(MUG.w, MUG.h, `${scatterHearts(R, 3)}${scatterHearts(L, 7)}
    ${foxyTag(F.head, R, 110, 640)}${text(R, 935, 'HEART EYES', { size: 150 })}
    ${foxyTag(F.head, L, 110, 640)}${text(L, 935, 'ONLY FOR YOU', { size: 120, fill: C.pink, spacing: 4 })}`),
  'mug-samemoon': art(MUG.w, MUG.h, `${night(MUG.w, MUG.h, 'mn')}${stars(MUG.w, MUG.h, 140, 11, C.cream, 6)}
    ${crescent(R - 330, 190, 110, C.blush)}${foxyTag(F.headClosed, R, 210, 600)}${fell(R, 930, 'same moon,', 150, C.cream)}
    ${crescent(L + 330, 190, 110, C.blush)}${foxyTag(F.head, L, 210, 600)}${fell(L, 930, 'same us.', 150, C.cream)}`),
  'mug-pride': art(MUG.w, MUG.h, `${rainbowBand(0, 0, MUG.w, 22)}${rainbowBand(0, MUG.h - 132, MUG.w, 22)}
    ${foxyTag(F.head, R, 190, 560)}${text(R, 900, 'LOVE IS LOVE', { size: 130, spacing: 6 })}
    ${foxyTag(F.idle, L - 110, 175, 420)}${heart(L + 260, 520, 330, 'url(#rb)')}${text(L, 900, 'PROUD OF US', { size: 130, fill: C.pink, spacing: 6 })}
    <defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1">${RAINBOW.map((c, i) => `<stop offset="${i / 6}" stop-color="${c}"/><stop offset="${(i + 1) / 6}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`),
  'mug-airways': art(MUG.w, MUG.h, (() => {
    let bars = '';
    for (let x = 300, i = 0; x < 1050; i++) { const w = [8, 16, 6, 22, 10][(i * 7) % 5]; bars += `<rect x="${x}" y="790" width="${w}" height="150" fill="${C.plum}"/>`; x += w + [10, 7, 13, 8][(i * 3) % 4]; }
    return `<rect width="${MUG.w}" height="${MUG.h}" fill="${C.cream}"/>
      <rect x="40" y="40" width="${MUG.w - 80}" height="${MUG.h - 80}" rx="40" fill="none" stroke="${C.plum}" stroke-width="10"/>
      <line x1="1350" y1="80" x2="1350" y2="${MUG.h - 80}" stroke="${C.plum}" stroke-width="8" stroke-dasharray="26 20"/>
      ${text(L, 200, 'BOARDING PASS', { size: 70, spacing: 18, fill: C.far })}
      ${foxyTag(F.head, L - 240, 260, 380)}${heart(L, 440, 120, C.pink)}${foxyTag(F.headClosed, L + 240, 260, 380)}
      ${text(L, 720, 'PASSENGERS: YOU + ME', { size: 64, spacing: 8 })}${bars}
      ${plane(R - 560, 205, 90, C.pink)}${text(R + 60, 235, 'FAR FOX AIRWAYS', { size: 110, font: 'Graduate', weight: 400, spacing: 8 })}
      <line x1="${R - 620}" y1="300" x2="${R + 620}" y2="300" stroke="${C.plum}" stroke-width="6"/>
      ${text(R - 560, 380, 'FROM', { size: 50, spacing: 10, fill: C.far, anchor: 'start' })}${text(R + 560, 380, 'TO', { size: 50, spacing: 10, fill: C.far, anchor: 'end' })}
      ${text(R - 590, 590, 'HERE', { size: 190, font: 'Graduate', weight: 400, anchor: 'start' })}${text(R + 590, 590, 'YOU', { size: 190, font: 'Graduate', weight: 400, anchor: 'end' })}
      <line x1="${R - 40}" y1="525" x2="${R + 160}" y2="525" stroke="${C.pink}" stroke-width="10" stroke-dasharray="20 14" stroke-linecap="round"/>${plane(R + 70, 525, 100, C.pink)}
      ${[['FLIGHT', 'FF143', -590], ['SEAT', '2-GETHER', -200], ['DEPARTS', 'SOON', 300]].map(([k, v, dx]) => `${text(R + dx, 730, k, { size: 50, spacing: 10, fill: C.far, anchor: 'start' })}${text(R + dx, 830, v, { size: 80, font: 'Graduate', weight: 400, anchor: 'start' })}`).join('')}`;
  })()),
  'mug-missyou': art(MUG.w, MUG.h, `${heart(L, 380, 330, C.blush)}${fell(L, 820, 'from far away', 110, C.far)}
    ${foxyTag(F.headSad, R, 70, 640)}${text(R, 925, 'miss you', { size: 190 })}`),
  'mug-missyoutoo': art(MUG.w, MUG.h, `${heart(L, 380, 330, C.blush)}${fell(L, 820, 'from right here', 110, C.far)}
    ${foxyTag(F.head, R, 70, 640)}${text(R, 925, 'miss you too', { size: 170, fill: C.pink })}`),
};

// --- art prints -----------------------------------------------------------------------------------------
const { w: PW, h: PH } = PRINT, PC = PW / 2;
function chevronBorder(band) { let s = '';
  const edge = (x0, y0, len, horizontal) => { for (let t = 0, i = 0; t < len; t += 150, i++) { const c = i % 2 ? C.plum : C.pink;
    s += horizontal ? `<polygon points="${x0 + t},${y0} ${x0 + t + 85},${y0} ${x0 + t + 85 - band},${y0 + band} ${x0 + t - band},${y0 + band}" fill="${c}"/>`
      : `<polygon points="${x0},${y0 + t} ${x0},${y0 + t + 85} ${x0 + band},${y0 + t + 85 - band} ${x0 + band},${y0 + t - band}" fill="${c}"/>`; } };
  edge(band, 0, PW - 2 * band, true); edge(band, PH - band, PW - 2 * band, true); edge(0, band, PH - 2 * band, false); edge(PW - band, band, PH - 2 * band, false);
  return s; }
// The heart the stars of "Under the Same Sky" trace.
const HEART_STARS = [[1754, 1300], [1450, 960], [1080, 860], [780, 1060], [740, 1460], [1060, 1880], [1754, 2420], [2448, 1880], [2768, 1460], [2728, 1060], [2428, 860], [2058, 960]];
const prints = {
  'print-paravion': art(PW, PH, `<rect width="${PW}" height="${PH}" fill="${C.paper}"/>${chevronBorder(120)}
    <g transform="translate(560 640)" opacity="0.9"><circle r="300" fill="none" stroke="${C.plum}" stroke-width="16"/><circle r="230" fill="none" stroke="${C.plum}" stroke-width="7"/>
      <defs><path id="pt" d="M -265 0 A 265 265 0 0 1 265 0"/><path id="pb" d="M -268 0 A 268 268 0 0 0 268 0"/></defs>
      <text font-family="Nunito" font-weight="900" font-size="54" letter-spacing="6" fill="${C.plum}" text-anchor="middle"><textPath href="#pt" startOffset="50%">FAR FOX · PAR AVION</textPath></text>
      <text font-family="Nunito" font-weight="900" font-size="54" letter-spacing="6" fill="${C.plum}" text-anchor="middle" dy="40"><textPath href="#pb" startOffset="50%">LONG DISTANCE POST</textPath></text>
      ${fell(0, 40, '143', 140)}</g>
    <rect x="2620" y="380" width="520" height="620" fill="#FFFFFF" stroke="${C.plum}" stroke-width="12" stroke-dasharray="30 18"/>${foxyTag(F.head, 2880, 450, 360)}${heart(2880, 900, 90, C.pink)}
    <path d="M 600 1300 Q 1754 900 2900 1300" fill="none" stroke="${C.pink}" stroke-width="14" stroke-dasharray="40 30" stroke-linecap="round"/>${plane(1754, 1100, 150, C.plum, 75)}
    ${text(600, 1420, 'HERE', { size: 70, spacing: 14, fill: C.far })}${text(2900, 1420, 'THERE', { size: 70, spacing: 14, fill: C.far })}
    ${foxyTag(F.letter, PC, 1550, 1600)}
    ${fell(PC, 3700, 'to: you', 330)}${fell(PC, 3940, 'wherever you are', 190, C.far)}${heart(PC, 4130, 110, C.pink)}
    ${text(PC, 4500, 'FAR FOX', { size: 190, spacing: 40 })}${text(PC, 4640, 'LONG DISTANCE POST', { size: 70, spacing: 22, fill: C.far })}`),
  'print-samesky': art(PW, PH, `${night(PW, PH, 'sky')}${stars(PW, PH, 420, 23, C.cream, 7)}
    <polyline points="${[...HEART_STARS, HEART_STARS[0]].map((p) => p.join(',')).join(' ')}" fill="none" stroke="${C.cream}" stroke-opacity="0.55" stroke-width="8"/>
    ${HEART_STARS.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="${C.cream}"/>`).join('')}${crescent(2900, 560, 240, C.blush)}
    ${text(PC, 2900, 'UNDER THE SAME SKY', { size: 190, spacing: 30, fill: C.cream })}
    <line x1="${PC - 500}" y1="3010" x2="${PC + 500}" y2="3010" stroke="${C.blush}" stroke-width="6"/>
    ${foxyTag(F.headClosed, PC, 3150, 1100)}
    ${fell(PC, 4440, 'no matter the distance,', 170, C.cream)}${fell(PC, 4640, 'we sleep beneath it together', 170, C.cream)}
    ${text(PC, 4830, 'FAR FOX', { size: 110, spacing: 30, fill: C.blush })}`),
  'print-samemoon': art(PW, PH, `<rect width="${PW}" height="${PH}" fill="${C.cream}"/>
    <circle cx="${PC}" cy="1500" r="1050" fill="${C.blush}"/><circle cx="${PC}" cy="1500" r="1050" fill="none" stroke="${C.pink}" stroke-width="14"/>
    ${[[-380, -300, 150], [300, -480, 90], [420, 160, 120], [-200, 380, 80], [-520, 120, 60]].map(([dx, dy, r]) => `<circle cx="${PC + dx}" cy="${1500 + dy}" r="${r}" fill="${C.pink}" fill-opacity="0.35"/>`).join('')}
    ${foxyTag(F.head, PC - 720, 2050, 1150)}${foxyTag(F.headClosed, PC + 720, 2050, 1150)}${heart(PC, 2480, 230, C.pink)}
    ${fell(PC, 3700, 'same moon,', 380)}${fell(PC, 4080, 'same us.', 380, C.pink)}
    ${text(PC, 4600, 'FAR FOX', { size: 170, spacing: 40 })}`),
};

// --- stickers ------------------------------------------------------------------------------------------
const foxyOnly = async (pose, w) => png(w, Math.round(w * F[pose].aspect), foxyTag(F[pose], w / 2, 0, w));
const withCaption = async (pose, caption, fill = C.plum, w = 900, size = 160) => png(w, Math.round(w * F[pose].aspect) + size * 1.4, `${foxyTag(F[pose], w / 2, 0, w)}${text(w / 2, Math.round(w * F[pose].aspect) + size * 1.15, caption, { size, fill })}`);
const badge = (body, w = 900, h = 900) => png(w, h, body);
const STICKER_BORDER = 26;
const stickers = await Promise.all([
  foxyOnly('head', 900), foxyOnly('letter', 760), foxyOnly('idle', 760), withCaption('headSad', 'miss you'),
  png(900, 900, `${foxyTag(F.headClosed, 450, 150, 760)}${text(780, 170, 'z', { size: 150, fill: C.far })}${text(860, 80, 'z', { size: 110, fill: C.far })}`),
  badge(`${heart(450, 470, 860, C.pink)}${text(450, 520, '143', { size: 300, fill: '#FFFFFF' })}`),
  badge(`<path d="M 80 760 Q 300 520 520 640" fill="none" stroke="${C.far}" stroke-width="22" stroke-dasharray="40 30" stroke-linecap="round"/>${plane(640, 470, 520, C.plum, 55)}${heart(250, 300, 260, C.pink)}`),
  badge(`<circle cx="450" cy="450" r="440" fill="${C.plum}"/><circle cx="450" cy="450" r="410" fill="none" stroke="${C.blush}" stroke-width="8" stroke-dasharray="22 14"/>${foxyTag(F.head, 450, 150, 520)}${text(450, 760, 'FAR FOX', { size: 120, fill: C.cream, spacing: 14 })}`),
].map(async (b) => stickerize(await b, STICKER_BORDER)));
const prideHeart = (x, y, size) => `<defs><linearGradient id="ph" x1="0" y1="0" x2="0" y2="1">${RAINBOW.map((c, i) => `<stop offset="${i / 6}" stop-color="${c}"/><stop offset="${(i + 1) / 6}" stop-color="${c}"/>`).join('')}</linearGradient></defs>${heart(x, y, size, 'url(#ph)')}`;
const prideStickers = await Promise.all([
  png(900, 1000, `${foxyTag(F.head, 450, 0, 900)}${prideHeart(720, 860, 300)}`),
  png(900, 1050, `${foxyTag(F.idle, 380, 0, 760)}<rect x="760" y="120" width="16" height="760" fill="${C.plum}"/>${rainbowBand(776, 120, 120, 40)}`),
  badge(`${prideHeart(450, 470, 860)}`),
  png(1000, 600, `<rect x="20" y="40" width="960" height="520" rx="80" fill="#FFFFFF"/>${rainbowBand(60, 80, 880, 18)}${text(500, 330, 'LOVE IS', { size: 170, spacing: 4 })}${text(500, 500, 'LOVE', { size: 170, fill: C.pink, spacing: 4 })}`),
  png(900, 1050, `${foxyTag(F.letter, 450, 0, 760)}${prideHeart(720, 220, 240)}`),
  png(900, 900, `${foxyTag(F.headClosed, 450, 120, 760)}${prideHeart(780, 140, 220)}`),
  badge(`${prideHeart(450, 470, 860)}${text(450, 520, '143', { size: 300, fill: '#FFFFFF', extra: `stroke="${C.plum}" stroke-width="14" paint-order="stroke"` })}`),
  png(1300, 700, `${foxyTag(F.head, 320, 60, 600)}${prideHeart(650, 380, 260)}${foxyTag(F.headClosed, 980, 60, 600)}`),
].map(async (b) => stickerize(await b, STICKER_BORDER)));

const dieCut = async (buf) => sharp(await stickerize(buf, 40)).resize({ width: DIECUT, height: DIECUT, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const files = {
  ...mugs, ...prints,
  'sheet-foxy': await sheet(stickers, 2, 4),
  'sheet-pride': await sheet(prideStickers, 2, 4),
  'diecut-foxy': await dieCut(await foxyOnly('head', 1000)),
  'diecut-missyou': await dieCut(await withCaption('headSad', 'miss you', C.plum, 900, 190)),
  'diecut-missyoutoo': await dieCut(await withCaption('head', 'miss you too', C.pink, 900, 130)),
};
for (const [name, buf] of Object.entries(files)) await writeFile(`${OUT}${name}.png`, await sharp(buf).png({ compressionLevel: 9 }).toBuffer());
console.log(Object.keys(files).length, 'files:', Object.keys(files).join(' '));
