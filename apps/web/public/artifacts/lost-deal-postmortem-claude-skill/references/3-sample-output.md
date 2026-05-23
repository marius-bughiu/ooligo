# Sample output — for Salesforce writeback and loss-log wiring

> A literal example of what the skill emits for a fictional closed-lost deal.
> Use this when building the Salesforce Flow writeback, a Gong call summary
> field mapper, or a shared loss-log paste target.

## Single-deal postmortem output

```markdown
# Postmortem — Acme Corp (SF-OPP-12345)

**Close date:** 2025-10-14
**Deal value:** $84,000
**Confidence:** 4 / 5
**Sources used:** Gong (2 calls), Salesforce notes (4 entries)

## Loss reason

**Primary:** competitor_win — Acme signed with Vendor X after a bake-off demo on 2025-10-09 (Gong call 2, 14:32). Champion confirmed "they had the feature we needed natively."
**Secondary:** product_gap — No native Slack integration; mentioned as a friction point in Gong call 1 (2025-09-28, 08:14) and referenced again in the final call.

## Competitor / alternative

Vendor X (named in Gong call 2, 2025-10-09). No other competitors or build-internally signals identified.

## Timeline

| Date | Event | Source | Summary |
|---|---|---|---|
| 2025-08-12 | stage_change: Qualification → Demo Set | Salesforce | Champion agreed to a discovery call after outbound sequence. |
| 2025-09-03 | call_discovery | Gong | Identified Slack integration as a key requirement for the champion's team. |
| 2025-09-28 | call_demo | Gong | Technical demo. Champion asked about native Slack connector; AE deferred to roadmap ("Q1 2026"). |
| 2025-10-07 | stage_change: Proposal → Negotiation | Salesforce | MSA sent. AE notes: "Commercial terms agreed in principle." |
| 2025-10-09 | call_final_decision + competitor_mention | Gong | Champion disclosed bake-off with Vendor X. Vendor X had native Slack integration. Decision went to Vendor X. |
| 2025-10-14 | stage_change: Closed Lost | Salesforce | AE notes: "Lost to competitor on native integration. Budget was not the issue." |

## Seller action review

At the 2025-09-28 demo, the Slack integration requirement was identified and logged. The AE deferred to the Q1 2026 roadmap without offering an interim workaround (Zapier connector with documented steps, which the Northwind deal used successfully for 90 days pre-GA). Surfacing the workaround would not have guaranteed the win — Vendor X had the native feature — but it would have removed the gap from the bake-off criteria. Signal was present at the time of the demo call; this is not a retrospective observation.

## Salesforce fields (paste-ready)

```
Loss_Reason__c: competitor_win
Loss_Reason_Secondary__c: product_gap
Competitor_Mentioned__c: Vendor X
Postmortem_Confidence__c: 4
Postmortem_Summary__c: Lost to Vendor X primarily on native Slack integration. Product gap was the deciding factor in the bake-off; price and budget were not cited as objections.
```

---

_Postmortem generated: 2025-10-15 | Inputs: Gong (2), SF notes (4) | Timeline events: 6_
```

## Insufficient-data output (example)

When fewer than `min_timeline_events` events are found:

```markdown
# Postmortem — Tailspin Toys (SF-OPP-67890)

**result:** insufficient_data
**Timeline events found:** 2 (threshold: 3)
**Sources checked:** Salesforce notes (1 entry), no Gong transcripts linked

Postmortem not generated. Recoverable timeline has 2 events, below the minimum of 3.
Log the missing calls or attach the Gong transcript IDs to this opportunity and re-run.

---

_Checked: 2025-10-15_
```

## Field contract for parsers

If you build a structured parser instead of consuming the markdown:

- `opportunity_id` — string
- `account_name` — string
- `close_date` — ISO 8601 date
- `deal_value_usd` — number or null
- `confidence` — integer 1-5
- `primary_loss_reason` — category ID string (from config taxonomy) or `insufficient_data`
- `secondary_loss_reason` — category ID string or null
- `competitor_mentioned` — string or null
- `timeline[]` — array of `{date, event_type, source, summary}`
- `seller_action_review` — string or `insufficient_data_for_seller_review`
- `salesforce_fields` — object with API-name keys matching config
- `result` — enum: `ok` / `insufficient_data`
