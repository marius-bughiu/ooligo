# Source quality matrix — TEMPLATE

> Replace placeholders with the vendors actually wired into your Clay
> table. The lead-enrichment skill consults this matrix when two
> upstream sources disagree on the same field, and cites which source
> won in the per-row output for audit.

## Why this exists

Clay tables routinely stack 2-3 enrichment vendors per field — Apollo on industry, Clearbit on headcount, ZoomInfo on funding. They disagree often: Apollo will say a 200-person company is 50, Clearbit will assign the wrong industry, ZoomInfo will lag a recent acquisition by a quarter.

Without a declared preference order, the skill's snapshot step flip-flops between vendors run to run, ICP scores oscillate, and operators cannot reproduce the same row twice.

## Field-by-field preference order

Per field, list vendors top-to-bottom in trust order. The skill takes the highest-ranked vendor that returned a non-empty value. The homepage-derived value (extracted by the skill itself in step 1) is always the tiebreaker if all vendors disagree with each other.

### Industry / sector

1. {e.g. "Homepage About-page extraction (skill step 1)"}
2. {e.g. "Clearbit Reveal"}
3. {e.g. "Apollo Company"}
4. {e.g. "ZoomInfo Industry"}

### Headcount

1. {e.g. "LinkedIn employee count via Clay's Linked-In Profile column"}
2. {e.g. "Apollo employee_count"}
3. {e.g. "Clearbit metrics.employees"}
4. Skill homepage extraction (last resort — copy claims often inflated)

### Revenue / ARR

1. {e.g. "ZoomInfo revenue (paid only)"}
2. {e.g. "Clearbit metrics.annualRevenue (estimated, low confidence)"}
3. Omit (do not extract from homepage; vanity metrics are not revenue)

### Funding stage / last round

1. {e.g. "Crunchbase via Clay's native column"}
2. {e.g. "Press-release fetch in skill step 1, only if dated within 90d"}
3. Omit

### Recent signal (launches, hires, news)

1. Skill homepage / blog fetch in step 1 — must carry a dated URL
2. {e.g. "Clay's Built-With column for tech-stack changes"}
3. {e.g. "Google News column, capped to last 60 days"}

Important: a vendor returning "we don't know" is treated as missing, not as a contradicting value. The next vendor in the list is consulted.

## Conflict logging

When two vendors return different values for the same field, the skill adds a `conflicts` block to the per-row output:

```json
"conflicts": [
  { "field": "headcount", "values": { "linkedin": 380, "apollo": 120 }, "chose": "linkedin" }
]
```

Operators should sample 10-20 conflict rows weekly. If one vendor is consistently wrong, demote it in this matrix. The matrix is the control surface, not the prompt.

## Vendor cost ceiling

Each vendor has a per-row cost (Clay credits or external API spend). Set a soft cap here — if a row's combined enrichment cost exceeds the cap, skip the lowest-ranked vendor and accept lower confidence.

- Soft cap per row: {e.g. "12 Clay credits"}
- Hard cap per row: {e.g. "20 Clay credits — abort row"}

The skill respects these caps and emits `cost_ceiling_hit: true` when the hard cap fires, so the batch summary surfaces the count.

## Last edited

{YYYY-MM-DD}
