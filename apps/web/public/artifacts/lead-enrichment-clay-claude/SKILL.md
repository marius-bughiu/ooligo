---
name: lead-enrichment
description: Enrich a Clay table row with company summary, ICP fit score, and a personalized cold-email opener. Use this skill from Clay AI columns or from a Claude Code session driving the Anthropic Batch API over an exported lead list. Returns structured fields plus a draft opener for rep review — never auto-sends.
---

# Lead enrichment

## When to invoke

Whenever a Clay table or exported CSV of leads needs three derived fields
in one pass: a 2-sentence company summary, an ICP fit score with one-line
reasoning, and a sub-50-word cold-email opener that cites a real signal
from the company's public footprint. Take a domain (and optionally a
LinkedIn URL or a free-text ICP rubric) as input and produce a structured
JSON-shaped Markdown record per row.

Do NOT invoke this skill for:

- Auto-sending email. The opener is a draft for rep review. Wiring the
  output directly into a sequence-send step bypasses the guardrail this
  skill exists to enforce.
- Enriching leads that have not consented to processing. If the source
  list was scraped from a region with prior-consent rules (EU/UK GDPR,
  Quebec Law 25, etc.) without a documented lawful basis, stop and
  surface the concern to the operator. This skill will not silently
  process unconsented data.
- Account-level research briefs for discovery calls — use the
  `account-research` skill instead. This one optimizes for batch volume
  and cost-per-row, not depth.
- Public-company financial scoring or any decision that needs licensed
  data (S&P, Pitchbook). This skill reads public web only.

## Inputs

- Required: `domain` — the company's primary domain (e.g. `acme.com`).
  Must resolve and serve HTML; parked or dead domains are returned with
  `status: unreachable` and skipped.
- Required at config time: a Clay table reference (table ID + column
  map) OR a CSV path if running outside Clay. The skill assumes the
  table has at least `domain`; `first_name`, `title`, and
  `linkedin_url` improve opener quality if present.
- Required at config time: `references/icp-rubric.md` populated with
  your real rubric. Without it, `icp_fit_score` is omitted (not
  guessed).
- Optional: `references/opener-style-guide.md` — your team's voice,
  banned phrases, max length override.
- Optional: `references/source-quality-matrix.md` — vendor preference
  order when multiple enrichment columns upstream of this skill
  disagree.
- Optional: `recent_news` — pre-fetched by an upstream Clay column.
  When present, the opener step uses it instead of re-fetching.

## Reference files

Always read the following from `references/` before generating any row.
They encode the operator's positioning and quality bar — without them
output is generic.

- `references/icp-rubric.md` — the rubric the score uses. Replace
  template content with your actual ICP definition before first run.
- `references/opener-style-guide.md` — voice, length cap, banned
  phrases (e.g. "I noticed", "love what you're doing", any superlative).
