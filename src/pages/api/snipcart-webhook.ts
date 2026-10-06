import type { APIRoute } from 'astro';
// @ts-ignore - plain-JS module (no heavy deps) shared with shop + generator
import { kitSlugForName, backUrl, pickVariant } from '../../lib/kits.mjs';
// @ts-ignore
import { mapNotification, partitionOrderItems, snipcartAuth } from '../../lib/digitalMapOrder.mjs';
// @ts-ignore
import { isPrintifyItem, pickPrintifyVariant, buildPrintifyOrder } from '../../lib/printifyOrder.mjs';

export const prerender = false;

/**
 * Snipcart → Printful / Printify fulfillment glue (catalog-agnostic).
 *
 * Line items whose id is a Printify product id (24-char hex, e.g. the flannel) become one Printify order;
 * everything else goes to Printful as below. A mixed cart ships as two parcels.
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
 *   PRINTFUL_AUTOCONFIRM="true"), and PRINTIFY_TOKEN (+ optional PRINTIFY_SHOP_ID)
 *   for Printify items. PRINTFUL_AUTOCONFIRM also sends Printify orders to production;
 *   without it both suppliers' orders wait as drafts for a manual confirm.
 * Snipcart webhook URL: https://lovefarfox.com/api/snipcart-webhook
 */

const PF_TOKEN = import.meta.env.PRINTFUL_TOKEN as string | undefined;
const PF_STORE = (import.meta.env.PRINTFUL_STORE_ID as string | undefined) ?? '18292625';
const SNIPCART_SECRET = import.meta.env.SNIPCART_SECRET_KEY as string | undefined;
const AUTOCONFIRM = (import.meta.env.PRINTFUL_AUTOCONFIRM as string | undefined) === 'true';
const SITE = 'https://lovefarfox.com';
const PFY_TOKEN = import.meta.env.PRINTIFY_TOKEN as string | undefined;
const PFY_SHOP = (import.meta.env.PRINTIFY_SHOP_ID as string | undefined) ?? '29228113';

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
  // Colour matches a variant's colourway tag when it has one (see kits.mjs).
  return { variant: pickVariant(variants, size, color), productName };
}

async function pfy(path: string, init: RequestInit = {}) {
  const r = await fetch(`https://api.printify.com/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${PFY_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'farfox-landing' },
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Printify ${init.method || 'GET'} ${path} -> ${r.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

/** One Printify order for every Printify line item; returns the line items it could not place. */
async function fulfilWithPrintify(items: any[], order: any): Promise<{ created: boolean; skipped: string[] }> {
  const skipped: string[] = [];
  if (!PFY_TOKEN) {
    console.error('snipcart-webhook: Printify items received without PRINTIFY_TOKEN', items.map((it) => it.id));
    return { created: false, skipped: items.map((it) => it.id) };
  }
  const lineItems: any[] = [];
  for (const it of items) {
    const cf = it.customFields ?? [];
    const fv = (n: string) => cf.find((f: any) => (f.name || '').toLowerCase() === n)?.value ?? null;
    try {
      const product = await pfy(`/shops/${PFY_SHOP}/products/${it.id}.json`);
      const variant = pickPrintifyVariant(product, fv('size'), fv('color'));
      if (!variant) { skipped.push(`${it.id} ${fv('color')} ${fv('size')}`); continue; }
      lineItems.push({ product_id: it.id, variant_id: variant.id, quantity: it.quantity ?? 1 });
    } catch (e) { console.error('printify resolve failed', it.id, String(e)); skipped.push(it.id); }
  }
  if (!lineItems.length) return { created: false, skipped };
  const externalId = `snipcart-${order.token || order.invoiceNumber || Date.now()}`;
  const body = buildPrintifyOrder({ externalId, ship: order.shippingAddress ?? {}, email: order.email, lineItems });
  try {
    const created = await pfy(`/shops/${PFY_SHOP}/orders.json`, { method: 'POST', body: JSON.stringify(body) });
    if (AUTOCONFIRM && created.id) await pfy(`/shops/${PFY_SHOP}/orders/${created.id}/send_to_production.json`, { method: 'POST' });
    return { created: true, skipped };
  } catch (e) {
    console.error('snipcart-webhook: printify order failed', String(e));
    return { created: false, skipped: [...skipped, ...lineItems.map((l) => l.product_id)] };
  }
}

async function validateSnipcart(token: string): Promise<boolean> {
  if (!SNIPCART_SECRET) return false;
  const r = await fetch(`https://app.snipcart.com/api/requestvalidation/${token}`, {
    headers: { Authorization: `Bearer ${SNIPCART_SECRET}`, Accept: 'application/json' },
  });
  return r.ok;
}

async function emailMapDownload(order: any): Promise<boolean> {
  const orderToken = order.token;
  if (!orderToken || !SNIPCART_SECRET) return false;
  const response = await fetch(
    `https://app.snipcart.com/api/orders/${encodeURIComponent(orderToken)}/notifications`,
    {
      method: 'POST',
      headers: {
        Authorization: snipcartAuth(SNIPCART_SECRET),
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mapNotification(SITE, orderToken)),
    },
  );
  if (!response.ok) {
    console.error('snipcart-webhook: map email failed', response.status, (await response.text()).slice(0, 300));
  }
  return response.ok;
}

export const POST: APIRoute = async ({ request }) => {
  if (!SNIPCART_SECRET) {
    console.warn('snipcart-webhook: missing SNIPCART_SECRET_KEY');
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
  const { digital: digitalItems, physical: physicalItems } = partitionOrderItems(items);

  let digitalDelivered = false;
  if (digitalItems.length) {
    digitalDelivered = await emailMapDownload(order);
  }

  if (!physicalItems.length) {
    return new Response(digitalDelivered ? 'digital order fulfilled' : 'digital email failed; download remains in checkout', { status: 200 });
  }
  const printifyItems = physicalItems.filter(isPrintifyItem);
  const printfulItems = physicalItems.filter((it: any) => !isPrintifyItem(it));
  let printifyNote = '';
  if (printifyItems.length) {
    const { created, skipped } = await fulfilWithPrintify(printifyItems, order);
    if (skipped.length) console.warn('snipcart-webhook: Printify items needing manual fulfilment:', skipped);
    printifyNote = created ? 'printify order created; ' : 'printify order failed (logged); ';
  }
  if (!printfulItems.length) return new Response(printifyNote.trim(), { status: 200 });
  if (!PF_TOKEN) {
    console.error('snipcart-webhook: physical order received without PRINTFUL_TOKEN');
    return new Response('physical fulfillment not configured', { status: 200 });
  }

  const pfItems: any[] = [];
  const skipped: string[] = [];
  for (const it of printfulItems) {
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
  return new Response(`${printifyNote}order created`, { status: 200 });
};

export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ ok: true, service: 'snipcart-fulfilment-webhook' }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
