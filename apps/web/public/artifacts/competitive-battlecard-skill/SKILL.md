---
name: competitive-battlecard
description: Build and refresh a competitive battlecard for a named competitor by mining Gong calls (won and lost) and reconciling against Salesforce deal outcomes. Produces a structured Markdown card with positioning summary, win patterns, loss patterns, talk-tracks per objection, and traps to avoid. Use when an active deal involves a named competitor and the existing battlecard is older than 30 days, or when a competitor has materially shifted positioning.
---

# Competitive battlecard

## When to invoke

Invoke when a deal in the active pipeline names a tracked competitor and
the rep needs an objection-handling card the same day. The skill assumes
Gong is the call corpus, Salesforce is the deal-outcome source of truth,
and the competitor is one of the 3-5 you actively track in
`references/competitor-list.md`.

Do NOT invoke for:

- Generic "tell me about competitor X" research with no live deal
  attached. Use a search tool — battlecards rot fast and producing them
  speculatively wastes tokens and creates stale artifacts.
- Customer-facing claims about competitors. Output is internal-only by
  default. The classification rules in
  `references/internal-vs-external.md` exist to gate what can ever leave
  the company.
- Competitors you have never lost to. Without loss data, the skill
  cannot extract loss patterns; it will pad and that padding is the
  exact failure mode the watch-outs guard against.
- Brand-new competitors with fewer than 5 mentions in the lookback
  window. The skill returns "insufficient signal" rather than
  hallucinating.

## Inputs

Required:

- `competitor` — slug matching an entry in
  `references/competitor-list.md` (e.g. `competitor-x`). The slug, not
  the display name, so aliases resolve.
- `lookback_days` — integer, defaults to 180. Use 90 for fast-moving
  categories, 365 for stable ones. The skill clips to the smaller of
  this window and 12 months.

Optional:

- `deal_id` — Salesforce Opportunity ID for the active deal. If
  provided, the skill weights talk-tracks toward objections raised on
  this specific call thread.
- `audience` — `ae` (default) or `pmm`. AE output emphasises
  talk-tracks; PMM output emphasises pattern shifts since the last
  refresh.
- `prior_card_path` — file path to the previous battlecard. If
  provided, the skill diffs and surfaces what is new versus stale.

## Reference files

Always read these from `references/` before generating the card.
Without them the output is generic.

- `references/battlecard-format.md` — the literal Markdown skeleton the
  skill fills. Section order is load-bearing; reps scan top-to-bottom.
- `references/objection-talk-track-library.md` — the canonical pattern
  library (pricing, integration, migration, support, security). The
  skill matches new objections against these patterns rather than
  reinventing handlers.
- `references/internal-vs-external.md` — the classification rules that
  decide which lines may ever appear in customer-visible material. The
  skill marks every claim with `[INTERNAL]` or `[EXTERNAL_OK]`.
- `references/competitor-list.md` — slugs, aliases, product modules to
  differentiate, and the sales motion each competitor leads with.

## Method

Run these five steps in order. The skill does not parallelize; later
steps consume context from earlier ones.

### 1. Pull the call corpus

Query Gong for every call in the lookback window where the competitor
or one of its aliases (per `competitor-list.md`) is mentioned. Pull
call ID, deal ID, call date, and the transcript snippet around each
mention (60 seconds of context each side). Hard cap at 200 calls; if
the result exceeds, narrow the window before sampling.

### 2. Reconcile to Salesforce outcomes

Join each call's deal ID against Salesforce Opportunity. Bucket calls
into: `won` (Closed Won, this competitor named), `lost` (Closed Lost,
this competitor named in the loss reason or as primary competitor),
`open` (still in pipeline), `unknown` (no Opportunity match).

Drop the `unknown` bucket from synthesis — selection bias is too high.
Track the count and report it as a data-quality footnote.

### 3. Extract loss patterns from `lost`

Two-pass extraction. First pass: for each lost-deal transcript snippet,
classify the objection into one of the canonical patterns from
`objection-talk-track-library.md` or `other`. Second pass: for the
`other` bucket, propose new pattern candidates only if the same theme
appears in 3+ deals; below that threshold, list as raw quotes without
generalisation. Three-deal threshold exists because anything lower is
noise dressed as signal.

### 4. Extract win patterns from `won`

Same two-pass approach against the won bucket. The deciding-factor
quote ("we picked you because…") is the highest-signal artifact;
prioritise quotes where the customer explicitly contrasts with the
competitor. Surface these verbatim in the card with the call ID for
verification.

### 5. Assemble the card

