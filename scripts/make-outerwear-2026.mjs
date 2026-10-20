/**
 * Far Fox outerwear, winter 2026: the Far Fox Airways flight jacket and the Far Fox beanie.
 *
 * Jacket: All-Over Print Unisex Bomber Jacket (Printful 390), cut-and-sew at 150 dpi. A night-plum body
 * under a faint star field; a wings insignia on the left chest and a WORTH EVERY MILE name tape on the
 * right; the Long Distance Club globe across the back, with a dashed flight path between two cities and
 * a heart at the top of the arc; airmail chevrons down each sleeve; pink and blush stripes in the collar,
 * cuff and waistband ribbing. Files: front, back and both sleeves at 4650×5400, ribbing and pocket welts
 * at 7950×2700, the inside label at 375×150. Panel geometry comes from Printful's mockup templates,
 * mapped into print-file pixels (template px − print-area offset, × print-file / print-area width).
 *
 * Beanie: Yupoong 1501KC cuffed beanie (Printful 266), flat embroidery on the cuff, 1500×525 at 300 dpi.
 * FAR · fox crest · FOX in exact Printful thread colours. The crest's ears, eyes and nose are
 * transparent, so they are left unstitched and show the knit.
 *
 * Writes public/shop/designs/outerwear-2026/*.png.
 * Usage: node scripts/make-outerwear-2026.mjs [--preview <dir>]   (--preview lays each file over its Printful template)
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { rng } from './kit-designs-2026-10.mjs';

const OUT = new URL('../public/shop/designs/outerwear-2026/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const fontFiles = [];
for (const [n, q] of [['graduate', 'Graduate'], ['nunito9', 'Nunito:wght@900'], ['fell', 'IM+Fell+French+Canon:ital@1']]) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const f = join(tmpdir(), `outerwear-${n}.ttf`);
  await writeFile(f, Buffer.from(await fetch(css.match(/url\((https:[^)]+\.ttf)\)/)[1]).then((r) => r.arrayBuffer())));
  fontFiles.push(f);
}
const render = (w, h, body) => Buffer.from(new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`, { fitTo: { mode: 'width', value: w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng());

// Jacket palette: the brand plum taken down to a night sky, with pink and blush as the only other inks.
const NIGHT = '#1F1946', NIGHT_HI = '#2A2360', PINK = '#FF6B8A', BLUSH = '#FFF5F0';

// Print files and where the garment sits in them.
const PANEL = { w: 4650, h: 5400 }, DETAILS = { w: 7950, h: 2700 }, LABEL = { w: 375, h: 150 };
const MID = PANEL.w / 2;
// Front: two half panels either side of the zip; safe areas inset from the seams. The wearer's left
// chest is the right-hand panel. Shoulder seam, neckline bottom and the top of the pocket welts.
const FRONT = { leftSafe: [709, 2070], rightSafe: [2578, 3939], shoulder: 903, neck: 1580, pocket: 3612 };
// Back: one panel plus the folded collar ribbing above it.
const BACK = { safe: [755, 3877], shoulder: 670, safeTop: 1305, collar: { x: [600, 4050], fold: 350 } };
// Sleeve: a fan with the shoulder line down its centre, then the folded cuff ribbing below.
const SLEEVE = { top: 540, end: 4050, cuff: { x: [1541, 3107], fold: 4671 } };
// Details: the folded waistband across the lower part; the pocket welts above it stay plain.
const BAND = { x: [130, 7818], fold: 2139 };

// --- shared drawing -------------------------------------------------------------------------------
const fox = (cx, cy, w, body, feature) => { const s = w / 300;
  return `<g transform="translate(${cx - w / 2} ${cy - 153 * s}) scale(${s})"><polygon points="25,0 100,88 200,88 275,0 300,190 150,306 0,190" fill="${body}"/>
  <polygon points="35,30 30,95 85,85" fill="${feature}"/><polygon points="265,30 270,95 215,85" fill="${feature}"/>
  <polygon points="72,140 125,152 120,175 70,162" fill="${feature}"/><polygon points="228,140 175,152 180,175 230,162" fill="${feature}"/>
  <polygon points="88,196 212,196 150,306" fill="#FFFFFF"/><polygon points="137,226 163,226 150,248" fill="${feature}"/></g>`; };
/** The crest with its features cut out of the body, so they show the garment (or go unstitched). */
const knockFox = (id, cx, cy, w, colour) => { const s = w / 300, x = cx - w / 2, y = cy - 153 * s;
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="99999" height="99999"><rect x="0" y="0" width="99999" height="99999" fill="#fff"/>
    <g transform="translate(${x} ${y}) scale(${s})"><polygon points="35,30 30,95 85,85" fill="#000"/><polygon points="265,30 270,95 215,85" fill="#000"/><polygon points="72,140 125,152 120,175 70,162" fill="#000"/><polygon points="228,140 175,152 180,175 230,162" fill="#000"/>
    <polygon points="88,196 212,196 150,306" fill="none" stroke="#000" stroke-width="12"/><polygon points="135,224 165,224 150,250" fill="#000"/></g></mask></defs>
    <g mask="url(#${id})"><polygon transform="translate(${x} ${y}) scale(${s})" points="25,0 100,88 200,88 275,0 300,190 150,306 0,190" fill="${colour}"/></g>`; };
const HEART = 'M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z';
const heart = (x, y, size, c) => `<path transform="translate(${x - size / 2} ${y - size * 0.45}) scale(${size / 100})" d="${HEART}" fill="${c}"/>`;
const arcText = (id, text, cx, cy, r, size, colour, spacing = 8) => `<defs><path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"/></defs>
  <text font-family="Graduate" font-size="${size}" letter-spacing="${spacing}" fill="${colour}" text-anchor="middle"><textPath href="#${id}" startOffset="50%">${text}</textPath></text>`;
const star5 = (cx, cy, R, c) => { const pts = []; for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2, rad = i % 2 ? R * 0.42 : R; pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`); } return `<polygon points="${pts.join(' ')}" fill="${c}"/>`; };
const sparkle = (x, y, s, c) => `<path d="M ${x} ${y - s} L ${x + s * 0.22} ${y - s * 0.22} L ${x + s} ${y} L ${x + s * 0.22} ${y + s * 0.22} L ${x} ${y + s} L ${x - s * 0.22} ${y + s * 0.22} L ${x - s} ${y} L ${x - s * 0.22} ${y - s * 0.22} Z" fill="${c}"/>`;

