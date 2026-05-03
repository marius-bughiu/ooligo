# Content Voice

This document is the operative voice guide for every entry on ooligo. It is referenced from `CONTENT_PIPELINE.md`'s pre-commit checklist and enforced (in part) by `npm run check:vocab`.

The bar in `CONTENT_PIPELINE.md` covers *what* a page must say. This doc covers *how* it must say it. Voice consistency at scale is the failure mode that bites every LLM-authored content site — sessions drift, vocabulary regresses to the LLM's mean, opinions get hedged into mush. A hard list anchors every session.

## The voice in one paragraph

We write peer-to-peer to an ops leader who has 40-100 tools to evaluate per quarter, ships integration code, runs a forecast call on Friday, and has zero patience for vendor copy. We rank, we recommend, we say what's bad. We name names. We use the actual price, not the marketing price. We pick a side. We don't hedge to look balanced; we hedge only when we're actually uncertain, and we say what would resolve the uncertainty.

We are not a vendor. We don't say "they offer." We say "Outreach offers" or "Outreach has." We don't say "we believe" or "in our view" — those are corporate-voice tells. We just say what we think directly.

## Sentence and paragraph rules

| Rule | Target |
|---|---|
| Average sentence length | 18-22 words across the entry |
| Maximum sentence length | 35 words (and only one of these per paragraph) |
| Minimum sentence length | 6 words (variety is required — at least one short sentence per ~8) |
| Paragraph length | 2-5 sentences default; one-sentence paragraphs allowed for emphasis only |
| Adjacent paragraphs of identical length | Avoid — visual monotony signals authorial drift |

The sentence-length variety rule matters. An entire page at 22-word average reads as competent and forgettable. Mix in a 9-word punch and a 28-word qualifier, and the reader stays awake.

## Banned vocabulary (enforced via `npm run check:vocab`)

These words and phrases trip the CI check and fail the pre-commit. They are banned because they consistently appear in LLM output as filler — they sound substantive but communicate nothing.

### Confidence theater

Words that assert quality without evidence. The reader's question is always "how do you know?" These words don't answer it.

```
best-in-class
best-of-breed
world-class
industry-leading
industry-standard
cutting-edge
state-of-the-art
next-generation
revolutionary
disruptive
innovative
game-changing
game-changer
powerful
robust
seamless
seamlessly
intuitive
elegant
sleek
sophisticated
comprehensive
holistic
unified
unparalleled
unrivaled
unmatched
unique
distinctive
```

If a tool genuinely is the best at something, name the specific scope where it's the best ("the only ATS with native MCP support") instead of asserting "best-in-class."

### Hedging without numbers

Hedge words used without a quantitative qualifier. "May be useful" — for whom, in what scope, with what probability? Either commit or get specific.

```
may
might
could potentially
could possibly
tends to
generally
typically (without a number)
often (without a frequency)
frequently (without a frequency)
sometimes
in many cases
in some cases
arguably
perhaps
```

Allowed: "tends to land at $25-35K ARR" (number qualifies). Banned: "tends to be useful for sales teams" (no anchor).

Allowed: "typically 60-90 days to ROI" (number). Banned: "typically pays back" (no anchor).

### Filler frames

Phrases that announce that the next sentence will say something, instead of saying it.

```
it's worth noting that
it's important to remember that
it should be noted that
needless to say
suffice to say
as mentioned above
as previously discussed
in conclusion
to summarize
in summary
moving on
let's look at
let's examine
let's explore
let's dive into
let's take a closer look
```

If the point is worth noting, just note it. The framing sentence is a clearing-of-throat.

### Corporate-voice tells

Phrases that signal "we are a marketing department." Banned because they distance the editorial voice from the reader.

```
we believe
in our view
in our experience (without naming the experience)
we've found that (without naming the data)
our team thinks
solutions
offerings
leverage
leveraging
empower
empowers
empowering
unlock
unlocking
streamline (without naming what gets streamlined)
optimize (without naming what gets optimized)
deliver value
drive results
drive outcomes
mission-critical
turnkey
synergy
synergies
ecosystem (when used to mean "set of related products")
```

Replacement patterns:

| Banned | Use instead |
|---|---|
| "leverage X" | "use X" |
| "we believe X is the best for Y" | "X is the best for Y" |
| "comprehensive solution" | name what it actually does |
| "drives results" | name the result + the metric |
| "streamlines workflow" | name the steps it removes |

### Modal stacking

Two or more hedge words on the same claim. Always banned regardless of context.

```
could potentially
might possibly
may sometimes
could conceivably
might arguably
```

