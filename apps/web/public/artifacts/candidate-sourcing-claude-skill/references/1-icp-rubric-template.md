# ICP rubric — TEMPLATE (per role)

> Replace this template's contents with the rubric for the specific role.
> The candidate-sourcing skill scores against the four dimensions below.
> Each dimension MUST have behavioral anchors — vague labels ("senior")
> without anchors produce noisy and biased scoring.

## Role identity

- **Title**: {e.g. Senior Backend Engineer, Platform}
- **Level**: {IC4 / IC5 / EM1 — your internal scale}
- **Location policy**: {remote-US / hybrid-NYC-2dpw / onsite-Berlin}
- **EEOC job category**: {2 — Professionals (most engineers); see EEO-1}
- **Comp band (recruiter-internal, never sent to skill output)**: {range}

## Dimension 1 — Skill match (1-5)

The candidate's profile shows direct experience with the must-have technologies and the specific problem-shape of the role.

| Score | Anchor |
|---|---|
| 5 | Held a role doing exactly this work for ≥2 years; cites artifacts (talks, OSS, posts). |
| 4 | Held a role doing exactly this work for ≥1 year; no artifacts. |
| 3 | Adjacent work (e.g. Java backend role for a Go role); transferable. |
| 2 | Tangential work; would require ramp. |
| 1 | No evidence in profile. |

## Dimension 2 — Level fit (1-5)

The candidate's stated scope and tenure pattern match the level the role is hiring at. Do NOT use school prestige, employer prestige, or title inflation as a level signal — anchor on scope description.

| Score | Anchor |
|---|---|
| 5 | Profile shows scope at or above target level (multi-team, mentoring, technical strategy). |
| 4 | Scope at target level for ≥1 year. |
| 3 | One level below target; growth trajectory plausible. |
| 2 | Two levels below; reach. |
| 1 | More than two levels off, in either direction. |

## Dimension 3 — Company-pattern fit (1-5)

The shape of the candidate's prior employers matches the shape of yours (stage, scale, regulated/unregulated, B2B/B2C). Anchor on *characteristics*, not brand names — brand-name scoring is the most common bias vector in AI-augmented sourcing.

| Score | Anchor |
|---|---|
| 5 | ≥2 prior employers match {stage/scale/domain pattern}. |
| 4 | 1 prior employer matches; others adjacent. |
| 3 | All adjacent (different domain, similar stage). |
| 2 | Mostly mismatched; one transferable role. |
| 1 | No pattern match. |

## Dimension 4 — Response likelihood (1-5)

How likely the candidate is to respond to outreach right now.

| Score | Anchor |
|---|---|
| 5 | Profile updated <30 days; "open to opportunities" set; recently posted about job search. |
| 4 | Profile updated <90 days. |
| 3 | Profile updated <180 days. |
| 2 | Profile updated <12 months. |
| 1 | Stale profile (>12 months) — *also flagged in pre-filter for drop at >18mo*. |

## Disqualifiers (deterministic, applied in step 3 of the skill)

These cause the candidate to be surfaced in the "skipped" table, not auto-rejected. The recruiter decides.

- Current company is on do-not-poach list (`{path-to-list}`).
- Email or LinkedIn URL appears in `exclude_list`.
- Stated location does not match role's location policy + radius.
- Profile last updated >18 months ago.

## Bias guards (refusal triggers — skill aborts in step 1 if present)

If any of the following appear in this rubric, the skill refuses to run:

- School-tier scoring as a standalone dimension.
- Name-based filtering or scoring.
- Photo-based scoring.
- Employment-gap penalties without a job-related justification.
- Age inferred from graduation year used in any dimension.
- Gender, ethnicity, religion, sexual orientation, parental status, or disability status as a scored or filtered dimension.
- "Culture fit" without behavioral anchors.

## Last edited

{YYYY-MM-DD} — bump on every material change. The skill captures the SHA-256 of this file in its audit log per run.
