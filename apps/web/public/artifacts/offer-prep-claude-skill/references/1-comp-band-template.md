# Comp band — TEMPLATE

> Replace this template's contents with your real comp bands per role + level
> + geo. The offer-prep skill reads this on every run; without your real
> bands, the recommendation is unbounded and the escalation logic in
> `3-escalation-criteria.md` cannot fire correctly.

## How to use

One file per role family (e.g. `eng-comp-band.md`, `gtm-comp-band.md`, `product-comp-band.md`) lives in your private fork of the references directory. The skill loads the relevant file based on the `role` input. Each file follows the structure below.

## Role family: REPLACE_ME (e.g. Engineering)

### Level matrix

| Level   | Title pattern              | Band midpoint base | Equity tier |
|---------|---------------------------|--------------------|-------------|
| L3      | Software Engineer          | $REPLACE           | T1          |
| L4      | Senior Software Engineer   | $REPLACE           | T2          |
| L5      | Staff Software Engineer    | $REPLACE           | T3          |
| L6      | Principal                  | $REPLACE           | T4          |
| M4      | Engineering Manager        | $REPLACE           | T2          |
| M5      | Senior Engineering Manager | $REPLACE           | T3          |

### Per-level bands

For each level, document floor / midpoint / ceiling. The skill uses these as hard bounds. Above-ceiling recommendations trigger `escalation: comp-committee`.

#### L4 — Senior Software Engineer (example)

| Component       | Floor        | Midpoint     | Ceiling      |
|-----------------|--------------|--------------|--------------|
| Base            | $REPLACE     | $REPLACE     | $REPLACE     |
| Bonus target    | REPLACE %    | REPLACE %    | REPLACE %    |
| Equity (RSUs)   | REPLACE      | REPLACE      | REPLACE      |
| Signing maximum | $REPLACE     | —            | $REPLACE     |

Vest schedule: REPLACE (e.g. 4-year, 25/25/25/25, 1-year cliff).

Equity priced at: REPLACE (e.g. last-round preferred, current 409a).

#### L5 — Staff Software Engineer

(repeat structure)

### Geographic adjustment table

| Geo                  | Adjustment factor |
|---------------------|-------------------|
| US Tier 1 (SF/NYC)  | 1.00              |
| US Tier 2           | REPLACE           |
| US Tier 3 / remote  | REPLACE           |
| EU Tier 1 (London)  | REPLACE           |
| EU Tier 2           | REPLACE           |
| LATAM remote        | REPLACE           |

Apply the factor to base. Bonus target and equity are typically NOT geo-adjusted — confirm with your comp framework.

### Signing-bonus policy

When signing is allowed, and the maximum:

- Relocation bridging: up to $REPLACE, repayable on REPLACE schedule.
- Unvested-equity bridging: up to estimated value of REPLACE months of unvested grant at prior employer. Requires documentation.
- Pure comp-gap closing without one of the above reasons: NOT ALLOWED.

### Internal-equity guardrail

If the recommendation would place the candidate above any current employee at the same level + geo by more than REPLACE %, the brief sets `escalation: comp-committee` regardless of band position.

### Last reviewed

REPLACE_DATE — refresh whenever bands change so the brief's recommendation is bounded by current numbers.
