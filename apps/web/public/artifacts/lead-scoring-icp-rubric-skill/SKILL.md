---
name: lead-scoring-icp-rubric
description: Score a single lead or a batch of leads against an explicit ICP rubric. Returns a 0-10 score per lead, a per-criterion rationale citing the rubric, a recommended next action by tier, and an escalation flag for borderline cases. Use when triaging inbound or routing enriched outbound leads — not as a substitute for behavioral or intent-based scoring.
---

# Lead scoring (ICP rubric)

## When to invoke

Invoke whenever you need to score a single lead — or a CSV/JSON batch of leads — against your team's ICP rubric. Typical entry points: a Clay table column, a HubSpot custom-code action firing on a new MQL, a standalone CLI run over a marketing-list export, or a manual paste during deal-desk triage.

The skill takes structured lead data plus the rubric and returns a 0-10 score, per-criterion rationale, a recommended next action by tier, and an escalation flag when the data is too thin to score confidently.

Do NOT invoke this skill for:

- **Auto-rejecting leads.** The output is a recommendation. Disqualifying a lead from outreach without an SDR seeing the rationale silently destroys pipeline when the rubric is wrong (and the rubric is sometimes wrong).
- **Scoring on protected-class proxies.** Do not pass fields like name-derived gender, photo, age, country-of-origin signals. Even if your rubric weights "geography" legitimately for support-hours fit, never collapse that into ethnicity or nationality. The skill refuses fields it recognizes as protected-class proxies.
- **Replacing intent-based or behavioral scoring entirely.** This is fit scoring, not intent. A great-fit account that has not visited your pricing page in 90 days is still a great fit but not a hot lead. Pair this skill with whatever signals "they are in-market right now" — Bombora, 6sense, your own product-usage events.

## Inputs

Required:

- `lead` — a structured lead record. Minimum fields: `email`, `company_domain`. Strongly preferred: `headcount`, `industry`, `country`, `job_title`, `tech_stack` (array), `funding_stage`. Pass whatever your enrichment layer (Clay, Apollo, ZoomInfo, Clearbit) returns.
- `rubric` — path to or inline contents of the ICP rubric markdown (see `references/1-icp-rubric-template.md`). Must contain explicit criterion + weight + tier-value rows. The skill refuses to score against a rubric that has no weights — vibes are not a rubric.

Optional:

- `source_of_lead` — free-text or enum: `inbound_demo`, `inbound_content`, `outbound_sequence`, `partner_referral`, `event`, `cold_list`. Used to bias the recommended-next-action mapping (a partner referral with a B-tier score still gets a human reach-out; a cold-list lead at the same tier does not).
- `batch_size_hint` — when scoring more than one lead, the caller can pass an integer so the skill paces token usage and returns progress markers. Default: process serially, no progress markers.

## Reference files

Always load these from `references/` before scoring. They are the leverage point — a tight rubric makes a defensible score, a vague rubric makes a vibes score that an AE will (correctly) ignore.

- `references/1-icp-rubric-template.md` — the rubric template. Replace placeholder rows with the actual criteria, weights, and tier values your team has agreed on.
- `references/2-tier-to-action-matrix.md` — maps the four tiers (A / B / C / disqualified) and the `source_of_lead` enum to a recommended next action. Edit this once with your team's routing reality, not the defaults.
- `references/3-sample-output.md` — a literal example of the markdown the skill produces, for one fictional lead. Use as the reference when wiring downstream parsers.

## Method

The skill runs these steps in order. Earlier steps gate later steps — do not parallelize.

### 1. Deterministic firmographic checks (no LLM)

Before any LLM call, run plain code over the lead record:

- Hard disqualifiers from the rubric (e.g. `country in ["{sanctioned-country}"]`, `industry in {disqualified-industries}`, `headcount < 10` if the rubric sets that floor) → return tier `disqualified` with the citation, no LLM call.
- Required-field check: if `email` and `company_domain` are missing, return `escalate: insufficient_data`.