- `references/source-quality-matrix.md` — preference order for
  resolving conflicts between upstream enrichment vendors (Apollo vs.
  Clearbit vs. ZoomInfo vs. Clay's native People/Company API).

## Method

Run these four sub-tasks in order per row. Steps 1-3 produce the
structured fields; step 4 only runs when the ICP score clears the
configured threshold.

### 1. Resolve and fetch

Hit `https://{domain}` with a 10-second timeout and one redirect hop.
On non-2xx, parked-domain heuristics, or empty body, mark
`status: unreachable` and skip steps 2-4. Do not retry indefinitely —
parked domains are a meaningful share of any scraped list and the
skill should fail fast on them rather than burn API spend.

If the homepage resolves, additionally fetch `/about`, `/company`, and
`/customers` (best-effort, ignore 404s). Concatenate cleaned text up to
~8K tokens; truncate from the end of the longest section, not the
front, to preserve the homepage hero copy.

### 2. Extract structured snapshot

In one Claude call, extract:

- `industry` — single noun phrase, derived from copy not guessed
- `size_signal` — one of `solo | smb | mid | ent`, justified by a
  cited copy fragment (employee count claim, customer-logo density,
  funding mention) or `unknown`
- `value_prop` — one sentence in the company's own framing
- `recent_signal` — at most one verifiable fact (a launch, hire,
  funding round, customer win) with a URL anchor. If none found in the
  fetched pages, return `null` rather than inventing one.

Engineering choice: extraction is a single structured Claude call, not
three. Each additional round-trip multiplies cost-per-row at 100K-row
scale; the extraction prompt is small enough to stay reliable in one
pass.

### 3. Score against ICP rubric

Load `references/icp-rubric.md`. Score the snapshot 1-10 with a
one-line justification that names which rubric dimension drove the
score. If the rubric file still contains template placeholders (`{...}`
literals), return `score: null` and `reason: "rubric not configured"`
rather than scoring against nothing.

Engineering choice: ICP scoring runs before opener generation, not
after. Rationale: opener generation is the most expensive step (longer
output, more careful prompt). Skipping it for sub-threshold rows is
where the cost savings live. A common misconfiguration is to generate
openers for every row "in case the rep wants to override" — that
defeats the filter.

### 4. Generate opener (only if score >= threshold)

Default threshold: 6/10. Configurable per run.

Inputs to the opener step: `value_prop`, `recent_signal` (if non-null),
the lead's `first_name` and `title` if present, and the style guide.

Hard rules baked into the opener prompt:

- Max 50 words.
- Must reference exactly one specific thing from `recent_signal` or
  `value_prop`. If both are null, return `opener: null` rather than
  writing flattery.
- No superlatives ("amazing", "incredible", "love").
- No invented company claims. The opener may only reference facts
  present in the snapshot. The prompt includes the snapshot inline
  and explicitly forbids facts not in it.
- No question close that pretends to know an internal pain ("how are
  you handling X?" without evidence X is happening).

The opener is always returned as a draft with a `confidence` field
(0-1) reflecting how strong the cited signal was. Reps see the
confidence; low-confidence openers are surfaced for rewrite, not auto-sent.

## Output format

One record per row, emitted as a fenced JSON block inside Markdown so
Clay's AI column can parse it and a human reading the log can scan it.

```markdown
### acme.com

```json
{
  "domain": "acme.com",
  "status": "ok",
  "industry": "Workforce management software",
  "size_signal": "mid",
  "size_signal_evidence": "About page cites '350+ employees across 4 offices'",
  "value_prop": "Schedules and pays hourly workforces for restaurants and retail.",
  "recent_signal": {
    "summary": "Launched a payroll module in March 2026.",
    "url": "https://acme.com/blog/payroll-launch"
  },
  "icp_fit_score": 8,
  "icp_fit_reason": "Mid-market, hourly-workforce vertical — direct match on rubric line 2.",
  "opener_draft": "Saw the March payroll launch — folding pay into the same surface as scheduling is the move most ops leaders ask us about. Worth a 20-min on whether the multi-state tax piece is hitting the same wall others have?",
  "opener_confidence": 0.78,
  "sources": [
    "https://acme.com/",
    "https://acme.com/about",
    "https://acme.com/blog/payroll-launch"
  ]
}
```
```

For unreachable rows the record collapses to `{ "domain": "...",
"status": "unreachable" }` with no other fields — no placeholder
strings.

## Watch-outs

- **Source-quality drift across vendors.** When a Clay table has both
  Apollo and Clearbit enrichment columns upstream and they disagree on
  headcount or industry, this skill's snapshot can flip-flop run to
  run. Guard: `references/source-quality-matrix.md` declares a
  preference order; the snapshot step cites which vendor (or
  homepage-derived value) it used per field, so drift is auditable.

- **Opener inventing claims that aren't in the data.** Without strict
  prompting, openers drift toward confident-sounding fabrications
  ("congrats on your Series C" when there was no Series C). Guard: the
  opener prompt receives the snapshot inline and has an explicit
  "facts not in the snapshot are forbidden" rule; `recent_signal`
  carries a URL so a reviewer can verify in one click; openers with
  `opener_confidence` under 0.5 are flagged for rewrite, not sent.

- **Cost-per-row escalation if the ICP filter is loose.** A rubric
  that scores most rows 7+ defeats the threshold gate; opener
  generation runs on every row and per-row cost rises 3-4x. Guard: the
  skill logs a `score_distribution` summary at the end of each batch
  (`{ "1-3": N, "4-6": N, "7-10": N }`); if more than 60% of rows land
  7+ across a 1K-row sample, the skill prints a warning to tighten the
  rubric before the next batch.

- **Rate limits on homepage fetches.** Hitting one root domain per row
  is fine; hitting `/about` and `/customers` triples the request count
  and some hosts throttle. Guard: per-host concurrency capped at 2,
  per-host minimum delay 250ms, and 429s are honored with a single
  back-off retry before the row is marked `status: unreachable`.

- **Stale enrichment.** A row enriched 90 days ago is not the same
  signal as one enriched today; reps treating old `recent_signal`
  values as fresh write embarrassing openers. Guard: every record
  carries an `enriched_at` timestamp, and the Clay column is
  configured to re-run when `enriched_at` is older than 30 days.
