# Design

Single-theme, on-brand visual system for every entity in [ARCHITECTURE.md](./ARCHITECTURE.md), every locale in `content/locales.json`, every page under `apps/web/src/pages/[locale]/`. Phased to ship in lockstep with [ROADMAP.md](./ROADMAP.md).

## Brand north star

- **Audience.** Ops leaders ($5–50M ARR B2B SaaS) who live in Linear, Notion, Stripe, Vercel, Cal.com. They mistrust marketing-site chrome and reward utility-grade UI.
- **Position.** Enterprise, AI-native, technical, transparent (build-in-public).
- **Anti-pattern.** G2 / Capterra / ProductHunt-era directory chrome (rainbow gradients, blob illustrations, stock photography, accordion testimonials).
- **Single-theme commitment.** One palette across all 3 verticals, all 3 locales, all 5 entity types. Vertical differentiation is *typographic + a geometric mark* — never hue.

## Direction

Dark, monochrome-anchored, single-accent. Lineage: Linear / Vercel / Stripe Apps / Resend / Cal.com.

Visual identity carried by:

- **Typography.** Mono used as a feature for slugs, scores, prices, version tags — gives the site its "API-grade" feel.
- **Density.** Information per screen *is* the brand; ops leaders judge this on sight.
- **Restraint.** Almost no shadow, almost no motion, no illustration, no gradient.

## Design tokens

### Color

| Token | Value | Use |
|---|---|---|
| `bg-canvas` | `#0A0A0B` | page background (warm-tinted, not pure cold) |
| `bg-surface-1` | `#111114` | cards, header bg |
| `bg-surface-2` | `#18181D` | inset rows, code blocks |
| `bg-surface-3` | `#22222A` | hover, active |
| `border-subtle` | `#27272F` | dividers |
| `border` | `#3A3A45` | card outline, focus base |
| `text-primary` | `#F5F5F7` | body |
| `text-secondary` | `#B4B4BC` | meta |
| `text-tertiary` | `#7A7A82` | timestamps, captions |
| `accent` | `#F0A500` | links, score-band high, primary CTA, focus halo |
| `success` / `warn` / `danger` | `#4ADE80` / `#FBBF24` / `#F87171` (desaturated) | status only |

Elevation in monochrome steps, not drop shadow.

### Typography

- **Display + body.** Geist (variable), tight tracking (`-0.03em` to `-0.04em` at 32px+).
- **Mono.** Geist Mono — used for `slug`, `9.2/10`, `$149/mo`, version tags, breadcrumbs.
- **Scale.** 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64.
- **Subsetting.** Latin Extended (EN + ES + PT-BR diacritics).
- **Self-hosted** via `@fontsource-variable/*` — no Google Fonts hot-link.

### Spacing, radii, motion

- **Spacing** 4px base: `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128`.
- **Radii.** `4` (chips), `8` (cards), `12` (modals), `999` (pills).
- **Motion.** 150ms hover, 200ms state. No page transitions, no parallax. `prefers-reduced-motion` respected.
- **Shadows.** Avoid; elevation is border + bg.

## Layout system

- Container max-width `1280`. Reading container `720` for `/learn` MDX bodies.
- 12-col grid, 24px gutter.
- Sticky header `64px` with subtle blur backdrop.
- Footer `~520px`, dense, multi-column — part of the brand, not a regulatory afterthought.

## Global chrome

### Header

Wordmark (left) → nav (Tools / Comparisons / Workflows / Learn / Verticals mega-menu) → locale switcher · GitHub · newsletter CTA (right). Mobile: full-screen sheet.

### Footer

Four columns: **Catalog** · **Verticals** · **Build** (GitHub, public roadmap, public metrics, status) · **Subscribe** (inline beehiiv form). Bottom strip: copyright · AI-generated transparency badge · build hash.

### Locale switcher

Native names (English / Español / Português). Sets cookie. Honors `availableLocales` already wired in `BaseLayout.astro`.

### Breadcrumbs

Component on every detail page. Mono, secondary text. Already covered by `BreadcrumbList` JSON-LD per architecture.

## Component library

