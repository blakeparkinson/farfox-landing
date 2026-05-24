/**
 * Generates a ready-to-upload TikTok video for the quiz hook.
 *
 * Output: 1080x1920 (9:16), ~22 seconds, MP4 (H.264, no audio — add a
 * trending sound in TikTok's editor after upload).
 *
 * Pipeline:
 *   satori (JSX → SVG) → resvg (SVG → PNG)
 *   → ffmpeg (PNG sequence + xfade crossfades → mp4)
 *
 * Run:
 *   cd farfox-landing && node scripts/make-tiktok-quiz-video.mjs
 *
 * Output lands at ./out/tiktok-quiz.mp4
 */

import { mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');
const OUT_DIR = resolve(__dirname, '../out');
const FRAMES_DIR = resolve(OUT_DIR, 'frames');

// 1080x1920 — TikTok native vertical.
const W = 1080;
const H = 1920;

// ── Brand palette ────────────────────────────────────────────────────
const FOX_PINK = '#FF6B8A';
const FOX_PURPLE = '#B76CFD';
const FOX_TEXT = '#2D1B4E';
const FOX_TEXT_LIGHT = '#6B5B7B';
const GOLD = '#C78A2E';

// ── Load brand foxes as data URLs (satori needs them inlined) ────────
function loadImageDataUrl(name) {
  const bytes = readFileSync(resolve(PUBLIC_DIR, name));
  return `data:image/png;base64,${bytes.toString('base64')}`;
}
const FOX_FACE = loadImageDataUrl('fox-face.png');
const FOX_LETTER = loadImageDataUrl('fox-letter.png');

// ── Fonts (Nunito 400 + 800 + 900) ───────────────────────────────────
async function loadFonts() {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;800;900&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((r) => r.text());
  const ttfs = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
  const pool = ttfs.length ? ttfs : [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
  const [w400, w800, w900] = await Promise.all([
    fetch(pool[0]).then((r) => r.arrayBuffer()),
    fetch(pool[Math.min(1, pool.length - 1)]).then((r) => r.arrayBuffer()),
    fetch(pool[Math.min(2, pool.length - 1)]).then((r) => r.arrayBuffer()),
  ]);
  return { w400, w800, w900 };
}

// ── Twemoji loader ───────────────────────────────────────────────────
const emojiCache = new Map();
async function loadEmoji(segment) {
  const codepoints = [...segment]
    .map((c) => c.codePointAt(0)?.toString(16))
    .filter((c) => c && c !== 'fe0f')
    .join('-');
  if (emojiCache.has(codepoints)) return emojiCache.get(codepoints);
  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`;
  const svg = await fetch(url).then((r) => r.text());
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  emojiCache.set(codepoints, dataUrl);
  return dataUrl;
}

// ── Layered background — deeper gradient + soft orbs + heart pattern.
// Pulled out as a helper so every frame has the same warm foundation.
function background(variant = 'default') {
  // SVG hearts data URL — same one we use on the landing hero, scaled
  // up so it's visible on a vertical canvas.
  const hearts =
    "data:image/svg+xml;utf8," +
    "<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 80 80'>" +
    "<g fill='%23FF6B8A' fill-opacity='0.05'>" +
    "<path d='M20 28c0-4 3-7 7-7 2.5 0 4.6 1.3 5.7 3.3C33.8 22.3 35.9 21 38.4 21c4 0 7 3 7 7 0 6.5-11 12-12.2 12C32 40 20 34.5 20 28z'/>" +
    "</g></svg>";

  const gradients = {
    default: 'linear-gradient(160deg, #FFF6E2 0%, #FFE0E5 40%, #F5D2EC 75%, #E8D0FF 100%)',
    warm:    'linear-gradient(160deg, #FFF1D6 0%, #FFDED2 50%, #FFD4DC 100%)',
    cool:    'linear-gradient(160deg, #FFEBE8 0%, #F5D5E8 50%, #E5CDFF 100%)',
  };

  return [
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute', inset: 0,
          background: gradients[variant] || gradients.default,
          display: 'flex',
        },
      },
    },
    // Heart pattern overlay
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute', inset: 0,
          backgroundImage: `url("${hearts}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
          opacity: 0.6,
          display: 'flex',
        },
      },
    },
    // Corner orbs for depth
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute', top: -260, left: -240,
          width: 700, height: 700, borderRadius: 9999,
          background: 'rgba(255,107,138,0.28)', filter: 'blur(60px)',
          display: 'flex',
        },
      },
    },
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute', bottom: -300, right: -260,
          width: 800, height: 800, borderRadius: 9999,
          background: 'rgba(183,108,253,0.22)', filter: 'blur(70px)',
          display: 'flex',
        },
      },
    },
    {
      type: 'div',
      props: {
        style: {
          position: 'absolute', top: 600, right: -150,
          width: 380, height: 380, borderRadius: 9999,
          background: 'rgba(255,154,92,0.20)', filter: 'blur(50px)',
          display: 'flex',
        },
      },
    },
  ];
}

