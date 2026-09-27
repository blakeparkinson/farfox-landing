# Tool link outreach, September 2026

## Why links, and why tools

The 6-month Search Console export (Mar 29 – Sep 24, 2026) shows 292 clicks, of which about 189 came from searches for "far fox" or "farfox" and about 3 from other visible queries. Most posts sit at average positions 40–90 for their main searches, and the Page indexing export listed 18 of 51 sitemap URLs as indexed. That pattern usually means the site has too few links from other sites; more posts alone are unlikely to fix it.

Sites rarely link to a company's blog post, but they do link to free tools that help their readers. Lead with these (all live, free, no signup):

| Tool | URL | Pitch it to |
| --- | --- | --- |
| Halfway point calculator | https://lovefarfox.com/halfway-point-calculator/ | Visit planning, travel, visa and international-couple pages |
| Time zone calculator | https://lovefarfox.com/long-distance-time-zone-calculator/ | Time-difference advice, study abroad, deployment communication |
| Reunion countdown | https://lovefarfox.com/reunion-countdown/ | Visit planning, "things to look forward to" lists |
| Would You Rather game | https://lovefarfox.com/blog/long-distance-relationship-games/ | Virtual-date and activity roundups |
| All free tools | https://lovefarfox.com/tools/ | Resource and app roundups |

The SERPs for these topics are crowded with couples-app blogs (FeelClose, Aperi, Amorno, Flamme, Lovebae and others) and a few dedicated halfway sites. The honest differentiator: these tools work in the browser with nothing to install or sign up for. Say that; don't compare against competitors by name.

## Rules

- The target list is in `2026-09-tool-link-targets.csv`. Every page URL returned HTTP 200 on 2026-09-27 and every contact route is published on the site itself. No emails were guessed. "none found" means use the site's socials or skip; don't guess an address.
- Nothing has been sent. Each email needs one sentence showing you actually read the page. The templates mark it `[specific detail]`.
- Don't offer money, link swaps or guest posts in exchange for links. Don't use support or advice-submission forms for pitches.
- One follow-up after 7 days, then stop. Update the `status`, `sent_on`, `follow_up_on` and `outcome` columns as you go.
- Use the row's `tracked_link` in the email so replies can be matched to clicks in Umami (`utm_campaign=tools_links_01`). If someone asks what to link, give the clean URL without the `?utm_…` part.
- Send about 5 a day from your own address, Tier 1 first. Tier 3 are major publications with no pitch route; only contact the article's author if their byline lists one.

## Tiers

- **Tier 1 (15):** active sites with a published contact route and an obvious slot for a tool: My Sweet LDR's 31-tools roundup (updated Sept 25, 2026, with "time difference" and "next reunion" sections), Lasting the Distance's app roundup (still titled 2024), three LongDistance.net pages, UCEAP (already tells students to "use a time zone converter"), Lost on the Route, Seasoned Spouse, HPRC, UC Berkeley UHS, SquirrelSarah, WithRowan, Immigration for Couples, Jessie Parker, Hairs Out of Place.
- **Tier 2 (9):** relevant, but older or less likely to edit: student publications, study-abroad blogs, Marriage.com, Healthy Homefront, Couples Coaching Online, Long Distance Fun, Breaking the Distance.
- **Tier 3 (9):** long shots: Good Housekeeping, Cosmopolitan, TODAY, The Cut, Glamour, Psychology Today, Military OneSource, LDR Visa, Another Broad Abroad.
- **Directories (3):** Tool Index, The Free Tools Directory, SaaSHub. Submit `/tools/` once each. SaaSHub is aimed at software products, so it may reject it.

Of the earlier creator list (`2026-09-14-search-and-outreach.md`), My Sweet LDR and Lasting the Distance are in Tier 1 and Breaking the Distance in Tier 2. Loving From a Distance has no dated posts after March 2020, and Theo & Jas's Medium page blocked automated checks, so both are left out.

## Templates

### 1. Resource or app roundup

Subject: A free tool for your [page title] list

Hi [name], I read your [page title]. [specific detail, e.g. "the section on adapting to the time difference was spot on"]. I'm Blake, and I build Far Fox for long-distance couples. We've made a few free browser tools that might fit alongside what you list. There's a halfway point calculator that finds the fairest city to meet in, with how far each of you travels, a time zone calculator for your shared waking hours, and a shareable reunion countdown. None of them need an app or an account: [tracked_link]. If one seems useful to your readers, I'd be glad to see it on the list. Either way, thanks for the resource.

Blake

### 2. Time-difference advice (study abroad, deployment, LDR advice)

Subject: Finding overlapping awake hours for [their audience]

Hi [name], your guide on [page title] [specific detail, e.g. "recommends finding overlapping awake hours"]. I built a free calculator that does exactly that: pick both cities and it shows the hours you're both awake, including daylight saving. No signup or download: [tracked_link]. If it's useful, it could sit next to the tips on that page. Happy to change anything that would make it work better for [students / military families / your readers].

Blake, Far Fox

### 3. Visits, travel and visas (halfway calculator)

Subject: Meeting halfway: a free calculator for your readers

Hi [name], I enjoyed [page title], especially [specific detail]. For couples who can't easily visit each other's country, I built a free halfway point calculator. It finds the true midpoint and then the fairest real cities to fly to, with each person's distance. For example, New York and London comes out as Reykjavík. [tracked_link]. It might help readers planning a visit. No signup.

Blake, Far Fox

### 4. Activity and date-idea roundups (game)

Subject: A two-player game for your long-distance date ideas

Hi [name], I liked [page title], particularly [specific detail]. One idea you might add: a free Would You Rather game for couples. One partner picks and sends a link; the other answers before seeing the first choice, then they compare. It works across time zones and needs no login: [tracked_link]. Thanks for considering it.

Blake, Far Fox

### Follow-up (7 days later, same thread)

Hi [name], just bumping this in case it got buried. No worries if it's not a fit. Thanks!

## Measuring it

- **Weekly:** Umami visits with `utm_campaign=tools_links_01` show who clicked the pitch. New referring domains will appear under Search Console → Links, usually a few weeks after a link goes live.
- **After 4–6 weeks:** export Performance and Page indexing again. If the links are working, the halfway, time zone and countdown pages should get non-branded impressions and more pages should show as indexed.
- Judge the batch on new linking sites, not replies. Even a handful of relevant links should show up as non-branded impressions on the tool pages.
