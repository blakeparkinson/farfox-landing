# Connected-couple acquisition runbook

## Goal

Acquire **25 connected couples in 30 days** who:

1. connect both Far Fox accounts; and
2. return for a second meaningful session.

One signup is not a successful acquisition. Traffic is not a successful acquisition.

Maximum budget: **$300**  
Maximum acceptable cost per activated couple: **$12**

## Product-led loop

The public love-profile quiz now has a two-person loop:

1. Partner A takes six questions.
2. Partner A sends a tracked invitation.
3. Partner B takes the same questions.
4. Both receive a side-by-side love-overlap result.
5. The result invites them to start Far Fox together.

Measure these Umami events:

- `quiz_started`
- `quiz_completed`
- `partner_invite_shared`
- `partner_quiz_landed`
- `partner_quiz_started`
- `partner_quiz_completed`
- `match_revealed`
- `match_shared`
- `app_signup_clicked`

The app must additionally emit `couple_connected` and `couple_second_session`; see `docs/app-activation-events.md`.
Use `docs/acquisition-scorecard.sql` to count distinct connected and second-session couples by source.

## Before spending

1. Run `npm run build && npm run test:acquisition`.
2. Complete the loop on two real phones.
3. Confirm every event above appears in Umami.
4. Confirm both signup links retain UTMs and `landing_path`.
5. Confirm the app reports connection and second-session events.

Do not buy traffic until all five checks pass.

## $300 staged acquisition budget

### Stage 1: creative test — $60 maximum

Generate three vertical videos:

```sh
npm run launch:acquisition
```

Run each creative with a $20 hard cap on TikTok or Instagram Reels. Send traffic to the tracked `/couple-quiz` URL from `docs/user-acquisition-campaigns.json`.

Pause a creative if $20 produces:

- no `quiz_started`; or
- a quiz-start rate below 20% of landing visits.

Advance only creatives producing completed quizzes.

### Stage 2: exact-intent search — $90 maximum

Send exact/phrase-match traffic to `/long-distance-relationship-app`. Pause a keyword after $20 without an `app_signup_clicked` or completed partner quiz.

Do not use broad match. Apply all negative keywords in the campaign manifest.

### Stage 3: reserve — $150

Release the reserve only when a channel has produced:

- at least three `match_revealed` events;
- cost per revealed pair at or below $6; and
- at least one measured `couple_connected`.

Stop the entire paid test if cost per activated couple exceeds $12 after five activations.

## Funnel diagnosis

- Low quiz starts: creative promise and first screen do not match.
- Low first completions: questions or name step create friction.
- Low invitation shares: result does not create enough curiosity.
- Low partner landings: share text or delivery channel is weak.
- Low partner completions: invited experience is unclear or too long.
- Matches but no app clicks: Far Fox value proposition is weak.
- App clicks but no connected couples: app onboarding/invite flow is the bottleneck.
- Connected couples without second sessions: acquisition is not the issue; activation and retention are.

Change only the stage that is failing. Do not add spend to compensate for a broken downstream funnel.
