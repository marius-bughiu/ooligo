# Objection talk-track library — TEMPLATE

> Replace this template's contents with your team's actual canonical
> handlers. The competitive-battlecard skill matches incoming
> objections from Gong against these patterns rather than inventing
> handlers per run. That is what keeps tone consistent across
> battlecards and across reps.

The library is organised by objection pattern. Each pattern has:

- The pattern name (used as the slug the skill matches against)
- The customer wording variants the skill should treat as the same
  pattern
- The canonical handler (the rep response)
- The evidence requirement (what must back the handler before it can
  ship as `[EXTERNAL_OK]`)
- The escalation path (when to bring in PMM, SE, or product)

## Pattern: pricing-aggression

**Customer wording variants:**

- "Competitor X is half the price."
- "We got a quote from {competitor} that was significantly lower."
- "Your list price is hard to justify versus {competitor}."

**Canonical handler:**

> "{Competitor} prices on {their model — per seat / per usage / etc.};
> our pricing reflects {one differentiator that maps to outcome, e.g.
> the integration depth that removes the second tool from your stack}.
> Happy to walk through TCO with your finance partner — most teams
> find the comparison flips once {specific cost line} is included."

**Evidence requirement:**

- Public competitor pricing page URL with fetched date, OR
- Customer quote from a won deal where TCO was the deciding factor.

If neither, the handler ships as `[INTERNAL]` and the rep adapts live.

**Escalation:** finance-partnered TCO model — bring in PMM if the
pattern repeats across 5+ deals in 30 days.

## Pattern: integration-depth

**Customer wording variants:**

- "Does this integrate with {tool}?"
- "{Competitor} already has a {tool} integration."
- "We need this to work with our existing stack on day one."

**Canonical handler:**

> "We integrate with {tool} via {mechanism — native, API, Zapier — be
> specific}. The differences worth knowing: {1-2 concrete capability
> gaps or strengths}. Happy to show the integration in a working
> environment before you commit."

**Evidence requirement:**

- Public integration directory URL on our own site, OR
- Working demo environment the SE can spin up in under an hour.

## Pattern: migration-effort

**Customer wording variants:**

- "We just moved to {competitor} last year."
- "Migrating off {competitor} would be painful."
- "What does it take to switch?"

**Canonical handler:**

> "Migration off {competitor} typically takes {realistic range based
> on prior migrations}. The blockers we see most often: {1-2 specific
> ones}. We have a migration playbook for {competitor} specifically —
> {customer name from public reference list} did this in {timeframe}."

**Evidence requirement:**

- Public case study from a customer who migrated, OR
- Internal migration playbook the SE can walk through.

## Pattern: support-quality

**Customer wording variants:**

- "We've heard your support is slow."
- "{Competitor} has 24/7 support included."
- "Who do we call at 2am?"

**Canonical handler:**

> "Our support tiers are {list — be specific about response time
> SLAs}. For {customer's tier}, the SLA is {time}. Two named contacts
> on the customer success side, plus the in-app chat backed by our
> product engineers."

**Evidence requirement:**

- Public support SLA page URL with fetched date.

Never say anything about the competitor's support quality unless
quoting a customer who came from that competitor and was on the
record.

## Pattern: security-and-compliance

**Customer wording variants:**

- "Are you SOC 2?"
- "{Competitor} has FedRAMP."
- "Our security team has concerns."

**Canonical handler:**

> "We hold {list certifications, be exact}. The trust portal at {URL}
> has the current attestations and the security questionnaire. For
> the specific concern your team raised, the right person to bring in
> is {role — typically the security CSM or the CISO's office}."

**Evidence requirement:**

- Public trust portal URL with fetched date and the actual
  certifications listed.

## Pattern: feature-gap (genuine)

**Customer wording variants:**

- "{Competitor} has {feature} and you don't."

**Canonical handler:**

> "Correct, we do not have {feature} today. The reason is {real
> product reasoning — not 'on the roadmap'}. The way customers
> typically solve {underlying need} on our platform is {workaround
> with one named customer reference if available}. If that does not
> meet your need, I would rather flag that now than discover it in
> month three."

**Evidence requirement:**

- Internal product confirmation that the gap is real and the
  workaround is genuine.

This handler is the exception: it is intentionally honest about a
gap. The traps-to-avoid section in the battlecard skeleton exists
partly to remind reps not to fight battles they will lose — guard
against pretending parity where none exists.

## Last edited

{YYYY-MM-DD}
