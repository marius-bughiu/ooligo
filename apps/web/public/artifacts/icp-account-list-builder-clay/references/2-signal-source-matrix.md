# Signal source matrix — TEMPLATE

> Replace this template's contents with your team's actual source policy.
> The `icp-list-builder` skill reads this file to decide which public sources
> count as primary vs corroborating, and which to skip entirely.

## Why this file exists

The skill's intent-signal scoring (method Step 4) requires a primary source plus a corroborating source for any signal to count above 0. This matrix is where you encode which source plays which role for your team. Without it the skill defaults to a generic ordering that under-weights signals you trust and over-weights ones you've found unreliable.

## Source roles

For each public source the skill may query, assign one role:

- **primary** — a signal originating here can anchor a score (still needs one corroborator)
- **corroborator** — only counts as the second source confirming a primary signal; cannot anchor on its own
- **skip** — never query this source; results are too noisy or stale to trust

## Source × signal-type matrix

| Source | Firmographic | Technographic | Hiring | Funding | Compliance/security | Notes |
|---|---|---|---|---|---|---|
| Company website (homepage, About, careers, trust center) | corroborator | corroborator | primary | corroborator | primary | Source of truth for own claims; queried first |
| LinkedIn company page | primary | skip | primary | corroborator | skip | Strongest for headcount + role changes; rate-limited |
| LinkedIn jobs | skip | skip | corroborator | skip | skip | Volume signal only; titles are noisy |
| BuiltWith | skip | primary | skip | skip | corroborator | Strong for tech stack, weak for everything else |
| Crunchbase | corroborator | skip | skip | primary | skip | Funding date + amount only; org charts are stale |
| Public press releases (last 90 days) | skip | skip | corroborator | corroborator | corroborator | Date-stamped; cite URL + date |
| TechCrunch / industry press | skip | skip | corroborator | corroborator | skip | Use for funding corroboration |
| G2 / Capterra reviews | skip | corroborator | skip | skip | skip | Reviewer-self-reported; treat as weak signal only |
| Wayback Machine | corroborator | corroborator | corroborator | skip | corroborator | Use to date page additions (compliance pages, jobs page changes) |
| Generic data aggregators (ZoomInfo, Apollo passive scrape) | skip | skip | skip | skip | skip | High noise; use a paid product directly if needed, do not let the skill scrape |

## Sources explicitly disallowed

The skill must never query these. Add domains here as you discover sources that have produced bad data for your team.

- {Domain 1 — e.g. "scraped-data-aggregator-x.example"}
- {Domain 2}

## Refresh windows

How fresh a signal must be to count. Anything older than the window is dropped to corroborator-only or to 0.

| Signal type | Max age to count as primary | Max age to count as corroborator |
|---|---|---|
| Hiring announcement | 9 months | 18 months |
| Funding round | 6 months | 12 months |
| Compliance page addition | 6 months | 24 months |
| Tech-stack signal | 6 months (BuiltWith last-seen) | 12 months |
| Headcount snapshot | 90 days | 12 months |

## Last edited

{YYYY-MM-DD}
