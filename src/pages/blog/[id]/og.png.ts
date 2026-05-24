/**
 * Per-post Open Graph image — 1200x630 PNG, rendered on-demand.
 *
 * Replaces the generic brand OG card for blog posts so previews in
 * iMessage / Twitter / Discord / LinkedIn show the actual post title
 * and date, dramatically lifting share CTR.
 *
 * Pipeline mirrors the profile OG endpoint:
 *   satori (JSX → SVG) → @resvg/resvg-js (SVG → PNG)
 */

import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getCollection } from 'astro:content';

// Per-blog-post OG images are generated at build time so they can be
// served from the static CDN edge — fast, free, and never cold.
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({
    params: { id: post.id },
    props: { post },
  }));
}

// Module-level font cache so all paths in the same build share one
// download instead of re-fetching Nunito 30 times.
let cachedNunito800: ArrayBuffer | null = null;
let cachedNunito900: ArrayBuffer | null = null;
let cachedNunito400: ArrayBuffer | null = null;

async function loadFonts() {
  if (!cachedNunito900) {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Nunito:wght@400;800;900&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then((r) => r.text());
    const ttfs = [...css.matchAll(/url\((https:[^)]+\.ttf)\)/g)].map((m) => m[1]);
    const [w400, w800, w900] = await Promise.all([
      fetch(ttfs[0]).then((r) => r.arrayBuffer()),
      fetch(ttfs[1] || ttfs[0]).then((r) => r.arrayBuffer()),
      fetch(ttfs[2] || ttfs[1] || ttfs[0]).then((r) => r.arrayBuffer()),
    ]);
    cachedNunito400 = w400;
    cachedNunito800 = w800;
    cachedNunito900 = w900;
  }
  return {
    w400: cachedNunito400!,
    w800: cachedNunito800!,
    w900: cachedNunito900!,
  };
}

export const GET: APIRoute = async ({ props }) => {
  const post = (props as { post: { data: { title: string; description: string; date: string } } })
    .post;

  const { w400, w800, w900 } = await loadFonts();
  const publishDate = new Date(post.data.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Nunito',
          padding: '70px 80px',
          // Match the landing's "default" hero gradient so blog cards
          // feel like the same product surface.
          background:
            'linear-gradient(160deg, #FFF6E2 0%, #FFE0E5 40%, #F5D2EC 75%, #E8D0FF 100%)',
          position: 'relative',
        },
        children: [
          // Subtle corner orb for depth
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: -200,
                right: -200,
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
                background: 'rgba(183,108,253,0.22)',
                filter: 'blur(70px)',
                display: 'flex',
              },
            },
          },
          // Brand chip top-left
          {
            type: 'div',
            props: {
              style: {
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              },
              children: [
                {
                  type: 'img',
                  props: {
                    src: 'https://lovefarfox.com/fox-face.png',
                    width: 60,
                    height: 60,
                    style: {
                      filter: 'drop-shadow(0 6px 12px rgba(255,107,138,0.30))',
                    },
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 26,
                      fontWeight: 900,
                      letterSpacing: 1,
                      color: '#2D1B4E',
                    },
                    children: 'Far Fox',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'rgba(45,27,78,0.45)',
                      marginLeft: 10,
                    },
                    children: '· Blog',
                  },
                },
              ],
            },
          },
          // Title — fills the middle, sized down if very long
          {
            type: 'div',
            props: {
              style: {
                position: 'relative',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                marginTop: 30,
                marginBottom: 30,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      // Two-stage sizing: titles up to ~80 chars get
                      // the full 72px treatment, longer ones drop to
                      // 58px so they don't run off the bottom.
                      fontSize: post.data.title.length > 80 ? 56 : 72,
                      fontWeight: 900,
                      color: '#2D1B4E',
                      lineHeight: 1.05,
                      maxWidth: 1040,
                    },
                    children: post.data.title,
                  },
                },
              ],
            },
          },
          // Footer row: date + URL
          {
            type: 'div',
            props: {
              style: {
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 22,
                fontWeight: 800,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { color: 'rgba(45,27,78,0.55)' },
                    children: publishDate,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      color: '#FF6B8A',
                      letterSpacing: 0.3,
                    },
                    children: 'lovefarfox.com',
                  },
                },
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
        { name: 'Nunito', data: w900, weight: 900, style: 'normal' },
      ],
    },
  );

  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
    .render()
    .asPng();

  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      // Posts are static at build time — long cache is fine.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
