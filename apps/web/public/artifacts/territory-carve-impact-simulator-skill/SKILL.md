---
name: territory-carve-impact-simulator
description: Simulate a proposed sales territory carve before it ships to reps. Evaluates the carve's assignment rules against the live account book, then reports coverage gaps, quota-capacity shortfalls, and named-account churn weighted by open pipeline and relationship tenure. Emits ready / revise / blocked — never an automatic rollout.
---

# Territory carve impact simulator

## When to invoke

Whenever someone has a drafted territory carve — a set of assignment rules, a rep roster, and an effective date — and nobody has yet checked what it does to coverage, capacity, and existing relationships. The canonical moment is two to four weeks before a fiscal-year or mid-year realignment, while the carve is still editable. Also valid: a single-segment carve (one pod, one region) that a sales leader wants to move ahead of the wider realignment, and an after-the-fact run against a carve that already shipped, to explain why a segment is missing plan.

Take a carve spec (`references/1-carve-input-template.md`), an org thresholds file (`references/2-coverage-thresholds-template.md`), and read-only Salesforce access. Produce the Markdown report in `references/3-sample-output-format.md`.

Do NOT invoke this skill for:

- **Generating a carve.** This skill scores a carve someone else designed. It does not propose rules, rebalance accounts, or search for an optimal split. If there is no draft carve, there is nothing to simulate.
- **Writing assignments back to Salesforce.** The skill is read-only on every object it touches. Territory changes are executed by the routing or territory-management system that owns them, after a human approves the plan.
- **Comp or quota-setting decisions.** The capacity report says whether a territory can carry the quota someone already assigned it. It does not set quota, and its output must not flow into comp calculations — that turns a planning tool into a negotiation instrument and the inputs start getting gamed.
- **Carves with no documented rules.** A carve that exists only as a spreadsheet of account IDs and rep names cannot be simulated against what the routing engine will actually do. Ask for the rules, or convert the spreadsheet into rules first and simulate those.
- **Books with untracked ownership history.** If `AccountHistory` does not record `OwnerId` changes, the churn report has no baseline and the skill returns `blocked` rather than a churn number that looks authoritative and is not.

## Inputs

- Required: `carve_path` — path to the carve spec (rules in declared priority order, rep roster, effective date). See `references/1-carve-input-template.md`.
- Required: `thresholds_path` — path to the org's thresholds and capacity model. See `references/2-coverage-thresholds-template.md`.
- Required: `sfdc_token` — Salesforce session token with read on `Account`, `AccountHistory`, `Opportunity`, `OpportunityHistory`, `User`, and `UserTerritory2Association`. Read-only is the correct scope; the skill must not write.
- Optional: `segment_filter` — restrict the simulation to one segment or region. Coverage gaps outside the filter are reported as informational, not as failures.
- Optional: `snapshot_date` — ISO date for the CRM snapshot. Defaults to the run date. Recorded in the output header and used to compute the re-run deadline.
- Optional: `dry_run` — boolean, default `false`. When `true`, the skill backtests the thresholds file's ramp curve against last year's new-hire cohort and reports the delta instead of running the full simulation.

## Reference files

Read all three from `references/` before computing anything. Without the thresholds file the skill has no definition of "shortfall" and will not guess one.

- `references/1-carve-input-template.md` — the proposed carve. Rules are an ordered list; the roster carries each rep's segment, start date, and assigned quota.
- `references/2-coverage-thresholds-template.md` — the org's capacity model, ramp curve, disruption tolerances, protected-account list, and material-deal floor.
- `references/3-sample-output-format.md` — the exact Markdown the skill emits. Downstream consumers (a Slack digest, a planning deck) parse this shape.

## Method

Run in order. Steps 2 and 4 carry the engineering choices; do not collapse them.

1. **Load and validate.** Parse both reference files. If any rule references a Salesforce field that does not exist in the org's schema, stop and return `blocked` naming the field — a rule against a missing field silently matches nothing and produces a coverage gap that looks like a design flaw.

2. **Assign every account, first-match-wins, in declared order.** Evaluate the carve rules in the order they appear in the carve spec, and stop at the first rule that matches each account. This mirrors how the routing engine will execute them at go-live. Do not use set-union or any-rule-matches semantics: those produce a different assignment map than the one that ships, which makes the entire simulation decorative. Record the matched rule index per account. Accounts that match nothing land in an unassigned bucket, split into two causes — `no_rule_matched` (a genuine coverage gap) and `null_input_field` (a data gap, with the offending field named). Conflating those two sends a planning team to redesign rules when the real fix is a backfill.

