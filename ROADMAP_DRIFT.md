# Roadmap drift

Quarterly drift reports, appended by `ooligo-roadmap-reflect` on the 1st of March, June, September, and December. The routine diffs [ROADMAP.md](ROADMAP.md) against repo reality (page counts per vertical/locale/type, phase checklist accuracy, locale parity, public-metrics staleness) and surfaces suggestions for the user to apply manually.

**This file is informational.** ROADMAP.md remains human-curated — the routine never edits it directly. Each quarter's section ends with a "Suggested ROADMAP.md edits" checklist the user can pick from.

Append-only. The newest quarter sits at the bottom.

Format and section template: see [content-strategy/roadmap-reflect-prompt.md](content-strategy/roadmap-reflect-prompt.md).

## 2026-06-01 — Quarterly drift report

*Generated 2026-06-01. Source of truth: ROADMAP.md (unmodified by this routine).*

### Headline numbers

- **Total EN content pages: 504** (tools 149 / comparisons 128 / workflows 85 / learn 127 / stacks 15). Roadmap's most recent claim (§Public metrics, "EN: 467"): **delta +37 (+7.9%)**.
- **Total pages × 6 locales: 3,024** (every locale at exact slug parity — see below). Roadmap §Public metrics claims **~947 total**; **delta +2,077**. The gap is almost entirely ja/fr/de, which the roadmap still lists as "Seeded (3 tools)" but which now carry the full 504-page catalog each.
- **Verticals at full parity** (≥40 tools, ≥10 workflows, ≥30 learn): **RevOps, Legal Ops, Recruiting** — all three. Per-vertical EN membership:
  - RevOps — 69 tools, 39 workflows, 59 learn, 9 stacks, 69 comparisons
  - Legal Ops — 44 tools, 25 workflows, 37 learn, 4 stacks, 46 comparisons
  - Recruiting — 63 tools, 23 workflows, 39 learn, 2 stacks, 51 comparisons
  - All three clear the no-half-finished-verticals floor (≥40 tools, ≥1 stack, ≥10 workflows, ≥30 learn).
- **Locales at full parity with EN: all 6** (en, es, pt-BR, ja, fr, de) — 504 files each, **0 basename diffs** vs EN across tools/learn/workflows sampled. The roadmap models only 3 launched + 3 seeded.

### Phase-by-phase

#### Phase 1 — Engine + Flagship

The Phase-1 milestone counts are "first N" floors that reality has long since blown past. Goal "~250 indexed pages in EN/RevOps" is met (~245 EN/RevOps pages). The generators/sitemap/newsletter infra items are checked and the vertical landing route is confirmed (`apps/web/src/pages/[locale]/r/[vertical].astro`).

- Item: "First 50 tool entries (RevOps stack: ... — full count now 50 tagged)"
  - Status in roadmap: [x]
  - Repo reality: 69 RevOps-tagged tools (149 tools total)
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +38% over the parenthetical "50")
  - Suggestion: bump the parenthetical to "now 69 tagged".
- Item: "First 100 comparison pages (auto-generated from tool pairs)"
  - Status in roadmap: [x]
  - Repo reality: 128 comparisons (80 pairwise / 25 alternatives / 23 roundup)
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +28%)
  - Suggestion: note actual is 128.
- Item: "First 30 workflow library entries"
  - Status in roadmap: [x]
  - Repo reality: 85 workflows (47 claude-skill / 18 n8n-flow / 10 mcp-server / 6 cursor-rule / 4 prompt)
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +183%)
  - Suggestion: note actual is 85.
- Item: "First 50 learn/glossary entries"
  - Status in roadmap: [x]
  - Repo reality: 127 learn entries (92 definition / 32 framework / 3 how-to)
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +154%)
  - Suggestion: note actual is 127.
- Item: "RevOps vertical landing page + 5 curated stack pages"
  - Status in roadmap: [x]
  - Repo reality: 9 RevOps-tagged stacks (15 stacks total); landing route confirmed
  - Drift: ACHIEVEMENT (UNDERCLAIMED on stack count, +80%)
  - Suggestion: bump "5 curated stack pages" to 9 (15 total).

#### Phase 2 — Localization online

