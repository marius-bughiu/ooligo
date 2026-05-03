# Comparable-deal history — FORMAT

> This file documents the schema. The actual data lives in a sibling
> CSV at `references/comparable-deals.csv` that the user maintains.
> The deal-desk-pricing skill pulls 5-10 closest analogs from the CSV
> on every run and includes them as evidence in the recommendation.

## Why we maintain this separately

Salesforce has the data, but Salesforce reports do not capture the *reasoning* behind a non-standard deal — why we agreed to Net-60, which competitor was on the table, what the strategic justification was. The CSV captures that reasoning so the skill can surface analogs that look like the current ask not just by numbers but by context.

## CSV schema

The skill expects the following columns. Header row required, exact column names, case-sensitive.

| Column | Type | Required | Notes |
|---|---|---|---|
| `analog_id` | string | yes | Stable ID, used to cite in recommendations (e.g. `D-2284`) |
| `closed_date` | YYYY-MM-DD | yes | Date the deal closed (or was rejected/lost) |
| `customer_anonymized` | string | yes | Anonymized name (e.g. "Mid-market SaaS Co", not real name) |
| `segment` | enum | yes | One of: `smb`, `mid-market`, `enterprise`, `strategic` |
| `acv_usd` | int | yes | Annual contract value in USD |
| `tcv_usd` | int | yes | Total contract value across the term |
| `term_months` | int | yes | Contractual term length |
| `discount_pct` | float | yes | Effective discount off list, 0-100 |
| `payment_terms` | string | yes | One of: `Net-30`, `Net-45`, `Net-60`, `Net-90`, `Custom` |
| `ramp_shape` | string | yes | One of: `flat`, `Y1-50/Y2-100`, `Y1-25/Y2-75/Y3-100`, `custom` |
| `competitor_in_deal` | string | no | Named competitor, or empty |
| `competitive_pressure` | enum | no | `high`, `medium`, `low`, or empty |
| `approved_by` | string | yes | Approver name from DOA, or `lost`, `withdrawn`, `rejected` |
| `outcome` | enum | yes | `won`, `lost`, `withdrawn`, `rejected` |
| `notes` | string | no | Free-text reasoning, max 200 chars |

## Curation rules

The skill is only as good as the CSV. Three rules to follow:

1. **Include rejected and lost deals.** A history full of `won` deals trains the skill to rubber-stamp. Aim for at least 20% non-`won` in the trailing 12 months. The skill flags "no rejected analogs in last 20" as a calibration note.
2. **Anonymize customer names.** The CSV travels with the bundle and may be loaded into a Claude session. Anonymize to "Mid-market SaaS Co" / "Enterprise Manufacturing Co" rather than real names, unless your DPA explicitly covers commercial-terms data.
3. **Refresh quarterly.** Add new closed deals at quarter close. Prune deals older than 8 quarters — pricing context decays and stale analogs distort the recommendation.

## How the skill ranks "comparable"

Analogs are ranked by similarity to the current deal across:

1. `segment` — must match. The skill never crosses segments for analogs.
2. `acv_usd` — within ±50% of the current ACV.
3. `term_months` — within ±12 months of the current term.
4. `competitive_pressure` — when the current deal has competitive context, prefer analogs with matching pressure level.
5. `closed_date` — recency tiebreaker; never prefer older over newer when the other dimensions are equal.

If fewer than 3 analogs match, the skill records that explicitly rather than relaxing the criteria. Thin evidence is itself a finding.

## Example row

```csv
analog_id,closed_date,customer_anonymized,segment,acv_usd,tcv_usd,term_months,discount_pct,payment_terms,ramp_shape,competitor_in_deal,competitive_pressure,approved_by,outcome,notes
D-2284,2026-02-15,Mid-market SaaS Co,mid-market,180000,540000,36,17,Net-30,flat,,,VP Sales,won,"Standard close, no competitive pressure"
```

## Last edited

{YYYY-MM-DD} — bump on every schema change. Adding a column requires a one-time backfill or the skill will skip rows missing the new field.
