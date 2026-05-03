---
name: weekly-recruiting-digest
description: Pull the weekend's ATS pipeline state from Ashby / Greenhouse / Lever, diff it against last Monday's snapshot, and produce a one-page Monday-morning digest for the Head of Talent. Surfaces wins, funnel anomalies, source-channel ROI, and the single highest-value ask of the leadership team that week. Always stops at a recruiter-review gate before any send.
---

# Weekly recruiting digest

## When to invoke

Use this skill on Monday morning (or whenever the recruiting leader's
weekly cadence runs) when the Head of Talent needs a one-page digest
that synthesises last week's hiring activity and surfaces the one or
two things the leadership team should actually do this week. Take a
fresh ATS pipeline export, the prior week's snapshot, the priority
list of open roles, and (optionally) sourcing-channel performance as
input. Produce a Markdown digest plus a per-role drill-down appendix.

Do NOT invoke this skill for:

- **Auto-publishing without recruiter review.** The skill writes
  `digest.md` to disk and stops. There is no "send" or "post to Slack"
  action defined anywhere in the skill. The Head of Talent or the
  recruiting-ops owner reads the draft, edits any audience-sensitive
  content (privileged exec searches, replacement searches, in-flight
  PIP cases), and sends. AI-drafted-and-sent without review produces
  organisational drama within four weeks.
- **Customer-facing reports.** This is an internal leadership digest.
  Recruiting funnel metrics, candidate names, and stalled-role
  diagnoses are not for external partners, board decks without
  recruiter sign-off, or anything that leaves the people-team Slack.
  If a board pack needs recruiting numbers, run a separate, sanitised
  pull — do not forward this digest.
- **Individual rep-performance reviews.** The skill aggregates by role,
  funnel stage, and source-channel. It deliberately does not produce a
  per-recruiter ranking or a per-sourcer leaderboard. Conflating
  pipeline health with individual performance is how an ops digest
  turns into a backchannel performance-review tool, which it is not
  designed for and which most works councils and US state employment
  laws treat as automated worker evaluation.

## Inputs

- Required: `ats_snapshot_current` — path to a CSV or JSON export from
  the ATS dated within the last 24 hours. Must contain at minimum:
  `requisition_id`, `role_title`, `team`, `stage`, `candidate_id`
  (hashed or pseudonymous), `stage_entered_at`, `last_activity_at`,
  `source_channel`, `recruiter_id`, `hiring_manager_id`,
  `requisition_opened_at`, `target_start_date`.
- Required: `ats_snapshot_prior` — path to the equivalent export from
  the prior week's run. The skill diffs current against prior to
  identify what materially changed; without a prior snapshot the
  digest degrades to a static state-of-pipeline report and the
  "anomalies" section refuses to render.
- Required: `role_priority_list` — path to the file under `references/`
  that ranks open roles by business priority. The skill uses this to
  decide which roles get a per-role drill-down (top N) vs which get
  rolled up into a "remaining roles" summary line. Without a priority
  list the skill defaults to alphabetical, which is wrong every week.
- Optional: `source_channel_performance` — path to a CSV with
  `channel`, `cost_last_week`, `applications`, `qualified`, `hired_ytd`
  for source-channel ROI. If absent, the source-channel section is
  omitted rather than fabricated.
- Optional: `n_drilldown` — number of roles to drill down on, default
  5, hard max 12. Above 12 the digest stops being one-page and the
  recruiting leader stops reading it.

## Reference files

Always read these from `references/` before generating the digest.
Without them the digest is structurally inconsistent and the
source-channel section conflates terms.

- `references/1-digest-format.md` — the literal Markdown layout the
  skill emits, including section order, heading levels, and the
  "Recommended ask" wording convention. Replace nothing structural;
  edit only the in-template prose around the Head of Talent's
  preferences.
- `references/2-role-priority-list-template.md` — fillable template
  the recruiting-ops owner edits weekly. Drives which roles get a
  drill-down and which get summarised.
- `references/3-source-channel-roi-definitions.md` — fixed definitions
  of `cost_per_qualified_applicant`, `qualified_rate`, and
  `hire_per_dollar` so week-over-week comparisons stay honest.
  Source-attribution drift is the most common reason last-touch
  numbers move when nothing real changed.

## Method

