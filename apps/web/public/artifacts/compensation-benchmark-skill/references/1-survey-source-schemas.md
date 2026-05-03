# Survey source schemas

The compensation-benchmark skill reads survey exports in one of three supported formats: Radford, Pave, Carta. A custom CSV schema is also supported for in-house surveys or for sources not on this list.

## Radford

Radford ships exports as CSV or XLSX. The skill reads the CSV form (re-export from XLSX if needed).

### Required columns

| Column | Type | Notes |
|---|---|---|
| `level_radford` | string | Radford ladder code (e.g. `P4`). The philosophy file maps this to firm levels. |
| `function_radford` | string | Radford function code (e.g. `Software Engineering`). |
| `geography_radford` | string | Radford geography (e.g. `San Francisco MSA`). |
| `sample_size` | integer | Number of survey respondents in this cell. Skill requires ≥5. |
| `base_salary_p25` | number | 25th percentile base salary, USD. |
| `base_salary_p50` | number | 50th percentile. |
| `base_salary_p60` | number | 60th percentile. |
| `base_salary_p75` | number | 75th percentile. |
| `base_salary_p90` | number | 90th percentile. |
| `equity_annual_p25` | number | 25th percentile annualized equity value, USD. |
| `equity_annual_p50` | number | ... |
| `equity_annual_p60` | number | ... |
| `equity_annual_p75` | number | ... |
| `equity_annual_p90` | number | ... |
| `bonus_target_p50` | number | Target annual cash bonus, USD. (Radford reports target, not actual.) |

### Notes

- Radford's `level` codes (P1-P8 for IC, M1-M5 for management) need a firm-level mapping in the philosophy file. The mapping lives once, used everywhere.
- Geography taxonomy: Radford uses MSAs (e.g. `San Francisco MSA`, `New York MSA`) plus international country/city combos. The skill matches by exact string; "Bay Area" does not match `San Francisco MSA`.
- Sample size <5 → low-N flag. Radford itself suppresses cells below 3.

## Pave

Pave exports as CSV via the API or via UI download.

### Required columns

| Column | Type | Notes |
|---|---|---|
| `level_pave` | string | Pave's level normalization (e.g. `Senior IC`). |
| `function_pave` | string | Pave's function (e.g. `Engineering - Software`). |
| `location` | string | Pave's location string. |
| `n_employees` | integer | Number of employees in the cell. |
| `base_p25`, `base_p50`, `base_p75`, `base_p90` | number | Base salary percentiles. (Pave does not publish p60.) |
| `equity_p25`, `equity_p50`, `equity_p75`, `equity_p90` | number | Annualized equity in USD. |
| `total_comp_p50`, `total_comp_p75` | number | Total comp percentiles, useful for OTE calibration. |

### Notes

- Pave uses its own level normalization across firms; mapping to firm levels lives in the philosophy file.
- Pave's coverage is strongest for tech in the US and EU; APAC and emerging-market data is thinner.
- Sample size <10 → low-N flag (Pave's own threshold).
- `total_comp_p50` includes base + bonus + equity at the median. Useful for the public-range sanity check.

## Carta

Carta's compensation product exports in two flavors: cash-comp report (similar to Pave) and equity-comp report (cap-table-aware).

### Required columns (cash report)

| Column | Type | Notes |
|---|---|---|
| `role` | string | Carta's normalized role label. |
| `seniority` | string | `Junior`, `Mid`, `Senior`, `Staff`, `Principal`. |
| `location` | string | Carta's location string. |
| `n_companies`, `n_employees` | integer | Cell sample sizes (both required). |
| `base_p50`, `base_p75` | number | Base salary percentiles. |
| `total_cash_p50`, `total_cash_p75` | number | Base + bonus. |

### Required columns (equity report)

| Column | Type | Notes |
|---|---|---|
| `role` | string | Same as cash report. |
| `seniority` | string | Same. |
| `location` | string | Same. |
| `company_stage` | string | `Seed`, `Series A`, `Series B`, etc. |
| `equity_pct_p25`, `equity_pct_p50`, `equity_pct_p75`, `equity_pct_p90` | number | Equity as percentage of fully diluted shares outstanding. |

### Notes

- Carta's coverage is strongest for early-stage US startups. For mid-stage and public-company benchmarking, Radford or Pave are stronger.
- Equity reported as `equity_pct_p*` (percent of company), not dollar value. The skill converts using the firm's most recent valuation.
- Sample sizes <15 for equity → low-N flag (equity is more variance-heavy than cash).

## Custom CSV

For in-house surveys or sources not on the list above. The skill reads any CSV with the following minimum columns:

| Column | Type | Required | Notes |
|---|---|---|---|
| `level` | string | yes | Whatever ladder; must map to firm ladder via philosophy file. |
| `function` | string | yes | Whatever taxonomy; must match role definition. |
| `geography` | string | yes | Free-text or coded; must match exactly. |
| `sample_size` | integer | yes | Used for low-N flag. |
| `base_p50` | number | yes | Median base salary, USD. |
| `base_p25`, `base_p75`, `base_p90` | number | recommended | More percentiles enable wider band-targeting options. |
| `equity_value_p50` | number | for equity-bearing roles | Annualized equity value, USD. |
| `bonus_p50` or `ote_p50` | number | for sales / variable-comp roles | Target. |
| `min_sample_size` | integer | yes | The threshold below which the skill flags low-N. Set per-survey based on the survey methodology. |

### Notes

- Custom CSVs are useful for mid-cycle re-benchmarks against a peer cohort (your own team's data plus a few comparable firms) or for in-house comp-committee internal reviews.
- The `min_sample_size` field is critical — without it the skill cannot calibrate the low-N threshold and falls back to a conservative default (15).

## Adding a new survey source

To add a new source:

1. Document the source's export schema in this file with the same shape as the entries above.
2. Update the skill's source detector to recognize the new format (filename pattern, header pattern, or both).
3. Add the source's documented sample-size threshold.
4. If the source uses a different geography or level taxonomy, document the mapping in the philosophy file.

## Refresh cadence

Survey data shifts faster than yearly. The benchmark skill warns at >6 months on the export's dated metadata; that's the floor. Quarterly refresh is the operating norm for serious comp programs.

For Radford: Q1, Q2, Q3, Q4 standard cycles.
For Pave: monthly refresh available via API.
For Carta: quarterly equity reports, monthly cash updates available.
