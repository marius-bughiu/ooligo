# Traffic retro

Monthly retros, appended by `ooligo-monthly-retro` on the 1st Monday of each month. The routine summarizes the **previous calendar month** from repo signals (commits, content footprint, GSC ranking signal, roadmap progress) and leaves a "Manual fill" section for GA4 / beehiiv / sponsor / community numbers the user fills in.

Append-only. The newest month sits at the bottom. Prior months are never edited by the routine.

Format and section template: see [content-strategy/monthly-retro-prompt.md](content-strategy/monthly-retro-prompt.md).

## 2026-05

*Bracketed: 2026-05-01 to 2026-05-31. Generated 2026-06-01.*

> **Launch month.** The repo was born 2026-05-02 (`chore: initial scaffold`), so this first retro covers the full build-out — engine, design system, three verticals, and six locales — not an incremental month-over-month delta. There is no prior section to compare against; the next retro (2026-06) will be the first true MoM read. Many launch-wave pages landed under pre-convention commit prefixes (`feat(...)`, `content:`, `design:`) rather than the `content(<type>):` convention, so the "pages shipped" counts below (convention-tagged commits) undercount the real catalog build. The **catalog footprint** table is the source of truth for what's live.

### Shipped

Convention-tagged authoring commits (`content(<type>):`) in the bracket: **102 canonical EN pages**.

- New pages: 102 (× 6 locales = 612 files, convention-tagged only)
  - Tools: 29 | Comparisons: 28 | Workflows: 20 | Learn: 17 | Stacks: 8
  - RevOps: 44 | Legal Ops: 21 | Recruiting: 24 | Cross: 8 (5 workflow "wave A–D" artifact-bundle commits carry no `— type/vertical` tag and are excluded from the vertical split)
- Refreshed pages: 0 (`refresh(` prefix unused this month; refresh cadence begins post-launch)
- Maintenance commits: 21 `chore:` total — of which recurring-maintenance categories:
  - topic-refill: 2 (+ 6 queue-bookkeeping commits: 5 "mark wave-N consumed" + 1 "refresh empty queue markers")
  - freshness: 0 | link-rot: 4 | internal-links: 2 | gsc-harvest: 0
  - remaining `chore:` commits are one-time launch infra (initial scaffold, AdSense scaffolding ×4, deploy bootstrap, roadmap refresh, consent-footer UI) — not recurring maintenance.

### Catalog footprint at month end

| Entity | EN | × 6 locales |
|---|---|---|
| Tools | 149 | 894 |
| Comparisons | 128 | 768 |
| Workflows | 85 | 510 |
| Learn | 127 | 762 |
| Stacks | 15 | 90 |
| **Total** | **504** | **3,024** |

Per-vertical deltas from `content-strategy/pillar-index.json` are unavailable — the file is a zero-filled stub (`generated_at: null`); no per-vertical index has been generated yet.

### Ranking signal (GSC)

Skipped — `content-strategy/gsc-candidates.json` is empty (`generated_at: null`; `refresh_candidates`, `gap_candidates`, `already_optimized` all `[]`). No Search Console data wired yet (Phase 2 "per-locale GSC properties" still open). `monthly-retro: no GSC data, ranking section skipped`.

### Roadmap

Launch month — nearly every checked item shipped within this bracket. By phase:

- **Phase 0 — Foundations:** 6/6 shipped (scaffold, Astro+i18n, schemas+validators, Cloudflare Pages + domain, GA4 `G-W6BZJ1Q021`, beehiiv).
- **Phase 1 — Engine + Flagship:** 11/11 shipped (tool/comparison/workflow/learn generators, 50 tools, 100 comparisons, 30 workflows, 50 learn, RevOps landing + 5 stacks, sitemap/hreflang/schema, newsletter live).
- **Phase 2 — Localization:** 5/7 shipped. Pending: full EN→ES/PT-BR drain (ROADMAP lists ES 68 / pt-BR 100+20 missing) and per-locale GSC properties. **Note:** on-disk locale counts are now at full 6-locale parity (see footprint), which contradicts the ROADMAP's stale "missing/seeded" framing — see Anomalies.
- **Phase 3 — Legal Ops:** 5/5 shipped (config + landing, 30+ tools, 20 workflows, 30 learn, cross-tagging, auto-translate).
- **Phase 4 — Recruiting/TA:** 5/5 shipped (config + landing, 40+ tools, 20 workflows, 30 learn, auto-translate). Phase 4 closed by the wave-5 learn commit on 2026-05-31.
- **Phase 5 — Locale-native newsletters:** 0/6 (all pending).
- **Phase 6 — Monetization:** 1/6 — AdSense in-article slots shipped ahead of plan; affiliate/premium/library/Discord/sponsors pending.
- **Phase 7 — Vertical 4 + scale:** 0/4 (all pending).
- New phase entries: none (no new phases added this month).

### Anomalies

