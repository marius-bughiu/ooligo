# Disagreement escalation rules

> The interview-debrief-summary skill applies these rules in step 3
> (deterministic decision-point identification) before the LLM runs
> the per-dimension synthesis. The rules are deliberately strict —
> the cost of surfacing a non-disagreement as a decision-point is
> 2 minutes of panel discussion; the cost of averaging a real
> disagreement away is a regretted hire or a missed strong candidate.

## Rules

Apply each rule independently. A dimension that triggers any rule is flagged with the `DECISION-POINT` suffix in the synthesis output and appears in the "Decision-points for the panel" section.

### R1. Range-on-dimension

**Trigger:** any single dimension where `max(scores) - min(scores) >= 2`.

**Rationale:** a 2-point spread on a 1-5 scale crosses a meaningful behavioral anchor (e.g. "below the bar" to "at the bar"). Two interviewers seeing the same candidate that differently is a calibration issue or an evidence-asymmetry issue — both worth discussing.

**Example:** Systems design — HM 4, Peer 3, Bar-raiser 2. Range = 2. Surface as decision-point.

### R2. Bar-raiser-veto

**Trigger:** `bar_raiser_score <= panel_mean - 2` on any dimension, where `panel_mean` excludes the bar-raiser.

**Rationale:** the bar-raiser role exists to apply a level-consistent standard across many loops. A bar-raiser scoring 2+ below the rest of the panel on a dimension means the panel is calibrated to a different standard than the one the bar-raiser is holding. That gap is load-bearing — not a tie-breaker, but a calibration discussion.

**Example:** Technical depth — HM 5, Peer 4, XFN 4 (panel mean 4.33), Bar-raiser 2. Surface as decision-point.

**Edge case:** if there is no bar-raiser in the loop, this rule does not fire. The brief notes "no bar-raiser in loop" in the calibration block.

### R3. Hiring-manager-vs-panel divergence

**Trigger:** `hiring_manager_score >= max(other_scores) + 2` on any dimension.

**Rationale:** the hiring manager is the most consequential single voice in most hiring decisions and the most prone to single-strong- opinion bias. A hiring manager scoring 2+ above every other interviewer is the pattern that produces "we hired them because the HM loved them and nobody pushed back."

**Example:** Communication — HM 5, Peer 3, XFN 3, Bar-raiser 3. HM is 2 above max of others. Surface as decision-point.

**Note:** this rule fires *upward* (HM higher than panel), not downward. A hiring manager scoring well below the panel typically self-resolves in the meeting; the upward case is the one that needs structural escalation.

### R4. Single-no-among-yes

**Trigger:** any single interviewer's overall scorecard recommendation is `no_hire` or `strong_no` while every other interviewer recommends `hire` or `strong_hire`.

**Rationale:** a single dissenting no-hire is the highest-information signal in a debrief — either the dissenter saw something the panel missed (in which case the hire is at risk) or the dissenter has a miscalibration on this candidate (in which case it is a coaching opportunity for the dissenter). Both outcomes require explicit discussion. Averaging the dissent away is the failure mode.

**Example:** HM hire, Peer strong_hire, XFN hire, Bar-raiser no_hire. Surface as decision-point with the bar-raiser's evidence verbatim.

### R5. Coverage-gap

**Trigger:** any rubric dimension with fewer than 2 interviewer scores.

**Rationale:** a dimension scored by only one interviewer is not a panel signal; it is one person's read. The brief surfaces the gap as a follow-up question rather than as a decision-point — the recommended action is to gather more signal, not to debate the existing one.

**Output location:** appears in "Follow-up questions if signal is thin", not in "Decision-points for the panel".

### R6. Under-evidenced cluster

**Trigger:** a dimension where 3+ interviewers' scores cluster within 1 point AND the mean evidence-note length across those interviewers is below 30 characters.

**Rationale:** a tight cluster of scores backed by one-sentence evidence is "consensus" only in the same sense that "everyone agreed the food was fine" is a restaurant review. The synthesis writes it as `RECOMMEND FOLLOW-UP` rather than as agreement.

**Output location:** appears as `RECOMMEND FOLLOW-UP` suffix on the per-dimension synthesis AND in "Follow-up questions if signal is thin".

## Rules NOT applied

These were considered and explicitly rejected:

- **"Average score below 3.0 → no-hire decision-point."** Rejected because it conflates an aggregation rule (the brief never aggregates to a hire/no-hire) with an escalation rule (the brief surfaces disagreements). The panel decides whether mean 2.8 means no-hire; the brief just shows that mean 2.8 is the score.
- **"More than X minutes of recorded silence in transcript → flag rapport issue."** Rejected because rapport interpretation from silence is exactly the kind of inference that surfaces protected-class proxies. Transcripts are used for evidence citation only, never for inferred-state analysis.
- **"Panel-tenure-weighted mean."** Rejected because weighting a senior interviewer's score above a junior one builds the seniority bias the bar-raiser role is supposed to neutralize. All scores are equal-weight in the aggregation; structural disagreements (R2, R3) are surfaced separately.

## When the rules conflict

If a single dimension triggers multiple rules (e.g. R1 AND R2 both fire on Systems design), the synthesis surfaces it as one decision-point with both triggers cited. The "Decision-points for the panel" entry names both ("range across panel of 2 points, including bar-raiser scoring 2 below panel mean").

If the brief has more than 5 decision-points, the brief surfaces all of them but adds a paragraph at the top of the section noting that the loop produced unusually high disagreement and the calibration of the rubric (or the loop composition) may itself be the discussion to have first.
