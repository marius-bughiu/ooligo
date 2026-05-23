# NDA Clause Redline — Prompt Pack for Claude

Twelve paired prompts for redlining the most-negotiated NDA clauses. Each pair covers the same clause from two angles: (A) redline the counterparty's draft against your firm's position, and (B) draft a counter-position when the counterparty pushes back on your redline. Paste directly into a Claude project loaded with your firm's NDA playbook and the counterparty's draft. Edit before sending — these are drafts, not final positions. Consult counsel on any clause before committing to a position.

## How to use this pack

1. Create a Claude project named `nda-<counterparty>-<matter-id>`.
2. Add as project knowledge: your firm's NDA playbook (preferred / acceptable / walk-away per clause), your standard NDA template, and the counterparty's draft.
3. Save each prompt below as a saved prompt within the project.
4. For a first-pass review, run the A-prompts (initial redline) on the counterparty's draft.
5. After the counterparty responds to your redlines, run the B-prompts (counter-position) for each clause where they pushed back.
6. Edit every output before sending. The contracts manager and/or counsel owns voice and judgment.

## NDA playbook input shape

The pack anchors against a playbook with this structure (one entry per clause):

```yaml
clause: confidentiality_scope
preferred:
  position: "Mutual; covers all non-public information disclosed in connection with the Purpose; excludes: public domain, independently developed, received from third party without restriction."
  rationale: "Mutual protection is standard at our scale; standard exclusions are non-negotiable."
acceptable:
  position: "Mutual with a 'residuals' carveout for general skills and knowledge retained in unaided memory."
  rationale: "Residuals clauses are common in tech; acceptable if narrowly scoped to unaided memory."
walk_away:
  position: "One-way NDA that protects only the counterparty, OR scope so broad it covers information that is publicly known."
  rationale: "One-way terms create untenable asymmetry when we are sharing technical information."
notes: "Counterparties often open with one-way NDA on their template; first redline is always to mutual."
```

---

# Clause 1 — Confidentiality scope

## 1A. Redline counterparty's confidentiality scope

```
Role: You are a contracts attorney redlining an NDA for the receiving firm.

Context: The firm's NDA playbook is loaded as project knowledge. The
counterparty's NDA draft is loaded as project knowledge.

Input: The confidentiality scope clause (or the full NDA draft — the
model should locate the scope clause).

Task: Evaluate whether the counterparty's confidentiality scope matches
the firm's preferred, acceptable, or walk-away range. If the scope is
not at preferred, produce the specific replacement language.

For the clause, output:
  - Counterparty's current position (1-2 sentence summary)
  - Playbook tier (preferred / acceptable / walk-away / outside-playbook)
  - Recommended redline language (the exact replacement text, not a
    paraphrase)
  - Rationale grounded in the playbook

Things to avoid:
  - Asserting that a one-way NDA is "standard" — standard varies by
    context; flag it as a redline item if the playbook says mutual.
  - Recommending acceptance of walk-away positions without flagging for
    counsel.
  - Adding carveouts not in the playbook (e.g. inventing a trade-secret
    carveout the playbook doesn't mention).

Output format: Markdown with three sections: Current position /
Playbook tier / Recommended redline.
```

## 1B. Counter-position on confidentiality scope

```
Role: You are a contracts attorney drafting a counter-position after the
counterparty pushed back on the firm's confidentiality scope redline.

Context: Playbook in project knowledge. The firm's prior redline and the
counterparty's response are in project knowledge.

Input: The counterparty's specific objection to the firm's scope redline.

Task: Draft the firm's counter-position. Choose from:
  - Hold at preferred (if the counterparty's objection is unsupported)
  - Move to acceptable (if the objection has merit and stays in range)
  - Trade for a concession elsewhere (if the move needs leverage)

For the counter-position, output:
  - The specific replacement language the firm is now offering
  - Rationale for the move (or for holding firm)
  - The trade, if applicable

Things to avoid:
  - Capitulating to a one-way structure without naming what was traded.
  - Proposing language not grounded in the playbook.
  - Generic "we accept your changes" without specifying the new text.

Output format: Markdown.
```