/** A faint star field over a panel: small blush specks, a few of them four-point sparkles. */
function stars(seed, count, [x0, y0, x1, y1]) {
  const r = rng(seed);
  let out = '';
  for (let k = 0; k < count; k++) {
    const x = (x0 + r() * (x1 - x0)).toFixed(0), y = (y0 + r() * (y1 - y0)).toFixed(0);
    if (k % 23 === 0) out += `<g opacity="${(0.5 + r() * 0.4).toFixed(2)}">${sparkle(+x, +y, 22 + r() * 18, BLUSH)}</g>`;
    else out += `<circle cx="${x}" cy="${y}" r="${(3 + r() * 5).toFixed(1)}" fill="${BLUSH}" opacity="${(0.18 + r() * 0.5).toFixed(2)}"/>`;
  }
  return out;
}
/** Bomber ribbing: a pink and a blush stripe, mirrored about the fold so both faces of the rib match. */
const ribbing = ([x0, x1], fold) => [[70, 140, PINK], [165, 205, BLUSH]].map(([a, b, c]) =>
  `<rect x="${x0}" y="${fold - b}" width="${x1 - x0}" height="${b - a}" fill="${c}"/><rect x="${x0}" y="${fold + a}" width="${x1 - x0}" height="${b - a}" fill="${c}"/>`).join('');
/** Airmail chevrons down a vertical band: pink and blush parallelograms with the body showing between. */
function airmail(x0, w, y0, y1) {
  let out = '';
  for (let y = y0, i = 0; y < y1; y += 150, i++) out += `<polygon points="${x0},${y + 150} ${x0 + w},${y} ${x0 + w},${y + 75} ${x0},${y + 225}" fill="${i % 2 ? BLUSH : PINK}"/>`;
  return out;
}

// --- jacket front: wings on the left chest, a name tape on the right ---------------------------------
/** Aviator wings: four feathers a side, drawn as rounded tapers with a night seam between them, longest on top. */
function wings(cx, cy, s) {
  const feathers = [[36, 330, -24, 0], [18, 290, -6, 22], [0, 245, 13, 44], [-18, 200, 32, 66]];
  let out = '';
  for (const dir of [-1, 1]) for (const [rise, len, deg, drop] of [...feathers].reverse()) {
    const x = cx + dir * 112 * s, y = cy - 10 * s + drop * s, w = 46 * s, L = len * s;
    const tip = `M 0 ${-w / 2} L ${L * 0.72} ${-w / 2 + rise * 0.1} Q ${L} ${-w * 0.1} ${L * 0.72} ${w / 2 - rise * 0.1} L 0 ${w / 2} Z`;
    out += `<path transform="translate(${x} ${y}) rotate(${dir * deg}) scale(${dir} 1)" d="${tip}" fill="${BLUSH}" stroke="${NIGHT}" stroke-width="${7 * s}" stroke-linejoin="round"/>`;
  }
  return out;
}
function insignia(cx, cy) {
  return `${wings(cx, cy, 1)}${fox(cx, cy, 210, BLUSH, NIGHT)}
    <text x="${cx}" y="${cy + 215}" text-anchor="middle" font-family="Graduate" font-size="44" letter-spacing="7" fill="${PINK}">FAR FOX AIRWAYS</text>
    <text x="${cx}" y="${cy + 268}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="30" letter-spacing="8" fill="${BLUSH}">EST. WHEREVER YOU ARE</text>`;
}
const nameTape = (cx, cy) => `<rect x="${cx - 340}" y="${cy - 56}" width="680" height="112" fill="${BLUSH}"/>
  <rect x="${cx - 322}" y="${cy - 38}" width="644" height="76" fill="none" stroke="${NIGHT}" stroke-width="3" stroke-dasharray="12 9"/>
  <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="Graduate" font-size="50" letter-spacing="7" fill="${NIGHT}">WORTH EVERY MILE</text>`;
