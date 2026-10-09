/**
 * Long Distance FC — holiday 2026 kits (Halloween and Christmas).
 *
 * Pure SVG builders in the same 6000×6000 Printful all-over-print space as
 * kit-designs-2026-10.mjs, wired into make-jersey-kits.mjs the same way.
 *   cobweb    black kit, one bone-white web spun out from the crest, a spider dropping in from the collar
 *   candycorn soft chevron bands of cream, orange and yellow, like a piece of candy corn
 *   fairisle  a Christmas jumper knitted into a kit: pine green, a cream yoke of foxes and snowflakes
 *   mistletoe burgundy kit, tonal sprigs all over, a gold-ribboned sprig hanging from the collar (shelved)
 *   rednose   a snowy night over a lit cabin; an antlered crest with a glowing red nose leads the sleigh trail home
 *
 * Layout facts (make-jersey-kits.mjs): front visible ≈ x 1850–4230, y 1330–5900;
 * crest (3550, 2400) w 440; back number block y 1980–3800, brand line y 4360–4720.
 */
import { D, CREST, rng } from './kit-designs-2026-10.mjs';

const FRONT_MID = 3040; // centre of the visible front panel
const svg = (body, bg, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}"><defs>${defs}</defs>${bg}${body}</svg>`;
const fill = (c) => `<rect width="${D}" height="${D}" fill="${c}"/>`;
const cuff = (accent, band) =>
  `<rect x="0" y="3980" width="${D}" height="40" fill="${accent}"/><rect x="0" y="4040" width="${D}" height="${D - 4040}" fill="${band}"/>`;

/** The Far Fox crest geometry with any palette. */
function crestIn(cx, cy, w, c) {
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
const backCrestSvg = (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="306" viewBox="0 0 300 306">${crestIn(150, 153, 300, c)}</svg>`;
const HEART_D = 'M50 90 C 20 68 0 50 0 28 C 0 12 12 0 27 0 C 38 0 46 6 50 15 C 54 6 62 0 73 0 C 88 0 100 12 100 28 C 100 50 80 68 50 90 Z';
const heart = (x, y, size, color, rot = 0) =>
  `<path transform="translate(${x} ${y}) rotate(${rot}) scale(${size / 100}) translate(-50 -45)" d="${HEART_D}" fill="${color}"/>`;

// --- Cobweb (Halloween) -------------------------------------------------------

export const COBWEB = { ink: '#0E0B12', silk: '#EDE6F2', orange: '#FF7A1A', pink: '#FF6B8A', spokes: 15, ring0: 230, ringGrowth: 1.32 };

/** An orb web: straight spokes, and between each pair a thread that sags towards the hub. */
function web(cx, cy, reach, { spokes = COBWEB.spokes, seed = 7, opacity = 0.9 } = {}) {
  const r = rng(seed);
  const angles = Array.from({ length: spokes }, (_, i) => (i / spokes) * Math.PI * 2 + (r() - 0.5) * 0.18);
  const at = (a, rad) => [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  let out = angles.map((a) => { const [x, y] = at(a, reach); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(0)}" y2="${y.toFixed(0)}"/>`; }).join('');
  for (let rad = COBWEB.ring0; rad < reach; rad *= COBWEB.ringGrowth) {
    let d = '';
    angles.forEach((a, i) => {
      const b = angles[(i + 1) % spokes] + (i === spokes - 1 ? Math.PI * 2 : 0);
      const [x1, y1] = at(a, rad), [x2, y2] = at(b, rad), [qx, qy] = at((a + b) / 2, rad * 0.86);
      d += `${i ? 'L' : 'M'}${x1.toFixed(0)} ${y1.toFixed(0)} Q${qx.toFixed(0)} ${qy.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}`;
    });
    out += `<path d="${d}" fill="none"/>`;
  }
  return `<g stroke="${COBWEB.silk}" stroke-width="13" stroke-linecap="round" opacity="${opacity}">${out}</g>`;
}

/** A small spider dropping on its own thread, with a heart on its back. */
function spider(x, threadTop, y, size) {
  const s = size / 100;
  const legs = [-1, 1].flatMap((side) => [[-40, 30], [-14, 44], [14, 44], [40, 30]].map(([a, len], i) =>
    `<polyline points="0,0 ${side * len * 0.9},${a * 0.55 - 18} ${side * (len + 26)},${a * 0.9 + 22 + i * 4}" fill="none"/>`)).join('');
  return `<line x1="${x}" y1="${threadTop}" x2="${x}" y2="${y - size * 0.5}" stroke="${COBWEB.silk}" stroke-width="9"/>
    <g transform="translate(${x} ${y}) scale(${s})" stroke="${COBWEB.silk}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">${legs}</g>
    <g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="-22" rx="24" ry="22" fill="${COBWEB.silk}"/><ellipse cx="0" cy="22" rx="38" ry="44" fill="${COBWEB.silk}"/></g>
    ${heart(x, y + 24 * s, 46 * s, COBWEB.pink)}`;
}

