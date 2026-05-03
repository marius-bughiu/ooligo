---
name: diversity-slate-auditor
description: Audit a candidate slate's composition against a reference labor-market pool, surface per-dimension gaps with confidence bands, list upstream gap candidates for the recruiter to investigate, and emit an audit record. Never makes per-candidate inferences; never recommends adding or removing individual candidates from a slate.
---

# Diversity slate auditor

## When to invoke

Use this skill when a recruiter or DEI lead has a candidate slate (interview lineup, sourced pool, application pool) and wants the slate's composition audited against the role's reference labor-market pool. Take an aggregate-level slate export plus a reference-pool mapping as input and return a structured audit report plus an append-only JSONL audit record.

Do NOT invoke this skill for:

- **Identifying individual candidates' protected-class membership.** This skill processes self-reported aggregate data only. It refuses to infer demographics from name, photo, school, or any candidate-level signal.
- **Auto-rejecting candidates to "rebalance" a slate.** The skill surfaces gaps; it never recommends adding or dropping individual candidates. Rebalancing by candidate-level removal is reverse discrimination.
- **Composition data candidates have not consented to share.** Self-ID flows in Ashby/Greenhouse/Lever capture explicit consent. The skill processes only consented data.
- **Slates of <3 candidates.** Composition statistics are not meaningful at that size.

## Inputs

- Required: `slate_export` — path to a per-role aggregate export from the ATS. The export should contain self-ID counts per dimension at the slate level, NOT per-candidate rows. Example: `{ "gender": {"woman": 4, "man": 7, "non_binary": 1, "decline_to_state": 2}, "race_ethnicity": {...}, ... }`. If the export is per-candidate, the skill aggregates first and discards the per-row data before any analysis.
- Required: `role_family` — string identifying the role (e.g. `senior-software-engineer`, `account-executive`). Used to look up the reference pool in `references/1-reference-pools.md`.
- Optional: `reference_pool_override` — path to a custom reference-pool file (e.g. industry-specific data). If absent, defaults to BLS for the mapped occupation.
- Optional: `slate_label` — free-text label for the audit record (e.g. `Q2-2026-senior-eng-onsite-slate`).

## Reference files

- `references/1-reference-pools.md` — role-family-to-reference-pool mapping with sources, dates, and the BLS occupation codes.
- `references/2-audit-record-format.md` — the literal JSONL schema for the audit record.

## Method

Six steps.

### 1. Load the slate

Open `slate_export`. If the export is per-candidate, aggregate immediately and discard the per-row data — DO NOT pass per-candidate self-ID through any subsequent step.

If the slate has <3 candidates, halt: "Slate too small for audit. Composition statistics on <3 candidates are not meaningful and risk identifying individuals."

If the slate has 3-4 candidates, emit a warning header on the audit but continue: "Small slate — composition deltas have wide confidence bands."

### 2. Load the reference pool

Read `references/1-reference-pools.md` and map `role_family` to the appropriate BLS occupation code (or other source). Load the reference pool's per-dimension percentages.

If the reference pool's `last_verified` date is older than 18 months, emit a freshness warning on the audit. Continue.

If `reference_pool_override` is provided, use that file instead and skip the BLS mapping.

### 3. Compute composition deltas

For each dimension where both the slate AND the reference pool have data:

- Slate percentage = slate_count / slate_total
- Reference percentage = reference value
- Delta = slate_pct - reference_pct (signed; negative = under-representation in slate)

Round to 1 decimal place. Do NOT compute statistical-significance scores at the per-dimension level — slate sizes are too small for the inferential framing to mean anything.

### 4. Surface gaps with confidence bands

For each dimension with `|delta| >= 5pp`, emit a "gap" entry with:

- Direction (under or over)
- Magnitude (in percentage points)
- Confidence band based on slate size:
  - `n >= 30` → `medium-high` confidence
  - `10 <= n < 30` → `medium` confidence
  - `5 <= n < 10` → `low` confidence
  - `3 <= n < 5` → `informational only`

