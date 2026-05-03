# Escalation criteria — TEMPLATE

> Replace this template's contents with your firm's actual escalation rules.
> The matter-status-digest skill applies these rules to decide which
> matters appear in "Needs GC attention this week."
> Without specific rules, the skill flags everything — and the section
> stops being a triage signal.

## Rule structure

Each rule has:
- A trigger condition (boolean expression over export columns)
- A reason the GC needs to know (one phrase, appears in the digest)
- A recommended action verb

The skill evaluates rules in priority order. A matter that matches multiple rules surfaces under the highest-priority rule, with the others noted as supporting context.

## Default rule set

| Priority | Trigger | Reason | Suggested action |
|---|---|---|---|
| 1 | `risk_tier == "high"` AND status changed since last digest | High-risk matter moved | Review and align |
| 2 | `next_deadline_date` within 5 business days AND `last_activity_date` > 14 days ago | Imminent deadline, stale status | Confirm owner + deadline ownership |
| 3 | `mtd_spend / budget >= 0.90` AND projected work > 2 weeks remaining | Budget exhaustion risk | Approve overrun or scope cut |
| 4 | `mtd_spend > 1.25 * prior_month_mtd_spend_at_same_date` | Outside-counsel spend spike | Review engagement scope |
| 5 | New matter opened with `risk_tier == "high"` since last digest | New high-risk intake | Confirm staffing decision |
| 6 | Matter closed with non-standard outcome (settlement > $100k, adverse judgment, regulatory consent) | Material outcome | Awareness, no action required |

## Rule customization

Edit thresholds, change the priority order, or add new rules. Common adjustments:

- **Smaller portfolios**: lower the spend-spike threshold from 25% to 15%; small portfolios feel single-matter overruns harder.
- **Litigation-heavy portfolios**: add rule for "discovery deadline within 10 business days AND no recent depositions logged."
- **Transactional-heavy portfolios**: add rule for "matter open >180 days with no closing date set" — long-tail deals are a status risk.
- **Regulated industries**: add rule for "regulatory deadline AND status not updated in last 7 days."

## Volume cap

The skill caps "Needs GC attention this week" at 5 items. If more than 5 matters meet escalation criteria, the skill ranks by:

1. Risk tier (high > medium > low)
2. Spend impact (highest absolute deviation first)
3. Deadline proximity (soonest first)

Items ranked 6+ surface in "FYI — no action requested." Adjust the cap if your GC reads longer digests; do not eliminate it — an unbounded escalation section stops being a triage tool.

## Last edited

YYYY-MM-DD