const COBWEB_CREST = { body: COBWEB.orange, feature: COBWEB.ink, muzzle: '#FFD9B8', nose: COBWEB.ink };
function cobweb() {
  const bg = fill(COBWEB.ink);
  return {
    front: svg(web(CREST.x, CREST.y, 4600) + spider(2380, 1150, 3420, 300) + crestIn(CREST.x, CREST.y, CREST.w, COBWEB_CREST), bg),
    // The back web is spun from the wearer's right shoulder so the number sits on open threads, not the hub.
    pattern: svg(web(1900, 1150, 5200, { seed: 19, opacity: 0.55 }), bg),
    sleeve: svg(web(4200, 600, 4200, { seed: 31, opacity: 0.6 }) + cuff(COBWEB.ink, COBWEB.orange), bg),
    backCrest: backCrestSvg(COBWEB_CREST),
  };
}

// --- Candy Corn (Halloween) ---------------------------------------------------

export const CANDY = { tip: '#FFF4DC', middle: '#F7891F', base: '#FFC72C', ink: '#1A1210', soften: 45, tipEdge: 2700, baseEdge: 4300, dip: 420 };

/** Soft chevron bands, cream over orange over yellow, dipping in the middle like the V-neck. */
function candyBands(cx, shift = 0) {
  const v = (edge) => `M-400 ${edge + shift} L${cx} ${edge + shift + CANDY.dip} L${D + 400} ${edge + shift}`;
  const below = (edge) => `${v(edge)} V ${D + 400} H -400 Z`;
  return `<rect width="${D}" height="${D}" fill="${CANDY.tip}"/>
    <g filter="url(#candySoft)"><path d="${below(CANDY.tipEdge)}" fill="${CANDY.middle}"/><path d="${below(CANDY.baseEdge)}" fill="${CANDY.base}"/></g>
    <rect width="${D}" height="${D}" fill="url(#sheen)"/>`;
}
const CANDY_DEFS = `<filter id="candySoft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${CANDY.soften}"/></filter>
  <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.38" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="0.44" stop-color="#FFFFFF" stop-opacity="0.16"/><stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>`;

const CANDY_CREST = { body: CANDY.ink, feature: CANDY.tip, muzzle: CANDY.base, nose: CANDY.ink };
function candycorn() {
  return {
    front: svg(candyBands(FRONT_MID) + crestIn(CREST.x, CREST.y, CREST.w, CANDY_CREST), '', CANDY_DEFS),
    pattern: svg(candyBands(3000, -200), '', CANDY_DEFS),
    sleeve: svg(candyBands(3000, -600) + cuff(CANDY.ink, CANDY.base), '', CANDY_DEFS),
    backCrest: backCrestSvg(CANDY_CREST),
  };
}

// --- Fair Isle (Christmas) ----------------------------------------------------

export const FAIRISLE = { pine: '#123B2A', pineKnit: '#1A4B37', cream: '#F3EAD8', red: '#B3202E', cell: 46 };

// Knit charts: # main motif colour, o second colour, . background.
const CHART = {
  fox: ['#...........#', '##.........##', '###.......###', '####.....####', '#############', '##.#######.##', '#############', '.###########.', '..##ooooo##..', '...##ooo##...', '....##o##....', '.....###.....', '......#......'],
  flake: ['....#....', '.#..#..#.', '..#.#.#..', '...###...', '#########', '...###...', '..#.#.#..', '.#..#..#.', '....#....'],
  heart: ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'],
  peerie: ['#...#...', '.#.#.#.#', '..#...#.'],
};

/** One knitted V stitch, filled by whatever colour the <use> passes in. */
const STITCH_DEF = (c) => `<g id="st"><ellipse cx="${c * 0.29}" cy="${c * 0.5}" rx="${c * 0.2}" ry="${c * 0.42}" transform="rotate(-24 ${c * 0.29} ${c * 0.5})"/><ellipse cx="${c * 0.71}" cy="${c * 0.5}" rx="${c * 0.2}" ry="${c * 0.42}" transform="rotate(24 ${c * 0.71} ${c * 0.5})"/></g>`;
const KNIT_PATTERN = (c, base, knit) => `<pattern id="knit" width="${c}" height="${c}" patternUnits="userSpaceOnUse"><rect width="${c}" height="${c}" fill="${base}"/><use xlink:href="#st" fill="${knit}"/></pattern>`;

