/**
 * October 2026 apparel: the reworked tee line, the Love Letter hoodie and the Long Distance Club crewneck.
 *
 * Tees (Bella + Canvas 3001) and the hoodie (Bella + Canvas 3719) are DTG at 150 dpi; each design has a
 * light-garment and a dark-garment ink version. The crewneck (Lane Seven LS14004) is embroidered: its files
 * hold exact Printful thread colours only. Every piece carries the Foxy inside label.
 *
 * Writes public/shop/designs/apparel-2026-10/*.png. Usage: node scripts/make-apparel-2026-10.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const OUT = new URL('../public/shop/designs/apparel-2026-10/', import.meta.url).pathname;
await mkdir(OUT, { recursive: true });

const fontFiles = [];
for (const [n, q] of [['graduate', 'Graduate'], ['nunito9', 'Nunito:wght@900'], ['nunito7', 'Nunito:wght@700'], ['fell', 'IM+Fell+French+Canon:ital@1']]) {
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${q}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const f = join(tmpdir(), `apparel-${n}.ttf`);
  await writeFile(f, Buffer.from(await fetch(css.match(/url\((https:[^)]+\.ttf)\)/)[1]).then((r) => r.arrayBuffer())));
  fontFiles.push(f);
}
const png = (w, h, body) => Buffer.from(new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`, { fitTo: { mode: 'width', value: w }, font: { fontFiles, loadSystemFonts: false } }).render().asPng());

// Ink sets: light shirts get plum + pink, dark shirts get pink + blush.
const INK = { light: { main: '#2D1B4E', accent: '#FF6B8A', soft: '#B76CFD' }, dark: { main: '#FFF5F0', accent: '#FF6B8A', soft: '#FFB2C6' } };
const fox = (cx, cy, w, body, cut) => { const s = w / 300;
  return `<g transform="translate(${cx - w / 2} ${cy - 153 * s}) scale(${s})"><polygon points="25,0 100,88 200,88 275,0 300,190 150,306 0,190" fill="${body}"/>
  <polygon points="35,30 30,95 85,85" fill="${cut}"/><polygon points="265,30 270,95 215,85" fill="${cut}"/><polygon points="72,140 125,152 120,175 70,162" fill="${cut}"/><polygon points="228,140 175,152 180,175 230,162" fill="${cut}"/>
  <polygon points="88,196 212,196 150,306" fill="none" stroke="${cut}" stroke-width="10"/><polygon points="135,224 165,224 150,250" fill="${cut}"/></g>`; };
const HEART = 'M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z';
const heart = (x, y, size, c) => `<path transform="translate(${x - size / 2} ${y - size * 0.45}) scale(${size / 100})" d="${HEART}" fill="${c}"/>`;
const arcText = (id, text, cx, cy, r, size, colour, spacing = 8) => `<defs><path id="${id}" d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}"/></defs>
  <text font-family="Graduate" font-size="${size}" letter-spacing="${spacing}" fill="${colour}" text-anchor="middle"><textPath href="#${id}" startOffset="50%">${text}</textPath></text>`;

// Fox crest with its features knocked out, so they show the garment colour.
const knockFox = (id, cx, cy, w, colour) => { const s = w / 300, x = cx - w / 2, y = cy - 153 * s;
  return `<defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="99999" height="99999"><rect x="0" y="0" width="99999" height="99999" fill="#fff"/>
    <g transform="translate(${x} ${y}) scale(${s})"><polygon points="35,30 30,95 85,85" fill="#000"/><polygon points="265,30 270,95 215,85" fill="#000"/><polygon points="72,140 125,152 120,175 70,162" fill="#000"/><polygon points="228,140 175,152 180,175 230,162" fill="#000"/>
    <polygon points="88,196 212,196 150,306" fill="none" stroke="#000" stroke-width="12"/><polygon points="135,224 165,224 150,250" fill="#000"/></g></mask></defs>
    <g mask="url(#${id})"><polygon transform="translate(${x} ${y}) scale(${s})" points="25,0 100,88 200,88 275,0 300,190 150,306 0,190" fill="${colour}"/></g>`; };

const TEE = { w: 1800, h: 2400 };
const designs = {};

// 1) Long Distance Club: left-chest crest + varsity back.
for (const tone of ['light', 'dark']) {
  const k = INK[tone];
  designs[`ldc-front-${tone}`] = [TEE, `${knockFox('f', 1290, 470, 210, k.accent)}
    <text x="1290" y="690" text-anchor="middle" font-family="Graduate" font-size="118" letter-spacing="10" fill="${k.main}">LDC</text>`];
  designs[`ldc-back-${tone}`] = [TEE, `${arcText('a', 'LONG DISTANCE', 900, 980, 690, 210, k.main, 6)}
    ${knockFox('f', 900, 980, 560, k.accent)}
    <text x="900" y="1590" text-anchor="middle" font-family="Graduate" font-size="300" letter-spacing="24" fill="${k.main}">CLUB</text>
    <rect x="430" y="1660" width="940" height="10" fill="${k.accent}"/>
    <text x="900" y="1800" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="82" letter-spacing="10" fill="${k.main}">EST. WHEREVER YOU ARE</text>`];
}

// 2) Two Time Zones: two bold clocks, a flight arc with a heart, and the line.
const clock = (cx, cy, r, hourDeg, minDeg, k, icon) => {
  let ticks = '';
  for (let i = 0; i < 12; i++) { const a = (i * 30 * Math.PI) / 180, r1 = r - 30, r2 = r - (i % 3 ? 58 : 85);
    ticks += `<line x1="${cx + r1 * Math.sin(a)}" y1="${cy - r1 * Math.cos(a)}" x2="${cx + r2 * Math.sin(a)}" y2="${cy - r2 * Math.cos(a)}" stroke="${k.main}" stroke-width="${i % 3 ? 14 : 22}" stroke-linecap="round"/>`; }
  const hand = (deg, len, w) => { const a = (deg * Math.PI) / 180; return `<line x1="${cx}" y1="${cy}" x2="${cx + len * Math.sin(a)}" y2="${cy - len * Math.cos(a)}" stroke="${k.main}" stroke-width="${w}" stroke-linecap="round"/>`; };
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${k.main}" stroke-width="34"/>${ticks}${hand(hourDeg, r * 0.5, 34)}${hand(minDeg, r * 0.74, 22)}<circle cx="${cx}" cy="${cy}" r="26" fill="${k.accent}"/>${icon}`;
};
for (const tone of ['light', 'dark']) {
  const k = INK[tone];
  const sun = (x, y) => { let rays = ''; for (let i = 0; i < 8; i++) { const a = (i * 45 * Math.PI) / 180; rays += `<line x1="${x + 52 * Math.cos(a)}" y1="${y + 52 * Math.sin(a)}" x2="${x + 80 * Math.cos(a)}" y2="${y + 80 * Math.sin(a)}" stroke="${k.accent}" stroke-width="16" stroke-linecap="round"/>`; } return `<circle cx="${x}" cy="${y}" r="38" fill="${k.accent}"/>${rays}`; };
  const moon = (x, y) => `<path d="M ${x + 20} ${y - 62} A 64 64 0 1 0 ${x + 20} ${y + 62} A 50 50 0 1 1 ${x + 20} ${y - 62} Z" fill="${k.soft}"/>`;
  designs[`timezones-${tone}`] = [TEE, `
    <path d="M 470 520 Q 900 120 1330 520" fill="none" stroke="${k.accent}" stroke-width="16" stroke-dasharray="44 30" stroke-linecap="round"/>
    ${heart(900, 320, 120, k.accent)}
    ${clock(470, 920, 330, 270, 0, k, '')}${clock(1330, 920, 330, 90, 0, k, '')}
    ${sun(470, 1350)}${moon(1330, 1350)}
    <text x="470" y="1530" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="96" letter-spacing="10" fill="${k.main}">HERE</text>
    <text x="1330" y="1530" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="96" letter-spacing="10" fill="${k.main}">THERE</text>
    <text x="900" y="1790" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="150" fill="${k.main}">SAME LOVE,</text>
    <text x="900" y="1960" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="112" fill="${k.accent}">DIFFERENT TIME ZONES</text>`];
}

// 3) Morse: a decoder column, one letter per row (I / L O V E / Y O U), big dots and dashes with the letter beside them.
const MORSE = { I: '..', L: '.-..', O: '---', V: '...-', E: '.', Y: '-.--', U: '..-' };
for (const tone of ['light', 'dark']) {
  const k = INK[tone];
  const dots = tone === 'light' ? k.main : k.accent, letters = tone === 'light' ? '#D6336C' : k.main;
  const D = 92, DASH = 240, GAP = 40, ROW = 182, WORD_GAP = 70, CODE_RIGHT = 1260, LETTER_X = 1380;
  let body = '', y = 240;
  ['I', 'LOVE', 'YOU'].forEach((wordText, w) => {
    if (w) y += WORD_GAP;
    for (const ch of wordText) {
      const code = [...MORSE[ch]];
      const width = code.reduce((s, c, i) => s + (c === '.' ? D : DASH) + (i ? GAP : 0), 0);
      let x = CODE_RIGHT - width;
      code.forEach((c, i) => { if (i) x += GAP; const wd = c === '.' ? D : DASH; body += `<rect x="${x}" y="${y}" width="${wd}" height="${D}" rx="${D / 2}" fill="${dots}"/>`; x += wd; });
      body += `<text x="${LETTER_X}" y="${y + D - 4}" font-family="Nunito" font-weight="900" font-size="122" fill="${letters}">${ch}</text>`;
      y += ROW;
    }
  });
  body += `${knockFox('f', 900, y + 150, 170, dots)}<text x="900" y="${y + 350}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="64" letter-spacing="14" fill="${dots}">FAR FOX</text>`;
  designs[`morse-${tone}`] = [TEE, body];
}

// 4) Pride: LOVE IS LOVE stacked over a rainbow band.
const RAINBOW = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'];
for (const tone of ['light', 'dark']) {
  const k = INK[tone];
  const band = RAINBOW.map((c, i) => `<rect x="160" y="${700 + i * 70}" width="1480" height="70" fill="${c}"/>`).join('');
  designs[`pride-${tone}`] = [TEE, `${band}
    <text x="900" y="640" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="360" fill="${k.main}">LOVE</text>
    <text x="900" y="1000" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="230" fill="${tone === 'light' ? '#FFFFFF' : '#FFFFFF'}" stroke="${k.main}" stroke-width="18" paint-order="stroke">IS</text>
    <text x="900" y="1500" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="360" fill="${k.main}">LOVE</text>
    ${knockFox('f', 900, 1760, 200, k.accent)}<text x="900" y="1980" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="64" letter-spacing="14" fill="${k.main}">FAR FOX</text>`];
}

// Foxy, the main Far Fox logo: the heart-eyes face cropped from the 2700 px brand artwork.
const FOXY = `data:image/png;base64,${(await sharp(`${REPO}/public/shop/designs/hearteyes-v2.png`).extract({ left: 650, top: 0, width: 1400, height: 1480 }).png().toBuffer()).toString('base64')}`;
const foxy = (cx, top, w) => `<image href="${FOXY}" x="${cx - w / 2}" y="${top}" width="${w}" height="${w * 1480 / 1400}"/>`;

// 6) Heart Eyes, reworked: Foxy big and centred, bold line underneath, floating hearts.
for (const tone of ['light', 'dark']) {
  const k = INK[tone];
  designs[`hearteyes-${tone}`] = [TEE, `${heart(190, 520, 150, k.accent)}${heart(1610, 420, 115, k.soft)}${heart(1600, 980, 90, k.accent)}${heart(210, 1080, 95, k.soft)}
    ${foxy(900, 230, 1150)}
    <text x="900" y="1700" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="230" fill="${k.main}">HEART EYES</text>
    <text x="900" y="1890" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="120" letter-spacing="6" fill="${k.accent}">ONLY FOR YOU</text>`];
}

// 7) Inside neck label for every tee and the crewneck: Foxy + wordmark + line. Light ink for dark garments.
for (const tone of ['light', 'dark']) {
  const k = INK[tone];
  designs[`label-${tone}`] = [{ w: 450, h: 450 }, `${foxy(225, 30, 200)}
    <text x="225" y="300" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="54" letter-spacing="10" fill="${k.main}">FAR FOX</text>
    <text x="225" y="370" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="46" fill="${k.accent}">Worth every mile.</text>`];
}

// 8) Love Letter hoodie (Bella+Canvas 3719): left-chest Foxy-with-letter, big airmail envelope on the back.
const FOXY_LETTER = `data:image/png;base64,${(await sharp(`${REPO}/public/brand/foxy-letter-v1.png`).png().toBuffer()).toString('base64')}`;
function envelope(k) {
  const x = 200, y = 300, w = 1400, h = 900, PLUM = '#2D1B4E', PINK = '#FF6B8A';
  let chevrons = '';
  const band = 54;
  const edge = (x0, y0, len, horizontal) => { for (let t = 0, i = 0; t < len; t += 70, i++) { const c = i % 2 ? PLUM : PINK;
    chevrons += horizontal ? `<polygon points="${x0 + t},${y0} ${x0 + t + 40},${y0} ${x0 + t + 40 - band},${y0 + band} ${x0 + t - band},${y0 + band}" fill="${c}"/>`
      : `<polygon points="${x0},${y0 + t} ${x0},${y0 + t + 40} ${x0 + band},${y0 + t + 40 - band} ${x0 + band},${y0 + t - band}" fill="${c}"/>`; } };
  edge(x + band, y, w - 2 * band, true); edge(x + band, y + h - band, w - 2 * band, true); edge(x, y + band, h - 2 * band, false); edge(x + w - band, y + band, h - 2 * band, false);
  const stamp = `<rect x="${x + w - 330}" y="${y + 100}" width="200" height="240" fill="#FFFFFF" stroke="${PLUM}" stroke-width="6" stroke-dasharray="14 8"/>${knockFox('st', x + w - 230, y + 205, 120, PINK)}
    <text x="${x + w - 230}" y="${y + 315}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="34" letter-spacing="4" fill="${PLUM}">LDC</text>`;
  const pmx = x + w - 470, pmy = y + 230, r = 120;
  const postmark = `<g opacity="0.85"><circle cx="${pmx}" cy="${pmy}" r="${r}" fill="none" stroke="${PLUM}" stroke-width="8"/><circle cx="${pmx}" cy="${pmy}" r="${r - 42}" fill="none" stroke="${PLUM}" stroke-width="4"/>
    <defs><path id="pmt" d="M ${pmx - r + 30} ${pmy} A ${r - 30} ${r - 30} 0 0 1 ${pmx + r - 30} ${pmy}"/><path id="pmb" d="M ${pmx - r + 14} ${pmy} A ${r - 14} ${r - 14} 0 0 0 ${pmx + r - 14} ${pmy}"/></defs>
    <text font-family="Nunito" font-weight="900" font-size="19" letter-spacing="2" fill="${PLUM}" text-anchor="middle"><textPath href="#pmt" startOffset="50%">LONG DISTANCE CLUB</textPath></text>
    <text font-family="Nunito" font-weight="900" font-size="19" letter-spacing="2" fill="${PLUM}" text-anchor="middle"><textPath href="#pmb" startOffset="50%">POSTE RESTANTE</textPath></text>
    <text x="${pmx}" y="${pmy + 12}" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="40" fill="${PLUM}">Far Fox</text>
    ${[0, 1, 2, 3].map((i) => `<path d="M ${pmx - r - 260} ${pmy - 60 + i * 40} q 40 -22 80 0 t 80 0 t 80 0" fill="none" stroke="${PLUM}" stroke-width="7"/>`).join('')}</g>`;
  const seal = `<circle cx="${x + w / 2}" cy="${y + 390}" r="90" fill="${PINK}"/>${heart(x + w / 2, y + 392, 90, '#FFF5F0')}`;
  const lines = `<text x="${x + 160}" y="${y + 560}" font-family="IM FELL French Canon" font-style="italic" font-size="68" fill="${PLUM}">To: the one far away</text>
    <text x="${x + 160}" y="${y + 700}" font-family="IM FELL French Canon" font-style="italic" font-size="68" fill="${PLUM}">From: the one who misses you</text>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#FFF5F0"/>${chevrons}
    <path d="M ${x + band} ${y + band} L ${x + w / 2} ${y + 390} L ${x + w - band} ${y + band}" fill="none" stroke="${PLUM}" stroke-opacity="0.25" stroke-width="6"/>
    ${postmark}${stamp}${seal}${lines}
    <text x="900" y="${y + h + 260}" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="138" letter-spacing="2" fill="${k.main}">WORTH EVERY MILE</text>`;
}
for (const tone of ['light', 'dark']) {
  const k = INK[tone];
  designs[`hoodie-front-${tone}`] = [{ w: 1800, h: 1800 }, `<image href="${FOXY_LETTER}" x="1150" y="170" width="440" height="440"/>`];
  designs[`hoodie-back-${tone}`] = [TEE, envelope(k)];
}

// 5) Crewneck embroidery: collegiate LONG DISTANCE CLUB crest (centre chest 4×4in @300), cuff heart, inside label.
// Printful's API refuses large embroidery placements, so the lockup is drawn at 3000×1800 and scaled onto the chest.
const THREAD = { purple: '#6B5294', flamingo: '#CC3366', white: '#FFFFFF', navy: '#333366' };
const CREW = { oatmeal: ['purple', 'flamingo'], navy: ['white', 'flamingo'], grey: ['navy', 'flamingo'], purple: ['white', 'flamingo'] };
for (const [name, [main, accent]] of Object.entries(CREW)) {
  designs[`crew-chest-${name}`] = [{ w: 1200, h: 1200 }, `<g transform="translate(0 240) scale(0.4)">${arcText('a', 'LONG DISTANCE', 1500, 1290, 930, 260, THREAD[main], 10)}
    ${knockFox('f', 1500, 1120, 380, THREAD[accent])}
    <text x="1500" y="1690" text-anchor="middle" font-family="Graduate" font-size="330" letter-spacing="40" fill="${THREAD[main]}">CLUB</text></g>`];
  designs[`crew-wrist-${name}`] = [{ w: 600, h: 900 }, heart(300, 450, 300, THREAD[accent])];
}
designs['crew-label'] = [{ w: 450, h: 450 }, `<text x="225" y="200" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="62" fill="#2D1B4E">Worth every</text>
  <text x="225" y="270" text-anchor="middle" font-family="IM FELL French Canon" font-style="italic" font-size="62" fill="#2D1B4E">mile.</text>
  <text x="225" y="350" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="40" letter-spacing="8" fill="#FF6B8A">FAR FOX</text>`];

for (const [name, [{ w, h }, body]] of Object.entries(designs)) {
  let buf = png(w, h, body);
  // Embroidery files must hold only exact thread colours: snap anti-aliased edges to full alpha.
  if (name.startsWith('crew-chest') || name.startsWith('crew-wrist')) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) data[i + 3] = data[i + 3] < 128 ? 0 : 255;
    buf = await sharp(data, { raw: info }).png().toBuffer();
  }
  await writeFile(`${OUT}${name}.png`, buf);
}
console.log(Object.keys(designs).length, 'files:', Object.keys(designs).join(' '));
