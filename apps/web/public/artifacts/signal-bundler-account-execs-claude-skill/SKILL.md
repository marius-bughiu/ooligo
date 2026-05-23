---
name: signal-bundler-account-execs
description: Bundle intent signals, engagement events, and product-usage data for a named account into a single daily digest an AE can act on in under five minutes. Takes raw signal feeds from Common Room and Gong plus any product-event JSON and returns a prioritized account brief with a recommended first move. Use at the start of each working day — not as a replacement for discovery calls or deal reviews.
---

# Signal bundler for account executives

## When to invoke

Invoke once per day per named account the AE is actively working — typically in a morning batch before standup. The skill is designed for the "what happened at this account while I wasn't looking" question, not for real-time alerting.

Typical entry points:

- A scheduled Claude task that runs at 06:00 AE local time, iterates over the AE's named account list, and emails or Slacks each brief.
- A manual invocation in Claude Code: paste the Common Room activity export for one account and the Gong transcript snippets, and the skill returns the brief in the same session.
- A Clay AI column over an account list that fires when a Common Room "account active" webhook has triggered in the last 24 hours.

Do NOT invoke this skill for:

- **Real-time deal-desk decisions.** The skill synthesizes what happened; it does not run in sub-second latency over a live call. Use Gong's live assist for that.
- **Accounts where the AE has had zero discovery.** Signal bundling requires context. For a cold account the AE has never spoken to, the "signals" are noise until there is a baseline understanding of who the buying committee is. Run a discovery call first; then use this skill on subsequent signals.
- **Replacing a CRM update.** The brief is for the AE's working memory, not a substitute for logging activities in Salesforce. Wire a separate step to push the brief's key fields to the account record.
- **Cross-account attribution or market-wide trend analysis.** The skill operates on one account's signal feed at a time. For portfolio-level views, aggregate the briefs upstream.

## Inputs

Required:

- `account_name` — string. The account name as it appears in the CRM. Used to filter multi-account signal feeds and label the output.
- `common_room_events` — JSON array or markdown export of Common Room activity for the account in the last 24-48 hours. Minimum fields per event: `actor` (name or email), `event_type` (e.g. `github_star`, `slack_message`, `website_visit`, `product_signup`), `timestamp`, `channel` (e.g. `github`, `community_slack`, `web`).
- `gong_snippets` — array of Gong call transcript excerpts or Gong-generated call summaries for this account, covering the last 14 days. Minimum: call date, participants, a topic list or verbatim snippets.

Optional:

- `product_events` — JSON array of product-usage events (e.g. feature activations, usage spikes, seat expansions, login frequency changes) from your warehouse or product analytics tool. Minimum fields: `user_email`, `event_name`, `timestamp`, `value` (where numeric — e.g. queries run, seats used).
- `account_snapshot` — brief CRM context for the account: open opportunity stage, ARR, next scheduled touchpoint, assigned AE name. The skill uses this to weight signal urgency; without it, it cannot flag signals that contradict the current deal stage.
- `signal_lookback_hours` — integer, default 48. How far back to scan the signal feeds. Extend to 72 for accounts that are quiet for multi-day stretches; shorten to 24 for high-activity accounts.

## Reference files

Load these from `references/` before running the skill:

- `references/1-signal-taxonomy.md` — the signal taxonomy and urgency weights. Maps each event type from Common Room and Gong to an urgency tier (hot / warm / cold) and a recommended action category. Edit the weights to match your product's signal vocabulary.
- `references/2-digest-template.md` — the output template. The skill populates this template; downstream parsers and Slack formatters can key on its section headers.

## Method

The skill runs four steps in order. Do not parallelize.

### 1. Signal deduplication and normalization

Before any synthesis, normalize all incoming events to a shared schema: `{source, actor, event_type, urgency_tier, timestamp, raw_excerpt}`. Deduplicate on `(actor, event_type, timestamp_hour)` — Common Room and Gong sometimes surface the same interaction (e.g. a Gong call that also generated a Common Room "meeting" event).

Why normalization first: mixing sources with incompatible schemas causes the synthesis step to give inconsistent weights to structurally identical signals. A Gong "pricing discussed" snippet and a Common Room "pricing page visit" are both buying-intent signals; the model needs to see them as the same urgency tier, not rank them by accident based on which source named them first.

### 2. Urgency classification with taxonomy lookup

For each normalized event, look up the `urgency_tier` in `references/1-signal-taxonomy.md`. Events not in the taxonomy default to `warm`. Flag any event whose `urgency_tier` is `hot` and whose `event_type` has not appeared in the last 7 days — first occurrences of hot signals are more significant than recurring ones.

