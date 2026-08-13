---
name: ai-sdr-pilot-scorecard
description: Scores a finished or in-flight AI SDR / GTM-agent pilot against criteria registered before the pilot started, and emits a keep / kill / extend memo. Computes fully-loaded cost per qualified meeting, reply-to-meeting conversion split by reply polarity, human rework hours, and sending-reputation delta. Refuses to score against amended criteria or below the registered minimum sample. Use at the end of a time-boxed pilot, before the contract auto-renews.
---

# AI SDR pilot scorecard

## When to invoke

Invoke when a time-boxed AI SDR or GTM-agent pilot reaches its end date, or at a mid-pilot checkpoint the pre-registration named. Production patterns:

- **End-of-pilot decision.** Run once, 14 days after the last send, with the full export. The 14-day tail exists because meetings booked in the final week have not yet held, and reputation damage lands after the sending stops.
- **Mid-pilot checkpoint.** Run at the halfway mark against the same registered criteria, with `checkpoint: true`. The skill returns axis-level readings and an explicit `no_verdict` — a mid-pilot run is for catching a reputation breach early, not for deciding.
- **Renewal review on a running deployment.** Treat the trailing 90 days as the pilot window. This is the only mode where a pre-registration written after the fact is acceptable, and the memo says so on its face.

Do NOT invoke this skill for:

- **A pilot with no pre-registration.** The skill returns `no_preregistration` and stops. Scoring criteria chosen after seeing the results is the failure this skill exists to prevent — writing them now and backdating them produces a worse artifact than no memo at all. The exception is the renewal-review mode above, which stamps the memo accordingly.
- **A pilot below the registered minimum sample.** Returns `insufficient_sample` with the observed and required counts. A six-week pilot that produced 9 held meetings cannot distinguish a 4% reply-to-meeting rate from a 7% one, and a verdict computed on it is noise wearing a decimal point.
- **Choosing between two vendors.** This skill scores one deployment against a threshold, not two against each other. A head-to-head needs both running on comparable segments with a shared exclusion list, which is a different design.
- **A fully human SDR team's quarterly review.** The cost model assumes a per-lead or per-contact meter and a human-rework line that does not exist in the same shape for a headcount-based team.

## Inputs

Required:

- `preregistration` — object. The parsed contents of the pre-registration file written before the pilot started. Required shape: `{ registered_at, window_start, window_end, min_held_meetings, thresholds: { max_cost_per_qualified_meeting, min_reply_to_meeting_rate, max_rework_hours_per_meeting, max_spam_rate }, exclusion_rules, qualification_gate }`.
- `preregistration_sha256` — string. SHA-256 of the pre-registration file as committed. The skill recomputes it and refuses to score on a mismatch.
- `meetings` — array. One entry per meeting the vendor or your CRM attributes to the pilot: `{ account_id, booked_at, held, held_at, stage_at_plus_30d, prior_human_touch_at, open_opp_at_booking, source_claimed_by }`.
- `costs` — object. All five cost lines, in the currency of the contract: `{ subscription, data_and_enrichment, sending_infrastructure, implementation_amortized, human_rework_hours }`. A `null` in any line is a hard rejection, not a zero.
- `loaded_hourly_rate` — number. Fully-loaded cost of an hour of the human doing the rework. Used to price `human_rework_hours`.
- `replies` — array. `{ account_id, replied_at, polarity, labeled_by }` where `polarity` is `positive` / `negative` / `out_of_office` / `unsubscribe_request` and `labeled_by` is `vendor_classifier` or `human`.
- `reputation` — object. `{ baseline_window, pilot_window, tail_window }`, each `{ spam_rate, domain, daily_volume_peak }` read from Google Postmaster Tools or the equivalent for your recipient mix.

Optional:

- `checkpoint` — boolean. Default `false`. When `true`, the skill computes the axes and returns `no_verdict`.
- `reply_label_audit` — array. A stratified human-labeled sample of replies, used to compute the vendor classifier's precision on `positive`. Without it the skill discounts vendor-labeled positives by the documented default and says so in the memo.
- `counterfactual` — object. `{ meetings_held, window }` from a matched human-SDR segment or the same segment's prior period. Turns the memo's incremental-lift section from a caveat into a number.

## Reference files

Load these from `references/` before first run. All four are stable within a deployment.

- `references/1-preregistration-template.md` — the file the team fills in **before** the pilot starts. Contains the four thresholds with the reasoning for each default, the exclusion-rule scaffolding, and the qualification-gate definition.
- `references/2-cost-model.md` — the five cost lines, what belongs in each, and the amortization rule for implementation fees. Contains a worked example against a published vendor price.
- `references/3-metric-definitions.md` — exact definitions and the arithmetic for each axis, including the reply-polarity split and the reputation window construction.
- `references/4-sample-memo.md` — a literal `kill` memo and a literal `keep` memo, plus the structured-field contract for parsers.

