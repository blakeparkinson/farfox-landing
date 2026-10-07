/**
 * Long Distance FC — kit designs, October 2026 drop.
 *
 * Pure SVG builders in the same 6000×6000 Printful all-over-print space as
 * scripts/make-jersey-kits.mjs. No Node or DOM dependencies, so the same file
 * runs in the kit generator (node) and in the browser preview.
 *
 * Reworked: dropzone, dalmatian, twilight (now vector)
 * Unchanged: paradise stays on the Sept 2026 build (kits-2026-09)
 * New:      otherhalfa, otherhalfb, morse, flyway (replaces Mardi Gras)
 * Retired:  chart (Coordinates), orange, mardigras
 *
 * Layout facts (from make-jersey-kits.mjs):
 *   front visible ≈ x 1850–4230, y 1330–5900; crest (3550, 2400) w 440
 *   back number block y 1980–3800, brand line y 4360–4720, crest (3000, 900)
 *   sleeve cuff: accent stripe y 3980–4020, band from y 4040
 */
import { foxyImage, foxyTag } from './foxy-art.mjs';
export const D = 6000;
export const CREST = { x: 3550, y: 2400, w: 440 };

const PINK = '#FF6B8A', PLUM = '#2D1B4E', BLUSH = '#FFF5F0', PURPLE = '#B76CFD';

// --- helpers (ported from make-jersey-kits.mjs) -----------------------------

export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const svg = (body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}">${bg}${body}</svg>`;

