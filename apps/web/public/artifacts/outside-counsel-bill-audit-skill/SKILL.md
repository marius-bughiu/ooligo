---
name: outside-counsel-bill-auditor
description: Audit an outside-counsel invoice line-by-line against the firm's billing guidelines. Returns a structured Markdown report with per-line citations, the guideline violated, and a recommended adjustment per finding. Never adjusts the bill automatically — the legal-ops lead reviews and decides.
---

# Outside-counsel bill auditor

## When to invoke

Use this skill when a legal-ops lead has an outside-counsel invoice (LEDES 1998B/1998BI/2000 or pre-parsed CSV) and the firm's billing guidelines, and wants a structured audit before the invoice is approved or disputed.

Do NOT invoke this skill for:

- **Auto-reducing the bill.** The skill flags; humans decide. Auto-deducting based on findings damages the outside-counsel relationship and may violate the engagement letter's dispute procedure.
- **AFA-billed engagements.** The skill is calibrated to hourly billing.
- **Bills the firm has already approved.** Audit happens before approval, not after.

## Inputs

- Required: `invoice_path` — path to the LEDES file or pre-parsed CSV.
- Required: `guidelines_path` — path to the firm's billing guidelines file (see `references/1-billing-guidelines-template.md`).
- Optional: `engagement_letter_overrides_path` — per-matter overrides to the firm guidelines.
- Optional: `firm_name` — outside firm name, for the per-firm calibration section of the report.

## Reference files

- `references/1-billing-guidelines-template.md` — the firm's guidelines shape.
- `references/2-ledes-parser-notes.md` — LEDES format parsing notes.

## Method

Six steps.

### 1. Validate the invoice format

Parse the LEDES file or CSV. Halt with a parse-error report if the format is malformed. Check that required columns are present: `line_id`, `date`, `timekeeper`, `timekeeper_role`, `task_code`, `activity_code`, `hours`, `rate`, `amount`, `narrative`.

### 2. Run deterministic checks

Without invoking the LLM, flag:

- **Block-billing**: a single time entry with a narrative containing multiple distinct task verbs (e.g. "Reviewed contract; drafted letter; called client" in 2.4 hours). Flag at >2 verbs unless the engagement letter explicitly permits.
- **Expense double-entry**: the same `line_id` or `expense_id` referenced twice.
- **Staffing-ratio breach**: partner hours on a `task_code` the guidelines name as associate-or-below work (default: legal research, deposition summaries, document review).
- **Premium-time cap breach**: off-hours surcharge entries totaling more than the engagement letter's monthly cap.
- **Rate variance**: timekeeper rate that deviates from the engagement letter's rate sheet by more than ±2%.

### 3. Read the guidelines

Load `guidelines_path` and the engagement-letter overrides if present. The guidelines define the comparison anchors for steps 4 and 5. SHA-256 the guidelines for the audit log.

### 4. Per-line LLM evaluation

For lines not flagged by deterministic checks, evaluate against the guidelines for prose-judgment violations:

- **Vague time entries** — "0.6h research" without naming the issue researched, the source consulted, or the deliverable.
- **Scope-creep signals** — work on a topic outside the engagement letter's matter scope.
- **Should-be-flat-fee work** — work that the engagement letter explicitly bundled into a flat fee but appears as a separate hourly line.
- **Internal-conference billing** — multiple timekeepers on the same internal conference where the guidelines limit attendees.

For each finding, cite:
- `line_id`
- `guideline_section_id` (or "no matching guideline" if the finding is intuitive but not codified)
- `recommended_adjustment` — dollar amount or "negotiate" tag
- `confidence` — `high` (clear violation), `medium` (likely violation, judgment call), `low` (signal worth surfacing, may be defensible)

### 5. Aggregate by guideline category

Group findings by violation category. Total hours and dollars by category. The aggregate is the negotiation lever — "block-billing on 23 lines totaling $4,200" is a stronger negotiation point than 23 individual line disputes.

Per-firm calibration: if `firm_name` is provided AND the audit log has prior runs for the same firm, surface the trend ("block-billing rate this month: 9%; prior 6-month average: 12%; trending down").

### 6. Emit report + audit log

Write the report to stdout in the format below. Append one JSONL line to `audit/<YYYY-MM>.jsonl`:

```json
{
  "audit_id": "uuid",
  "timestamp": "ISO-8601",
  "invoice_id": "...",
  "firm_name": "...",
  "invoice_total_usd": 0,
  "guidelines_sha": "...",
  "findings_by_category": {
    "block_billing": { "count": 0, "hours": 0, "dollars": 0 },
    "vague_entries": { "count": 0, "hours": 0, "dollars": 0 },
    ...
  },
  "skill_version": "1.0",
  "model": "claude-sonnet-4-6"
}
```

## Output format

```markdown
# Bill audit — {firm_name} — {invoice_id}

Audited: {ISO timestamp} · Invoice total: ${total} · Skill v1.0

{PER-FIRM TREND if firm_name has prior runs}

## Aggregate findings

| Category | Lines | Hours | Dollars |
|---|---|---|---|
| Block-billing | 23 | 47.2 | $14,160 |
| Vague entries | 18 | 12.6 | $3,780 |
| Staffing-ratio breach | 4 | 8.0 | $4,800 |
| Premium-time cap breach | 2 | 6.0 | $2,250 |
| Rate variance | 1 | 0.8 | $40 |

Total flagged: $25,030 of $187,400 (13.4%).

## Findings — high confidence

### Block-billing — line 142
- **Narrative:** "Reviewed contract; drafted comments; called opposing counsel" — 2.4h
- **Guideline:** §3.2.a (no time entry shall combine more than one task)
- **Recommended adjustment:** request narrative split into 3 entries; adjust if split shifts hours

### Staffing-ratio breach — line 287
- **Narrative:** "Document review for production" — 4.0h, partner timekeeper rate $850/hr
- **Guideline:** §4.1 (document review staffed at associate level or below)
- **Recommended adjustment:** rebill at junior associate rate ($375/hr); $1,900 reduction

## Findings — medium confidence

(per-line entries with `confidence: medium`)

## Findings — low confidence (informational)

(per-line entries with `confidence: low`)

## Provenance

- Guidelines: `firm-billing-guidelines.md` — SHA `{short}`
- Engagement letter: `engagement-letters/<matter>.md` (if used)
- Audit record: `audit/2026-05.jsonl` line {N}
```

## Watch-outs

- **Auto-adjustment drift.** *Guard:* output ends with the structured report; no "adjusted bill" output.
- **Confidentiality of attorney work-product.** *Guard:* invoice narratives are privileged. Process via API access with zero-retention; do not paste invoices into shared chat surfaces.
- **Over-disputing damages firm relationship.** *Guard:* per-firm trend tracking surfaces dispute-volume drift.
- **Hallucinated guideline citations.** *Guard:* every finding cites `guideline_section_id`; findings without a citable section get "no matching guideline" tag rather than fake citations.
