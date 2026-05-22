/**
 * Per-profile Open Graph image — 1200x630 PNG rendered on-demand.
 *
 * The single biggest CTR lever for shared profile links: when someone
 * drops `lovefarfox.com/profile/<slug>` into iMessage / Twitter / Discord,
 * the preview card now shows *their* personalized profile (name + the
 * six emoji answers) instead of the generic brand card.
 *
 * Pipeline: satori (JSX → SVG) → @resvg/resvg-js (SVG → PNG).
 */

import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { fetchProfileBySlug } from '../../../lib/supabase';
import {
  RITUAL_QUESTIONS,
  findChoice,
  ritualsTagline,
} from '../../../lib/connectionRituals';

export const prerender = false;

// Cache the font binary across requests in the same warm function.
// Google Fonts serves the static binary for download once per Nunito
// weight. We pull two weights for headline vs body contrast.
let cachedNunito800: ArrayBuffer | null = null;
let cachedNunito400: ArrayBuffer | null = null;

async function loadFonts() {
  if (!cachedNunito800) {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Nunito:wght@400;800;900&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then((r) => r.text());
    const urls = [...css.matchAll(/url\((https:[^)]+\.(?:ttf|woff2?))\)/g)].map(
      (m) => m[1],
    );
    // Fonts URLs come back in declaration order — first ttf is 400,
    // next is 800 etc. Filter to ttf if both formats are present.
    const ttfUrls = urls.filter((u) => u.endsWith('.ttf'));
    const pool = ttfUrls.length >= 2 ? ttfUrls : urls;
    const [w400, w800] = await Promise.all([
      fetch(pool[0]).then((r) => r.arrayBuffer()),
      fetch(pool[Math.min(1, pool.length - 1)]).then((r) => r.arrayBuffer()),
    ]);
    cachedNunito400 = w400;
    cachedNunito800 = w800;
  }
  return { w400: cachedNunito400!, w800: cachedNunito800! };
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug || typeof slug !== 'string') {
    return new Response('Not found', { status: 404 });
  }

  const profile = await fetchProfileBySlug(slug);
  if (!profile || !profile.connection_rituals) {
    return new Response('Not found', { status: 404 });
  }

  const firstName = profile.name.split(' ')[0];
  const answers = profile.connection_rituals;
  const tagline = ritualsTagline(answers);

  // Pull the six chosen emojis in the canonical question order so the
  // image reads left-to-right like the page does.
  const chosenEmojis: string[] = [];
  for (const q of RITUAL_QUESTIONS) {
    const choice = findChoice(q.key, answers[q.key] ?? '');
    if (choice) chosenEmojis.push(choice.emoji);
  }

  const { w400, w800 } = await loadFonts();

  // Cache of emoji codepoint → data URL across requests in the same
  // warm function. Twemoji SVGs are tiny but the network hop adds
  // ~50ms per emoji on a cold request — caching avoids repeat fetches.
  const emojiCache = new Map<string, string>();

  /**
   * Satori calls this when it encounters a glyph the font can't render
   * (i.e. emojis). We fetch the matching Twemoji SVG and hand back a
   * data: URL — satori inlines it as an `<image>` node.
   */
  async function loadEmoji(segment: string): Promise<string> {
    // Codepoints joined with '-', with the variation-selector (FE0F)
    // stripped because Twemoji's filenames omit it for most glyphs.
    const codepoints = [...segment]
      .map((c) => c.codePointAt(0)?.toString(16))
      .filter((c): c is string => !!c && c !== 'fe0f')
      .join('-');

    if (emojiCache.has(codepoints)) return emojiCache.get(codepoints)!;

    const url = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoints}.svg`;
    let svgText: string;
    try {
      svgText = await fetch(url).then((r) => r.text());
    } catch {
      // Fall through to an empty pixel — better than a missing-glyph box.
      return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=';
    }
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
    emojiCache.set(codepoints, dataUrl);
    return dataUrl;
  }

  // ── Compose the OG card with satori ─────────────────────────────
  // Satori uses a strict subset of CSS — flex layout, no grid. Sizes
  // are in px, everything is explicit.
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #FFF6E2 0%, #FDE6CB 45%, #FFD9D9 100%)',
          fontFamily: 'Nunito',
          padding: '60px 80px',
          position: 'relative',
        },
        children: [
          // Eyebrow
          {
            type: 'div',
            props: {
              style: {
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 8,
                color: '#C78A2E',
                marginBottom: 20,
              },
              children: 'A LOVE PROFILE',
            },
          },
          // Headline — name highlighted in the brand pink
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'baseline',
                fontSize: 84,
                fontWeight: 800,
                color: '#2D1B4E',
                lineHeight: 1.05,
                marginBottom: 24,
                textAlign: 'center',
              },
              children: [
                'How ',
                {
                  type: 'span',
                  props: {
                    style: { color: '#FF6B8A', padding: '0 6px' },
                    children: firstName,
                  },
                },
                ' loves',
              ],
            },
          },
          // Tagline — italic body line summarizing the user's answers
          {
            type: 'div',
            props: {
              style: {
                fontSize: 28,
                fontWeight: 400,
                fontStyle: 'italic',
                color: '#6B5B7B',
                marginBottom: 50,
                textAlign: 'center',
                maxWidth: 900,
                lineHeight: 1.35,
              },
              children: tagline,
            },
          },
          // The six chosen emojis on a single row — at this scale the
          // emojis themselves carry the story without needing labels.
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                gap: 28,
                marginBottom: 40,
              },
              children: chosenEmojis.map((emoji) => ({
                type: 'div',
                props: {
                  style: {
                    width: 100,
                    height: 100,
                    borderRadius: 24,
                    background: 'rgba(255,255,255,0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 56,
                    boxShadow: '0 8px 24px rgba(199,138,46,0.18)',
                  },
                  children: emoji,
                },
              })),
            },
          },
          // Branded footer row — small Foxy face anchor + "Far Fox"
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: 32,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#8A5A24',
                fontSize: 22,
                fontWeight: 800,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 28,
                    },
                    children: '🦊',
                  },
                },
                'Far Fox · lovefarfox.com',
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Nunito', data: w400, weight: 400, style: 'normal' },
        { name: 'Nunito', data: w800, weight: 800, style: 'normal' },
      ],
      loadAdditionalAsset: async (code, segment) => {
        if (code === 'emoji') {
          return await loadEmoji(segment);
        }
        return code;
      },
    },
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      // Cache aggressively at the edge — these images don't change
      // unless the user retakes the quiz. 5 min CDN cache, 1 day
      // stale-while-revalidate for warm regen.
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  });
};
