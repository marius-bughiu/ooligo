---
name: ae-rep-coaching
description: Generate a weekly coaching note for a single AE from their last ten Gong calls. Output is a three-things-working / two-things-to-tighten / one-specific-exercise note that the manager edits and delivers — never auto-sent. Use weekly per direct report.
---

# AE rep coaching

## When to invoke

Invoke when a sales manager wants a structured coaching draft for one direct report based on recent call activity. Take a Gong rep ID and a date window as input and produce a Markdown coaching note grounded in specific call moments.

Do NOT invoke for:

- Performance Improvement Plans (PIPs), formal HR processes, or any document that becomes part of an employee's official record. This skill writes a coaching note, not a personnel file. PIPs require HR involvement, signed acknowledgment, and a defensibility bar this skill is not designed to meet.
- Compensation, promotion, or termination decisions. The skill scores call behaviors against a rubric. It does not assess overall contribution, ramp trajectory, or pipeline coverage.
- Peer-to-peer feedback (no manager-of-record context, no authorization to read calls).
- A rep the invoking user does not directly manage. The Skill checks the requesting user's manager-of-record status against the rep ID and refuses if there is no match. Wrong-manager data leakage is the highest-impact failure mode this skill could enable.
- Calls that are not internal sales activity (customer-success QBRs, partner calls, internal syncs miscategorized in Gong).

## Inputs

- Required: `rep_id` — the Gong user ID for the AE being coached.
- Required: `manager_id` — the Gong user ID of the invoking manager. Used to verify the manager-of-record relationship before any transcript is read.
- Optional: `window_days` — how far back to pull. Default 14. Cap at 30; older calls reflect a different version of the rep.
- Optional: `max_calls` — cap on number of calls analyzed. Default 10. Set lower (5-7) for high-volume SDRs to keep token cost bounded.
- Optional: `call_types` — restrict to one or more of `discovery|demo|negotiation|closing`. Default: all four.

## Reference files

Read all of the following from `references/` before generating the note. These are the user's own coaching artifacts. Without them, the output is generic feedback that any sales-coaching blog could produce.

- `references/01-coaching-rubric-template.md` — the per-call-type rubric the Skill scores against. Replace the template with your team's actual rubric.
- `references/02-coaching-note-format.md` — the literal Markdown format and tone the manager wants. The Skill matches this style rather than inventing one per run.
- `references/03-escalation-criteria.md` — the signals that mean "stop, this is not a coaching moment, this is a performance conversation." When any criterion fires, the Skill refuses to produce the coaching note and surfaces the criteria instead.

## Method

Run these steps in order. Do not parallelize — each step depends on data from the previous one, and the escalation check must run before any analysis is committed to the output.

### 1. Verify manager-of-record

Query Gong for the rep's manager-of-record. If it does not match `manager_id`, refuse the request and return:

```
Refused: <manager_id> is not the manager of record for <rep_id>. Coaching notes are written by the direct manager only.
```

This is a hard refusal. Do not produce a partial note, do not suggest workarounds. Wrong-manager output is the most damaging failure mode this Skill could enable.

### 2. Pull recent calls

Use `pull_recent_calls(rep_id, window_days, max_calls, call_types)`. Filter out:

- Calls under five minutes (no signal, mostly logistics).
- Calls with more than five external attendees (group dynamics drown out the rep's behavior).
- Calls flagged in Gong as `bad_audio` or `transcription_failed`.

If fewer than three usable calls remain after filtering, stop and return: `Insufficient call data: <N> usable calls in window. Extend window_days or wait for more activity.` Producing a coaching note from one or two calls is hindsight bias amplification.

### 3. Classify call type

For each remaining call, take the Gong stage tag if present. If absent, classify the call into `discovery|demo|negotiation|closing` based on transcript content. Engineering choice: classification is explicit and per-call rather than blanket because applying a discovery rubric to a negotiation call produces irrelevant scoring (the noisiest failure mode in early rollouts).

### 4. Score against rubric

For each call, load the matching rubric section from `01-coaching-rubric-template.md`. Score each criterion 1-5 with a specific transcript citation (timestamp + 1-2 sentence quote). No score without a citation — this guard rules out gut-feel feedback dressed up as analysis.

### 5. Run escalation check

Before aggregating, evaluate every criterion in `03-escalation-criteria.md` against the scored calls. If any criterion fires (e.g. repeated misrepresentation of pricing, deal terms invented on the fly, hostile tone toward customer), stop and return the escalation block instead of the coaching note. Coaching is the wrong intervention for these signals; a performance conversation with HR involvement is.

### 6. Aggregate into three / two / one

Across the scored calls, identify:

- **Three patterns working.** Behaviors that scored 4-5 on multiple calls. Cite at least two calls per pattern.
- **Two patterns to tighten.** Behaviors that scored 1-2 on multiple calls. Cite at least two calls per pattern. If only one weak pattern is supported by ≥2 calls, return one — never pad to two.
- **One specific exercise.** A concrete, measurable behavior change for the upcoming week, tied to the strongest "tighten" pattern.

### 7. Render the note

Use the format in `02-coaching-note-format.md` exactly. Engineering choice: the format is fixed (not regenerated per run) so the AE sees the same shape every week and can scan for what changed.

## Output format

```markdown
# Coaching note — {Rep name}, week of {YYYY-MM-DD}

Calls analyzed: {N} ({list of call types and dates})
Window: last {window_days} days

## Three things working

1. **{Pattern}.** Cited in: {Call A — timestamp}, {Call B — timestamp}.
   "{short quote}"
2. **{Pattern}.** Cited in: {Call C — timestamp}, {Call D — timestamp}.
   "{short quote}"
3. **{Pattern}.** Cited in: {Call E — timestamp}, {Call F — timestamp}.
   "{short quote}"

## Two things to tighten

1. **{Pattern}.** Cited in: {Call G — timestamp}, {Call H — timestamp}.
   "{short quote}". Why it matters: {one sentence linked to deal outcomes}.
2. **{Pattern}.** Cited in: {Call I — timestamp}, {Call J — timestamp}.
   "{short quote}". Why it matters: {one sentence linked to deal outcomes}.

## One exercise for next week

On your next {N} {call type} calls, {specific measurable behavior}.
Success looks like: {observable outcome the manager can verify in Gong}.

---

Draft by ae-rep-coaching skill. Manager edits and delivers; this note
is not auto-sent.
```

## Watch-outs

- **Coaching is not a performance review.** A coaching note that reads like a written warning gets ignored or escalates the relationship. Guard: the prompt forces "trusted peer" voice and the escalation check in step 5 routes performance issues out of the coaching path entirely.
- **Wrong-manager data leakage.** If a manager pulls a coaching note on a rep they do not manage, the Skill exposes call content the invoker should not see. Guard: step 1 verifies manager-of-record against Gong's permission model before any transcript is loaded; hard refusal on mismatch.
- **Bias amplification.** Rubric scoring against transcripts can encode reviewer bias (verbose reps score higher; non-native English speakers score lower on "discovery rapport"). Guard: every score requires a transcript citation, not a vibe; the rubric is reviewed quarterly with the full team, not maintained by one manager in isolation.
- **Stale rubric.** A rubric written for cold outbound applied to warm inbound demos produces irrelevant feedback. Guard: each rubric file carries a `last_edited` date; the Skill prepends a warning to the coaching note if the matching rubric section is older than 90 days.
- **Hindsight bias.** Two calls do not establish a pattern. Guard: step 2 refuses to produce a note with fewer than three usable calls; "patterns" require ≥2 supporting calls each.
- **Manager-of-record dependency.** This is a tool for the manager, not a replacement. The output is a draft. The manager edits, contextualizes with off-call observations (1:1 history, ramp stage, deal context), and delivers in person. Auto-sending is explicitly out of scope.
