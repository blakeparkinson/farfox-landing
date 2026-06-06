# Far Fox Shop — Go-Live Setup

The storefront at `/shop` is fully built (product catalog, cart, checkout UI,
size pickers, worldwide-shipping copy). It renders in **preview mode** until a
Snipcart key is set — products show "Coming soon" and no checkout loads. Two
steps flip it live.

## Step 1 — Snipcart (cart + checkout)

1. Create a free account at https://snipcart.com (no monthly fee until you're
   over $500/mo in sales — they take a small % per order).
2. Dashboard → **Account → API Keys** → copy the **PUBLIC** test key.
3. In Vercel → your project → **Settings → Environment Variables**, add:
   - `PUBLIC_SNIPCART_KEY` = your public key
4. Redeploy. The cart, "Add to cart" buttons, and the nav cart counter go live
   automatically. (Test mode uses fake card `4242 4242 4242 4242`.)
5. When ready for real orders, switch to your **LIVE** public key and complete
   Snipcart's domain validation + payment-gateway connection (Stripe/PayPal).

## Step 2 — Printful (automatic fulfillment)

So orders print + ship themselves with zero manual work:

1. Create an account at https://printful.com.
2. Upload the Far Fox designs and create a product for each catalog item
   (tee, hoodie, mug, tote, pin, stickers, print). Printful's mockup generator
   produces real product photos — **download those and replace the placeholder
   images in `/public/shop/`** (same filenames) for a more premium catalog.
3. Connect Printful → Snipcart via Printful's "Snipcart" integration (or Zapier
   /API). Map each Snipcart product `id` (see `PRODUCTS` in `src/pages/shop.astro`)
   to its Printful product.
4. Set Printful as the fulfillment source. Orders now route automatically.

Product IDs / prices live in one place: the `PRODUCTS` array in
`src/pages/shop.astro`. Keep Snipcart prices in sync with that array (Snipcart
validates against the price rendered on `/shop`).

## Current catalog

| id | product | price |
|----|---------|-------|
| fox-tee | Far Fox Tee (S–2XL) | $28 |
| fox-hoodie | Love Letter Hoodie (S–2XL) | $48 |
| fox-mug | Far Fox Mug (11oz) | $18 |
| fox-tote | Sleepy Fox Tote | $22 |
| fox-pin | Enamel Pin | $12 |
| sticker-pack | Sticker Pack (8) | $14 |
| fox-sticker | Die-Cut Sticker | $4.50 |
| fox-print | Art Print | $20 |

## Upgrading the artwork

The product images in `/public/shop/` are clean placeholder mockups built from
the existing fox art. Two easy upgrades:
- **Real Printful photos** (step 2 above) — most premium, do this once products exist.
- **The new sprite sheets** (16 expression poses + 20 pride/identity variants):
  slice them into individual transparent PNGs to power a richer sticker pack and
  a dedicated **Pride collection** (the 20-variant sheet is perfect for a
  Pride-month drop). Drop the sliced files in `/public/shop/` and add entries to
  the `PRODUCTS` array.

## Alternative (if you'd rather not run Snipcart)

A fully-hosted option is **Fourthwall** or **Printful's own storefront** — they
handle cart + payments + fulfillment in one place. In that case, keep `/shop` as
a marketing gallery and point each "Add to cart" button at the hosted product
URL instead. The current build is structured so that swap is a one-line change
per product.
