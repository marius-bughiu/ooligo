## The diagnosis

New content did not stop because of drift or laziness. It stopped because of arithmetic, enforced by one line of prompt text.

**Capacity.** Two authoring slots/day plus one weekly evergreen slot = 365 + 365 + 52 = **782 page-authorings/year**, assuming a 100% success rate. A "page-authoring" is expensive by definition: `CONTENT_PIPELINE.md:359` says *"Refresh = re-author the EN body and all five translated variants from current sources in the same session"* — so a 60-day price drift on one number costs exactly the same as writing a brand-new page. There is no cheap tier.

**Demand.** Against measured counts (tools 198, comparisons 174, workflows 104, learn 164, stacks 18 = 658 EN entries), the documented SLAs demand: tools 198 × 365/60 = 1,204.5; comparisons 174 × 365/180 = 352.8; workflows 104 × 365/180 = 210.9; learn 174.0; stacks 523.2 (own 120d SLA is only 54.8, but the cascade-on-any-constituent-tool-refresh rule dominates it ~10×; measured 86 tool-slots across 18 stacks, `claude` alone sits in 7). **Total 2,465 page-authorings/year = 47.4/week.**

**2,465 demanded vs 782 available = 3.15× insolvent.** New-content throughput at steady state is not zero, it is −1,683/year. Strip the cascade rule entirely *and* use the loosest 120d tools SLA — the most generous defensible reading — and demand is still 1,395/yr = 1.78× capacity. There is no parameterization in which this system has positive new-content throughput.

**The trigger.** `content-strategy/daily-prompt.md:38` — *"Prefer `refresh:` items … Take the first unconsumed `refresh:` item if any exist."* That is a strict preemptive priority, not a ratio. Repeated verbatim at `ooligo-author-am/SKILL.md:18` and `ooligo-author-pm/SKILL.md:18`. Any non-empty refresh block starves new content 100%. W28 new=2, W29 new=0, W30 new=0 is the predicted output, not an anomaly.

**Two amplifiers.** (a) `freshness-prompt.md:19` — *"Date field: all types use `last_updated`"* — one shared clock, so the 60d pricing breach resets the body clock too and the 120d body SLA is unreachable dead text; that doubles tools demand from 602 to 1,204. (b) 58% of the catalog shares one authoring window: 94 tools dated 2026-05-02/03 cross 120d **on 2026-08-30**, 100 comparisons ~2026-10-29, 70 workflows ~2026-10-30. Today's zero is the *trough* before the wave, not the steady state.

**Inverting it:** at 782 slots/yr the sustainable catalog is ~209 entries. The catalog is 658. Every new page makes it worse — new content is self-extinguishing.

**And the correction nobody wants to hear:** you have no evidence any of this traffics. GA4 is installed (`G-W6BZJ1Q021`) but the sessions line in `TRAFFIC_RETRO.md` is literally blank. `content-strategy/gsc-candidates.json` is 153 bytes with `generated_at: null`. Both monthly retros say "Ranking signal (GSC): Skipped." So the speed problem is real and the arithmetic above is real, but *whether speed is the binding constraint* is unmeasured. Wiring Search Console is Stage 0 and it is a gate, not a nice-to-have.

---

## What changes

Ordered by throughput-per-unit-effort. Workstreams 1–4 are cheap and non-negotiable. 5–7 are the arithmetic fix. 8–10 are the volume.

### 1. Stop the bleeding: three edits totalling ~40 lines

**1a. Scope `check:vocab` to named files.**
`packages/pipeline/src/validators/check-vocab.ts` — in `main()`, when `process.argv.slice(2)` is non-empty, resolve those args as paths and scan only them; exit on their findings alone. Empty argv keeps today's whole-tree walk. **~10 lines.**

Why: the repo is globally red at 247 findings across 172 legacy files, so `daily-prompt.md:85`'s *"Both must pass"* is impossible as written and the convention has degraded to eyeballing a 247-line report for your own six paths. That degrades to zero at 3 pages/run. Ten lines converts an unenforceable rule into a binary gate. **Effect: makes every other gate in this plan enforceable.**

**1b. Claim the queue item BEFORE research, as its own pushed commit.**
`content-strategy/daily-prompt.md` §"Pick the next item" — before any research, append `→ claimed: <slot-id> <ISO8601>` to the chosen line, commit *only* `topic-queue.md` with `chore(queue): claim <slug> [<slot-id>]`, and push. Non-fast-forward rejection → `git fetch origin main && git rebase origin/main`, re-read the queue, re-pick. A `→ claimed:` older than 6 hours with no `→ slug:` is stale and re-takeable. Add `→ skip: <reason>` so a dead vendor is recorded permanently.

Why: claim-after-authoring is *already* producing duplicates at 2 slots/day — `topic-queue.md` carries two `→ slug:` markers each for `ai-augmented-recruiting-stack`, `ai-sdr-stack`, and `gtm-engineering-stack`. Three full 6-locale slots spent re-authoring pages that already existed, serially, with zero concurrency involved. Git is the lock; the loser rebases and moves on. **Effect: recovers ~3 slots already lost; prerequisite for any parallelism.**

**1c. Replace the bare push with rebase-retry, and ban force.**
`content-strategy/daily-prompt.md` §"Commit and push" — replace *"Push to origin main directly"* with `git fetch origin main && git rebase origin/main && git push origin main`, retried up to 5 times with backoff, and an explicit instruction to **abort the slot leaving the queue item unclaimed rather than force anything**. Narrow `.claude/settings.local.json` from `Bash(git push *)` to `Bash(git push origin main)`. Enable a GitHub ruleset on `main` blocking force-push and deletion (costs nothing in a no-PR solo workflow).

Why: commit rate goes from ~11/wk to ~80/wk. Today an agent told to "complete end-to-end" that hits a non-fast-forward has no documented recovery, and the allow-list permits `--force` against an unprotected branch.

### 2. `check:page` — the gate that makes batching safe

**New:** `packages/pipeline/src/validators/check-page.ts`, wired as `npm run check:page -- <entity>/<slug>` in `packages/pipeline/package.json` and root `package.json`. Uses gray-matter (already a dependency). Runs in seconds. Asserts on **one page**:

- Frontmatter parses and matches the type's shape in `apps/web/src/content.config.ts`
- Word floor by type/subtype per `CONTENT_PIPELINE.md` (tools 400, comparisons 600 pairwise / 700 roundup, learn 600 definition / 800 how-to, stacks 700, workflows 800)
- A dossier exists at `content-strategy/research/<entity>/<slug>.md`
- **For workflows:** `apps/web/public/artifacts/<slug>/` exists, is non-trivial for its `artifact_type`, and **every `/artifacts/...` path in the body resolves on disk**
- `check:vocab` scoped to just these files (needs 1a)
- `canonical_slug` unique across `content/**/en/*.mdx`; `category` already exists in the catalog (no silent taxonomy growth); every `integrations[]` slug resolves
- No prose `<digit`, no `null` in string-typed fields — the two MDX/schema classes only a 6.5-minute build catches today
- **Pairwise contest test:** a comparison must place both tools in the same category AND share ≥1 integration or job-to-be-done. `apollo-vs-default.mdx` opens by conceding the two *"overlap almost zero"* — that page fails this test and should never have shipped.

**Ship it in report-only mode first.** The critique is right and this is load-bearing: ~241 EN entries (37% of the catalog) are below their own word floors today — relativity 209 words, zapier 215, slack 225, notion 228, logikcull 210, juro 220. 13 of 104 workflows link to `/artifacts/` paths that 404, 11 from the 2026-06-06 batch, unnoticed for 7 weeks. So: **blocking for new pages immediately** (it only constrains work not yet done); legacy failures go to a remediation lane with its own budget (workstream 9).

**Per-page abort replaces whole-slot abort.** `daily-prompt.md:18` currently says *"If any one locale fails validation, abort the whole slot."* Replace with: a failing page's files are discarded and its queue item left unclaimed; the rest of the batch commits. One commit per page. This is a strict improvement at *any* throughput.

### 3. Kill the fabricated Review schema and ship an AI disclosure

**`apps/web/src/pages/[locale]/tools/[slug].astro:182-194`** currently emits, on 1,188 URLs:

```
{"@type":"Review", reviewRating:{ratingValue: data.ooligo_score, bestRating:10},
 author:{"@type":"Person", name: SITE_AUTHOR_NAME}, datePublished: data.last_updated}
```

`SITE_AUTHOR_NAME` is "Marius Bughiu". The score is LLM-invented — `evergreen-prompt.md:29` gives only `ooligo_score: 8.5 # 0-10` with no rubric — and the distribution proves it: 198 tools clustered 7.0–8.7, with 23 at exactly 7.6 and 22 at exactly 8.0. This is fabricated review markup attributed to a named human, on ad-monetized pages, with no AI-authorship disclosure anywhere on the site (`grep` across `apps/web/src`, `about.astro`, `legalStrings.ts` for AI/LLM/generated returns zero hits).

**Three edits, do them today:**
1. Delete the `review` object from the `SoftwareApplication` JSON-LD. Keep `offers`. Keep the score as an on-page UI element if you want it, out of structured data.
2. Either give `ooligo_score` a published, reproducible rubric over machine-checkable inputs (pricing transparency, API/MCP availability, integration count, catalog centrality) and label it a **computed index**, or remove it. The 7.0–8.7 clustering means it carries no discriminating information anyway.
3. Add AI-authorship disclosure to `about.astro` and change the per-page byline: state the model, the absence of a human review gate, and the corrections path. Add a visible per-page "report an error" link — a GitHub issue label is invisible to an ops-leader audience.

Why this is workstream 3 and not workstream 12: it is the one policy exposure that is **machine-detectable today**, independent of any editorial judgement, and every plan multiplies it 5×. Transparent AI authorship with a working corrections loop is a materially different posture from an undisclosed human byline over invented ratings.

### 4. Two clocks, and the frontmatter sync script

**`apps/web/src/content.config.ts`** — add to the tools schema alongside `last_updated`:
```
pricing_checked: z.string().optional()
vendor_status: z.enum(["live","acquired","sunset"]).optional()
material_change_at: z.string().optional()
en_verified: z.string().optional()
superseded_by: SLUG.optional()
```
Add `material_change_at`, `superseded_by`, `en_verified` to comparisons/workflows/learn/stacks. Redefine `last_updated` in comments as **the body re-author date only**.

**The rule, stated once and enforced everywhere:** `pricing_checked` moves on a successful price verification. `last_updated` moves **only when prose changes**. A verification that writes nothing never touches `last_updated`. Render both on-page: *"pricing verified 3 days ago · analysis written 2026-05-02"*. This turns the cheap path into a credibility feature instead of a concealment, and it keeps `datePublished` (if you retain any date in structured data) honest.

I am siding hard with the critique against Design 3's Tier A here: bumping `last_updated` on a price-only re-verify is a freshness misrepresentation *and* it destroys your own instrumentation — once the field is decoupled from content change, no query can distinguish a current page from a date-bumped one and the staleness backlog goes invisible.

**New:** `packages/pipeline/src/translation/sync-frontmatter.ts`, wired as `npm run sync:frontmatter -- <entity>/<slug>`. Copies the structural frontmatter fields enumerated at `locale-register.md:9` from EN to all 5 locale files, leaving `locale`, `source_sha256`, and the body untouched.

This closes a hole every EN-first design creates and none of them noticed: `hashEnBody` hashes `parsed.content` — **the body only, never frontmatter**. So a frontmatter-only price edit doesn't change the hash, the translation lane never sees it, and the locale files keep the stale price forever.

### 5. Refresh becomes three tiers, keyed on liveness — not price

Replace `CONTENT_PIPELINE.md:359` (*"Refresh = re-author the EN body and all five translated variants from current sources in the same session"*) with three named obligations. **The tier selector asks its questions in this order:**

1. **Is the vendor independent and operating?** No → **Tier C**.
2. **Has its category positioning or product line materially changed?** Yes → **Tier C**.
3. **Has pricing moved?** No → **Tier A**. Yes, <20% and no tier restructure → **Tier B**. Yes, ≥20% or tiers restructured → **Tier C**.

- **Tier A (verify, unchanged):** write `pricing_checked: <today>` to the EN file. Nothing else. No body edit, no translation, no `last_updated`, no commit beyond one frontmatter line. Cost: ~0.
- **Tier B (pricing patch):** rewrite pricing frontmatter + the `## Pricing` section across 6 locales, run `sync:frontmatter`, bump `pricing_checked`, **do not bump `last_updated`**. Numerals must be digit-identical across locales. Cost: ~10 minutes.
- **Tier C (full re-author):** the 6-locale rewrite as today. Triggered by material change or the body clock.

