---
name: candidate-sourcing
description: Translate a job profile and ICP rubric into a sourcing query, retrieve candidates from Juicebox / hireEZ / LinkedIn Recruiter, score them against the rubric, and draft personalized outreach for the human reviewer to approve. Always stops at a human-review gate before any outreach is sent.
---

# Candidate sourcing

## When to invoke

Use this skill when a recruiter or sourcer hands you a role plus an ICP rubric and wants a ranked, evidenced shortlist with draft outreach. Take a job profile (title, level, must-have skills, location, comp band) and a fairness-aware rubric as input, and produce a Markdown shortlist plus a folder of draft messages.

Do NOT invoke this skill for:

- **Automated rejection.** This skill ranks; it never rejects. The "below threshold" tail is surfaced for the recruiter, who decides. Auto-reject in the loop triggers EU AI Act high-risk obligations and most US state hiring-AI laws.
- **Scoring against protected-class proxies.** Do not ask the skill to score on "culture fit", name origin, school prestige as a standalone signal, photo, age inferred from graduation year, gender inferred from pronoun usage, or pregnancy/parental status inferred from gaps. If the rubric contains any of these, refuse and surface the rubric line for the user to fix.
- **Pay-band recommendations.** NYC LL 144, Colorado, California, and Washington require posted ranges and bias audits for automated decisions on pay. Use a comp benchmarking tool, not this skill.
- **Reference checks or backchannel research on named individuals.** That is a different workflow with its own consent posture.

## Inputs

- Required: `job_profile` — path to a Markdown file with title, level, must-have skills, nice-to-have skills, location / remote policy, comp band, and the EEOC job category.
- Required: `icp_rubric` — path to the rubric file under `references/`. Without this the skill refuses to run; an unfaitened rubric is the most common cause of biased shortlists.
- Required: `source_channel` — one of `juicebox`, `hireez`, `linkedin_recruiter`. Do not mix channels in a single run; per-channel ToS and rate limits differ.
- Optional: `n` — shortlist size, default 25, hard max 100. Above 100 the skill warns that human review will not be meaningful.
- Optional: `exclude_list` — path to a CSV of `do_not_contact` emails or LinkedIn URLs (do-not-poach customers, prior rejects within 6 months, silent-period candidates).

## Reference files

Always read these from `references/` before doing any retrieval. Without them the shortlist is uncalibrated and the fairness guards are absent.

- `references/1-icp-rubric-template.md` — the rubric the skill scores against. Replace the template content with your role-specific rubric before running.
- `references/2-fairness-checklist.md` — pre-flight checks the skill runs on the rubric and on the retrieved pool. Fail-loud if any check fails.
- `references/3-shortlist-format.md` — the literal output format, including the evidence and source-URL columns the recruiter needs to defend the shortlist downstream.

## Method

Run these six steps in order. Steps 1-3 are deterministic filters and fairness pre-flight; only step 4 uses the LLM for ranking. The order is deliberate — running the LLM over an unfiltered, ToS-violating, or rubric-contaminated pool produces output that is fast, confident, and unusable.

### 1. Validate the rubric

Open `icp_rubric` and run every check in `references/2-fairness-checklist.md`. If any line in the rubric matches a protected-class proxy pattern (school-tier scoring, name-based filtering, employment-gap penalties, photo presence, "culture fit" without behavioral anchors), stop and return the offending lines to the user. Do not proceed with retrieval.

The choice to fail before retrieval rather than after is intentional: a biased rubric loaded into a sourcing tool's API leaves a log entry that counts as automated processing under GDPR Art. 22 and the EU AI Act, regardless of whether the skill ever shows the user the result.

### 2. Build the search query

Translate the job-profile must-haves into the channel's native query format:

- `juicebox` → natural-language PeopleGPT prompt, with location and level filters set as structured parameters not free text.
- `hireez` → Boolean string with explicit AND/OR/NOT grouping. Cap synonyms at 5 per dimension; longer Boolean degrades hireEZ's relevance ranking.
- `linkedin_recruiter` → use the Recruiter API with structured filters only. **Do not scrape `linkedin.com/in/` URLs** — that violates LinkedIn ToS and the *hiQ v. LinkedIn* settlement does not change ToS exposure for production sourcing.

Cap the retrieved pool at 200. Larger pools degrade rubric scoring because the LLM context fills with low-relevance candidates and the ranking flattens.

### 3. Deterministic pre-filter

Before the LLM sees any candidate, apply hard filters:

- Drop anyone in `exclude_list`.
- Drop anyone whose current company is on the do-not-poach list.
- Drop anyone whose profile was last updated more than 18 months ago (LinkedIn / Juicebox staleness signal).
- Keep only candidates whose stated location matches the role's location policy (with a configurable radius for hybrid roles).

These filters are deterministic so they can be audited. The LLM does not re-litigate them in step 4.

### 4. Rubric-based ranking

For each remaining candidate, score 1-5 on each rubric dimension (skill-match, level-fit, company-pattern-fit, response-likelihood). For every score above 1, cite the specific evidence string from the candidate's profile. No evidence string → score 1 by default.

Why a citation requirement: it forces the model to ground each score in profile text rather than infer from a name, photo, or school. Scores without evidence are the mechanism by which bias enters AI-augmented sourcing pipelines.

### 5. Human-review gate

Stop. Write the shortlist to `shortlist.md` per the format in `references/3-shortlist-format.md`. Write the draft outreach to `outreach/<candidate-id>.md`, one file per candidate. Do not call any "send" endpoint. Do not mark candidates as contacted in the ATS. Surface the path to both directories and exit.

The recruiter's job from here: read the shortlist, edit the messages, and send through the ATS or sourcing tool's outbox. The skill does not re-enter the loop until the next role.

### 6. Audit log

Append a single line to `audit/<YYYY-MM>.jsonl` containing: `run_id`, `role`, `rubric_sha256`, `pool_size_pre_filter`, `pool_size_post_filter`, `shortlist_size`, `channel`, `model_id`, `timestamp`. Do not log candidate PII to this file. The audit log exists so that under NYC LL 144 or EU AI Act questioning, the recruiter can demonstrate which rubric was used on which date.

## Output format

```markdown
# Sourcing shortlist — {Role title}

Generated: {ISO timestamp} · Channel: {channel} · Pool: {pre} → {post} · Rubric SHA: {short}

| # | Name | Current role | Current company | Skill | Level | Pattern | Response | Aggregate | Source |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Jamie L. | Senior Backend Engineer | Acme Fintech | 5 | 5 | 4 | 4 | 18 | {URL} |
| 2 | ... | ... | ... | ... | ... | ... | ... | ... | ... |

## Evidence — top 5

### 1. Jamie L. (aggregate 18)

- **Skill (5)**: "5y Go, 2y Rust, led migration from monolith to event-driven services" — profile, role 2.
- **Level (5)**: "Senior IC, scope across two teams, mentors three engineers" — profile, current role.
- **Pattern (4)**: "Stripe → Plaid → Acme Fintech" — three fintech roles in sequence.
- **Response likelihood (4)**: profile updated 11 days ago, "open to opportunities" tag set.

### 2. ...

## Skipped — surfaced for review (not auto-rejected)

| Name | Reason |
|---|---|
| ... | "current company on do-not-poach list (Acme Customer)" |
| ... | "profile last updated 2023-11, staleness > 18mo" |

## Draft outreach

Drafts written to `outreach/`. Recruiter reviews and sends; this skill
does not contact candidates.

- `outreach/jamie-l.md`
- `outreach/...`
```

## Watch-outs

- **Bias amplification (NYC LL 144, EU AI Act, EEOC).** *Guard:* the fairness checklist in `references/2-fairness-checklist.md` runs in step 1 and refuses retrieval if rubric contains protected-class proxies. Audit log in step 6 stores `rubric_sha256` so the rubric used on a given run is reproducible.
- **LinkedIn ToS exposure.** *Guard:* skill uses the Recruiter API (or Juicebox / hireEZ which carry their own data licensing), never scrapes public LinkedIn pages. If the channel is `linkedin_recruiter` and the Recruiter API is not configured, the skill aborts with a setup-error rather than falling back to scraping.
- **Stale profile data.** *Guard:* deterministic filter in step 3 drops candidates with `profile_updated > 18mo`. Response-likelihood scoring in step 4 weights profile freshness explicitly so cold-storage candidates do not crowd out actively looking ones.
- **Auto-send drift.** *Guard:* skill stops at the human-review gate in step 5 and writes to `outreach/` files. There is no `send` action defined anywhere in this skill. To send, the recruiter pastes into the ATS / sourcing tool outbox.
- **Rubric drift mid-search.** *Guard:* `rubric_sha256` is captured per run; if the rubric changes between two runs for the same role, the audit log shows both hashes, making it visible in retro.
- **Compensation discussion in draft outreach.** *Guard:* outreach templates in this skill never quote a number; they reference the comp band as "competitive range disclosed on screen" so the recruiter remains the source of pay-band statements (NYC LL 32-A, CO, CA, WA pay-transparency posting).
