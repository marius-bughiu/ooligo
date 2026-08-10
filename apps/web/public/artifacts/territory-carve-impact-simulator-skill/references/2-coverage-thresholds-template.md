# Coverage and capacity thresholds template

This file is the org's definition of "too far." The simulator computes numbers regardless; these values decide which numbers become a `revise` verdict. Every value below ships populated with a defensible starting point — replace them with yours rather than accepting them, because a threshold nobody argued about is a threshold nobody enforces.

## Capacity model

```yaml
capacity:
  productivity_bands:          # annual new-business capacity per fully ramped rep, in ARR
    high: 1600000
    mid: 1100000
    low: 700000
    unproven: 900000           # deliberately mid-minus, not mid
  shortfall_tolerance_pct: 10  # a territory may be under capacity by this much before flagging
```

Set `productivity_bands` from your own last-four-quarters attainment distribution, not from a benchmark report. The right way to derive them: take trailing-12-month closed-won new business per fully ramped rep in the segment, sort it, and use the 75th percentile for `high`, the median for `mid`, and the 25th percentile for `low`.

`unproven` sits below `mid` on purpose. A new hire's expected capacity is not the team median — the median is computed over people who survived their ramp.

## Ramp curve

The fraction of full productivity a rep carries in each month after their quota-carrying start date. The simulator applies the factor for the month the effective date falls in, then straight-lines the remainder of the fiscal period.

```yaml
ramp:
  curve:                       # month after start_date : productivity factor
    1: 0.00
    2: 0.05
    3: 0.15
    4: 0.30
    5: 0.45
    6: 0.60
    7: 0.75
    8: 0.85
    9: 0.95
    10: 1.00
  ramp_tolerance_months: 2     # dry_run warns if observed ramp exceeds the curve by more than this
```

The curve above is a 10-month enterprise ramp. A transactional mid-market motion typically reaches 1.00 in four to six months; a multi-year enterprise cycle can run past twelve. Use `dry_run` to backtest the curve against your last new-hire cohort before trusting it — the gap between the curve finance approved and the one the cohort actually produced is usually the largest single error in a capacity model.

## Disruption tolerances

```yaml
disruption:
  material_stage: "Stage 3 - Validation"   # opportunities at or past this stage count as material
  material_deal_floor: 250000              # open amount above which a single moving deal is flagged
  max_revenue_churn_pct: 25                # per territory, share of prior-year closed-won changing owner
  tenure_weight_months: 24                 # relationships older than this get the full tenure multiplier
```

`max_revenue_churn_pct` is the one to argue about. At 25%, a quarter of a territory's revenue relationships change hands before anyone objects. Teams with a high-touch enterprise motion often set this to 10-15%; teams doing volume mid-market can live at 40% because the relationship is with the product, not the rep.

## Protected accounts

Accounts that must not change owner without an explicit decision. These are surfaced by name in the churn report regardless of where they rank on weighted disruption.

```yaml
protected_accounts:
  - account_id: 0013000000ABCDE
    name: Northwind Traders
    reason: renewal in Q1, single-threaded on current owner
  - account_id: 0013000000FGHIJ
    name: Contoso Fabrics
    reason: active executive escalation
```

Keep this list short and dated. A protected list that grows every cycle and never shrinks stops being a signal and starts being a veto — review it at the start of each carve and drop entries whose reason has expired.

## Data quality floors

```yaml
data_quality:
  history_coverage_floor_pct: 60   # share of accounts with at least one OwnerId row in AccountHistory
  snapshot_staleness_days: 14      # re-run required if the carve ships later than this
```

`history_coverage_floor_pct` guards the churn baseline. Below this, `AccountHistory` is not reliably capturing ownership changes and tenure figures will read low across the board — which makes every carve look cheap. The simulator returns `blocked` rather than reporting a number it cannot support.

## Review date

```yaml
last_reviewed: 2026-08-10
```

The simulator prepends a warning to every report when this date is more than 180 days old. Thresholds drift as segments and headcount change, and a stale thresholds file produces confident verdicts against a model of a company that no longer exists.