This ordering is the critique's most important correction and I am adopting it wholesale. Every stale-framing item in your own memory — Paradox/Workday, Salesloft/Clari, Outreach's rebrand, Regie→RegieOne, Kira's hybrid pivot, Mercor's pivot out of recruiting, BrightHire/Zoom — is a **positional** change, several with unchanged pricing. A price-keyed tier selector optimizes away the cheap error class and leaves the expensive one live. Describing an acquired company as an independent challenger, inside a buying recommendation, is the error that tells a reader nothing here is checked — and it propagates to ~5 EN pages / 30 files per tool.

**Material-change items preempt calendar-triggered items in the queue.** Acquisitions arrive in correlated waves; if they queue behind routine churn the cap gets blown by exactly the events that matter most.

**Body SLAs** (with two clocks, the body clock is finally reachable): tools 120d → **180d flat**. Comparisons **stay 180d** — the verdict is the product, and a year-old comparison in this market is a wrong page, not a stale one. Workflows 180d → 365d + artifact-check-failure trigger. Learn unchanged (12mo / 6mo how-to). Stacks own clock 120d → 180d, **cascade only on MATERIAL constituent change**, deduped to one item per stack per month listing all triggers.

I am **rejecting** Design 1's t1/t2/t3 traffic tiering until GSC is wired. Design 1 concedes it ships as a guess and that *"a genuinely high-traffic page could sit in t3 with a 365d body clock for a year."* A guessed tier is worse than a single defensible clock. Revisit after Stage 0 produces real impressions data.

**Resulting demand:** tools body 198 × 365/180 = 401 + comparisons 353 + workflows 104 + learn 174 + stacks 37 = **~1,069/yr = 20.6/wk of Tier C**, plus ~5–8 Tier B patches/wk at ~1/6 the cost, plus Tier A at ~0. Down from 47.4/wk. **Blended re-authors per entry per year: 3.02 → 1.62.**

### 6. The VERIFY lane — independent, incremental, committed per tool

**New:** `content-strategy/verify-prompt.md`. Per run take **15 tools** ordered by oldest `pricing_checked`. For each, in order:

1. **Liveness, independently.** WebFetch the vendor homepage; WebSearch `<vendor> acquired OR shut down OR sunset` limited to 12 months. **Do not read the page's own dossier URLs for this step** — that is the whole point.
2. Compare `pricing_starts_at`, `pricing_model`, named tiers, `mcp_available`, `api_available` against the live pricing page.
3. Emit the tier per workstream 5 and **commit immediately** — `verify(tools): <slug> <outcome>`.

Outcomes: UNCHANGED → `pricing_checked` only. DELTA → append a `patch:` item. MATERIAL → set `vendor_status`/`material_change_at`, append `reauthor:` + one deduped cascade item per affected comparison/stack. DEAD → `vendor_status: sunset`, route to the `CONTENT_PIPELINE.md:373` sunset path (preserve URL, `superseded_by`, name the migration).

**15 tools/run × 14 runs/week = 210 ≥ 198 = every tool verified weekly.** The critique killed the 66-tools-per-run design and it was right: ~198 web operations returning 660k–1.3M tokens with a single commit at the end is not executable unattended, and it was the load-bearing saving in the whole plan. Small runs, commit per tool, mid-run death costs one tool.

**Delete the suppression heuristic.** `freshness-prompt.md:29` gates the pricing flag on a vague *"fast-moving category like outbound or AI assistants"* judgement; at the 2026-07-05 sweep 94 tools were >60d stale and only 30 were flagged. With Tier A costing a frontmatter line there is no reason to hide breaches, and the backlog becomes a trustworthy capacity gauge.

### 7. Unbundle the page: research → EN → verify → translate

Four lanes, **time-sliced with a real mutex** (see workstream 10), connected by on-disk state.

**7a. Research lane.** New `content-strategy/research-prompt.md`. Take N unconsumed queue items, emit one dossier per item at `content-strategy/research/<entity>/<slug>.md`. **No MDX.** Dossier shape: `## Atoms` table (claim | value | source bucket per `CONTENT_PIPELINE.md` §Sources | source URL | fetch date), `## Liveness` verdict, `## Anti-ICP`, `## Watch-outs` with paired guards, `## Verdict seed`. Two hard exits that kill bad pages at ~1/10th the cost of discovering them mid-authoring: liveness returns DEAD/ACQUIRED → write `→ skip: <reason>` on the queue line, emit nothing (this is where `lawgeex`, `tezi`, `robin-ai`, `pocus-vs-koala` die); fewer than the per-type minimum of sourced atoms → same (this is where thin specs die).

Research depth is the variable that gets silently compressed under volume pressure, and that compression is the mechanism behind the ~11% error batch. Making it a separate committed artifact makes its existence checkable.

**7b. EN authoring lane.** New `content-strategy/en-authoring-prompt.md`. **3 EN pages/run.** Writes only `content/<entity>/en/<slug>.mdx` plus any artifact bundle. **Refuses to author without a dossier.** Per-run allocation is fixed and never reversed: **pages 1–2 new, page 3 refresh.** If refresh is empty, page 3 becomes new; if new is empty, page 3 stays refresh and the run logs a supply warning. One commit per page.

This replaces `daily-prompt.md:38` outright. A ratio, not a priority — new-content throughput can never be zero again by construction.

**7c. Verify lane.** New `content-strategy/verify-en-prompt.md`. Fresh-context Opus session over every EN file committed since the last run lacking `en_verified`. **Given only the page's claims — never the dossier's URLs — it independently locates the vendor's current pricing/docs pages and status, then diffs.** The dossier is opened only *afterwards*, to flag claims carrying no source at all (itself a high-value signal). Add a staleness test: any cited URL whose publication/last-modified date predates the SLA window fails.

The critique killed dossier-URL re-fetching and it was right: verifying against the author's own evidence set checks transcription fidelity, not truth, and definitionally cannot catch a wrong premise — because the wrong premise selected the URL list.

