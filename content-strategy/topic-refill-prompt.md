# Topic queue refill

Keep [topic-queue.md](topic-queue.md) full enough that the authoring lanes don't run dry. Scheduled **daily** (15:00 local). Manual invocations welcome if the queue looks thin.

## Step 1 — Check current depth

Count **available** new-content items in `topic-queue.md`. An item is any non-empty, non-header line under a type section header. An item is *available* if it contains none of the literal strings `→ slug:`, `→ claimed:`, or `→ skip:`. Count `refresh:` items separately — they are the freshness sweep's output, not yours, and they do not count toward your floor.

**Match the full marker, never a bare `→`** — a lone arrow inside a spec's prose is descriptive text, not consumption. Getting this wrong under-counts the queue and triggers refills that aren't needed, which is how a healthy queue gets padded with filler. It has already hidden 97 available items once. When you write new specs, prefer `->` in prose so the ambiguity never arises.

**Reversed-pair check for comparisons.** Before queueing `a-vs-b`, search for `b-vs-a` in both the queue and `content/comparisons/en/`. They are the same page, and exact-slug dedupe does not catch the flip — three such collisions (`glean-vs-dust`/`dust-vs-glean`, `kustomer-vs-gladly`/`gladly-vs-kustomer`, `luminance-vs-kira-systems`/`kira-systems-vs-luminance`) were caught only by a token-set comparison.

**Count per section, not just in total.** The NEW lane picks by type section (`ooligo-author-new` §Type rotation by slot hour), so a section at zero starves its slots no matter how deep the queue is overall. Report both every run: the per-section counts and the total.

**Floors and goals**, calibrated to what each type actually consumes at 7 NEW slots/day:

| Section | Slots/day | Consumed/week | **Floor** (2 wk) | Goal (4 wk) |
|---|---:|---:|---:|---:|
| Tools | 2 (06, 14) | 14 | **28** | 56 |
| Comparisons | 2 (08, 16) | 14 | **28** | 56 |
| Workflows | 1 (12) | 7 | **14** | 28 |
| Learn | 1 (10) | 7 | **14** | 28 |
| Stacks | 1 (18) | 7 | **14** | 28 |
| **Total** | **7** | **49** | **100** | **200** |

The aggregate floor of 100 is not a separate rule — it is the sum of the section floors, and it is two weeks of runway at the current consumption rate. The goal column is four weeks, enough that a failed refill run or a dry research week doesn't starve the lane.

**Stop condition — both must hold.** STOP and log `topic-queue still fresh, no refill needed` only if the total is at or above 100 **and every section is at or above its own floor**. Exit cleanly, no commit.

**If the total is green but any section is below its floor, you still run a refill — a targeted one.** Research only for the starved sections and fill each to its goal. Do not append to sections already above their floor, however good the candidate looks; that is what drained the starved sections in the first place. Log `topic-queue: <section> below floor (N/F) — targeted refill` for each one.

> **Why the per-section floor exists.** This file previously stopped on the aggregate alone. On 2026-08-18 the queue read 113/100 — green, no refill — while `## Tools` held **0** available items, `## Stacks` held 1, and `## Comparisons` had drained 16 → 5 in four days. All 113 were concentrated in Learn and Workflows. The 06 and 14 slots had been falling back to the head of `## Comparisons` for days, so comparisons were absorbing four slots of demand against two slots of supply, and new tool pages had shipped at a rate of zero for three consecutive days. The aggregate cannot see this: it is a single scalar measuring a pool the lanes consume in five separate streams. A green total is not evidence that any given slot has work.

> These numbers were previously floor 30 / goal 40, aggregate-only, calibrated in this file to *"2 authoring slots/day = 14 consumed/week."* That calibration is dead: the lane now consumes 49/week. A floor of 30 against 49/week consumption is less than five days of runway, and because Step 1 hard-stops at the floor, a queue sitting just above it produces **zero** new items indefinitely while draining.

**Supply is now the binding constraint on the whole pipeline**, ahead of authoring capacity. Treat a shortfall as a real failure, not a quiet no-op: if you finish below the floor, say so explicitly in the report and the commit message so it is visible rather than silently absorbed.

## Step 2 — Research new gaps

**Fan out.** Raising a target number does not produce items; only research does, and one session scanning nine sources serially is what capped this routine's output in the first place. Dispatch parallel sub-agents — one per vertical (revops, legal-ops, recruiting, customer-success, cross) and one per source class below — then merge, dedupe, and rank their findings. Use Opus for these sub-agents; a weaker model produces plausible-looking specs with no real demand behind them, which is worse than producing none.

