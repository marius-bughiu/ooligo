# Corpus manifest

One row per executed agreement. Fill this in before the first run — the skill refuses to proceed if more than 10% of the corpus lacks `paper_of_origin`, and it will not infer that field from the document. Everything the later phases can segment on comes from here.

The manifest persists between runs. The second run is a diff against this file, not a rebuild.

## Part A — how to fill each column

| Column | Values | How to decide |
|---|---|---|
| `agreement_id` | your identifier | Must match the filename stem in `corpus_dir` and, if you supply one, the folder name in `redline_dir`. |
| `filename` | relative path | Relative to `corpus_dir`. |
| `agreement_type` | `msa` / `nda` / `dpa` / `saas_subscription` / `reseller` | One type per run. If a document is a hybrid, file it under its governing form. |
| `paper_of_origin` | `own` / `counterparty` / `hybrid` | **The load-bearing column.** `own` means the negotiation started from your template. `counterparty` means theirs. `hybrid` means a materially rewritten form where neither side's template survived — use it sparingly, because hybrid rows are reported as their own cell and a large hybrid population usually means the column was filled in by guessing. |
| `counterparty_tier` | `smb` / `mid_market` / `enterprise` / `public_sector` | Use your own segmentation if you have one and record the definition in Part C. Consistency matters more than the labels. |
| `deal_value_band` | `under_50k` / `50k_250k` / `250k_1m` / `over_1m` / `unknown` | Annual contract value at execution, in USD. `unknown` is permitted and is reported as its own band rather than imputed. |
| `executed_date` | `YYYY-MM-DD` | Execution date, not effective date, and not the date the file was scanned. The drift test in Phase 7 keys on this. |
| `redline_available` | `yes` / `no` | `yes` requires a matching folder in `redline_dir`. A `yes` with no folder fails intake for that row. |
| `governing_law` | jurisdiction | Optional but recommended. A liability cap under one governing law is not always the same instrument as the same number under another. |
| `notes` | free text | Anything that would change how a reader interprets this row — a distressed renewal, a settlement-adjacent signature, an acquisition-driven novation. |

## Part B — the rows

Replace these examples. Keep the header.

```csv
agreement_id,filename,agreement_type,paper_of_origin,counterparty_tier,deal_value_band,executed_date,redline_available,governing_law,notes
MSA-2024-0031,msa/acme-msa-executed.pdf,msa,own,mid_market,50k_250k,2024-03-11,yes,Delaware,
MSA-2024-0047,msa/globex-msa-executed.pdf,msa,counterparty,enterprise,over_1m,2024-06-28,no,New York,their paper, procurement-led
MSA-2025-0184,msa/initech-msa-executed.pdf,msa,own,enterprise,250k_1m,2025-11-03,yes,Delaware,uncapped IP indemnity conceded at close
MSA-2026-0009,msa/soylent-msa-executed.pdf,msa,hybrid,mid_market,50k_250k,2026-01-22,yes,England and Wales,
```

## Part C — segmentation definitions

Write down what your tier labels mean. Two people filling this manifest with different definitions of `enterprise` produces a segment that reports a blended position for two different negotiations, and nothing downstream can detect it.

- `smb` — replace with your definition (headcount, ACV, or account-team ownership).
- `mid_market` — replace.
- `enterprise` — replace.
- `public_sector` — replace. Keep this separate from `enterprise` even at similar deal sizes; procurement constraints make the positions non-comparable.

## Part D — known exclusions

List agreements deliberately kept out of the corpus and why. This is the counterpart to the censoring audit in Phase 5: the skill can report what the corpus does not contain by construction, but it cannot report what you removed by hand.

| `agreement_id` | Reason for exclusion |
|---|---|
| MSA-2023-0112 | Settlement-driven terms; not representative of a negotiated position. |
| *(add rows)* | |
