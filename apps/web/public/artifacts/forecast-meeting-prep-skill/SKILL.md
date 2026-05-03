---
name: forecast-meeting-prep
description: Generate a one-page briefing for a sales manager's weekly forecast call. Pulls the rep's open pipeline, diffs commit / best-case / upside against last week's snapshot, deep-dives the top three commits, and lists specific questions the manager should ask the rep — based on actual movement patterns, not generic forecast hygiene. Output is a Markdown document the manager reads on the way to the call. Never produces forecast numbers; never auto-shares with the rep.
---

# Forecast meeting prep

## When to invoke

Invoke when a sales manager is preparing for a weekly one-on-one forecast call with a single rep. Take a rep ID, the current week's forecast snapshot, and last week's snapshot as input. Produce a Markdown briefing the manager reads in the five to ten minutes before the call.

Do NOT invoke for:

- **Producing the actual forecast number to commit upward.** This Skill prepares the manager for a conversation about the rep's number; the rep owns the number, the manager calibrates it, the Skill does not generate it. Auto-generated commit numbers are how forecast culture gets gamed.
- **Board prep, QBR roll-ups, or any output that leaves the manager's desk without manager review.** The briefing is a private prep doc. Surfacing it to the rep, the VP, or the board without the manager reading and editing first turns half-formed pattern matching into a verdict.
- **Reps the invoking user does not directly manage.** The Skill checks the requesting user's manager-of-record status against the rep ID and refuses on mismatch. Wrong-manager forecast briefings expose deal-by-deal context the invoker should not see.
- **A new rep in their first 30 days.** Week-over-week movement on a ramping rep's pipeline is mostly noise — they are learning the stages, not signaling deal health. Wait until the rep has three clean weeks of pipeline activity before relying on this Skill.
- **Renewal-only books or pure CS pipelines.** The rubric here is built for new-business commit / best-case / upside motion. Renewal forecasting has different signal (usage, NPS, multi-year clauses) that this Skill does not look at.

## Inputs

- Required: `rep_id` — the CRM user ID for the AE being prepped.
- Required: `manager_id` — the CRM user ID of the invoking manager. Used to verify manager-of-record before any pipeline data loads.
- Required: `current_snapshot` — path or ID of this week's pipeline snapshot CSV (commit, best-case, upside flagged per opportunity).
- Required: `prior_snapshot` — path or ID of last week's snapshot in the same shape. The Skill expects identical column structure week-over-week and refuses on schema drift.
- Optional: `top_n_commits` — how many top commits to deep-dive on. Default 3. The cap exists because four-plus deep-dives turn the briefing into a deck the manager will not read in five minutes.
- Optional: `activity_window_days` — how far back to pull recent activity per top commit. Default 14. Older activity is too stale to be a current-quarter signal.
- Optional: `prior_briefing` — path to last week's prep briefing for this same rep, if it exists. Used to flag patterns repeating week-over-week ("third week in a row this deal slipped a stage").

## Reference files

Read all of the following from `references/` before generating the briefing. Without them, the output reads like a generic forecast-call checklist that any sales blog could produce.

- `references/01-briefing-format.md` — the literal Markdown shape every weekly briefing uses. Fixed format is deliberate so the manager scans the same sections in the same order every week.
- `references/02-question-library.md` — the manager's catalog of forecast-call questions, indexed by deal pattern (slipped close date, stage advance with no activity, commit added with no prior best-case appearance, etc.). The Skill picks from this library rather than inventing questions.
- `references/03-deal-deepdive-template.md` — the per-deal block the Skill fills in for each of the top commits. Same shape per deal so the manager can compare across the top three at a glance.

## Method

Run these steps in order. Do not parallelize — later steps depend on data from earlier steps, and the manager-of-record check must run before any pipeline content is loaded.

### 1. Verify manager-of-record

Query the CRM for the rep's manager-of-record. If it does not match `manager_id`, refuse the request and return:

```
Refused: <manager_id> is not the manager of record for <rep_id>. Forecast prep briefings are written for the direct manager only.
```

This is a hard refusal. Do not produce a partial briefing, do not suggest workarounds. Wrong-manager forecast content is the highest-impact data-leakage failure mode this Skill could enable.

### 2. Diff commit-vs-actual delta first

Before pulling activity, compute the week-over-week delta on the forecast categories themselves: total commit, total best-case, total upside, plus per-opportunity moves between categories. Pull this first because the delta frames every other section — a $400k commit that lost $120k overnight changes which deals the deep-dive prioritizes, and the question library indexes by movement pattern (category change, amount change, close-date drift) rather than by deal size.

If schema drift is detected (column added, removed, or renamed between snapshots), stop and return:

```
Schema drift detected between snapshots. Columns differ: <list>. Re-run after the snapshot job is reconciled.
```

Hallucinating diffs across mismatched schemas is the failure mode this guard rules out.

### 3. Rank top commits for deep-dive

Take the current week's commit set and rank by a composite of: deal size, days-to-close, week-over-week movement (any move = higher rank), and "no activity in last 14 days" (any silence = higher rank). Take the top `top_n_commits` (default 3).

The engineering choice to focus the deep-dive on three deals (not all of them) is bounded by what the manager can actually talk through in a 30-minute one-on-one. Briefings that try to cover twelve commits get skimmed; briefings on three get used.

