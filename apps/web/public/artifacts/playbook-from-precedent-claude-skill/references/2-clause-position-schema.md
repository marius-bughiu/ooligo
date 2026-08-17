# Clause taxonomy and position schema

Defines the clause slots the skill extracts and the shape of each output record. Edit the taxonomy to match your forms; do not edit the field constraints, because two of them are what stop the run from asserting things the corpus cannot support.

## Part A — clause taxonomy

One slot per row. `unit` is the unit normalization must produce in Phase 3; a slot with no stated unit cannot be normalized and will render as verbatim-only.

| Slot | Unit | Normalization notes |
|---|---|---|
| `limitation_of_liability` | multiple of trailing-12-month fees, or `uncapped` | Record super-caps and carve-outs as distinct values, not as footnotes to the general cap. |
| `ip_indemnity_scope` | enum: `none` / `defend_only` / `defend_and_indemnify` / `defend_indemnify_uncapped` | |
| `data_breach_liability` | multiple of fees, `uncapped`, or `follows_general_cap` | Frequently carved out of the general cap; if so it is its own slot value, not a variant of `limitation_of_liability`. |
| `payment_terms` | days | Net days from invoice. |
| `termination_for_convenience` | enum: `none` / `customer_only` / `mutual`, plus notice days | Two values; record both. |
| `auto_renewal` | enum: `none` / `annual` / `monthly`, plus notice-window days | |
| `governing_law` | jurisdiction string | Not normalized further. |
| `dispute_resolution` | enum: `courts` / `arbitration` / `arbitration_with_carve_outs` | |
| `warranty_period` | days | |
| `assignment_on_change_of_control` | enum: `free` / `consent_required` / `consent_not_unreasonably_withheld` | |
| `insurance_minimum` | USD per occurrence | |
| `audit_rights` | enum: `none` / `annual` / `on_notice` / `unlimited` | |

Add slots for the terms your negotiations actually turn on. A slot nobody argues about produces a clean, high-confidence, useless position.

## Part B — the position record

```yaml
clause: <slot>
cell:
  paper_of_origin: own | counterparty | hybrid
  agreement_type: <type>
  counterparty_tier: <tier>
  n: <integer>                    # instances in this cell

standard_position:
  value: <normalized value>
  proportion: <float>
  wilson_95_lower: <float>
  label: standard | insufficient-evidence
  n_required: <integer>           # present only when label is insufficient-evidence

observed_range:
  - {value: <normalized value>, n: <integer>}   # every landing spot, including `absent`

worst_signed:
  value: <normalized value>
  agreement_id: <id>
  executed: <YYYY-MM-DD>
  counterparty_tier: <tier>

fallback_ladder: absent | [<value>, <value>, ...]
fallback_ladder_reason: <string>  # required whenever fallback_ladder is absent

walk_away: not-inferable-from-executed-agreements

drift:
  trailing_24mo: {value: <normalized value>, n: <integer>}
  older: {value: <normalized value>, n: <integer>}
  divergent: true | false

evidence:
  - {agreement_id: <id>, page: <integer>, quote: <verbatim text>}
```

## Part C — field constraints that are not editable

Three constraints carry the design. Relaxing any of them turns the output back into a clause-frequency report with a playbook's title.

**1. `walk_away` is a single-value enum.** The only permitted value is `not-inferable-from-executed-agreements`. There is no code path that derives one, because the corpus is censored on exactly that variable: a walk-away is the position that produces no executed agreement, so every instance of it is absent from the folder by construction. `worst_signed` is what the corpus does support — an upper bound on demonstrated tolerance, evidenced by a signature.

**2. `label: standard` requires `wilson_95_lower` above 0.60.** The Wilson score interval on the proportion, not the raw percentage. A term at 8 of 10 is 80% by count with a 95% interval of roughly 49% to 94%; the same 80% at 20 of 25 has a lower bound near 61%. The first is a coincidence you can describe, the second is a position you can defend, and only the interval tells them apart. Cells that fail render as `insufficient-evidence` with `n_required` — never as a softened standard.

**3. `fallback_ladder_reason` is required whenever the ladder is absent.** Final executed text records where you landed, not what you opened with, so a ladder needs the redline history plus a genuinely multi-modal distribution. Absent either, the spread is reported as `observed_range` under that name. The required reason field is what stops "we had no version history" from being silently indistinguishable from "there is no ladder here."

## Part D — your position overrides

Positions the business has decided regardless of what the corpus says. Record them here rather than editing derived output, so a later run can diff intent against practice — the divergence between the two is usually the most useful thing the exercise produces.

| Slot | Asserted position | Owner | Decided on | Rationale |
|---|---|---|---|---|
| `limitation_of_liability` | 12mo_fees | *(name)* | *(date)* | *(why)* |
| *(add rows)* | | | | |

Asserted walk-aways go in the same table with an `asserted_walk_away` column. Supplying that file as `proposed_walk_away` triggers the Phase 7 contradiction check against `worst_signed`.
