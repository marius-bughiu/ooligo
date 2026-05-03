# Shortlist output format

> The candidate-sourcing skill writes `shortlist.md` per the structure
> below. The format is fixed because downstream consumers (the recruiter,
> a hiring manager, an audit reviewer) need predictable columns. Do not
> reformat without updating the skill's output check.

## File: `shortlist.md`

```markdown
# Sourcing shortlist — {Role title}

Generated: {ISO 8601 timestamp}
Channel: {juicebox | hireez | linkedin_recruiter}
Pool: {pre_filter} → {post_filter} → top {n}
Rubric SHA-256: {first 12 chars}
Run ID: {uuid}

## Top {n}

| # | Name | Current role | Current company | Skill | Level | Pattern | Response | Aggregate | Source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | {Name} | {Role} | {Company} | 5 | 5 | 4 | 4 | 18 | {URL} |

## Evidence — top 5

For each of the top 5, cite the specific profile string for every score
above 1. No citation → score reset to 1 (see fairness checklist C1).

### 1. {Name} (aggregate {N})

- **Skill ({score})**: "{verbatim profile excerpt}" — {profile section}.
- **Level ({score})**: "{excerpt}" — {section}.
- **Pattern ({score})**: "{employer sequence}" — {explanation against rubric}.
- **Response ({score})**: profile updated {date}, "{tag if any}".

### 2. {Name} (aggregate {N})

...

## Skipped — surfaced for review (NOT auto-rejected)

| Name | Reason | Source |
|---|---|---|
| {Name} | "current company on do-not-poach list ({customer})" | {URL} |
| {Name} | "stated location {city} outside role policy {policy}" | {URL} |
| {Name} | "profile last updated {date}, staleness > 18mo" | {URL} |

## Suggested talk-track per top candidate

The recruiter uses these as talk-track scaffolding for the first
screening call. They are NOT scripts.

### 1. {Name}

- **Open with**: their {recent role / talk / OSS contribution} — specific
  reference, not a generic compliment.
- **Likely motivation hypothesis**: {evidence-based, e.g. "third fintech
  role in a row, may be looking for a non-fintech reset; ask"}.
- **Hesitation to surface**: {e.g. "current company is well-funded; ask
  what would have to be true for them to consider a move"}.

### 2. {Name}

...

## Outreach drafts

Drafts written to `outreach/{candidate-id}.md`, one file per candidate.
The recruiter reviews, edits, and sends through the ATS or sourcing
tool's outbox. The skill does not contact candidates.

- `outreach/{id-1}.md`
- `outreach/{id-2}.md`
- ...
```

## File: `outreach/<candidate-id>.md`

```markdown
# Outreach draft — {Name}

Channel: {LinkedIn InMail | email | Juicebox sequence}
Subject: {≤60 chars, references a specific signal from the profile}

---

Hi {first name},

{One sentence referencing a specific, recent thing from their profile —
the {recent role / talk / project / post}. Not a flattery line.}

I'm hiring a {role title} at {company}. The reason I reached out is
{specific connection between their background and the role — cite the
profile signal}. The role's {one specific differentiator that would
matter to someone with this background}.

If you're open to a 15-minute conversation, I'm happy to share more. The
comp range will be disclosed on screen if we get to that step.

{Recruiter name}

---

## Recruiter-only metadata (strip before sending)

- Aggregate score: {N}
- Top evidence string: "{excerpt}"
- Source URL: {URL}
- Run ID: {uuid}
- Reviewed by recruiter: [ ]
- Sent: [ ]
```

## Why these fields are non-negotiable

- **`Source` URL on every row** — required for the recruiter to spot-check
  the LLM's evidence claims against the actual profile.
- **`Pool: pre → post → top N`** — surfaces how many candidates were
  filtered out deterministically vs. by the LLM. Big LLM-side cuts on a
  small post-filter pool is a signal of overfitting to rubric noise.
- **`Rubric SHA-256`** — proves which rubric was used on this run (NYC
  LL 144 audit defense + EU AI Act traceability).
- **`Skipped` table** — candidates filtered out are listed with reasons,
  not erased. Erasing them turns the workflow into automated rejection.
- **Recruiter-only metadata in outreach** — stripped before sending; its
  presence in the draft is what reminds the recruiter the message is a
  draft, not a finished product.