export function crest(cx, cy, w, variant) {
  const c = {
    navy: { body: '#14213A', feature: '#FFFFFF', muzzle: '#F8F0E2', nose: '#FFFFFF' },
    light: { body: '#F3ECE0', feature: '#12162E', muzzle: '#FFFFFF', nose: '#12162E' },
    plum: { body: PLUM, feature: '#FFFFFF', muzzle: BLUSH, nose: '#FFFFFF' },
    gold: { body: '#F4B600', feature: '#2A0E4A', muzzle: '#FFF3C4', nose: '#2A0E4A' },
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
const cuff = (accent, band) =>
  `<rect x="0" y="3980" width="${D}" height="40" fill="${accent}"/><rect x="0" y="4040" width="${D}" height="${D - 4040}" fill="${band}"/>`;

function pin(x, y, h, color, ring = '#FFFFFF') {
  const r = h * 0.36, cy = y - h + r;
  return `<path d="M ${x} ${y} C ${x - r * 0.35} ${y - h * 0.35} ${x - r} ${cy + r * 0.55} ${x - r} ${cy} A ${r} ${r} 0 1 1 ${x + r} ${cy} C ${x + r} ${cy + r * 0.55} ${x + r * 0.35} ${y - h * 0.35} ${x} ${y} Z" fill="${color}" stroke="${ring}" stroke-width="${h * 0.05}"/>
    <circle cx="${x}" cy="${cy}" r="${r * 0.42}" fill="${ring}"/>`;
}
const HEART_D = 'M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z';
function heart(x, y, size, color, rot = 0) {
  return `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${size / 100}) translate(-50 -45)" d="${HEART_D}" fill="${color}"/>`;
}
function noiseField(seed) {
  const r = rng(seed), N = 64;
  const grid = Array.from({ length: N * N }, () => r());
  const at = (i, j) => grid[((j % N) + N) % N * N + (((i % N) + N) % N)];
  const smooth = (t) => t * t * (3 - 2 * t);
  const value = (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), u = smooth(x - i), v = smooth(y - j);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * u;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * u;
    return a + (b - a) * v;
  };
  return (x, y) => value(x, y) * 0.62 + value(x * 2.1 + 17, y * 2.1 + 5) * 0.28 + value(x * 4.3 + 3, y * 4.3 + 11) * 0.1;
}
function contours(field, levels, step = 30, freq = 1 / 1400) {
  const n = Math.ceil(D / step) + 1, v = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) v[j * n + i] = field(i * step * freq, j * step * freq);
  return levels.map((lv) => {
    let d = '';
    const lerp = (a, b) => (lv - a) / (b - a);
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const a = v[j * n + i], b = v[j * n + i + 1], c = v[(j + 1) * n + i + 1], e = v[(j + 1) * n + i];
      const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (e > lv ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const x = i * step, y = j * step;
      const top = [x + lerp(a, b) * step, y], right = [x + step, y + lerp(b, c) * step];
      const bottom = [x + lerp(e, c) * step, y + step], left = [x, y + lerp(a, e) * step];
      const segs = { 1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]], 4: [[top, right]], 5: [[left, top], [bottom, right]], 6: [[top, bottom]], 7: [[left, top]], 8: [[left, top]], 9: [[top, bottom]], 10: [[left, bottom], [top, right]], 11: [[top, right]], 12: [[left, right]], 13: [[bottom, right]], 14: [[left, bottom]] }[idx];
      for (const [p, q] of segs) d += `M${p[0].toFixed(0)} ${p[1].toFixed(0)}L${q[0].toFixed(0)} ${q[1].toFixed(0)}`;
    }
    return d;
  });
}
function scatter(seed, count, minDist, keep = () => true) {
  const r = rng(seed), pts = [];
  for (let tries = 0; pts.length < count && tries < count * 60; tries++) {
    const p = { x: r() * D, y: r() * D, r };
    if (!keep(p.x, p.y)) continue;
    if (pts.some((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < minDist ** 2)) continue;
    pts.push(p);
  }
  return pts;
}
const clearOf = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1;
// Back lettering rows (jerseyBack.mjs soccer layout), used to keep patterns clean behind text.
const BACK_ROWS = [[1400, 1400, 4600, 1900], [1700, 1900, 4300, 3900], [2000, 4250, 4000, 4800]];
const backKeep = (pad) => (x, y) => clearOf(3000, 900, 450, 380)(x, y)
  && BACK_ROWS.every(([x0, y0, x1, y1]) => x < x0 - pad || x > x1 + pad || y < y0 - pad || y > y1 + pad);

// --- reworked kits ------------------------------------------------------------

/** Drop Zone v5, battle-royale codes on a real kit: a storm-purple body with tonal storm rings closing in
 *  from the shoulder, a loot-rarity sash (common to legendary) worn like a River Plate sash, and one dotted
 *  drop path that falls beside the crest and lands on it. Genre codes only: no game's names, logos or fonts. */
const DZ = { night: '#160C2C', storm: '#3B1680', ring: '#8B5CF6', edge: '#C4B5FD', cream: '#FFF5F0', pink: '#FF6B8A', eye: { x: 4700, y: 1500 } };
const RARITY = ['#9CA3AF', '#4ADE80', '#38BDF8', '#A855F7', '#FBBF24'];
const dzBase = () => `<defs><linearGradient id="dzg" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${DZ.storm}"/><stop offset="1" stop-color="${DZ.night}"/></linearGradient></defs><rect width="${D}" height="${D}" fill="url(#dzg)"/>`;
function stormRings(edgeR = 2600) {
  let s = '';
  for (let r = 700, i = 0; r < 7000; r += 280, i++) s += `<circle cx="${DZ.eye.x}" cy="${DZ.eye.y}" r="${r}" fill="none" stroke="${DZ.ring}" stroke-opacity="${i % 2 ? 0.07 : 0.13}" stroke-width="70"/>`;
  return s + `<circle cx="${DZ.eye.x}" cy="${DZ.eye.y}" r="${edgeR}" fill="none" stroke="${DZ.edge}" stroke-opacity="0.55" stroke-width="22"/>`;
}
/** Five stripes, common to legendary, each `w` wide, along a line through (x, y) at `deg` from horizontal. */
function raritySash(x, y, deg, w) {
  return `<g transform="translate(${x} ${y}) rotate(${deg})">${RARITY.map((c, i) => `<rect x="-6000" y="${(i - 2.5) * w}" width="12000" height="${w}" fill="${c}"/>`).join('')}
    <rect x="-6000" y="${-2.5 * w - 26}" width="12000" height="26" fill="${DZ.night}"/><rect x="-6000" y="${2.5 * w}" width="12000" height="26" fill="${DZ.night}"/></g>`;
}
function dropzone() {
  // The sash runs from the wearer's right shoulder to the left hip, clear of the crest; the drop path falls
  // straight down beside the crest and lands on the sash.
  const sash = raritySash(3040, 3500, 52, 120);
  const land = { x: 3900, y: 3500 + (3900 - 3040) * Math.tan((52 * Math.PI) / 180) };
  const path = `<path d="M ${land.x} 1450 L ${land.x} ${land.y - 140}" stroke="${DZ.cream}" stroke-width="26" stroke-dasharray="6 70" stroke-linecap="round"/>
    <circle cx="${land.x}" cy="${land.y}" r="120" fill="${DZ.night}" stroke="${DZ.cream}" stroke-width="22"/><circle cx="${land.x}" cy="${land.y}" r="50" fill="${DZ.pink}"/>`;
  const cuffStripes = RARITY.map((c, i) => `<rect x="0" y="${3990 + i * 46}" width="${D}" height="46" fill="${c}"/>`).join('') + `<rect x="0" y="4220" width="${D}" height="${D - 4220}" fill="${DZ.night}"/>`;
  return {
    front: svg(dzBase() + stormRings() + sash + path + crest(CREST.x, CREST.y, CREST.w, 'light'), ''),
    pattern: svg(dzBase() + stormRings(), ''),
    sleeve: svg(dzBase() + stormRings(1800) + cuffStripes, ''),
  };
}

/** Dalmatian v2: bimodal spot sizes (a few big patches among small freckles)
 *  so it reads as dalmatian, not cow; fewer, larger hearts in brand pink. */
function dalmatian() {
  const bg = `<rect width="${D}" height="${D}" fill="#F7F3EA"/>`;
  const blob = (p, rMin, rMax) => {
    const r = p.r, base = rMin + (rMax - rMin) * r() ** 1.4;
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
  // allowBig: big patches only where they can't reach the crest or lettering.
  const spots = (seed, keep, allowBig) => {
    const pts = scatter(seed, 380, 270, keep);
    let ink = '', navy = '', hearts = '';
    pts.forEach((p, i) => {
      if (i % 53 === 11) hearts += heart(p.x, p.y, 280 + p.r() * 60, PINK, -20 + p.r() * 40);
      else if (i % 9 === 4) navy += blob(p, 40, 100);
      else if (allowBig(p.x, p.y) && p.r() < 0.2) ink += blob(p, 170, 260);
      else ink += blob(p, 30, 105);
    });
    return `<path d="${ink}" fill="#1B1B22"/><path d="${navy}" fill="#1F3160"/>${hearts}`;
  };
  const frontKeep = (x, y) => clearOf(CREST.x, CREST.y, 460, 460)(x, y) && clearOf(3000, 1350, 750, 420)(x, y);
  const frontBig = (x, y) => clearOf(CREST.x, CREST.y, 900, 900)(x, y) && clearOf(3000, 1350, 1100, 700)(x, y);
  return {
    front: svg(spots(11, frontKeep, frontBig) + crest(CREST.x, CREST.y, CREST.w, 'navy'), bg),
    pattern: svg(spots(23, backKeep(220), () => false), bg),
    sleeve: svg(spots(37, () => true, () => true) + cuff(PINK, '#14213A'), bg),
  };
}

/** Twilight v2: the hour you're both awake. Same dusk gradient, now with a
 *  starfield up top and layered ridgelines on the horizon, so it has a motif. */
function twilight() {
  const bg = `<defs><linearGradient id="tw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B2560"/><stop offset="0.45" stop-color="#6A4A8E"/><stop offset="0.75" stop-color="#D7839A"/><stop offset="1" stop-color="#F6C37C"/></linearGradient></defs><rect width="${D}" height="${D}" fill="url(#tw)"/>`;
  const stars = (seed, keep = () => true) => {
    const r = rng(seed);
    let out = '';
    for (let k = 0; k < 220; k++) {
      const x = r() * D, y = r() * 3200;
      if (!keep(x, y)) continue;
      out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(6 + r() * 12).toFixed(0)}" fill="#FFF6E6" fill-opacity="${(0.25 + (1 - y / 3200) * 0.6 * r()).toFixed(2)}"/>`;
    }
    return out;
  };
  const sparkle = (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s * 2.4}" fill="#FFF6E6" fill-opacity="0.07"/>
    <path d="M ${x} ${y - s * 2.2} Q ${x + s * 0.28} ${y - s * 0.28} ${x + s * 2.2} ${y} Q ${x + s * 0.28} ${y + s * 0.28} ${x} ${y + s * 2.2} Q ${x - s * 0.28} ${y + s * 0.28} ${x - s * 2.2} ${y} Q ${x - s * 0.28} ${y - s * 0.28} ${x} ${y - s * 2.2} Z" fill="#FFF6E6"/>`;
  const ridges = (base) => {
    const layers = [['#A0678F', 0.7, 0, 220], ['#5E3B75', 1, 260, 180], ['#2E2250', 1, 520, 140]];
    return layers.map(([col, op, dy, amp], k) => {
      const r = rng(41 + k);
      const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
      let d = `M 0 ${D} L 0 ${base + dy}`;
      for (let x = 0; x <= D; x += 60) {
        const y = base + dy - amp * (0.6 * Math.sin(x / 900 + ph[0]) + 0.3 * Math.sin(x / 380 + ph[1]) + 0.1 * Math.sin(x / 150 + ph[2]));
        d += ` L ${x} ${y.toFixed(0)}`;
      }
      return `<path d="${d} L ${D} ${D} Z" fill="${col}" fill-opacity="${op}"/>`;
    }).join('');
  };
  const frontStars = stars(3, clearOf(CREST.x, CREST.y, 320, 320));
  return {
    front: svg(frontStars + sparkle(2420, 2250, 44) + sparkle(2600, 2140, 30) + ridges(4700) + crest(CREST.x, CREST.y, CREST.w, 'light'), bg),
    pattern: svg(stars(9, backKeep(120)) + ridges(5050), bg),
    sleeve: svg(stars(15) + cuff('#F6C37C', '#2B2560'), bg),
  };
}

// --- new kits -------------------------------------------------------------------

/** Other Half: pink/plum halves split at x 3000, sold as a pair. Kit A carries
 *  the left half of a heart, Kit B the right, cut on a friendship-necklace
 *  zigzag; a faint dashed outline marks the half your partner is wearing. */
function otherhalf(side) {
  const L = side === 'A' ? PINK : PLUM, R = side === 'A' ? PLUM : PINK;
  const halves = `<rect x="0" y="0" width="3000" height="${D}" fill="${L}"/><rect x="3000" y="0" width="3000" height="${D}" fill="${R}"/>`;
  const hx = 3000, hy = 3700, hw = 1400; // heart centre + width (heart box 100×90)
  const tf = `transform="translate(${hx - hw / 2} ${hy - (hw * 0.9) / 2}) scale(${hw / 100})"`;
  const top = hy - hw * 0.45 - 60, bot = hy + hw * 0.45 + 60;
  const zig = [];
  for (let y = top, k = 0; y <= bot; y += 150, k++) zig.push(`${k % 2 ? 3090 : 2910},${y.toFixed(0)}`);
  const left = `0,0 3000,0 3000,${top.toFixed(0)} ${zig.join(' ')} 3000,${bot.toFixed(0)} 3000,${D} 0,${D}`;
  const right = `${D},0 3000,0 3000,${top.toFixed(0)} ${zig.join(' ')} 3000,${bot.toFixed(0)} 3000,${D} ${D},${D}`;
  const mine = side === 'A' ? left : right, theirs = side === 'A' ? right : left;
  const heartArt = `<defs><clipPath id="mine"><polygon points="${mine}"/></clipPath><clipPath id="theirs"><polygon points="${theirs}"/></clipPath></defs>
    <g clip-path="url(#mine)"><path ${tf} d="${HEART_D}" fill="${BLUSH}"/></g>
    <g clip-path="url(#theirs)"><path ${tf} d="${HEART_D}" fill="none" stroke="${BLUSH}" stroke-opacity="0.4" stroke-width="1.3" stroke-dasharray="3 3"/></g>`;
  return {
    front: svg(heartArt + crest(CREST.x, CREST.y, CREST.w, side === 'A' ? 'light' : 'plum'), halves),
    pattern: svg('', halves),
    sleeve: svg(cuff(PURPLE, PINK), `<rect width="${D}" height="${D}" fill="${PLUM}"/>`),
  };
}

// International Morse. Only A–Z and 0–9 are encoded; everything else is dropped.
export const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
export const cleanMessage = (msg) => String(msg || '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18) || 'I MISS YOU';

const HOOP = { period: 400, band: 260 };
function morseRow(msg, cy, x0) {
  const words = cleanMessage(msg).split(' ');
  const DOT = 26, DASH = 110, H = 52, GAP = 40, LETTER = 80, WORD = 150, REPEAT = 220;
  let x = x0, out = '';
  while (x < D) {
    for (const w of words) {
      for (const ch of w) {
        for (const s of MORSE[ch] || '') {
          out += s === '.' ? `<circle cx="${x + DOT}" cy="${cy}" r="${DOT}"/>` : `<rect x="${x}" y="${cy - H / 2}" width="${DASH}" height="${H}" rx="${H / 2}"/>`;
          x += (s === '.' ? DOT * 2 : DASH) + GAP;
        }
        x += LETTER;
      }
      x += WORD;
    }
    x += REPEAT;
  }
  return out;
}
function hoops(msg, yStart = 0) {
  let s = '';
  for (let y = yStart, k = 0; y < D; y += HOOP.period, k++) {
    s += `<rect x="0" y="${y}" width="${D}" height="${HOOP.band}" fill="${PLUM}"/>`;
    s += `<g fill="${PINK}">${morseRow(msg, y + HOOP.band / 2, -((k * 230) % 700))}</g>`;
  }
  return s;
}

/** Morse Hoops: plum/blush hoops whose pink marks spell a message in Morse.
 *  morseFront(msg) is exported so a future /api route can personalise it. */
export function morseFront(msg) {
  const roundel = `<circle cx="${CREST.x}" cy="${CREST.y + 20}" r="330" fill="${PLUM}" stroke="${PINK}" stroke-width="26"/>`;
  return svg(hoops(msg) + roundel + crest(CREST.x, CREST.y, CREST.w, 'light'), `<rect width="${D}" height="${D}" fill="${BLUSH}"/>`);
}
function morse(msg = 'I MISS YOU') {
  const blush = `<rect width="${D}" height="${D}" fill="${BLUSH}"/>`;
  return {
    front: morseFront(msg),
    // Solid plum behind crest, name, number and brand line; hoops start below it.
    pattern: svg(hoops(msg, 5000) + `<rect x="0" y="0" width="${D}" height="4960" fill="${PLUM}"/>`, blush),
    sleeve: svg(hoops(msg) + cuff(PINK, PLUM), blush),
  };
}

/** Moose Lodge: red/black buffalo check with an "I MOOSE YOU" chest sponsor
 *  line, in the spot a real kit carries its sponsor. The text is kept in its
 *  own layer (mooseSponsor) because browsers don't load webfonts inside
 *  data-URL SVGs; resvg in make-jersey-kits.mjs renders it with Oswald. */
export const MOOSE_COLORWAYS = {
  lodge:  { label: 'Lodge red',    base: '#B8272F', dark: '#16151A', cream: '#F4ECE0', stitch: '#B8272F', opacity: 0.55 },
  forest: { label: 'Forest green', base: '#2F5D3A', dark: '#101A14', cream: '#F4ECE0', stitch: '#2F5D3A', opacity: 0.55 },
  navy:   { label: 'Northern navy',base: '#2B4A7A', dark: '#0E1628', cream: '#F4ECE0', stitch: '#2B4A7A', opacity: 0.55 },
  plum:   { label: 'Far Fox plum', base: '#FF6B8A', dark: '#2D1B4E', cream: '#FFF5F0', stitch: '#FF6B8A', opacity: 0.6 },
  // Blush ships in the kit layout (mooseKit): a tonal plum body with a solid three-tone pink buffalo-check hoop.
  blush:  { label: 'Blush', layout: 'kit', base: '#2D1B4E', dark: '#2D1B4E', cream: '#FFF5F0', stitch: '#FF6B8A', ink: '#FFF5F0', inkStroke: '#FF6B8A',
    body: { base: '#2D1B4E', mid: '#33205A', dark: '#29184A' }, hoop: { base: '#FF9BB2', mid: '#C2557E', dark: '#2D1B4E' }, sponsorY: 3300, sponsorSize: 330 },
};
let LODGE = { red: '#B8272F', black: '#16151A', cream: '#F4ECE0' };
const useColorway = (key) => { const c = MOOSE_COLORWAYS[key] || MOOSE_COLORWAYS.lodge; LODGE = { red: c.base, black: c.dark, cream: c.cream, stitch: c.stitch, opacity: c.opacity, mid: c.mid }; return c; };
function buffalo(size = 560) {
  let s = `<rect width="${D}" height="${D}" fill="${LODGE.red}"/>`;
  if (LODGE.mid) {
    for (let v = 0; v < D; v += size * 2) s += `<rect x="${v}" y="0" width="${size}" height="${D}" fill="${LODGE.mid}"/><rect x="0" y="${v}" width="${D}" height="${size}" fill="${LODGE.mid}"/>`;
    for (let x = 0; x < D; x += size * 2) for (let y = 0; y < D; y += size * 2) s += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${LODGE.black}"/>`;
  } else for (let v = 0; v < D; v += size * 2) {
    s += `<rect x="${v}" y="0" width="${size}" height="${D}" fill="${LODGE.black}" fill-opacity="${LODGE.opacity ?? 0.55}"/>`;
    s += `<rect x="0" y="${v}" width="${D}" height="${size}" fill="${LODGE.black}" fill-opacity="${LODGE.opacity ?? 0.55}"/>`;
  }
  // Faint twill lines so it reads as flannel, not a flat grid.
  for (let x = -D; x < D; x += 70) s += `<path d="M ${x} ${D} L ${x + D} 0" stroke="#000" stroke-opacity="0.05" stroke-width="14"/>`;
  return s;
}