/** Knit rows of cells: each row string maps characters to colours. */
function knitRows(rows, x0, y0, colours) {
  const c = FAIRISLE.cell;
  let out = '';
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const colour = colours[ch];
    if (colour) out += `<use xlink:href="#st" x="${x0 + i * c}" y="${y0 + j * c}" fill="${colour}"/>`;
  }));
  return out;
}

/** A band: peerie border, a row of motifs, peerie border, all on a cream ground across the full width. */
function yoke(y0, motifs, { cx = FRONT_MID, gap = 4 } = {}) {
  const c = FAIRISLE.cell, cols = Math.ceil(D / c);
  const motifRows = Math.max(...motifs.map((m) => CHART[m].length));
  const rows = [];
  const tile = (pattern) => Array.from({ length: cols }, (_, i) => pattern[i % pattern.length]).join('');
  const peerie = (flip) => (flip ? [...CHART.peerie].reverse() : CHART.peerie).map(tile);
  rows.push(tile('#'), '.'.repeat(cols), ...peerie(false), '.'.repeat(cols));
  // Lay the motifs out from the centre so the chest motif is centred on the front panel.
  const unit = motifs.map((m) => CHART[m][0].length + gap).reduce((a, b) => a + b, 0);
  const startCol = Math.round(cx / c) - Math.floor(CHART[motifs[0]][0].length / 2) - unit * Math.ceil(cols / unit);
  const band = Array.from({ length: motifRows }, () => Array(cols).fill('.'));
  for (let col = startCol; col < cols; ) {
    for (const m of motifs) {
      const chart = CHART[m], top = Math.floor((motifRows - chart.length) / 2);
      chart.forEach((line, j) => [...line].forEach((ch, i) => { const x = col + i; if (x >= 0 && x < cols && ch !== '.') band[top + j][x] = m === 'fox' ? (ch === 'o' ? 'o' : '#') : ch === '#' ? (m === 'heart' ? 'r' : 'g') : '.'; }));
      col += chart[0].length + gap;
    }
  }
  rows.push(...band.map((r) => r.join('')), '.'.repeat(cols), ...peerie(true), '.'.repeat(cols), tile('#'));
  const colours = { '.': FAIRISLE.cream, '#': FAIRISLE.red, o: FAIRISLE.cream, g: FAIRISLE.pine, r: FAIRISLE.red };
  return { markup: knitRows(rows, 0, y0, colours), height: rows.length * c };
}

const FAIRISLE_CREST = { body: FAIRISLE.cream, feature: FAIRISLE.pine, muzzle: '#FFFFFF', nose: FAIRISLE.red };
function fairisle() {
  const c = FAIRISLE.cell;
  const defs = STITCH_DEF(c) + KNIT_PATTERN(c, FAIRISLE.pine, FAIRISLE.pineKnit);
  const bg = `<rect width="${D}" height="${D}" fill="url(#knit)"/>`;
  const chest = yoke(2880, ['heart', 'fox', 'flake', 'fox']); // fox ♥ fox across the chest
  const hem = yoke(5240, ['heart'], { gap: 3 });
  const backBand = yoke(4900, ['flake', 'heart'], { cx: 3000 });
  const sleeveBand = yoke(2900, ['flake', 'heart']);
  return {
    front: svg(chest.markup + hem.markup + crestIn(CREST.x, CREST.y, CREST.w, FAIRISLE_CREST), bg, defs),
    pattern: svg(backBand.markup, bg, defs),
    sleeve: svg(sleeveBand.markup + cuff(FAIRISLE.cream, FAIRISLE.red), bg, defs),
    backCrest: backCrestSvg(FAIRISLE_CREST),
  };
}

// --- Mistletoe (Christmas) ----------------------------------------------------

export const MISTLETOE = { wine: '#5E0F1E', wineTone: '#7C2134', leaf: '#8DB48E', leafDark: '#5E8A63', berry: '#FFF7EA', gold: '#E2B44C', count: 34, minDist: 900, hangX: 2480 };

