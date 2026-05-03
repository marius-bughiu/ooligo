---
name: offer-prep
description: Produce an offer-prep brief the recruiter takes into the offer call. Reads the candidate's interview record, the role's internal comp band, and any competing-offer signal, then drafts a recommended offer composition with rationale, anticipated negotiation, and escalation flags. Replaces ad-hoc "we'll figure it out when we get there" offer prep.
---

# Offer prep

## When to invoke

Invoke before the recruiter opens the offer conversation with a candidate, once
the hiring manager has signed off "yes, we want to make an offer to this
person." Typical use cases: senior+ IC roles, all manager+ roles, any role
where the band has more than 15% spread between the floor and ceiling, any
role where a competing offer signal has surfaced in the loop.

Do NOT invoke this skill for:

- **Auto-extending offers.** The output is a brief for a human to review and
  decide on, not a draft to send. The recruiter and hiring manager (and where
  required, the comp committee) approve before any number reaches the
  candidate.
- **Customer-facing or candidate-facing comms about competing offers.** This
  skill reasons about competing-offer signal internally. It does not draft
  messages to send to the candidate that reference, validate, or counter a
  competing offer — that is a recruiter judgment call.
- **Replacing the comp committee.** For any recommendation that lands above
  the published band, outside posted-pay-range jurisdictions, or that creates
  a new internal-equity exception, the brief sets `escalation: comp-committee`
  and stops. It does not pre-decide what the committee should approve.

## Inputs

- Required: `candidate_context` — path to or pasted contents of the candidate's
  interview record (Ashby/Greenhouse/Lever export, debrief notes, scorecards,
  recruiter-screen and hiring-manager-screen notes).
- Required: `role` — role title, level, and team, plus a path to the comp band
  for that level (see `references/1-comp-band-template.md`).
- Required: `comp_band` — the role's internal salary range, equity range,
  bonus structure, signing-bonus policy, and any geographic adjustment table.
- Optional: `market_data` — Levels.fyi, Pave, or Carta benchmarks for the
  role + level + geo. If omitted, the brief uses only the internal band and
  flags "market context not loaded."
- Optional: `competing_offers` — what the candidate has said about other
  processes (see `references/2-competing-offer-evidence.md`). Free-form OK,
  but the brief downgrades unverified claims (see Watch-outs).
- Optional: `posted_range` — the salary range posted on the job ad, if any.
  Required for jurisdictions with pay-disclosure laws (see Watch-outs).

## Reference files

Always read the following from `references/` before generating the brief.
Without them, the recommendation is a guess.

- `references/1-comp-band-template.md` — the template for documenting a role's
  internal comp band. Replace the template's contents with your real bands per
  role + level. The skill's recommendation is bounded by this file.
- `references/2-competing-offer-evidence.md` — the format for capturing what
  the candidate has actually said about other offers, what is verified vs.
  claimed, and what the recruiter has done to validate it.
- `references/3-escalation-criteria.md` — the rules for when the brief sets
  `escalation: comp-committee` instead of recommending a number.

## Method

Run these six sub-tasks in order. Do not parallelize — the comp-band check in
step 1 gates whether steps 2-5 produce a recommendation at all.

### 1. Pull the comp band first

Load `comp_band` for the role + level + geo before reading anything else
about the candidate. Why first: it bounds the entire recommendation. If the
candidate's signal points outside the band, the brief sets
`escalation: comp-committee` immediately rather than fitting a story to a
predetermined number. Reading the candidate first creates anchoring bias
toward whatever the candidate said they wanted.

Output of this step: the floor, midpoint, and ceiling for base, bonus
target, equity, and signing — plus any geographic adjustment factor.

### 2. Read the interview signal

From the candidate's interview record, extract:

- Level signal — did the loop calibrate the candidate at the role's level,
  above, or below? Cite the debrief.
- Stated motivations — what the candidate said matters about the role,
  compensation, team, location, growth. Cite the recruiter-screen and
  hiring-manager-screen notes.
- Risk signals — anything in the loop that suggests the offer needs to
  address a specific concern (commute, equity-vs-cash preference, role
  scope ambiguity, manager-fit anxiety).

If the loop did not calibrate level (e.g. mixed signal, fewer than 4
interviewers), surface that as a blocker rather than guessing a midpoint.

### 3. Factor competing offers explicitly

If `competing_offers` is provided, classify each:

- **Verified** — recruiter has seen the offer letter or has direct
  third-party confirmation. Treat as a real anchor.
- **Claimed-credible** — candidate stated specifics (company, role, comp
  numbers) that match the candidate's seniority and the named company's
  known band. Treat as soft anchor; flag for verification.
- **Claimed-unverified** — candidate mentioned "I have other things going on"
  or named a company without specifics. Do not anchor against this. Surface
  it but recommend ignoring for sizing purposes.