/* Moose: Noto Emoji "Moose" (U+1FACE) by Google, Apache License 2.0,
 * https://github.com/googlefonts/noto-emoji. This is the unmodified glyph; the
 * shipped Foxy style (MOOSE_FOXY below) is a modified version. See
 * THIRD_PARTY_NOTICES.md.
 * The artwork is 128×128 and faces the viewer. */
const MOOSE_GLYPH = `<path fill="#4d3129" d="m52.53 25.76l-5.37-9.62s-.9.21-1.21 2.3c-.28 1.9.1 4.3-.34 6.46c-.56 2.72-2.04 6.71-.73 11.6c1.16 4.39 5.17 7.55 5.17 7.55l5.54 3.91l-1.9-21.58c-.01 0-1.16-.62-1.16-.62m20.59 9.52l.33 11.26l1.96-1.7s6.42-3.6 8.03-10.31c1.44-6.02.21-10.5-.41-12.91c-.67-2.62-1.16-4.25-1.26-4.34c-.62-.53-5.54 8.69-5.54 8.69l-3.11 9.3c-.01.01 0 .01 0 .01"/><path fill="#c26948" d="M77.92 45.64s.78-1.73 4.12-1.32c5.36.66 8.57 5.69 12.36 1.81c3.12-3.2.91-8.82-.91-12.52s-.83-6.6.33-7.66c1.89-1.73 3.96-.7 3.96-.7s-1.03-2.23.57-3.42c1.81-1.34 3.23-.31 4.26 1.08c2.14 2.88 3.49 9.13 5.22 8.56s.74-4.61-2.22-8.32s-5.59-6.73-3.46-9.31c2.56-3.1 5.93 4.53 7.25 2.72s-4.7-4.04-2.47-7.66c2.05-3.34 5.29.08 7.17 2.97c1.19 1.82 4.37 5.85 4.37 5.85l-.49 24.39l-15.24 10.22l-24.31-.08l-.49-6.59zM8.63 24.38l1.89-6.59s1.5-3.59 3.79-6.01c2.8-2.97 5.03-3.05 6.43-1.81s.82 3.46-.41 4.53c-1.02.89-3.02 2.41-1.57 3.38c1.24.82 2.39-1.4 3.54-2.55s2.39-1.24 3.54-.33s.82 3.38-.49 4.78s-3.64 4.49-5.44 8.07c-1.15 2.31-.74 4.37.25 4.78s2.22.08 3.38-2.47s2.33-8.12 5.19-7.5c2.69.59 1.98 3.7 1.98 3.7s2.36-1.13 4.12 1c3.96 4.79-3.79 9.15-2.64 16.15c.7 4.28 4.7 6.58 8.07 4.61c2.97-1.73 4.2-2.64 7.09-2.72s7.58 2.64 7.58 2.64l-11.95 6.59l-19.94-4.78L12 45.73L8.62 24.39z"/><path fill="#e69267" d="M48.92 48.68s-1.73-1.07-4.37 0s-4.7 3.38-9.47 1.81c-4.78-1.57-5.68-7.99-4.37-11.7c1.32-3.71 4.7-10.96 1.57-12.19s-4.53 2.22-5.6 6.51c-1.07 4.28-1.73 12.85-6.76 12.61s-8.49-8.49-5.85-15.74S17.37 19.1 13 17.79s-9.23 6.59-8.9 14.75s4.01 22 21.01 26.61c5.77 1.57 14.92.47 18.7-1.89c5.39-3.36 5.11-8.57 5.11-8.57zm27.66 1.47l3.02-3.26s1.92-1.08 4.58.63c2.36 1.52 7.06 4.02 11.01.76s3.02-8.14 1.74-12.33s-3.78-8.12-.88-10.56c2.37-1.99 4.52 4.04 5.5 6.96c.97 2.92 2.63 12.55 6.91 12.11s7.78-7.2 6.76-13.04s-5.3-10.22-2.48-13.81c2.82-3.6 8.83.4 10.07 6.28c2.07 9.79 1.84 19.98-10.62 29.73c-12.11 9.47-27.6 2.97-27.6 2.97z"/><path fill="#6c4b41" d="M85.22 66.97s2.41 7.5 1.13 13.09c-1.15 5.03-5.15 8.52-5.15 8.52L70.29 73.43l14.92-6.45zm-41.8-.41s-3.26 6.98-1.86 12.8s5.35 8.72 5.35 8.72l11.05-11.63z"/><path fill="#875e51" d="M46.58 51.61c-1.95 2.73-5.68 4.55-5.49 10.99c.2 6.44 3.05 9.29 4.32 11.44s2.11 3.4 2.6 4.66s.32 2.86-.17 5.1s-.95 5.67-.95 5.67l34.31-.91s-1.76-6.01-1.95-7.9c-.13-1.36-.3-2.34.19-2.92s7.82-8.07 7.61-17.24c-.15-6.43-6.24-10.75-6.24-10.75s-2.66-6.99-6.14-9.65c-4.73-3.62-8.86-3.15-8.86-3.15s.1-.92.63-1.69s1.29-1.45 1.14-1.89c-.29-.88-4.72-1.82-9.21 5.2c-.48.53-2.92 1.34-3.37 1.82c-3.93 4.26-6.66 7.01-8.41 11.21z"/><path fill="#4d3129" d="M53.16 102.78s.59 3.13 1.89 6.77c1.98 5.55 5.41 12.72 9.35 12.54c3.84-.17 6.84-6.92 8.53-12.42a50 50 0 0 0 1.65-7.37z"/><path fill="#a4725e" d="M64.11 74.82c-7.88 0-19.53 7.38-17.2 19.7c2.11 11.14 12.78 12.78 18.64 12.3s14.03-2.31 15.85-12.3c1.56-8.56-5.28-19.7-17.29-19.7"/><path fill="#875e51" d="M69.54 41.49s-1.91-7.1-.64-11.24c1.52-4.94 5.58-8.22 6.99-9.6c1.4-1.38 3.15-3.99 4.17-4.37c1.33-.5 1.71 1.03 1.71 1.03s-3.41 7.27-4.7 12.03c-1.63 6.04-3.62 17.23-3.62 17.23zc.01.01 0 0 0 0M47.15 16.13c-.61.65 0 4.04 1.07 6.64s3.15 7.18 4.22 11.75s.9 11.19.9 11.19l5.45-4.68s2.1-7.07-.32-13.17c-1.59-4.01-4.63-6.22-7.05-8.58s-3.74-3.71-4.27-3.15c.01 0 0 0 0 0"/><path fill="#6c4b41" d="M74.02 83.91c-1.4-.55-3.41 1.39-4.35 4.42s-1.57 6.03.37 6.42c2.84.57 3.23-3.71 3.86-5.6s1.26-4.79.13-5.23zm-21.39.04c-1.18.75.06 3.72.44 4.73s1.07 6.24 3.85 6.12s1.45-5.42.44-7.38s-2.84-4.67-4.73-3.47"/><path fill="#533731" d="M53.97 97.34c-1.33 1.09 1.96 5.84 10.15 6.05c7.06.19 10.72-4.6 9.9-5.87c-.89-1.37-3.03 1.76-9.84 1.89c-6.75.13-8.83-3.22-10.22-2.08z"/><path fill="#282827" d="M46.88 59.87c-2.49.81-2.29 5.09-1.66 7.54s2.34 6.08 5.04 5.35s1.98-6.08 1.53-7.98s-1.85-5.9-4.91-4.91"/><path fill="#292928" d="M79.76 60.14c-3.32-.57-4.34 3.92-4.56 6.17c-.26 2.67.07 5.88 2.59 6.58c1.93.53 4-2.25 4.34-5.96c.25-2.68.34-6.31-2.37-6.79"/><path fill="#fbf9fb" d="M47.28 61.24c-1.2.05-1.49 1.36-1.44 2.84s.98 2.72 2 2.67s1.53-1.1 1.36-2.93s-.93-2.63-1.91-2.59zm31.56.25c-1.21-.17-1.87 1.66-2 2.8c-.13 1.15-.25 2.72 1.19 2.89s1.94-1.78 2.08-2.8c.17-1.27-.04-2.72-1.27-2.89"/>`;

