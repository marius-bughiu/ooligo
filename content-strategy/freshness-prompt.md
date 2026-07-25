# Freshness sweep

Find EN entries past their freshness SLA and prepend `refresh:` items to [topic-queue.md](topic-queue.md). Scheduled weekly (Sunday 01:00 local). The freshness SLAs are the contract in [../CONTENT_PIPELINE.md](../CONTENT_PIPELINE.md) §Freshness SLAs.

## SLA table

Per CONTENT_PIPELINE.md (re-stated here for reference; the source of truth is the doc):

| Entry type | Pricing SLA (`pricing_checked`) | Body SLA (`last_updated`) |
|---|---|---|
| Tools | 60 days | 180 days |
| Comparisons | — | 180 days |
| Workflows | — | 365 days, or any artifact-bundle check failure |
| Stacks | — | 180 days, cascading **only on material constituent change** |
| Learn — definition / framework / FAQ / glossary | — | 12 months |
| Learn — how-to | — | 6 months |

**Two date fields, two meanings.** `pricing_checked` records the last verification of pricing against the vendor's live page and moves even when nothing changed. `last_updated` records the last **body** re-author and moves only when prose changes. An entry missing `pricing_checked` entirely is treated as never verified — flag it.

## Step 1 — Walk EN entries

Walk `content/<entity>/en/*.mdx` for every entity type. Read frontmatter only (don't open the body). Extract both date fields and compare to today.

Today: $(date in YYYY-MM-DD per the system clock).

An entry is **stale** if `today - <relevant date field> > SLA`. Emit one item per breach, tier-prefixed per the selector in CONTENT_PIPELINE.md §Freshness SLAs:

- **Pricing SLA breached, nothing else known** → `refresh:A:` — a verification, not an authoring job.
- **Body SLA breached** → `refresh:C:`.
- **Known material change** (vendor acquired/sunset/repositioned, or `material_change_at` newer than `last_updated`) → `refresh:C:`, and **sort it above all calendar-triggered items**. Acquisitions arrive in waves; if they queue behind routine churn the budget gets spent on the items that matter least.

**Flag every pricing breach. Do not suppress any.** This file previously gated the pricing flag on a vague judgement — *"the tool is in a fast-moving category like outbound or AI assistants"* — and the result was that at the 2026-07-05 sweep, 94 tools were past their pricing SLA and only 30 were flagged. Under-reporting made the backlog look manageable while it grew. A Tier A item now costs one frontmatter line, so there is no reason to hide a breach, and the unsuppressed backlog is the only trustworthy capacity gauge the system has.

**Skip entries with `vendor_status: sunset`.** A sunset page is deliberately frozen at its original URL with a `superseded_by` pointer; re-flagging it every week is noise.

For stacks: flag on the stack's own body SLA, **or** if a constituent tool has a `material_change_at` newer than the stack's `last_updated`. A constituent's Tier A verification or Tier B price patch does **not** cascade. The old rule cascaded on *any* constituent refresh, which turned 18 stacks into ~523 demanded re-authors/year — `claude` alone sits in 7 stacks. Emit **one deduped item per stack per month**, listing every trigger in its reason string.

## Step 2 — Cross-check against existing queue items

For each stale entry:

1. Grep `topic-queue.md` for the slug. If a `refresh:` item for this slug already exists at the top of the queue, skip (don't duplicate).
2. If a non-`refresh:` item references this slug (e.g. a new comparison being planned that includes this tool), still add the `refresh:` — authoring slots will handle ordering.

## Step 3 — Prepend `refresh:` items

`refresh:` items live in a dedicated block at the very top of `topic-queue.md`, above the section headers. Format:

```markdown
## Refresh queue

- refresh:C: [type:tool] [vertical:recruiting] paradox — material (acquired by Workday 2025-10; material_change_at 2026-07-20 > last_updated 2026-05-02)
- refresh:C: [type:comparison] [vertical:legal-ops] ironclad-vs-spellbook — body 195d stale (last_updated 2025-11-03, SLA 180d)
- refresh:A: [type:tool] [vertical:revops] apollo — pricing 64d unverified (pricing_checked 2026-05-02, SLA 60d)
- refresh:C: [type:stack] [vertical:recruiting] sourcing-stack-mvp — cascade (material: gem 2026-05-12, hireez 2026-05-20 > stack's last_updated 2026-04-30)
- ...

## Tools

(existing new-content items follow as before)
```

Each `refresh:` item includes:
- The tier prefix — `refresh:A:`, `refresh:B:`, or `refresh:C:`
- The slug (must exist as an EN entry)
- The `[type:...]` and `[vertical:...]` tags
- The reason in parentheses: which field breached, its delta, or the material-change source

**Ordering within the block:** material-change Tier C first, then calendar Tier C, then B, then A. The `ooligo-author-refresh` lane consumes from the top, so this ordering is what guarantees an acquisition gets fixed before a routine price re-verification.

If the `## Refresh queue` header doesn't exist, create it as the first section in the file. Leave un-consumed items in place as a visible backlog signal — don't dedupe them away.

**Backlog alarm.** Tier C is the only tier that consumes an authoring slot, and the budget is 21 slots/week. If unconsumed **Tier C** items exceed 25, say so in the commit message and in the run report: that means refresh demand has outgrown its lane again, which is precisely the condition that drove new content to zero before. Tier A and B counts can be large without concern — they are cheap and drain fast.

## Step 4 — Pick a sentinel for next run

Append `last-swept: YYYY-MM-DD` near the top of `topic-queue.md` (overwrite the previous one if any). This lets you confirm at a glance the sweep is running.

## Step 5 — Commit

If the sweep found any new stale entries to flag, commit:

```
chore: freshness sweep YYYY-MM-DD — N entries past SLA (C:<n> B:<n> A:<n>)

Tier C (consumes an authoring slot): <count>
  Material change: <count>
  Body SLA: <count>
Tier B (pricing patch): <count>
Tier A (verify only): <count>

Tools: <count> | Comparisons: <count> | Workflows: <count> | Stacks: <count> (<cascades> cascades) | Learn: <count>
Unconsumed Tier C backlog: <count> / 25 alarm threshold
```

Include the `Co-Authored-By` trailer. Push to `origin main`.

If the sweep found nothing (zero new stale entries), log `freshness: no new stale entries` and exit cleanly without a commit. The `last-swept:` line update alone is not worth a commit — the user can see runs in the scheduled-task log.

## Guardrails

- Never edit MDX files in this routine — that's the refresh lane's job (via the `refresh:` queue item). This routine reads frontmatter and writes the queue. Nothing else.
- Never bump `last_updated` here — it bumps only when the body is actually re-authored.
- Never bump `pricing_checked` here — this sweep compares dates, it does not visit vendor pages. Only a lane that actually fetched the vendor's live pricing page may write that field. Writing it from a date comparison would make the field a lie and destroy the one signal the tiering depends on.
- The SLA table is authoritative in CONTENT_PIPELINE.md. If you see a conflict with this file, the contract wins; flag the inconsistency in the commit message.

## Autonomous mode

Run end-to-end. If validation fails (`npm run validate:config`), abort the commit and log the failure — the queue stays uncommitted.