## Method

Run these steps in order. Steps 1 and 2 gate everything after them.

### 1. Pre-registration integrity check

Recompute SHA-256 over the `preregistration` object as serialized in the template's canonical form and compare to `preregistration_sha256`. On mismatch, return `result: criteria_amended` with a diff of the changed threshold fields — do not score. On a missing pre-registration, return `result: no_preregistration`.

The hash is the whole point of the step. Criteria drift is not usually dishonest; it is a threshold quietly softened in a doc three weeks into a pilot that is not going well, by someone who has already started to believe. A hash makes the softening a visible event rather than an invisible one.

Also verify `registered_at` precedes `window_start`. A pre-registration written after the first send is not a pre-registration; flag it as `retrospective: true` and carry that flag onto the memo.

### 2. Sample-adequacy gate

Count meetings that pass both the exclusion rules and the qualification gate. If the count is below `min_held_meetings`, return `result: insufficient_sample` with observed and required counts, and a note on how many more weeks at the observed rate would reach it. Do not return a verdict.

This gate is upstream of the economics for a reason. Cost per qualified meeting on a denominator of 7 moves by more than 14% every time one meeting is added or removed, which is wider than the gap most kill thresholds are set at.

### 3. Attribution filtering

Apply the exclusion rules from the pre-registration to every entry in `meetings`. The defaults in the template exclude a meeting when any of these holds:

- `open_opp_at_booking` is true — the account already had an open opportunity.
- `prior_human_touch_at` falls inside the 90 days before `booked_at`.
- The account appears on a named-account list the pre-registration excluded.

Excluded meetings are removed from the numerator entirely, not discounted by a factor. A discount is a judgment call that gets negotiated; a rule is a rule. Report the excluded count and the exclusion reason distribution — the ratio of excluded to included is itself a finding, and a vendor whose attributed meetings are 40% already-open accounts is telling you something about its sourcing.

### 4. Qualification gate

Apply `qualification_gate` from the pre-registration to the surviving meetings. The template default requires both `held` is true and `stage_at_plus_30d` has advanced past the initial stage. Booked-but-no-show meetings count as zero and stay out of the numerator; they are still counted separately and reported, because a high no-show rate on a healthy booking rate is a targeting problem the cost figure would otherwise hide.

### 5. Cost assembly

Sum the five lines from `costs`, pricing `human_rework_hours` at `loaded_hourly_rate`. Reject the run with `result: incomplete_cost_model` if any line is `null`.

Divide by the qualified-meeting count from step 4 to get fully-loaded cost per qualified meeting. Report the same figure computed on subscription alone, labeled as the vendor-facing number, so the memo shows both and the gap between them is legible. That gap is the argument.

### 6. Reply-to-meeting conversion, split by polarity

Compute replies per contacted account, then meetings per reply. Split the reply count by `polarity`. A `negative` reply and an `unsubscribe_request` are not conversion opportunities and must not sit in the same denominator as a `positive` one — collapsing them is how a reply-rate chart stays flat while the underlying list burns.

Where `labeled_by` is `vendor_classifier` and `reply_label_audit` is supplied, compute the classifier's precision on `positive` and multiply the vendor-labeled positive count by it. Where the audit is absent, apply the documented discount from `references/3-metric-definitions.md` and mark the figure `unaudited` in the memo.

### 7. Reputation delta

Compare `spam_rate` across the three windows. Two independent readings:

- **Trend.** Pilot and tail against baseline, on the same domains.
- **Absolute line.** Whether any window crossed the bulk-sender complaint threshold your recipient mix is judged against. For Gmail recipients at more than 5,000 messages per day, Google's published requirement is to keep the reported spam rate under 0.30%, with under 0.10% as the recommended operating point.

The tail window is where the damage usually shows. A pilot that ends on day 42 and is scored on day 42 is scored before its own consequences arrive.

**This axis is a hard stop, evaluated independently of the economics.** If the tail window crossed the absolute line, the verdict is `kill` regardless of cost per meeting, and the memo says the pilot was cheap because it was spending an asset that is not on the pilot's ledger — the deliverability of every mailbox in the company.

### 8. Verdict assembly

Compare each axis against its registered threshold and return one verdict:

- `keep` — every axis inside threshold.
- `extend` — at most one axis outside threshold, the reputation axis inside its hard stop, and the observed trend on the failing axis improving across the pilot window. The memo names the single axis and the specific reading that would make it a `keep`.
- `kill` — the reputation hard stop was crossed, or two or more axes are outside threshold, or one axis is outside threshold with a flat or worsening trend.
- `no_verdict` — `checkpoint: true`.

