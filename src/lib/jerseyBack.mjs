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
  dropzone: {
    pattern: 'sj-dropzone-pattern.png', crest: 'fox-crest.png',
    number: '#FDE047', numberStroke: '#0A102C', name: '#F5F3FF', nameStroke: '#0A102C',
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

// Back layouts, in 6000-space. The brand line ("FAR FOX FC" / "FAR FOX") is
// ALWAYS kept at the bottom; the customer's name sits in the nameplate ABOVE
// the number (like a real kit). Soccer keeps the small crest up top; baseball
// has none.
const LAYOUTS = {
  soccer: {
    crestCenterX: DESIGN / 2, crestCenterY: 900, crestWidth: 360,
    nameTop: 1470, nameFont: 360, nameStrokeW: 7,      // customer name (nameplate)
    numberTop: 1980, numberFont: 1820, numberStrokeW: 24,
    brandTop: 4360, brandFont: 360, brandStrokeW: 7, brand: 'FAR FOX FC',
  },
  baseball: {
    crestCenterX: DESIGN / 2, crestCenterY: 0, crestWidth: 0,
    nameTop: 1320, nameFont: 320, nameStrokeW: 6,
    numberTop: 1760, numberFont: 1720, numberStrokeW: 28,
    brandTop: 3520, brandFont: 360, brandStrokeW: 7, brand: 'FAR FOX',
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
  // A missing number falls back to the brand's "143" (I-love-you). The brand
  // line is always shown; the customer name (if any) goes in the nameplate.
  const number_ = raw.number || '143';
  const custName = raw.name; // may be empty
  const s = size / DESIGN; // design-space → render-space scale
  const font = await loadFont(fontKey);

  const px = (v) => Math.round(v * s);
  // A centred text line at the given design-space top/font/stroke.
  const line = (text, top, fontD, strokeW, color, stroke, track = 20) => ({
    type: 'div',
    props: {
      style: {
        position: 'absolute', top: `${px(top)}px`, left: '0px', width: `${size}px`,
        display: 'flex', justifyContent: 'center',
        fontFamily, fontWeight: 700, fontSize: `${px(fontD)}px`,
        letterSpacing: `${px(track)}px`, lineHeight: 1, color,
        WebkitTextStroke: `${px(strokeW)}px ${stroke}`, // satori stroke
      },
      children: text,
    },
  });
  // Nameplate font shrinks for longer names so it never runs off the back.
  const nl = custName.length;
  const nameFontD = nl <= 8 ? L.nameFont : nl <= 11 ? L.nameFont * 0.84 : L.nameFont * 0.7;
  const textTree = {
    type: 'div',
    props: {
      style: { display: 'flex', width: `${size}px`, height: `${size}px`, position: 'relative' },
      children: [
        line(number_, L.numberTop, L.numberFont, L.numberStrokeW, cfg.number, cfg.numberStroke, 0),
        custName && line(custName, L.nameTop, nameFontD, L.nameStrokeW, cfg.name, cfg.nameStroke, nl > 11 ? 10 : 20),
        line(L.brand, L.brandTop, L.brandFont, L.brandStrokeW, cfg.name, cfg.nameStroke, 20),
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
