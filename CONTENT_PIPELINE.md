# Content Pipeline

Content on ooligo is authored directly by LLMs (Claude, primarily) operating on this repo. There is no separate content-generator service, no scheduled CI job that synthesizes pages, and no human-review gate. An LLM authors a page; validators check it; CI builds and deploys it.

This document is the contract that any LLM working on this repo follows when adding or updating content. **Authoring is EN-only.** Translation is a separate, autonomous job — see "Translation queue and skills" below.

## The rule

> **When an LLM adds or edits a page, it writes EN only.**

Concretely: a new tool entry means one file — `tools/en/<slug>.mdx`. A new comparison, workflow, or learn entry: same per-locale subdirectory layout, EN only. The ES and pt-BR variants are produced separately by `/translate-es` and `/translate-pt-br`, which read `<locale>_TRANSLATION_QUEUE.md` and drain it one page at a time.

The same rule applies to updates. Editing the EN entry changes its body's SHA-256, which the queue script picks up as `stale` for every non-canonical locale on the next run.

## Authoring model

```
LLM session (Claude Code, claude.ai with repo MCP, etc.)
  │
  ├─ Reads sources (official docs, pricing pages, public APIs, Reddit/HN signal)
  ├─ Writes content/<entity>/en/<slug>.mdx
  ├─ Commits the EN file
  └─ Pushes
       │
       ▼
  CI: validate config + typecheck + Astro build
       │
       ▼
  CI: deploy to Cloudflare Pages
       │
       ▼
  Later (separate sessions):
    /translate-es      drains es_TRANSLATION_QUEUE.md one page at a time
    /translate-pt-br   drains pt-BR_TRANSLATION_QUEUE.md one page at a time
```

The authoring LLM is responsible for getting the EN content right. The validators catch structural mistakes (schema violations, broken links, mismatched frontmatter) but they don't substitute for editorial judgment.

## Frontmatter discipline

Every entity file has frontmatter validated against the JSON Schema in `content/.schema/`. Mirror schemas live in Astro content collections in `apps/web/src/content.config.ts` so the build fails fast on drift.

Required fields on every EN page:

- `slug` (must match filename)
- `canonical_slug` (shared across locale variants — this is how hreflang clusters are computed)
- `locale: en`
- `verticals` (array of vertical IDs from `content/verticals.json`)

Translation-specific frontmatter (`translated_from`, `translated_at`, `translation_model`, `source_sha256`) is the responsibility of the translation skills — see `.claude/skills/translate-<locale>/SKILL.md`.

## Translation queue and skills

Translation parity is enforced by tooling, not authoring discipline:

- **`npm run queue:translations`** — scans every collection × non-canonical locale and writes `es_TRANSLATION_QUEUE.md` and `pt-BR_TRANSLATION_QUEUE.md` at the repo root. An item appears as `missing` if no translated file exists, or `stale` if the SHA-256 of the EN body no longer matches the `source_sha256` stored on the translated file's frontmatter.
- **`npm run hash:en -- <path>`** — prints the SHA-256 of an EN file's body. The translation skills use this to compute the value for `source_sha256` when writing a translated file.
- **`/translate-es` and `/translate-pt-br`** — project-scoped skills under `.claude/skills/`. Each invocation translates the next item in the queue, validates the build, regenerates the queue, and commits + pushes to `main`. Translation glossary (never-translate proper nouns, fixed industry terms) and regional register live in those skill bodies, not here.

## Quality bar (the LLM author's responsibility)

The authoring LLM is on the hook for:

1. **Factual accuracy** — pricing, integrations, capabilities. If the LLM isn't sure, it says so or omits the claim. Never invent integrations or pricing tiers.
2. **Currency** — `last_reviewed` date matches when sources were actually checked. Don't backdate.
3. **Cross-linking** — every entity links to related entities per ARCHITECTURE.md's link-budget rules. Validators check structural existence; the LLM checks relevance.
4. **Voice consistency** — confident, opinionated, structured. We rank, we recommend, we say what's bad. We don't G2-hedge.

The translating LLM (per the per-locale skills) is on the hook for translation parity — the ES/pt-BR variants must say the same things as EN. That's enforced in the skill bodies.

### What "best-in-class" actually means

