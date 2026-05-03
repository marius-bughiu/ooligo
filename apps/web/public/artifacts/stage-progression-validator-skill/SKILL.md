---
name: stage-progression-validator
description: Validate that a Salesforce opportunity genuinely meets its claimed stage's exit criteria. For each opp that progressed in a window, the skill checks deterministic field rules, cross-references rep-claimed milestones against Gong call evidence, and emits a pass/flag/fail verdict with the specific gap. Designed as a coaching trigger for RevOps weekly reviews, not as an enforcement gate.
---

# Stage progression validator

## When to invoke

Whenever you need to audit deals that progressed between Salesforce stages and want to know which progressions were buyer-driven versus rep-optimistic. Typical cadence: a weekly batch keyed to the forecast meeting (run Sunday night, review Monday morning). Also valid: a one-shot run on a single opportunity ID before a deal-desk review or before a manager 1:1.

Take an `Opportunity.Id` (single mode) or a window expressed as `week_ending=YYYY-MM-DD` (batch mode), plus a path to the methodology rubric. Produce a structured Markdown report with a row per progression and a verdict per row.

Do NOT invoke this skill for:

- **Auto-stage rollback.** The skill emits verdicts; it must not write back to Salesforce. A "fail" verdict is a coaching input, not an instruction to demote the deal — that decision is the manager's, with rep context the skill cannot see.
- **Performance management of reps.** Verdicts are noisy at the per-deal level and only meaningful as patterns over weeks. Using a single "fail" in a PIP is misuse and will collapse rep trust in the tool.
- **Comp implications.** Stage assignments drive forecast, sometimes accelerators. Routing this skill's output into comp calculations creates a direct incentive for reps to game the validator (refusing Gong recording, omitting rep notes, etc.). Keep this output separate from comp data flows.
- **Deals in stages without documented exit criteria.** Garbage in, garbage out. If the methodology doc has no rubric for the stage being validated, return `needs_methodology` rather than guessing a verdict.

## Inputs

- Required: `opp_id` OR `week_ending` — single opportunity or a Sunday-anchored ISO date for the batch window
- Required: `methodology_path` — path to the team's stage exit-criteria rubric (see `references/stage-criteria-template.md`)
- Required: `sfdc_token` — Salesforce session token with read on `Opportunity`, `OpportunityFieldHistory`, `Task`, `Event`, `OpportunityContactRole`
- Required: `gong_api_key` — Gong key with `calls/extensive` and `deals` scopes
- Optional: `methodology_mapping` — path to a methodology-mapping doc if the team uses MEDDPICC, MEDDIC, SPICED, or a custom framework (see `references/methodology-mapping-template.md`)
- Optional: `borderline_threshold` — float in `[0, 1]`, default `0.6`. Verdicts where the deterministic-criteria score falls between the threshold and `1.0 - threshold` are emitted as `needs_manager_review` rather than `flag`/`fail`.

## Reference files

Always read these from `references/` before scoring. Without them, the verdicts collapse to checking Salesforce required-field logic, which Salesforce itself already enforces.

- `references/stage-criteria-template.md` — the team's stage-by-stage exit criteria. Replace the template contents with the team's real rubric.
- `references/methodology-mapping-template.md` — maps the team's chosen sales methodology (MEDDPICC, MEDDIC, SPICED, BANT, custom) onto fields in Salesforce. The skill uses this to know which field holds the economic-buyer name, which holds the metric, etc.
- `references/sample-output-format.md` — the exact Markdown format for the report. The renderer downstream (Slack digest, email) parses this format.

## Method

Run the steps in order. Steps 3 and 4 are where the engineering choices matter; do not skip them.

### 1. Pull the candidate set

For batch mode, query `OpportunityFieldHistory` where `Field = 'StageName'` and `CreatedDate` falls inside the window. For single mode, query the same table filtered to the supplied `opp_id` and take the most recent `StageName` change. Skip progressions where the new stage has no entry in the methodology rubric — emit those as `needs_methodology`, not as `fail`.

### 2. Score deterministic criteria

For each candidate, compute a deterministic score in `[0, 1]` from the methodology rubric. Each rule in the rubric is one of three types:

- **Field rule** — a Salesforce field must hold a non-default value (e.g. `Economic_Buyer__c IS NOT NULL`).
- **Activity rule** — a logged activity of a specified type must exist in the prior 30 days (e.g. `Task.Type = 'Demo'`).
- **Stakeholder rule** — `OpportunityContactRole` must contain a contact with a role matching a regex (e.g. `Role MATCHES /^(VP|Director|C.+O)/`).

The score is the fraction of rules satisfied. This is structured-rubric, not free-form, by design: free-form natural-language criteria force the skill to interpret edge cases inconsistently across runs and produce verdicts that reps cannot predict or trust.

### 3. Cross-reference qualitative claims with Gong

The methodology mapping flags certain fields as `evidence_required: gong`. For each such field that holds a non-default value, the skill must find a Gong call within 30 days where the relevant phrase appears in the transcript.

