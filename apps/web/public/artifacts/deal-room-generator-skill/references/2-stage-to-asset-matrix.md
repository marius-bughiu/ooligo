# Stage-to-asset matrix

> The `deal-room-generator` skill uses this matrix to decide which asset
> categories appear at which deal stage and which are gated by NDA. It is a
> *filter* on the asset inventory, not a substitute for persona matching.
> The skill maps assets to stakeholders first, then applies this matrix to
> remove categories the stage does not unlock.

## Stage gating

Rows are asset categories. Columns are deal stages. A check means the
category is allowed at that stage; a dash means the skill must omit it
even if a matching asset exists. NDA-gated cells require both the stage
gate and `nda_signed: true` on the input.

| Asset category | mutual_plan | proposal | procurement | legal_redline |
|---|---|---|---|---|
| Landing narrative | yes | yes | yes | yes |
| Mutual close plan | yes | yes | yes | yes |
| FAQ | yes | yes | yes | yes |
| Persona walkthrough video | yes | yes | yes | yes |
| Reference architecture diagram | NDA only | NDA only | NDA only | NDA only |
| SOC 2 summary | NDA only | NDA only | NDA only | NDA only |
| Detailed security questionnaire | — | NDA only | NDA only | NDA only |
| Customer case study (named) | NDA only | NDA only | NDA only | NDA only |
| Customer case study (anonymized) | yes | yes | yes | yes |
| ROI calculator | — | yes | yes | yes |
| Pricing model one-pager | — | yes | yes | yes |
| Contract preview (MSA terms only) | — | yes | yes | yes |
| Insurance certificate list | — | — | yes | yes |
| Vendor questionnaire response | — | — | NDA only | NDA only |
| MSA + DPA full preview | — | — | — | NDA only |
| Battlecard (if competitor_in_play) | yes | yes | yes | yes |

## Why pricing is gated to `proposal` and later

Exposing pricing in `mutual_plan` trains buyers to anchor on the list
price before the value conversation has landed. The wedge use case has
not been tied back to the buyer's strategic priority yet. Almost every
deal that ends in "the price is too high" had pricing exposed too early.
The gate is enforced by the matrix even when the rep is impatient.

## Why customer-named case studies are NDA-gated

Customer reference programs typically come with contractual obligations
on how the customer name is used in pre-sales contexts. The anonymized
versions are the safe default; the named versions go into the deal-room
only after the buyer has signed an NDA that protects both the buyer and
the reference customer.

## Why detailed security artifacts are gated past `mutual_plan`

A buyer who has not yet committed to a mutual action plan does not need
the SOC 2 audit detail or the architecture diagram — surfacing them
shifts the conversation into a procurement frame before the value
conversation is finished. The exception is when security is on the
buying committee from day one (rare in mid-market, common in regulated
enterprise); in that case the rep should override by passing
`nda_signed: true` once the NDA is in place.

## Override behavior

The skill never silently overrides the matrix. If the rep wants to
include a gated asset earlier than the matrix permits, the matrix entry
itself must be edited (and committed) — the skill output cites the matrix
file path, so any deviation from the team's policy is auditable.

## Last edited

{YYYY-MM-DD}
