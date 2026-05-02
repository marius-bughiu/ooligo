# Content Pipeline

Every page on ooligo is AI-generated and (for non-English locales) AI-translated. **No human review** is in the critical path. This document defines the gates that make that workable: prompts, structured outputs, validators, automated QA, and the transparency contract with readers.

## Principles

1. **Canonical English source of truth.** All content originates in English from canonical inputs. Locale variants are translated, never independently authored.
2. **Structured outputs only.** Every generation step uses JSON-mode / structured outputs against a schema. No free-form blob → page.
3. **Validators are the review.** Schema validation, link-budget enforcement, broken-link checks, schema.org validity, and back-translation similarity are gates. PRs that fail any gate don't merge.
4. **Refresh, not regenerate.** Tool entries refresh from source weekly; content never goes stale silently.
5. **Machine-readable transparency.** Every page declares `ai_generated: true` and (where applicable) `ai_translated: true` in frontmatter, surfaced via JSON-LD/meta tags. No visible disclaimer in the page chrome — readers shouldn't have to wade through a notice on every page; the metadata is there for crawlers, AI assistants, and anyone who looks.

## The pipeline

```
                ┌────────────────────────────────────────────┐
                │   Sources (per entity type)                │
                │   ─ Official tool docs / sitemaps          │
                │   ─ Public APIs (G2, Capterra, ProductHunt)│
                │   ─ Reddit / HN / Twitter mentions         │
                │   ─ Github (for OSS tools / agents / MCPs) │
                │   ─ Pricing pages, integration pages       │
                └────────────────┬───────────────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────────────┐
                │   Generator (Claude, structured outputs)   │
                │   Prompt + Schema + Source bundle          │
                └────────────────┬───────────────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────────────┐
                │   MDX writer → content/[type]/[slug].en.mdx│
                └────────────────┬───────────────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────────────┐
                │   Validators                               │
                │   ─ JSON Schema (frontmatter)              │
                │   ─ Link-budget rules                      │
                │   ─ Schema.org JSON-LD validity            │
                │   ─ Internal link integrity                │
                │   ─ External link reachability (sample)    │
                └────────────────┬───────────────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────────────┐
                │   Translator (Claude per non-en locale)    │
                │   ─ Structured output                      │
                │   ─ Glossary enforcement                   │
                │   ─ Domain-term protection                 │
                └────────────────┬───────────────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────────────┐
                │   QA gates                                 │
                │   ─ Back-translation similarity ≥ 0.85     │
                │   ─ Frontmatter parity                     │
                │   ─ Cross-locale link integrity            │
                └────────────────┬───────────────────────────┘
                                 │
                                 ▼
                ┌────────────────────────────────────────────┐
                │   Auto-PR opened by bot                    │
                │   ─ CI re-runs all validators              │
                │   ─ Auto-merge if green                    │
                │   ─ Stays open if any gate fails           │
                └────────────────────────────────────────────┘
```

## Generators

One generator per entity type. Each lives in `packages/pipeline/src/generators/`:

- `tool.ts` — given a tool URL + slug, fetches official docs/pricing/integrations and emits a complete tool MDX
- `comparison.ts` — given two tool slugs, reads both tool MDX entries and emits a structured comparison
- `workflow.ts` — given a use case + tool stack, drafts the workflow doc and (optionally) the artifact (Skill, n8n flow, Cursor rule)
- `learn.ts` — given a target question or term, drafts an AEO-optimized definition/how-to/framework
- `stack.ts` — given a vertical + use case, assembles a curated multi-tool stack from the catalog

Each generator returns:

```ts
{
  frontmatter: ToolFrontmatter,   // typed against JSON Schema
  body: string,                    // MDX body
  sources: SourceRef[],            // citations for refresh tracking
  generated_at: ISODateString,
  model: string                    // e.g. "claude-sonnet-4-6"
}
```

## Translator

`packages/pipeline/src/translators/translate.ts`. Single entry point used for every non-`en` locale.

### Inputs

- Source MDX file (canonical, locale `en`)
- Target locale code (`es`, `pt-BR`, ...)
- Glossary for the target locale (`packages/pipeline/glossaries/[locale].json`)

### Glossary (critical for AI-only translation quality)

A locked term map. Some terms are **never translated** (proper nouns: Clay, Apollo, HubSpot, Salesforce, Claude). Some have **fixed translations** (e.g., "lead" → "lead" in es, never "pista"; "pipeline" → "pipeline" in pt-BR, never "tubulação"). Industry jargon stays English where the target-language industry uses English.

Glossary file:

```json
{
  "do_not_translate": [
    "Clay", "Apollo", "HubSpot", "Salesforce", "Claude", "GPT",
    "Cursor", "n8n", "MCP", "RevOps", "TA", "SDR", "BDR",
    "AE", "CSM", "ICP", "TCV", "ARR", "MRR", "RAG", "API",
    "ooligo"
  ],
  "fixed_translations": {
    "lead": "lead",
    "pipeline": "pipeline",
    "outbound": "outbound",
    "stack": "stack",
    "workflow": "workflow"
  },
  "preferred_register": "professional",
  "regional_notes": "Use rioplatense Spanish only when context demands; default to neutral LATAM Spanish."
}
```

### Translation prompt structure

