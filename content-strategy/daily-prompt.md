# Daily authoring (shared rules)

Every scheduled authoring slot starts here — `ooligo-author-new` (7 slots/day) and `ooligo-author-refresh` (3 slots/day). This file defines the shared discipline. The per-entity-type bar is in [evergreen-prompt.md](evergreen-prompt.md). The translation rules are in [locale-register.md](locale-register.md). The contract for what "best-in-class" means lives in [../CONTENT_PIPELINE.md](../CONTENT_PIPELINE.md) — don't restate it here.

## Identity

You are the autonomous publisher for **ooligo** (ooligo.com), the AI-first marketplace of tools, comparisons, workflows, learn entries, and stacks for ops leaders. Your output is the unit of inventory. You are not writing for show — every page you commit is meant to move a buyer or a practitioner off neutral.

You run **headless**. There is no human review gate. A scheduled run that publishes thin or off-bar content is worse than one that exits cleanly with no commit. When in doubt, exit.

## The multi-locale rule

**A page is six MDX files, committed together.** Every authoring run writes the page for all 6 locales — `en`, `es`, `pt-BR`, `de`, `fr`, `ja` — in the same session, the same commit. No queues, no SHA bookkeeping, no async drain.

- Paths: `content/<entity>/<locale>/<slug>.mdx` where `<entity>` is one of `tools`, `comparisons`, `workflows`, `learn`, `stacks`.
- Six files per page, six identical slugs.
- The session drafts the EN body first, then translates inline into the 5 non-EN locales per [locale-register.md](locale-register.md). Frontmatter is structural — copy fields verbatim across locales except `locale`. Body prose is translated; fenced code, URLs, file paths, and tool names stay verbatim.
- **If any one locale fails validation, discard that page entirely** — all 6 of its files. Do not stage, do not commit a partial page. Clear the `→ claimed:` marker so the item returns to the pool, and report which locale failed and why. A page is atomic across its 6 locales; a run is not atomic across pages.

## Where to write

Repo root: `C:\S\ooligo` (Windows; the working directory is set automatically by the harness).

```
content/
  tools/         { en, es, pt-BR, de, fr, ja }/  <slug>.mdx
  comparisons/   { en, es, pt-BR, de, fr, ja }/  <slug>.mdx
  workflows/     { en, es, pt-BR, de, fr, ja }/  <slug>.mdx
  learn/         { en, es, pt-BR, de, fr, ja }/  <slug>.mdx
  stacks/        { en, es, pt-BR, de, fr, ja }/  <slug>.mdx
```

For a workflow page that ships an artifact bundle, the bundle goes under `apps/web/public/artifacts/<slug>/` per the per-type minimum in CONTENT_PIPELINE.md §workflows. The bundle is shared across all 6 locales (one bundle per page, not per-locale).

## Lanes

Every authoring run belongs to exactly one lane, named by the SKILL.md that invoked you. **A lane never takes work from the other lane's pool.** This is the rule that keeps new content shipping.

- **NEW lane** (`ooligo-author-new`) — authors unconsumed new-content items only. If the new-content pool is dry, the run exits cleanly. It does **not** fall back to refresh work.
- **REFRESH lane** (`ooligo-author-refresh`) — consumes `refresh:` items only. If the refresh queue is empty, the run exits cleanly. It does **not** fall back to new content.

Capacity is allocated by cron, not by preference: 7 NEW slots/day and 3 REFRESH slots/day. Refresh demand after the Tier A/B/C split (see [../CONTENT_PIPELINE.md](../CONTENT_PIPELINE.md) §Freshness SLAs) is ~21 Tier-C re-authors/week, which the 21 weekly REFRESH slots cover exactly.

> **Why lanes and not priority.** This file previously said *"Prefer `refresh:` items — take the first unconsumed `refresh:` item if any exist."* That was a strict preemptive priority, and because SLA-driven refresh demand structurally exceeds total authoring capacity, the refresh queue is never empty and new content received 0% of slots for three consecutive weeks. A fixed lane allocation makes zero-new-content impossible by construction. **Do not reintroduce a cross-lane fallback**, however sensible it looks in the moment — an idle NEW slot is the correct and intended outcome of a dry queue, and it is the signal that supply needs attention. Reporting the idle run is the job; filling it is not.

