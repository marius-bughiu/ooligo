# Monthly traffic retro

Append a section summarizing the previous calendar month to [../TRAFFIC_RETRO.md](../TRAFFIC_RETRO.md). Scheduled Mondays at 10:00 local; self-gates to **1st Monday of the month** only.

## Step 0 — Self-gate

Cron can't reliably AND day-of-week × day-of-month, so check today's day. If today's `dayOfMonth > 7`, this is NOT the first Monday — log `monthly-retro: not first Monday, exiting` and exit cleanly without a commit.

## Step 1 — Determine the bracket

The "previous calendar month" is the month before today.

```
today = YYYY-MM-DD
target = YYYY-MM   (one month earlier; for today=2026-06-01 → target=2026-05)
```

Check if a section `## YYYY-MM` for the target already exists in `TRAFFIC_RETRO.md`. If yes, log `monthly-retro: YYYY-MM already summarized` and exit cleanly without a commit.

If `TRAFFIC_RETRO.md` doesn't exist, create it with a brief header explaining the format.

## Step 2 — Pull repo metrics (auto-fillable)

From `git log --since="<bracket start>" --until="<bracket end>"` and `content/<entity>/<locale>/*.mdx` counts:

- **Pages shipped (new + refreshed)** — count commits in the bracket window with prefix `content(` or `refresh(`. Break down by entity type and by vertical (parse the commit subject `content(<type>): <slug> — <type>/<vertical>`).
- **Locale parity check** — for every page shipped, confirm 6 locale files exist. Flag missing.
- **Translation-only commits** — should be near zero under the new architecture. If non-zero, flag as an anomaly.
- **Maintenance commits** — `chore:` commits, broken down by source (topic-refill, freshness, link-rot, internal-links, gsc-harvest).
- **Total content footprint at month end** — count `content/<entity>/en/*.mdx` per entity type (EN is canonical for counting).

From [pillar-index.json](pillar-index.json) (if present and updated):

- **Per-vertical entity counts** vs. the previous month — surface the deltas.

## Step 3 — Pull ranking signals (auto-fillable, conditional)

From [gsc-candidates.json](gsc-candidates.json):

- **Refresh candidates** — how many were on the list at month-start vs. month-end. Decreases are a win (we refreshed them); increases are a backlog signal.
- **Top 5 by impressions** in the refresh and gap buckets — list them with their `top_query`.
- **Already-optimized pages** — count, plus any that moved off this list (regression signal).

If `gsc-candidates.json` is missing or empty, log `monthly-retro: no GSC data, ranking section skipped`.

## Step 4 — Pull roadmap signals

Read [../ROADMAP.md](../ROADMAP.md). For each phase:

- Count `- [x]` checked items shipped in this bracket (cross-reference against commit messages mentioning that phase or the items' wording).
- Count `- [ ]` items still pending.

Compare against the prior month's section if it exists. Surface any new completions.

## Step 5 — Compose the section

Append to `TRAFFIC_RETRO.md`:

```markdown
## YYYY-MM

*Bracketed: <YYYY-MM-01> to <YYYY-MM-end>. Generated <today>.*

### Shipped

- New pages: <N> (× 6 locales = <N×6> files)
  - Tools: <count> | Comparisons: <count> | Workflows: <count> | Learn: <count> | Stacks: <count>
  - RevOps: <count> | Legal Ops: <count> | Recruiting: <count> | Cross: <count>
- Refreshed pages: <M> (× 6 locales = <M×6> files)
- Maintenance commits: <K>
  - topic-refill: <count> | freshness: <count> | link-rot: <count> | internal-links: <count> | gsc-harvest: <count>

### Catalog footprint at month end

| Entity | EN | × 6 locales |
|---|---|---|
| Tools | <count> | <count×6> |
| Comparisons | <count> | <count×6> |
| Workflows | <count> | <count×6> |
| Learn | <count> | <count×6> |
| Stacks | <count> | <count×6> |

### Ranking signal (GSC)

- Refresh candidates at month-end: <count> (was <prior-month count>)
- Gap candidates: <count> (was <prior>)
- Top 5 refresh candidates by impressions:
  - `<slug>` — top query `"<top_query>"` (<impressions> impr, pos <pos>)
  - ...
- Top 5 gap candidates:
  - suggested `<slug>` — top query `"<top_query>"` (<impressions> impr, pos <pos>)
  - ...

### Roadmap

- Phase <N> items shipped this month: <list>
- Phase <N> items still pending: <count> (see ROADMAP.md)
- New phase entries: <list, or "none">

### Anomalies

- <any: missing locales, translation-only commits, scheduled-task no-ops with reason, etc.>

### Manual fill (user)

- **GA4** — sessions / new users / countries top 5: ____
- **beehiiv** — subscribers added / unsubscribed / clicks: ____
- **Newsletter sends + open rate**: ____
- **Discord / community signups**: ____
- **Sponsors booked**: ____
- **MRR**: ____
- **Notes / decisions for next month**: ____
```

## Step 6 — Commit

```
chore: traffic retro YYYY-MM
```

Single file changed: `TRAFFIC_RETRO.md`. Include the `Co-Authored-By` trailer. Push to `origin main`.

## Guardrails

- Never auto-fill the "Manual fill (user)" section. The user fills GA4/beehiiv numbers; if you make them up, the retro stops being a truth document.
- Never edit prior months' sections — the retro is append-only.
- If repo data is incomplete or ambiguous (e.g. a commit subject that doesn't follow the convention), flag it in the Anomalies section rather than guessing.

## Autonomous mode

Run end-to-end on the 1st Monday only. The self-gate is the safety net.
