# Sample output

The exact Markdown the skill emits, populated from the example inputs in `references/1-plan-inputs-template.md` and the example history in `references/2-attainment-history-template.md`. Section order and heading text are stable — a finance model or a plan-document template can parse against them.

---

# Comp plan draft — FY27 Mid-Market AE

plan_year: 2027 | headcount: 34 | history rows: 41 (incl. 9 terminated)
quota shift vs prior plan: +12.9% (within 15% tolerance)
requires_counsel_review: true

## Verdict: draft

Curve lands 21% under budget at the observed distribution and the median rep earns 77% of OTE. The plan is priced for the budget, not the market. The clawback trigger fails the reversibility test and must be redrafted before counsel review.

## 1. Plan structure

| component | metric | weight | notes |
|---|---|---|---|
| base | — | 50% of OTE | 100,000 |
| commission | closed-won ARR | 45% of OTE | 9.375% of ARR, 90,000 at 100% |
| SPIF | new-logo multi-year | 5% of OTE | 10,000 pool, expires 2027-06-30 |

Earning event: `booking`. Draw: none. Dispute window: 15 days, escalating RevOps → VP Sales → CFO.

## 2. Curve

| band | attainment | rate | payout at band ceiling |
|---|---|---|---|
| threshold | 0-50% | 0% | 0 |
| target | 50-100% | 9.375% of ARR | 90,000 |
| accelerator 1 | 100-130% | 1.5x base rate | 130,500 |
| accelerator 2 | 130%+ | 2.0x base rate | uncapped |

The threshold is a gate, not a ramp: a rep who clears 50% is paid on every dollar from the first, and a rep at 49% is paid nothing variable. That is a deliberate cliff and it is the single most disputed line in any plan that has one — the 49% rep and the 51% rep are 20,000 apart on a difference of one deal.

## 3. Modeled cost — back-cast on 41 rep-years, 34 plan heads

| case | company attainment | variable cost | vs budget (3,060,000) |
|---|---|---|---|
| low | observed -10 pts | 1,940,000 | -37% |
| observed | 61% median | 2,410,000 | -21% |
| high | observed +10 pts | 2,980,000 | -3% |

Cost moves 43% across the 20-point band. Under the prior curve (60% threshold, 1.4x single accelerator) the same 41 rep-years would have cost 2,265,000 — the new plan is 6.4% more expensive at identical performance, almost entirely from the second accelerator tier.

## 4. Rep earnings by decile

| percentile | attainment | modeled earnings | vs OTE (200,000) |
|---|---|---|---|
| p10 | 34% | 100,000 | 50% |
| p50 | 61% | 154,900 | 77% |
| p90 | 141% | 250,300 | 125% |

Nine of the 41 rep-years land below the 50% threshold and earn base only. Three of those nine are terminated rows, which is the expected pattern and the reason the terminated set has to be in the file.

## 5. Policy check

| item | state | status |
|---|---|---|
| written agreement, signed by employer | CA | present in draft |
| signed acknowledgment of receipt | CA | present in draft |
| method of computing commissions stated | CA | present in draft |
| chargeback policy stated in agreement | CA | present in draft |
| clawback trigger defined before payment | all | present in draft |
| clawback tied to a reversible earning event | all | **FAIL** — see below |
| recovery cannot breach minimum wage in a pay period | CA, NY, WA | not modeled — no draw schedule supplied |
| post-termination recovery | all | disabled in draft (`post_termination: false`) |

This is a checklist for counsel, not a legal opinion. It reports which items the draft addresses and which it does not.

## 6. What to change

- **Clawback reversibility.** The inputs file sets `earning_event: booking` and a clawback trigger of customer non-payment within 90 days of invoice. Those describe different events: the commission is earned when the deal is booked, and non-payment happens downstream of an earning event that never depended on collection. Either move `earning_event` to `cash_collected`, or narrow the trigger to contract cancellation before invoice. As drafted this is the condition most likely to fail if a recovery is challenged.

- **The median rep earns 154,900 against a 200,000 OTE**, while the plan spends 650,000 less than the approved budget. The curve is not the cause. At a 61% median attainment, no defensible quota-to-OTE ratio pays the median rep target — quota would have to drop to roughly 590,000, a 3.0x ratio, to put the median at 100%. The proposed 960,000 quota against a 200,000 OTE is 4.8x. Fix the input (coverage, territory, ramp) or accept that this plan pays half the team 77% of OTE and say so at hire rather than in month nine.

- **Minimum-wage floor is unmodeled** because no draw was supplied. With `draw.type: none` the base alone clears the floor in every listed state, so this is informational — but if a recoverable draw is added later, the 25%-per-pay-period recovery cap has to be re-checked against it.

- **Cost leverage of 43% across 20 points** is a real exposure in a good year. It is defensible; it should be a decision somebody makes in December rather than a surprise in Q3.
