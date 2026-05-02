# Content Pipeline

Content on ooligo is authored directly by LLMs (Claude, primarily) operating on this repo. There is no separate content-generator service, no scheduled CI job that synthesizes pages, and no human-review gate. An LLM authors a page; validators check it; CI builds and deploys it.

This document is the contract that any LLM working on this repo follows when adding or updating content.

## The rule

> **Whenever an LLM adds a page to the site, it adds the localized versions in the same change.**

Concretely: a new tool entry means three files — `tools/en/<slug>.mdx`, `tools/es/<slug>.mdx`, `tools/pt-BR/<slug>.mdx`. A new comparison, workflow, or learn entry: same per-locale subdirectory layout. EN is canonical (authored first), ES and PT-BR are translated from it during the same authoring session.

The same rule applies to updates. Editing the EN entry without re-translating the ES and PT-BR siblings produces drift between locales — don't.

## Authoring model

```
LLM session (Claude Code, claude.ai with repo MCP, etc.)
  │
  ├─ Reads sources (official docs, pricing pages, public APIs, Reddit/HN signal)
  ├─ Writes content/<entity>/<slug>.en.mdx
  ├─ Writes content/<entity>/<slug>.es.mdx     (translated from EN)
  ├─ Writes content/<entity>/<slug>.pt-BR.mdx  (translated from EN)
  ├─ Commits the trio together
  └─ Pushes
       │
       ▼
  CI: validate config + typecheck + Astro build
       │
       ▼
  CI: deploy to Cloudflare Pages
```

The authoring LLM is responsible for getting the content right. The validators catch structural mistakes (schema violations, broken links, mismatched frontmatter) but they don't substitute for editorial judgment.

## Frontmatter discipline

Every entity file has frontmatter validated against the JSON Schema in `content/.schema/`. Mirror schemas live in Astro content collections in `apps/web/src/content.config.ts` so the build fails fast on drift.

Required fields on every page:

- `slug` (must match filename)
- `canonical_slug` (shared across locale variants — this is how hreflang clusters are computed)
- `locale` (one of `en`, `es`, `pt-BR`)
- `verticals` (array of vertical IDs from `content/verticals.json`)
- `ai_generated: true` (always — this is an AI-authored site, transparently labeled in metadata)

For non-`en` locale variants, also set:

- `ai_translated: true`
- `translated_from: <source-filename>` (e.g. `clay.en.mdx`)
- `translated_at: <ISO timestamp>`
- `translation_model: <model-id>` (e.g. `claude-opus-4-7`)

These five fields make the translation lineage queryable — you can ask "which pages were translated by which model on which date" without scraping.

## Translation glossary

When translating EN → ES or EN → PT-BR, follow this glossary:

### Never translate (proper nouns + industry English)

```
Clay, Apollo, HubSpot, Salesforce, Claude, GPT, Cursor, n8n, MCP,
Anthropic, OpenAI, Google, Microsoft, GitHub, Slack, Zapier, Outreach,
Salesloft, Gong, Chorus, Default, ZoomInfo, Apollo, Lemlist, Smartlead,
Instantly, Lusha, RegieAI, Common Room, Pavilion, Gainsight, Reforge,
Maven, MasterClass, AppSumo, Levels.fyi, Wirecutter,

RevOps, GTM, ICP, TCV, ARR, MRR, NRR, GRR, SDR, BDR, AE, CSM, TA, RAG,
LLM, API, SaaS, CRM, MCP, RPA, ETL, ELT, BI, KPI, OKR, NPS, CSAT, QBR,

ooligo
```

### Fixed translations (industry English stays English)

```
lead       → lead         (es, pt-BR)
pipeline   → pipeline     (es, pt-BR)
outbound   → outbound     (es, pt-BR)
inbound    → inbound      (es, pt-BR)
stack      → stack        (es, pt-BR)
workflow   → workflow     (es, pt-BR)
prompt     → prompt       (es, pt-BR)
agent      → agente / agente
skill      → skill        (es, pt-BR — when referring to Claude Skills specifically)
```

### Regional register

- **`es`** — neutral LATAM Spanish. Avoid distinctly Iberian (e.g. "vosotros") or rioplatense ("vos") forms. Default to "tú" with professional register. The audience is B2B operators across Mexico, Colombia, Argentina, Chile, Peru, Spain (when reading neutral Spanish).
- **`pt-BR`** — Brazilian Portuguese, not European. Use "você", colloquial-but-professional B2B register. Anglicisms are normal in tech/B2B Brazilian Portuguese — don't fight them.

## Quality bar (the LLM's responsibility)

The authoring LLM is on the hook for:

1. **Factual accuracy** — pricing, integrations, capabilities. If the LLM isn't sure, it says so or omits the claim. Never invent integrations or pricing tiers.
2. **Currency** — `last_reviewed` date matches when sources were actually checked. Don't backdate.
3. **Cross-linking** — every entity links to related entities per ARCHITECTURE.md's link-budget rules. Validators check structural existence; the LLM checks relevance.
4. **Voice consistency** — confident, opinionated, structured. We rank, we recommend, we say what's bad. We don't G2-hedge.
5. **Translation parity** — ES and PT-BR variants say the same things as EN. Translate; don't re-author with different opinions.

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

Those are the LLM author's job.

## Refresh cadence

When a tool's pricing/features change, an LLM session refreshes the entry — including all locale variants. Refresh triggers (typical):

- A user mentions a tool's pricing changed
- A scheduled "weekly refresh" Claude Code session checks the top 50 tools
- A reader opens a GitHub issue with corrections

Refresh = re-author from current sources. Bump `last_reviewed`. Re-translate both locale variants. Open one PR with all three files updated. CI gates ensure no schema or link regression.

## Adding a vertical or locale

- **Adding a vertical** — config update in `content/verticals.json` + tagging existing entries with the new vertical (multi-tag) + a few vertical-specific stack/workflow pages. See ARCHITECTURE.md.
- **Adding a locale** — config update in `content/locales.json` + an LLM session translates the entire `content/` tree to the new locale. See ARCHITECTURE.md.

Both are config + bulk authoring tasks; no separate tooling required.

## Why no automated generator

Earlier drafts of this doc described a generator pipeline (TypeScript scripts using the Anthropic SDK, structured outputs, back-translation similarity gates, auto-PR bots). That model adds layers of indirection without improving quality, and decouples content authorship from review of source signal.

A Claude session reading the source URLs, considering the audience, writing the entry, and translating it in one pass produces better content than a script with a single canned prompt. The repo is the unit of versioning; the LLM is the unit of authoring.

If we ever need scheduled refresh at scale beyond what manual sessions handle, that's a Claude Code cron, not a custom generator.