```
You are translating professional B2B operations content from English to {target_locale}.

Hard rules:
1. Preserve all MDX syntax exactly (frontmatter, components, code blocks).
2. Do not translate any term in the do_not_translate list: [...]
3. Use the fixed_translations map exactly: {...}
4. Translate the body, but only update frontmatter fields explicitly listed: name (only if it's a description, not a brand), tagline, body text fields.
5. Set frontmatter: ai_translated: true, translated_from: [source_path], translated_at: [now], translation_model: [model_id]
6. Maintain heading structure, list structure, and link targets.
7. Localize examples (currency, names) only when the example would be culturally jarring; otherwise leave intact.
8. Output only the resulting MDX file content. No commentary.

Source MDX:
{source_mdx}

Glossary:
{glossary_json}
```

Run with `temperature: 0.2` and structured-output validation against the same JSON Schema as the source.

## Automated QA gates

All gates run in CI. Any failure blocks merge.

### 1. Schema validation

Every MDX file's frontmatter is validated against `content/.schema/[entity].schema.json`.

### 2. Link-budget validation

Per ARCHITECTURE.md cross-linking rules. Implemented as an Astro content collection lint script.

### 3. Schema.org JSON-LD validity

After build, every page's JSON-LD is validated against schema.org definitions. Use `schema-dts` for typing + a runtime validator.

### 4. Internal link integrity

Every internal link must resolve. Broken internal link = build fail.

### 5. External link reachability (sample)

10% sample of external links are HEAD-checked weekly. Persistent 4xx/5xx flags the tool entry for refresh.

### 6. Back-translation similarity (translation gate)

For each `[locale]` translation:

```
en_source → translate(target=es) → es_translation → translate(target=en) → en_back

similarity(en_source, en_back) ≥ 0.85   # cosine similarity over embeddings
```

Below threshold → gate fails, PR opens with a `translation-quality` label, page does not deploy until re-run produces a passing translation. (Up to 3 auto-retries with adjusted temperature/prompt before the page is held.)

Embeddings model: same provider as inference (Anthropic embeddings or OpenAI `text-embedding-3-large`).

### 7. Frontmatter parity

Translated files must have identical frontmatter structure to source, with only translation-marker fields differing (`locale`, `ai_translated`, `translated_from`, `translated_at`, `translation_model`).

### 8. Cross-locale link integrity

Every internal link in a translated file must resolve in the target locale (i.e. `/es/tools/clay` must exist if `/en/tools/clay` is linked from `clay.es.mdx`). Translations of pages that link to not-yet-translated pages stay queued until siblings translate.

### 9. Toxicity / safety check

Every generated page passes a content-safety classifier (Anthropic moderation endpoint or equivalent). Failure flags for human review (the only manual gate, and only on flagged content).

## Transparency

Every page declares its provenance via frontmatter (`ai_generated`, `ai_translated`, `translated_from`, `translated_at`, `translation_model`, `last_refreshed`) which is surfaced to crawlers and AI assistants via JSON-LD and meta tags. There is no visible footer disclaimer — readers don't need it on every page, and the source-of-truth MDX in this repo is openly browsable on GitHub.

If a reader wants to verify or correct a page, the source file's GitHub URL is part of every page's machine-readable metadata.

## Refresh cadence

| Entity | Refresh trigger | Cadence |
|---|---|---|
| Tool | Pricing-page or feature-page change detected; or stale > 30d | Weekly cron |
| Comparison | Either tool's entry refreshed → comparison flagged for refresh | Weekly cron |
| Workflow | Quarterly review or tool-API breakage | Quarterly + on integration break |
| Learn | Quarterly review or referenced tool refreshed | Quarterly |
| Stack | Quarterly review | Quarterly |

Refresh = generator runs again, output diffed against existing file, PR opened only if material change.

## Cost ceiling

The pipeline has a monthly inference budget cap (configurable env var). Once 80% of cap is hit, refresh frequency degrades from weekly to monthly automatically. This protects against runaway costs from a misbehaving generator.

## What can go wrong (and how we catch it)

| Failure mode | Detection | Remediation |
|---|---|---|
| Generator hallucinates pricing/features | Source-citation check; refresh diff vs. live page | Auto-retry with stricter prompt; page held until pass |
| Translation drifts meaning | Back-translation similarity gate | Auto-retry; if 3 fails, page held |
| Glossary violation (translated brand name) | Regex check post-translation | Auto-retry with explicit glossary inline |
| Stale tool (pricing changed, sunset, acquired) | Weekly external-link + sample-page diff | Tool entry flagged; refresh runs |
| Schema.org JSON-LD malformed | Schema validator in CI | Build fails |
| Cross-locale link broken | Cross-locale integrity check | PR held until sibling translation lands |
| Inference cost spike | Budget monitor on Anthropic dashboard + worker-side counter | Auto-degrade refresh frequency |

## Why this works without human review

The bet: in 2026, **structured AI outputs + tight schemas + automated QA gates + transparent labeling** produces content that is good enough for professional ops audiences and survives Google's spam updates, *for the entity types we cover*. We're not generating opinion pieces or YMYL content — we're generating structured comparisons, factual tool data, and procedural workflow documentation. AI handles those formats well.

If a vertical we add later starts to require judgment beyond what gates catch (e.g., legal advice, medical info), we either pull that content type or add a human review gate for it. We will not relax safety to expand scope.
