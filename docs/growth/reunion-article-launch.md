# Reunion checklist launch

Article: https://lovefarfox.com/blog/long-distance-reunion-checklist/

This is an editorial experiment covering visit logistics, distinct from the existing first-meeting and post-visit articles. We have not verified keyword volume or a ranking forecast. No research statistics or invented anecdotes appear in the new article.

The blog's Visits & milestones collection, first-meeting article, post-visit article, and countdown tool link to the new guide. The guide links to the countdown without internal UTMs, preserving incoming campaign attribution. The existing blog template generates the canonical URL, social card, article metadata, and visible FAQs. The sitemap includes the new page through the normal build.

## Pinterest drafts

Run `node scripts/make-reunion-pins.mjs` to generate three 1000×1500 PNGs using the approved Foxy letter artwork. Files go to gitignored `out/reunion-pins/`. Titles, descriptions, alt text, and distinct tracked links are versioned in `reunion-pins.json` beside this document. The pins are drafts, not published or scheduled.

Use the checklist, budget, and weekend hooks as separate tests. Campaign: `reunion_checklist_20260915`. Compare outbound clicks and site arrivals for each `utm_content`; saves alone don't demonstrate website traffic.

## Measurement

After indexing, compare the article's Search Console impressions, clicks, and query mix over 28 days. In Umami, inspect article visits and paths to `/reunion-countdown/`; inspect `countdown_created` with campaign context where available. Don't interpret repeated events as unique people or call this a traffic win without measured results.
