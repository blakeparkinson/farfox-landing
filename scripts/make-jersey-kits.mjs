/**
 * Vector generator for the Long Distance FC soccer kit print files.
 *
 * Writes 6000×6000 Printful all-over-print files for each kit into
 * public/shop/designs/kits-2026-10/ (the October 2026 drop, whose builders
 * live in kit-designs-2026-10.mjs) or kits-2026-09/ (everything else):
 *   sj-<kit>-front.png    front panel
 *   sj-<kit>-pattern.png  back base the personalized-back route draws on
 *   sj-<kit>-sleeve.png   both sleeves (cuff band baked in)
 *   sj-<kit>-back.png     default back (143 / FAR FOX FC), for the sync product
 * Baseball kits (rj-<kit>-front.png) only ship a front. A flat-silhouette
 * preview sheet goes to the path given by --preview.
 *
 * Usage: node scripts/make-jersey-kits.mjs [--kit twilight,morse] [--preview out.jpg]
 *
 * Layout facts measured from Printful mockups of the previous files (file px):
 *   front visible ≈ x 1850–4230, y 1330–5900; wearer's-left crest ≈ (3550, 2400)
 *   back visible  ≈ x 1660–4250, y 1020–5800; number block y 1980–3800
 *   sleeve cuff: accent stripe y 3980–4020, band from y 4040 down
 * Keep anything that must read (pins, routes, rings) inside x 2000–4050 so it
 * never wraps into the armhole the way the old "THERE" label did.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { KITS as OCT_KITS } from './kit-designs-2026-10.mjs';

const D = 6000;
// October 2026 kits write to kits-2026-10/; everything else stays in kits-2026-09/.
const OUT_SEPT = new URL('../public/shop/designs/kits-2026-09/', import.meta.url);
const OUT_OCT = new URL('../public/shop/designs/kits-2026-10/', import.meta.url);
// Moose Lodge launches in Blush only, as `moose-blush`; the module's other
// colorways stay unbuilt, so its generic `moose` entry is left out.
const { moose: mooseKit, ...OCT_REST } = OCT_KITS;
const OCT_BUILD = { ...OCT_REST, 'moose-blush': () => mooseKit({ colorway: 'blush', style: 'foxy-antlers' }) };
const outFor = (kit) => (kit in OCT_BUILD ? OUT_OCT : OUT_SEPT);
const CREST = { x: 3550, y: 2400, w: 440 };

// --- helpers -------------------------------------------------------------

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const svg = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}">${bg}${body}</svg>`;

// Oswald 700, the same face the personalized backs use for names and numbers, plus Lilita One for
// Drop Zone's game-map lettering. resvg-js 2.6 ignores `fontBuffers`, so fonts go through temp files.
let fontFiles = [];
async function loadFonts() {
  for (const [family, query] of [['oswald', 'Oswald:wght@700'], ['lilita', 'Lilita+One']]) {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}&display=swap`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
    const url = css.match(/url\((https:[^)]+\.ttf)\)/)[1];
    const file = join(tmpdir(), `farfox-${family}.ttf`);
    await writeFile(file, Buffer.from(await fetch(url).then((r) => r.arrayBuffer())));
    fontFiles.push(file);
  }
}

function render(markup, size = D) {
  return Buffer.from(new Resvg(markup, {
    fitTo: { mode: 'width', value: size },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Oswald' },
  }).render().asPng());
}

/** The Far Fox crest, redrawn as vector from fox-crest(-navy).png. */
function crest(cx, cy, w, variant) {
  const c = {
    navy: { body: '#14213A', feature: '#FFFFFF', muzzle: '#F8F0E2', nose: '#FFFFFF' },
    light: { body: '#F3ECE0', feature: '#12162E', muzzle: '#FFFFFF', nose: '#12162E' },
    gold: { body: '#F4B600', feature: '#2A0E4A', muzzle: '#FFF3C4', nose: '#2A0E4A' },
    green: { body: '#1E8A4C', feature: '#FFFFFF', muzzle: '#F8F0E2', nose: '#FFFFFF' },
  }[variant];
  const s = w / 300;
  return `<g transform="translate(${cx - w / 2} ${cy - (306 * s) / 2}) scale(${s})">
    <polygon points="25,0 100,88 200,88 275,0 300,190 150,306 0,190" fill="${c.body}"/>
    <polygon points="35,30 30,95 85,85" fill="${c.feature}"/>
    <polygon points="265,30 270,95 215,85" fill="${c.feature}"/>
    <polygon points="72,140 125,152 120,175 70,162" fill="${c.feature}"/>
    <polygon points="228,140 175,152 180,175 230,162" fill="${c.feature}"/>
    <polygon points="88,196 212,196 150,306" fill="${c.muzzle}"/>
    <polygon points="137,226 163,226 150,248" fill="${c.nose}"/>
  </g>`;
}

