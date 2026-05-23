# Signal taxonomy — TEMPLATE

> Replace the event types below with the signal vocabulary from your Common Room
> configuration and Gong call-topic tags. The signal-bundler skill looks up each
> normalized event's `event_type` in this table to assign an urgency tier.
> Events not found here default to `warm`.

## How the skill reads this file

- `urgency_tier` must be one of: `hot`, `warm`, `cold`.
- `action_category` is free text — the skill uses it in the recommended-first-move draft.
- Keep the table sorted by `urgency_tier` descending (hot rows first) so the file
  reads as a priority list when a human scans it.
- Update `Last edited` when you change weights. The skill records this date in the
  digest footer so AEs can tell when the taxonomy was last calibrated.

## Taxonomy

| Source | Event type | Urgency tier | Action category | Notes |
|---|---|---|---|---|
| Web | pricing_page_visit | hot | Call within 24h | Especially hot if 2+ visits in 48h from same actor |
| Email | security_questionnaire_opened | hot | Call within 24h | Strong late-stage intent signal |
| Gong | competitor_mentioned | hot | Probe on next call | Flag if unnamed — AE must identify before next touchpoint |
| Gong | pricing_discussed | hot | Confirm proposal status | |
| Gong | contract_terms_mentioned | hot | Loop in deal desk | |
| Web | demo_request_submitted | hot | Round-robin to AE within 1h | |
| Product | feature_activation_new | hot | Call to understand use case | First activation of a premium feature |
| Product | seat_expansion | hot | Expansion conversation | |
| Common Room | executive_joined_community | hot | AE direct outreach | C-suite or VP-level join is rare |
| Gong | champion_attrition_signal | hot | Re-map buying committee | Champion leaving or changing roles |
| Web | case_study_download | warm | SDR follow-up within 48h | |
| Email | proposal_opened | warm | Follow-up call within 24h | Warm if first open; hot if 3+ opens same day |
| Common Room | product_slack_join | warm | AE awareness; no immediate action | |
| GitHub | repo_starred | warm | AE awareness; not an action trigger alone | |
| GitHub | repo_forked | warm | Check if technical evaluator is new | |
| Common Room | community_question_posted | warm | Product or CS to answer; flag to AE | |
| Gong | product_fit_question | warm | Share relevant case study | |
| Gong | timeline_mentioned | warm | Confirm next step alignment | |
| Product | login_frequency_increase | warm | Usage-based outreach | Sustained 3-day increase |
| Web | blog_post_read | cold | Marketing nurture; AE awareness | |
| Email | email_opened | cold | No immediate action | Unless paired with other warm/hot signal |
| Common Room | twitter_mention | cold | Social acknowledgment if relevant | |
| Product | login_frequency_decrease | cold | CS health check; inform AE | |

## Escalation overrides

When `event_type` is any of the following AND the actor is on the buying committee,
always upgrade to `hot` regardless of the base tier:

- `proposal_opened` (any number of opens)
- `pricing_page_visit` (any visit)
- `contract_terms_mentioned`

## Last edited

{YYYY-MM-DD} — by {name}
