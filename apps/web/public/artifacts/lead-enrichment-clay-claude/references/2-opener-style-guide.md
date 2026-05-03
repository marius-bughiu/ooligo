# Opener style guide — TEMPLATE

> Replace the placeholders with your team's actual voice rules. The
> lead-enrichment skill loads this file on every opener generation.
> Treat it as the single source of truth — do not duplicate rules into
> the prompt itself, where they will drift.

## Voice

One sentence on register: {e.g. "direct, plain, no jargon, no exclamation marks, no questions in the close unless the question is specific"}.

One sentence on stance: {e.g. "we're peers solving the same problem, not vendors selling at"}.

## Length

- Hard cap: 50 words. The skill enforces this and truncates with an ellipsis warning if the model overshoots.
- Soft target: 30-40 words. Three sentences max.
- No greeting line ("Hi {name},"). The sequence step adds the greeting; baking one into the opener double-greets.

## What every opener must contain

1. A specific reference to one thing from the snapshot — preferably `recent_signal`. If there is no recent signal, the opener references the `value_prop` and labels itself low-confidence.
2. A reason the reference matters to the operator's persona. Not "I noticed X" — "X is the move ops leaders ask us about".
3. A single, specific close. Either a 20-min ask or a question that would be answerable only by someone inside the company.

## Banned phrases

The prompt rejects any opener containing these. Add team-specific additions over time.

- "I hope this email finds you well"
- "I noticed"
- "I came across your"
- "love what you're doing"
- "quick question"
- "circling back" (in a first touch)
- Any superlative — "amazing", "incredible", "best-in-class", "leading"
- Any em-dash trio that reads as an LLM tic — "X — Y — Z"
- Compliments on growth/funding without a cited source

## Banned structures

- The "I was just on your website" opener. Always reads false.
- The "we work with companies like {logo}" name-drop in sentence one.
- The "are you the right person?" close. Wastes the reply.

## Confidence signal

The skill returns `opener_confidence: 0.0-1.0`:

- **0.8+** — opener references a dated `recent_signal` with a URL and the rep's persona is in `references/1-icp-rubric.md` buying committee.
- **0.5-0.8** — opener references `value_prop` only, or `recent_signal` is older than 60 days.
- **<0.5** — opener is generic; rep should rewrite or skip the row.

Threshold for auto-queueing into a sequence: configure per-team. Default recommendation: **never auto-queue**. The opener is a draft.

## Worked example

Snapshot: industry "scheduling for restaurants", recent_signal "March payroll launch", value_prop "schedules and pays hourly workforces".

Opener (35 words, confidence 0.78):

> Saw the March payroll launch — folding pay into the same surface as
> scheduling is the move most ops leaders ask us about. Worth a 20-min
> on whether the multi-state tax piece is hitting the same wall others
> have?

Why it scores 0.78 not 1.0: the close assumes a pain ("multi-state tax piece is hitting the same wall") that the snapshot does not directly evidence. A 1.0 opener would tie the close to a fact in the snapshot.

## Last edited

{YYYY-MM-DD}
