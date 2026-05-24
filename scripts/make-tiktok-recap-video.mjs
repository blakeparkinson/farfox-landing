/**
 * Generates a ready-to-upload TikTok video for the "Foxy's Episode"
 * weekly recap reveal.
 *
 * Output: 1080x1920 (9:16), ~18 seconds, MP4 (H.264, no audio — add a
 * trending sound in TikTok's editor after upload).
 *
 * Beat structure:
 *   0.0–2.8s   HOOK frame — text-over-soft-gradient screen
 *   2.8–15.5s  EPISODE frame — the dark purple recap card filling the
 *              screen, holding for ~12.5s so viewers can read the
 *              AI-written title + body (this is the watch-time bait)
 *   15.5–18.5s CTA frame — "an AI does this every week · lovefarfox.com"
 *
 * Pipeline mirrors make-tiktok-quiz-video.mjs:
 *   satori (JSX → SVG) → resvg (SVG → PNG)
 *   → ffmpeg (PNG sequence → mp4)
 *
 * Run with which recap to feature:
 *   node scripts/make-tiktok-recap-video.mjs memoir
 *   node scripts/make-tiktok-recap-video.mjs cooking_show
 *   node scripts/make-tiktok-recap-video.mjs sleep_story
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
const FRAMES_DIR = resolve(OUT_DIR, 'recap-frames');

const W = 1080;
const H = 1920;

// ── Brand palette ────────────────────────────────────────────────────
const FOX_PINK = '#FF6B8A';
const FOX_PURPLE = '#B76CFD';
const FOX_TEXT = '#2D1B4E';
const FOX_TEXT_LIGHT = '#6B5B7B';
const GOLD = '#FFC78A';

const FOX_FACE = `data:image/png;base64,${readFileSync(resolve(PUBLIC_DIR, 'fox-face.png')).toString('base64')}`;

// ── The actual recap content variants ────────────────────────────────
const RECAPS = {
  memoir: {
    label: 'MEMOIR',
    title: "Chapter II: 'Between the Slow Dance and the Countdown'",
    body: "On a cool Sunday evening, Blake lay awake missing the familiar weight of Amanda's head on his chest, while she ached quietly in a scentless world, wishing she could hear a Dermot song wherever they were. Their differing ways of coping—his craving quiet space, hers seeking physical closeness—wove through the week like a slow dance in pajamas in the kitchen, both comforted by the countdown Jezzy kept alive in FarFox and the shared ritual of virtual dates and plans for adventures ahead. In their first year, Amanda's brave willingness to change life's course met Blake's calm trust that things would be okay; together, they navigated absence and presence with a tenderness that didn't need to be loud to be real.",
  },
  cooking_show: {
    label: 'COOKING SHOW',
    title: "On tonight's episode: 'The Memory Feast with a Side of Future Plans'",
    body: "This week, Amanda and Blake were handed a pantry stocked with sizzling memories—from first kisses and lobster cook-offs to snowstorms and hot springs soundtracks. Their dish? A warmly spiced stew combining Amanda's craving for shared steak dinners and Blake's fondness for inside jokes simmered over quiet adventures, all garnished with a fresh zest of tropical island dreams and hiking trails yet to be conquered. Judge Jezzy nods approvingly: one year in, and this duo knows how to blend the heat of heated moods with the sweetness of appreciation, crafting a recipe that's equal parts comfort and surprise.",
  },
  sleep_story: {
    label: 'SLEEP STORY',
    title: "Tonight's sleep story: 'The Map of Us, Unfolding Gentle and Slow'",
    body: "Tonight, Amanda and Blake drift across the soft contours of their shared future, tracing a quiet map drawn in slow-cooked aromas and whispered plans. Together, they settle into the warmth of a home imagined with dog paws by the door and spots made just for cuds, where every lazy day and big hike unfurls like a page in their story. As the light dims gently outside, Blake's thought of Asia and Amanda's wish to do life everywhere and anywhere weave through their dreams, carrying them on a calm current of hopeful possibility. And slowly, the steady rhythm of their one-year love hums like a lullaby — soft, steady, and simply enough.",
  },
};

const variantId = process.argv[2] || 'memoir';
const recap = RECAPS[variantId];
if (!recap) {
  console.error(`Unknown variant: ${variantId}. Options: ${Object.keys(RECAPS).join(', ')}`);
  process.exit(1);
}

// ── Fonts ────────────────────────────────────────────────────────────
async function loadFonts() {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;800;900&display=swap&family=Cormorant+Garamond:ital,wght@1,600&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((r) => r.text());
  const urls = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
  // CSS order from Google Fonts: nunito 400, 800, 900, cormorant italic 600
  const [w400, w800, w900, cormorantItalic] = await Promise.all([
    fetch(urls[0]).then((r) => r.arrayBuffer()),
    fetch(urls[1] || urls[0]).then((r) => r.arrayBuffer()),
    fetch(urls[2] || urls[1] || urls[0]).then((r) => r.arrayBuffer()),
    fetch(urls[urls.length - 1]).then((r) => r.arrayBuffer()),
  ]);
  return { w400, w800, w900, cormorantItalic };
}

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

// ── Frame 1: HOOK ────────────────────────────────────────────────────
function hookFrame() {
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
        fontFamily: 'Nunito',
        padding: 100,
        background:
          'linear-gradient(160deg, #FFF6E2 0%, #FFE0E5 40%, #F5D2EC 75%, #E8D0FF 100%)',
      },
      children: [
        // Soft glow orbs for depth
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: -200,
              left: -200,
              width: 600,
              height: 600,
              borderRadius: 9999,
              background: 'rgba(255,107,138,0.30)',
              filter: 'blur(60px)',
              display: 'flex',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: -240,
              right: -180,
              width: 700,
              height: 700,
              borderRadius: 9999,
              background: 'rgba(183,108,253,0.25)',
              filter: 'blur(70px)',
              display: 'flex',
            },
          },
        },
        // Big fox face anchor
        {
          type: 'img',
          props: {
            src: FOX_FACE,
            width: 220,
            height: 220,
            style: {
              filter: 'drop-shadow(0 20px 32px rgba(255,107,138,0.35))',
              marginBottom: 40,
            },
          },
        },
        // The hook line — the surprise factor
        {
          type: 'div',
          props: {
            style: {
              fontSize: 76,
              fontWeight: 900,
              color: FOX_TEXT,
              textAlign: 'center',
              lineHeight: 1.1,
              maxWidth: 920,
              marginBottom: 30,
            },
            children: 'so my couples app',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 76,
              fontWeight: 900,
              color: FOX_PINK,
              textAlign: 'center',
              lineHeight: 1.1,
              maxWidth: 920,
              marginBottom: 30,
            },
            children: 'wrote us our own',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 96,
              fontWeight: 900,
              color: FOX_PURPLE,
              textAlign: 'center',
              lineHeight: 1.0,
              maxWidth: 920,
            },
            children: `${recap.label.toLowerCase()}…`,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 64,
              marginTop: 60,
            },
            children: '👇',
          },
        },
      ],
    },
  };
}

// ── Frame 2: THE EPISODE CARD (the main content viewers read) ───────
function episodeFrame() {
  return {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Nunito',
        padding: '120px 70px 100px',
        background:
          'linear-gradient(135deg, #2D1B4E 0%, #4A2A6E 50%, #6B3A8E 100%)',
      },
      children: [
        // Decorative orbs for depth on the dark background
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: -180,
              left: -180,
              width: 700,
              height: 700,
              borderRadius: 9999,
              background: 'rgba(255,107,138,0.35)',
              filter: 'blur(70px)',
              display: 'flex',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: -260,
              right: -200,
              width: 800,
              height: 800,
              borderRadius: 9999,
              background: 'rgba(183,108,253,0.35)',
              filter: 'blur(80px)',
              display: 'flex',
            },
          },
        },
        // Eyebrow
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              marginBottom: 30,
            },
            children: [
              { type: 'div', props: { style: { fontSize: 52 }, children: '🦊' } },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 28,
                    fontWeight: 900,
                    letterSpacing: 7,
                    color: GOLD,
                  },
                  children: `FOXY'S EPISODE · ${recap.label}`,
                },
              },
            ],
          },
        },
        // Title — italic serif, the "they screenshot this" part
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              fontSize: 70,
              fontWeight: 600,
              fontStyle: 'italic',
              fontFamily: 'Cormorant Garamond',
              color: 'white',
              lineHeight: 1.05,
              marginBottom: 50,
            },
            children: recap.title,
          },
        },
        // Body
        {
          type: 'div',
          props: {
            style: {
              position: 'relative',
              fontSize: 36,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.92)',
              lineHeight: 1.4,
              flexGrow: 1,
            },
            children: recap.body,
          },
        },
      ],
    },
  };
}

// ── Frame 3: BRAND CLOSE ─────────────────────────────────────────────
function ctaFrame() {
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
        fontFamily: 'Nunito',
        padding: 80,
        background:
          'linear-gradient(160deg, #FFF6E2 0%, #FFE0E5 50%, #F3CFE6 100%)',
      },
      children: [
        // Orbs
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              top: -200,
              right: -150,
              width: 600,
              height: 600,
              borderRadius: 9999,
              background: 'rgba(255,107,138,0.30)',
              filter: 'blur(60px)',
              display: 'flex',
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: -240,
              left: -180,
              width: 700,
              height: 700,
              borderRadius: 9999,
              background: 'rgba(183,108,253,0.25)',
              filter: 'blur(70px)',
              display: 'flex',
            },
          },
        },
        {
          type: 'img',
          props: {
            src: FOX_FACE,
            width: 260,
            height: 260,
            style: {
              filter: 'drop-shadow(0 24px 40px rgba(255,107,138,0.40))',
              marginBottom: 50,
            },
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 68,
              fontWeight: 900,
              color: FOX_TEXT,
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: 16,
              maxWidth: 920,
            },
            children: 'an AI writes our episode',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 68,
              fontWeight: 900,
              color: FOX_PINK,
              textAlign: 'center',
              lineHeight: 1.1,
              marginBottom: 60,
            },
            children: 'every week',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              background: `linear-gradient(90deg, ${FOX_PINK} 0%, ${FOX_PURPLE} 100%)`,
              color: 'white',
              padding: '32px 72px',
              borderRadius: 9999,
              fontSize: 56,
              fontWeight: 900,
              letterSpacing: 0.5,
              boxShadow: '0 24px 64px rgba(255,107,138,0.45)',
            },
            children: 'lovefarfox.com',
          },
        },
      ],
    },
  };
}

const FRAMES = [
  { name: 'hook', holdSeconds: 2.8, render: hookFrame },
  { name: 'episode', holdSeconds: 12.5, render: episodeFrame },
  { name: 'cta', holdSeconds: 3.0, render: ctaFrame },
];

async function main() {
  if (existsSync(OUT_DIR)) {
    // Don't rm the whole OUT_DIR — quiz video lives there too. Just clear frames.
    if (existsSync(FRAMES_DIR)) rmSync(FRAMES_DIR, { recursive: true });
  }
  mkdirSync(FRAMES_DIR, { recursive: true });

  console.log(`Variant: ${variantId}`);
  console.log(`Loading fonts...`);
  const { w400, w800, w900, cormorantItalic } = await loadFonts();

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
        {
          name: 'Cormorant Garamond',
          data: cormorantItalic,
          weight: 600,
          style: 'italic',
        },
      ],
      loadAdditionalAsset: async (code, segment) => {
        if (code === 'emoji') return await loadEmoji(segment);
        return code;
      },
    });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } })
      .render()
      .asPng();
    const framePath = resolve(
      FRAMES_DIR,
      `${String(i).padStart(2, '0')}_${f.name}.png`,
    );
    writeFileSync(framePath, png);
    concatLines.push(`file '${framePath}'`);
    concatLines.push(`duration ${f.holdSeconds.toFixed(2)}`);
    process.stdout.write(`  ${i + 1}/${FRAMES.length} ${f.name} (${f.holdSeconds}s)\n`);
  }
  concatLines.push(
    `file '${resolve(FRAMES_DIR, `${String(FRAMES.length - 1).padStart(2, '0')}_${FRAMES[FRAMES.length - 1].name}.png`)}'`,
  );
  const concatPath = resolve(OUT_DIR, `recap-concat-${variantId}.txt`);
  writeFileSync(concatPath, concatLines.join('\n'));

  const outPath = resolve(OUT_DIR, `tiktok-recap-${variantId}.mp4`);
  console.log('\nEncoding with ffmpeg...');
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -vsync vfr ` +
      `-pix_fmt yuv420p -r 30 -c:v libx264 -preset medium -crf 20 ` +
      `-movflags +faststart "${outPath}"`,
    { stdio: 'inherit' },
  );

  console.log(`\n✓ Done. Video at: ${outPath}`);
  const totalSec = FRAMES.reduce((s, f) => s + f.holdSeconds, 0);
  console.log(`  Length: ${totalSec.toFixed(1)}s  |  ${W}x${H}  |  Variant: ${variantId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
