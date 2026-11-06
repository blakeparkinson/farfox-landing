/** Approved Prime Menagerie woodland pocket tee. No tagline.
 * node scripts/make-prime-menagerie-pocket-tee.mjs
 * Self-contained source art is preserved in design/prime-menagerie-pocket-tee/.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const repo = fileURLToPath(new URL('../', import.meta.url));
const out = join(repo, 'design/prime-menagerie-pocket-tee');
await mkdir(out, { recursive: true });
const sources = {
  elephant: join(out, 'sources/elephant.png'),
  scene: join(out, 'woodland-scene.png'),
};
const art = Object.fromEntries(await Promise.all(Object.entries(sources).map(async ([k, p]) =>
  [k, `data:image/png;base64,${(await readFile(p)).toString('base64')}`])));
const fonts = { fontFiles: [join(out, 'sources/BricolageGrotesque-ExtraBold.ttf')], loadSystemFonts: false, defaultFontFamily: 'Bricolage Grotesque' };
const image = (key, x, y, w, h) => `<image href="${art[key]}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
const text = (s, x, y, size, color, spacing = 0) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="${size}" letter-spacing="${spacing}" fill="${color}">${s}</text>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
async function save(name, w, h, body) {
  const renderer = new Resvg(svg(w, h, body), { font: fonts });
  // Outlined lettering and embedded art make the SVG independent of installed fonts.
  // resvg emits xlink:href but omits its namespace declaration in toString().
  const serialized = renderer.toString();
  const outlined = serialized.includes('xmlns:xlink=') ? serialized : serialized.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
  await writeFile(join(out, `${name}.svg`), outlined);
  await sharp(renderer.render().asPng()).withMetadata({ density: 150 }).png().toFile(join(out, `${name}.png`));
}
const animals = image('scene', 135, 600, 1530, 1020);

for (const [tone, ink] of [['light', '#1D5A3D'], ['dark', '#7CC79C']]) {
  const pocket = `<defs><mask id="elephant" mask-type="alpha">${image('elephant', 145, 30, 160, 114)}</mask></defs>
    <rect x="145" y="30" width="160" height="114" fill="${ink}" mask="url(#elephant)"/>
    ${text('Prime', 225, 200, 49, ink)}${text('Menagerie', 225, 250, 49, ink)}`;
  const back = `${text('Prime', 900, 275, 190, ink)}${text('Menagerie', 900, 480, 235, ink)}
    ${animals}
    ${text('primemenagerie.com', 900, 1730, 48, ink, 1)}`;
  await save(`pocket-${tone}`, 450, 300, pocket);
  await save(`back-${tone}`, 1800, 2400, back);
}

const lightBack = await readFile(join(out, 'back-light.svg'), 'utf8');
const lightPocket = await readFile(join(out, 'pocket-light.svg'), 'utf8');
// A proof on a light ground for reviewing ink, scale and the exact approved character art.
const proof = svg(1500, 1400, `<rect width="1500" height="1400" fill="#EEF0EA"/>
  ${text('Prime Menagerie / Pocket tee', 750, 80, 48, '#142019')}
  <rect x="60" y="140" width="570" height="1150" rx="24" fill="#FFFDF8"/>
  <rect x="665" y="140" width="775" height="1150" rx="24" fill="#FFFDF8"/>
  ${text('POCKET', 345, 215, 25, '#1D5A3D', 3)}
  <svg x="120" y="400" width="450" height="300" viewBox="0 0 450 300">${lightPocket.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</svg>
  ${text('3 × 2 in print area', 345, 1175, 26, '#1D5A3D')}
  ${text('BACK', 1052, 215, 25, '#1D5A3D', 3)}
  <svg x="675" y="220" width="755" height="1007" viewBox="0 0 1800 2400">${lightBack.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</svg>
  ${text('Comfort Colors 6030 · White / Butter / True Navy', 750, 1350, 26, '#142019')}`);
await sharp(new Resvg(proof, { font: fonts }).render().asPng()).png().toFile(join(out, 'artwork-proof.png'));
await writeFile(join(out, 'sources.json'), JSON.stringify({ sources, font: fonts.fontFiles[0], density: 150, pocket: [450, 300], back: [1800, 2400], antelopeVariant: 'deep', colors: { light: '#1D5A3D', dark: '#7CC79C' } }, null, 2) + '\n');
console.log(`Wrote pocket and back SVG/PNG files and artwork proof to ${out}`);