**Scope the fan-out to the sections that are actually below floor.** Give every sub-agent the shortfall from Step 1 — which sections, and how many items each needs — as its brief, and tell it to return only candidates that land in those sections. A general sweep returns what the sources happen to be loudest about, which is learn and workflow material nine times out of ten; that is exactly how Tools reached zero while the total stayed green. Source priority below is unchanged, but read each source *for the starved type*: a changelog entry is a tool refresh, a competitor mentioned in a Reddit thread is a pairwise, a "what's your stack for X" thread is a stack.

Sources, in priority order:

1. **`gsc-candidates.json`** (if non-empty) — pages ranking positions 8-25 with no existing dedicated entry. The harvest writes ranking + query; convert each into a topic spec.
2. **Reddit signal** (WebFetch):
   - r/RevOps (revenue ops, SDR/AE/CSM tooling)
   - r/sales (outbound, prospecting, enablement)
   - r/recruiting and r/talentacquisition (sourcing, ATS, screening, interview intelligence)
   - r/legaltech and r/legalops (contract management, e-discovery, AI for legal)
   - Scan the week's top questions per sub. Good signal: a question with engagement but no obvious canonical answer.
3. **Hacker News frontpage hits** (WebSearch site:news.ycombinator.com): last 14 days, filter for `Show HN` and discussion threads on ops tooling, AI agents, MCP, or specific products in our catalog.
4. **Vendor changelogs** (WebFetch the official sites' /changelog or /whats-new):
   - RevOps: HubSpot, Salesforce, Apollo, Clay, Gong, Outreach, Chili Piper, LeanData
   - Legal Ops: Spellbook, Harvey, Ironclad, DraftWise, ContractPodAi
   - Recruiting: Gem, Sense, Paradox, hireEZ, Eightfold, Findem, Greenhouse, Lever, Ashby
   - AI infra: Anthropic, OpenAI, Cursor, n8n
   Look for new features, pricing changes, integration announcements, or sunset notices. Each can become a topic.
5. **Existing comparison surface** — for any tool entry with no pairwise comparison vs its top 1-2 competitors, that's an unfilled pairwise.

For each candidate, formulate the topic as a **specific page spec**, not a loose theme:

- Bad: `Apollo pricing update`
- Good: `[type:tool] [vertical:revops] refresh Apollo entry — pricing tiers reorganized 2026-Q2 per changelog`

- Bad: `AI for recruiting`
- Good: `[type:learn] [vertical:recruiting] definition of "interview intelligence" — what platforms do this, vs simple recording (BrightHire/Metaview/HireVue)`

- Bad: `Compare contract tools`
- Good: `[type:comparison] [vertical:legal-ops] Ironclad vs Spellbook pairwise — enterprise CLM with workflow vs review-first AI assistant`

## Step 3 — Deduplicate

For each proposed item, before appending:

1. Grep `topic-queue.md` for the main keywords — if a similar item already exists (consumed or not), skip.
2. Grep `content/<entity>/en/*.mdx` for the slug or canonical_slug — if the entry already exists and is not stale, skip. If it exists but is past SLA per CONTENT_PIPELINE.md §Freshness SLAs, prefer to let the freshness sweep handle it as a `refresh:` item rather than duplicate here.
3. Check `CORRECTIONS.md` — if the topic has a pending correction, skip until the correction is resolved.

## Step 4 — Categorize and append

Each item gets **three** tags and a one-line spec:

```
- [type:tool|comparison|workflow|learn|stack] [vertical:revops|legal-ops|recruiting|customer-success|cross] [evidence:gsc|reddit|hn|changelog|comparison-gap|vertical-floor] <one-line spec, with the slug or specific scope>
```

**`[evidence:...]` is mandatory and `[evidence:none]` is refused.** The tag names where the demand signal came from, and it is what separates a queue of real reader questions from a queue derived by combinatorics off an internal matrix. At 49 pages/week the temptation is to fill the queue from the tool-pair grid; that grid is the site's worst-performing content shape and generating more of it is how a throughput win turns into a quality loss.

`[evidence:vertical-floor]` is legitimate but capped — it means "this page is needed to clear a documented vertical launch floor", not "this seemed plausible". Keep it under 20% of any single refill.

Append items under the matching section header in `topic-queue.md`:

```markdown
## Tools

- [type:tool] [vertical:revops] new entry: <slug> — <why it matters>
- ...

## Comparisons

- [type:comparison] [vertical:legal-ops] pairwise: <a-vs-b> — <routing rule the page resolves>
- ...

## Workflows

- [type:workflow] [vertical:recruiting] <action verb + object> — <artifact_type> bundle
- ...

## Learn

- [type:learn] [vertical:cross] <type>: <slug> — <primary target_question>
- ...

## Stacks

- [type:stack] [vertical:revops] <slug> — <use_case in one phrase>
- ...
```

If the file doesn't have these section headers yet (first run), create them with this exact order: Tools, Comparisons, Workflows, Learn, Stacks. Within each section, append at the end — never reorder existing items.

`refresh:` items are prepended by the freshness sweep and live above the section headers in their own top-of-file block — don't add `refresh:` items from this routine, that's freshness-prompt's job.

## Step 5 — Guardrails

- Never reorder existing items, consumed or not.
- Never remove items — lanes annotate them with `→ claimed:`, `→ slug:`, or `→ skip:`; old annotated items are kept for dedupe.
- Never rewrite section headers or move items between sections.
- If research yields fewer than 10 new viable items, append what you have and log `under-refill: N items`. **Do not pad with weak candidates.** This rule survives the volume increase unchanged and outranks the floor: an under-filled queue is a visible problem that gets fixed, whereas a queue padded to 200 with combinatorial filler is an invisible one that gets published. If you cannot hit the floor honestly, miss it and say so.
- Tag every item with `[type:...]`, `[vertical:...]`, **and** `[evidence:...]` — items missing tags are dead weight to the lanes.
- **A section's floor does not license filler for that section.** If honest research can't fill Tools to 28, append what you found and report `under-refill: <section> N/F`. Do not convert the shortfall into pairwise combinations off the tool matrix — that matrix is the site's worst-performing content shape, and a starved Tools section is a better outcome than 28 machine-generated tool specs nobody searched for. The no-padding rule outranks the section floor exactly as it outranks the aggregate one.
- **Verify the vendor is alive before queueing a tool or comparison spec.** One WebSearch for `<vendor> acquired OR shut down OR sunset` over the last 12 months. If it's dead or absorbed, don't queue it — and if a matching item already sits in the queue, annotate that line ` → skip: <reason>`. Dead specs already in the queue include `tezi` (team acqui-hired by Headway), `robin-ai` and `robin-ai-vs-spellbook` (collapsed late 2025), `lawgeex` (enterprise product dismantled 2023), and `pocus-vs-koala` (Koala shut down, Pocus folded into Apollo). Catching this here costs one search; catching it mid-authoring costs a whole slot; not catching it publishes a buying recommendation for a company that no longer exists.

## Step 6 — Commit

One commit:

```
chore: topic-queue refill YYYY-MM-DD — +N items, depth D/100

Added: N new-content items
By section: tools <n>/28, comparisons <n>/28, workflows <n>/14, learn <n>/14, stacks <n>/14
By evidence: gsc <n>, reddit <n>, hn <n>, changelog <n>, comparison-gap <n>, vertical-floor <n>
By vertical: revops <n>, legal-ops <n>, recruiting <n>, customer-success <n>, cross <n>
Skipped as non-viable: <slugs, with reason>
```

The `By section` line carries post-refill depth against each section's floor, so a starved type is visible in the commit body without opening the queue.

Append ` — UNDER FLOOR` to the subject line if the total is still below 100 **or any single section is still below its own floor**, naming the sections: ` — UNDER FLOOR (tools, stacks)`. That is the signal that specific NEW slots are about to starve, and it needs to be visible in `git log` without opening anything. A run that leaves Tools at 0 and the total at 113 is an UNDER FLOOR run.

Single file changed: `content-strategy/topic-queue.md`. Include the `Co-Authored-By` trailer. Push to `origin main` using the rebase-retry procedure in [daily-prompt.md](daily-prompt.md) §Pushing — this routine now runs daily alongside 10 authoring slots and will hit non-fast-forward rejections.

## Autonomous mode

Run Steps 1-6 end-to-end without pausing. Exit cleanly without a commit only if the queue is at or above 100 available new-content items **and** every section is at or above its own floor. If the total is green but a section is short, run the targeted refill for that section — do not treat the aggregate as permission to skip the run.