/** Foxy-style moose: the Noto moose redrawn in Foxy's look, with heart eyes,
 *  pink cheeks, a warm palette, a chunky dark-brown outline and a gloss highlight. */
const FOXY_BROWN = '#4A2317';
const FOXY_FILLS = { '#4d3129': '#6B3522', '#533731': '#7A3E26', '#6c4b41': '#A45A36', '#875e51': '#C9774A', '#a4725e': '#F3D6B4', '#c26948': '#E9B27E', '#e69267': '#F7D9AE' };
const MOOSE_FOXY = (() => {
  let g = MOOSE_GLYPH;
  for (const hex of ['#282827', '#292928', '#fbf9fb']) g = g.replace(new RegExp('<path(?=[^>]*fill="' + hex + '")[^>]*?(/>|></path>)', 'i'), '');
  const warm = g.replace(/fill="(#[0-9a-fA-F]{6})"/g, (_, h) => `fill="${FOXY_FILLS[h.toLowerCase()] || h}"`);
  const outline = g.replace(/fill="#[0-9a-fA-F]{6}"/g, `fill="${FOXY_BROWN}" stroke="${FOXY_BROWN}" stroke-width="5" stroke-linejoin="round"`);
  // Foxy's eyes: dark round eyes with a white heart for the pupil.
  const heartEye = (x, y) => `<circle cx="${x}" cy="${y}" r="5.6" fill="${FOXY_BROWN}"/><path transform="translate(${x} ${y - 0.2}) scale(0.058) translate(-50 -45)" d="${HEART_D}" fill="#FFFFFF"/>`;
  // Foxy's cheeks are small pink hearts.
  const cheek = (x, y) => `<path transform="translate(${x} ${y}) scale(0.085) translate(-50 -45)" d="${HEART_D}" fill="#FF8FA8"/>`;
  const cheeks = cheek(40, 79) + cheek(88, 79);
  const gloss = `<ellipse cx="56" cy="52" rx="7" ry="3.2" transform="rotate(-20 56 52)" fill="#FFFFFF" fill-opacity="0.35"/>`;
  return outline + warm + cheeks + heartEye(48.5, 66) + heartEye(79.5, 66) + gloss;
})();
let MOOSE_STYLE = 'foxy';
const mooseHead = (cx, cy, size) => `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 128})">${MOOSE_STYLE === 'foxy' ? MOOSE_FOXY : MOOSE_GLYPH}</g>`;

