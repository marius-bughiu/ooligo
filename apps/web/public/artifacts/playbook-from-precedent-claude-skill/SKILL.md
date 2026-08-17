---
name: playbook-from-precedent
description: Derives a contract negotiation playbook from a folder of executed agreements — standard position and observed landing range per clause, a fallback ladder only where redline history supports one, and a coverage report naming every field the corpus cannot support. Never invents a walk-away.
---

# Playbook from precedent

Reads a corpus of executed agreements and produces a per-clause playbook: the standard position you actually hold, the range of places you actually land, the worst term you have ever signed, and an explicit list of what the corpus cannot tell you. It is read-only. It does not edit agreements, does not write to a CLM, and does not approve positions — a playbook position is a delegation of authority and belongs to a named person.

## When to invoke

- A playbook is being written or rewritten and the drafters are working from memory rather than from the book of business.
- An existing playbook is being audited against actual practice, and the question is where the written standard and the signed reality have diverged.
- Signature authority is being delegated to a business team and the escalation thresholds have to be defensible.
- A CLM rollout needs seed positions for its clause library and the vendor's extraction has produced frequencies with no segmentation.

## When NOT to invoke

- **Fewer than roughly 25 executed agreements on your own paper for the agreement type in question.** Below that the arithmetic in Phase 4 cannot separate a standard position from a coincidence, and the run produces a coverage report with almost nothing in it. Read the agreements.
- **You need the walk-away line.** Phase 5 explains why executed agreements cannot produce one. If that is the deliverable, this is the wrong tool.
- **The corpus is mostly counterparty paper and you cannot label which is which.** Phase 1 refuses. Unsegmented clause frequency across mixed paper measures your counterparties' drafting preferences and reports them as yours.
- **You want the playbook approved, not drafted.** The output is a proposal with evidence attached. Approval is a legal decision.

## Inputs

**Required:**

| Input | Type | Notes |
|---|---|---|
| `corpus_dir` | path | Directory of executed agreements. PDF, DOCX, or text. Subdirectories are walked. |
| `manifest` | path | `references/1-corpus-manifest.md`, filled in. One row per agreement. The run refuses without it. |
| `agreement_type` | string | One type per run — `msa`, `nda`, `dpa`, `saas_subscription`, `reseller`. Mixing types blends unrelated negotiations. |

**Optional:**

| Input | Type | Notes |
|---|---|---|
| `redline_dir` | path | Redline or version history keyed to the manifest's `agreement_id`. Without it, Phase 6 emits an observed range instead of a fallback ladder. |
| `clause_set` | list | Subset of the taxonomy in `references/2-clause-position-schema.md`. Defaults to the full set. |
| `recency_window_months` | integer | Split point for the drift test. Default 24. |
| `proposed_walk_away` | path | A human-supplied walk-away line per clause. Triggers the contradiction check in Phase 7. |

## Reference files

- `references/1-corpus-manifest.md` — the per-agreement manifest. Paper of origin, counterparty tier, deal-value band, execution date, redline availability. Fill this in before the first run; it is what makes every later segmentation possible.
- `references/2-clause-position-schema.md` — the clause taxonomy and the output record shape, including which fields the skill is forbidden to populate.
- `references/3-coverage-report-template.md` — the report that leads with what could not be inferred.

## Method

Seven phases, fixed order, with hard refusals in two of them.

**Phase 1 — intake and segmentation.** Every agreement is joined to its manifest row. The load-bearing field is `paper_of_origin`: `own`, `counterparty`, or `hybrid`. The skill refuses to proceed if more than 10% of the corpus lacks it, and it does not guess from the document. This refusal exists because the most common way a precedent-derived playbook goes wrong is silent: a term appears in 78% of executed agreements, gets written down as the company's standard position, and is in fact an artifact of 78% of those agreements having been signed on the other side's form. Frequency across mixed paper is a measurement of your counterparties.

**Phase 2 — verbatim extraction.** Each clause slot in the taxonomy is extracted as quoted text with a document and page pointer. Nothing is normalized in this pass. A clause slot with no match renders as `absent`, which is a finding — an MSA with no limitation-of-liability clause is a data point, not a gap in the extraction.

**Phase 3 — normalization.** The quoted text is converted to a comparable value in a stated unit: a liability cap becomes a multiple of trailing-12-month fees or `uncapped`; a payment term becomes days; an indemnity becomes a scope enum. This is a separate pass on purpose. A single pass conflates "the clause says X" with "X equals Y in our units," and once those are merged the normalization errors hide inside quotes nobody re-reads. Every normalized value keeps its source quote, so the second pass is auditable against the first.

**Phase 4 — position statistics, per cell.** Cells are `(clause, paper_of_origin, agreement_type, counterparty_tier)`. Within a cell, the modal normalized value is a candidate standard position, and it is reported with the Wilson score interval on its proportion — not the raw percentage. The threshold is a stated engineering choice: a candidate is labelled `standard` only when the 95% lower bound clears 0.60. That bound is what makes small samples behave. A term appearing in 8 of 10 agreements is 80% by naive count and has a 95% interval of roughly 49% to 94% — it cannot be called a standard position, because the interval spans "most of the time" and "barely more than half." The same 80% at 20 of 25 has a lower bound of about 61% and clears. So roughly 25 same-paper instances per clause is the practical floor, and cells below it render as `insufficient-evidence` with the n they would need, never as a weak position.