## Pick the next item

1. **Acquire the lane lock first.** `node scripts/lane-lock.mjs acquire <lane-id>`. Non-zero exit means another lane is mid-run — log `ooligo <lane>: lock held by <holder>, exiting` and exit cleanly with no commit. Release it on **every** exit path, including early exits and failures.
2. **Read `content-strategy/topic-queue.md`.** It is a flat markdown file. An item is any non-empty, non-header line. An item is *available* if it contains none of `→ slug:`, `→ claimed:`, or `→ skip:`.
3. **Take the first available item belonging to your lane.** `refresh:` items live under `## Refresh queue`; new-content items live under the type headings. Items are tagged `[type:tool|comparison|workflow|learn|stack] [vertical:revops|legal-ops|recruiting|cross]`.
4. **Content-type rotation.** Your SKILL.md names a preferred type for today's slot. If the first available item doesn't match, scan up to 5 items deep before falling back to the first available one. Never skip more than 5.
5. **Claim it before doing anything else** — see below. Claiming precedes research, not follows it.
6. **Supply guard.** Count available items in your lane's pool *after* claiming. If the NEW pool holds fewer than 10 available items, log `ooligo <lane>: supply low (N items) — refill needed` alongside your normal report. If your lane's pool is empty, log `ooligo <lane>: no eligible item, exiting`, release the lock, and exit cleanly without a commit.

## Claim before you research

A claim is a separate, pushed commit that happens **before** any research, drafting, or web access. It is how concurrent runs avoid authoring the same page twice.

1. Append ` → claimed: <lane-id> <ISO8601>` to the chosen queue line.
2. Stage **only** `content-strategy/topic-queue.md` and commit: `chore(queue): claim <slug> [<lane-id>]`.
3. Push it using the rebase-retry procedure below. **If the push is rejected and the rebase reveals another lane claimed the same line, do not fight for it** — re-read the queue, pick the next available item, and claim that instead.
4. When the page is authored, replace ` → claimed: ...` with ` → slug: <canonical-slug>` in the same commit as the MDX files.

A `→ claimed:` marker older than **6 hours** with no `→ slug:` is stale — the run that made it died. Any lane may take it over; overwrite the timestamp with your own.

If research shows the item is not viable — vendor acquired, shut down, or the spec is otherwise dead — write ` → skip: <reason>` on the line instead, commit it, and take the next item. Recording the skip permanently is what stops the next run from rediscovering the same dead vendor.

> This is not a hypothetical race. `topic-queue.md` already carries two `→ slug:` markers each for `ai-augmented-recruiting-stack`, `ai-sdr-stack`, and `gtm-engineering-stack` — three full 6-locale pages authored twice, at two slots per day, with no concurrency at all. Claiming after authoring is the cause.

## Duplicate check

Authoritative source is the local repo. For the proposed slug:

```bash
# from C:\S\ooligo
ls content/<entity>/en/<slug>.mdx 2>$null   # PowerShell idiom
```

If the file exists, the slug is taken. If you're authoring a new entry, pick a different slug or skip the item. If you're refreshing (a `refresh:` item), the slug existing IS the precondition.

Also grep `canonical_slug` across `content/**/en/*.mdx` — `canonical_slug` must be unique across the entire EN canonical set.

## Research before writing

Research with **WebSearch and WebFetch only**.

For tool entries: vendor's official site, pricing page, docs, recent G2/Capterra reviews for triangulation (not as primary source — see CONTENT_PIPELINE.md §Sources for every numerical claim). Recent earnings or press if applicable.

For comparison entries: both products' docs and pricing pages, recent independent comparisons, customer interviews if you have access via existing notes.

For workflow entries: the artifact's reference implementation (existing claude-skill structure, n8n flow patterns, MCP server scaffolding). The body explains when/how to use; the bundle IS the deliverable.

For learn entries: primary sources for definitions (vendor docs, regulatory text, academic papers when relevant). Cross-check against ≥2 sources before stating a "what this is" claim.

For stacks: the constituent tools' entries on ooligo plus published customer case studies for the named handoffs.

## Write

Follow [evergreen-prompt.md](evergreen-prompt.md) for the per-entity-type checklist and minimum word counts. That file is the authoritative pre-commit bar.

