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

export const KITS = {
  dropzone, dalmatian, twilight,
  otherhalfa: () => otherhalf('A'),
  otherhalfb: () => otherhalf('B'),
  morse,
};

/** Back lettering colours + crest for jerseyBack.mjs KITS (merge these in). */
export const BACKS = {
  dropzone: { pattern: 'kits-2026-10/sj-dropzone-pattern.png', crest: 'fox-crest.png', number: '#FDE047', numberStroke: '#0A102C', name: '#F5F3FF', nameStroke: '#0A102C' },
  dalmatian: { pattern: 'kits-2026-10/sj-dalmatian-pattern.png', crest: 'fox-crest-navy.png', number: '#14213A', numberStroke: '#F5F1E7', name: '#14213A', nameStroke: '#F5F1E7' },
  twilight: { pattern: 'kits-2026-10/sj-twilight-pattern.png', crest: 'fox-crest.png', number: '#FAEEC8', numberStroke: '#1C1634', name: '#FAEEC8', nameStroke: '#1C1634' },
  otherhalfa: { pattern: 'kits-2026-10/sj-otherhalfa-pattern.png', crest: 'fox-crest.png', number: BLUSH, numberStroke: PLUM, name: BLUSH, nameStroke: PLUM },
  otherhalfb: { pattern: 'kits-2026-10/sj-otherhalfb-pattern.png', crest: 'fox-crest.png', number: BLUSH, numberStroke: PLUM, name: BLUSH, nameStroke: PLUM },
  morse: { pattern: 'kits-2026-10/sj-morse-pattern.png', crest: 'fox-crest.png', number: PINK, numberStroke: PLUM, name: PINK, nameStroke: PLUM },
};
