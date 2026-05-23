# Postmortem config — TEMPLATE

> Replace this file's contents with your team's actual loss taxonomy and thresholds.
> The lost-deal-postmortem skill reads this file before every run. A blank or
> missing taxonomy causes the skill to fall back to the default categories below —
> which are generic and will not match your team's QBR reporting unless you align them.

## How the skill reads this file

- **Loss categories** — the skill maps every identified loss reason to one of these categories. Categories not in this list will not appear in outputs. If your Salesforce picklist uses different names, align this file to that picklist.
- **min_timeline_events** — the skill refuses to produce a postmortem when fewer than this many distinct datable events are recoverable from the inputs. Raise it to 4 or 5 if your AEs log well; keep it at 3 if they under-log and you'd rather have thin analyses than none.
- **Salesforce field mapping** — the skill emits a "Salesforce fields (paste-ready)" block at the end of every postmortem. Map each analysis output to the Salesforce API field name your team uses.

## Loss categories

| Category ID | Display label | When to use |
|---|---|---|
| competitor_win | Competitor win | Deal went to a named competitor confirmed in transcript or notes. |
| product_gap | Product gap | A specific feature or integration the buyer required was absent or on roadmap. |
| price_too_high | Price — too high | Price was the stated primary objection and no discount resolved it. |
| budget_freeze | Budget freeze | Budget was reallocated or frozen at the company level — not a price objection. |
| champion_lost | Champion left or moved | Primary internal champion changed role, left the company, or lost authority. |
| timing_not_right | Timing | Buyer deferred — project not prioritized, org in a freeze, or fiscal cycle misaligned. |
| no_decision | No decision | Buyer evaluated but made no purchase decision — stayed with status quo. |
| build_internally | Build internally | Buyer chose to build the capability in-house rather than buy. |
| other | Other | Loss reason does not fit any above category. Requires a free-text note. |

## Minimum timeline events

```
min_timeline_events: 3
```

Raise to 4 or 5 for teams that log consistently. The skill returns `insufficient_data` (rather than producing a thin analysis) when the event count falls below this threshold.

## Salesforce field mapping

Map the skill's output fields to your Salesforce API field names. The skill emits the paste-ready block using these names.

| Skill output field | Salesforce API field name |
|---|---|
| primary_loss_reason | Loss_Reason__c |
| secondary_loss_reason | Loss_Reason_Secondary__c |
| competitor_mentioned | Competitor_Mentioned__c |
| confidence_score | Postmortem_Confidence__c |
| postmortem_summary | Postmortem_Summary__c |

Replace the right-hand column values with your actual API field names if they differ.

## Last edited

{YYYY-MM-DD} — by {RevOps team member name}
