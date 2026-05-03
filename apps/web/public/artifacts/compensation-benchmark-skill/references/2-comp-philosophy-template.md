# Compensation philosophy file template

The compensation-benchmark skill calibrates survey data against the firm's compensation philosophy. This file is the philosophy. Copy the JSON below to `philosophy.json` (or wherever your skill config points), fill it in, and version it in git.

The philosophy is rarely revised — usually annually at most, often less. When it changes, every benchmark recommendation post-change uses the new philosophy. The skill captures the philosophy version in the audit record so future audits can reproduce the recommendation.

## JSON shape

```json
{
  "philosophy_version": "2026.1",
  "effective_from": "2026-01-10",
  "approver": "Comp Committee minutes 2026-01-08",
  "target_percentiles": {
    "engineering": {
      "base": 60,
      "equity": 75,
      "bonus_or_ote": 50
    },
    "sales": {
      "base": 50,
      "equity": 50,
      "bonus_or_ote": 75
    },
    "go_to_market_other": {
      "base": 60,
      "equity": 60,
      "bonus_or_ote": 60
    },
    "g_and_a": {
      "base": 60,
      "equity": 50,
      "bonus_or_ote": 50
    }
  },
  "band_widths_pct": {
    "default": 10,
    "by_level": {
      "junior": 8,
      "senior": 12,
      "staff": 15,
      "principal": 18,
      "executive": 25
    }
  },
  "level_mapping": {
    "firm_to_radford": {
      "L3": "P3",
      "L4": "P4",
      "L5": "P4",
      "L6": "P5",
      "L7": "P6",
      "L8": "P7"
    },
    "firm_to_pave": {
      "L3": "Mid IC",
      "L4": "Senior IC",
      "L5": "Senior IC",
      "L6": "Staff IC",
      "L7": "Principal IC",
      "L8": "Senior Principal IC"
    }
  },
  "geography_adjustments": {
    "remote_us": 0,
    "remote_intl": -15,
    "san_francisco_msa": 0,
    "new_york_msa": 0,
    "seattle_msa": -3,
    "austin_msa": -10,
    "london": -8,
    "toronto": -12,
    "remote_latam": -35
  },
  "current_strike_price_usd": 5.20,
  "vesting_period_years": 4,
  "equity_grant_type": "RSU",
  "exception_band": {
    "max_above_top": 15,
    "approval_required": "comp_committee"
  },
  "public_range_policy": {
    "minimum_band_width_pct": 15,
    "include_equity_target_dollar": true,
    "include_bonus_target_dollar": true
  },
  "pay_equity_audit_cadence_months": 12,
  "last_pay_equity_audit": "2026-02-15"
}
```

## Field-by-field

### `philosophy_version`, `effective_from`, `approver`

Versioning. The skill captures `philosophy_version` in the audit record so the recommendation is reproducible against a specific version of this file. `effective_from` is the date the philosophy applies to NEW recommendations — recommendations made before that date used the prior philosophy. `approver` cites the approval source (Comp Committee minutes, board resolution, etc.).

### `target_percentiles`

Per function family, the target percentile per component. The most common patterns:

- **Engineering**: 60th base, 75th equity (founder-friendly equity to attract IC talent), 50th bonus.
- **Sales**: 50th base, 50th equity, 75th OTE (the variable comp is the lever).
- **G&A**: 60th base across components (predictable, market-rate).

If the firm's strategy is "we pay top of market across the board," set everything to 75th. If the firm's strategy is "we pay base at market and over-index on equity," set base to 50th and equity to 75th-90th.

### `band_widths_pct`

The recommended band width as a percentage of the midpoint. Default 10% (recommended midpoint ±10%). Per-level overrides absorb the wider individual variance at senior levels.

If a single number is too rigid, the skill respects the per-level overrides.

### `level_mapping`

Mapping from the firm's internal ladder to each survey's ladder. The skill cannot infer this — it has to be specified per survey the firm uses. If a level mapping is missing, the skill halts and asks the user to add it.

This is the single most-edited part of the philosophy; it's also the most consequential, because the wrong mapping shifts every recommendation by a percentile-band.

### `geography_adjustments`

Per-geography multiplier. `0` means use the survey's value for that geography directly. `-15` means apply a 15% reduction (e.g. for `remote_intl`). The adjustments must be defensible — random adjustments here are how pay-equity gaps creep in.

If the firm has a published location-based pay policy, this section should match it line-for-line.

### `current_strike_price_usd`, `vesting_period_years`, `equity_grant_type`

Used for converting annualized survey equity values to grant size. Strike price is the most-recent 409A or option-grant strike. Vesting is typically 4 years. Grant type matters for tax framing but not for the band math.

### `exception_band`

When the skill is asked about a band-exception ("can we offer above the top?"), the philosophy says how high (`max_above_top: 15` means up to 15% above the top of the recommended band) and who approves. The skill itself does NOT approve exceptions; it surfaces the policy.

### `public_range_policy`

Compliance posture for NYC LL 32-A, CO/CA/WA pay-transparency requirements. `minimum_band_width_pct: 15` is the firm's "good faith" floor — the skill warns if a recommended band falls below this width.

### `pay_equity_audit_cadence_months`, `last_pay_equity_audit`

For the audit-record metadata. The skill notes the cadence and last audit so the recommendation can be flagged if the firm is overdue for an equity audit.

## When to revise the philosophy

- **Strategy shift** — the firm decides to over-index on equity vs. cash. Update target percentiles.
- **New geography** — opening a new region. Add to `geography_adjustments` based on local market data.
- **New survey added** — add a level mapping for the new survey.
- **Pay-equity audit findings** — if the audit surfaces gaps, the philosophy may need revision (band widths, geography adjustments).

Each revision bumps `philosophy_version`. Old audit records remain interpretable against their respective version.

## What the philosophy is NOT

- It is NOT a candidate-by-candidate negotiation guide.
- It is NOT a one-time setup; it evolves with the firm.
- It is NOT confidential to the recruiter — the philosophy should be visible to every hiring manager, ideally documented internally for transparency.