**Phase 5 — the censoring audit.** This is the phase that separates the output from a clause-frequency report, and it turns on a property of the corpus: **a folder of executed agreements is a censored sample.** It contains every negotiation that ended in signature and no negotiation that ended in a walk. So per clause the skill emits three fields and refuses to emit a fourth:

- `standard_position` — from Phase 4, with its interval.
- `observed_range` — the full distribution of landing spots, minimum to maximum, with counts.
- `worst_signed` — the single most adverse instance in the corpus, with agreement, date, and counterparty tier. This is an **upper bound on your demonstrated tolerance**: you did not walk at that term, because there is a signature on it.
- `walk_away` — rendered as `not-inferable-from-executed-agreements`, always. The walk-away is definitionally the position that produces no executed agreement, so it is the one field the corpus is censored on. A tool that emits a confident walk-away from signed contracts has invented it.

**Phase 6 — the fallback ladder, conditionally.** Executed text shows where you landed, not what you asked for first, so a `fallback_1` / `fallback_2` ladder is not recoverable from final PDFs. Two conditions gate it: `redline_dir` is supplied, and the cell's landing-spot distribution is multi-modal rather than a single cluster with noise. When both hold, the ladder is derived from opening-to-final movement across the version history. When either fails, the output carries `observed_range` under that name and says why the ladder is absent. Labelling a landing-spot spread as a fallback ladder is the same error as labelling a correlation a cause — it asserts an intent the evidence does not contain.

**Phase 7 — drift, contradiction, and report.** Cells are recomputed on the trailing `recency_window_months` and on everything older. Divergent cells are reported as two positions with dates, never averaged, because a 2022 liability cap averaged with a 2026 one describes neither. Then, if `proposed_walk_away` was supplied, the run tests it backwards against `worst_signed`: any asserted walk-away stricter than a term already in the corpus is flagged with the agreement and date. That flag matters commercially, not just editorially — a counterparty holding your prior agreement can produce it, and a red line you have already crossed is not a red line. Output goes to `references/3-coverage-report-template.md`, leading with the `insufficient-evidence` and `not-inferable` rows because those are the ones that need a human decision this week.

## Output format

One record per clause per cell, plus the coverage report. A literal record:

```yaml
clause: limitation_of_liability
cell:
  paper_of_origin: own
  agreement_type: msa
  counterparty_tier: mid_market
  n: 31
standard_position:
  value: "12mo_fees"
  proportion: 0.806
  wilson_95_lower: 0.634
  label: standard
observed_range:
  - {value: "12mo_fees", n: 25}
  - {value: "24mo_fees", n: 4}
  - {value: "uncapped_for_ip_indemnity", n: 2}
worst_signed:
  value: "uncapped_for_ip_indemnity"
  agreement_id: MSA-2025-0184
  executed: "2025-11-03"
  counterparty_tier: enterprise
fallback_ladder: absent
fallback_ladder_reason: redline_dir_not_supplied
walk_away: not-inferable-from-executed-agreements
drift:
  trailing_24mo: {value: "12mo_fees", n: 19}
  older: {value: "12mo_fees", n: 12}
  divergent: false
evidence:
  - {agreement_id: MSA-2025-0184, page: 14, quote: "…shall not exceed the fees paid…"}
```

The coverage report opens with counts: clauses at `standard`, clauses at `insufficient-evidence` with the n required, cells suppressed for segment disagreement, and drift-divergent clauses. `walk_away` is a section, not a row — one line per clause naming who has to decide it.

## Watch-outs

- **The paper-of-origin confound.** A frequency built across mixed paper reads as your standard and is your counterparties' standard. **Guard:** Phase 1 refuses above a 10% missing rate, and `paper_of_origin` is a cell dimension rather than a filter, so a position derived on counterparty paper can never silently merge into the own-paper position.
- **Small-n false confidence.** A clause seen 8 times out of 10 looks decisive and is not. **Guard:** the `standard` label requires a Wilson 95% lower bound above 0.60, and short cells render as `insufficient-evidence` with the sample size needed rather than as a hedged position.
- **Inventing the walk-away.** The most valuable field in a playbook is the one the corpus cannot supply, which is exactly the pressure that produces a fabricated one. **Guard:** the schema in `references/2-clause-position-schema.md` gives `walk_away` a fixed enum with one permitted value, so there is no code path that emits a derived one.
- **A walk-away that contradicts your own file.** A drafter sets the red line at 12-month fees while the corpus contains a signed uncapped IP indemnity. **Guard:** Phase 7's backwards test flags it with the agreement ID and date, so the contradiction surfaces before a counterparty finds it.
- **Bargaining position read as preference.** Positions look weaker in the enterprise segment because that is where you conceded, not because your standard is different there. **Guard:** `counterparty_tier` is a cell dimension; when segments disagree materially the blended position is suppressed rather than reported, and the report names the suppression.
- **The playbook is stale on delivery.** DocJuris's survey of roughly 300 legal departments, published in October 2024, found that even at the most mature stage the recurring failure is ownership — the first version does not improve. **Guard:** the manifest persists between runs, so the second run is a diff against the first rather than a rebuild, and re-running per quarter costs a fraction of the initial pass.
- **Absence read as extraction failure.** A missing limitation-of-liability clause gets treated as a parse error and quietly dropped. **Guard:** Phase 2 emits `absent` as a value, and `absent` participates in the Phase 4 statistics like any other landing spot.
