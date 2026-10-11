/**
 * Kit drafts under review (October 2026): two new directions for Twilight and an alternative Paradise.
 * Same 6000×6000 space and helpers as kit-designs-2026-10.mjs. Whichever is chosen replaces its kit;
 * the rest are deleted with their BACKS and jerseyBack.mjs entries.
 *   twilight-halftone  deep night purple fading out through a halftone dot field, a crescent moon by the crest
 *   twilight-skies     two skies over two cities: night over Manhattan on the front, dawn over another city on the back
 *   paradise-aloha     the Paradise print as a vintage aloha shirt: full-colour leaves and hibiscus on cream
 */
import { D, CREST, rng, crest } from './kit-designs-2026-10.mjs';

const svg = (body, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}" viewBox="0 0 ${D} ${D}">${bg}${body}</svg>`;
const cuff = (accent, band) => `<rect x="0" y="3980" width="${D}" height="40" fill="${accent}"/><rect x="0" y="4040" width="${D}" height="${D - 4040}" fill="${band}"/>`;

/** A crescent moon: a disc with a smaller offset disc cut out of it. */
function crescent(x, y, r, fill, id) {
  return `<mask id="${id}"><rect width="${D}" height="${D}" fill="#fff"/><circle cx="${x + r * 0.42}" cy="${y - r * 0.18}" r="${r * 0.86}" fill="#000"/></mask>
    <circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="${fill}" opacity="0.08"/><circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" mask="url(#${id})"/>`;
}