Do NOT label gaps as "concerning" or "fine." That judgment is the DEI lead's, not the skill's.

### 5. Surface upstream gap candidates

For each dimension with a gap, list 3-5 likely upstream causes the recruiter and DEI lead can investigate:

- **Sourcing channel mix** — which channels did the slate come from? Channels have their own composition skews; LinkedIn surfaces differently than Stack Overflow Jobs differently than employee referrals.
- **Search query language** — does the [Boolean search builder](/en/workflows/boolean-search-builder-claude-skill/) fairness pre-flight surface anything when run against the role intake?
- **JD language** — masculine-coded language ("rockstar," "ninja," "competitive") has measurable effect on application-stage composition. The JD audit is a separate workflow.
- **Hiring-manager screen language** — what questions did the screen include? Did any function as a proxy filter?
- **Application drop-off** — at which stage did the under-represented group drop off most? If at sourcing, the channel mix is the likely cause; if at screen, the screen rubric is.

DO NOT rank these. The right intervention varies by gap source. Listing them is decision support.

### 6. Emit audit record

Append one JSONL line to `audit/<YYYY-MM>.jsonl` matching the schema in `references/2-audit-record-format.md`. The record contains:

- `audit_id` (uuid), `timestamp`, `slate_label`, `role_family`
- `slate_size`, `dimensions_audited`, per-dimension `slate_pct` / `reference_pct` / `delta` / `confidence`
- `reference_pool_source`, `reference_pool_last_verified`
- `skill_version`, `model`

NO PII. NO per-candidate fields. The audit record is what makes a NYC LL 144 submission or annual DEI review defensible; it must be immune to candidate re-identification.

## Output format

```markdown
# Slate audit — {slate_label}

Audited: {ISO timestamp} · Role family: {role_family} · Slate size: {n}

{SMALL-SLATE WARNING if 3-4 candidates}
{REFERENCE-POOL FRESHNESS WARNING if >18 months old}

## Reference pool

- Source: {BLS table / Stack Overflow Developer Survey 2024 / etc.}
- Last verified: {date}

## Composition deltas

| Dimension | Slate % | Reference % | Delta | Confidence |
|---|---|---|---|---|
| Gender — woman | 28.6% | 21.8% | +6.8pp | medium |
| Gender — man | 50.0% | 76.5% | -26.5pp | medium |
| Race — Asian | 35.7% | 19.3% | +16.4pp | medium |
| Race — Black | 0.0% | 8.5% | -8.5pp | medium |
| Race — Hispanic/Latino | 7.1% | 7.6% | -0.5pp | medium |
...

## Gaps surfaced (|delta| >= 5pp)

### Race — Black: under-represented by 8.5pp (medium confidence)

Upstream gap candidates to investigate:
- Sourcing channel mix — what share of the slate came from referral vs. inbound vs. cold sourcing? Referral pools tend to mirror existing team composition.
- Search query language — run the role intake through the Boolean search builder's fairness pre-flight.
- Application drop-off — at which funnel stage is the gap widest?
- Outreach response rate — does outreach response by demographic show the gap originating in candidate engagement vs. sourcing reach?
- JD language — does the JD use language that has measured composition impact on application stage?

### Race — Asian: over-represented by 16.4pp (medium confidence)
{same shape}

## Audit record

Appended to `audit/2026-05.jsonl` — record id `{uuid}`.
```

## Watch-outs

- **Reverse discrimination from "rebalancing."** *Guard:* skill never recommends per-candidate adds/removes. Output is composition deltas + upstream gap candidates only.
- **Per-candidate inference.** *Guard:* skill processes aggregate data only; per-candidate exports are aggregated and discarded immediately on load.
- **Small-slate noise.** *Guard:* refuses at <3, warns at 3-9, low-confidence at <10.
- **Stale reference pools.** *Guard:* freshness warning at >18 months on the source.
- **Audit-record retention.** *Guard:* records are append-only JSONL with skill version embedded. Recruiters / DEI leads handle retention per firm hiring-record policy (typically 2-7 years).
