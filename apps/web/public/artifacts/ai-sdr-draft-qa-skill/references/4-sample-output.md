# Sample output — for parser wiring and integration tests

> Literal examples of the three verdicts the skill emits. Use these
> when wiring the pre-send webhook return-path, the parser that pushes
> the verdict back into 11x / Artisan / aisdr / Unify, or the integration
> tests that exercise the QA gate.

## verdict: send

A clean draft. No blocking issues, no edit flags. The calling agent releases the send.

```json
{
  "verdict": "send",
  "result": "ok",
  "blocking_issues": [],
  "edit_flags": [],
  "personalization_score": 3,
  "claim_findings": {
    "grounded": 2,
    "ungrounded": 0,
    "stale_grounded": 0
  },
  "compliance_profile_applied": "us_can_spam + rfc_8058",
  "rewritten_draft": null,
  "qa_metadata": {
    "model": "claude-sonnet-4-6",
    "input_tokens": 2410,
    "output_tokens": 280,
    "rubric_version": "1.0.0",
    "ran_at": "2026-05-27T15:42:11Z"
  }
}
```

## verdict: edit

Releasable after the edit flags are applied. The calling agent either applies the suggested fixes automatically (when `request_rewrite: true` returns a `rewritten_draft`) or routes to a reviewer to apply by hand.

```json
{
  "verdict": "edit",
  "result": "ok",
  "blocking_issues": [],
  "edit_flags": [
    {
      "axis": "voice",
      "finding": "Stock AI opener: 'I hope this email finds you well'",
      "fix": "Replace with a grounded opener tied to a specific entry in prospect_evidence (e.g., a recent LinkedIn post by the prospect)."
    },
    {
      "axis": "deliverability",
      "finding": "Subject line is 78 characters (threshold: 70).",
      "fix": "Trim to under 70 characters. Suggested: 'Acme's hiring spike — quick question on attribution'"
    }
  ],
  "personalization_score": 2,
  "claim_findings": {
    "grounded": 1,
    "ungrounded": 0,
    "stale_grounded": 0
  },
  "compliance_profile_applied": "us_can_spam + rfc_8058",
  "rewritten_draft": {
    "subject": "Acme's hiring spike — quick question on attribution",
    "body": "Hi Maria — your post on outbound attribution last Tuesday lined up with the SDR job posting on Acme's careers page. Worth a 15-min walkthrough of how Northwind solved the same gap?\n\nReply STOP to opt out.\n\nOoligo, Inc. · 100 Market St, San Francisco, CA 94105"
  },
  "qa_metadata": {
    "model": "claude-sonnet-4-6",
    "input_tokens": 2620,
    "output_tokens": 540,
    "rubric_version": "1.0.0",
    "ran_at": "2026-05-27T15:43:02Z"
  }
}
```

## verdict: block

Not releasable. The blocking axis is named; the calling agent must regenerate, route to a human, or hard-fail the send.

```json
{
  "verdict": "block",
  "result": "ok",
  "blocking_issues": [
    {
      "axis": "claim_accuracy",
      "finding": "Ungrounded claim: 'I saw your Series B announcement last week'. No entry in prospect_evidence supports a recent Series B.",
      "fix": "Remove the claim, or attach a Series B citation to prospect_evidence and re-run."
    },
    {
      "axis": "personalization",
      "finding": "Score 1 — single ungrounded specific ('your industry') only. Threshold for releasable: 2.",
      "fix": "Add at least one grounded specific tied to a citation in prospect_evidence."
    }
  ],
  "edit_flags": [
    {
      "axis": "voice",
      "finding": "Stock AI opener: 'I wanted to reach out'",
      "fix": "Replace with a grounded opener."
    }
  ],
  "personalization_score": 1,
  "claim_findings": {
    "grounded": 0,
    "ungrounded": 2,
    "stale_grounded": 0
  },
  "compliance_profile_applied": "us_can_spam + rfc_8058",
  "rewritten_draft": null,
  "qa_metadata": {
    "model": "claude-sonnet-4-6",
    "input_tokens": 2480,
    "output_tokens": 460,
    "rubric_version": "1.0.0",
    "ran_at": "2026-05-27T15:44:18Z"
  }
}
```

## result: insufficient_input

Returned when a required input field is missing. The skill does not score; the calling agent must fix the call.

```json
{
  "verdict": null,
  "result": "insufficient_input",
  "missing_field": "prospect_evidence",
  "message": "prospect_evidence pack is required. The skill cannot verify claims against general model knowledge.",
  "qa_metadata": {
    "model": "claude-sonnet-4-6",
    "input_tokens": 320,
    "output_tokens": 80,
    "rubric_version": "1.0.0",
    "ran_at": "2026-05-27T15:45:00Z"
  }
}
```

## result: insufficient_compliance_context

Returned when `recipient.country` (or required state) maps to no jurisdictional profile. The skill refuses to score rather than falling back to a generic profile.

```json
{
  "verdict": null,
  "result": "insufficient_compliance_context",
  "missing_field": "recipient.country profile",
  "message": "No jurisdictional profile matched recipient.country='SG'. Add a Singapore PDPA profile to references/3-compliance-rubric.md.",
  "qa_metadata": {
    "model": "claude-sonnet-4-6",
    "input_tokens": 2380,
    "output_tokens": 110,
    "rubric_version": "1.0.0",
    "ran_at": "2026-05-27T15:45:42Z"
  }
}
```

## Field contract for parsers

If the calling agent consumes the JSON directly:

- `verdict` — enum: `send` / `edit` / `block` / `null` (null when `result` is non-ok).
- `result` — enum: `ok` / `insufficient_input` / `insufficient_compliance_context` / `insufficient_evidence`.
- `blocking_issues[]` — array of `{ axis, finding, fix }`. Axes: `claim_accuracy`, `personalization`, `compliance`, `deliverability`.
- `edit_flags[]` — same shape. Axes: `voice`, `deliverability`, `claim_accuracy` (for stale_grounded).
- `personalization_score` — integer 0-5.
- `claim_findings` — object: `{ grounded, ungrounded, stale_grounded }` counts.
- `compliance_profile_applied` — string identifying the matched profile.
- `rewritten_draft` — object `{ subject, body }` or null. Populated only when `request_rewrite: true`.
- `qa_metadata` — `{ model, input_tokens, output_tokens, rubric_version, ran_at }` for cost accounting and audit.
