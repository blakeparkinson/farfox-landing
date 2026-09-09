# Traffic and revenue priorities

## What this pass changes

- The homepage title names the free long-distance relationship app explicitly.
- Gifts are visible in mobile navigation, with a map preview link beside the hero flow.
- Articles whose title or slug mentions gifts, anniversaries, Valentine's Day, birthdays, Christmas, or care packages include a paid map offer and jersey link after the article.
- Offer clicks use the existing Umami integration: `homepage_shop_clicked`, `homepage_map_clicked`, `blog_map_clicked`, and `blog_jersey_clicked`. Blog events include the article slug. These are clicks, not sales.

## Establish a baseline before expanding

Export the last 28 days from Search Console and Umami. Record search clicks, impressions, CTR, landing-page visits, product preview completions, checkout starts, and confirmed orders. Neither analytics nor payment-account data was available during this code review.

Prioritize existing pages that already receive relevant search impressions. Improve their titles, opening answers, original examples, and relevant product links. Do not mass-produce near-duplicate articles. Google's guidance supports useful original content and descriptive crawlable links:
https://developers.google.com/search/docs/fundamentals/creating-helpful-content
https://developers.google.com/search/docs/crawling-indexing/links-crawlable

## One offer, one measurable experiment

Start with the existing $19 digital map as a hypothesis: it avoids physical fulfillment and has a free preview. Confirm actual fees, refunds, and support costs before treating it as high margin. Use the existing digital-map launch assets and tracked external campaign links. Link gift-intent posts directly to the map offer; link app-interest posts to the app or quiz.

Before promotion, complete the test-order and protected-download checks in `docs/digital-map-revenue.md`. This pass did not verify live payment or fulfillment. No ads or public posts were launched.

For two weeks, compare:

| Question | Metric | Next action |
| --- | --- | --- |
| Are relevant visitors arriving? | Search clicks and visits by landing page | Improve pages already showing relevant impressions |
| Are readers considering the offer? | Blog map clicks / gift-article visits | Test placement or offer copy |
| Does the preview persuade? | Checkout starts / preview completions | Review preview quality, price clarity, and objections |
| Does checkout work? | Paid map orders / checkout starts | Inspect payment errors and unexpected charges |
| Does traffic pay? | Net contribution / visits by source | Expand only sources with positive economics |

Use confirmed payment records for revenue. Client-side purchase events can be missed or repeated. Avoid drawing conclusions from a handful of visits, and change one major variable per experiment. Review after two weeks; continue gathering data if volume is too low.

External campaign tags now persist through internal navigation in session storage for the current tab. Internal campaigns tagged `utm_medium=onsite` do not replace the external source; a new external campaign replaces the saved campaign. Map and jersey events include source, medium, campaign, and content. App handoffs reuse the saved tags when the destination does not already specify them. Storage failures are nonfatal. This is browser-side attribution, not verified order attribution: reconcile payment records before reporting campaign profitability.

Run `node scripts/test-campaign-attribution.mjs` to check campaign persistence, internal promotion handling, replacement, and unavailable storage.
