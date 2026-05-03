# Source-channel ROI definitions — FIXED

> Do not change the math in this file without updating the skill
> simultaneously. Source-attribution drift — where last-week's
> numbers move because someone reconfigured the ATS source picker,
> not because spend or quality actually moved — is the most common
> reason recruiting leaders lose trust in source-channel reporting.
> The point of fixed definitions is reproducibility week-over-week.

## Inputs the skill expects

The optional `source_channel_performance` CSV must have these columns. Missing columns disable the source section rather than fabricate values.

| Column | Type | Definition |
|---|---|---|
| `channel` | string | Source channel name. Must match the `source_channel` enum in the ATS snapshots exactly. |
| `cost_last_week` | number (USD) | Cents-precise cost attributed to this channel for the prior 7-day window. Excludes recruiter salary. |
| `applications` | int | Count of applications received via this channel in the prior 7-day window. |
| `qualified` | int | Count of those applications that passed the recruiter screen (entered `hiring_manager_review` or later). |
| `hired_ytd` | int | Count of hires year-to-date attributable to this channel. Used for the trailing comparison only, not for week-over-week. |

## Definitions (fixed)

### `cost_per_qualified_applicant`

```
cost_per_qualified_applicant = cost_last_week / qualified
```

Use only when `qualified >= 3`. Below that threshold the ratio is noise; the skill writes "n/a (insufficient volume)" and suppresses the comparison line.

### `qualified_rate`

```
qualified_rate = qualified / applications
```

Use only when `applications >= 10`. Below that threshold same as above — write "n/a (insufficient volume)".

### `hire_per_dollar`

```
hire_per_dollar = hired_ytd / sum(cost_last_week, last_52_weeks)
```

This is the trailing-year rollup, computed only when the YTD cost history is available. Used for "is this channel worth renewing?" buy decisions, not for weekly movement.

## Trailing comparison window

All week-over-week percentages compare against the trailing 4-week mean of the same metric, NOT the single prior week. Single-week comparison is dominated by holiday weeks, payroll-funded boost weeks, and one-off events. The 4-week mean smooths those without losing a real shift.

```
delta_vs_mean_pct = (this_week_value − trailing_4wk_mean) / trailing_4wk_mean × 100
```

A channel is flagged for attribution verification when:

```
abs(delta_vs_mean_pct(cost_per_qualified_applicant)) > 25
```

The 25% threshold is what catches real budget shifts and ATS reconfiguration noise, without flagging normal week-to-week jitter. Below 25% the digest reports the number without a flag.

## Source-attribution drift — what the verification step checks

When a channel is flagged, the recruiting-ops owner is asked to confirm before the digest goes out:

1. **Did anyone reconfigure the ATS source picker this week?** If a value was renamed (e.g. "LinkedIn" became "LinkedIn Jobs" while "LinkedIn Recruiter" stayed the same), the apparent shift is a data artefact, not a real change.
2. **Did spend reporting catch up from a prior week?** Some agency invoices land in the wrong week and inflate one week's cost while deflating the next. The skill cannot detect this; the recruiting-ops owner must.
3. **Was there a one-off boost?** Conference sponsorship, paid InMail credit-burn, referral bonus campaign. One-off boosts should be annotated in the digest's notes line, not presented as a sustained shift.

## Channels the skill assumes exist

Edit per stack. The skill validates that the `channel` values in the CSV match this list and warns on any unknown channel.

```yaml
known_channels:
  - linkedin_jobs
  - linkedin_recruiter
  - referrals
  - inbound_career_page
  - niche_board_hn_who_is_hiring
  - niche_board_other
  - agency_firm_a
  - agency_firm_b
  - sourcing_juicebox
  - sourcing_hireez
  - event_sponsorship
  - other
```

## Last edited

<YYYY-MM-DD> — bump on every change to math, thresholds, or the known-channels list. The skill refuses to run if this file is older than 90 days, on the assumption that source-channel definitions need a quarterly review.
