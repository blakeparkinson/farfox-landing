/**
 * Kit drafts under review (October 2026): two new directions for Twilight and an alternative Paradise.
 * Same 6000×6000 space and helpers as kit-designs-2026-10.mjs. Whichever is chosen replaces its kit;
 * the rest are deleted with their BACKS and jerseyBack.mjs entries.
 *   twilight-halftone  deep night purple fading out through a halftone dot field, a crescent moon by the crest
 *   twilight-skies     night sky on the front, dawn on the back: evening for one of you, morning for the other
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

export const SKIES = { night: '#1B1840', nightLow: '#2E2560', dawnTop: '#BFD6EC', dawnMid: '#F8D3B8', dawnLow: '#FFB27A', sun: '#FFC861', ink: '#1F2350', moon: '#FFE7C2' };
const NIGHT_SKY = `<defs><linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKIES.night}"/><stop offset="1" stop-color="${SKIES.nightLow}"/></linearGradient></defs><rect width="${D}" height="${D}" fill="url(#nightSky)"/>`;
const DAWN_SKY = `<defs><linearGradient id="dawnSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKIES.dawnTop}"/><stop offset="0.55" stop-color="${SKIES.dawnMid}"/><stop offset="1" stop-color="${SKIES.dawnLow}"/></linearGradient><radialGradient id="sunGlow"><stop offset="0" stop-color="${SKIES.sun}" stop-opacity="0.75"/><stop offset="1" stop-color="${SKIES.sun}" stop-opacity="0"/></radialGradient></defs><rect width="${D}" height="${D}" fill="url(#dawnSky)"/>`;
/** The sun just clearing the horizon under the back lettering. */
const sunrise = () => `<circle cx="3000" cy="5750" r="1500" fill="url(#sunGlow)"/><circle cx="3000" cy="5750" r="520" fill="${SKIES.sun}"/><rect x="0" y="5750" width="${D}" height="${D}" fill="${SKIES.dawnLow}"/><rect x="0" y="5740" width="${D}" height="14" fill="${SKIES.ink}" opacity="0.35"/>`;
function twilightSkies() {
  const keep = (x, y) => Math.hypot(x - CREST.x, y - CREST.y) > 320;
  return {
    front: svg(stars(5, 260, 6000, '#FFF6E6', keep) + crescent(2480, 2280, 170, SKIES.moon, 'moonS') + crest(CREST.x, CREST.y, CREST.w, 'light'), NIGHT_SKY),
    pattern: svg(sunrise(), DAWN_SKY),
    // Sleeves stay on the night side; the dawn shows in the cuff band.
    sleeve: svg(stars(15, 120, 3900, '#FFF6E6') + cuff(SKIES.moon, SKIES.dawnLow), NIGHT_SKY),
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