function stars(seed, count, maxY, colour, keep = () => true) {
  const r = rng(seed);
  let out = '';
  for (let k = 0; k < count; k++) {
    const x = r() * D, y = r() * maxY;
    if (!keep(x, y)) continue;
    out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(5 + r() * 11).toFixed(0)}" fill="${colour}" opacity="${(0.3 + r() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

// --- Twilight: halftone dusk --------------------------------------------------

export const HALFTONE = { night: '#241A47', dot: '#E8739A', spacing: 118, maxR: 54, from: 2700, to: 5900 };
/** Dots on a 45° grid, growing from nothing at `from` to touching at `to`, the way print fades are screened. */
function halftone(shift = 0) {
  const { spacing, maxR, from, to } = HALFTONE;
  let dots = '';
  for (let gy = -D; gy < 2 * D; gy += spacing) {
    for (let gx = -D; gx < 2 * D; gx += spacing) {
      const x = (gx - gy) * Math.SQRT1_2 + D / 2, y = (gx + gy) * Math.SQRT1_2 + shift;
      if (x < -100 || x > D + 100 || y < from - 200 || y > D + 100) continue;
      const t = Math.min(1, Math.max(0, (y - from) / (to - from)));
      if (t <= 0.02) continue;
      dots += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(maxR * t ** 0.9).toFixed(1)}"/>`;
    }
  }
  return `<g fill="${HALFTONE.dot}">${dots}</g>`;
}
function twilightHalftone() {
  const bg = `<rect width="${D}" height="${D}" fill="${HALFTONE.night}"/>`;
  const keep = (x, y) => Math.hypot(x - CREST.x, y - CREST.y) > 320;
  return {
    front: svg(stars(3, 120, 2600, '#FFF1E6', keep) + crescent(2480, 2260, 150, '#FFE7C2', 'moonF') + halftone() + crest(CREST.x, CREST.y, CREST.w, 'light'), bg),
    pattern: svg(stars(9, 110, 1700, '#FFF1E6') + halftone(400), bg),
    sleeve: svg(stars(15, 90, 3600, '#FFF1E6') + cuff(HALFTONE.dot, HALFTONE.night), bg),
  };
}

// --- Twilight: two skies --------------------------------------------------------
// Two skies over two cities: night over one skyline on the front, dawn over another on the back. The skies
// are flat bands, like a travel poster, so the kit never reads as another sunset gradient.

export const SKIES = {
  night: ['#141139', '#19164A', '#1F1B57', '#262064'], dawn: ['#C4D9EE', '#DCDDEA', '#F2D7C8', '#F9C3A3', '#FFAA78'],
  nightCity: '#0D0B26', window: '#FFD27A', dawnCity: '#7A5E86', sun: '#FFC861', ink: '#1F2350', moon: '#FFE7C2',
};
/** Flat horizontal bands of sky from the top down to `bottom`, then the last colour below. */
function bands(colours, bottom) {
  const h = bottom / colours.length;
  return colours.map((c, i) => `<rect x="0" y="${(i * h).toFixed(0)}" width="${D}" height="${i === colours.length - 1 ? D : (h + 2).toFixed(0)}" fill="${c}"/>`).join('');
}
/** A skyline of flat blocks, towers and spires; lit windows when it's night. */
function skyline(seed, base, { fill, lit, scale = 1 }) {
  const r = rng(seed);
  let out = '', x = -100;
  while (x < D + 100) {
    const w = 140 + r() * 300, h = (260 + r() ** 1.6 * 980) * scale, top = base - h;
    out += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${(w + 2).toFixed(0)}" height="${(D - top).toFixed(0)}" fill="${fill}"/>`;
    if (r() > 0.72) out += `<rect x="${(x + w / 2 - 10).toFixed(0)}" y="${(top - 140 - r() * 160).toFixed(0)}" width="20" height="300" fill="${fill}"/>`;
    if (r() > 0.85) out += `<path d="M${(x + w * 0.2).toFixed(0)} ${top.toFixed(0)} L${(x + w / 2).toFixed(0)} ${(top - 220).toFixed(0)} L${(x + w * 0.8).toFixed(0)} ${top.toFixed(0)} Z" fill="${fill}"/>`;
    if (lit) for (let wy = top + 60; wy < base - 40; wy += 90) for (let wx = x + 30; wx < x + w - 40; wx += 70) if (r() > 0.86) out += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="26" height="36" fill="${SKIES.window}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
    x += w;
  }
  return out;
}
/** Lit window grid on a building face, sparse so it reads as night. */
function windows(r, x, top, w, base, density = 0.84) {
  let out = '';
  for (let wy = top + 50; wy < base - 40; wy += 80) for (let wx = x + 22; wx < x + w - 30; wx += 52) if (r() > density) out += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="20" height="30" fill="${SKIES.window}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`;
  return out;
}
/** Manhattan landmarks as flat silhouettes standing on `base`; each returns [markup, top y]. */
const NYC = {
  empire(x, base, f) { // stepped setbacks, mast and spire
    const tiers = [[300, 600], [220, 260], [150, 300], [92, 120], [40, 150], [12, 190]];
    let y = base, out = '';
    for (const [w, h] of tiers) { out += `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h + 2}" fill="${f}"/>`; y -= h; }
    return out;
  },
  chrysler(x, base, f) { // shaft, stacked sunburst arches, needle spire
    const shaft = 900, top = base - shaft;
    let out = `<rect x="${x - 110}" y="${top}" width="220" height="${shaft + 2}" fill="${f}"/>`;
    [[200, 0], [160, 70], [120, 140], [80, 210]].forEach(([w, dy], i) => {
      const cy = top - dy;
      out += `<path d="M${x - w / 2} ${cy} A ${w / 2} ${w * 0.55} 0 0 1 ${x + w / 2} ${cy} Z" fill="${f}"/>`;
      for (const k of [-0.28, 0, 0.28]) out += `<path d="M${x + k * w - 9} ${cy - 8} L${x + k * w} ${cy - 30 - i * 2} L${x + k * w + 9} ${cy - 8} Z" fill="${SKIES.window}" opacity="0.85"/>`;
    });
    return out + `<path d="M${x - 16} ${top - 270} L${x} ${top - 560} L${x + 16} ${top - 270} Z" fill="${f}"/>`;
  },
  oneWtc(x, base, f) { // tapering tower and antenna
    const h = 1450;
    return `<path d="M${x - 160} ${base} L${x - 70} ${base - h} L${x + 70} ${base - h} L${x + 160} ${base} Z" fill="${f}"/><rect x="${x - 8}" y="${base - h - 380}" width="16" height="382" fill="${f}"/>`;
  },
};
/** A rooftop water tower, the small detail that says New York. */
const waterTower = (x, top, f) => `<rect x="${x - 34}" y="${top - 70}" width="68" height="60" rx="6" fill="${f}"/><path d="M${x - 40} ${top - 70} L${x} ${top - 108} L${x + 40} ${top - 70} Z" fill="${f}"/><rect x="${x - 30}" y="${top - 12}" width="8" height="12" fill="${f}"/><rect x="${x + 22}" y="${top - 12}" width="8" height="12" fill="${f}"/>`;
/** Night Manhattan in three depths: hazy far towers, the three landmarks well above them, short blocks in front. */
const NYC_DEPTH = { far: '#1C1848', farH: [420, 520], nearH: [180, 300], landmarkScale: 1.15 };
function towerRow(r, base, fill, [hMin, hRange], { tanks = false, density = 0.84 } = {}) {
  let out = '', x = -100;
  while (x < D + 100) {
    const w = 160 + r() * 260, h = hMin + r() ** 1.3 * hRange, top = base - h;
    out += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${(w + 2).toFixed(0)}" height="${(D - top).toFixed(0)}" fill="${fill}"/>` + windows(r, x, top, w, base, density);
    if (tanks && r() > 0.5) out += waterTower(x + w * (0.3 + r() * 0.4), top, fill);
    x += w;
  }
  return out;
}
function nycSkyline(seed, base) {
  const r = rng(seed), f = SKIES.nightCity, k = NYC_DEPTH.landmarkScale;
  // The landmarks sit inside the visible front (x 1850–4230), clear of the crest's column.
  const landmarks = [[NYC.empire, 2250], [NYC.chrysler, 2900], [NYC.oneWtc, 3700]].map(([build, at]) =>
    `<g transform="translate(${at} ${base}) scale(${k}) translate(${-at} ${-base})">${build(at, base, f)}</g>`).join('');
  const lit = windows(r, 2080, base - 690 * k, 330, base, 0.8) + windows(r, 2770, base - 1030 * k, 250, base, 0.8) + windows(r, 3610, base - 1300 * k, 180, base, 0.8); // a narrow column, inside the tower's taper
  return towerRow(r, base, NYC_DEPTH.far, NYC_DEPTH.farH, { density: 0.9 }) + landmarks + lit + towerRow(r, base + 40, f, NYC_DEPTH.nearH, { tanks: true });
}

/** The moon with flat poster-style halo rings. */
const posterMoon = (x, y, r) => [3.2, 2.4, 1.7].map((k, i) => `<circle cx="${x}" cy="${y}" r="${r * k}" fill="${SKIES.moon}" opacity="${[0.05, 0.08, 0.12][i]}"/>`).join('') + crescent(x, y, r, SKIES.moon, 'moonS');
/** The sun half-risen behind the dawn skyline, with flat rings. */
const posterSun = (x, y, r) => [2.6, 1.9, 1.4].map((k, i) => `<circle cx="${x}" cy="${y}" r="${r * k}" fill="${SKIES.sun}" opacity="${[0.16, 0.24, 0.34][i]}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="${r}" fill="${SKIES.sun}"/>`;
function twilightSkies() {
  const keep = (x, y) => Math.hypot(x - CREST.x, y - CREST.y) > 320 && Math.hypot(x - 2420, y - 2250) > 520;
  return {
    front: svg(stars(5, 300, 5000, '#FFF6E6', keep) + posterMoon(2420, 2250, 210) + nycSkyline(61, 5550) + crest(CREST.x, CREST.y, CREST.w, 'light'), bands(SKIES.night, 5450)),
    // The dawn city stays low, under the FAR FOX FC line (to y 4720), so the sun rises clear of it.
    pattern: svg(posterSun(3000, 5250, 400) + skyline(83, 5900, { fill: SKIES.dawnCity, lit: false, scale: 0.5 }), bands(SKIES.dawn, 5400)),
    // Sleeves stay on the night side; the dawn shows in the cuff band.
    sleeve: svg(stars(15, 120, 3900, '#FFF6E6') + cuff(SKIES.moon, SKIES.dawn[4]), bands(SKIES.night, 4000)),
    backCrest: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="306" viewBox="0 0 300 306">${crest(150, 153, 300, 'navy')}</svg>`,
  };
}

export const KITS = { 'twilight-halftone': twilightHalftone, 'twilight-skies': twilightSkies };

/** Back lettering, mirrored in jerseyBack.mjs while these are under review. */
export const BACKS = {
  'twilight-halftone': { pattern: 'kits-drafts/sj-twilight-halftone-pattern.png', crest: 'fox-crest.png', number: '#FFF1E6', numberStroke: HALFTONE.night, name: '#FFF1E6', nameStroke: HALFTONE.night },
  'twilight-skies': { pattern: 'kits-drafts/sj-twilight-skies-pattern.png', crest: 'kits-drafts/fox-crest-twilight-skies.png', number: SKIES.ink, numberStroke: '#FFF6EE', name: SKIES.ink, nameStroke: '#FFF6EE' },
  'paradise-aloha': { pattern: 'kits-drafts/sj-paradise-aloha-pattern.png', crest: 'fox-crest-navy.png', number: '#1F4D3A', numberStroke: '#F6EEDC', name: '#1F4D3A', nameStroke: '#F6EEDC' },
};
