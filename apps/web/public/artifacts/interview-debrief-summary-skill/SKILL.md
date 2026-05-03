---
name: interview-debrief-summary
description: Synthesize a panel's per-interviewer scorecards (and optional transcripts) into an evidence-grounded debrief brief. Surfaces aggregate signal per rubric dimension, areas of agreement and disagreement, a recommended decision-point for the panel, and follow-up questions when signal is thin. Always stops short of issuing a hire/no-hire decision — the panel decides.
---

# Interview debrief summary

## When to invoke

Invoke this skill once a candidate's full interview loop has concluded and all interviewers have submitted their scorecards. The output is a brief the panel reads *before* the synchronous debrief meeting, so the meeting discusses the actual disagreements rather than being a 90-minute round of note-comparison.

Trigger conditions:

- All scheduled interviews completed in the ATS ([Ashby](/en/tools/ashby/), [Greenhouse](/en/tools/greenhouse/), [Lever](/en/tools/lever/)).
- Every interviewer has submitted a structured scorecard against the role rubric (free-text-only scorecards fail the input check in step 1).
- The debrief meeting is at least 2 hours away (so the brief can be read in advance, not skimmed during the call).

Do NOT invoke for:

- **Auto-deciding hire/no-hire.** This skill never emits a final decision. It emits an aggregate signal and a recommended decision-point for the panel to resolve. Auto-deciding would put the workflow inside EU AI Act Annex III high-risk obligations and most US state hiring-AI statutes (NYC LL 144, IL AIVI, MD HB 1202).
- **Sending feedback to the candidate without recruiter review.** The brief is internal-only. Synthesized rationale text can include phrasing that is fine for an internal panel but actionable as evidence in a discrimination claim if surfaced to the candidate verbatim.
- **Replacing the panel-debrief conversation.** The brief is the input to the discussion, not a substitute. Skipping the debrief because "the brief already shows consensus" is a failure mode this skill is designed to surface against (see `references/3-disagreement-escalation.md`).
- **Single-interviewer loops.** If only one interviewer was scheduled, do not invoke — there is nothing to aggregate. Run a different workflow (single-interviewer feedback) instead.
- **Transcripts without consent.** Do not pass [BrightHire](/en/tools/brighthire/) or [Metaview](/en/tools/metaview/) transcripts unless the candidate consented to recording at interview start. Two-party-consent jurisdictions (CA, FL, IL, MD, MA, MT, NH, PA, WA) make this a hard halt, not a guideline.

## Inputs

- Required: `candidate_id` — the ATS-internal candidate ID.
- Required: `role_rubric` — path to a Markdown file under `references/` with the structured rubric (dimensions, 1-5 anchor scale, anchor descriptions per level). Without this the skill refuses to run; an unstructured rubric is the most common cause of vague synthesis.
- Required: `scorecards` — an array of per-interviewer scorecard objects. Each object: `interviewer_id`, `interviewer_role` (one of `hiring_manager`, `peer`, `cross_functional`, `bar_raiser`), `dimension_scores` (map of dimension name to integer 1-5), `evidence_notes` (map of dimension name to free-text observation, minimum 20 characters per dimension).
- Required: `candidate_metadata` — `role_title`, `level_band`, `loop_type` (one of `onsite`, `virtual_onsite`, `phone_screen_panel`).
- Optional: `transcripts` — array of paths to BrightHire / Metaview transcript exports. When present, the skill cites supporting moments per evidence claim. When absent, the brief notes "transcript-unsupported" on each dimension synthesis.
- Optional: `prior_debriefs` — paths to previous debrief briefs for the same role, used by the calibration check in step 5.

## Reference files

Always read the following from `references/` before generating the brief. They contain the rubric scaffolding, the literal output format, and the disagreement-escalation rules. Without them the brief is generic and the guards that keep the synthesis defensible do not run.

- `references/1-interview-rubric-template.md` — the structured rubric template the role rubric must conform to. Replace the template content with your role-specific rubric before running. The skill validates the passed-in `role_rubric` against this shape.
- `references/2-debrief-brief-format.md` — the literal output format, including the per-dimension synthesis layout and the decision-point-for-the-panel block. The skill writes against this format verbatim — do not freestyle.
- `references/3-disagreement-escalation.md` — rules for when a disagreement gets surfaced as a decision-point versus left as a note. Includes the bar-raiser-veto and the hiring-manager-vs-peer-divergence rules.

## Method

Run these six steps in order. Steps 1-3 are deterministic input validation and aggregation; only step 4 uses the LLM for synthesis. Running the LLM over an unvalidated, free-text-only rubric or over a single interviewer's scorecard produces output that is fast, confident, and unusable.

### 1. Validate the rubric and inputs

Open `role_rubric` and verify it conforms to the shape in `references/1-interview-rubric-template.md`: every dimension has a 1-5 anchor table, every anchor has a behavioral description, no dimension allows free-text scoring only. Halt if any check fails — surface the offending lines.