/** The approved Foxy in a pair of palmate moose antlers, outlined in Foxy's own dark brown. */
const FOXY_HEAD = await foxyImage('head');
const ANTLER = 'M0 120 C 30 110 50 95 60 80 L 58 40 L 72 70 L 84 22 L 94 64 L 112 18 L 116 62 L 138 30 L 136 72 L 162 52 L 152 88 C 176 86 196 92 200 104 C 176 124 120 134 60 132 C 36 131 14 128 0 120 Z';
function antleredFoxy(cx, cy, headW) {
  const headH = headW * FOXY_HEAD.aspect, top = cy - headH / 2, s = (headW * 0.62) / 200;
  const antler = (side) => `<g transform="translate(${cx + side * headW * 0.2} ${top + headW * 0.1}) rotate(${-side * 42}) scale(${side * s} ${s}) translate(0 -120)">
    <path d="${ANTLER}" fill="url(#antler)" stroke="#4A1F1A" stroke-width="7" stroke-linejoin="round"/></g>`;
  return `<defs><linearGradient id="antler" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D9A06E"/><stop offset="1" stop-color="#8E5434"/></linearGradient></defs>
    ${antler(-1)}${antler(1)}${foxyTag(FOXY_HEAD, cx, top, headW)}`;
}
/** Lodge patch: cream disc, black rim, red running stitch, moose in the middle. */
function lodgePatch(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy + 26}" r="${r + 40}" fill="#000" fill-opacity="0.28"/>
    <circle cx="${cx}" cy="${cy}" r="${r + 40}" fill="${LODGE.black}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${LODGE.cream}"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 46}" fill="none" stroke="${LODGE.stitch || LODGE.red}" stroke-width="18" stroke-dasharray="54 38" stroke-linecap="round"/>
    ${MOOSE_STYLE === 'foxy-antlers' ? antleredFoxy(cx, cy + r * 0.22, r * 1.42) : mooseHead(cx, cy - r * 0.08, r * 1.95)}
    ${MOOSE_STYLE === 'foxy-antlers' ? '' : heart(cx + r * 0.62, cy + r * 0.5, r * 0.3, '#FF6B8A', 16)}`;
}
export const mooseSponsorSpec = (key = 'lodge') => { const c = MOOSE_COLORWAYS[key] || MOOSE_COLORWAYS.lodge; return { text: 'I MOOSE YOU', x: 3000, y: c.sponsorY ?? 4600, size: c.sponsorSize ?? 300, track: 18, fill: c.ink || c.cream, stroke: c.inkStroke || c.dark, strokeW: 28 }; };
export const MOOSE_SPONSOR = mooseSponsorSpec('lodge');
export const mooseSponsor = (t = MOOSE_SPONSOR) => typeof t === 'string' ? mooseSponsor(mooseSponsorSpec(t)) :
  `<text x="${t.x}" y="${t.y}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="${t.size}" letter-spacing="${t.track}" fill="${t.fill}" stroke="${t.stroke}" stroke-width="${t.strokeW}" paint-order="stroke">${t.text}</text>`;
function mooseArt() {
  const roundel = `<circle cx="${CREST.x}" cy="${CREST.y + 20}" r="320" fill="${LODGE.black}" stroke="${LODGE.cream}" stroke-width="22"/>`;
  return buffalo() + roundel + crest(CREST.x, CREST.y, CREST.w, 'light') + lodgePatch(3000, 3560, 600);
}
/** A solid three-tone buffalo check (light squares, mid bands, dark crossings) with a faint twill. */
function check(size, { base, mid, dark }) {
  let s = `<rect width="${D}" height="${D}" fill="${base}"/>`;
  for (let v = 0; v < D; v += size * 2) s += `<rect x="${v}" y="0" width="${size}" height="${D}" fill="${mid}"/><rect x="0" y="${v}" width="${D}" height="${size}" fill="${mid}"/>`;
  for (let x = 0; x < D; x += size * 2) for (let y = 0; y < D; y += size * 2) s += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${dark}"/>`;
  for (let x = -D; x < D; x += 70) s += `<path d="M ${x} ${D} L ${x + D} 0" stroke="#000" stroke-opacity="0.05" stroke-width="14"/>`;
  return s;
}
// The kit layout, in front-file px: the hoop band across the torso, and the kit-maker mark on the right chest
// (the crest's mirror about the visible front's centre line, x 3040).
const MOOSE_HOOP = { top: 3720, height: 720, square: 180 };
let clipId = 0;
const band = (y, h, square, colours) => { const id = `mb${clipId++}`;
  return `<clipPath id="${id}"><rect x="0" y="${y}" width="${D}" height="${h}"/></clipPath><g clip-path="url(#${id})">${check(square, colours)}</g>`; };

/** The Far Fox crest with geometric antlers rising from its ears, drawn in the crest's own flat style and
 *  coordinates (300×306, ear tips at x 25 and 275), so it reads as a special edition of the real badge. */
function antleredCrest(cx, cy, w, variant, colour) {
  const s = w / 300;
  // Moose antlers are palmate: a short beam from the ear into a broad flat palm with short points.
  const PALM = [[250, 30], [286, -24], [282, -96], [304, -64], [314, -134], [336, -84], [352, -140], [368, -86], [392, -128], [398, -66], [430, -84], [410, -22], [330, 4], [290, 40]];
  const beam = (side) => `<polygon points="${PALM.map(([a, b]) => `${side > 0 ? a : 300 - a},${b}`).join(' ')}" fill="${colour}"/>`;
  return `<g transform="translate(${cx - w / 2} ${cy - (306 * s) / 2}) scale(${s})">${beam(1)}${beam(-1)}</g>${crest(cx, cy, w, variant)}`;
}

