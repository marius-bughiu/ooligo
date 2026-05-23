---
name: abm-list-quality-audit
description: Audit an ABM target list against an explicit ICP rubric and return a defect report for every account that fails. Produces a per-account defect taxonomy (wrong-size, wrong-industry, wrong-geo, stale-data, low-intent, missing-field), a list-level quality score, and a prioritized remediation queue. Use before any ABM campaign goes live — not as a substitute for ICP strategy work.
---

# ABM list quality audit

## When to invoke

Invoke before launching any ABM campaign, before loading a list into a paid-media ABM platform, or before assigning named accounts to AEs. The skill takes a structured account list and your ICP rubric and returns a per-account defect report plus a list-level quality score.

The skill is also useful for quarterly list hygiene: run it over your existing ABM universe to find accounts that were added months ago and no longer match the current ICP, or accounts where enrichment has gone stale.

Invoke from:

- A **Clay table** where each row is an account, triggered manually or on a quarterly schedule. The skill writes defect codes and a quality tier back to two columns.
- A **CSV pre-flight check** before import into 6sense, Demandbase, or any ABM advertising platform that charges per account or per impression — running the audit first removes accounts you would pay to target and never convert.
- A **Salesforce report-based trigger** over named accounts in a specified segment, via a custom-code action that calls the skill and writes `ABM_Quality_Tier__c` and `ABM_Defect_Codes__c` back to the account record.

Do NOT invoke this skill for:

- **Scoring individual inbound leads.** The audit is designed for outbound named-account lists, not for triage of inbound MQLs. For inbound scoring, use the lead-scoring-icp-rubric skill.
- **Replacing the ICP strategy session.** The skill audits against a rubric you provide. If the rubric is a proxy for last year's customers, the audit will reproduce last year's biases. Have the ICP argument with your RevOps and GTM leadership before running the audit.
- **Generating net-new accounts.** The skill audits an existing list. It does not generate new accounts or run discovery on the TAM. Use a dedicated list-building workflow (Clay + ICP criteria) to generate the raw list first.
- **Suppression list management.** If the goal is to remove churned customers, competitors, or current customers from the list, that is deduplication, not auditing. Run those exclusion checks before invoking the skill.

## Inputs

Required:

- `account_list` — a structured list of account records. Minimum fields per account: `company_name`, `company_domain`. Strongly preferred: `industry`, `headcount`, `country`, `revenue_band`, `tech_stack` (array), `funding_stage`, `last_enrichment_date`.
- `rubric` — path to or inline contents of the ICP rubric markdown (see `references/1-icp-rubric-template.md`). Must contain explicit criterion + weight + tier-value rows. If the rubric has no weights, the skill refuses to run.

Optional:

- `intent_scores` — a map of `company_domain → intent_score` from 6sense, Bombora, or your ABM platform. When provided, the skill adds a `low-intent` defect code for accounts below your defined intent floor, and an `intent-spike` positive flag for accounts above your hot-intent threshold.
- `enrichment_staleness_days` — integer, default 90. Accounts where `last_enrichment_date` is older than this value receive a `stale-data` defect code. Adjust to match how aggressively your enrichment layer (Clay, ZoomInfo, Apollo) recycles data.
- `list_name` — string. Used to label the audit report. If omitted, defaults to `"Unnamed list — {run_date}"`.

## Reference files

Always load these before running the audit:

- `references/1-icp-rubric-template.md` — the ICP rubric. Same structure as the lead-scoring skill's rubric; shared between the two skills if your team uses both. Weights and tier values must be explicit.
- `references/2-defect-taxonomy.md` — the full defect code vocabulary with definitions, severity levels (P1 / P2 / P3), and the remediation action for each code. Edit this once with your RevOps lead before first use; the codes in the audit output are only as useful as the definitions in this file.
- `references/3-sample-audit-output.md` — a literal example of the full audit report for a 5-account list. Use when wiring downstream parsers or building the CRM writeback.

## Method

The skill runs four steps in order.

### 1. Hard disqualifier sweep (no LLM)

Before any LLM call, check each account against the rubric's hard disqualifiers: sanctioned country, disqualified industry, headcount below floor. Accounts that hit a hard disqualifier receive defect code `hd:{reason}` (e.g. `hd:sanctioned_country`) and a quality tier of `disqualified`. These are deterministic and cheap; they run first so the LLM does not burn tokens on them.

