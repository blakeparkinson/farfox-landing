import type { APIRoute } from 'astro';
// @ts-ignore - plain-JS module (no heavy deps) shared with shop + generator
import { kitSlugForName, backUrl } from '../../lib/kits.mjs';

export const prerender = false;

/**
 * Snipcart → Printful fulfillment glue (catalog-agnostic).
 *
 * Each Snipcart line item's id IS the Printful sync-product id (the shop
 * catalog is generated from Printful, so this is guaranteed). On
 * order.completed we look the sync product up, pick the variant matching
 * the chosen size, and create a Printful order by sync_variant_id —
 * Printful already knows the print files and product from the sync product.
 *
 * There is NO per-product mapping here: adding products in Printful needs
 * no change to this file.
 *
 * Required Vercel env vars:
 *   PRINTFUL_TOKEN, SNIPCART_SECRET_KEY (+ optional PRINTFUL_STORE_ID,
 *   PRINTFUL_AUTOCONFIRM="true").
 * Snipcart webhook URL: https://lovefarfox.com/api/snipcart-webhook
 */

const PF_TOKEN = import.meta.env.PRINTFUL_TOKEN as string | undefined;
const PF_STORE = (import.meta.env.PRINTFUL_STORE_ID as string | undefined) ?? '18292625';
const SNIPCART_SECRET = import.meta.env.SNIPCART_SECRET_KEY as string | undefined;
const AUTOCONFIRM = (import.meta.env.PRINTFUL_AUTOCONFIRM as string | undefined) === 'true';

const pfHeaders = () => ({
  Authorization: `Bearer ${PF_TOKEN}`,
  'X-PF-Store-Id': PF_STORE,
  'Content-Type': 'application/json',
});

async function pfGet(path: string) {
  const r = await fetch(`https://api.printful.com${path}`, { headers: pfHeaders() });
  if (!r.ok) throw new Error(`PF GET ${path} -> ${r.status}`);
  return (await r.json()).result;
}

/**
 * Resolve a Snipcart line item to a Printful sync variant by size + colour.
 * Returns the full variant object (id, files, …) plus the product name, so
 * callers can override print files for personalization.
 */
async function resolveSyncVariant(
  productId: string,
  size: string | null,
  color: string | null,
): Promise<{ variant: any; productName: string } | null> {
  const detail = await pfGet(`/store/products/${productId}`);
  const variants = (detail.sync_variants || []).filter((v: any) => !v.is_ignored);
  if (!variants.length) return null;
  const productName = detail.sync_product?.name || '';
  const eq = (a: string, b: string | null) => !!b && (a || '').toLowerCase() === b.toLowerCase();
  let variant: any = null;
  // Most specific first: colour + size, then size, then colour, then first.
  if (size && color) variant = variants.find((v: any) => eq(v.size, size) && eq(v.color, color));
  if (!variant && size) variant = variants.find((v: any) => eq(v.size, size));
  if (!variant && color) variant = variants.find((v: any) => eq(v.color, color));
  if (!variant) variant = variants[0]; // single-variant product, or nothing matched
  return { variant, productName };
}

async function validateSnipcart(token: string): Promise<boolean> {
  if (!SNIPCART_SECRET) return false;
  const r = await fetch(`https://app.snipcart.com/api/requestvalidation/${token}`, {
    headers: { Authorization: `Bearer ${SNIPCART_SECRET}`, Accept: 'application/json' },
  });
  return r.ok;
}

export const POST: APIRoute = async ({ request }) => {
  if (!PF_TOKEN || !SNIPCART_SECRET) {
    console.warn('snipcart-webhook: missing PRINTFUL_TOKEN or SNIPCART_SECRET_KEY');
    return new Response('not configured', { status: 200 });
  }
  const token = request.headers.get('x-snipcart-requesttoken');
  if (!token || !(await validateSnipcart(token))) {
    return new Response('invalid token', { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (!body || body.eventName !== 'order.completed') {
    return new Response('ignored', { status: 200 });
  }

  const order = body.content ?? {};
  const ship = order.shippingAddress ?? {};
  const items = order.items ?? [];

  const pfItems: any[] = [];
  const skipped: string[] = [];
  for (const it of items) {
    const cf = it.customFields ?? [];
    const fv = (n: string) =>
      cf.find((f: any) => (f.name || '').toLowerCase() === n)?.value ?? null;
    const size = fv('size');
    const color = fv('color');
    const name = fv('name');
    const number = fv('number');

    let resolved: { variant: any; productName: string } | null = null;
    try { resolved = await resolveSyncVariant(it.id, size, color); }
    catch (e) { console.error('resolve failed', it.id, String(e)); }
    if (!resolved) { skipped.push(it.id); continue; }

    const { variant, productName } = resolved;
    const item: any = { sync_variant_id: variant.id, quantity: it.quantity ?? 1 };

    // Personalization: if this is a known jersey kit and the customer entered a
    // name and/or number, override the BACK print file with a generated one.
    // Front + sleeves are carried over from the sync variant unchanged.
    const kit = kitSlugForName(productName);
    if (kit && (name || number)) {
      const customBack = backUrl(kit, name, number);
      const files = (variant.files || [])
        .filter((f: any) => f.type !== 'preview' && f.url)
        .map((f: any) => ({ type: f.type, url: f.type === 'back' ? customBack : f.url }));
      if (!files.some((f: any) => f.type === 'back')) files.push({ type: 'back', url: customBack });
      item.files = files;
    }
    pfItems.push(item);
  }

  if (!pfItems.length) {
    console.warn('snipcart-webhook: no fulfillable items', { skipped });
    return new Response('no printful items', { status: 200 });
  }

  const pfOrder = {
    recipient: {
      name: ship.fullName || order.billingAddressName || 'Customer',
      address1: ship.address1, address2: ship.address2 || '',
      city: ship.city, state_code: ship.province || '',
      country_code: ship.country, zip: ship.postalCode, email: order.email,
    },
    items: pfItems,
  };

  const url = `https://api.printful.com/orders${AUTOCONFIRM ? '?confirm=true' : ''}`;
  const resp = await fetch(url, { method: 'POST', headers: pfHeaders(), body: JSON.stringify(pfOrder) });
  if (!resp.ok) {
    console.error('snipcart-webhook: printful order failed', resp.status, (await resp.text()).slice(0, 400));
    return new Response('printful error logged', { status: 200 });
  }
  if (skipped.length) console.warn('snipcart-webhook: items needing manual fulfilment:', skipped);
  return new Response('order created', { status: 200 });
};

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ ok: true, service: 'snipcart-printful-webhook' }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
