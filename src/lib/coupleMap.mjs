import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

export const DIGITAL_MAP_SKU = 'farfox-personalized-distance-map';
export const DIGITAL_MAP_PRICE = 19;

export const MAP_PALETTES = {
  sunset: { label: 'Sunset', bg: '#FFF4E6', land: '#E9B7B7', ink: '#382551', accent: '#F2607E', line: '#B76CFD' },
  midnight: { label: 'Midnight', bg: '#17142D', land: '#494267', ink: '#FFF8EE', accent: '#FF7F9A', line: '#D49BFF' },
  ocean: { label: 'Ocean', bg: '#EAF8F6', land: '#A8D8D1', ink: '#193B4A', accent: '#F26B78', line: '#298EA0' },
  lavender: { label: 'Lavender', bg: '#F5EEFF', land: '#D9C5EA', ink: '#3D2858', accent: '#FF6B8A', line: '#8B63C7' },
};

const CONTINENTS = [
  'M92 185 L70 128 103 75 172 55 228 82 262 126 238 164 201 178 185 224 153 248 118 224 Z',
  'M225 282 L260 246 299 264 319 323 300 389 270 447 246 405 249 348 Z',
  'M424 122 L463 84 532 82 570 111 626 98 704 123 762 158 752 204 700 215 673 267 625 276 591 247 552 251 514 216 462 205 436 170 Z',
  'M470 239 L526 229 573 267 584 333 553 411 509 446 476 391 454 314 Z',
  'M757 333 L805 302 869 321 900 364 871 411 808 415 773 384 Z',
  'M344 92 L372 70 400 78 410 108 378 124 Z',
];

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const clean = (value, max = 60) => String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
const coordinate = (value, min, max) => {
  const n = Number(value);
  return Number.isFinite(n) ? clamp(n, min, max) : 0;
};

export function sanitizeMapInput(input = {}) {
  const palette = MAP_PALETTES[input.palette] ? input.palette : 'sunset';
  return {
    from: clean(input.from, 60) || 'Your city',
    to: clean(input.to, 60) || 'Their city',
    fromLat: coordinate(input.fromLat, -90, 90),
    fromLon: coordinate(input.fromLon, -180, 180),
    toLat: coordinate(input.toLat, -90, 90),
    toLon: coordinate(input.toLon, -180, 180),
    names: clean(input.names, 50) || 'Us',
    message: clean(input.message, 90) || 'No distance is too far for love.',
    date: clean(input.date, 30),
    palette,
  };
}

export function mapInputFromCustomFields(fields = []) {
  const values = Object.fromEntries(
    fields.map((field) => [String(field.name || '').toLowerCase(), field.value]),
  );
  return sanitizeMapInput({
    from: values.from,
    to: values.to,
    fromLat: values['from latitude'],
    fromLon: values['from longitude'],
    toLat: values['to latitude'],
    toLon: values['to longitude'],
    names: values.names,
    message: values.message,
    date: values.date,
    palette: values.palette,
  });
}

function point(lat, lon) {
  return {
    x: 55 + ((lon + 180) / 360) * 890,
    y: 285 + ((90 - lat) / 180) * 500,
  };
}

let fontPromise;
async function loadFont() {
  if (!fontPromise) {
    fontPromise = fetch(
      'https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    )
      .then((response) => response.text())
      .then(async (css) => {
        const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]);
        if (!urls.length) throw new Error('Nunito font URL not found');
        return Promise.all(urls.slice(-3).map((url) => fetch(url).then((response) => response.arrayBuffer())));
      });
  }
  return fontPromise;
}

const text = (value, style = {}) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: value },
});

export async function renderCoupleMap(rawInput, width = 4800) {
  const input = sanitizeMapInput(rawInput);
  const palette = MAP_PALETTES[input.palette];
  const height = Math.round(width * 1.25);
  const scale = width / 1000;
  const a = point(input.fromLat, input.fromLon);
  const b = point(input.toLat, input.toLon);
  const curveY = Math.min(a.y, b.y) - Math.max(45, Math.abs(a.x - b.x) * 0.12);
  const [regular, bold, black] = await loadFont();

  const art = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: palette.bg,
        color: palette.ink,
        fontFamily: 'Nunito',
        overflow: 'hidden',
      },
      children: [
        text('UNDER THE SAME SKY', {
          marginTop: 105 * scale,
          fontSize: 22 * scale,
          fontWeight: 900,
          letterSpacing: 8 * scale,
          color: palette.accent,
        }),
        text(input.names, {
          marginTop: 25 * scale,
          maxWidth: 850 * scale,
          fontSize: 66 * scale,
          lineHeight: 1.05,
          fontWeight: 900,
          textAlign: 'center',
          justifyContent: 'center',
        }),
        {
          type: 'svg',
          props: {
            width,
            height: 700 * scale,
            viewBox: '0 0 1000 875',
            style: { position: 'absolute', top: 215 * scale, left: 0 },
            children: [
              ...CONTINENTS.map((d) => ({
                type: 'path',
                props: { d, fill: palette.land, stroke: palette.ink, strokeWidth: 2, opacity: 0.72 },
              })),
              {
                type: 'path',
                props: {
                  d: `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${curveY} ${b.x} ${b.y}`,
                  fill: 'none',
                  stroke: palette.line,
                  strokeWidth: 7,
                  strokeDasharray: '14 12',
                  strokeLinecap: 'round',
                },
              },
              ...[a, b].flatMap((p) => [
                { type: 'circle', props: { cx: p.x, cy: p.y, r: 18, fill: palette.bg, stroke: palette.accent, strokeWidth: 8 } },
                { type: 'circle', props: { cx: p.x, cy: p.y, r: 7, fill: palette.accent } },
              ]),
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: 820 * scale,
              left: 65 * scale,
              right: 65 * scale,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 30 * scale,
            },
            children: [
              text(input.from, { width: 410 * scale, fontSize: 27 * scale, fontWeight: 900, lineHeight: 1.1 }),
              text(input.to, { width: 410 * scale, fontSize: 27 * scale, fontWeight: 900, lineHeight: 1.1, textAlign: 'right', justifyContent: 'flex-end' }),
            ],
          },
        },
        text(input.message, {
          position: 'absolute',
          top: 950 * scale,
          left: 90 * scale,
          right: 90 * scale,
          justifyContent: 'center',
          textAlign: 'center',
          fontSize: 35 * scale,
          lineHeight: 1.25,
          fontWeight: 700,
        }),
        input.date && text(input.date, {
          position: 'absolute',
          top: 1080 * scale,
          left: 0,
          right: 0,
          justifyContent: 'center',
          fontSize: 22 * scale,
          fontWeight: 700,
          letterSpacing: 4 * scale,
          color: palette.accent,
        }),
        text('FAR FOX · MADE FOR THE MILES BETWEEN YOU', {
          position: 'absolute',
          bottom: 54 * scale,
          left: 0,
          right: 0,
          justifyContent: 'center',
          fontSize: 14 * scale,
          fontWeight: 900,
          letterSpacing: 3 * scale,
          opacity: 0.65,
        }),
      ],
    },
  };

  const svg = await satori(art, {
    width,
    height,
    fonts: [
      { name: 'Nunito', data: regular, weight: 400, style: 'normal' },
      { name: 'Nunito', data: bold, weight: 700, style: 'normal' },
      { name: 'Nunito', data: black, weight: 900, style: 'normal' },
    ],
  });
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
}
