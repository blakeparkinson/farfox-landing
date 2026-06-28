/**
 * On-demand personalized jersey BACK print file generator.
 *
 * Renders a full-bleed square back (pattern + fox crest + custom NUMBER +
 * custom NAME) so a customer can put their own name/number on a Far Fox FC
 * kit. Used by:
 *   - GET /api/jersey-back.png  (Printful fetches this URL at fulfilment)
 *   - scripts/test-jersey-back.mjs (local visual QA)
 *
 * Pipeline: satori (text → SVG) → @resvg/resvg-js (SVG → transparent PNG)
 * → sharp (composite text + crest over the kit pattern). Fonts are fetched
 * as buffers (no fontconfig needed), exactly like the OG-image route.
 *
 * Everything is laid out in a 6000×6000 "design space" and scaled to the
 * render size, matching the baked back files the static kits use.
 */
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { SITE, kitSlugForName, backUrl } from './kits.mjs';

export { kitSlugForName, backUrl };

const DESIGN = 6000; // native design space; layout numbers are in this space

/**
 * Per-kit config. `pattern`/`crest` are paths under /shop/designs.
 * Colors are [r,g,b]. `stitch` is the Printful collar stitch colour.
 * Layout (number/name) is shared across the concept kits; per-kit overrides
 * are merged in.
 */
const KITS = {
  twilight: {
    pattern: 'sj-twilight-pattern.png', crest: 'fox-crest.png',
    number: '#FAEEC8', numberStroke: '#1C1634', name: '#FAEEC8', nameStroke: '#1C1634',
    stitch: 'black',
  },
  flight: {
    pattern: 'sj-flight-pattern.png', crest: 'fox-crest-navy.png',
    number: '#1C1A2E', numberStroke: '#F5F1E7', name: '#1C1A2E', nameStroke: '#F5F1E7',
    stitch: 'white',
  },
  stars: {
    pattern: 'sj-stars-pattern.png', crest: 'fox-crest.png',
    number: '#FAF4E4', numberStroke: '#141432', name: '#FAF4E4', nameStroke: '#141432',
    stitch: 'black',
  },
  chart: {
    pattern: 'sj-chart-pattern.png', crest: 'fox-crest-navy.png',
    number: '#182642', numberStroke: '#DFE2D7', name: '#182642', nameStroke: '#DFE2D7',
    stitch: 'white',
  },
};

// Shared back layout, in 6000-space.
const LAYOUT = {
  crestCenterX: DESIGN / 2,
  crestCenterY: 1083,
  crestWidth: 420,
  numberTop: 1640,   // top of the number block
  numberFont: 2050,  // Oswald cap-height ≈ 0.72em, tuned to match old 143
  numberStrokeW: 26,
  nameTop: 4360,
  nameFont: 430,
  nameStrokeW: 9,
};

export function kitConfig(kit) {
  return KITS[kit] || null;
}
export function isKnownKit(kit) {
  return !!KITS[kit];
}

/** number → at most 3 digits; name → A–Z0–9 space .'- , uppercased, ≤ 14 chars. */
export function sanitize({ name, number }) {
  const num = String(number ?? '').replace(/[^0-9]/g, '').slice(0, 3);
  const nm = String(name ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9 .'-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 14);
  return { name: nm, number: num };
}

let _font = null;
async function oswald() {
  if (_font) return _font;
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((r) => r.text());
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)[1];
  _font = await fetch(url).then((r) => r.arrayBuffer());
  return _font;
}

async function fetchBuf(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${url} -> ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

/**
 * Render the personalized back. Returns a PNG Buffer.
 * @param {{kit:string,name:string,number:string,size?:number}} opts
 */
export async function renderJerseyBack({ kit, name, number, size = 4500 }) {
  const cfg = kitConfig(kit);
  if (!cfg) throw new Error(`unknown kit: ${kit}`);
  const raw = sanitize({ name, number });
  // A partial customization still ships a complete, branded back: a missing
  // number falls back to the brand's "143" (I-love-you) and a missing name to
  // "FAR FOX FC", matching the stock back.
  const clean = { number: raw.number || '143', name: raw.name || 'FAR FOX FC' };
  const s = size / DESIGN; // design-space → render-space scale
  const font = await oswald();

  // Text layer (number + name) via satori → transparent PNG.
  const px = (v) => Math.round(v * s);
  // Name shrinks for longer text so it never runs off the back.
  const nameLen = clean.name.length;
  const nameFontD = nameLen <= 8 ? LAYOUT.nameFont : nameLen <= 11 ? 360 : 300;
  const nameTrackD = nameLen > 11 ? 10 : 20;
  const textTree = {
    type: 'div',
    props: {
      style: { display: 'flex', width: `${size}px`, height: `${size}px`, position: 'relative' },
      children: [
        clean.number && {
          type: 'div',
          props: {
            style: {
              position: 'absolute', top: `${px(LAYOUT.numberTop)}px`, left: '0px', width: `${size}px`,
              display: 'flex', justifyContent: 'center',
              fontFamily: 'Oswald', fontWeight: 700, fontSize: `${px(LAYOUT.numberFont)}px`,
              lineHeight: 1, color: cfg.number,
              // satori draws stroke via -webkit-text-stroke
              WebkitTextStroke: `${px(LAYOUT.numberStrokeW)}px ${cfg.numberStroke}`,
            },
            children: clean.number,
          },
        },
        clean.name && {
          type: 'div',
          props: {
            style: {
              position: 'absolute', top: `${px(LAYOUT.nameTop)}px`, left: '0px', width: `${size}px`,
              display: 'flex', justifyContent: 'center',
              fontFamily: 'Oswald', fontWeight: 700, fontSize: `${px(nameFontD)}px`,
              letterSpacing: `${px(nameTrackD)}px`, lineHeight: 1, color: cfg.name,
              WebkitTextStroke: `${px(LAYOUT.nameStrokeW)}px ${cfg.nameStroke}`,
            },
            children: clean.name,
          },
        },
      ].filter(Boolean),
    },
  };
  const svg = await satori(textTree, {
    width: size, height: size,
    fonts: [{ name: 'Oswald', data: font, weight: 700, style: 'normal' }],
  });
  const textPng = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

  // Crest: fetch, scale, composite at top-centre.
  const crestW = px(LAYOUT.crestWidth);
  const crestBuf = await fetchBuf(`${SITE}/shop/designs/${cfg.crest}`);
  const crest = await sharp(crestBuf).resize({ width: crestW }).toBuffer();
  const crestMeta = await sharp(crest).metadata();
  const crestLeft = Math.round(px(LAYOUT.crestCenterX) - crestW / 2);
  const crestTop = Math.round(px(LAYOUT.crestCenterY) - (crestMeta.height || crestW) / 2);

  // Base pattern → composite crest + text.
  const patternBuf = await fetchBuf(`${SITE}/shop/designs/${cfg.pattern}`);
  return sharp(patternBuf)
    .resize(size, size, { fit: 'cover' })
    .composite([
      { input: crest, left: crestLeft, top: crestTop },
      { input: Buffer.from(textPng), left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}