---

# Clause 2 — Definition of Confidential Information

## 2A. Redline the definition of Confidential Information

```
Role: You are a contracts attorney reviewing an NDA's definition of
Confidential Information.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The definition of Confidential Information as drafted by the
counterparty.

Task: Identify whether the definition is: (a) too narrow — missing
categories the firm needs to protect (technical information, business
plans, customer lists, pricing data); (b) appropriately scoped; or
(c) overbroad — potentially capturing information the firm must be free
to use (public domain, independently developed).

For the definition, output:
  - Assessment (too narrow / appropriate / overbroad)
  - Specific gaps or overbreadth identified
  - Recommended replacement or amendment language

Things to avoid:
  - Recommending acceptance of definitions that fail to cover the firm's
    primary disclosures for this matter (ask counsel what is being
    disclosed if not in the playbook).
  - Recommending definitions so broad they cover information that is
    clearly public or independently developed.
  - Omitting the written/oral disclosure dichotomy (oral disclosures
    must be confirmed in writing within X days, if the playbook requires
    that).

Output format: Markdown with three labeled sections.
```

## 2B. Counter-position on the definition

```
Role: You are a contracts attorney responding to the counterparty's
rejection of the firm's definition redline.

Context: Playbook, firm's redline, and counterparty's response in
project knowledge.

Input: The counterparty's specific objection to the definition redline.

Task: Draft the counter-position on the definition. If the counterparty
is objecting to inclusion of oral disclosures, propose the 10-day
written-confirmation fallback. If the counterparty is objecting to a
specific category, assess whether that category is in the playbook's
non-negotiable list; if so, hold; if not, consider accepting the carveout.

Output: Specific amendment language + rationale.

Things to avoid:
  - Conceding categories the playbook marks as required.
  - Inventing confirmation timelines not in the playbook (if the playbook
    says 10 days, propose 10 days — not 30).

Output format: Markdown.
```

---

# Clause 3 — Exclusions from Confidential Information

## 3A. Redline standard exclusions

```
Role: You are a contracts attorney reviewing the exclusions from the
Confidential Information definition.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The exclusions clause or the exclusions embedded in the definition.

Task: Confirm that all four standard exclusions are present and properly
scoped: (1) already public or becomes public through no fault of the
receiving party; (2) already known to the receiving party at time of
disclosure; (3) independently developed without use of the CI; (4)
received from a third party without restriction.

For each exclusion:
  - Present and properly scoped: note "adequate"
  - Missing: recommend insertion with the standard language
  - Overbroad or misstated: recommend specific amendment

Things to avoid:
  - Recommending deletion of any of the four standard exclusions — these
    are market-standard receiving-party protections; removing them is a
    walk-away item.
  - Recommending acceptance of an exclusion that includes "general
    skills and knowledge" without the firm's playbook explicitly
    accepting residuals.

Output format: Checklist with one row per exclusion.
```

## 3B. Counter-position on exclusions

```
Role: You are a contracts attorney responding to the counterparty's
pushback on the exclusions redline.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty wants to narrow the exclusions (e.g. remove
independent development), hold firm — these are standard receiving-party
protections. If the counterparty wants to add an exclusion (e.g.
residuals), check the playbook: if the playbook marks residuals as
acceptable with narrow scope, counter with the narrow version.

Output: Position + language + rationale.

Things to avoid:
  - Agreeing to remove any of the four standard exclusions.
  - Agreeing to a residuals clause scoped to "anything retained in the
    mind" — the firm's acceptable position (if in the playbook) requires
    "unaided memory" and excludes notes or derivative works.

Output format: Markdown.
```

---

# Clause 4 — Permitted disclosures

## 4A. Redline permitted disclosures