- Item: "All EN content translated to ES + PT-BR (ES: 68 missing; pt-BR: 100 missing + 20 stale — translation queue drain in progress)"
  - Status in roadmap: [ ]
  - Repo reality: ES and pt-BR both at 504/504 files, **0 slug diffs** vs EN. The queue has drained.
  - Drift: ACHIEVEMENT — PROBABLY-DONE-NOT-CHECKED. The "68 missing / 100 missing + 20 stale" note is stale.
  - Suggestion: check the box; drop the missing/stale parenthetical (verify the 20 pt-BR "stale" via back-translation QA before fully closing, but file parity is complete).
- Item: "Per-locale Google Search Console properties"
  - Status in roadmap: [ ]
  - Repo reality: no `~/.config/ooligo/` dir and no `gsc-*.json` found in repo. Cannot confirm done.
  - Drift: NONE (correctly pending). Note: read-only routine can't see GSC dashboard state; if properties exist outside the repo this would be UNDERCLAIMED — defer to manual check.

#### Phase 3 — Vertical 2: Legal Ops

Goal "~1,500 pages" exceeded (EN catalog alone × 3 mature locales ≈ 1,512; total 3,024).

- Item: "30 Legal-Ops-specific tools (... — now 40 tagged across the vertical)"
  - Status in roadmap: [x]
  - Repo reality: 44 Legal-Ops-tagged tools
  - Drift: ACHIEVEMENT (minor, +10% over "40")
  - Suggestion: bump parenthetical to "now 44 tagged".
- Item: "20 Legal-Ops-specific workflows"
  - Status in roadmap: [x]
  - Repo reality: 25 Legal-Ops workflows
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +25%)
  - Suggestion: note actual is 25.
- Item: "30 Legal-Ops-specific learn entries"
  - Status in roadmap: [x]
  - Repo reality: 37 Legal-Ops learn entries
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +23%)
  - Suggestion: note actual is 37.

#### Phase 4 — Vertical 3: Recruiting / TA

Goal "~2,500 pages" exceeded (total 3,024).

- Item: "40 Recruiting-specific tools (... — now 53 tagged across the vertical)"
  - Status in roadmap: [x]
  - Repo reality: 63 Recruiting-tagged tools
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +19% over "53", +58% over "40")
  - Suggestion: bump parenthetical to "now 63 tagged".
- Item: "30 Recruiting-specific learn entries"
  - Status in roadmap: [x]
  - Repo reality: 39 Recruiting learn entries
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +30%)
  - Suggestion: note actual is 39.
- Item: "20 Recruiting-specific workflows" — [x]; reality 23 (+15%). Drift: NONE (minor).

#### Phase 5 — Locale-native newsletters

- All items ([ ] EN/RevOps "already live", EN/Legal Ops, EN/Recruiting, ES/RevOps, PT-BR/RevOps, sponsored placement) depend on beehiiv-publication / sponsor state that is **not represented in the repo**.
  - Drift: AMBIGUOUS — success criterion ("track live") isn't repo-observable. The read-only routine can't confirm or deny. Defer to manual fill in the traffic retro. EN/RevOps is parenthetically "already live" but left unchecked — worth reconciling.

#### Phase 6 — Monetization layer

- Item: "Affiliate links live on every tool/comparison page"
  - Status in roadmap: [ ]
  - Repo reality: only 1 tool file references "affiliate". Not live catalog-wide.
  - Drift: NONE (correctly pending).
- AdSense [x] confirmed by item note; remaining items (premium listings, paid library, Discord, sponsored slots) not repo-observable and consistent with §Public metrics zeros. NONE.

#### Phase 7 — Vertical 4 + scale

- Item: "Add DE locale (or FR — to be decided based on which language showed strongest organic signal in GA4 segment data)"
  - Status in roadmap: [ ]
  - Repo reality: **de, fr, AND ja all at full 504-page parity** (0 slug diffs vs EN). Not just one locale added — three are fully launched.
  - Drift: ACHIEVEMENT — PROBABLY-DONE-NOT-CHECKED (and then some). The "to be decided" framing is obsolete.
  - Suggestion: check the box; reword — all three secondary locales are launched, not pending a decision.
