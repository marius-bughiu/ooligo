# 3 — Metric definitions

Version `1.0.0`. The skill stamps this version into `run_metadata.definitions_version`. Change the version when you change a definition, so two memos with different arithmetic are never silently compared.

## Axis 1 — Cost per qualified meeting

```
cost_per_qualified_meeting = total_cost / qualified_meetings
```

`total_cost` is the sum of the five lines in `2-cost-model.md`, with `human_rework_hours × loaded_hourly_rate` substituted for line 5.

`qualified_meetings` is the count surviving both the exclusion rules and the qualification gate. Booked-but-not-held meetings are excluded from the denominator and reported separately as `held_rate`.

Also emit `subscription_only_figure = subscription / qualified_meetings`. This is the vendor-facing number. It is not a competing estimate — it is the same arithmetic on a narrower cost basis, and printing both is how the memo makes the basis visible instead of arguable.

## Axis 2 — Reply-to-meeting rate

```
reply_to_meeting_rate = qualified_meetings / positive_replies
```

Not meetings per reply. `positive_replies` counts only `polarity: positive`. A `negative`, `out_of_office`, or `unsubscribe_request` reply is not a conversion opportunity, and pooling them into one denominator is how a reply-rate line stays flat while the list is being burned. Report all four polarity counts on the memo, and report `unsubscribe_request` prominently — a rising unsubscribe count against a flat positive count is the leading indicator for axis 4.

### Classifier discount

When `labeled_by: vendor_classifier` and `reply_label_audit` is supplied:

```
adjusted_positive_replies = vendor_positive_count × classifier_precision
```

where `classifier_precision` is the fraction of a human-labeled stratified sample that the classifier called `positive` and a human agreed was positive. Sample at least 50 replies, stratified across the window so a mid-pilot prompt change does not sit entirely inside or outside the sample.

When no audit is supplied, apply `default_classifier_discount = 0.80` and mark the axis `unaudited` on the memo. This default is a convention this file sets so that runs are comparable to each other, not a measured industry figure — it is deliberately conservative because the classifier is a component of the system under evaluation and the direction of its error is not neutral. Any deployment that runs this skill more than once should replace it with its own audited precision and note the change here.

## Axis 3 — Rework hours per qualified meeting

```
rework_hours_per_qualified_meeting = human_rework_hours / qualified_meetings
```

Trend matters as much as level. Compute it per week across the window and report the direction. Rework hours falling week over week means the team is learning the tool, and a level above threshold with a falling trend is the canonical `extend` case. Rework hours flat or rising means the tool is not converging, and the same level with a rising trend is a `kill`.

## Axis 4 — Reputation delta

Three windows, same domains throughout:

- `baseline_window` — the 30 days ending the day before `window_start`.
- `pilot_window` — `window_start` to `window_end`.
- `tail_window` — `window_end + 1` to `window_end + tail_days`, default 14 days.

Two independent readings:

**Trend.** `pilot_spam_rate - baseline_spam_rate` and `tail_spam_rate - baseline_spam_rate`. A baseline near zero and a tail at 0.0018 has not crossed any line and has still moved by more than a factor of two, which is a finding.

**Absolute line.** Whether any window crossed `thresholds.max_spam_rate`. For a Gmail-heavy recipient mix at more than 5,000 messages per day, Google's published requirement is that senders keep the spam rate reported in Postmaster Tools under 0.30%, with under 0.10% recommended so that an ordinary spike does not reach 0.30%. The template therefore sets 0.0030 as the hard stop and suggests 0.0010 as the working threshold for Gmail-heavy lists.

The tail window is mandatory because complaint-driven filtering degrades on a lag. A pilot scored on its last send date is scored before its own consequence arrives, which is why the default end-of-pilot run is 14 days after the last send rather than on the end date.

**This axis is a hard stop.** Crossing the absolute line in any window produces `kill` regardless of every other axis. The reason is that the cost is not on the pilot's ledger: sender reputation is shared across everything the company sends from those domains, including invoices, renewals, and support replies, and a pilot cannot spend it and call the saving a result.

## Denominators, stated once

- Contacted accounts: distinct accounts that received at least one agent-sent message inside the window.
- Replies: distinct accounts that replied at least once. A second reply from the same account does not add to the count.
- Meetings: distinct scheduled events. A reschedule is the same meeting; a second meeting on the same account inside 30 days is the same meeting.
- Qualified meetings: meetings surviving exclusion rules and the qualification gate.

Every rate on the memo names its denominator. A rate without a stated denominator is the format in which most pilot results are reported and the reason most of them cannot be compared to anything.

## Counterfactual

Optional and worth the effort. Cost per qualified meeting answers "what did this cost", not "what did this add". With a `counterfactual` object from a matched human-SDR segment or the same segment's prior period:

```
incremental_meetings = qualified_meetings - counterfactual_meetings_held_normalized
```

normalized to the same account count and window length. Where it is absent, the memo states explicitly that the figure is total, not incremental, and that a `keep` verdict therefore rests on the assumption that the meetings would not have happened otherwise. Say it plainly rather than letting the reader assume incrementality — that assumption is the one most often wrong and least often written down.
