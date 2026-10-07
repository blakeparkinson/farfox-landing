# Google Merchant Center (free Shopping listings)

The site publishes a product feed at **https://lovefarfox.com/merchant-feed.xml**. It has one item per colour and size, built from `src/data/catalog.json` by `src/lib/productPages.ts`. Every item links to its product page (`/shop/<product>/?color=…&size=…`), which opens on that variant. The feed rebuilds on every deploy, so a Printful price or product change reaches Google on its next fetch.

## One-time setup (owner, about 15 minutes)

1. Go to https://merchants.google.com and sign in with the Google account that owns Search Console for lovefarfox.com.
2. **Business info:** Far Fox, website `https://lovefarfox.com`. Verify and claim the site. If Search Console already verifies the domain, this is one click.
3. **Shipping:** Settings → Shipping and returns → add a shipping service for each country you sell to. Use the same rates Snipcart charges at checkout. If the feed price plus shipping doesn't match what checkout charges, Google disapproves the item.
4. **Returns:** add a return policy. Printful and Printify replace misprints and damaged items, so "No returns, replacements for damaged or defective items" is accurate unless you offer more.
5. **Products → Add products → Add from a file → Scheduled fetch:** paste `https://lovefarfox.com/merchant-feed.xml`, daily, US / English / USD.
6. Under **Growth → Manage programs**, turn on **Free listings**.

## After setup

- Items show as *pending* for 1–3 days. Look under **Products → Diagnostics** for any that are disapproved. Missing shipping or a price mismatch are the usual causes.
- Clicks from Google Shopping arrive on the product pages. In Umami they show up as referrals from google.com to `/shop/<product>/`.
- `npm run test:product-pages` checks the feed: unique ids under 50 characters, a colour and size on every clothing item, and escaped XML.