Why taxonomy-driven rather than free-form LLM judgment: letting the model decide urgency from first principles produces inconsistent rankings across accounts and makes the output hard to calibrate. The taxonomy is the team's explicit agreement about what matters; the model enforces it rather than replacing it.

### 3. Signal synthesis into the brief narrative

With signals classified, the model:

- Groups signals by theme (product interest, competitive mention, stakeholder change, engagement spike or drop-off).
- Drafts a 3-5 sentence "What happened" narrative that names the specific actors and events, ordered by urgency tier.
- Identifies the single most actionable signal (the one the AE should act on today) and drafts a one-sentence recommended first move.
- Flags signals that contradict the current deal stage if `account_snapshot` was provided (e.g. champion mentioned a competitor on a Gong call while the deal is in "Proposal Sent").

Why three-to-five sentences rather than a paragraph: AEs read briefs at 07:00. A five-paragraph synthesis is a discovery call summary, not a brief. The format enforces compression.

### 4. Output assembly

Render the digest using `references/2-digest-template.md`. The output contains: account header, signal count by urgency tier, the narrative, the recommended first move, a signal table (one row per event, sorted by urgency then timestamp), and a data-freshness footer showing the earliest and latest event timestamp in the feed.

## Output format

Literal markdown the skill emits for one account:

```markdown
# Signal digest — Northwind Corp | 2026-05-23

**AE:** Jane Smith  
**Stage:** Proposal Sent — $120K ACV  
**Signals this window:** 3 hot · 5 warm · 2 cold

## What happened

Three distinct stakeholders engaged in the last 36 hours. Maria Chen (VP Sales, Northwind) visited the pricing page twice via LinkedIn ad click-through and then opened the security questionnaire attachment in the follow-up email — first pricing-page visit in 14 days. On the most recent Gong call (May 21), the economic buyer mentioned "a competitor we spoke with last week" without naming them; the AE did not probe. In Common Room, a Northwind engineer starred the GitHub repo and joined the product Slack channel in the same 6-hour window.

## Recommended first move

Call Maria Chen today — the pricing-page revisit combined with the security questionnaire open is the strongest buying signal in 30 days; the competitor mention on the Gong call needs to be named before the next proposal revision.

## Signal table

| Time | Actor | Source | Event | Urgency |
|---|---|---|---|---|
| 2026-05-23 08:14 | Maria Chen | Web | Pricing page (2nd visit in 36h) | hot |
| 2026-05-23 08:31 | Maria Chen | Email | Security questionnaire opened | hot |
| 2026-05-21 14:02 | David Park (economic buyer) | Gong | Competitor mentioned (unnamed) | hot |
| 2026-05-22 19:43 | raj.patel@northwind.com | GitHub | Repo starred | warm |
| 2026-05-22 20:11 | raj.patel@northwind.com | Community Slack | Joined #product channel | warm |

## Data freshness

Earliest event: 2026-05-21 14:02 | Latest event: 2026-05-23 08:31 | Lookback: 48h
```

## Watch-outs

- **Signal volume without signal quality.** High-activity accounts produce 30+ events in 48 hours, and a brief that surfaces all of them trains AEs to ignore it. **Guard:** the skill caps the signal table at 10 rows (the top 3 hot + up to 7 warm, sorted by timestamp). Cold signals are counted in the header but not shown in the table unless no warm or hot signals exist. The AE can always pull the full feed from Common Room directly.
- **Ghost actor problem.** Common Room often surfaces community or product activity from users who are not on the buying committee — a junior dev who starred the repo is not the same signal as the CFO visiting the pricing page. **Guard:** if `account_snapshot` includes a named contact list, the skill labels each actor as `on-committee`, `unknown`, or `not-on-committee`. Events from non-committee actors are downgraded one urgency tier automatically.
- **Stale Gong transcripts amplifying old signals.** If the Gong lookback is set to 14 days and the most recent call was 13 days ago, the brief will describe that call as if it is fresh. **Guard:** the skill prepends a "Last call: N days ago" line to the Gong section and sets urgency for all Gong-derived signals to `warm` (not `hot`) when the most recent call is more than 7 days old.
- **Missing product events hiding the real signal.** When `product_events` is not provided, the brief can miss a feature activation or seat-expansion that is the most significant buying indicator. **Guard:** if `product_events` is absent, the skill adds a footer line: "Product events not included — check [your product analytics tool] for feature activations before calling."
