# GSC page-2 harvest

Find queries where ooligo pages rank positions 8-25 and refresh `gsc-candidates.json`. Scheduled weekly (Saturday 21:00 local). Consumers: [freshness-prompt.md](freshness-prompt.md) and [topic-refill-prompt.md](topic-refill-prompt.md).

## Step 1 — Check for GSC credentials

This routine needs **either**:

- A Google Search Console API service account JSON with read access to the `ooligo.com` property, configured at `~/.config/ooligo/gsc-service-account.json` (gitignored, never committed), **OR**
- A manual export at `content-strategy/gsc-export.csv` placed there by the user (no older than 7 days).

If neither is present, log `gsc-harvest: no credentials or recent export — exiting cleanly` and exit without commit. Do not generate fake data.

## Step 2 — Pull the data

If using the API: query the last 28 days, dimensions `[query, page]`, no filters. Pull up to 5000 rows.

If using the manual CSV: read it as-is. CSV is expected to have columns `Query, Page, Clicks, Impressions, CTR, Position`.

## Step 3 — Filter to harvest candidates

Keep rows where:

- `Position` between 8 and 25 (inclusive)
- `Impressions` ≥ 50 (real signal, not noise)
- `Page` is on ooligo.com and matches one of: `/tools/`, `/comparisons/`, `/vs/`, `/workflows/`, `/learn/`, `/stacks/`
- `Query` is not the page's exact slug or title (those are vanity — we want emerging searches)

Group by `Page` and aggregate:
- `page_url`
- `current_slug` (parsed from URL)
- `queries`: array of `{ query, position, impressions, clicks }` sorted by impressions desc
- `top_query`: highest-impressions query

## Step 4 — Identify the action

For each candidate page, classify:

- **refresh** — page exists, ranking is improvable by re-authoring against current queries. Likely most common case for page-2 candidates.
- **gap** — query is high-impression but no dedicated page exists (the `Page` field shows it's being matched by a tangentially-related entry like a vertical landing page). Action: queue a new entry covering this query.
- **already-optimized** — page exists, ranking is volatile (varies week-to-week between page 1 and page 2), and the body already targets this query. Action: no change.

## Step 5 — Write gsc-candidates.json

Overwrite [gsc-candidates.json](gsc-candidates.json) with:

```json
{
  "generated_at": "YYYY-MM-DDTHH:MM:SSZ",
  "source": "api" | "manual-csv",
  "window_days": 28,
  "refresh_candidates": [
    {
      "slug": "apollo",
      "entity": "tools",
      "page_url": "/tools/apollo",
      "top_query": "apollo io alternatives",
      "queries": [
        { "query": "apollo io alternatives", "position": 11.3, "impressions": 1240, "clicks": 18 },
        { "query": "apollo vs zoominfo pricing", "position": 14.2, "impressions": 820, "clicks": 6 }
      ]
    }
  ],
  "gap_candidates": [
    {
      "suggested_slug": "outbound-deliverability-2026",
      "entity": "learn",
      "top_query": "improve outbound email deliverability 2026",
      "queries": [
        { "query": "improve outbound email deliverability 2026", "position": 18.1, "impressions": 640, "clicks": 4 }
      ]
    }
  ],
  "already_optimized": [
    { "slug": "claude", "entity": "tools", "note": "ranks page-1 most weeks" }
  ]
}
```

## Step 6 — Commit

Single file changed: `content-strategy/gsc-candidates.json`. Commit:

```
chore: gsc harvest YYYY-MM-DD — N refresh, M gap, K already-optimized
```

Include the `Co-Authored-By` trailer. Push to `origin main`.

## Guardrails

- Never commit raw GSC export data with query terms that could be PII-adjacent (rare, but if a query looks like an email or phone number, drop the row).
- Never commit the service-account JSON. It lives outside the repo.
- The data window is fixed at 28 days — don't change it without coordination with `monthly-retro-prompt`, which references this file for ranking-win counts.

## Autonomous mode

Run end-to-end. If no credentials/export, exit cleanly. If the data has no candidates after filters, write an empty arrays version of `gsc-candidates.json` (preserves the schema for downstream consumers) and log `gsc-harvest: 0 candidates`.
