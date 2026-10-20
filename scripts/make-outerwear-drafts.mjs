/**
 * Draft concepts for review, next to the finished outerwear in make-outerwear-2026.mjs:
 *
 *   knit   a knitted beanie (Printful 850): the pattern is knitted in, one pixel per stitch (410×229),
 *          four yarns, FAR FOX on the fold-up cuff and a Fair Isle row of foxes and hearts round the body
 *
 * The Two Skies bomber draft graduated to make-outerwear-2026.mjs; the souvenir and Par Avion bombers were retired.
 *
 * Writes public/shop/designs/outerwear-drafts/. Usage: node scripts/make-outerwear-drafts.mjs
 * Render them on the garment with mockup-outerwear-drafts.mjs once the commit is pushed.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { rng, crest, D } from './kit-designs-2026-10.mjs';
import { KITS, SKIES } from './kit-designs-two-skies.mjs';

const OUT = new URL('../public/shop/designs/outerwear-drafts/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });
const fontFiles = [];
for (const [n, q] of [['graduate', 'Graduate'], ['nunito9', 'Nunito:wght@900'], ['fell', 'IM+Fell+French+Canon:ital@1']]) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const f = join(tmpdir(), `outerwear-${n}.ttf`);
  await writeFile(f, Buffer.from(await fetch(css.match(/url\((https:[^)]+\.ttf)\)/)[1]).then((r) => r.arrayBuffer())));
  fontFiles.push(f);
}
const svgOf = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const render = (w, h, body) => Buffer.from(new Resvg(svgOf(w, h, body), { fitTo: { mode: 'width', value: w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng());

const PLUM = '#2D1B4E', PINK = '#FF6B8A', BLUSH = '#FFF5F0', GOLD = '#F4B600', ORANGE = '#FF9A5C';
const PANEL = { w: 4650, h: 5400 }, DETAILS = { w: 7950, h: 2700 }, MID = 2325;
// Same panel geometry as make-outerwear-2026.mjs.
const FRONT = { leftSafe: [709, 2070], rightSafe: [2578, 3939], neck: 1580 };
const COLLAR = { x: [600, 4050], fold: 350 }, CUFF = { x: [1541, 3107], fold: 4671 }, BAND = { x: [130, 7818], fold: 2139 }, SLEEVE_END = 4050;

const fox = (cx, cy, w, body, feature) => { const s = w / 300;
  return `<g transform="translate(${cx - w / 2} ${cy - 153 * s}) scale(${s})"><polygon points="25,0 100,88 200,88 275,0 300,190 150,306 0,190" fill="${body}"/>
  <polygon points="35,30 30,95 85,85" fill="${feature}"/><polygon points="265,30 270,95 215,85" fill="${feature}"/>
  <polygon points="72,140 125,152 120,175 70,162" fill="${feature}"/><polygon points="228,140 175,152 180,175 230,162" fill="${feature}"/>
  <polygon points="88,196 212,196 150,306" fill="#FFFFFF"/><polygon points="137,226 163,226 150,248" fill="${feature}"/></g>`; };
const HEART = 'M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z';
const heart = (x, y, size, c) => `<path transform="translate(${x - size / 2} ${y - size * 0.45}) scale(${size / 100})" d="${HEART}" fill="${c}"/>`;
// Over the top of the circle, or (flip) along the bottom, left to right, letter tops toward the centre like a postmark.
const arcText = (id, text, cx, cy, r, size, colour, spacing = 8, font = 'Graduate', flip = false) => `<defs><path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 ${flip ? 0 : 1} ${cx + r} ${cy}"/></defs>
  <text font-family="${font}" font-size="${size}" letter-spacing="${spacing}" fill="${colour}" text-anchor="middle"><textPath href="#${id}" startOffset="50%">${text}</textPath></text>`;
const ribbing = ([x0, x1], fold, a, b) => [[70, 140, a], [165, 205, b]].map(([p, q, c]) =>
  `<rect x="${x0}" y="${fold - q}" width="${x1 - x0}" height="${q - p}" fill="${c}"/><rect x="${x0}" y="${fold + p}" width="${x1 - x0}" height="${q - p}" fill="${c}"/>`).join('');
function airmail(x0, w, y0, y1, a, b) {
  let out = '';
  for (let y = y0, i = 0; y < y1; y += 150, i++) out += `<polygon points="${x0},${y + 150} ${x0 + w},${y} ${x0 + w},${y + 75} ${x0},${y + 225}" fill="${i % 2 ? b : a}"/>`;
  return out;
}
function stars(seed, count, [x0, y0, x1, y1], colour) {
  const r = rng(seed);
  let out = '';
  for (let k = 0; k < count; k++) out += `<circle cx="${(x0 + r() * (x1 - x0)).toFixed(0)}" cy="${(y0 + r() * (y1 - y0)).toFixed(0)}" r="${(3 + r() * 6).toFixed(1)}" fill="${colour}" opacity="${(0.2 + r() * 0.5).toFixed(2)}"/>`;
  return out;
}
const plane = (x, y, deg, s, c) => `<path transform="translate(${x} ${y}) rotate(${deg}) scale(${s})" d="M 55 0 L 20 -8 L -10 -8 L -35 -42 L -48 -42 L -32 -8 L -45 -8 L -55 -22 L -62 -22 L -58 0 L -62 22 L -55 22 L -45 8 L -32 8 L -48 42 L -35 42 L -10 8 L 20 8 Z" fill="${c}"/>`;
const label = (bg, ink, accent) => render(375, 150, `<rect width="375" height="150" fill="${bg}"/>${fox(60, 72, 56, ink, bg)}
  <text x="225" y="66" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="34" letter-spacing="6" fill="${ink}">FAR FOX</text>
  <text x="225" y="112" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="30" fill="${accent}">Worth every mile.</text>`);

const files = {};
const put = (name, buf) => { files[name] = buf; };

// --- knit: one pixel per stitch, Printful yarn colours only ---------------------------------------------------
// 410 stitches round, 229 rows: crown gores rows 0–79, body 80–137, rows 138–182 hide under the cuff, and the
// cuff (183–228) folds up, so its art is drawn upside down. The front centre is stitch 205.
export const YARN = { navy: '#343d55', bone: '#e2dfdc', pink: '#f66274', orange: '#cd5e38' };
{
  const W = 410, H = 229, px = new Uint8Array(W * H).fill(0); // 0 navy 1 bone 2 pink 3 orange
  const set = (x, y, v) => { if (y >= 0 && y < H) px[y * W + ((x % W) + W) % W] = v; };
  const stamp = (x0, y0, rows, flip = false) => rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') set(x0 + i, flip ? y0 + rows.length - 1 - j : y0 + j, +ch); }));
  const FOX = ['3.....3', '33...33', '333.333', '3333333', '3313133', '3333333', '.33333.', '.31113.', '..313..', '...1...'];
  const HEART = ['.22.22.', '2222222', '2222222', '.22222.', '..222..', '...2...'];
  const SNOW = ['....1....', '.1..1..1.', '..1.1.1..', '...111...', '111111111', '...111...', '..1.1.1..', '.1..1..1.', '....1....'];
  const FONT = { F: ['111', '1..', '11.', '1..', '1..'], A: ['.1.', '1.1', '111', '1.1', '1.1'], R: ['11.', '1.1', '11.', '1.1', '1.1'], O: ['.1.', '1.1', '1.1', '1.1', '.1.'], X: ['1.1', '1.1', '.1.', '1.1', '1.1'] };
  const big = (rows) => rows.flatMap((r) => { const d = [...r].map((c) => c + c).join(''); return [d, d]; }); // 2× letters, 6×10
  // Crown: a sprinkle of bone stitches, denser near the top.
  const r = rng(7);
  for (let k = 0; k < 260; k++) { const y = Math.floor(r() * r() * 78); set(Math.floor(r() * W), y, 1); }
  // Body: zigzag borders round a Fair Isle row of foxes and hearts, 34 stitches per repeat.
  for (let x = 0; x < W; x++) { set(x, 86 + (x % 6 < 3 ? 0 : 1), 2); set(x, 128 + (x % 6 < 3 ? 1 : 0), 2); }
  for (let x = 2; x < W; x += 34) { stamp(x, 97, FOX); stamp(x + 18, 99, HEART); }
  // Cuff, upside down: FAR FOX at the front centre, hearts and snowflakes around the rest.
  const text = 'FAR FOX', tw = text.length * 8 - 2, x0 = 205 - Math.floor(tw / 2), ty = 183 + 18;
  [...text].forEach((ch, i) => { if (FONT[ch]) stamp(x0 + i * 8, ty, big(FONT[ch]), true); });
  // Hearts and snowflakes alternate round the rest of the cuff (set() wraps past the seam).
  for (let x = x0 + tw + 16, i = 0; x < x0 + W - 28; x += 24, i++) stamp(x, i % 2 ? ty + 2 : ty - 1, i % 2 ? HEART : SNOW, true);
  const rgb = Object.values(YARN).map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const raw = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) raw.set(rgb[px[i]], i * 3);
  put('knit-beanie', await sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer());
}

for (const [name, buf] of Object.entries(files)) { await writeFile(join(OUT, `${name}.png`), buf); console.log(`${name}.png`); }
