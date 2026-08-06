/**
 * Generate Etsy listing images, a redemption guide, and a short vertical ad.
 * Output is intentionally gitignored under out/digital-map-launch.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { renderCoupleMap } from '../src/lib/coupleMap.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'out/digital-map-launch');
const listingDir = resolve(out, 'etsy-listing');
const videoDir = resolve(out, 'video-frames');
const colors = { pink: '#FF6B8A', purple: '#B76CFD', ink: '#2D1B4E', muted: '#6B5B7B', cream: '#FFF5F0' };

const sampleInput = {
  from: 'New York, USA', to: 'London, UK',
  fromLat: 40.7128, fromLon: -74.006,
  toLat: 51.5072, toLon: -0.1276,
  names: 'Alex & Jordan',
  message: 'Same sky. Different cities. Still us.',
  date: 'EST. 2024',
};

const dataUrl = (buffer) => `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
const text = (value, style = {}) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children: value } });

async function loadFonts() {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  }).then((response) => response.text());
  const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]);
  const loaded = await Promise.all(urls.slice(-3).map((url) => fetch(url).then((response) => response.arrayBuffer())));
  return [
    { name: 'Nunito', data: loaded[0], weight: 400, style: 'normal' },
    { name: 'Nunito', data: loaded[Math.min(1, loaded.length - 1)], weight: 700, style: 'normal' },
    { name: 'Nunito', data: loaded[Math.min(2, loaded.length - 1)], weight: 900, style: 'normal' },
  ];
}

function base(width, height, children, background = 'linear-gradient(145deg,#FFF7E9,#FFDCE5 55%,#E9D9FF)') {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%', display: 'flex', position: 'relative',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: width * 0.06, fontFamily: 'Nunito', color: colors.ink, background,
      },
      children,
    },
  };
}

function badge(value) {
  return text(value, {
    padding: '16px 32px', borderRadius: 999, background: 'rgba(255,255,255,.82)',
    color: colors.pink, fontSize: 27, fontWeight: 900, letterSpacing: 4, marginBottom: 30,
  });
}

function footer() {
  return text('FAR FOX · DIGITAL DOWNLOAD', {
    position: 'absolute', bottom: 42, left: 0, right: 0, justifyContent: 'center',
    fontSize: 22, fontWeight: 900, letterSpacing: 3, color: colors.muted,
  });
}

async function png(node, width, height, fonts, path) {
  const svg = await satori(node, { width, height, fonts });
  writeFileSync(path, new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
}

async function main() {
  if (existsSync(out)) rmSync(out, { recursive: true });
  mkdirSync(listingDir, { recursive: true });
  mkdirSync(videoDir, { recursive: true });
  const fonts = await loadFonts();
  const mapBuffers = await Promise.all(['sunset', 'midnight', 'ocean', 'lavender'].map(
    (palette) => renderCoupleMap({ ...sampleInput, palette }, 800),
  ));
  const maps = mapBuffers.map(dataUrl);

  const cards = [
    [badge('PERSONALIZED FOR YOU'), { type: 'img', props: { src: maps[0], width: 900, height: 1125, style: { objectFit: 'contain', borderRadius: 20, boxShadow: '0 35px 70px rgba(45,27,78,.2)' } } }, text('Two places. One story.', { fontSize: 72, fontWeight: 900, marginTop: 38 }), footer()],
    [badge('YOUR TWO LOCATIONS'), text('From here', { fontSize: 88, fontWeight: 900 }), text('to there', { fontSize: 88, fontWeight: 900, color: colors.pink }), text('Connected by the route only your relationship could take.', { width: 1400, fontSize: 43, lineHeight: 1.3, textAlign: 'center', justifyContent: 'center', marginTop: 45 }), footer()],
    [badge('MAKE EVERY DETAIL YOURS'), text('Cities', { fontSize: 78, fontWeight: 900 }), text('Names · Date · Message', { fontSize: 62, fontWeight: 900, color: colors.pink, marginTop: 22 }), text('Preview the finished map live before you buy.', { fontSize: 40, color: colors.muted, marginTop: 45 }), footer()],
    [badge('FOUR COLOR PALETTES'), { type: 'div', props: { style: { display: 'flex', flexWrap: 'wrap', gap: 28, width: 1150, justifyContent: 'center' }, children: maps.map((src) => ({ type: 'img', props: { src, width: 500, height: 625, style: { objectFit: 'contain', borderRadius: 14, boxShadow: '0 18px 36px rgba(45,27,78,.15)' } } })) } }, footer()],
    [badge('READY IN MINUTES'), text('No shipping.', { fontSize: 94, fontWeight: 900 }), text('No waiting.', { fontSize: 94, fontWeight: 900, color: colors.pink }), text('Your protected print-ready download appears immediately after payment.', { width: 1350, fontSize: 42, lineHeight: 1.3, textAlign: 'center', justifyContent: 'center', marginTop: 45 }), footer()],
    [badge('PRINT-READY 4:5 FILE'), text('8 × 10', { fontSize: 106, fontWeight: 900 }), text('12 × 15   ·   16 × 20', { fontSize: 63, fontWeight: 900, color: colors.pink, marginTop: 24 }), text('One high-resolution 4800 × 6000 PNG for home or professional printing.', { width: 1350, fontSize: 40, lineHeight: 1.3, textAlign: 'center', justifyContent: 'center', marginTop: 45 }), footer()],
    [badge('A GIFT THAT IS ONLY THEIRS'), text('Anniversary', { fontSize: 76, fontWeight: 900 }), text('Birthday · Deployment · Reunion', { fontSize: 52, fontWeight: 900, color: colors.pink, marginTop: 20 }), text('Or simply because the distance feels heavy today.', { fontSize: 40, color: colors.muted, marginTop: 45 }), footer()],
    [badge('HOW IT WORKS'), ...['1  Add your two places', '2  Personalize the words', '3  Preview and download'].map((line) => text(line, { width: 1250, padding: '30px 42px', borderRadius: 28, background: 'rgba(255,255,255,.78)', fontSize: 48, fontWeight: 900, marginTop: 22 })), footer()],
    [badge('DIGITAL PRODUCT'), text('Nothing is shipped.', { fontSize: 84, fontWeight: 900 }), text('Print locally. Gift globally.', { fontSize: 57, fontWeight: 900, color: colors.pink, marginTop: 28 }), text('Perfect when your person is on the other side of the world—or your gift deadline is tonight.', { width: 1400, fontSize: 40, lineHeight: 1.3, textAlign: 'center', justifyContent: 'center', marginTop: 45 }), footer()],
    [badge('MADE FOR LONG-DISTANCE LOVE'), { type: 'img', props: { src: maps[2], width: 760, height: 950, style: { objectFit: 'contain', borderRadius: 20, boxShadow: '0 30px 65px rgba(45,27,78,.2)' } } }, text('Create yours for $19', { fontSize: 72, fontWeight: 900, marginTop: 35 }), footer()],
  ];

  for (let index = 0; index < cards.length; index++) {
    await png(base(2000, 2000, cards[index]), 2000, 2000, fonts, resolve(listingDir, `${String(index + 1).padStart(2, '0')}.png`));
  }

  const guide = base(1600, 2000, [
    badge('YOUR PURCHASE IS READY'),
    text('Create your personalized map', { width: 1300, fontSize: 78, lineHeight: 1.05, fontWeight: 900, textAlign: 'center', justifyContent: 'center' }),
    text('1. Visit lovefarfox.com/etsy-map-redeem', { width: 1250, padding: '28px 35px', borderRadius: 25, background: 'white', fontSize: 39, fontWeight: 900, marginTop: 60 }),
    text('2. Enter your Etsy order number and purchase email.', { width: 1250, padding: '28px 35px', borderRadius: 25, background: 'white', fontSize: 39, fontWeight: 900, marginTop: 22 }),
    text('3. Add your locations, names, date, and message. Download the print-ready file.', { width: 1250, padding: '28px 35px', borderRadius: 25, background: 'white', fontSize: 39, fontWeight: 900, marginTop: 22 }),
    text('Need help? blake@lovefarfox.com', { fontSize: 31, color: colors.muted, marginTop: 60 }),
    footer(),
  ]);
  await png(guide, 1600, 2000, fonts, resolve(out, 'etsy-redemption-guide.png'));

  const vertical = [
    base(1080, 1920, [badge('LONG-DISTANCE GIFT'), text('Two places.', { fontSize: 98, fontWeight: 900 }), text('One story.', { fontSize: 98, fontWeight: 900, color: colors.pink }), footer()]),
    base(1080, 1920, [{ type: 'img', props: { src: maps[0], width: 850, height: 1062, style: { objectFit: 'contain', borderRadius: 20, boxShadow: '0 35px 70px rgba(45,27,78,.2)' } } }, text('Add your cities + names', { fontSize: 59, fontWeight: 900, marginTop: 38 }), footer()]),
    base(1080, 1920, [badge('INSTANT DIGITAL DOWNLOAD'), text('Preview it live.', { fontSize: 88, fontWeight: 900 }), text('Keep it forever.', { fontSize: 79, fontWeight: 900, color: colors.pink, marginTop: 20 }), footer()]),
    base(1080, 1920, [text('Make yours.', { fontSize: 104, fontWeight: 900 }), text('$19 · lovefarfox.com/map', { padding: '28px 45px', borderRadius: 999, background: `linear-gradient(90deg,${colors.pink},${colors.purple})`, color: 'white', fontSize: 48, fontWeight: 900, marginTop: 55 }), footer()]),
  ];
  const paths = [];
  for (let index = 0; index < vertical.length; index++) {
    const path = resolve(videoDir, `${index}.png`);
    paths.push(path);
    await png(vertical[index], 1080, 1920, fonts, path);
  }
  const concat = resolve(out, 'video.txt');
  writeFileSync(concat, paths.flatMap((path) => [`file '${path}'`, 'duration 3.0']).concat(`file '${paths.at(-1)}'`).join('\n'));
  execFileSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', concat,
    '-pix_fmt', 'yuv420p', '-r', '30', '-c:v', 'libx264', '-crf', '20',
    '-movflags', '+faststart', resolve(out, 'personalized-map-short.mp4'),
  ], { stdio: 'inherit' });
  console.log(`Launch assets written to ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
