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
  // --- Concept soccer kits (cat 644) ---
  twilight: {
    pattern: 'sj-twilight-pattern.png', crest: 'fox-crest.png',
    number: '#FAEEC8', numberStroke: '#1C1634', name: '#FAEEC8', nameStroke: '#1C1634',
  },
  flight: {
    pattern: 'sj-flight-pattern.png', crest: 'fox-crest-navy.png',
    number: '#1C1A2E', numberStroke: '#F5F1E7', name: '#1C1A2E', nameStroke: '#F5F1E7',
  },
  stars: {
    pattern: 'sj-stars-pattern.png', crest: 'fox-crest.png',
    number: '#FAF4E4', numberStroke: '#141432', name: '#FAF4E4', nameStroke: '#141432',
  },
  chart: {
    pattern: 'sj-chart-pattern.png', crest: 'fox-crest-navy.png',
    number: '#182642', numberStroke: '#DFE2D7', name: '#182642', nameStroke: '#DFE2D7',
  },
  // --- Original soccer kits (cat 644) ---
  orange: {
    pattern: 'sj-orange-pattern.png', crest: 'fox-crest.png',
    number: '#FAF1E2', numberStroke: '#14213A', name: '#FAF1E2', nameStroke: '#14213A',
  },
  white: {
    pattern: 'sj-white-pattern.png', crest: 'fox-crest-navy.png',
    number: '#14213A', numberStroke: '#FFFFFF', name: '#14213A', nameStroke: '#FFFFFF',
  },
  champions: {
    pattern: 'sj-navy-pattern.png', crest: 'fox-crest.png',
    number: '#FAF1E2', numberStroke: '#E2632E', name: '#FAF1E2', nameStroke: '#E2632E',
  },
  // --- Baseball kits (cat 792): slab font, baseball layout, no top crest ---
  'bb-red': {
    bg: '#BC2832', crest: null, layout: 'baseball', font: 'slab',
    number: '#F4ECE0', numberStroke: '#1B2A6B', name: '#F4ECE0', nameStroke: '#1B2A6B',
  },
  'bb-royal': {
    bg: '#143A8C', crest: null, layout: 'baseball', font: 'slab',
    number: '#F4ECE0', numberStroke: '#C0202E', name: '#F4ECE0', nameStroke: '#C0202E',
  },
  'bb-home': {
    pattern: 'bb-home-pattern.png', crest: null, layout: 'baseball', font: 'slab',
    number: '#1C4096', numberStroke: '#C0202E', name: '#1C4096', nameStroke: '#C0202E',
  },
};

// Back layouts, in 6000-space. Soccer: small crest top, big number, name low.
// Baseball: no crest, chunkier slab number higher up, short "FAR FOX" line.
const LAYOUTS = {
  soccer: {
    crestCenterX: DESIGN / 2, crestCenterY: 1083, crestWidth: 420,
    numberTop: 1640, numberFont: 2050, numberStrokeW: 26,
    nameTop: 4360, nameFont: 430, nameStrokeW: 9, nameDefault: 'FAR FOX FC',
  },
  baseball: {
    crestCenterX: DESIGN / 2, crestCenterY: 0, crestWidth: 0,
    numberTop: 1820, numberFont: 1850, numberStrokeW: 30,
    nameTop: 3520, nameFont: 360, nameStrokeW: 7, nameDefault: 'FAR FOX',
  },
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

// Athletic condensed for soccer; slab serif for baseball (open-licensed,
// serverless-safe stand-ins for DIN Condensed / Rockwell).
const FONT_FAMILY = { oswald: 'Oswald', slab: 'Roboto Slab' };
const FONT_CSS = {
  oswald: 'https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap',
  slab: 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@700&display=swap',
};
const _fonts = {};
async function loadFont(key) {
  if (_fonts[key]) return _fonts[key];
  const css = await fetch(FONT_CSS[key], { headers: { 'User-Agent': 'Mozilla/5.0' } }).then((r) => r.text());
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)[1];
  _fonts[key] = await fetch(url).then((r) => r.arrayBuffer());
  return _fonts[key];
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
  const L = LAYOUTS[cfg.layout || 'soccer'];
  const fontKey = cfg.font || 'oswald';
  const fontFamily = FONT_FAMILY[fontKey];
  const raw = sanitize({ name, number });
  // A partial customization still ships a complete, branded back: a missing
  // number falls back to the brand's "143" (I-love-you) and a missing name to
  // the layout's default ("FAR FOX FC" / "FAR FOX"), matching the stock back.
  const clean = { number: raw.number || '143', name: raw.name || L.nameDefault };
  const s = size / DESIGN; // design-space → render-space scale
  const font = await loadFont(fontKey);

  // Text layer (number + name) via satori → transparent PNG.
  const px = (v) => Math.round(v * s);
  // Name shrinks for longer text so it never runs off the back.
  const nameLen = clean.name.length;
  const nameFontD = nameLen <= 8 ? L.nameFont : nameLen <= 11 ? L.nameFont * 0.84 : L.nameFont * 0.7;
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
              position: 'absolute', top: `${px(L.numberTop)}px`, left: '0px', width: `${size}px`,
              display: 'flex', justifyContent: 'center',
              fontFamily, fontWeight: 700, fontSize: `${px(L.numberFont)}px`,
              lineHeight: 1, color: cfg.number,
              // satori draws stroke via -webkit-text-stroke
              WebkitTextStroke: `${px(L.numberStrokeW)}px ${cfg.numberStroke}`,
            },
            children: clean.number,
          },
        },
        clean.name && {
          type: 'div',
          props: {
            style: {
              position: 'absolute', top: `${px(L.nameTop)}px`, left: '0px', width: `${size}px`,
              display: 'flex', justifyContent: 'center',
              fontFamily, fontWeight: 700, fontSize: `${px(nameFontD)}px`,
              letterSpacing: `${px(nameTrackD)}px`, lineHeight: 1, color: cfg.name,
              WebkitTextStroke: `${px(L.nameStrokeW)}px ${cfg.nameStroke}`,
            },
            children: clean.name,
          },
        },
      ].filter(Boolean),
    },
  };
  const svg = await satori(textTree, {
    width: size, height: size,
    fonts: [{ name: fontFamily, data: font, weight: 700, style: 'normal' }],
  });
  const textPng = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();

  // Base: hosted pattern, or a solid colour fill for the plain baseball kits.
  const base = cfg.pattern
    ? sharp(await fetchBuf(`${SITE}/shop/designs/${cfg.pattern}`)).resize(size, size, { fit: 'cover' })
    : sharp({ create: { width: size, height: size, channels: 4, background: cfg.bg } });

  const layers = [];
  // Optional crest at top-centre (soccer kits only).
  if (cfg.crest && L.crestWidth) {
    const crestW = px(L.crestWidth);
    const crest = await sharp(await fetchBuf(`${SITE}/shop/designs/${cfg.crest}`))
      .resize({ width: crestW }).toBuffer();
    const meta = await sharp(crest).metadata();
    layers.push({
      input: crest,
      left: Math.round(px(L.crestCenterX) - crestW / 2),
      top: Math.round(px(L.crestCenterY) - (meta.height || crestW) / 2),
    });
  }
  layers.push({ input: Buffer.from(textPng), left: 0, top: 0 });

  return base.composite(layers).png().toBuffer();
}
