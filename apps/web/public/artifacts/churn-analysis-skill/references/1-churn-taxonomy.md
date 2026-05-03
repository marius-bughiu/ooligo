# Churn taxonomy — TEMPLATE

> Replace this template's contents with your team's actual taxonomy.
> The churn-analysis skill reads this file on every run. The classification
> pass is constrained to these slugs exactly — it will not invent new
> categories. Keep the list between 5 and 10 entries; more than that and
> the quarterly aggregate becomes noise.

## Categories

Each category has a slug (used by the skill), a one-sentence definition, and an evidence requirement that the classification pass enforces before it will assign the category.

### `product-gap`

The customer needed a capability the product does not ship and the gap was material to their use case.

Evidence requirement: at least one Gong quote, support ticket, or written request naming the missing capability AND a roadmap reference (committed, deferred, or rejected) that the CSM can cite.

### `champion-departure`

The economic buyer or primary champion left the customer organization and no replacement sponsor was established.

Evidence requirement: a LinkedIn departure date OR a CRM contact-change record dated within 90 days of the churn date. A Gong-only mention ("the new VP doesn't see value") is not sufficient — see watch-out in `SKILL.md`.

### `pricing`

The renewal price exceeded the customer's willingness or budget. Includes both list-price increases and seat-count escalation triggering a budget review.

Evidence requirement: a written pricing objection (Gong quote, email, or CRM note) AND a comparison to the prior contract value showing the delta.

### `consolidation`

The customer chose to consolidate onto an adjacent platform they already own (typically a suite vendor — HubSpot, Salesforce, Microsoft) rather than maintain a best-of-breed stack.

Evidence requirement: explicit naming of the consolidation target in customer communication. "They went with HubSpot" without a quote is not sufficient.

### `service-failure`

A specific incident or sustained service-quality issue (outages, support response times, repeated bugs in critical workflows) that the customer named as the reason for non-renewal.

Evidence requirement: linked support tickets or incident IDs AND a written customer reference to the incident as a churn driver.

### `adoption-failure`

The customer never reached the threshold of usage at which the product delivers value, regardless of CSM effort.

Evidence requirement: usage metrics showing weekly active users below the team's configured success-plan threshold for at least the final 60 days of the contract.

### `restructure`

The customer's business changed in a way that eliminated the use case (layoffs, division shutdown, acquisition, pivot).

Evidence requirement: a public announcement (press release, news article, LinkedIn post by an executive) of the structural change AND a CRM note linking the structural change to the non-renewal decision.

### `competitive-displacement`

The customer chose a direct competitor for the same use case (not consolidation onto a suite they already own).

Evidence requirement: explicit naming of the competitor in customer communication AND a comparison the customer ran or referenced.

## Adding a new category

Do not add categories inside the skill run. If a churn does not fit any existing slug, the skill returns `insufficient-evidence` for the primary category. The team reviews `insufficient-evidence` cases monthly and decides — out of band — whether a new category is justified. New categories require:

1. At least 3 historical churns that would have been classified under the new category, retroactively.
2. A definition narrow enough not to overlap with existing slugs.
3. An evidence requirement strict enough to prevent over-attribution.

## Last edited

{YYYY-MM-DD}