**BLOCKS** on exactly four classes: (a) vendor liveness/ownership wrong; (b) price off >20% or a named tier absent from the vendor's page; (c) a claimed integration/MCP/API capability absent from vendor docs; (d) a regulation cited with a substantive claim its primary text does not support — and the citation must resolve to eur-lex / gdpr-info / nyc.gov / hhs.gov, not commentary. **WARNS ONLY** on market-share stats, ramp estimates, "typical paid" bands, verdicts, prose quality — blocking on unfalsifiable claims stalls the pipeline.

Pass → stamp `en_verified: <date>`. Fail → revert the page's commit, write the reason onto the queue line, append to `CORRECTIONS.md`.

**7d. Translate lane.** New `content-strategy/translate-prompt.md`. Runs `npm run queue:translations`, drains up to 15 items per locale per run, writes `source_sha256`. Keeps the translator-not-author rule and `locale-register.md:231`'s *"surface EN factual errors, never silently fix them."*

**Gate translation on verification:** in `packages/pipeline/src/translation/queue-build.ts`, `classifyItem` (line 80) returns null when the EN entry has no `en_verified`, unless `--include-unverified`. This is the one line that guarantees a wrong fact is never multiplied by six.

**PREREQUISITE — the drift detector is 100% false-positive today.** `npm run queue:translations` reports **658 of 658 stale for every locale, 0 missing**. Cause: 1,375 non-EN files never got `source_sha256` (`locale-register.md:11` declares it *"no longer required"*), and the 1,915 that have it were invalidated by the 2026-05-24 `refactor(content): unify entry freshness date to last_updated` bulk commit. Measured actual divergence: EN and ES siblings share the same last-touching commit in **198/198 tools**. So: write the current EN body hash into **all 3,290 non-EN files unconditionally**, declaring present state as baseline. Design 1's backfill only repaired files *missing* the field — that leaves 1,915 permanently stale and the lane self-blocks on a ~1,900-item bogus queue. Then revert `locale-register.md:11` so the field is required again.

**Parity SLA: 7 days from `en_verified` to full 6-locale parity.** `BaseLayout.astro:23-29` documents `availableLocales` as existing specifically *"to prevent emitting hreflang tags pointing at 404s"*, and a single-locale commit already exists in history (`d0bd2e4`), so EN-only is a page with fewer alternates, not a broken page. One place it isn't free: `content-strategy/internal-link-prompt.md:13` assumes every EN target has 5 siblings — change it to mirror an EN insertion into locale L only if the *target* exists in L, else record as pending-parity.

**Amend `CONTENT_PIPELINE.md` §The rule deliberately.** Don't let it erode silently — that is exactly what happened to the artifact-bundle rule.

### 8. Supply: the constraint that binds in week one

Measured: **46 unconsumed queue items, 5 refresh → 41 new-content, minus 3 known-dead = 38 viable.** At 35 new/wk that is 5 working days. And the refill will not self-correct: `topic-refill-prompt.md` Step 1 hard-stops at ≥30 unconsumed, and there are 46, so Saturday's run adds **zero**.

`content-strategy/topic-refill-prompt.md`:
- Floor 30 → **100**; goal depth ~40 → **200**. The file's own calibration note (*"2 authoring slots/day = 14 consumed/week"*) becomes "4 EN runs/day × 2 new = 56/week".
- Cadence weekly → **daily**.
- **Fan out the mechanism, not just the number** — one research sub-agent per vertical plus one per source (GSC, Reddit, HN, vendor changelogs). Raising a target number does not produce items; only Design 2 fixed this and it's necessary.
- Every item requires `[evidence:gsc|reddit|hn|changelog|comparison-gap|vertical-floor]`. `[evidence:none]` is refused.
- **Keep Step 5's *"do not pad with weak candidates"* verbatim.** It is the doorway defense and must survive the volume increase.
- Queue hygiene: mark `tezi`, `robin-ai`, `robin-ai-vs-spellbook`, `lawgeex` as `→ skip:`; collapse duplicate target slugs.

**Hard rule in every authoring lane: if the queue holds fewer than 10 viable evidence-tagged items, exit cleanly and log a supply warning.** A starving high-volume lane is worse than a slow one — an agent told to "complete end-to-end" will find something to write, and what it finds is the matrix.

### 9. Remediation lane — the highest-EV use of freed capacity

The critique is right that this outranks new content, and the numbers support it. ~241 EN entries below their own word floors (tools 82/198 under 400; comparisons ≥97/174 under 600; learn 54/164 under 600; workflows only 5/104 — the one healthy type, avg 1,845 words). 47 of 48 existing roundups under the 700 floor. The CLM pairwise cluster runs 336–373 words against a 600 floor.

A deepened `relativity` page (209 words today, for the dominant eDiscovery platform on earth) is almost certainly worth more than three new matrix-fill comparisons, and it carries **none** of the scaled-content exposure.

**`ooligo-remediate` gets its own daily slot for weeks 2–5**, ordered by (catalog centrality × word deficit). Also in scope: backfill or downgrade the 13 bundle-less workflows, and consolidate the thinnest pairwise clusters — five 340-word CLM head-to-heads collapse into one strong CLM buyer's guide with redirects. That is a net SEO gain, not a loss.

### 10. Concurrency: one real mutex, no worktrees

**New:** `scripts/lane-lock.mjs`. Takes a lock file with pid + ISO timestamp, checks liveness of the recorded pid, expires after 6 hours, acquired as step 0 by every lane, released on every exit path. Every lane SKILL.md calls it first and exits cleanly if it can't acquire.

Why a real mutex and not time-slicing: sessions run longer than the gaps and the machine is **not ooligo-only** — 33 live scheduled tasks across 5 projects, with long-running agents at 06:00, 09:00, 11:00, 12:00, 13:00, 15:00, 17:00, 19:00, plus up to ~10 minutes of harness jitter (measured: author-am 441s, internal-links 484s, pillar-pass 593s). "Disjoint hours" is a hope, not a mechanism.

Why **not** worktrees: this bug class has already fired unattended — the repo root contains a directory literally named `C:Sooligocontentcomparisonsfr`, a Windows path with the backslashes eaten, created 2026-05-12 by an autonomous run and never cleaned up. Five worktree roots × six lanes makes that near-certain. A single tree plus a mutex plus claim-before-research is strictly safer.

