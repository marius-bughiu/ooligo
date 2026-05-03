---
name: forecast-narrative
description: Build a one-page forecast narrative for the weekly or monthly exec
  forecast call by combining Salesforce pipeline state with Gong customer-call
  evidence. Outputs a headline number with a confidence band, the top three
  deals moving the number, the single biggest risk, and one ask of the
  VP/CRO.
---

# Forecast narrative

## When to invoke

Invoke this skill when RevOps needs to ship the weekly or monthly forecast brief that the VP Sales / CRO reads before the live forecast call. Typical cadence: once per week per segment, 30-60 minutes before the call.

Take a segment (e.g. `enterprise-amer`), a week-ending date, and the URLs of the three reference files. Produce a single-page Markdown narrative the exec can read in under two minutes.

Do NOT invoke this skill for:

- **Board-of-directors materials without CFO review.** The Skill output is an internal RevOps artifact. It has not been reconciled against finance's bookings ledger and is not safe for board reporting until the CFO's team signs off on the numbers.
- **Financial-disclosure-bound communications** (10-Q, 10-K, earnings prep, investor updates, public guidance). Forecast numbers used in any disclosure flow have to come through finance under the controls policy, not through this skill.
- **Re-baselining the official commit.** This narrative explains the commit the segment leader already set. It does not replace the commit-setting meeting itself.

## Inputs

- Required: `segment` — the forecast segment slug (e.g. `enterprise-amer`, `commercial-emea`). Maps to a Salesforce report ID in `references/segment-config.md`.
- Required: `week_ending` — the cutoff date in `YYYY-MM-DD` for the Salesforce snapshot and the Gong activity window.
- Required: `salesforce_report_id` — the saved report that returns the pipeline rows for this segment at the cutoff. Must include: opportunity ID, account, amount, close date, stage, forecast category, owner, and the prior-week snapshot fields.
- Required: `gong_workspace_id` — the Gong workspace covering this segment's calls.
- Required: `last_period_actuals` — the closed-won total from the prior period and the prior-period commit number. The Skill uses these to compute the actual-vs-commit beat/miss that frames the current narrative.
- Optional: `current_commit`, `current_best_case`, `current_upside` — if the segment leader has already set these for the period, pass them in. The Skill anchors the headline to the leader's number and explains what supports or contradicts it. If omitted, the Skill computes its own range from pipeline coverage and labels it as such.

## Reference files

Always read the following from `references/` before generating the narrative. They encode the local definitions of "commit," "stalled," and the hedge-words blocklist that keeps the output usable. Without them the narrative is generic and will drift in tone from the rest of the forecast pack.

- `references/1-narrative-structure.md` — the literal section template the output must follow, with the exact headings the exec scans for.
- `references/2-hedge-words-blocklist.md` — the words and phrasings the hedge-removal pass strips. Edit per company tone.
- `references/3-sample-output.md` — a worked example so a new RevOps reviewer can sanity-check the structure of a fresh run.

## Method

Run these six steps in order. Do not parallelize — every step after step 1 depends on the snapshot taken in step 1, and the hedge-removal pass in step 6 depends on the full draft existing first.

### 1. Snapshot Salesforce at the cutoff

Pull the saved report at `week_ending` 23:59 segment-local time. Persist the rows to disk as `snapshots/<segment>/<week_ending>.json` so the next run has a real prior-week snapshot to diff against. Diffing against the live Salesforce state instead of a stored snapshot loses the audit trail and makes "this deal moved this week" un-auditable; that is the engineering choice this step protects.

### 2. Compute the deltas

For every opportunity in the snapshot, compare against the prior-week snapshot on disk. Surface every row that:

- Changed forecast category (especially in/out of commit and best-case)
- Slipped close date by more than 14 days
- Changed amount by more than 10% in either direction
- Was created or removed from the segment

This is the raw movement set. It is not the narrative yet.

### 3. Pull Gong evidence per commit deal

For every deal in the current commit, query Gong for customer-side activity in the trailing 14 days. Capture: most-recent customer call date, participants, and a one-line topic summary lifted from Gong's call summary field (do not re-summarize the transcript here — that is a separate, more expensive call and is not needed for the narrative).

The engineering choice: combining Salesforce + Gong rather than Salesforce alone catches the failure mode where a rep keeps a deal in commit out of hope. If a commit deal has zero customer-side activity in 14 days, the deal goes into the risk section regardless of what the rep says about it. Salesforce alone cannot see that.

