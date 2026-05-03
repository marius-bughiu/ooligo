# Risk signal weights — TEMPLATE

> Replace these weights with values your CSM lead has signed off on.
> The skill multiplies `severity` (1-5) by the weight below to get
> per-event contribution to `signal_score`. Edit one number at a time
> and watch the next two digests before editing again.

## Per-event-type weights

| Event type              | Weight | Notes                                                           |
|-------------------------|-------:|-----------------------------------------------------------------|
| `exec_disengagement`    |    5.0 | Sponsor stops attending QBRs / unread emails for 30+ days       |
| `sponsor_change`        |    4.0 | Champion left or moved internally; new owner not yet onboarded  |
| `contract_renegotiation`|    3.5 | Procurement opened a contract review outside the renewal window |
| `support_escalation`    |    3.0 | P1 case open > 5 business days, or 3+ P2s in 14 days            |
| `usage_drop`            |    3.0 | Active seats / API calls / features-used down >25% over 14 days |
| `nps_detractor`         |    2.0 | NPS <= 6 from any buying-committee role in the last 30 days     |
| `qbr_missed`            |    2.0 | Cancelled or no-show with no reschedule within 14 days          |

## Always-escalate single signals

These trigger Red regardless of `signal_score`. The skill should treat
them as a hard override, not a soft boost.

- `exec_disengagement` at severity 5
- `sponsor_change` at severity 4-5 when the renewal date is within 90 days
- `contract_renegotiation` at any severity when ARR > 250k

## Per-event contribution cap

A single event contributes at most 5.0 to `signal_score` regardless of
`severity * weight`. This prevents one severity-5 sponsor change from
single-handedly flooding the digest with one account at the expense of
two genuinely declining ones.

## Weight calibration log

Append every change here so the next person editing this file can see
why the numbers are what they are. Format: `YYYY-MM-DD — change — reason`.

- {YYYY-MM-DD} — initial weights — placeholder, replace with team-tuned values

## Last edited

{YYYY-MM-DD}