**Stage-0 chores:** delete `C:\S\ooligo\.claude\scheduled_tasks.lock` (pid 53932, acquired 2026-07-02, **verified not running**, sat 23 days while author-am kept firing — direct evidence unattended sessions die mid-run); remove the `C:Sooligocontentcomparisonsfr` garbage dir; prune the stale `hireez-pricing-404-trailing-slash-71198a` worktree; gitignore the five ~100KB `<locale>_TRANSLATION_QUEUE.md` files (currently untracked and not ignored — a broad `git add` sweeps 500KB of generated noise into a content commit).

**`content-strategy/run-log.md`** — every lane appends one line **before starting work** (lane, ISO timestamp, intent) and one on **every** exit path including no-ops. Writing intent first is what distinguishes a crashed run from one that never fired.

### 11. CI and infrastructure, before they bite

- `.github/workflows/ci.yml` + `deploy.yml`: add `env: { NODE_OPTIONS: --max-old-space-size=8192 }` to both build steps. The documented requirement appears in three SKILL.md files and in **neither workflow**. OOM presents as "Cannot find module" on random pages — a full debugging cycle lost at 8 commits/day.
- **Delete the `build` job from `ci.yml`.** `deploy.yml` already runs validate + typecheck + build. You are burning ~13 minutes of duplicated compute per push. Add `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`.
- **Move deploy off per-commit** to `schedule` every 30 min + `workflow_dispatch`, same concurrency group. Evidence this is needed: **63 cancelled Deploy runs, all clustered 2026-05-03 to 05-11** — the last high-volume period. Cloudflare deploys `dist` atomically anyway; per-commit deploys buy nothing.
- **`apps/web/src/lib/graph.ts`** — one memoized module calling each `getCollection()` once at module scope, precomputing `byLocale`, `bySlug`, `comparisonsByToolSlug`, `workflowsByToolSlug`, `learnByToolSlug`, `localeSiblingsByCanonicalSlug`. Today `[locale]/tools/[slug].astro:40-43` calls `getCollection()` four times **per page render** over all 3,948 entries; the build is empirically O(n²) (43s at 892 MDX → 395s at 3,948, local exponent ~1.9–2.3). This is the single highest-leverage engineering change in the repo.
- **Cloudflare Pages 20,000-file cap.** `dist` is 8,504 files, +12 per entry → ~958 entries of headroom. At 35/wk that is ~27 weeks; then every deploy hard-fails with no partial mode. Add a `deploy.yml` step failing above 18,000 files so you get a month's warning. Fix by upgrading to Pages Pro (needs wrangler v4 — currently pinned 3.90.0 via `cloudflare/wrangler-action@v3`) *or* serving the 3,992 OG SVGs from a Pages Function (`apps/web/functions/` already exists), which halves per-entry cost to 6 files.
- Node 20 is removed from GitHub runners **2026-09-16**. Bump `actions/checkout`, `actions/setup-node`, `cloudflare/wrangler-action`; move `.nvmrc` 20 → 22.

---

## The new schedule

All lanes run in the single tree `C:\S\ooligo` and acquire `scripts/lane-lock.mjs` as step 0.

| taskId | cron | lane | output/run | status |
|---|---|---|---|---|
| `ooligo-research-batch` | `0 5,13 * * *` | RESEARCH | 4 dossiers | **NEW** |
| `ooligo-en-batch` | `0 6,10,16,20 * * *` | EN AUTHOR | 3 EN pages (2 new + 1 refresh) | **NEW** |
| `ooligo-vendor-verify` | `0 4,7,11,14,18,22 * * 1-5` + `0 9,15 * * 6,0` | VERIFY | 15 tools, commit per tool | **NEW** |
| `ooligo-en-verify` | `0 8,17,23 * * *` | FACT GATE | ~4 pages | **NEW** |
| `ooligo-translate` | `0 1,12 * * *` | TRANSLATE | 5 locales × 8 pages | **NEW** (one task, loops locales) |
| `ooligo-remediate` | `0 19 * * *` | REMEDIATION | 2 sub-floor pages | **NEW** (weeks 2–5, then weekly) |
| `ooligo-audit-sample` | `0 10 * * 1` | ESCAPE RATE | 10-page independent audit | **NEW** |
| `ooligo-topic-refill` | `0 15 * * *` | SUPPLY | ~30 evidence-tagged specs | **EDITED** (weekly→daily, floor 30→100, goal→200, fan-out) |
| `ooligo-freshness-sweep` | `0 1 * * 0` | — | tiered/deduped emission | **EDITED** (Tier A/B/C prefixes, cascade dedupe, no suppression heuristic, skip sunset, cohort jitter) |
| `ooligo-gsc-harvest` | `0 21 * * 6` | — | evidence-backed specs | **EDITED** (credentials wired in Stage 0 — currently runs against nothing) |
| `ooligo-internal-links` | `0 3 * * 0` | — | locale-aware, new-first | **EDITED** (mirror only where target exists; prioritize last-7-days entries; per-entry cap 3 → deficit-proportional; retain last 4 sections of the 2,246-line audit queue) |
| `ooligo-link-rot` | `0 2 * * 0` | — | unchanged | **KEPT** |
| `ooligo-monthly-retro` | `0 10 * * 1` | — | unchanged | **KEPT** |
| `ooligo-roadmap-reflect` | `0 8 1 3,6,9,12 *` | — | rescheduled off 11:00 | **KEPT** |
| `ooligo-corrections-review` | `0 19 1 3,6,9,12 *` | — | now has real input | **KEPT** |
| `ooligo-author-am` | — | — | — | **RETIRED** (`SKILL.md:18` is the starvation rule) |
| `ooligo-author-pm` | — | — | — | **RETIRED** (same) |
| `ooligo-evergreen-refresh` | — | — | — | **RETIRED** (`SKILL.md:12` sources only from refresh queue, exits clean when empty — can never produce a new page) |
| `translate-es/pt-br/de/fr/ja` | — | — | — | **DELETE DIRS** — orphaned SKILL.md folders, **not registered scheduled tasks**. This is a directory cleanup, not a task deletion; don't count it as one. (`translate-backfill` belongs to start-debugging — leave it alone.) |

**The arithmetic to 35–40 new pages/week:**

