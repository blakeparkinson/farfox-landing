/**
 * Generate three ready-to-post 9:16 videos for the personalized jersey offer.
 *
 * Output:
 *   out/jersey-launch/01-not-generic.mp4
 *   out/jersey-launch/02-two-cities.mp4
 *   out/jersey-launch/03-team.mp4
 *
 * Add a native trending sound when uploading to TikTok or Instagram.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'out/jersey-launch');
const frames = resolve(out, 'frames');
const width = 1080;
const height = 1920;
const site = 'https://lovefarfox.com';

const campaigns = [
  {
    slug: '01-not-generic',
    hook: 'POV: you found a long-distance gift that is not generic.',
    product: '443266866',
    kit: 'stars',
    name: 'ALEX',
    number: '22',
    palette: ['#fff4dc', '#ffd7df', '#e4d3ff'],
  },
  {
    slug: '02-two-cities',
    hook: 'Two cities. One team.',
    product: '443266945',
    kit: 'chart',
    name: 'MILES',
    number: '831',
    palette: ['#f8ebff', '#ffdce7', '#fff2d8'],
  },
  {
    slug: '03-team',
    hook: 'Put their name on the team you keep choosing.',
    product: '443213452',
    kit: 'flight',
    name: 'JORDAN',
    number: '14',
    palette: ['#fff0e2', '#ffd7e1', '#dacfff'],
  },
];

async function bytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not fetch ${url}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function dataUrl(buffer, mime = 'image/png') {
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

async function loadFonts() {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((response) => response.text());
  const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]);
  if (!urls.length) throw new Error('Could not load Nunito font URLs');
  const loaded = await Promise.all(urls.slice(-3).map((url) => fetch(url).then((response) => response.arrayBuffer())));
  return [
    { name: 'Nunito', data: loaded[0], weight: 700, style: 'normal' },
    { name: 'Nunito', data: loaded[Math.min(1, loaded.length - 1)], weight: 800, style: 'normal' },
    { name: 'Nunito', data: loaded[Math.min(2, loaded.length - 1)], weight: 900, style: 'normal' },
  ];
}

function background(palette) {
  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        background: `linear-gradient(155deg, ${palette[0]} 0%, ${palette[1]} 52%, ${palette[2]} 100%)`,
      },
    },
  };
}

function brand(fox) {
  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        bottom: 70,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        color: '#2d1b4e',
        fontSize: 31,
        fontWeight: 900,
      },
      children: [
        { type: 'img', props: { src: fox, width: 48, height: 48 } },
        'lovefarfox.com/jersey',
      ],
    },
  };
}

function frame(children, palette) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 72,
        fontFamily: 'Nunito',
        color: '#2d1b4e',
      },
      children: [background(palette), ...children],
    },
  };
}

function pill(text) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        padding: '17px 34px',
        borderRadius: 999,
        background: 'rgba(255,255,255,.72)',
        border: '3px solid rgba(255,107,138,.22)',
        fontSize: 28,
        fontWeight: 900,
        letterSpacing: 4,
        color: '#ff5f81',
        marginBottom: 52,
      },
      children: text,
    },
  };
}

async function renderPng(node, path, fonts) {
  const svg = await satori(node, { width, height, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  writeFileSync(path, png);
}

function encode(framePaths, target) {
  const concat = `${target}.txt`;
  const durations = [3.0, 3.2, 3.4, 3.2];
  const lines = framePaths.flatMap((path, index) => [`file '${path}'`, `duration ${durations[index]}`]);
  lines.push(`file '${framePaths.at(-1)}'`);
  writeFileSync(concat, lines.join('\n'));
  execFileSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', concat,
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,format=yuv420p',
    '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-movflags', '+faststart', target,
  ], { stdio: 'inherit' });
}

async function main() {
  if (existsSync(out)) rmSync(out, { recursive: true });
  mkdirSync(frames, { recursive: true });
  const fonts = await loadFonts();
  const fox = dataUrl(readFileSync(resolve(root, 'public/brand/foxy-face-v1.png')));

  for (const campaign of campaigns) {
    console.log(`Rendering ${campaign.slug}...`);
    const front = dataUrl(await bytes(`${site}/shop/auto/mockup-${campaign.product}.png`));
    const backParams = new URLSearchParams({
      kit: campaign.kit,
      name: campaign.name,
      number: campaign.number,
      w: '900',
    });
    const back = dataUrl(await bytes(`${site}/api/jersey-back.png?${backParams}`));
    const paths = [0, 1, 2, 3].map((index) => resolve(frames, `${campaign.slug}-${index}.png`));

    await renderPng(frame([
      pill('LONG DISTANCE GIFT'),
      {
        type: 'div',
        props: {
          style: { position: 'relative', display: 'flex', fontSize: 92, lineHeight: 1.04, fontWeight: 900, textAlign: 'center' },
          children: campaign.hook,
        },
      },
      brand(fox),
    ], campaign.palette), paths[0], fonts);

    await renderPng(frame([
      pill('LONG DISTANCE FC'),
      {
        type: 'img',
        props: {
          src: front,
          width: 850,
          height: 850,
          style: { objectFit: 'contain', filter: 'drop-shadow(0 34px 44px rgba(45,27,78,.2))' },
        },
      },
      {
        type: 'div',
        props: { style: { position: 'relative', display: 'flex', fontSize: 62, fontWeight: 900, textAlign: 'center', marginTop: 35 }, children: 'Choose their kit.' },
      },
      brand(fox),
    ], campaign.palette), paths[1], fonts);

    await renderPng(frame([
      pill('PERSONALIZED LIVE'),
      {
        type: 'img',
        props: {
          src: back,
          width: 840,
          height: 840,
          style: { objectFit: 'contain', filter: 'drop-shadow(0 34px 44px rgba(45,27,78,.2))' },
        },
      },
      {
        type: 'div',
        props: { style: { position: 'relative', display: 'flex', fontSize: 62, fontWeight: 900, textAlign: 'center', marginTop: 30 }, children: 'Add their name + number.' },
      },
      brand(fox),
    ], campaign.palette), paths[2], fonts);

    await renderPng(frame([
      { type: 'img', props: { src: fox, width: 260, height: 260, style: { marginBottom: 50, filter: 'drop-shadow(0 24px 34px rgba(255,107,138,.3))' } } },
      {
        type: 'div',
        props: { style: { position: 'relative', display: 'flex', fontSize: 102, lineHeight: 1.02, fontWeight: 900, textAlign: 'center', marginBottom: 45 }, children: 'One relationship. One team.' },
      },
      {
        type: 'div',
        props: {
          style: {
            position: 'relative',
            display: 'flex',
            padding: '28px 54px',
            borderRadius: 999,
            background: 'linear-gradient(90deg,#ff6b8a,#b76cfd)',
            color: 'white',
            fontSize: 48,
            fontWeight: 900,
            boxShadow: '0 24px 55px rgba(255,107,138,.38)',
          },
          children: 'Make yours from $50',
        },
      },
      brand(fox),
    ], campaign.palette), paths[3], fonts);

    encode(paths, resolve(out, `${campaign.slug}.mp4`));
  }

  console.log(`Done: ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
