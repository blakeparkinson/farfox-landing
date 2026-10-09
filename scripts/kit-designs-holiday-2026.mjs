/**
 * Long Distance FC — holiday 2026 kits (Halloween and Christmas).
 *
 * Pure SVG builders in the same 6000×6000 Printful all-over-print space as
 * kit-designs-2026-10.mjs, wired into make-jersey-kits.mjs the same way.
 *   cobweb    black kit, one bone-white web spun out from the crest, a spider dropping in from the collar
 *   pumpkin   the shirt is the pumpkin: orange ribs, a jack-o'-lantern crest, stem-green cuffs
 *   fairisle  a Christmas jumper knitted into a kit: pine green, a cream yoke of foxes and snowflakes
 *   mistletoe burgundy kit, tonal sprigs all over, a gold-ribboned sprig hanging from the collar (shelved)
 *   rednose   midnight sky and snow, an antlered crest with a glowing red nose leading a sleigh trail home
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

// --- Pumpkin (Halloween) ------------------------------------------------------

export const PUMPKIN = { skin: '#F26B1D', shade: '#B8460C', groove: '#8E3507', glow: '#FF9A4D', ink: '#1A0F0A', candle: '#FFC93C', stem: '#3F6B2A', ribs: 9, ribGap: 520 };

/** Pumpkin ribs: bowed vertical grooves either side of the centre, shaded and highlit. */
function ribs(cx) {
  const lines = [];
  for (let i = -PUMPKIN.ribs; i <= PUMPKIN.ribs; i++) {
    const x = cx + i * PUMPKIN.ribGap, bow = i * 150;
    const d = `M${x} -200 C ${x + bow} 1600 ${x + bow} 4400 ${x} 6200`;
    const h = `M${x + PUMPKIN.ribGap / 2} -200 C ${x + PUMPKIN.ribGap / 2 + bow * 1.1} 1600 ${x + PUMPKIN.ribGap / 2 + bow * 1.1} 4400 ${x + PUMPKIN.ribGap / 2} 6200`;
    lines.push(`<path d="${h}" stroke="${PUMPKIN.glow}" stroke-width="130" opacity="0.32"/>`,
      `<path d="${d}" stroke="${PUMPKIN.shade}" stroke-width="190" opacity="0.38"/>`,
      `<path d="${d}" stroke="${PUMPKIN.groove}" stroke-width="26" opacity="0.7"/>`);
  }
  return `<g fill="none" stroke-linecap="round">${lines.join('')}</g>`;
}

/** Ribs gathered at the collar and bowed out across the body, so the whole shirt reads as one pumpkin. */
function crownRibs(cx, top) {
  const rib = (k) => `M${cx + k * 90} ${top} C ${cx + k * 330} ${top + 700} ${cx + k * 470} ${top + 1500} ${cx + k * 470} ${top + 2300} C ${cx + k * 470} ${top + 3300} ${cx + k * 360} ${top + 4300} ${cx + k * 320} ${D + 200}`;
  const lines = [];
  for (let k = -PUMPKIN.ribs; k <= PUMPKIN.ribs; k++) {
    lines.push(`<path d="${rib(k + 0.5)}" stroke="${PUMPKIN.glow}" stroke-width="150" opacity="0.3"/>`,
      `<path d="${rib(k)}" stroke="${PUMPKIN.shade}" stroke-width="200" opacity="0.36"/>`,
      `<path d="${rib(k)}" stroke="${PUMPKIN.groove}" stroke-width="26" opacity="0.7"/>`);
  }
  return `<g fill="none" stroke-linecap="round">${lines.join('')}</g>`;
}

