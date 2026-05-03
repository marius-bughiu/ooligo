---
name: jd-writer
description: Interview a hiring manager about a new role and produce a structured, skills-based, jurisdiction-aware job description draft ready for recruiter review. Use this skill at the moment a role is opened, before any sourcing or posting.
---

# JD writer

## When to invoke

Whenever a hiring manager has decided to open a role and you need a usable JD within the same working day. Take a role title plus level, the manager's intake notes, and the target jurisdiction as input, then produce a structured Markdown JD that a recruiter can edit and post.

Do NOT invoke this skill for:

- Auto-publishing a JD to a careers site or job board without recruiter review
- Roles that include compensation in jurisdictions that require pay-range audits (NYC §8-1402, CA SB 1162, CO Equal Pay Act) before public posting — produce the draft, but route it to compliance, not the publishing API
- Internal-mobility postings (different voice, different EEO requirements, use the mobility-template skill instead)
- Backfills where the prior JD is still accurate (just refresh the prior JD's `last_reviewed` date — don't redraft)

## Inputs

- Required: `role` — title plus level (e.g. `Senior Backend Engineer`, `Director of Marketing Operations`). Title alone is insufficient.
- Required: `intake_notes` — free-text notes from the hiring-manager intake call. The skill interviews against these, not from a blank canvas.
- Required: `jurisdiction` — primary posting jurisdiction (e.g. `US-NY`, `US-CA`, `US-CO`, `EU-DE`, `UK`). Drives the compliance footer.
- Optional: `comparables` — paths or URLs to 1-3 comparable JDs, internal or external. The skill uses these for voice and structure calibration.
- Optional: `icp_candidate` — short description of the target candidate shape (years of experience band, prior-company patterns, motion). Used to tune must-have vs nice-to-have language.
- Optional: `pay_range` — min/max in local currency. Required if `jurisdiction` matches a pay-transparency state.
- Optional: `comp_philosophy` — one paragraph on equity, bonus, benefits. Reused across roles so usually loaded once.

## Reference files

Always read the following from `references/` before drafting. They contain the user's role-family templates, biased-language blocklist, and jurisdiction matrix. Without them the draft is generic.

- `references/1-role-family-templates.md` — JD scaffolds per role family (engineering, sales, marketing, ops, leadership). Replace contents with your team's actual scaffolds.
- `references/2-biased-language-blocklist.md` — terms to flag and the neutral substitutions to suggest. Replace contents with your team's actual blocklist; the defaults are a starting point.
- `references/3-jurisdiction-matrix.md` — per-jurisdiction compliance requirements (pay disclosure, EEO statement, accommodation language, application-data restrictions). Replace contents with your team's legal-reviewed matrix.

## Method

Run these five sub-tasks in order. Do not parallelize — the bias screen must run on the actual draft, and the jurisdiction check must run on the actual compensation language.

### 1. Interview against the intake notes

Read the intake notes, then ask the hiring manager 5-8 targeted clarifying questions. Topic order: scope and ownership, success at 12 months as a measurable outcome, the team context, must-have vs nice-to-have skills articulated as observable behaviors, the realistic day-to-day, the parts of the role that are hardest. Why intake-notes-first rather than template-first: starting from the template biases toward generic responsibilities; starting from the manager's own framing surfaces what makes this role specific to this team at this moment.

### 2. Map to the role-family scaffold

Match the role to the closest scaffold in `references/1-role-family-templates.md`. Use the scaffold for section order and headers, not for content. Why a scaffold rather than a free form: recruiters and candidates skim JDs in a predictable pattern; consistent structure raises completion rate on application forms.

### 3. Draft skills-based requirements

Convert each "must have" into an observable skill or outcome statement, not a credential. "5+ years at FAANG" becomes "designed and operated distributed systems at over 10M requests per day." "CS degree required" becomes "demonstrable systems-design fluency, by interview or portfolio, degree not required." Why skills-based: credential-laden requirements shrink the candidate pool by 40-60% without raising hire quality, per public BCG and Burning Glass studies. The skill should refuse to write "X years experience required" without a specific outcome justification.

