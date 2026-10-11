/**
 * Long Distance FC "Two Skies" kits: one city at night on the front, the other at dawn on the back, so the shirt
 * carries both of a couple's time zones. The skies are flat bands, like a travel poster.
 *   twoskies-ny-london   night Manhattan (Empire State lit pink, Chrysler, One WTC) / dawn London (Big Ben, the Shard, the Eye)
 * Each landmark is a reusable drawing, so a new city pair is mostly one more skyline.
 * Same 6000×6000 space and helpers as kit-designs-2026-10.mjs; files go to public/shop/designs/two-skies/.
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

// Two skies over two cities: night over one skyline on the front, dawn over another on the back. The skies
// are flat bands, like a travel poster, so the kit never reads as another sunset gradient.

export const SKIES = {
  night: ['#141139', '#19164A', '#1F1B57', '#262064'], dawn: ['#262064', '#3A2970', '#553276', '#753C7B', '#9C4A7E', '#C45A7C', '#E57574', '#FB9873', '#FFB27A'],
  nightCity: '#0D0B26', window: '#FFD27A', dawnCity: '#7A5E86', sun: '#FFC861', ink: '#1F2350', moon: '#FFE7C2',
};
/** Flat horizontal bands of sky from the top down to `bottom`, then the last colour below. */
function bands(colours, bottom) {
  const h = bottom / colours.length;
  return colours.map((c, i) => `<rect x="0" y="${(i * h).toFixed(0)}" width="${D}" height="${i === colours.length - 1 ? D : (h + 2).toFixed(0)}" fill="${c}"/>`).join('');
}
/**
 * A building face's windows as a regular grid, floor by floor: unlit windows a shade lighter than the wall,
 * lit ones warm, and lit windows running in short stretches along a floor the way offices and flats light up.
 */
export const WINDOWS = { col: 34, row: 46, w: 16, h: 24, litStart: 0.1, litRun: 0.62 };
function windowGrid(r, cx, top, width, base, { unlit, litStart = WINDOWS.litStart } = {}) {
  const cols = Math.max(1, Math.floor((width - 20) / WINDOWS.col));
  const x0 = cx - ((cols - 1) * WINDOWS.col) / 2 - WINDOWS.w / 2;
  let out = '';
  for (let y = top + 40; y < base - 30; y += WINDOWS.row) {
    let lit = false;
    for (let c = 0; c < cols; c++) {
      lit = r() < (lit ? WINDOWS.litRun : litStart);
      out += `<rect x="${(x0 + c * WINDOWS.col).toFixed(0)}" y="${y.toFixed(0)}" width="${WINDOWS.w}" height="${WINDOWS.h}" fill="${lit ? SKIES.window : unlit}"${lit ? ` opacity="${(0.7 + r() * 0.3).toFixed(2)}"` : ''}/>`;
    }
  }
  return out;
}
/**
 * Manhattan landmarks to their real proportions, kept in their real height order (One WTC, Empire State, Chrysler),
 * as flat shapes standing on `base`. The same shapes clip each building's lit windows, so none float in the sky,
 * and, shifted right, draw a faint moonlit rim.
 */