- Item: "6,000+ indexed pages total"
  - Status in roadmap: [ ]
  - Repo reality: 3,024 pages (~50% of goal). Indexed ≠ live, so true indexed count is unknown from repo.
  - Drift: NONE (pending, on track). Note: this is *live* page count; indexation needs GSC.
- Item: "Marketing Ops vertical (or Customer Success...)" — [ ]; reality 3 verticals only. Pending, correctly unchecked.
- Item: "First $10K MRR milestone" — [ ]; §Public metrics shows $0. Pending.

### Locale status

| Locale | Roadmap claim | Actual EN parity |
|---|---|---|
| en | Launched (120 tools) | Canonical — 504 pages, 149 tools |
| es | Launched (52 tools) | 504/504 = 100% (149 tools); 0 slug diffs |
| pt-BR | Launched (52 tools) | 504/504 = 100% (149 tools); 0 slug diffs |
| ja | Seeded (3 tools) | **504/504 = 100%** (149 tools); 0 slug diffs |
| fr | Seeded (3 tools) | **504/504 = 100%** (149 tools); 0 slug diffs |
| de | Seeded (3 tools) | **504/504 = 100%** (149 tools); 0 slug diffs |

Every locale's tool count in the roadmap table is also stale (120/52/52/3/3/3 → all 149).

### CORRECTIONS.md signal

- Open corrections this quarter: **0** (the `## Log` section has no entries below its marker line).
- Recurring error classes (≥3 in quarter): **none**.
- Action: nothing to escalate. Per CONTENT_PIPELINE.md §Correction loop, no class has reached the 3-entry threshold that would trigger a pipeline/voice doc amendment. See `ooligo-corrections-review` quarterly run.

### Suggested ROADMAP.md edits

- [ ] **§Locales table — move ja, fr, de from "Seeded" to "Launched"** and update tool counts: en/es/pt-BR/ja/fr/de all = 149. (Biggest single correction.)
- [ ] **§Public metrics — "Content pages live"**: change "~947 (EN: 467 / ES: 232 / pt-BR: 232 / 3 seeded ~9)" to "~3,024 (504 per locale × 6 locales at full parity)".
- [ ] **§Public metrics — "Locales live"**: change "3 launched + 3 seeded" to "6 launched".
- [ ] **§Public metrics — bump `*as of 2026-05-03*`** to a current date when these edits land (currently 29 days old — not yet stale, but it'll drift with the above corrections).
- [ ] Phase 2 — check "All EN content translated to ES + PT-BR" and drop the "68 missing / 100 missing + 20 stale" parenthetical (file parity complete; confirm the pt-BR "stale 20" via QA first).
- [ ] Phase 7 — check "Add DE locale (or FR…)" and reword: de + fr + ja are all launched at full parity.
- [ ] Phase 1 — bump milestone counts in parentheticals: tools "50 tagged"→"69 tagged (RevOps)", comparisons "100"→"128", workflows "30"→"85", learn "50"→"127", stack pages "5"→"9 (15 total)".
- [ ] Phase 3 — bump "now 40 tagged"→"44 tagged"; note 25 workflows / 37 learn.
- [ ] Phase 4 — bump "now 53 tagged"→"63 tagged"; note 39 learn.
- [ ] Phase 5 — reconcile EN/RevOps "(already live)" with its unchecked box, or move the newsletter-track status into §Public metrics where it's manually maintained.

### Open questions for the user

- **Newsletter tracks (Phase 5)** aren't repo-observable. How many of the 5 are actually live in beehiiv? This routine can't see it — needs a manual fill (traffic retro covers it).
- **GSC properties (Phase 2)** — no service-account/config in the repo or `~/.config/ooligo/`. Are per-locale properties set up outside the repo, or genuinely not started?
- **pt-BR "20 stale" translations** — file parity is now complete, but the old note flagged 20 stale pt-BR entries. Were those refreshed, or just counted? Worth a back-translation QA spot-check before checking the Phase 2 box.
- With all 6 locales at parity and all 3 verticals clearing the floor, the live catalog is at ~50% of the Phase 7 6,000-page goal **before** a 4th vertical exists. Is the next lever a 4th vertical (Phase 7) or deepening the existing three?