Then validate `scorecards`:

- At least 3 distinct interviewers (below 3, panel synthesis is not meaningful — surface a one-interviewer single-feedback note instead).
- Every dimension in the rubric is scored by at least 2 interviewers (gaps mean the loop did not cover the dimension; surface as a follow-up question rather than synthesizing absent signal).
- `evidence_notes` strings ≥ 20 characters on every score (free-text-only interviewers get bumped back to re-fill before the brief runs).

The choice to halt rather than warn is intentional: a brief generated on partial inputs becomes the panel's mental anchor, even when the generator notes the partial inputs. Halting forces the missing inputs to be filled before the discussion frame is set.

### 2. Aggregate per dimension (deterministic)

For each rubric dimension, compute:

- Mean score across interviewers.
- Min and max (the range — the disagreement signal).
- Standard deviation (used in step 4 to weight whether to surface as a decision-point).
- Per-interviewer-role breakdown (hiring_manager, peer, cross_functional, bar_raiser scores listed separately so structural disagreements surface).

Why structured rubric instead of free-form synthesis: a free-form synthesis loses the per-dimension comparability that lets the panel discuss specific evidence rather than overall impressions. Without per-dimension comparability, the debrief reverts to "everyone shares their gut feeling, loudest voice wins" — which is the failure mode this entire skill exists to prevent.

### 3. Identify decision-points (deterministic)

Apply the rules from `references/3-disagreement-escalation.md`:

- **Range ≥ 2 across interviewers on any single dimension** → surface as a decision-point.
- **Bar-raiser score ≥ 2 below the panel mean on any dimension** → surface as a decision-point regardless of range (bar-raiser veto semantics).
- **Hiring-manager score ≥ 2 above any other interviewer's score** → surface as a decision-point (single-strong-opinion guard).
- **No-hire from any one interviewer when the rest are hire** → surface as a decision-point with the dissenting evidence verbatim.

These rules run before the LLM synthesizes, so the decision-points are based on the structured signal, not on what the LLM thinks reads as disagreement. The synthesis in step 4 then explains the underlying disagreement; it does not pick which disagreements matter.

### 4. Synthesize per dimension

For each rubric dimension, the LLM produces:

- A two-to-three-sentence synthesis of what the panel saw, grounded in `evidence_notes` strings cited verbatim (no paraphrasing — paraphrasing is where bias enters).
- The evidence supporting the higher scores, attributed to interviewer role (not name — names go in the appendix).
- The evidence supporting the lower scores, attributed similarly.
- When transcripts are available, the timestamp range in the transcript where the supporting evidence appeared. Format: `BrightHire 14:22-15:08`. When transcripts are absent, write `transcript-unsupported` and do not infer.

Why "insufficient signal" is a first-class output, not a fallback: the absence of evidence for a dimension is itself information the panel needs. A dimension with two scores both based on 20-character evidence notes is not "consensus at 4.0"; it is "two interviewers guessed at 4.0". The brief writes "insufficient signal — recommend follow-up" rather than "consensus" in that case. This is different from "no recommendation", which would withhold all output and leave the panel without a structured starting point.

### 5. Calibration check

If `prior_debriefs` is provided, compare the score distribution against the previous 5 debriefs for the same role. Flag if:

- This candidate's mean is more than 1 standard deviation above the rolling mean (possible halo / overscoring).
- This candidate's mean is more than 1 standard deviation below the rolling mean for a dimension where the role has historically scored high (possible single-strong-negative-opinion drag).

Calibration findings appear as a "Calibration note" block at the end of the brief, never inline in the per-dimension synthesis. The intent is to give the panel a frame for the discussion, not to override the specific signal on this candidate.

### 6. Write the brief and stop

Write to `briefs/<candidate_id>-<YYYYMMDD>.md` per the format in `references/2-debrief-brief-format.md`. Append a single line to `audit/<YYYY-MM>.jsonl`: `run_id`, `candidate_id`, `role`, `rubric_sha256`, `interviewer_count`, `dimensions_count`, `decision_points_count`, `transcripts_attached` (boolean), `model_id`, `timestamp`. No candidate PII in the audit line.

Do not call any "send to candidate", "post to Slack channel", or "update ATS stage" endpoint. The brief is internal to the panel until the recruiter and hiring manager decide what to do with the synthesis.

## Output format