### 4. Bias-screening pass

Run the entire draft against `references/2-biased-language-blocklist.md`. Flag every match and propose a neutral substitution. Common categories: gendered terms (rockstar, ninja, aggressive), age-coded terms (digital native, recent graduate, energetic), ableist defaults (must be able to stand for 8 hours when role is desk-based), culture-fit framings that proxy for in-group preference. Why a separate pass rather than inline screening: bias terms cluster in revisions, not first drafts — post-draft screening catches them more reliably than during-draft self-monitoring.

### 5. Jurisdiction-and-compliance check

Look up the `jurisdiction` value in `references/3-jurisdiction-matrix.md`. Insert the required pay-range disclosure, EEO statement, accommodation language, and any application-data restrictions verbatim from the matrix. If the jurisdiction requires a pay range and `pay_range` was not supplied, emit a TODO block in place of the comp section and surface the missing input at the top of the output.

## Output format

```markdown
# {Role title} — {Level}

> Draft generated by jd-writer skill on {YYYY-MM-DD}. Recruiter review
> required before posting. Jurisdiction: {jurisdiction}.

## About the role

Two to three sentences on what the role does and why it matters to the
team's twelve-month plan. Names the team and the closest collaborators.

## What you'll do

- {Outcome-framed responsibility 1}
- {Outcome-framed responsibility 2}
- {Outcome-framed responsibility 3}
- {Outcome-framed responsibility 4}
- {Outcome-framed responsibility 5}

## What we're looking for — must have

- {Observable skill or outcome 1}
- {Observable skill or outcome 2}
- {Observable skill or outcome 3}

## What we're looking for — nice to have

- {Observable skill or outcome 1}
- {Observable skill or outcome 2}

## About the team

One paragraph: team mission, who the role works with day to day, what
the team is shipping in the next two quarters.

## Compensation and benefits

- Salary range: {currency min}–{currency max} (per
  {jurisdiction} pay-transparency requirements)
- Equity: {band}
- Bonus: {structure}
- Benefits: {summary linking to benefits page}
- Location: {remote / hybrid / on-site} — {office locations or remote
  regions}

## Equal employment opportunity

{Verbatim EEO statement from references/3-jurisdiction-matrix.md for
the target jurisdiction.}

## Accommodations

{Verbatim accommodation statement from
references/3-jurisdiction-matrix.md.}

## How to apply

Apply via {URL}. Application deadline: {date or rolling}. Expected
process: {N stages, named, with rough timing}.
```

## Watch-outs

- **Gendered or coded language slips back in during edits.** The bias-screening pass is run on the first draft; if the recruiter rewrites a section, the pass should be rerun. Guard: the skill emits a "rerun-bias-screen" hint as the last line of every output, and refuses to mark a JD `bias_checked: true` without an explicit re-screen call.
- **Unrealistic must-haves balloon when the manager is a domain expert.** Engineers writing engineering JDs tend to list every tool they personally use as a must-have. Guard: the skill caps must-haves at five and forces anything beyond that into nice-to-have, with the manager's explicit override required to exceed the cap.
- **Pay-range omission in regulated jurisdictions.** Posting without a range in NYC, CA, CO, WA, IL (eff. 2025) triggers per-violation fines. Guard: when `jurisdiction` matches the regulated list and `pay_range` is missing, the skill replaces the comp section with a blocking TODO and refuses to emit a "ready-to-post" status.
- **Voice mismatch with employer brand.** Generic Claude defaults read as generic JDs. Guard: the skill requires at least one comparable JD in `comparables` and refuses to draft without it; the comparable is used as the voice anchor, not just for structure.
- **Length creep.** Job descriptions over 600 words get skim-read; hire-quality drops as length grows. Guard: the skill targets 400 words for individual-contributor roles, 550 for leadership, and emits a word-count footer with a warning above the cap.
