# Rep gap questions

> The `deal-room-generator` skill emits these questions in the
> "Rep gaps to fill before sharing" section of every output. They are
> deliberately blocking — the deal-room outline is not considered "done"
> until the rep answers them. The list below is the master set; the skill
> selects the subset relevant to the deal stage and stakeholder mix on
> the current run.

## Reference customer selection

Whenever a case study is mapped to a stakeholder, the skill asks:

- **Which named reference is the closest analog to this buyer's environment?** The inventory may have three case studies that match the persona; the skill cannot pick the right one without rep judgment about industry, scale, and the specific pain that resonates.
- **Has the reference customer been re-confirmed for use in pre-sales in the last 6 months?** Reference programs lapse. Confirm before the buyer's AE-to-AE call gets scheduled.
- **Is the reference willing to take an inbound call from this buyer?** Sharing the case study is one thing; tee-ing up a live reference call is another. Note this in the deal-room FAQ.

## Commercial terms

Whenever pricing or contract preview appears, the skill asks:

- **What discount band, if any, is approved for this deal?** The pricing one-pager shows list price; the FAQ should reflect what the rep is actually empowered to offer.
- **Are extended payment terms on the table?** Net-60 or annual prepay in exchange for a multi-year commitment is a common ask; if the rep has authority, the FAQ should signal it.
- **Is there a multi-year discount structure to surface?** Most buyers do not ask; some procurement teams will. Pre-empt by including the ladder in the FAQ.

## Implementation and timeline

Whenever the "Why now" section references a go-live date, the skill asks:

- **Is the proposed go-live date confirmed with implementation engineering?** Default narrative says "go-live within 60 days of signature" — confirm capacity before the buyer treats it as a commitment.
- **What is the named owner on the buyer's side for each milestone in the mutual close plan?** A close plan with no buyer-side owners is a rep wishlist, not a plan.

## Persona-mapping confirmations

Whenever a stakeholder mapping has `confidence: low`, the skill asks:

- **Is {Name} actually the {role}, or are they a {alternative role}?** Title-based inference can be wrong; the rep is the only person who knows what was said on the discovery call.
- **Should we add a stakeholder the skill missed?** The skill maps from the `stakeholder_map` input only. If the buyer mentioned a name that was not in the input, the rep adds it before sharing.

## Competitive framing

Whenever `competitor_in_play` is set and a battlecard is included:

- **Has the buyer named the competitor in writing, or is this an inference?** If it is an inference, the battlecard goes in the rep's prep notes, not the buyer-facing deal-room.
- **Is there a known displacement story in the case-study inventory?** A "we replaced {competitor}" case study, where allowed, is the most effective single asset against a specific competitor.

## NDA and gating

Whenever the matrix has gated content as "NDA only" and `nda_signed` is false, the skill asks:

- **Is the NDA in flight, blocked, or not started?** Drives the close-plan next-step item. The deal-room outline notes this as `[gated: NDA required — status: ?]` until the rep answers.

## Last edited

{YYYY-MM-DD}