- **Translation-only commits: 10** (`content(de)` 2, `content(es)` 1, `content(fr)` 4, `content(ja)` 3) — non-zero, flagged per spec. These predate the mid-month migration to single-session multi-locale authoring (`content-pipeline: collapse translation queues into single-session multi-locale authoring`); the architecture that makes these near-zero landed after they were committed. Expect ~0 next month.
- **ROADMAP locale/metrics data is stale.** On-disk content is at full 6-locale parity (every type has equal EN/ES/pt-BR/de/fr/ja counts — e.g. tools 149 each). But ROADMAP (`as of 2026-05-03`) still lists ja/fr/de as "Seeded (3 tools)" and "Public metrics" reports ~947 pages vs. the actual 3,024 files live. The ROADMAP snapshot was not refreshed after the late-month locale fill — worth updating, but the retro is append-only and does not edit it.
- **5 workflow commits lack the `— type/vertical` subject tag** (`content(workflows): wave A–D …` artifact-bundle batches), so they're counted in the type total (20) but not the vertical split. Convention drift, not data loss.
- **Locale parity check: clean.** Every shipped page has all 6 locale files present; no missing locales detected.

### Manual fill (user)

- **GA4** — sessions / new users / countries top 5: ____
- **beehiiv** — subscribers added / unsubscribed / clicks: ____
- **Newsletter sends + open rate**: ____
- **Discord / community signups**: ____
- **Sponsors booked**: ____
- **MRR**: ____
- **Notes / decisions for next month**: ____

## 2026-06

*Bracketed: 2026-06-01 to 2026-06-30. Generated 2026-07-06.*

> **First true month-over-month read.** The May retro was a launch-wave summary; this is the first incremental delta. Two distinct shipping modes ran this month: (1) steady single-page authoring under the `content(<type>): <slug> — <type>/<vertical>` convention, and (2) one bulk vertical drop — **Customer Success (Phase 7)** landed on 2026-06-06 as five batch commits. The single-page counts below are exact; the bulk-drop counts come from the batch commit messages and are approximate. The **catalog footprint delta** (+143 EN pages) is the source of truth for what actually landed.

### Shipped

**Single-page authoring (convention-tagged, exact):** 47 net-new EN pages (× 6 locales = 282 files).

- Tools: 19 | Comparisons: 24 | Workflows: 3 | Learn: 1 | Stacks: 0
- RevOps: 15 | Legal Ops: 13 | Recruiting: 12 | Cross: 7

**Customer Success vertical bulk drop (Phase 7, 2026-06-06, from batch commit messages):** ~98 net-new EN pages (× 6 locales ≈ 588 files).

- Tools: 30 | Comparisons: 16 | Workflows: 15 | Learn: 34 | Stacks: 3
- All tagged to the new **Customer Success** vertical (no per-page `— type/vertical` subject tag; counted here from the batch commits, not per-commit).

**Combined:** commit-implied new pages ≈ 145 EN; footprint delta = **+143 EN** (see reconciliation in Anomalies). Refreshed pages: **0** (`refresh(` cadence began in July, after this bracket).

- Maintenance commits: **13** `chore:` total — recurring categories:
  - topic-refill: 2 | freshness: 0 | link-rot: 4 | internal-links: 4 | gsc-harvest: 0
  - remaining 3: `corrections review Q1 2026`, `roadmap drift report`, `traffic retro 2026-05` (one-time/periodic, not recurring content maintenance).

### Catalog footprint at month end

| Entity | EN | × 6 locales |
|---|---|---|
| Tools | 197 | 1,182 |
| Comparisons | 168 | 1,008 |
| Workflows | 102 | 612 |
| Learn | 162 | 972 |
| Stacks | 18 | 108 |
| **Total** | **647** | **3,882** |

Delta vs. May-end (504 EN): **+143 EN** — Tools +48, Comparisons +40, Workflows +17, Learn +35, Stacks +3.

Per-vertical deltas from `content-strategy/pillar-index.json` are still unavailable — the file remains a zero-filled stub (`generated_at: null`). No per-vertical index has been generated yet.

### Ranking signal (GSC)

Skipped — `content-strategy/gsc-candidates.json` is still empty (`generated_at: null`; all three buckets `[]`). Phase 2 "per-locale GSC properties" remains open, so no Search Console data is wired. `monthly-retro: no GSC data, ranking section skipped`.

### Roadmap

