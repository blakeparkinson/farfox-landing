import type { APIRoute } from 'astro';
// @ts-ignore - plain-JS module shared with the local test harness
import { renderJerseyBack, isKnownKit, sanitize } from '../../lib/jerseyBack.mjs';

export const prerender = false;

/**
 * On-demand personalized jersey BACK print file.
 *
 *   GET /api/jersey-back.png?kit=twilight&number=7&name=ALEX
 *
 * Printful fetches this URL directly at fulfilment (see snipcart-webhook),
 * so no file hosting/upload is needed — the URL *is* the asset. Inputs are
 * sanitized hard (the endpoint is public): number → ≤3 digits, name →
 * A–Z0–9 + space.'- , ≤14 chars, uppercased.
 */
export const GET: APIRoute = async ({ url }) => {
  const kit = url.searchParams.get('kit') || '';
  if (!isKnownKit(kit)) return new Response('unknown kit', { status: 404 });

  const { name, number } = sanitize({
    name: url.searchParams.get('name'),
    number: url.searchParams.get('number'),
  });
  if (!name && !number) return new Response('name or number required', { status: 400 });

  // Optional render width: the shop live-preview asks for a small fast image;
  // Printful (no `w`) gets the full print resolution. Clamped to a sane range.
  const w = parseInt(url.searchParams.get('w') || '', 10);
  const size = Number.isFinite(w) ? Math.min(4500, Math.max(300, w)) : 4500;

  try {
    const png = await renderJerseyBack({ kit, name, number, size });
    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // Deterministic for a given (kit,name,number) — cache hard at the edge.
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (e) {
    console.error('jersey-back render failed', String(e));
    return new Response('render error', { status: 500 });
  }
};