Why: deterministic checks are free, fast, and never hallucinate. Burning tokens to confirm that a 3-person hairdresser is not in your enterprise-SaaS ICP is wasteful and slightly embarrassing.

### 2. Per-criterion LLM scoring with explicit rubric weighting

For each remaining criterion in the rubric, prompt the model to produce a tier value (A / B / C) and a one-sentence rationale that cites the rubric row. The skill multiplies the tier-value (A=3, B=2, C=1) by the criterion's weight and sums.

Why per-criterion rather than one holistic prompt: holistic scoring blends criteria silently and you lose the ability to debug why a lead got an 8 instead of a 5. Per-criterion outputs make the score auditable. The cost is roughly 6-10 short prompts per lead (or a single prompt that emits a structured per-criterion response — both work; the skill defaults to a single structured prompt with explicit per-criterion fields to keep tokens down).

Why explicit weighting rather than "let the model balance them": stated weights are the only way the rubric stays the source of truth. If the model invents its own balance, the rubric stops being authoritative and rubric reviews become theatre.

### 3. Borderline case fallback to human review

If the final score is within `+/- 0.5` of a tier boundary, OR if the rubric has more than 3 criteria where the data was missing/insufficient, set `escalate: needs_human_review` with a note naming the missing fields.

Why: the most expensive scoring failure is not a wrong tier on a confident lead — it is a wrong tier on a lead that was always borderline. Surfacing those for human review preserves trust in the confident scores.

### 4. Output assembly

Render the markdown described in "Output format" below. Score is the headline number. Rationale is the per-criterion table. Next action comes from the tier-to-action matrix, joined with `source_of_lead` if provided. Escalation flag is surfaced at the top when set.

## Output format

Literal markdown the skill emits for a single lead:

```markdown
# Lead score — jane.doe@acme.com (acme.com)

**Score:** 7.4 / 10 — Tier B
**Source:** inbound_content
**Escalate:** no

## Recommended next action

Tier B + inbound_content → SDR personalized email within 24h, no auto-sequence. Reference content piece they engaged with.

## Rationale (per criterion)

| Criterion | Weight | Tier | Reason |
|---|---|---|---|
| Industry | 5 | A | "Vertical SaaS / RevOps" matches in-ICP row in rubric. |
| Headcount | 4 | B | 240 employees — in stretch range (200-500), not core (500-2000). |
| Geo | 3 | A | HQ US-east, in supported region. |
| Tech stack | 4 | B | Salesforce + Marketo present (fit signals); no data warehouse cited. |
| Funding stage | 2 | C | Bootstrapped — out of preferred Series B-D band. |
| Job title | 4 | A | "Director, RevOps" matches champion-target pattern. |

## Disqualifier check

None triggered.

## Data gaps

- `revenue` field not provided by enrichment.
```

For batch input, the skill emits one such block per lead, separated by `\n---\n`, plus a top-level summary table (`email | tier | escalate`).

## Watch-outs

- **Rubric drift.** The rubric is a markdown file that someone edits. Edits are silent — no diff is shown to the SDRs reading scores. **Guard:** the skill records the rubric's SHA-256 in every output footer and prepends a "Rubric updated {date}, last verified by {name}" line if the hash differs from the previous run's. A weekly job (or a calendar reminder, if you are not that fancy) opens a PR-style review of the rubric every quarter.
- **Source-bias amplification.** If the rubric was built from your closed-won set, it encodes who you have already sold to. Repeatedly scoring against it narrows your pipeline to lookalikes and makes you blind to adjacent ICP. **Guard:** every quarter, sample 20 leads the skill scored as C-tier and have an AE review whether any are actually fit. If more than 3 are misclassified, the rubric is over-fit and needs a "stretch ICP" row added.
- **False confidence on thin data.** When enrichment is missing 4 of the 6 criteria fields, a 7.4 score is mostly noise. **Guard:** the skill sets `escalate: needs_human_review` whenever more than 3 criteria are scored on missing/inferred data, and adds a "Data gaps" section listing the absent fields. SDRs are trained to read the gaps section before the headline number.
