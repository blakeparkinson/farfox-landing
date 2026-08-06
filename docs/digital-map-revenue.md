# Personalized map revenue runbook

This is a controlled demand test, not a promise of profit. Do not increase spend because impressions or clicks look encouraging. Increase it only after a paid order meets the contribution target.

## Unit economics

Price: **$19**

Estimated direct-site variable fees:

- Snipcart transaction fee at 2%: $0.38
- Card processing at 2.9% + $0.30: $0.85
- Generation and delivery: effectively $0 at validation volume
- Contribution before advertising: **$17.77**

Estimated Etsy variable fees for a US seller:

- Listing: $0.20
- Transaction at 6.5%: $1.24
- Payment processing estimated at 3% + $0.25: $0.82
- Contribution before advertising: **$16.74**

Confirm actual account fees before launch. Taxes, currency conversion, refunds, Etsy Offsite Ads, and Snipcart's monthly minimum can reduce these amounts.

Maximum acceptable customer acquisition cost: **$8**. This leaves roughly $8.74–$9.77 per order before fixed costs and refunds.

## Required one-time setup

1. Verify the Etsy seller identity, payment account, and tax details.
2. Create an Etsy developer app if order-number redemption is used.
3. Confirm Snipcart is connected to the intended payment gateway.
4. Add `SNIPCART_SECRET_KEY` and the existing Printful variables in Vercel.
5. Add `ETSY_API_KEY`, `ETSY_ACCESS_TOKEN`, `ETSY_SHOP_ID`, `ETSY_MAP_LISTING_ID`, and a random 32-byte `MAP_REDEMPTION_SECRET` in Vercel.
6. Configure `https://lovefarfox.com/api/snipcart-webhook` for `order.completed`.
7. Place one Snipcart test-mode order. Confirm:
   - checkout asks for no shipping address;
   - the confirmation shows the protected download;
   - the order email contains the same link;
   - the link downloads a 4800 × 6000 PNG;
   - changing or removing the order token returns 403/404;
   - physical merchandise still creates a Printful order.

Do not run ads until every check passes.

## $300 staged budget

### Stage 1: Etsy, maximum $75

- Start at $5/day.
- Stop at $75, whichever comes first.
- Continue only after a sale or at least 5% combined favorites/add-to-cart intent.
- Pause a search term after $20 without a completed map preview.

### Stage 2: exact-intent search, maximum $75

- Use exact or phrase match only.
- Send traffic directly to `/personalized-long-distance-map`.
- Pause any keyword after $20 without a completed preview.
- Pause the channel immediately if measured CAC exceeds $8.

### Reserve: $150

Release this only to a channel that already produced a paid order with CAC at or below $8. If neither channel qualifies, keep the money and change the offer.

## Funnel diagnosis

- Visits but few configurator starts: listing promise or hero is weak.
- Starts but few completed previews: location lookup or form is too difficult.
- Previews but few checkouts: output, price, or trust is weak.
- Checkouts but few purchases: payment friction or unexpected fees.
- Purchases but CAC above $8: channel economics fail; do not scale.

Record results in `docs/digital-map-scorecard.csv` at least once per campaign stage.
