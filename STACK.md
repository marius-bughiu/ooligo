# Stack

Choices optimized for AI-native operation, programmatic SEO at scale, and build-in-public velocity. Every decision is reversible; the data layer is portable.

## Core stack

| Layer | Choice | Rationale |
|---|---|---|
| **Framework** | [Astro](https://astro.build) with React islands | Static-first SSG, ideal for content sites; ships zero JS by default; first-class i18n routing; faster Lighthouse scores than Next out of the box |
| **Hosting** | [Cloudflare Pages](https://pages.cloudflare.com) (direct upload via Wrangler from GitHub Actions — see [DEPLOYMENT.md](./DEPLOYMENT.md)) | Free tier, edge-cached globally, no Vercel build-minute ceiling; Workers + Cron Triggers for pipeline jobs |
| **Database** | [Supabase](https://supabase.com) (Postgres) | Free tier generous for our scale; row-level security if we ever expose data; managed Postgres beats SQLite for cross-region edge reads |
| **Content store** | MDX + JSON in repo (canonical) + Postgres mirror for queryable data | Version control = build-in-public artifact; Postgres is the read layer for search, filters, comparisons |
| **Search** | [Pagefind](https://pagefind.app) (build-time, static) initially → [Meilisearch](https://meilisearch.com) when scale demands | Pagefind is free, runs at build time, perfect for static sites |
| **CMS** | None initially — content edited via PRs and AI scripts. Add [TinaCMS](https://tina.io) only if non-technical contributors join | Forces build-in-public discipline; PR diffs make every content change auditable |
| **Newsletter** | [beehiiv](https://beehiiv.com) | Better monetization than Substack (network boosts, programmatic ads); API for embedded forms; supports multiple publications under one account (one per vertical/locale) |
| **Analytics** | [Plausible](https://plausible.io) | Privacy-friendly, GDPR-safe, no cookie banner needed, simple public dashboards |
| **AI inference** | [Anthropic Claude API](https://www.anthropic.com/api) (primary), OpenAI (backup) | Claude's structured outputs and longer context fit content pipeline; Skills-friendly; backup for failover |
| **Image generation** | [fal.ai](https://fal.ai) for FLUX (hero art), [Replicate](https://replicate.com) for variety | Cheap, API-driven, no per-team rate limits |
| **Background jobs** | Cloudflare Workers + Cron Triggers | Free tier handles content refresh, translation, sitemap regeneration |
| **Domain + DNS** | Cloudflare | Free, fast, integrated with Pages |
| **Schema / structured data** | JSON-LD via Astro components | Critical for AEO + Google rich results |
| **Repo / CI** | GitHub + GitHub Actions | Public-by-default; Actions runs content pipeline on a schedule |
| **Project management** | GitHub Projects (public board) | Roadmap visible to followers |
| **Comments / engagement** | [Giscus](https://giscus.app) | Free; backed by GitHub Discussions; build-in-public ethos |
| **Affiliate management** | [Tapfiliate](https://tapfiliate.com) or direct links | Per-tool tracking links, dashboard for click-through and conversion |

## Cost projection

| Phase | Monthly run-rate |
|---|---|
| Phase 0-1 (engine + flagship) | ~$30 (domain + Plausible + small Claude usage) |
| Phase 2-3 (localized + 2 verticals) | ~$80 (Claude usage scales; beehiiv basic) |
| Phase 5+ (all 3 verticals × 3 locales) | ~$150-300 (Claude inference dominant; Meilisearch if upgraded) |

Translation + content generation cost is the swing variable. Claude Sonnet at scale: ~$0.01 per page translated, ~$0.05 per page initially generated. 6,000 pages × 3 locales × refresh-quarterly ≈ $200-400/quarter.

## Repository layout (target)

```
ooligo/
├── README.md
├── ROADMAP.md
├── STACK.md
├── ARCHITECTURE.md
├── CONTENT_PIPELINE.md
├── LICENSE
├── .gitignore
├── package.json                  # Phase 0
├── tsconfig.json                 # Phase 0
├── astro.config.mjs              # Phase 0
├── apps/
│   └── web/                      # Astro app (Phase 0-1)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── [locale]/
│       │   │   │   ├── index.astro
│       │   │   │   ├── tools/
│       │   │   │   ├── vs/
│       │   │   │   ├── workflows/
│       │   │   │   ├── learn/
│       │   │   │   └── r/[vertical]/
│       │   │   └── index.astro   # locale redirect
│       │   ├── components/
│       │   ├── layouts/
│       │   └── lib/
│       └── astro.config.mjs
├── content/
│   ├── verticals.json            # 3 vertical configs
│   ├── locales.json              # 3 locale configs
│   ├── .schema/                  # JSON Schemas for every entity
│   ├── tools/                    # /tools/[slug].[locale].mdx
│   ├── comparisons/
│   ├── workflows/
│   └── learn/
├── packages/
│   └── pipeline/                 # AI content + translation pipeline (Phase 1+)
│       ├── src/
│       │   ├── generators/
│       │   ├── translators/
│       │   ├── validators/
│       │   └── qa/
│       └── package.json
├── scripts/
│   ├── generate-tool.ts
│   ├── generate-comparison.ts
│   ├── translate.ts
│   ├── validate-content.ts
│   └── refresh.ts                # cron-triggered
└── .github/
    └── workflows/
        ├── ci.yml
        ├── content-refresh.yml   # cron: weekly
        └── translation-sync.yml  # on: push to main, paths: content/**.en.mdx
```

## Versioning + change management

- All content changes go through PRs (even AI-generated ones — the AI opens the PR, CI auto-merges if QA passes)
- Schema changes are breaking events; documented in `ARCHITECTURE.md` changelog
- Roadmap is a living doc — phase scopes can shift, but completed phases stay frozen

## What we're NOT using (and why)

- **WordPress / traditional CMS** — too heavy, too SEO-fragile under AI overviews
- **Next.js** — overkill for a content site; Astro is faster and simpler
- **Vercel** — Cloudflare Pages is cheaper at scale, no build-minute trap
- **Substack** — beehiiv's monetization layer is better and supports multiple publications cleanly
- **Sanity / Contentful** — content-in-repo is the build-in-public artifact; CMS adds opacity
- **Algolia** at launch — Pagefind is free and sufficient until ~10K pages
