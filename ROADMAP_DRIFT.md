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

## 2026-09-01 — Quarterly drift report

*Generated 2026-09-01. Source of truth: ROADMAP.md (unmodified by this routine).*

ROADMAP.md was last touched `23bc003d` (2026-06-06) — five days after the previous drift report, and only to mark the Customer Success vertical shipped. Most of the June report's suggested edits were applied to the §Locales table and §Public metrics; the Phase-2 and Phase-7 checkbox suggestions were not. Those carry over below.

### Headline numbers

- **Total EN content pages: 865** (tools 272 / comparisons 228 / workflows 127 / learn 191 / stacks 47). Roadmap's most recent claim (§Public metrics, "612 EN canonical"): **delta +253 (+41.3%)**.
- **Quarter-over-quarter**: 504 EN pages at the 2026-06-01 report → 865 today, **+361 (+71.6%)** across 855 commits since 2026-06-01.
- **Total pages × 6 locales: 5,190 content pages**; **5,281 built pages** in the current `apps/web/dist` (adds 6 locales × 11 hub/legal routes + 4 vertical landings × 6 + 404/design). Roadmap §Public metrics claims **3,758 built**; **delta +1,523**.
- **Verticals at full parity** (≥40 tools, ≥1 stack, ≥10 workflows, ≥30 learn): **all four — RevOps, Legal Ops, Recruiting, Customer Success.** Per-vertical EN membership:

  | Vertical | Tools | Comparisons | Workflows | Learn | Stacks | Floor |
  |---|---|---|---|---|---|---|
  | RevOps | 100 | 98 | 53 | 77 | 19 | PASS |
  | Legal Ops | 91 | 77 | 33 | 51 | 14 | PASS |
  | Recruiting | 90 | 75 | 29 | 47 | 10 | PASS |
  | Customer Success | 66 | 35 | 22 | 38 | 10 | PASS |

  (Tools multi-tag, so the column sums past 272.) No content carries a vertical outside the four in `content/verticals.json`.
- **Locales at full parity with EN: all 6** (en, es, pt-BR, ja, fr, de) — 865 files each, **0 basename diffs** vs EN across all five entity types, **0 files** whose locale `last_updated` trails its EN counterpart.
- Type/format breakdown: comparisons 173 pairwise / 31 alternatives / 24 roundup; workflows 68 claude-skill / 25 n8n-flow / 19 mcp-server / 7 cursor-rule / 5 prompt / 2 sop / 1 agent-template; learn 132 definition / 49 framework / 10 how-to.

### Phase-by-phase

#### Phase 1 — Engine + Flagship

Goal "~250 indexed pages in EN/RevOps" is comfortably met: **347 EN/RevOps pages**. Every "first N" floor in this phase is now understated by 2–4×; the June report's suggested bumps were not applied, so the same items drift further.

- Item: "First 50 tool entries (RevOps stack: … — full count now 50 tagged)"
  - Status in roadmap: [x]
  - Repo reality: **100** RevOps-tagged tools (272 tools total)
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +100% over the parenthetical)
  - Suggestion: bump the parenthetical to "now 100 tagged".
- Item: "First 100 comparison pages (auto-generated from tool pairs)"
  - Status in roadmap: [x]
  - Repo reality: **228** comparisons (173 pairwise / 31 alternatives / 24 roundup)
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +128%)
  - Suggestion: note actual is 228.
- Item: "First 30 workflow library entries (real, tested artifacts — Claude Skills, n8n flows, Cursor rules)"
  - Status in roadmap: [x]
  - Repo reality: **127** workflows; the artifact mix has outgrown the parenthetical (mcp-server is now the third-largest type at 19, ahead of cursor-rule at 7)
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +323%)
  - Suggestion: note actual is 127 and add MCP servers to the artifact-type list.
- Item: "First 50 learn/glossary entries"
  - Status in roadmap: [x]
  - Repo reality: **191** learn entries
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +282%)
  - Suggestion: note actual is 191.
- Item: "RevOps vertical landing page + 5 curated stack pages"
  - Status in roadmap: [x]
  - Repo reality: **19** RevOps-tagged stacks (47 total); landing route `apps/web/src/pages/[locale]/r/[vertical].astro` renders all four verticals
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +280%)
  - Suggestion: bump "5 curated stack pages" to 19 (47 total).
