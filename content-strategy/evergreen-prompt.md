# Evergreen authoring — per-entity-type procedures

Wraps the per-type quality bars and pre-commit checklists in [../CONTENT_PIPELINE.md](../CONTENT_PIPELINE.md). This file restates them as a runnable procedure; the contract itself lives in CONTENT_PIPELINE.md. When the contract changes, change it there.

Always read [daily-prompt.md](daily-prompt.md) for the shared discipline (multi-locale rule, validation, commit/push) before applying any of these.

## Step 0 — Identify the entity type and frontmatter shape

From the queue item's `[type:...]` tag, pick the schema. Frontmatter shapes are defined in [apps/web/src/content.config.ts](../apps/web/src/content.config.ts). Required fields per type are summarized below; consult the schema for the full list.

### tools

```yaml
slug: <slug>
canonical_slug: <slug>
locale: en   # or es, pt-BR, de, fr, ja
verticals: [revops]   # or [legal-ops], [recruiting], [revops, legal-ops] for cross
name: "<Product Name>"
category: <kebab-case-category>
subcategories: [<kebab>, <kebab>]
pricing_model: freemium   # one of: free, freemium, flat, usage-based, custom
pricing_starts_at: 20   # number in USD per seat/mo, or null, or omit
pricing_url: https://...
website: https://...
ai_native: true
mcp_available: true   # optional
api_available: true   # optional
integrations: [<slug>, <slug>]   # other tool slugs
ooligo_score: 8.5   # 0-10
ooligo_score_breakdown:
  ux: 8
  ai_quality: 9
  pricing_value: 8
  integrations: 9
last_updated: "YYYY-MM-DD"   # today
affiliate_link: https://...   # optional; triggers inline disclosure obligation
```

### comparisons

```yaml
slug: <a>-vs-<b>   # for pairwise; or <slug-of-roundup-topic>
canonical_slug: <same>
locale: en
type: pairwise   # one of: pairwise, roundup, alternatives
tool_a: <slug>   # required for pairwise
tool_b: <slug>   # required for pairwise
tools: [<slug>, <slug>, <slug>]   # required for roundup/alternatives (>=2)
verticals: [revops]
last_updated: "YYYY-MM-DD"
```

### workflows

```yaml
slug: <slug>
canonical_slug: <slug>
locale: en
verticals: [revops]
title: "<Action verb + object>"
artifact_type: claude-skill   # one of: prompt, claude-skill, mcp-server, n8n-flow, cursor-rule, agent-template, sop
tools_used: [<slug>, <slug>]
roles: [<slug>]   # e.g. [sdr], [revops-leader], [legal-ops-manager]
difficulty: intermediate   # one of: beginner, intermediate, advanced
time_to_setup: "30-60 min"
download_url: /artifacts/<slug>/bundle.zip   # optional
human_tested: false   # mark true only if you actually ran it
```

### learn

```yaml
slug: <slug>
canonical_slug: <slug>
locale: en
type: definition   # one of: definition, faq, how-to, framework, glossary
title: "<Title>"
verticals: [revops]   # optional
related_tools: [<slug>]   # optional
related_workflows: [<slug>]   # optional
target_questions:
  - "what is <X>?"
  - "how does <X> work?"
last_updated: "YYYY-MM-DD"
```

### stacks

```yaml
slug: <slug>
canonical_slug: <slug>
locale: en
verticals: [revops]
title: "<Stack name>"
tools: [<slug>, <slug>, <slug>]   # >=2
use_case: "<one-line scope>"
difficulty: intermediate
related_workflows: [<slug>]   # optional
```

## Step 1 — Draft the EN body per the per-type bar

Each entity type has a body shape, a word-count floor, and a pre-commit checklist in CONTENT_PIPELINE.md. Summary table; consult the full doc for anti-patterns and concrete signals.

| Entity type | Floor | Typical authoritative depth | CONTENT_PIPELINE.md section |
|---|---|---|---|
| tool | 400 | 500-800 | §Tools |
| comparison (pairwise) | 600 | 700-1100 | §Comparisons |
| comparison (roundup) | 700 | 900-1500 | §Comparisons |
| comparison (alternatives) | 700 | 900-1400 | §Comparisons |
| workflow | 800 | 800-1500 + artifact bundle | §Workflows + §Per-artifact-type minimum bundle |
| learn (definition) | 600 | 700-1200 | §Learn → Definition |
| learn (faq) | 400 | 500-900 | §Learn → FAQ |
| learn (how-to) | 800 | 1000-1800 | §Learn → How-to |
| learn (framework) | 800 | 900-1500 | §Learn → Framework |
| learn (glossary) | 200 | 300-500 | §Learn → Glossary |
| stack | 700 | 900-1500 | §Stacks |

