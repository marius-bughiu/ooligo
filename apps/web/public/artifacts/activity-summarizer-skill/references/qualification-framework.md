# Qualification framework — TEMPLATE (MEDDPICC default)

> Replace this template's contents with your team's actual qualification
> framework. The activity-summarizer skill reads this file on every run
> to decide which Salesforce fields signal a "stuck" deal. Without your
> real field names, the skill defaults to a MEDDPICC scaffold that may
> not match your CRM schema.

## Framework name

MEDDPICC (replace with `BANT`, `SPICED`, your team's homegrown variant, etc.)

## Required fields

For each letter / criterion, list the Salesforce field that holds it. The
skill checks these fields per opportunity; missing values feed the "stuck"
bucket via the signal rubric.

| Criterion | Salesforce field | What "filled" looks like |
|---|---|---|
| Metrics | `Opportunity.Metrics__c` | A quantified business outcome the buyer cares about |
| Economic buyer | `Opportunity.Economic_Buyer__c` | Named individual with budget authority — not the champion |
| Decision criteria | `Opportunity.Decision_Criteria__c` | Written list of how the buyer will choose |
| Decision process | `Opportunity.Decision_Process__c` | Sequence of meetings/approvals required to close |
| Paper process | `Opportunity.Paper_Process__c` | Procurement, security review, legal — sequenced |
| Identified pain | `Opportunity.Identified_Pain__c` | The pain in the buyer's words, not the rep's |
| Champion | `Opportunity.Champion__c` | Named individual who sells internally on the rep's behalf |
| Competition | `Opportunity.Competitors__c` | Named competitors in the deal, including "do nothing" |

## Stage-by-stage minimums

Per stage, which fields MUST be filled before the deal is allowed to advance.
The skill flags any deal that has advanced past the minimum without the fields.

| Stage | Required fields |
|---|---|
| Discovery | Identified pain, Champion |
| Qualification | + Economic buyer, Metrics |
| Proposal | + Decision criteria, Decision process |
| Negotiation | + Paper process, Competition |
| Closed Won/Lost | (no further requirements) |

## Time-in-stage medians (for "stuck" detection)

Replace these with your team's actuals from a Salesforce report. The skill
flags a deal as stuck when time-in-stage exceeds 1.5x the median below AND
a required field for that stage is empty.

| Stage | Median days |
|---|---|
| Discovery | 14 |
| Qualification | 21 |
| Proposal | 14 |
| Negotiation | 10 |

## Disqualifiers

Single conditions that drop a deal out of the active pipeline regardless of
field completeness. The skill surfaces these prominently in the report.

- No champion identified after 30 days in pipeline
- Economic buyer never met after Proposal stage entered
- Competitor named is one we historically lose to (list here): {Competitor 1}, {Competitor 2}

## Last edited

{YYYY-MM-DD}
