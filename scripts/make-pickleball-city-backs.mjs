/** Native typography around generated transparent city scenes; no repainting of the artwork. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
const root = new URL('../', import.meta.url);
const font = { fontFiles: [new URL('design/prime-menagerie-pocket-tee/sources/BricolageGrotesque-ExtraBold.ttf', root).pathname], loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' };
const design = new URL('design/prime-menagerie-pickleball-cities/', root);
for (const [key, label] of [['portland', 'PORTLAND, MAINE'], ['new-orleans', 'NEW ORLEANS']]) {
  const out = new URL(`public/shop/designs/pickleball-cities-2026-11/${key}/`, root);
  await mkdir(out, { recursive: true });
  const source = await readFile(new URL(`${key}-scene.png`, design));
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let clear = 0;
  for (let i = 3; i < data.length; i += info.channels) if (data[i] === 0) clear++;
  if (clear / (info.width * info.height) < 0.18) throw Error(`${key}: source has insufficient transparent negative space`);
  const scene = source.toString('base64');
  for (const [tone, ink, ground] of [['cream', '#F2E4C4', '#4c6151'], ['forest', '#18392F', '#ffdc8f']]) {
    const text = (words, y, size, spacing = 0) => `<text x="900" y="${y}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${size}" letter-spacing="${spacing}" fill="${ink}">${words}</text>`;
    const body = `<g transform="scale(1.25)">${text('PRIME MENAGERIE', 180, 143)}${text('PICKLEBALL CLUB', 300, 72, 5)}<path d="M155 272H330M1470 272H1645" stroke="${ink}" stroke-width="5"/>${text(label, 393, 52, 6)}<image x="0" y="445" width="1800" height="1200" xlink:href="data:image/png;base64,${scene}"/>${text('primemenagerie.com', 1755, 48, 1)}</g>`;
    const svg = content => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="2250" height="2700" viewBox="0 0 2250 2700">${content}</svg>`;
    const renderer = new Resvg(svg(body), { font });
    let outlined = renderer.toString();
    if (!outlined.includes('xmlns:xlink=')) outlined = outlined.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
    await writeFile(new URL(`back-${tone}.svg`, out), outlined);
    await sharp(renderer.render().asPng()).withMetadata({ density: 150 }).png().toFile(new URL(`back-${tone}.png`, out).pathname);
    await writeFile(new URL(`${key}-${tone}-proof.png`, design), new Resvg(svg(`<rect width="2250" height="2700" fill="${ground}"/>${body}`), { font }).render().asPng());
  }
  console.log(`${key}: ${info.width}×${info.height} source, ${(100 * clear / (info.width * info.height)).toFixed(1)}% fully transparent; 15-inch print files ready`);
}
