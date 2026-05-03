# Expansion-signal taxonomy — TEMPLATE

> Replace these mappings with your actual SKU lineup and the trigger
> phrases / usage patterns your team has observed precede an upsell.
> The skill reads this file on every run; without your real taxonomy
> the digest output is generic and CSMs ignore it within two weeks.

## Strong-signal cutoff

A signal is classified **strong** only when at least one call mention
AND at least one usage-event corroboration land on the same SKU
within the run window. Anything else is **weak**. Edit this cutoff
only after you have three weeks of digests showing repeated cases of
genuine expansion that the strong-only filter missed.

## SKU map

For each SKU, list:
- **Call triggers** — verbatim phrase patterns the extraction prompt
  searches transcripts for. Be specific: "asked about pricing for
  more than 50 seats" not "asked about pricing."
- **Usage triggers** — pre-emitted anomaly types (from your usage
  warehouse) that count as evidence for this SKU.
- **Ticket triggers** — support-ticket subject / tag patterns that
  count as evidence (typically integration questions about premium
  features).
- **Negative-example phrases** — phrases that look adjacent but mean
  the opposite. The skill classifies these as `not_signal` rather
  than dropping silently.

### SKU: enterprise-tier (example)

- **Call triggers**:
  - "do you support SSO" / "SAML" / "SCIM"
  - "compliance requirements" / "SOC 2" / "HIPAA" / "FedRAMP"
  - "asked about pricing for {N}+ seats" where N is at least 2x
    current seat count
  - "our security team needs"
- **Usage triggers**:
  - `tier_gated_feature_attempt` for SSO, audit-log, or RBAC features
  - `seat_count_spike` over the segment baseline (see config)
- **Ticket triggers**:
  - tags include `sso`, `compliance`, `security-review`
  - subject matches `audit log`, `enterprise`, `compliance`
- **Negative-example phrases**:
  - "we're going to need to drop down a tier"
  - "your enterprise tier is too expensive"
  - "we'd consider {feature} if it were on a lower tier"

### SKU: additional-team-seats (example)

- **Call triggers**:
  - "the {team_name} team is also starting to use this"
  - "rolling out to {N} more people"
  - "our {team} would benefit from access"
- **Usage triggers**:
  - `seat_count_spike` over baseline
  - `feature_first_use` from a previously-inactive department
    (requires department tagging in usage events)
- **Ticket triggers**:
  - subject contains `add users`, `new team`, `provisioning`
- **Negative-example phrases**:
  - "we're consolidating teams onto fewer seats"
  - "trying to figure out who actually uses this"

### SKU: premium-feature-pack (example)

- **Call triggers**:
  - "does {premium_feature} support {use_case}"
  - "we're trying to do {use_case} — is that on the roadmap"
- **Usage triggers**:
  - `tier_gated_feature_attempt` for premium-pack features
  - `api_call_spike` on premium-only endpoints
- **Ticket triggers**:
  - tags include `premium-feature`, `api-limits`, `advanced-{feature}`
- **Negative-example phrases**:
  - "we tried {premium_feature} and it didn't fit our use case"
  - "we're using {competitor} for {use_case} instead"

### SKU: {your_next_sku}

(Add a section per SKU. The skill only routes to SKUs listed here.)

## Conditional-mention guard

The negative-example layer specifically catches conditional
expansion mentions — phrases that sound like intent but are in
fact feature-gap reports. The extraction prompt classifies any
match containing both an expansion-shaped verb and one of the
following conditional markers as `not_signal`:

- "if you {supported, added, built, shipped}"
- "would {consider, think about, look at} {expanding, upgrading}"
- "thinking about {upgrading, expanding, the enterprise tier}"

These are valuable product-feedback signals, but they belong in a
roadmap-feedback channel, not a CSM expansion digest. Route them
elsewhere if you want to capture them.

## Last edited

{YYYY-MM-DD}
