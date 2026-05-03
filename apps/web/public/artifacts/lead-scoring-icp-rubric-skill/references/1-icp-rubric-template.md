# ICP rubric — TEMPLATE

> Replace this template's contents with your team's actual ICP rubric.
> The lead-scoring skill scores each criterion against this rubric. Vague
> rows (no weights, no tier values) cause the skill to refuse the run.

## How the skill reads this file

- Each row in "Criteria" must have an explicit `weight` (1-5) and three tier values (A / B / C). Anything else is treated as malformed and the skill returns an error rather than guessing.
- Rows in "Hard disqualifiers" run as deterministic checks before any LLM call. Keep them tight; one wrong row here silently kills good pipeline.
- The "Last edited" line is hashed into the SHA-256 the skill records in every output footer. Update it when you make material changes so SDRs reading scores can see the rubric moved.

## Criteria

| Criterion | Weight | A (best fit) | B (stretch) | C (poor fit) |
|---|---|---|---|---|
| Industry | 5 | {industries you win in} | {adjacent industries} | {everything else} |
| Headcount | 4 | {core range, e.g. 500-2000} | {stretch range, e.g. 200-500 or 2000-5000} | {below/above stretch} |
| Geo | 3 | {primary regions} | {secondary regions} | {regions you do not support} |
| Tech stack | 4 | {tools that signal fit, e.g. Salesforce + Marketo} | {one of the fit tools present} | {competing system of record} |
| Funding stage | 2 | {preferred stages, e.g. Series B-D} | {adjacent stages} | {unfit, e.g. pre-seed or post-IPO} |
| Job title | 4 | {champion-target patterns} | {adjacent titles} | {non-buying-committee titles} |

## Hard disqualifiers

Single signals that drop a lead to `disqualified` regardless of other criteria. Run as deterministic checks before LLM scoring.

- `country in [{sanctioned-or-unsupported-list}]`
- `industry in [{disqualified-industries — e.g. adult, gambling if you do not serve them}]`
- `headcount < {floor — e.g. 10}` (if you have a floor)
- `email_domain in [{free-mail providers if your motion blocks them}]`

## Tier thresholds

The skill maps the weighted sum to a tier. Defaults shown — adjust to your team's calibration run.

| Score | Tier |
|---|---|
| 8.0 - 10.0 | A |
| 6.0 - 7.99 | B |
| 4.0 - 5.99 | C |
| < 4.0 | disqualified |

## Last edited

{YYYY-MM-DD} — by {name}
