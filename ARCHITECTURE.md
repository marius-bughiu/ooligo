# Architecture

Three-axis content space: **(entity type) × (vertical) × (locale)**. The data model is multi-vertical and multi-locale from day 1 — adding a vertical is a config + curated-page exercise, adding a locale is a config + pipeline run.

## Entities

Five core entities. Every entity has a `locale`, `verticals[]` (multi-tag), and a `canonical_slug` so cross-locale variants of the same content are linkable.

| Entity | Path | Purpose |
|---|---|---|
| **Tool** | `content/tools/[locale]/[slug].mdx` | A single AI tool, MCP server, agent, GPT, plugin |
| **Comparison** | `content/comparisons/[locale]/[slug].mdx` | Pairwise (`clay-vs-apollo`) or roundup (`best-ai-dialers`) |
| **Workflow** | `content/workflows/[locale]/[slug].mdx` | Production-ready artifact: prompt pack, Claude Skill, Cursor rule, n8n flow, agent template |
| **Learn** | `content/learn/[locale]/[slug].mdx` | AEO-optimized FAQ / glossary / framework / how-to |
| **Stack** | `content/stacks/[locale]/[slug].mdx` | Curated end-to-end stack for a vertical use case ("the AI-native SDR stack") |

Plus two configuration documents:

- `content/verticals.json` — vertical definitions (RevOps, Legal Ops, Recruiting/TA at launch)
- `content/locales.json` — locale definitions (en, es, pt-BR at launch)

## URL structure

```
ooligo.com/[locale]/[entity-or-vertical-path]
```

### Universal entity paths (locale-prefixed)

```
/en/tools/clay
/en/vs/clay-vs-apollo
/en/vs/best-ai-dialers
/en/workflows/lead-enrichment-clay-claude
/en/learn/what-is-revops
/en/stacks/ai-native-sdr-stack
```

### Vertical track paths

```
/en/r/revops
/en/r/revops/tools           # filtered tools view
/en/r/revops/workflows       # filtered workflows view
/en/r/revops/stacks          # curated stacks for RevOps
/en/r/legal-ops
/en/r/recruiting
```

Vertical pages **remix** the universal catalog — they don't duplicate content. A tool tagged `verticals: [revops, marketing-ops]` appears in both `/r/revops/tools` and `/r/marketing-ops/tools`.

### Locale routing

- `/` → 302 to `/en/` (or geo-detected `/es/`, `/pt-BR/`)
- Every page emits `<link rel="alternate" hreflang="...">` for all sibling locales
- Locale switcher in header, persists in cookie

## Schema (canonical fields per entity)

### Tool

```yaml
---
slug: clay                              # unique within entity type
canonical_slug: clay                    # shared across locales
locale: en                              # one of: en, es, pt-BR
verticals: [revops, marketing-ops]      # multi-tag (must match content/verticals.json)
name: Clay
category: prospecting
subcategories: [data-enrichment, outbound-orchestration]
pricing_model: usage-based              # one of: free, freemium, flat, usage-based, custom
pricing_starts_at: 149                  # USD/mo, or null
pricing_url: https://clay.com/pricing
website: https://clay.com
ai_native: true                         # built AI-first (vs. AI bolted on)
mcp_available: false
api_available: true
integrations: [salesforce, hubspot, apollo]
ooligo_score: 9.2                       # 0-10, our internal scoring
ooligo_score_breakdown:
  ux: 9
  ai_quality: 9
  pricing_value: 8
  integrations: 10
last_updated: 2026-05-02
affiliate_link: https://clay.com?ref=ooligo
---

# (MDX body: overview, pros, cons, alternatives, screenshots, use cases)
```

### Comparison

```yaml
---
slug: clay-vs-apollo
canonical_slug: clay-vs-apollo
locale: en
type: pairwise                          # one of: pairwise, roundup, alternatives
tool_a: clay                            # required for pairwise
tool_b: apollo                          # required for pairwise
tools: [clay, apollo, lemlist]          # required for roundup/alternatives
verticals: [revops, sales]
last_updated: 2026-05-02
---
```

### Workflow

```yaml
---
slug: lead-enrichment-clay-claude
canonical_slug: lead-enrichment-clay-claude
locale: en
verticals: [revops]
artifact_type: claude-skill             # one of: prompt, claude-skill, mcp-server, n8n-flow, cursor-rule, agent-template, sop
tools_used: [clay, claude, hubspot]
roles: [revops, sdr-leader]
difficulty: intermediate                # one of: beginner, intermediate, advanced
time_to_setup: 30min
download_url: /downloads/lead-enrichment-clay-claude.zip
preview_lang: markdown                  # for the inline preview block
human_tested: true                      # workflows must be tested before publishing
---
```

