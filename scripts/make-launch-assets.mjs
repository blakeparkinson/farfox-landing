/**
 * Generate the zero-spend launch kit:
 *   1. Pinterest pins (1000x1500) — quiz-question, hook, and blog pins,
 *      plus a pins.json manifest with titles/descriptions/tracked links
 *      ready to batch-schedule in Pinterest's native scheduler.
 *   2. Product Hunt gallery images (1270x760).
 *
 * Outputs land in out/launch/ (gitignored, like the video creatives).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { RITUAL_QUESTIONS } from '../src/lib/connectionRituals.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outPins = resolve(root, 'out/launch/pins');
const outPh = resolve(root, 'out/launch/product-hunt');
mkdirSync(outPins, { recursive: true });
mkdirSync(outPh, { recursive: true });

const pink = '#FF6B8A';
const purple = '#B76CFD';
const ink = '#2D1B4E';
const muted = '#6B5B7B';
const gold = '#C78A2E';
const bg = 'linear-gradient(160deg, #FFF6E2 0%, #FDE6CB 45%, #FFD9D9 100%)';
const fox = `data:image/png;base64,${readFileSync(resolve(root, 'public/brand/foxy-face-v1.png')).toString('base64')}`;

const SITE = 'https://lovefarfox.com';
const pinLink = (path, content) =>
  `${SITE}${path}?utm_source=pinterest&utm_medium=pin&utm_campaign=love_profile_loop&utm_content=${content}`;

// ── Shared rendering helpers ─────────────────────────────────────

const text = (value, style = {}) => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children: value },
});

async function loadFonts() {
  const css = await fetch(
    'https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap',
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((response) => response.text());
  const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]);
  const loaded = await Promise.all(
    urls.slice(-3).map((url) => fetch(url).then((response) => response.arrayBuffer())),
  );
  return [
    { name: 'Nunito', data: loaded[0], weight: 700, style: 'normal' },
    { name: 'Nunito', data: loaded[Math.min(1, loaded.length - 1)], weight: 800, style: 'normal' },
    { name: 'Nunito', data: loaded[Math.min(2, loaded.length - 1)], weight: 900, style: 'normal' },
  ];
}

const emojiCache = new Map();
async function loadEmoji(segment) {
  const codepoints = [...segment]
    .map((c) => c.codePointAt(0)?.toString(16))
    .filter((c) => c && c !== 'fe0f')
    .join('-');
  if (emojiCache.has(codepoints)) return emojiCache.get(codepoints);
  const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`;
  let svgText;
  try {
    svgText = await fetch(url).then((r) => r.text());
  } catch {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=';
  }
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
  emojiCache.set(codepoints, dataUrl);
  return dataUrl;
}

let FONTS;
async function render(node, width, height, file) {
  const svg = await satori(node, {
    width,
    height,
    fonts: FONTS,
    loadAdditionalAsset: async (code, segment) =>
      code === 'emoji' ? await loadEmoji(segment) : code,
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  writeFileSync(file, png);
  console.log(`✓ ${file.replace(`${root}/`, '')}`);
}

// ── Pin frame (1000x1500) ────────────────────────────────────────

function pinFrame(children, footer = 'lovefarfox.com/couple-quiz') {
  return {
    type: 'div',
    props: {
      style: {
        width: '1000px',
        height: '1500px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: bg,
        fontFamily: 'Nunito',
        padding: '70px 64px',
        position: 'relative',
      },
      children: [
        ...children,
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              bottom: 56,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'rgba(255,255,255,0.85)',
              borderRadius: 999,
              padding: '18px 34px',
              fontSize: 28,
              fontWeight: 900,
              color: pink,
              boxShadow: '0 10px 30px rgba(255,107,138,0.25)',
            },
            children: [
              { type: 'img', props: { src: fox, width: 44, height: 44 } },
              footer,
            ],
          },
        },
      ],
    },
  };
}

function questionPin(question, index) {
  return pinFrame([
    { type: 'img', props: { src: fox, width: 110, height: 110, style: { marginBottom: 30 } } },
    text(`THE COUPLE QUIZ · ${index + 1} OF 6`, {
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: 8,
      color: gold,
      marginBottom: 30,
    }),
    text(question.prompt, {
      fontSize: 62,
      fontWeight: 900,
      color: ink,
      lineHeight: 1.15,
      textAlign: 'center',
      justifyContent: 'center',
      marginBottom: 50,
    }),
    {
      type: 'div',
      props: {
        style: { display: 'flex', flexDirection: 'column', gap: 22, width: '100%' },
        children: question.choices.map((choice) => ({
          type: 'div',
          props: {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              background: 'rgba(255,255,255,0.75)',
              borderRadius: 26,
              padding: '26px 34px',
              fontSize: 38,
              fontWeight: 800,
              color: ink,
            },
            children: [text(choice.emoji, { fontSize: 46 }), choice.label],
          },
        })),
      },
    },
    text('Your partner answers the same 6. Then you see where you match.', {
      fontSize: 28,
      fontWeight: 700,
      color: muted,
      textAlign: 'center',
      justifyContent: 'center',
      marginTop: 44,
      maxWidth: 760,
    }),
  ]);
}

function hookPin({ eyebrow, title, sub, highlight }) {
  return pinFrame([
    { type: 'img', props: { src: fox, width: 150, height: 150, style: { marginTop: 60, marginBottom: 50 } } },
    text(eyebrow, {
      fontSize: 26,
      fontWeight: 900,
      letterSpacing: 8,
      color: gold,
      marginBottom: 40,
      textAlign: 'center',
      justifyContent: 'center',
    }),
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          fontSize: 84,
          fontWeight: 900,
          color: ink,
          lineHeight: 1.12,
          textAlign: 'center',
          alignItems: 'center',
          marginBottom: 44,
        },
        children: [
          text(title, { justifyContent: 'center', textAlign: 'center' }),
          highlight
            ? text(highlight, { color: pink, justifyContent: 'center', textAlign: 'center' })
            : null,
        ].filter(Boolean),
      },
    },
    text(sub, {
      fontSize: 34,
      fontWeight: 700,
      color: muted,
      lineHeight: 1.4,
      textAlign: 'center',
      justifyContent: 'center',
      maxWidth: 780,
    }),
  ]);
}

function blogPin({ eyebrow, title, sub, path }) {
  return pinFrame(
    [
      { type: 'img', props: { src: fox, width: 130, height: 130, style: { marginTop: 40, marginBottom: 46 } } },
      text(eyebrow, {
        fontSize: 26,
        fontWeight: 900,
        letterSpacing: 8,
        color: gold,
        marginBottom: 38,
      }),
      text(title, {
        fontSize: 76,
        fontWeight: 900,
        color: ink,
        lineHeight: 1.14,
        textAlign: 'center',
        justifyContent: 'center',
        marginBottom: 42,
      }),
      text(sub, {
        fontSize: 33,
        fontWeight: 700,
        color: muted,
        lineHeight: 1.42,
        textAlign: 'center',
        justifyContent: 'center',
        maxWidth: 790,
      }),
    ],
    `lovefarfox.com${path}`,
  );
}

// ── Pin catalog ──────────────────────────────────────────────────

const HOOKS = [
  {
    slug: 'hook-matched-3-of-6',
    eyebrow: 'LONG DISTANCE, HONESTLY',
    title: 'We matched on 3/6.',
    highlight: 'The mismatches were the point.',
    sub: 'Six questions each. One reveal. The conversation most couples never have out loud.',
    title_meta: 'We Matched on 3/6 Love Rituals — The Mismatches Were the Point',
    description:
      'A free 2-minute quiz for long-distance couples: you each answer six honest questions, then reveal where your love profiles match. No signup. LDR quiz, couple quiz, long distance relationship.',
  },
  {
    slug: 'hook-6-questions',
    eyebrow: 'FREE COUPLE QUIZ',
    title: '6 questions.',
    highlight: '2 minutes. One reveal.',
    sub: 'Take your side, send your partner theirs, and see where your instincts match.',
    title_meta: 'The 2-Minute Couple Quiz You Take Together (Free)',
    description:
      'The couple quiz built for long-distance relationships: answer six situations, send your partner a private link, unlock your side-by-side match. Free, no signup needed.',
  },
  {
    slug: 'hook-how-was-your-day',
    eyebrow: 'FOR COUPLES APART',
    title: 'When “how was your day?”',
    highlight: 'stops working.',
    sub: 'One honest question gives you more to talk about than a hundred check-ins.',
    title_meta: 'When "How Was Your Day?" Stops Working in Your LDR',
    description:
      'Long-distance conversations going flat? Start with the free couple quiz — six questions that show you both what actually lands. Long distance relationship tips, LDR communication.',
  },
  {
    slug: 'hook-guessing',
    eyebrow: 'LONG DISTANCE TRUTH',
    title: 'Distance isn’t the problem.',
    highlight: 'Guessing is.',
    sub: 'Find out exactly how your partner wants to be loved when you can’t be there.',
    title_meta: "Distance Isn't the Problem in Your LDR — Guessing Is",
    description:
      'Across distance there are no accidental corrections: if you guess wrong about what your partner needs, nobody finds out until it hurts. Take the free quiz together and stop guessing.',
  },
  {
    slug: 'hook-send-this',
    eyebrow: 'TAG YOUR PERSON',
    title: 'Send this to',
    highlight: 'your person.',
    sub: 'You answer six questions. They answer the same six. The reveal is worth it.',
    title_meta: 'Send This Quiz to Your Long-Distance Partner',
    description:
      'The quiz long-distance couples send each other: six questions each, then a private side-by-side reveal of where you match. Free couple quiz for LDR, boyfriend quiz, girlfriend quiz.',
  },
  {
    slug: 'hook-instructions',
    eyebrow: 'MATCH REVEAL',
    title: 'Differences aren’t failures.',
    highlight: 'They’re instructions.',
    sub: 'Your match score isn’t a verdict — it’s a map of the conversations worth having.',
    title_meta: "Your Couple Quiz Differences Aren't Failures — They're Instructions",
    description:
      'A low match score is not bad news: every mismatch shows exactly where you and your long-distance partner need different things. Take the free two-minute quiz and compare.',
  },
];

const BLOG_PINS = [
  {
    slug: 'blog-questions',
    path: '/blog/long-distance-relationship-questions',
    eyebrow: 'SAVE FOR YOUR NEXT CALL',
    title: '100 questions for long-distance couples',
    sub: 'Deep, playful, and spicy questions that make video calls feel like dates again.',
    title_meta: '100 Long-Distance Relationship Questions for Your Next Call',
    description:
      'Save this list: 100 questions for long-distance couples — deep, funny, and future-focused — to make your next call actually memorable. LDR questions, couple conversation starters.',
  },
  {
    slug: 'blog-date-ideas',
    path: '/blog/long-distance-date-ideas',
    eyebrow: 'DATE NIGHT, ANY DISTANCE',
    title: 'Long-distance date ideas that don’t get old',
    sub: 'Creative virtual dates beyond “watch a movie on call” — save this for the weekend.',
    title_meta: 'Long-Distance Date Ideas That Don’t Get Old',
    description:
      'Creative long-distance date ideas for couples apart: virtual dates, games, rituals, and surprises that keep an LDR fun. Save for your next date night.',
  },
  {
    slug: 'blog-texts',
    path: '/blog/long-distance-relationship-texts',
    eyebrow: 'SCREENSHOT-WORTHY',
    title: 'Texts that actually land across distance',
    sub: 'What to send when you miss them, when they’re down, and when words feel small.',
    title_meta: 'Long-Distance Relationship Texts That Actually Land',
    description:
      'The right text at the right moment: messages for when you miss them, hard days, and good mornings — written for long-distance couples. LDR texts, relationship messages.',
  },
  {
    slug: 'blog-open-when',
    path: '/blog/open-when-letters',
    eyebrow: 'THE CLASSIC, DONE RIGHT',
    title: '“Open when…” letters they’ll keep forever',
    sub: 'Prompts and ideas for the letter box that gets your partner through the hard nights.',
    title_meta: 'Open When Letters: Ideas & Prompts for Long-Distance Couples',
    description:
      'How to write open-when letters your long-distance partner will keep forever — prompts, ideas, and examples for every mood. LDR gifts, open when letter ideas.',
  },
  {
    slug: 'blog-statistics',
    path: '/blog/long-distance-relationship-statistics',
    eyebrow: 'THE REAL NUMBERS',
    title: 'Long-distance statistics that surprise people',
    sub: 'How many LDRs make it, what breaks them, and what the couples who last do differently.',
    title_meta: 'Long-Distance Relationship Statistics: What the Research Says',
    description:
      'Do long-distance relationships work? The real statistics: success rates, average distance, and the habits of couples who make it. LDR statistics, long distance facts.',
  },
  {
    slug: 'blog-games',
    path: '/blog/long-distance-relationship-games',
    eyebrow: 'BETTER THAN SMALL TALK',
    title: 'Games to play when you’re miles apart',
    sub: 'From two-player apps to question games — save this for your next long call.',
    title_meta: 'Long-Distance Relationship Games for Couples Apart',
    description:
      'Fun games for long-distance couples: question games, app games, and challenges that turn calls into date nights. LDR games, couple games online.',
  },
];

// ── Product Hunt gallery (1270x760) ──────────────────────────────

function phFrame(children) {
  return {
    type: 'div',
    props: {
      style: {
        width: '1270px',
        height: '760px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        fontFamily: 'Nunito',
        padding: '60px 80px',
        position: 'relative',
      },
      children,
    },
  };
}

const phHero = phFrame([
  { type: 'img', props: { src: fox, width: 150, height: 150, style: { marginBottom: 28 } } },
  text('FAR FOX', { fontSize: 30, fontWeight: 900, letterSpacing: 12, color: gold, marginBottom: 18 }),
  {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontSize: 64,
        fontWeight: 900,
        color: ink,
        lineHeight: 1.15,
        marginBottom: 22,
      },
      children: [
        text('A daily ritual for couples', { justifyContent: 'center' }),
        text('who live apart', { color: pink, justifyContent: 'center' }),
      ],
    },
  },
  text('Questions, love letters, photos, challenges, countdowns — and a shared fox you raise together.', {
    fontSize: 30,
    fontWeight: 700,
    color: muted,
    textAlign: 'center',
    justifyContent: 'center',
    maxWidth: 900,
  }),
]);

const phSteps = phFrame([
  text('HOW IT WORKS', { fontSize: 26, fontWeight: 900, letterSpacing: 10, color: gold, marginBottom: 40 }),
  {
    type: 'div',
    props: {
      style: { display: 'flex', gap: 30 },
      children: [
        ['1', 'Take the 2-minute quiz', 'Six questions about how you love. No signup.'],
        ['2', 'Your partner takes theirs', 'One private link. The reveal unlocks when they finish.'],
        ['3', 'Build the daily ritual', 'Join Far Fox together and raise your fox with daily connection.'],
      ].map(([step, title, sub]) => ({
        type: 'div',
        props: {
          style: {
            display: 'flex',
            flexDirection: 'column',
            width: 350,
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 30,
            padding: '38px 32px',
            gap: 14,
          },
          children: [
            text(step, { fontSize: 52, fontWeight: 900, color: pink }),
            text(title, { fontSize: 32, fontWeight: 900, color: ink, lineHeight: 1.2 }),
            text(sub, { fontSize: 24, fontWeight: 700, color: muted, lineHeight: 1.4 }),
          ],
        },
      })),
    },
  },
]);

const emojiCell = (emoji, matches) => ({
  type: 'div',
  props: {
    style: {
      width: 92,
      height: 92,
      borderRadius: 22,
      background: matches ? 'rgba(255,107,138,0.16)' : 'rgba(255,255,255,0.75)',
      border: matches ? '3px solid #FF6B8A' : '3px solid rgba(255,255,255,0)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 48,
    },
    children: emoji,
  },
});

const phReveal = phFrame([
  text('THE MATCH REVEAL', { fontSize: 26, fontWeight: 900, letterSpacing: 10, color: gold, marginBottom: 24 }),
  {
    type: 'div',
    props: {
      style: { display: 'flex', alignItems: 'baseline', marginBottom: 34 },
      children: [
        text('Maya + Jon matched', { fontSize: 54, fontWeight: 900, color: ink }),
        text('\u00A03/6', { fontSize: 66, fontWeight: 900, color: pink }),
      ],
    },
  },
  {
    type: 'div',
    props: {
      style: { display: 'flex', flexDirection: 'column', gap: 16 },
      children: [
        ['🎙️', '🤗', '📅', '🎬', '☕', '🌊'],
        ['🎙️', '🌿', '📅', '🥾', '☕', '🎲'],
      ].map((row, rowIndex) => ({
        type: 'div',
        props: {
          style: { display: 'flex', gap: 16 },
          children: row.map((emoji, i) => emojiCell(emoji, [true, false, true, false, true, false][i])),
        },
      })),
    },
  },
  text('Matches show your rhythm. Mismatches show the conversation you need.', {
    fontSize: 27,
    fontWeight: 700,
    color: muted,
    marginTop: 34,
  }),
]);

const phFeatures = phFrame([
  text('WHAT’S INSIDE', { fontSize: 26, fontWeight: 900, letterSpacing: 10, color: gold, marginBottom: 40 }),
  {
    type: 'div',
    props: {
      style: { display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', maxWidth: 1050 },
      children: [
        ['💬', 'Daily questions'],
        ['💌', 'Love letters'],
        ['📸', 'Photo sharing'],
        ['🎯', 'Couple challenges'],
        ['📅', 'Reunion countdowns'],
        ['🦊', 'A shared fox to raise'],
      ].map(([emoji, label]) => ({
        type: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 999,
            padding: '24px 40px',
            fontSize: 32,
            fontWeight: 900,
            color: ink,
          },
          children: [text(emoji, { fontSize: 40 }), label],
        },
      })),
    },
  },
  text('Free to start · Both partners join one private space', {
    fontSize: 28,
    fontWeight: 700,
    color: muted,
    marginTop: 44,
  }),
]);

const phCta = phFrame([
  { type: 'img', props: { src: fox, width: 130, height: 130, style: { marginBottom: 26 } } },
  {
    type: 'div',
    props: {
      style: { display: 'flex', fontSize: 64, fontWeight: 900, color: ink, marginBottom: 24 },
      children: [text('Find out where you'), text('\u00A0match', { color: pink }), text('.')],
    },
  },
  {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        background: `linear-gradient(90deg, ${pink}, ${purple})`,
        borderRadius: 999,
        padding: '26px 60px',
        fontSize: 34,
        fontWeight: 900,
        color: '#FFFFFF',
      },
      children: 'lovefarfox.com/couple-quiz',
    },
  },
]);

// ── Generate everything ──────────────────────────────────────────

FONTS = await loadFonts();

const manifest = [];

for (const [index, question] of RITUAL_QUESTIONS.entries()) {
  const file = resolve(outPins, `question-${index + 1}-${question.key}.png`);
  await render(questionPin(question, index), 1000, 1500, file);
  manifest.push({
    file: `pins/question-${index + 1}-${question.key}.png`,
    board: 'Couple Quizzes & Questions',
    title: `Couple Quiz Q${index + 1}: ${question.prompt}`,
    description:
      `${question.prompt} Answer all six with your partner in the free 2-minute Far Fox couple quiz ` +
      'and reveal where your love profiles match. Long distance relationship quiz, LDR couple quiz.',
    link: pinLink('/couple-quiz', `pin_q_${question.key}`),
  });
}

for (const hook of HOOKS) {
  const file = resolve(outPins, `${hook.slug}.png`);
  await render(hookPin(hook), 1000, 1500, file);
  manifest.push({
    file: `pins/${hook.slug}.png`,
    board: 'Long Distance Relationship Ideas',
    title: hook.title_meta,
    description: hook.description,
    link: pinLink('/couple-quiz', `pin_${hook.slug.replaceAll('-', '_')}`),
  });
}

for (const post of BLOG_PINS) {
  const file = resolve(outPins, `${post.slug}.png`);
  await render(blogPin(post), 1000, 1500, file);
  manifest.push({
    file: `pins/${post.slug}.png`,
    board: 'Long Distance Relationship Ideas',
    title: post.title_meta,
    description: post.description,
    link: pinLink(post.path, `pin_${post.slug.replaceAll('-', '_')}`),
  });
}

await render(phHero, 1270, 760, resolve(outPh, '1-hero.png'));
await render(phSteps, 1270, 760, resolve(outPh, '2-how-it-works.png'));
await render(phReveal, 1270, 760, resolve(outPh, '3-match-reveal.png'));
await render(phFeatures, 1270, 760, resolve(outPh, '4-features.png'));
await render(phCta, 1270, 760, resolve(outPh, '5-cta.png'));

writeFileSync(resolve(root, 'out/launch/pins.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.length} pins + 5 Product Hunt gallery images → out/launch/`);