```
Role: You are a contracts attorney reviewing the NDA's permitted
disclosures provision.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The permitted disclosures clause (often titled "Permitted
Disclosures" or embedded in the obligations clause as exceptions).

Task: Confirm the following permitted categories are present and scoped
correctly: (1) employees, officers, directors with a need to know;
(2) professional advisors (attorneys, accountants, financial advisors)
bound by equivalent confidentiality; (3) disclosures required by law,
court order, or regulatory request — with advance written notice to the
disclosing party and cooperation on protective order where permitted.

For any missing or misstated permitted category:
  - Recommend insertion or amendment with specific language

Things to avoid:
  - Recommending permitted disclosure to "affiliates" without a need-to-
    know requirement — overbroad affiliate disclosures are a common
    counterparty overreach.
  - Omitting the advance-notice requirement for compelled disclosures —
    this is the firm's primary protection against surprise government
    requests surfacing CI without notice.

Output format: Checklist with one row per category.
```

## 4B. Counter-position on permitted disclosures

```
Role: You are a contracts attorney responding to the counterparty's
pushback on permitted disclosures.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty wants to add affiliates without need-to-know,
counter with "affiliates with a need to know, bound by equivalent
confidentiality, listed in Schedule A or disclosed in writing prior to
disclosure." If the counterparty objects to the advance-notice requirement
for compelled disclosure, hold firm — this is a non-negotiable in the
playbook.

Output: Position + language + rationale.

Things to avoid:
  - Accepting affiliate disclosure without the need-to-know constraint.
  - Dropping advance notice on compelled disclosure without counsel
    direction.

Output format: Markdown.
```

---

# Clause 5 — Return or destruction of Confidential Information

## 5A. Redline return/destruction clause

```
Role: You are a contracts attorney reviewing the return or destruction
obligation.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The return or destruction clause.

Task: Confirm: (1) the obligation applies on demand by the disclosing
party OR on expiration/termination of the NDA; (2) the receiving party
must certify destruction in writing within a specified period (playbook
standard: 30 days); (3) backup systems and legal-hold exceptions are
addressed — retained copies must remain subject to the NDA.

For any gap:
  - Recommend amendment with specific language

Things to avoid:
  - Accepting return-only without a destruction alternative — physical
    return of electronic files is practically impossible.
  - Accepting unlimited "we keep backups indefinitely" exceptions without
    the obligation continuing on retained copies.

Output format: Checklist with one row per sub-issue.
```

## 5B. Counter-position on return/destruction

```
Role: You are a contracts attorney responding to the counterparty's
pushback on return or destruction.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty objects to the 30-day certification window,
check the playbook — if acceptable range is 30-60 days, counter at 45.
If the counterparty wants to keep backup copies indefinitely without
ongoing obligation, hold firm on the ongoing obligation language.

Output: Position + language + rationale.

Things to avoid:
  - Agreeing to no certification requirement — no certification means no
    enforceable destruction obligation.
  - Accepting retention without ongoing obligation for retained copies.

Output format: Markdown.
```

---

# Clause 6 — Residuals

## 6A. Evaluate and redline residuals clause

```
Role: You are a contracts attorney evaluating a residuals clause in an
NDA.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The residuals clause, if present. If no residuals clause is
present, note its absence and skip to the output format.

Task: A residuals clause allows the receiving party to use general skills,
experience, and knowledge retained in unaided memory without restriction.
Evaluate:
  - Is the residuals clause present?
  - Is it narrowly scoped to "unaided memory" (acceptable in the
    playbook)?
  - Or is it broad — covering "intangible residual information" or
    "general skills and knowledge" without the unaided-memory limitation
    (walk-away in the playbook)?

If present and overbroad: redline to unaided-memory scope.
If present and properly scoped: note "adequate per playbook."
If absent: note "not present — consistent with playbook default position."

Things to avoid:
  - Recommending insertion of a residuals clause if the playbook's
    default position is not to include one (check the playbook; inserting
    a residuals clause the firm's playbook doesn't include is a one-sided
    favor to the counterparty).
  - Accepting "intangible residual information retained in memory"
    language — this is materially broader than "unaided memory" and has
    been litigated in trade-secret cases. Consult counsel if in doubt.

Output format: Markdown.
```

