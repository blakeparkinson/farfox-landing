/** Approved Soapbox Derby scene, Prime Menagerie heading, and website. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const dir = new URL('public/shop/designs/soapbox-derby-2026-11/', root);
const design = new URL('design/prime-menagerie-soapbox-derby/', root);
await mkdir(dir, { recursive: true });
const scene = (await readFile(new URL('soapbox-derby.png', design))).toString('base64');
const font = { fontFiles: [new URL('design/prime-menagerie-pocket-tee/sources/BricolageGrotesque-ExtraBold.ttf', root).pathname], loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' };
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const text = (words, y, size, color, spacing = 0) => `<text x="900" y="${y}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${size}" letter-spacing="${spacing}" fill="${color}">${words}</text>`;
const backs = {};
for (const [tone, color] of [['light', '#1D5A3D'], ['dark', '#7CC79C']]) {
  const body = `${text('Prime', 275, 190, color)}${text('Menagerie', 480, 235, color)}<image x="20" y="560" width="1760" height="1173.333333" xlink:href="data:image/png;base64,${scene}"/>${text('primemenagerie.com', 1885, 48, color, 1)}`;
  backs[tone] = body;
  const renderer = new Resvg(svg(1800, 2400, body), { font });
  const serialized = renderer.toString();
  const source = serialized.includes('xmlns:xlink=') ? serialized : serialized.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
  await writeFile(new URL(`back-${tone}.svg`, dir), source);
  await sharp(renderer.render().asPng()).withMetadata({ density: 150 }).png().toFile(new URL(`back-${tone}.png`, dir).pathname);
}
const proof = svg(1800, 2400, `<rect width="1800" height="2400" fill="#FFFDF8"/>${backs.light}`);
await writeFile(new URL('artwork-proof.png', design), new Resvg(proof, { font }).render().asPng());
console.log('Exported both Soapbox Derby backs with heading and website at 150 ppi.');