- EN lane: 4 runs/day × 3 pages = 84/wk capacity, allocated 2:1 → **56 new + 28 refresh**
- At 12% loss (aborts, verify blocks, non-viable, supply gaps): **~49 new + ~25 refresh**
- Realistically constrained by supply and verification throughput in month one: **35–40 new/wk sustained**
- Research supplies 4 × 2 × 7 = 56 dossiers/wk against 84 pages — **this is the first thing to raise if the EN lane idles**
- Verify lane: 3 × ~4 × 7 = 84/wk, matched to EN output
- Translate: 2 runs × 5 locales × 8 = 80 pages/day of capacity vs ~12/day demanded — deep headroom, which is correct because it is the lane that fails silently
- Refresh side: Tier C demand 20.6/wk against 28 refresh slots — **fits with 26% slack**, and Tier A/B absorb the rest at near-zero cost
- Vendor verify: 15 × 6 weekday + 15 × 2 weekend = **120/wk**… which is *below* 198. Deliberate: run every tool on a **~12-day cycle**, not 7. Weekly coverage of 198 tools was the load-bearing over-reach in the original design. A 12-day liveness cycle is still 5× tighter than the 60d contract and it actually executes.

That is **3.2–3.6× on new content** and it clears the refresh obligation. It is not 5×. See the last section.

---

## New verticals and where the volume comes from

**Next: Marketing Ops.** Already committed in `ROADMAP.md` Phase 7 ("still on deck"). Same buyer as RevOps, shares the RevOps newsletter list so audience-acquisition cost is ~0, and the AI story is live and contested.

**Launch floor** (`ROADMAP.md:10`, and note it says *tagged*, not authored): ≥40 tools tagged, ≥1 curated stack, ≥10 workflows, ≥30 learn entries, vertical landing page, newsletter ready.

**The cheap part.** New `scripts/cross-tag-marketing-ops.mjs`, a direct copy of the proven `scripts/cross-tag-cs.mjs` (54 lines, frontmatter `verticals: [...]` edit across 6 locales, with MISSING/NO-FRONTMATTER reporting). **~35 of the 40-tool floor cross-tag for free**: the ABM cluster (6sense, demandbase, influ2, rollworks), mutiny, drift, qualified, product analytics (amplitude, mixpanel, heap, pendo), CRM (hubspot, salesforce, attio, pipedrive), automation (zapier, n8n, make), data (zoominfo, cognism, lusha, apollo, clay), email infra (smartlead, instantly), visitor ID (rb2b, warmly), usergems, common-room, scheduling (chili-piper, calendly, revenuehero), AI layer (chatgpt, claude, perplexity, glean, dust, gumloop, lindy), notion, slack, fathom.

This is the exact move that let Customer Success reach 45 tagged tools from 30 authored. It clears the floor legitimately because the floor says "tagged."

