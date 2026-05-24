/**
 * TikTok profile picture — 800x800 PNG, branded background with the
 * heart-eye Foxy face centered. Renders at a size TikTok will downsample
 * cleanly to the small circular avatar slot.
 *
 * Run:
 *   cd farfox-landing && node scripts/make-tiktok-pfp.mjs
 *
 * Output: ./out/tiktok-pfp.png
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');
const OUT_DIR = resolve(__dirname, '../out');
const W = 800;
const H = 800;

const FOX_FACE = `data:image/png;base64,${readFileSync(resolve(PUBLIC_DIR, 'fox-face.png')).toString('base64')}`;

async function loadFonts() {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((r) => r.text());
  const ttfs = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
  const url = ttfs[0] || [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1])[0];
  return await fetch(url).then((r) => r.arrayBuffer());
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const nunito900 = await loadFonts();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Brand gradient applied directly to the root — satori drops
          // siblings with no content, so we can't layer the background
          // as a separate absolute div the way browser CSS would.
          background:
            'linear-gradient(135deg, #FF6B8A 0%, #B76CFD 55%, #FF9A5C 100%)',
        },
        children: [
          // Soft white halo behind the fox — gives it a "spotlight"
          // feel and makes the cream face read clearly against the
          // saturated background.
          {
            type: 'div',
            props: {
              style: {
                width: 640,
                height: 640,
                borderRadius: 9999,
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.10) 60%, rgba(255,255,255,0) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
              children: [
                {
                  type: 'img',
                  props: {
                    src: FOX_FACE,
                    width: 560,
                    height: 560,
                    style: {
                      filter: 'drop-shadow(0 18px 32px rgba(45,27,78,0.40))',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: W,
      height: H,
      fonts: [{ name: 'Nunito', data: nunito900, weight: 900, style: 'normal' }],
    },
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } })
    .render()
    .asPng();

  const outPath = resolve(OUT_DIR, 'tiktok-pfp.png');
  writeFileSync(outPath, png);
  console.log(`✓ Profile image at: ${outPath} (${W}x${H})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
