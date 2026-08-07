# Launch kit: Product Hunt + Pinterest

Regenerate all images anytime with `npm run launch:assets` → they land in `out/launch/`.

---

## Product Hunt (do this Tuesday)

Everything below is paste-ready. The only things I can't do are create the account and press launch.

**Setup (5 min, any day before):** create/log into your Product Hunt account, then "Submit a product."

| Field | Paste this |
|---|---|
| Name | Far Fox |
| Tagline | A daily ritual for couples who live apart |
| Link | `https://lovefarfox.com/?utm_source=producthunt&utm_medium=launch&utm_campaign=ldr_app_acquisition` |
| Topics | Relationships · Web App · Free |
| Description | Far Fox gives long-distance couples something meaningful to do together every day: daily questions, love letters, photos, challenges, and reunion countdowns — plus a shared fox you raise through connection. Start with the free 2-minute couple quiz: you each answer six questions, then reveal where your love profiles match. |

**Gallery images** (upload in this order from `out/launch/product-hunt/`):
`1-hero.png` → `2-how-it-works.png` → `3-match-reveal.png` → `4-features.png` → `5-cta.png`

**Maker's first comment** (post it immediately after launch — listings with a maker comment get ~2x engagement):

> Hey Product Hunt 👋
>
> I built Far Fox because "how was your day?" is where long-distance conversations go to die. When you live together, mismatched instincts get corrected by accident. Across distance, there are no accidents — if your partner needs a voice note when they miss you and you keep sending memes, nobody finds out until it's already hurt.
>
> So Far Fox starts before the app: a free 2-minute quiz you each take separately. The reveal shows where your instincts match and where you quietly need different things. Couples who match 3/6 aren't doomed — those mismatches are the conversation most couples never have out loud.
>
> From there, the app gives you one small ritual a day — a question, a letter, a photo, a challenge — and a shared fox that grows as you show up for each other.
>
> It's free to start. I'd genuinely love to hear what the LDR folks here think, and I'll be around all day answering everything.

**Launch-day rules (the free-traffic multipliers):**
- Launch at **12:01 AM Pacific on a Tuesday** — the ranking window is the full calendar day, so early launch = more voting hours.
- Reply to **every** comment within the hour; comment velocity drives ranking.
- Share the launch link once on your personal socials — but never ask for upvotes directly (PH penalizes it). "We launched today, would love feedback" is fine.
- Watch Umami for `utm_source=producthunt` and the scorecard SQL for any couples it converts.

---

## Pinterest (one sitting, then it compounds)

**Setup (10 min):** create a free Pinterest **Business** account (business accounts get analytics + scheduling). Create two boards:
1. **Long Distance Relationship Ideas**
2. **Couple Quizzes & Questions**

**Scheduling:** all 18 pins are in `out/launch/pins/`, and `out/launch/pins.json` has the exact title, description, destination link, and board for each pin. In Pinterest: Create → Create Pin → upload the image, paste title/description/link from the manifest, pick "Publish at a later date."

**Cadence — do not post all 18 at once.** Pinterest rewards steady accounts: schedule **1 pin per day for 18 days** (the scheduler lets you queue them all in one sitting). Suggested order: alternate hook pins and blog pins for the first week, then the six question pins as a daily series in week two.

Every pin link is tagged `utm_source=pinterest` with a per-pin `utm_content`, so the scorecard will show exactly which pins convert. Pins take 2–4 weeks to gain distribution — this is the compounding channel, not the spike channel.

---

## What's tracked where

- Umami dashboard: watch `utm_source=producthunt` and `utm_source=pinterest` sessions, quiz starts, and `partner_quiz_landed`.
- Supabase (`docs/acquisition-scorecard.sql`): connected + activated couples by source — the number that actually counts.
