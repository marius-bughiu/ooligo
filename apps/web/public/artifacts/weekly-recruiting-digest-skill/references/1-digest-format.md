# Digest format — TEMPLATE

> Replace the in-template prose around the Head of Talent's
> preferences. Do NOT change the section order, heading levels, or
> table column headers — downstream readers (hiring managers, exec
> assistants, the board pack author) skim by structure, not text.

## Section order (fixed)

1. Header (week, snapshot dates, roles drilled count)
2. Pipeline health by role (top-N table)
3. Top funnel anomalies (max 3, ranked)
4. Source-channel performance (omit if data not provided)
5. Recommended ask (single sentence, or explicit "no ask this week")
6. Appendix — remaining open roles (rolled up)

## Audience preference notes

The skill reads this section to tune narrative tone. Edit per Head of Talent. Examples:

- **Numerics-first vs narrative-first.** The default is numerics-first (table, then one-sentence interpretation). If your Head of Talent prefers narrative-first, flip the order inside each role row's drill-down — the section structure stays.
- **Status labels.** Default vocabulary is `On track / At risk / Blocked / Paused`. If your team uses RAG (Red / Amber / Green) or `Healthy / Watch / Escalate`, edit the vocabulary list below and the skill picks it up.
- **Anomaly explanation depth.** Default is one sentence per anomaly. If your Head of Talent wants the full numerical comparison inline rather than just the deviation, set `anomaly_detail: full` in the skill's run config.

## Status vocabulary

Replace with your team's labels. The skill maps to these:

- `On track` — pipeline depth at or above target, conversion within trailing-mean band, no SLA breaches.
- `At risk` — one of: pipeline depth 20-40% below target, conversion 1-2 sd off mean, 20-50% of stage exceeds SLA.
- `Blocked` — pipeline depth >40% below target, conversion >2 sd off mean, or >50% of stage exceeds SLA. Anomaly should also be in the top-3 anomalies section.
- `Paused` — requisition explicitly paused by hiring manager. Do not flag conversion drops on paused roles.

## "Recommended ask" wording convention

Single sentence. Names the audience (engineering leadership, the exec team, the CFO, etc.), the action (free a slot, approve a counter, unblock a panel), and the role(s) it applies to. Past tense and adjectives are forbidden. Examples:

- Good: "Ask the engineering leadership team to free a 90-minute panel slot for Senior Backend Engineer onsites this week."
- Good: "Ask the CFO to approve the counter on the Director of Product candidate by Wednesday — competing offer expires Friday."
- Bad: "We should think about how to improve our panel scheduling." (No audience, no action, vague.)
- Bad: "Engineering hiring is generally going well." (Not an ask.)

If the data does not warrant an ask, the literal text is:

> No leadership ask this week — pipeline is on track.

Never invent an ask to fill the slot. The credibility of the digest depends on the recommended-ask line being true when it appears.

## Confidentiality handling

Roles flagged `confidentiality: restricted` in the priority list are summarised in the appendix as one row per restricted role:

- Team only (no role title)
- Stage only (no candidate count if pipeline depth ≤ 3)
- No hiring-manager name
- No anomaly drill-down (the anomaly is rolled into "stage SLA breach on a restricted role" if it would otherwise have surfaced)

## Last edited

<YYYY-MM-DD> — bump on every change to status vocabulary, audience preferences, or section order.
