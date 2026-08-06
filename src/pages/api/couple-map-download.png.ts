import type { APIRoute } from 'astro';
// @ts-ignore - plain-JS renderer/order helpers
import { renderCoupleMap, sanitizeMapInput } from '../../lib/coupleMap.mjs';
// @ts-ignore
import { fetchSnipcartOrder, isPaidOrder, mapInputFromOrder } from '../../lib/digitalMapOrder.mjs';
// @ts-ignore
import { verifyEtsyRedemption } from '../../lib/etsyReceipt.mjs';

export const prerender = false;

const SNIPCART_SECRET = import.meta.env.SNIPCART_SECRET_KEY as string | undefined;
const MAP_REDEMPTION_SECRET = import.meta.env.MAP_REDEMPTION_SECRET as string | undefined;

export const GET: APIRoute = async ({ url }) => {
  const token = (url.searchParams.get('order') || '').trim();
  const etsyToken = (url.searchParams.get('etsy') || '').trim();
  let input = null;

  if (etsyToken && MAP_REDEMPTION_SECRET && verifyEtsyRedemption(etsyToken, MAP_REDEMPTION_SECRET)) {
    input = sanitizeMapInput(Object.fromEntries(url.searchParams));
  } else if (token && SNIPCART_SECRET) {
    const order = await fetchSnipcartOrder(token, SNIPCART_SECRET).catch(() => null);
    input = order && isPaidOrder(order) ? mapInputFromOrder(order) : null;
  }

  if (!input) {
    return new Response('A paid personalized map order is required', { status: 403 });
  }

  try {
    const png = await renderCoupleMap(input, 4800);
    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="far-fox-long-distance-map.png"',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('paid couple map render failed', String(error));
    return new Response('Your map could not be rendered. Please contact blake@lovefarfox.com.', { status: 500 });
  }
};
