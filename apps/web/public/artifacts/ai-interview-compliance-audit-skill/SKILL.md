---
name: ai-interview-compliance-audit
description: Audit a configured AI interviewing and screening stack against the US employment-AI rules that are live today — NYC Local Law 144, the Illinois AI Video Interview Act, the Illinois Human Rights Act AI amendment, California's FEHA automated-decision-system regulations, and Colorado SB 26-189 — and emit a control matrix plus a remediation list ordered by penalty exposure. Grades controls on evidence you supply, not on vendor marketing claims. Produces a readiness report, never a legal conclusion.
---

# AI interview compliance audit

## When to invoke

Use this skill when someone owns a hiring stack that includes AI screening, AI-scored video or async interviews, AI interviewers, or resume-ranking, and needs to know which controls are evidenced, which are missing, and what to hand counsel. Typical triggers: a new AI interviewing vendor going live, a req opening in a jurisdiction the stack has not served before, an annual bias-audit renewal, or a candidate complaint.

Inputs are configuration and artifacts. The skill reads what the stack actually does — which score gates which stage — and what documents exist to prove each control.

Do NOT invoke this skill for:

- **Producing the bias audit itself.** NYC Local Law 144 requires an *independent* auditor with no employment or financial relationship with the employer that would compromise independence. A skill run by the employer is not independent and cannot satisfy that duty. This skill checks whether an independent audit exists, is within its clock, and is published in the required form.
- **A legal opinion, or a "we are compliant" sign-off.** The output is a readiness report with an evidence status per control. It never emits a compliant/non-compliant verdict.
- **Non-US stacks.** The jurisdiction matrix in `references/1-jurisdiction-matrix.md` covers US federal, state, and city rules only. EU AI Act Annex III employment obligations are a different scope and a different reference file.
- **Stacks with no automated scoring at all.** If humans read every application and no tool ranks, scores, or filters candidates, most of the matrix does not attach and the run is wasted effort. Confirm the classification question in step 2 before a full run.
- **Retroactive defense of a decision already challenged.** Once there is a charge or a demand letter, the artifact set is discovery material. Counsel drives; do not generate parallel internal assessments of the same facts.

## Inputs

- Required: `reqs` — the open or planned requisitions in scope, each with the job's work location(s) and whether remote candidates are accepted from other states. Jurisdiction attaches by where the candidate applies for or performs the job, not by where the company is headquartered. See `references/2-tool-and-stage-ledger.md`.
- Required: `tool_ledger` — every tool touching a candidate between application and offer, with the stage it runs at and what its output does (displayed to a recruiter, sorts a list, sets a threshold, advances or rejects automatically). Same file.
- Required: `evidence_pack` — paths or URLs for the artifacts that prove controls: candidate-facing notice text, consent capture record, published bias-audit summary URL, data-retention policy, vendor DPA, deletion-request runbook. See `references/3-evidence-pack-index.md`.
- Optional: `jurisdiction_matrix_path` — override the bundled matrix with your counsel's maintained copy. Recommended once you have one.
- Optional: `as_of` — the date to run clock arithmetic against. Defaults to today.

## Reference files

- `references/1-jurisdiction-matrix.md` — every statutory parameter the skill grades against, with a `checked:` date. The skill reads thresholds from this file and never from model memory.
- `references/2-tool-and-stage-ledger.md` — fillable inventory template for reqs, tools, stages, and what each score actually gates.
- `references/3-evidence-pack-index.md` — control-to-artifact mapping, plus scaffolding for the notice and consent language each rule requires.

## Method

Six steps. Scope resolves before any control is graded, because the same configuration is lawful in one jurisdiction and a per-day violation in another, and because the most common real-world error is scoping the audit to company headquarters.

### 1. Resolve scope before grading anything

Build a req × jurisdiction × stage matrix from `reqs`. A single remote-eligible req can attach NYC, Illinois, California, and Colorado at once. If any req lacks a work-location list, stop and ask — do not infer jurisdiction from the company address, and do not grade a partial matrix.

Flag reqs open to candidates in states the evidence pack has no artifacts for. That cell is `gap`, not `not-applicable`.

### 2. Classify each tool from configuration, not from its label

For each tool in `tool_ledger`, answer from the configuration:

- Does its output gate a stage transition automatically, at any threshold?
- Does it sort or rank a candidate list that a recruiter works top-down?
- Does a recruiter see the score before making the advance/reject call?
- Is it analyzing a video or audio interview for characteristics used to evaluate fitness?

Read the vendor's own classification as an input to be checked, not as the answer. A vendor has an incentive to say its product merely assists, and the LL 144 test turns on whether the output substantially assists or replaces discretionary decision-making — which is a fact about your configuration, not about their product. Record the classification, the configuration facts that drove it, and dissent from the vendor label explicitly where it exists.

The video/audio question is separate and additive: the Illinois AI Video Interview Act attaches to AI analysis of video interviews for Illinois positions regardless of whether the tool also qualifies as an automated employment decision tool.

### 3. Grade each control on evidence, with a citation

For each applicable control in the jurisdiction matrix, assign exactly one status:

- `evidenced` — an artifact in the evidence pack satisfies the control. Requires a verbatim citation: file path or URL, plus the quoted passage that does the work.
- `unevidenced` — the control is plausibly satisfied in practice but no artifact was supplied. This is not a pass. It is the state that turns into a gap the moment anyone asks for proof.
- `gap` — the artifact exists and does not satisfy the control, or the required artifact does not exist.
- `counsel-review` — the determination turns on a judgment call (whether a given tool substantially assists a decision, whether a notice's placement counts as before the interview). The skill states the facts and the competing readings, and stops.

There is no `compliant` status and no aggregate compliance score. Both invite the reader to treat the report as a conclusion. A control with no citation cannot be `evidenced`, which is the guard against a fluent report about documents nobody actually has.

### 4. Run the deterministic date and arithmetic checks

These are computed, not judged, and they surface first because they are the cheapest failures to fix:

- **Bias-audit clock.** Parse the published date of the most recent bias audit. Flag at 10 months, not at 12, so there is runway to schedule the auditor. Past 12 months the tool is out of clock while still in use — which accrues per-day.
- **Notice lead time.** Compare the candidate-notice timestamp to the tool's first run against that candidate. The NYC requirement is at least 10 business days, counted in business days.
- **Consent ordering.** For Illinois video interviews, confirm consent is captured before the interview, not bundled into a post-interview acknowledgment. Ordering is the whole control.
- **Deletion SLA.** Check the deletion runbook's stated turnaround against the 30-day statutory window, and confirm it names downstream recipients and backups rather than only the primary system.
- **Retention floor.** California's FEHA regulations require automated-decision-system records — selection criteria, outputs, audit findings — kept four years. Flag any retention policy that deletes earlier, including a well-intentioned privacy-minimization policy. Cross-check the deletion SLA against the retention floor and surface the conflict rather than resolving it; that tension is a counsel call.

### 5. Order remediation by exposure, not by effort

Rank gaps by how the penalty accrues. NYC counts each day an in-scope tool runs out of compliance as a separate violation, and each missed candidate notice as its own separate violation — so a missing notice on a high-volume req compounds daily against a fixed remediation cost. A gap on a paused req does not. Give each gap: the accrual shape, the artifact that would close it, and who owns it.

### 6. Emit the report

Control matrix first, then the deterministic-check results, then remediation ordered by exposure, then the `counsel-review` list verbatim.

## Output format

```markdown
# AI interview compliance readiness — as of 2026-07-28
Matrix version: references/1-jurisdiction-matrix.md (checked: 2026-07-28)

## Scope
| Req | Work locations | Attaches |
|---|---|---|
| ENG-411 | NYC + remote US | NYC LL 144; IL AIVIA; IL HRA; CA FEHA ADS |

## Tool classification
| Tool | Stage | Output gates | AEDT (configuration) | Vendor label | Dissent |
|---|---|---|---|---|---|
| HireVue | async video screen | recruiter sees score before advance/reject | yes | "decision support" | yes — score precedes the call |

## Controls
| Jurisdiction | Control | Status | Citation |
|---|---|---|---|
| NYC LL 144 | Independent bias audit within 12 months | evidenced | careers.example.com/aedt — "date of most recent bias audit: 2026-03-14" |
| NYC LL 144 | 10 business days candidate notice | gap | notice fires at invite, 2 business days before |
| IL AIVIA | Consent captured before interview | counsel-review | consent is on the invite page; candidate can start without scrolling |

## Deterministic checks
- Bias-audit clock: 4.5 months elapsed — OK (flags at 10)
- Notice lead time: 2 business days vs 10 required — FAIL
- Deletion runbook: names primary ATS only; no downstream or backup step — FAIL

## Remediation (by exposure)
1. NYC notice lead time — ENG-411 is live and high-volume; each missed notice is a separate violation and each day of use accrues. Fix: move notice to the application confirmation. Owner: TA ops.

## Counsel review
1. IL AIVIA consent placement on ENG-411. Facts: [...]. Competing readings: [...].
```

## Watch-outs

- **The model asserts a legal conclusion.** *Guard:* the status vocabulary has no compliant/non-compliant value and the report has no aggregate score. Judgment calls route to `counsel-review` with both readings stated.
- **Statutory parameters drift.** *Guard:* thresholds live in `references/1-jurisdiction-matrix.md` with a `checked:` date; the skill refuses to grade and warns if that date is more than 90 days old. This landscape moved three times between August 2025 and May 2026.
- **Vendor attestation counted as employer compliance.** *Guard:* the evidence index separates vendor artifacts from employer artifacts, and a vendor bias-audit summary can only satisfy vendor-side rows. The LL 144 duty sits with the employer or employment agency.
- **Scoping to headquarters.** *Guard:* step 1 will not proceed without per-req work locations, and remote-eligible reqs expand to every state in the accepted-candidate list.
- **Classification laundering.** *Guard:* classification is answered from configuration facts recorded in the ledger; the vendor's label is a separate column, and disagreement is printed rather than reconciled.
- **Unevidenced read as a pass.** *Guard:* `unevidenced` rows sort into the remediation list alongside gaps, with the missing artifact named.
- **Retention and deletion pulling opposite ways.** *Guard:* step 4 surfaces the conflict between a deletion request and the four-year records floor as a flagged tension rather than picking one.
