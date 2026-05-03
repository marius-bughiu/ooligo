# Escalation criteria — TEMPLATE

> Replace this template's contents with the criteria your team has
> agreed mark a "stop coaching, start a performance conversation"
> moment. The ae-rep-coaching skill evaluates every criterion before
> producing the weekly note. If any criterion fires, the Skill
> refuses to render the coaching note and returns this list with the
> matching evidence instead.

## Why a hard separation

Coaching notes are formative, low-stakes, weekly. Performance conversations are summative, high-stakes, on-record, and involve HR. Confusing the two damages the rep both ways: small issues become existential, real issues get softened into "patterns to tighten" and go unaddressed. The Skill enforces the separation by refusing to write a coaching note when any of the criteria below fires.

## Criteria

Each criterion is binary (fires or does not). The Skill quotes the transcript evidence when reporting a fire, so the manager can verify before acting.

### 1. Misrepresentation of product capability

The rep claims a capability the product does not have, in a way a reasonable buyer would rely on. Example: "Yes, we support SOC 2 Type 2 out of the box" when the product has Type 1 only.

### 2. Misrepresentation of pricing or contract terms

The rep states pricing, discount authority, term length, or termination terms inconsistent with what is in the actual contract template or pricing book. One-off slips happen; a pattern across multiple calls is escalation.

### 3. Hostile or disrespectful tone toward the customer

Sarcasm, dismissiveness, raised voice, interrupting repeatedly. The Skill cites timestamps and quotes; the manager makes the judgment call on intent, but a pattern triggers the criterion regardless of intent.

### 4. Side deal or off-contract promise

The rep promises something — feature, timeline, credit, side letter — that is not part of the standard contract and was not approved by deal desk or the manager. This is a legal exposure issue, not a coaching issue.

### 5. Discovery of harassment, discrimination, or compliance issue

Anything that surfaces in a call (rep behavior or customer behavior) that triggers HR or legal review. The Skill never tries to write this up itself; it surfaces the timestamp and stops.

### 6. Visible signs of burnout or distress

Repeated mentions of being overwhelmed, audible distress on calls, patterns suggesting a mental-health concern. Coaching is not the right intervention; a 1:1 conversation, EAP referral, or workload review is.

## What the Skill returns when a criterion fires

```markdown
# Escalation — not a coaching moment

The ae-rep-coaching skill stopped before writing a coaching note for
{Rep name} because the following criterion fired:

**{Criterion name}**

Evidence:
- {Call name — HH:MM}: "{quote}"
- {Call name — HH:MM}: "{quote}"

Recommended next step: {appropriate path — HR conversation, deal
desk review, EAP referral, etc.}. Do not paste this output into a
performance document; it is a flag, not a finding. Verify the
evidence yourself before acting.
```

## Last edited

{YYYY-MM-DD}