Why factor explicitly: the failure mode is recruiters letting unverified
claims drive comp escalation. The brief makes the verification status
visible in the rationale so the comp committee (or recruiter+HM) decides
how much weight to give it.

### 4. Recommend offer composition

Using the band (step 1), the level signal (step 2), and the competing-offer
weight (step 3):

- Place base within the band — typically band-midpoint for at-level
  candidates, above-midpoint for top-of-band loop calibration, at-floor
  only with explicit rationale.
- Place equity — bias toward the company's standard grant for the level
  unless the loop or competing offer justifies a stretch.
- Place signing — only if there's a specific reason (relocation, leaving
  unvested equity behind, bridging a comp gap that base can't close
  without breaking internal equity).
- Compute total Year-1 cash, Year-1 plus equity-grant-divided-by-vest,
  and equity at the company's most-recent 409a or last-round price.

### 5. Draft anticipated negotiation and closing

For each likely candidate pushback (drawn from interview signal + competing
offers), write:

- The likely push (specific, citing the source).
- The recommended response (what the recruiter says).
- The walk-away threshold (what number or term the team will not exceed).

For the closing strategy: what to lead with for this candidate, what to
address proactively, what timing pressure to apply or relieve, what role
the hiring manager should play in the call.

### 6. Set escalation flag and "needs comp-committee review" fallback

Run the recommendation through `references/3-escalation-criteria.md`. If
any criterion fires, set `escalation: comp-committee` in the output, list
the criteria that fired, and stop. Do not soften the recommendation to
avoid escalation.

Why a fallback rather than a forced recommendation: forcing a within-band
number when the candidate signal is genuinely above-band trains the team
to ignore the brief. The escalation path is the trustworthy behavior.

## Output format

```markdown
# Offer prep — <Candidate name> for <Role>, <Level>

escalation: <none | comp-committee>
escalation-reasons: <empty | bulleted list of triggered criteria>

## Recommended offer

- Base: $<X> (band: $<floor>–$<ceiling>, midpoint $<mid>)
- Bonus target: <Y>%
- Equity: <Z> RSUs / options, <vest> vest
- Signing: $<W> (reason: <relocation | unvested-equity-bridge | none>)
- Start date: <target>
- Year 1 cash: $<X + bonus-at-target + signing>
- Year 1 + equity-annualized: $<above + equity/vest-years>

## Why this composition

- Level calibration: <at-level | above | below>, source: <debrief link>
- Stated motivations: <bulleted, with source notes>
- Competing-offer weight: <none | verified | claimed-credible | claimed-unverified>

## Anticipated negotiation

- Likely push: <specific>
  - Source: <interview note or competing-offer record>
  - Recommended response: <specific>
  - Walk-away: <number or term>

## Closing strategy

- Lead with: <what to emphasize>
- Address proactively: <concerns from loop>
- Timing: <pressure to apply or relieve, with reason>
- Hiring manager role: <what they do on the call>

## Open questions for the team

- <Anything the brief cannot resolve>

## Pay-disclosure compliance

- Posted range: $<floor>–$<ceiling> (jurisdiction: <state/country>)
- Recommendation within posted range: <yes | NO — escalate>
```

## Watch-outs

- **Pay-equity drift.** Repeated above-midpoint offers for one demographic
  pattern (e.g. external hires vs. internal promotes, one gender, one
  region) accumulate into pay-equity exposure even when each individual
  offer is defensible. Guard: the brief includes a `pay-equity-check`
  block that lists the last five offers at the same level + geo and their
  band-position. If the new recommendation would extend a pattern, the
  brief sets `escalation: comp-committee` regardless of size.
- **Jurisdictional pay-disclosure laws.** In states/countries with
  posted-pay-range laws (CA, CO, NY, WA, IL, etc.), the offer must fall
  within the posted range. Guard: the `posted_range` input is required
  for those jurisdictions; if missing, the brief refuses to produce a
  number and instead asks the recruiter to confirm the posted range.
- **Unverified competing-offer claims.** Candidates sometimes inflate or
  invent competing offers. Guard: every competing-offer entry is
  classified verified / claimed-credible / claimed-unverified per step 3,
  and the rationale section makes the classification visible so the team
  decides how much weight to give it. Unverified claims never drive a
  recommendation outside the band.
- **Protected-class proxies.** Negotiation strategy must not consider
  candidate demographics, current-employer pay history (illegal to ask
  in many jurisdictions), or proxies for either. Guard: the method
  reads only the interview record, the comp band, and the explicit
  `competing_offers` input — it does not request or accept
  current-salary or demographic fields.
- **Don't auto-extend.** The brief produces a recommendation. Humans
  approve and extend. Guard: the output never includes recipient email,
  signature, or send-ready offer-letter language.