## Step 2 — Pre-commit checklist (per type)

Run through this against the EN draft. If any unchecked box has no documented exemption, the draft goes back. **The same boxes apply to every translated locale** (translations must preserve every load-bearing element from EN).

### tool

- [ ] Body ≥ 400 words (typical: 500-800)
- [ ] Names ≥ 1 specific scoped use case
- [ ] Real-world price band, not just MSRP
- [ ] Names ≥ 1 alternative + the rule for picking it instead; alternatives include the top 2 by market share AND the fastest-growing entrant in the segment
- [ ] Explicit "best for…" line — role + use case
- [ ] ≥ 2 watch-outs each paired with a specific guard
- [ ] If `affiliate_link` set: inline disclosure included, independence-test answer in commit message
- [ ] `last_updated` matches sources actually checked today

### comparison

- [ ] Body ≥ 600 (pairwise) / ≥ 700 (roundup/alternatives)
- [ ] Each option wins at something specific
- [ ] Pricing comparison is quantified (ratio, band, or per-unit)
- [ ] Has Verdict / Pick X when… / Match rules section
- [ ] "The pick" discipline: names a single default when reader can't decide
- [ ] Names what to do if neither/none fit
- [ ] No "it depends" hedge without immediately naming what it depends on
- [ ] `last_updated` matches sources actually re-checked today

### workflow

- [ ] Body ≥ 800 words
- [ ] Has explicit "when not to use" content
- [ ] Cost / throughput / budget numbers, not adjectives
- [ ] ≥ 3 specific failure modes, each paired with a guard
- [ ] References the artifact bundle's file paths in the body
- [ ] Artifact bundle exists at `apps/web/public/artifacts/<slug>/` meeting the per-type minimum (CONTENT_PIPELINE.md §Per-artifact-type minimum bundle)
- [ ] Compares against ≥ 1 specific alternative (DIY, status quo, named off-the-shelf)
- [ ] Every numerical claim has a source bucket (see CONTENT_PIPELINE.md §Sources)

### learn

- [ ] Meets the per-type floor (definition 600, faq 400, how-to 800, framework 800, glossary 200)
- [ ] First paragraph directly answers the primary `target_questions` entry — AEO snippet-worthy
- [ ] For definition: explicit "what it is NOT" within first 200 words
- [ ] For framework: specific calibrated values, not placeholder generics
- [ ] For how-to: numbered steps + named tools/commands/files at every step
- [ ] "Common pitfalls" / "Watch-outs" with paired guards
- [ ] Cross-links to ≥ 1 related tool / workflow / learn entry
- [ ] `last_updated` matches today

### stack

- [ ] Body ≥ 700 words
- [ ] Each tool in `tools[]` has a specifically-named role in the body
- [ ] Handoffs between tools are named (event A → action B)
- [ ] Cost baseline (annual range, per-seat band, or flat)
- [ ] ≥ 1 common variation + the rule for when to swap
- [ ] "What this stack does NOT replace" section
- [ ] Match rules — when the stack is the right pick + when it isn't

## Step 3 — Translate inline into the 5 non-EN locales

For each of `es`, `pt-BR`, `de`, `fr`, `ja`:

1. Open [locale-register.md](locale-register.md) §<locale>. Apply the register, banned forms, and fixed translations.
2. Translate the body. Keep code blocks, URLs, file paths, tool/product names verbatim. Translate headings, prose, list items, alt text.
3. Write `content/<entity>/<locale>/<slug>.mdx` with `locale: <locale>` set; copy all other frontmatter fields verbatim from EN.
4. The translated body must say the same thing as EN — same recommendations, same opinions, same numbers. If you find a factual issue while translating, STOP and surface it in the report. Do not silently "fix" the translation.

## Step 4 — Validate

From `C:\S\ooligo`:

```
npm run validate:config
npm run check:vocab
```

Both must pass for all 6 files. If either fails on any locale, abort the whole slot — do not stage. The queue item stays unconsumed.

## Step 5 — Mark queue + commit + push

Per [daily-prompt.md](daily-prompt.md) §Mark the queue and §Commit and push.

## Step 6 — Report

One line. The commit SHA is your receipt.
