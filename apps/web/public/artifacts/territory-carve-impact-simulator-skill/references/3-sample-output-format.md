# Sample output format

The exact Markdown the skill emits. Downstream consumers parse this shape — a Slack digest that reads the verdict line, a planning deck that lifts the three tables. Keep the heading text and column order stable; add columns at the right if you extend it.

Numbers below are illustrative. The values are internally consistent so you can check a renderer against them.

---

# Territory carve simulation — FY27 Enterprise realignment

snapshot_date: 2026-08-10 | effective_date: 2026-11-01 | re-run by: 2026-08-24
carve_status: draft | routing_engine: salesforce-territory-management
accounts evaluated: 4,812 | territories: 22 | reps: 31
thresholds last_reviewed: 2026-08-10

## Verdict: revise

Coverage is clean. Two territories breach the capacity floor, and one protected account moves to a rep who will be in month two on the effective date. Fixing both is a quota reallocation and a single carve-out, not a redesign.

## 1. Coverage

| bucket | accounts | cause | detail |
|---|---|---|---|
| assigned | 4,798 | — | matched rules 1-8 |
| unassigned | 9 | no_rule_matched | BillingState outside the five listed regions |
| unassigned | 5 | null_input_field | Account.Industry is null |
| empty territories | 0 | — | — |

**Rule match distribution.** Rule 4 (`MM-WEST`) absorbed 1,204 accounts, of which 387 reached it only because `Account.AnnualRevenue` was null and they skipped rules 2 and 3. That is a data gap presenting as a segmentation decision: those 387 accounts are being routed to mid-market by default, not by design. Backfill revenue on them before the effective date or accept that mid-market inherits an unknown number of enterprise-sized accounts.

## 2. Quota capacity

Ramp-adjusted capacity at the effective date, against assigned quota. Shortfall flags at more than 10% below assigned quota per the thresholds file.

| territory | reps | assigned quota | ramp-adj. capacity | gap | flag |
|---|---|---|---|---|---|
| ENT-WEST-1 | 2 | 3,800,000 | 3,910,000 | +110,000 | ok |
| ENT-WEST-2 | 2 | 4,200,000 | 2,940,000 | -1,260,000 | shortfall |
| ENT-EAST-1 | 3 | 5,100,000 | 5,340,000 | +240,000 | ok |
| ENT-EAST-2 | 2 | 3,600,000 | 3,120,000 | -480,000 | shortfall |
| MM-WEST | 6 | 6,600,000 | 6,720,000 | +120,000 | ok |

ENT-WEST-2 carries two reps with quota-carrying start dates in September 2026, putting both at month two on 2026-11-01 — a 0.05 ramp factor each. The territory is assigned 4.2M against an effective capacity of 2.94M. The account count is balanced against ENT-WEST-1; the capacity is not, which is what an account-count-balanced carve hides.

## 3. Named-account churn

Ranked by weighted disruption: material open pipeline multiplied by a tenure factor. Accounts on the protected list appear regardless of rank.

| account | from | to | material open pipeline | tenure (mo) | weighted | flag |
|---|---|---|---|---|---|---|
| Northwind Traders | A. Okafor | J. Reyes (ramp m2) | 890,000 | 41 | 890,000 | protected |
| Fabrikam Industrial | A. Okafor | S. Baptiste (ramp m3) | 620,000 | 33 | 620,000 | review |
| Contoso Fabrics | L. Zhang | S. Baptiste (ramp m3) | 410,000 | 18 | 307,500 | review |
| Tailspin Logistics | L. Zhang | M. Osei | 280,000 | 9 | 105,000 | ok |

**Aggregate.** 214 accounts change owner. 178 of them carry no open pipeline and no closed-won in the prior year — those are free to move. The four rows above account for 71% of total weighted disruption, which is the useful framing: this carve is not risky in general, it is risky for four accounts.

**Per-territory revenue churn.** ENT-WEST-2 sees 31% of its prior-year closed-won revenue change owner, against a 25% tolerance. ENT-WEST-1 sees 12%. No other territory exceeds 20%.

## 4. What to change

- **ENT-WEST-2 capacity.** A 1.26M gap against a 4.2M quota. Move roughly 1.2M of quota to ENT-EAST-1 and MM-WEST, which both have headroom, or grant a documented ramp allowance for the two September starters. Leaving it as drafted sets two new reps against a number the model says they cannot reach.
- **ENT-EAST-2 capacity.** A 480K gap, inside a single rep's band. One account-set adjustment closes it.
- **Northwind Traders.** On the protected list, 890K of material pipeline, 41 months of tenure with the current owner, receiving rep in month two. Carve it out of the realignment or delay the transfer one quarter.
- **Fabrikam Industrial.** Not protected, but the same shape. Worth an explicit decision rather than an implicit one.
- **387 null-revenue accounts routing to mid-market.** Backfill `Account.AnnualRevenue` before 2026-11-01 or re-run after the backfill; the mid-market capacity number above assumes they belong there.

## 5. Re-run conditions

Re-run this simulation if any of the following happens before the effective date:

- The carve rules change or are reordered.
- The roster changes (a start date moves, a rep leaves, a req is filled).
- 2026-08-24 passes without the carve shipping — the CRM snapshot exceeds the 14-day staleness floor.
- The null-revenue backfill completes.
