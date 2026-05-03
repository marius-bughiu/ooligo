---
name: boolean-search-builder
description: Translate a structured role intake (must-haves, nice-to-haves, anti-signals, location policy) into three calibrated search queries — a hireEZ Boolean string, a Google X-ray query, and a Juicebox PeopleGPT prompt. Each query is annotated with expected pool-size band and dimensional coverage gaps so the sourcer can pick the channel for the role.
---

# Boolean and X-ray search builder

## When to invoke

Use this skill when a sourcer or recruiter hands you a role intake and wants three calibrated search queries — one per channel — without authoring them by hand. Take a structured role intake (a Markdown file with must-haves, nice-to-haves, anti-signals, location policy) as input, and return three queries with synonym reasoning, pool-size estimates, and dimensional coverage gaps.

Do NOT invoke this skill for:

- **Authoring the role rubric.** This skill turns a rubric into a query. If the rubric is two bullet points, the queries will be three flavors of two bullet points and will not return better candidates than guessing. Get the rubric right first; then come back.
- **Bulk-paginating LinkedIn through the X-ray query.** The X-ray output is for occasional manual use against the public-indexed surface. Production sourcing through public LinkedIn URLs is a ToS violation regardless of the *hiQ v. LinkedIn* settlement. The skill refuses to generate scraping scripts.
- **Diversity slate construction.** Boolean queries can encode bias through proxy terms (school name, group affiliation). Use a slate auditor on the returned pool, not the search query, to catch this.
- **Confidential or executive searches.** Queries leaving traces in shared search histories are an exposure risk.

## Inputs

- Required: `role_intake` — path to the role intake Markdown file. Use the template in `references/1-role-intake-template.md`. Without this the skill refuses to run.
- Optional: `synonym_depth` — integer, 5 default, 7-8 for niche roles, hard max 10. Above 10 the queries return false-positive pools that take longer to filter than they save.
- Optional: `channels` — subset of `["hireez", "xray", "juicebox"]`. Default is all three. Use a subset when the team only has access to a subset.
- Optional: `geography_hint` — free-text geography (e.g. "US Pacific time zone, hybrid SF") used in the pool-size estimate. If not provided, the skill reads it from the intake's location-policy field.

## Reference files

Always read these from `references/` before generating queries:

- `references/1-role-intake-template.md` — the structure the skill expects on input. If the user's intake doesn't match this shape, surface the gap and ask for a re-author rather than guessing.
- `references/2-rubric-fairness-checklist.md` — the patterns that, if present in the intake, halt the skill before query generation. Do not edit to make biased intakes pass.
- `references/3-channel-query-formats.md` — per-channel syntax notes (hireEZ Boolean operators, X-ray format conventions, Juicebox PeopleGPT prompt patterns).

## Method

Five steps, in order. Steps 1-2 are validation and grounding; steps 3-5 produce the output. The order matters: if the intake fails fairness pre-flight, the skill must not reach the synonym-expansion step, because synonyms generated against a biased intake encode the bias into the queries themselves.

### 1. Validate the intake

Open `role_intake` and run every check in `references/2-rubric-fairness-checklist.md`. If the intake includes school-tier scoring, name-pattern filtering, employment-gap penalties, photo-presence requirements, or "culture fit" without behavioral anchors, halt and return the offending lines. Do not proceed.

The check runs at intake-parse time, not query-generation time, so a violating rubric never reaches synonym expansion. School-prestige scoring is the most common bias-amplification path here; if the user insists on a school-tier dimension, redirect them to the underlying technical-depth signal that's actually doing the prediction work.

### 2. Expand synonyms per dimension

For each `must_have`, generate `synonym_depth` synonyms. Each synonym must be grounded — cite the reasoning ("commonly used at Stripe / Plaid / fintech engineering teams," "framework introduced in 2022, naming varies between vendors"). If you cannot ground a synonym in named usage, omit it. Do not invent.

Cap the synonym set at 10 even if `synonym_depth` is set higher; beyond 10 the false-positive rate climbs faster than the recall, and queries return unmanageable pools.

For `nice_to_have`, generate up to 3 synonyms each — these are used to rank, not to filter, so over-expansion is less costly.

For `anti_signals`, do not expand. Anti-signals as NOT clauses should match exactly to avoid over-eliminating; the user knows what they meant.

### 3. Build three queries in parallel

Author the three queries against the channel-specific format in `references/3-channel-query-formats.md`. Each channel gets a query tuned to its strengths:

- **hireEZ Boolean** — explicit `AND`/`OR`/`NOT` grouping with parentheses. Title field, skill field, and exclude field used separately rather than crammed into one Boolean string. Location goes into the structured location filter, never into the Boolean. Synonyms grouped per dimension with `OR`.
- **Google X-ray** — `site:linkedin.com/in` (or `site:github.com` for engineering roles where the GitHub signal is stronger). Title in quotes. Anti-signals as `-` exclusions. Synonyms via `OR` operator. The X-ray output is annotated with a "manual use only" warning and a recommended max of 50 page-fetches per query before switching to the Recruiter API.
- **Juicebox PeopleGPT** — natural-language prompt that names the role, level, and key signals in plain English. Location and level go into Juicebox's structured filters, not the prompt. Synonyms inform the prompt's wording but are not enumerated; PeopleGPT's underlying expansion handles that.