**Cost: ~34 newly-authored pages** (~12 tools + ~10 workflows + ~18 learn + comparisons + 1 stack). At 35/wk that is **one week of the EN lane**, translations draining the following week. Requires a `content/verticals.json` entry landing *before* any Marketing Ops page (`validate:config` checks every page's `verticals` array against it) and the `/r/marketing-ops` landing page last.

**Sequencing rule, global not vertical-specific: tools land in an earlier batch than any comparison, stack, or roundup that references them.** Never the same batch. A misclassification or wrong ownership fact must be caught by verification before anything inherits it — one tool reaches ~5 EN pages / 30 files.

**After that: Compliance / AI Governance Ops.** The learn spine is already written — `eu-ai-act`, `nyc-local-law-144`, `colorado-ai-act-sb205`, `illinois-ai-video-interview-act`, `texas-responsible-ai-governance-act`, `ai-policy-for-revops-teams`, `ai-policy-for-recruiting-teams` and more, 12–15 entries cross-tagging on day one = half the 30-entry learn floor. ICP is exactly "an ops leader adopting AI." Highest ad/affiliate CPC on the list (Vanta, Drata, Secureframe all run large programs). Cost: ~30 new tool pages + ~18 learn ≈ **75 pages**, two weeks of the lane.

**Other axes that keep the queue full — with hard limits:**

- **Curated stacks** (18 live, 9 queued): 40–60 more are defensible. Best volume-per-effort on-site because a stack composes existing tool pages. **Only viable now that cascade is material-change-only** — under the old rule 60 stacks would have demanded ~50 cascaded re-authors/week.
- **Same-category pairwise fill:** 293 unfilled cells exist. **Ceiling is 40–60, not 125.** The "sales-engagement" category lumps 13 heterogeneous tools and contributes 47 fake pairs by itself. Every slot needs GSC impressions *and* must pass the `check:page` contest test.
- **alternatives-to-X:** 25 exist, 173 tools lack one. **Ceiling ~45**, restricted to tools with ≥2 existing comparisons (brand-search proxy). Not all 173 — "alternatives to smartkarrot" has no query behind it.
- **Role/scenario buying guides** ("the AI stack for a 3-person RevOps team at Series B"): 40–60 defensible, files under stacks or learn so no new route, and it plays to the content bar's actual strength.
- **A 7th locale** (658 pages instantly, zero new research): high volume, but it makes every Tier C refresh ~17% more expensive. **Only after the refresh redesign has held for a quarter.**

**Excluded as doorway pages — refuse categorically, do not evaluate case-by-case:**

- **`/integrations/[a]-[b]`.** 688 frontmatter-derived pairs — the largest pool and the worst idea in the inventory. ~688 near-identical pages against 658 real ones halves average page quality, and it needs a new Astro route. Only viable if each ships a real artifact (field mapping, auth gotchas, n8n export) — at which point it's a workflow, not an integration page.
- **best-X-for-Y where the segment-gated shortlist equals the ungated one.** ~175 nominal slots, ~40 real. This is the classic programmatic-SEO trap, and it is mechanically testable: if changing the segment doesn't change the recommendation, the page is fabricated.
- **Per-tool `/pricing` pages.** Every tool page already has a `## Pricing` section; splitting it cannibalizes the page for its own brand query. The win here is zero new pages plus schema.org markup on what exists.
- **Near-duplicate locale variants** (es-MX, en-GB). Hreflang cannibalization dressed as volume.

**The honest caveat on all of these:** 47 of 48 existing roundups are under floor and the CLM pairwise cluster runs 336–373 words. These shapes are already the site's worst-performing content. Do not extend them until GSC shows the *existing* ones get impressions. If they get none, delete and consolidate rather than extend.

---

## Guardrails that hold the line at 5×

**BLOCKS a commit:**

1. `check:page` on the page — frontmatter shape, word floor, dossier exists, artifact bundle exists and every `/artifacts/` path resolves on disk, scoped vocab clean, `canonical_slug` unique, `category` exists, `integrations[]` resolve, no prose `<digit`, no `null` in string fields, pairwise contest test.
2. **No dossier → no page.** The EN lane refuses to author.
3. **Vendor liveness DEAD/ACQUIRED at enqueue → the item never enters the queue.** Two web calls in the research lane. `lawgeex` is the next unconsumed refresh item right now and `pocus-vs-koala` is *live and published* despite both vendors being gone.
4. **The four fact-verify classes** — ownership/liveness wrong; price off >20% or a named tier absent; a claimed integration/MCP/API capability absent from vendor docs; a regulation cited with a claim its primary text doesn't support, with citations required to resolve to eur-lex / gdpr-info / nyc.gov / hhs.gov. Fail → revert the commit, log to `CORRECTIONS.md`.
5. **No `en_verified` → the page cannot enter the translation queue.** One line in `queue-build.ts`.
6. **One full `npm run build` with `NODE_OPTIONS=--max-old-space-size=8192` before each batch push.** `daily-prompt.md` currently says skip it and rely on CI; at batch size that inverts — one malformed file fails CI for the whole batch after the push, across N candidate commits.
7. **Legal/compliance lane is stricter, not looser.** 108 EN entries cite named regulations; 179 carry legal-ops. Any sentence pairing a regulation name with a modal obligation ("must", "requires") is mandatory-verify. This class does not get relaxed to buy speed — it's the one place where being wrong costs more than being slow.

**LOGS but does not block:** market-share stats, ramp-time estimates, "typical paid" bands, verdict soundness, prose quality. Blocking on unfalsifiable claims stalls the pipeline for no accuracy gain.

**Measured, not gated:**

- **Escape rate — the only honest license to raise volume.** `ooligo-audit-sample`, weekly, N=10 random published pages weighted toward new authorings, hand-verified against live sources by a fresh-context Opus agent **with no access to the dossier or the verifier's output**. Published in the run log next to pages-shipped. **If escape rate exceeds 3%, cadence drops automatically until it recovers.** Block rate is not a proxy — a gate tuned narrow blocks little and looks clean, which is indistinguishable from a gate that works. The ~11% figure is the only accuracy datapoint that exists and it came from an ad-hoc review that is part of no routine.
- **Verdict-diff.** Any comparison refresh where the default pick changes or a tool moves ≥2 positions requires a commit trailer `verdict-change: <tool> <old>→<new> because <evidence>`. No evidence → the verdict doesn't move and the item downgrades to a patch. At 5× the refresh cadence exceeds the rate markets actually change, so verdicts otherwise move on session noise.
- **`CORRECTIONS.md` auto-populated** from every block and warn. It has been empty for ~3 months against 658 entries, which means the quarterly bar-review ("if a class recurs 3+ times, update the bar") has never been able to fire. This gives it input for the first time.
- **Numeral parity** EN vs each locale — prices and percentages digit-identical. Cheapest catch for the most damaging translation drift.

**Model choice: Opus for every research, author, and verify sub-agent, stated explicitly in each SKILL.md.** The ~11% hard-error batch was Sonnet-authored and caught only by an Opus web-verified review. If sub-agents inherit a weaker default, that rate returns multiplied. Nothing in this design detects that automatically — it has to be written into every skill file.

**Correlated-error guard, corrected.** Design 2's proposed guard (a batch must span ≥2 entity types) is backwards — the entity types most likely to co-occur with a tool page are exactly the comparisons and stacks that inherit its framing, so it *increases* propagation. The right constraint: **no two pages in a batch may share a primary vendor.** Cluster around a buying question with disjoint vendors, never around one vendor with multiple page types.

---

## Rollout

**Stage 0 — Instrument and clean. 1 week. Zero pages shipped.**

Wire Google Search Console: verify the property, export 90 days, populate `gsc-candidates.json`. Fill the blank GA4 line in `TRAFFIC_RETRO.md`. Ship 1a/1b/1c, `check:page` in report-only mode, `sync-frontmatter.ts`, the `content.config.ts` fields, the `queue-build.ts` verified-gate, `lane-lock.mjs`. Backfill `source_sha256` unconditionally across all 3,290 non-EN files. Strip the Review JSON-LD and ship the AI disclosure. Delete the stale lock, the `C:Sooligocontentcomparisonsfr` dir, the stale worktree; gitignore the translation queue files. Add `NODE_OPTIONS` to both workflows; delete the CI build job. Mark `lawgeex`/`tezi`/`robin-ai`/`robin-ai-vs-spellbook` as `→ skip:`.

**CHECKPOINT — this one can kill the plan.** `gsc-candidates.json` has a real `generated_at` and non-null data. `npm run queue:translations` returns **0 items** for all 5 locales (proving the backfill worked and the 658/658-stale false positive is gone). `check:page` runs clean on `tools/clay` and fails correctly on one of the 13 bundle-less workflows. Build green.

**Then answer one question: do the existing 658 entries have non-trivial impressions, and does anything rank top-20?** If after ~3 months and 3,948 URLs impressions are near zero, **stop** — throughput was never the constraint, every version of this plan optimizes the wrong variable, and the correct move is Stage 1 only (remediation) until something ranks.

**Stage 1 — Refresh redesign + remediation. 2 weeks. Still ~0 new pages.**

Ship the Tier A/B/C definition into `CONTENT_PIPELINE.md`, the rewritten `freshness-prompt.md` (tiered prefixes, cascade dedupe, suppression heuristic deleted, sunset skip), `verify-prompt.md`. Stand up `ooligo-vendor-verify` and `ooligo-remediate`. Run cohort jitter before **2026-08-30** — spread the 94 tools dated 2026-05-02/03 across ±45 days, and the 100 comparisons / 70 workflows before their late-October cliffs.

**CHECKPOINT (2 weeks):** all 198 tools carry `pricing_checked` and `vendor_status`; **zero full re-authors consumed for a pricing-only reason**; ≥20 sub-floor pages remediated; no calendar day holds more than 20 entries' `last_updated`. This is the load-bearing experiment — if verify+patch can't service the largest demand block without authoring slots, stop here, because everything downstream is built on that cut.

**Stage 2 — Unbundle, at current volume. 1 week.**

Ship `research-prompt.md`, `en-authoring-prompt.md`, `verify-en-prompt.md`, `translate-prompt.md`, the `daily-prompt.md` rewrite. Stand up `ooligo-research-batch` (2 dossiers/run), `ooligo-en-batch` at **1 run/day × 3 pages**, `ooligo-en-verify`, `ooligo-translate`. Retire author-am/pm/evergreen.

**CHECKPOINT (1 week):** translation parity lag ≤48h; every EN page has 5 siblings with matching `source_sha256`; **the verify lane has blocked at least one atom** — if it has blocked nothing in a week, the gate is misconfigured or the classes are too narrow, investigate before scaling, because this is the mechanism the entire quality argument rests on. Zero force-pushes in the reflog. Zero pages published without a dossier.

**Stage 3 — Supply. 1 week.**

Retune `topic-refill-prompt.md` (daily, floor 100, goal 200, fan-out, evidence tags). Stand up `ooligo-audit-sample`.

**CHECKPOINT:** unconsumed depth ≥100 **and rising**, with ≥80% carrying a non-`vertical-floor` evidence tag. First escape-rate number published. **Do not proceed if supply is what broke** — a high-volume lane on a thin queue produces doorway pages, which is worse than running slow.

**Stage 4 — Ramp. 2 weeks.**

`ooligo-en-batch` to 4 runs/day. Research to 2 runs × 4. Verify to 3/day.

**CHECKPOINT:** two consecutive weeks at **≥30 new EN pages**; `check:page` block rate <10%; escape rate **<3%**; refresh consumption ≤28/wk; parity lag ≤7 days. If escape rate is above 3%, hold volume and fix the gate — do not trade accuracy for pace.

**Stage 5 — Marketing Ops. Week 8.**

`content/verticals.json` entry, `cross-tag-marketing-ops.mjs`, seed ~34 residual specs, tools batched ahead of comparisons/stacks.

**CHECKPOINT:** launch floor met in EN within 7 days, all 6 locales within 14, **with the new-content lane still ≥30/wk throughout** — proving the vertical is additive and not a disguised raid on steady state. Then Compliance / AI Governance next quarter.

---

## What this does not fix / risks accepted

**The realistic ceiling is 3–3.5×, not 4–5×: 30–40 new EN pages/week, reached around week 8, after ~3 weeks that ship almost nothing.** The refresh arithmetic genuinely works — cutting demand from 47.4/wk to ~21/wk of Tier C frees real capacity. The capacity is real. What can't absorb it is everything else. The multipliers that survive scrutiny are EN-first (~2× on the authoring lane, not 6× — research and bar-checking dominate, not typing), shared research (~1.5× on related pages), and 2→4 slots/day. That composes to 40–60 nominal, minus aborts, minus non-viable items, minus the fact that verification scales linearly with volume and is the first thing compressed. 30–40 net is what I'd defend.

**What binds at that point is topic supply with evidence attached — not authoring capacity.** 38 viable items today, ~5 days of runway. Raising the refill floor doesn't produce items; fanning out the refill research might, and GSC would, but neither is proven. Past ~35/wk the only pool deep enough is the pairwise/alternatives/best-X matrix, and I measured what that produces on this site: 47 of 48 roundups under floor, the CLM cluster at 336–373 words, and `apollo-vs-default.mdx` opening by conceding the two tools *"overlap almost zero."* The volume target itself pushes the site into its worst-performing format. **That is how 3× of good pages becomes 5× of bad ones.**

**Scaled-content-policy exposure — stated plainly.** Google's scaled-content-abuse policy is method-agnostic; 40 LLM pages/week of genuinely differentiated content is not per se a violation. But this site currently stacks nearly every aggravating factor simultaneously: no human review by stated policy, 5/6 of the catalog machine-translated with no disclosure, page shapes derived from an internal matrix rather than observed demand, **fabricated numeric ratings in `Review` schema under a real person's name on 1,188 URLs**, programmatic ad monetization, and an empty corrections log. Workstream 3 removes the machine-detectable piece and adds disclosure; workstreams 8 and the doorway-refusal list address the demand-grounding piece. What remains after that is a defensible posture — transparently AI-authored, evidence-gated, with a working corrections loop — but it is a posture, not immunity, and if GSC shows the existing catalog gets no impressions then the honest read is that the content isn't differentiated enough and volume makes it worse.

**Deliberate contract loosening.** Workflows go 180d → 365d body. The 6-locales-in-one-commit rule at `CONTENT_PIPELINE.md:9` is broken — non-EN readers see up to 7 days of lag. Tier A means "re-verify against current sources; re-author only if sources moved," which is weaker than "re-author every 60 days" and will miss a vendor changing prose-relevant positioning without a price change (mitigated, not eliminated, by liveness-first tier selection). I judge these correct because the strict contract is not being honored anyway — 120 of 198 tools are pricing-stale *today* after three straight weeks of pure refresh — and honoring a weaker contract fully beats honoring a stronger one at 29% of standstill. But they are real reductions in the promise and must be written into the doc, not allowed to erode silently the way the artifact-bundle rule did.

**Correlated batch errors are bounded, not eliminated.** Pages sharing a research dossier share a premise. Guards: no two pages per batch share a primary vendor; the verifier runs fresh-context and reaches its own sources; verification precedes translation. The ~11% precedent is a real warning and batch size 3 is chosen to bound it.

**Not solved here.** Refill *research* throughput — I raise the target and fan out the mechanism, but finding 200 defensible evidence-backed specs is 10–20× the current routine's output and I can't prove the fan-out delivers it. The Cloudflare file cap is deferred with a warning trigger, not fixed. The O(n²) build gets a memoized graph module but I haven't measured the resulting exponent. `link-audit-queue.md` retention and the link-rot 30-minute self-abort truncation are flagged and untouched. Whether the harness's per-project scheduled-task lock permits concurrent ooligo sessions at all is **unverified** — if it's an exclusive mutex, the 6-lane schedule collapses to serial and throughput drops to roughly 2×; test this in Stage 0 by triggering two ooligo tasks simultaneously.

**One thing I'd do first if you only do one thing:** wire Search Console. Everything downstream — tier assignment, doorway refusal, axis selection, whether speed was ever the constraint — is currently a guess, and it is the only guess that gets cheaper to resolve the sooner you resolve it.