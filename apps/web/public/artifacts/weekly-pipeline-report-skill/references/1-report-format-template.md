# Report format — TEMPLATE

> Replace the placeholders below with values from your snapshot. The
> weekly-pipeline-report skill reads this file as the literal layout it
> follows. Edit this file, not the skill, to change the report shape.

# Weekly pipeline brief — Week of {YYYY-MM-DD}

## Headline (vs. last Monday)

- Total open pipeline: {$X.XM} ({up/down/flat} {$Y.YM}, {±Z%})
- Weighted pipeline: {$X.XM} ({up/down/flat} {$Y.YM}, {±Z%})
- Deal count: {NNN} ({up/down/flat}, {±N})
- Avg deal size: {$X.XK} ({up/down/flat} {$Y.YK}, {±Z%})

> Every metric carries a movement-direction word. If the previous-snapshot
> input is missing, replace this whole block with: "Baseline run — no prior
> snapshot to compare against."

## By segment

| Segment      | Open $   | WoW         | Deal count | WoW         |
| ------------ | -------- | ----------- | ---------- | ----------- |
| Enterprise   | {$X.XM}  | {up +Z%}    | {NN}       | {up +N}     |
| Mid-Market   | {$X.XM}  | {down -Z%}  | {NN}       | {flat}      |
| SMB          | {$X.XM}  | {up +Z%}    | {NN}       | {up +N}     |
| Unsegmented  | {$X.XM}  | {-}         | {NN}       | {-}         |

> The unsegmented row stays in the table even when zero — its presence is the
> evidence that the segment-mapping pass actually ran.

## Top 3 deals moving the number

1. **{Deal name}** — {Owner}, {$XXk}. {What changed in plain English: stage transition, new add, scope expansion, slipped close date.}
2. **{Deal name}** — {Owner}, {$XXk}. {What changed.}
3. **{Deal name}** — {Owner}, {$XXk}. {What changed.}

## Top 3 risks

1. **{Deal name}** — {Owner}, {$XXk}. {Risk signal: pushed twice, stage regression, amount cut, dormant.}
2. **{Deal name}** — {Owner}, {$XXk}. {Risk signal.}
3. **{Deal name}** — {Owner}, {$XXk}. {Risk signal.}

## The pattern this week

{One paragraph naming the single biggest pattern across the segments, the moving deals, and the risks. Flat statement, no hedging. If the data is diffuse, write "no dominant pattern this week" rather than padding.}

## Recommended ask

{One sentence the VP can carry into the room. If the pattern was diffuse and no clean ask follows, write "no clear ask this week" — do not invent one.}

---

Operational summary, not a forecast. Forecast is owned by {VP name} and produced in the Friday forecast call.

Snapshot freshness: {N hours} (extractor ran {YYYY-MM-DD HH:MM}). Deals reassigned this week: {N} (excluded from top-moves section).