Primitives that all 10 page templates compose. Build once, render everywhere.

1. **Score pill** — `9.2 / 10`, mono, color-graded by band.
2. **Capability chips** — `AI-NATIVE`, `MCP`, `API`, `FREE-TIER`. Outlined, monochrome.
3. **Pricing label** — `$149/mo · usage-based`, mono.
4. **Vertical tag** — geometric mark + label, monochrome (no per-vertical hue).
5. **AI-generated / AI-translated badge** — pinned to every page; treated as brand asset, not disclosure.
6. **Tool card** — index list cell.
7. **Comparison strip** — `A vs B` with marks + category.
8. **Workflow card** — artifact-type icon + stack logos + difficulty + time.
9. **Stack badge row** — horizontal logos with hover names; for workflows + stacks.
10. **Spec table** — replaces the raw `<dl>` on tool detail; sticky, dense, mono numerics.
11. **AEO answer block** — for `/learn`: `target_questions[]` rendered as a "this page answers" panel. Brand asset *and* citation signal.
12. **Score breakdown bars** — for `ooligo_score_breakdown`. Bars, not radar (ops people mistrust radar).
13. **Cross-link rail** — closes the link budget enforced by the validator (3 alt tools, 1 comparison, 2 workflows, 2 learn — per `ARCHITECTURE.md`).
14. **Empty state** — `/tools`, `/vs`, `/workflows`, `/learn` are mostly empty pre-launch; empty states are ⅓ of the live surface area right now.
15. **Inline artifact preview** — for workflow `preview_lang`: syntax-highlighted code/markdown.
16. **Tool monogram fallback** — when a vendor logo is missing, render a typographic mark (first letter, mono, accent) so the catalog grid stays rhythmic.

## Page-by-page plan

Matches `apps/web/src/pages/[locale]/`.

### Home — `index.astro`

Hero (mono headline, sub, primary CTA → `/tools`, secondary → newsletter) · live counters strip (indexed pages, verticals, locales — from `ROADMAP.md` public metrics) · 3 vertical cards (RevOps flagship larger), each shows starter stack as logo row · featured rails (top tools / new comparisons / new workflows) · AEO block ("What ooligo is") · build-in-public strip · newsletter block.

### Tools index — `tools/index.astro`

Filter rail (sticky on desktop, drawer on mobile): vertical · category · AI-native · MCP · API · pricing model · score range. Result count + sort (alpha / score / recent). 2–3 col card grid + dense-list toggle. Category section headers stay (per current template), restyled as sticky sub-headers.

### Tool detail — `tools/[slug].astro`

Header band (name + category + capability chips + score pill). 8/4 split: MDX article + sticky **spec card** (pricing, integrations, score breakdown bars, last reviewed, AI-generated badge, affiliate CTA). Below body: alternatives rail · "featured in comparisons" · "workflows using" · "learn about category". Closes the cross-link budget.

### Comparisons index — `vs/index.astro`

Tabs: Pairwise / Roundup / Alternatives. Pairwise: `A vs B` cards. Roundup: "Best X tools" with first-3 logos. Filters: vertical, category.

### Comparison detail — `vs/[slug].astro`

Pairwise: two-column hero (logos + score pills + category). Roundup / alternatives: ranked list with score-bars. **Compare table** with sticky header row, mono numerics, integration-overlap highlight, score-bar cells. MDX commentary below; "View tool" CTA per column.

### Workflows index — `workflows/index.astro`

Cards (artifact-type icon + title + stack logos + difficulty + time). Filter rail: artifact_type · vertical · role · difficulty.

### Workflow detail — `workflows/[slug].astro`

Header (title + artifact-type chip + difficulty + time + roles) · stack row (logos linked to tool pages) · **Download** CTA card (filename, size, format) · inline artifact preview (`preview_lang`) · "How to install" from MDX · related workflows + related learn.

### Learn index — `learn/index.astro`

Two views: **Glossary** (alphabetical, letter-jumped) / **By topic** toggle. Cards: title + type chip + 1-line `target_questions[0]`. Filter: type · vertical.

### Learn detail — `learn/[slug].astro`