// "Far Fox" footer chip — same on every frame so the brand sticks.
function brandChip() {
  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute', bottom: 60, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 28px', borderRadius: 9999,
              background: 'rgba(255,255,255,0.7)',
              border: '2px solid rgba(255,107,138,0.25)',
              boxShadow: '0 8px 24px rgba(199,138,46,0.15)',
            },
            children: [
              { type: 'img', props: { src: FOX_FACE, width: 44, height: 44, style: { borderRadius: 9999 } } },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 30, fontWeight: 900, color: FOX_TEXT,
                    letterSpacing: 1,
                  },
                  children: 'lovefarfox.com',
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// ── Frame definitions ────────────────────────────────────────────────
const FRAMES = [
  // ── HOOK — big fox, bold headline, brand chip ──────────────────────
  {
    name: 'hook',
    holdSeconds: 3.2,
    render: () => ({
      type: 'div',
      props: {
        style: {
          width: '100%', height: '100%', position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Nunito', padding: 80,
        },
        children: [
          ...background('default'),
          {
            type: 'div',
            props: {
              style: {
                position: 'relative', display: 'flex',
                flexDirection: 'column', alignItems: 'center',
              },
              children: [
                // Eyebrow chip
                {
                  type: 'div',
                  props: {
                    style: {
                      padding: '14px 32px', borderRadius: 9999,
                      background: 'rgba(255,255,255,0.7)',
                      border: '2px solid rgba(255,107,138,0.3)',
                      fontSize: 28, fontWeight: 900,
                      letterSpacing: 6, color: FOX_PINK,
                      marginBottom: 60,
                    },
                    children: 'THE LOVE QUIZ',
                  },
                },
                // Big fox face — the brand anchor
                {
                  type: 'img',
                  props: {
                    src: FOX_FACE,
                    width: 280,
                    height: 280,
                    style: {
                      filter: 'drop-shadow(0 24px 32px rgba(255,107,138,0.35))',
                      marginBottom: 50,
                    },
                  },
                },
                // Headline — denser, more confident
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 96, fontWeight: 900, color: FOX_TEXT,
                      textAlign: 'center', lineHeight: 1.05,
                      maxWidth: 920,
                    },
                    children: 'How does your',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 96, fontWeight: 900, color: FOX_PINK,
                      textAlign: 'center', lineHeight: 1.05,
                      maxWidth: 920,
                    },
                    children: 'partner',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 96, fontWeight: 900, color: FOX_TEXT,
                      textAlign: 'center', lineHeight: 1.05,
                      maxWidth: 920,
                    },
                    children: 'feel loved?',
                  },
                },
                // Subline
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 38, fontWeight: 800, color: FOX_TEXT_LIGHT,
                      textAlign: 'center', marginTop: 40,
                    },
                    children: '6 questions · 2 minutes',
                  },
                },
              ],
            },
          },
          brandChip(),
        ],
      },
    }),
  },
  ...buildQuestionFrames(),
  // ── RESULT — fox face above, big headline, generous emoji grid ─────
  {
    name: 'result',
    holdSeconds: 4.0,
    render: () => ({
      type: 'div',
      props: {
        style: {
          width: '100%', height: '100%', position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Nunito', padding: 60,
        },
        children: [
          ...background('warm'),
          {
            type: 'div',
            props: {
              style: {
                position: 'relative', display: 'flex',
                flexDirection: 'column', alignItems: 'center',
              },
              children: [
                {
                  type: 'img',
                  props: {
                    src: FOX_FACE, width: 160, height: 160,
                    style: {
                      filter: 'drop-shadow(0 16px 28px rgba(255,107,138,0.30))',
                      marginBottom: 24,
                    },
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 26, fontWeight: 900,
                      letterSpacing: 10, color: GOLD,
                      marginBottom: 18,
                    },
                    children: 'A LOVE PROFILE',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex', alignItems: 'baseline',
                      fontSize: 108, fontWeight: 900, color: FOX_TEXT,
                      lineHeight: 1.0, marginBottom: 30,
                    },
                    children: [
                      'How ',
                      { type: 'span', props: { style: { color: FOX_PINK, padding: '0 14px' }, children: 'Sara' } },
                      ' loves',
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 38, fontStyle: 'italic',
                      color: FOX_TEXT_LIGHT, textAlign: 'center',
                      maxWidth: 870, lineHeight: 1.3, marginBottom: 60,
                    },
                    children: 'Feels loved through deep conversations and a voice note.',
                  },
                },
                // Bigger, more confident emoji grid
                emojiGridRow(['🎙️', '🤗', '💭']),
                { type: 'div', props: { style: { height: 28 } } },
                emojiGridRow(['🍳', '☕', '🌊']),
              ],
            },
          },
          brandChip(),
        ],
      },
    }),
  },
  // ── CTA — messenger fox with letter, big pill ──────────────────────
  {
    name: 'cta',
    holdSeconds: 3.5,
    render: () => ({
      type: 'div',
      props: {
        style: {
          width: '100%', height: '100%', position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Nunito', padding: 80,
        },
        children: [
          ...background('cool'),
          {
            type: 'div',
            props: {
              style: {
                position: 'relative', display: 'flex',
                flexDirection: 'column', alignItems: 'center',
              },
              children: [
                // Big messenger fox holding a letter
                {
                  type: 'img',
                  props: {
                    src: FOX_LETTER, width: 360, height: 360,
                    style: {
                      filter: 'drop-shadow(0 32px 48px rgba(183,108,253,0.35))',
                      marginBottom: 60,
                    },
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 110, fontWeight: 900, color: FOX_TEXT,
                      textAlign: 'center', lineHeight: 1.0,
                      marginBottom: 24,
                    },
                    children: 'Make yours.',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 42, fontWeight: 700, color: FOX_TEXT_LIGHT,
                      textAlign: 'center', marginBottom: 70,
                    },
                    children: 'Send it to your person 💌',
                  },
                },
                // Big gradient pill CTA
                {
                  type: 'div',
                  props: {
                    style: {
                      background: `linear-gradient(90deg, ${FOX_PINK} 0%, ${FOX_PURPLE} 100%)`,
                      color: 'white', padding: '36px 80px',
                      borderRadius: 9999,
                      fontSize: 64, fontWeight: 900, letterSpacing: 0.5,
                      boxShadow: '0 24px 64px rgba(255,107,138,0.45)',
                    },
                    children: 'lovefarfox.com',
                  },
                },
              ],
            },
          },
        ],
      },
    }),
  },
];

