---
name: compensation-benchmark
description: Take a role's level/geography/function plus a comp-survey export (Radford, Pave, Carta, or custom CSV), and produce a structured pay-band recommendation per component (base, equity, OTE) with cited percentiles, calibration against the firm's philosophy, and a public-facing range compliant with NYC LL 32-A and CO/CA/WA pay-transparency requirements. Never approves an offer; never auto-publishes.
---

# Compensation benchmark

## When to invoke

Use this skill when a recruiter or comp analyst needs a per-role pay band based on a survey export and the firm's comp philosophy. Take a role definition, a survey export, and the philosophy file as input and return a structured benchmark report plus a public-facing range.

Do NOT invoke this skill for:

- **Unilateral comp decisions outside the firm's approval matrix.** The skill recommends; People Ops / Finance / Comp Committee approve.
- **Equity at pre-Series-B startups.** Survey data is too thin and firm-cap-table-specific at that stage.
- **Negotiation-script generation.** Different workflow.
- **Approving exception bands** ("can we go 15% above?"). The skill informs; the hiring manager and finance approve.

## Inputs

- Required: `role_definition` — JSON with `level` (firm's ladder, e.g. `L5`), `geography` (e.g. `San Francisco MSA`), `function` (e.g. `software-engineering`).
- Required: `survey_export` — path to a survey export. Schema must match one in `references/1-survey-source-schemas.md`.
- Required: `philosophy` — path to the firm's compensation philosophy file. See `references/2-comp-philosophy-template.md`.
- Optional: `candidate_signal` — free-text note about the candidate (current comp, competing offers, etc.). Used in the calibration note, NOT to skew the recommended band.

## Reference files

- `references/1-survey-source-schemas.md` — per-source schemas with field mapping.
- `references/2-comp-philosophy-template.md` — fillable philosophy file.

## Method

Five steps.

### 1. Validate the role definition

Confirm `level`, `geography`, `function` are present and match values in the survey export. If `level` is on the firm's ladder but the survey uses a different ladder, look up the mapping in the philosophy file. If no mapping exists, halt and ask the user to add it.

If `geography` is ambiguous (e.g. "Bay Area" — does that include South Bay, East Bay, North Bay, the entire MSA?), halt and ask the user to specify against the survey's geography taxonomy.

### 2. Look up survey percentiles

Deterministic lookup — do NOT paraphrase the survey. For each of `base_salary`, `equity_annualized`, `ote` (or `bonus` if non-sales), pull the 25th / 50th / 60th / 75th / 90th percentiles for the matched (level, geography, function) cell.

Check the cell's sample size. If it's below the survey's documented threshold (Radford 5+, Pave 10+, Carta 15+ for equity, custom CSV per the schema's `min_sample_size` field), flag low-N. Fall back to a broader cell:

- First fallback: same level, same function, broader geography (e.g. US-wide).
- Second fallback: same level, same function, all geographies.

Document the fallback chain in the report. Do NOT silently fall back without surfacing.

### 3. Calibrate against firm philosophy

Read the philosophy file. The philosophy specifies the target percentile per component (e.g. base at 60th percentile, equity at 75th percentile, OTE at 50th percentile for sales).

For each component, compute:

- Recommended midpoint = survey's `target_percentile` for the cell
- Band width = midpoint × ±10% (default; configurable per component in the philosophy)
- Lower edge = midpoint × 0.9, upper edge = midpoint × 1.1

If the philosophy specifies a different band-width policy (e.g. wider band for senior roles where individual variance is larger), use that instead.

For equity: convert annualized survey value to dollar grant size at the firm's current strike price. Document the math in the report (`grant_value = annualized_value × vesting_period / strike_price`).

### 4. Compose the public-facing range

Compute the public-facing base salary range:

- Lower edge of public range = lower edge of base band
- Upper edge of public range = upper edge of base band
- Format: e.g. `$170,000-$210,000 USD per year`

Validate band width against the geography's pay-transparency requirements:

- NYC (LL 32-A): "good faith" range required; band narrower than ~15% width raises legal exposure.
- CO (Equal Pay for Equal Work Act): range required, no specific width threshold but functional good-faith requirement.
- CA (SB 1162): range required for postings if the role is to be performed in CA.
- WA (Pay Transparency Act): range required.

If the role straddles multiple jurisdictions, the broadest range applies. If the range is below 15% width, emit a warning (the band is at the edge of "good faith" — consider widening before publishing).

### 5. Emit the report + audit record

Write the report to stdout (or the calling environment's report destination). Append one JSONL line to `audit/<YYYY-MM>.jsonl` with: `role`, `geography`, `level`, `function`, `survey_source`, `survey_export_date`, `philosophy_version`, `target_percentiles`, `recommended_bands`, `public_range`, `low_n_flag`, `fallback_chain` (if any).

The audit record supports the firm's annual pay-equity audit. No PII; this is about the band, not about a specific candidate.

## Output format

```markdown
# Comp benchmark — {role} — {level} — {geography}

Generated: {ISO timestamp} · Skill v1.0 · Model: claude-sonnet-4-6
Survey: {Radford 2026-Q2 / Pave 2026-04 / etc.} · Philosophy: {firm-philosophy.json v3}

{LOW-N WARNING if any component fell back}

## Recommended bands

### Base salary (target: 60th percentile)

- Survey 60th percentile: $185,000
- Recommended band: $166,500 - $203,500
- Calibration note: Tight band (±10%); widen to ±15% for cross-level candidates.

### Equity (target: 75th percentile, 4-year vest)

- Survey 75th percentile annualized value: $90,000
- Total grant value: $360,000 over 4 years
- At firm strike $5.20: 69,231 shares
- Recommended band: 62,300 - 76,200 shares (±10%)

### Cash bonus (target: 50th percentile)

- Survey 50th percentile: $20,000 (annual target)
- Recommended band: $18,000 - $22,000

## Public-facing range (NYC LL 32-A / CO/CA/WA compliant)

`$166,500 - $203,500 USD per year, plus equity grant and target bonus`

Band width: 22% — within "good faith" thresholds.

## Provenance

- Survey: Radford Q2-2026 (export dated 2026-04-15)
- Survey cell sample size: 42 (above Radford's 5+ threshold)
- Philosophy: firm-philosophy.json v3 (updated 2026-01-10)
- Geography mapping: San Francisco MSA matched directly in Radford taxonomy
- Audit record: `audit/2026-05.jsonl` line {N}

## Calibration notes

- The candidate signal noted "competing offer at top of band from peer-tier company" — this is informational; the recommended band did NOT shift in response. If an exception is needed, escalate to the comp committee with the competing offer details.
- This role's geography has a pay-equity gap of -3.2% vs. firm-wide for the same level (per last quarterly audit); recommended band is at the firm's stated philosophy. Audit will surface whether the gap closes.
```

## Watch-outs

- **Survey-export staleness.** *Guard:* warns at >6 months on the export's dated metadata.
- **Geography mis-mapping.** *Guard:* halts on ambiguous geography rather than defaulting.
- **Low-N cell.** *Guard:* refuses to use a low-N cell; falls back with the chain documented.
- **Equity drift.** *Guard:* conversion math documented in the report; raw and converted values both stored in audit.
- **Public range too tight.** *Guard:* warns at <15% band width per pay-transparency-law functional thresholds.
- **Historical-pay bias propagation.** *Guard:* if philosophy is calibrated against historical pay rather than survey percentile, flag and recommend a separate pay-equity check.