Phrase matching is methodology-aware, not methodology-agnostic. For MEDDPICC's `Economic Buyer`, the skill searches transcripts for the buyer's name within 12 tokens of decision-language ("approve", "sign off", "budget owner", "final say"). For SPICED's `Critical Event`, it searches for date-bounded urgency language. The mapping doc names the phrase patterns per field — if the mapping says `evidence_required: gong` but provides no patterns, the skill emits `needs_methodology` rather than guessing what counts as evidence.

Why methodology-aware: a generic "look for any mention of the buyer name" check produces too many false passes (the rep mentioning the buyer in a call to a different stakeholder is not evidence of buyer commitment).

### 4. Combine scores into a verdict

Let `D` be the deterministic score from step 2 and `Q` be the fraction of qualitative claims with Gong evidence from step 3. Combine:

- `pass` — `D == 1.0` and `Q == 1.0`
- `flag` — `D >= 0.8` or `Q >= 0.8`, but not both at `1.0`
- `fail` — `D < borderline_threshold` and `Q < borderline_threshold`
- `needs_manager_review` — neither `pass`, `flag`, nor `fail`. The deal sits in the borderline band where false positives and false negatives both have non-trivial cost.

The `needs_manager_review` band exists because the alternative — forcing a binary `flag` versus `fail` on every borderline deal — produces noise that reps learn to dismiss. The borderline bucket goes to a separate queue that the manager hand-resolves, which preserves the signal in the `flag` and `fail` queues.

### 5. Emit the report

Write the report to stdout in the exact format from `references/sample-output-format.md`. Include the deterministic-rule misses verbatim (which rule failed) and the qualitative-claim misses with the field name and the phrase pattern that did not match. Do not paraphrase Salesforce field names or rep notes — the manager will compare the report against the Salesforce UI.

## Output format

```markdown
# Stage progression validation — week ending 2026-05-02

Window: 2026-04-26 → 2026-05-02
Opportunities scored: 18
- pass: 9
- flag: 4
- fail: 3
- needs_manager_review: 2
- needs_methodology: 0

## fail (3)

### Acme Corp — Stage 4 Negotiation
- Owner: jane.doe@example.com
- Progressed: 2026-04-29
- Deterministic score: 0.40 (2 of 5 rules satisfied)
- Qualitative score: 0.00 (0 of 2 claims supported)

Deterministic misses:
- `Economic_Buyer__c` is NULL
- `Decision_Criteria__c` is NULL
- `OpportunityContactRole` has no role matching `/^(VP|Director|C.+O)/`

Qualitative misses:
- `Economic_Buyer__c` claim: no Gong call in last 30 days references claimed buyer "Pat Ellis" within 12 tokens of decision-language pattern
- `Success_Criteria__c` claim: no Gong call in last 30 days contains success-criteria pattern

### {next fail row}
...

## flag (4)
...

## needs_manager_review (2)
...

## pass (9)
| Opp | Owner | New stage | Deterministic | Qualitative |
|---|---|---|---|---|
| ... | ... | ... | 1.00 | 1.00 |
```

## Watch-outs

- **Over-strict validation pushes reps to game stages.** If the rubric demands more than reps can plausibly satisfy without a buyer conversation that isn't yet warranted, reps will park deals one stage below their reality. Guard: instrument a "stage age" metric; if median stage age in the stage just before the strict gate balloons after the skill ships, the rubric is wrong, not the reps. Tune the rubric down before keeping the skill running.
- **Methodology mismatch.** A team that runs MEDDPICC in slides but stores nothing structured in Salesforce will fail every qualitative check. Guard: run the skill in `dry_run` mode for two weeks first; if more than 40% of opps emit `needs_methodology` or score `Q < 0.2` across the board, the methodology mapping doc is fictional — fix the doc or instrument the missing fields before going live.
- **Validator drift from real exit criteria.** Sales leaders quietly change what "Stage 3" means in QBRs; the rubric file does not get updated. Guard: append a `last_reviewed` field at the top of `references/stage-criteria-template.md` and have the skill emit a warning at the top of every report if `last_reviewed` is more than 90 days old. Stale rubrics produce confidently wrong verdicts, which is worse than no verdicts.
- **Gong recording-coverage gaps look like rep dishonesty.** Some calls genuinely happen off-Gong (in-person meetings, customer-side dial-in policies). Guard: the methodology mapping must include a `recording_coverage_floor` per stage; if a deal's recorded-call count is below the floor, emit `needs_manager_review` and surface the coverage gap explicitly rather than emitting `fail`.
- **Single-deal rage at a `fail` verdict.** A "fail" on a deal a rep is confident in will trigger pushback. Guard: the report must include the deterministic-rule misses and the unmatched phrase patterns verbatim. The rep can then either (a) update the field/log the activity and re-run, or (b) point to off-Gong evidence the manager accepts. Either way, the conversation is grounded in the specific gap, not in the verdict label.
