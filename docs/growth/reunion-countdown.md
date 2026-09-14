# Reunion countdown experiment

Routes: `/reunion-countdown/` and `/tools/`. The homepage links to both without changing existing navigation labels or URLs.

Design: preserve approved Foxy assets, Nunito and rose palette. DESIGN_VARIANCE 4, MOTION_INTENSITY 2, VISUAL_DENSITY 4. Cards use 28px corners, buttons 16px and inputs 12px. Light/dark themes; motion limited to button feedback. No new illustration assets or dependencies.

The tool counts calendar days in the selected IANA time zone, avoiding DST-related off-by-one errors. Shared links contain the names, date and time zone in their fragment. They are readable by anyone with the link, not encrypted. Nicknames and empty names work. No backend storage, no login, no automatic posting. Changing a countdown creates a new link; existing links retain their date.

Story cards export as 1080×1920 PNGs and include their as-of date/time zone. They are snapshots; users should add their countdown link as a Story link sticker. The visible short site address leads others to create their own countdown, not to the personalized link.

Analytics events contain acquisition fields only:

- `countdown_created`
- `countdown_link_copied` (copy success, not proof of sharing)
- `countdown_partner_landed` (valid link opened, not necessarily a unique partner)
- `countdown_card_downloaded` (download initiated, not proof of posting)

Umami now explicitly excludes URL fragments across the site. The Vercel `beforeSend` hook also strips fragments and fails closed for malformed URLs. This protects both the new countdown and existing game answer fragments. Query-based campaign attribution remains intact.

Verification: production build; countdown tests (valid/invalid dates, leap day, DST, time zones, Unicode, link validation, privacy hooks); existing growth, hero, brand, acquisition and campaign-attribution tests. Browser checks: creation, past-date validation, clipboard copy, reopening shared links, PNG export and visual inspection, 390px mobile overflow, light/dark themes and tools navigation. Local production Lighthouse: 93 Performance, 100 Accessibility, 100 SEO. These are lab scores, not guarantees of ranking or traffic.

Implementation branch: `codex/reunion-countdown`. The user approved committing and deploying on September 14, 2026; deployment status is tracked by the pull request and Vercel checks. The unrelated `skills/` directory remains untouched. After deployment, compare partner-link landings and app clicks with countdown creation; inspect cohorts rather than interpreting raw event ratios as unique-user conversion rates.
