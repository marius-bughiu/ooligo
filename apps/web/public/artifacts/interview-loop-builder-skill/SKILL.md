---
name: interview-loop-builder
description: Take a job description, level, must-have competencies, and an interviewer pool with strengths, and produce a complete interview loop design — stage progression, per-stage rubric, behavioral questions per dimension, and interviewer assignments paired with the rubric dimension each one is scoring. Stops at a hiring-manager review gate before the loop is configured in the ATS.
---

# Interview loop builder

## When to invoke

Use this skill when a recruiter or hiring manager has a confirmed
opening, an approved JD, and needs the structured interview loop
designed before the first candidate moves into the screen stage. Take
the JD, the role's level, the must-have competencies, and the eligible
interviewer pool with each interviewer's calibrated strengths, and
produce a Markdown loop design plus per-stage scorecard scaffolds.

Do NOT invoke this skill for:

- **Auto-scheduling.** This skill designs the loop; it does not
  schedule. Calendar coordination, interviewer-availability matching,
  and candidate-facing booking links are Ashby Scheduling, Greenhouse
  Scheduling, or Goodtime's job. Mixing design and scheduling in one
  skill couples two failure modes that should fail independently.
- **Replacing the rubric design with the hiring manager.** The skill
  maps competencies to a rubric *dimension* and writes anchor
  descriptions per score level, but the actual rubric per role family
  is owned by the hiring manager and the head of the function. If
  `references/1-competency-library.md` is empty or all-template, the
  skill refuses and surfaces a TODO rather than inventing a rubric for
  a function it has no calibrated signal on.
- **Generic templated loops without role-specific calibration.** If the
  inputs do not name the level, the must-have competencies, or the
  interviewer pool, the skill refuses. A four-stage loop with generic
  "behavioral", "technical", "system design", "leadership" labels
  passes for structured but is not — every candidate gets the same
  questions regardless of role priorities, which defeats the point.
- **Roles below a defined complexity threshold.** A two-week contractor
  role does not need a four-stage loop. The skill warns and suggests a
  one-stage screen if the role is contract, hourly, or under 6 months
  expected tenure.

## Inputs

- Required: `job_description` — path to a Markdown file (typically the
  output of the JD-writer skill, or a manually authored JD).
- Required: `level` — one of `IC1`, `IC2`, `IC3`, `IC4`, `IC5`, `IC6`,
  `M1`, `M2`, `M3`, `Director`, `VP`. Drives loop length and the
  competency-to-stage mapping.
- Required: `must_have_competencies` — array of 3-6 competency IDs
  drawn from `references/1-competency-library.md`. The skill maps each
  to a stage and refuses if more than 6 are provided (loop length
  blows out, signal per interview drops).
- Required: `interviewer_pool` — path to
  `references/2-interviewer-strengths.md` filled in for the role's
  function, listing each eligible interviewer with their calibrated
  strengths (which competencies they have been calibrated to score on
  what level bands).
- Optional: `loop_length_max` — hard cap on number of post-screen
  stages, default 4. Above 5, the skill warns about
  candidate-experience cost.
- Optional: `time_zone` — interviewer/candidate timezone hint used in
  the candidate-experience pass to flag any cross-timezone stages
  that need an explicit accommodation.

## Reference files

Always read these from `references/` before generating the loop. They
contain the user's competency taxonomy, the interviewer pool, and the
output format. Without them, the loop is a template, not a design.

- `references/1-competency-library.md` — the team's calibrated
  competency taxonomy with rubric dimensions and behavioral-anchor
  descriptions per score level. Replace the template with your real
  library before running.
- `references/2-interviewer-strengths.md` — the eligible interviewer
  pool with each interviewer's calibrated strengths. The skill matches
  competencies to interviewers using this matrix.
- `references/3-loop-output-format.md` — the literal Markdown format
  the skill emits, including the per-stage rubric block, the
  interviewer-assignment table with rationale, and the
  candidate-experience summary.

## Method

Run these six steps in order. Do not parallelize — later steps depend
on context from earlier steps, and the candidate-experience pass at
the end deliberately re-reads the assembled loop to catch overload
that is invisible while assigning each stage in isolation.

