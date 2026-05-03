# Segment baseline config — TEMPLATE

> Replace these baselines with values computed from your actual usage
> warehouse. The skill rejects usage anomalies whose `delta_pct` falls
> inside the segment's noise band even when the absolute value
> crossed the emitter's threshold. Without per-segment baselines,
> SMB noise drowns out enterprise signal.

## How baselines are used

For each `usage_event` ingested, the skill:

1. Looks up `account.segment` in this file.
2. Fetches the noise band (typically two-sigma around the segment median) for the event's `metric_name`.
3. If `delta_pct` falls inside the noise band, the event is discarded as noise even if it crossed the global emitter threshold.
4. If outside the band, the event is kept as a signal candidate and proceeds to the SKU mapping in step 3 of the method.

Edit one row at a time. Watch the next two digests before editing again — baselines that move every week train the team to ignore the output.

## Per-segment baseline table

Replace these placeholder values with values from a 90-day rolling window over your actual usage data.

### Segment: enterprise (example)

Typical: 200-1000+ seats, multi-year contract, dedicated CSM.

| Metric                      | Median weekly delta | Noise band (2σ) | Notes                                       |
|-----------------------------|--------------------:|-----------------|---------------------------------------------|
| `seat_count`                |               +0.5% | ±3%             | Enterprise plans tend to be flat-by-design  |
| `daily_active_users`        |               +1.0% | ±8%             | Vacation-week dips are normal               |
| `api_calls`                 |               +2.0% | ±15%            | Spiky on integration release days           |
| `tier_gated_feature_attempts` |             0    | ±0 (any > 0 is signal) | Crossing into a tier-gate is signal regardless of band |

### Segment: mid-market (example)

Typical: 50-200 seats, annual contract, shared CSM coverage.

| Metric                      | Median weekly delta | Noise band (2σ) | Notes                                       |
|-----------------------------|--------------------:|-----------------|---------------------------------------------|
| `seat_count`                |               +1.5% | ±7%             | Quarterly rollouts can produce one-off jumps |
| `daily_active_users`        |               +2.0% | ±12%            |                                             |
| `api_calls`                 |               +3.5% | ±20%            |                                             |
| `tier_gated_feature_attempts` |             0    | ±0 (any > 0 is signal) |                                  |

### Segment: smb (example)

Typical: 1-50 seats, monthly or annual contract, pooled CSM coverage.

| Metric                      | Median weekly delta | Noise band (2σ) | Notes                                       |
|-----------------------------|--------------------:|-----------------|---------------------------------------------|
| `seat_count`                |               +5.0% | ±25%            | Adding 1-2 seats is week-on-week normal     |
| `daily_active_users`        |               +6.0% | ±30%            | Highly variable                             |
| `api_calls`                 |               +8.0% | ±40%            | Often noisy due to integration tinkering    |
| `tier_gated_feature_attempts` |             0    | ±0 (any > 0 is signal) |                                  |

### Segment: {your_next_segment}

(Add a section per segment in your customer base.)

## Recompute cadence

Recompute the medians and noise bands from your usage warehouse on a quarterly basis. Append to the calibration log below so the next person editing this file can see why the numbers are what they are.

## Calibration log

Format: `YYYY-MM-DD — change — reason`.

- {YYYY-MM-DD} — initial baselines — placeholder, replace with values computed from a 90-day rolling window

## Last edited

{YYYY-MM-DD}
