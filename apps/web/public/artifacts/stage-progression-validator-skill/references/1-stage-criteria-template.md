# Stage exit-criteria rubric — TEMPLATE

> Replace this template's contents with the team's real stage-by-stage rubric.
> The stage-progression-validator skill reads this file on every run.
> Without your real rules, the verdicts are meaningless.

## Last reviewed

YYYY-MM-DD — bump this date every time the rubric is materially changed. The skill warns at the top of the report if this date is more than 90 days old.

## Methodology in use

One of: `MEDDPICC`, `MEDDIC`, `SPICED`, `BANT`, `custom`. Keep this string in sync with `methodology-mapping-template.md` so the skill loads the right phrase patterns.

## Stages

For each stage that the skill should validate, list rules under three buckets: `field_rules`, `activity_rules`, `stakeholder_rules`. Stages omitted from this file are emitted as `needs_methodology` rather than scored.

### Stage 2 — Discovery confirmed

field_rules:
- `Pain_Point__c IS NOT NULL`
- `Decision_Timeline__c IS NOT NULL`
- `Budget_Range__c IS NOT NULL`

activity_rules:
- `Task.Type = 'Discovery Call'` in last 30 days

stakeholder_rules:
- `OpportunityContactRole` includes a contact with role matching `/^(Manager|Director|VP)/`

evidence_required (qualitative — checked against Gong):
- `Pain_Point__c`
- `Decision_Timeline__c`

### Stage 3 — Solution validated

field_rules:
- `Success_Criteria__c IS NOT NULL`
- `Technical_Validation_Complete__c = true`
- `Decision_Criteria__c IS NOT NULL`

activity_rules:
- `Task.Type = 'Demo'` in last 45 days
- `Task.Type = 'Technical Deep Dive'` in last 30 days

stakeholder_rules:
- `OpportunityContactRole` includes a contact with role matching `/^(VP|Director)/`
- At least one contact with `Is_Technical_Buyer__c = true`

evidence_required (qualitative):
- `Success_Criteria__c`

### Stage 4 — Negotiation

field_rules:
- `Economic_Buyer__c IS NOT NULL`
- `Decision_Criteria__c IS NOT NULL`
- `Paper_Process__c IS NOT NULL`
- `Close_Plan__c IS NOT NULL`
- `Competitive_Landscape__c IS NOT NULL`

activity_rules:
- `Task.Type = 'Pricing Discussion'` in last 30 days

stakeholder_rules:
- `OpportunityContactRole` includes a contact with role matching `/^(VP|Director|C.+O)/`

evidence_required (qualitative):
- `Economic_Buyer__c`
- `Close_Plan__c`

### Stage 5 — Verbal commit

field_rules:
- `Verbal_Commit_Date__c IS NOT NULL`
- `Procurement_Engaged__c = true`
- `MSA_Status__c IN ('In review', 'Approved')`

activity_rules:
- `Task.Type = 'Procurement Call'` in last 21 days

stakeholder_rules:
- `OpportunityContactRole` includes one contact with role `Procurement`
- `OpportunityContactRole` includes one contact with role `Legal` if `MSA_Status__c = 'In review'`

evidence_required (qualitative):
- `Verbal_Commit_Date__c`

## Recording-coverage floor (per stage)

Minimum recorded calls in the prior 30 days for the deal. If the deal is below the floor, the skill emits `needs_manager_review` and surfaces the coverage gap rather than scoring qualitative checks.

| Stage | Min recorded calls in last 30 days |
|---|---|
| Stage 2 | 1 |
| Stage 3 | 2 |
| Stage 4 | 2 |
| Stage 5 | 1 |
