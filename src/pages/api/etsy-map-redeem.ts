import type { APIRoute } from 'astro';
// @ts-ignore - plain-JS Etsy helpers
import { signEtsyRedemption, validateEtsyReceipt } from '../../lib/etsyReceipt.mjs';

export const prerender = false;

const ETSY_API_KEY = import.meta.env.ETSY_API_KEY as string | undefined;
const ETSY_ACCESS_TOKEN = import.meta.env.ETSY_ACCESS_TOKEN as string | undefined;
const ETSY_SHOP_ID = import.meta.env.ETSY_SHOP_ID as string | undefined;
const ETSY_MAP_LISTING_ID = import.meta.env.ETSY_MAP_LISTING_ID as string | undefined;
const MAP_REDEMPTION_SECRET = import.meta.env.MAP_REDEMPTION_SECRET as string | undefined;

const json = (value: object, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  if (!ETSY_API_KEY || !ETSY_ACCESS_TOKEN || !ETSY_SHOP_ID || !ETSY_MAP_LISTING_ID || !MAP_REDEMPTION_SECRET) {
    return json({ error: 'Etsy redemption is not configured yet' }, 503);
  }
  const body = await request.json().catch(() => null);
  const receiptId = String(body?.orderNumber || '').replace(/\D/g, '').slice(0, 24);
  const email = String(body?.email || '').trim().toLowerCase().slice(0, 200);
  if (!receiptId || !email.includes('@')) return json({ error: 'Enter your Etsy order number and purchase email' }, 400);

  const receipt = await validateEtsyReceipt({
    receiptId,
    email,
    shopId: ETSY_SHOP_ID,
    listingId: ETSY_MAP_LISTING_ID,
    apiKey: ETSY_API_KEY,
    accessToken: ETSY_ACCESS_TOKEN,
  }).catch(() => null);
  if (!receipt) return json({ error: 'We could not verify that paid Etsy order' }, 403);

  const token = signEtsyRedemption({
    receiptId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
  }, MAP_REDEMPTION_SECRET);
  return json({
    token,
    customizeUrl: '/personalized-long-distance-map?etsy=1&utm_source=etsy&utm_medium=marketplace&utm_campaign=personalized_map',
  });
};