/** Sleeve cuff: thin accent stripe, then the band colour to the hem allowance. */
const cuff = (accent, band) =>
  `<rect x="0" y="3980" width="${D}" height="40" fill="${accent}"/><rect x="0" y="4040" width="${D}" height="${D - 4040}" fill="${band}"/>`;

function heart(x, y, size, color, rot = 0) {
  const s = size / 100;
  return `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-50 -45)" d="M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z" fill="${color}"/>`;
}

// --- kits ------------------------------------------------------------------

/** Points along a quadratic Bézier, spaced `gap` apart by arc length. */
function alongQuad(a, c, b, gap) {
  const at = (t) => ({
    x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t ** 2 * b.x,
    y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t ** 2 * b.y,
  });
  const pts = [at(0)];
  let prev = pts[0], run = 0;
  for (let k = 1; k <= 2000; k++) {
    const p = at(k / 2000);
    run += Math.hypot(p.x - prev.x, p.y - prev.y);
    if (run >= gap) { pts.push(p); run = 0; }
    prev = p;
  }
  return pts;
}

/** Flight Path: airmail kit. One hero route with a plane, faint routes, airmail stripes. */
function flight() {
  const bg = `<rect width="${D}" height="${D}" fill="#F5F1E7"/>`;
  const RED = '#C8323C', NAVY = '#1F3A6E', INK = '#1C1A2E';
  const r = rng(5);
  let routes = '';
  for (let k = 0; k < 9; k++) {
    const a = { x: r() * D, y: 600 + r() * 4800 }, b = { x: r() * D, y: 600 + r() * 4800 };
    const lift = 500 + r() * 900;
    const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - lift };
    const col = k % 2 ? RED : NAVY;
    routes += `<path d="M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}" stroke="${col}" stroke-opacity="0.28" stroke-width="12" stroke-dasharray="46 34" stroke-linecap="round" fill="none"/>
      <circle cx="${a.x}" cy="${a.y}" r="30" fill="${col}" fill-opacity="0.35"/><circle cx="${b.x}" cy="${b.y}" r="30" fill="${col}" fill-opacity="0.35"/>`;
  }
  // Airmail envelope border: alternating red and navy slanted bars between two rules.
  const airmail = (y0, h) => {
    let bars = `<rect x="0" y="${y0}" width="${D}" height="${h}" fill="#F5F1E7"/>`;
    for (let x = -h; x < D + h; x += 360) {
      for (const [dx, col] of [[0, RED], [180, NAVY]]) {
        const x0 = x + dx;
        bars += `<polygon points="${x0},${y0} ${x0 + 100},${y0} ${x0 + 100 - h},${y0 + h} ${x0 - h},${y0 + h}" fill="${col}"/>`;
      }
    }
    return `${bars}<rect x="0" y="${y0 - 14}" width="${D}" height="14" fill="${NAVY}"/><rect x="0" y="${y0 + h}" width="${D}" height="14" fill="${NAVY}"/>`;
  };
  const a = { x: 2150, y: 4350 }, b = { x: 3900, y: 4050 }, c = { x: 2950, y: 2950 };
  const t = 0.5;
  const mid = { x: 0.25 * a.x + 0.5 * c.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * c.y + 0.25 * b.y };
  const tan = { x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x), y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y) };
  const angle = (Math.atan2(tan.y, tan.x) * 180) / Math.PI + 90; // plane art points up
  const plane = `<g transform="translate(${mid.x} ${mid.y}) rotate(${angle}) scale(4.2) translate(-50 -50)">
      <path d="M50 0 C54 0 56 6 56 14 L56 38 L96 60 L96 70 L56 58 L56 82 L68 92 L68 98 L50 93 L32 98 L32 92 L44 82 L44 58 L4 70 L4 60 L44 38 L44 14 C44 6 46 0 50 0 Z" fill="${INK}"/></g>`;
  const end = (p) => `<circle cx="${p.x}" cy="${p.y}" r="120" fill="#F5F1E7" stroke="${INK}" stroke-width="30"/><circle cx="${p.x}" cy="${p.y}" r="58" fill="${RED}"/>`;
  const hero = `<path d="M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}" stroke="${INK}" stroke-width="46" stroke-dasharray="130 80" stroke-linecap="round" fill="none"/>
    <circle cx="${mid.x}" cy="${mid.y}" r="300" fill="#F5F1E7"/>${plane}${end(a)}${end(b)}`;
  return {
    front: svg(routes + hero + airmail(5380, 300) + crest(CREST.x, CREST.y, CREST.w, 'navy'), bg),
    pattern: svg(routes + airmail(5380, 300), bg),
    sleeve: svg(routes + airmail(3640, 260) + cuff(RED, NAVY), bg),
  };
}

