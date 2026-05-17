# Freshness sweep

Find EN entries past their freshness SLA and prepend `refresh:` items to [topic-queue.md](topic-queue.md). Scheduled weekly (Sunday 01:00 local). The freshness SLAs are the contract in [../CONTENT_PIPELINE.md](../CONTENT_PIPELINE.md) §Freshness SLAs.

## SLA table

Per CONTENT_PIPELINE.md (re-stated here for reference; the source of truth is the doc):

| Entry type | Field-level SLA | Whole-body SLA |
|---|---|---|
| Tools — pricing fields | 60 days | — |
| Tools — body | — | 120 days |
| Comparisons | — | 180 days |
| Workflows | — | 180 days |
| Stacks | — | 120 days (cascades on constituent tool refresh) |
| Learn — definition / framework / FAQ / glossary | — | 12 months |
| Learn — how-to | — | 6 months |

Date field per type:

- Tools: `last_reviewed`
- Comparisons / Learn: `last_updated`
- Workflows: `last_reviewed` if present, else `last_updated`
- Stacks: `last_reviewed` if present, else `last_updated`

## Step 1 — Walk EN entries

Walk `content/<entity>/en/*.mdx` for every entity type. Read frontmatter only (don't open the body). Extract the relevant date field and compare to today.

Today: $(date in YYYY-MM-DD per the system clock).

An entry is **stale** if `today - <date field> > SLA`.

For tools, also check pricing-field freshness: if `pricing_starts_at`, `pricing_model`, or `pricing_url` look like they could have changed (heuristic: check if `last_reviewed` > 60 days ago AND the tool is in a fast-moving category like outbound or AI assistants — these have the most pricing churn). Flag for refresh if any of: SLA exceeded, or vendor changelog (if available from a recent `topic-refill` run via `gsc-candidates.json` notes) mentions pricing.

For stacks: in addition to the stack's own SLA, flag if any constituent tool was refreshed since this stack's `last_reviewed` (cascade rule).

## Step 2 — Cross-check against existing queue items

For each stale entry:

1. Grep `topic-queue.md` for the slug. If a `refresh:` item for this slug already exists at the top of the queue, skip (don't duplicate).
2. If a non-`refresh:` item references this slug (e.g. a new comparison being planned that includes this tool), still add the `refresh:` — authoring slots will handle ordering.

## Step 3 — Prepend `refresh:` items

`refresh:` items live in a dedicated block at the very top of `topic-queue.md`, above the section headers. Format:

```markdown
## Refresh queue

- refresh: [type:tool] [vertical:revops] apollo — body 130d stale (last_reviewed 2026-01-08, SLA 120d)
- refresh: [type:comparison] [vertical:legal-ops] ironclad-vs-spellbook — body 195d stale (last_updated 2025-11-03, SLA 180d)
- refresh: [type:stack] [vertical:recruiting] sourcing-stack-mvp — cascade (gem refreshed 2026-05-12 > stack's last_reviewed 2026-04-30)
- ...

## Tools

(existing new-content items follow as before)
```

Each `refresh:` item includes:
- The slug (must exist as an EN entry)
- The `[type:...]` and `[vertical:...]` tags
- The reason in parentheses: SLA delta or cascade source

If the `## Refresh queue` header doesn't exist, create it as the first section in the file. If items in the refresh block are now stale (i.e. they've been there >2 weeks because no authoring slot has picked them up), don't dedupe them away — leave them as a visible backlog signal. If the backlog grows past ~15 items, log a warning in the commit message and the user will see it.

## Step 4 — Pick a sentinel for next run

Append `last-swept: YYYY-MM-DD` near the top of `topic-queue.md` (overwrite the previous one if any). This lets you confirm at a glance the sweep is running.

## Step 5 — Commit

If the sweep found any new stale entries to flag, commit:

```
chore: freshness sweep YYYY-MM-DD — N entries past SLA

Tools body: <count>
Tools pricing: <count>
Comparisons: <count>
Workflows: <count>
Stacks: <count> (incl. <cascade count> cascades)
Learn: <count>
```

Include the `Co-Authored-By` trailer. Push to `origin main`.

If the sweep found nothing (zero new stale entries), log `freshness: no new stale entries` and exit cleanly without a commit. The `last-swept:` line update alone is not worth a commit — the user can see runs in the scheduled-task log.

## Guardrails

- Never edit MDX files in this routine — that's the authoring slot's job (via the `refresh:` queue item).
- Never bump `last_reviewed` / `last_updated` here — those bump when the entry is actually re-authored.
- The SLA table is authoritative in CONTENT_PIPELINE.md. If you see a conflict with this file, the contract wins; flag the inconsistency in the commit message.

## Autonomous mode

Run end-to-end. If validation fails (`npm run validate:config`), abort the commit and log the failure — the queue stays uncommitted.