Fill the skeleton from `battlecard-format.md`. For each objection in
the talk-track section, pull the matching handler from the library and
adapt it with the competitor-specific evidence found in steps 3-4.
Mark every line with `[INTERNAL]` or `[EXTERNAL_OK]` per the
classification rules. End with a "what changed since last refresh"
diff if `prior_card_path` was provided.

## Output format

```markdown
# Battlecard — {Competitor display name}

_Generated {YYYY-MM-DD} from {N won} / {N lost} / {N open} calls in last {lookback_days}d._
_Data quality: {N unknown} calls dropped (no SFDC match)._

## Positioning summary [INTERNAL]

One paragraph: how this competitor frames itself today, the segment
they lead with, the wedge they price aggressively. Trace each claim to
a public source URL (their pricing page, a recent blog post, a G2
update) so the next refresh can re-check.

## Where we win [INTERNAL]

| Pattern | Deal count | Representative quote (call ID) |
|---|---|---|
| {Pattern 1} | {N} | "{quote}" ({call-id}) |
| {Pattern 2} | {N} | "{quote}" ({call-id}) |

## Where we lose [INTERNAL]

| Pattern | Deal count | Representative quote (call ID) |
|---|---|---|
| {Pattern 1} | {N} | "{quote}" ({call-id}) |
| {Pattern 2} | {N} | "{quote}" ({call-id}) |

## Talk-tracks [EXTERNAL_OK unless flagged]

### Objection: "{Objection 1, customer wording}"

**Handler:** {2-3 sentence rep response, no FUD, no comparative claim
unless cited from a public competitor source.} [EXTERNAL_OK]

**Evidence (internal):** {customer quote from won deal} ({call-id}) [INTERNAL]

### Objection: "{Objection 2}"

(same shape)

## Traps to avoid [INTERNAL]

- {Trap 1: a misstep reps make against this competitor — e.g. matching
  on a feature where the competitor is genuinely stronger.} Guard:
  {what to do instead}.
- {Trap 2}. Guard: {what to do instead}.

## Sources

- Competitor public pages: {URL, fetched YYYY-MM-DD}
- Gong calls: {N} calls, IDs available in appendix
- Salesforce report: {report ID or filter}

## What changed since {prior-card date} (if prior_card_path provided)

- New: {pattern that has appeared since last refresh}
- Faded: {pattern that no longer appears}
- Shifted: {pattern that is now larger or smaller in deal count}
```

## Watch-outs

- **Defamation risk.** Every comparative claim about the competitor's
  product, pricing, or support must trace to a public source the
  competitor has shipped (their pricing page, a published case study,
  an SEC filing). Guard: the skill rejects any `[EXTERNAL_OK]` line
  that does not carry a source URL fetched in this run; flips it to
  `[INTERNAL]` and logs the reason.
- **Stale public data.** Competitor pricing pages change without
  notice and a battlecard built on a 6-month-old screenshot will
  embarrass the rep on the call. Guard: the skill records the
  `fetched` date next to every public-source URL; if any source is
  older than 30 days at generation time, the card prepends a "verify
  before use" banner.
- **FUD versus fact.** Reps want one-liners that crush the competitor;
  Claude is happy to oblige unless constrained. Guard: the skill
  rejects any handler whose subject is the competitor and whose
  predicate is not directly attributable to a customer quote (won
  deal) or a public source (competitor's own page). If neither
  exists, the handler is rewritten in product-positive form ("here is
  how we do X") rather than competitor-negative form ("they cannot do
  X").
- **Internal versus customer-facing leakage.** A handler marked
  `[EXTERNAL_OK]` may still embed an internal-only data point (deal
  counts, won-against rates, internal pricing benchmarks). Guard:
  the second pass scans every `[EXTERNAL_OK]` line against the
  blocklist in `internal-vs-external.md` (deal counts, win rates,
  customer names not in the public reference list, internal pricing
  ranges). Matches are auto-redacted with `[REDACTED — internal
  metric]` and the line stays usable.
- **Selection bias.** Reps under-log the competitor on lost deals —
  the painful losses are the ones least likely to be tagged. Guard:
  the data-quality footnote always reports the `unknown` count;
  whenever it exceeds 20% of pulled calls, the card prepends a
  "competitor-tagging coverage is low — interpret loss patterns with
  caution" banner.
- **Quote accuracy.** Gong transcription mangles technical terms and
  proper nouns. Guard: the skill marks any quote containing a Gong
  confidence score below 0.85 with `[low-confidence transcript]`;
  reps are instructed in the format header to verify those before
  using.
