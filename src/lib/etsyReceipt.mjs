import { createHmac, timingSafeEqual } from 'node:crypto';

const b64url = (value) => Buffer.from(value).toString('base64url');

export function signEtsyRedemption(payload, secret) {
  const body = b64url(JSON.stringify(payload));
  const signature = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyEtsyRedemption(token, secret, now = Date.now()) {
  if (!token || !secret) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = createHmac('sha256', secret).update(body).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.receiptId || !payload.exp || payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function validateEtsyReceipt({
  receiptId,
  email,
  shopId,
  listingId,
  apiKey,
  accessToken,
  fetcher = fetch,
}) {
  const response = await fetcher(
    `https://openapi.etsy.com/v3/application/shops/${encodeURIComponent(shopId)}/receipts/${encodeURIComponent(receiptId)}`,
    {
      headers: {
        'x-api-key': apiKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok) return null;
  const receipt = await response.json();
  const buyerEmail = String(receipt.buyer_email || '').trim().toLowerCase();
  const expectedEmail = String(email || '').trim().toLowerCase();
  const hasListing = (receipt.transactions || []).some(
    (transaction) => String(transaction.listing_id) === String(listingId),
  );
  if (!receipt.is_paid || receipt.is_canceled || buyerEmail !== expectedEmail || !hasListing) return null;
  return receipt;
}
