# Deal deep-dive block — TEMPLATE

> Replace this template with your team's actual per-deal block. Keep
> the field order fixed across deals and across weeks so the manager
> can scan the top three deep-dives at a glance and compare like for
> like.

## The block

```markdown
### {Rank}. {Deal name} — ${amount}, close {date}

- Stage: {current stage} (was {prior stage, if changed in window})
- Forecast category: {commit | best-case | upside} (was {prior, if changed})
- Activity in last {window} days: {count} meaningful touches
  ({email count} emails, {meeting count} meetings, {call count} calls)
- Last meaningful activity: {date} — {one-line summary, no transcripts}
- Movement this week: {category move | amount change | close-date drift | stage change | none}
- Pattern flag: {stalled | thrashing | repeat-flag-from-prior-week | clean | other}
- Notes from prior briefing (if any): {one line, only if same deal flagged last week}
```

## Field rules

- **Amount and close date** come straight from the snapshot. No derivation, no rounding, no projection.
- **Activity counts** are post-filter. Auto-logged emails, calendar declines, BCC-sequence sends, and bounce notifications are excluded before counting. The Skill never inflates activity by counting noise.
- **Last meaningful activity** is one line. Title or subject line of the activity, plus date. Never a transcript, never a quote — those belong in the source system, not in a prep briefing.
- **Movement** lists every dimension that changed week-over-week. If multiple changed, list all of them; the manager decides which matters most for the conversation.
- **Pattern flag** is the worst-case flag fired by the deal across the patterns in `02-question-library.md`. If multiple patterns fired, the flag is "multiple" and the questions section will surface one question per pattern.
- **Notes from prior briefing** appear only when `prior_briefing` was passed as input and the same deal was flagged. Otherwise omit the line — do not pad with "no prior context."

## What goes here vs what goes in the questions section

This block is reporting (what the data shows). The questions section is conversation (what the manager asks). Do not collapse them — a manager scanning the deep-dive on the way to a 1:1 needs to hold the data in their head before they get to the questions.

## Last edited

{YYYY-MM-DD}
