# Topic queue refill

Keep [topic-queue.md](topic-queue.md) full enough that the daily authoring slots don't run dry. Scheduled weekly (Saturday 23:00 local). Manual invocations welcome if the queue looks thin.

## Step 1 — Check current depth

Count unconsumed items in `topic-queue.md`. An item is any non-empty, non-header line under a section header. An item is *unconsumed* if it does NOT contain `→ slug:`.

**Target floor:** 30 unconsumed items. If already at 30 or more, STOP and log `topic-queue still fresh, no refill needed`. Exit cleanly, no commit.

**Goal depth after refill:** ~40 unconsumed items. At 2 authoring slots/day = 14 consumed/week, ~40 gives a comfortable buffer plus headroom for the freshness sweep to prepend `refresh:` items.

## Step 2 — Research new gaps

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

Each item gets two tags and a one-line spec:

```
- [type:tool|comparison|workflow|learn|stack] [vertical:revops|legal-ops|recruiting|cross] <one-line spec, with the slug or specific scope>
```

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
- Never remove items — authoring slots annotate them with `→ slug:`; old consumed items are kept for dedupe.
- Never rewrite section headers or move items between sections.
- If research yields fewer than 10 new viable items, append what you have and log `under-refill: N items`. Do not pad with weak candidates.
- Tag every item with both `[type:...]` and `[vertical:...]` — items missing tags are dead weight to the authoring slots.

## Step 6 — Commit

One commit:

```
chore: topic-queue refill YYYY-MM-DD

Added: N new-content items, M sourced from <list of sources used>
```

Single file changed: `content-strategy/topic-queue.md`. Include the `Co-Authored-By` trailer. Push to `origin main`.

## Autonomous mode

Run Steps 1-6 end-to-end without pausing. If the queue is already above 30 unconsumed items, exit cleanly without a commit.
