/**
 * Far Fox National Park flannel (Independent Trading Co. EXP50F via Printify, DTF at 300 dpi).
 * Each print is a cream "sewn patch" so it reads on busy plaid: the park badge on the back, a Foxy patch
 * on the left pocket, and a printed neck label.
 *
 * Writes public/shop/designs/flannel/*.png. Usage: node scripts/make-flannel.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const OUT = new URL('../public/shop/designs/flannel/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const fontFiles = [];
for (const [n, q] of [['graduate', 'Graduate'], ['nunito9', 'Nunito:wght@900'], ['fell', 'IM+Fell+French+Canon:ital@1']]) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const f = join(tmpdir(), `flannel-${n}.ttf`);
  await writeFile(f, Buffer.from(await fetch(css.match(/url\((https:[^)]+\.ttf)\)/)[1]).then((r) => r.arrayBuffer())));
  fontFiles.push(f);
}
const png = (w, h, body) => Buffer.from(new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`, { fitTo: { mode: 'width', value: w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng());

const C = { cream: '#F4ECE0', plum: '#2D1B4E', mid: '#4A3470', far: '#6B5294', pink: '#FF6B8A', blush: '#FFB2C6' };
const FOXY = `data:image/png;base64,${(await sharp(`${REPO}/public/shop/designs/hearteyes-v2.png`).extract({ left: 650, top: 0, width: 1400, height: 1480 }).png().toBuffer()).toString('base64')}`;
const foxy = (cx, top, w) => `<image href="${FOXY}" x="${cx - w / 2}" y="${top}" width="${w}" height="${w * 1480 / 1400}"/>`;
const pine = (x, base, h, c) => { const w = h * 0.42; let tiers = '';
  for (let i = 0; i < 4; i++) { const y = base - h * (0.18 + i * 0.22), tw = w * (1 - i * 0.2); tiers += `<polygon points="${x - tw / 2},${y + h * 0.2} ${x + tw / 2},${y + h * 0.2} ${x},${y - h * 0.12}" fill="${c}"/>`; }
  return `<rect x="${x - h * 0.03}" y="${base - h * 0.14}" width="${h * 0.06}" height="${h * 0.14}" fill="${c}"/>${tiers}`; };
const arc = (id, cx, cy, r, top) => top
  ? `<path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"/>`
  : `<path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}"/>`;

/** A park trail sign: one board pointing off into the distance, to the other half. */
const trailSign = (postX, top) => `<rect x="${postX - 24}" y="${top}" width="48" height="${2230 - top}" fill="${C.cream}" stroke="${C.plum}" stroke-width="14"/>
  <path d="M ${postX - 230} ${top + 20} L ${postX + 190} ${top + 20} L ${postX + 270} ${top + 115} L ${postX + 190} ${top + 210} L ${postX - 230} ${top + 210} Z" fill="${C.cream}" stroke="${C.plum}" stroke-width="16" stroke-linejoin="round"/>
  <text x="${postX - 10}" y="${top + 110}" text-anchor="middle" font-family="Graduate" font-size="86" letter-spacing="6" fill="${C.plum}">YOU</text>
  <text x="${postX - 10}" y="${top + 185}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="62" letter-spacing="3" fill="${C.pink}">1,204 MI</text>`;