Reading-width container (720). Top: `target_questions[]` rendered as the AEO answer block. Sticky right-rail TOC (auto from h2/h3). Type-specific layouts: definition (def-box top), faq (Q&A list), how-to (numbered steps with anchor links). Bottom cross-link rail.

### Vertical landing — `r/[vertical].astro`

Hero (name + tagline + ICP) · "the starter stack" (visual grid of `starter_tools`) · curated stack cards · three rails (top workflows / top comparisons / top tools) · glossary essentials · vertical-scoped newsletter CTA (uses `newsletter_id`).

### Stack detail — `stacks/[slug]` *(in arch, not yet routed)*

Static SVG end-to-end stack diagram (boxes + arrows) · tool list with role-in-stack · workflows that operate this stack · "Build this" CTA → workflow library.

## Programmatic assets

- **OG image generator** — Astro endpoint emitting per-page OG images: tool, comparison, workflow, learn, vertical templates. Critical for share traffic; reuses tokens.
- **Logo system** — wordmark + glyph mark + 3 vertical mini-marks (geometric, monochrome).
- **Sitemap / robots / 404** — styled to brand, not browser default.

## Tech execution

- **CSS.** Tailwind v4 with single-file `@theme` block holding all tokens. Zero runtime, fits Astro static-first, single source of truth.
- **Icons.** Lucide for UI; Simple Icons for vendor marks where MIT-licensed, self-hosted SVG otherwise.
- **No light theme.** Single-theme is the brief; revisit only if research shows dark hurts.
- **Performance budget.** HTML <30 KB, CSS <30 KB, fonts <80 KB total (woff2, subset). Lighthouse Perf ≥95 mobile.
- **Accessibility.** Contrast ≥4.5:1 body, ≥3:1 large; focus rings on every interactive; skip-to-content; reduced-motion; ARIA for chips/pills; cross-locale audit (ES/PT-BR strings run 20–30% longer — layouts must not break).

## Phased implementation

| Phase | Scope | Output |
|---|---|---|
| **D0 — Foundation** (1–2d) | Tailwind v4 + `@theme` tokens, self-hosted variable fonts, wordmark + favicon, BaseLayout adopts theme | Visible "before/after" baseline |
| **D1 — Chrome** (2–3d) | Header, footer, container/section primitives, breadcrumbs, locale switcher, GitHub + newsletter CTA | All 10 templates framed |
| **D2 — Component library** (3–4d) | All 16 primitives, exposed at private `/_design` route | Reusable building blocks |
| **D3 — Index pages** (3–4d) | `/tools`, `/vs`, `/workflows`, `/learn` filter rails + grids + empty states | Browsing surface usable |
| **D4 — Detail pages** (4–5d) | Tool 8/4 split + spec card; comparison hero + table; workflow download/preview; learn TOC + type variants; cross-link rails | Money pages on-brand |
| **D5 — Vertical pages** (1–2d) | `/r/[vertical]` full layout | Vertical landings live |
| **D6 — Programmatic assets** (2–3d) | OG image generator, monogram fallback, styled sitemap/robots/404 | Off-site brand consistent |
| **D7 — Polish + perf** (2–3d) | Lighthouse, a11y, cross-locale, print stylesheet for `/learn` | Ship-ready |

Total ≈ 18–26 working days for the full surface to be on-brand.

## What we're NOT designing (and why)

- **Per-vertical color themes** — fragments the brand; single accent across verticals.
- **Dark/light toggle** — doubles QA surface; brief is single-theme.
- **Custom illustrations** — wrong register for ops audience.
- **Animated hero** — costs JS, fights static-first, ages fast.
- **Mega marketing landing** — home is just another content page with a slightly bigger hero.
- **Vertical-specific page templates** — engine remixes the universal catalog (per architecture); design must stay universal too.

## Locked decisions

| Decision | Choice |
|---|---|
| Accent color | Amber `#F0A500` |
| CSS approach | Tailwind v4 with `@theme` |
| Vendor logos | Real marks where licensed, monogram fallback otherwise |
| Wordmark | Typographic + geometric glyph (glyph used for favicons, OG, vertical mini-marks) |
