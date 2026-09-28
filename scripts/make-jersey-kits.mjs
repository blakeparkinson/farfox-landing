/**
 * Vector generator for the Long Distance FC soccer kit print files.
 *
 * Writes 6000×6000 Printful all-over-print files for each rebuilt kit into
 * public/shop/designs/kits-2026-09/:
 *   sj-<kit>-front.png    front panel
 *   sj-<kit>-pattern.png  back base the personalized-back route draws on
 *   sj-<kit>-sleeve.png   both sleeves (cuff band baked in)
 *   sj-<kit>-back.png     default back (143 / FAR FOX FC), for the sync product
 * and a flat-silhouette preview sheet to the path given by --preview.
 *
 * Usage: node scripts/make-jersey-kits.mjs [--kit chart] [--preview out.jpg]
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
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const D = 6000;
const OUT = new URL('../public/shop/designs/kits-2026-09/', import.meta.url);
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

// Oswald 700, the same face the personalized backs use for names and numbers.
// resvg-js 2.6 ignores `fontBuffers`, so the font goes through a temp file.
let fontFiles = [];
async function loadOswald() {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)[1];
  const file = join(tmpdir(), 'farfox-oswald-700.ttf');
  await writeFile(file, Buffer.from(await fetch(url).then((r) => r.arrayBuffer())));
  fontFiles = [file];
}

function render(markup, size = D) {
  return Buffer.from(new Resvg(markup, {
    fitTo: { mode: 'width', value: size },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Oswald' },
  }).render().asPng());
}

/** The Far Fox crest, redrawn as vector from fox-crest(-navy).png. */
function crest(cx, cy, w, variant) {
  const c = variant === 'navy'
    ? { body: '#14213A', feature: '#FFFFFF', muzzle: '#F8F0E2', nose: '#FFFFFF' }
    : { body: '#F3ECE0', feature: '#12162E', muzzle: '#FFFFFF', nose: '#12162E' };
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

/** Teardrop map pin with a white core, tip at (x, y). */
function pin(x, y, h, color, ring = '#FFFFFF') {
  const r = h * 0.36;
  const cy = y - h + r;
  return `<path d="M ${x} ${y} C ${x - r * 0.35} ${y - h * 0.35} ${x - r} ${cy + r * 0.55} ${x - r} ${cy} A ${r} ${r} 0 1 1 ${x + r} ${cy} C ${x + r} ${cy + r * 0.55} ${x + r * 0.35} ${y - h * 0.35} ${x} ${y} Z" fill="${color}" stroke="${ring}" stroke-width="${h * 0.05}"/>
    <circle cx="${x}" cy="${cy}" r="${r * 0.42}" fill="${ring}"/>`;
}

function heart(x, y, size, color, rot = 0) {
  const s = size / 100;
  return `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-50 -45)" d="M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z" fill="${color}"/>`;
}

// Smooth 2-D value noise with a few octaves, for the topographic contours.
function noiseField(seed) {
  const r = rng(seed);
  const N = 64;
  const grid = Array.from({ length: N * N }, () => r());
  const at = (i, j) => grid[((j % N) + N) % N * N + (((i % N) + N) % N)];
  const smooth = (t) => t * t * (3 - 2 * t);
  const value = (x, y) => {
    const i = Math.floor(x), j = Math.floor(y);
    const u = smooth(x - i), v = smooth(y - j);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * u;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * u;
    return a + (b - a) * v;
  };
  return (x, y) => value(x, y) * 0.62 + value(x * 2.1 + 17, y * 2.1 + 5) * 0.28 + value(x * 4.3 + 3, y * 4.3 + 11) * 0.1;
}

/** Marching-squares iso-lines of `field` over the canvas, as path data per level. */
function contours(field, levels, step = 30, freq = 1 / 1400) {
  const n = Math.ceil(D / step) + 1;
  const v = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) v[j * n + i] = field(i * step * freq, j * step * freq);
  return levels.map((lv) => {
    let d = '';
    const lerp = (a, b) => (lv - a) / (b - a);
    for (let j = 0; j < n - 1; j++) {
      for (let i = 0; i < n - 1; i++) {
        const a = v[j * n + i], b = v[j * n + i + 1], c = v[(j + 1) * n + i + 1], e = v[(j + 1) * n + i];
        const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (e > lv ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * step, y = j * step;
        const top = [x + lerp(a, b) * step, y];
        const right = [x + step, y + lerp(b, c) * step];
        const bottom = [x + lerp(e, c) * step, y + step];
        const left = [x, y + lerp(a, e) * step];
        const segs = {
          1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]],
          5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]],
          9: [[top, bottom]], 10: [[left, bottom], [top, right]], 11: [[top, right]], 12: [[left, right]],
          13: [[bottom, right]], 14: [[left, bottom]],
        }[idx];
        for (const [p, q] of segs) d += `M${p[0].toFixed(0)} ${p[1].toFixed(0)}L${q[0].toFixed(0)} ${q[1].toFixed(0)}`;
      }
    }
    return d;
  });
}

