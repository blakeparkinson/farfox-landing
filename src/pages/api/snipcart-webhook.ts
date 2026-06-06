import type { APIRoute } from 'astro';

// Serverless endpoint — not prerendered.
export const prerender = false;

/**
 * Snipcart → Printful fulfillment glue.
 *
 * When a Snipcart order completes, Snipcart POSTs here. We validate the
 * request against Snipcart, map each line item to a Printful catalog
 * variant (by product + chosen size), and create a Printful order so it
 * prints and ships automatically.
 *
 * Required Vercel env vars (Project → Settings → Environment Variables):
 *   PRINTFUL_TOKEN      — your Printful API token (server-side secret)
 *   PRINTFUL_STORE_ID   — your Printful store id (18292625)
 *   SNIPCART_SECRET_KEY — your Snipcart SECRET API key (for webhook validation)
 *   PRINTFUL_AUTOCONFIRM — optional "true" to auto-charge+fulfill; otherwise
 *                          orders are created as drafts you confirm in Printful.
 *
 * Set the webhook URL in Snipcart → Settings → Webhooks:
 *   https://lovefarfox.com/api/snipcart-webhook
 */

const PF_TOKEN = import.meta.env.PRINTFUL_TOKEN as string | undefined;
const PF_STORE = (import.meta.env.PRINTFUL_STORE_ID as string | undefined) ?? '18292625';
const SNIPCART_SECRET = import.meta.env.SNIPCART_SECRET_KEY as string | undefined;
const AUTOCONFIRM = (import.meta.env.PRINTFUL_AUTOCONFIRM as string | undefined) === 'true';

const SITE = 'https://lovefarfox.com';

// Snipcart product id → Printful catalog product + colorway + print file.
// Size is resolved at runtime from the item's "Size" custom field.
// (Items without a Printful product — pin, sticker pack — are skipped and
//  flagged for manual fulfilment.)
type Cfg = { pid: number; color: string; design: string; ftype: 'front' | 'default' };
const MAP: Record<string, Cfg> = {
  'mile-tee':       { pid: 71,  color: 'White',      design: `${SITE}/shop/designs/worth-every-mile.png`,  ftype: 'front' },
  'club-tee':       { pid: 71,  color: 'Natural',    design: `${SITE}/shop/designs/long-distance-club.png`, ftype: 'front' },
  'fox-tee':        { pid: 71,  color: 'Soft Cream', design: `${SITE}/fox-logo.png`,                        ftype: 'front' },
  'fox-hoodie':     { pid: 294, color: 'Sand',       design: `${SITE}/fox-letter.png`,                      ftype: 'front' },
  'moon-mug':       { pid: 19,  color: 'White',      design: `${SITE}/shop/designs/mug-same-moon.png`,      ftype: 'default' },
  'fox-mug':        { pid: 19,  color: 'White',      design: `${SITE}/shop/designs/mug-foxlogo.png`,        ftype: 'default' },
  'missyou-sticker':{ pid: 957, color: 'White',      design: `${SITE}/shop/designs/miss-you.png`,           ftype: 'default' },
  'fox-sticker':    { pid: 957, color: 'White',      design: `${SITE}/fox-logo.png`,                        ftype: 'default' },
  'sticker-pack':   { pid: 505, color: 'White',      design: `${SITE}/shop/designs/sticker-sheet.png`,      ftype: 'default' },
  'fox-print':      { pid: 1,   color: 'White',      design: `${SITE}/fox-letter.png`,                      ftype: 'default' },
};

const pfHeaders = () => ({
  Authorization: `Bearer ${PF_TOKEN}`,
  'X-PF-Store-Id': PF_STORE,
  'Content-Type': 'application/json',
});

// Resolve a Printful catalog variant id for a product config + size.
async function resolveVariant(cfg: Cfg, size: string | null): Promise<number | null> {
  for (let off = 0; off < 600; off += 100) {
    const r = await fetch(`https://api.printful.com/v2/catalog-products/${cfg.pid}/catalog-variants?limit=100&offset=${off}`, { headers: pfHeaders() });
    if (!r.ok) break;
    const d = await r.json();
    const data = d.data ?? [];
    const byColor = data.filter((v: any) => v.color === cfg.color);
    const pool = byColor.length ? byColor : data;
    const match = size ? pool.find((v: any) => v.size === size) : pool[0];
    if (match) return match.id;
    if (off + 100 >= (d.paging?.total ?? 0)) break;
  }
  return null;
}

async function validateSnipcart(token: string): Promise<boolean> {
  if (!SNIPCART_SECRET) return false;
  const r = await fetch(`https://app.snipcart.com/api/requestvalidation/${token}`, {
    headers: { Authorization: `Bearer ${SNIPCART_SECRET}`, Accept: 'application/json' },
  });
  return r.ok;
}

export const POST: APIRoute = async ({ request }) => {
  // Soft-fail (200) on config gaps so Snipcart doesn't hammer retries.
  if (!PF_TOKEN || !SNIPCART_SECRET) {
    console.warn('snipcart-webhook: missing PRINTFUL_TOKEN or SNIPCART_SECRET_KEY env');
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
    const cfg = MAP[it.id];
    if (!cfg) { skipped.push(it.id); continue; }
    const sizeField = (it.customFields ?? []).find((f: any) => (f.name || '').toLowerCase() === 'size');
    const variantId = await resolveVariant(cfg, sizeField?.value ?? null);
    if (!variantId) { skipped.push(it.id); continue; }
    pfItems.push({
      variant_id: variantId,
      quantity: it.quantity ?? 1,
      retail_price: String(it.price ?? ''),
      files: [{ url: cfg.design, type: cfg.ftype }],
    });
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
      country_code: ship.country, zip: ship.postalCode,
      email: order.email,
    },
    items: pfItems,
  };

  const url = `https://api.printful.com/orders${AUTOCONFIRM ? '?confirm=true' : ''}`;
  const resp = await fetch(url, { method: 'POST', headers: pfHeaders(), body: JSON.stringify(pfOrder) });
  const respText = await resp.text();
  if (!resp.ok) {
    console.error('snipcart-webhook: printful order failed', resp.status, respText.slice(0, 400));
    // 200 so Snipcart marks delivered; we've logged for manual recovery.
    return new Response('printful error logged', { status: 200 });
  }
  if (skipped.length) console.warn('snipcart-webhook: items needing manual fulfilment:', skipped);
  return new Response('order created', { status: 200 });
};

// Snipcart also GETs the endpoint to verify it exists.
export const GET: APIRoute = async () =>
  new Response(JSON.stringify({ ok: true, service: 'snipcart-printful-webhook' }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
