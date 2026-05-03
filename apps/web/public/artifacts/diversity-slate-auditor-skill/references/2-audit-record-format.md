# Audit-record JSONL schema

The diversity slate auditor appends one JSONL line per audit to `audit/<YYYY-MM>.jsonl`. This file documents the schema. The format is fixed because external readers (NYC LL 144 audit submission, internal DEI program review, legal discovery) need to parse the records reliably.

## Schema

```json
{
  "audit_id": "uuid-v4",
  "timestamp": "ISO-8601 UTC",
  "skill_version": "1.0",
  "model": "claude-sonnet-4-6",
  "slate_label": "free-text identifier",
  "role_family": "string from references/1-reference-pools.md",
  "slate_size": "integer",
  "slate_size_warning": "ok | small_slate_warning | informational_only",
  "reference_pool": {
    "source": "BLS-15-1252 | stack-overflow-developer-survey-2024 | ...",
    "last_verified": "ISO-8601 date",
    "freshness_warning": "ok | over_18_months"
  },
  "dimensions": [
    {
      "dimension": "gender",
      "category": "woman",
      "slate_pct": 28.6,
      "reference_pct": 21.8,
      "delta_pp": 6.8,
      "confidence": "low | medium | medium-high"
    },
    {
      "dimension": "race_ethnicity",
      "category": "Black",
      "slate_pct": 0.0,
      "reference_pct": 8.5,
      "delta_pp": -8.5,
      "confidence": "low | medium | medium-high"
    }
  ],
  "gaps_surfaced": [
    {
      "dimension": "race_ethnicity",
      "category": "Black",
      "direction": "under",
      "magnitude_pp": 8.5,
      "confidence": "medium",
      "upstream_candidates": [
        "sourcing-channel-mix",
        "search-query-language",
        "application-drop-off",
        "outreach-response-rate",
        "jd-language"
      ]
    }
  ]
}
```

## Field-by-field

- `audit_id` — uuid v4. Stable for the audit's lifetime; allows downstream systems to deduplicate.
- `timestamp` — ISO-8601 UTC of when the audit was generated, NOT when the slate was assembled.
- `skill_version` — version of this skill (semver). Allows downstream readers to handle schema evolution.
- `model` — exact model ID used (e.g. `claude-sonnet-4-6`). Required for NYC LL 144 reproducibility — the audit must identify the model that processed the data.
- `slate_label` — free-text label. Recruiter chooses; suggested format `<quarter>-<role-family>-<stage>` (e.g. `Q2-2026-senior-eng-onsite-slate`).
- `role_family` — must match a key in `references/1-reference-pools.md`. Required for the reference-pool validation chain.
- `slate_size` — integer count of the slate.
- `slate_size_warning` — `ok` if `n >= 5`, `small_slate_warning` if `3 <= n < 5`, `informational_only` if `n < 3`. The audit refuses to compute deltas at `n < 3` (the auditor halts at load-time before any record is written).
- `reference_pool` — object. `source` is the named source string. `last_verified` is when the role-to-pool mapping was last confirmed against the source. `freshness_warning` is `over_18_months` if the source's `last_verified` is older than 18 months.
- `dimensions` — array of per-dimension/category records. Every dimension/category pair the slate has data for AND the reference pool has data for. Pairs missing from either side are silently skipped (the audit does not assert about dimensions it cannot compare).
- `gaps_surfaced` — array of dimensions with `|delta_pp| >= 5`. Empty array if no gaps cross the threshold. Each gap entry includes the upstream-candidate keys for the recruiter / DEI lead to investigate; the upstream candidates are NOT recommendations but a list of investigation surfaces.

## What the schema deliberately does NOT include

- **Per-candidate fields.** No candidate IDs, no per-candidate self-ID, no per-candidate scores. The skill's design point is aggregate-only inference; the audit record reflects that.
- **Statistical-significance scores.** Slate sizes are too small for inferential framing to mean anything, and surfacing a p-value invites the wrong kind of reading. The confidence band (`low | medium | medium-high`) is a coarser, more honest summary.
- **Recommendations.** The skill surfaces gaps and lists upstream candidates. It does not say "you should hire more X" or "the slate is unbalanced" — those judgments are the DEI lead's, and the skill's role is decision support, not decision automation.
- **Identifying information about the recruiter or DEI lead.** The audit record is about the slate, not about who ran the audit. Operator identity belongs in the audit log of the system that called the skill (your ATS, your scheduling tool), not in the skill's own record.

## Retention

The audit records should be retained for at least as long as the firm retains hiring records — typically 2-7 years for affirmative-action-program firms (under 41 CFR 60-1.12), longer in some EU jurisdictions. NYC LL 144 requires the bias-audit results be made publicly available; the per-slate audit records support the annual aggregation that goes public.

The skill writes append-only JSONL with the skill version embedded. Modification breaks readability of the file; prefer correction-via-superseding-record (write a new audit with `slate_label` referencing the original) over editing.

## Reading the records

Downstream readers (the firm's annual DEI report, the NYC LL 144 submission, an external auditor) parse the JSONL by line. The schema is forward-compatible: new optional fields can be added in future skill versions; consumers that don't recognize new fields ignore them.

For the annual aggregation, group by `role_family` and quarter, then for each `(role_family, quarter)` compute:

- Mean delta per dimension/category over all slates
- Total gaps surfaced and per-gap counts
- Trend in delta over the past four quarters

That aggregation lives outside this skill — it's a separate report. The audit records exist so that aggregation is possible.
