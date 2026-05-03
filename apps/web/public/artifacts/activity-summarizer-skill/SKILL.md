---
name: activity-summarizer
description: Summarize one rep's last seven days of Salesforce activity, Gong calls, and email touches into a six-bullet signal report — what is heating up, what is cooling, where the rep is stuck, one suggestion. Designed for Friday self-review, not surveillance.
---

# Activity summarizer

## When to invoke

Use this skill on Friday (or any chosen weekly cadence) for a single rep's pipeline. Inputs are a Salesforce user ID and a seven-day window; output is a Markdown signal report scoped to that rep's open opportunities. The brief is rep-facing first and lands in the rep's DM, not the manager channel.

Do NOT invoke this skill for:
- Cross-team pipeline reviews (use a dashboard, not a Skill — N reps means N invocations and the cost compounds)
- Manager surveillance ("show me what Bob did this week") — privacy posture is broken if the rep didn't run it themselves
- Account-level deep dives (use the `account-research` skill instead)
- Forecast-call prep where you need numeric roll-up (Salesforce reports do this better and cheaper)
- Windows shorter than three days — too few datapoints for the rubric to fire cleanly

## Inputs

- Required: `rep_user_id` — Salesforce user ID (not the email; the API treats them differently)
- Required: `window_days` — integer, defaults to 7. Skill rejects values < 3 or > 28
- Optional: `framework` — one of `meddpicc`, `bant`, `custom`. Defaults to `meddpicc`. If `custom`, the skill loads `references/qualification-framework.md` and uses that as the lens
- Optional: `recipient` — `dm` (default) or `email`. Manager auto-cc is intentionally not an option
- Optional: `min_call_duration_seconds` — defaults to 300 (filters Gong noise; see watch-outs)

## Reference files

The skill loads these from `references/` on every run. Replace template contents with your team's actuals before first production use — the skill works without edits but the output reads generic.

- `references/qualification-framework.md` — the rubric the skill uses to decide "where is the deal stuck." Defaults to a MEDDPICC scaffold; swap in your team's variant
- `references/signal-rubric.md` — the thresholds the skill uses to bucket activity as heating / cooling / stuck. Has knobs for what counts as a "meaningful touch" and what triggers a "stuck" flag
- `references/sample-output.md` — a worked example the skill conditions on for tone, length, and formatting. Edit this when you want to nudge the voice (e.g. blunter, less hedged)

## Method

The four sub-tasks run in order. Steps 1 and 2 fetch in parallel; steps 3 and 4 are strictly sequential because ranking depends on synthesis.

### 1. Pull activity streams

Run two API calls in parallel:

- **Salesforce**: SOQL for `Task` and `Event` records where `OwnerId = rep_user_id` and `ActivityDate` within the window, plus `OpportunityHistory` rows for stage changes on opportunities owned by the rep. Filter Tasks where `Type IN ('Email', 'Call', 'Meeting')` — drop "Logged Call" with empty `Description` (these are usually CRM hygiene noise, not engagement)
- **Gong**: `/v2/calls` filtered by `participants.userId = rep_email` (Gong indexes by email, not Salesforce user ID — translate first), within the window. For each call, pull `summary`, `talkRatio`, `nextSteps`, and `flaggedQuestions` from `/v2/calls/{id}/extensive`. Drop calls where `duration < min_call_duration_seconds` — short calls are usually voicemails or test calls and produce noisy signals

If a stream fails, continue with the other and tag the report header `[Salesforce unavailable]` or `[Gong unavailable]`. Never silently produce a partial report — the rep must know what's missing.

### 2. Join to opportunity context

For each open opportunity owned by the rep, build a record with: stage, amount, close date, last stage change, count of activities in window, count of calls in window, and the qualification framework's required fields (e.g. for MEDDPICC: Metrics, Economic buyer, Decision criteria, etc.). Pull the framework field names from `references/qualification-framework.md` — do not hardcode field names in the skill.

### 3. Bucket per opportunity

For each opportunity, apply the signal rubric (see `references/signal-rubric.md`):

- **Heating**: stage advanced this week OR ≥ 2 multi-threaded touches OR a flagged buying-question on a call
- **Cooling**: no rep-side touch in ≥ 10 days AND last prospect reply > 14 days OR stage rolled back
- **Stuck**: open in current stage > 1.5x the team's median time-in-stage AND framework field gap (e.g. no Economic Buyer named)

A deal can only sit in one bucket. Order of precedence: Cooling > Stuck > Heating. This prevents the "heating but actually broken" false positive that surfaces when stage advanced for procedural reasons but signal is otherwise dead.

### 4. Rank and render

Pick the top three Heating, top two Stuck (or Cooling, if no Stuck), and produce one suggestion. The suggestion must name a specific deal, a specific stage, and a specific blocker — never a generic "follow up with stale leads" line. If the rubric cannot produce a deal-specific suggestion (e.g. all deals are healthy), the skill writes "No suggestion this week — pipeline is clean" rather than padding.

Render to the format below and ship.

## Output format

```markdown
# Week of {YYYY-MM-DD} — {Rep first name}

## Heating
1. **{Account}** — {one-sentence what changed}. Signal: {citation, e.g. "Gong call 2026-04-29: economic buyer joined, asked about pricing tiers"}
2. **{Account}** — ...
3. **{Account}** — ...

## Stuck
1. **{Account}** — {one-sentence what is blocked}. In {stage} for {N} days (team median: {M}). Missing: {framework field, e.g. "no Economic Buyer named"}
2. **{Account}** — ...

## Suggestion for next week
{Single specific action tied to a named deal and a named stage}. e.g. "On Acme, you have a technical evaluator but no Economic Buyer; propose a 30-min exec brief with their CFO."

## Sources
- Salesforce activities: {N} tasks, {M} events, {K} stage changes
- Gong calls: {N} (filtered {dropped} below {threshold}s)
- Window: {start} → {end}
```

## Watch-outs

- **Privacy posture: rep-facing only.** Default `recipient` is `dm` and the skill refuses to send to a manager channel. If a manager wants visibility, the rep forwards. Auto-cc would change the social contract from "weekly self-review" to "weekly snitch report" — and reps would game the input data within a week
- **Gong transcript quality.** International calls and bad audio produce noisy summaries that feed bad signals. Guard: `min_call_duration_seconds = 300` filters voicemails and test calls; the skill also reads Gong's per-call `transcriptionConfidence` field and drops anything below 0.6
- **Activity definition drift.** "Logged Email" with no body and no reply is not engagement; it's CRM hygiene theater. Guard: the SOQL filter requires non-empty `Description` on Tasks and ignores Tasks where `Subject` matches the team's auto-logged patterns (`/^(Email\: |Logged via )/`)
- **Suggestion fatigue.** The "one suggestion" line drifts toward generic ("follow up with stale leads") when the rubric is loose. Guard: the rendering step rejects any suggestion that does not name an Account, a Stage, and a specific Blocker. If the rubric cannot produce one, the skill writes "No suggestion this week" rather than fabricating
- **Token cost compounds with rep count.** A single weekly run is ~6k input + ~800 output tokens (~$0.05 on Sonnet). Twenty reps × four weeks = ~$4/month, fine. Two hundred reps × daily = ~$280/month, no longer cheap; switch to Haiku or batch
- **Stage-changes-as-signal can lie.** A rep moving a deal to "Closed Lost" shows up as a stage change but should not feed Heating. Guard: bucketing rules treat stage rollbacks and Closed-Lost transitions explicitly under Cooling, never Heating