const VINE = { stem: '#2F5A24', leaf: '#3F7A2E', vein: '#24461B' };
/** A curling tendril: a tightening spiral off the vine. */
function tendril(x, y, r0, turns, dir) {
  let d = `M${x} ${y}`;
  for (let t = 0; t <= turns * Math.PI * 2; t += 0.25) {
    const rad = r0 * (1 - t / (turns * Math.PI * 2 + 1));
    d += ` L${(x + dir * (Math.cos(t) * rad - rad)).toFixed(0)} ${(y - Math.sin(t) * rad).toFixed(0)}`;
  }
  return `<path d="${d}" fill="none" stroke="${VINE.stem}" stroke-width="22" stroke-linecap="round"/>`;
}
/** A five-lobed pumpkin leaf with veins. */
function pumpkinLeaf(x, y, size, rot) {
  const lobes = [-70, -35, 0, 35, 70].map((a, i) => `<ellipse cx="0" cy="${-size * (i === 2 ? 0.46 : 0.38)}" rx="${size * 0.22}" ry="${size * (i === 2 ? 0.42 : 0.34)}" transform="rotate(${a})"/>`).join('');
  const veins = [-70, -35, 0, 35, 70].map((a) => `<line x1="0" y1="0" x2="0" y2="${-size * 0.7}" transform="rotate(${a})"/>`).join('');
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><g fill="${VINE.leaf}">${lobes}<circle r="${size * 0.22}"/></g><g stroke="${VINE.vein}" stroke-width="${size * 0.035}" stroke-linecap="round">${veins}</g></g>`;
}
/** A vine climbing from the hem, with leaves and tendrils along it. */
function vine(points, leaves, tendrils) {
  const d = `M${points[0]} ` + points.slice(1).map((p) => `S ${p}`).join(' ');
  return `<path d="${d}" fill="none" stroke="${VINE.stem}" stroke-width="44" stroke-linecap="round"/>`
    + tendrils.map(([x, y, r, dir]) => tendril(x, y, r, 2.2, dir)).join('') + leaves.map(([x, y, sz, rot]) => pumpkinLeaf(x, y, sz, rot)).join('');
}
const FRONT_VINES = () => vine(['1750 6100', '2300 5200 2050 4700', '2500 4000 2250 3500', '2700 3000 2500 2600'],
    [[2050, 4700, 420, -40], [2360, 3800, 330, 35], [2420, 2780, 260, -20], [3200, 5700, 380, 20]],
    [[2180, 5300, 110, 1], [2600, 4300, 90, -1], [2300, 3300, 80, 1]])
  + vine(['4400 6100', '3900 5600 3500 5650'], [[3650, 5500, 300, 60]], [[3750, 5800, 90, -1]]);
const BACK_VINES = () => vine(['1500 6100', '2300 5400 2900 5500', '3700 5600 4300 5300', '4800 5000 4700 4700'],
    [[2900, 5500, 380, 15], [4300, 5300, 330, -30], [1900, 5700, 300, -50]],
    [[2500, 5450, 100, 1], [3900, 5500, 90, -1], [4650, 4800, 80, 1]]);

const PUMPKIN_CREST = { body: PUMPKIN.ink, feature: PUMPKIN.candle, muzzle: PUMPKIN.candle, nose: PUMPKIN.ink };
function pumpkin() {
  const bg = fill(PUMPKIN.skin);
  return {
    front: svg(crownRibs(FRONT_MID, 1050) + FRONT_VINES() + crestIn(CREST.x, CREST.y, CREST.w, PUMPKIN_CREST), bg),
    pattern: svg(crownRibs(2950, 700) + BACK_VINES(), bg),
    sleeve: svg(ribs(3000) + cuff(PUMPKIN.ink, PUMPKIN.stem), bg),
    backCrest: backCrestSvg(PUMPKIN_CREST),
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

function snowfall(seed, count) {
  const r = rng(seed);
  return Array.from({ length: count }, () => `<circle cx="${(r() * D).toFixed(0)}" cy="${(r() * D).toFixed(0)}" r="${(8 + r() * 22).toFixed(0)}" fill="${REDNOSE.snow}" opacity="${(0.25 + r() * 0.55).toFixed(2)}"/>`).join('');
}

/** Six-armed snow crystals with side branches, at mixed sizes and strengths. */
function crystals(seed, count, keep = () => true) {
  const r = rng(seed);
  const arm = '<path d="M0 0 V-100 M0 -45 L-22 -68 M0 -45 L22 -68 M0 -72 L-14 -88 M0 -72 L14 -88"/>';
  const one = `<g fill="none" stroke-linecap="round">${[0, 60, 120, 180, 240, 300].map((a) => `<g transform="rotate(${a})">${arm}</g>`).join('')}</g>`;
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = r() * D, y = r() * D, size = 50 + r() ** 2 * 220;
    if (!keep(x, y)) continue;
    out += `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${(r() * 60).toFixed(0)}) scale(${(size / 100).toFixed(2)})" stroke="${REDNOSE.snow}" stroke-width="${(9 / (size / 100)).toFixed(1)}" opacity="${(0.35 + r() * 0.5).toFixed(2)}">${one}</g>`;
  }
  return out;
}
/** Big soft flakes, as if falling close to the camera. */
function bokeh(seed, count) {
  const r = rng(seed);
  return `<g filter="url(#soft)">${Array.from({ length: count }, () => `<circle cx="${(r() * D).toFixed(0)}" cy="${(r() * D).toFixed(0)}" r="${(40 + r() * 50).toFixed(0)}" fill="${REDNOSE.snow}" opacity="${(0.18 + r() * 0.22).toFixed(2)}"/>`).join('')}</g>`;
}
/** Two drifts of snow along the hem. */
function snowdrift(top) {
  const back = `M0 ${top + 120} C 900 ${top - 120} 1800 ${top + 160} 2700 ${top + 30} C 3600 ${top - 100} 4600 ${top + 170} ${D} ${top} V ${D} H 0 Z`;
  const front = `M0 ${top + 330} C 1100 ${top + 140} 2200 ${top + 420} 3300 ${top + 260} C 4300 ${top + 120} 5200 ${top + 380} ${D} ${top + 250} V ${D} H 0 Z`;
  return `<path d="${back}" fill="#DCE5F2"/><path d="${front}" fill="${REDNOSE.snow}"/>`;
}
const SOFT = '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>';

