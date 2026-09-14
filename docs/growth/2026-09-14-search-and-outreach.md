# Search and sharing work, September 14, 2026

## Search Console baseline

Read from the authenticated lovefarfox.com property, Web search, June 13–September 12, 2026. These are aggregate average positions, not fixed rankings. Click totals include queries Google does not disclose in the query table.

Site: 195 clicks, 3,712 impressions, 5.3% CTR, average position 14.4. Visible branded queries account for at least 130 clicks (107 for “far fox”, 23 for “farfox”). We should not describe this as broad non-branded search traction yet.

| Page | Clicks | Impressions | Average position | Work |
| --- | ---: | ---: | ---: | --- |
| Relationship timeline | 1 | 194 | 9.7 | Answer dating-duration intent; remove universal stage claims; add planning table and FAQs |
| Love-letter prompts | 5 | 111 | 8.3 | Add a usable fill-in template, original example and mood-based starting points |
| Relationship statistics | 1 | 465 | 16.1 | Replace unsupported numbers with sourced findings and limitations |

The timeline page's visible query was “dating stage long distance how many months”: 70 impressions, 0 clicks, position 9.7. Page totals and query totals differ; do not substitute one for the other.

The games page also gains a playable, no-login eight-question game with partner links. This is a sharing experiment, not a claim that Search Console identified it as a top-ranking opportunity.

## Implementation and measurement

- Keep the existing article URLs and section headings/anchors.
- Show an honest update date for the three refreshed articles and emit Article dateModified without changing publication dates.
- Partner links use utm_source=partner_share, utm_medium=referral, utm_campaign=couples_wyr.
- The question ID and pick stay in the URL fragment, outside the server query. A link recipient can inspect them; this is a casual hidden-choice game, not encryption or private messaging.
- Events: wyr_answered, wyr_invite_shared, wyr_partner_landed, wyr_partner_completed. Include existing acquisition attribution, never question IDs or answers as event properties.
- Count native share success or successful clipboard writes as shared. Manual fallback display does not prove sharing. Native share success does not prove that a partner opened it.
- Recipient answers are not sent back to the sender. A recipient can share their own answer link after revealing the comparison.
- No external accounts, messages or paid placements are part of these changes. The user subsequently authorized merging to the default branch and deploying.

## Verification before merge

Production build and growth, hero, campaign-attribution, brand and acquisition tests passed. Browser checks covered automatic advancement, preserving the previous share, manual clipboard fallback, blind partner landing, matching and different reveals, and a 390px mobile viewport without horizontal overflow. Motion is a single CSS reaction and honors prefers-reduced-motion.

Local production Lighthouse: Performance 91, Accessibility 100, SEO 100, Best Practices 96. The Best Practices deduction was the expected local 404 for Vercel's hosted insights script, not a game error. These are local lab scores, not field-performance guarantees. The audit reports are in /tmp/farfox-growth-production-lighthouse.json on the development machine.

After deployment, compare the next 28 days with this baseline using the same Search Console settings. Review page CTR alongside impressions and position; small samples are noisy. In Umami, inspect partner landings and completions, not only answer clicks. Keep the current Pinterest batch collecting data before producing another batch. This document does not schedule a follow-up.

## Five creator prospects and outreach drafts

Drafts only. Send after the game is deployed and checked on the public URL. No messages have been sent. These are niche creator/publisher prospects, not five verified micro-influencers: public evidence does not establish current follower counts or recent engagement for every account. Recheck their current activity and audience fit before contacting; never invent engagement or promise payment.

### 1. Nico and Anna, My Sweet LDR

