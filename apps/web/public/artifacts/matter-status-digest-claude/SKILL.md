---
name: matter-status-digest
description: Generate a weekly or monthly digest of active matters for the General Counsel — a one-page Markdown brief with portfolio summary by phase, deadline cluster, escalation candidates, and outside-counsel spend flags. Aggregates a matter export (CSV or JSON) and produces a GC-readable view that replaces the Friday "all-hands status update" thread.
---

# Matter status digest

## When to invoke

Run this skill on a fixed weekly cadence (Monday morning) or monthly cadence (first business day of the month) to produce a digest of the legal portfolio for the General Counsel and the GC's direct reports. The skill consumes a matter export and returns a single Markdown document, in the format the GC has agreed to read.

Typical triggers:

- Monday 7:00 AM cron — produce the weekly digest and place it in the GC's inbox or Slack
- First business day of the month — produce a longer digest with quarter-to-date roll-ups
- Ad hoc — Legal Ops Manager runs the skill before a board prep meeting

Do NOT invoke this skill for:

- **Privileged content via non-Tier-A vendors.** The matter export may contain attorney-client privileged work product, settlement-strategy notes, or investigation summaries. Run only against a Claude deployment that your privilege-and-vendor review has cleared (typically Claude on Bedrock, Vertex, or a contracted Anthropic enterprise endpoint with a signed BAA / DPA — not consumer Claude.ai). If the deployment is not on the cleared list, stop and ask Legal Ops to redact privileged fields before re-running.
- **Customer-facing communications.** The digest is internal to the GC's office. Do not adapt this skill to draft client status letters, opposing-counsel correspondence, or board-of-directors memos without a separate review cycle — those audiences require a different tone, a different evidence threshold, and an attorney signoff.
- **Real-time matter alerts.** A digest is a periodic snapshot. For TRO filings, regulatory subpoenas, or breach-notification triggers, use the matter management system's native alerting — not a weekly digest. The digest is for steady-state portfolio awareness, not incident response.

## Inputs

- Required: `matter_export` — path to a CSV or JSON file exported from the matter management system. Required columns: `matter_id`, `matter_name`, `phase`, `owner`, `last_activity_date`, `next_deadline`, `next_deadline_date`, `outside_counsel_firm`, `mtd_spend`, `budget`, `risk_tier`.
- Required: `phase_taxonomy` — path to `references/1-matter-phase-taxonomy.md`. The skill aggregates by phase using this taxonomy. Without it, the digest groups by raw `phase` strings and produces inconsistent buckets when attorneys label phases differently.
- Required: `digest_format` — path to `references/2-sample-digest-format.md`. The literal Markdown structure the GC has approved. Edit this file to change the layout — do not edit the skill.
- Required: `escalation_criteria` — path to `references/3-escalation-criteria.md`. The rules that decide which matters appear in the "Needs GC attention" section. Without it, the skill flags everything and the digest stops being a triage tool.
- Optional: `previous_digest` — path to last week's digest Markdown. Used to compute "what changed since last digest" without re-deriving from the full export.
- Optional: `dollar_threshold` — minimum matter value to surface in the portfolio summary. Defaults to $0 (surface everything). Set higher (e.g. $50k) when the portfolio has long-tail nuisance matters that crowd the digest.

## Reference files

Always read these from `references/` before generating a digest. The reference files encode the GC's preferences and the firm's matter taxonomy — without them, the skill produces a generic digest that the GC will reject.

- `references/1-matter-phase-taxonomy.md` — the firm's canonical phase names and the rules for mapping raw export values onto them.
- `references/2-sample-digest-format.md` — the literal Markdown layout the GC has approved.
- `references/3-escalation-criteria.md` — the rules deciding which matters are "Needs GC attention this week" vs "FYI" vs "Routine."

## Method

Run these five sub-tasks in order. Earlier steps populate context that later steps depend on.

### 1. Load and validate the export

Parse `matter_export`. Check every required column is present and that `next_deadline_date` parses as ISO 8601. If a column is missing or malformed, abort with a clear error message naming the offending file and row — do not silently fill nulls and produce a digest the GC will treat as ground truth. The reason: a digest derived from a half-broken export is worse than no digest, because the GC will act on it.

### 2. Aggregate by phase before summarizing

Group matters using the canonical phases from `references/1-matter-phase-taxonomy.md`. The reason aggregation precedes summarization: the GC's first question on Monday is "what's the shape of the portfolio." A flat list of matters does not answer that. A bucketed view (e.g. "12 in discovery, 4 in mediation, 3 in trial prep") does. Aggregation also lets the digest report deltas ("discovery count up 2 since last digest") rather than reciting individual moves.

### 3. Compute deadline clusters

For each matter with a `next_deadline_date` within the next 30 days, group by week. Surface clusters where ≥3 deadlines fall in the same 7-day window — those are weeks the team is over-committed and the GC should know now, not the Friday before. Single-deadline weeks are FYI; the cluster signal is what matters for resource decisions.

