/**
 * Same Stars predates the vector kit generator, so its v2 print files carried
 * their own crest (smaller and lower) and a thin back font. This brings it onto
 * the shared crest and the Oswald back every other kit uses, into kits-2026-10/:
 *   sj-stars-front.png   v2 front with the old crest replaced by the shared one
 *   sj-stars-back.png    default back from the live personalized-back renderer
 *   sj-stars-sleeve.png  v2 sleeve, unchanged
 * The old crest is covered with the same pixels from sj-stars-pattern.png,
 * whose star field matches the front there.
 *
 * Usage: node scripts/restyle-stars-kit.mjs
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { CREST, D, crest } from './kit-designs-2026-10.mjs';
import { renderJerseyBack } from '../src/lib/jerseyBack.mjs';

const DESIGNS = new URL('../public/shop/designs/', import.meta.url);
const OUT = new URL('kits-2026-10/', DESIGNS);
// Where the v2 front drew its crest, padded so its anti-aliased edge goes too.
const OLD_CREST = { left: 3360, top: 2285, width: 400, height: 405 };

async function frontWithSharedCrest() {
  const patch = await sharp(new URL('sj-stars-pattern.png', DESIGNS).pathname).extract(OLD_CREST).toBuffer();
  const crestSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${D}" height="${D}">${crest(CREST.x, CREST.y, CREST.w, 'light')}</svg>`;
  const crestPng = Buffer.from(new Resvg(crestSvg, { fitTo: { mode: 'width', value: D } }).render().asPng());
  return sharp(new URL('sj-stars-front-v2.png', DESIGNS).pathname)
    .composite([{ input: patch, left: OLD_CREST.left, top: OLD_CREST.top }, { input: crestPng, left: 0, top: 0 }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await mkdir(OUT, { recursive: true });
await sharp(await frontWithSharedCrest()).toFile(new URL('sj-stars-front.png', OUT).pathname);
const back = await renderJerseyBack({ kit: 'stars', name: '', number: '', size: D });
await sharp(back).png({ compressionLevel: 9 }).toFile(new URL('sj-stars-back.png', OUT).pathname);
await copyFile(new URL('sj-stars-sleeve-v2.png', DESIGNS), new URL('sj-stars-sleeve.png', OUT));
console.log('[stars] front, back, sleeve written to kits-2026-10/');