The three queries describe the *same role* but are tuned to different retrieval mechanics. Do not generate the same Boolean and label it three ways.

### 4. Estimate pool size band

For each query, return an expected pool-size band with the assumptions named:

```
hireEZ: 200-800 results
  Assumes US Pacific + Mountain time zones; 5 synonyms per dimension;
  Senior IC level filter applied. Tighten by removing the broadest
  synonym in skill_match if results exceed 800.
```

The band is calibrated against the synonym count and the location filter. It is an estimate, not a measurement. Sourcers can tighten or widen based on the band rather than running the query and being surprised.

### 5. Surface dimensional coverage gaps

Every query is annotated with what it is NOT catching. The common gaps are:

- **Response-likelihood** — Boolean and X-ray have no recency filter beyond what the channel exposes. Annotate which channels' UIs let the sourcer filter on profile-update recency post-search.
- **Level / scope** — Boolean cannot easily encode "Senior IC scope across two teams." Note that level filtering happens via structured filters in the channel UI, not in the Boolean.
- **Behavioral signals** — no Boolean expression captures "led a migration." Note that this dimension is best handled by rubric ranking on the returned pool, e.g. via the `candidate-sourcing` skill.

The output must make the gap visible so the sourcer plans the next step.

## Output format

```markdown
# Search queries — {role title}

Intake: `{path}` · Synonym depth: {n} · Generated: {ISO timestamp}

## hireEZ Boolean

**Title field:**
"Senior Backend Engineer" OR "Staff Engineer" OR "Senior Software Engineer"

**Skill field:**
("Go" OR "Golang" OR "Rust") AND ("distributed systems" OR "microservices" OR "event-driven")

**Exclude field:**
"contractor" OR "freelance"

**Location filter (structured):** US Pacific Time, US Mountain Time

### Pool-size estimate
200-800 results.
Assumes US Pacific + Mountain time zones; 5 synonyms per dimension; Senior IC level filter applied. Tighten by removing "microservices" if >800.

### Coverage gaps
- Response-likelihood: filter on profile recency in hireEZ UI after the search.
- Level / scope: confirm "Senior IC vs Manager" in the rubric ranking step; Boolean can't encode it.

## Google X-ray

⚠️ Manual use only. Cap at ~50 result-page fetches per query before switching to a sourcing-tool API. Public LinkedIn scraping at scale violates ToS.

```
site:linkedin.com/in "Senior Backend Engineer" OR "Staff Engineer"
("Go" OR "Golang" OR "Rust") "distributed systems"
-"contractor" -"freelance"
```

### Pool-size estimate
50-300 indexable results.
LinkedIn's robots.txt limits which profiles Google indexes; X-ray surfaces a fraction of the population.

### Coverage gaps
- Recency: Google index lag is 1-3 months on profile updates.
- Level: title quoting catches some but not all level conventions; expect overlap with junior roles.

## Juicebox PeopleGPT

```
Find Senior Backend Engineers in the US Pacific or Mountain time zones
who own production Go or Rust services in distributed systems
contexts. Prefer candidates who have led a service rewrite or
migration with named outcomes. Exclude contractors. Senior IC scope.
```

**Structured filters:** Level = Senior IC. Location = US Pacific, US Mountain.

### Pool-size estimate
80-400 results in PeopleGPT.
Juicebox tends to return tighter pools than hireEZ for the same intake; expect about half the volume.

### Coverage gaps
- Behavioral signal: PeopleGPT picks up "led a migration" loosely; verify in rubric ranking.

## Synonym reasoning (audit trail)

- "Golang" / "Go" — interchangeable; "Go" alone collides with too many false positives in profile text. Pair them with `OR`.
- "distributed systems" / "microservices" / "event-driven" — three labels for overlapping but distinct architectural styles. "microservices" is broader (commonly used at non-distributed-systems shops); flag for tightening if results exceed 800.
- (additional synonyms with reasoning…)
```

## Watch-outs

- **Bias-encoding through proxy terms.** *Guard:* the fairness pre-flight in step 1 halts the skill before any synonym expansion if the intake names protected-class proxies. School-prestige in particular: do not list specific schools; list the technical-depth signal those schools tend to correlate with, and let the synonym expansion catch graduates from non-target schools who have the depth.
- **LinkedIn ToS exposure.** *Guard:* the X-ray output carries a "manual use only" warning and a recommended page-fetch cap. The skill does not generate scraping scripts.
- **Synonym hallucination.** *Guard:* every synonym cites grounded reasoning. Synonyms without reasoning are dropped before the query is built.
- **Over-expansion → garbage pools.** *Guard:* hard cap at 10 synonyms per dimension, with the warning in step 2 about false-positive rate climbing faster than recall.
- **Pool-size estimate treated as measurement.** *Guard:* output is always a band with assumptions named, never a single number. If actual results diverge >2× from the band, the synonym count or location filter is wrong; the skill should be re-run with a tightened intake, not the query patched in place.
