/**
 * Draft concepts for review, next to the Airways flight jacket in make-outerwear-2026.mjs:
 *
 *   twoskies   the Two Skies kit as a bomber: night New York on the front, dawn London on the back, night sleeves
 *   souvenir   a sukajan-style souvenir jacket: plum body, cream sleeves, a day-and-night emblem across the back
 *   paravion   an airmail envelope you can wear: cream body, chevron borders, a postmark and stamp
 *   knit       a knitted beanie (Printful 850): the pattern is knitted in, one pixel per stitch (410×229),
 *              four yarns, FAR FOX on the fold-up cuff and a Fair Isle row of foxes and hearts round the body
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

// --- twoskies: the kit's 6000-square art scaled to cover each 4650×5400 panel ----------------------------
{
  const kit = KITS['twoskies-ny-london']();
  const cover = async (svg, overlay = '') => {
    const big = await sharp(Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: 5400 }, font: { fontFiles, loadSystemFonts: false } }).render().asPng()))
      .extract({ left: 375, top: 0, width: PANEL.w, height: PANEL.h }).png().toBuffer();
    return overlay ? sharp(big).composite([{ input: render(PANEL.w, PANEL.h, overlay), left: 0, top: 0 }]).png().toBuffer() : big;
  };
  const night = (h) => SKIES.night.map((c, i) => `<rect x="0" y="${(i * h) / 4}" width="${PANEL.w}" height="${h / 4 + 2}" fill="${c}"/>`).join('') + `<rect x="0" y="${h}" width="${PANEL.w}" height="${PANEL.h - h}" fill="${SKIES.night[3]}"/>`;
  const rib = (box, fold) => ribbing(box, fold, SKIES.dawn[7], SKIES.moon);
  put('twoskies-front', await cover(kit.front));
  put('twoskies-back', await cover(kit.pattern, rib(COLLAR.x, COLLAR.fold)));
  put('twoskies-sleeve', render(PANEL.w, PANEL.h, `${night(SLEEVE_END)}${stars(15, 320, [0, 0, PANEL.w, SLEEVE_END], '#FFF6E6')}${rib(CUFF.x, CUFF.fold)}`));
  put('twoskies-details', render(DETAILS.w, DETAILS.h, `<rect width="${DETAILS.w}" height="${DETAILS.h}" fill="${SKIES.night[3]}"/>${rib(BAND.x, BAND.fold)}`));
  put('twoskies-label', label('#FFF6E6', SKIES.ink, SKIES.dawn[6]));
}

// --- souvenir: plum body, cream sleeves, a day-and-night emblem on the back -------------------------------
{
  const cx = MID, cy = 3200, r = 1050;
  // Rays all round the emblem except straight up, where the title sits.
  const sunRays = [...Array(16)].filter((_, i) => i < 11 || i > 13).map((_, i) => { const a = (i * Math.PI) / 8; return `<line x1="${cx + 1420 * Math.cos(a)}" y1="${cy + 1420 * Math.sin(a)}" x2="${cx + 1560 * Math.cos(a)}" y2="${cy + 1560 * Math.sin(a)}" stroke="${GOLD}" stroke-width="26" stroke-linecap="round"/>`; }).join('');
  const emblem = `<defs><clipPath id="left"><rect x="${cx - r - 20}" y="${cy - r - 20}" width="${r + 20}" height="${2 * r + 40}"/></clipPath><clipPath id="right"><rect x="${cx}" y="${cy - r - 20}" width="${r + 20}" height="${2 * r + 40}"/></clipPath></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#141139" clip-path="url(#left)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFB27A" clip-path="url(#right)"/>
    <g clip-path="url(#left)">${stars(9, 160, [cx - r, cy - r, cx, cy + r], '#FFF6E6')}
      <circle cx="${cx - 560}" cy="${cy - 420}" r="200" fill="${SKIES.moon}"/><circle cx="${cx - 470}" cy="${cy - 470}" r="170" fill="#141139"/></g>
    <g clip-path="url(#right)"><circle cx="${cx + 560}" cy="${cy - 420}" r="200" fill="${GOLD}"/>${[...Array(8)].map((_, i) => { const a = (i * Math.PI) / 4; return `<line x1="${cx + 560 + 250 * Math.cos(a)}" y1="${cy - 420 + 250 * Math.sin(a)}" x2="${cx + 560 + 330 * Math.cos(a)}" y2="${cy - 420 + 330 * Math.sin(a)}" stroke="${GOLD}" stroke-width="30" stroke-linecap="round"/>`; }).join('')}</g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${GOLD}" stroke-width="36"/><circle cx="${cx}" cy="${cy}" r="${r + 90}" fill="none" stroke="${GOLD}" stroke-width="12"/>
    ${sunRays}${fox(cx, cy + 120, 820, BLUSH, PLUM)}`;
  const branch = (dir) => [...Array(7)].map((_, i) => { const t = i / 6, x = cx + dir * (520 + t * 1000), y = cy + r + 420 + Math.sin(t * Math.PI) * -160;
    return `<ellipse cx="${x}" cy="${y}" rx="60" ry="26" transform="rotate(${dir * (30 - t * 70)} ${x} ${y})" fill="${GOLD}"/>`; }).join('') + `<path d="M ${cx + dir * 520} ${cy + r + 420} Q ${cx + dir * 1000} ${cy + r + 180} ${cx + dir * 1520} ${cy + r + 420}" fill="none" stroke="${GOLD}" stroke-width="16"/>`;
  const sleeveS = `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${BLUSH}"/>${ribbing(CUFF.x, CUFF.fold, PLUM, GOLD)}`;
  put('souvenir-front', render(PANEL.w, PANEL.h, `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${PLUM}"/>
    ${fox((FRONT.rightSafe[0] + FRONT.rightSafe[1]) / 2, FRONT.neck + 480, 300, BLUSH, PLUM)}
    <text x="${(FRONT.rightSafe[0] + FRONT.rightSafe[1]) / 2}" y="${FRONT.neck + 820}" text-anchor="middle" font-family="Graduate" font-size="150" letter-spacing="14" fill="${GOLD}">143</text>
    <text x="${(FRONT.leftSafe[0] + FRONT.leftSafe[1]) / 2}" y="${FRONT.neck + 540}" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="150" fill="${BLUSH}">Far Fox</text>
    <text x="${(FRONT.leftSafe[0] + FRONT.leftSafe[1]) / 2}" y="${FRONT.neck + 640}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="44" letter-spacing="12" fill="${GOLD}">SOUVENIR OF THE DISTANCE</text>`));
  put('souvenir-back', render(PANEL.w, PANEL.h, `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${PLUM}"/>${ribbing(COLLAR.x, COLLAR.fold, GOLD, BLUSH)}
    <text x="${cx}" y="${cy - r - 330}" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="440" fill="${BLUSH}">Far Fox</text>
    ${emblem}${branch(-1)}${branch(1)}
    <text x="${cx}" y="${cy + r + 440}" text-anchor="middle" font-family="Graduate" font-size="118" letter-spacing="12" fill="${GOLD}">SAME LOVE</text>
    <text x="${cx}" y="${cy + r + 640}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="78" letter-spacing="14" fill="${BLUSH}">DIFFERENT TIME ZONES</text>`));
  put('souvenir-sleeve', render(PANEL.w, PANEL.h, sleeveS));
  put('souvenir-details', render(DETAILS.w, DETAILS.h, `<rect width="${DETAILS.w}" height="${DETAILS.h}" fill="${PLUM}"/>${ribbing(BAND.x, BAND.fold, GOLD, BLUSH)}`));
  put('souvenir-label', label(PLUM, BLUSH, GOLD));
}

// --- paravion: an airmail envelope, worn ------------------------------------------------------------------
{
  const CREAM = '#FFF8F0', INK = PLUM, RED = '#D6336C', BLUE = '#2F4A9E';
  const chevronsV = (x0, w, y0, y1) => airmail(x0, w, y0, y1, RED, BLUE);
  const stamp = (cx, cy, s) => `<rect x="${cx - 170 * s}" y="${cy - 210 * s}" width="${340 * s}" height="${420 * s}" fill="#FFFFFF" stroke="${INK}" stroke-width="${6 * s}" stroke-dasharray="${16 * s} ${10 * s}"/>
    ${fox(cx, cy - 40 * s, 200 * s, ORANGE, INK)}<text x="${cx}" y="${cy + 150 * s}" text-anchor="middle" font-family="Graduate" font-size="${50 * s}" letter-spacing="${4 * s}" fill="${INK}">LDC · 143</text>`;
  const postmark = (cx, cy, R) => `<g opacity="0.9"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${INK}" stroke-width="18"/><circle cx="${cx}" cy="${cy}" r="${R - 110}" fill="none" stroke="${INK}" stroke-width="10"/>
    ${arcText('pt', 'LONG DISTANCE CLUB', cx, cy, R - 55, 86, INK, 6, 'Nunito')}${arcText('pb', 'POSTE RESTANTE', cx, cy, R - 40, 86, INK, 6, 'Nunito', true)}
    <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="170" fill="${INK}">Far Fox</text>
    <text x="${cx}" y="${cy + 130}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="70" letter-spacing="8" fill="${INK}">WHEREVER YOU ARE</text>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M ${cx - R - 760} ${cy - 170 + i * 85} q 90 -50 180 0 t 180 0 t 180 0 t 180 0" fill="none" stroke="${INK}" stroke-width="16"/>`).join('')}</g>`;
  put('paravion-front', render(PANEL.w, PANEL.h, `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${CREAM}"/>
    ${chevronsV(2020, 240, 600, PANEL.h)}${chevronsV(2390, 240, 600, PANEL.h)}
    ${stamp((FRONT.rightSafe[0] + FRONT.rightSafe[1]) / 2 + 120, FRONT.neck + 600, 1.4)}
    ${plane((FRONT.leftSafe[0] + FRONT.leftSafe[1]) / 2 - 300, FRONT.neck + 470, -20, 2.2, RED)}
    <text x="${(FRONT.leftSafe[0] + FRONT.leftSafe[1]) / 2}" y="${FRONT.neck + 720}" text-anchor="middle" font-family="Graduate" font-size="110" letter-spacing="14" fill="${BLUE}">PAR AVION</text>
    <text x="${(FRONT.leftSafe[0] + FRONT.leftSafe[1]) / 2}" y="${FRONT.neck + 810}" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="64" fill="${INK}">by air mail</text>`));
  put('paravion-back', render(PANEL.w, PANEL.h, `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${CREAM}"/>${ribbing(COLLAR.x, COLLAR.fold, RED, BLUE)}
    ${stamp(MID + 1050, 1900, 2)}${postmark(MID - 250, 2500, 760)}
    <text x="${MID - 1000}" y="3850" font-family="IM FELL French Canon" font-style="italic" font-size="150" fill="${INK}">To: the one far away</text>
    <text x="${MID - 1000}" y="4120" font-family="IM FELL French Canon" font-style="italic" font-size="150" fill="${INK}">From: the one who misses you</text>
    <text x="${MID}" y="4700" text-anchor="middle" font-family="Graduate" font-size="300" letter-spacing="30" fill="${BLUE}">PAR AVION</text>
    ${plane(MID + 1500, 4610, -15, 2.6, RED)}`));
  put('paravion-sleeve', render(PANEL.w, PANEL.h, `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${CREAM}"/>${chevronsV(MID - 150, 300, 200, SLEEVE_END + 60)}${ribbing(CUFF.x, CUFF.fold, RED, BLUE)}`));
  put('paravion-details', render(DETAILS.w, DETAILS.h, `<rect width="${DETAILS.w}" height="${DETAILS.h}" fill="${CREAM}"/>${ribbing(BAND.x, BAND.fold, RED, BLUE)}`));
  put('paravion-label', label(CREAM, INK, RED));
}

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
