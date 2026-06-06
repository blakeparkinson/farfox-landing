# Far Fox Shop — How it works (Printful-driven)

The shop is **driven entirely by Printful**. To add, edit, remove, reprice, or
restyle a product, you do it in the **Printful dashboard** — no code changes.

## Adding / editing a product (the only workflow you need)

1. In Printful → **Products** → add or edit a product (pick the blank, upload the
   design, set variants, set the **retail price**, and generate the **mockup**
   you want shown — this is the product image the shop displays).
2. Trigger a rebuild (see below). The shop reflects the change on the next build:
   the product, its price, its sizes, and its mockup all come straight from Printful.

That's it. No edits to `shop.astro`, no webhook changes, no scripts to run by hand.

## How it's wired

- **Catalog** — `scripts/sync-catalog.mjs` runs at build (`npm run build`), pulls
  every sync product from Printful, downloads each mockup into `public/shop/auto/`,
  and writes `src/data/catalog.json`. `shop.astro` renders from that JSON. If the
  Printful token is missing, it keeps the last committed `catalog.json` so builds
  never break.
- **Checkout** — each Snipcart item's id **is** the Printful sync-product id; the
  size dropdown comes from the product's variants.
- **Fulfilment** — `src/pages/api/snipcart-webhook.ts` looks the order's items up in
  Printful by that id + size and creates the Printful order by `sync_variant_id`.
  There is **no per-product mapping** — it works for any product automatically.
- **Image override (optional)** — drop `public/shop/mockups/<syncProductId>.png` to
  pin a custom mockup; otherwise the Printful dashboard mockup is used. (No code.)

## Triggering a rebuild

The catalog only refreshes on a deploy. Three ways, pick any:

1. **Automatic (best):** Vercel → Settings → Git → **Deploy Hooks** → create one,
   copy its URL into the `VERCEL_DEPLOY_HOOK` env var. Then in Printful add a
   **store webhook** (e.g. `product_updated` / `product_synced`) pointing at
   `https://lovefarfox.com/api/printful-rebuild?key=<REBUILD_SECRET>`. Now adding a
   product in Printful rebuilds the site on its own.
2. **Daily cron:** already configured in `vercel.json` (08:00 UTC) — it hits the
   rebuild endpoint using Vercel's `CRON_SECRET`. Set `CRON_SECRET` in Vercel.
3. **Manual:** open `https://lovefarfox.com/api/printful-rebuild?key=<REBUILD_SECRET>`
   (or click "Redeploy" in Vercel) after a batch of changes.

## Required env vars (Vercel → Settings → Environment Variables)

| Var | Used by | Purpose |
|-----|---------|---------|
| `PRINTFUL_TOKEN` | build sync + webhook | read catalog, create orders |
| `PRINTFUL_STORE_ID` | build sync + webhook | defaults to 18292625 |
| `SNIPCART_SECRET_KEY` | webhook | validate Snipcart order webhooks |
| `PUBLIC_SNIPCART_KEY` | shop page | cart/checkout (public; has a baked default) |
| `PRINTFUL_AUTOCONFIRM` | webhook | "true" to auto-charge+fulfil; else draft orders |
| `VERCEL_DEPLOY_HOOK` | rebuild endpoint | deploy hook URL to trigger builds |
| `REBUILD_SECRET` | rebuild endpoint | guards the rebuild URL |
| `CRON_SECRET` | rebuild endpoint | Vercel cron auth |

## The scripts (optional power-tools, not required)

- `scripts/create-products.py` — bulk-create sync products via API.
- `scripts/generate-mockups.py` / `generate-design-mockups.py` — render Printful
  mockups for designs (only if you'd rather not use the dashboard mockup generator).
- `scripts/slice-sprites.py` — slice a sprite sheet into transparent PNGs.