/** A leaning palm silhouette: tapered trunk plus drooping crescent fronds. */
function palm(base, crown, color) {
  const lean = { x: (base.x + crown.x) / 2 + (crown.x > base.x ? -140 : 140), y: (base.y + crown.y) / 2 };
  let out = `<path d="M ${base.x - 55} ${base.y} Q ${lean.x - 30} ${lean.y} ${crown.x - 20} ${crown.y} L ${crown.x + 20} ${crown.y} Q ${lean.x + 30} ${lean.y} ${base.x + 55} ${base.y} Z" fill="${color}"/>`;
  const fronds = [-172, -140, -112, -84, -58, -30, -6, 150, 30];
  for (const deg of fronds) {
    const th = (deg * Math.PI) / 180, L = 430;
    const tip = { x: crown.x + Math.cos(th) * L, y: crown.y + Math.sin(th) * L * 0.7 + 190 };
    const ctl = { x: crown.x + Math.cos(th) * L * 0.55, y: crown.y + Math.sin(th) * L * 0.55 - 40 };
    const n = { x: -Math.sin(th) * 62, y: Math.cos(th) * 62 };
    out += `<path d="M ${crown.x} ${crown.y} Q ${ctl.x + n.x} ${ctl.y + n.y} ${tip.x} ${tip.y} Q ${ctl.x - n.x} ${ctl.y - n.y} ${crown.x} ${crown.y} Z" fill="${color}"/>`;
  }
  return out + `<circle cx="${crown.x}" cy="${crown.y}" r="48" fill="${color}"/>`;
}

/** Paradise: two islands, one sunset. A retro striped sun, two palms leaning in, sea glow. */
function paradise() {
  const H = 3750; // horizon
  const INK = '#2A1B3D';
  const sky = `<defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1FB5A6"/><stop offset="0.45" stop-color="#7FD3B8"/><stop offset="${H / D}" stop-color="#FFB38A"/><stop offset="${H / D}" stop-color="#FF7A7F"/><stop offset="1" stop-color="#6E3E8C"/></linearGradient>
      <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE9A0"/><stop offset="1" stop-color="#FF6B8A"/></linearGradient>
    </defs><rect width="${D}" height="${D}" fill="url(#sky)"/>`;
  const sun = (cx, r) => {
    // Retro sun: horizontal gaps that thicken toward the horizon.
    let gaps = '';
    for (let k = 0, y = H - r * 0.55; y < H; k++) {
      const h = 34 + k * 26;
      gaps += `<rect x="${cx - r}" y="${y}" width="${2 * r}" height="${h}" fill="#FFB38A"/>`;
      y += h + 120 - k * 10;
    }
    return `<clipPath id="above"><rect width="${D}" height="${H}"/></clipPath>
      <g clip-path="url(#above)"><circle cx="${cx}" cy="${H}" r="${r}" fill="url(#sun)"/>${gaps}</g>`;
  };
  let glow = '';
  for (let k = 0; k < 12; k++) {
    const y = H + 90 + k * 150, w = 1500 - k * 95;
    glow += `<rect x="${3000 - w / 2}" y="${y}" width="${w}" height="${40 + k * 4}" rx="30" fill="#FFE9A0" fill-opacity="${0.55 - k * 0.035}"/>`;
  }
  const island = (x) => `<ellipse cx="${x}" cy="${H + 10}" rx="360" ry="120" fill="${INK}"/>`;
  const scene = sun(3000, 1050) + glow + island(2250) + island(3800)
    + palm({ x: 2250, y: H - 60 }, { x: 2600, y: 3050 }, INK)
    + palm({ x: 3800, y: H - 60 }, { x: 3450, y: 3080 }, INK)
    + heart(3025, 2860, 190, '#FF4F7B', 0);
  // After sunset on the back: deeper teal into purple so white lettering reads.
  const dusk = `<defs><linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#138078"/><stop offset="0.55" stop-color="#2E5E86"/><stop offset="1" stop-color="#5A2F7A"/></linearGradient></defs>
    <rect width="${D}" height="${D}" fill="url(#dusk)"/>`;
  let backGlow = '';
  for (let k = 0; k < 5; k++) backGlow += `<rect x="${3000 - (900 - k * 120) / 2}" y="${5050 + k * 150}" width="${900 - k * 120}" height="${40 + k * 4}" rx="30" fill="#FFB38A" fill-opacity="${0.5 - k * 0.07}"/>`;
  return {
    // Navy crest: the cream one vanished into the mint sky.
    front: svg(scene + crest(CREST.x, CREST.y, CREST.w, 'navy'), sky),
    // The back keeps the sky and sea only, so the name and number stay clean.
    pattern: svg(backGlow, dusk),
    sleeve: svg(cuff('#FF6B8A', '#1A564E'), sky),
  };
}

