# Battlecard format — TEMPLATE

> This is the literal Markdown skeleton the competitive-battlecard
> skill fills. Section order is load-bearing — reps scan top to bottom
> and stop reading at the first useful line. Keep it that way.

```markdown
# Battlecard — {Competitor display name}

_Generated {YYYY-MM-DD} from {N won} / {N lost} / {N open} calls in last {lookback_days}d._
_Data quality: {N unknown} calls dropped (no SFDC match)._
_Verify before use: any source older than 30 days is flagged inline._

## Positioning summary [INTERNAL]

One paragraph. How they frame themselves today, the segment they lead
with, the wedge they price aggressively. Each claim cites a public
source URL with a `fetched` date.

## Where we win [INTERNAL]

| Pattern | Deal count | Representative quote (call ID) |
|---|---|---|
|  |  |  |

## Where we lose [INTERNAL]

| Pattern | Deal count | Representative quote (call ID) |
|---|---|---|
|  |  |  |

## Talk-tracks

### Objection: "{customer wording}"

**Handler [EXTERNAL_OK]:** rep response, 2-3 sentences, no FUD.

**Evidence [INTERNAL]:** customer quote from a won deal (call ID).

(repeat per objection — pricing, integration, migration, support,
security at minimum if patterns exist)

## Traps to avoid [INTERNAL]

- Trap: …  Guard: …
- Trap: …  Guard: …

## Sources

- Public pages: URL, fetched YYYY-MM-DD
- Gong calls: N calls, IDs in appendix
- Salesforce report: report ID or saved filter

## What changed since {prior-card date}

- New: …
- Faded: …
- Shifted: …

## Appendix — call IDs

{flat list of Gong call IDs grouped by bucket: won / lost / open}
```

## Authoring rules for whoever fills this

- Every line carries either `[INTERNAL]` or `[EXTERNAL_OK]`. No line is unmarked. The internal-vs-external classifier in `references/internal-vs-external.md` decides borderline cases.
- Quotes are verbatim. Cleaning up grammar is fine; rewording the meaning is not.
- Deal counts are always raw integers, never percentages. "12 of 47 lost deals" not "26% of losses" — the denominator is meaningful.
- Public-source claims always carry a fetched-date next to the URL. Without it the next refresh has no anchor for diffing.
- Section order is fixed. Do not reorder; reps build muscle memory.

## Last edited

{YYYY-MM-DD} — bump on every material edit so the skill can warn when the format itself is stale.
