# Stale-deal disposition

Last edited: 2026-08-03 · Owner: `REPLACE_WITH_OWNER` · Pipeline: `REPLACE_WITH_PIPELINE_NAME`

Closing stale deals is the highest-friction job in this Skill, because the records belong to reps and the write changes a number leadership watches. This file exists so the rule is argued once with the sales leader who owns the pipeline, written down, and then applied identically every run.

Fill one copy of this file per pipeline. Thresholds that fit a 14-day transactional cycle will gut an enterprise pipeline.

## Part A — what counts as stale

Staleness is measured as days since `hs_lastmodifieddate`, not days since `createdate`. A 400-day-old deal worked last week is healthy; a 30-day-old deal untouched since creation is not.

`hs_lastmodifieddate` moves on any property write, including writes from automation. If a workflow stamps a property on every deal nightly, every deal reads as fresh and this job finds nothing. Confirm that before trusting the first run's output — a stale-deal report that returns zero rows on a pipeline everyone knows is clogged is measuring the automation, not the pipeline.

Where a nightly workflow does touch every deal, switch the measure to the most recent engagement (`notes_last_updated` or last logged activity) and record the substitution here.

## Part B — thresholds per stage

Threshold in days since last modification. Set each with the rep-facing owner, not alone.

| Stage | Stale after | Rationale |
|---|---|---|
| Appointment scheduled | 21 | A meeting either happened or did not inside three weeks. |
| Qualified to buy | 45 | `REPLACE_WITH_YOUR_MEDIAN_STAGE_DURATION` × 2 is the usual starting point. |
| Presentation scheduled | 30 | |
| Decision maker bought-in | 60 | Late-stage deals go quiet for real procurement reasons. Be slow here. |
| Contract sent | 90 | Legal and procurement cycles are long; closing these early destroys real pipeline. |
| `REPLACE_STAGE` | `REPLACE` | |

Set the threshold at roughly twice the stage's median duration, measured from your own closed-won history. Halving that number does not surface more real dead deals — it surfaces more live ones and teaches reps to distrust the job.

## Part C — disposition decision table

Staleness alone never closes a deal. The disposition combines staleness with three other signals.

| Stale | Owner active? | Amount ≥ threshold | Recent engagement | Disposition |
|---|---|---|---|---|
| yes | yes | no | none in stale window | `close-lost` |
| yes | yes | yes | none in stale window | `flag-for-review` |
| yes | no (deactivated) | any | any | `reassign` |
| yes | yes | any | engagement newer than last modification | `leave` |
| yes | yes | any | close date in the past, stage open | `flag-for-review` |
| no | any | any | any | `leave` |

Amount threshold: `REPLACE_WITH_AMOUNT` (suggested: the value above which a deal gets an executive review — commonly the same number that triggers deal-desk involvement).

Two rules carry most of the safety. Large deals never auto-close; they route to a human. And a deal whose owner has been deactivated is a data problem, not a dead deal — reassign it before judging it, or you will close pipeline that nobody has looked at because nobody could.

## Part D — close-lost reason taxonomy

Every auto-closed deal gets a reason, and the reason must distinguish itself from a rep-entered one. A pipeline where hygiene-closed and rep-closed deals share a reason code produces a win/loss analysis nobody can trust.

| Code | Meaning |
|---|---|
| `hygiene-stale-no-activity` | Auto-closed by this job. The only code the job writes. |
| `REPLACE_EXISTING_CODES` | Your existing rep-entered reasons. List them so the job never writes one. |

Set `closed_lost_reason` to `hygiene-stale-no-activity` and stamp `hygiene_run_id` from `references/2-backfill-provenance.md` on every deal the job closes. Exclude that code from win/loss reporting by default — these deals were not lost to a competitor, they were lost to neglect, and mixing the two inflates whatever category they land in.

## Part E — notification

Auto-closing a rep's deal without telling them is how this job gets banned. Before apply, post the per-owner list to the owner and hold for `REPLACE_WITH_HOLD_PERIOD` (suggested: 3 business days). Reps reopen what is actually live, and the reopen rate is the calibration signal for Part B.

A reopen rate above 15% means the thresholds are too aggressive. Raise them before the next run rather than arguing each case.
