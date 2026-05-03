# Outside-counsel billing guidelines template

The bill auditor reads guidelines in this shape. Copy this file to `firm-billing-guidelines.md` (or wherever your skill config points), fill in the firm-specific values, and version it in git.

The guidelines are the comparison anchor. Without them the skill has nothing to audit against. Most law departments revise these annually; the skill captures the file's SHA per audit so changes are visible.

## Section IDs

Every guideline carries an ID (`§1.1`, `§3.2.a`, etc.). The skill's findings cite the ID. If you renumber, the audit log's prior findings still reference the old IDs — keep a renumbering mapping or treat renumbering as a guideline-version bump.

## §1 — Engagement scope and pre-approval

- **§1.1** All matters require a written engagement letter naming the matter, the timekeepers, the rate sheet, the budget, and any flat-fee components.
- **§1.2** Work outside the named scope requires written pre-approval from the assigned in-house attorney.
- **§1.3** Budget overruns >10% require written notice within 5 business days; overruns >25% require pre-approval before further work.

## §2 — Timekeeper composition

- **§2.1** Use of new timekeepers (not on the engagement letter's rate sheet) requires written approval before time is billed.
- **§2.2** The rate sheet is fixed for the engagement's duration unless an annual rate adjustment is provided in writing 60 days in advance.
- **§2.3** Rate variance from the rate sheet on any line is a violation regardless of intent.

## §3 — Time entry detail

- **§3.1** Every time entry shall name (a) the task verb, (b) the specific deliverable or document, (c) the issue or matter focus.
  - *Example pass:* "Drafted §4 (Indemnification) of MSA between Acme and BetaCo, focused on caps and carve-outs."
  - *Example fail:* "Worked on contract."
- **§3.2.a** No single time entry shall combine more than one distinct task.
  - Block-billing definition: a narrative containing more than 2 distinct task verbs (drafted, reviewed, called, attended, researched, etc.).
- **§3.2.b** Minimum increment: 0.1 hour. No 0.05h or smaller entries; no rounded-up entries (e.g. 0.5h for what was actually 0.2h work).
- **§3.3** No "review" entry without naming what was reviewed and the outcome of the review.

## §4 — Staffing ratios

- **§4.1** Document review shall be staffed at associate level or below. Partner time on document review requires written justification.
- **§4.2** Legal research shall be staffed at associate level or below. Partner time on research requires written justification (novel issue, conflict).
- **§4.3** Deposition summaries shall be staffed at paralegal or associate level. Partner / senior counsel time only when the substance requires.
- **§4.4** Client conferences shall not have more than 2 outside-firm timekeepers attending unless pre-approved.
- **§4.5** Internal outside-firm conferences shall not bill more than 2 outside timekeepers unless the conference involves substantive case strategy and is documented as such.

## §5 — Expenses

- **§5.1** Expenses shall be billed at cost. No markup on photocopying, courier, transcript fees, computer research (Westlaw / Lexis), or travel.
- **§5.2** Travel: economy class for flights under 6 hours; business class permitted for transoceanic. Hotel at standard corporate rate, no luxury class without approval.
- **§5.3** Meals: $50 per person per day cap unless client-facing meal with documented rationale.
- **§5.4** No charge for in-firm administrative time (secretarial, file management, billing-related work).
- **§5.5** Computer research: at-cost only. No proration of monthly subscription fees onto matters.

## §6 — Premium time

- **§6.1** Standard hourly rates apply Monday-Friday 7am-9pm in the timekeeper's local time zone.
- **§6.2** Off-hours premium (1.25× standard) requires explicit pre-approval per matter.
- **§6.3** Off-hours premium cap: $5,000 per matter per month, absent written waiver.

## §7 — Discounts and adjustments

- **§7.1** A 10% timely-payment discount applies if the firm pays within 30 days of invoice receipt.
- **§7.2** Disputed lines remain disputed until resolved; the firm may pay the undisputed portion within terms without losing the discount on that portion.

## §8 — LEDES and submission format

- **§8.1** All invoices shall be submitted in LEDES 1998BI or 2000 format unless the firm has approved a paper or PDF alternative in writing.
- **§8.2** Each line shall include `task_code` (UTBMS) and `activity_code` (UTBMS) values from the engagement letter's permitted list.
- **§8.3** Invoices shall be submitted within 30 days of month-end. Late invoices may be rejected.

## How the skill uses each section

- **Deterministic checks**: §3.2.a (block-billing verb count), §3.2.b (minimum increment), §4.1-§4.4 (staffing ratios when timekeeper roles are tagged), §5.1 (expense double-entry detection), §6.3 (premium-time monthly cap), §2.3 (rate variance).
- **LLM evaluation**: §3.1 (time-entry detail quality — pass/fail per narrative), §3.3 (review-entry quality), §5.4 (administrative-time detection in narratives), §7 / §8 (compliance posture).

## Customizing the template

When you adapt this template:

1. Add or remove sections to match the firm's actual guidelines. Don't keep template language that doesn't reflect the firm's policy.
2. Renumber IDs only when necessary; cross-reference old IDs in the changelog so audit-log entries stay interpretable.
3. Document the engagement-letter override path — most law departments allow per-matter exceptions to specific sections.
