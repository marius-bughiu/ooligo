# LEDES parser notes

The bill auditor's deterministic checks operate on parsed line-item records. Most outside-counsel firms in the US ship invoices in LEDES (Legal Electronic Data Exchange Standard) format. This file documents the formats the skill handles and the per-format quirks.

## Supported formats

### LEDES 1998B (legacy)

- Pipe-delimited flat file. Header row + data rows.
- Each row represents one billed item (time or expense).
- Columns are positional, not named — the parser maps by position per the LEDES 1998B spec.
- Limited expense-detail granularity; expense category is one of ~20 codes.

### LEDES 1998BI (international)

- Same shape as 1998B with currency-code and tax fields added.
- Used by firms billing outside the US or in multiple currencies.
- The skill normalizes amounts to the engagement-letter base currency before deterministic checks.

### LEDES 2000 (XML, less common)

- XML format; richer schema including matter / sub-matter hierarchy and structured timekeeper records.
- The skill parses the timekeeper section once per invoice and joins to time entries by `timekeeper_id`.
- Most US firms still ship 1998B/1998BI; LEDES 2000 is more common in EU.

## Required columns (after parsing)

The skill expects each line, regardless of source format, to land in this normalized shape:

| Column | Type | Notes |
|---|---|---|
| `line_id` | string | Unique within the invoice. |
| `date` | ISO-8601 date | Date the work was performed. |
| `timekeeper_id` | string | LEDES timekeeper ID. |
| `timekeeper_name` | string | Display name. |
| `timekeeper_role` | string | `partner`, `senior_associate`, `associate`, `paralegal`, `other`. The skill needs role to apply staffing-ratio guidelines. |
| `task_code` | string | UTBMS task code (e.g. `L110` for legal research). |
| `activity_code` | string | UTBMS activity code (e.g. `A101` for plan and prepare for). |
| `hours` | number | 0 for expense lines. |
| `rate` | number | The hourly rate billed. 0 for expense lines. |
| `amount` | number | Line total. |
| `narrative` | string | The free-text time-entry description. |
| `is_expense` | boolean | True for expense lines. |
| `expense_category` | string | UTBMS expense code if `is_expense`; null otherwise. |

## Per-format quirks

### LEDES 1998B narrative width

The 1998B spec doesn't cap narrative width, but some submission portals truncate at 250-500 chars. Firms occasionally submit truncated narratives that look vague when they were originally detailed. The skill flags very-short narratives but does not auto-assume truncation; the legal-ops lead checks the source.

### Timekeeper role inference

LEDES doesn't include a `role` field directly. The skill infers role from the engagement letter's rate sheet (timekeeper rates tier into roles) OR from a per-firm `timekeeper_roles.csv` mapping if provided.

If neither is available, the skill flags every line where role-dependent guidelines (§4.x) apply as "role unknown — staffing check skipped" rather than guessing.

### Expense detail granularity

LEDES 1998B has a coarse expense category. For finer detail (e.g. distinguishing photocopying from CD-ROM duplication), the skill reads the `narrative` field of expense lines. Firms vary in how detailed expense narratives are.

### Partial-hour rounding

LEDES preserves the actual hours billed; rounding (or non-rounding) is the firm's policy. The skill doesn't enforce rounding policy — that's the engagement letter's job. The skill does flag suspicious patterns (every entry ending in .0 or .5, suggesting the firm rounds aggressively).

## CSV fallback

For invoices not in LEDES format (small firms, paper invoices, PDF-extracted), the skill accepts a CSV with the same normalized columns above. The CSV must:

- Use comma delimiter, double-quote text qualifier, UTF-8 encoding.
- Include header row.
- Use ISO-8601 dates.

A pre-parsed CSV is the recommended format when a PDF invoice has been OCR'd — manual cleanup of the CSV is more reliable than auto-extraction from PDF, which often loses table alignment.

## Audit-log line storage

The audit log captures `findings_by_category` (aggregated) and per-line findings IDs, NOT the full invoice. Rationale: invoice content is privileged; the audit log should be retainable longer than the invoice and shouldn't carry the privileged content.

For full reproducibility of a finding, the legal-ops lead can re-run the skill against the original invoice file (which lives in the e-billing platform's record).

## What the skill does NOT do

- Calculate the dispute total (the legal-ops lead picks which findings to dispute).
- Communicate findings to the outside firm (the legal-ops lead handles the conversation).
- Enforce a fixed dispute response window (the engagement letter governs).
- Decide whether the finding is worth disputing relative to the firm relationship.

The skill is decision support, not negotiation automation.