const rect = (x, y, w, h) => `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h + 1}"/>`;
const trap = (x, y, wBottom, wTop, h) => `<path d="M${x - wBottom / 2} ${y} L${x - wTop / 2} ${y - h} L${x + wTop / 2} ${y - h} L${x + wBottom / 2} ${y} Z"/>`;
const NYC = {
  empire(x, base) {
    const shapes = [rect(x, base, 360, 90), rect(x, base - 90, 300, 820), rect(x, base - 90, 240, 1000)];
    let y = base - 1090;
    for (const [w, h] of [[190, 70], [150, 60], [110, 50]]) { shapes.push(rect(x, y, w, h)); y -= h; }
    shapes.push(trap(x, y, 70, 44, 120), trap(x, y - 120, 14, 4, 280));
    const crownTop = y, crownBottom = base - 1090;
    // Vertical piers down the main shaft, the building's Art Deco lines.
    const piers = Array.from({ length: 7 }, (_, i) => `<rect x="${x - 105 + i * 35}" y="${base - 1050}" width="5" height="900" fill="#221E52"/>`).join('');
    // Floodlit crown: the setbacks and mast washed in pink from below, with a soft halo.
    const lights = glow(x, crownBottom - 120, 110, 160, SPIRE_LIGHTS.empire, 0.2)
      + `<g fill="${SPIRE_LIGHTS.empire}" opacity="0.82">${[[190, 70], [150, 60], [110, 50]].reduce((acc, [w, h]) => ({ y: acc.y - h, out: acc.out + rect(x, acc.y, w, h) }), { y: crownBottom, out: '' }).out}${trap(x, crownTop, 70, 44, 120)}</g>`
      + beacon(x, crownTop - 400);
    return { shapes: shapes.join(''), detail: piers, x, width: 300, windowTop: base - 1090, lights };
  },
  chrysler(x, base) {
    const shapes = [rect(x, base, 340, 220), rect(x, base - 220, 280, 80), rect(x, base - 300, 220, 520)];
    let y = base - 820, rays = '';
    [220, 190, 160, 130, 100, 72].forEach((w, i) => {
      const h = 55;
      shapes.push(`<path d="M${x - w / 2} ${y} V${y - h * 0.4} A ${w / 2} ${h * 1.1} 0 0 1 ${x + w / 2} ${y - h * 0.4} V${y} Z"/>`);
      // Each terrace carries a fan of triangular windows, the crown's sunburst.
      const n = Math.max(3, Math.round(w / 40));
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, wx = x - w / 2 + w * t, lift = Math.sin(t * Math.PI) * h * 0.5;
        rays += `<path d="M${(wx - 8).toFixed(1)} ${(y - 10).toFixed(1)} L${wx.toFixed(1)} ${(y - 26 - lift).toFixed(1)} L${(wx + 8).toFixed(1)} ${(y - 10).toFixed(1)} Z" fill="${SKIES.window}" opacity="0.9"/>`;
      }
      y -= h;
    });
    shapes.push(trap(x, y - 20, 24, 2, 420));
    // No halo: the lit triangle crown is how it looks at night, and the pink Empire State stays the one glow.
    const lights = beacon(x, y - 440);
    return { shapes: shapes.join(''), detail: rays, x, width: 280, windowTop: base - 820, lights };
  },
  oneWtc(x, base) {
    const podium = 220, taper = 1400, top = base - podium - taper;
    const shapes = [rect(x, base, 300, podium), trap(x, base - podium, 300, 170, taper), rect(x, top, 186, 20), trap(x, top - 20, 44, 36, 50), trap(x, top - 70, 12, 3, 380)];
    // The tower's faceted faces: long triangles meeting at the middle of each edge.
    const facets = `<path d="M${x - 150} ${base - podium} L${x} ${top} L${x + 150} ${base - podium} M${x - 85} ${top} L${x} ${base - podium} L${x + 85} ${top}" fill="none" stroke="#24205A" stroke-width="5"/>`;
    // The antenna glows white its whole height, with a beacon at the tip.
    const lights = glow(x, top - 260, 40, 230, SPIRE_LIGHTS.wtc, 0.4) + `<path d="M${x - 5} ${top - 70} L${x - 1.5} ${top - 450} L${x + 1.5} ${top - 450} L${x + 5} ${top - 70} Z" fill="${SPIRE_LIGHTS.wtc}" opacity="0.9"/>` + beacon(x, top - 455);
    return { shapes: shapes.join(''), detail: facets, x, width: 300, windowTop: top, lights };
  },
};
const RIM = { colour: '#3B3680', shift: 9 };
// How each tower is lit at night: the Empire State's crown floodlit in Far Fox pink (it changes colour for
// occasions), the Chrysler's lit crown, One WTC's white antenna, and red aircraft beacons on each tip.
export const SPIRE_LIGHTS = { empire: '#FF7FA8', chrysler: '#FFE3A3', wtc: '#F4F6FF', beacon: '#FF3B3B' };
const glow = (x, y, rx, ry, colour, opacity) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${colour}" opacity="${opacity}" filter="url(#spireGlow)"/>`;
const beacon = (x, y) => `<circle cx="${x}" cy="${y}" r="22" fill="${SPIRE_LIGHTS.beacon}" opacity="0.35" filter="url(#spireGlow)"/><circle cx="${x}" cy="${y}" r="8" fill="${SPIRE_LIGHTS.beacon}"/>`;
const SPIRE_DEFS = '<filter id="spireGlow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="26"/></filter>';
/** One landmark: a moonlit rim, the silhouette, its windows clipped to it, then its own detail. */
function landmark(id, built, base, seed) {
  const r = rng(seed);
  const lit = windowGrid(r, built.x, built.windowTop, built.width, base, { unlit: '#211D50' });
  return `<clipPath id="${id}">${built.shapes}</clipPath>
    <g fill="${RIM.colour}" transform="translate(${RIM.shift} 0)">${built.shapes}</g>
    <g fill="${SKIES.nightCity}">${built.shapes}</g>
    <g clip-path="url(#${id})">${lit}${built.detail}</g>${built.lights || ''}`;
}

/** A rooftop water tower, the small detail that says New York. */
const waterTower = (x, top, f) => `<rect x="${x - 34}" y="${top - 70}" width="68" height="60" rx="6" fill="${f}"/><path d="M${x - 40} ${top - 70} L${x} ${top - 108} L${x + 40} ${top - 70} Z" fill="${f}"/><rect x="${x - 30}" y="${top - 12}" width="8" height="12" fill="${f}"/><rect x="${x + 22}" y="${top - 12}" width="8" height="12" fill="${f}"/>`;
/** Night Manhattan in three depths: hazy far towers, the three landmarks well above them, short blocks in front. */
const NYC_DEPTH = { far: '#1C1848', farH: [420, 520], nearH: [180, 300] };
function towerRow(r, base, fill, [hMin, hRange], { tanks = false, unlit, litStart } = {}) {
  let out = '', x = -100;
  while (x < D + 100) {
    const w = 160 + r() * 260, h = hMin + r() ** 1.3 * hRange, top = base - h;
    out += `<rect x="${x.toFixed(0)}" y="${top.toFixed(0)}" width="${(w + 2).toFixed(0)}" height="${(D - top).toFixed(0)}" fill="${fill}"/>` + windowGrid(r, x + w / 2, top, w - 30, base, { unlit, litStart });
    if (tanks && r() > 0.5) out += waterTower(x + w * (0.3 + r() * 0.4), top, fill);
    x += w;
  }
  return out;
}
function nycSkyline(seed, base) {
  const r = rng(seed);
  // The landmarks sit inside the visible front (x 1850–4230), clear of the crest's column.
  const landmarks = [['empire', NYC.empire, 2250], ['chrysler', NYC.chrysler, 2920], ['onewtc', NYC.oneWtc, 3720]]
    .map(([id, build, at], i) => landmark(`nyc-${id}`, build(at, base), base, seed + i)).join('');
  return towerRow(r, base, NYC_DEPTH.far, NYC_DEPTH.farH, { unlit: '#24205A', litStart: 0.06 }) + landmarks + towerRow(r, base + 40, SKIES.nightCity, NYC_DEPTH.nearH, { tanks: true, unlit: '#1C1946' });
}

/**
 * Dawn London for the back: Big Ben in front of the rising sun, the Shard to the left, the London Eye to the right,
 * all below the FAR FOX FC line (to y 4720) and clear of its width (about x 2350–3650).
 */
export const LONDON = { city: '#3E2A55', far: '#7A4A78', rim: '#FFB98A', clock: '#FFE9CF', unlit: '#4C3866', farUnlit: '#86567F', base: 5880, sunX: 3000 };
/**
 * The Elizabeth Tower (Big Ben): panelled shaft with corner buttresses, the framed clock stage, a belfry of
 * pointed arches, then the steep spire with corner pinnacles, the Ayrton lantern and the finial.
 */
function bigBen(x, base, f) {
  const shaft = 520, stage = 170, belfry = 100, roof = 230, lantern = 34, finial = 70;
  const yStage = base - shaft, yBelfry = yStage - stage, yRoof = yBelfry - belfry, yLantern = yRoof - roof;
  const shapes = [
    rect(x, base, 150, shaft), ...[-1, 1].map((side) => rect(x + side * 70, base, 22, shaft + 10)),
    rect(x, yStage, 184, stage), rect(x, yBelfry + 6, 196, 12),
    rect(x, yBelfry, 156, belfry),
    trap(x, yRoof, 160, 34, roof), rect(x, yLantern, 30, lantern), trap(x, yLantern - lantern, 8, 2, finial),
    ...[-1, 1].map((side) => trap(x + side * 74, yRoof, 22, 3, 120)),
  ];
  const cy = yStage - stage / 2;
  const panelling = Array.from({ length: 5 }, (_, i) => `<rect x="${x - 50 + i * 25 - 2}" y="${yStage + 30}" width="4" height="${shaft - 60}" fill="${LONDON.rim}" opacity="0.28"/>`).join('');
  const clock = `<rect x="${x - 78}" y="${cy - 78}" width="156" height="156" fill="none" stroke="${LONDON.rim}" stroke-width="5" opacity="0.55"/>
    <circle cx="${x}" cy="${cy}" r="62" fill="${LONDON.clock}"/><circle cx="${x}" cy="${cy}" r="62" fill="none" stroke="${f}" stroke-width="5"/>
    <path d="M${x} ${cy} V${cy - 42} M${x} ${cy} L${x + 30} ${cy + 9}" stroke="${f}" stroke-width="7" stroke-linecap="round"/>`;
  const arches = [-48, -16, 16, 48].map((dx) => `<path d="M${x + dx - 10} ${yBelfry - 14} V${yBelfry - 64} L${x + dx} ${yBelfry - 84} L${x + dx + 10} ${yBelfry - 64} V${yBelfry - 14} Z" fill="${SKIES.dawn[2]}" opacity="0.75"/>`).join('');
  const slits = [0.25, 0.45, 0.65].map((t) => `<rect x="${x - 6}" y="${(base - shaft * t).toFixed(0)}" width="12" height="34" rx="6" fill="${SKIES.window}" opacity="0.8"/>`).join('');
  return { shapes: shapes.join(''), detail: panelling + clock + arches + slits };
}
/**
 * The Shard as overlapping glass panels, each rising to its own tip: the crown splinters apart with sky between
 * the tips, and where panels overlap the sides step instead of running as one straight line.
 * Each panel is [left foot, right foot, tip x, tip height] relative to the building's centre line.
 */
const SHARD_PANELS = [[-165, 30, -52, 1370], [-125, 90, -18, 1505], [-45, 150, 20, 1570], [5, 168, 54, 1410], [-150, -20, -70, 1260]];
function shard(x, base) {
  const shapes = SHARD_PANELS.map(([l, rgt, tip, h]) => `<path d="M${x + l} ${base} L${x + tip} ${base - h} L${x + rgt} ${base} Z"/>`).join('');
  // Seams where the panels meet: from each tip down its inner edge.
  const detail = SHARD_PANELS.slice(0, 4).map(([l, rgt, tip, h]) => `<path d="M${x + tip} ${base - h} L${x + (l + rgt) / 2 + (tip > 0 ? -30 : 30)} ${base}" stroke="${LONDON.rim}" stroke-width="5" opacity="0.45" fill="none"/>`).join('');
  const floors = Array.from({ length: 30 }, (_, i) => `<line x1="${x - 170}" y1="${base - 40 - i * 46}" x2="${x + 170}" y2="${base - 40 - i * 46}" stroke="${LONDON.rim}" stroke-width="2" opacity="0.18"/>`).join('');
  return { shapes, detail: detail + floors };
}
function londonEye(cx, base, r, f) {
  const cy = base - r - 120;
  const spokes = Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<line x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * r).toFixed(0)}" y2="${(cy + Math.sin(a) * r).toFixed(0)}"/>`; }).join('');
  const pods = Array.from({ length: 32 }, (_, i) => { const a = (i / 32) * Math.PI * 2; return `<ellipse cx="${(cx + Math.cos(a) * (r + 14)).toFixed(0)}" cy="${(cy + Math.sin(a) * (r + 14)).toFixed(0)}" rx="13" ry="9" fill="${f}"/>`; }).join('');
  return `<g stroke="${f}" fill="none"><circle cx="${cx}" cy="${cy}" r="${r}" stroke-width="16"/><g stroke-width="5">${spokes}</g>
    <path d="M${cx - r * 0.55} ${base} L${cx} ${cy} L${cx + r * 0.2} ${base}" stroke-width="22"/></g>${pods}<circle cx="${cx}" cy="${cy}" r="26" fill="${f}"/>`;
}
/** The Gherkin: a rounded bullet with its diagonal lattice of glass. */
function gherkin(x, base) {
  const h = 860, w = 300;
  const shapes = `<path d="M${x - w * 0.36} ${base} C ${x - w * 0.6} ${base - h * 0.45} ${x - w * 0.42} ${base - h * 0.92} ${x} ${base - h} C ${x + w * 0.42} ${base - h * 0.92} ${x + w * 0.6} ${base - h * 0.45} ${x + w * 0.36} ${base} Z"/>`;
  let lattice = '';
  for (let k = -12; k <= 12; k++) lattice += `<path d="M${x + k * 40 - 400} ${base} L${x + k * 40 + 400} ${base - h}" /><path d="M${x + k * 40 + 400} ${base} L${x + k * 40 - 400} ${base - h}" />`;
  return { shapes, detail: `<g stroke="${LONDON.rim}" stroke-width="4" opacity="0.32" fill="none">${lattice}</g>` };
}
/** Dawn London in three depths like the Manhattan front: hazy far blocks, the landmarks, short blocks in front. */
function londonDawn(seed) {
  const r = rng(seed), f = LONDON.city, base = LONDON.base;
  // Sunlight from the horizon behind Big Ben: buildings left of it are lit on their right edge, and vice versa.
  const piece = (id, built, x) => {
    const dx = x < LONDON.sunX ? 10 : -10;
    const lit = windowGrid(r, x, base - 1500, built.windowWidth || 0, base, { unlit: LONDON.unlit, litStart: 0.05 });
    return `<clipPath id="${id}">${built.shapes}</clipPath><g fill="${LONDON.rim}" opacity="0.85" transform="translate(${dx} 0)">${built.shapes}</g><g fill="${f}">${built.shapes}</g><g clip-path="url(#${id})">${built.windowWidth ? lit : ''}${built.detail}</g>`;
  };
  const far = towerRow(r, base, LONDON.far, [300, 260], { unlit: LONDON.farUnlit, litStart: 0.02 });
  const near = towerRow(r, base + 30, f, [110, 160], { unlit: LONDON.unlit, litStart: 0.04 });
  const sh = { ...shard(1960, base), windowWidth: 300 }, gh = { ...gherkin(2480, base), windowWidth: 0 }, ben = { ...bigBen(3000, base, f), windowWidth: 0 };
  return far + londonEye(4020, base, 330, f) + piece('ldn-shard', sh, 1960) + piece('ldn-gherkin', gh, 2480) + piece('ldn-ben', ben, 3000) + near;
}

