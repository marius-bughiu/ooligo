---
name: comp-plan-drafter
description: Draft a sales compensation plan — metric, pay mix, quota, accelerator curve, SPIFs, clawback trigger, and dispute policy — from role, segment, and OTE inputs, then stress-test it by replaying last year's actual attainment distribution through the new curve. Reports modeled plan cost, per-decile rep earnings, and policy gaps. Emits `draft` or `blocked`, never an approved plan.
---

# Sales comp plan drafter

## When to invoke

Whenever someone is writing next year's sales compensation plan and the only cost model behind it is a spreadsheet that assumes everyone lands at 100% of quota. The canonical moment is six to ten weeks before the plan year opens, while the curve is still editable and before anything has been shown to reps. Also valid: a mid-year plan amendment for one segment, a new role whose plan has no precedent in the org, and a post-mortem run against the plan currently in market to explain why variable comp came in over or under budget.

Take a plan inputs file (`references/1-plan-inputs-template.md`), an attainment history file (`references/2-attainment-history-template.md`), and produce the Markdown plan document plus stress-test report shown in `references/3-sample-output-format.md`.

Do NOT invoke this skill for:

- **Approving or issuing a plan.** The output is a draft that goes to compensation, finance, and counsel. A sales comp plan is a contract; in California, Labor Code § 2751 requires it in writing, signed by the employer, with a signed acknowledgment of receipt from the employee. There is no verdict in this skill that means "ship it."
- **Calculating or paying commissions.** This drafts and prices the plan. Payout calculation, dispute resolution, and payroll belong to an ICM platform or the finance team, and the skill writes to nothing.
- **Setting individual quotas.** It models a quota level for a role and segment. Assigning a number to a named rep is a territory-and-capacity question — carve first, then price the plan against the carve.
- **Recruiting pay bands.** Benchmarking base and equity for a role against survey data is a different job with different sources.
- **Books with fewer than `min_history_reps` fully-ramped rep-years.** A distribution built from six survivors is not a distribution, and a cost model built on it is a guess wearing a table. The skill returns `blocked`.

## Inputs

- Required: `plan_inputs_path` — role, segment, headcount, target OTE, pay mix, proposed quota, curve shape, plan year, and the states reps work in. See `references/1-plan-inputs-template.md`.
- Required: `attainment_history_path` — one row per rep-year for the trailing plan year, including reps who left mid-year. See `references/2-attainment-history-template.md`.
- Optional: `budget_ceiling` — total variable compensation approved for the plan year, in plan currency. When set, the cost report is expressed against it rather than as a bare number.
- Optional: `sensitivity_band_pct` — default `10`. The company-wide attainment shift, in percentage points, used for the low and high cost cases.
- Optional: `dry_run` — boolean, default `false`. When `true`, the skill validates the history file and returns the observed distribution plus a data-quality report, without drafting a plan. Run this first.

## Reference files

Read both input templates before drafting anything. Without the attainment history the skill has no cost model and must not invent one.

- `references/1-plan-inputs-template.md` — the plan being designed: role, segment, OTE, pay mix, quota, curve, SPIF budget, work states, and the policy constraints that bound the draft.
- `references/2-attainment-history-template.md` — one row per rep-year: attainment percentage, prorated quota, months ramped, and termination date if any. The `include_terminated` flag is load-bearing.
- `references/3-sample-output-format.md` — the exact Markdown the skill emits, with a worked example. Downstream consumers (a finance model, a plan-document template) parse this shape.

## Method

Run in order. Steps 2 and 3 are the load-bearing split; do not merge them.

1. **Load and validate.** Parse both files. Count fully-ramped rep-years in the history. Below `min_history_reps` (default 12), stop and return `blocked` — say how many rows were found and what the floor is. If `include_terminated` is `false`, return `blocked` regardless of row count: a history containing only the reps who stayed is survivorship-biased in the one direction that matters, because low attainers leave, and it makes every plan look cheaper and every distribution look healthier than it is.

2. **Draft the plan.** This is the judgment pass and it belongs to the model. Produce: the metric paid on, the pay mix, the quota, the curve (threshold, target rate, accelerator tiers and where they kick in, decelerator if any), a SPIF budget line with a named expiry date, the clawback trigger, and the dispute-resolution policy with a named response window. Keep the component count at or below `max_components` (default 3) — every component past the third divides rep attention without adding steering, and the modeled dollars usually show one component carrying almost nothing.

3. **Back-cast the draft against the observed distribution — in code.** Replay each historical rep's actual attainment percentage through the *new* curve and sum the modeled payouts. Do this arithmetic in code, not by reading the roster into the reasoning context. A piecewise payout function applied to forty rep-rows will not reproduce run to run when a model does it in context, and a compensation conversation collapses the moment two runs of the same draft produce two plan costs. The model's job is the curve, the ranking, and the narrative.

   Report three numbers, not one: modeled cost at the observed distribution, at the distribution shifted up by `sensitivity_band_pct`, and shifted down by the same. A comp plan is a leveraged instrument and the useful figure is the slope. A plan whose cost moves 8% across a 20-point attainment swing is under-leveraged and will not change behavior; one that moves 60% is a budget risk somebody should agree to on purpose.

4. **Report earnings by decile, not by average.** Average earnings hide the plan's actual behavior. Emit modeled total earnings at the 10th, 50th, and 90th percentile of the observed distribution, alongside target OTE. The number that predicts attrition is what the median rep actually earns against the OTE they were recruited on — if that lands well below target, the plan is priced for the budget rather than for the market and the cost report will still pass.