The `extend` verdict is deliberately narrow. A verdict of `extend` available on any failing configuration is not a verdict, it is a way of never deciding, and it is the outcome pilots default to when nobody wrote the thresholds down.

## Output format

Literal JSON the skill emits for a `kill` verdict:

```json
{
  "verdict": "kill",
  "result": "ok",
  "retrospective": false,
  "window": { "start": "2026-05-04", "end": "2026-06-15", "tail_end": "2026-06-29" },
  "sample": {
    "meetings_attributed": 34,
    "excluded": 11,
    "exclusion_reasons": { "open_opp_at_booking": 7, "prior_human_touch_90d": 4 },
    "held": 19,
    "qualified": 12,
    "min_required": 12
  },
  "axes": [
    {
      "axis": "cost_per_qualified_meeting",
      "observed": 1042.00,
      "threshold": 750.00,
      "status": "outside",
      "trend": "flat",
      "subscription_only_figure": 433.33,
      "note": "Vendor-facing figure omits 71 rework hours and the enrichment line."
    },
    {
      "axis": "reply_to_meeting_rate",
      "observed": 0.061,
      "threshold": 0.050,
      "status": "inside",
      "trend": "improving",
      "positive_replies_audited": false,
      "note": "Vendor-classifier positives discounted by the default factor; no reply_label_audit supplied."
    },
    {
      "axis": "rework_hours_per_qualified_meeting",
      "observed": 5.9,
      "threshold": 3.0,
      "status": "outside",
      "trend": "worsening"
    },
    {
      "axis": "reputation_delta",
      "observed_tail_spam_rate": 0.0034,
      "absolute_line": 0.0030,
      "baseline_spam_rate": 0.0008,
      "status": "hard_stop_crossed",
      "note": "Tail window on sending domain crossed the bulk-sender complaint line 11 days after the last pilot send."
    }
  ],
  "counterfactual": null,
  "memo_markdown": "...",
  "run_metadata": {
    "preregistration_sha256": "…",
    "model": "claude-opus-5",
    "definitions_version": "1.0.0"
  }
}
```

A `keep` verdict has every axis at `status: "inside"` and a populated `memo_markdown`. An `extend` verdict has exactly one axis `outside`, `reputation_delta` inside its line, and a `path_to_keep` object naming the required reading. A `no_verdict` response carries populated `axes` and a `null` verdict.

The `memo_markdown` field is the deliverable a human reads. Its structure is fixed in `references/4-sample-memo.md` — decision first, the axis that drove it second, the arithmetic third, and what would change the answer last.

## Watch-outs

- **Criteria drift mid-pilot.** The most common way a pilot survives is that its kill line moves. **Guard:** step 1 hashes the pre-registration and refuses to score against an amended one, returning a field-level diff instead of a verdict. Amending is allowed — the team re-registers with a new hash, and the memo carries `retrospective: true` forever after.
- **Attribution inflation.** Vendors count meetings on accounts that were already in cycle or already human-touched. **Guard:** step 3 removes them from the numerator by rule rather than discounting them by negotiation, and reports the excluded count and reason distribution as a finding in its own right.
- **The subscription-only denominator.** Cost per meeting computed on the license price alone reliably understates the real figure, because the rework hours and the enrichment meter are the lines nobody put on the pilot budget. **Guard:** step 5 rejects the run when any of the five cost lines is `null`, and the memo prints the vendor-facing figure next to the loaded one so the gap is visible rather than arguable.
- **Reputation damage arriving after the scoring date.** Complaint-driven filtering degrades on a lag, so a pilot scored on its end date is scored before its cost lands. **Guard:** the tail window is mandatory, and the reputation axis is a hard stop evaluated independently of the economics — it can kill a pilot that cleared every cost threshold.
- **Vendor-classified positive replies.** "Positive reply" labeled by the system being evaluated is a self-graded exam. **Guard:** step 6 computes classifier precision against `reply_label_audit` when supplied and applies the documented discount when it is not, marking the figure `unaudited` on the memo rather than silently trusting it.
- **A verdict on a sample too small to carry one.** **Guard:** step 2 gates on the registered minimum and returns `insufficient_sample` — with the weeks-to-adequacy estimate — rather than a confident number computed on nine meetings.
- **`keep` read as "scale".** The skill scores the pilot's configuration at the pilot's volume. Send volume is the input most likely to break the reputation axis, and a `keep` at 2,000 contacts per month is not a `keep` at 10,000. **Guard:** the memo's final section states the scored volume explicitly and names re-scoring at the new volume as a condition of any increase.
