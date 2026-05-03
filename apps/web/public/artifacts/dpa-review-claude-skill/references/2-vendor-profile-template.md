# Vendor profile template

Vendor profiles let the DPA reviewer weight findings by what's known about the vendor's baseline behavior. A hyperscaler's DPA reads differently from a Series A startup's DPA; the same vague language may be acceptable in one context and a red flag in another.

The profile is optional. Without it, the reviewer scores against the checklist alone.

## Profile shape

Save one file per major vendor as `vendor-profiles/<vendor-slug>.md`.

```yaml
vendor: AWS
profile_version: 2026.1
profile_updated: 2026-04-15

# Vendor classification
classification: hyperscaler  # hyperscaler | enterprise-saas | mid-market-saas | startup | services-vendor
sub-processor-of-others: true  # does this vendor act as your sub-processor for other vendors?

# Standard offerings
standard_dpa_url: https://aws.amazon.com/agreements/data-processing/
sccs_offered: [eu-2021-914-module-2, eu-2021-914-module-3]
certifications_held: [soc2-type-ii, iso-27001, iso-27018, hipaa-baa]

# Negotiation posture
negotiation_likelihood: low  # how likely is this vendor to accept redlines? hyperscalers: usually low for standard terms
prior_redlines_accepted:
  - "tightened breach window from 72h to 48h, accepted 2025-11"
  - "added Annex C sub-processor notification, accepted 2026-02"

# Risk posture
data_sensitivity: high  # how sensitive is the data this vendor processes?
data_volume: high
firm_dependency_score: 9  # 1-10; how disruptive would changing vendor be?

# Known issues
known_issues:
  - "Sub-processor list at standard URL is updated without per-customer notification — Controller must monitor."
  - "Audit rights via SOC 2 reports only; no direct audit. Counsel has accepted this for SOC 2 Type II + ISO 27001 holders."
  - "Liability cap for privacy claims tied to fees-paid; firm has previously accepted with carve-out for GDPR Art. 83 fines."

# Reviewer guidance
weight_findings_lower:
  - "blanket sub-processor consent — accepted for hyperscalers per firm policy"
  - "audit-via-summary — accepted for SOC 2 Type II + ISO 27001 holders"
weight_findings_higher:
  - "any new processing purpose — escalate to counsel even for routine reviews"
```

## How the reviewer uses the profile

- Findings tagged with `weight_findings_lower` patterns are surfaced with `informational` severity instead of red-flag — the firm has already evaluated and accepted the trade-off for this vendor class.
- Findings tagged with `weight_findings_higher` patterns are escalated regardless of normal severity.
- `prior_redlines_accepted` informs the recommended-redline section: "this vendor accepted similar redline at this date."
- `negotiation_likelihood: low` adds a note to the report: "vendor unlikely to accept redlines — the legal-ops lead may prioritize accept-with-risk-acceptance over negotiation."

## When to update a profile

- Vendor accepts a new redline → add to `prior_redlines_accepted`.
- Vendor refuses a redline the firm has accepted before → flag and escalate; profile may need re-version.
- Vendor changes their standard DPA → update `standard_dpa_url` and bump `profile_version`.
- Annual review: confirm certifications still held, sub-processor list still accurate, classification unchanged.

## What NOT to put in the profile

- Confidential commercial terms (pricing, custom-negotiated rates) — those belong in procurement records.
- Personal information about vendor counsel or contacts.
- Speculation about vendor strategy.

The profile is for reviewer calibration, not a vendor-relationship CRM.
