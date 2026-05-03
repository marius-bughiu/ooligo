# Roadmap

Public, rolling. Updated as we ship. Issues and milestones on GitHub mirror this file.

## Operating principles

- **Ship narrow, expand fast.** Launch with one vertical and one locale visibly polished. The engine handles the rest as soon as the pipeline proves itself.
- **Engine before content.** The data model, content pipeline, translation pipeline, and SEO/AEO scaffolding are built before we generate the catalog at scale.
- **Public metrics.** Indexed-page count, traffic, signups, revenue — all tracked in public. Live dashboard on the site once we're past launch.
- **No half-finished verticals.** A vertical is launched only when it has a complete starter set: ≥40 tools tagged, ≥1 curated stack, ≥10 workflows, ≥30 learn entries, vertical landing page, newsletter ready.

## Phase 0 — Foundations (Week 1-2)

- [x] Strategy + architecture locked (this repo)
- [x] Astro app skeleton with i18n routing (`/[locale]/...`)
- [x] Content schema + validators (JSON Schema → TypeScript types)
- [x] Cloudflare Pages + domain wired up (Supabase not yet in use)
- [ ] Plausible analytics installed
- [ ] beehiiv newsletter set up (one publication, EN/RevOps)
- [x] First commit pushed publicly

## Phase 1 — Engine + Flagship (Week 3-8)

**Goal: ~250 indexed pages in EN/RevOps. Engine proven.**

- [x] Tool entry generator (LLM pipeline → MDX → validated against schema)
- [x] Comparison page generator (`/vs/[a]-vs-[b]` from any pair of tool entries)
- [x] Workflow library entry format + downloadable artifact pipeline
- [x] Learn/AEO hub format + cross-linking engine
- [x] First 50 tool entries (RevOps stack: HubSpot, Salesforce, Clay, Apollo, Outreach, Gong, Chorus, Default, RegieAI, Common Room, etc.)
- [x] First 100 comparison pages (auto-generated from tool pairs)
- [x] First 30 workflow library entries (real, tested artifacts — Claude Skills, n8n flows, Cursor rules)
- [x] First 50 learn/glossary entries (`/learn/what-is-revops`, `/learn/pipeline-velocity`, etc.)
- [x] RevOps vertical landing page + 5 curated stack pages
- [x] Sitemap, hreflang, schema.org markup
- [ ] Newsletter live, signup form on every page (form is in place; beehiiv backend pending)

## Phase 2 — Localization online (Week 9-12)

**Goal: ~750 pages (EN/ES/PT-BR × RevOps).**

- [x] Translation pipeline (Claude structured-output + glossary enforcement)
- [x] Automated QA gates (back-translation similarity, schema validation, broken-link check)
- [x] All EN content translated to ES + PT-BR
- [x] hreflang clusters validated; per-locale sitemaps live
- [ ] Per-locale Google Search Console properties
- [x] Locale switcher UX
- [x] Open issues for any auto-translated content that fails QA gates

## Phase 3 — Vertical 2: Legal Ops (Month 4)

**Goal: ~1,500 pages.**

- [x] Legal Ops vertical config + landing page
- [x] 30 Legal-Ops-specific tools added to catalog (CARET Legal, Spellbook, Harvey, Ironclad, ContractPodAi, etc.)
- [ ] 20 Legal-Ops-specific workflows (10 shipped to date)
- [x] 30 Legal-Ops-specific learn entries (EU AI Act for legal teams, GDPR workflows, contract-review SOPs)
- [x] Cross-tagging (tools that serve both RevOps and Legal Ops surface in both tracks)
- [x] Auto-translate to ES/PT-BR

## Phase 4 — Vertical 3: Recruiting / TA (Month 5)

**Goal: ~2,500 pages.**

- [x] Recruiting vertical config + landing page
- [x] 40 Recruiting-specific tools (Gem, Sense, Paradox, hireEZ, Eightfold, Findem, etc.)
- [ ] 20 Recruiting-specific workflows (11 shipped to date)
- [x] 30 Recruiting-specific learn entries
- [x] Auto-translate to ES/PT-BR

## Phase 5 — Locale-native newsletters (Month 6-7)

**Goal: 5 newsletter tracks live.**

- [ ] EN/RevOps (already live)
- [ ] EN/Legal Ops
- [ ] EN/Recruiting
- [ ] ES/RevOps (LATAM signal first)
- [ ] PT-BR/RevOps (Brazil signal first)
- [ ] Sponsored placement format defined; first paid sponsor ≥$500/issue

## Phase 6 — Monetization layer (Month 6-9)

- [x] AdSense in-article slots live (publisher ID configured) — shipped ahead of the affiliate-first plan
- [ ] Affiliate links live on every tool/comparison page
- [ ] Premium directory listings (paid tier — featured placement, rich profile, lead capture)
- [ ] Paid workflow library subscription ($19/mo or $190/yr — Claude Skills, n8n flows, Cursor rules, premium agent templates)
- [ ] Discord community (free track + paid track)
- [ ] First sponsored newsletter slots booked

## Phase 7 — Vertical 4 + scale (Month 8-12)

- [ ] Marketing Ops vertical (or Customer Success — to be decided based on Phase 4-5 traction signal)
- [ ] Add DE locale (or FR — to be decided based on which language showed strongest organic signal)
- [ ] 6,000+ indexed pages total
- [ ] First $10K MRR milestone

## Locales

| Locale | Status | Tools | Notes |
|---|---|---|---|
| English (en) | Launched | 99 | Canonical |
| Spanish (es) | Launched | 52 | LATAM neutral |
| Portuguese, Brazil (pt-BR) | Launched | 52 | |
| Japanese (ja) | Seeded | 3 | Translation queue active |
| French (fr) | Seeded | 3 | Translation queue active |
| German (de) | Seeded | 3 | Translation queue active |

"Launched" = full content parity with the active verticals. "Seeded" = locale is configured, translation queue is running, and a small set of entries has shipped.

## Public metrics (published once non-zero)

| Metric | Status |
|---|---|
| Content pages live | ~840 (EN: 367 / ES: 232 / pt-BR: 232 / 3 seeded locales: ~9) |
| Verticals live | 3 (RevOps, Legal Ops, Recruiting) |
| Locales live | 3 launched + 3 seeded |
| Newsletter subscribers | 0 (beehiiv not wired) |
| Discord members | 0 |
| Paid library subscribers | 0 |
| MRR | $0 |

*as of 2026-05-03*

## How to follow

- Watch this repo
- Subscribe to the newsletter (link added in Phase 1)
- Build log on Twitter/X and LinkedIn (handles added once accounts are claimed)