/** A dotted sleigh trail looping up from the hem to the crest, ending in a small heart. */
function sleighTrail() {
  const d = `M1900 5500 C 2300 5000 4100 5100 3900 4100 C 3750 3400 2500 3700 2700 3050 C 2820 2700 3050 2860 ${CREST.x - 250} ${CREST.y + 470}`;
  return `<path d="${d}" fill="none" stroke="${REDNOSE.trail}" stroke-width="22" stroke-linecap="round" stroke-dasharray="10 90" opacity="0.85"/>`;
}

function rednose() {
  const bg = `<rect width="${D}" height="${D}" fill="url(#night)"/>`;
  const defs = NOSE_GLOW + NIGHT + SOFT;
  const clearOfCrest = (x, y) => Math.hypot(x - CREST.x, y - CREST.y - 60) > 520;
  const crestCx = CREST.x, crestCy = CREST.y + 60, crestW = 600;
  return {
    front: svg(snowfall(3, 520) + crystals(41, 70, clearOfCrest) + snowdrift(5250) + sleighTrail() + bokeh(9, 26) + redNoseCrest(crestCx, crestCy, crestW), bg, defs),
    pattern: svg(snowfall(17, 560) + crystals(53, 60) + snowdrift(5250) + bokeh(21, 20), bg, defs),
    sleeve: svg(snowfall(23, 420) + crystals(67, 40) + cuff(REDNOSE.snow, REDNOSE.cuff), bg, defs),
    backCrest: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="306" viewBox="0 0 300 306"><defs>${NOSE_GLOW}</defs>${redNoseCrest(150, 160, 230)}</svg>`,
  };
}

export const KITS = { cobweb, pumpkin, fairisle, mistletoe, rednose };

/** Back lettering for jerseyBack.mjs KITS (test-jersey-offer.mjs checks they match). */
export const BACKS = {
  cobweb: { pattern: 'kits-2026-holiday/sj-cobweb-pattern.png', crest: 'kits-2026-holiday/fox-crest-cobweb.png', number: COBWEB.orange, numberStroke: COBWEB.ink, name: COBWEB.orange, nameStroke: COBWEB.ink },
  pumpkin: { pattern: 'kits-2026-holiday/sj-pumpkin-pattern.png', crest: 'kits-2026-holiday/fox-crest-pumpkin.png', number: PUMPKIN.ink, numberStroke: '#FFE2B8', name: PUMPKIN.ink, nameStroke: '#FFE2B8' },
  fairisle: { pattern: 'kits-2026-holiday/sj-fairisle-pattern.png', crest: 'kits-2026-holiday/fox-crest-fairisle.png', number: FAIRISLE.cream, numberStroke: FAIRISLE.red, name: FAIRISLE.cream, nameStroke: FAIRISLE.red },
  rednose: { pattern: 'kits-2026-holiday/sj-rednose-pattern.png', crest: 'kits-2026-holiday/fox-crest-rednose.png', number: REDNOSE.snow, numberStroke: REDNOSE.cuff, name: REDNOSE.snow, nameStroke: REDNOSE.cuff },
  mistletoe: { pattern: 'kits-2026-holiday/sj-mistletoe-pattern.png', crest: 'kits-2026-holiday/fox-crest-mistletoe.png', number: '#FFF3D6', numberStroke: MISTLETOE.wine, name: '#FFF3D6', nameStroke: MISTLETOE.wine },
};
