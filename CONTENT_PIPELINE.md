# Content Pipeline

Content on ooligo is authored directly by LLMs (Claude, primarily) operating on this repo. There is no separate content-generator service, no scheduled CI job that synthesizes pages, and no human-review gate. An LLM authors a page; validators check it; CI builds and deploys it.

This document is the contract that any LLM working on this repo follows when adding or updating content. **Authoring is EN-only.** Translation is a separate, autonomous job — see "Translation queue and skills" below.

## The rule

> **When an LLM adds or edits a page, it writes EN only.**

Concretely: a new tool entry means one file — `tools/en/<slug>.mdx`. A new comparison, workflow, or learn entry: same per-locale subdirectory layout, EN only. The ES and pt-BR variants are produced separately by `/translate-es` and `/translate-pt-br`, which read `<locale>_TRANSLATION_QUEUE.md` and drain it one page at a time.

The same rule applies to updates. Editing the EN entry changes its body's SHA-256, which the queue script picks up as `stale` for every non-canonical locale on the next run.

## Authoring model

```
LLM session (Claude Code, claude.ai with repo MCP, etc.)
  │
  ├─ Reads sources (official docs, pricing pages, public APIs, Reddit/HN signal)
  ├─ Writes content/<entity>/en/<slug>.mdx
  ├─ Commits the EN file
  └─ Pushes
       │
       ▼
  CI: validate config + typecheck + Astro build
       │
       ▼
  CI: deploy to Cloudflare Pages
       │
       ▼
  Later (separate sessions):
    /translate-es      drains es_TRANSLATION_QUEUE.md one page at a time
    /translate-pt-br   drains pt-BR_TRANSLATION_QUEUE.md one page at a time
```

The authoring LLM is responsible for getting the EN content right. The validators catch structural mistakes (schema violations, broken links, mismatched frontmatter) but they don't substitute for editorial judgment.

## Frontmatter discipline

Every entity file has frontmatter validated against the JSON Schema in `content/.schema/`. Mirror schemas live in Astro content collections in `apps/web/src/content.config.ts` so the build fails fast on drift.

Required fields on every EN page:

- `slug` (must match filename)
- `canonical_slug` (shared across locale variants — this is how hreflang clusters are computed)
- `locale: en`
- `verticals` (array of vertical IDs from `content/verticals.json`)
- `ai_generated: true` (always — this is an AI-authored site, transparently labeled in metadata)

Translation-specific frontmatter (`ai_translated`, `translated_from`, `translated_at`, `translation_model`, `source_sha256`) is the responsibility of the translation skills — see `.claude/skills/translate-<locale>/SKILL.md`.

## Translation queue and skills

Translation parity is enforced by tooling, not authoring discipline:

- **`npm run queue:translations`** — scans every collection × non-canonical locale and writes `es_TRANSLATION_QUEUE.md` and `pt-BR_TRANSLATION_QUEUE.md` at the repo root. An item appears as `missing` if no translated file exists, or `stale` if the SHA-256 of the EN body no longer matches the `source_sha256` stored on the translated file's frontmatter.
- **`npm run hash:en -- <path>`** — prints the SHA-256 of an EN file's body. The translation skills use this to compute the value for `source_sha256` when writing a translated file.
- **`/translate-es` and `/translate-pt-br`** — project-scoped skills under `.claude/skills/`. Each invocation translates the next item in the queue, validates the build, regenerates the queue, and commits + pushes to `main`. Translation glossary (never-translate proper nouns, fixed industry terms) and regional register live in those skill bodies, not here.

## Quality bar (the LLM author's responsibility)

The authoring LLM is on the hook for:

1. **Factual accuracy** — pricing, integrations, capabilities. If the LLM isn't sure, it says so or omits the claim. Never invent integrations or pricing tiers.
2. **Currency** — `last_reviewed` date matches when sources were actually checked. Don't backdate.
3. **Cross-linking** — every entity links to related entities per ARCHITECTURE.md's link-budget rules. Validators check structural existence; the LLM checks relevance.
4. **Voice consistency** — confident, opinionated, structured. We rank, we recommend, we say what's bad. We don't G2-hedge.

The translating LLM (per the per-locale skills) is on the hook for translation parity — the ES/pt-BR variants must say the same things as EN. That's enforced in the skill bodies.

## What the validators actually catch

In CI (`npm run validate:config` and `npm run build`):

- **Frontmatter schema** — every file's frontmatter is validated against its JSON Schema. Missing required fields, invalid enums, malformed types → build fails.
- **Content collection schema** — Astro re-validates the same shape via Zod schemas in `content.config.ts`. Two checks for the price of one.
- **Link integrity** — internal links that resolve to no page break the build (Astro raises on broken `<a href>` to a non-existent route).
- **hreflang correctness** — `BaseLayout` only emits hreflang for locale variants that actually exist (computed from `canonical_slug` matches in the collection). Never points at 404s.
- **Markup validity** — JSON-LD blocks must parse as JSON. Astro's MDX compiler enforces.

Validators do **not** check:
- Whether the content is true
- Whether the translation captures the original meaning
- Whether the recommendation is sound

Those are the LLM author's (and translator's) job.

## Refresh cadence

When a tool's pricing/features change, an LLM session refreshes the EN entry. Bump `last_reviewed`. Refresh triggers (typical):

- A user mentions a tool's pricing changed
- A scheduled "weekly refresh" Claude Code session checks the top 50 tools
- A reader opens a GitHub issue with corrections

Refresh = re-author the EN file from current sources. The next run of `npm run queue:translations` will mark every non-canonical locale variant as `stale` (because the EN body's SHA-256 changed), and subsequent `/translate-<locale>` invocations will re-translate them.

## Adding a vertical or locale

- **Adding a vertical** — config update in `content/verticals.json` + tagging existing entries with the new vertical (multi-tag) + a few vertical-specific stack/workflow pages. See ARCHITECTURE.md.
- **Adding a locale** — three steps:
  1. Add the locale entry to `content/locales.json`.
  2. Create `.claude/skills/translate-<locale>/SKILL.md` (clone an existing one and adjust the regional register section).
  3. Run `npm run queue:translations` — every EN entry will appear as `missing` for the new locale. Then drain the queue with repeated `/translate-<locale>` invocations until empty.

## Why no automated generator

Earlier drafts of this doc described a generator pipeline (TypeScript scripts using the Anthropic SDK, structured outputs, back-translation similarity gates, auto-PR bots). That model adds layers of indirection without improving quality, and decouples content authorship from review of source signal.

A Claude session reading the source URLs, considering the audience, writing the entry, and (separately) translating it produces better content than a script with a single canned prompt. The repo is the unit of versioning; the LLM is the unit of authoring.

What we have instead: a script that finds gaps (`queue:translations`) and a skill that fills them (`/translate-<locale>`), both run inside Claude sessions on the repo. That gives us automation where it's mechanical (gap detection, hash bookkeeping) without taking the author out of the loop on content judgment.