/** Moose Lodge, a Far Fox FC kit: the antlered crest and FAR FOX FC on the left chest, "I MOOSE YOU" as
 *  the sponsor, and the buffalo check as a chest hoop and cuffs on a tonal plum body. */
function mooseKit(colorway, withText) {
  const c = MOOSE_COLORWAYS[colorway], { top, height, square } = MOOSE_HOOP;
  const piping = (y) => `<rect x="0" y="${y}" width="${D}" height="26" fill="${c.cream}"/>`;
  const badge = antleredCrest(CREST.x, CREST.y + 60, CREST.w, 'light', c.cream)
    + `<text x="${CREST.x}" y="${CREST.y + 400}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="92" letter-spacing="14" fill="${c.cream}">FAR FOX FC</text>`;
  const front = check(560, c.body) + band(top, height, square, c.hoop) + piping(top - 40) + piping(top + height + 14) + badge;
  return {
    front: svg(front + (withText ? mooseSponsor(colorway) : ''), ''),
    pattern: svg(check(560, c.body), ''),
    sleeve: svg(check(560, c.body) + band(4040, D - 4040, square, c.hoop) + `<rect x="0" y="3980" width="${D}" height="40" fill="${c.cream}"/>`, ''),
  };
}

function moose({ withText = true, colorway = 'blush', style = 'foxy' } = {}) {
  useColorway(colorway);
  MOOSE_STYLE = style;
  if (MOOSE_COLORWAYS[colorway]?.layout === 'kit') return mooseKit(colorway, withText);
  return {
    front: svg(mooseArt() + (withText ? mooseSponsor(colorway) : ''), ''),
    pattern: svg(buffalo(), ''),
    sleeve: svg(buffalo() + cuff(LODGE.cream, LODGE.black), ''),
  };
}

// --- Flyway (replaces Mardi Gras) --------------------------------------------