### 4. Rank the movers

Score each delta row by `abs(amount_change) × close_date_proximity`. Take the top three. These become the "top three deals moving the number" section. Do not surface more than three; the narrative is for the exec, not for inspection.

### 5. Identify the single biggest risk

From the commit set, surface the one deal where: (a) Gong activity is silent for 14+ days, OR (b) the close date has slipped twice in the trailing 60 days, OR (c) the deal was added to commit in the last 7 days without a corresponding customer call. Pick one. If multiple deals tie, pick the largest by amount.

The engineering choice for "one risk, not five": exec attention is the constraint, not data volume. A list of five risks is treated as no risks.

### 6. Hedge-removal pass

Generate the draft narrative following `references/1-narrative-structure.md`. Then run a second pass that scans the draft against `references/2-hedge-words-blocklist.md` and rewrites every flagged phrasing into a direct claim or a "do not know" admission. The reason for two passes rather than prompting for direct language up front: language models drift toward hedging the longer the output gets, and a dedicated removal pass reliably catches what a single-pass prompt misses. The pass is cheap (under 500 output tokens) and it is the difference between a narrative the exec actually reads and a narrative that reads like CYA.

## Output format

The Skill returns one Markdown document with exactly this structure. No preamble, no closing pleasantries.

```markdown
# Forecast narrative — {Segment}, week ending {YYYY-MM-DD}

## Headline

**Commit: ${X}M.** Confidence band: ${X−Y}M to ${X+Z}M based on {N} deals
in commit, {pct}% covered by Gong activity in the last 14 days. Last
period landed ${actual}M vs ${prior_commit}M commit ({beat/miss} of
${delta}M).

## Top 3 deals moving the number

1. **{Account} — ${amount}M, close {date}.** {What changed this week in
   one sentence.} Gong: {most recent customer call date + topic}.
2. **{Account} — ${amount}M, close {date}.** ...
3. **{Account} — ${amount}M, close {date}.** ...

## Single biggest risk

**{Account} — ${amount}M.** {Why this is the risk in one sentence — the
specific signal: 17 days no Gong activity, second close-date slip in 60
days, added to commit Tuesday with no customer call since.} If this slips,
commit lands at ${X − amount}M.

## Ask of {VP/CRO name}

{One specific ask. Examples: "Get on the {Account} call Thursday to
unblock procurement." "Decide whether {Account} stays in commit or moves
to best-case before Friday." "Approve the {discount} on {Account} so legal
can close redlines."}

## Sources

- Salesforce report: {report_id}, snapshot {YYYY-MM-DD HH:MM}
- Gong workspace: {workspace_id}, activity window {start} to {end}
- Prior-period actuals: {source}
```

## Watch-outs

- **Confident-sounding hallucinations on deal specifics.** The model can invent a procurement step, a stakeholder name, or a contract value that reads plausibly. Guard: every claim about a specific deal must trace to a Salesforce field or a Gong call summary in the source data. The Skill must label any inferred-not-observed claim with `(inferred)` or omit it. If you see a confident specific claim in the output that has no source citation, treat the run as failed and re-run with a smaller deal set.
- **Hedging language slipping back in despite the removal pass.** "May," "could," "potentially," "appears to" creep back, especially on the risk section. Guard: extend `references/2-hedge-words-blocklist.md` whenever a new hedge word survives a pass. The blocklist is the durable artifact; the prompt is not. RevOps owns this file.
- **The summary cited as the actual forecast.** The narrative explains the commit; it does not set it. Guard: the headline says "Commit: ${X}M" using the segment leader's number, never a number computed by the Skill alone. If `current_commit` was not passed in, the Skill labels its computed range as "Skill-computed pipeline coverage range, not an approved commit" so the document cannot be misread as the official number. The hand-off rule: the segment leader sets the commit, the Skill explains it, the CFO reconciles it before any external use.
- **Snapshot drift.** If `snapshots/<segment>/<week_ending>.json` was written from a partially-loaded report (e.g. Salesforce timeout mid-pull), the deltas in the next run will be wrong in invisible ways. Guard: the snapshot file's first line records the row count expected vs received; if they disagree, the Skill aborts and tells the operator to re-snapshot before continuing.