Their [site](https://my-sweet-ldr.com/) describes four years of distance, a 26-challenge resource and a May 7, 2026 article. Strong activity-tool fit. Their download and traffic claims are self-reported, not verified follower counts. Public discovery route: [their Linktree](https://linktr.ee/mysweetldr). Confirm the current business contact there; no email inferred.

Subject: A no-login game for your LDR challenge readers

Hi Nico and Anna, your 26-challenge resource gave me an idea for a small activity your readers could try between calls. I’m Blake, building Far Fox. We’ve made a free Would You Rather game: one partner picks and sends a link; the other answers before seeing the first choice. Would you be open to trying it and telling me whether it fits your audience? No account needed, and no obligation to post.

### 2. Theo and Jas, The LDR Diaries

Their [first-person introduction](https://medium.com/about-me-stories/about-us-our-long-distance-relationship-journey-and-why-were-starting-this-account-946a2c6ffcda) describes their wish for personal LDR resources. The retrieved page shows 123 author followers, not the publication's 13.7K. That is a small-audience signal, not a live count. The November 2024 article links to The LDR Diaries on Substack; recent author activity and a contact route need confirmation. Do not post promotional comments in place of a private invitation.

Subject: Could you try a tiny between-calls game?

Hi Theo and Jas, I read your introduction about wanting LDR resources from people rather than faceless brands. I’m Blake, the person building Far Fox. I’d value your take on a free question game we’ve made for couples: pick one of two options, send your partner a link and compare after they choose. Would you like to try it? I’m looking for candid feedback, not asking you to endorse it.

### 3. Tash and Marthe, Breaking the Distance

Their [about page](https://www.breakingthedistance.com/about-us/) describes their London–Amsterdam relationship and links [@_breakingthedistance](https://www.instagram.com/_breakingthedistance/). Relevant lived experience; the page's family update is dated 2023, so check current topics before outreach. No first-party current follower count verified. Use the linked public profile to confirm a business contact.

Subject: A reunion question for your audience

Hi Tash and Marthe, I found your account through your story of closing the London–Amsterdam distance. I’m Blake, building Far Fox for couples who live apart. Our free question game starts with a reunion choice: stay in with takeout or dress up and go out. You pick separately through a shared link, then see the comparison. Would you be interested in trying it as a short audience activity? No login or posting commitment.

### 4. Lolo and Nate, Lasting the Distance

Their [about page](https://lastingthedistance.com/about-us/) links the 7 Day LDR Challenge and describes their Canada–Australia experience. Established niche publisher; not verified as a small account. [Public contact](https://lastingthedistance.com/contact-us/): loloandnate@lastingthedistance.com. Potential resource/editorial partnership, not an assumed influencer placement.

Subject: A free activity to try alongside your LDR challenge

Hi Lolo and Nate, I came across your 7 Day LDR Challenge while looking for activities couples can fit around time zones. I’m Blake from Far Fox. We’ve built a no-login Would You Rather game where partners answer through a link before comparing choices. Could I send it over for your feedback? If you find it useful, I’d be glad for you to consider it as an optional reader resource. No paid placement or endorsement request attached.

### 5. Michelle and Frank, Loving From a Distance

Their [about page](https://www.lovingfromadistance.com/about-us/) explains that the site began with activities they tried while apart. It lists info@lovingfromadistance.com for general inquiries. Strong editorial fit, but an established community rather than a verified micro-creator. Do not use their customer-support address or advice submission form for marketing.

Subject: A playable addition to your LDR activities

Hi Michelle and Frank, I liked reading that Loving From a Distance began as a list of activities you tried yourselves. I’m Blake, building Far Fox. We’ve made a free couples game that works over a shared link, so partners can answer at different times and then compare. Would you be open to trying it for your activities section? I’d appreciate feedback even if it isn’t something you want to share.

## Links for approved outreach

Append one of these to its draft only after deployment. These attribution links do not subscribe anyone or send a message.

- [My Sweet LDR](https://lovefarfox.com/blog/long-distance-relationship-games/?utm_source=creator_outreach&utm_medium=referral&utm_campaign=wyr_launch_01&utm_content=my_sweet_ldr#couples-game)
- [Theo and Jas](https://lovefarfox.com/blog/long-distance-relationship-games/?utm_source=creator_outreach&utm_medium=referral&utm_campaign=wyr_launch_01&utm_content=theo_and_jas#couples-game)
- [Breaking the Distance](https://lovefarfox.com/blog/long-distance-relationship-games/?utm_source=creator_outreach&utm_medium=referral&utm_campaign=wyr_launch_01&utm_content=breaking_the_distance#couples-game)
- [Lasting the Distance](https://lovefarfox.com/blog/long-distance-relationship-games/?utm_source=creator_outreach&utm_medium=referral&utm_campaign=wyr_launch_01&utm_content=lasting_the_distance#couples-game)
- [Loving From a Distance](https://lovefarfox.com/blog/long-distance-relationship-games/?utm_source=creator_outreach&utm_medium=referral&utm_campaign=wyr_launch_01&utm_content=loving_from_a_distance#couples-game)
