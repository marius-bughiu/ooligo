---
name: churn-risk-summarizer
description: Produce a daily (or weekly) digest of accounts that crossed a churn-risk threshold in the last N hours. Aggregates Gainsight risk-score deltas, recent timeline events, and ARR exposure into a tightly bucketed Slack-ready summary that names the change driver and one specific next action per account.
---

# Churn-risk summarizer

## When to invoke

Run on a schedule (typically 7am local, daily) or on demand to generate a prioritized list of accounts that crossed a churn-risk threshold in the trailing window. Input is a Gainsight account list with risk signals plus recent timeline activity; output is a bucketed digest sized for a CSM team to read in under three minutes.

Do NOT invoke this skill for:

- Triggering automated CSM actions (creating tasks, sending playbook emails, opening cases). The digest is read-only signal — humans decide the next action.
- Any customer-facing communication. Nothing this skill produces is cleared for sending to the customer; treat all output as internal.
- Backfilling historical churn analysis (the prompt is tuned for the trailing 24-168 hours). For longitudinal review, use BI on the Gainsight warehouse instead.
- Risk scoring itself. The skill summarizes scores it is given; it does not compute or reweight them.

## Inputs

- Required: `accounts` — JSON array of account records with at minimum `id`, `name`, `arr`, `risk_score_current`, `risk_score_prior`, `health_score_current`, `health_score_prior`, `owner_email`, `segment`, `renewal_date`.
- Required: `events` — JSON array of timeline events for the same accounts in the trailing window. Each event needs `account_id`, `type` (one of `usage_drop`, `support_escalation`, `sponsor_change`, `qbr_missed`, `nps_detractor`, `contract_renegotiation`, `exec_disengagement`), `severity` (1-5), `occurred_at`, `summary`.
- Optional: `window_hours` — lookback window. Defaults to 24.
- Optional: `min_arr` — drop accounts below this ARR floor. Defaults to 0 (no floor).
- Optional: `segments` — filter to a list of segments (e.g. `["enterprise", "mid-market"]`). Defaults to all.
- Optional: `cap` — maximum accounts to surface in the digest body. Defaults to 15. Overflow goes into a "+N more" link.

## Reference files

Read these from `references/` before generating the digest. They encode the team's risk-weighting opinion and the digest format. Without them, the output is generic.

- `references/1-risk-signal-weights.md` — per-event-type weighting config the skill applies when ranking accounts within a bucket.
- `references/2-sample-digest.md` — the literal Slack-ready digest format the skill emits, with a worked example.
- `references/3-escalation-criteria-thresholds.md` — the bucket thresholds (red / amber / watch) and the rules for when a single signal is enough to escalate by itself.

## Method

Run these five steps in order. Do not parallelize: bucketing depends on aggregation, narrative depends on bucketing.

### 1. Signal aggregation

For each account, collect the trailing-window events from `events`, sort by `occurred_at` descending, and compute a per-account `signal_score` as the sum of `severity * weight` per event using the weights in `references/1-risk-signal-weights.md`. Cap any single event's contribution at 5 — one escalation should not single-handedly dominate the score unless the weights file says so explicitly.

The reason for explicit weighting (rather than letting the model "decide what's important"): weights are auditable. When a CSM lead disagrees with what got surfaced, they can edit one number in the weights file. A per-run model judgment cannot be edited.

### 2. Threshold-based bucketing

Apply the thresholds in `references/3-escalation-criteria-thresholds.md` to assign each account to exactly one bucket:

- **Red** — risk_score crossed the explicit churn-risk line, OR signal_score >= the red threshold, OR a single event is on the always-escalate list (e.g. `exec_disengagement` at severity 5).
- **Amber** — health_score dropped by more than the amber delta, OR signal_score is between amber and red.
- **Watch** — any other accounts that crossed *into* the band but do not meet amber criteria.

If `min_arr` or `segments` filters drop an account below the floor, exclude it from all buckets — but record the count for the footer.

### 3. Per-account evidence-grounded narrative

For each account in Red and Amber (skip Watch — it gets a count-only line), compose:

- One-line change driver naming the dominant event, never paraphrased away from `events[].summary`. If the dominant event was a usage drop, say "active seats fell from 142 to 89 over 7 days," not "engagement is declining."
- One concrete suggested action, formatted as a verb plus a named artifact (a meeting, a person, a doc). Examples: "Call the CFO before Friday's renewal kickoff." "Open a case with support to triage the open P1." "Forward last week's QBR deck to the new VP of Eng."
- If no concrete action can be supported from the evidence, output `needs human review` rather than padding. Vague actions are the primary failure mode the digest exists to avoid.

### 4. Prioritization

Within each bucket, sort by ARR descending, breaking ties by `renewal_date` ascending (closer renewals first). Apply `cap` to the combined Red + Amber list. If the cap drops accounts, surface them only as a count and a link to the full Gainsight saved view.

### 5. Format and emit

Render to the layout in `references/2-sample-digest.md`. The output is a single Slack-mrkdwn block plus a fallback plaintext copy. Do not include tables, attachments, or threads — the digest must be scannable in the channel without expanding anything.

## Output format

```markdown
*Daily churn-risk digest — {YYYY-MM-DD}*

*Red ({n_red})* — act this week
- *{Account name}* — ${ARR}k ARR · owner @{owner_handle} · renewal {renewal_date}
  Driver: {one-line driver from evidence}
  Action: {verb + named artifact}
- ...

*Amber ({n_amber})* — review by Friday
- *{Account name}* — ${ARR}k ARR · owner @{owner_handle} · renewal {renewal_date}
  Driver: {one-line driver}
  Action: {verb + named artifact, or `needs human review`}
- ...

*Watch ({n_watch})* — no action required, tracking only.
{count summary, no per-account detail}

_Filtered out: {n_below_floor} below ${min_arr}k · {n_below_segment} outside segment._
_Capped at {cap} of {n_red + n_amber} qualifying. Full list: {gainsight_saved_view_url}_
```

## Watch-outs

- **Alert fatigue.** If the digest carries more than ~15 accounts day after day, owners stop opening it. Guard: enforce `cap` strictly, and if Red exceeds cap on three consecutive runs, prepend a `_Threshold may be too loose — last 3 runs averaged {n} Red. Consider raising the red threshold in references/3-escalation-criteria-thresholds.md._` warning. Do not silently truncate without flagging.
- **False-positive flooding.** Any single event type producing more than 30% of Red accounts in a week is a signal that its weight is miscalibrated. Guard: at the end of the digest, include a one-line diagnostic — `_Event-type mix this week: usage_drop 18%, support_escalation 22%, ..._` — so the team can spot one signal dominating before it erodes trust in the digest.
- **Signal weighting drift.** Weights in the references file go stale as the product and customer base change. Guard: include the SHA-256 (first 7 chars) of `references/1-risk-signal-weights.md` in the digest footer. If the footer hash hasn't changed in 90 days, the digest prepends `_Weights file last touched 90+ days ago. Time to recalibrate._`
- **Owner staleness.** If `owner_email` is empty or maps to a former employee, the ping goes to the wrong person and the action does not happen. Guard: any account whose owner handle cannot be resolved gets surfaced under `*Ownership broken ({n})*` instead of Red/Amber, with a link to the Gainsight account ownership editor.
- **Action specificity collapse.** Under load, the model defaults to generic "engage stakeholder" suggestions. Guard: post-process the Action field with a literal substring check — if the action contains any of `engage`, `reach out`, `touch base`, `align`, `socialize` without a named person or artifact, replace it with `needs human review`. Better silence than noise.
