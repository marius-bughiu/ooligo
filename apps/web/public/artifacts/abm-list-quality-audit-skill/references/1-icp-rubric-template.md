# ICP rubric — TEMPLATE (ABM audit)

> Replace this template's contents with your team's actual ICP rubric.
> The ABM list audit skill scores each account against this rubric.
> Vague rows (no weights, no tier values) cause the skill to refuse the run.
>
> This file can be shared with the lead-scoring-icp-rubric skill — the
> rubric structure is identical. If your team uses both skills, maintain
> one rubric file and reference it from both.

## How the skill reads this file

- Each row in "Criteria" must have an explicit `weight` (1-5) and three tier values
  (A / B / C). Malformed rows cause the skill to return an error.
- "Hard disqualifiers" run as deterministic checks before any LLM call. A single
  hit drops the account to `disqualified` regardless of other criteria.
- "Intent thresholds" are optional — only used when `intent_scores` is passed
  as input. Set these to match your ABM platform's scoring bands.
- The "Last edited" line is hashed into the SHA-256 recorded in the audit footer.

## Criteria

| Criterion | Weight | A (best fit) | B (stretch) | C (poor fit) |
|---|---|---|---|---|
| Industry | 5 | {industries you win in, e.g. Vertical SaaS, FinTech} | {adjacent industries} | {everything else} |
| Headcount | 4 | {core range, e.g. 200-2000} | {stretch range, e.g. 50-200 or 2000-5000} | {below/above stretch} |
| Geo | 3 | {primary regions, e.g. US, UK, DACH} | {secondary regions} | {unsupported regions} |
| Tech stack | 4 | {signals of fit, e.g. Salesforce + HubSpot present} | {one fit signal present} | {no fit signals or competing system} |
| Funding stage | 2 | {preferred stages, e.g. Series B-D, public mid-cap} | {adjacent stages} | {unfit, e.g. pre-seed or mature enterprise} |
| Revenue band | 3 | {ARR or revenue band that matches your ACV, e.g. $10M-$100M ARR} | {adjacent band} | {below minimum or above ceiling} |

## Hard disqualifiers

Single signals that drop an account to `disqualified` regardless of other criteria.
Run as deterministic checks before LLM scoring.

- `country in [{sanctioned or unsupported regions}]`
- `industry in [{disqualified industries — e.g. adult content, gambling if you do not serve them}]`
- `headcount < {absolute floor, e.g. 25}` (if you have one)
- `company_domain in [{explicit exclusion list — competitors, current customers, churned accounts}]`

## Intent thresholds (optional — only used when intent_scores provided)

Used to assign `low-intent` or `intent-spike` flags on top of the rubric score.

| 6sense / Bombora intent score | Flag applied |
|---|---|
| ≥ {hot threshold, e.g. 75} | `intent-spike` |
| {floor, e.g. 35} — {hot threshold - 1} | no flag (normal) |
| < {floor, e.g. 35} | `low-intent` |

## Quality tier thresholds

| Weighted score | Quality tier |
|---|---|
| 8.0 - 10.0 | Q1 (in-ICP, no rubric defects) |
| 6.0 - 7.99 | Q2 (in-ICP with gaps) |
| 4.0 - 5.99 | Q3 (borderline — remediate before use) |
| < 4.0 | Q4 (out-of-ICP — recommend removal) |

## Last edited

{YYYY-MM-DD} — by {RevOps owner name}
