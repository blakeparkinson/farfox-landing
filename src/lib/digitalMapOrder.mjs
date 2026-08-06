import { DIGITAL_MAP_SKU, mapInputFromCustomFields } from './coupleMap.mjs';

export function findDigitalMapItem(order) {
  return (order?.items || []).find((item) => item.id === DIGITAL_MAP_SKU) || null;
}

export function partitionOrderItems(items = []) {
  return {
    digital: items.filter((item) => item.id === DIGITAL_MAP_SKU),
    physical: items.filter((item) => item.id !== DIGITAL_MAP_SKU),
  };
}

export function isPaidOrder(order) {
  return String(order?.paymentStatus || '').toLowerCase() === 'paid';
}

export function mapInputFromOrder(order) {
  const item = findDigitalMapItem(order);
  return item ? mapInputFromCustomFields(item.customFields || []) : null;
}

export function snipcartAuth(secret) {
  return `Basic ${Buffer.from(`${secret}:`).toString('base64')}`;
}

export function mapDownloadUrl(site, orderToken) {
  return `${site}/api/couple-map-download.png?order=${encodeURIComponent(orderToken)}`;
}

export function mapNotification(site, orderToken) {
  const url = mapDownloadUrl(site, orderToken);
  return {
    type: 'Comment',
    deliveryMethod: 'Email',
    subject: 'Your personalized Far Fox map is ready',
    message: `Thank you for your order. Download your print-ready personalized map here: ${url}`,
  };
}

export async function fetchSnipcartOrder(token, secret, fetcher = fetch) {
  if (!token || !secret) return null;
  const response = await fetcher(`https://app.snipcart.com/api/orders/${encodeURIComponent(token)}`, {
    headers: {
      Authorization: snipcartAuth(secret),
      Accept: 'application/json',
    },
  });
  if (!response.ok) return null;
  return response.json();
}
