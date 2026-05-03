# Success-plan format — TEMPLATE

> Replace this template's contents with your team's actual success-plan
> schema. The qbr-prep skill parses the success-plan doc against this
> shape; if the parse fails, the skill halts rather than guessing.
> Adopt this same template across the CSM team so every account's plan
> reads the same way.

## Storage location

Pick one and stick to it. Mixing storage breaks the skill's `success_plan_ref` resolver.

- Notion: one page per account, parented under "Customer Success Plans"
- Salesforce: custom object `Success_Plan__c`, lookup from Account
- Gainsight: CTA of type `Success Plan`, one open at a time per account

## Required fields

The skill expects these fields, in this order. Optional fields are tolerated and ignored.

| Field | Type | Description |
|---|---|---|
| `account_id` | string | Salesforce 18-character account ID — must match the skill's input |
| `plan_owner` | string | CSM email |
| `quarter_started` | string | Quarter label, e.g. `Q4-2025` |
| `last_updated` | date | The skill flags `SUCCESS_PLAN_STALE` if older than 60 days |
| `business_outcomes` | list of objects | The customer's stated outcomes; see schema below |
| `goals` | list of objects | The measurable goals laid against each outcome; see schema below |
| `risks_known` | list of objects | Risks the CSM has already logged outside the QBR cycle |
| `next_review_date` | date | When this plan is next scheduled for refresh |

## `business_outcomes` schema

Each outcome answers "what is the customer trying to achieve in their business?"

```yaml
- outcome_id: BO-1
  statement: "Reduce time-to-onboard new sales reps from 8 weeks to 4 weeks"
  stakeholder: "VP Revenue Operations"
  priority: critical | high | medium
```

## `goals` schema

Each goal is the measurable thing the product is supposed to move. Goals are what the `success_plan_progress` slot reports against.

```yaml
- goal_id: G-1
  outcome_id: BO-1
  metric: "Average rep time-to-first-deal"
  baseline: 56  # days, recorded at plan start
  target: 28
  current: 41   # updated quarterly by the CSM
  status: on-track | at-risk | off-track | achieved | abandoned
  evidence_url: "{link to dashboard or report}"
```

## `risks_known` schema

The skill cross-references these against the synthesis pass. Risks logged here that are still active become `yellow` or `red` rows in `risk_summary`.

```yaml
- risk_id: R-1
  description: "Champion left for new role; replacement not yet identified"
  severity: red | yellow | green
  owner: csm | ae | product | customer
  logged_date: 2026-01-15
  mitigation: "AE has scheduled intro with VP RevOps for replacement champion identification"
```

## Worked example

```yaml
account_id: "0014x000ABCDEFGHIJ"
plan_owner: "alex.csm@yourco.com"
quarter_started: "Q4-2025"
last_updated: 2026-04-12
next_review_date: 2026-07-15

business_outcomes:
  - outcome_id: BO-1
    statement: "Reduce time-to-onboard new sales reps from 8 weeks to 4 weeks"
    stakeholder: "VP Revenue Operations"
    priority: critical

goals:
  - goal_id: G-1
    outcome_id: BO-1
    metric: "Average rep time-to-first-deal (days)"
    baseline: 56
    target: 28
    current: 41
    status: at-risk
    evidence_url: "https://lookerstudio.example.com/reports/onboarding-tti"

risks_known:
  - risk_id: R-1
    description: "VP RevOps champion took new role at peer company in March"
    severity: red
    owner: ae
    logged_date: 2026-03-22
    mitigation: "AE working through CFO intro for replacement champion"
```
