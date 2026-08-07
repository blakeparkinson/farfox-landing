/**
 * Per-match Open Graph image — 1200x630 PNG rendered on-demand.
 *
 * The match URL is the most-shared link in the referral loop: one partner
 * sends it to the other, and couples reshare the reveal. This card shows
 * their names, the overlap score, and both emoji answer rows so the
 * preview creates curiosity instead of showing the generic brand card.
 */

import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { fetchProfileBySlug } from '../../../../lib/supabase';
import { compareRituals } from '../../../../lib/connectionRituals';

export const prerender = false;

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

const emojiCache = new Map<string, string>();

async function loadEmoji(segment: string): Promise<string> {
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
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=';
  }
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgText).toString('base64')}`;
  emojiCache.set(codepoints, dataUrl);
  return dataUrl;
}

/** One row of six emoji cells; matched cells get a warm highlight. */
function emojiRow(
  label: string,
  color: string,
  emojis: { emoji: string; matches: boolean }[],
) {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', alignItems: 'center', gap: 18 },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width: 150,
              fontSize: 26,
              fontWeight: 800,
              color,
              textAlign: 'right',
              justifyContent: 'flex-end',
              display: 'flex',
            },
            children: label,
          },
        },
        ...emojis.map(({ emoji, matches }) => ({
          type: 'div',
          props: {
            style: {
              width: 84,
              height: 84,
              borderRadius: 20,
              background: matches ? 'rgba(255,107,138,0.16)' : 'rgba(255,255,255,0.65)',
              border: matches ? '3px solid #FF6B8A' : '3px solid rgba(255,255,255,0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
            },
            children: emoji,
          },
        })),
      ],
    },
  };
}

export const GET: APIRoute = async ({ params }) => {
  const { left, right } = params;
  if (!left || !right || left === right) {
    return new Response('Not found', { status: 404 });
  }

  const [leftProfile, rightProfile] = await Promise.all([
    fetchProfileBySlug(left),
    fetchProfileBySlug(right),
  ]);
  if (!leftProfile?.connection_rituals || !rightProfile?.connection_rituals) {
    return new Response('Not found', { status: 404 });
  }

  const leftName = leftProfile.name.split(' ')[0];
  const rightName = rightProfile.name.split(' ')[0];
  const comparison = compareRituals(
    leftProfile.connection_rituals,
    rightProfile.connection_rituals,
  );

  const leftRow = comparison.rows.map((row) => ({ emoji: row.left.emoji, matches: row.matches }));
  const rightRow = comparison.rows.map((row) => ({ emoji: row.right.emoji, matches: row.matches }));

  const { w400, w800 } = await loadFonts();

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
          background: 'linear-gradient(135deg, #FFF6E2 0%, #FDE6CB 45%, #FFD9D9 100%)',
          fontFamily: 'Nunito',
          padding: '48px 60px',
          position: 'relative',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 8,
                color: '#C78A2E',
                marginBottom: 14,
              },
              children: 'YOUR LOVE OVERLAP',
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'baseline',
                fontSize: 68,
                fontWeight: 800,
                color: '#2D1B4E',
                lineHeight: 1.05,
                marginBottom: 10,
              },
              children: [
                { type: 'span', props: { style: { color: '#FF6B8A' }, children: leftName } },
                { type: 'span', props: { style: { color: '#B0A3C2', padding: '0 18px' }, children: '+' } },
                { type: 'span', props: { style: { color: '#B76CFD' }, children: rightName } },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'baseline',
                marginBottom: 28,
              },
              children: [
                {
                  type: 'span',
                  props: {
                    style: { fontSize: 96, fontWeight: 800, color: '#FF6B8A', lineHeight: 1 },
                    children: String(comparison.matches),
                  },
                },
                {
                  type: 'span',
                  props: {
                    style: { fontSize: 44, fontWeight: 800, color: '#B0A3C2' },
                    children: `/${comparison.total} matched`,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: { display: 'flex', flexDirection: 'column', gap: 14 },
              children: [
                emojiRow(leftName, '#FF6B8A', leftRow),
                emojiRow(rightName, '#B76CFD', rightRow),
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: 26,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#8A5A24',
                fontSize: 22,
                fontWeight: 800,
              },
              children: [
                { type: 'div', props: { style: { fontSize: 28 }, children: '🦊' } },
                'Take yours free · lovefarfox.com/couple-quiz',
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
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    },
  });
};
