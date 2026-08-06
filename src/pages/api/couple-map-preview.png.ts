import type { APIRoute } from 'astro';
// @ts-ignore - shared plain-JS renderer
import { renderCoupleMap, sanitizeMapInput } from '../../lib/coupleMap.mjs';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const input = sanitizeMapInput(Object.fromEntries(url.searchParams));
  try {
    const png = await renderCoupleMap(input, 1000);
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('couple map preview failed', String(error));
    return new Response('render failed', { status: 500 });
  }
};
