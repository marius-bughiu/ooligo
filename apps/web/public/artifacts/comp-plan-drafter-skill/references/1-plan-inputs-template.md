# Plan inputs

Replace the example values with yours. Everything here describes the plan you want drafted and the constraints it has to live inside. The skill drafts the curve; it does not invent the OTE, the headcount, or the states your reps work in.

## Role and scope

```yaml
plan_year: 2027
plan_start: 2027-01-01
role: "Mid-Market Account Executive"
segment: "mid-market"           # smb | mid-market | enterprise | strategic
headcount: 34                   # quota-carrying heads in this plan at plan start
currency: USD
plan_status: draft              # draft | socialized | in_market
```

`plan_status` changes the tone of the report, not the arithmetic. Once a plan is `socialized`, a recommendation to change the curve carries a communication cost as well as an effort cost, and the report says so in the header rather than leaving the leader to discover it in the meeting.

## Target compensation

```yaml
target_ote: 200000
pay_mix:                        # must sum to 100
  base_pct: 50
  variable_pct: 50
market_ote_reference: 200000    # what you believe the market pays this role
market_ote_source: "Bridge Group 2026 AE Metrics, median OTE 200,000"
```

`market_ote_reference` is what the decile table compares against when it flags a plan priced below market. Set it from a survey you actually hold, and name the source — if it is a guess, say so in `market_ote_source`, because the retention flag is only as good as this number.

## Quota

```yaml
proposed_quota: 960000          # annual, per fully-ramped rep
prior_plan_quota_median: 850000 # last year's median assigned quota
quota_shift_tolerance_pct: 15   # warn above this much movement
```

The tolerance exists because the attainment history you supply was produced under `prior_plan_quota_median`. Move the quota far enough and the distribution stops predicting the new plan's cost. The skill will still model it; it will label the output directional.

## Curve

Give the shape you want drafted. Leave any field as `propose` and the skill drafts that piece; pin the ones that are already decided.

```yaml
curve:
  threshold_pct: 50             # no commission below this attainment
  target_rate: 1.0              # multiplier between threshold and 100%
  accelerators:
    - from_pct: 100
      to_pct: 130
      rate: propose
    - from_pct: 130
      to_pct: null              # null = uncapped
      rate: propose
  decelerator: none             # none | {below_pct, rate}
  cap: none                     # none | a dollar figure
```

Uncapped is a real decision, not a default. A cap protects the budget against a single outsized deal and reliably produces the sandbagging it was written to prevent; the cost table's high case is where you should look before choosing.

## Components

Keep this at three or fewer. A fourth component almost always shows up in the modeled-dollars column carrying a rounding error's worth of pay and a meaningful share of rep attention.

```yaml
max_components: 3
components:
  - name: commission
    metric: closed_won_arr      # the thing you want more of
    weight_pct: 90              # share of the variable half
  - name: new_logo_spif
    metric: new_logo_multiyear
    weight_pct: 10
    expiry: 2027-06-30          # required — a SPIF with no expiry is a rate increase
```

## Earning event and clawback

```yaml
earning_event: booking          # booking | invoiced | cash_collected
clawback:
  trigger: "customer non-payment within 90 days of invoice"
  recovery_method: "offset against future commission, max 25% per pay period"
  post_termination: false
```

`earning_event` and `clawback.trigger` have to describe the same thing. Earning on `booking` while recovering on churn is the mismatch the policy check is looking for: the plan is trying to reverse something the earning event never depended on.

## Policy constraints

```yaml
rep_work_states: [CA, NY, TX, WA, IL]
draw:
  type: none                    # none | recoverable | non_recoverable
  amount_monthly: 0
dispute_policy:
  response_window_days: 15
  escalation: "RevOps → VP Sales → CFO"
budget_ceiling: 3060000         # total approved variable comp for the plan year
min_history_reps: 12
sensitivity_band_pct: 10
```

The state list drives the policy checklist. It is not legal advice and the skill does not pretend otherwise — it produces the items counsel needs to see, marked against the draft, so the review is a review rather than a discovery exercise.
