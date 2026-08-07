# Zero-spend acquisition playbook

Goal unchanged: **25 couples who connect both accounts and use Far Fox twice, in 30 days — now at $0.**
Measurement unchanged: run `docs/acquisition-scorecard.sql` in Supabase; every link below carries its own `utm_source`, so channels are directly comparable.

## What's already working for you automatically

- **The referral loop**: quiz → partner invite → match reveal → joint signup. Every person who finishes the quiz recruits their partner for free.
- **Personalized share cards**: profile *and* match links now unfurl in iMessage/WhatsApp/Discord with the couple's names, score, and answers — the preview does the selling.
- **SEO cluster**: `/long-distance-relationship-app`, `/long-distance-relationship-quiz`, `/compare/*`, and the blog all interlink and are submitted to IndexNow. Google Search Console is verified. This compounds without any action.

## Owner actions (~30 min each, in priority order)

### 1. Post the three videos organically (TikTok, Reels, YouTube Shorts)

The videos in `out/user-acquisition/` were built 9:16 for exactly this. Post one every 2–3 days rather than all at once. Put the link in your bio (TikTok) or caption/comment (Reels/Shorts):

| Video | Caption | Link to use |
|---|---|---|
| `01-send-to-partner.mp4` | Send this to your long-distance partner. Six honest questions each, then reveal where your love profiles match. | `https://lovefarfox.com/couple-quiz?utm_source=tiktok_organic&utm_medium=video&utm_campaign=love_profile_loop&utm_content=send_to_partner` |
| `02-love-overlap.mp4` | We matched on four. The other two answers started the conversation we actually needed. | `…utm_source=tiktok_organic…&utm_content=love_overlap` |
| `03-better-than-how-was-your-day.mp4` | When "how was your day?" stops working, try one question that gives you something real to say. | `…utm_source=tiktok_organic…&utm_content=better_question` |

For Instagram and YouTube swap `utm_source` to `ig_organic` / `yt_organic` so the scorecard separates them.

### 2. Answer real questions in LDR communities (value first, never link-drop)

Targets: r/LongDistance (500k+), r/LDR, the "long distance relationship" tags on TikTok/Threads. The plays that don't get removed:

- Reply to "what do you and your partner do every day?" threads with a genuine answer describing the *ritual* (daily question, shared streak), and mention the quiz only if someone asks what you use.
- Post your own **match-reveal screenshot** (the share card is designed for this) with a story: "we've been long distance 14 months and only matched 3/6 — the mismatches were the useful part." Screenshots outperform links and can't be flagged as spam.
- Use `https://lovefarfox.com/couple-quiz?utm_source=reddit&utm_medium=community&utm_campaign=love_profile_loop` when a link is genuinely welcome (weekly app threads, "what apps do you use?" posts).

### 3. Free app directories (one-time, ~20 min total)

Submit Far Fox to AlternativeTo (as an alternative to Paired/Between — this feeds our `/compare/*` pages' exact audience), Product Hunt (schedule for a Tuesday), and ToolFinder-style couple-app roundups. Use `?utm_source=directory&utm_medium=listing&utm_campaign=ldr_app_acquisition` on the site URL.

## What "working" looks like (check weekly)

1. Umami: `partner_quiz_landed` and `match_revealed` rising → the loop is spinning.
2. Scorecard SQL: `couple_connected` rows with `utm_source` set → a channel is converting; double down on that channel only.
3. Search Console: impressions on "long distance relationship quiz" / "paired app alternative" queries → SEO cluster is being indexed; no action needed, just don't delete pages.

The loop math: every couple that activates saw the product because one partner shared it. You don't need 25 independent wins — you need ~13 first-partners who care enough to send the link. The three videos and community answers exist to find those 13 people.