const LEAF = 'M0 0 C 58 -36 70 -150 0 -215 C -70 -150 -58 -36 0 0 Z';
/** A mistletoe sprig: forking stems, paired leaves, a cluster of berries where they meet. */
function sprig(x, y, size, rot, { leaf, leafDark, berry, opacity = 1 }) {
  const s = size / 400;
  const pair = (bx, by, a) => `<g transform="translate(${bx} ${by}) rotate(${a})"><path d="${LEAF}" fill="${leaf}" transform="rotate(-28)"/><path d="${LEAF}" fill="${leafDark}" transform="rotate(30)"/></g>`;
  const stems = `<path d="M0 0 L0 -150 M0 -150 L-90 -250 M0 -150 L95 -245" stroke="${leafDark}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  const berries = [[0, -150], [-22, -132], [24, -134], [-6, -176], [16, -160]].map(([bx, by]) => `<circle cx="${bx}" cy="${by}" r="17" fill="${berry}"/>`).join('');
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" opacity="${opacity}">${stems}${pair(-90, -250, -40)}${pair(95, -245, 40)}${pair(0, -150, 0)}${berries}</g>`;
}

function mistletoeField(seed, keep) {
  const r = rng(seed), pts = [];
  for (let t = 0; pts.length < MISTLETOE.count && t < 6000; t++) {
    const p = { x: r() * D, y: r() * D };
    if (!keep(p.x, p.y) || pts.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < MISTLETOE.minDist)) continue;
    pts.push(p);
  }
  return pts.map((p, i) => sprig(p.x, p.y, 620 + (i % 4) * 90, (i * 67) % 360, { leaf: MISTLETOE.wineTone, leafDark: MISTLETOE.wineTone, berry: MISTLETOE.wineTone })).join('');
}

/** The sprig hung from the collar on a gold ribbon, tied in a bow. */
function hangingSprig(x, top, bowY) {
  const bow = `<g transform="translate(${x} ${bowY})" fill="${MISTLETOE.gold}"><path d="M0 0 C -170 -120 -210 50 -40 30 Z"/><path d="M0 0 C 170 -120 210 50 40 30 Z"/><circle r="38"/><path d="M-20 20 L-100 190 L-45 168 Z M20 20 L100 190 L45 168 Z"/></g>`;
  return `<line x1="${x}" y1="${top}" x2="${x}" y2="${bowY}" stroke="${MISTLETOE.gold}" stroke-width="30"/>
    ${sprig(x, bowY + 30, 980, 180, { leaf: MISTLETOE.leaf, leafDark: MISTLETOE.leafDark, berry: MISTLETOE.berry })}${bow}`;
}

const MISTLETOE_CREST = { body: MISTLETOE.gold, feature: MISTLETOE.wine, muzzle: '#FFF3D6', nose: MISTLETOE.wine };
function mistletoe() {
  const bg = fill(MISTLETOE.wine);
  const clear = (x, y) => Math.hypot(x - CREST.x, y - CREST.y) > 620 && Math.hypot(x - MISTLETOE.hangX, y - 2000) > 820;
  return {
    front: svg(mistletoeField(5, clear) + hangingSprig(MISTLETOE.hangX, 1100, 1720) + crestIn(CREST.x, CREST.y, CREST.w, MISTLETOE_CREST), bg),
    pattern: svg(mistletoeField(13, () => true), bg),
    sleeve: svg(mistletoeField(29, () => true) + cuff(MISTLETOE.gold, MISTLETOE.wine), bg),
    backCrest: backCrestSvg(MISTLETOE_CREST),
  };
}


// --- Red Nose (Christmas) -----------------------------------------------------

export const REDNOSE = { night: '#0F1A33', nightLow: '#1B2C52', snow: '#F4F1EA', antler: '#C9A27A', nose: '#E8202F', glow: '#FF4D4D', trail: '#F4F1EA', cuff: '#C8283A' };

/**
 * One antler in crest units (the crest is 300 wide, its forehead runs along y 88): a main beam rising
 * from the head and curving outwards, with three tines set on the beam itself so no joint is lumpy.
 * The right antler is this one mirrored about the crest's centre line, so the pair is exactly even.
 */