### Learn

```yaml
---
slug: what-is-revops
canonical_slug: what-is-revops
locale: en
type: definition                        # one of: definition, faq, how-to, framework, glossary
verticals: [revops]                     # may be empty for cross-vertical terms
related_tools: [hubspot, salesforce, clay]
related_workflows: [pipeline-forecasting, lead-routing]
target_questions:                       # the AEO queries this page answers
  - "What is RevOps?"
  - "What does a RevOps team do?"
  - "RevOps vs Sales Ops"
last_updated: 2026-05-02
---
```

### Stack

```yaml
---
slug: ai-native-sdr-stack
canonical_slug: ai-native-sdr-stack
locale: en
verticals: [revops, sales]
tools: [clay, apollo, claude, gong, default]
use_case: outbound-sdr-team
difficulty: intermediate
---
```

## JSON-LD / structured data

Every page emits schema.org JSON-LD:

| Page type | Schema type |
|---|---|
| Tool | `SoftwareApplication` + `Review` (with `ooligo_score`) |
| Comparison | `ItemList` of `SoftwareApplication` + custom `Comparison` block |
| Workflow | `HowTo` + `SoftwareSourceCode` if downloadable |
| Learn (definition) | `DefinedTerm` + `FAQPage` if Q&A formatted |
| Learn (how-to) | `HowTo` |
| Stack | `ItemList` of `SoftwareApplication` |

Plus `BreadcrumbList` everywhere.

## Cross-linking rules (enforced by validator)

Every page must link to at least:

- **Tool page** → 3 alternative tools, 1 comparison, 2 workflows that use it, 2 learn entries
- **Comparison page** → both/all tool entries, 1 stack including the tools
- **Workflow page** → all tools used, 2 related workflows, 1 learn entry explaining the use case
- **Learn page** → 2-3 tools, 1-2 workflows, 2-3 sibling learn entries
- **Stack page** → all tools, 3+ workflows, 2+ learn entries

Validator runs in CI; PRs failing the link budget are blocked.

## Translation lineage

Every non-`en` content file is generated from its `en` sibling and tagged:

```yaml
translated_from: en/clay.mdx
translated_at: 2026-05-15T12:00:00Z
translation_model: claude-sonnet-4-6
```

When the canonical English version is updated, a CI workflow auto-regenerates the translations and opens a PR. See [CONTENT_PIPELINE.md](./CONTENT_PIPELINE.md).

## Vertical config schema

```yaml
# content/verticals.json
{
  "verticals": [
    {
      "id": "revops",
      "slug": "revops",
      "names": {
        "en": "RevOps",
        "es": "RevOps",
        "pt-BR": "RevOps"
      },
      "tagline": {
        "en": "Revenue operations leaders building the AI-native go-to-market machine",
        "es": "Líderes de RevOps que están construyendo el motor de ingresos potenciado por IA",
        "pt-BR": "Líderes de RevOps construindo a operação de receita com IA no centro"
      },
      "icp": "RevOps leaders, ops managers, GTM engineers at $5-50M ARR B2B SaaS",
      "starter_tools": ["hubspot", "salesforce", "clay", "apollo", "outreach", "gong", "claude"],
      "newsletter_id": "revops-en",
      "launch_phase": 1
    }
  ]
}
```

## Locale config schema

```yaml
# content/locales.json
{
  "default_locale": "en",
  "locales": [
    {
      "code": "en",
      "name": "English",
      "hreflang": "en",
      "rtl": false,
      "is_canonical": true,
      "launch_phase": 1
    },
    {
      "code": "es",
      "name": "Español",
      "hreflang": "es",
      "rtl": false,
      "is_canonical": false,
      "translated_from": "en",
      "launch_phase": 2
    },
    {
      "code": "pt-BR",
      "name": "Português (Brasil)",
      "hreflang": "pt-BR",
      "rtl": false,
      "is_canonical": false,
      "translated_from": "en",
      "launch_phase": 2
    }
  ]
}
```

## Adding a new vertical (post-launch)

1. Add entry to `content/verticals.json`
2. Tag existing tools/comparisons/workflows/learn entries that apply (PR with mass updates)
3. Author 5-10 vertical-specific stack pages, 10-20 vertical-specific workflows, 20-30 vertical-specific learn entries
4. Generate vertical landing page from config + tagged content
5. Translate to all active locales
6. Optionally launch a vertical newsletter

End-to-end timeline: ~2 weeks.

## Adding a new locale (post-launch)

1. Add entry to `content/locales.json`
2. Run translation pipeline against entire `content/` tree
3. Validate hreflang clusters
4. Set up Search Console property
5. Optionally launch locale-native newsletter for flagship vertical first

End-to-end timeline: ~1 week.
