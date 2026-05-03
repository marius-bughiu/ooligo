# Banned-phrase blocklist

> The rejection-feedback skill greps the final draft against every
> pattern below in step 5 (bias and false-specifics screening). Any
> hit halts the run with the offending string surfaced. Do NOT edit
> this file to make a draft pass — fix the rubric, the scorecard
> language, or the rubric-to-feedback mapping instead.

## A. EEOC-implicating language

A1. **Protected-class proxies.** Any of the following terms or
patterns in the draft halts the run:

- `culture fit`, `cultural fit`, `culture add` (without an
  accompanying behavioral-anchor citation)
- `team fit`, `not a fit` (when used as the substantive reason)
- `personality`, `chemistry`, `vibes`
- `executive presence`, `leadership presence`, `gravitas`
- `polish`, `polished`, `lacks polish`
- `aggressive`, `abrasive`, `pushy` (gendered descriptors)
- `soft`, `nice`, `quiet`, `meek` (inverse gendered descriptors)
- `mature`, `seasoned`, `young`, `energetic`, `digital native`
  (age proxies)
- `accent`, `articulate`, `well-spoken` (national-origin proxies)
- `family`, `kids`, `pregnant`, `maternity`, `paternity`,
  `parental` (family-status proxies)
- `accommodation`, `disability`, `health` (any reference to
  accommodation discussions in the rejection text)
- `religion`, `church`, `prayer`
- `marital`, `married`, `single`
- `name origin`, `surname` (any commentary on the candidate's
  name)
- `school`, `university`, `Ivy`, `tier-1`, `top-N` (when used as
  the substantive reason — schools may appear in factual context
  but not as the rejection driver)

A2. **Comparative ranking language.** Halts the run:

- `stronger candidates`, `better candidates`, `more qualified`
- `second choice`, `runner-up`, `not the top choice`
- `closer fit elsewhere`, `closer match`
- `pool was strong`, `competitive pool`
- `we found someone`, `we hired someone`, `the role is filled`
  (these belong in a separate sentence about the role status, not
  framed as a candidate ranking)
- Any phrase that implies a relative ordering of the candidate
  against unnamed others.

A3. **Defamation-risk language.** Halts the run:

- `dishonest`, `misleading`, `lied`, `lying`
- `unprepared`, `did not try`, `did not care`
- `arrogant`, `entitled`, `difficult`
- `concerning`, `red flag`, `worrying`
- Any subjective-character claim that could be cited against the
  firm in a defamation action.

## B. False-specifics patterns

B1. **Quote markers without source.** Halts the run if the draft
contains any quoted string (`"…"` or `'…'`) that does not appear
verbatim in the scorecard or transcript pool from step 2.

B2. **Numeric claims without source.** Halts if the draft contains
a numeric claim (`scored X`, `Y out of Z`, `X% of`) — interview
scores are internal calibration data, not candidate-facing
content.

B3. **Interviewer-identifying claims.** Halts if the draft names
an interviewer, references an interviewer's role beyond the
generic "the team", or attributes a quote to a specific person.
Interviewer identities are protected and naming them creates
retaliation risk.

B4. **Round-identifying claims that could not have happened.**
Halts if the draft references a round (`take-home`, `system
design`, `behavioral`, `pair programming`) that is not present in
the scorecard set for this candidate. The skill validates round
names against the loop's actual structure.

## C. Process-risk language

C1. **Promises about the future.** Halts the run:

- `we will reach out`, `we'll be in touch`, `next time`
- `definitely apply again`, `you will get an offer`
- `keep your resume on file` (varies by jurisdiction whether this
  is permissible — neutral phrasing is "we welcome a future
  application")
- Any timeline commitment.

C2. **Process-improvement requests from the candidate.** Halts if
the draft asks the candidate for feedback, a referral, or a
testimonial. Reverse asks in a rejection email are an
EEOC-witness-statement risk and a candidate-experience harm.

C3. **Unsolicited specifics in deny-jurisdiction cases.** The
skill's step 1 should have caught this, but as a defense-in-depth
check: if the run's `jurisdiction_policy` returned
`unsolicited_feedback: deny` and `feedback_requested: false`, the
draft must match the generic-decline template byte-for-byte. Any
deviation halts.

## D. Approved-topics list (positive list, used by step 4)

The rubric-to-feedback mapping's `{specific_topic}` substitution
slot pulls from this list. The LLM never free-texts a topic
string.

- `consistency-availability tradeoffs`
- `read-replica reasoning`
- `caching layer reasoning`
- `failure-mode reasoning`
- `test coverage`
- `error-handling specificity`
- `data-modeling tradeoffs`
- `query-pattern reasoning`
- `migration sequencing`
- `deployment sequencing`
- `cross-team coordination examples`
- `tradeoff reasoning under time pressure`

Add to this list only after team review. Topics added here are
permitted to appear in candidate-facing drafts.

## E. Maintenance

This file is version-controlled. The skill captures the SHA-256 of
this file in the audit log per run, so the blocklist used on a
given date is reproducible. If a candidate raises a claim against a
specific draft, the audit log answers "was the blocklist of date X
in effect at the time of the draft" — yes or no, no judgment call.

## Last edited

{YYYY-MM-DD}
