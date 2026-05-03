# Escalation criteria thresholds — TEMPLATE

> Replace these defaults with the values your CSM lead has signed off
> on. Aim for 5-15 total Red+Amber accounts per daily run; if you are
> consistently above or below, the thresholds are wrong, not the team.

## Bucket definitions

An account lands in exactly one bucket per run. The skill evaluates in this order and stops at the first match.

### Red — act this week

ANY of the following:

- `risk_score_current` crossed the explicit churn-risk line set in Gainsight (e.g. moved from "Medium" to "High", or numeric score crossed below 40), AND `risk_score_prior` was on the safe side of that line within the trailing window.
- `signal_score` >= **12.0** (sum of `severity * weight` across trailing-window events, per `1-risk-signal-weights.md`).
- A single event matches the always-escalate list in `1-risk-signal-weights.md` ("Always-escalate single signals").

### Amber — review by Friday

ANY of the following, and NOT already Red:

- `health_score_current - health_score_prior` <= **-15** in the trailing window.
- `signal_score` between **6.0** and **12.0**.

### Watch — count only

Crossed into the band (any negative movement on either score) but does not meet Amber criteria. Surfaced as a count only.

## Filters

Applied before bucketing. Filtered accounts are excluded from all buckets and reported in the footer.

- `min_arr` — drop accounts with `arr` < this value. Default **0**. Most teams that send to a channel set this to **50** (k$) to keep the digest scannable.
- `segments` — restrict to a list of `segment` values. Default: all segments. Most teams running a daily digest restrict to `["enterprise", "mid-market"]` and run a separate weekly digest for SMB to keep the daily list focused on accounts that justify a human-touch action.

## Cap and overflow

`cap` = **15** by default. After Red+Amber are sorted by ARR descending, anything beyond the cap goes into the footer count + a link to the saved Gainsight view. Do not silently drop accounts — the count must always be honest.

## Self-tuning trigger

If Red exceeds `cap` on three consecutive runs, the skill prepends a warning to the digest noting the threshold may be too loose. The skill does NOT auto-edit this file. Threshold edits are a human decision; the skill only surfaces the signal.

## Threshold change log

Append every change so the next person editing this file can see why the numbers are what they are. Format: `YYYY-MM-DD — change — reason`.

- {YYYY-MM-DD} — initial thresholds — placeholder, replace with team-tuned values

## Last edited

{YYYY-MM-DD}
