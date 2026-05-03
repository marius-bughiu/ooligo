# Reference-pool mapping

The diversity slate auditor compares slate composition to a reference labor-market pool. This file maps each role family to the appropriate reference source.

The defaults are BLS Occupational Employment Statistics (free, US-only, updated annually). Industry-specific overrides are listed where stronger sources exist.

## Format

Each entry has:

- `role_family` — the string the recruiter passes to the skill
- `bls_occupation_code` — the BLS SOC (Standard Occupational Classification) code
- `bls_table_url` — the canonical BLS table URL for the occupation's demographic breakdown
- `last_verified` — when this entry was confirmed against the BLS source
- `recommended_override` — a stronger source where one exists
- `notes` — caveats specific to this role family

## Mappings

### Software engineering

```yaml
role_family: senior-software-engineer
bls_occupation_code: "15-1252"  # Software Developers
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: stack-overflow-developer-survey
notes: |
  BLS lumps all software developer levels together. For senior+ roles,
  the Stack Overflow Developer Survey breaks down by years of experience
  and tends to surface a different demographic mix at 10+ years vs. all
  developers. For roles requiring 8+ years experience, the SO override
  is more representative.
```

```yaml
role_family: junior-software-engineer
bls_occupation_code: "15-1252"
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: |
  Junior roles draw heavily from CS programs. The CRA Taulbee Survey
  has CS-bachelor's demographics that may be a better fit for new-grad
  hiring slates.
```

```yaml
role_family: engineering-manager
bls_occupation_code: "11-9041"  # Architectural and Engineering Managers
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: |
  Management roles have substantially different demographic distributions
  from IC roles. Use this code (not the IC code) for EM/Director slates.
```

### Sales

```yaml
role_family: account-executive
bls_occupation_code: "41-3091"  # Sales Representatives, Services
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: |
  Tech-AE roles and SaaS-AE roles tend to have different demographics
  from the broader services-sales population the BLS code covers.
  Industry-specific data is hard to come by; treat the BLS reference
  as a floor.
```

```yaml
role_family: sales-development
bls_occupation_code: "41-3091"
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: |
  SDR roles are entry-level; the BLS code includes career sales reps,
  which skews older. Adjust expectations for early-career composition.
```

### Customer success

```yaml
role_family: customer-success-manager
bls_occupation_code: "13-1151"  # Training and Development Specialists
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: |
  No clean BLS code for CSM. The training-and-development code is the
  closest occupational analog by job content; the customer-service-rep
  code is too entry-level. Treat with caveat.
```

### Recruiting / HR

```yaml
role_family: recruiter
bls_occupation_code: "13-1071"  # Human Resources Specialists
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: null
```

### Marketing

```yaml
role_family: marketing-manager
bls_occupation_code: "11-2021"  # Marketing Managers
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: null
```

### Data / analytics

```yaml
role_family: data-scientist
bls_occupation_code: "15-2051"  # Data Scientists
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: |
  Data scientist is a relatively new BLS code (added 2021). The
  demographic data is thinner than for established occupations.
```

```yaml
role_family: data-analyst
bls_occupation_code: "15-2098"  # Data Analysts
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: null
notes: null
```

### Legal

```yaml
role_family: in-house-counsel
bls_occupation_code: "23-1011"  # Lawyers
bls_table_url: https://www.bls.gov/cps/cpsaat11.htm
last_verified: 2026-01-15
recommended_override: aba-profile-of-the-legal-profession
notes: |
  ABA's annual Profile of the Legal Profession has more granular
  partnership/in-house/government breakdowns than BLS. For in-house
  roles specifically, the ABA override is more representative.
```

## Adding a role family

To add a new role family:

1. Find the BLS SOC code that best matches the role's actual job content (not the marketing title).
2. Confirm the BLS demographic table for that occupation has the dimensions you need.
3. Add the entry to this file with `last_verified` set to today.
4. If a stronger industry-specific source exists (industry survey, professional association data), note it under `recommended_override`.

## Refresh cadence

BLS publishes Current Population Survey demographic tables annually. This file should be re-verified every 12 months. Sources older than 18 months trigger a freshness warning in the auditor's output.