### 4. Apply escalation rules

For each matter, evaluate the rules in `references/3-escalation-criteria.md`. Default rules:

- Budget utilization ≥ 90% with > 2 weeks of work projected → escalate
- Outside-counsel spend rate > 25% above prior-month rate → escalate
- Deadline within 5 business days and matter status not updated in last 14 days → escalate (likely stale)
- Risk tier = "high" and any status change since last digest → escalate

The reason outside-counsel spend gets a dedicated rule: outside-counsel cost is the largest discretionary line item the GC controls, and overruns surface late if reported only as quarterly invoices. Per-matter spend deltas in the weekly digest catch them at the budget-bend stage.

### 5. Render and log

Render the digest using the literal layout in `references/2-sample-digest-format.md`. Then write a metadata-only log line: `{timestamp, matter_count, escalation_count, generation_seconds, model, digest_sha256}`. The reason metadata-only: the digest body contains privileged content; the log goes to operational telemetry that may have wider audit access than the digest itself. Logging the SHA lets the firm prove digest provenance without storing the privileged text in the log store.

## Output format

```markdown
# Matter status digest — Week of 2026-05-04

## Portfolio summary

| Phase | Count | Δ vs last week |
|---|---|---|
| Intake | 4 | +1 |
| Discovery | 12 | +2 |
| Motion practice | 6 | 0 |
| Mediation | 4 | -1 |
| Trial prep | 3 | 0 |
| Settlement | 2 | -1 |
| Closed (last 7d) | 3 | — |
| **Active total** | **31** | **+1** |

Outside-counsel run-rate (MTD): $487,200 (vs $612,400 prior month at this point)

## Needs GC attention this week

1. **Acme v. Northwind** (matter #2041, owner: Patel). Discovery deadline 2026-05-09. Status not updated in 18 days. Risk tier: high. Action: confirm Patel will meet deadline or request extension.
2. **Project Lighthouse M&A** (matter #2118, owner: Chen). Outside-counsel MTD spend $142k vs $86k prior month at same date (+65%). Action: review Wachtell engagement scope.
3. **EEOC charge — Smith** (matter #2089, owner: Rivera). Status moved to "investigation complete" since last digest; risk tier high. Action: align on response strategy before 2026-05-11 response deadline.

## Deadline cluster — week of 2026-05-11

Five deadlines in this window. Resource check recommended.

- 2026-05-11: EEOC response (matter #2089)
- 2026-05-12: Discovery responses (matter #2104)
- 2026-05-13: Mediation brief (matter #2071)
- 2026-05-14: Motion to dismiss reply (matter #2055)
- 2026-05-15: Settlement demand response (matter #2096)

## Status changes since last digest

- Matter #2041 — phase moved from "intake" to "discovery"
- Matter #2071 — phase moved from "discovery" to "mediation"
- Matters #2014, #2027, #2088 — closed (outcomes in matter management system)

## Outside-counsel spend flags

| Matter | Firm | MTD | vs prior month | Note |
|---|---|---|---|---|
| #2118 | Wachtell | $142k | +65% | New deal team added |
| #2055 | Latham | $48k | +22% | Motion practice |
| #2089 | Littler | $31k | +18% | EEOC investigation |

## Generated

2026-05-04 07:02 UTC · 31 matters processed · 3 escalations · digest SHA `e7a1…`
```

## Watch-outs

- **Privileged content handling.** The matter export contains privileged work product. Run the skill only on a Claude deployment cleared by your privilege review (Bedrock, Vertex, or contracted Anthropic enterprise endpoint with executed BAA / DPA). Guard: the skill refuses to run if the environment variable `OOLIGO_DIGEST_DEPLOYMENT_TIER` is not set to `tier-a`. Set it explicitly in the cron environment after privilege review signs off; never default it on.
- **Stale matter status produces false confidence.** A digest derived from stale status fields tells the GC the portfolio looks fine when it does not. Guard: any matter whose `last_activity_date` is more than 14 days old surfaces in a "stale status — verify" footer section, even if no other escalation rule fires. The GC sees the staleness explicitly rather than acting on stale signal.
- **Deadline-miss risk.** A digest that aggregates by phase can hide an imminent deadline if the matter is not flagged by other rules. Guard: any deadline within 5 business days surfaces in the deadline cluster section regardless of phase or risk tier — the cluster section is the safety net that catches what the escalation rules miss.
- **Tone calibration.** Different GCs read different digests. Guard: the GC reviews the digest format weekly for the first 4 weeks and signs off on the layout in `references/2-sample-digest-format.md`. Iterate on the reference file, not the skill, so the engineering choices and the editorial choices stay separable.
- **Don't auto-send before review.** The Legal Ops Manager reviews the first 8 digests before they go to the GC. Guard: the skill writes to `outbox/digest-{date}.md` by default; the actual send (email or Slack) is a separate, manually triggered step until calibration is complete.