/** Poisson-disk-ish scatter: rejection sampling with a minimum spacing. */
function scatter(seed, count, minDist, keep = () => true) {
  const r = rng(seed);
  const pts = [];
  for (let tries = 0; pts.length < count && tries < count * 60; tries++) {
    const p = { x: r() * D, y: r() * D, r };
    if (!keep(p.x, p.y)) continue;
    if (pts.some((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < minDist ** 2)) continue;
    pts.push(p);
  }
  return pts;
}

// --- kits ------------------------------------------------------------------

/** Coordinates: a clean graticule with one great-circle route and a halfway heart. */
function chart() {
  const bg = `<rect width="${D}" height="${D}" fill="#E8E5D8"/>`;
  // Conic chart projection: parallels are arcs around a pole far above the
  // collar and meridians are rays from it, so it reads as a map, not graph paper.
  const pole = { x: D / 2, y: -9000 };
  let grid = '';
  for (let i = 0, r = 9120; r <= 15600; r += 480, i++) {
    const major = i % 3 === 0;
    grid += `<circle cx="${pole.x}" cy="${pole.y}" r="${r}" fill="none" stroke="${major ? '#BDB6A0' : '#D3CEBC'}" stroke-width="${major ? 12 : 6}"/>`;
  }
  for (let i = -10; i <= 10; i++) {
    const t = Math.atan2(i * 480, 3000 - pole.y), major = i % 3 === 0;
    const at = (r) => `${(pole.x + Math.sin(t) * r).toFixed(0)} ${(pole.y + Math.cos(t) * r).toFixed(0)}`;
    grid += `<path d="M ${at(9000)} L ${at(16000)}" stroke="${major ? '#BDB6A0' : '#D3CEBC'}" stroke-width="${major ? 12 : 6}"/>`;
  }
  const a = { x: 2250, y: 4550 }, b = { x: 3650, y: 3400 }, c = { x: 2700, y: 3000 };
  // Point on the quadratic at t = 0.5 is the route's halfway heart.
  const mid = { x: 0.25 * a.x + 0.5 * c.x + 0.25 * b.x, y: 0.25 * a.y + 0.5 * c.y + 0.25 * b.y };
  const halo = (p) => `<circle cx="${p.x}" cy="${p.y}" r="240" fill="#E2632E" opacity="0.16"/>`;
  const dot = (p) => `<circle cx="${p.x}" cy="${p.y}" r="135" fill="#E8E5D8" stroke="#182642" stroke-width="32"/><circle cx="${p.x}" cy="${p.y}" r="76" fill="#E2632E"/>`;
  const route = `${halo(a)}${halo(b)}
    <path d="M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}" stroke="#182642" stroke-width="52" stroke-dasharray="140 85" stroke-linecap="round" fill="none"/>
    ${dot(a)}${dot(b)}
    <text x="${a.x + 60}" y="${a.y + 400}" font-family="Oswald" font-weight="700" font-size="230" letter-spacing="40" fill="#182642">HERE</text>
    <text x="${b.x}" y="${b.y + 430}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="230" letter-spacing="40" fill="#182642">THERE</text>
    <circle cx="${mid.x}" cy="${mid.y}" r="175" fill="#E8E5D8"/>${heart(mid.x, mid.y + 10, 240, '#E2632E', -18)}`;
  return {
    front: svg(grid + route + crest(CREST.x, CREST.y, CREST.w, 'navy'), bg),
    pattern: svg(grid, bg),
    sleeve: svg(grid + cuff('#E2632E', '#182642'), bg),
  };
}

/** Drop Zone: a neon topographic game map with a shrinking-zone ring and two drop pins. */
function dropzone() {
  const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1B2A8F"/><stop offset="0.55" stop-color="#4A1FB2"/><stop offset="1" stop-color="#A21C8E"/>
    </linearGradient></defs><rect width="${D}" height="${D}" fill="url(#g)"/>`;
  const field = noiseField(7);
  const levels = Array.from({ length: 16 }, (_, i) => 0.22 + i * 0.037);
  const paths = contours(field, levels);
  const topo = paths.map((d, i) => (i % 4 === 0
    ? `<path d="${d}" stroke="#46E3FF" stroke-opacity="0.55" stroke-width="13" stroke-linecap="round" fill="none"/>`
    : `<path d="${d}" stroke="#46E3FF" stroke-opacity="0.24" stroke-width="7" stroke-linecap="round" fill="none"/>`)).join('');
  const ring = { x: 3000, y: 3750, r: 950 };
  let ticks = '';
  for (let k = 0; k < 24; k++) {
    const t = (k / 24) * Math.PI * 2, r0 = ring.r + 50, r1 = ring.r + (k % 6 === 0 ? 190 : 110);
    ticks += `<line x1="${ring.x + Math.cos(t) * r0}" y1="${ring.y + Math.sin(t) * r0}" x2="${ring.x + Math.cos(t) * r1}" y2="${ring.y + Math.sin(t) * r1}" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="18" stroke-linecap="round"/>`;
  }
  const you = { x: 2500, y: 4150 }, them = { x: 3450, y: 3500 };
  const zone = `<circle cx="${ring.x}" cy="${ring.y}" r="${ring.r}" fill="#0A102C" fill-opacity="0.18" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="22" stroke-dasharray="120 70"/>${ticks}
    <path d="M ${you.x} ${you.y - 60} Q 2850 3450 ${them.x} ${them.y - 60}" stroke="#FFFFFF" stroke-width="20" stroke-dasharray="10 55" stroke-linecap="round" fill="none"/>
    ${pin(you.x, you.y, 330, '#22D3EE')}${pin(them.x, them.y, 330, '#FF4FA3')}`;
  return {
    front: svg(topo + zone + crest(CREST.x, CREST.y, CREST.w, 'light'), bg),
    pattern: svg(topo, bg),
    sleeve: svg(topo + cuff('#46E3FF', '#0A102C'), bg),
  };
}

/** Dalmatian: real-scale spots, mostly ink with brand-navy strays and a few orange hearts. */
function dalmatian() {
  const bg = `<rect width="${D}" height="${D}" fill="#F7F3EA"/>`;
  const blob = (p, rMin, rMax) => {
    const r = p.r;
    const base = rMin + (rMax - rMin) * r() ** 1.6; // skew small, like a real coat
    const [p1, p2, p3] = [r() * 6.28, r() * 6.28, r() * 6.28];
    const [a1, a2, a3] = [0.12 + r() * 0.1, 0.06 + r() * 0.08, 0.03 + r() * 0.04];
    const stretch = 0.75 + r() * 0.5, rot = r() * Math.PI;
    let d = '';
    for (let k = 0; k <= 48; k++) {
      const t = (k / 48) * Math.PI * 2;
      const rr = base * (1 + a1 * Math.sin(2 * t + p1) + a2 * Math.sin(3 * t + p2) + a3 * Math.sin(5 * t + p3));
      const x = Math.cos(t) * rr * stretch, y = Math.sin(t) * rr;
      d += `${k ? 'L' : 'M'}${(p.x + x * Math.cos(rot) - y * Math.sin(rot)).toFixed(0)} ${(p.y + x * Math.sin(rot) + y * Math.cos(rot)).toFixed(0)}`;
    }
    return d + 'Z';
  };
  const spots = (seed, keep) => {
    const pts = scatter(seed, 420, 300, keep);
    let ink = '', navy = '', hearts = '';
    pts.forEach((p, i) => {
      if (i % 29 === 7) hearts += heart(p.x, p.y, 150 + p.r() * 60, '#E2632E', -25 + p.r() * 50);
      else if (i % 9 === 4) navy += blob(p, 50, 130);
      else ink += blob(p, 45, 150);
    });
    return `<path d="${ink}" fill="#1B1B22"/><path d="${navy}" fill="#1F3160"/>${hearts}`;
  };
  const clearOf = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1;
  // Front: keep the crest and the collar clean.
  const frontKeep = (x, y) => clearOf(CREST.x, CREST.y, 420, 420)(x, y) && clearOf(3000, 1350, 750, 420)(x, y);
  // Back: keep the nameplate/number/brand block and the collar crest readable.
  // Rows come from the soccer back layout in jerseyBack.mjs, padded by the
  // largest spot radius so no blob edge reaches the lettering.
  const rows = [[1400, 1400, 4600, 1900], [1700, 1900, 4300, 3900], [2000, 4250, 4000, 4800]];
  const pad = 220;
  const backKeep = (x, y) => clearOf(3000, 900, 450, 380)(x, y)
    && rows.every(([x0, y0, x1, y1]) => x < x0 - pad || x > x1 + pad || y < y0 - pad || y > y1 + pad);
  return {
    front: svg(spots(11, frontKeep) + crest(CREST.x, CREST.y, CREST.w, 'navy'), bg),
    pattern: svg(spots(23, backKeep), bg),
    sleeve: svg(spots(37, () => true) + cuff('#E2632E', '#14213A'), bg),
  };
}

const KITS = { chart, dropzone, dalmatian };

// --- default back, via the live personalized-back renderer ----------------

async function defaultBack(kit, patternPng) {
  const { renderJerseyBack } = await import('../src/lib/jerseyBack.mjs');
  const realFetch = globalThis.fetch;
  // Serve this kit's pattern and crest from disk instead of production.
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (u.includes('/shop/designs/')) {
      const name = u.split('/shop/designs/')[1];
      const buf = name.endsWith('-pattern.png') ? patternPng : readFileSync(new URL(`../public/shop/designs/${name}`, import.meta.url));
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

// --- main ----------------------------------------------------------------------

const args = process.argv.slice(2);
const only = args.includes('--kit') ? args[args.indexOf('--kit') + 1] : null;
const previewOut = args.includes('--preview') ? args[args.indexOf('--preview') + 1] : null;
await mkdir(OUT, { recursive: true });
await loadOswald();
const previews = [];
for (const [kit, build] of Object.entries(KITS)) {
  if (only && kit !== only) continue;
  const parts = build();
  const files = {};
  for (const part of ['front', 'pattern', 'sleeve']) files[part] = render(parts[part]);
  files.back = await defaultBack(kit, files.pattern);
  for (const [part, png] of Object.entries(files)) {
    const out = await sharp(png).png({ compressionLevel: 9, palette: false }).toBuffer();
    await writeFile(new URL(`sj-${kit}-${part}.png`, OUT), out);
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
