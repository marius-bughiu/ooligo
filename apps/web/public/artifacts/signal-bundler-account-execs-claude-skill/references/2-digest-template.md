# Digest template — TEMPLATE

> This is the structural skeleton the signal-bundler skill populates for each
> account digest. Downstream formatters (Slack blocks, email templates, CRM
> rich-text fields) should key on the section headers here — they are the
> stable schema. Values in {curly braces} are populated by the skill at runtime.

## Template

```markdown
# Signal digest — {account_name} | {date YYYY-MM-DD}

**AE:** {ae_name or "unassigned"}
**Stage:** {opportunity_stage} — {opportunity_arr or "no open opportunity"}
**Signals this window:** {hot_count} hot · {warm_count} warm · {cold_count} cold

## What happened

{3-5 sentence narrative, ordered by urgency tier. Names specific actors and
event types. Does not editorialize — describes what happened, not what the AE
"should think". If no hot signals exist, opens with the highest-urgency warm
signal instead.}

## Recommended first move

{One sentence. Imperative. Cites the specific signal that motivates the action.
Example: "Call {actor} today — {event} is the strongest buying signal in 30 days."}

## Signal table

| Time | Actor | Source | Event | Urgency |
|---|---|---|---|---|
| {timestamp} | {actor_name} | {source} | {event_description} | {urgency_tier} |

*Table capped at 10 rows: top 3 hot + up to 7 warm, sorted urgency then timestamp.*
*Cold signals counted in header only unless no warm/hot signals exist.*

## Data freshness

Earliest event: {earliest_timestamp} | Latest event: {latest_timestamp} | Lookback: {lookback_hours}h

{If product_events absent:}
⚠ Product events not included — check {product analytics tool name} for feature activations before calling.

{If last Gong call > 7 days ago:}
⚠ Last call: {N} days ago — Gong signals in this digest downgraded to warm.
```

## Slack block equivalent

If you format the digest as a Slack message instead of markdown, map sections as follows:

- `# Signal digest —` → bold header block
- `## What happened` → text block with 3-5 sentences
- `## Recommended first move` → callout block (colored yellow for warm, red for hot)
- Signal table → bullet list (Slack does not render markdown tables in blocks)
- Data freshness → context block (muted text, footer position)

## CRM writeback fields (Salesforce example)

If you write the brief back to the Salesforce account record, map to these fields:

| Digest section | Salesforce field | Field type |
|---|---|---|
| hot_count | `Signal_Hot_Count__c` | Number |
| warm_count | `Signal_Warm_Count__c` | Number |
| Recommended first move | `Signal_Next_Action__c` | Text (255) |
| Latest event timestamp | `Signal_Last_Activity__c` | DateTime |
| Full digest markdown | `Signal_Digest__c` | Long Text Area |

## Last edited

{YYYY-MM-DD} — by {name}