Why deterministic first: same reason as lead scoring — speed and reliability. A hard disqualifier check on 500 accounts takes milliseconds and never hallucinates.

### 2. Per-account ICP rubric scoring

For each account that cleared the hard disqualifier sweep, score against the ICP rubric using the same per-criterion method as the lead-scoring skill (explicit tier + weight + rationale per criterion). The weighted sum maps to a quality tier:

- **Q1** — score ≥ 8.0: in-ICP, meets criteria. No defect codes from rubric scoring.
- **Q2** — score 6.0-7.99: in-ICP with gaps. Defect codes name the specific failing criteria.
- **Q3** — score 4.0-5.99: borderline. Multiple defect codes; recommend enrichment and re-audit before including.
- **Q4** — score < 4.0: out-of-ICP. Recommend removal from the active list; flag for archive.

Why explicit tier thresholds rather than "let the model decide": same reason as lead scoring — the rubric is the source of truth, and the model's job is to apply it, not to re-weight it.

### 3. Supplemental defect detection

After rubric scoring, run supplemental checks that are not covered by the rubric criteria:

- **`stale-data`**: `last_enrichment_date` is older than `enrichment_staleness_days`. The account's rubric score is suspect because the underlying data may be wrong.
- **`missing-field`**: one or more rubric criteria could not be scored because the field was missing from the account record. List the missing field names.
- **`low-intent`**: `intent_scores[domain]` is below the floor defined in the rubric or passed as input. Applied on top of rubric score — a Q1 account with low intent is still in-ICP but is not hot right now.
- **`intent-spike`**: `intent_scores[domain]` is above the hot-intent threshold. A positive flag, not a defect; surfaced to help prioritize outreach even if the rubric score is only Q2.

### 4. List-level quality report and remediation queue

After per-account scoring, aggregate:

- **List quality score**: Q1% + Q2% - Q3% - 2×Q4%. This is a synthetic score intended to give a single number for "how good is this list" at a glance. A score above 60 means the list is predominantly in-ICP; below 30 means the list needs significant remediation before use.
- **Defect frequency table**: counts of each defect code across the list. The most common defect code tells you the single most valuable enrichment or segmentation fix.
- **Remediation queue**: the Q2 and Q3 accounts with `missing-field` or `stale-data` codes, ordered by estimated re-audit lift (accounts most likely to become Q1 after re-enrichment). This is the queue to hand to whoever owns enrichment.

Why a list-level score: individual account scores are useful for routing; the list-level score is useful for the ABM campaign go/no-go decision. If the list score is below 30, the campaign should not launch — the target list is too weak to justify the ABM platform spend.

## Output format

Literal markdown the skill emits for a 5-account list:

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
| stale-data | 2 | Re-run enrichment on accounts with last_enrichment_date > 90 days |
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
_Rubric SHA-256: 4f9c...a812 | Last edited 2026-05-01 by RevOps_
```

## Watch-outs

- **Defect codes that indict the rubric, not the account.** If 40% of the list has `wrong-size` codes, the problem is often not the list — it is a headcount floor in the rubric that was set when the company was targeting larger enterprises and was never updated after the SMB segment was opened. **Guard:** after every audit, check whether any single defect code applies to more than 25% of accounts. If so, review the rubric criterion that generates that code before remediating the list. The list might be right and the rubric wrong.
- **Stale enrichment masking real ICP fit.** An account's `last_enrichment_date` of 14 months ago means its headcount, funding stage, and tech stack data may all be wrong. A Q4 score on stale data is not a verdict on the account — it is a verdict on your enrichment cadence. **Guard:** the skill adds `stale-data` to any account where enrichment is older than the `enrichment_staleness_days` threshold, and the per-account rationale notes "scored on potentially stale data" for any such account. Do not remove Q4 + `stale-data` accounts; re-enrich them first and re-audit.
- **Intent score inflation from brand-aware accounts.** An account in a 6sense high-intent segment may be there because of one analyst at the company who reads your blog weekly — not because the buying committee is in-market. **Guard:** when `intent_scores` are provided, the skill shows the raw intent score alongside the `intent-spike` flag and names the intent source. Before acting on an `intent-spike` account, verify the intent signal is from buying-committee personas, not from a single low-authority user.