## 6B. Counter-position on residuals

```
Role: You are a contracts attorney responding to the counterparty's
pushback on the residuals redline.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty insists on residuals and the playbook marks
narrow residuals as acceptable, counter with: "retained in the unaided
memory of persons who have had access to Confidential Information, not
through any deliberate memorization effort, and not including the
specific content of written documents, drawings, or formulas." If the
playbook marks any residuals as a walk-away, escalate to counsel.

Output: Position + language + rationale or escalation flag.

Things to avoid:
  - Accepting "deliberate memorization" as a concept the counterparty can
    define — the language should be affirmative (what is retained) not
    exclusionary (what was not deliberate).

Output format: Markdown.
```

---

# Clause 7 — Non-solicitation

## 7A. Redline non-solicitation clause

```
Role: You are a contracts attorney reviewing a non-solicitation clause
in an NDA.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The non-solicitation clause, if present.

Task: A non-solicitation clause is often inserted into an NDA but is a
separate obligation from confidentiality — it restricts recruitment of
the disclosing party's employees. Evaluate:
  - Is a non-solicitation clause present? Is it mutual?
  - What is the duration? (Playbook range: 12-24 months from last
    disclosure or NDA termination)
  - Does it cover only active solicitation, or does it cover passive
    acceptance of applications too? (Passive receipt of applications
    should be excluded.)

If the clause is asymmetric (only the firm agrees not to solicit, or the
duration is longer than the playbook range), redline to mutual and to
playbook duration.

Note: Non-solicitation enforceability is jurisdiction-specific.
The NDA's governing law clause affects the enforceability of this
restriction. Consult counsel on the specific jurisdiction before
committing to a position.

Things to avoid:
  - Accepting one-way non-solicitation when the playbook says mutual.
  - Accepting blanket prohibitions on hiring anyone who "responds to a
    general advertisement" — this is unenforceable in most jurisdictions
    and exposes the firm to disputes over passive hires.

Output format: Markdown.
```

## 7B. Counter-position on non-solicitation

```
Role: You are a contracts attorney responding to the counterparty's
pushback on non-solicitation.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty objects to mutuality, hold unless the playbook
has an asymmetric acceptable tier. If the counterparty objects to the
exclusion of passive recruitment, counter with: "excluding any person
who responds to a general advertisement or public posting not targeted at
the disclosing party's employees." Note the jurisdiction sensitivity for
counsel.

Output: Position + language + rationale + counsel-escalation flag if
jurisdiction is contested.

Things to avoid:
  - Agreeing to bar passive recruitment of people who apply based on
    public job postings.
  - Agreeing to a duration beyond 24 months without playbook support.

Output format: Markdown.
```

---

# Clause 8 — IP ownership

## 8A. Redline IP ownership in an NDA

```
Role: You are a contracts attorney reviewing IP-ownership language in an
NDA.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: Any clause in the NDA addressing intellectual property, work
product, or ownership of derivatives.

Task: NDAs should not assign IP rights — they should only govern what
can be disclosed and kept confidential. Evaluate:
  - Does the NDA contain any IP-assignment language? (e.g. "any
    improvements or derivatives based on the Confidential Information
    shall belong to the Disclosing Party")
  - Does it contain any work-for-hire language?
  - Does it contain a license grant beyond what is needed to evaluate
    the Purpose?

Any IP assignment in an NDA is out of scope — assignment belongs in a
separate agreement. Redline out; replace with: "Nothing in this Agreement
grants either party any right, title, or interest in the other party's
intellectual property. Evaluation of the Confidential Information under
this Agreement does not create any license or ownership right."

Things to avoid:
  - Accepting IP assignment as a "minor" NDA clause — it is not; it
    transfers rights permanently and belongs in a separate negotiated
    instrument. Consult counsel if the counterparty insists.
  - Accepting a license grant broader than "solely for the Purpose."

Output format: Markdown.
```

