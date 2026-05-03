# Sample digest — worked example

> The skill emits this exact format, Slack-mrkdwn flavored. Treat this
> file as the contract: if you change the layout, change it here first
> and the skill follows. Do not let the model improvise structure.

## Worked example output

```
*Daily churn-risk digest — 2025-11-04*

*Red (3)* — act this week
- *Acme Robotics* — $480k ARR · owner @nadia · renewal 2025-12-18
  Driver: VP Eng skipped two scheduled syncs and an automation pilot was paused on 10-29.
  Action: Get Nadia a 30-min slot with the new VP Eng before Friday's renewal kickoff.
- *Northwind Logistics* — $310k ARR · owner @marcus · renewal 2026-01-09
  Driver: Active seats fell from 142 to 89 over the last 7 days; finance opened a contract review.
  Action: Open a discount-modeling thread with the deal desk before the procurement call on 11-07.
- *Globex Health* — $265k ARR · owner @priya · renewal 2026-02-22
  Driver: P1 outage case open since 10-30 with no first-response SLA met.
  Action: Escalate the open P1 to support leadership and brief Priya before her standing customer call.

*Amber (4)* — review by Friday
- *Initech* — $180k ARR · owner @marcus · renewal 2026-03-14
  Driver: Sponsor moved to a new role last week; new owner has not been introduced.
  Action: Send the QBR deck and offer a 15-min intro call with the new sponsor.
- *Vandelay Imports* — $140k ARR · owner @nadia · renewal 2026-01-30
  Driver: Three P2 cases opened in the last 10 days, all on the reporting module.
  Action: needs human review
- *Soylent Foods* — $115k ARR · owner @priya · renewal 2026-04-02
  Driver: NPS dropped to 4 from the Director of Ops on 10-31.
  Action: Forward the survey verbatim to Priya and request a follow-up 1:1 with the Director.
- *Pied Piper* — $95k ARR · owner @marcus · renewal 2026-02-11
  Driver: QBR cancelled 10-28, no reschedule.
  Action: Propose three slots for next week and copy the original sponsor.

*Watch (6)* — no action required, tracking only.
6 accounts crossed into the watch band; signal not strong enough for action this week.

_Filtered out: 2 below $50k · 0 outside segment._
_Capped at 13 of 13 qualifying. Full list: https://gainsight.example.com/views/churn-risk-trailing-24h_
_Event-type mix this week: usage_drop 24%, support_escalation 28%, sponsor_change 14%, qbr_missed 12%, nps_detractor 10%, exec_disengagement 6%, contract_renegotiation 6%._
_Weights file: 1-risk-signal-weights.md @ a3f9c12_
```

## Notes for the skill

- Account names are bolded with single asterisks (Slack-mrkdwn).
- The `Action:` line is the *only* place where a generic phrase
  (`engage`, `align`, `socialize`, `reach out`, `touch base`) is
  rejected and replaced with `needs human review`.
- The Watch bucket never emits per-account lines. Only the count.
- The footer carries three diagnostics — filter counts, event-type
  mix, and the weights-file hash — that exist to make
  miscalibration visible early. Do not drop them to save lines.
