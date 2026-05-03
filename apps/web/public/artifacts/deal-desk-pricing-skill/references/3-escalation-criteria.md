# Escalation criteria — TEMPLATE

> Replace this template with your team's actual escalation triggers.
> The deal-desk-pricing skill checks every recommendation against
> this file before rendering. When a trigger fires, the skill sets
> `escalation: required` in the output header and names the approver
> from the DOA matrix in `1-discount-rubric.md` §8.

## Why escalation is the human-review fallback

The skill is decision support, not decision-making. When the rubric or analogs cannot support a confident counter, the right move is to hand the decision to a named human — not to pick the closest tier and hope. This file enumerates the cases where that handoff is mandatory.

## §1. Hard triggers (always escalate)

If any of these is true, the skill sets `escalation: required` and names the approver. The recommendation is still rendered — as context for the human, not as the answer.

| Trigger | Approver | Reason |
|---|---|---|
| Discount > stacked ceiling in rubric §6 | CRO + CFO | Above DOA limit |
| Term < 12 months on deal > $100k ACV | VP Sales | Short-term enterprise risk |
| Payment terms beyond Net-90 | CFO | Cash flow exposure |
| Custom legal terms (MFN, uncapped indemnity, data residency) | CFO + GC | Outside deal-desk scope |
| Strategic-logo customer (per `references/strategic-accounts.md`) | CRO + CEO | Strategic deal review |
| Custom ramp shape not in rubric §5 | VP Sales + Finance | Contract structure exception |
| Custom payment instrument (PO + milestone, deferred billing) | CFO + GC | Amendment required |

## §2. AE-pattern triggers (escalate when threshold exceeded)

The skill counts non-policy asks per AE per quarter. When an AE crosses the threshold, every subsequent ask escalates regardless of size — a calibration loop forcing a manager conversation.

| Threshold | Action |
|---|---|
| AE has submitted ≥ 3 exception-needed asks in current quarter | Next ask escalates to AE manager |
| AE has submitted ≥ 5 exception-needed asks in current quarter | Next ask escalates to VP Sales + manager review |
| AE has submitted ≥ 8 exception-needed asks in current quarter | Pause: deal desk lead reviews territory before processing more |

The skill reads the AE's running count from a sibling counter file the user maintains, or from a Salesforce report ID configured in `SFDC_EXCEPTION_REPORT_ID`. If neither is configured, this section is skipped with a one-line note in the reviewer notes.

## §3. Evidence-thinness triggers (escalate when analogs are thin)

The skill cannot reason about deals it has no precedent for. When the comparable-deal pull returns thin or contradictory evidence, escalate.

| Trigger | Approver | Reason |
|---|---|---|
| Fewer than 3 comparable analogs found | VP Sales | Outlier — insufficient analog evidence |
| Analogs split (≥ 30% rejected/lost) on a similar ask | VP Sales | Mixed precedent, needs judgment |
| No analog in current quarter for this segment | Deal desk lead | Possible market shift |
| Rubric is silent on a dimension the ask touches | VP Sales + Finance | New packaging / new geo / new instrument |

## §4. Stale-data triggers (warn, do not block)

These do not force escalation but render a warning in the reviewer notes. The reviewer decides whether the staleness is material.

- Rubric `last_edited` > 90 days old
- Comparable-deal CSV `last refreshed` > 90 days old
- Strategic-accounts list `last_edited` > 180 days old

## §5. Competitive-context triggers

When `competitive_context` is provided in the input:

| Signal in competitive context | Action |
|---|---|
| Named competitor in active POC | Recommendation must reference; rationale must address displacement framing |
| Tight close date (< 14 days) and competitor named | Escalate to VP Sales for fast-track approval |
| Procurement-driven RFP with multiple finalists | Escalate to deal desk lead for final-round pricing strategy |

When `deal_record` flags a competitor but `competitive_context` is empty, the skill does not produce a context-blind counter — it returns a prompt asking the reviewer to re-run with the context filled in.

## How to tune this file

- Start conservative. The defaults above will over-escalate; that is intentional during the first month so the team sees what kinds of asks the skill flags.
- Loosen quarterly. After watching 4-8 weeks of escalations, drop triggers that consistently round-trip back to deal desk with no changes from the named approver.
- Tighten on incidents. After any deal that closed in-policy via the skill but caused a problem post-sale (margin miss, renewal surprise, legal escalation), add a trigger that would have caught it.

## Last edited

{YYYY-MM-DD} — bump on every change. The skill does not warn on this file's age (escalation is supposed to be a backstop, not a moving target), but track changes for your own audit.
