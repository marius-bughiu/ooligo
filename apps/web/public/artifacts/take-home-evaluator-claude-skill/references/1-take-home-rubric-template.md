# Take-home rubric template

The take-home evaluator scores a submission against this rubric shape. Copy the JSON below to your role's rubric file (one per take-home format) and fill in every field. The skill reads the rubric; without it, scoring has nothing to anchor against.

A complete rubric takes 30-90 minutes to author per take-home format. Reuse across roles in the same family is high — a senior-backend take-home rubric is largely the same across companies once you've written it once.

## JSON shape

```json
{
  "take_home_id": "senior-backend-router-rewrite-v3",
  "version": "2026-04-15",
  "expected_deliverables": [
    "README.md",
    "src/**/*.rs",
    "tests/**/*.rs",
    "Cargo.toml"
  ],
  "build_commands": {
    "build": "cargo build --release",
    "test": "cargo test --all",
    "lint": "cargo clippy -- -D warnings"
  },
  "ai_use_policy_match": "syntax-help-only",
  "dimensions": [
    {
      "id": "correctness",
      "label": "Correctness",
      "anchors": {
        "1": "Compiles but does not pass the candidate's own tests, or does not handle the named happy path.",
        "2": "Handles the happy path; ignores the named edge cases (retries, partial failure).",
        "3": "Handles the happy path and the obvious edge cases; misses the subtle ones (clock skew, partition recovery).",
        "4": "Handles the named edge cases with explicit code paths; minor gaps acceptable.",
        "5": "Handles all named edge cases AND demonstrates a configurable retry budget / timeout structure that the rubric explicitly calls for."
      }
    },
    {
      "id": "code_quality",
      "label": "Code quality and structural decomposition",
      "anchors": {
        "1": "Single file, no decomposition; difficult to read.",
        "2": "Decomposed but the decomposition does not follow domain boundaries.",
        "3": "Readable but lacks structural decomposition that would scale past prototype.",
        "4": "Clear module boundaries that follow the domain; idiomatic for the language.",
        "5": "All of 4, plus the structural choices are documented in the README with the alternatives considered."
      }
    },
    {
      "id": "decision_documentation",
      "label": "Decision-making documented",
      "anchors": {
        "1": "No README, or the README only repeats the take-home brief.",
        "2": "README describes what was built without naming the engineering choices.",
        "3": "README names some choices without naming the alternatives.",
        "4": "README names the choices AND explains why each was picked over the named alternatives.",
        "5": "All of 4, plus the README cites the failure modes each choice mitigates."
      }
    },
    {
      "id": "error_handling",
      "label": "Error handling",
      "anchors": {
        "1": "Errors are caught and silently swallowed.",
        "2": "Error paths exist but do not differentiate between transient and permanent failures.",
        "3": "Differentiates transient vs. permanent; lacks structured error types.",
        "4": "Structured error types; retry policy is explicit per error class.",
        "5": "All of 4, plus error paths have explicit observability (logging / metrics / traces) named in the code."
      }
    },
    {
      "id": "test_coverage",
      "label": "Test coverage",
      "anchors": {
        "1": "No tests, or tests do not run.",
        "2": "Tests cover the happy path only.",
        "3": "Tests cover the happy path and one or two edge cases.",
        "4": "Tests cover the happy path and multiple edge cases (timeout, retry, partial failure).",
        "5": "All of 4, plus the network-partition test the rubric explicitly calls for."
      }
    }
  ],
  "rubric_fairness_check": {
    "no_bootcamp_vs_cs_proxies": "Anchors must score on observable behavior in the submission, not on idioms that proxy for educational background. 'Uses obscure language idioms' is forbidden as a positive signal.",
    "no_native-english-only_proxies": "Anchors must NOT score on README writing fluency beyond the level required to communicate the engineering decisions.",
    "documented_in_brief": "The take-home brief shared with the candidate must describe the rubric dimensions and approximate weighting. Surprise dimensions are unfair."
  }
}
```

## Per-field notes

- `take_home_id` — stable identifier for the take-home format. Reused across candidates for the same role family.
- `version` — semver or date. Bumped when the rubric is edited; the skill captures the version in the report so re-scoring against an edited rubric is visible.
- `expected_deliverables` — globs the skill walks against the submission. Missing deliverables surface in the report.
- `build_commands` — the skill runs these in step 2 (deterministic checks). Sandboxed execution required.
- `ai_use_policy_match` — should match the disclosure language in the take-home brief. Mismatch means the candidate's policy understanding doesn't match what the skill calibrates against.
- `dimensions` — array. Each dimension has an `id`, a `label`, and 5 anchor strings. Anchors should be observable behavior, not adjectives.
- `rubric_fairness_check` — three named fairness checks the skill confirms before scoring. If the rubric anchors violate any of these, the skill emits a warning and asks the rubric author to revise. (The skill does not refuse to score on a fairness-check violation, because the rubric is upstream and revising it is the right intervention. But it surfaces the issue.)

## Authoring a new dimension

To add a dimension to an existing rubric:

1. Pick observable behavior, not adjectives. "Has good error handling" is not a dimension; "error paths differentiate transient vs. permanent failure" is.
2. Write the 5 anchors as five distinct observable behaviors, each strictly more demanding than the last.
3. Test the dimension on a known submission. Can you score it from the anchors alone, without the original code in your head? If not, the anchors are too vague.
4. Bump the rubric version.

## Authoring a new rubric (for a net-new take-home)

1. Start from the take-home brief. What does the brief tell the candidate to deliver? Those are the `expected_deliverables`.
2. What is the brief asking the candidate to demonstrate? Those become the `dimensions`. Aim for 4-6 dimensions; more than 6 and the panelist can't hold them.
3. Write the 1-anchor first (the floor: what does an unsubmitted-effort look like?), then the 5-anchor (the ceiling: what does the strongest submission look like?), then fill 2-4 between.
4. Write the brief and the rubric in parallel. Anchors that don't show up in the brief are surprise dimensions; anchors in the brief that don't show up in the rubric are unscoreable promises.
5. Run the rubric on a known submission (a prior hire's submission, anonymized). Does it score them where you'd expect?