## 8B. Counter-position on IP in an NDA

```
Role: You are a contracts attorney responding to the counterparty's
insistence on IP-ownership language in an NDA.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty insists on derivative-works ownership language,
escalate to counsel — this is outside the scope of what the playbook
authorizes the contracts manager to negotiate in an NDA. Provide the
escalation flag language. If the counterparty is objecting to the
"no-license" clause (claiming it's too restrictive for the evaluation),
counter with a limited evaluation license: "a limited, non-exclusive,
non-transferable license to use the Confidential Information solely for
the Purpose and solely during the Term of this Agreement."

Output: Position + language + escalation flag if IP assignment is at
issue.

Things to avoid:
  - Granting any rights beyond the evaluation license.
  - Accepting "work made for hire" language in an NDA under any
    circumstances.

Output format: Markdown.
```

---

# Clause 9 — Governing law

## 9A. Redline governing law and venue

```
Role: You are a contracts attorney reviewing the governing law and venue
clause.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The governing law and/or dispute resolution clause.

Task: Confirm: (1) the governing law is the firm's preferred jurisdiction
per the playbook; (2) venue is in the firm's preferred courts; (3) the
clause specifies the applicable conflicts-of-law rule (most commonly:
"without regard to its conflict of laws principles").

If the counterparty proposes a different jurisdiction:
  - Assess the delta (different US state vs. foreign jurisdiction vs.
    arbitration vs. litigation)
  - Recommend the playbook position with specific language

Note: Governing-law choice in an NDA has downstream enforceability
implications for the non-solicitation clause, residuals, and injunctive
relief. Consult counsel before accepting a jurisdiction materially
different from the playbook's preferred.

Things to avoid:
  - Accepting foreign governing law without flagging it for counsel —
    enforcing NDA terms in non-US courts adds material cost and
    uncertainty.
  - Accepting arbitration for NDA disputes without counsel direction —
    arbitration eliminates injunctive-relief options in some
    jurisdictions.

Output format: Markdown.
```

## 9B. Counter-position on governing law

```
Role: You are a contracts attorney responding to the counterparty's
pushback on governing law.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty is proposing a different US state, assess
whether it's within the playbook's acceptable range. If the counterparty
is proposing foreign law or arbitration, escalate to counsel with a note
on the injunctive-relief implications.

Output: Position + language + counsel-escalation flag if jurisdiction is
a non-US or arbitration clause.

Things to avoid:
  - Agreeing to arbitration without counsel sign-off on the injunctive-
    relief carveout — most NDA disputes resolve via temporary restraining
    order, which requires court access.

Output format: Markdown.
```

---

# Clause 10 — Injunctive relief

## 10A. Redline injunctive relief provision

```
Role: You are a contracts attorney reviewing the injunctive relief clause
in an NDA.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The injunctive relief or equitable remedies clause.

Task: Confirm: (1) the clause acknowledges that breach of the NDA would
cause irreparable harm for which monetary damages are inadequate; (2) the
clause provides that either party may seek injunctive or equitable relief
without posting bond and without proving actual damages; (3) the clause
is mutual.

If any element is missing or is one-way, redline to the playbook
language.

Note: Without this clause, a party seeking a temporary restraining order
must argue irreparable harm at the hearing — which is possible but adds
cost and uncertainty. Consult counsel on the jurisdiction-specific
requirements for injunctive relief in NDA matters.

Things to avoid:
  - Accepting one-way injunctive relief (only the disclosing party can
    seek it) — the firm may need this protection as a receiving party
    whose own CI is at risk.
  - Accepting language requiring proof of actual damages as a
    prerequisite for injunctive relief — that defeats the purpose.

Output format: Markdown.
```

## 10B. Counter-position on injunctive relief

