---
name: take-home-evaluator
description: Score a take-home submission against a rubric, with verbatim citations from the candidate's code or text, plus deterministic checks (compile, run tests). Output is a structured report with per-dimension scores and an aggregate — never a hire/no-hire recommendation. Detects AI-use signals against the disclosed policy as notes for the panel debrief.
---

# Take-home assessment evaluator

## When to invoke

Use this skill when a panelist has a candidate's take-home submission and wants a rubric-anchored evaluation report to bring to the panel debrief. Take the submission directory plus the role rubric as input and return a structured Markdown report.

Do NOT invoke this skill for:

- **Auto-pass / auto-fail in the loop.** This skill produces a scored report. The hire decision happens in the panel debrief, not in the report.
- **Live coding interviews.** Different workflow.
- **Submissions where the candidate did not sign the AI-use disclosure.** The skill calibrates against a specific use-of-AI policy; without the disclosure, there is nothing to calibrate against.
- **Plagiarism forensics.** The skill flags suspicious patterns but is not a defensible plagiarism tool.

## Inputs

- Required: `submission_dir` — path to the candidate's submission directory.
- Required: `rubric` — path to the take-home rubric file. See `references/1-take-home-rubric-template.md` for the shape.
- Required: `ai_use_policy` — string identifying the disclosed policy. One of `none-allowed`, `syntax-help-only`, `ai-tools-allowed`. The skill's pattern checks are calibrated against the policy, not against an absolute "AI-generated" detector.
- Optional: `panelist_id` — if running per-panelist mode, identify the panelist for cross-panelist aggregation.
- Optional: `sandboxed` — boolean. If `false`, the skill warns about running candidate code on the local machine and asks for confirmation before proceeding to step 2.

## Reference files

- `references/1-take-home-rubric-template.md` — the rubric shape the skill expects.
- `references/2-ai-use-policy-mapping.md` — how each `ai_use_policy` value maps to the pattern checks in step 4.

## Method

Six steps.

### 1. Validate the submission shape

Walk `submission_dir`. Compare against the deliverables named in the take-home brief (the rubric file's `expected_deliverables` field). For each missing deliverable, add to a `missing_deliverables` array on the report. Do NOT score dimensions that depend on missing files; their score is `not assessed` rather than `1`.

### 2. Run deterministic checks

If the submission has a build/test command in `package.json`, `Makefile`, `pyproject.toml`, or `Cargo.toml`:

- Compile / install dependencies in a sandboxed environment. If the calling environment is not sandboxed (per `sandboxed: false`), warn and stop until the panelist confirms.
- Run the candidate's test suite. Capture pass/fail counts.
- Run linters / formatters in check mode (do NOT modify the candidate's code). Capture findings.

Record the deterministic results in a `deterministic_checks` block on the report. These are auditable — the LLM does not re-litigate them in step 3.

### 3. Score per rubric dimension

For each dimension in the rubric:

- Read the rubric anchors (1-5).
- Find evidence in the submission. Evidence is a verbatim string from the code or text, with file path + line range.
- If you cannot find verbatim evidence for a score above 1, the score is 1 — no inference, no generic feedback.
- Tag each cited line with which dimension it supports.

### 4. Detect AI-use signal against the policy

Run pattern checks per `references/2-ai-use-policy-mapping.md`:

- **Verbatim public matches** — does any chunk of the submission match a public AI-generated boilerplate exactly? Surface as `signal: verbatim_public_match`.
- **Style consistency vs. complexity** — is the style suspiciously consistent across files of varying complexity? Real candidates' style varies with the difficulty of the section. Surface as `signal: uniform_style`.
- **Generic comments without engagement** — comments that explain what the code does without engaging with the problem-specific decisions are a common AI-generated tell. Surface as `signal: generic_comments`.

Surface signals as NOTES, never as VIOLATIONS. The panel reviews against the disclosed policy. If `ai_use_policy: ai-tools-allowed`, the signals are informational only. If `ai_use_policy: none-allowed`, the panel discusses whether the signals warrant follow-up — the skill does not decide.

### 5. Compute aggregate

Sum the per-dimension scores. Surface the aggregate as a number AND the per-dimension breakdown.

Do NOT translate the aggregate into a recommendation. The skill's schema explicitly omits a `recommendation` field. The report ends after the aggregate and the AI-use signals section.

### 6. Emit report

Write the report to `report.md` in the submission directory or to stdout (depending on the calling environment). In per-panelist mode, write to `report-<panelist_id>.md`.

## Output format

```markdown
# Take-home evaluation — {Candidate name} — {Role}

Submission: `{submission_dir}` · Rubric: `{rubric_path}` (SHA `{short}`)
Generated: {ISO timestamp} · Skill v1.0 · Model: claude-sonnet-4-6
Panelist: {panelist_id or "single-panelist mode"}
AI-use policy: {ai_use_policy}

## Deterministic checks

- **Build:** {passed | failed | not applicable}
- **Tests:** {N/M passed} ({test command})
- **Linter:** {N findings}
- **Missing deliverables:** {list or "none"}

## Per-dimension scores

### Correctness — 4/5

> Evidence: `src/router.rs:42-57` — handles the request-routing edge case for retries with exponential backoff and jitter, including the cap at max 60s. Anchor 4 ("handles the named edge cases with explicit code paths") matches.

Counter-evidence (would have been 5): retry budget is hardcoded at 5 attempts; the rubric's anchor 5 names "configurable retry budget."

### Code quality — 3/5

> Evidence: `src/router.rs` — file is 800 lines with no module split. Anchor 3 ("readable but lacks structural decomposition") matches.

### Decision-making documented — 4/5

> Evidence: `README.md:25-40` — explains the choice of exponential-vs-fixed backoff with a reference to the failure mode it mitigates. Anchor 4 matches.

### Error handling — 2/5

> Evidence: `src/router.rs:120` — catches and re-raises the network error without distinguishing between transient and permanent failures. Anchor 2 ("error paths exist but do not differentiate") matches.

### Test coverage — 4/5

> Evidence: `tests/router_test.rs` — covers the happy path, three retry scenarios, and the timeout. Missing: the network-partition test the rubric anchor 5 names.

## Aggregate

17/25.

This is the per-dimension sum. The skill does NOT translate this into a hire/no-hire recommendation. The panel debrief is where the decision happens.

## AI-use signal notes

Disclosed policy: **syntax-help-only**.

- ⚠️ `signal: uniform_style` — `src/cache.rs` and `src/router.rs` use the same comment style and naming idioms despite the different complexity. May warrant a follow-up question in the panel debrief.
- ✓ No `verbatim_public_match` signals.
- ✓ No `generic_comments` signals beyond the documented threshold.

The panel discusses these against the disclosed policy. The skill does not decide.
```

## Watch-outs

- **Auto-pass / auto-fail drift.** *Guard:* the report ends after the aggregate. No recommendation field. The aggregate is a sum, not a verdict.
- **Generic-feedback hallucination.** *Guard:* every dimension score requires verbatim citation (file path + line range + content).
- **AI-use false positive.** *Guard:* signals are notes, not violations. The panel decides against the disclosed policy.
- **Unsandboxed candidate code.** *Guard:* skill warns before running in non-sandboxed environments.
- **Bias inheritance.** *Guard:* the rubric is upstream of the skill. Audit the rubric separately if the dimensions correlate with disparate impact.