- Item: "Sitemap, hreflang, schema.org markup" — [x]; `@astrojs/sitemap` wired in `astro.config.mjs`, hreflang emitted from `BaseLayout.astro`. Drift: NONE.

#### Phase 2 — Localization online

- Item: "All EN content translated to ES + PT-BR (ES: 68 missing; pt-BR: 100 missing + 20 stale — translation queue drain in progress)"
  - Status in roadmap: [ ]
  - Repo reality: ES and pt-BR are both at **865/865 files, 0 slug diffs, 0 stale** by `last_updated` comparison against EN. So are ja, fr, and de.
  - Drift: ACHIEVEMENT — PROBABLY-DONE-NOT-CHECKED. **Repeat finding**: flagged in the 2026-06-01 report and still unapplied. The "68 missing / 100 missing + 20 stale" parenthetical has been wrong for two quarters.
  - Suggestion: check the box; delete the parenthetical.
- Item: "Per-locale Google Search Console properties"
  - Status in roadmap: [ ]
  - Repo reality: no `~/.config/ooligo/` directory; `content-strategy/gsc-candidates.json` is still the empty stub (`generated_at: null`, all three candidate arrays empty), so the weekly `gsc-harvest` routine has never had credentials to run against.
  - Drift: NONE (correctly pending) — and now a bottleneck: the freshness and topic-refill routines both consume `gsc-candidates.json`, so they are running blind. Not repo-observable whether properties exist in the GSC UI.
  - Suggestion: leave unchecked; this is the highest-leverage unblock in the phase list.

#### Phase 3 — Vertical 2: Legal Ops

Goal "~1,500 pages" exceeded more than 3× (5,190 content pages live).

- Item: "30 Legal-Ops-specific tools added to catalog (… — now 40 tagged across the vertical)"
  - Status in roadmap: [x]
  - Repo reality: **91** Legal-Ops-tagged tools
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +128% over "40")
  - Suggestion: bump parenthetical to "now 91 tagged".
- Item: "20 Legal-Ops-specific workflows"
  - Status in roadmap: [x]
  - Repo reality: **33**
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +65%)
  - Suggestion: note actual is 33.
- Item: "30 Legal-Ops-specific learn entries"
  - Status in roadmap: [x]
  - Repo reality: **51**
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +70%)
  - Suggestion: note actual is 51.
- Item: "Auto-translate to ES/PT-BR" — [x]; reality is all 5 non-EN locales, not just ES/pt-BR. Drift: ACHIEVEMENT (minor wording). Suggestion: reword to "all 5 non-EN locales".

#### Phase 4 — Vertical 3: Recruiting / TA

Goal "~2,500 pages" exceeded (5,190 content pages).

- Item: "40 Recruiting-specific tools (… — now 53 tagged across the vertical)"
  - Status in roadmap: [x]
  - Repo reality: **90** Recruiting-tagged tools
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +70% over "53")
  - Suggestion: bump parenthetical to "now 90 tagged".
- Item: "20 Recruiting-specific workflows"
  - Status in roadmap: [x]
  - Repo reality: **29**
  - Drift: ACHIEVEMENT (minor, +45%)
- Item: "30 Recruiting-specific learn entries"
  - Status in roadmap: [x]
  - Repo reality: **47**
  - Drift: ACHIEVEMENT (UNDERCLAIMED, +57%)
  - Suggestion: note actual is 47.

#### Phase 5 — Locale-native newsletters

- All six items are unchecked and none is repo-observable. What the repo *does* show: a single beehiiv publication (`apps/web/functions/api/subscribe.ts` reads one `BEEHIIV_PUBLICATION_ID`), with the vertical carried as a UTM tag plus a `vertical` custom field for later segmentation. `content/verticals.json` declares four `newsletter_id`s (`revops-en`, `legal-ops-en`, `recruiting-en`, `customer-success-en`) but nothing in the repo maps them to distinct beehiiv publications or sends.
  - Drift: AMBIGUOUS — the success criterion ("track live") isn't defined in repo terms. One publication with segmentation may or may not satisfy "5 newsletter tracks live"; that's a definition the roadmap doesn't give.
  - **Repeat finding**: "EN/RevOps (already live)" is annotated as live but left unchecked — same contradiction as last quarter, still unreconciled.
  - Suggestion: define what counts as a "track" (separate publication vs segmented send), then either check EN/RevOps or drop the "(already live)" annotation. Note Phase 5 also predates the Customer Success vertical — there are now four EN verticals but only three EN newsletter rows.

