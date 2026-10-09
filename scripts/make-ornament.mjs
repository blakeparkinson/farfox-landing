/**
 * Far Fox Christmas ornament: Printful ceramic heart, 2-side print (catalog 900, variant 23144).
 * The same file prints on both faces. Print file is 978×972 (written at 2×); the design is drawn in
 * that space and previewed through Printful's own heart template so nothing important hits the rim.
 *
 *   node scripts/make-ornament.mjs [--preview out.jpg] [--top "NEW YORK"] [--bottom "LONDON"]
 *
 * Writes public/shop/designs/ornament-2026/ornament-heart.png (the stock design).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { foxyImage } from './foxy-art.mjs';
import { renderOrnamentPng } from '../src/lib/ornamentRender.mjs';

const OUT = new URL('../public/shop/designs/ornament-2026/', import.meta.url);
// Printful template 907656: the heart window sits at (233, 241), 2536×2520, in a 3000 px mockup.
const TEMPLATE = { url: 'https://files.cdn.printful.com/o/upload/api-template/8c/8cecf7c7efa6f0f7a372744cb6e6baf0?v=1748928621', left: 233, top: 241, w: 2536, h: 2520 };

const renderOrnament = async (text) => renderOrnamentPng({ ...text, foxy: await foxyImage('letter') });

async function preview(designs, out) {
  const overlay = Buffer.from(await fetch(TEMPLATE.url).then((r) => r.arrayBuffer()));
  const tiles = [];
  for (const png of designs) {
    const art = await sharp(png).resize(TEMPLATE.w, TEMPLATE.h).toBuffer();
    const full = await sharp({ create: { width: 3000, height: 3000, channels: 4, background: '#f4f1ec' } })
      .composite([{ input: art, left: TEMPLATE.left, top: TEMPLATE.top }, { input: overlay, left: 0, top: 0 }]).png().toBuffer();
    tiles.push(await sharp(full).resize(700).png().toBuffer());
  }
  await sharp({ create: { width: 700 * tiles.length, height: 700, channels: 3, background: '#f4f1ec' } })
    .composite(tiles.map((input, i) => ({ input, left: i * 700, top: 0 }))).jpeg({ quality: 70 }).toFile(out);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const arg = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
  await mkdir(OUT, { recursive: true });
  const stock = await renderOrnament();
  await writeFile(new URL('ornament-heart.png', OUT), stock);
  console.log('[ornament] ornament-heart.png written');
  if (arg('--preview')) {
    const personal = await renderOrnament({ top: arg('--top') || 'NEW YORK', bottom: arg('--bottom') || 'LONDON' });
    await preview([stock, personal], arg('--preview'));
    console.log(`[ornament] preview → ${arg('--preview')}`);
  }
}
