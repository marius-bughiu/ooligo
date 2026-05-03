# Loop output format — TEMPLATE

> The interview-loop-builder skill emits its output in the format
> below. This file documents the format so the team can adjust before
> running the skill at scale; the skill reads this file as the literal
> template, not a guideline.

## File layout

The skill writes:

- `loop.md` — the loop design, in the format below.
- `scorecards/<NN>-<stage-id>.md` — one scorecard scaffold per
  post-screen stage, with the rubric block prefilled and an empty
  scoring section.

## loop.md format

```markdown
# Interview loop — {Role title} ({level})

Generated: {ISO timestamp}
Competencies: {n}
Stages: {n}
Total active interview time: {hours}h
Distinct interviewers: {n}

## Inputs summary

- JD: {path}
- Level: {level}
- Must-have competencies: {comma-separated IDs}
- Interviewer pool: {path to filled interviewer-strengths matrix}
- Loop length cap: {n}
- Time zone hint: {tz | not provided}

## Competency → stage mapping

| Competency | Stage | Rationale |
|---|---|---|

## Stage 1: Recruiter screen (30 min)

Goal, key questions, disqualifying signals. Not on rubric.

## Stage 2: Hiring-manager screen (45 min)

Goal, rubric dimensions, behavioral questions with probes, scorecard
scaffold link.

## Stage 3..N: On-site interviews (60 min each)

For each stage:

- Rubric dimension (single competency)
- Anchor descriptions for the candidate's level band (5 lines, one
  per score level, pulled from competency library)
- Behavioral questions with probes (3-5)
- Scorecard scaffold link

## Suggested interviewer assignments

| Stage | Primary | Backup | Rationale |
|---|---|---|---|

## Stage N+1: Debrief

Format (independent scoring before discussion), decision criteria
(explicit thresholds), debrief facilitator.

## Candidate-experience pass

- Total active interview time
- Distinct interviewers
- Cross-timezone stages with accommodation TODOs
- Redundant signal flagged
- Take-home recommendation if loop is over the time cap

## Open TODOs for hiring manager

- ...
```

## scorecards/<NN>-<stage-id>.md format

```markdown
# Scorecard — {Stage} ({Competency})

**Candidate:** {name}
**Interviewer:** {name}
**Date:** {YYYY-MM-DD}
**Level:** {level}

## Rubric dimension: {Competency}

Anchor descriptions ({level band}):
- 5 — {anchor}
- 4 — {anchor}
- 3 — {anchor}
- 2 — {anchor}
- 1 — {anchor}

## Behavioral questions

1. {Question}
   - Probe: {follow-up}
   - Notes:
2. ...

## Scoring

- Score: ___ / 5
- Evidence (cite candidate's words for the score):
- Hire / no-hire on this dimension: ___
- One-line rationale:

## Submit

Independent scoring submitted to debrief before discussion.
```

## What the format enforces

- Every rubric dimension has anchor descriptions inline. No "rate 1
  to 5" without anchors.
- Every behavioral question has a probe. Interviewers do not have to
  invent follow-ups in the moment.
- Every interviewer assignment has a rationale. The hiring manager
  can audit why a person was assigned without re-running the skill.
- The candidate-experience pass is a section, not a sentence.
- Open TODOs are explicit. The skill never silently leaves a gap.

## Last edited

{YYYY-MM-DD}
