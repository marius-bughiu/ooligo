# Prevention action library — TEMPLATE

> Replace this template's contents with your team's actual prevention
> playbook. The churn-analysis skill chooses one entry from this file
> per analysis (step 4). It is not allowed to invent new actions — if
> no entry fits, the skill returns `no library match — prevention
> action requires human design` and a human extends the library
> deliberately. This keeps quarterly aggregates of "we recommended X
> for Y churns" meaningful.

## Format

Each entry has a slug (used by the skill), a one-sentence description,
the trigger condition that should fire it, the owner role, and the
churn category it most often pairs with.

## Entries

### `health-score-alert-multi-week-drop`

Fire a CSM alert when the health score drops by 15 points or more over
any rolling 14-day window.

- Trigger: rolling 14-day delta ≤ -15
- Owner: CSM
- Pairs most with: `adoption-failure`, `service-failure`

### `sponsor-change-detection`

Cross-reference CRM contacts against LinkedIn weekly. Flag any
departure of a contact tagged `economic-buyer` or `champion`.

- Trigger: LinkedIn departure of a contact tagged with one of the
  champion roles
- Owner: RevOps (automation), CSM (response)
- Pairs most with: `champion-departure`

### `quarterly-pricing-sensitivity-check`

In every QBR, ask the buyer's stated budget posture for the next
contract cycle. Record verbatim in the CRM.

- Trigger: every QBR, no exceptions
- Owner: CSM
- Pairs most with: `pricing`

### `escalation-on-severity-1-pattern`

Auto-escalate to the VP of CS when an account opens 3 or more
severity-1 tickets in any rolling 60-day window.

- Trigger: ≥ 3 sev-1 tickets in 60 days
- Owner: Support → VP CS
- Pairs most with: `service-failure`

### `success-plan-milestone-tracking`

Each success plan defines 3-5 milestones with dates. The CSM reviews
status weekly and flags any milestone slipping by more than 14 days.

- Trigger: milestone slip > 14 days
- Owner: CSM
- Pairs most with: `adoption-failure`

### `consolidation-conversation-trigger`

When a customer publicly announces a strategic vendor consolidation
initiative, the CSM books a check-in within 14 days to position the
product against displacement.

- Trigger: public announcement (press release, earnings call, blog)
  of a consolidation initiative naming a competing platform
- Owner: CSM + AE
- Pairs most with: `consolidation`

### `usage-threshold-alert`

Fire an alert when weekly active users drops below the success-plan
threshold for two consecutive weeks.

- Trigger: WAU < threshold for 2 weeks
- Owner: CSM
- Pairs most with: `adoption-failure`

### `restructure-watchlist`

Maintain a watchlist of accounts where the customer has announced
layoffs, M&A, or strategic pivot. Re-validate the use case within 30
days of the announcement.

- Trigger: public announcement of restructure event
- Owner: CSM + AE
- Pairs most with: `restructure`

### `competitive-mention-alert`

Flag any Gong call where a named competitor appears in customer
speech. Notify the AE and CSM jointly.

- Trigger: competitor named in customer speech on a Gong call
- Owner: AE + CSM
- Pairs most with: `competitive-displacement`

## Adding a new entry

The skill flags `no library match — prevention action requires human
design` when no entry fits a churn. Review these monthly. Add a new
entry only when:

1. The trigger is mechanically detectable (a metric, a date, a public
   event) — not a vibe.
2. The owner is a single named role.
3. The action is small enough to actually happen on the timeline
   between the trigger firing and the churn risk crystallizing.

## Last edited

{YYYY-MM-DD}
