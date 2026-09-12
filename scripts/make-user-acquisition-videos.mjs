/**
 * Generate three 9:16 acquisition creatives for TikTok/Reels.
 * Add native audio in the ad platform. Outputs are gitignored.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'out/user-acquisition');
const framesDir = resolve(out, 'frames');
const W = 1080;
const H = 1920;
const pink = '#FF6B8A';
const purple = '#B76CFD';
const ink = '#2D1B4E';
const muted = '#6B5B7B';
const fox = `data:image/png;base64,${readFileSync(resolve(root, 'public/brand/foxy-face-v1.png')).toString('base64')}`;

const campaigns = [
  {
    slug: '01-send-to-partner',
    hook: 'Send this to your long-distance partner.',
    middle: 'What do you need most when you miss me?',
    reveal: 'Take the same 6 questions. Reveal where you match.',
  },
  {
    slug: '02-love-overlap',
    hook: 'We matched on 4 out of 6.',
    middle: 'The other 2 answers started the conversation we needed.',
    reveal: 'Differences are not failures. They are instructions.',
  },
  {
    slug: '03-better-than-how-was-your-day',
    hook: 'When “how was your day?” stops working…',
    middle: 'Try one question that gives you something real to say.',
    reveal: 'Then build a daily ritual together on Far Fox.',
  },
];

const text = (value, style = {}) => ({ type: 'div', props: { style: { display: 'flex', ...style }, children: value } });

async function fonts() {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap', {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  }).then((response) => response.text());
  const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]);
  const loaded = await Promise.all(urls.slice(-3).map((url) => fetch(url).then((response) => response.arrayBuffer())));
  return [
    { name: 'Nunito', data: loaded[0], weight: 700, style: 'normal' },
    { name: 'Nunito', data: loaded[Math.min(1, loaded.length - 1)], weight: 800, style: 'normal' },
    { name: 'Nunito', data: loaded[Math.min(2, loaded.length - 1)], weight: 900, style: 'normal' },
  ];
}

function base(children) {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%', position: 'relative', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 75, fontFamily: 'Nunito', color: ink,
        background: 'linear-gradient(155deg,#FFF7E5 0%,#FFDCE5 52%,#E8D7FF 100%)',
      },
      children,
    },
  };
}

function brand() {
  return text('lovefarfox.com/couple-quiz', {
    position: 'absolute', bottom: 65, left: 0, right: 0, justifyContent: 'center',
    fontSize: 31, fontWeight: 900, color: ink,
  });
}

function badge(value) {
  return text(value, {
    padding: '15px 30px', borderRadius: 999, background: 'rgba(255,255,255,.78)',
    border: '2px solid rgba(255,107,138,.22)', fontSize: 27, fontWeight: 900,
    color: pink, letterSpacing: 4, marginBottom: 48,
  });
}

async function render(node, path, loadedFonts) {
  const svg = await satori(node, { width: W, height: H, fonts: loadedFonts });
  writeFileSync(path, new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng());
}

function encode(paths, target) {
  const concat = `${target}.txt`;
  writeFileSync(concat, paths.flatMap((path) => [`file '${path}'`, 'duration 2.8']).concat(`file '${paths.at(-1)}'`).join('\n'));
  execFileSync('ffmpeg', [
    '-y', '-f', 'concat', '-safe', '0', '-i', concat, '-pix_fmt', 'yuv420p',
    '-r', '30', '-c:v', 'libx264', '-crf', '20', '-movflags', '+faststart', target,
  ], { stdio: 'inherit' });
}

async function main() {
  if (existsSync(out)) rmSync(out, { recursive: true });
  mkdirSync(framesDir, { recursive: true });
  const loadedFonts = await fonts();

  for (const campaign of campaigns) {
    const paths = [0, 1, 2, 3].map((index) => resolve(framesDir, `${campaign.slug}-${index}.png`));
    const scenes = [
      base([
        badge('FOR COUPLES WHO LIVE APART'),
        { type: 'img', props: { src: fox, width: 230, height: 230, style: { marginBottom: 45 } } },
        text(campaign.hook, { maxWidth: 920, fontSize: 91, lineHeight: 1.04, fontWeight: 900, textAlign: 'center', justifyContent: 'center' }),
        brand(),
      ]),
      base([
        badge('ONE HONEST QUESTION'),
        text(campaign.middle, { maxWidth: 900, fontSize: 82, lineHeight: 1.08, fontWeight: 900, textAlign: 'center', justifyContent: 'center' }),
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 18, width: 830, marginTop: 55 },
            children: ['A voice note', 'A phone call', 'A sweet text', 'A photo of your day'].map((choice, index) =>
              text(choice, {
                width: '100%', padding: '22px 28px', borderRadius: 24,
                background: index === 0 ? 'rgba(255,107,138,.18)' : 'rgba(255,255,255,.78)',
                border: `3px solid ${index === 0 ? pink : 'rgba(255,107,138,.12)'}`,
                fontSize: 38, fontWeight: 900,
              })),
          },
        },
        brand(),
      ]),
      base([
        badge('YOUR LOVE OVERLAP'),
        text('4/6', { fontSize: 210, lineHeight: 1, fontWeight: 900, color: pink }),
        text(campaign.reveal, { maxWidth: 880, fontSize: 55, lineHeight: 1.18, fontWeight: 900, textAlign: 'center', justifyContent: 'center', marginTop: 40 }),
        brand(),
      ]),
      base([
        { type: 'img', props: { src: fox, width: 280, height: 280, style: { marginBottom: 50 } } },
        text('Take it together.', { fontSize: 95, fontWeight: 900, textAlign: 'center' }),
        text('Free · 2 minutes · No signup', { fontSize: 38, fontWeight: 800, color: muted, marginTop: 28 }),
        text('lovefarfox.com/couple-quiz', {
          padding: '28px 44px', borderRadius: 999, marginTop: 55,
          background: `linear-gradient(90deg,${pink},${purple})`,
          color: 'white', fontSize: 45, fontWeight: 900,
        }),
        brand(),
      ]),
    ];
    for (let index = 0; index < scenes.length; index++) await render(scenes[index], paths[index], loadedFonts);
    encode(paths, resolve(out, `${campaign.slug}.mp4`));
  }
  console.log(`Acquisition videos written to ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
