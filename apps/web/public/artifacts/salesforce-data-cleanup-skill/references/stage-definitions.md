# Stage definitions — TEMPLATE

> Replace this template's contents with your team's actual Opportunity
> stage definition. The Skill uses this to flag rows in the
> `stage_violation` bucket — opportunities sitting in a stage without
> the fields that stage requires.

## Funnel stages

List every active value of the Opportunity `StageName` picklist, in funnel order. Mark which stages are open vs closed-won vs closed-lost.

| Order | StageName             | Type        | Probability % |
|------:|-----------------------|-------------|---------------:|
| 1     | Prospecting           | open        |              5 |
| 2     | Qualification         | open        |             15 |
| 3     | Discovery             | open        |             30 |
| 4     | Solutioning           | open        |             50 |
| 5     | Negotiation           | open        |             70 |
| 6     | Verbal Commit         | open        |             90 |
| 7     | Closed Won            | closed-won  |            100 |
| 8     | Closed Lost           | closed-lost |              0 |

## Required fields per stage

A row sitting in stage N must have all fields listed for N (and all earlier stages) populated. The Skill flags rows that violate this as `stage_violation` candidates.

### Qualification

- `AccountId` not null
- `Primary_Contact__c` not null
- `Lead_Source` not null

### Discovery

- All of Qualification, plus:
- At least 1 OpportunityContactRole with `IsPrimary = TRUE`
- `Pain_Point__c` not null
- `Compelling_Event__c` not null

### Solutioning

- All of Discovery, plus:
- `Decision_Criteria__c` not null
- `Decision_Process__c` not null
- At least 2 OpportunityContactRoles

### Negotiation

- All of Solutioning, plus:
- `Economic_Buyer_Identified__c = TRUE`
- `Mutual_Action_Plan_URL__c` not null

### Verbal Commit

- All of Negotiation, plus:
- `Procurement_Status__c` not null
- `Close_Date` within the next 45 days

### Closed Won

- All of Verbal Commit, plus:
- `Close_Date` not in the future
- `Amount` not null and greater than zero
- `Contract_URL__c` not null
- At least 1 `Quote` record with `Status = "Accepted"`

### Closed Lost

- `Close_Date` not in the future
- `Loss_Reason__c` not null
- `Competitor__c` not null when `Loss_Reason__c = "Competitor"`

## Skip-stage rules

Stages that may be legitimately skipped (the Skill does not flag a violation if the row passes through them):

- `Solutioning` may be skipped for inbound deals under $10k ACV
- `Verbal Commit` may be skipped for self-serve conversions

## Last edited

{YYYY-MM-DD}