- **Phase 7 — Vertical 4 + scale:** headline completion this month. **Customer Success vertical shipped (2026-06-06)** — config, landing page, and the bulk content drop above; ROADMAP line 93 now checked. Phase 7 at **1/4**; pending: Marketing Ops vertical, DE/FR locale decision, 6,000+ pages, first $10K MRR.
- **Phase 2 — Localization:** unchanged at 5/7. Pending: ES/pt-BR drain (ROADMAP line 44 still frames these as "missing," but on-disk content is at full 6-locale parity — see Anomalies) and per-locale GSC properties.
- **Phase 5 — Locale-native newsletters:** 0/6, unchanged.
- **Phase 6 — Monetization:** 1/6, unchanged (AdSense only).
- New completions vs. May: Phase 7 Customer Success vertical (the month's one phase-level ship). ROADMAP Locales table + Public-metrics table were refreshed (`docs(roadmap)` on 06-02 and 06-06).
- New phase entries: none.

### Anomalies

- **Stray `@ ` prefix on 3 authoring commit subjects** — `@ content(comparisons): smartlead-vs-instantly`, `@ content(comparisons): nooks-vs-orum`, `@ content(tools): ivo`. An anchored `^content(` matcher would silently drop these from automated counts; they are included in the counts above. Convention drift, not data loss.
- **Reconciliation gap of 2 pages.** Commit-implied new pages (47 single-page + ~98 bulk = 145) vs. footprint delta (+143) differ by 2 (Tools −1, Workflows −1). The Customer Success batch commit messages ("30 net-new tools", "14 workflows") are approximate — likely 1 tool + 1 workflow were cross-tags of existing entries rather than net-new. The footprint table is authoritative.
- **Customer Success cumulative vs. net-new mismatch.** ROADMAP line 93 reports the vertical as "44 tools, 36 learn, 22 workflows, 19 comparisons, 4 stacks tagged" — cumulative CS-tagged totals (including cross-tagged pre-existing content), which exceed the net-new bulk-drop counts (30/34/15/16/3). Expected; the difference is cross-tagging, not new pages.
- **Translation-only commits: 0** (down from 10 in May). The single-session multi-locale authoring architecture held — the near-zero expectation set last month was met.
- **ROADMAP still partially stale** (lighter than May). The Locales table + line 110 now show full parity (refreshed 06-02), but Phase 2 line 44 still reads "ES: 68 missing; pt-BR: 100 missing," and the Public-metrics table (line 116, "as of 2026-06-06") reports 612 EN / tools 186 — undercounting the June-end 647 EN / 197 tools, since content kept shipping through 06-30. The retro is append-only and does not edit ROADMAP.
- **Locale parity: clean.** At June-end every entity type is at equal counts across all 6 locales (tools 197, comparisons 168, workflows 102, learn 162, stacks 18 each). No missing locales.
- **Content-viability flag (not a data anomaly).** `pocus-vs-koala` shipped as a straight comparison on 06-13, though both sides are defunct/absorbed (Koala shut down Sep 2025; Pocus folded into Apollo Mar 2026). Flagged for content review — it is publishable only as a reframed routing page, not a live head-to-head.

### Manual fill (user)

- **GA4** — sessions / new users / countries top 5: ____
- **beehiiv** — subscribers added / unsubscribed / clicks: ____
- **Newsletter sends + open rate**: ____
- **Discord / community signups**: ____
- **Sponsors booked**: ____
- **MRR**: ____
- **Notes / decisions for next month**: ____

## 2026-07

*Bracketed: 2026-07-01 to 2026-07-31. Generated 2026-08-03.*

> **The month the engine turned to maintenance.** June was a build month (+143 EN pages, zero refreshes). July inverted: **50 net-new pages against 126 refresh commits** — the `refresh(` cadence that began in this bracket now outweighs authoring 2.5:1 by commit count. Two mechanisms drove it: a **tier-A/tier-C page refresh wave** (69 unique pages) and a **two-clock `pricing_checked` backfill** (48 stamp commits). 264 commits total, the busiest month so far. Authoring reconciles exactly for the first time: 50 convention-tagged `content(` page commits, +50 EN footprint delta, no gap.

### Shipped

**New pages (convention-tagged, exact): 50 EN** (× 6 locales = 300 files).

- Tools: 23 | Comparisons: 9 | Workflows: 6 | Learn: 7 | Stacks: 5
- RevOps: 17 | Recruiting: 15 | Legal Ops: 8 | Cross: 7 | Customer Success: 3

**Refreshed pages: 69 unique EN** (× 6 locales = 414 files), from **78 full-page `refresh(` commits** — 9 pages were refreshed twice in the month (see Anomalies).

- Tools: 52 | Stacks: 9 | Comparisons: 8
- By tier tag: tier A 31 commits | tier C 11 | untagged 36 (the early-July wave predates the tier convention)

**Pricing verification (two-clock backfill): 48 `refresh(tools): verify pricing` commits** — 47 named single-tool stamps plus one 10-tool batch, ≈57 tools stamped. These are frontmatter-only `pricing_checked` writes, not content refreshes, and are excluded from the 69 above. Queue bookkeeping recorded 30 verified / 22 requeued as C-or-B across the two named verify batches, plus a 24-claim resolution pass.

- Maintenance commits: **16** `chore:` —
  - topic-refill: 3 | freshness: 4 | link-rot: 4 | internal-links: 4 | gsc-harvest: 0 | traffic-retro: 1
- Queue bookkeeping: **62** `chore(queue):` commits (40 `[new]` claims, 19 `[refresh]` claims, 3 batch-resolution). New commit family this month; not in the retro template's maintenance taxonomy.
- Engineering: 4 `fix(`, 2 `feat(`, 2 `docs:`, 1 `content(pipeline)`, 1 `Revert`.

Internal-link passes accelerated sharply through the month: 5 → 3 → 45 → 48 links inserted per weekly pass.

### Catalog footprint at month end

| Entity | EN | × 6 locales |
|---|---|---|
| Tools | 220 | 1,320 |
| Comparisons | 177 | 1,062 |
| Workflows | 108 | 648 |
| Learn | 169 | 1,014 |
| Stacks | 23 | 138 |
| **Total** | **697** | **4,182** |

Delta vs. June-end (647 EN): **+50 EN** — Tools +23, Comparisons +9, Workflows +6, Learn +7, Stacks +5. Every type matches its `content(` commit count exactly; no reconciliation gap this month (June had one of 2).

Per-vertical entity counts remain unavailable — `content-strategy/pillar-index.json` is still a zero-filled stub (`generated_at: null`), third consecutive month.

### Ranking signal (GSC)

Skipped — `content-strategy/gsc-candidates.json` is still empty (`generated_at: null`; `refresh_candidates`, `gap_candidates`, `already_optimized` all `[]`). Phase 2 "per-locale Google Search Console properties" remains unchecked, so no Search Console data is wired. `monthly-retro: no GSC data, ranking section skipped`.

Third month with no ranking signal. Refresh prioritization this month therefore ran entirely off internal SLA clocks (freshness sweep + `pricing_checked`), not off impressions or position — the 69 pages refreshed were selected without any evidence about which pages actually rank.

### Roadmap

- **`ROADMAP.md` was not touched in July.** Last edit is 2026-06-06 (`docs(roadmap): mark Customer Success vertical shipped`). No `- [x]` flipped in this bracket.
- Phase 2 — Localization: 5/7, unchanged. Pending: ES/pt-BR drain (line 44, stale — on-disk parity is clean), per-locale GSC properties.
- Phase 5 — Locale-native newsletters: 0/6, unchanged.
- Phase 6 — Monetization: 1/6 checked, but **real progress shipped without a checkbox** — `feat(ads): direct-sold image slots + /advertise/ page` (07-25) added a direct-sold inventory path alongside AdSense. No ROADMAP line covers direct-sold ads; the phase understates what is live.
- Phase 7 — Vertical 4 + scale: 1/5, unchanged. Pending: Marketing Ops vertical, DE/FR locale decision, 6,000+ pages, first $10K MRR. Built-page count is now 4,182 against the 6,000 target (was 3,882).
- New phase entries: none.

### Anomalies

- **`plugin-admob-maui-article.md` committed to the repo root** (07-26, `docs: add Plugin.AdMob .NET MAUI monetization article`). A 146-line article about a .NET MAUI AdMob SDK — unrelated to the AI-ops catalog, not under `content/`, not localized, not in any entity index. Most likely landed in the wrong repo. Flagged, not removed (the retro does not edit the rest of the tree).
- **A tier-A refresh was reverted with no stated reason.** `refresh(tools): beamery — tier A, tool/recruiting` landed 07-26 03:16 inside the 16-commit tier-A batch and was reverted the same day; the revert body is the bare `This reverts commit …` boilerplate. The page therefore carries pre-refresh content while the batch's SLA stamp may have survived — worth a manual check.
- **Freshness SLA spiked to 232 in one week.** Weekly sweeps ran 30 → 9 → 1 → **232 entries past SLA (C:40 B:0 A:192)** on 07-26. The 192 tier-A entries are the two-clock `pricing_checked` backfill coming due en masse, not 192 rotten pages. Expect the tier-A clock to keep firing in cohorts unless the stamps get staggered.
- **Link rot fixed itself, once.** Persistent dead links held at 34 for three weekly sweeps (07-05, 07-12, 07-19), then dropped to 3 on 07-26 — the effect of `fix(tools): repoint 29 dead pricing_url/website links` (07-25). Three weeks of a known-static 34 sat unactioned before the batch fix; the sweep detects but does not repair.
- **Supply-shortage false alarm (fixed).** The topic queue defined "available" as "contains no `→`", but spec prose legitimately uses arrows. 97 valid items were invisible to every lane, and the queue read as 22 items / 3 days of runway when it actually held ~174. Fixed 07-25; the queue now reports 269 available, ~5.5 weeks at 49/week. Noted because the failure mode is indistinguishable from a real shortage and argues for exactly the wrong response — padding a healthy queue with filler.
- **9 pages refreshed twice in one month** — `amplemarket`, `apollo`, `blackboiler`, `chatgpt`, `claude`, `clay`, `cognism`, `default`, `ai-augmented-recruiting-stack`. Each got an untagged early-July refresh and then a tier-A refresh in the 07-26 batch. Duplicate spend, not data loss; the tier wave did not check for a recent prior refresh.
- **`content(` prefix used for an infra commit.** `content(pipeline): lane-split authoring, tier refresh, raise supply floor` (07-25) is a pipeline change, not a page. Excluded from the 50 above; a naive `^content\(` matcher would count it as a shipped page.
- **Lifecycle corrections landed as `fix(`, not `refresh(`** — `fix(tools): retire casetext, unpublish pylon + contractworks pricing` (07-25). Product-death handling is currently invisible to refresh-cadence metrics.
- **ROADMAP is now two months stale.** The Public-metrics table still reads "612 EN canonical (tools 186 …); 3,758 built pages … *as of 2026-06-06*" against an actual 697 EN / 220 tools / 4,182 built, and the Locales table lists 186 tools per locale against 220. The retro is append-only and does not edit ROADMAP.
- **Translation-only commits: 0** (June: 0, May: 10). The single-session multi-locale architecture continues to hold.
- **Locale parity: clean.** At month end all six locales are at identical counts for every entity type (tools 220, comparisons 177, workflows 108, learn 169, stacks 23). No missing locales among the 50 pages shipped.

### Manual fill (user)

- **GA4** — sessions / new users / countries top 5: ____
- **beehiiv** — subscribers added / unsubscribed / clicks: ____
- **Newsletter sends + open rate**: ____
- **Discord / community signups**: ____
- **Sponsors booked**: ____
- **MRR**: ____
- **Notes / decisions for next month**: ____

## 2026-08

*Bracketed: 2026-08-01 to 2026-08-31. Generated 2026-09-07.*

> **The month the engine doubled.** July was the maintenance inversion; August ran both lanes flat out. **517 commits** (July: 264) producing **165 net-new EN pages against 72 full-page refreshes** — authoring reclaimed the lead 2.3:1 by page count, and the net-new figure is triple July's 50. Footprint crossed **862 EN / 5,172 built pages**, putting the Phase 7 "6,000+ pages" target within one month's reach. Authoring reconciles exactly for the second month running. The month's real signal is what is *missing*: **zero `feat(`, zero `fix(`, zero `docs:` commits** — no product or engineering work shipped at all, and GSC is dark for the fourth consecutive month.

### Shipped

**New pages (convention-tagged, exact): 165 EN** (× 6 locales = 990 files).

- Tools: 49 | Comparisons: 51 | Workflows: 19 | Learn: 22 | Stacks: 24
- Legal Ops: 65 | RevOps: 41 | Customer Success: 27 | Recruiting: 22 | Cross: 10

Legal Ops was the month's centre of gravity (39% of new pages). Customer Success — shipped as a vertical in June — took 27 pages, its first substantial build-out. Stacks nearly doubled as an entity type (+24 against a 23-page base).

**Refreshed pages: 71 unique EN** (× 6 locales = 426 files), from **72 full-page `refresh(` commits** — 1 page refreshed twice (see Anomalies).

- Tools: 36 | Comparisons: 22 | Stacks: 9 | Learn: 5
- By tier tag: tier C 66 | tier B 5 | tier A 1 | untagged 0 — the tier convention held for every commit this month (July had 36 untagged)
- By vertical: RevOps 31 | Legal Ops 19 | Recruiting 17 | Customer Success 5

**Pricing verification: 4 `refresh(tools): verify pricing` tier-A batch commits, ~50 tools stamped** (batches of 4, 21, 11, 14). Frontmatter-only `pricing_checked` writes, excluded from the 72 above. Down sharply from July's 48 commits / ~57 tools — the two-clock backfill has drained and the tier-A clock is now firing in small cohorts rather than en masse, which is what the July retro asked for.

- Maintenance commits: **18** `chore:` —
  - topic-refill: 3 | freshness: 4 | link-rot: 5 | internal-links: 5 | gsc-harvest: 0 | traffic-retro: 1
- Queue bookkeeping: **255** `chore(queue):` commits (169 `[new]` claims, 77 `[refresh]` claims, 9 corrections/notes). Up 4× from July's 62.
- Engineering: **1** `style(tools)`, **1** `chore(strategy)`. **Zero `feat(`, `fix(`, `docs:`, or `Revert`.**

Internal-link passes decayed steadily through the month: 50 → 50 → 50 → 39 → **14** links inserted per weekly pass. The first three hit an apparent 50-link cap; the last two fell below it. July's trajectory was the opposite (5 → 3 → 45 → 48). Read as saturation, not failure — but worth confirming the pass is out of opportunities rather than out of budget.

### Catalog footprint at month end

| Entity | EN | × 6 locales |
|---|---|---|
| Tools | 269 | 1,614 |
| Comparisons | 228 | 1,368 |
| Workflows | 127 | 762 |
| Learn | 191 | 1,146 |
| Stacks | 47 | 282 |
| **Total** | **862** | **5,172** |

Delta vs. July-end (697 EN): **+165 EN** — Tools +49, Comparisons +51, Workflows +19, Learn +22, Stacks +24. Every type matches its `content(` commit count exactly once the single non-convention commit is excluded; no reconciliation gap, second consecutive clean month.

Per-vertical entity counts remain unavailable — `content-strategy/pillar-index.json` is still a zero-filled stub (`generated_at: null`), **fourth consecutive month**. It also still declares only three verticals (`revops`, `legal-ops`, `recruiting`); Customer Success shipped in June and took 27 pages this month with no key in the index at all.

### Ranking signal (GSC)

Skipped — `content-strategy/gsc-candidates.json` is unchanged and empty (`generated_at: null`; `refresh_candidates`, `gap_candidates`, `already_optimized` all `[]`). Phase 2 "per-locale Google Search Console properties" remains unchecked. `monthly-retro: no GSC data, ranking section skipped`.

**Fourth consecutive month with no ranking signal**, and the cost compounds: 71 pages were refreshed this month and 236 over the last two months, all selected by internal SLA clocks (freshness cascade + `pricing_checked`) with zero evidence about which pages rank, which queries they win, or whether any of them draw impressions. `gsc-harvest` has now run 0 times in two months. At 862 EN pages the catalog is large enough that untargeted refresh is a materially expensive default.

### Roadmap

- **`ROADMAP.md` was not touched in August.** Last edit remains 2026-06-06 (`docs(roadmap): mark Customer Success vertical shipped`). No `- [x]` flipped in this bracket. Third consecutive untouched month.
- Phase 2 — Localization: 5/7, unchanged. Pending: ES/pt-BR drain (stale — on-disk parity is clean at 862/locale), per-locale GSC properties.
- Phase 5 — Locale-native newsletters: 0/6, unchanged. Untouched since creation.
- Phase 6 — Monetization: 1/6, unchanged. July's direct-sold ad work still has no covering checkbox.
- Phase 7 — Vertical 4 + scale: 1/5, unchanged. Pending: Marketing Ops vertical, DE/FR locale decision, 6,000+ pages, first $10K MRR. **Built-page count is now 5,172 against the 6,000 target** (was 4,182) — at August's +990 built-pages/month rate the page target clears in September.
- New phase entries: none.
- Out of bracket but relevant: a quarterly `chore: roadmap drift report 2026-09-01` landed on Sept 1, appending to `ROADMAP_DRIFT.md`. That routine is designed to surface exactly the staleness flagged below; whether its suggestions get applied is next month's question.

### Anomalies

- **Zero engineering commits all month.** No `feat(`, no `fix(`, no `docs:`, no `Revert` in 517 commits. The content engine ran unattended and the product did not change. This is the single largest structural fact about August: the site shipped 165 pages and nothing else. Notable against July, which carried 4 `fix(`, 2 `feat(`, 2 `docs:` — including the direct-sold ads feature and the 29-dead-link repair batch.
- **Freshness sweep missed the 08-30 slot.** Weekly sweeps ran 08-02, 08-09, 08-16, 08-23 — then nothing. Link-rot and internal-link both ran their full five passes including 08-30. A single lane skipped one week; no stated reason in the log. SLA numbers themselves were healthy and low all month (4 → 1 → 2 → 5 entries past SLA, versus July's 232 spike), so the backfill genuinely cleared.
- **Persistent dead links crept back up.** Link-rot sweeps ran 5/3/3/5/**6** persistent across the month, ending higher than they started, with 6 dead and 2 flaky on 08-30. July's lesson — the sweep detects but never repairs, and needs a `fix(` batch to actually clear — went unlearned, because no `fix(` commits shipped at all (see above). Small numbers, but the ratchet is pointed the wrong way.
- **`plugin-admob-maui-article.md` is still in the repo root**, second month flagged. A .NET MAUI AdMob article, unrelated to the AI-ops catalog, not under `content/`, not localized, in no entity index. Landed 2026-07-26 and untouched since. The retro does not edit the rest of the tree.
- **Three pages were claimed twice.** `mcp-server-zoominfo-gtm-revops` (claimed 08-01, shipped 08-07), `mcp-server-leandata-routing` (claimed 08-02, shipped 08-09), and `waterfall-enrichment` (claimed 08-05, shipped 08-07) each took an initial claim that produced nothing, then a second claim days later that shipped. This is the documented 2-hour stale-claim reclaim working as intended, not data loss — it explains the 169 `[new]` claims against 165 shipped pages. Worth watching only if the abandonment rate rises.
- **One `content(` commit off-convention.** `content(comparisons): qualify aiR bundling on microsoft-purview-ediscovery-vs-relativity` is a correction to an existing page, not a new one. Excluded from the 165; a naive `^content\(` matcher would overcount comparisons by 1. Same failure mode as July's `content(pipeline)` commit — the prefix is still doing double duty for page-creation and page-editing.
- **1 page refreshed twice** — `ai-augmented-recruiting-stack` (also a July double-refresh). Duplicate spend on the same page for the second month running; the cascade trigger is not checking recent refresh history. Down from 9 double-refreshes in July, so the tier wave that caused most of them was a one-off.
- **`pillar-index.json` has no Customer Success key.** The vertical shipped in June, took 27 pages in August, and the per-vertical index does not model it. Even once the stub is populated it will under-report the catalog.
- **ROADMAP public metrics are now three months stale and diverging fast.** The table reads "612 EN canonical (tools 186 / comparisons 148 / workflows 99 / learn 161 / stacks 18); 3,758 built pages … *as of 2026-06-06*" against an actual **862 EN / 269 tools / 5,172 built** — a 41% understatement of EN pages and 38% of built pages. The Locales table lists 186 tools per locale against 269. The retro is append-only and does not edit ROADMAP.
- **Translation-only commits: 0** (July: 0, June: 0, May: 10). The single-session multi-locale architecture continues to hold at 3× the throughput.
- **Locale parity: clean.** At month end all six locales are at identical counts for every entity type (tools 269, comparisons 228, workflows 127, learn 191, stacks 47). No missing locales among the 165 pages shipped.
- **Queue health: 260 available items** (206 new, 54 refresh) against a 100-item floor, 1 active claim, 107 skipped, 646 published. Three refills added +119/+20/+48; a `chore(strategy)` commit on 08-18 introduced a per-section floor for the refill. At August's ~38 new pages/week the queue holds ~5.4 weeks of runway — steady against July's 5.5.

### Manual fill (user)

- **GA4** — sessions / new users / countries top 5: ____
- **beehiiv** — subscribers added / unsubscribed / clicks: ____
- **Newsletter sends + open rate**: ____
- **Discord / community signups**: ____
- **Sponsors booked**: ____
- **MRR**: ____
- **Notes / decisions for next month**: ____

## 2026-09

*Bracketed: 2026-09-01 to 2026-09-30. Generated 2026-10-05.*

> **The month the catalog became a tool directory.** **495 commits** (August: 517) shipped **201 net-new EN pages**, the most of any month so far and +22% on August's 165. But **190 of the 201 (95%) were tool entries**: 5 comparisons, 6 stacks, and **zero workflows and zero learn entries**. Full-page refreshes fell by more than half (72 → 32). The footprint reached **1,063 EN / 6,378 built pages**, past the Phase 7 "6,000+ pages" target in built-page terms, though no one can say how many are *indexed* because GSC is dark for the fifth month running. For the second month in a row there were **zero `feat(`, `fix(` or `docs:` commits**.

### Shipped

**New pages (convention-tagged, exact): 201 EN** (× 6 locales = 1,206 files).

- Tools: 190 | Comparisons: 5 | Workflows: 0 | Learn: 0 | Stacks: 6
- RevOps: 55 | Legal Ops: 42 | Cross: 41 | Recruiting: 33 | Customer Success: 30

The vertical spread was the most even of any month so far: no vertical exceeded 27%, against Legal Ops' 39% in August. The entity spread went the other way (see Anomalies). Every comparison shipped this month was Legal Ops. Output held at a near-constant **7 new pages/day** on 27 of 30 days (4–6 on the other three), so the daily lane is running at a fixed cadence rather than in bursts.

**Refreshed pages: 32 unique EN** (× 6 locales = 192 files) from **32 full-page `refresh(` commits**, down from 72 in August.

- Tools: 26 | Stacks: 6 | Comparisons: 0 | Learn: 0
- By tier tag: tier C 32 | tier B 0 | tier A 0 (full-page) | untagged 0. The tier convention held for the second month running.
- By vertical: Recruiting 17 | RevOps 10 | Legal Ops 4 | Customer Success 1. Recruiting includes 5 recruiting stacks; RevOps includes `ai-agent-ops-stack`.

**Pricing verification: 1 tier-A batch (25 tools claimed), 8 stamped.** The `refresh(tools): verify pricing — tier A, 25 tools` commit on 09-27 touches only `topic-queue.md`. Its body records 8 tools verified unchanged and stamped in separate frontmatter-only commits (1mind, agiloft, avature, aviso, calendly, cognism, contractworks, decagon) and **17 escalated and requeued**: 16 as refresh:C (mostly stale `mcp_available` flags, plus pricing restructures at 11x, blackboiler, cursor and default, and a repositioning at arrows) and crossbeam as refresh:B. The 9 commits are excluded from the 32 above. A **68% escalation rate** means a 60-day pricing check now usually finds something wrong. That is a useful finding about how fast this market moves.

- Maintenance commits: **18** `chore:`
  - topic-refill: 4 | freshness: 3 | link-rot: 4 | internal-links: 4 | gsc-harvest: 0 | traffic-retro: 1 | roadmap-drift: 1 | corrections-review: 1
- Queue bookkeeping: **235** `chore(queue):` commits (203 `[new]` claims, 31 `[refresh]` claims, 1 refresh-batch claim).
- Engineering: **zero** `feat(`, `fix(`, `docs:`, `style(`, or `Revert`. The only non-`content/` files touched all month were `content-strategy/*` (queue, link-rot log, link-audit queue, corrections log), `TRAFFIC_RETRO.md`, and `ROADMAP_DRIFT.md`.

The internal-link pass has run dry: **0 → 1 → 2 → 2** links inserted per weekly pass (August: 50 → 50 → 50 → 39 → 14). This is August's saturation reading confirmed. With 190 new tool pages arriving, the pass finding only 5 links all month suggests it is out of *candidates* (its matcher may not target new tool slugs), not that the graph is complete. Worth checking (see Anomalies).

### Catalog footprint at month end

| Entity | EN | × 6 locales |
|---|---|---|
| Tools | 459 | 2,754 |
| Comparisons | 233 | 1,398 |
| Workflows | 127 | 762 |
| Learn | 191 | 1,146 |
| Stacks | 53 | 318 |
| **Total** | **1,063** | **6,378** |

Delta vs. August-end (862 EN): **+201 EN**, made up of Tools +190, Comparisons +5, Workflows +0, Learn +0, Stacks +6. Every type matches its `content(` commit count exactly, the third clean reconciliation in a row. Tools are now **43% of the EN catalog** (August-end: 31%; June-end: 30%).

Per-vertical entity counts are still unavailable. `content-strategy/pillar-index.json` remains a zero-filled stub (`generated_at: null`, last touched 2026-05-17) for the **fifth consecutive month**, and it still has no Customer Success key.

### Ranking signal (GSC)

Skipped. `content-strategy/gsc-candidates.json` is unchanged and empty (`generated_at: null`; all three buckets `[]`). Phase 2 "per-locale Google Search Console properties" remains unchecked. `monthly-retro: no GSC data, ranking section skipped`.

**Fifth consecutive month with no ranking signal.** The catalog has grown from 612 to 1,063 EN pages across those five months with zero evidence about which pages are indexed, rank, or draw impressions. This now directly blocks a roadmap call: "6,000+ **indexed** pages" cannot be checked off without Search Console, even though the built count cleared it.

### Roadmap

- **`ROADMAP.md` was not touched in September.** It was last edited 2026-06-06, and no `- [x]` was flipped in this bracket. **Fourth consecutive untouched month.** The quarterly `chore: roadmap drift report 2026-09-01` landed in `ROADMAP_DRIFT.md` on day one, but none of its suggestions reached ROADMAP during the month.
- Phase 2 (Localization): 5/7, unchanged. Pending: the ES/pt-BR drain (stale: on-disk parity is clean at 1,063/locale) and per-locale GSC properties.
- Phase 5 (Locale-native newsletters): 0/6, unchanged.
- Phase 6 (Monetization): 1/6, unchanged.
- Phase 7 (Vertical 4 + scale): 1/5, unchanged. **The built-page count (6,378) passed the 6,000 target this month**; indexed count is unknown (see GSC). Still pending: Marketing Ops vertical, DE/FR locale decision, first $10K MRR. Note that DE and FR content directories already exist with full parity, so the "add DE (or FR)" checkbox looks shipped in practice. That is a ROADMAP accuracy question for the user, not something this retro changes.
- New phase entries: none.

### Anomalies

- **Entity mix collapsed to tools.** 190/201 new pages were tools, with 0 workflows and 0 learn, even though the month-end queue held **43 comparisons, 30 workflows and 24 stacks available** alongside 55 tools. Learn has **zero** available queue items. Either the refills stopped generating learn topics or the per-section floor added on 08-18 does not cover learn. The pattern points at claim ordering or refill composition rather than supply. Workflows (the "real, tested artifacts" lane and the planned paid-library inventory) have now been flat at 127 for the whole month.
- **Zero engineering commits, second month running.** No `feat(`, `fix(`, `docs:` in 495 commits. The product has not changed since July.
- **Freshness sweep missed the 09-20 slot**, the second skipped week in two months (August missed 08-30). Sweeps ran 09-06 (5 past SLA), 09-13 (1), then 09-27 (**42, all tier A**). Out of bracket, the 10-04 sweep reported **70, all tier A**. The tier-A pricing clock is now outrunning the lane: one batch of 25 per month with 68% escalation will not clear a backlog growing by ~30/week.
- **Tier-A escalations feed the refresh:C backlog.** The 17 requeued tools join a refresh queue that ended the month with **82 available items (59 C, 6 B, 17 A)** against only 32 full-page refreshes shipped all month. At September's refresh rate that is ~11 weeks of backlog (August-end: 54).
- **Dead links are not being repaired.** Link-rot sweeps reported persistent dead links at 6 → 7 → 7 → 7 (dead 7/5/5/7; flaky spiked to 15 on 09-06), and 10-04 shows 8 dead / 7 persistent. This is the third month flagged. The sweep detects but never fixes, and with zero `fix(` commits nothing closes the loop.
- **Internal-link pass is near zero while 190 new pages landed.** 5 links in 4 passes. If the pass only considers entries already in `link-audit-queue.md`, new tool pages may never enter it. Worth a check of the internal-link prompt's candidate selection.
- **`ai-augmented-recruiting-stack` refreshed again**, the third consecutive month (July ×2, August ×2, September ×1). The cascade trigger still does not respect recent refresh history for this page.
- **`hackerrank` refreshed under `tool/revops`.** HackerRank is a technical-hiring tool. Either the commit subject or the page's vertical tag is wrong; it was not verified here.
- **Claim/ship mismatches all explained.** 203 `[new]` claims against 201 shipped: `alex-ai` was claimed then skipped as a duplicate of the already-published `apriora` (rebrand). `people-ai` shipped as `backstory` and `dealfront` as `leadfeeder` per the queue's slug overrides. No double-claims this month (August: 3).
- **`plugin-admob-maui-article.md` is still in the repo root**, the third month flagged. It is an unrelated .NET MAUI article (2026-07-26), outside `content/`, unlocalized, and untouched since.
- **ROADMAP public metrics are now four months stale.** They read "612 EN … 3,758 built pages *as of 2026-06-06*" against actual **1,063 EN / 6,378 built**, understating EN pages by 42%. This retro is append-only and does not edit ROADMAP.
- **Translation-only commits: 0** (August: 0, July: 0, June: 0).
- **Locale parity: clean.** At month end all six locales (de, en, es, fr, ja, pt-BR) have identical counts for every entity type (tools 459, comparisons 233, workflows 127, learn 191, stacks 53).
- **Queue health: 235 available items** (153 new, 82 refresh) against a 100-item floor, with 2 active claims, 140 skipped and 848 published. Four refills added +55/+44/+38/+36 = 173 items, and reported depth drifted 244 → 229 → 225 → 224. At September's ~47 new pages/week, the 153 new items are **~3.3 weeks of runway** (August-end: ~5.4). Each refill adds less while consumption has risen, so the buffer is thinning.
- Tooling note for future retros: `git log --since="YYYY-MM-DDTHH:MM:SS"` returned a wrong window in this repo. This retro bracketed on local author date (`--date=format-local`) instead.

### Manual fill (user)

- **GA4** — sessions / new users / countries top 5: ____
- **beehiiv** — subscribers added / unsubscribed / clicks: ____
- **Newsletter sends + open rate**: ____
- **Discord / community signups**: ____
- **Sponsors booked**: ____
- **MRR**: ____
- **Notes / decisions for next month**: ____