Run these six steps in order. Steps 1-3 are deterministic diffs and
threshold checks; only step 4 uses the LLM for narrative synthesis.
The order is deliberate — letting the model freelance over a raw
pipeline state produces a digest that reads well and is wrong about
which numbers actually moved.

### 1. Validate snapshots and load priority list

Open both ATS snapshots. Confirm the schema matches (same columns,
same enum values for `stage` and `source_channel`). If a column was
renamed between exports — common when an ATS admin reconfigures
stages — halt and surface the diff to the user. Do not silently
remap columns; that is how stage-conversion numbers move 30% in a
week for no real reason.

Load `role_priority_list`. Validate that every role marked
`priority: critical` exists in `ats_snapshot_current`. If a critical
role has been closed or paused since the priority list was last
edited, surface that for the recruiting-ops owner to update.

### 2. Per-role pipeline-health diff

For every open role in the current snapshot, compute against the
prior snapshot:

- Net change in candidates per stage (entered − exited).
- Stage-conversion rate (this week's exits-to-next-stage divided by
  this week's entries-to-stage).
- Time-in-current-stage for every candidate, flagged if it exceeds
  the role's stage SLA (loaded from `role_priority_list`).
- Days-open versus the role's target time-to-fill.

These are arithmetic, not LLM. The deterministic step exists so the
numbers in the digest are reproducible — re-running the skill on the
same two snapshots produces identical numerics. The choice to drill
down per role rather than aggregate org-wide is intentional: an
aggregate "engineering funnel conversion is 22%" hides the fact that
two senior backend roles are at 8% and three junior roles are at
35%, which is the actionable shape.

### 3. Funnel-anomaly detection

For each role in the top-N drill-down list, flag a stage as anomalous
if any of the following hold:

- Stage-conversion rate this week is more than 2 standard deviations
  off the trailing 6-week mean for that role + stage. Below 6 weeks
  of history, suppress the flag and write "insufficient history" —
  do not flag on small samples, that is the false-positive mode.
- More than 30% of candidates in a stage exceed the stage SLA.
- Net pipeline depth at the top of funnel dropped by more than 40%
  week-over-week and the role is `priority: critical`.

Cap the anomaly list at 3 per digest. If more than 3 trigger, rank by
priority weight from the role-priority list and drop the rest into the
appendix. Three anomalies is the upper bound for what the leadership
team can act on in a week; more turns the digest into a watch-list
that nobody reads.

### 4. Source-channel ROI (optional)

Only run if `source_channel_performance` was provided. Compute, using
the definitions in `references/3-source-channel-roi-definitions.md`:

- `cost_per_qualified_applicant` per channel, this week vs the
  trailing 4-week mean.
- `qualified_rate` per channel, this week vs trailing 4-week mean.
- Channels where `cost_per_qualified_applicant` moved more than 25%
  week-over-week, flagged for the recruiting-ops owner to verify
  attribution before the digest goes out.

Why ROI per channel rather than just spend: the spend number alone
does not tell the Head of Talent whether to renew the LinkedIn slot
or shift budget to the niche board. ROI per qualified applicant
does, and that is the buying decision the digest exists to inform.

### 5. Bias-screening pass

Before drafting the narrative, scan the inputs for any text the LLM
might use that names an individual recruiter, sourcer, or hiring
manager in a way that ranks or evaluates them. Strip those names
from the context window passed into step 6. The skill aggregates
candidate volumes by `recruiter_id` only when computing per-role
load (e.g. "this role's recruiter holds 14 reqs, target is 8"), and
even then the output uses load thresholds against capacity, not
inter-recruiter comparison.

The reason this is a separate explicit pass rather than a prompt
instruction: prompt instructions to "do not rank individuals" are
unreliable, especially when the input data implicitly ranks them
(e.g. fill rates per recruiter). Removing the names from the context
is what reliably keeps individual-rep-ranking out of the output.

### 6. Draft the digest

LLM step. Take the deterministic outputs from steps 2-4 and the
audience preferences from `references/1-digest-format.md` and draft
the digest. The narrative may interpret the numbers ("conversion
dropped because the panel interview slot was unavailable for two
weeks") only if that interpretation is in the input notes; otherwise
write "likely cause not in pipeline data — recruiter to confirm".

End with a single "Recommended ask" — one sentence naming the one
thing the Head of Talent should ask the leadership team to do this
week. If the data does not warrant an ask, write "No leadership ask
this week — pipeline is on track." Never invent an ask to fill the
slot.

## Output format

```markdown
# Recruiting digest — Week of <YYYY-MM-DD>

Generated: <ISO timestamp> · Snapshot: <prior date> → <current date> · Roles drilled: <N>

## Pipeline health by role

| Role | Stage | Open since | Target TTF | Pipeline (curr) | Pipeline (prior) | Conversion (this wk) | Status |
|---|---|---|---|---|---|---|---|
| Senior Backend Engineer | Onsite | 47d | 35d | 4 | 6 | 50% (avg 65%) | At risk |
| Director of Sales | Hiring manager review | 22d | 45d | 2 | 2 | n/a | On track |
| ... | ... | ... | ... | ... | ... | ... | ... |

## Top funnel anomalies (3)

1. **Senior Backend Engineer · Onsite → Offer.** Conversion this week
   30% vs trailing 6-week mean 62% (2.4 sd off). Likely cause not in
   pipeline data — recruiter to confirm before next digest.
2. **Account Executive (NYC) · Recruiter screen → Hiring manager.**
   55% of candidates in stage exceed the 5-day SLA. Net pipeline
   stable; bottleneck is review throughput.
3. **Senior PM · Top of funnel.** Pipeline depth dropped 48%
   week-over-week on a critical role. Source-channel mix shifted
   away from inbound; see source section.

## Source-channel performance (last week)

| Channel | Cost | Qualified | Cost / qualified | vs 4-wk mean |
|---|---|---|---|---|
| LinkedIn Jobs | $4,200 | 18 | $233 | +18% |
| Niche board (Hacker News Who's Hiring) | $0 | 7 | $0 | flat |
| Agency (firm A) | $12,000 | 3 | $4,000 | +180% (verify attribution) |
| Referrals | $1,500 | 11 | $136 | -22% |

## Recommended ask

Ask the engineering leadership team to free a 90-minute panel slot for
Senior Backend Engineer onsites this week. The conversion drop is
schedule-driven, not candidate-quality-driven.

## Appendix — remaining open roles

| Role | Status | Notes |
|---|---|---|
| ... | ... | ... |
```

## Watch-outs

- **Ranking individual recruiters or sourcers.** *Guard:* step 5
  strips individual names from the context window before the LLM
  drafts. Per-`recruiter_id` aggregations exist only as load-vs-capacity
  checks, not as inter-recruiter comparisons. The output format has
  no "recruiter leaderboard" section and adding one is a deliberate
  scope expansion that should be a separate skill with separate
  consent posture.
- **Source-attribution drift.** *Guard:* the channel ROI step uses
  fixed definitions from `references/3-source-channel-roi-definitions.md`
  and flags any channel whose cost-per-qualified moved more than 25%
  for the recruiting-ops owner to verify attribution before the
  digest goes out. Last-touch attribution moves easily when an ATS
  admin reconfigures source values; the digest must not present a
  configuration change as a real budget signal.
- **False-positive anomaly flags.** *Guard:* step 3 suppresses
  anomaly flags when the role has fewer than 6 weeks of history for
  the trailing-mean calculation. The cap of 3 anomalies per digest
  is enforced even when more would technically pass the threshold,
  to avoid the watch-list-nobody-reads failure mode. The 2-standard-
  deviation threshold rather than a flat percentage is what stops the
  skill from flagging normal small-sample noise on low-volume roles.
- **Stale ATS data.** *Guard:* step 1 halts if the current snapshot
  is older than 24 hours. A digest run on three-day-old data
  contradicts itself against any executive who checked the ATS
  yesterday.
- **Privileged or sensitive role exposure.** *Guard:* the role
  priority list has a `confidentiality: restricted` flag per role.
  Roles with that flag are summarised by team and stage only — no
  role title, no candidate names, no hiring-manager name. The Head
  of Talent decides per run whether to include any of those roles
  in the version that goes to the broader leadership team.
- **Auto-send drift.** *Guard:* the skill defines no `send`,
  `post_to_slack`, or `email` action. It writes `digest.md` to disk
  and exits. The recruiting-ops owner pastes into the channel of
  choice after a final read.
