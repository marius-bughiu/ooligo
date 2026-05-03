---
name: weekly-pipeline-report
description: Produce the Monday-morning weekly pipeline brief for a sales VP from a HubSpot pipeline snapshot and last week's snapshot. Outputs a one-page markdown report with headline metrics, top deals moving the number, top risks, the single biggest pattern, and a recommended ask. Segment-aware. Stamps every metric with movement direction.
---

# Weekly pipeline report

## When to invoke

Invoke every Monday morning, before the sales VP's pipeline review, to produce the
weekly brief that goes into Slack `#pipeline-review` or the Monday leadership thread.
Input is a current HubSpot pipeline snapshot, last week's snapshot from the same
extractor, and a segment-definitions file. Output is a single markdown report sized
to fit on one screen — the VP reads it in under three minutes and walks into the
review with a point of view.

Do NOT invoke this skill for:

- **Board materials.** The brief is operational. It uses last-week deltas and
  one-week-stale assumptions about what is real. Board reporting needs reconciled,
  audited numbers — pull those from the finance system, not from this skill.
- **Customer-facing reports.** The brief names deals, owners, and risks in language
  that is fine for an internal Slack channel and unsafe to share externally.
- **The actual forecast number.** This skill summarizes pipeline composition and
  movement. It is not a forecast model. Anyone citing the headline number as
  "the forecast" is misusing it. The forecast comes from the forecast call, owned
  by the sales VP and RevOps lead.

## Inputs

Required:

- `pipeline_snapshot` — path to the current HubSpot pipeline export
  (CSV or JSON), one row per open deal, with columns:
  `deal_id`, `deal_name`, `owner_id`, `stage`, `amount`, `close_date`,
  `last_modified`, `segment` (or a column the segment map can join on).
- `previous_snapshot` — path to last Monday's snapshot, same shape.
  Used for week-over-week deltas. If absent, the skill emits a "no comparison
  available" header instead of guessing direction.
- `segments` — path to `references/segment-mapping.md` (or a YAML/CSV of the
  same shape). Defines the segment slices the report uses.

Optional:

- `report_format` — path to `references/report-format-template.md`. If absent,
  the skill uses the embedded default in the Output format section below.
- `hedge_blocklist` — path to `references/hedge-words-blocklist.md`. The
  hedge-removal pass refuses to ship the brief while any blocked term appears
  in the draft.
- `top_n` — integer for "top N deals" and "top N risks" sections. Default `3`.

## Reference files

Read these from `references/` on every run. They are the levers the user adapts
to their team — without them, the report is generic.

- `references/report-format-template.md` — the literal layout the brief follows,
  with placeholder blocks for headline metrics, top deals, top risks, the pattern,
  and the ask. The user edits this file to change the report shape; the skill
  does not invent its own layout.
- `references/segment-mapping.md` — defines the segments the report slices by
  (Enterprise / Mid-Market / SMB, or whatever the team uses) and the rule for
  assigning each deal to a segment when the snapshot does not carry one.
- `references/hedge-words-blocklist.md` — the wording rules. The hedge-removal
  pass rejects a draft if any of these appear. Replace as your team's vocabulary
  evolves.

## Method

Run these steps in order. Do not parallelize — later steps depend on earlier ones.

### 1. Load and validate both snapshots

Read `pipeline_snapshot` and `previous_snapshot`. Confirm that both share the
same column shape and that `deal_id` is unique within each. If `previous_snapshot`
is missing or the schema does not match, set `comparison_mode = none` and
proceed — the brief will skip every WoW figure and label the header as a baseline
run rather than fabricating zero-deltas.

### 2. Join to segment definitions

Apply `references/segment-mapping.md` to assign every deal to a segment. Engineering
choice: segment-aware rather than aggregate. An aggregate "pipeline is up four
percent" hides the case where Enterprise is down twelve and SMB is up thirty —
opposite stories that the VP must respond to differently. The segment slice keeps
the call honest. If a deal cannot be assigned to a segment, route it to a
visible `unsegmented` bucket and surface the count in the report — never silently
drop deals.

### 3. Compute headline metrics, segment-by-segment

For each segment compute: total open pipeline (sum of `amount`), deal count, average
deal size, weighted pipeline (if probability data is present), pipeline by stage.
For each metric: compute the WoW delta (absolute and percent) and a movement-direction
label (`up`, `down`, `flat`). Engineering choice: include movement-direction on
every metric, not just the headline. The VP scans the page in one pass. If only
the top number carries direction, the rest reads as "data" instead of "story" and
the eye skips it.

### 4. Identify the top deals moving the number

For each segment, rank deals by absolute change in `amount` or `stage` since
`previous_snapshot`. Take the top `top_n` (default 3). For each: name, owner,
amount, what changed (stage transition, amount adjustment, new add, slipped close
date), and a one-line plain-English description of the move. Deals with no change
do not appear here — this section is about motion, not size.

