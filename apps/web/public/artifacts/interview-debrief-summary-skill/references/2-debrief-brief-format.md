# Debrief brief — output format

> The interview-debrief-summary skill writes against this format
> verbatim in step 6. Do not freestyle the structure — the panel
> reads many of these and consistency is what makes them scannable.
> Replace `{placeholders}` with real values; keep the section
> headings and ordering exactly as below.

## Required structure

Every brief MUST contain these sections in this order:

1. Title line
2. Header (generated, loop type, interviewers, rubric SHA, transcripts)
3. Aggregate signal table
4. Per-dimension synthesis (one block per rubric dimension)
5. Decision-points for the panel
6. Follow-up questions if signal is thin
7. Calibration note (always present; says "no prior data" if first run)
8. Appendix — per-interviewer evidence

There is intentionally NO "Recommendation" section. The brief never
emits a hire/no-hire. The panel resolves the decision-points and
makes the call in the synchronous debrief.

## Template

```markdown
# Interview debrief brief — {candidate_id} · {role_title} · {level_band}

Generated: {ISO timestamp} · Loop: {loop_type} · Interviewers: {n} ·
Rubric SHA: {short} · Transcripts: {yes|no}

## Aggregate signal

| Dimension | Mean | Range | HM | Peer | XFN | Bar-raiser |
|---|---|---|---|---|---|---|
| {dimension 1} | {mean} | {min}-{max} | {score} | {score} | {score} | {score} |
| {dimension 2} | ... | ... | ... | ... | ... | ... |

Cells with no score: dash (`—`), not zero. The skill never imputes
a missing score.

## Per-dimension synthesis

For each dimension, one block in this exact shape:

### {Dimension name} — mean {x.x}, range {min}-{max}{ — DECISION-POINT|RECOMMEND FOLLOW-UP}{empty if neither}

{Two-to-three-sentence synthesis. Cite `evidence_notes` strings
verbatim in quotation marks. Attribute to interviewer ROLE, not
name (HM, Peer, XFN, Bar-raiser). When transcripts are available,
include the timestamp range as `(BrightHire 14:22-15:08)` after the
quoted evidence. When transcripts are absent, write
`transcript-unsupported` after the quoted evidence and do not infer.}

{Optional second paragraph: the disagreement, if a decision-point.
Names the specific resolved-vs-unresolved tension for the panel to
discuss. Two sentences max.}

The "DECISION-POINT" suffix is added when step 3's escalation rules
fire. The "RECOMMEND FOLLOW-UP" suffix is added when the synthesis
in step 4 marks the dimension as insufficient signal. Neither suffix
when the dimension is consensus-with-evidence.

## Decision-points for the panel

Numbered list. Each item names the dimension, the divergence, and the
specific question to resolve. Three to five items in a typical brief.
If there are zero decision-points, write the literal sentence:

> No decision-points surfaced. The panel may want to confirm that the
> consensus reflects shared evidence rather than shared assumptions
> before treating the loop as resolved.

(That fallback is intentional — frictionless consensus is itself a
calibration concern.)

## Follow-up questions if signal is thin

Bulleted list. Each bullet is a specific follow-up the panel could
run before deciding: a 30-minute follow-up call, a take-home, a
reference check on a specific dimension, a re-interview by a
specific role. Empty list is acceptable; write "None — signal is
sufficient on every dimension" if so.

## Calibration note

One paragraph. Compares this candidate's per-dimension score
distribution against the rolling mean from `prior_debriefs` (last 5
debriefs for the same role). Format:

> This candidate's mean score across dimensions ({x.xx}) is {n.n}
> standard deviations {above|below} the rolling mean for the last
> {k} {role_title} debriefs ({y.yy}). {Within tolerance — no
> calibration concern flagged. | Outside tolerance — discuss whether
> the rubric is being applied consistently this loop.}

If `prior_debriefs` was not provided: write "No prior debriefs
loaded. Calibration check skipped — recommend running with
`prior_debriefs` populated once 5+ same-role debriefs exist."

## Appendix — per-interviewer evidence

Per-interviewer scorecards in full, with names. The synthesis above
attributes by role only; names live here so the panel can ask
specific interviewers to elaborate without ambiguity.

For each interviewer:

### {Interviewer name} — {interviewer_role} — overall {summary score if scorecard provides one, else dash}

| Dimension | Score | Evidence |
|---|---|---|
| {dimension 1} | {score} | {evidence_notes string verbatim} |
| {dimension 2} | ... | ... |
```

## Formatting rules

- Soft-wrap prose paragraphs in the synthesis blocks. Tables, headings,
  and block quotes are preserved verbatim.
- Use `—` (em-dash) for missing values in the aggregate-signal table.
- Quote evidence notes verbatim in quotation marks. Do not paraphrase.
  Paraphrasing is where bias and false certainty enter.
- Interviewer-role labels in the synthesis: `HM`, `Peer`, `XFN`,
  `Bar-raiser`. Always exactly these strings — the brief is sometimes
  parsed downstream for analytics.
- Timestamp citations: `(Tool TimecodeStart-TimecodeEnd)`. The tool
  name is `BrightHire` or `Metaview`. Timecodes are `mm:ss-mm:ss`.
- File location: `briefs/<candidate_id>-<YYYYMMDD>.md`.

## What this format intentionally does NOT include

- A "Recommendation" or "Decision" section.
- A confidence score.
- A summary "lean" toward hire or no-hire.
- An overall pass/fail at the top of the brief.

These omissions are load-bearing. Every one of them, in earlier
iterations, became the one thing the panel read — turning the brief
into the decision and the meeting into a rubber stamp.