// Brown pelican in flight: PhyloPic 9f201851 by Kurtis Wothe, CC0 1.0.
// Native box 1536x599, bill pointing right.
const PELICAN = { w: 1536, h: 599 };
const PELICAN_GLYPH = `<g transform="translate(0 599) scale(0.1 -0.1)"><path d="M13464 5958 c-20 -18 -90 -103 -155 -189 -189 -249 -330 -394 -585 -600 -499 -402 -1122 -639 -1819 -690 -221 -16 -599 4 -767 41 -33 7 -47 2 -140 -47 -618 -329 -1072 -706 -1272 -1058 -25 -43 -44 -80 -43 -82 2 -1 27 4 57 12 108 29 235 37 384 25 136 -12 146 -11 276 14 229 43 297 48 538 43 198 -4 241 -8 332 -30 308 -74 522 -204 700 -425 l68 -84 298 -98 299 -98 5 -80 c5 -64 11 -87 33 -121 15 -22 34 -41 42 -41 19 0 40 43 61 124 9 36 20 66 24 66 4 0 11 -30 15 -67 8 -79 35 -144 70 -167 24 -16 26 -15 43 13 10 16 24 64 31 105 17 102 34 99 49 -6 16 -110 29 -150 64 -193 34 -41 65 -45 78 -11 5 13 12 73 17 132 8 106 9 109 32 109 22 0 26 -8 45 -80 29 -107 73 -184 120 -210 32 -17 38 -18 46 -5 11 17 12 114 2 217 -6 59 -5 74 7 78 17 7 13 13 40 -65 48 -135 97 -205 159 -224 41 -13 44 26 17 194 -30 183 -30 192 0 112 41 -105 96 -201 134 -233 40 -33 88 -39 98 -12 4 9 -12 93 -35 187 -24 94 -42 175 -42 179 0 5 23 -37 51 -94 74 -147 167 -237 224 -215 24 9 18 39 -40 209 -30 88 -55 163 -55 166 0 3 15 -21 33 -54 48 -88 89 -145 140 -192 43 -40 110 -69 130 -56 19 11 -2 82 -70 238 -95 217 -97 226 -15 104 113 -168 246 -278 323 -267 42 6 26 51 -74 212 -85 136 -163 276 -154 276 2 0 34 -40 70 -89 114 -152 252 -261 332 -261 42 0 56 16 44 48 -5 14 -58 91 -118 171 -59 80 -118 164 -131 186 -21 36 -15 32 56 -36 135 -129 231 -189 304 -189 90 0 80 33 -62 190 -62 69 -103 118 -92 110 112 -79 152 -105 197 -126 55 -25 125 -31 158 -14 17 10 18 13 5 39 -8 15 -78 88 -156 161 -78 73 -145 141 -151 151 -5 10 34 -11 86 -46 174 -116 345 -166 405 -117 l25 20 -24 26 c-13 13 -87 69 -164 123 -77 54 -158 115 -181 135 -41 37 -41 36 75 -21 183 -91 345 -124 419 -86 61 32 36 55 -183 169 -152 79 -287 162 -287 177 0 14 17 11 129 -25 165 -53 280 -70 476 -70 187 0 268 14 337 59 50 33 75 72 61 93 -15 25 -72 38 -299 66 -250 31 -355 52 -513 102 -114 35 -119 38 -123 66 l-5 30 66 -6 c120 -12 323 -7 416 9 303 53 489 141 540 256 19 40 19 42 0 55 -27 20 -60 18 -291 -21 -289 -49 -459 -60 -713 -46 -207 12 -223 15 -253 48 -17 18 -14 19 100 31 237 25 431 85 614 188 206 116 364 259 393 356 19 64 19 82 0 98 -21 18 -67 0 -227 -86 -344 -187 -566 -273 -919 -360 -151 -36 -158 -37 -183 -21 -14 10 -26 21 -26 25 0 4 46 23 102 42 250 84 424 189 600 358 177 171 260 300 262 404 1 79 -15 95 -69 68 -22 -11 -112 -83 -200 -160 -177 -155 -280 -231 -448 -333 -117 -71 -418 -227 -437 -227 -13 0 -110 62 -110 70 0 3 48 27 107 55 288 134 565 392 682 635 31 65 36 85 36 147 0 80 -10 99 -46 88 -13 -4 -114 -96 -224 -204 -110 -109 -231 -222 -270 -252 -89 -71 -291 -208 -421 -288 l-102 -62 -53 24 -53 23 119 79 c260 170 500 472 575 723 24 80 22 146 -5 189 -20 30 -27 29 -71 -9z"/><path d="M11309 5665 c-413 -35 -906 -116 -1404 -230 -1025 -236 -2020 -601 -3249 -1191 -267 -129 -785 -393 -843 -431 l-22 -15 20 -56 c74 -208 253 -508 437 -737 107 -132 338 -370 475 -488 l88 -76 187 6 c428 13 854 -59 1275 -216 70 -26 127 -46 127 -44 0 2 -5 13 -10 24 -6 11 -15 59 -21 107 -20 176 25 504 98 707 19 55 45 136 58 180 12 44 33 107 47 141 129 320 489 683 993 1001 380 239 790 436 1330 638 375 140 535 222 693 354 72 61 146 159 173 231 25 66 24 73 -10 93 -36 21 -203 22 -442 2z"/><path d="M11830 5462 c-46 -90 -176 -221 -300 -302 -154 -101 -301 -167 -675 -306 -284 -105 -572 -231 -558 -244 16 -17 336 -33 508 -26 387 15 733 87 1075 221 156 62 510 244 510 263 0 4 -38 22 -85 40 -112 45 -190 103 -262 199 -144 190 -166 218 -172 220 -3 2 -22 -27 -41 -65z"/><path d="M1781 5037 c-68 -82 -48 -274 53 -514 80 -188 158 -306 310 -469 l86 -92 -56 -7 c-44 -5 -61 -3 -81 10 -45 30 -337 326 -408 415 -37 47 -129 177 -204 289 -74 112 -146 210 -159 219 -75 49 -106 -112 -52 -268 38 -110 138 -292 220 -401 75 -101 147 -175 260 -270 l55 -46 -55 -16 -54 -16 -65 51 c-228 177 -395 346 -584 590 -175 226 -199 245 -234 192 -44 -67 -5 -224 98 -395 141 -236 305 -396 578 -566 7 -5 -34 -75 -47 -80 -17 -7 -335 150 -482 237 -158 93 -228 145 -420 305 -218 181 -251 197 -266 121 -18 -96 59 -230 226 -396 210 -209 429 -330 748 -416 68 -18 102 -32 102 -41 0 -11 -10 -13 -42 -9 -24 3 -88 11 -143 17 -150 16 -376 56 -502 89 -61 16 -209 65 -329 110 -121 45 -236 82 -258 83 l-41 2 1 -48 c0 -35 8 -57 30 -89 89 -127 402 -285 684 -345 67 -14 131 -18 302 -18 277 0 285 -7 53 -44 -308 -50 -524 -58 -855 -32 -250 19 -289 3 -218 -89 61 -79 198 -133 420 -166 148 -21 404 -15 528 14 47 11 86 19 88 18 1 -2 -39 -22 -89 -45 -87 -41 -183 -74 -409 -141 -160 -48 -174 -69 -80 -117 86 -45 275 -25 505 52 59 20 -92 -59 -234 -122 -183 -81 -211 -97 -211 -118 0 -9 15 -25 32 -36 67 -42 260 -11 448 72 65 29 65 29 35 4 -16 -14 -101 -71 -188 -126 -138 -88 -177 -120 -177 -144 0 -12 70 -35 106 -35 41 0 203 52 252 81 63 37 44 18 -82 -77 -69 -52 -133 -105 -141 -117 -14 -20 -14 -23 6 -39 55 -45 202 -4 358 100 47 31 93 61 101 65 17 10 -136 -141 -263 -259 -48 -45 -87 -89 -87 -98 0 -20 38 -36 84 -36 71 0 240 102 376 226 36 32 58 50 50 39 -38 -53 -115 -140 -214 -245 -60 -63 -113 -125 -119 -137 -17 -38 -3 -53 50 -53 87 1 176 54 322 195 52 49 91 83 86 75 -5 -8 -60 -91 -122 -183 -63 -93 -113 -176 -111 -185 2 -12 16 -18 49 -20 39 -3 54 3 107 38 34 23 94 76 133 118 48 51 65 65 51 42 -152 -259 -174 -309 -134 -311 90 -6 163 47 276 201 25 34 46 59 46 56 0 -3 -32 -75 -71 -159 -39 -83 -72 -165 -73 -182 -1 -28 1 -30 36 -29 71 2 151 78 242 230 20 32 36 56 36 53 0 -3 -24 -71 -54 -150 -29 -79 -56 -155 -59 -169 -10 -40 5 -54 49 -46 76 15 180 158 260 358 22 56 24 59 19 23 -3 -22 -25 -110 -49 -195 -56 -199 -58 -208 -51 -231 8 -25 32 -24 77 4 80 48 158 198 217 417 9 35 9 35 10 -15 1 -27 -9 -132 -21 -233 -20 -161 -21 -184 -7 -197 13 -13 19 -13 49 4 66 35 120 147 160 337 l19 89 -6 -160 c-7 -222 9 -255 87 -177 27 27 44 57 59 106 12 37 21 77 21 87 0 10 4 19 9 19 5 0 11 -44 13 -98 2 -53 10 -107 16 -120 12 -22 14 -22 40 -6 56 32 73 75 108 261 4 19 8 21 61 16 70 -6 503 13 628 28 50 6 207 32 350 59 476 89 948 157 1385 200 695 68 1373 78 1805 27 l100 -12 3 -44 c2 -24 -1 -48 -6 -53 -6 -6 -72 -3 -173 9 -133 14 -247 18 -609 18 -505 0 -786 -16 -1325 -76 -227 -25 -719 -95 -800 -114 -34 -8 -309 -84 -611 -169 -302 -85 -682 -191 -844 -236 -162 -45 -374 -108 -470 -140 -303 -101 -843 -306 -1145 -435 -288 -123 -372 -194 -248 -209 64 -8 133 -21 218 -39 101 -23 307 -35 755 -47 517 -14 665 -23 838 -55 l143 -27 147 41 c295 83 550 121 805 121 214 0 316 -16 509 -79 81 -27 148 -48 148 -46 0 2 -16 27 -36 56 -100 147 -165 338 -185 546 -10 104 -9 217 2 227 2 2 25 7 52 10 l47 7 0 -93 c0 -313 82 -546 261 -741 68 -74 67 -74 267 -113 405 -79 967 -101 1392 -54 259 28 588 99 915 195 316 93 780 258 1049 372 128 55 130 55 270 64 473 31 953 146 1301 314 245 118 329 207 356 377 17 103 5 140 -64 215 -66 70 -126 103 -424 233 -342 149 -661 378 -736 529 -38 78 -36 91 13 91 36 0 41 -3 60 -40 30 -58 127 -157 219 -224 l81 -58 138 7 c273 13 324 25 410 92 l22 18 -160 161 c-168 169 -190 201 -190 279 0 58 18 93 72 139 124 107 338 101 697 -20 l164 -55 45 16 c25 8 79 15 119 15 40 0 73 3 73 6 0 19 -78 113 -165 199 -203 202 -340 245 -780 245 -353 0 -395 -7 -619 -110 -99 -45 -243 -128 -280 -160 l-32 -28 -36 22 c-28 17 -34 25 -27 38 13 23 96 82 186 134 82 46 82 47 -11 64 -135 23 -294 4 -388 -47 -95 -52 -181 -203 -240 -419 -30 -112 -32 -129 -32 -299 -1 -164 1 -184 21 -227 35 -76 97 -134 224 -208 204 -121 348 -188 634 -296 l140 -53 -1 -36 c-1 -19 -4 -39 -8 -42 -11 -11 -136 17 -271 62 -159 52 -322 128 -468 219 -361 223 -802 378 -1258 441 -137 19 -584 33 -578 18 5 -12 154 -144 257 -227 39 -32 72 -62 72 -66 0 -13 -41 -60 -52 -60 -13 0 -71 48 -263 215 -82 72 -190 164 -240 204 -127 104 -434 415 -538 546 -317 397 -500 787 -539 1153 -7 61 -15 112 -19 112 -4 0 -46 -18 -93 -40 -591 -271 -1700 -520 -2321 -520 -193 0 -247 9 -340 54 -95 47 -187 126 -319 277 -261 295 -396 492 -546 795 -60 121 -119 233 -131 247 -22 29 -50 35 -68 14z m1279 -4040 c0 -7 -22 -38 -48 -68 -103 -116 -112 -147 -55 -185 17 -12 128 -54 245 -93 226 -77 290 -106 286 -130 -6 -30 -219 -84 -399 -101 -81 -7 -154 -7 -254 1 -77 6 -390 14 -695 19 -519 8 -646 16 -689 40 -13 7 -9 11 19 23 89 37 1269 434 1430 481 96 28 160 33 160 13z"/><path d="M4920 4643 c-84 -9 -295 -47 -415 -74 -240 -55 -398 -106 -870 -284 -431 -163 -831 -302 -913 -320 l-34 -7 24 -25 c37 -40 151 -121 204 -145 44 -20 69 -23 229 -26 99 -2 236 1 305 7 536 49 1268 214 1753 395 159 60 365 150 385 170 11 10 9 23 -9 72 -41 109 -169 209 -300 234 -49 9 -282 11 -359 3z"/><path d="M9941 2826 c-64 -21 -111 -71 -111 -117 0 -32 10 -47 68 -111 81 -89 246 -248 257 -248 4 0 76 66 159 148 83 81 172 162 198 181 26 19 45 37 43 42 -6 9 -128 50 -255 84 -118 33 -292 43 -359 21z m280 -115 c37 -37 38 -78 4 -115 -52 -56 -145 -19 -145 59 0 79 84 112 141 56z"/><path d="M10725 2703 c-76 -31 -181 -108 -295 -219 -63 -62 -113 -114 -110 -117 3 -3 208 -89 455 -192 2489 -1034 4025 -1733 4192 -1907 48 -49 66 -109 58 -190 l-6 -66 56 -7 c185 -24 284 40 285 181 0 111 -22 159 -109 244 -91 89 -196 165 -421 304 -635 394 -1884 1027 -3612 1830 -316 146 -340 156 -395 155 -32 0 -76 -7 -98 -16z"/><path d="M10219 2274 c-38 -41 -151 -130 -189 -149 -38 -20 -185 -44 -270 -46 -109 -1 -105 -11 30 -76 69 -34 170 -80 225 -103 182 -77 276 -130 341 -195 34 -33 67 -70 75 -81 19 -29 678 -348 1169 -566 709 -315 1450 -608 1750 -693 196 -55 597 -131 846 -160 195 -23 451 -30 572 -16 141 17 142 18 85 55 -360 240 -1888 925 -4248 1904 -159 66 -306 127 -326 136 -35 15 -37 14 -60 -10z"/></g>`;
const FLYWAY = { base: '#24103F', chevron: '#6A45A8', gold: '#F4B600', tonal: '#57338F', band: '#1B6B3F', ink: '#200C3A' };
const FLYWAY_HEADING = -12;
const FORMATION = { lead: { x: 3470, y: 3650 }, width: 1010, shrink: 150, spacing: 760, spreadDeg: 40, perArm: 3, fade: 0.2 };