#### Phase 6 — Monetization layer

- Item: "AdSense in-article slots live (publisher ID configured)"
  - Status in roadmap: [x]
  - Repo reality: `apps/web/src/components/AdSlot.astro` present; `adsbygoogle` present throughout the built output. Confirmed.
  - Drift: NONE.
- Item: "Affiliate links live on every tool/comparison page"
  - Status in roadmap: [ ]
  - Repo reality: the *plumbing* is done — `affiliate_link` is in `content/.schema/tool.schema.json` and `content.config.ts`, and `tools/[slug].astro` renders a `rel="sponsored"` CTA plus a localized disclosure whenever the field is set. **Zero** of 272 EN tool entries set it, so the CTA falls back to `website` everywhere.
  - Drift: NONE (correctly pending), but worth splitting: the engineering is shipped, only the affiliate program data is missing.
  - Suggestion: consider splitting into "affiliate rendering shipped [x]" / "affiliate programs joined + links populated [ ]".
- Items "Premium directory listings", "Paid workflow library subscription", "First sponsored newsletter slots booked" — not repo-observable; consistent with §Public metrics zeros. Drift: NONE.
- Item: "Discord community (free track + paid track)" — [ ]; **no `discord` reference anywhere in `apps/web/src` or `content-strategy/`**. Correctly pending.

#### Phase 7 — Vertical 4 + scale

- Item: "Customer Success vertical shipped … config, landing page, 44 tools, 36 learn entries, 22 workflows, 19 comparisons, 4 stacks tagged, all 6 locales"
  - Status in roadmap: [x]
  - Repo reality: **66 tools, 38 learn, 22 workflows, 35 comparisons, 10 stacks** — workflows match exactly, learn is +2, but tools (+50%), comparisons (+84%) and stacks (+150%) have all grown since the 2026-06-06 edit.
  - Drift: ACHIEVEMENT (UNDERCLAIMED)
  - Suggestion: restate as "66 tools, 38 learn entries, 22 workflows, 35 comparisons, 10 stacks".
- Item: "Add DE locale (or FR — to be decided based on which language showed strongest organic signal in GA4 segment data)"
  - Status in roadmap: [ ]
  - Repo reality: de, fr **and** ja are all at full 865-page parity with EN. The §Locales table below already calls all six "Launched" — this checkbox contradicts the roadmap's own table.
  - Drift: ACHIEVEMENT — PROBABLY-DONE-NOT-CHECKED. **Repeat finding** from 2026-06-01, still unapplied.
  - Suggestion: check the box and reword — no decision is pending; all three shipped.
- Item: "6,000+ indexed pages total"
  - Status in roadmap: [ ]
  - Repo reality: **5,281 built pages** (88% of goal) in the current `dist`. Indexed ≠ built, and with no GSC access this routine cannot measure indexation at all.
  - Drift: NONE (pending, on track). At this quarter's rate (+361 EN pages ≈ +2,166 built pages), the *built* threshold is one quarter away.
- Item: "Marketing Ops vertical (still on deck)"
  - Status in roadmap: [ ]
  - Repo reality: no `marketing-ops` vertical in `content/verticals.json`; no content tagged to it. Correctly pending.
  - Drift: NONE.
- Item: "First $10K MRR milestone" — [ ]; §Public metrics shows $0. Drift: NONE.

### Locale status

| Locale | Roadmap claim | Actual EN parity |
|---|---|---|
| en | Launched, 186 tools | Canonical — 865 pages, **272 tools** |
| es | Launched, 186 tools | 865/865 = **100%** (272 tools); 0 slug diffs, 0 stale |
| pt-BR | Launched, 186 tools | 865/865 = **100%** (272 tools); 0 slug diffs, 0 stale |
| ja | Launched, 186 tools | 865/865 = **100%** (272 tools); 0 slug diffs, 0 stale |
| fr | Launched, 186 tools | 865/865 = **100%** (272 tools); 0 slug diffs, 0 stale |
| de | Launched, 186 tools | 865/865 = **100%** (272 tools); 0 slug diffs, 0 stale |

