/**
 * Long Distance FC — kit designs, October 2026 drop.
 *
 * Pure SVG builders in the same 6000×6000 Printful all-over-print space as
 * scripts/make-jersey-kits.mjs. No Node or DOM dependencies, so the same file
 * runs in the kit generator (node) and in the browser preview.
 *
 * Reworked: dropzone, dalmatian, twilight (now vector)
 * Unchanged: paradise stays on the Sept 2026 build (kits-2026-09)
 * New:      otherhalfa, otherhalfb, morse
 * Retired:  chart (Coordinates), orange
 *
 * Layout facts (from make-jersey-kits.mjs):
 *   front visible ≈ x 1850–4230, y 1330–5900; crest (3550, 2400) w 440
 *   back number block y 1980–3800, brand line y 4360–4720, crest (3000, 900)
 *   sleeve cuff: accent stripe y 3980–4020, band from y 4040
 */
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

/** Drop Zone v2: no route line. Two drop pins land inside the same zone, so it
 *  stops echoing Flight Path and reads as "we ended up in the same place". */
function dropzone() {
  const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2A8F"/><stop offset="0.55" stop-color="#4A1FB2"/><stop offset="1" stop-color="#A21C8E"/></linearGradient></defs><rect width="${D}" height="${D}" fill="url(#g)"/>`;
  const paths = contours(noiseField(7), Array.from({ length: 16 }, (_, i) => 0.22 + i * 0.037));
  const topo = paths.map((d, i) => (i % 4 === 0
    ? `<path d="${d}" stroke="#46E3FF" stroke-opacity="0.55" stroke-width="13" stroke-linecap="round" fill="none"/>`
    : `<path d="${d}" stroke="#46E3FF" stroke-opacity="0.24" stroke-width="7" stroke-linecap="round" fill="none"/>`)).join('');
  const ring = { x: 3000, y: 3800, r: 900 };
  let ticks = '';
  for (let k = 0; k < 24; k++) {
    const t = (k / 24) * Math.PI * 2, r0 = ring.r + 50, r1 = ring.r + (k % 6 === 0 ? 190 : 110);
    ticks += `<line x1="${ring.x + Math.cos(t) * r0}" y1="${ring.y + Math.sin(t) * r0}" x2="${ring.x + Math.cos(t) * r1}" y2="${ring.y + Math.sin(t) * r1}" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="18" stroke-linecap="round"/>`;
  }
  const inner = `<circle cx="${ring.x}" cy="${ring.y}" r="${ring.r * 0.42}" fill="none" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="12" stroke-dasharray="60 50"/>`;
  const zone = `<circle cx="${ring.x}" cy="${ring.y}" r="${ring.r}" fill="#0A102C" fill-opacity="0.2" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="22" stroke-dasharray="120 70"/>${ticks}${inner}
    ${pin(2800, 3920, 330, '#22D3EE')}${pin(3200, 3880, 330, '#FF4FA3')}`;
  return {
    front: svg(topo + zone + crest(CREST.x, CREST.y, CREST.w, 'light'), bg),
    pattern: svg(topo, bg),
    sleeve: svg(topo + cuff('#46E3FF', '#0A102C'), bg),
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
  blush:  { label: 'Blush',        base: '#F7C6D0', dark: '#2D1B4E', cream: '#FFF5F0', stitch: '#FF6B8A', opacity: 0.35, ink: '#2D1B4E', inkStroke: '#FFF5F0' },
};
let LODGE = { red: '#B8272F', black: '#16151A', cream: '#F4ECE0' };
const useColorway = (key) => { const c = MOOSE_COLORWAYS[key] || MOOSE_COLORWAYS.lodge; LODGE = { red: c.base, black: c.dark, cream: c.cream, stitch: c.stitch, opacity: c.opacity }; return c; };
function buffalo(size = 560) {
  let s = `<rect width="${D}" height="${D}" fill="${LODGE.red}"/>`;
  for (let v = 0; v < D; v += size * 2) {
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
/** Lodge patch: cream disc, black rim, red running stitch, moose in the middle. */
function lodgePatch(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy + 26}" r="${r + 40}" fill="#000" fill-opacity="0.28"/>
    <circle cx="${cx}" cy="${cy}" r="${r + 40}" fill="${LODGE.black}"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${LODGE.cream}"/>
    <circle cx="${cx}" cy="${cy}" r="${r - 46}" fill="none" stroke="${LODGE.stitch || LODGE.red}" stroke-width="18" stroke-dasharray="54 38" stroke-linecap="round"/>
    ${mooseHead(cx, cy - r * 0.08, r * 1.95)}
    ${heart(cx + r * 0.62, cy + r * 0.5, r * 0.3, '#FF6B8A', 16)}`;
}
export const mooseSponsorSpec = (key = 'lodge') => { const c = MOOSE_COLORWAYS[key] || MOOSE_COLORWAYS.lodge; return { text: 'I MOOSE YOU', x: 3000, y: 4600, size: 300, track: 18, fill: c.ink || c.cream, stroke: c.inkStroke || c.dark, strokeW: 28 }; };
export const MOOSE_SPONSOR = mooseSponsorSpec('lodge');
export const mooseSponsor = (t = MOOSE_SPONSOR) => typeof t === 'string' ? mooseSponsor(mooseSponsorSpec(t)) :
  `<text x="${t.x}" y="${t.y}" text-anchor="middle" font-family="Oswald" font-weight="700" font-size="${t.size}" letter-spacing="${t.track}" fill="${t.fill}" stroke="${t.stroke}" stroke-width="${t.strokeW}" paint-order="stroke">${t.text}</text>`;
function mooseArt() {
  const roundel = `<circle cx="${CREST.x}" cy="${CREST.y + 20}" r="320" fill="${LODGE.black}" stroke="${LODGE.cream}" stroke-width="22"/>`;
  return buffalo() + roundel + crest(CREST.x, CREST.y, CREST.w, 'light') + lodgePatch(3000, 3560, 600);
}
function moose({ withText = true, colorway = 'blush', style = 'foxy' } = {}) {
  useColorway(colorway);
  MOOSE_STYLE = style;
  return {
    front: svg(mooseArt() + (withText ? mooseSponsor(colorway) : ''), ''),
    pattern: svg(buffalo(), ''),
    sleeve: svg(buffalo() + cuff(LODGE.cream, LODGE.black), ''),
  };
}

export const KITS = {
  dropzone, dalmatian, twilight, moose,
  otherhalfa: () => otherhalf('A'),
  otherhalfb: () => otherhalf('B'),
  morse,
};

/** Back lettering colours + crest for jerseyBack.mjs KITS (merge these in). */
/** Back lettering for a moose colorway (cream on the dark check colour). */
export const mooseBack = (key = 'lodge') => { const c = MOOSE_COLORWAYS[key] || MOOSE_COLORWAYS.lodge; return { pattern: `kits-2026-10/sj-moose-${key}-pattern.png`, crest: 'fox-crest.png', number: c.ink || c.cream, numberStroke: c.inkStroke || c.dark, name: c.ink || c.cream, nameStroke: c.inkStroke || c.dark }; };

export const BACKS = {
  dropzone: { pattern: 'kits-2026-10/sj-dropzone-pattern.png', crest: 'fox-crest.png', number: '#FDE047', numberStroke: '#0A102C', name: '#F5F3FF', nameStroke: '#0A102C' },
  dalmatian: { pattern: 'kits-2026-10/sj-dalmatian-pattern.png', crest: 'fox-crest-navy.png', number: '#14213A', numberStroke: '#F5F1E7', name: '#14213A', nameStroke: '#F5F1E7' },
  twilight: { pattern: 'kits-2026-10/sj-twilight-pattern.png', crest: 'fox-crest.png', number: '#FAEEC8', numberStroke: '#1C1634', name: '#FAEEC8', nameStroke: '#1C1634' },
  otherhalfa: { pattern: 'kits-2026-10/sj-otherhalfa-pattern.png', crest: 'fox-crest.png', number: BLUSH, numberStroke: PLUM, name: BLUSH, nameStroke: PLUM },
  otherhalfb: { pattern: 'kits-2026-10/sj-otherhalfb-pattern.png', crest: 'fox-crest.png', number: BLUSH, numberStroke: PLUM, name: BLUSH, nameStroke: PLUM },
  morse: { pattern: 'kits-2026-10/sj-morse-pattern.png', crest: 'fox-crest.png', number: PINK, numberStroke: PLUM, name: PINK, nameStroke: PLUM },
  moose: { pattern: 'kits-2026-10/sj-moose-pattern.png', crest: 'fox-crest.png', number: '#F4ECE0', numberStroke: '#16151A', name: '#F4ECE0', nameStroke: '#16151A' },
};