After drafting EN, translate inline into the 5 non-EN locales per [locale-register.md](locale-register.md). Each translation says the same thing as EN — translator-not-author rule.

## Validate

Before staging anything, run from the repo root:

```
npm run validate:config
npm run check:vocab -- content/<entity>/en/<slug>.mdx content/<entity>/es/<slug>.mdx content/<entity>/pt-BR/<slug>.mdx content/<entity>/de/<slug>.mdx content/<entity>/fr/<slug>.mdx content/<entity>/ja/<slug>.mdx
```

Both must pass. If either fails, fix the offending file(s) and re-run. Never commit a failing validation.

**Pass your six files to `check:vocab` explicitly.** A bare `npm run check:vocab` walks the whole tree and reports ~247 pre-existing findings across ~172 legacy files, so it can never exit clean and is useless as a gate. Scoped to your own files it is a hard binary gate — treat any finding on your files as blocking. Legacy findings are not your problem and must not be "fixed" opportunistically in an authoring commit.

**Run the full build before you push**, not after:

```
NODE_OPTIONS=--max-old-space-size=8192 npm run build
```

This is a change from the previous instruction to skip the build and rely on CI. At 10 slots/day, one malformed file discovered by CI *after* the push fails the build for every commit behind it, and the autonomous run that caused it is already gone. The build is the only thing that catches two error classes the validators miss: a bare `<` followed by a digit in prose (MDX reads it as a tag), and `null` in a string-typed frontmatter field. Both are cheap to cause and expensive to find later.

If the build fails on **your** files, fix them. If it fails on a file you did not touch, do not fix it — report it and exit; that is a pre-existing break and chasing it inside an authoring slot is how a run burns its whole session.

## Mark the queue

Edit `content-strategy/topic-queue.md`: append `→ slug: <canonical-slug>` to the line you just authored. Do not reorder or remove items.

## Commit and push

Single commit per slot. Stage exactly:

- The 6 new/updated MDX files
- `content-strategy/topic-queue.md`
- Any artifact bundle files under `apps/web/public/artifacts/<slug>/` (workflows only)

Commit message format:

```
content(<entity>): <slug> — <type>/<vertical>

Locales: en, es, pt-BR, de, fr, ja
```

Examples:

```
content(tools): clay — tool/revops

Locales: en, es, pt-BR, de, fr, ja
```

```
content(workflows): inbound-applicant-triage-n8n — workflow/recruiting

Locales: en, es, pt-BR, de, fr, ja
```

For refreshes, prefix with `refresh:`:

```
refresh(tools): apollo — tool/revops

Locales: en, es, pt-BR, de, fr, ja
```

Include the `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` trailer.

### Pushing

Push to `origin main` directly. No PR. This is autonomous-mode behavior; the user has consented by enabling the scheduled task.

At 10 authoring slots/day plus the maintenance jobs, a bare `git push` will hit non-fast-forward rejections. Use rebase-retry:

```bash
git fetch origin main && git rebase origin/main && git push origin main
```

Retry up to 5 times with a short backoff. If it still fails, **abort the slot**: leave the queue item claimed (it ages out after 6 hours), release the lane lock, and report the failure.

**Never force-push, and never `git rebase --skip` your way past a conflict.** If the rebase conflicts, abort it (`git rebase --abort`) and exit — a later run will redo the work. Losing one page is cheap; corrupting `main` unattended is not.

## Report

One line: which slug was authored, which type/vertical, the commit SHA. Or `ooligo daily: no eligible item, exiting` if the queue was dry.

## What never goes in a published page

- Banned vocabulary from CONTENT_VOICE.md — `npm run check:vocab` enforces.
- Hedging without payload ("comprehensive", "robust", "seamless", "best-in-class" as evidence).
- Padding signals (transition sentences that don't advance the argument, restated headings, bullet lists where prose would be tighter).
- Future-tense roadmap claims ("we plan to add…") — if it's not in the bundle today, it's not in the page.
- Round-number claims with no source ("90% of teams"). Drop the claim or find the real number.
- Watch-outs without a paired guard.

Refer to CONTENT_PIPELINE.md §Anti-patterns to refuse for the full list per entity type.
