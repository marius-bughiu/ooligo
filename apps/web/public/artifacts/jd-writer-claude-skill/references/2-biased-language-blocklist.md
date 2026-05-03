# Biased-language blocklist — TEMPLATE

> Replace the contents of this file with your team's actual blocklist.
> The defaults below are a starting point drawn from public bias-in-JD
> research (Gaucher et al. 2011, Textio 2023 benchmarks). The jd-writer
> skill flags every match found in a draft and suggests a neutral
> substitution.

Format: each row is `term | category | suggested substitution | reason`.
The skill matches case-insensitively on whole words.

## Gendered terms

| Term | Category | Substitution | Reason |
|---|---|---|---|
| rockstar | masculine-coded | high-performing | clusters in male applicants per Gaucher |
| ninja | masculine-coded | skilled practitioner | same |
| guru | masculine-coded | expert | same |
| aggressive | masculine-coded | proactive / driven | same |
| dominant | masculine-coded | leading / strong | same |
| competitive | masculine-coded | results-oriented | same |
| nurturing | feminine-coded | supportive | same |
| sympathetic | feminine-coded | empathetic | same |
| loyal | feminine-coded | committed | same |

## Age-coded terms

| Term | Category | Substitution | Reason |
|---|---|---|---|
| digital native | age-coded (young) | comfortable with web tooling | proxies for under-30 |
| recent graduate | age-coded (young) | early-career | same |
| energetic | age-coded (young) | engaged | same |
| young | age-coded (young) | early-career | direct violation in US |
| seasoned | age-coded (older) | experienced | proxies for over-50 |
| mature | age-coded (older) | experienced | same |

## Ableist defaults

| Term | Category | Substitution | Reason |
|---|---|---|---|
| must be able to stand | ableist if desk-based | remove unless physical | ADA-relevant |
| must lift X lbs | ableist if desk-based | remove unless physical | ADA-relevant |
| see clearly / hear clearly | ableist | remove unless safety-critical | ADA-relevant |
| crazy hours | ableist + culture-flag | demanding workload (with hours stated) | same |

## Culture-fit proxies

| Term | Category | Substitution | Reason |
|---|---|---|---|
| culture fit | in-group proxy | values alignment with {specific value} | well-documented bias vector |
| we work hard, play hard | in-group proxy | remove or specify hours | same |
| family | in-group proxy | team | same |
| like-minded | in-group proxy | aligned on {specific principle} | same |
| native English speaker | nationality proxy | strong professional English | direct EEOC concern in US |

## Credential-laden defaults

| Term | Category | Substitution | Reason |
|---|---|---|---|
| Ivy League | credential proxy | strong undergraduate background | proxies for class |
| top-tier university | credential proxy | strong undergraduate background | same |
| FAANG | credential proxy | experience at scale (state the scale) | proxies for in-network |
| 10+ years experience | credential proxy | demonstrated outcome at this scope | shrinks pool 40-60% |

## Override mechanism

Some terms in this list are unavoidable in some roles (e.g. "must lift
50lbs" for a warehouse role). The skill accepts an inline override of
the form `<!-- jd-writer:keep "<term>" reason="<reason>" -->` placed
immediately above the line. The override and reason are preserved in
the final draft for recruiter review.

## Last edited

{YYYY-MM-DD}
