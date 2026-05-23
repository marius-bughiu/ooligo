# Defect taxonomy — TEMPLATE

> This file defines every defect code the ABM list audit skill can assign.
> Edit the "Remediation action" column to match your team's actual processes
> before first use. The codes themselves are fixed — do not rename them;
> downstream parsers (CRM writeback, Clay columns) key on the code strings.

## How the skill reads this file

- Each defect code has a `severity` (P1 / P2 / P3). P1 defects are show-stoppers
  that mean the account should be removed or quarantined from the campaign until
  fixed. P2 defects are remediable. P3 defects are informational — the account
  can proceed, but the ABM or AE team should be aware.
- The skill emits defect codes in the per-account row and the defect-frequency
  table. It does not emit the full definition — that lives here for the human
  reviewer.

## Defect codes

### Rubric-sourced defects (from ICP scoring)

| Code | Severity | Definition | Remediation action |
|---|---|---|---|
| `wrong-industry` | P1 | Account's industry is in the C-tier or disqualified row of the rubric. | Remove from active list. Archive with `out-of-icp` tag. |
| `wrong-size:too-small` | P1 | Headcount is below the rubric's B-tier floor. | Remove unless a specific exemption applies (e.g. fast-growing startup with known expansion intent). |
| `wrong-size:too-large` | P2 | Headcount exceeds the rubric's B-tier ceiling. | Flag for enterprise segment or remove from SMB/mid-market campaign. |
| `wrong-geo` | P1 | Account's HQ region is not in the rubric's supported geo tiers. | Remove from geo-targeted campaign; keep in global campaigns if you have capacity to serve. |
| `wrong-funding` | P2 | Funding stage is in the C-tier row. | Move to a different campaign segment (pre-series A nurture vs. growth-stage ABM). |
| `tech-mismatch` | P2 | Tech stack has no fit signals from the rubric's tech-stack criterion. | Re-enrich tech stack; confirm via BuiltWith or Clay. If confirmed miss, remove. |

### Supplemental defects (not from rubric scoring)

| Code | Severity | Definition | Remediation action |
|---|---|---|---|
| `stale-data` | P2 | `last_enrichment_date` is older than the `enrichment_staleness_days` threshold. Rubric score is unreliable. | Re-run enrichment on this account before acting on its quality tier. Do not remove solely because of this code. |
| `missing-field:{field}` | P2 | The named field was absent from the account record. The criterion that uses it was scored as C (worst case) by default. | Re-enrich the specific field. Re-audit after enrichment. |
| `low-intent` | P3 | Intent score from the provided `intent_scores` input is below the floor threshold. | Move to nurture or lower-frequency sequence. Do not assign to AE until intent rises. |
| `hd:{reason}` | P1 | Hard disqualifier triggered. `{reason}` is the specific rubric row that matched (e.g. `hd:sanctioned_country`, `hd:competitor`). | Remove immediately. Archive with `disqualified` tag and the `hd:{reason}` code for audit trail. |

### Positive flags (not defects — appear in the per-account row for awareness)

| Code | Definition | Action |
|---|---|---|
| `intent-spike` | Intent score is above the hot-intent threshold. Account is signaling active in-market behavior. | Prioritize for direct AE outreach regardless of rubric tier. Even a Q2 account with `intent-spike` warrants a personalized touch. |

## Severity definitions

- **P1 — Remove:** the account should not be in the active ABM list. Keeping it wastes budget and suppresses campaign performance metrics.
- **P2 — Remediate:** the account may be a valid target but needs data work or segmentation before it can be activated. Hold from campaign activation until the defect is resolved.
- **P3 — Informational:** the account can proceed, but the campaign team should calibrate expectations. No blocking action required.

## Last edited

{YYYY-MM-DD} — by {RevOps owner name}
