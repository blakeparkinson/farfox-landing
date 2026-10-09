import type { APIRoute } from 'astro';
// @ts-ignore - plain-JS modules shared with scripts/make-ornament.mjs
import { renderOrnamentPng } from '../../lib/ornamentRender.mjs';
// @ts-ignore
import { sanitizeCity } from '../../lib/ornamentArt.mjs';

export const prerender = false;

/**
 * Personalised ornament print file: GET /api/ornament.png?top=NEW%20YORK&bottom=LONDON
 * Printful fetches this URL at fulfilment (snipcart-webhook). With `w`, it returns a small preview
 * clipped to the heart for the shop's live preview instead.
 */
const PREVIEW_WIDTH = { min: 200, max: 1000 };
export const GET: APIRoute = async ({ url }) => {
  const top = sanitizeCity(url.searchParams.get('top'));
  const bottom = sanitizeCity(url.searchParams.get('bottom'));
  if (!top && !bottom) return new Response('top or bottom required', { status: 400 });
  const w = parseInt(url.searchParams.get('w') || '', 10);
  const preview = Number.isFinite(w);
  try {
    const png = await renderOrnamentPng({ top, bottom, preview, site: url.origin, ...(preview ? { width: Math.min(PREVIEW_WIDTH.max, Math.max(PREVIEW_WIDTH.min, w)) } : {}) });
    return new Response(new Uint8Array(png), { status: 200, headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' } });
  } catch (e) {
    console.error('ornament render failed', String(e));
    return new Response('render error', { status: 500 });
  }
};
