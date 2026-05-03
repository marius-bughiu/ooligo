# Tier-to-action matrix — TEMPLATE

> Replace this template's contents with your team's actual routing reality.
> The lead-scoring skill joins the score's tier with the lead's
> `source_of_lead` to pick a recommended next action. Edit once with your
> SDR/AE manager so the recommendations match what your reps actually do.

## How the skill reads this file

- Rows are `(tier, source_of_lead) → action`. The skill picks the row whose tier matches the score and whose source matches the input. If the source is missing or unrecognized, it falls back to the row marked `*` (any source).
- An action is one short imperative sentence. The skill emits this verbatim under "Recommended next action" — keep it copy-pasteable.

## Matrix

| Tier | Source | Action |
|---|---|---|
| A | inbound_demo | Round-robin to AE within 5 minutes; book meeting in same business day. |
| A | inbound_content | SDR call within 1 hour; reference content piece. Auto-sequence as backup if no answer in 24h. |
| A | outbound_sequence | Move to high-touch sequence; SDR adds 2 personalized steps. |
| A | partner_referral | AE handles directly. Loop in partner manager for warm intro. |
| A | event | SDR call within 24h referencing the event session/booth conversation. |
| A | cold_list | Treat as outbound: enrich further, hand to SDR for personalized first touch. |
| A | * | SDR personalized outreach within 24h. |
| B | inbound_demo | SDR qualification call within 4 hours before AE handoff. |
| B | inbound_content | SDR personalized email within 24h, no auto-sequence. Reference content piece. |
| B | outbound_sequence | Standard outbound sequence, no escalation. |
| B | partner_referral | SDR call within 48h; loop in partner if no response. |
| B | event | SDR email + follow-up call within 48h. |
| B | cold_list | Standard outbound sequence. |
| B | * | SDR email within 48h. |
| C | inbound_demo | SDR fit-call within 24h; many will self-disqualify on the call. |
| C | inbound_content | Add to nurture; no SDR touch unless engagement signals appear. |
| C | outbound_sequence | Pause sequence; do not waste SDR cycles. |
| C | partner_referral | SDR courtesy call within 1 week (relationship cost of ignoring). |
| C | event | Add to nurture only. |
| C | cold_list | Drop. |
| C | * | Nurture only. |
| disqualified | * | Mark `Disqualified — out of ICP` with rubric citation. Do not auto-delete; archive for audit. |

## Escalation overrides

When the skill emits `escalate: needs_human_review`, the action above is replaced with:

> Hold for SDR manager review. Lead is borderline (within 0.5 of tier boundary) or scored on thin data. See "Data gaps" section.

When the skill emits `escalate: insufficient_data`, the action is:

> Re-enrich lead and re-score. Required fields missing: {list}.

## Last edited

{YYYY-MM-DD} — by {SDR manager name}