### 1. Validate inputs

Open `job_description`, `references/1-competency-library.md`, and
`references/2-interviewer-strengths.md`. Confirm:

- Each ID in `must_have_competencies` exists in the competency library.
  Unknown IDs → stop and surface them.
- The interviewer pool contains at least one interviewer calibrated on
  each must-have competency at the role's level. If a competency has
  no calibrated interviewer, surface a TODO ("hire / calibrate an
  interviewer for {competency} at {level} before designing this
  loop") and stop.
- The level falls inside the range the competency library has anchor
  descriptions for. Designing a Director loop with an IC-only library
  produces inflated rubrics; refuse.

### 2. Map competencies to stages

For each must-have competency, decide the stage where it is best
evaluated. The mapping is opinionated:

- **Recruiter screen** evaluates fit, interest, comp alignment, and
  basic must-have-skill confirmation. Never a competency dimension on
  the rubric — recruiters do not score the rubric.
- **Hiring-manager screen** evaluates the top 1-2 competencies that
  most differentiate hire / no-hire on this role. The HM is the
  highest-signal interviewer; spending HM time on lower-priority
  competencies wastes calibration.
- **On-site loop** spreads remaining competencies one-per-interview
  where possible. One competency per interview is the engineering
  choice — bundling two competencies into one 60-minute interview
  produces shallower signal on both, and it makes the rubric harder
  for the interviewer to apply in the moment.
- **Working-session / take-home** (optional, only for IC4+ technical
  roles) evaluates competencies that need extended time or written
  artefact (system design, written communication, code review depth).

The output of this step is a `competency → stage` table with the
rationale for each placement.

### 3. Design the per-stage rubric

For each post-screen stage, generate the rubric block. Each rubric
dimension corresponds to one competency from step 2. For each
dimension:

- Pull the anchor descriptions from
  `references/1-competency-library.md` for the candidate's level band.
- Generate 3-5 behavioral questions that probe the dimension. Each
  question must reference the situation / behavior / outcome shape;
  hypothetical "what would you do if…" questions are excluded by
  default because they reward articulate guessing over evidenced
  experience.
- Generate one suggested probing follow-up per question for the
  interviewer to use when the candidate's first answer is shallow.

The choice to include anchors and follow-ups in the output (rather
than just the questions) is what separates a usable scorecard from
"here are some questions, score it from 1 to 5". Without anchors,
calibration drifts within a single loop.

### 4. Assign interviewers with rationale

For each post-screen stage, propose 1-3 interviewer candidates from
the eligible pool. Match by:

- Calibration fit — the interviewer is calibrated on this competency
  at this level band. Hard requirement.
- Load balance — no interviewer is assigned to more than one stage in
  the same loop. Prevents the
  "only one person actually evaluates this candidate" failure mode
  where a single interviewer dominates the debrief.
- Diversity of perspective — where the eligible pool allows, propose
  at least one interviewer from outside the hiring team to reduce
  consensus bias in the debrief.

Output: an assignment table with the rationale per assignment ("Jamie
calibrated at IC4 on systems-design; Priya outside the hiring team,
last interviewed at this level 6 weeks ago").

### 5. Candidate-experience pass

Re-read the assembled loop and check, in order:

- Total interview time across all stages. Above 5 hours active for an
  IC role or 7 hours for a leadership role, flag and suggest moving
  one competency to a take-home.
- Number of distinct interviewers the candidate meets. Above 6, flag
  ("loop fatigue").
- Stages that require the candidate to repeat the same story. If two
  stages probe the same competency, surface as redundant.
- Cross-timezone stages without an accommodation note. Surface a TODO
  for the recruiter.

The choice to do this as a separate step rather than during stage
design is deliberate: while assigning each stage in isolation it is
easy to add "one more 30-minute conversation"; only by re-reading the
full assembled loop does the candidate-side cost become legible.

### 6. Hiring-manager review gate

Stop. Write the loop design to `loop.md` per the format in
`references/3-loop-output-format.md`. Write each stage's scorecard
scaffold to `scorecards/<stage>.md`. Do not push anything to Ashby,
Greenhouse, or Lever. Do not mark the role as "loop ready" in the ATS.
Surface the path to both files and exit.

The hiring manager's job from here: read the loop, validate the
competency-to-stage mapping reflects the actual role priorities, edit
the questions, and configure the loop in the ATS. The skill does not
re-enter the loop until the hiring manager confirms changes for a
v2 design.

## Output format

```markdown
# Interview loop — {Role title} ({level})

Generated: {ISO timestamp} · Competencies: {n} · Stages: {n} · Total active time: {hours}

## Competency → stage mapping

| Competency | Stage | Rationale |
|---|---|---|
| Systems design | On-site Interview B | Highest differentiator at IC5; needs 60min for depth |
| Stakeholder influence | HM screen | Top hire/no-hire signal for this role |
| ... | ... | ... |

## Stage 1: Recruiter screen (30 min)

- Goal: confirm fit, interest, must-have-skill basics, comp alignment
- Key questions: ...
- Disqualifying signals: ...
- Not on rubric (screen, not scored)

## Stage 2: Hiring-manager screen (45 min)

- Goal: depth on {top 1-2 competencies}
- Rubric dimensions: {dim 1}, {dim 2}
- Behavioral questions:
  1. {Question} — Probe: {follow-up}
  2. ...
- Scorecard scaffold: `scorecards/02-hm-screen.md`

## Stage 3: On-site Interview A — {Competency} (60 min)

- Rubric dimension: {dim}
- Anchor descriptions ({level band}):
  - 5 — {anchor}
  - 4 — {anchor}
  - 3 — {anchor}
  - 2 — {anchor}
  - 1 — {anchor}
- Behavioral questions:
  1. {Question} — Probe: {follow-up}
  2. ...
- Scorecard scaffold: `scorecards/03-onsite-a.md`

## Suggested interviewer assignments

| Stage | Primary | Backup | Rationale |
|---|---|---|---|
| HM screen | {HM name} | — | hiring manager |
| Onsite A — Systems design | Jamie L. | Priya R. | Jamie calibrated IC5 systems-design; Priya outside hiring team |
| ... | ... | ... | ... |

## Stage N: Debrief

- Format: independent scoring submitted before discussion
- Decision criteria: {explicit thresholds — e.g. "no rubric dimension < 3, aggregate >= 16"}

## Candidate-experience pass

- Total active interview time: {hours}
- Distinct interviewers: {n}
- Cross-timezone stages: {none | list with accommodation TODO}
- Redundant signal flagged: {none | list}
- Take-home recommendation: {none | move {competency} to take-home}

## Open TODOs for hiring manager

- ...
```

## Watch-outs

- **Interviewer overload from the same person being assigned
  everywhere.** *Guard:* step 4 enforces "no interviewer in more than
  one stage of the same loop" as a hard rule. The assignment table
  surfaces backup interviewers per stage so the recruiter has a
  fallback when the primary is unavailable, rather than re-using the
  primary in two stages.
- **Redundant signal across stages.** *Guard:* the
  candidate-experience pass in step 5 re-reads the loop and flags any
  competency probed in more than one stage. The competency-to-stage
  table in the output makes redundancy visible to the hiring manager
  in review.
- **Candidate experience neglected.** *Guard:* the
  candidate-experience pass in step 5 is a separate, named step rather
  than a sentence at the bottom of the loop. It enforces total-time
  caps, distinct-interviewer caps, take-home suggestions for
  competencies that bloat the loop, and timezone accommodation TODOs.
- **Calibration drift inside a single loop.** *Guard:* the rubric
  block emitted in step 3 includes anchor descriptions per score
  level pulled from the competency library, not free-text "rate 1 to
  5". Anchors are the thing that holds calibration when the same
  candidate is scored by four different interviewers.
- **Hiring manager rubber-stamps the design.** *Guard:* skill stops at
  the review gate in step 6 and writes to files. There is no "publish
  to ATS" action defined anywhere in this skill. The HM has to open
  the file and edit it before configuring the loop.
- **Generic loops where role specificity matters.** *Guard:* step 1
  refuses to run if `must_have_competencies` is empty or if the
  interviewer pool is missing calibrated coverage. The skill never
  falls back to a "default loop" for the function.
