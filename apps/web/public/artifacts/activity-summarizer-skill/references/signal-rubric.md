# Signal rubric — TEMPLATE

> Replace this template's contents with your team's actual thresholds.
> The activity-summarizer skill uses these to bucket each opportunity
> as Heating, Cooling, or Stuck. Defaults below are sane starting
> points; tune after a few weeks of running the skill against your
> historical data.

## What counts as a "meaningful touch"

Not all activities are signal. The skill counts a Task or Event as a
meaningful touch only if it meets one of the conditions below. Edit
this list to match your CRM hygiene reality.

- Outbound call with a logged disposition AND non-empty `Description`
- Inbound or outbound email where the prospect replied within 7 days
- Meeting (Event type) with at least one external attendee
- Gong call ≥ {min_call_duration_seconds, default 300} seconds with
  `transcriptionConfidence` ≥ 0.6

Explicitly does NOT count:

- "Logged Email" entries with empty `Description` (auto-logged hygiene)
- Tasks with `Subject` matching `/^(Email\: |Logged via )/`
- Calendar invites without a confirmed external acceptance
- One-way LinkedIn messages without a reply

## Heating thresholds

A deal is Heating if ANY of:

- **Stage advancement**: `OpportunityHistory.StageName` moved forward
  this window AND the new stage's required framework fields are filled
- **Multi-threading**: ≥ 2 distinct external participants on calls /
  meetings this window (counts new contacts joining, not the same
  champion repeated)
- **Buying questions**: a Gong call this window contains a question
  flagged in Gong's `flaggedQuestions` field tagged as
  `pricing` / `timeline` / `procurement`
- **Champion proactivity**: champion sent ≥ 1 inbound email this window
  without rep prompting (detect via `Task.WhoId = champion AND
  Task.CreatedById = rep`)

## Cooling thresholds

A deal is Cooling if ALL of:

- No rep-side meaningful touch in ≥ 10 days
- Last prospect reply > 14 days ago
- OR `OpportunityHistory.StageName` rolled backward this window
- OR stage transitioned to `Closed Lost` (always Cooling, never Heating)

## Stuck thresholds

A deal is Stuck if BOTH of:

- Time in current stage > 1.5x team median for that stage (see
  qualification-framework.md for medians)
- At least one required framework field for the current stage is empty

## Bucket precedence

A deal can sit in only one bucket per week. If it qualifies for
multiple, the skill applies this precedence (highest wins):

1. Cooling — if cooling, the heating signals are noise; surface the cooling
2. Stuck — if stuck and not cooling, surface the structural problem
3. Heating — only if neither cooling nor stuck

This precedence prevents the "stage advanced for procedural reasons but
the deal is actually broken" false positive.

## Suggestion guardrails

The "one suggestion for next week" line at the end of the report MUST:

- Name a specific account (no "follow up with stale leads")
- Name a specific stage (no "move things forward")
- Name a specific blocker pulled from the qualification framework gaps

If the rubric cannot produce a suggestion meeting all three constraints,
the skill writes "No suggestion this week — pipeline is clean" rather than
fabricating one.

## Last edited

{YYYY-MM-DD}
