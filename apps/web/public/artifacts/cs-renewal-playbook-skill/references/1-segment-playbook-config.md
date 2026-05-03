# Segment-aware playbook config — TEMPLATE

> Replace this template's contents with your team's actual segment definitions
> and per-segment playbook structure. The cs-renewal-playbook skill reads this
> file on every run; without your real segmentation, the playbook structure
> defaults to mid-market and may not match your CS motion.

## Segment definitions

The Skill expects three segments. Adjust the ARR thresholds to match your CS team's coverage model.

| Segment | ARR band | CSM coverage | Pacing window |
|---|---|---|---|
| `enterprise` | over 250k | 1:8 named | 90 days (T-120 to T-30) |
| `mid-market` | 50k to 250k | 1:30 pooled | 60 days (T-90 to T-30) |
| `smb` | under 50k | 1:200 digital | 30 days (T-60 to T-30) |

## Per-segment playbook sections

The Skill includes or omits sections based on segment. Mark each section as `included`, `omitted`, or `optional`.

### Enterprise

| Section | Status | Notes |
|---|---|---|
| Account context | included | Always |
| Risk diagnosis | included | Up to two archetypes |
| Renewal-probability band | included | All four bands available |
| Stakeholder motions | included | One row per stakeholder, full matrix |
| Executive sponsor motion | included | EBR within 30 days, CSM-leader joint |
| Procurement engagement | included | Track 1: technical; Track 2: commercial |
| Talk-tracks | included | Three objections |
| Escalation gate | included | Two-tier (CSM leader, VP CS) |
| 30/60/90 pacing | included | Full plan |

### Mid-market

| Section | Status | Notes |
|---|---|---|
| Account context | included | |
| Risk diagnosis | included | Single archetype, secondary optional |
| Renewal-probability band | included | All four bands available |
| Stakeholder motions | included | Limit to top 4 stakeholders |
| Executive sponsor motion | optional | Only if exec sponsor exists in stakeholder map |
| Procurement engagement | omitted | Routed via AE if it surfaces |
| Talk-tracks | included | Two objections |
| Escalation gate | included | Single-tier (CSM leader only) |
| 30/60/90 pacing | included | Compressed to 60 days |

### SMB

| Section | Status | Notes |
|---|---|---|
| Account context | included | |
| Risk diagnosis | included | Single archetype only |
| Renewal-probability band | included | Three bands; <15% collapses to "churn likely" |
| Stakeholder motions | included | Single motion: end user only |
| Executive sponsor motion | omitted | Not applicable |
| Procurement engagement | omitted | Not applicable |
| Talk-tracks | included | One objection |
| Escalation gate | included | Single-tier (Pool lead) |
| 30/60/90 pacing | included | Collapsed to 30 days |

## Per-segment archetype overrides

Some archetypes don't make sense at certain segments. Define overrides here.

| Archetype | Enterprise | Mid-market | SMB |
|---|---|---|---|
| `champion-lost` | Full save motion | Full save motion | Treat as `value-gap` |
| `low-adoption` | Full save motion | Full save motion | Full save motion |
| `pricing-pushback` | Route to Deal Desk | Route to Deal Desk | Templated discount offer |
| `competitive` | Full save motion + competitive briefing | Full save motion | Surrender if confirmed |
| `value-gap` | Full save motion | Full save motion | Templated re-onboarding |

## ARR threshold for "do not run this Skill"

Below this ARR, the cost of generating and reviewing a custom playbook exceeds the expected save value. The Skill aborts and recommends the SMB templated motion instead.

- Threshold: under 25k ARR (override here if your team operates at different unit economics)

## Last edited

{YYYY-MM-DD} — update on every material change so the Skill can warn when the config is stale.
