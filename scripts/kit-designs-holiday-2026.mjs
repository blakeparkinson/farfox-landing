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

/** Branching antlers drawn in crest units (300 wide), mirrored for the right side. */
const ANTLER_D = 'M95 40 C 80 0 70 -60 40 -110 M62 -40 C 30 -50 10 -70 0 -100 M52 -78 C 70 -100 78 -125 76 -150 M44 -100 C 20 -120 14 -140 16 -165';
function redNoseCrest(cx, cy, w) {
  const s = w / 300;
  const c = { body: '#8A5A3B', feature: '#2A1A12', muzzle: '#E9D6BE', nose: REDNOSE.nose };
  const antlers = `<g fill="none" stroke="${REDNOSE.antler}" stroke-width="22" stroke-linecap="round"><path d="${ANTLER_D}"/><path d="${ANTLER_D}" transform="translate(300 0) scale(-1 1)"/></g>`;
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

/** A pine in three tiers, each tier capped with snow; far pines are paler, like they sit in the haze. */
function pine(x, base, h, far = false) {
  const w = h * 0.52, tiers = [[0, 0.42, 1], [0.28, 0.72, 0.78], [0.55, 1, 0.55]];
  const green = far ? '#3A4D72' : '#14233F';
  const body = tiers.map(([t0, t1, sw]) => {
    const top = base - h * t1, bot = base - h * t0 - h * 0.05, half = (w / 2) * sw;
    const snowLine = `M${x - half * 0.9} ${bot - h * 0.03} Q${x - half * 0.4} ${bot - h * 0.09} ${x} ${top + h * 0.06} Q${x + half * 0.4} ${bot - h * 0.11} ${x + half * 0.85} ${bot - h * 0.02}`;
    return `<path d="M${x} ${top} L${x + half} ${bot} L${x - half} ${bot} Z" fill="${green}"/><path d="${snowLine}" fill="none" stroke="${REDNOSE.snow}" stroke-width="${h * 0.035}" stroke-linecap="round" opacity="${far ? 0.7 : 0.95}"/>`;
  }).join('');
  return `<rect x="${x - h * 0.025}" y="${base - h * 0.08}" width="${h * 0.05}" height="${h * 0.1}" fill="#2A1A12"/>${body}`;
}

/** A log cabin with snow on the roof, a lit window and chimney smoke. (x, base) is the middle of its floor. */
function cabin(x, base, w) {
  const h = w * 0.55, left = x - w / 2, roofTop = base - h - w * 0.42;
  const logs = Array.from({ length: 6 }, (_, i) => `<line x1="${left}" y1="${base - (h / 6) * (i + 0.5)}" x2="${left + w}" y2="${base - (h / 6) * (i + 0.5)}" stroke="#3E2618" stroke-width="${w * 0.012}"/>`).join('');
  const win = { x: left + w * 0.6, y: base - h * 0.72, s: w * 0.2 };
  return `<ellipse cx="${win.x + win.s / 2}" cy="${base + w * 0.08}" rx="${w * 0.55}" ry="${w * 0.12}" fill="#FFB35C" opacity="0.28"/>
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

/** Moonlit hills along the hem: far pines on the back hill, near pines and (optionally) the cabin on the front. */
function winterHem(top, { withCabin = false } = {}) {
  const backHill = `M-100 ${top + 260} C 900 ${top - 60} 1900 ${top + 120} 2800 ${top + 40} C 3800 ${top - 50} 4900 ${top + 200} ${D + 100} ${top + 60} V ${D + 100} H -100 Z`;
  const frontHill = `M-100 ${top + 620} C 1200 ${top + 380} 2300 ${top + 520} 3300 ${top + 560} C 4300 ${top + 600} 5200 ${top + 420} ${D + 100} ${top + 520} V ${D + 100} H -100 Z`;
  const far = [[1500, 200, 380], [1900, 140, 300], [3500, 120, 330], [3850, 160, 400], [4250, 190, 320], [4700, 220, 360]].map(([x, dy, h]) => pine(x, top + dy, h, true)).join('');
  const near = [[1750, 590, 760], [2050, 570, 560], [3950, 580, 820], [4300, 560, 600]].map(([x, dy, h]) => pine(x, top + dy, h)).join('');
  return `<path d="${backHill}" fill="url(#hillBack)"/>${far}<path d="${frontHill}" fill="url(#hillFront)"/>${withCabin ? cabin(2900, top + 600, 640) : ''}${near}`;
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
