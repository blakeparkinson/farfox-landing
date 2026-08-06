# App activation event contract

Landing-page analytics can measure qualified couples reaching the app, but the 25-couple goal requires two events from the Far Fox app itself.

## Required events

### `couple_connected`

Emit once when the second partner accepts an invitation and the couple relationship becomes active.

Properties:

- `couple_id`: stable internal couple identifier
- `acquisition_ref`: signup `ref` query parameter
- `pair`: optional love-profile pair identifier
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `landing_path`
- `connected_at`

### `couple_second_session`

Emit once when both conditions are true:

1. the couple is already connected; and
2. either partner completes a meaningful action on a later session or later calendar day.

Meaningful actions include answering a daily question, writing a letter, sharing a photo, completing a challenge, or sending a “thinking of you” signal. Opening the app alone does not count.

Properties:

- `couple_id`
- `action`
- `days_since_connected`
- the original acquisition properties stored at signup

## Attribution behavior

The landing site now appends UTMs and `landing_path` to every `app.lovefarfox.com` link. The app should:

1. capture these parameters on first arrival;
2. persist them through authentication and partner invitation;
3. assign first-touch attribution to the resulting couple;
4. avoid overwriting first-touch values on later visits; and
5. include them with both activation events.

Until these events exist, use `match_revealed` and `app_signup_clicked` only as provisional signals. Do not claim acquired connected couples from those proxy events.
