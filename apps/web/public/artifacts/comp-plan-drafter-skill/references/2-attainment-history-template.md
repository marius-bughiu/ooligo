# Attainment history

One row per rep-year for the trailing plan year. This file is the cost model. Everything the stress test reports comes from replaying these rows through the drafted curve, so the quality of this file sets the quality of the output.

## The one rule that matters

```yaml
include_terminated: true
```

Include the reps who left. All of them, with their partial-year attainment and their prorated quota.

This is not a completeness preference. Attrition in a sales org is not random with respect to attainment — low attainers leave, and they leave disproportionately. A history containing only the people still on the roster understates what the plan will cost and overstates how healthy the distribution is, in the same direction, at the same time. The skill returns `blocked` when this flag is `false`, because a plan priced on survivors is priced on the wrong population.

## Rows

```csv
rep_id,segment,months_ramped,prorated_quota,attainment_pct,terminated_on,notes
r-001,mid-market,12,850000,141,,
r-002,mid-market,12,850000,118,,
r-003,mid-market,12,850000,104,,
r-004,mid-market,12,850000,97,,
r-005,mid-market,12,850000,88,,
r-006,mid-market,12,850000,74,,
r-007,mid-market,12,850000,61,,
r-008,mid-market,12,850000,58,,
r-009,mid-market,12,850000,44,,
r-010,mid-market,12,850000,31,,
r-011,mid-market,7,495833,38,2026-07-31,involuntary
r-012,mid-market,5,354167,22,2026-05-29,involuntary
r-013,mid-market,9,637500,96,2026-09-30,voluntary — competitor offer
```

| Column | What goes in it |
|---|---|
| `rep_id` | Any stable identifier. Do not use names; the output is circulated. |
| `segment` | Must match a segment in the plan inputs, or the row is excluded and counted in the data-quality report. |
| `months_ramped` | Months at full productivity during the year. A rep in month three of a six-month ramp contributes a partial rep-year and is excluded from the fully-ramped count. |
| `prorated_quota` | The quota actually carried, prorated for partial years. Not the annual number. |
| `attainment_pct` | Attainment against `prorated_quota`, as a whole number. `141` means 141%. |
| `terminated_on` | ISO date, blank if still employed. |
| `notes` | Free text. `voluntary` / `involuntary` is worth recording — it is the only signal in this file about whether the plan drove the exit. |

## What counts toward `min_history_reps`

Only fully-ramped rep-years — rows where `months_ramped` equals 12, or where a terminated rep was fully ramped for the months they worked. Ramping reps are still worth including for the cost model, because they cost money, but they do not make the distribution more trustworthy and the skill does not count them toward the floor.

Below the floor, the correct output is `blocked`. Thirteen rows is a distribution you can argue about; six is an anecdote with a percentile function applied to it.

## Optional: prior-plan curve

Supply the curve these attainments were paid under and the report adds a year-over-year comparison — what the same rep-years would have cost under the old plan against the new one. This is the single most persuasive number in a comp review, and it is unavailable without this block.

```yaml
prior_curve:
  threshold_pct: 60
  target_rate: 1.0
  accelerators:
    - from_pct: 100
      to_pct: null
      rate: 1.4
  cap: none
```

## Data-quality report

Run the skill with `dry_run: true` before drafting anything. It returns the observed distribution, the fully-ramped count, and a list of rows it had to exclude with the reason for each. A history file usually has two or three rows with a quota of zero or an attainment above 400% from a single outsized deal, and you want to see those before they are inside a cost number rather than after.