### 5. Identify the top risks

Rank deals by risk signal: stage regression, close date pushed for the second
consecutive week, amount cut by more than 25 percent, or no activity for 14+ days
on a deal forecast to close this quarter. Take the top `top_n`. For each: name,
owner, the risk signal, and a one-line description. Engineering choice: surfaces
deals that are *quietly* slipping. The loud risks (CFO email, "we lost") get
escalated through other channels; this section is for the deals that look fine
in the board view but smell off.

### 6. Find the single biggest pattern

Look across the segment metrics, the moving deals, and the risks. Name one
pattern — e.g. "Enterprise pipeline is up but stage-1 dominates the add; the
quarter is being filled with deals that will not close in it" or "Three of five
top-risk deals are owned by the same AE." Engineering choice: one pattern, not
five. The brief is read in three minutes. Five patterns is a list; one pattern is
a point of view, which is what the VP needs to walk into the room with.

### 7. Recommend a single ask

Translate the pattern into one ask the VP can make of the room — "have the
Enterprise lead defend the stage-1 quality of the new adds" or "review the
pushed-twice deals owner-by-owner with the named AE." One ask. If the skill
cannot produce one, it writes "no clear ask this week — pattern was diffuse"
rather than padding.

### 8. Hedge-removal pass

Re-read the draft. If any term from `references/hedge-words-blocklist.md`
appears (e.g. "may", "might", "could potentially", "appears to suggest"), rewrite
the offending sentence. Engineering choice: hedging language drifts in because
the model is being polite about uncertain data. The brief is more useful when
it states the observed pattern flatly and lets the reader push back, than when
it pre-hedges every claim. The hedge-removal pass is the guard against that
drift — it is mechanical, run after the draft, and refuses to ship a brief that
violates the blocklist.

## Output format

The brief follows this literal structure (also stored at
`references/report-format-template.md` for the user to edit):

```markdown
# Weekly pipeline brief — {Week of YYYY-MM-DD}

## Headline (vs. last Monday)
- Total open pipeline: $X.XM (up $Y.YM, +Z%)
- Weighted pipeline: $X.XM (down $Y.YM, -Z%)
- Deal count: NNN (flat, +0)
- Avg deal size: $X.XK (up $Y.YK, +Z%)

## By segment
| Segment | Open $ | WoW | Deal count | WoW |
|---|---|---|---|---|
| Enterprise | $X.XM | up +Z% | NN | up +N |
| Mid-Market | $X.XM | down -Z% | NN | flat |
| SMB | $X.XM | up +Z% | NN | up +N |

## Top 3 deals moving the number
1. **{Deal name}** — {Owner}, $XXk. Stage 2 → Stage 4 this week; demo with
   {stakeholder} landed.
2. **{Deal name}** — {Owner}, $XXk. New add; sourced from {channel}.
3. **{Deal name}** — {Owner}, $XXk. Amount up $XXk after scope expansion.

## Top 3 risks
1. **{Deal name}** — {Owner}, $XXk. Close date pushed for the second week.
2. **{Deal name}** — {Owner}, $XXk. Stage regressed 4 → 3.
3. **{Deal name}** — {Owner}, $XXk. No activity for 18 days; forecast Q-end.

## The pattern this week
{One paragraph naming the single biggest pattern. Flat statement, no hedging.}

## Recommended ask
{One sentence — the ask the VP makes of the room.}
```

If `comparison_mode = none`, replace the "(vs. last Monday)" header with
"(baseline — no prior snapshot)" and drop every WoW column.

## Watch-outs

- **Confident-but-stale data.** The HubSpot snapshot is only as fresh as the
  extractor's last run. If `last_modified` on the snapshot file is more than 24
  hours old, the brief prepends a one-line warning: "Snapshot is N hours stale
  — figures may not reflect Friday's late-week activity." Guard: the snapshot
  freshness check runs before step 1; the brief refuses to ship without it.
- **Hedging language drifting in despite removal.** The hedge-removal pass uses
  a fixed blocklist; new hedge phrasings the model invents will slip through.
  Guard: the user is expected to extend `references/hedge-words-blocklist.md`
  whenever they spot a hedge that landed. The blocklist is a living file, not
  a one-time setup.
- **Downstream readers citing this as the forecast.** The brief headlines an
  open-pipeline number, which a casual reader will round to "the forecast."
  Guard: the brief footer always reads "Operational summary, not a forecast.
  Forecast is owned by {VP name} and produced in the Friday call." This line
  is in the report-format template; do not remove it.
- **Owner reassignments mid-week.** If a deal changed owner since the previous
  snapshot, both the old owner's "lost the deal" delta and the new owner's
  "gained a deal" delta will fire — double-counting motion. Guard: the skill
  emits a "deals reassigned this week: N" footnote and excludes those deals
  from the "top deals moving the number" section to avoid attributing the
  move to either owner.
