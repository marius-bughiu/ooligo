---
name: expansion-signal-detection
description: Weekly account-portfolio scan that fuses CSM-call mentions with usage anomalies, classifies expansion intent into weak vs strong signals, and emits a per-CSM ranked digest mapping each signal to a likely upsell SKU and a next-best action. Read-only — never contacts customers, never auto-creates Gainsight CTAs.
---

# Expansion-signal detection

## When to invoke

Run once a week (typically Monday morning, before the CSM team's weekly account review) to scan the trailing 7 days of CSM calls and usage events across the customer portfolio. Output is a ranked digest per CSM owner, sized for a 5-minute pre-meeting read.

Do NOT invoke this skill for:

- Auto-emailing customers, auto-creating Gainsight CTAs, or any outbound action. The skill is read-only signal — humans decide which account to actually approach.
- Real-time alerting on individual events. Per-event pings flood CSMs and erode trust in the channel within two weeks. The weekly cadence is deliberate.
- Sales-call analysis (new logos, prospecting). The signal taxonomy here assumes existing customers with a baseline of usage and a named CSM. Use the AE call-coach skill instead.
- Replacing a usage-anomaly detection system. The skill consumes pre-computed anomalies; it does not detect them. If Gainsight isn't already firing usage-spike events, fix that first.
- Forecasting expansion ARR. The output is per-account intent signal, not a number a finance team should plug into a forecast.

## Inputs

- Required: `accounts` — JSON array with `id`, `name`, `arr`, `segment` (e.g. `enterprise` / `mid-market` / `smb`), `tier` (current SKU tier), `owner_email`, `renewal_date`.
- Required: `calls` — JSON array of CSM call records for the trailing window. Each record needs `account_id`, `call_id`, `occurred_at`, `transcript_url` or `transcript_text`, `attendees` (with `is_customer` flag and role/title where known).
- Required: `usage_events` — JSON array of usage anomalies emitted by Gainsight (or your usage-warehouse equivalent) for the same window. Each event needs `account_id`, `event_type` (e.g. `feature_first_use`, `seat_count_spike`, `api_call_spike`, `tier_gated_feature_attempt`), `metric_name`, `value_current`, `value_baseline`, `delta_pct`, `occurred_at`.
- Required: `support_tickets` — JSON array of recent tickets with `account_id`, `subject`, `body_summary`, `tags`, `opened_at`. Used to spot integration / capability questions tied to premium SKUs.
- Optional: `stakeholder_changes` — JSON array of org-chart events (`account_id`, `change_type` of `new_hire` / `promotion` / `departure`, `role`, `is_champion`, `occurred_at`). Used to suppress signals contaminated by champion churn (see watch-outs).
- Optional: `window_days` — lookback window. Defaults to 7. Going shorter than 7 typically yields too few signals per account to classify; going longer than 14 stale-dates the next-best action.
- Optional: `cap_per_csm` — maximum signals surfaced per CSM in the digest body. Defaults to 3. Overflow is summarized as a count.

## Reference files

Read these from `references/` before running. They encode the team's taxonomy and per-segment baselines — without them the output is generic "this account is engaged" filler.

- `references/1-expansion-signal-taxonomy.md` — the SKU-to-trigger mapping. Each upsell SKU lists the call phrases, usage patterns, and ticket topics that count as evidence, plus weak-signal vs strong-signal cutoffs.
- `references/2-segment-baseline-config.md` — per-segment baselines for usage anomalies (a 30 percent week-over-week jump means something different for an SMB on 5 seats than an enterprise on 500). The skill rejects anomalies that exceed the absolute threshold but fall inside the segment's noise band.
- `references/3-action-library.md` — the next-best-action library the skill maps signals to. Each action is a verb plus a named artifact (a meeting, a doc, a person), not a vague "follow up."

## Method

Run these six steps in order. Do not parallelize: classification depends on aggregation, routing depends on classification.

### 1. Per-account evidence collection

For each account in `accounts`, gather every record from `calls`, `usage_events`, and `support_tickets` within `window_days`. Drop accounts with zero records — silence is not a signal here, and an empty entry in the digest dilutes the ranked list. Record the count of dropped accounts for the footer so the team can see coverage.

### 2. Per-segment baseline filtering

For each `usage_event`, look up the account's `segment` in `references/2-segment-baseline-config.md` and fetch the baseline noise band (typically expressed as a two-sigma range around the segment median for that metric). Discard events whose `delta_pct` falls inside the noise band even if the absolute value crossed the emitter's threshold.

The reason for per-segment baselines (rather than a single global threshold): a 30 percent week-over-week seat jump is meaningful noise for an SMB account that adds 1-2 seats normally, and meaningful signal for an enterprise account on a flat 500-seat plan. A single global threshold guarantees the SMB band drowns out the enterprise band. Per-segment baselines are auditable — when a CSM lead disagrees with the cutoff, they edit one row in the config rather than tuning a hidden constant.

### 3. Signal extraction from calls and tickets

For each call transcript and ticket body in scope, run an extraction prompt that scans for the trigger phrases listed in `references/1-expansion-signal-taxonomy.md`. Each match is logged with the SKU it maps to, the verbatim quote, the speaker (with `is_customer` filter — coach mentions don't count), and the `call_id` or `ticket_id` it came from.

Negative-example guard: the prompt explicitly enumerates phrases that look adjacent but mean the opposite ("we're thinking about leaving," "your enterprise tier is too expensive," "we'd consider expanding if X were true" — conditional, not committed). These are classified as `not_signal` rather than dropped silently, so the diagnostics in step 6 can show how often the negative-example layer fired.

### 4. Weak-signal vs strong-signal classification

For each per-account candidate signal, classify into one of three buckets using the cutoffs in `references/1-expansion-signal-taxonomy.md`:

- **Strong** — at least one corroborating call mention plus at least one corroborating usage event for the same SKU within the window. These get routed to the per-CSM digest as ranked entries.
- **Weak** — call mention OR usage event alone, OR both but for different SKUs. These get aggregated into a per-CSM "weak signals worth a glance" footer with a count and a link, never as ranked entries.
- **Insufficient** — fewer than the cutoff above. Recorded for the diagnostics footer; not surfaced per-CSM.

The reason for weak-vs-strong split rather than a single score-and-rank: routing differs. A strong signal warrants a CSM sending a meeting invite this week. A weak signal warrants the CSM glancing during their normal account review. Putting weak signals in the ranked list trains the CSM to ignore the ranked list.

### 5. Per-CSM routing and prioritization

Group strong signals by `owner_email`. Within each owner's list, sort by ARR descending, breaking ties by `renewal_date` ascending (closer renewals first — expansion plus a near-term renewal is more actionable than expansion in month 11 of a 24-month deal). Apply `cap_per_csm` to the strong list. If the cap drops signals, surface them only as a count in the weak-signals footer for that CSM.

### 6. Action mapping and emit

For each surfaced strong signal, look up the SKU and signal pattern in `references/3-action-library.md` and attach the matching next-best action. If no action is found, output `needs human review` rather than synthesizing one. Vague suggested actions are the failure mode that erodes trust fastest — better silence than noise.

Render to the layout in the Output format section below. Emit one file per CSM owner (not one combined file) so the digest can be delivered as a personal Slack DM rather than a public channel post that creates implicit social pressure.

## Output format

```markdown
# Expansion-signal digest — {YYYY-MM-DD} — {CSM name}

Window: trailing {window_days} days · Strong signals: {n_strong} · Weak signals: {n_weak}

## Strong signals — act this week

### 1. {Account name} — ${ARR}k ARR · renewal {renewal_date}
SKU: {target_sku}
Call evidence:
> "{verbatim quote}" — {speaker_name}, {role}, {call_date} ({call_id})
Usage evidence: {metric_name} went from {value_baseline} to {value_current} ({delta_pct} over {n} days, segment-baseline-adjusted)
Action: {verb + named artifact, from action library}

### 2. {Account name} — ...

## Weak signals — worth a glance ({n_weak})

- *{Account name}* — {SKU}: {one-line summary, e.g. "call mention only, no usage corroboration"}
- *{Account name}* — {SKU}: {one-line summary}
- (+{n_overflow} more capped from strong list — see footer)

## Diagnostics
- Accounts in scope: {n_total}
- Accounts with zero records (dropped): {n_silent}
- Negative-example matches (suppressed): {n_negative}
- Champion-departure suppressions: {n_champion_suppressed}
- Taxonomy file hash: {first_7_chars_of_sha256}
```

## Watch-outs

- **False-positive flooding.** When the call-extraction prompt is loose, it surfaces "showed interest" mentions that don't actually predict expansion, and the CSM's strong-signal list bloats to 10+ per week. Guard: enforce `cap_per_csm` strictly, and if any single CSM's strong list exceeds the cap on three consecutive runs, prepend a `_Strong-signal threshold may be too loose — last 3 runs averaged {n} per week. Consider tightening the strong-vs-weak cutoff in references/1-expansion-signal-taxonomy.md._` warning. Do not silently truncate without flagging.
- **Signal-weighting drift.** Trigger phrases and SKU mappings go stale as the product changes. A new SKU that launched two months ago has zero entries in the taxonomy until someone adds them, and every signal for it is silently mis-routed. Guard: include the SHA-256 (first 7 chars) of `references/1-expansion-signal-taxonomy.md` in the diagnostics footer. If the file hasn't been touched in 90 days, prepend `_Taxonomy last edited 90+ days ago. Time to recalibrate against the current SKU lineup._`
- **Champion-departure misclassification.** A spike in usage right after the named champion leaves is an expansion-risk signal, not an expansion-intent signal — the new owner is exploring before deciding whether to keep the contract. Guard: cross-reference every strong signal against `stakeholder_changes`. If a champion on the account departed within the trailing 30 days, downgrade to weak and tag with `_champion-departure suppressed: investigate before pursuing._` The skill must NOT route an expansion ask to an account that just lost its champion.
- **Conditional-mention misclassification.** "We'd consider expanding if you supported X" reads as expansion intent on its face but is in fact a feature-gap report. Guard: the negative- example layer in step 3 explicitly classifies conditional phrases ("if," "would," "considering," "thinking about") as `not_signal`. Diagnostics expose how often this fires — if it never fires the layer is broken; if it fires constantly the SKU mapping needs rephrasing.
- **CSM call-coverage gap.** If CSMs aren't actually logging calls in Gong (or the equivalent), the call half of the signal set is empty and every signal collapses to weak. Guard: at the start of every run, compute `% of accounts with at least one logged call in the window` and prepend the digest with `_CSM call coverage: {pct}% of accounts had at least one logged call. Below 60% means most signals are usage-only._` Below 40%, abort the run with a coverage-error message rather than emit a half-signal digest.
- **Action specificity collapse.** Under load, the model defaults to generic "follow up on opportunity" suggestions. Guard: post- process the Action field with a literal substring check — if the action contains `follow up`, `reach out`, `touch base`, `align`, `socialize`, `engage` without a named person, meeting, or doc, replace with `needs human review`. Action library entries that pass this filter are the only acceptable shape.
