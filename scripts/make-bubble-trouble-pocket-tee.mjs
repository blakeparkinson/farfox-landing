/** Export the corrected scene with the restored Prime Menagerie heading. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const dir = new URL('public/shop/designs/bubble-trouble-2026-11/', root);
const design = new URL('design/bubble-trouble-pocket-tee/', root);
await mkdir(dir, { recursive: true });
const scene = (await readFile(new URL('scene.png', design))).toString('base64');
const elephant = (await readFile(new URL('design/prime-menagerie-pocket-tee/sources/elephant.png', root))).toString('base64');
const font = { fontFiles: [new URL('design/prime-menagerie-pocket-tee/sources/BricolageGrotesque-ExtraBold.ttf', root).pathname], loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' };
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const heading = (words, y, size, color) => `<text x="900" y="${y}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${size}" fill="${color}">${words}</text>`;
const scenes = {};
for (const [tone, color] of [['light', '#1D5A3D'], ['dark', '#7CC79C']]) {
  scenes[`back-${tone}`] = [1800, 2400, `${heading('Prime', 275, 190, color)}${heading('Menagerie', 480, 235, color)}<image x="20" y="560" width="1760" height="1173.333333" xlink:href="data:image/png;base64,${scene}"/>`];
  scenes[`pocket-${tone}`] = [450, 300, `<defs><mask id="mark" mask-type="alpha"><image x="115" y="50" width="220" height="160" xlink:href="data:image/png;base64,${elephant}"/></mask></defs><rect x="115" y="50" width="220" height="160" fill="${color}" mask="url(#mark)"/>`];
}
for (const [name, [w, h, body]] of Object.entries(scenes)) {
  const renderer = new Resvg(svg(w, h, body), { font });
  const serialized = renderer.toString();
  const source = name.startsWith('pocket-') ? svg(w, h, body) : (serialized.includes('xmlns:xlink=') ? serialized : serialized.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" '));
  await writeFile(new URL(`${name}.svg`, dir), source);
  await sharp(renderer.render().asPng()).withMetadata({ density: 150 }).png().toFile(new URL(`${name}.png`, dir).pathname);
}
// Exact artwork proof. Heading lettering is outlined in the production SVGs.
const proof = svg(1800, 1500, `<rect width="1800" height="1500" fill="#FFFDF8"/><svg x="900" y="20" width="880" height="1173.333333" viewBox="0 0 1800 2400">${scenes['back-light'][2]}</svg><svg x="200" y="350" width="450" height="300" viewBox="0 0 450 300">${scenes['pocket-light'][2]}</svg>`);
await writeFile(new URL('artwork-proof.png', design), new Resvg(proof, { font }).render().asPng());
console.log('Exported 1800 × 2400 back and 450 × 300 pocket PNGs at 150 ppi.');
