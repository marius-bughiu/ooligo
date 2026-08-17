# Coverage report

The run's primary deliverable. It opens with what the corpus could not support, because those rows need a human decision and the derived positions do not.

Replace the bracketed values. Keep the section order — it is the order a reviewer should read them in.

---

## Header

- **Agreement type:** `[msa]`
- **Corpus:** `[N]` agreements, executed `[earliest]` to `[latest]`
- **Own paper / counterparty / hybrid:** `[a]` / `[b]` / `[c]`
- **Redline history supplied:** `[yes | no]` — `[k]` of `[N]` agreements
- **Excluded by hand:** `[j]` agreements (see manifest Part D)
- **Run date:** `[YYYY-MM-DD]`

## 1. Not inferable — decide these

One row per clause. Every clause appears here, because `walk_away` is never derived from executed agreements. `worst_signed` is the bound the corpus does supply: you did not walk at that term.

| Clause | `worst_signed` | Agreement | Executed | Walk-away owner | Decided? |
|---|---|---|---|---|---|
| `limitation_of_liability` | `[uncapped_for_ip_indemnity]` | `[MSA-2025-0184]` | `[2025-11-03]` | `[name]` | `[ ]` |
| *(one row per clause)* | | | | | |

## 2. Contradictions — asserted walk-away already crossed

Populated only when `proposed_walk_away` was supplied. Each row is a red line that appears in a signed agreement in your own file. A counterparty holding that agreement can produce it.

| Clause | Asserted walk-away | Contradicting term | Agreement | Executed |
|---|---|---|---|---|
| `[limitation_of_liability]` | `[12mo_fees, hard floor]` | `[uncapped_for_ip_indemnity]` | `[MSA-2025-0184]` | `[2025-11-03]` |
| *(add rows, or state "none")* | | | | |

## 3. Insufficient evidence — sample too small to call

These clauses have a modal value and not enough instances to defend it. `n_required` is what the cell needs to clear a 95% lower bound of 0.60 at the observed proportion.

| Clause | Cell | `n` | Modal value | Proportion | Wilson 95% lower | `n_required` |
|---|---|---|---|---|---|---|
| `[audit_rights]` | `[own / mid_market]` | `[9]` | `[annual]` | `[0.78]` | `[0.45]` | `[24]` |
| *(add rows)* | | | | | | |

## 4. Suppressed — segments disagree

Cells where the position differs materially by counterparty tier or deal-value band, so no blended position is reported. This is usually bargaining position showing up as if it were preference.

| Clause | Segment A | Segment B | Suppressed blend |
|---|---|---|---|
| `[limitation_of_liability]` | `[mid_market: 12mo_fees, n=25]` | `[enterprise: 24mo_fees, n=11]` | `[yes]` |
| *(add rows)* | | | |

## 5. Drift — position moved

Trailing window against everything older. Reported as two positions, never averaged.

| Clause | Trailing `[24]`mo | Older | Divergent |
|---|---|---|---|
| `[payment_terms]` | `[45 days, n=19]` | `[30 days, n=22]` | `[yes]` |
| *(add rows)* | | | |

## 6. Fallback ladders absent, and why

| Clause | Reason |
|---|---|
| `[limitation_of_liability]` | `[redline_dir_not_supplied]` |
| `[payment_terms]` | `[distribution_unimodal]` |
| *(add rows)* | |

## 7. Derived positions

Everything that cleared. This section is last on purpose — it is the part that needs the least review.

| Clause | Cell | `n` | Standard position | Wilson 95% lower | Observed range |
|---|---|---|---|---|---|
| `[limitation_of_liability]` | `[own / msa / mid_market]` | `[31]` | `[12mo_fees]` | `[0.634]` | `[12mo (25), 24mo (4), uncapped-IP (2)]` |
| *(add rows)* | | | | | |

## 8. Next run

- Manifest rows added since last run: `[n]`
- Clauses that moved from `insufficient-evidence` to `standard`: `[list]`
- Clauses still short of `n_required`: `[list]`
- Owner and date for the next pass: `[name]`, `[YYYY-MM-DD]`
