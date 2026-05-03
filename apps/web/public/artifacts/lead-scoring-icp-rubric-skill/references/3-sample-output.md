# Sample output — for parser wiring

> A literal example of what the skill emits for one fictional lead. Use
> this when wiring the downstream parser (Clay AI column → property
> mapping, HubSpot custom-code action → property writeback, CSV
> post-processor). The schema below is what the skill commits to; the
> values are illustrative.

## Single-lead output

```markdown
# Lead score — jane.doe@northwind.com (northwind.com)

**Score:** 7.4 / 10 — Tier B
**Source:** inbound_content
**Escalate:** no

## Recommended next action

Tier B + inbound_content → SDR personalized email within 24h, no auto-sequence. Reference content piece they engaged with.

## Rationale (per criterion)

| Criterion | Weight | Tier | Reason |
|---|---|---|---|
| Industry | 5 | A | "Vertical SaaS / RevOps" matches in-ICP row in rubric. |
| Headcount | 4 | B | 240 employees — in stretch range (200-500), not core (500-2000). |
| Geo | 3 | A | HQ US-east, in supported region. |
| Tech stack | 4 | B | Salesforce + Marketo present (fit signals); no data warehouse cited. |
| Funding stage | 2 | C | Bootstrapped — out of preferred Series B-D band. |
| Job title | 4 | A | "Director, RevOps" matches champion-target pattern. |

## Disqualifier check

None triggered.

## Data gaps

- `revenue` field not provided by enrichment.

---

_Rubric SHA-256: 4f9c...a812 | Last edited 2025-12-15 by Sam Patel_
```

## Batch output

For a batch of N leads, the skill prepends a summary table and emits one block per lead separated by `\n---\n`:

```markdown
# Batch summary (12 leads)

| Email | Tier | Score | Escalate |
|---|---|---|---|
| jane.doe@northwind.com | B | 7.4 | no |
| ahmed@tailspintoys.io | A | 8.9 | no |
| j.smith@gmail.com | disqualified | 0 | hard_disqualifier:free_email |
| ... | ... | ... | ... |

---

# Lead score — jane.doe@northwind.com (northwind.com)
...
---
# Lead score — ahmed@tailspintoys.io (tailspintoys.io)
...
```

## Field contract for parsers

If you write a parser instead of consuming the markdown, these are the stable fields:

- `email` — string, lowercased
- `domain` — string, lowercased
- `score` — float, 0.0 to 10.0, one decimal
- `tier` — enum: `A` / `B` / `C` / `disqualified`
- `source` — pass-through of the input `source_of_lead`, or `unknown`
- `escalate` — enum: `no` / `needs_human_review` / `insufficient_data` / `hard_disqualifier:{reason}`
- `next_action` — string, single sentence
- `rationale[]` — list of `{criterion, weight, tier, reason}`
- `data_gaps[]` — list of strings (field names)
- `rubric_sha256` — string, 8-character prefix in the markdown footer; full hash available via the skill's structured-output mode