```markdown
# Interview debrief brief — {candidate_id} · {role_title} · {level_band}

Generated: {ISO timestamp} · Loop: {loop_type} · Interviewers: {n} ·
Rubric SHA: {short} · Transcripts: {yes|no}

## Aggregate signal

| Dimension | Mean | Range | HM | Peer | XFN | Bar-raiser |
|---|---|---|---|---|---|---|
| Technical depth | 4.2 | 4-5 | 5 | 4 | 4 | 4 |
| Systems design | 3.0 | 2-4 | 4 | 3 | 3 | 2 |
| Communication | 4.0 | 3-5 | 4 | 4 | 5 | 3 |
| Execution under pressure | 3.2 | 3-4 | 3 | 3 | 4 | 3 |
| Ownership | 4.5 | 4-5 | 5 | 4 | 5 | 4 |

## Per-dimension synthesis

### Technical depth — mean 4.2, range 4-5

The panel saw consistent depth on backend systems work. HM cites
"led the migration from a Postgres monolith to a sharded
Citus cluster, owned the cutover playbook end-to-end" (BrightHire
14:22-15:08). Peer and XFN cite the same migration with corroborating
detail. Bar-raiser scored 4 (not 5) on the basis that the candidate's
description of the rollback plan was "more reactive than I'd want at
this level" (transcript-unsupported, scorecard only). No decision-point
surfaced — disagreement is within tolerance.

### Systems design — mean 3.0, range 2-4 — DECISION-POINT

Range exceeds the threshold. HM scored 4 citing "drew the right
boundary between sync and async paths". Bar-raiser scored 2 citing
"could not articulate the trade-off between leader-follower and
multi-leader replication when prompted" (BrightHire 32:10-34:45). The
panel needs to resolve whether the bar-raiser's specific concern about
replication-topology fluency is load-bearing for the level, or whether
it is one weak moment in an otherwise strong design conversation.

### Communication — insufficient signal — RECOMMEND FOLLOW-UP

Two interviewers (HM, Peer) scored 4 with evidence notes under 30
characters. XFN scored 5 with no evidence note. Bar-raiser scored 3
with the note "felt scripted on the situational question, but I may
be reading too much in." This is not consensus at 4.0; it is
under-evidenced. Recommend follow-up question in the next round if
the candidate advances, or a 30-minute follow-up call with the
bar-raiser to walk through the specific moments.

[continues for each remaining dimension]

## Decision-points for the panel

1. **Systems design — replication-topology fluency.** Bar-raiser scored
   2, HM scored 4. Resolve: is fluency on multi-leader vs
   leader-follower trade-offs required at this level, or is the broader
   design judgment sufficient?
2. **Communication — under-evidenced consensus.** Three scores cluster
   at 4-5 but evidence notes are thin. Resolve: do we trust the cluster,
   or do we ask for a follow-up signal?
3. **Bar-raiser dissent on technical depth.** Bar-raiser at 4 vs panel
   mean of 4.2 — within tolerance, but the rollback-plan concern is
   worth airing as a development area if hire.

## Follow-up questions if signal is thin

- For Communication: a 30-minute follow-up with the bar-raiser walking
  through the situational-question moments.
- For Systems design: a take-home or whiteboard follow-up specifically
  on replication topology trade-offs.

## Calibration note

This candidate's mean score across dimensions (3.78) is 0.4 standard
deviations above the rolling mean for the last 5 senior-backend
debriefs (3.51). Within tolerance — no calibration concern flagged.

## Appendix — per-interviewer evidence

[Per-interviewer scorecards, with names, in full. The synthesis above
attributes by role only; names live here so the panel can ask
specific interviewers to elaborate without ambiguity.]
```

## Watch-outs

- **Bias from one strong opinion (anchoring on the first scorecard).** *Guard:* step 2 aggregates deterministically across all interviewers before the LLM sees any single scorecard, and step 3's hiring-manager-vs-peer-divergence rule explicitly surfaces single-strong-opinion divergence as a decision-point. The LLM does not "round up" toward the senior interviewer's score.
- **False consensus on under-evidenced dimensions.** *Guard:* `evidence_notes` minimum-length check in step 1 (≥ 20 chars), and step 4's "insufficient signal" first-class output. A dimension where three interviewers scored 4 with one-word evidence notes is written as "insufficient signal — recommend follow-up", not as "consensus at 4.0". This is the most common silent failure of free-form debriefs.
- **Score-arithmetic-as-decision (treating mean ≥ 3.5 as "hire").** *Guard:* the brief never emits a hire/no-hire recommendation. It emits decision-points for the panel. The output format intentionally has no "Recommendation" block — only "Decision-points for the panel" and "Follow-up questions". A reader who tries to read off a decision finds the structure pushes them back to discussion.
- **Bar-raiser veto silently overridden.** *Guard:* step 3's rule surfaces any bar-raiser score ≥ 2 below the panel mean as a decision-point automatically. The brief cannot be generated in a state where a bar-raiser dissent is averaged away.
- **Demographic patterns leaking into synthesis.** *Guard:* the synthesis cites `evidence_notes` strings verbatim rather than paraphrasing, which prevents the LLM from rewriting an observation into language that telegraphs a protected-class inference. If a passed-in `evidence_note` itself contains protected-class proxies, the skill halts in step 1 and surfaces the offending note for re-write before continuing.
- **Calibration note overinterpreted as a verdict.** *Guard:* the calibration block is appended at the end of the brief, never inline per dimension. The intent is to frame the conversation, not adjust individual scores. The brief explicitly says "within tolerance" or "outside tolerance — discuss" rather than suggesting an action.
