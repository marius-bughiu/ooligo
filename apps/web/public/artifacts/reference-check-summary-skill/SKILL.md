---
name: reference-check-summary
description: Take reference-call notes (transcript or summary) plus the role rubric, and produce a structured per-dimension reference report with verbatim quotes, contradictions surfaced, and per-dimension confidence bands. Never authors an overall hire/no-hire recommendation — the decision sits with the hiring manager.
---

# Reference-check synthesis

## When to invoke

Use this skill when a recruiter has completed two or more reference calls and has notes (transcript, recorded call summary, or detailed manual notes) plus the role rubric. Take the notes plus rubric as input and return a structured Markdown report.

Do NOT invoke this skill for:

- **Generating a hire/no-hire recommendation.** This skill produces structured assessment with confidence per dimension. The hire decision sits with the hiring manager and the interview debrief.
- **Replacing the reference call itself.** This skill processes notes; it does not interview references. AI-generated reference questionnaires erode the reference's willingness to speak candidly.
- **Recording calls without consent.** The skill processes notes regardless of recording status, but does not authorize recording. Two-party-consent jurisdictions and EU GDPR have explicit lawful-basis requirements.
- **Backchannel references the candidate did not approve.** Different consent posture, different workflow.

## Inputs

- Required: `notes_dir` — path to a directory of per-reference Markdown files. Each file: `R1.md`, `R2.md`, etc., with the reference's name, role, relationship, call date, and notes.
- Required: `rubric` — path to the role rubric file. The rubric's dimensions become the report's headings.
- Required: `consent_log` — path to a per-reference consent record (see `references/2-consent-checklist.md`).
- Optional: `candidate_resume` — path to the resume. Used to ground statements like "the reference confirmed the deal mentioned on the resume" rather than re-narrating the resume.

## Reference files

Always read these from `references/`:

- `references/1-report-format.md` — the literal output format. Per-dimension headings come from the rubric, not from this file.
- `references/2-consent-checklist.md` — the consent-check schema and the warning-header rules.

## Method

Five steps, in order.

### 1. Validate consent

Open `consent_log`. For each reference, check four fields: `candidate_authorized` (the candidate gave the recruiter permission to call this person), `recording_consent` (if the call was recorded), `notes_processing_consent` (the reference was told the notes might be processed by AI), `jurisdiction` (which state / country the reference was in during the call).

If any field is `unknown` or `no`, do NOT halt — emit a warning header at the top of the report and continue. The recruiter may have collected consent verbally and forgotten to log it; the warning surfaces the gap for them to verify before sharing the report.

If `recording_consent: no` and `jurisdiction` is in `[CA, IL, FL, MD, MA, MI, MT, NH, PA, WA]` or any EU country, the warning header upgrades to a halt: "Two-party consent jurisdiction; recording without consent is illegal. The skill will not process the notes from this reference. Verify consent and re-run with `consent_log` updated, or omit this reference."

### 2. Ground in the rubric

Read the rubric. The synthesis dimensions ARE the rubric dimensions, not generic ones. If the rubric has `skill_match`, `level_fit`, `ownership_signal`, `team_collaboration`, those are the report's section headings.

If the rubric has dimensions that fail a fairness check (school-tier scoring, "culture fit" without anchors, employment-gap penalties), surface them but proceed — the rubric is upstream of this skill, and the right fix is at the rubric layer, not by silently dropping dimensions here.

### 3. Per-dimension synthesis

For each rubric dimension, read every reference's notes and extract every quote that bears on the dimension. A quote is a verbatim string from the notes; paraphrasing is not allowed. If you cannot extract a verbatim quote for a reference's view on a dimension, the cell stays empty and the dimension's confidence band reflects the gap.

Tag each quote with strength on a 5-level scale:

- `strong-positive` — explicit named outcome, clear ownership, the reference stakes their credibility on it.
- `weak-positive` — observed positive behavior but no named outcome or scope.
- `neutral` — descriptive without judgment.
- `weak-negative` — observed gap or hesitation, qualified.
- `strong-negative` — explicit disqualifying behavior named, with scope.

### 4. Surface contradictions and gaps

For each dimension, compare the per-reference assessments. If two references diverge by ≥2 levels (e.g. one `strong-positive`, one `weak-negative`), surface the contradiction explicitly with both quotes side by side. Do NOT average or smooth — the contradiction IS the signal.

For each dimension, identify gaps: dimensions no reference covered. List them in a "Coverage gaps" section. The recruiter uses this to decide what to ask the next reference, or what the rubric ranking step has to lean on instead.

### 5. Confidence band per dimension

For each dimension, return a confidence band:

- `high` — multiple references converge with strong-positive or strong-negative quotes.
- `medium` — references mostly converge, weak-positive / weak-negative quotes, no contradictions.
- `low` — single reference, contradiction surfaced, or only weak-strength quotes.
- `not assessed` — no reference covered the dimension.

Do NOT return an overall hire/no-hire score. The report ends after the last dimension's confidence band.

## Output format

See `references/1-report-format.md` for the literal template. The shape is:

```
# Reference report — {Candidate name} — {Role}

[CONSENT WARNING HEADER if any reference's consent is missing]

## References

| ID | Name | Role | Relationship | Call date |
|---|---|---|---|---|
| R1 | ... | ... | ... | ... |

## Per-dimension synthesis

### {Dimension 1 from rubric}

**Confidence: {band}**

| Reference | Strength | Quote |
|---|---|---|
| R1 | strong-positive | "..." |
| R2 | weak-positive | "..." |

[CONTRADICTION block if R1 and R2 diverge ≥2 levels]

### {Dimension 2 from rubric} ...

## Coverage gaps

Dimensions no reference addressed:
- {dimension X} — recruiter to ask R3 or rely on rubric ranking step.

## Provenance

- Rubric: `{path}` — SHA `{short}`
- Notes: `{notes_dir}` — N references processed
- Generated: `{ISO timestamp}`
```

## Watch-outs

- **Hallucinated quotes.** *Guard:* the prompt forbids paraphrasing; quotes must appear verbatim in the input notes. If you cannot find a verbatim quote for a reference's view on a dimension, the cell is empty and the confidence band drops.
- **Hindsight bias.** *Guard:* the report is structured per-dimension, not per-reference. A strongly opinionated reference cannot dominate the narrative because the report doesn't have a narrative — it has a table per dimension.
- **Implicit recommendation via ordering.** *Guard:* dimensions are ordered by rubric, not by reference enthusiasm. Strong-positive quotes do not float to the top.
- **Consent gaps.** *Guard:* warning header on missing consent; halt on illegal recording in two-party jurisdictions.
- **Bias inheritance from rubric.** *Guard:* surfaced but not silently dropped — the right fix is at the rubric layer, upstream of this skill.
