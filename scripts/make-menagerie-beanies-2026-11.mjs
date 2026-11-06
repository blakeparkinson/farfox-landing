/** Place the approved mascot artwork in Printful's 5 × 1.75 inch cuff template. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const design = join(root, 'design/menagerie-beanies-2026-11');
const out = join(root, 'public/shop/designs/menagerie-beanies-2026-11');
await mkdir(out, { recursive: true });
const font = { fontFiles: [join(root, 'design/prime-menagerie-pocket-tee/sources/BricolageGrotesque-ExtraBold.ttf')], loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' };
const W = 1500, H = 525;
const wrap = body => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
async function illustration(name, top, height) {
  const bytes = await readFile(join(design, `sources/${name}.png`));
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let left = info.width, right = 0, upper = info.height, lower = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 16) {
      left = Math.min(left, x); right = Math.max(right, x); upper = Math.min(upper, y); lower = Math.max(lower, y);
    }
  }
  const width = right - left + 1, sourceHeight = lower - upper + 1;
  const displayWidth = height * width / sourceHeight;
  if (displayWidth > W - 24) throw new Error('Artwork exceeds cuff width.');
  return `<svg x="${(W - displayWidth) / 2}" y="${top}" width="${displayWidth}" height="${height}" viewBox="${left} ${upper} ${width} ${sourceHeight}"><image href="data:image/png;base64,${bytes.toString('base64')}" width="${info.width}" height="${info.height}"/></svg>`;
}
const art = {
  antelope: await illustration('antelope', 12, 501),
  'yak-chair': `${await illustration('yak-chair', 8, 386)}<text x="750" y="505" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="116" letter-spacing="2" fill="#FFF1D4" stroke="#07152F" stroke-width="4" paint-order="stroke fill">SCAN YAK</text>`,
};
for (const [name, body] of Object.entries(art)) {
  const renderer = new Resvg(wrap(body), { font });
  let svg = renderer.toString();
  if (!svg.includes('xmlns:xlink=')) svg = svg.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
  await writeFile(join(out, `${name}.svg`), svg);
  await sharp(renderer.render().asPng()).withMetadata({ density: 300 }).png().toFile(join(out, `${name}.png`));
  const proof = new Resvg(wrap(`<rect width="1500" height="525" fill="${name === 'antelope' ? '#D1D3D7' : '#11131A'}"/>${body}`), { font });
  await writeFile(join(design, `${name}-proof.png`), proof.render().asPng());
}
console.log('Wrote transparent 1500 × 525 PNGs at 300 dpi, outlined SVGs, and placement proofs.');