const ANTLER = { root: [122, 90], c1: [112, 30], c2: [70, -20], tip: [52, -112], tines: [[0.38, 48], [0.62, 44], [0.84, 34]], beam: 20, tine: 15 };
function antlerPath() {
  const { root: p0, c1, c2, tip: p3 } = ANTLER;
  const at = (t) => [0, 1].map((k) => (1 - t) ** 3 * p0[k] + 3 * (1 - t) ** 2 * t * c1[k] + 3 * (1 - t) * t ** 2 * c2[k] + t ** 3 * p3[k]);
  const beam = `<path d="M${p0} C ${c1} ${c2} ${p3}" stroke-width="${ANTLER.beam}"/>`;
  // Tines lean inwards and up, a little more upright the higher they sit.
  const tines = ANTLER.tines.map(([t, len], i) => { const [x, y] = at(t), a = (-62 + i * 14) * Math.PI / 180; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q ${(x + Math.cos(a) * len * 0.35).toFixed(1)} ${(y + Math.sin(a) * len * 0.75).toFixed(1)} ${(x + Math.cos(a) * len).toFixed(1)} ${(y + Math.sin(a) * len).toFixed(1)}" stroke-width="${ANTLER.tine}"/>`; }).join('');
  return beam + tines;
}
function redNoseCrest(cx, cy, w) {
  const s = w / 300;
  const c = { body: '#8A5A3B', feature: '#2A1A12', muzzle: '#E9D6BE', nose: REDNOSE.nose };
  const one = antlerPath();
  const antlers = `<g fill="none" stroke="${REDNOSE.antler}" stroke-linecap="round">${one}<g transform="translate(300 0) scale(-1 1)">${one}</g></g>`;
  const glow = `<circle cx="150" cy="238" r="210" fill="url(#noseGlow)"/><circle cx="150" cy="238" r="26" fill="${REDNOSE.nose}"/><circle cx="141" cy="229" r="8" fill="#FFFFFF" opacity="0.8"/>`;
  return `<g transform="translate(${cx - w / 2} ${cy - (306 * s) / 2}) scale(${s})">${antlers}</g>${crestIn(cx, cy, w, c)}<g transform="translate(${cx - w / 2} ${cy - (306 * s) / 2}) scale(${s})">${glow}</g>`;
}
const NOSE_GLOW = `<radialGradient id="noseGlow"><stop offset="0" stop-color="${REDNOSE.glow}" stop-opacity="0.9"/><stop offset="0.3" stop-color="${REDNOSE.glow}" stop-opacity="0.38"/><stop offset="1" stop-color="${REDNOSE.glow}" stop-opacity="0"/></radialGradient>`;
const NIGHT = `<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${REDNOSE.night}"/><stop offset="1" stop-color="${REDNOSE.nightLow}"/></linearGradient>`;


const SOFT = '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>';


/** Snow in three depths: many small sharp distant flakes, fewer mid flakes, a few large soft near ones. */
function realSnow(seed, density = 1) {
  const r = rng(seed);
  const layer = (n, rMin, rMax, oMin, oMax, filter) => `<g${filter ? ` filter="url(#${filter})"` : ''}>${Array.from({ length: Math.round(n * density) }, () =>
    `<circle cx="${(r() * D).toFixed(0)}" cy="${(r() * D).toFixed(0)}" r="${(rMin + r() * (rMax - rMin)).toFixed(1)}" fill="${REDNOSE.snow}" opacity="${(oMin + r() * (oMax - oMin)).toFixed(2)}"/>`).join('')}</g>`;
  return layer(900, 4, 9, 0.35, 0.75) + layer(260, 10, 18, 0.45, 0.85, 'flakeMid') + layer(34, 34, 62, 0.16, 0.32, 'soft');
}
const SNOW_DEFS = `<filter id="flakeMid" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D5E8"/><stop offset="1" stop-color="#A9B9D3"/></linearGradient>
  <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4F6FA"/><stop offset="1" stop-color="#D6DFEC"/></linearGradient>
  <radialGradient id="windowGlow"><stop offset="0" stop-color="#FFC266" stop-opacity="0.85"/><stop offset="0.4" stop-color="#FF9F43" stop-opacity="0.3"/><stop offset="1" stop-color="#FF9F43" stop-opacity="0"/></radialGradient>
  <filter id="smoke" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>`;

/**
 * A Christmas tree: five overlapping tiers with drooping, scalloped hems and snow along each one.
 * Decorated trees add swagged strings of coloured lights and a gold star; far trees are paler, as if in haze.
 */
const BULBS = ['#FFD36B', '#FF5A5A', '#6BC8FF', '#9BE36B', '#FF9ED2'];
function pine(x, base, h, { far = false, lit = false, seed = 1 } = {}) {
  const r = rng(seed);
  const green = far ? '#3A4D72' : '#173A2E', shade = far ? '#30425F' : '#0F2A20';
  const tiers = 5, trunkH = h * 0.08, crown = base - h;
  let body = '', snow = '', lights = '';
  for (let i = 0; i < tiers; i++) {
    const t = (i + 1) / tiers;
    const top = crown + (i === 0 ? 0 : h * 0.16 * i), bot = crown + h * (0.26 + 0.15 * i), half = h * (0.12 + 0.26 * t);
    const scallops = 3 + i, step = (half * 2) / scallops;
    let hem = `M${x + half} ${bot}`;
    for (let k = 0; k < scallops; k++) { const x1 = x + half - step * (k + 1); hem += ` Q${(x1 + step / 2).toFixed(0)} ${(bot + h * 0.035).toFixed(0)} ${x1.toFixed(0)} ${bot.toFixed(0)}`; }
    body += `<path d="M${x} ${top} C ${x + half * 0.35} ${top + (bot - top) * 0.4} ${x + half * 0.8} ${bot - h * 0.04} ${x + half} ${bot} ${hem.slice(hem.indexOf('Q') - 1)} C ${x - half * 0.8} ${bot - h * 0.04} ${x - half * 0.35} ${top + (bot - top) * 0.4} ${x} ${top} Z" fill="${green}"/>`
      + `<path d="M${x} ${top + h * 0.02} C ${x + half * 0.3} ${top + (bot - top) * 0.45} ${x + half * 0.7} ${bot - h * 0.03} ${x + half * 0.95} ${bot - h * 0.005}" fill="none" stroke="${shade}" stroke-width="${h * 0.04}" opacity="0.6"/>`;
    snow += `<path d="M${x - half * 0.85} ${bot - h * 0.012} Q${x - half * 0.3} ${bot - h * 0.07} ${x + half * 0.1} ${bot - h * 0.03} Q${x + half * 0.5} ${bot - h * 0.06} ${x + half * 0.8} ${bot - h * 0.01}" fill="none" stroke="${REDNOSE.snow}" stroke-width="${h * 0.028}" stroke-linecap="round" opacity="${far ? 0.65 : 0.92}"/>`;
    if (lit && i > 0) {
      // A light string swagged across the tier, bulbs spaced along it.
      const y0 = top + (bot - top) * 0.55, sag = h * 0.05, x0 = x - half * 0.72, x2 = x + half * 0.72;
      lights += `<path d="M${x0} ${y0} Q${x} ${y0 + sag * 2} ${x2} ${y0}" fill="none" stroke="#0B1A14" stroke-width="${h * 0.006}"/>`;
      const n = 3 + i;
      for (let k = 0; k <= n; k++) {
        const u = k / n, bx = x0 + (x2 - x0) * u, by = y0 + sag * 4 * u * (1 - u);
        const c = BULBS[Math.floor(r() * BULBS.length)];
        lights += `<circle cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" r="${(h * 0.035).toFixed(0)}" fill="${c}" opacity="0.35" filter="url(#flakeMid)"/><circle cx="${bx.toFixed(0)}" cy="${by.toFixed(0)}" r="${(h * 0.014).toFixed(0)}" fill="${c}"/>`;
      }
    }
  }
  const star = lit ? `<path transform="translate(${x} ${crown - h * 0.02}) scale(${h / 900})" d="M0 -60 L14 -19 L57 -19 L22 6 L35 48 L0 22 L-35 48 L-22 6 L-57 -19 L-14 -19 Z" fill="${MISTLETOE.gold}"/><circle cx="${x}" cy="${crown - h * 0.02}" r="${h * 0.09}" fill="#FFD36B" opacity="0.25" filter="url(#flakeMid)"/>` : '';
  return `<rect x="${x - h * 0.03}" y="${base - trunkH * 1.2}" width="${h * 0.06}" height="${trunkH * 1.3}" fill="#2A1A12"/>${body}${snow}${lights}${star}`;
}

/** A log cabin with snow on the roof, a lit window and chimney smoke. (x, base) is the middle of its floor. */
function cabin(x, base, w) {
  const h = w * 0.55, left = x - w / 2, roofTop = base - h - w * 0.42;
  const logs = Array.from({ length: 6 }, (_, i) => `<line x1="${left}" y1="${base - (h / 6) * (i + 0.5)}" x2="${left + w}" y2="${base - (h / 6) * (i + 0.5)}" stroke="#3E2618" stroke-width="${w * 0.012}"/>`).join('');
  const win = { x: left + w * 0.6, y: base - h * 0.72, s: w * 0.2 };
  return `<ellipse cx="${win.x + win.s / 2}" cy="${base + w * 0.08}" rx="${w * 0.55}" ry="${w * 0.12}" fill="#FFB35C" opacity="0.12" filter="url(#smoke)"/>
    <circle cx="${win.x + win.s / 2}" cy="${win.y + win.s / 2}" r="${w * 0.45}" fill="url(#windowGlow)"/>
    <rect x="${left + w * 0.66}" y="${roofTop + w * 0.08}" width="${w * 0.1}" height="${w * 0.3}" fill="#4A3426"/>
    <path d="M${left + w * 0.71} ${roofTop + w * 0.02} C ${left + w * 0.6} ${roofTop - w * 0.25} ${left + w * 0.9} ${roofTop - w * 0.4} ${left + w * 0.75} ${roofTop - w * 0.75}" fill="none" stroke="#C9D2E2" stroke-width="${w * 0.07}" stroke-linecap="round" opacity="0.45" filter="url(#smoke)"/>
    <rect x="${left}" y="${base - h}" width="${w}" height="${h}" fill="#5A3826"/>${logs}
    <rect x="${win.x}" y="${win.y}" width="${win.s}" height="${win.s}" fill="#FFC266"/>
    <path d="M${win.x + win.s / 2} ${win.y} V${win.y + win.s} M${win.x} ${win.y + win.s / 2} H${win.x + win.s}" stroke="#5A3826" stroke-width="${w * 0.018}"/>
    <rect x="${left + w * 0.16}" y="${base - h * 0.62}" width="${w * 0.2}" height="${h * 0.62}" fill="#3A2416"/>
    <path d="M${left - w * 0.1} ${base - h + w * 0.02} L${x} ${roofTop} L${left + w * 1.1} ${base - h + w * 0.02} Z" fill="#2B1A12"/>
    <path d="M${left - w * 0.13} ${base - h + w * 0.02} L${x} ${roofTop - w * 0.05} L${left + w * 1.13} ${base - h + w * 0.02} L${left + w * 1.02} ${base - h + w * 0.07} Q${left + w * 0.9} ${base - h + w * 0.13} ${left + w * 0.8} ${base - h + w * 0.06} Q${left + w * 0.55} ${base - h + w * 0.12} ${left + w * 0.35} ${base - h + w * 0.06} Q${left + w * 0.15} ${base - h + w * 0.13} ${left - w * 0.02} ${base - h + w * 0.07} Z" fill="${REDNOSE.snow}"/>
    <path d="M${left + w * 0.63} ${roofTop + w * 0.08} h${w * 0.16} q${-w * 0.02} ${-w * 0.05} ${-w * 0.08} ${-w * 0.05} q${-w * 0.06} 0 ${-w * 0.08} ${w * 0.05} Z" fill="${REDNOSE.snow}"/>`;
}

/**
 * Foxy waiting at home: a small flat silhouette sitting in the snow with her back to us, head tipped up towards
 * the sleigh trail, tail curled round. Drawn in the scene's flat style (no outline), lit warm by the cabin window.
 */
function foxyWaiting(x, base, h) {
  const s = h / 260;
  const fur = '#C8582A', shade = '#A2421E', tip = '#F4EDE2', dark = '#3A1C10';
  return `<ellipse cx="${x - h * 0.08}" cy="${base}" rx="${h * 0.55}" ry="${h * 0.06}" fill="#9FB0CC" opacity="0.55"/>
    <g transform="translate(${x} ${base}) scale(${s})">
      <ellipse cx="0" cy="-74" rx="62" ry="80" fill="${fur}"/>
      <path d="M-62 -74 C -62 -20 -30 0 0 0 C -40 -16 -50 -50 -48 -100 Z" fill="${shade}" opacity="0.6"/>
      <path d="M48 -40 C 122 -30 118 22 30 18 C -30 16 -92 18 -128 2 C -96 -22 -36 -12 8 -16 C 30 -18 46 -24 48 -40 Z" fill="${fur}"/>
      <path d="M-128 2 C -112 -14 -88 -16 -70 -12 C -78 4 -92 12 -128 2 Z" fill="${tip}"/>
      <g transform="rotate(-14 -6 -176)">
        <g id="foxyEar"><path d="M-42 -192 L-52 -272 L-10 -214 Z" fill="${fur}"/><path d="M-52 -272 L-48.5 -244 L-37.3 -251.7 Z" fill="${dark}"/></g>
        <use href="#foxyEar" transform="translate(-12 0) scale(-1 1)"/>
        <ellipse cx="-6" cy="-176" rx="46" ry="42" fill="${fur}"/>
        <path d="M-40 -190 C -62 -200 -84 -212 -100 -224 C -90 -200 -70 -172 -44 -160 Z" fill="${fur}"/>
        <path d="M-100 -224 C -86 -204 -68 -180 -44 -166 C -66 -170 -86 -190 -100 -224 Z" fill="${tip}"/>
        <circle cx="-101" cy="-225" r="6" fill="${dark}"/>
      </g>
    </g>`;
}

/** Moonlit hills along the hem: far pines on the back hill, near pines and (optionally) the cabin on the front. */
function winterHem(top, { withCabin = false } = {}) {
  const backHill = `M-100 ${top + 260} C 900 ${top - 60} 1900 ${top + 120} 2800 ${top + 40} C 3800 ${top - 50} 4900 ${top + 200} ${D + 100} ${top + 60} V ${D + 100} H -100 Z`;
  const frontHill = `M-100 ${top + 620} C 1200 ${top + 380} 2300 ${top + 520} 3300 ${top + 560} C 4300 ${top + 600} 5200 ${top + 420} ${D + 100} ${top + 520} V ${D + 100} H -100 Z`;
  const far = [[1500, 200, 380], [1900, 140, 300], [3500, 120, 330], [3850, 160, 400], [4250, 190, 320], [4700, 220, 360]].map(([x, dy, h], i) => pine(x, top + dy, h, { far: true, seed: i })).join('');
  // The two trees either side of the cabin are decorated; the outer ones are left wild.
  const near = [[1750, 590, 760, false], [2280, 575, 640, true], [3600, 585, 720, true], [4250, 560, 820, false]].map(([x, dy, h, lit], i) => pine(x, top + dy, h, { lit: withCabin && lit, seed: 40 + i })).join('');
  // Foxy is drawn after the trees: she sits in front of them, nearer the viewer.
  return `<path d="${backHill}" fill="url(#hillBack)"/>${far}<path d="${frontHill}" fill="url(#hillFront)"/>${withCabin ? cabin(2900, top + 600, 640) : ''}${near}${withCabin ? foxyWaiting(3330, top + 760, 345) : ''}`;
}

/** The sleigh trail, rising from the cabin chimney to the red nose. */
function trailHome() {
  const d = `M3020 4470 C 2700 4000 2350 3900 2550 3500 C 2700 3200 3150 3350 ${CREST.x - 250} ${CREST.y + 470}`;
  return `<path d="${d}" fill="none" stroke="${REDNOSE.trail}" stroke-width="22" stroke-linecap="round" stroke-dasharray="10 90" opacity="0.85"/>`;
}

function rednose() {
  const bg = `<rect width="${D}" height="${D}" fill="url(#night)"/>`;
  const defs = NOSE_GLOW + NIGHT + SOFT + SNOW_DEFS;
  const crestCx = CREST.x, crestCy = CREST.y + 60, crestW = 600;
  return {
    front: svg(realSnow(3) + winterHem(4700, { withCabin: true }) + trailHome() + redNoseCrest(crestCx, crestCy, crestW) + realSnow(5, 0.12), bg, defs),
    pattern: svg(realSnow(17) + winterHem(4900) + realSnow(19, 0.12), bg, defs),
    sleeve: svg(realSnow(23, 0.8) + cuff(REDNOSE.snow, REDNOSE.cuff), bg, defs),
    backCrest: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="306" viewBox="0 0 300 306"><defs>${NOSE_GLOW}</defs>${redNoseCrest(150, 160, 230)}</svg>`,
  };
}

export const KITS = { cobweb, candycorn, fairisle, mistletoe, rednose };

/** Back lettering for jerseyBack.mjs KITS (test-jersey-offer.mjs checks they match). */
export const BACKS = {
  cobweb: { pattern: 'kits-2026-holiday/sj-cobweb-pattern.png', crest: 'kits-2026-holiday/fox-crest-cobweb.png', number: COBWEB.orange, numberStroke: COBWEB.ink, name: COBWEB.orange, nameStroke: COBWEB.ink },
  candycorn: { pattern: 'kits-2026-holiday/sj-candycorn-pattern.png', crest: 'kits-2026-holiday/fox-crest-candycorn.png', number: CANDY.ink, numberStroke: CANDY.tip, name: CANDY.ink, nameStroke: CANDY.tip },
  fairisle: { pattern: 'kits-2026-holiday/sj-fairisle-pattern.png', crest: 'kits-2026-holiday/fox-crest-fairisle.png', number: FAIRISLE.cream, numberStroke: FAIRISLE.red, name: FAIRISLE.cream, nameStroke: FAIRISLE.red },
  rednose: { pattern: 'kits-2026-holiday/sj-rednose-pattern.png', crest: 'kits-2026-holiday/fox-crest-rednose.png', number: REDNOSE.snow, numberStroke: REDNOSE.cuff, name: REDNOSE.snow, nameStroke: REDNOSE.cuff },
  mistletoe: { pattern: 'kits-2026-holiday/sj-mistletoe-pattern.png', crest: 'kits-2026-holiday/fox-crest-mistletoe.png', number: '#FFF3D6', numberStroke: MISTLETOE.wine, name: '#FFF3D6', nameStroke: MISTLETOE.wine },
};
