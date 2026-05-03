# ICP rubric — TEMPLATE

> Replace every `{...}` placeholder with your team's real values before
> the first run. The lead-enrichment skill checks for unsubstituted
> placeholders and refuses to score against a template — it returns
> `score: null, reason: "rubric not configured"` instead of guessing.

## Firmographics

| Dimension | In-ICP | Stretch | Out |
|---|---|---|---|
| Industry | {list, e.g. "B2B SaaS, fintech, vertical SaaS"} | {adjacent industries} | {hard out, e.g. "consumer, agencies, edu"} |
| Headcount | {range, e.g. "200-2000"} | {range, e.g. "100-200, 2000-5000"} | {below/above, e.g. "<100, >5000"} |
| Revenue | {range, e.g. "$25M-$500M ARR"} | {range} | {below/above} |
| Geo | {regions, e.g. "US, Canada, UK"} | {regions, e.g. "EU, ANZ"} | {regions, e.g. "China, Russia, sanctioned"} |
| Funding stage | {stages, e.g. "Series B-D, public"} | {stages} | {stages, e.g. "pre-seed, bootstrapped <$5M"} |

## Technographics

Tools whose presence on the prospect's stack signals fit (we win when they have these because the integration story is short or the pain is acute):

- {Tool 1 — e.g. "Salesforce + Outreach"}
- {Tool 2 — e.g. "dbt + Snowflake"}
- {Tool 3 — e.g. "Segment"}

Tools whose presence signals misfit (we lose to them, or their presence implies a build-not-buy culture):

- {Tool A — e.g. "Hightouch (we lose to)"}
- {Tool B — e.g. "in-house reverse-ETL (build-not-buy)"}

## Pain ranking

When the skill produces an ICP score, it weights against this priority order. Higher = more important to surface first.

1. {Pain category — e.g. "outbound data quality blocking pipeline"} — weight 5
2. {Pain category — e.g. "rep ramp time eating quota"} — weight 4
3. {Pain category — e.g. "RevOps reporting backlog"} — weight 3
4. {Pain category — e.g. "tooling sprawl / consolidation push"} — weight 2
5. {Pain category — e.g. "compliance / data-residency"} — weight 1

## Score interpretation

The skill returns `1-10`. Suggested interpretation (override per team):

- **9-10** — direct ICP, multiple positive signals, no disqualifiers. Send.
- **7-8** — strong fit on firmographics, signal is plausible. Send after rep glance.
- **5-6** — adjacent. Default threshold cuts here. Opener may not generate.
- **3-4** — stretch fit, weak signal. Skip unless rep has specific reason.
- **1-2** — out of ICP. Suppress.

## Disqualifiers

Single signals that drop a row out regardless of other fit. The skill flags these with `disqualifier: "..."` in the output and forces score to 1.

- {Disqualifier 1 — e.g. "uses {Competitor} as system of record"}
- {Disqualifier 2 — e.g. "regulated industry without our SOC 2 + HIPAA"}
- {Disqualifier 3 — e.g. "headcount under 50 — wrong motion"}

## Last edited

{YYYY-MM-DD} — bump on every material change. The skill prepends a "rubric may be stale" note when this date is more than 90 days old.
