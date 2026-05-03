# Novel-question escalation criteria — TEMPLATE

> The vendor-dd-questionnaire skill consults this file at the end of
> every question's processing. Any question matching one or more rules
> below is replaced with a "needs security review" block instead of a
> drafted answer. Replace the example thresholds with the firm's actual
> policy.

## Why this file exists

Auto-fill is safe only on questions the firm has already answered (via
the control library) for situations the firm has already encountered.
Everything else — novel frameworks, forward-looking commitments,
incident-specific questions, low-confidence matches — is where the
skill produces confidently-wrong answers if allowed to proceed. This
file is the explicit list of "do not improvise" triggers.

If you find yourself wishing the skill would just answer one of these
anyway, the right move is to add the situation to the control library
(so the answer is reviewed once, then reusable) — not to weaken these
rules.

## Hard escalation triggers (always flag)

A question matching any one of these is flagged for security review.
The skill emits the question text, the candidate answer it considered
(if any), the trigger that fired, and any candidate control IDs the
matching pass surfaced.

### 1. Framework not mapped in the control library

If the question references a framework section the library does not
cover (e.g. `FedRAMP Moderate AC-2`, `IRAP §<n>`, `BSI C5 OPS-01`) and
no cross-framework equivalent is recorded, flag. Do not pattern-match
to a "close enough" framework section — the customer is reading the
answer through the lens of the framework they cited.

### 2. Forward-looking commitment

Linguistic patterns that flag automatically:

- `will you support`
- `do you plan to`
- `is on your roadmap`
- `by what date`
- `when do you intend`
- `future support for`

Roadmap answers are contractual representations and require product +
legal sign-off, not security alone. The skill never answers these.

### 3. Specific incident or audit finding

Linguistic patterns that flag automatically:

- `have you had a breach`
- `describe any open audit findings`
- `regulatory action`
- `data subject request`
- `enforcement action`
- `material weakness`

These require the security and legal teams; the skill cannot represent
the firm on them.

### 4. Customer-specific architecture or contract clause

Questions that quote the customer's own architecture, MSA, or DPA back
at the firm and ask the firm to confirm — for example "Confirm your
deployment matches the architecture in Schedule 3" — require deal-team
review. The skill does not have access to customer-specific schedules
and cannot confirm.

### 5. Low-confidence match

Any answer the matching pass scored as `low` confidence (cross-framework
match plus library entry over 180 days old, or stale evidence) flips to
flag-for-review even though a candidate answer exists. The candidate is
included in the flag block so the analyst has a starting point.

### 6. Divergence from a recent prior response

If `prior_responses` contains an answer to a substantially-similar
question from the last 90 days, and that prior answer differs from the
current control library entry, flag both — the divergence itself is the
signal the analyst should investigate. (Did the policy change? Did the
prior questionnaire have a wrong answer? The skill cannot decide.)

## Soft escalation triggers (flag if combined)

Two or more of these together flag for review; one alone is allowed
through with a note in the analyst summary.

- Customer is in a regulated industry the firm has not served before
  (per `customer_context`).
- Customer's deal size is in the firm's top decile (per
  `customer_context`).
- Question is in a topic the firm has fewer than 3 prior-response
  examples for.
- Library entry's `last_reviewed` is between 90 and 180 days old.

The "combined" rule exists because individually these are weak signals,
but together they correlate with the questionnaires that get the most
follow-up scrutiny.

## Allowed-vendors precondition

The skill refuses to run unless the configured AI vendor is on the
firm's approved list. Replace this list with the firm's actual approved
vendors.

- `<vendor 1>` — approved for security-program work, DPA on file dated
  YYYY-MM-DD.
- `<vendor 2>` — approved for security-program work, DPA on file dated
  YYYY-MM-DD.

If the configured vendor is not on this list, the skill exits with an
error message naming the missing vendor. Do not bypass with a CLI flag;
the precondition exists because questionnaire content is firm-confidential
and customer-confidential simultaneously.

## Escalation block format

When a question is flagged, the skill emits the following block instead
of an answer:

```markdown
**Flagged for security review**
- **Question:** <verbatim question text>
- **Trigger:** <which rule above fired; if multiple, list them>
- **Candidate control:** <control ID if matching surfaced one, else "none">
- **Candidate answer the skill considered:** <text or "none">
- **Action:** Security analyst to draft. Do not improvise.
```

The analyst sees the block in the summary, can accept the candidate as
a starting point or rewrite from scratch, and signs off on every flagged
question before the questionnaire goes back.
