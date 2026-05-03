# Segment mapping — TEMPLATE

> Replace the rules below with your team's segmentation. The
> weekly-pipeline-report skill applies these rules to assign every deal in
> the snapshot to one segment row in the report. Deals that match no rule
> land in the visible `unsegmented` bucket — never silently dropped.

## Segment definitions

The skill emits one row per segment named here. Order in the report follows the order in this file.

- **Enterprise** — {definition rule, e.g. "deal `amount` >= $100k OR account headcount >= 1000"}
- **Mid-Market** — {definition rule, e.g. "$25k <= `amount` < $100k OR account headcount 100-999"}
- **SMB** — {definition rule, e.g. "`amount` < $25k OR account headcount < 100"}

> If your team segments by industry, geography, or product line instead of
> deal size, replace the dimensions above. The skill is agnostic — it
> applies whatever rules this file declares, in order.

## Assignment rule

When a deal would match more than one segment row, the **first match wins**. That is why segment order in this file matters. If you want amount-then-headcount precedence, list the amount segment first.

## Snapshot column

The skill expects each deal row in the snapshot to carry the columns the rules reference (e.g. `amount`, `account_headcount`, `industry`). If a rule references a column the snapshot does not have, the rule is skipped and the skill logs the skipped rule in the report's footer.

## Owner-to-segment override

Optional. Some teams assign owners to segments rather than deriving from the deal. If an owner-to-segment table is present here, it overrides the deal-level rules above.

| Owner ID  | Owner name      | Segment       |
| --------- | --------------- | ------------- |
| {12345}   | {Alice Example} | Enterprise    |
| {12346}   | {Bob Example}   | Mid-Market    |
| {12347}   | {Carol Example} | SMB           |

## Unsegmented handling

Deals that match no rule (and have no owner-to-segment override) appear in the report as `unsegmented`. The brief surfaces the count even when zero. A non-zero unsegmented count for two consecutive weeks is the signal to revisit this file.

## Last edited

{YYYY-MM-DD}
