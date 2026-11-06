/** Place the approved Bowling Club art on the Comfort Colors 1566 DTG print areas. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const design = new URL('design/prime-menagerie-bowling-club/', root);
const output = new URL('public/shop/designs/bowling-club-2026-11/', root);
await mkdir(output, { recursive: true });
const font = { fontFiles: [new URL('design/prime-menagerie-pocket-tee/sources/BricolageGrotesque-ExtraBold.ttf', root).pathname], loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' };
const cream = '#F2E4C4';
const scene = (await readFile(new URL('bowling-scene.png', design))).toString('base64');
const badge = (await readFile(new URL('chest-badge.svg', design), 'utf8')).replaceAll('#f2e4c4', '#ffffff').replaceAll('#294c3b', '#000000');
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1800" height="2400" viewBox="0 0 1800 2400">${body}</svg>`;
const text = (words, y, size, spacing = 0) => `<text x="900" y="${y}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${size}" letter-spacing="${spacing}" fill="${cream}">${words}</text>`;
const back = `${text('PRIME MENAGERIE',180,143)}${text('BOWLING CLUB',300,82,9)}<path d="M155 272H440M1360 272H1645" fill="none" stroke="${cream}" stroke-width="5"/><image x="20" y="365" width="1760" height="1173.333333" xlink:href="data:image/png;base64,${scene}"/>${text('primemenagerie.com',1650,48,1)}`;
// A full-area file locks the small badge to the wearer's left chest. Knockouts reveal the actual fabric.
const front = `<defs><mask id="badge-cutout" mask-type="luminance"><g transform="translate(1080 80) scale(${525/900})">${badge}</g></mask></defs><rect width="1800" height="2400" fill="${cream}" mask="url(#badge-cutout)"/>`;
for (const [name, body] of [['front',front],['back',back]]) {
  const renderer = new Resvg(svg(body), { font });
  let outlined = renderer.toString();
  if (!outlined.includes('xmlns:xlink=')) outlined = outlined.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
  await writeFile(new URL(`${name}.svg`, output), outlined);
  await sharp(renderer.render().asPng()).withMetadata({ density: 150 }).png().toFile(new URL(`${name}.png`, output).pathname);
  await writeFile(new URL(`${name}-production-proof.png`, design), new Resvg(svg(`<rect width="1800" height="2400" fill="#4c6151"/>${body}`), { font }).render().asPng());
}
console.log('Exported front and back at 1800 × 2400, 150 ppi. Back scene 11.73 in wide; chest badge 3.5 in canvas.');