## Reporting voice

We report. We are not the vendor.

| Avoid (vendor voice) | Use instead (reporting voice) |
|---|---|
| "Outreach offers seamless integration with…" | "Outreach integrates with…" or "Outreach has integrations for…" |
| "Their platform delivers powerful insights" | "Their dashboards surface X" (and name what X is) |
| "The product helps teams to be more productive" | "Teams using it report Y" (and name the data) |
| "It's designed to streamline your workflow" | "It removes the need to manually do Z" |

Subject of the sentence: prefer the named tool, not "the product" / "the platform" / "the solution." Naming anchors the reader; pronouns drift.

## Opinion-density floor

Every page must make ≥ 3 opinionated claims — verdicts, anti-recommendations, "the right pick when," "don't use this for," "the failure mode is."

A page with zero opinionated claims is a description, and descriptions don't help readers make decisions. Vendors describe; ooligo recommends.

The opinion-density rule is what makes the page worth reading instead of the vendor docs. If a reader could get the same content from the vendor's site, the page failed.

## Numbers, not adjectives

Every adjective the page uses to characterize a tool, a feature, a price, a timeline, or a tradeoff should be accompanied by a number when one exists.

| Adjective alone (avoid) | Adjective + number (use) |
|---|---|
| "expensive" | "expensive — $45K MSRP, $28K typical-paid at the 50-seat tier" |
| "fast" | "fast — sub-100ms response on the dashboard, < 30s for the heaviest reports" |
| "long ramp" | "long ramp — 10-14 weeks before the AE is fully productive" |
| "small team" | "small team — 5-15 reps" |
| "scales well" | "scales well — production-tested at 5K-50K-row enrichment runs" |

If you don't have the number, find it. If you can't find it, soften the adjective into an estimate ("approximately," "in the range of") and source the estimate.

## Direct address rules

We address the reader as "you." We never refer to "the user." "The user" is a UX-research term; the reader is a person reading a page.

| Avoid | Use |
|---|---|
| "Users will find that…" | "You'll find that…" |
| "End-users benefit from…" | "You benefit from…" |
| "Customers report…" | "Teams report…" or named-customer language |

The reader is also "the team" — singular, ops-leader-as-decision-maker. Avoid "your organization" (consultant tell). Use "your team" or "your firm" depending on vertical (legal-ops uses "firm").

## Tone calibration

We are blunt without being rude. We rank, we name, we say what's bad — but we don't editorialize for sport.

- "X is overpriced for what it does at the SMB tier" — fine.
- "X is a bad product" — too far; what specifically is bad?
- "If your team is using X for Y, stop" — fine when the recommendation is actionable.
- "X's marketing is misleading" — too close to actionable libel; rephrase as "X's marketing claims Y; the actual capability at the tier most teams buy is Z."

When in doubt: would a reader who works at the named vendor read this and find a specific factual error to dispute? If yes, the language is sharp but defensible. If they'd find an opinion stated as fact with no underlying claim, soften.

## Length earns its keep

Per `CONTENT_PIPELINE.md`, every type has a word floor and a typical-authoritative depth band. The length is a *by-product* of saying the thing. If the page hits the floor only by adding transition sentences, restating headings, or stretching three-line answers into bulleted lists, it fails the bar regardless of word count.

The padding-signals anti-pattern in `CONTENT_PIPELINE.md` is the operative check. Word count is the safety net for the cases where padding signals didn't fire.

## When to break the rules

These rules are calibrated for the catalog's editorial pages (tools, comparisons, learn, workflows, stacks). They don't apply to:

- **Code blocks** — quote whatever the source code or terminal output actually says, including banned words. Code is data, not prose.
- **Customer quotes** — quote what the customer actually said, even if it includes banned words. Mark with proper attribution.
- **Competitor product names** — if a competitor has "Robust" or "Comprehensive" in their product name, use the name verbatim. Banned-vocab check should be configured to allow these via context.
- **Frontmatter values** — schema fields are data, not prose. The check skips frontmatter.

The check skips fenced code blocks (```...```) and inline code (`...`) automatically. Customer quotes inside blockquotes (`> ...`) are also skipped. If a banned word legitimately needs to appear in prose, escape it via inline code: `` `comprehensive` ``.

## Updating this guide

Voice rules evolve with reader corrections (`CORRECTIONS.md`). When a recurring error class points to a voice gap, this doc gets updated and the banned-vocab list expands. Don't add to this list lightly — every banned word is friction on every author. Add only when (a) the word recurs in shipped pages and (b) banning it forces a measurable improvement in the next draft.