The **Status column is now correct** for all six (last quarter's biggest correction was applied). Only the tool counts are stale: 186 → 272 across the board.

### CORRECTIONS.md signal

- Open corrections this quarter: **0**. The `## Log` section is still empty — the only `###` heading in the file is the template inside §Log format.
- Recurring error classes (≥3 in quarter): **none**.
- Action: nothing to escalate. Per CONTENT_PIPELINE.md §Correction loop, no class has reached the 3-entry threshold that would trigger a pipeline/voice doc amendment. `content-strategy/corrections-review-log.md` records the same for Q1 2026. See `ooligo-corrections-review` quarterly run.
- Standing observation (second quarter running): zero reader corrections against 5,281 live pages is more plausibly a reporting-channel problem than a quality result. The only intake paths are a GitHub issue label and an email address in `CORRECTIONS.md`; neither is surfaced on the pages themselves.

### Suggested ROADMAP.md edits

- [ ] **§Public metrics — "Content pages live"**: change "612 EN canonical (tools 186 / comparisons 148 / workflows 99 / learn 161 / stacks 18); 3,758 built pages" to "865 EN canonical (tools 272 / comparisons 228 / workflows 127 / learn 191 / stacks 47); 5,281 built pages across all 6 locales at full parity".
- [ ] **§Locales table — tool counts**: 186 → 272 for all six rows. (Status column is already correct.)
- [ ] **§Public metrics — bump `*as of 2026-06-06*`** to the date these edits land. It is 87 days old today — three days from the 90-day staleness threshold.
- [ ] **Phase 2 — check "All EN content translated to ES + PT-BR"** and delete the "ES: 68 missing; pt-BR: 100 missing + 20 stale" parenthetical. *(Carried over unapplied from 2026-06-01.)*
- [ ] **Phase 7 — check "Add DE locale (or FR…)"** and reword: de, fr and ja are all launched at full parity; no decision is pending. *(Carried over unapplied from 2026-06-01.)*
- [ ] Phase 1 — bump parentheticals: tools "50 tagged" → "100 tagged (RevOps)", comparisons "100" → "228", workflows "30" → "127", learn "50" → "191", stack pages "5" → "19 (47 total)". Add MCP servers to the workflow artifact-type list.
- [ ] Phase 3 — bump "now 40 tagged" → "now 91 tagged"; note 33 workflows / 51 learn; reword "Auto-translate to ES/PT-BR" → "all 5 non-EN locales".
- [ ] Phase 4 — bump "now 53 tagged" → "now 90 tagged"; note 29 workflows / 47 learn.
- [ ] Phase 7 — restate the Customer Success line as "66 tools, 38 learn entries, 22 workflows, 35 comparisons, 10 stacks".
- [ ] Phase 5 — add an EN/Customer Success row (four EN verticals, three EN newsletter rows), and reconcile "EN/RevOps (already live)" with its unchecked box.
- [ ] Phase 6 — consider splitting the affiliate item: rendering + disclosure are shipped, the link data is not.
- [ ] §Operating principles — the "no half-finished verticals" floor (≥40 tools, ≥10 workflows, ≥30 learn, ≥1 stack) is cleared by all four verticals with the *smallest* now at 66 tools. The floor no longer discriminates; consider raising it or restating it as a launch gate rather than a standing bar.

### Open questions for the user

- **GSC properties (Phase 2)** remain the one hard blocker this routine can see. `gsc-candidates.json` has never been populated, which means the weekly harvest, the freshness routine, and topic-refill are all running without search data. Are the properties set up outside the repo, or genuinely not started?
- **What counts as a Phase-5 "newsletter track"?** One beehiiv publication with a `vertical` custom field, or five separate publications? The repo can support the first today; the second would need work. The phase can't be scored until this is defined.
- **Phase 7's "6,000+ indexed pages"** — built pages will cross 6,000 next quarter at the current rate, but indexed is a different number and nothing in the repo measures it. Should this item be restated as "6,000+ *live* pages", with indexation tracked separately once GSC is wired?
- **Corrections intake**: two quarters, zero entries, 5,281 live pages. Worth adding a per-page "report an error" link so the loop has a chance to fire?
- The catalog grew 72% this quarter with no new vertical. Marketing Ops is still the only named item left on the Phase 7 deck — is a fifth vertical the next lever, or is the 6,000-page/indexation goal better served by depth in the existing four?