### 4. Pull recent activity per top commit

For each of the top commits, pull the last `activity_window_days` of activity: emails logged, meetings, call recordings (titles only — not transcripts), task completions, stage history. Filter out auto-logged noise (system emails, calendar declines, BCC-blast sequences) before counting.

Surface the deal as "stalled" if there are zero meaningful activities in the window. Surface as "thrashing" if there are more than five stage changes in the window (real deals do not move that much; the rep is gaming the pipeline view).

### 5. Match question patterns from the library

For each top commit and each notable category-level movement, look up the relevant question pattern in `02-question-library.md`. Engineering choice: the question library is per-pattern, not per-deal-size or per-rep, because the same patterns repeat across deals — "commit added this week with no prior best-case appearance" calls for the same conversation regardless of whether it is a $50k deal or a $500k one.

If `prior_briefing` is provided, cross-check: is this the same pattern flagged on this deal last week? If yes, escalate the question ("Third week in a row we are flagging this — what changed in the deal that did not change in the data?").

If no library question matches a movement pattern (rare, but possible), surface the movement openly and write "no library question matches; manager to draft." Never invent a generic question to fill the slot — generic questions are the failure mode this guard rules out.

### 6. Render the briefing

Use the format in `01-briefing-format.md` exactly. Engineering choice: the format is fixed so the manager scans the same sections in the same order every week and notices what changed week over week.

## Output format

```markdown
# Forecast prep — {Rep name}, week of {YYYY-MM-DD}

Manager: {Manager name}
Snapshots: this week ({date}) vs last week ({date})
Pipeline rolled up: ${commit total} commit / ${best-case total} best-case / ${upside total} upside

## Week-over-week movement

- Commit: ${last_week} → ${this_week} ({+/- $delta}, {+/- %})
- Best-case: ${last_week} → ${this_week} ({+/- $delta}, {+/- %})
- Upside: ${last_week} → ${this_week} ({+/- $delta}, {+/- %})

Notable category moves:
- {Deal name} — moved from {prior category} to {current category} ({reason if visible from activity})
- {Deal name} — close date slipped from {prior date} to {current date}
- {Deal name} — added to commit this week, no prior appearance in best-case

## Top {N} commits — deep dive

### 1. {Deal name} — ${amount}, close {date}

- Stage: {current} (was {prior, if changed})
- Activity in last {window} days: {meaningful_count} touches ({email/meeting/call counts})
- Last meaningful activity: {date} — {one-line summary}
- Movement this week: {category move | amount change | close-date drift | none}
- Pattern flag: {stalled | thrashing | repeat-flag-from-prior-week | clean}

### 2. {Deal name} — ${amount}, close {date}

(same shape)

### 3. {Deal name} — ${amount}, close {date}

(same shape)

## Questions for the rep this week

(Specific, sourced from the question library against the patterns above. Two to five questions, never generic.)

1. **{Pattern}.** "{question pulled from 02-question-library.md, deal name substituted}"
2. **{Pattern}.** "{question}"
3. **{Pattern}.** "{question}"

## Other deals worth a sentence

(One line each — deals that moved but did not make the top three. Not deep-dived.)

- {Deal name} — {one-sentence movement summary}
- {Deal name} — {one-sentence movement summary}

---

Draft by forecast-meeting-prep skill. Manager reviews and edits
before the 1:1; this briefing is private prep, not auto-shared with
the rep or rolled up.
```

## Watch-outs

- **Surfacing reps as good or bad based on lagging data.** A rep whose commit dropped this week may have done the right thing (pulled an honestly-stalled deal out of commit) and a rep whose commit grew may be sandbagging a slip. Guard: the briefing reports movement and patterns; it never scores the rep, never ranks reps against each other, and the question library is built around "help me understand" framing rather than "explain yourself" framing. The manager applies the off-data context (1:1 history, deal nuance the data does not show) before drawing any conclusion.
- **Specific-question quality drift.** Over time, the question library can collapse into the same three questions for every movement pattern, and the briefing becomes background noise the rep stops engaging with. Guard: every question in `02-question-library.md` carries a `last_used` date; the Skill prepends a warning when the matched question has been used on this rep more than three weeks in the last quarter, and the rollout plan includes a quarterly question-library refresh.
- **Missing context that the manager has from prior 1:1s.** The Skill sees pipeline data and activity logs. It does not see what the rep told the manager about the deal in the last 1:1, what the champion mentioned in a hallway, or what the customer's procurement team is doing. Guard: the briefing is explicitly framed as "what the data shows," the question library is built on "help me understand the gap" framing rather than "the data says X therefore Y," and the manager always edits before the call. The Skill output without manager review is a half-formed pattern match, not a verdict.
- **Snapshot hygiene.** If the weekly snapshot misses a week, the diff in step 2 will hallucinate movement at scale (every deal looks like it moved). Guard: the Skill compares snapshot timestamps and refuses if the gap exceeds 10 days. Better to return "snapshot gap, no briefing" than render a confident wrong briefing.
- **Auto-share is out of scope.** The briefing is a manager prep document. Never wire this into a Slack channel, never send it to the rep, never feed it into the upward roll-up. The bundle ships no auto-send hook; adding one breaks the trust model.
