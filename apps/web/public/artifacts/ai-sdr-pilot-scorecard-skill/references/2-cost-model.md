# 2 — Cost model

Five lines. All five are required; the skill rejects the run with `incomplete_cost_model` if any is `null`. A line you believe is zero must be entered as `0`, which is a claim you are making, not a gap you are leaving.

## Line 1 — `subscription`

The contracted license cost for the pilot window, prorated if the contract is annual.

Vendor meters differ in kind, not just in price, and the difference changes what "more volume" costs you:

- **Per lead or per prospect.** 11x publishes a Growth plan at 3,750 per month billed annually — 45,000 for the year — covering 2,000 new prospects per month and up to five end users, and states plainly that it charges per lead, not per send. Under a per-lead meter, sending more touches to the same 2,000 prospects is free and widening the list is not.
- **Per AI-researched contact.** AiSDR publishes 250 per month for 200 contacts, 900 per month for 800, and 2,500 per month for 2,500, with the two larger tiers on a quarterly commitment and a 20% discount for annual billing. The unit price falls from 1.25 per contact at the entry tier to 1.00 at the top published one.
- **Quote-only, scoped by leads contacted.** Artisan publishes no price and describes its tiers at roughly 2,500 and roughly 6,000 leads contacted per month.

Prorating an annual commitment across a six-week pilot: `subscription = annual_total × (pilot_days / 365)`. For 11x Growth at 45,000 per year and a 42-day window, that is 45,000 × 42/365, or about 5,178. Use the prorated figure, and note in the memo that the real commitment is annual — a pilot that cost 5,178 to run may have cost 45,000 to enter, and if the contract is already signed, the kill decision is about the next term, not this one.

## Line 2 — `data_and_enrichment`

Credits consumed for enrichment, verification, and intent data during the window. Include spend on tools the agent called even when they are billed elsewhere — a Clay or ZoomInfo meter that spiked during the pilot is a pilot cost regardless of which cost centre it landed in.

Bundled-plan trap: several vendors bundle contact data into the subscription, which does not make it free, it makes it invisible. When it is bundled, enter `0` and note the bundling in the memo, because the moment you scale past the bundled allowance it becomes a variable line and your cost per meeting moves.

## Line 3 — `sending_infrastructure`

Domains, mailboxes, warmup services, and any deliverability tooling bought or expanded for the pilot. Also invisible when bundled — 11x, for instance, states that every plan bundles deliverability, mailbox warmup, and inbox rotation at no additional cost.

The reason this line exists even when it is small: it is the line that grows fastest under volume increases, and a `keep` verdict that leads to tripled volume needs the reader to know which lines are fixed and which are not.

## Line 4 — `implementation_amortized`

One-time onboarding, implementation, and integration fees, amortized across the term you would actually commit to if you keep. Not across the pilot window.

A 10,000 implementation fee charged against a six-week pilot makes the pilot look catastrophic; charged across a twelve-month term at 833 per month, it makes the decision you are actually making. If you would only ever commit to twelve months, amortize across twelve. If the fee is refundable on non-renewal, enter `0` and note it.

## Line 5 — `human_rework_hours`

Hours, not currency. The skill prices them at `loaded_hourly_rate`.

What counts:

- Editing or rewriting agent drafts before send.
- Correcting targeting — removing accounts the agent should not have touched, fixing segment definitions after the fact.
- CRM cleanup attributable to the agent: duplicate contacts, wrong-account activity, stage changes that had to be reversed.
- Handling replies the agent mishandled, including apology emails and internal escalations.
- Meetings that were booked and then rescheduled or unwound by a human.

What does not count: initial setup and configuration, which belongs in line 4; and ordinary AE preparation for a meeting that would have happened anyway.

Instrument this from day one. A weekly number self-reported by the two or three people doing the work is imprecise and honest. A number reconstructed at the end of the pilot by the person advocating for the tool is precise and useless.

## Worked example

A 42-day pilot on a published entry plan, 14 qualified meetings after exclusions and the qualification gate:

| Line | Value |
|---|---|
| `subscription` (annual 45,000, prorated 42/365) | 5,178 |
| `data_and_enrichment` (bundled) | 0 |
| `sending_infrastructure` (bundled) | 0 |
| `implementation_amortized` (6,000 over 12 months, 1.4 months elapsed) | 700 |
| `human_rework_hours` (71 hours at 85) | 6,035 |
| **Total** | **11,913** |

Cost per qualified meeting: 11,913 / 14 = **851**.
Subscription-only figure: 5,178 / 14 = **370**.

Both go on the memo. The 370 is the number in the vendor's business case and it is not wrong, it is answering a different question. The gap between the two is 481 per meeting, and 6,035 of the 6,735 that separates them is one line: the hours a human spent making the output usable. If that line is the reason the pilot fails its threshold, the memo should say so plainly, because "the tool is too expensive" and "the tool needs six hours of human work per meeting it produces" lead to different next steps — the first is a negotiation, the second is a product problem that a discount does not fix.
