# content-strategy

Operational playbooks for the autonomous routines that author and maintain ooligo. Every scheduled task under `~/.claude/scheduled-tasks/ooligo-*/SKILL.md` is a thin shell that points to one of the prompt files here. Edits to these prompts are how you change the routines' behavior — the SKILL.md shells stay thin.

## Files

**Routines (read at run time):**

- [daily-prompt.md](daily-prompt.md) — shared rules every authoring slot inherits (paths, multi-locale rule, validation, commit/push)
- [evergreen-prompt.md](evergreen-prompt.md) — per-entity-type authoring procedures (tool, comparison, workflow, learn, stack)
- [topic-refill-prompt.md](topic-refill-prompt.md) — weekly gap-discovery, fills `topic-queue.md`
- [freshness-prompt.md](freshness-prompt.md) — weekly SLA sweep, prepends `refresh:` items to the queue
- [link-rot-prompt.md](link-rot-prompt.md) — weekly external-link check across all locales
- [internal-link-prompt.md](internal-link-prompt.md) — weekly internal cross-link audit
- [gsc-harvest-prompt.md](gsc-harvest-prompt.md) — weekly GSC page-2 candidate harvest
- [monthly-retro-prompt.md](monthly-retro-prompt.md) — 1st-Monday traffic retro into `TRAFFIC_RETRO.md`
- [roadmap-reflect-prompt.md](roadmap-reflect-prompt.md) — quarterly ROADMAP.md drift report into `ROADMAP_DRIFT.md`
- [corrections-review-prompt.md](corrections-review-prompt.md) — quarterly CORRECTIONS.md bucketing

**Reference (read by the routines):**

- [locale-register.md](locale-register.md) — register, glossary, and never-translate rules for the five non-EN locales

**State (written by the routines):**

- [topic-queue.md](topic-queue.md) — pending content queue (consumed by daily authoring slots)
- [gsc-candidates.json](gsc-candidates.json) — GSC harvest output (consumed by freshness sweep)
- [pillar-index.json](pillar-index.json) — per-vertical entity counts (consumed by monthly retro)
- [link-rot.log](link-rot.log) — append-only log of external-link failures

## How the routines fit together

```
weekly:                          weekly:                       daily:
gsc-harvest  ─┐                  topic-refill  ──────────────► topic-queue.md ──► author-am
              │                       ▲                              │            author-pm
              ▼                       │                              │              │
gsc-candidates.json ───► freshness ───┘                              │              ▼
                          │                                          │       content/<type>/<locale>/<slug>.mdx
                          └─► topic-queue.md (refresh: items)        │              │
                                                                     │              ▼
weekly:                                                              │       all 6 locales committed
link-rot     ───► link-rot.log + GitHub issues if 3x fail            │       in a single push
internal-link ──► auto-insertions across all 6 locales               │
evergreen-refresh ──► re-authors next refresh: item, all 6 locales ──┘

monthly (1st Mon):                  quarterly (1st Mar/Jun/Sep/Dec):
monthly-retro ─► TRAFFIC_RETRO.md   roadmap-reflect ─► ROADMAP_DRIFT.md
                                    corrections-review ─► PR amending pipeline docs
```

## The contract every authoring routine respects

1. **Multi-locale or nothing.** A new page is 6 MDX files (en, es, pt-BR, de, fr, ja) committed together. If any locale fails validation, abort the whole slot — leave the queue item unconsumed for the next run.
2. **EN-first authoring; locale-register-driven translation.** The session drafts the EN body, then translates inline per [locale-register.md](locale-register.md). No queues, no SHA bookkeeping.
3. **Per-type bar from [CONTENT_PIPELINE.md](../CONTENT_PIPELINE.md).** The pre-commit checklists and per-type quality bars are the contract; this directory's prompts operationalize them rather than restate them.
4. **Voice from [CONTENT_VOICE.md](../CONTENT_VOICE.md).** `npm run check:vocab` is the mechanical gate; the prompts assume voice rules are read and applied.
5. **Push direct to main.** No PRs from routine commits. Routines push to `origin main` after validation passes.
6. **No half-finished pages.** If a routine can't author the full bundle at the per-type bar, it exits cleanly and logs the reason. Thin pages are worse than no pages.

## How to change a routine's behavior

Edit the relevant prompt file in this directory, commit, push. The next scheduled run picks up the new prompt automatically — the SKILL.md shells under `~/.claude/scheduled-tasks/` are thin pointers and rarely need to change.

If you need to change the schedule (cron expression) or a scheduled task's identity, edit that SKILL.md instead.
