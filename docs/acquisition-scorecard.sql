-- Run in Supabase SQL Editor. One row per acquisition source/campaign.
-- Count distinct couple_id because both partners may emit an activation.
with attributed_events as (
  select
    couple_id,
    event_name,
    created_at,
    coalesce(properties ->> 'utm_source', 'unattributed') as source,
    coalesce(properties ->> 'utm_campaign', 'unattributed') as campaign
  from product_events
  where event_name in ('couple_connected', 'couple_second_session')
    and created_at >= now() - interval '30 days'
),
couples as (
  select
    couple_id,
    source,
    campaign,
    min(created_at) filter (where event_name = 'couple_connected') as connected_at,
    min(created_at) filter (where event_name = 'couple_second_session') as second_session_at
  from attributed_events
  where couple_id is not null
  group by couple_id, source, campaign
)
select
  source,
  campaign,
  count(*) filter (where connected_at is not null) as connected_couples,
  count(*) filter (where second_session_at is not null) as activated_couples,
  round(
    100.0 * count(*) filter (where second_session_at is not null)
    / nullif(count(*) filter (where connected_at is not null), 0),
    1
  ) as second_session_rate_percent
from couples
group by source, campaign
order by activated_couples desc, connected_couples desc;