// --- baseball kits (Printful catalog 792) ------------------------------------
//
// The button placket hides the front file between x ≈ 2740 and 3280 (measured
// by rendering a known grid through Printful's mockup generator), and the
// right chest panel is visible to about x 4680. The patch sits wholly on that
// panel, so nothing is lost under the buttons.
const PLACKET = { left: 2740, right: 3280 };
const PATCH = { x: 3990, y: 2380, r: 640 };

// The heart-eyes Foxy face, cropped from the 2700 px brand artwork.
let foxFace = '';
async function loadFoxFace() {
  const png = await sharp(fileURLToPath(new URL('../public/shop/designs/hearteyes-v2.png', import.meta.url)))
    .extract({ left: 650, top: 0, width: 1400, height: 1480 }).png().toBuffer();
  foxFace = png.toString('base64');
}

function star(x, y, r, fill) {
  const pts = Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r;
    return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`;
  });
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

/** Team patch: coloured ring with arched LONG DISTANCE / CLUB, stitching, Foxy in the middle. */
function teamPatch({ ring, rim, text, disc }) {
  const { x, y, r } = PATCH;
  const inner = 440, top = 478, bottom = 598; // text baselines inside the ring band
  const faceW = inner * 1.5;
  const stitch = (rad) => `<circle cx="${x}" cy="${y}" r="${rad}" fill="none" stroke="${text}" stroke-opacity="0.75" stroke-width="7" stroke-dasharray="20 14"/>`;
  const label = (id, value) => `<text font-family="Oswald" font-weight="700" font-size="128" letter-spacing="22" fill="${text}"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${value}</textPath></text>`;
  return `<defs>
      <path id="arcTop" d="M ${x - top} ${y} A ${top} ${top} 0 0 1 ${x + top} ${y}"/>
      <path id="arcBottom" d="M ${x - bottom} ${y} A ${bottom} ${bottom} 0 0 0 ${x + bottom} ${y}"/>
      <clipPath id="disc"><circle cx="${x}" cy="${y}" r="${inner}"/></clipPath>
    </defs>
    <circle cx="${x}" cy="${y}" r="${r}" fill="${rim}"/>
    <circle cx="${x}" cy="${y}" r="${r - 34}" fill="${ring}"/>
    ${stitch(r - 56)}${stitch(inner + 22)}
    <circle cx="${x}" cy="${y}" r="${inner}" fill="${disc}"/>
    <image href="data:image/png;base64,${foxFace}" x="${x - faceW / 2}" y="${y - faceW * 0.53}" width="${faceW}" height="${faceW * (1480 / 1400)}" clip-path="url(#disc)"/>
    ${label('arcTop', 'LONG DISTANCE')}${label('arcBottom', 'CLUB')}
    ${star(x - 540, y, 42, text)}${star(x + 540, y, 42, text)}`;
}

function pinstripes(bg, stripe) {
  let lines = '';
  for (let sx = 224.5; sx < D; sx += 216) lines += `<rect x="${sx - 3}" y="0" width="6" height="${D}" fill="${stripe}"/>`;
  return `<rect width="${D}" height="${D}" fill="${bg}"/>${lines}`;
}

const bbHome = () => ({ front: svg(teamPatch({ ring: '#1C4096', rim: '#C0202E', text: '#F4ECE0', disc: '#FCFAF6' }), pinstripes('#FCFAF6', '#072E86')) });
const bbRoyal = () => ({ front: svg(teamPatch({ ring: '#C0202E', rim: '#F4ECE0', text: '#F4ECE0', disc: '#FCFAF6' }), pinstripes('#143A8C', '#FFFFFF')) });
const bbRed = () => ({ front: svg(teamPatch({ ring: '#1B2A6B', rim: '#F4ECE0', text: '#F4ECE0', disc: '#FCFAF6' }), `<rect width="${D}" height="${D}" fill="#BC2832"/>`) });

// Coordinates (chart), Orange and Mardi Gras are retired; their kits-2026-09
// files stay so jerseyBack.mjs can still render backs for existing orders.
const KITS = { flight, paradise, 'bb-home': bbHome, 'bb-royal': bbRoyal, 'bb-red': bbRed, ...OCT_BUILD };

// --- default back, via the live personalized-back renderer ----------------

async function defaultBack(kit, patternPng, crestPng) {
  const { renderJerseyBack } = await import('../src/lib/jerseyBack.mjs');
  const realFetch = globalThis.fetch;
  // Serve this kit's pattern and crest from disk instead of production.
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/shop/designs/')) {
      const name = u.split('/shop/designs/')[1];
      const buf = name.endsWith('-pattern.png') ? patternPng
        : crestPng ? crestPng // kit ships its own back crest
          : readFileSync(new URL(`../public/shop/designs/${name}`, import.meta.url));
      return new Response(buf);
    }
    return realFetch(url, init);
  };
  try {
    return await renderJerseyBack({ kit, name: '', number: '', size: D });
  } finally {
    globalThis.fetch = realFetch;
  }
}

// --- flat preview ------------------------------------------------------------

// Silhouettes traced from the Printful mockup at 512 px; file → canvas mapping
// was measured on the same mockups (see header).
const FRONT_MAP = { sx: 0.093, sy: 0.093, ox: -23, oy: -79 };
const BACK_MAP = { sx: 0.08, sy: 0.094, ox: 18, oy: -76 };
const BODY_FRONT = 'M205 32 L160 50 L152 225 L140 468 Q256 480 372 468 L360 225 L352 50 L307 32 L256 82 Z';
const BODY_BACK = 'M205 32 L160 50 L152 225 L140 468 Q256 480 372 468 L360 225 L352 50 L307 32 Q256 46 205 32 Z';
const SLEEVE_L = 'M160 50 L118 110 L75 205 L150 232 L157 150 Z';
const SLEEVE_R = 'M352 50 L394 110 L437 205 L362 232 L355 150 Z';

async function preview(kit, files) {
  const b64 = async (png, w) => (await sharp(png).resize(w).png().toBuffer()).toString('base64');
  const front = await b64(files.front, 560), back = await b64(files.back, 560), sleeve = await b64(files.sleeve, 300);
  const body = (path, img, m) => `<clipPath id="c${m.oy}"><path d="${path}"/></clipPath>
    <image href="data:image/png;base64,${img}" x="${m.ox}" y="${m.oy}" width="${D * m.sx}" height="${D * m.sy}" preserveAspectRatio="none" clip-path="url(#c${m.oy})"/>`;
  // Sleeve file is tilted so its cuff band lands on the cuff edge.
  const sleeves = (id) => [[SLEEVE_L, 112, 219, 20], [SLEEVE_R, 400, 219, -20]].map(([p, cx, cy, rot], i) => `
    <clipPath id="s${id}${i}"><path d="${p}"/></clipPath>
    <g clip-path="url(#s${id}${i})"><image href="data:image/png;base64,${sleeve}" x="${cx - 150}" y="${cy - 218}" width="300" height="300" transform="rotate(${rot} ${cx} ${cy})"/></g>`).join('');
  const shade = (path) => `<path d="${path}" fill="url(#sh)"/><path d="${path}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="1.5"/>`;
  const panel = (path, img, m, id, collar) => `<svg x="${id === 'f' ? 0 : 512}" y="0" width="512" height="512" viewBox="0 0 512 512">
    <defs><linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity="0.14"/><stop offset="0.25" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.14"/></linearGradient></defs>
    ${sleeves(id)}${body(path, img, m)}${shade(SLEEVE_L)}${shade(SLEEVE_R)}${shade(path)}${collar}</svg>`;
  const vneck = '<path d="M205 32 L256 82 L307 32" fill="none" stroke="#14213A" stroke-width="7" stroke-linejoin="round"/>';
  const crew = '<path d="M205 32 Q256 46 307 32" fill="none" stroke="#14213A" stroke-width="7"/>';
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="540" viewBox="0 0 1024 540">
    <rect width="1024" height="540" fill="#FFFFFF"/>
    ${panel(BODY_FRONT, front, FRONT_MAP, 'f', vneck)}${panel(BODY_BACK, back, BACK_MAP, 'b', crew)}
    <text x="512" y="528" text-anchor="middle" font-family="Arial" font-size="16" fill="#555">${kit}: front / back (flat approximation, not a Printful mockup)</text></svg>`;
  return new Resvg(markup, { fitTo: { mode: 'width', value: 1024 } }).render().asPng();
}

/** Baseball preview: the two visible front panels butted together at the buttons. */
async function placketPreview(kit, front) {
  const panel = (left, width) => sharp(front).extract({ left, top: 1000, width, height: 4600 }).toBuffer();
  const [l, r] = await Promise.all([panel(1340, PLACKET.left - 1340), panel(PLACKET.right, 4680 - PLACKET.right)]);
  const full = await sharp({ create: { width: 2800, height: 4600, channels: 4, background: '#fff' } })
    .composite([{ input: l, left: 0, top: 0 }, { input: r, left: PLACKET.left - 1340, top: 0 }])
    .png().toBuffer();
  const img = await sharp(full).resize({ height: 500 }).toBuffer();
  const w = (await sharp(img).metadata()).width;
  return sharp({ create: { width: 1024, height: 540, channels: 3, background: '#fff' } })
    .composite([{ input: img, left: Math.round((1024 - w) / 2), top: 10 },
      { input: Buffer.from(`<svg width="1024" height="30"><text x="512" y="20" text-anchor="middle" font-family="Arial" font-size="16" fill="#555">${kit}: visible front panels joined at the buttons (approximation)</text></svg>`), left: 0, top: 510 }])
    .png().toBuffer();
}

// --- main ----------------------------------------------------------------------

const args = process.argv.slice(2);
const only = args.includes('--kit') ? args[args.indexOf('--kit') + 1].split(',') : null;
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
await mkdir(OUT_SEPT, { recursive: true });
await mkdir(OUT_OCT, { recursive: true });
await loadFonts();
await loadFoxFace();
const previews = [];
for (const [kit, build] of Object.entries(KITS)) {
  if (only && !only.includes(kit)) continue;
  const parts = build();
  const files = {};
  for (const part of ['front', 'pattern', 'sleeve']) if (parts[part]) files[part] = render(parts[part]);
  if (!parts.pattern) {
    // Baseball kits keep their existing back and sleeves; only the front is new.
    await writeFile(new URL(`rj-${kit}-front.png`, outFor(kit)), await sharp(files.front).png({ compressionLevel: 9 }).toBuffer());
    console.log(`[kits] ${kit}: front written`);
    if (previewOut) previews.push(await placketPreview(kit, files.front));
    continue;
  }
  let crestPng = null;
  if (parts.backCrest) {
    crestPng = Buffer.from(new Resvg(parts.backCrest).render().asPng());
    await writeFile(new URL(`fox-crest-${kit}.png`, outFor(kit)), crestPng);
  }
  files.back = await defaultBack(kit, files.pattern, crestPng);
  for (const [part, png] of Object.entries(files)) {
    const out = await sharp(png).png({ compressionLevel: 9, palette: false }).toBuffer();
    await writeFile(new URL(`sj-${kit}-${part}.png`, outFor(kit)), out);
  }
  console.log(`[kits] ${kit}: front, pattern, sleeve, back written`);
  if (previewOut) previews.push(await preview(kit, files));
}
if (previewOut && previews.length) {
  const tiles = previews.map((input, i) => ({ input, left: 0, top: i * 540 }));
  await sharp({ create: { width: 1024, height: 540 * previews.length, channels: 3, background: '#fff' } })
    .composite(tiles).jpeg({ quality: 70 }).toFile(previewOut);
  console.log(`[kits] preview → ${previewOut}`);
}