/** The moon: small, with one faint ring, so it sits in the sky as a detail rather than a second chest badge. */
export const MOON = { x: 2300, y: 1900, r: 125 };
const posterMoon = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 1.8}" fill="${SKIES.moon}" opacity="0.07"/>` + crescent(x, y, r, SKIES.moon, 'moonNy');
/** The sun half-risen behind the dawn skyline, with flat rings. */
const posterSun = (x, y, r) => [2.6, 1.9, 1.4].map((k, i) => `<circle cx="${x}" cy="${y}" r="${r * k}" fill="${SKIES.sun}" opacity="${[0.16, 0.24, 0.34][i]}"/>`).join('') + `<circle cx="${x}" cy="${y}" r="${r}" fill="${SKIES.sun}"/>`;
function twoSkiesNyLondon() {
  const keep = (x, y) => Math.hypot(x - CREST.x, y - CREST.y) > 320 && Math.hypot(x - MOON.x, y - MOON.y) > MOON.r * 2.2;
  return {
    front: svg(SPIRE_DEFS + stars(5, 300, 5000, '#FFF6E6', keep) + posterMoon(MOON.x, MOON.y, MOON.r) + nycSkyline(61, 5550) + crest(CREST.x, CREST.y, CREST.w, 'light'), bands(SKIES.night, 5450)),
    // Dawn London: Big Ben stands in front of the rising sun.
    pattern: svg(posterSun(3000, 5330, 380) + londonDawn(83), bands(SKIES.dawn, 5400)),
    // Sleeves stay on the night side; the dawn shows in the cuff band.
    sleeve: svg(stars(15, 120, 3900, '#FFF6E6') + cuff(SKIES.moon, SKIES.dawn[4]), bands(SKIES.night, 4000)),
    backCrest: `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="306" viewBox="0 0 300 306">${crest(150, 153, 300, 'light')}</svg>`,
  };
}

export const KITS = { 'twoskies-ny-london': twoSkiesNyLondon };

/** Back lettering for jerseyBack.mjs KITS (test-jersey-offer.mjs checks they match). */
export const BACKS = {
  'twoskies-ny-london': { pattern: 'two-skies/sj-twoskies-ny-london-pattern.png', crest: 'two-skies/fox-crest-twoskies-ny-london.png', number: '#FFF6EE', numberStroke: SKIES.ink, name: '#FFF6EE', nameStroke: SKIES.ink },
};