5. **Run the policy check.** For each state in `rep_work_states`, note the local constraint and emit the checklist rather than a conclusion. Three conditions decide whether a clawback survives challenge in most states: the trigger is defined in the plan document before the commission is paid, the earning event is tied to something genuinely reversible, and the recovery mechanism cannot push the rep below the applicable minimum wage in any pay period. Check the draft against all three and name which one fails. Where California is in the list, add the § 2751 items: written agreement, signed by the employer, signed acknowledgment of receipt from the employee, and a stated method for computing commissions including the chargeback policy.

6. **Emit `draft` or `blocked`.** `draft` means the plan is modeled, priced, and ready for human review; every `draft` document carries `requires_counsel_review: true` in its header. `blocked` means a data problem makes the cost numbers untrustworthy — too few rep-years, terminated reps excluded, or a quota shift that invalidates the distribution. There is deliberately no third verdict. The skill makes the cost and the policy gaps visible before people decide; it does not decide.

## Output format

The skill emits Markdown in exactly this shape. Full worked example with populated rows in `references/3-sample-output-format.md`.

```markdown
# Comp plan draft — FY27 Mid-Market AE
plan_year: 2027 | headcount: 34 | history rows: 41 (incl. 9 terminated)
requires_counsel_review: true

## Verdict: draft

Curve lands 21% under budget at the observed distribution and the median rep
earns 77% of OTE — priced for the budget, not the market. Clawback trigger
fails the reversibility test.

## 1. Plan structure
| component | metric | weight | notes |
|---|---|---|---|
| base | — | 50% of OTE | 100,000 |
| commission | closed-won ARR | 45% of OTE | 9.4% of ARR at target |
| SPIF | new-logo multi-year | 5% of OTE | expires 2027-06-30 |

## 2. Curve
| band | attainment | rate | cumulative payout |
|---|---|---|---|
| threshold | 0-50% | 0% | 0 |
| target | 50-100% | 9.375% of ARR | 90,000 at 100% |
| accelerator 1 | 100-130% | 1.5x base rate | 130,500 at 130% |
| accelerator 2 | 130%+ | 2.0x base rate | uncapped |

## 3. Modeled cost (back-cast on 41 rep-years, 34 plan heads)
| case | company attainment | variable cost | vs budget (3,060,000) |
|---|---|---|---|
| low | observed -10 pts | 1,940,000 | -37% |
| observed | 61% median | 2,410,000 | -21% |
| high | observed +10 pts | 2,980,000 | -3% |

## 4. Rep earnings by decile
| percentile | attainment | modeled earnings | vs OTE (200,000) |
|---|---|---|---|
| p10 | 34% | 100,000 | 50% |
| p50 | 61% | 154,900 | 77% |
| p90 | 141% | 250,300 | 125% |

## 5. Policy check
| item | state | status |
|---|---|---|
| written + signed + acknowledged | CA | present in draft |
| computation method stated | CA | present in draft |
| clawback trigger pre-defined | all | present in draft |
| clawback tied to reversible event | all | FAIL — 12-month churn is not the earning event |
| minimum-wage floor per pay period | CA, NY, WA | not modeled — needs draw schedule |

## 6. What to change
- The clawback recovers on churn inside 12 months, but the plan earns
  commission on booking. Tie recovery to non-payment or contract
  cancellation, or move the earning event to cash collected.
- Median rep earns 154,900 against a 200,000 OTE, and the plan spends
  650,000 under budget. The curve is not the cause: at 61% median
  attainment, no defensible quota-to-OTE ratio pays the median rep target.
  Quota would have to fall to roughly 590,000 — a 3.0x ratio — to put the
  median at 100%. Either fix the input (coverage, territory, ramp) or
  accept that this plan pays half the team 77% of OTE and say so at hire.
- Cost moves 43% across a 20-point attainment swing. That is real leverage
  and it is worth confirming on purpose rather than discovering in Q3.
```

## Watch-outs

- **An attainment history that excludes reps who left.** Low attainers leave, so a survivors-only file understates plan cost and overstates the health of the distribution — in the same direction, at the same time. Guard: `include_terminated` is a required field and the skill returns `blocked` when it is `false`; terminated reps enter with prorated quota and partial-year attainment.
- **A distribution produced under a different quota.** Last year's attainment reflects last year's quota and last year's territories. If the new median quota moves materially, the old distribution stops predicting anything. Guard: the skill records `prior_plan_quota_median` and warns when the drafted quota moves more than `quota_shift_tolerance_pct` (default 15), stating in the report that the cost model is directional only.
- **A plan that passes the budget check and loses people.** The cost report is a finance instrument and it will happily approve a plan the median rep cannot live on. Guard: the decile table sits next to the cost table and reports median modeled earnings as a percentage of target OTE, so the retention cost is on the same page as the budget cost.
- **A clawback that recovers against something the earning event does not cover.** Recovering commission on 12-month churn when the plan earns on booking is the most common drafting error, and it is the condition that fails in dispute. Guard: step 5 tests the trigger against the earning event explicitly and names the mismatch rather than reporting a generic pass.
- **A permanent SPIF.** A SPIF that never expires is not a SPIF, it is an undocumented rate increase that nobody re-approves. Guard: the SPIF line requires an explicit expiry date in the inputs file, and the skill refuses to draft a SPIF component without one.
- **Treating `blocked` as a verdict on the plan.** `blocked` says the numbers cannot be trusted, not that the design is wrong. Guard: every `blocked` return names the specific data defect and what would clear it, so the response is a data fix rather than a redesign.