Necessary but insufficient: factual accuracy, currency, cross-linking, voice. Those rule out blatant errors. They don't catch the more common failure mode — *competently shallow* content. A page can pass every validator and still read like a confident blog post that nobody can act on. Best-in-class content is the opposite: a reader can stand up the workflow, ship the change, or make the buying decision from this single page.

Concrete signals:

- **Every claim names a real thing.** A real tool, endpoint, flag, role, query, threshold, or number. "Configure rate limiting" is not a claim; "exponential backoff with jitter, base 1s, max 60s, 5 retries for idempotent operations" is. If the author doesn't know the real value, the author finds it or omits the claim.
- **Every workflow body answers five questions.** When do I use this? When do I *not* use this? What does success look like as a metric I can watch move? What does it cost me — in tokens, time, ops headcount? What's the alternative I'm picking against (DIY script, off-the-shelf product, status quo) and why is this better in this case?
- **Every watch-out cites the guard.** "Hindsight bias is a risk" is filler. "Hindsight bias is a risk; the Skill returns 'insufficient data' rather than guessing when fewer than 3 timeline events exist within 30 days of the churn date" is the watch-out paired with the specific behavior that mitigates it. If the author can't name a guard, the watch-out goes back into the draft as a TODO until they can.
- **Length is the by-product.** Workflow MDX bodies typically land at 800-1500 words once the author has actually said the thing. Bodies under ~600 words are usually a signal that decisions are being skimmed. The fix isn't padding — it's writing what was missing.

### Per-artifact-type minimum bundle

Every workflow ships an artifact bundle at `apps/web/public/artifacts/<slug>/` that the reader downloads and adapts. The bundle, not the MDX body, is the deliverable. The MDX body explains when and how to use it. Per-type minimums:

- **`n8n-flow`** — complete export `.json`, every node fully configured (not stub parameters). Placeholder credentials referenced by name (`PLACEHOLDER_<TOOL>_CRED_ID`). `executionOrder` and `timezone` set explicitly in `settings`. Every Cron node names its timezone. Code nodes contain real logic, not `// TODO`. Sibling `_README.md` covering: import procedure, credential setup (one section per credential), first-run verification (a sequence of small inputs that prove each branch works).
- **`claude-skill`** — `SKILL.md` with frontmatter (`name`, `description`) + sections for: when-to-invoke (and when not to), inputs (required + optional, types), reference files loaded from `references/`, method (the steps the Skill runs, in order, with the engineering choices named — why two-pass, why a particular threshold), output format (a literal example, not a description), watch-outs paired with guards. 1-3 reference docs as `references/*.md` — fillable templates the user adapts (not "TODO" — actual scaffolding with placeholder content the user replaces).
- **`mcp-server`** — `README.md` + `pyproject.toml` (or `package.json` for TS) + working scaffold importable from disk (not pseudocode). Minimum 3 tool definitions with proper input schemas + dispatch implementations. Read-only by default; writes only with explicit per-tool justification. README documents: install, env vars (one section per var, with where to find the value), Claude Desktop / Code registration JSON, sanity-check invocation, security model (token scope, who sees what data), known limits with a numbered TODO list before production use. Disclaim explicitly when the scaffold has not been runtime-tested.
- **`cursor-rule`** — full `.cursorrules` (markdown) with: a "before writing code, ask" section (the questions Cursor must surface to the user before generating); tool-specific guidance per tool the workflow names (one subsection each, with real endpoints/limits/quirks); defaults to enforce (rate-limiting, idempotence, observability, secrets — all four, with concrete values); anti-patterns to refuse with the reason; a "when the user is wrong" section naming the specific shortcuts to push back on.
- **`prompt`** — organized into tiers (e.g. portfolio / single-instance / meeting-prep / cross-cutting). Each prompt is structured: role / context / input format / task / things-to-avoid / output format. Ready to paste into Claude.ai or Claude Code, not paraphrased examples. Every "things-to-avoid" lists the specific failure mode being guarded against (vague hedging, inventing data, generic advice, etc.).

### Anti-patterns to refuse

The author rejects its own draft and rewrites if any of these appear:

- Setup steps that say "configure X" without specifying *which* values change.
- "How it works" paragraphs that describe the flow without naming the engineering choices (why this method? why this threshold? why this fallback?).
- Watch-outs without a paired guard.
- Body that doesn't reference the artifact bundle by file path.
- Sections labelled with future tenses ("will eventually support…", "we plan to add…") — if it's not in the bundle today, it's not in the page.
- Round-number claims with no source ("90% of teams"). Either find the real number or drop the claim.
- "Comprehensive", "robust", "seamless", "best-in-class" used as evidence — they're conclusions, not arguments. See `CONTENT_VOICE.md` for the full banned-vocabulary list.
- **Padding signals** (any of these means rewrite, not pad): transition sentences that don't advance the argument ("Now let's look at…", "Moving on to…"); restating the section heading in the opening sentence ("In this section we'll cover the watch-outs…"); bullet lists where two sentences of prose would be tighter; hedge stacking ("could potentially might be useful"); confidence theater ("This robust solution provides comprehensive coverage"); filler frames ("It's worth noting that…", "It's important to remember that…").

### Pre-commit checklist

The author runs this against every workflow draft before committing. If any box is unchecked and there is no documented reason for an exemption, the draft goes back:

- [ ] Body is ≥ 800 words (signal for depth, not the goal — confirm the words are doing work, not padding)
- [ ] Has explicit "when not to use" content
- [ ] Has cost / throughput / budget numbers, not adjectives
- [ ] Names ≥ 3 specific failure modes, each paired with a guard
- [ ] References the artifact bundle's file paths in the body
- [ ] Artifact bundle exists at `apps/web/public/artifacts/<slug>/` and meets the per-type minimum above
- [ ] Compares against ≥ 1 specific alternative (DIY, status quo, named off-the-shelf product) with a reason for the choice
- [ ] Every numerical claim has a source bucket (vendor docs, public earnings, named customer interview, or marked as estimate) per the source rules in **Editorial accountability** below
- [ ] No banned vocabulary (run `npm run check:vocab` — see `CONTENT_VOICE.md`)
- [ ] No padding signals (see anti-pattern list above)

The same shape — concrete signals, per-type minimum, anti-patterns, pre-commit checklist — applies to every other content type on the site. Per-type bars follow.

## Per-type quality bars

The workflow bar above is the most demanding because workflows ship a downloadable artifact bundle on top of the MDX body. Tools, comparisons, learn entries, and stacks ship MDX only — the body *is* the deliverable, and the bar is set on the body alone.

The recurring pattern: every entry must answer questions a reader can otherwise not act on. The reader of a tool page is deciding whether to evaluate, buy, or skip it. The reader of a comparison page is deciding which of N options to pick. The reader of a learn page is deciding whether they understand the concept well enough to use it in their own work. The reader of a stack page is deciding whether to copy the combination or assemble something else.

A page that doesn't move the reader off neutral on its decision is filler, regardless of how well-written or how long.

### Tools

A tool entry is a buying-decision aid for an ops leader who has 40-100 tools to evaluate per quarter. The reader needs the page to do the elimination work for them.

**Concrete signals:**

- The page names the specific scoped use case where this tool is the right pick — not "for sales teams," but "for outbound SDR teams in the 5-25 rep range building dedicated-domain warm-up infrastructure."
- Pricing reality is named, not just MSRP. "$45/seat list" is the website. "$28/seat at the 50-seat tier with annual commit" is what teams actually pay; that's what the reader needs.
- The page tells someone explicitly NOT to use it. The anti-ICP is the highest-signal sentence on the page — it eliminates 30-60% of readers in one line and saves them an evaluation cycle.
- ≥1 alternative is named with the rule for picking it instead.
- "Watch-outs" name implementation gotchas (long ramp, vendor support quality, integration debt), not generic "be sure to evaluate carefully."

**Suggested body shape — floor 400, typical 500-800 words:**

- *What it is* (1 paragraph: category, what it does, what category leader it most resembles)
- *Why it shows up in [vertical] stacks* (the concrete reason — "only one with native MCP support," "lowest-cost tier that has API access")
- *Pricing reality* (MSRP, typical-paid, the tier you need for the use case, what the next tier up unlocks)
- *Best for* (role + scoped use case + the segment band where ROI is best)
- *Versus the alternative* (≥1 named competitor, the rule for picking each, pricing/scope tradeoff)
- *Watch-outs* (each paired with a guard — implementation gotchas, vendor-support quality, integration debt, ramp time)