function pelican(cx, cy, width, rotate, fill, opacity = 1) {
  const s = width / PELICAN.w;
  return `<g transform="translate(${cx.toFixed(0)} ${cy.toFixed(0)}) rotate(${rotate}) scale(${s.toFixed(4)}) translate(${-PELICAN.w / 2} ${-PELICAN.h / 2})" fill="${fill}" opacity="${opacity}">${PELICAN_GLYPH}</g>`;
}

function chevronField(opacity) {
  return `<defs><pattern id="flyway-chevrons" width="400" height="204" patternUnits="userSpaceOnUse" patternTransform="rotate(${FLYWAY_HEADING + 90})">
    <path d="M0 150 L200 44 L400 150" fill="none" stroke="${FLYWAY.chevron}" stroke-width="18"/></pattern></defs>
    <rect width="${D}" height="${D}" fill="url(#flyway-chevrons)" opacity="${opacity}"/>`;
}

/** A V of pelicans heading up and right, each bird smaller and fainter than the one ahead. */
function formation() {
  const { lead, width, shrink, spacing, spreadDeg, perArm, fade } = FORMATION;
  const behind = ((180 + FLYWAY_HEADING) * Math.PI) / 180;
  let birds = pelican(lead.x, lead.y, width, FLYWAY_HEADING, FLYWAY.gold);
  for (const side of [-1, 1]) {
    const arm = behind + (side * spreadDeg * Math.PI) / 180;
    for (let i = 1; i <= perArm; i++) {
      birds += pelican(lead.x + Math.cos(arm) * spacing * i, lead.y + Math.sin(arm) * spacing * i, width - shrink * i, FLYWAY_HEADING, FLYWAY.gold, 1 - fade * i);
    }
  }
  return birds;
}

/** Flyway: a pelican formation over tonal feather chevrons. The back carries a
 *  tonal pelican behind the number and a small gold one below the brand line,
 *  clear of the customer's name. */
function flyway() {
  const bg = `<rect width="${D}" height="${D}" fill="${FLYWAY.base}"/>`;
  return {
    front: svg(chevronField(0.14) + formation() + crest(CREST.x, CREST.y, CREST.w, 'gold'), bg),
    pattern: svg(chevronField(0.14) + pelican(3000, 3270, 2900, -8, FLYWAY.tonal, 0.32) + pelican(3000, 5180, 620, 0, FLYWAY.gold), bg),
    sleeve: svg(chevronField(0.14) + cuff(FLYWAY.gold, FLYWAY.band), bg),
    // The back crest matches the gold front crest.
    backCrest: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="306" viewBox="0 0 300 306">${crest(150, 153, 300, 'gold')}</svg>`,
  };
}

export const KITS = {
  dropzone, dalmatian, twilight, moose, flyway,
  otherhalfa: () => otherhalf('A'),
  otherhalfb: () => otherhalf('B'),
  morse,
};

/** Back lettering colours + crest for jerseyBack.mjs KITS (merge these in). */
/** Back lettering for a moose colorway (cream on the dark check colour). */
export const mooseBack = (key = 'lodge') => { const c = MOOSE_COLORWAYS[key] || MOOSE_COLORWAYS.lodge; return { pattern: `kits-2026-10/sj-moose-${key}-pattern.png`, crest: 'fox-crest.png', number: c.ink || c.cream, numberStroke: c.inkStroke || c.dark, name: c.ink || c.cream, nameStroke: c.inkStroke || c.dark }; };

export const BACKS = {
  dropzone: { pattern: 'kits-2026-10/sj-dropzone-pattern.png', crest: 'fox-crest.png', number: '#FFF5F0', numberStroke: '#2D1B4E', name: '#FFF5F0', nameStroke: '#2D1B4E' },
  dalmatian: { pattern: 'kits-2026-10/sj-dalmatian-pattern.png', crest: 'fox-crest-navy.png', number: '#14213A', numberStroke: '#F5F1E7', name: '#14213A', nameStroke: '#F5F1E7' },
  twilight: { pattern: 'kits-2026-10/sj-twilight-pattern.png', crest: 'fox-crest.png', number: '#FAEEC8', numberStroke: '#1C1634', name: '#FAEEC8', nameStroke: '#1C1634' },
  otherhalfa: { pattern: 'kits-2026-10/sj-otherhalfa-pattern.png', crest: 'fox-crest.png', number: BLUSH, numberStroke: PLUM, name: BLUSH, nameStroke: PLUM },
  otherhalfb: { pattern: 'kits-2026-10/sj-otherhalfb-pattern.png', crest: 'fox-crest.png', number: BLUSH, numberStroke: PLUM, name: BLUSH, nameStroke: PLUM },
  morse: { pattern: 'kits-2026-10/sj-morse-pattern.png', crest: 'fox-crest.png', number: PINK, numberStroke: PLUM, name: PINK, nameStroke: PLUM },
  flyway: { pattern: 'kits-2026-10/sj-flyway-pattern.png', crest: 'kits-2026-10/fox-crest-flyway.png', number: FLYWAY.gold, numberStroke: FLYWAY.ink, name: FLYWAY.gold, nameStroke: FLYWAY.ink },
  moose: { pattern: 'kits-2026-10/sj-moose-pattern.png', crest: 'fox-crest.png', number: '#F4ECE0', numberStroke: '#16151A', name: '#F4ECE0', nameStroke: '#16151A' },
};