const chestY = FRONT.neck + 560;
const frontSvg = `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${NIGHT}"/>
  ${stars(11, 380, [0, 0, PANEL.w, PANEL.h])}
  ${insignia((FRONT.rightSafe[0] + FRONT.rightSafe[1]) / 2, chestY)}
  ${nameTape((FRONT.leftSafe[0] + FRONT.leftSafe[1]) / 2, chestY)}`;

// --- jacket back: the Long Distance Club globe ----------------------------------------------------
function plane(x, y, deg, s) {
  return `<path transform="translate(${x} ${y}) rotate(${deg}) scale(${s})" d="M 55 0 L 20 -8 L -10 -8 L -35 -42 L -48 -42 L -32 -8 L -45 -8 L -55 -22 L -62 -22 L -58 0 L -62 22 L -55 22 L -45 8 L -32 8 L -48 42 L -35 42 L -10 8 L 20 8 Z" fill="${BLUSH}"/>`;
}
function globe(cx, cy, r) {
  const grid = [0.34, 0.68].map((k) => `<ellipse cx="${cx}" cy="${cy}" rx="${r * k}" ry="${r}"/>`).join('') + `<line x1="${cx}" y1="${cy - r}" x2="${cx}" y2="${cy + r}"/>` +
    [-0.68, -0.34, 0, 0.34, 0.68].map((k) => `<line x1="${cx - r}" y1="${cy + r * k}" x2="${cx + r}" y2="${cy + r * k}"/>`).join('');
  return `<defs><clipPath id="globe"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${NIGHT_HI}"/>
    <g clip-path="url(#globe)" fill="none" stroke="${PINK}" stroke-opacity="0.5" stroke-width="6">${grid}</g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${PINK}" stroke-width="14"/>`;
}
function ribbon(cx, cy, w, h, text) {
  const x0 = cx - w / 2, x1 = cx + w / 2, n = 90;
  return `<path d="M ${x0} ${cy - h / 2} L ${x1} ${cy - h / 2} L ${x1 - n} ${cy} L ${x1} ${cy + h / 2} L ${x0} ${cy + h / 2} L ${x0 + n} ${cy} Z" fill="${PINK}"/>
    <text x="${cx}" y="${cy + 42}" text-anchor="middle" font-family="Graduate" font-size="118" letter-spacing="12" fill="${NIGHT}">${text}</text>`;
}
function backSvg() {
  const cx = MID, cy = 3250, r = 1000;
  // Two cities on the globe, a dashed great circle between them, a heart at the top of the arc.
  const a = [cx - 900, cy + 240], b = [cx + 900, cy + 240], ctrl = [cx, 1660];
  const at = (t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * ctrl[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * ctrl[1] + t * t * b[1]];
  const [px, py] = at(0.22), [qx, qy] = at(0.24);
  const apex = at(0.5);
  return `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${NIGHT}"/>
    ${stars(23, 420, [0, BACK.shoulder, PANEL.w, PANEL.h])}
    ${ribbing(BACK.collar.x, BACK.collar.fold)}
    ${arcText('club', 'LONG DISTANCE CLUB', cx, cy, 1290, 190, BLUSH, 16)}
    ${globe(cx, cy, r)}
    <path d="M ${a[0]} ${a[1]} Q ${ctrl[0]} ${ctrl[1]} ${b[0]} ${b[1]}" fill="none" stroke="${BLUSH}" stroke-width="14" stroke-dasharray="44 30" stroke-linecap="round"/>
    ${fox(cx, cy - 60, 780, BLUSH, NIGHT)}
    ${star5(a[0], a[1], 78, PINK)}${star5(b[0], b[1], 78, PINK)}
    ${plane(px, py, (Math.atan2(qy - py, qx - px) * 180) / Math.PI, 1.5)}
    ${heart(apex[0], apex[1], 170, PINK)}
    ${ribbon(cx, cy + r + 260, 2060, 210, 'WORTH EVERY MILE')}
    <text x="${cx}" y="${cy + r + 560}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="72" letter-spacing="14" fill="${BLUSH}">EST. WHEREVER YOU ARE</text>`;
}

// --- sleeves, ribbing and label ----------------------------------------------------------------------
const sleeveSvg = `<rect width="${PANEL.w}" height="${PANEL.h}" fill="${NIGHT}"/>
  ${stars(37, 300, [0, 0, PANEL.w, SLEEVE.end])}
  ${airmail(MID - 150, 300, 200, SLEEVE.end + 60)}
  ${ribbing(SLEEVE.cuff.x, SLEEVE.cuff.fold)}`;
const detailsSvg = `<rect width="${DETAILS.w}" height="${DETAILS.h}" fill="${NIGHT}"/>${ribbing(BAND.x, BAND.fold)}`;
const labelSvg = `<rect width="${LABEL.w}" height="${LABEL.h}" fill="${BLUSH}"/>${fox(60, 72, 56, NIGHT, BLUSH)}
  <text x="225" y="66" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="34" letter-spacing="6" fill="${NIGHT}">FAR FOX</text>
  <text x="225" y="112" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="30" fill="${PINK}">Worth every mile.</text>`;

// --- beanie: FAR · crest · FOX in Printful thread colours -------------------------------------------
// Flamingo for the crest everywhere; White lettering on dark beanies, Purple on light ones.
export const THREAD = { flamingo: '#CC3366', white: '#FFFFFF', purple: '#6B5294' };
const beanieSvg = (letters) => `<text x="550" y="334" text-anchor="end" font-family="Graduate" font-size="200" letter-spacing="10" fill="${letters}">FAR</text>
  ${knockFox('bf', 750, 262, 290, THREAD.flamingo)}
  <text x="950" y="334" font-family="Graduate" font-size="200" letter-spacing="10" fill="${letters}">FOX</text>`;

const files = {
  'bomber-front': [PANEL, frontSvg], 'bomber-back': [PANEL, backSvg()], 'bomber-sleeve': [PANEL, sleeveSvg],
  'bomber-details': [DETAILS, detailsSvg], 'bomber-label': [LABEL, labelSvg],
  'beanie-dark': [{ w: 1500, h: 525 }, beanieSvg(THREAD.white)], 'beanie-light': [{ w: 1500, h: 525 }, beanieSvg(THREAD.purple)],
};
for (const [name, [{ w, h }, body]] of Object.entries(files)) {
  await writeFile(join(OUT, `${name}.png`), render(w, h, body));
  console.log(`${name}.png ${w}×${h}`);
}

// --- previews: each file under its Printful template, so the panel shape and seams show ---------------
const args = process.argv.slice(2);
if (args.includes('--preview')) {
  const dir = args[args.indexOf('--preview') + 1];
  await mkdir(dir, { recursive: true });
  const CDN = 'https://files.cdn.printful.com';
  const TEMPLATES = {
    'bomber-front': [`${CDN}/o/upload/api-template/8f/8f57e74237ee8001811c744b986b04f8`, 470, 0, 2060, 2390],
    'bomber-back': [`${CDN}/o/upload/api-template/8c/8cc35cf6641a611aee90dba754ce0da7`, 474, 0, 2056, 2390],
    'bomber-sleeve': [`${CDN}/o/upload/api-template/f6/f6f0e175138a679c77caf61e43227c82`, 210, 0, 2584, 3000],
    'bomber-details': [`${CDN}/o/upload/api-template/61/61e650ab41f635dd4f8fbbed35641ad2`, 0, 993, 3000, 1018],
    'beanie-dark': [`${CDN}/m/162-yupoong1501kc/medium/flat_new/front/04_yupoong1501kc_flat_front_base_whitebg.png`, 734, 2030, 1574, 552],
  };
  for (const [name, [url, left, top, w, h]] of Object.entries(TEMPLATES)) {
    const tpl = await sharp(Buffer.from(await (await fetch(url)).arrayBuffer())).resize(3000, 3000).png().toBuffer();
    const art = await sharp(join(OUT, `${name}.png`)).resize(w, h, { fit: 'inside' }).png().toBuffer();
    const bg = name.startsWith('beanie') ? '#1a1a2e' : '#ffffff';
    // sharp resizes before it composites whatever the call order, so the overlay goes to a buffer first.
    const full = await sharp({ create: { width: 3000, height: 3000, channels: 4, background: bg } })
      .composite(name.startsWith('beanie') ? [{ input: tpl, left: 0, top: 0 }, { input: art, left, top }] : [{ input: art, left, top }, { input: tpl, left: 0, top: 0 }]).png().toBuffer();
    await sharp(full).resize(900).jpeg({ quality: 70 }).toFile(join(dir, `${name}.jpg`));
  }
  console.log(`previews in ${dir}`);
}