3. **Compute the assignment diff.** For each account, compare the simulated owner against the current `Account.OwnerId`. Join open opportunities, prior-year closed-won amount, and relationship tenure (months since the current owner's first logged activity or first closed-won on that account, whichever is earlier).

4. **Score three impact dimensions.** Do the arithmetic in code, not by reading numbers into the reasoning context — the coverage and capacity figures must be reproducible run to run, and a model reading thousands of records will not be.
   - **Coverage.** Unassigned accounts by cause; accounts assigned to a rep whose roster entry has no start date on or before the effective date; territories with zero assigned accounts.
   - **Quota capacity.** Per territory: ramp-adjusted quota-carrying capacity against assigned quota. Capacity is `sum over reps of (ramp factor at effective date × that rep's historical productivity band)`, not headcount times average quota. The ramp factor comes from the curve in the thresholds file, so a territory that balances on account count but absorbs three reps in month two shows a shortfall here rather than passing.
   - **Named-account churn.** Rank accounts changing owner by weighted disruption, not by count. Weight is open pipeline in stages at or past the thresholds file's `material_stage`, multiplied by a tenure factor. Moving 200 dormant accounts is cheap; moving 12 accounts with late-stage pipeline held by a rep with three years of tenure is not, and an unweighted count reports the opposite.

5. **Emit one of three verdicts.** `ready` (no threshold breached), `revise` (thresholds breached, with the specific territories and accounts named), or `blocked` (a data problem makes the numbers untrustworthy — stale snapshot, missing field history, unresolvable schema reference). There is deliberately no "ship it" verdict and no automatic rollout: the skill's job is to make the cost of the carve visible before a human decides.

## Output format

The skill emits Markdown in exactly this shape. Full worked example with populated rows in `references/3-sample-output-format.md`.

```markdown
# Territory carve simulation — FY27 Enterprise realignment
snapshot_date: 2026-08-10 | effective_date: 2026-11-01 | re-run by: 2026-08-24
accounts evaluated: 4,812 | territories: 22 | reps: 31

## Verdict: revise

Two territories breach the capacity floor and one protected account moves to a
ramping rep. Coverage is clean.

## 1. Coverage
| bucket | accounts | cause |
|---|---|---|
| assigned | 4,798 | — |
| unassigned | 9 | no_rule_matched |
| unassigned | 5 | null_input_field (Account.Industry) |
| empty territories | 0 | — |

## 2. Quota capacity
| territory | assigned quota | ramp-adj. capacity | gap | flag |
|---|---|---|---|---|
| ENT-WEST-2 | 4,200,000 | 2,940,000 | -1,260,000 | shortfall |
| ENT-EAST-1 | 3,800,000 | 3,910,000 | +110,000 | ok |

## 3. Named-account churn (ranked by weighted disruption)
| account | from | to | open pipeline (material) | tenure (mo) | flag |
|---|---|---|---|---|---|
| Northwind Traders | A. Okafor | J. Reyes (ramp m2) | 890,000 | 41 | protected |
| Contoso Fabrics | A. Okafor | S. Baptiste | 410,000 | 18 | review |

## 4. What to change
- ENT-WEST-2: capacity gap of 1.26M against a 4.2M quota. Either move ~1.2M of
  quota to ENT-EAST-1, or the two month-two reps need a ramp allowance.
- Northwind Traders is on the protected list and its receiving rep is in month 2.
  Carve it out or delay the transfer to the following quarter.
```

## Watch-outs

- **Stale CRM ownership data makes the carve look cleaner than it is.** Guard: the output header carries `snapshot_date` and a re-run deadline (default 14 days). If the carve ships after that date the numbers are void, and the report says so in the header rather than in a footnote nobody reads.
- **Field history not tracked on `Account.OwnerId`.** Tenure and churn baselines silently collapse to zero, which reads as "nothing is moving." Guard: the skill checks whether `AccountHistory` contains `OwnerId` rows and returns `blocked` when coverage of that field is below the thresholds file's `history_coverage_floor`.
- **Rules written against fields with nulls.** Guard: the unassigned bucket is split by cause and names the specific field, so a backfill problem never gets misread as a rule-design problem.
- **A carve that balances the metric by shredding relationships.** Guard: churn is ranked by weighted disruption and protected accounts are surfaced by name, so the tradeoff appears in the report rather than in a rep's resignation two months later.
- **A ramp curve HR wrote rather than one the data supports.** Guard: `dry_run` mode backtests the curve against last year's new-hire cohort attainment. If observed months-to-full-productivity exceeds the file's curve by more than the thresholds file's `ramp_tolerance_months`, the skill warns before using the curve and reports the observed curve alongside it.
- **Simulating a carve that has already been socialized.** Once reps have seen the map, a `revise` verdict is politically expensive and gets ignored. Guard: the skill records `carve_status` from the carve spec, and when it is `socialized` the report opens with the note that revisions now carry a communication cost, so the leader weighs it explicitly rather than discovering it in the meeting.