A tool page under 400 words is almost always skipping a decision. The exceptions: very narrow point-tools (one feature, one segment) genuinely don't need more, and a glossary-style entry is allowed to land at 200-300. Both are rare.

**Anti-patterns to refuse:**

- "Collaborative platform for modern teams." — meaningless.
- "Scales to any team size." — false; flag the size band where ROI inverts.
- Listing the MSRP from the pricing page without naming what teams actually pay.
- No anti-ICP — every tool has someone who shouldn't use it; if you can't name them, the page isn't done.
- Watch-outs that aren't paired with a guard ("watch out for vendor lock-in" → so what; "watch out for vendor lock-in — Outreach's contact-record schema is proprietary; export to a neutral format quarterly" → actionable).

**Pre-commit checklist:**

- [ ] Body ≥ 400 words (typical authoritative depth: 500-800; under 400 almost always means a skipped decision)
- [ ] Names ≥ 1 specific scoped use case where this tool is the right pick
- [ ] Names the real-world price band, not just the MSRP from the pricing page
- [ ] Names ≥ 1 alternative + the rule for picking it instead. **Competitive coverage**: the named alternative(s) must include the top 2 by market share in the segment AND the fastest-growing entrant — not the easiest-to-write-against. Naming a weak alternative satisfies the form and misleads the reader.
- [ ] If `affiliate_link` is set in frontmatter, the body includes an inline disclosure ("ooligo earns a referral fee on signups via this page — the recommendation is unaffected; see `CORRECTIONS.md` if you spot bias") and the recommendation is held to the same bar as a non-affiliated entry. If you can't write the entry honestly with affiliation in mind, drop the affiliate link.
- [ ] Has an explicit "best for…" line that names the role + use case
- [ ] Has ≥ 2 watch-outs each paired with a specific guard
- [ ] `last_reviewed` matches the date sources were actually checked (no backdating)
- [ ] No vague-superlative evidence (treat "best-in-class," "comprehensive," "robust," "seamless," "powerful," "intuitive" as red flags — strip on review unless backed by a specific claim)

### Comparisons

A comparison entry is a routing rule. The reader has narrowed the field to 2-N options and needs the page to tell them which one to pick — and when.

**Concrete signals:**

- Both sides win at something specific. "It depends" without a routing rule is filler.
- Pricing comparison is quantified ("2-3× difference at the same scope," not "more expensive").
- The verdict is opinionated and routes by use case ("pick X when Y; pick Z when W"), not "either is fine."
- The page names what to do if *neither* fits — the status-quo, the DIY, or the third tool that should be in the consideration set.
- Failure modes of picking the wrong one are named ("Findem at SDR scale will burn budget").

**Suggested body shape varies by `type`:**

