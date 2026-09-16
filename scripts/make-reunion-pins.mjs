// Reuse the approved Foxy artwork and the existing Pinterest pack's fonts/palette.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(root, 'out/reunion-pins');
const pins = JSON.parse(readFileSync(resolve(root, 'docs/growth/reunion-pins.json'), 'utf8'));
// Isolate Satori's font caches between images to avoid missing repeated glyphs.
if (!process.argv[3]) {
  for (const pin of pins) {
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), process.argv[2] || '', pin.id], { stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`Could not render ${pin.id}`);
  }
  writeFileSync(resolve(out, 'pins.json'), JSON.stringify(pins, null, 2) + '\n');
  console.log(`Generated ${pins.length} draft pins in ${out}. Not published.`);
  process.exit(0);
}
const fox = `data:image/png;base64,${readFileSync(resolve(root, 'public/brand/foxy-letter-v1.png')).toString('base64')}`;
async function loadFont() {
  // Optional path to an existing Nunito Bold TTF for offline rendering.
  if (process.argv[2]) return readFileSync(resolve(process.argv[2]));
  const fontResponse = await fetch('https://fonts.googleapis.com/css2?family=Nunito:wght@700&display=swap');
  if (!fontResponse.ok) throw new Error(`Font CSS: ${fontResponse.status}`);
  const fontUrl = (await fontResponse.text()).match(/url\((https:[^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error('Missing font URL');
  const fontFile = await fetch(fontUrl);
  if (!fontFile.ok) throw new Error(`Font file: ${fontFile.status}`);
  return fontFile.arrayBuffer();
}
const fonts = [{ name: 'Nunito', weight: 700, style: 'normal', data: await loadFont() }];
const box = (children, style = {}) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children } });
mkdirSync(out, { recursive: true });
for (const [i, pin] of pins.entries()) {
  if (pin.id !== process.argv[3]) continue;
  const tree = box([
    box('farfox / YOUR NEXT VISIT', { fontSize: 27, color: '#A84354', letterSpacing: 2 }),
    box(pin.headline, { fontSize: 82, lineHeight: 1.08, marginTop: 35, letterSpacing: -2 }),
    box(pin.items.map(item => box(item, { fontSize: 35, padding: '21px 24px', background: '#FFFFFF', borderRadius: 20 })), { flexDirection: 'column', gap: 16, marginTop: 42 }),
    { type: 'img', props: { src: fox, width: 360, height: 360, style: { alignSelf: 'center', marginTop: 28 } } },
    box('Get the free visit checklist', { fontSize: 34, marginTop: 'auto' }),
    box('lovefarfox.com', { fontSize: 26, color: '#756579', marginTop: 12 }),
  ], { width: 1000, height: 1500, padding: '60px 64px', flexDirection: 'column', background: ['#FFF5E8', '#F3ECFF', '#FFF0F2'][i], color: '#34243C', fontFamily: 'Nunito', fontWeight: 700 });
  const png = new Resvg(await satori(tree, { width: 1000, height: 1500, fonts })).render().asPng();
  writeFileSync(resolve(out, `${pin.id}.png`), png);
}
