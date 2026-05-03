# Competency library — TEMPLATE

> Replace this template's contents with your team's actual competency
> library. The interview-loop-builder skill reads this file on every
> run; without your real library, the loop output is generic and the
> rubric anchors are uncalibrated.

## How to use

Each competency has:

- A short ID (used by `must_have_competencies` in the skill input)
- A one-sentence definition
- The level bands it has anchor descriptions for
- Anchor descriptions per score level (1-5) per level band

The skill maps each competency to a stage and emits the anchors for the candidate's level band into the per-stage rubric.

## Coverage matrix

| Competency ID | Definition | Bands covered |
|---|---|---|
| systems-design | Designs systems that meet current requirements while preserving headroom for known future needs. | IC3, IC4, IC5, IC6 |
| stakeholder-influence | Builds shared understanding and commitment across stakeholders without formal authority. | IC4, IC5, IC6, M1, M2, M3 |
| technical-depth | Reasons from first principles in the candidate's primary technical domain. | IC1, IC2, IC3, IC4, IC5, IC6 |
| ownership | Drives ambiguous problems to resolution, including the parts not in the original scope. | IC2, IC3, IC4, IC5, IC6, M1, M2 |
| communication-written | Writes documents that move decisions forward without a meeting. | IC3, IC4, IC5, IC6, M1, M2, M3 |
| people-leadership | Hires, develops, and retains a high-performing team. | M1, M2, M3, Director, VP |
| strategic-thinking | Identifies the right problem to solve before optimizing the solution. | IC5, IC6, M2, M3, Director, VP |

## Per-competency anchors

### systems-design (IC4 band)

- **5** — Designs the system end-to-end including failure modes, upgrade paths, and observability. Names trade-offs explicitly with reasoning per axis (latency, cost, complexity, blast radius).
- **4** — Designs the happy path and the most likely failure modes. Names trade-offs but reasoning is uneven across axes.
- **3** — Designs the happy path. Identifies failure modes when prompted. Trade-offs implicit, surfaced under follow-up questioning.
- **2** — Designs a workable system but misses obvious failure modes or scaling cliffs. Trade-offs not articulated.
- **1** — Designs a system that does not meet stated requirements, or cannot articulate why a design is structured as proposed.

> Replace the IC4 anchors above with your real anchors. Add anchor
> blocks for IC3, IC5, and IC6 in the same shape.

### stakeholder-influence (M2 band)

- **5** — Names the specific stakeholders, their incentives, the surface area of the disagreement, and the sequence of conversations that produced commitment. Outcome was a documented decision change.
- **4** — Names the stakeholders and incentives, walks through conversations, but the outcome description is fuzzy.
- **3** — Walks through one or two conversations. Stakeholder incentives are inferred under prompting.
- **2** — Describes the disagreement and the resolution but cannot describe the work between them.
- **1** — Describes a meeting outcome with no underlying stakeholder work.

> Replace the M2 anchors above with your real anchors. Add anchor
> blocks for IC4, IC5, IC6, M1, M3 in the same shape.

## Calibration discipline

When you add or change anchors:

- Run a calibration session with at least 3 interviewers scoring the same recorded interview. If their scores diverge by more than 1 point, the anchors are not calibrated yet.
- Date each change. The skill does not version anchors automatically; if you change an anchor mid-loop, the consistency of the loop is on you.
- Retire anchors that the calibration set cannot reproduce. Vague anchors are worse than no anchors — they create the illusion of structure.

## Last edited

{YYYY-MM-DD} — update on every material change.
