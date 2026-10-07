import type { APIRoute } from 'astro';
import catalog from '../data/catalog.json';
import stories from '../data/product-stories.json';
import { merchantFeedItems, merchantFeedXml, type ShopProduct } from '../lib/productPages';

export const prerender = true;

// Google Merchant Center fetches this on a schedule for free Shopping listings (docs/google-merchant-center.md).
export const GET: APIRoute = () => new Response(
  merchantFeedXml(merchantFeedItems(catalog.products as ShopProduct[], stories as Record<string, string>)),
  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
);