/** The park badge: cream patch, a ring of lettering, and a night scene with Foxy in front of the mountains. */
function parkBadge() {
  const S = 3000, cx = 1500, cy = 1500, R = 1460, INNER = 1150;
  const stars = [[1100, 640], [1350, 520], [1820, 600], [2050, 760], [960, 880], [1640, 820], [2180, 1000]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="${C.cream}"/>`).join('');
  const scene = `<clipPath id="inside"><circle cx="${cx}" cy="${cy}" r="${INNER}"/></clipPath>
    <g clip-path="url(#inside)">
      <rect width="${S}" height="${S}" fill="${C.plum}"/>${stars}
      <polygon points="300,1900 900,980 1250,1450 1580,900 2250,1800 2700,1500 2700,2700 300,2700" fill="${C.far}"/>
      <polygon points="1440,1080 1580,900 1720,1080 1650,1050 1580,1110 1510,1050" fill="${C.cream}"/>
      <polygon points="780,1160 900,980 1020,1160 960,1130 900,1180 840,1130" fill="${C.cream}"/>
      <polygon points="300,2100 800,1600 1300,2000 1900,1550 2700,2150 2700,2700 300,2700" fill="${C.mid}"/>
      ${[[520, 2160, 520], [700, 2200, 380], [2320, 2140, 540], [2520, 2200, 400], [880, 2230, 300], [2140, 2230, 320]].map(([x, b, h]) => pine(x, b, h, C.plum)).join('')}
      <rect x="0" y="2220" width="${S}" height="800" fill="${C.plum}"/>
      <g transform="translate(2265 2230) scale(1.3) translate(-2265 -2230)">${trailSign(2265, 1600)}</g>
      ${foxy(1420, 1200, 1000)}
    </g>`;
  const ribbon = `<path d="M 260 2140 L 2740 2140 L 2650 2290 L 2740 2440 L 260 2440 L 350 2290 Z" fill="${C.pink}" stroke="${C.plum}" stroke-width="26" stroke-linejoin="round"/>
    <text x="${cx}" y="2335" text-anchor="middle" font-family="Graduate" font-size="128" letter-spacing="6" fill="${C.cream}">LEAVE NO TRACE</text>
    <text x="${cx}" y="2412" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="68" letter-spacing="10" fill="${C.plum}">(EXCEPT TEXTS)</text>`;
  return png(S, S, `<defs>${arc('top', cx, cy, INNER + 50, true)}${arc('bot', cx, cy, INNER + 185, false)}</defs>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.cream}" stroke="${C.plum}" stroke-width="40"/>
    <circle cx="${cx}" cy="${cy}" r="${R - 70}" fill="none" stroke="${C.plum}" stroke-width="10" stroke-dasharray="40 26"/>
    ${scene}<circle cx="${cx}" cy="${cy}" r="${INNER}" fill="none" stroke="${C.plum}" stroke-width="30"/>
    <text font-family="Graduate" font-size="170" letter-spacing="14" fill="${C.plum}" text-anchor="middle"><textPath href="#top" startOffset="50%">FAR FOX NATIONAL PARK</textPath></text>
    <text font-family="Nunito" font-weight="900" font-size="110" letter-spacing="22" fill="${C.plum}" text-anchor="middle"><textPath href="#bot" startOffset="50%">EST. WHEREVER YOU ARE</textPath></text>
    ${ribbon}`);
}

/** Left pocket: a small round Foxy patch with a FAR FOX banner. */
function pocketPatch() {
  const W = 1050, H = 840, cx = 525, cy = 400, R = 380;
  return png(W, H, `<clipPath id="p"><circle cx="${cx}" cy="${cy}" r="${R - 40}"/></clipPath>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="${C.cream}" stroke="${C.plum}" stroke-width="22"/>
    <g clip-path="url(#p)"><rect width="${W}" height="${H}" fill="${C.plum}"/>
      <polygon points="100,640 380,300 560,520 760,260 1000,600 1000,900 100,900" fill="${C.far}"/>
      ${foxy(cx, 250, 470)}</g>
    <circle cx="${cx}" cy="${cy}" r="${R - 40}" fill="none" stroke="${C.plum}" stroke-width="14"/>
    <path d="M 165 630 L 885 630 L 845 695 L 885 760 L 165 760 L 205 695 Z" fill="${C.pink}" stroke="${C.plum}" stroke-width="14" stroke-linejoin="round"/>
    <text x="${cx}" y="727" text-anchor="middle" font-family="Graduate" font-size="86" letter-spacing="10" fill="${C.cream}">FAR FOX</text>`);
}

// Vintage wear: knocked-out specks, heavier towards the rim. Less ink also makes a large DTF print softer to wear.
const DISTRESS_GRAIN = 6, DISTRESS_CLUMP = 70;
const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
async function distress(buf, strength = 1) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cx = info.width / 2, cy = info.height / 2, rim = Math.min(cx, cy);
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4;
    if (!data[i + 3]) continue;
    const edge = Math.max(0, Math.hypot(x - cx, y - cy) / rim - 0.75) * 1.6;
    const wear = smooth(x / DISTRESS_CLUMP, y / DISTRESS_CLUMP) * 0.55 + hash(Math.floor(x / DISTRESS_GRAIN), Math.floor(y / DISTRESS_GRAIN)) * 0.45;
    if (wear > 0.84 - (edge * 0.25 + 0.0) * strength && wear * strength > 0.62) data[i + 3] = 0;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

/** Neck label: printed inside the collar. */
const neckLabel = () => png(591, 591, `<rect x="20" y="150" width="551" height="290" rx="26" fill="${C.cream}" stroke="${C.plum}" stroke-width="8"/>
  <text x="295" y="270" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="92" letter-spacing="14" fill="${C.plum}">FAR FOX</text>
  <text x="295" y="360" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="62" fill="${C.pink}">Worth every mile.</text>`);

await writeFile(`${OUT}flannel-back.png`, await distress(parkBadge()));
await writeFile(`${OUT}flannel-pocket.png`, await distress(pocketPatch(), 0.6));
await writeFile(`${OUT}flannel-neck.png`, neckLabel());
console.log('flannel files written');
