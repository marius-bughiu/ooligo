# Discount rubric — TEMPLATE

> Replace this template's contents with your team's actual discount
> rubric. The deal-desk-pricing skill reads this file on every run
> and applies it deterministically. Without your real thresholds, the
> recommendation is generic and almost certainly wrong.

## Last edited

{YYYY-MM-DD} — the skill warns the reviewer when this date is more than 90 days old. Update it whenever any threshold below changes, even by a point.

## §1. Segments

The thresholds in §§2-5 are segment-specific. Define your segments once here and the skill will apply the right column.

| Segment | ACV band | Typical term | Typical sales motion |
|---|---|---|---|
| SMB | $0-30k | 1yr | self-serve / inside |
| Mid-market | $30k-250k | 1-3yr | inside + AE |
| Enterprise | $250k-2M | 2-5yr | AE + SE + exec sponsor |
| Strategic | $2M+ | 3-5yr | named-account team |

## §2. Term incentive

Discount allowed in exchange for multi-year commit, by segment.

| Segment | 1yr | 2yr | 3yr | 4yr | 5yr |
|---|---|---|---|---|---|
| SMB | 0% | 5% | 8% | n/a | n/a |
| Mid-market | 0% | 7% | 12% | 15% | 18% |
| Enterprise | 0% | 8% | 15% | 18% | 22% |
| Strategic | 0% | 10% | 18% | 22% | 25% |

Term incentives stack with §3 volume discounts up to the per-segment ceiling in §6.

## §3. Volume discount

Discount allowed on list price by ACV band, single-year basis.

| ACV band | Discount allowed | Approver |
|---|---|---|
| $0-50k | 0% | n/a — list only |
| $50k-150k | up to 10% | AE manager |
| $150k-500k | up to 15% | VP Sales |
| $500k-1M | up to 20% | VP Sales + CRO sign-off |
| $1M+ | case-by-case | CRO + CFO |

## §4. Payment terms

Default Net-30. Concessions allowed below.

| Net-X | Approver | Notes |
|---|---|---|
| Net-30 | n/a — default | Standard |
| Net-45 | Deal desk | Up to 3 per quarter per AE |
| Net-60 | CFO | Requires upfront-payment trade or other concession |
| Net-90 | CFO + CRO | Strategic deals only |
| Custom (milestone, deferred) | CFO + GC | Contract amendment required |

## §5. Ramp structures

| Ramp shape | Allowed | Approver |
|---|---|---|
| Flat (no ramp) | yes | default |
| Y1 50% / Y2 100% | yes | Deal desk |
| Y1 25% / Y2 75% / Y3 100% | yes | VP Sales |
| Custom | requires VP Sales + Finance | named exception |

Ramp deals require the §2 term incentive to be re-computed against the *contractual* term, not the ramped-up term.

## §6. Maximum stacked discount per segment

When term incentive (§2), volume discount (§3), and payment-term concession (§4) are stacked, total effective discount cannot exceed:

| Segment | Stacked ceiling | Approver to exceed |
|---|---|---|
| SMB | 12% | VP Sales |
| Mid-market | 22% | CRO |
| Enterprise | 28% | CRO + CFO |
| Strategic | 35% | CEO + CFO |

The skill caps recommendations at this ceiling. Anything above fires the escalation flag with reason "stacked concessions exceed ceiling."

## §7. Disqualifiers — do not recommend, escalate

The skill must escalate (not recommend) when any of these is true:

- Discount > stacked ceiling in §6
- Term < 12 months on a deal > $100k ACV
- Payment terms beyond Net-90
- Custom legal terms (MFN clause, uncapped indemnity ask, custom data-residency commitments) — these need GC, not deal desk
- Customer is on the strategic-logo list maintained at `references/strategic-accounts.md` (one entry per line)
- AE has submitted more non-policy asks this quarter than the threshold in `references/3-escalation-criteria.md` §2

## §8. DOA matrix (delegation of authority)

Used by the skill to name the approver in the recommendation header.

| Authority | Approver | Backup |
|---|---|---|
| In-policy deals | Deal desk reviewer | n/a |
| Exceptions up to §6 ceiling | VP Sales | Deal desk lead |
| Above §6 ceiling | CRO | VP Sales |
| Custom legal / payment | CFO + GC | n/a |
| Strategic logos | CRO + CEO | n/a |
