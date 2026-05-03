# Methodology mapping — TEMPLATE

> Replace this template's contents with the team's real mapping. The skill uses
> this to translate methodology concepts (e.g. MEDDPICC's "Economic Buyer")
> into the Salesforce field that holds the answer and into Gong phrase patterns
> that count as supporting evidence.

## Methodology in use

`MEDDPICC` (replace if your team uses a different framework — see worked examples for MEDDIC, SPICED, and a custom framework below).

## MEDDPICC mapping (replace contents with team's real fields)

| MEDDPICC concept | Salesforce field | Evidence required | Phrase patterns |
|---|---|---|---|
| Metric | `Success_Metric__c` | gong | quantitative-language pattern (numbers, units, deltas) within 20 tokens of the field value |
| Economic Buyer | `Economic_Buyer__c` | gong | the buyer's name within 12 tokens of decision-language: `approve`, `sign off`, `budget owner`, `final say`, `the call is mine` |
| Decision Criteria | `Decision_Criteria__c` | none | n/a |
| Decision Process | `Decision_Process__c` | gong | step-language pattern: ordinal markers (`first`, `then`, `after that`) with named owners |
| Paper Process | `Paper_Process__c` | gong | procurement or legal entity name within 30 tokens of `MSA`, `redline`, `security review`, `vendor onboarding` |
| Identify Pain | `Pain_Point__c` | gong | the rep-claimed pain phrase or a synonym in customer's own voice (not the rep's) |
| Champion | `Champion__c` | gong | the named contact speaking on the customer's behalf in at least one call where the rep is mostly listening |
| Competition | `Competitive_Landscape__c` | none | n/a |

## MEDDIC mapping (worked example for teams on MEDDIC, not MEDDPICC)

Replace your `methodology in use` above with `MEDDIC` and use this table instead:

| MEDDIC concept | Salesforce field | Evidence required | Phrase patterns |
|---|---|---|---|
| Metrics | `Success_Metric__c` | gong | quantitative-language pattern |
| Economic Buyer | `Economic_Buyer__c` | gong | name within 12 tokens of decision-language |
| Decision Criteria | `Decision_Criteria__c` | none | n/a |
| Decision Process | `Decision_Process__c` | gong | step-language pattern |
| Identify Pain | `Pain_Point__c` | gong | pain phrase in customer's voice |
| Champion | `Champion__c` | gong | customer-led call segment |

## SPICED mapping (worked example)

| SPICED concept | Salesforce field | Evidence required | Phrase patterns |
|---|---|---|---|
| Situation | `Current_State__c` | none | n/a |
| Pain | `Pain_Point__c` | gong | pain phrase in customer's voice |
| Impact | `Quantified_Impact__c` | gong | quantified-cost language: currency or time units within 20 tokens of pain |
| Critical Event | `Critical_Event__c` | gong | date-bounded urgency: a specific date or quarter within 15 tokens of consequence-language (`miss`, `slip`, `risk`) |
| Decision | `Decision_Process__c` | gong | named decision steps with owners |

## Custom framework template

If the team uses a homegrown rubric, list each concept on its own row with the same four columns. The skill treats `Salesforce field` as the ground truth for "what was claimed" and the `Phrase patterns` as the ground truth for "what counts as supporting evidence in Gong."

| Custom concept | Salesforce field | Evidence required | Phrase patterns |
|---|---|---|---|
| {concept} | {field} | `gong` or `none` | {regex or natural-language phrase rule} |

## Last reviewed

YYYY-MM-DD
