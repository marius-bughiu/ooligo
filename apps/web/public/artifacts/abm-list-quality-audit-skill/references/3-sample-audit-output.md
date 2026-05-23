# Sample audit output — for parser wiring

> A literal example of what the skill emits for a 5-account list. Use
> when wiring the downstream parser: Clay AI column → property mapping,
> Salesforce custom-code action → property writeback, CSV post-processor.
> The schema below is what the skill commits to; the values are illustrative.

## Full audit report

```markdown
# ABM list audit — Q3 2026 DACH expansion (run 2026-05-23)

**List quality score:** 52 / 100
**Accounts audited:** 5
**Breakdown:** Q1: 1 · Q2: 2 · Q3: 1 · Q4: 1

## Recommendation

List is marginal (score 52). Do not launch until Q3/Q4 accounts are remediated or removed.
Priority: re-enrich 2 Q2 accounts with missing headcount data; remove 1 Q4 account.

## Per-account results

| Domain | Quality tier | Score | Defect codes |
|---|---|---|---|
| northwind.com | Q1 | 8.6 | none |
| tailspin.io | Q2 | 7.1 | missing-field:headcount, stale-data |
| fabrikam.de | Q2 | 6.3 | wrong-size:too-small, low-intent |
| contoso.com | Q3 | 5.0 | wrong-industry, missing-field:tech_stack |
| adventure-works.com | Q4 | 3.2 | wrong-size:too-large, wrong-geo, missing-field:revenue |

## Defect frequency table

| Defect code | Count | Action |
|---|---|---|
| missing-field:headcount | 2 | Re-enrich via Clay ZoomInfo column |
| stale-data | 2 | Re-run enrichment — last_enrichment_date > 90 days |
| wrong-size | 2 | Review headcount band in rubric — may be over-restricted |
| wrong-industry | 1 | Confirm industry mapping — SIC code may be miscategorized |
| wrong-geo | 1 | Remove if DACH-only campaign; keep for global list |
| low-intent | 1 | Move to nurture; re-activate when intent signal appears |
| missing-field:tech_stack | 1 | Re-enrich via BuiltWith or Clay tech-stack column |

## Remediation queue (by re-audit lift)

1. tailspin.io — add headcount; re-enrich; likely Q1 after fix.
2. fabrikam.de — low-intent flag only; already in-ICP. Activate when intent spikes.
3. contoso.com — re-enrich tech_stack; confirm industry; may move to Q2.

---
_Rubric SHA-256: 4f9c...a812 | Last edited 2026-05-01 by Sam Patel_
```

## Field contract for parsers

If you build a parser instead of consuming the markdown, these are the stable fields:

### List-level fields

- `list_name` — string
- `run_date` — ISO date string (YYYY-MM-DD)
- `list_quality_score` — integer, 0-100
- `total_accounts` — integer
- `q1_count`, `q2_count`, `q3_count`, `q4_count` — integers
- `recommendation` — string, one paragraph
- `defect_frequency[]` — array of `{defect_code, count, action}`
- `remediation_queue[]` — array of `{domain, rationale, estimated_tier_after_fix}`

### Per-account fields

- `domain` — string, lowercased
- `quality_tier` — enum: `Q1` / `Q2` / `Q3` / `Q4` / `disqualified`
- `score` — float, 0.0 to 10.0
- `defect_codes[]` — array of strings (defect code vocabulary from `references/2-defect-taxonomy.md`)
- `positive_flags[]` — array of strings (e.g. `intent-spike`)
- `rationale[]` — array of `{criterion, weight, tier, reason}` (same structure as lead-scoring skill)
- `data_notes` — string, e.g. "scored on potentially stale data (last_enrichment_date: 2025-02-14)"

### Salesforce CRM writeback mapping

| Audit field | Salesforce field | Field type |
|---|---|---|
| quality_tier | `ABM_Quality_Tier__c` | Picklist (Q1/Q2/Q3/Q4/disqualified) |
| defect_codes[] joined by `, ` | `ABM_Defect_Codes__c` | Text (255) |
| score | `ABM_ICP_Score__c` | Number (decimal, 1 place) |
| run_date | `ABM_Last_Audited__c` | Date |
| positive_flags[] joined by `, ` | `ABM_Intent_Flags__c` | Text (255) |
