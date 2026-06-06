import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Trigger a site rebuild so Printful catalog changes go live.
 *
 * The build re-runs scripts/sync-catalog.mjs, so a fresh deploy = a fresh
 * catalog. Hit this endpoint to kick one off:
 *   - Manually:  GET/POST /api/printful-rebuild?key=<REBUILD_SECRET>
 *   - Printful:  add a store webhook (product_updated / product_synced)
 *                pointing at the URL above — adding a product auto-rebuilds.
 *   - Daily cron: configured in vercel.json (uses Vercel's CRON_SECRET).
 *
 * Env vars: VERCEL_DEPLOY_HOOK (the deploy hook URL from Vercel →
 * Settings → Git → Deploy Hooks), REBUILD_SECRET (shared secret).
 */

const DEPLOY_HOOK = import.meta.env.VERCEL_DEPLOY_HOOK as string | undefined;
const REBUILD_SECRET = import.meta.env.REBUILD_SECRET as string | undefined;
const CRON_SECRET = import.meta.env.CRON_SECRET as string | undefined;

async function authorized(request: Request, url: URL): Promise<boolean> {
  const key = url.searchParams.get('key');
  if (REBUILD_SECRET && key === REBUILD_SECRET) return true;
  const auth = request.headers.get('authorization');
  if (CRON_SECRET && auth === `Bearer ${CRON_SECRET}`) return true; // Vercel Cron
  return false;
}

async function trigger(request: Request, url: URL): Promise<Response> {
  if (!DEPLOY_HOOK) return new Response('no deploy hook configured', { status: 200 });
  if (!(await authorized(request, url))) return new Response('unauthorized', { status: 401 });
  const r = await fetch(DEPLOY_HOOK, { method: 'POST' });
  return new Response(JSON.stringify({ triggered: r.ok }), {
    status: r.ok ? 200 : 502, headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = ({ request, url }) => trigger(request, url);
export const GET: APIRoute = ({ request, url }) => trigger(request, url);
