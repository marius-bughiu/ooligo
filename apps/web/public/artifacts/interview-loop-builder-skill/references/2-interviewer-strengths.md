# Interviewer strengths matrix — TEMPLATE

> Replace this template's contents with your team's actual interviewer
> pool and calibrated strengths. The interview-loop-builder skill
> reads this file on every run; without it, the assignment table is
> guessed rather than matched.

## How to use

Each row is one eligible interviewer. Columns are the competency IDs from `1-competency-library.md`. Each cell is the level band(s) the interviewer is calibrated to score that competency on. Empty cell = not calibrated; the skill will not assign.

The skill reads this matrix in step 4 (interviewer assignment) and matches by:

1. Calibration fit (interviewer is calibrated on the competency at the candidate's level band).
2. Load — at most one stage per loop per interviewer.
3. Diversity — at least one interviewer from outside the hiring team when the eligible pool allows.

## Pool

| Interviewer | Team | systems-design | stakeholder-influence | technical-depth | ownership | communication-written | people-leadership | strategic-thinking | Last interview (date) |
|---|---|---|---|---|---|---|---|---|---|
| Jamie L. | Platform | IC4, IC5 | — | IC3, IC4 | IC4 | — | — | — | 2026-04-19 |
| Priya R. | Data | — | IC4, IC5, M1 | IC4 | IC4, IC5 | IC4, IC5 | — | — | 2026-04-22 |
| Marcus T. | Product | — | IC5, M1, M2 | — | IC5 | M1, M2 | M1, M2 | M2 | 2026-04-12 |
| Aiko S. | Eng leadership | IC5, IC6 | M1, M2, M3 | IC5 | IC5, M1 | M2, M3 | M1, M2, M3 | M2, M3, Director | 2026-04-26 |

> Replace the rows above with your real interviewer pool. The columns
> are the competency IDs you defined in `1-competency-library.md`.

## Calibration discipline

When you add an interviewer or extend an interviewer's coverage:

- They sit shadow on at least 2 interviews at the new level band, then reverse-shadow (they score, the calibrated interviewer audits) on at least 2 more.
- Both calibrated interviewer and new interviewer sign off in the matrix before the cell is added.
- Retire a calibration band if the interviewer has not used it in 6 months. The "Last interview" column is the trigger to re-calibrate.

## Outside-the-hiring-team rule

The skill prefers at least one interviewer outside the hiring team per loop, to reduce consensus bias in debriefs. To make this work:

- Tag each interviewer's `Team` accurately.
- Ensure the eligible pool for each role family includes at least 2 outside-team interviewers per must-have competency at the role's level. If it does not, the skill will assign in-team only and surface a TODO ("expand cross-team calibration for {competency}").

## Last edited

{YYYY-MM-DD} — update on every calibration change.