- **Pairwise** — floor 600, typical 700-1100: *Where X wins* / *Where Y wins* / *Pricing reality* / *Implementation effort* / *Verdict — pick X when…, pick Y when…, pick neither when…*
- **Roundup** — floor 700, typical 900-1500: One section per option (use-case the option wins at, with the specific scope where it pulls ahead) / *What's not on this list and why* / *Minimum viable choice* (default if you can't justify going deeper) / *When to revisit*
- **Alternatives** — floor 700, typical 900-1400: *What you're leaving (status-quo or named tool)* / *Each alternative's shape and tradeoffs* / *Match rules — switch to X when Y* / *When the status quo wins (don't switch yet)* / *Migration cost* (the part most readers underestimate)

A pairwise comparison under 600 words almost always punts on at least one of: pricing reality, implementation effort, or the "neither" verdict. A roundup under 700 is usually featurelist-with-headers, not a routing rule.

**Anti-patterns to refuse:**

- "Both are great." — refuses to do the work.
- "It depends on your use case" without naming the use cases.
- Feature-list framing without differential framing — listing features both have is noise.
- Pricing comparison without a multiplier or band.
- Roundup that doesn't name what's *not* on the list.
- Verdict that names neither option as the default — sometimes the right verdict is "if you can't decide, pick X; you can switch later."

**Pre-commit checklist:**

- [ ] Body ≥ 600 words for pairwise, ≥ 700 for roundup/alternatives (typical authoritative depth: 700-1500)
- [ ] Each option has at least one specific category where it wins (no fence-sitting on every dimension)
- [ ] Pricing comparison is quantified (ratio, band, or per-unit) — not "more expensive"
- [ ] Has a "Verdict" / "Pick X when…" / "Match rules" section with routing logic
- [ ] **"The pick" discipline** — names a single default if the reader can't decide between the named conditions:
  - *Pairwise*: "If you're choosing in a vacuum without the conditions above, pick X. You can switch to Y later if condition Y emerges."
  - *Roundup*: "Minimum viable choice if you can't justify going deeper: X."
  - *Alternatives*: "If the status quo is Y and budget allows the switching cost, default to X."
- [ ] Names what to do if neither/none of the options fit (status quo, DIY, third tool)
- [ ] No "it depends" hedge unless immediately followed by what it depends on
- [ ] `last_updated` matches when sources were actually re-checked

### Learn

A learn entry is an answer to a specific question the reader has typed (or would type) into Google or Claude. The `target_questions` array in frontmatter is the contract: the body must answer those questions, in the first paragraph if possible (AEO/SGE optimization), in depth below.

**Concrete signals (vary by `type`):**

- **Definition** — first sentence defines the thing. Second paragraph names what it is *not*. Then who cares, why it matters, related concepts.
- **FAQ** — the question is the H1 or first sub-heading. One-paragraph direct answer. Then nuance, edge cases, watch-outs.
- **How-to** — numbered steps with the actual tools, files, commands named. Prerequisites listed. Success criteria specified.
- **Framework** — the framework is rendered explicitly: a formula, a decision tree, a table with calibrated values. Generic "consider these factors" is filler.
- **Glossary** — short, definitional. Cross-links to longer learn entries or tools where the term is operative.

**Suggested body shapes (floor / typical authoritative depth):**

- *Definition* — floor 600, typical 700-1200 words: lead-with-answer paragraph; what it is; what it isn't; who cares; how it shows up in real ops work; related concepts; common pitfalls each paired with a guard
- *FAQ* — floor 400, typical 500-900 words: direct answer in first 100 words; the nuance; edge cases; related questions; what to do if the answer doesn't apply
- *How-to* — floor 800, typical 1000-1800 words: prerequisites; numbered steps with named tools/commands/files at every step; success criteria; common errors with their fixes; when to escalate
- *Framework* — floor 800, typical 900-1500 words: when to use it; the framework rendered explicitly with calibrated values; worked example with real numbers; common pitfalls with paired guards; when the framework breaks down
- *Glossary* — floor 200, typical 300-500 words: definition; usage in context; related terms; this is the only learn type allowed to stay short

A definition under 600 words usually defines the concept but skips "how it shows up in real ops work" — the part that turns a definition into something the reader can use. A how-to under 800 usually skips the troubleshooting half.

**Anti-patterns to refuse:**

- Definitional content that buries the definition. The first sentence answers "what is X?" — not "X is an increasingly important concept in modern…"
- Frameworks without calibrated values. "Pipeline coverage should be appropriate to your stage" is filler. "SMB pipeline coverage 2.5-3.5× quota; Enterprise 4.5-6.0× quota" is the framework.
- How-tos that don't name actual tools/commands/files. "Configure your CRM" → "In HubSpot Settings → Properties → Custom Properties, add `Last_QBR_Date` as a Date type."
- "It varies by company" with no calibration band.
- Listicles without a "minimum viable choice" or default recommendation.
- Round-number claims with no source ("70% of teams…"). Either find the real number or drop the claim.

**Pre-commit checklist:**

- [ ] Body meets the per-type floor (definition 600, FAQ 400, how-to 800, framework 800, glossary 200) — typical authoritative depth runs higher
- [ ] First paragraph directly answers the primary `target_questions` entry — AEO snippet-worthy
- [ ] For *definition* type: explicit "what it is NOT" content within the first 200 words
- [ ] For *framework* type: specific values, calibrated bands, not placeholder generics
- [ ] For *how-to* type: numbered steps + named tools/commands/files at every step
- [ ] Has a "Common pitfalls" / "Watch-outs" section with paired guards
- [ ] Cross-links to ≥ 1 related tool, workflow, or learn entry where the reader can act
- [ ] `last_updated` matches when sources were actually checked

### Stacks

A stack entry is a copyable recipe — a curated tool combination with named roles and stated cost. The reader is deciding whether to adopt the stack wholesale, swap one tool, or assemble something different.

**Concrete signals:**

- Each tool has a specifically-named role (intent layer, orchestration layer, last-mile delivery), not "we use these and they work."
- The handoffs between tools are named ("6sense fires intent → Outreach enrolls → Gong confirms the call happened"), not implied.
- Cost baseline is named (annual ballpark for the whole stack, per-seat band, or flat).
- Match rules — when this stack is the right pick (segment, motion, scale) and when it isn't.
- Common variations — the 2-3 ways teams actually swap tools, with the reason for each swap.
- "What this stack does NOT solve" — the gaps. Sets reader expectations and prevents the stack from being misread as a complete answer.

**Suggested body shape — floor 700, typical 900-1500 words:**

- *How the pieces fit* (per-tool role + handoffs — name the trigger event in tool A and the resulting action in tool B)
- *Why this combination* (the load-bearing reason — single source of truth, lowest integration debt, the segment band where the per-seat math works)
- *Cost reality* (annual stack cost band, per-seat or flat, plus the "hidden" costs — implementation, integration headcount, ramp time)
- *Match rules* (the segment / motion / scale where this stack is the right pick, plus the band where it isn't)
- *Common variations* (2-3 swaps and the rule for each — "swap Gong for Chorus when video-recording is required by compliance")
- *What this stack does NOT replace* (the gaps — sets reader expectations, prevents over-buy)

A stack under 700 words almost always lists tools without naming roles or handoffs. The "how the pieces fit" section alone needs ~50-80 words per tool to do the work; for a 5-tool stack that's already 250-400 words before any of the other sections.

**Anti-patterns to refuse:**

- "We use these tools and they work great" — no roles, no handoffs, no cost.
- Missing cost reality. The reader is comparing this stack to their current spend; without a number they can't.
- "Industry standard" framing without naming the load-bearing reason this combination wins.
- Stacks without a "what this doesn't solve" — readers assume completeness and over-buy.
- Variations described in passing ("you could swap X for Y") without naming when each swap is right.

**Pre-commit checklist:**

- [ ] Body ≥ 700 words (typical authoritative depth: 900-1500)
- [ ] Each tool in the `tools[]` array has a specifically-named role in the body (not just listed)
- [ ] Handoffs between tools are named (which event in tool A triggers which action in tool B)
- [ ] Cost baseline (annual range, per-seat band, or flat) — not adjectives
- [ ] Names ≥ 1 common variation + the rule for when to swap
- [ ] Has a "What this stack does NOT replace" section with the gaps
- [ ] Has match rules — when this stack is the right pick + when it isn't (segment, motion, scale)
- [ ] No "best practice" framing as evidence — pick a real reason this combination wins

## What the validators actually catch

In CI (`npm run validate:config` and `npm run build`):

- **Frontmatter schema** — every file's frontmatter is validated against its JSON Schema. Missing required fields, invalid enums, malformed types → build fails.
- **Content collection schema** — Astro re-validates the same shape via Zod schemas in `content.config.ts`. Two checks for the price of one.
- **Link integrity** — internal links that resolve to no page break the build (Astro raises on broken `<a href>` to a non-existent route).
- **hreflang correctness** — `BaseLayout` only emits hreflang for locale variants that actually exist (computed from `canonical_slug` matches in the collection). Never points at 404s.
- **Markup validity** — JSON-LD blocks must parse as JSON. Astro's MDX compiler enforces.

Validators do **not** check:
- Whether the content is true
- Whether the translation captures the original meaning
- Whether the recommendation is sound

Those are the LLM author's (and translator's) job.

## Editorial accountability

The quality bar above catches *form-shallow* content (no anti-ICP, no quantified pricing, watch-outs without guards). It does not catch *substance-wrong* content (a confident anti-ICP that is wrong, a quoted price that's stale, a recommendation skewed by an undisclosed affiliation). This section closes the substance gap.

### Sources for every numerical claim

Every numerical or specific-fact claim must trace to a named source bucket. The source doesn't have to be cited inline (citation noise drowns the page) — it has to exist in the author's notes, and the bucket has to be one of these four:

1. **Vendor docs / pricing page** — for capability and MSRP claims. Vendor-direct, dated.
2. **Public earnings / press / SEC filings** — for revenue, growth, headcount, customer counts. Quote the report and date.
3. **Named customer interview** — for "teams pay $X at this scale" or "ramp takes Y weeks." Anonymized in the body, but the author has talked to a real customer at a named company.
4. **Public benchmark / industry report** — for round-number-class claims ("60-70% of teams use…"). Source the report by name; if you can't find one, drop the claim.

A fifth bucket — **Estimate** — is allowed but must be marked in the body (e.g. "approx.", "~", "estimate based on…"). Estimates can't be the load-bearing reason for a recommendation.

If a claim doesn't fit any bucket, it doesn't go on the page. "Anecdotally," "we hear," "many teams" — these are not source buckets, they are confessions that the claim is unsourced.

### Freshness SLAs

Pricing changes, vendors get acquired, tools sunset. `last_reviewed` is the contract — when it goes stale beyond these SLAs, the entry is failing the bar regardless of how well it was written originally.

| Entry type | Field-level SLA | Whole-body SLA |
|---|---|---|
| Tools — pricing fields | 60 days | — |
| Tools — body | — | 120 days |
| Comparisons | — | 180 days |
| Workflows | — | 180 days |
| Stacks | — | 120 days (cascades on any constituent tool's refresh) |
| Learn — definition / framework / FAQ / glossary | — | 12 months |
| Learn — how-to | — | 6 months (UI screenshots and command syntax drift fastest) |

The freshness check is mechanical: for every entry, `today - last_reviewed > SLA` fails the bar. Refresh = re-author from current sources, bump `last_reviewed`. The translation queue will mark non-canonical locales stale automatically (via SHA-256 drift on the EN body), and subsequent `/translate-<locale>` runs will re-translate.

A future CI script (out of scope today) will surface entries past their SLA in a weekly digest. Until then, the responsibility sits with whoever opens the entry's MDX file: if the date is past SLA, refresh before any other edit.

### Higher-risk page classes

Every page on this site is LLM-authored end-to-end, with no human review gate. That is the operating model. It is the right model for a catalog of this scale; a human gate would cap throughput long before it caught a meaningful share of errors that the per-type quality bars and validators don't already catch.

Some page classes carry more downstream consequences when they're wrong. The author's response to that is not "wait for review" — it is to spend more time on the per-type checklist, source-bucket discipline, and the watch-out / paired-guard rule, before merge. The classes are:

- **New tool entries** — first-time additions to the catalog. The risk is misclassification (wrong category, wrong segment band) that ripples through every comparison and stack that subsequently links to the tool. Mitigation: confirm category against ≥ 2 existing entries in the same category before merge; cross-link to the comparisons / stacks the new tool plausibly belongs in.
- **Comparison verdicts that move a tool's ranking by ≥ 2 positions** — relative to the prior version of the comparison, OR relative to other comparisons that include the same tool. The risk is shifting recommendations on noise. Mitigation: the verdict change cites the specific evidence (vendor change, customer-interview signal, market-share shift) that drove the move; if no specific evidence exists, the verdict doesn't move.
- **Anything in legal/compliance space** — the `legal-ops` vertical, or any entry that cites NYC LL 144, EU AI Act, GDPR, CCPA, SOC 2, ISO 27001, HIPAA, or named bar association rules. The risk is asserting a legal interpretation that's wrong. Mitigation: the page describes what the regulation requires, not what counsel should advise; jurisdiction-specific advice is hedged with "consult counsel"; citations resolve to the regulation itself, not to secondary commentary.
- **Affiliate-linked entries** — see "Affiliate disclosure" below.
- **Sunset / deprecation pages** — when a tool is being marked end-of-life, removed, or has a major-version-breaking change. The reader's existing setup may depend on the tool. Mitigation: name the migration path; preserve the prior page at the original URL with a `superseded_by` pointer; do not delete.

Mistakes in any class still happen and get corrected through `CORRECTIONS.md` (see below). The site's defensibility comes from the correction loop, not from a human pre-merge gate.

### Affiliate disclosure

The `affiliate_link` field in the tool schema is allowed but carries an obligation: the page must be honest about the affiliation, and the recommendation must be the same recommendation we would make without it. Two rules:

1. **Inline disclosure**: every affiliate-linked entry includes a one-line disclosure in the body (suggested: "ooligo earns a referral fee on signups via this page — the recommendation is unaffected; report bias via `CORRECTIONS.md`."). The disclosure goes near the recommendation, not buried at the bottom.
2. **Independence test**: before adding `affiliate_link`, the author asks "would I recommend this tool with the same emphasis, in the same scope, against the same alternatives, if there were no referral fee?" If the answer is no, drop the affiliation. The page's editorial integrity is more valuable than the referral.

Affiliate-linked entries don't get a separate review gate either, but the author runs the independence test explicitly before merge and records the answer in the commit message ("independence test: would recommend at same emphasis without affiliation — yes, because…"). If the answer is no, drop `affiliate_link` rather than ship the conflict.

### Voice consistency

Voice rules — sentence length bands, hedging vocabulary, the explicit banned-word list, opinion-density floor, "reporting voice" rules — live in `CONTENT_VOICE.md`. The pre-commit checklist enforces them via `npm run check:vocab` (banned-vocab scan; pure-form check that fails CI on any banned term).

Voice consistency at scale is the failure mode that bites most LLM-authored sites. Without a hard list, sessions drift. With one, every session anchors on the same vocabulary.

### Correction loop

When a reader reports an error, where does it go and how does the bar learn? The answer is `CORRECTIONS.md` at the repo root.

1. Reader reports an error → triage within 7 days → fix the page or close-with-reason → log the entry in `CORRECTIONS.md`.
2. Each entry records: date, source (GitHub issue / email / Slack), affected page, error class (factual / stale / voice / missing context / bias), resolution commit SHA, reviewer.
3. **Quarterly review**: scan the log for recurring error classes. If a class recurs ≥ 3 times in a quarter, the bar is missing something — update `CONTENT_PIPELINE.md` or `CONTENT_VOICE.md` to codify the lesson, and link the doc change back to the corrections that triggered it.

The correction log is the only mechanism by which the quality bar improves. Without it, the bar stays static while reality drifts.

### Refresh triggers

A refresh is the same operation as authoring (re-write the entry from current sources, bump `last_reviewed`), and is triggered by:

- A reader opens a GitHub issue with a correction (logged in `CORRECTIONS.md`).
- A scheduled freshness sweep flags an entry past its SLA.
- A vendor announces a material change (pricing, sunset, acquisition).
- A class of recurring error in `CORRECTIONS.md` triggers a re-author against the new bar.

After any refresh, `npm run queue:translations` will mark every non-canonical locale variant as `stale` (because the EN body's SHA-256 changed), and subsequent `/translate-<locale>` invocations re-translate.

## Adding a vertical or locale

- **Adding a vertical** — config update in `content/verticals.json` + tagging existing entries with the new vertical (multi-tag) + a few vertical-specific stack/workflow pages. See ARCHITECTURE.md.
- **Adding a locale** — three steps:
  1. Add the locale entry to `content/locales.json`.
  2. Create `.claude/skills/translate-<locale>/SKILL.md` (clone an existing one and adjust the regional register section).
  3. Run `npm run queue:translations` — every EN entry will appear as `missing` for the new locale. Then drain the queue with repeated `/translate-<locale>` invocations until empty.

## Why no automated generator

Earlier drafts of this doc described a generator pipeline (TypeScript scripts using the Anthropic SDK, structured outputs, back-translation similarity gates, auto-PR bots). That model adds layers of indirection without improving quality, and decouples content authorship from review of source signal.

A Claude session reading the source URLs, considering the audience, writing the entry, and (separately) translating it produces better content than a script with a single canned prompt. The repo is the unit of versioning; the LLM is the unit of authoring.

What we have instead: a script that finds gaps (`queue:translations`) and a skill that fills them (`/translate-<locale>`), both run inside Claude sessions on the repo. That gives us automation where it's mechanical (gap detection, hash bookkeeping) without taking the author out of the loop on content judgment.
