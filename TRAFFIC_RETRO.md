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
