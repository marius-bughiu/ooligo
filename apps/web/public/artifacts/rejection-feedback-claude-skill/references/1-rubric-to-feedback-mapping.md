# Rubric-to-feedback mapping — TEMPLATE

> Replace this template with your team's approved candidate-facing
> phrasing per rubric dimension. The rejection-feedback skill reads
> this file in step 4 to translate scorecard language (which is
> internal, often blunt) into candidate-facing language (which must
> be specific, evidence-grounded, and EEOC-safe). Without this file
> the skill will not draft specifics — it falls back to the generic
> decline template.

## How this file is used

The skill matches each surfaced dimension (from step 3) against the
`dimension_id` below, then uses the `candidate_facing_phrasing`
template, substituting in the verbatim evidence string from the
scorecard or transcript.

If a dimension is surfaced by step 3 but has no entry below, the
skill will NOT draft specifics for it — the dimension is dropped.
This forces the team to deliberate on candidate-facing phrasing
once, in writing, rather than letting the LLM improvise per run.

## Dimension entries

### dimension_id: technical_depth

**internal_label**: Technical depth (1-5)

**rubric_anchors**:

- 5: Reasons fluently across multiple layers of the stack;
  explores tradeoffs unprompted.
- 4: Reasons clearly within their primary layer; surfaces
  tradeoffs when asked.
- 3: Recalls correct patterns; tradeoff reasoning needs
  prompting.
- 2: Recalls patterns inconsistently; tradeoff reasoning
  absent or shallow.
- 1: Patterns incorrect or contradicted under follow-up.

**candidate_facing_phrasing** (used for mean ≤ 2):

```
In the {round_name} round, the team was looking for {specific_topic}
as part of {specific_decision_context}, and that did not come up.
That was the dimension that drove the decision for this specific
role.
```

Substitution sources:
- `{round_name}` → from scorecard `interview_round` field
- `{specific_topic}` → from `references/2-banned-phrase-blocklist.md`
  approved-topics list (NEVER free-text from the LLM)
- `{specific_decision_context}` → from rubric anchor text

**candidate_facing_phrasing** (used for mean ≥ 4, opening only):

```
{Strength_observation}. {Interviewer_count_phrase} cited
{specific_evidence} specifically.
```

---

### dimension_id: system_design

**internal_label**: System design (1-5)

**rubric_anchors**:

- 5: Drives the design conversation; surfaces consistency,
  availability, and operational tradeoffs unprompted.
- 4: Engages with tradeoffs when prompted; covers most major
  axes.
- 3: Engages with tradeoffs when prompted; covers one or two
  axes.
- 2: Tradeoff reasoning shallow; misses major axes that the
  role requires.
- 1: Cannot construct a system that meets the stated
  requirements.

**candidate_facing_phrasing** (used for mean ≤ 2):

Same template as `technical_depth`.

---

### dimension_id: collaboration

**internal_label**: Collaboration (1-5)

**rubric_anchors**:

- 5: Specific examples of cross-functional work, named
  tradeoffs, named outcomes.
- 4: Specific examples, less explicit on tradeoff reasoning.
- 3: General examples, no specifics on tradeoffs or outcomes.
- 2: Vague examples or examples that do not show collaboration
  evidence.
- 1: No relevant examples surfaced.

**candidate_facing_phrasing** (used for mean ≤ 2):

Same template as `technical_depth`. **Constraint:** never use the
words "communication", "fit", "soft skills", or "executive
presence" in the candidate-facing draft for this dimension. Those
terms are on the banned-phrase blocklist because they correlate
with bias claims.

---

## Constraints across all dimensions

- One strength and one gap per draft, maximum. The skill caps at one
  of each in step 4.
- Every substitution slot is filled from a structured field
  (scorecard, transcript, rubric anchor) or from the approved-topics
  list. The LLM never free-texts a substitution value.
- Comparative ranking is not in this file and is on the blocklist.
  If you find yourself adding "vs other candidates" phrasing, stop
  and revisit the rubric anchors instead.
- Update this file when the team revises rubric anchors. The skill's
  audit log captures `rubric_sha256` per run, so revisions are
  visible in retro.

## Last edited

{YYYY-MM-DD}