function emojiGridRow(emojis) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', gap: 32 },
      children: emojis.map((e) => ({
        type: 'div',
        props: {
          style: {
            width: 220, height: 220, borderRadius: 44,
            background: 'rgba(255,255,255,0.85)',
            border: '3px solid rgba(255,107,138,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 118,
            boxShadow: '0 18px 36px rgba(199,138,46,0.22)',
          },
          children: e,
        },
      })),
    },
  };
}

// Generate the 6 question frames. Same structure but better breathing
// room — vertically centered, bigger cards, bolder picked state.
function buildQuestionFrames() {
  const questions = [
    { prompt: 'When I miss you, what I want most is…', choices: [
      { e: '🎙️', l: 'A voice note' },
      { e: '📞', l: 'A phone call' },
      { e: '💌', l: 'A sweet text' },
      { e: '📷', l: 'A photo of your day' },
    ], picked: 0 },
    { prompt: 'On a hard day, what helps me most is…', choices: [
      { e: '🤗', l: 'Just being present' },
      { e: '💬', l: "Hearing it'll be okay" },
      { e: '😄', l: 'A laugh or distraction' },
      { e: '🌿', l: 'Quiet space to recover' },
    ], picked: 0 },
    { prompt: 'My favorite kind of message from you…', choices: [
      { e: '🥰', l: 'A compliment about me' },
      { e: '🤣', l: 'An inside joke' },
      { e: '💭', l: '"Thinking of you"' },
      { e: '📅', l: 'A future plan' },
    ], picked: 2 },
    { prompt: 'A perfect day off together looks like…', choices: [
      { e: '🍳', l: 'Cooking at home' },
      { e: '🎬', l: 'Curled up watching' },
      { e: '🥾', l: 'Outside, exploring' },
      { e: '💬', l: 'Long talks over coffee' },
    ], picked: 0 },
    { prompt: 'The gestures I notice most…', choices: [
      { e: '☕', l: 'Small daily things' },
      { e: '🎁', l: 'Planned surprises' },
      { e: '⏰', l: 'Time carved out for us' },
      { e: '🛠️', l: 'Acts of help' },
    ], picked: 0 },
    { prompt: "What I'd love more of…", choices: [
      { e: '🤲', l: 'Physical closeness' },
      { e: '🌊', l: 'Deep conversations' },
      { e: '🎲', l: 'Fun and playfulness' },
      { e: '🎯', l: 'Adventure & new things' },
    ], picked: 1 },
  ];

  return questions.map((q, i) => ({
    name: `q${i + 1}`,
    holdSeconds: 1.9,
    render: () => ({
      type: 'div',
      props: {
        style: {
          width: '100%', height: '100%', position: 'relative',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Nunito', padding: '80px 70px 200px',
        },
        children: [
          ...background(i % 2 === 0 ? 'default' : 'warm'),
          // Card wrapping the question content — feels app-like, not flat
          {
            type: 'div',
            props: {
              style: {
                position: 'relative', display: 'flex',
                flexDirection: 'column', width: '100%',
                background: 'rgba(255,255,255,0.55)',
                border: '3px solid rgba(255,107,138,0.18)',
                borderRadius: 56, padding: '60px 56px',
                boxShadow: '0 24px 60px rgba(199,138,46,0.18)',
              },
              children: [
                // Progress row
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 18,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 26, fontWeight: 900, color: FOX_PINK,
                            letterSpacing: 4,
                          },
                          children: `QUESTION ${i + 1} OF 6`,
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 26, fontWeight: 800, color: FOX_TEXT_LIGHT,
                          },
                          children: `${Math.round(((i + 1) / 6) * 100)}%`,
                        },
                      },
                    ],
                  },
                },
                // Progress bar
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '100%', height: 14,
                      background: 'rgba(255,107,138,0.12)',
                      borderRadius: 9999, marginBottom: 50, display: 'flex',
                    },
                    children: [{
                      type: 'div',
                      props: {
                        style: {
                          width: `${((i + 1) / 6) * 100}%`, height: '100%',
                          background: `linear-gradient(90deg, ${FOX_PINK} 0%, ${FOX_PURPLE} 100%)`,
                          borderRadius: 9999,
                          boxShadow: '0 4px 12px rgba(255,107,138,0.4)',
                        },
                      },
                    }],
                  },
                },
                // Prompt
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 60, fontWeight: 900, color: FOX_TEXT,
                      lineHeight: 1.15, marginBottom: 48,
                    },
                    children: q.prompt,
                  },
                },
                // Choice cards
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex', flexDirection: 'column',
                      gap: 18, width: '100%',
                    },
                    children: q.choices.map((c, idx) => {
                      const isPicked = idx === q.picked;
                      return {
                        type: 'div',
                        props: {
                          style: {
                            width: '100%', padding: '28px 32px',
                            borderRadius: 28,
                            background: isPicked
                              ? `linear-gradient(90deg, rgba(255,107,138,0.18) 0%, rgba(183,108,253,0.12) 100%)`
                              : 'rgba(255,255,255,0.9)',
                            border: `4px solid ${isPicked ? FOX_PINK : 'rgba(255,107,138,0.12)'}`,
                            display: 'flex', alignItems: 'center', gap: 26,
                            boxShadow: isPicked
                              ? '0 16px 36px rgba(255,107,138,0.32)'
                              : '0 4px 12px rgba(0,0,0,0.04)',
                            transform: isPicked ? 'scale(1.02)' : 'scale(1)',
                          },
                          children: [
                            { type: 'div', props: { style: { fontSize: 72 }, children: c.e } },
                            { type: 'div', props: { style: { fontSize: 42, fontWeight: 800, color: FOX_TEXT, flexGrow: 1 }, children: c.l } },
                            ...(isPicked ? [{
                              type: 'div',
                              props: {
                                style: {
                                  width: 56, height: 56, borderRadius: 9999,
                                  background: FOX_PINK,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 36, color: 'white', fontWeight: 900,
                                  boxShadow: '0 8px 20px rgba(255,107,138,0.5)',
                                },
                                children: '✓',
                              },
                            }] : []),
                          ],
                        },
                      };
                    }),
                  },
                },
              ],
            },
          },
          brandChip(),
        ],
      },
    }),
  }));
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true });
  mkdirSync(FRAMES_DIR, { recursive: true });

  console.log('Loading fonts...');
  const { w400, w800, w900 } = await loadFonts();

  console.log(`Rendering ${FRAMES.length} frames at ${W}x${H}...`);
  const concatLines = [];
  for (let i = 0; i < FRAMES.length; i++) {
    const f = FRAMES[i];
    const svg = await satori(f.render(), {
      width: W,
      height: H,
      fonts: [
        { name: 'Nunito', data: w400, weight: 400, style: 'normal' },
        { name: 'Nunito', data: w800, weight: 800, style: 'normal' },
        { name: 'Nunito', data: w900, weight: 900, style: 'normal' },
      ],
      loadAdditionalAsset: async (code, segment) => {
        if (code === 'emoji') return await loadEmoji(segment);
        return code;
      },
    });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } })
      .render()
      .asPng();
    const framePath = resolve(FRAMES_DIR, `${String(i).padStart(2, '0')}_${f.name}.png`);
    writeFileSync(framePath, png);
    concatLines.push(`file '${framePath}'`);
    concatLines.push(`duration ${f.holdSeconds.toFixed(2)}`);
    process.stdout.write(`  ${i + 1}/${FRAMES.length} ${f.name} (${f.holdSeconds}s)\n`);
  }
  concatLines.push(`file '${resolve(FRAMES_DIR, `${String(FRAMES.length - 1).padStart(2, '0')}_${FRAMES[FRAMES.length - 1].name}.png`)}'`);
  const concatPath = resolve(OUT_DIR, 'concat.txt');
  writeFileSync(concatPath, concatLines.join('\n'));

  const outPath = resolve(OUT_DIR, 'tiktok-quiz.mp4');
  console.log('\nEncoding with ffmpeg...');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -vsync vfr ` +
    `-pix_fmt yuv420p -r 30 -c:v libx264 -preset medium -crf 20 ` +
    `-movflags +faststart "${outPath}"`,
    { stdio: 'inherit' },
  );

  console.log(`\n✓ Done. Video at: ${outPath}`);
  const totalSec = FRAMES.reduce((s, f) => s + f.holdSeconds, 0);
  console.log(`  Length: ${totalSec.toFixed(1)}s  |  ${W}x${H}  |  Frames: ${FRAMES.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