```
Role: You are a contracts attorney responding to the counterparty's
pushback on injunctive relief.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty objects to the no-bond provision, check the
playbook — if bond is acceptable, counter with a nominal bond amount
(e.g. $1,000). If the counterparty objects to mutual injunctive relief,
hold firm — this is non-negotiable in the playbook.

Output: Position + language + rationale.

Things to avoid:
  - Dropping the irreparable-harm acknowledgment — this acknowledgment
    significantly reduces the evidentiary burden in emergency proceedings.

Output format: Markdown.
```

---

# Clause 11 — Term of the NDA

## 11A. Redline NDA term

```
Role: You are a contracts attorney reviewing the term of the NDA
(the length of time the NDA itself is in force, separate from the
survival period for confidentiality obligations).

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The term clause.

Task: Identify: (1) the NDA term (how long the agreement is active);
(2) the termination mechanism (expiry, notice, or mutual written
agreement); (3) whether the NDA has an automatic renewal.

Playbook typically specifies: 2-3 years for standard commercial NDAs;
no auto-renewal without mutual written confirmation. If the counterparty
proposes a materially shorter term (under 12 months) or an indefinite
term without a cap, redline to playbook range.

Things to avoid:
  - Accepting an indefinite NDA term (no expiry) — even if confidentiality
    obligations survive termination, the NDA itself should have a defined
    life so obligations can be cleaned up.
  - Accepting an auto-renewal without notice rights — the firm needs
    control over when the relationship ends.

Output format: Markdown.
```

## 11B. Counter-position on NDA term

```
Role: You are a contracts attorney responding to the counterparty's
pushback on the NDA term.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty wants a shorter term, assess why — if this is
a project-specific NDA, a 12-month term may be acceptable. If the
counterparty wants indefinite term, counter with 5 years and a review
mechanism. If they want auto-renewal, counter with auto-renewal plus 60
days' notice of non-renewal.

Output: Position + language + rationale.

Things to avoid:
  - Agreeing to indefinite term as the default.

Output format: Markdown.
```

---

# Clause 12 — Survival of confidentiality obligations

## 12A. Redline survival period

```
Role: You are a contracts attorney reviewing the survival of
confidentiality obligations after NDA termination.

Context: Firm's NDA playbook in project knowledge. Counterparty's draft
in project knowledge.

Input: The survival clause or the survival language embedded in the
confidentiality obligation.

Task: Identify the survival period (how long confidentiality obligations
continue after the NDA expires or terminates). Playbook standard:
  - Trade secrets: in perpetuity (or for the life of the trade secret)
  - Other CI: 2-5 years post-termination

If the survival period is shorter than the playbook minimum, redline.
If trade-secret CI is included in the scope and the survival period is
finite for all CI, redline to add "provided that obligations with respect
to Trade Secrets shall continue for so long as such information
constitutes a trade secret under applicable law."

Things to avoid:
  - Accepting a survival period shorter than 2 years for any CI — most
    NDA litigation arises 12-24 months post-disclosure.
  - Accepting a survival clause that makes trade-secret obligations
    expire when commercial CI expires — trade-secret obligations should
    persist independently.

Output format: Markdown.
```

## 12B. Counter-position on survival

```
Role: You are a contracts attorney responding to the counterparty's
pushback on the survival period.

Context: Playbook, firm's redline, counterparty's response in project
knowledge.

Input: The counterparty's specific objection.

Task: If the counterparty objects to the trade-secret carveout, hold
firm — trade-secret status under the Defend Trade Secrets Act (US) is
determined by the nature of the information, not by the NDA's expiry.
Consult counsel if the counterparty insists on a finite trade-secret
survival period. If the counterparty objects to the general CI period,
counter at the midpoint of the playbook range.

Output: Position + language + counsel-escalation flag if trade-secret
survival is disputed.

Things to avoid:
  - Agreeing to a finite survival period for trade secrets without
    counsel direction.

Output format: Markdown.
```
