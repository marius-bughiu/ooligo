---
name: vendor-dd-questionnaire
description: Auto-fill an inbound security/compliance questionnaire (SIG, SIG-Lite, CAIQ, or a custom format) by mapping every question to the firm's pre-approved control library, citing the control ID and supporting evidence on each answer, and flagging novel or low-confidence questions for the security team. Use as a first-pass drafter before a security-team final review, never as the submission-of-record.
---

# Vendor DD questionnaire

## When to invoke

Invoke when a customer or prospect has sent an inbound vendor diligence
questionnaire — SIG, SIG-Lite, CAIQ, CAIQ-Lite, HECVAT, VSAQ, or a custom
spreadsheet-shaped questionnaire — and the GRC / security-program-manager
team wants a first-pass draft grounded in the firm's existing control
library before a security analyst reviews and signs off. Typical trigger:
a `.xlsx` lands in the security inbox tied to a deal in [HubSpot](/en/tools/hubspot/)
or [Salesforce](/en/tools/salesforce/), and the assigned analyst wants the
mechanical 70-80% of answers pre-populated so they can spend their time on
the questions that actually require judgment.

Do NOT invoke this skill for:

- **Final submission to the customer.** The skill drafts; a named security
  analyst reviews every answer and the deal owner signs off before the
  questionnaire goes back. Auto-fill plus auto-send is the failure mode this
  rule guards against.
- **Anything routed through a non-Tier-A AI vendor.** Questionnaire content
  often includes the customer's procurement metadata, internal control
  numbering, and (in custom formats) free-text that quotes the customer's
  own architecture. If the configured model is not on the firm's approved
  vendor list with a signed DPA covering security-program work, escalate to
  the security team instead of running.
- **Novel control frameworks the firm has not mapped.** If the questionnaire
  references a framework the control library does not cover (e.g. a
  sector-specific reg the firm has not yet been audited against — FedRAMP
  Moderate, IRAP, BSI C5), the skill will pattern-match incorrectly and
  produce confidently-wrong answers. Map the framework into the control
  library first, then run.
- **Questionnaires that are part of an active incident-response or audit
  finding.** Those go straight to the security team — they are not
  drafting exercises.
- **Anything where the customer has explicitly asked for human-written,
  non-AI-assisted responses.** Honor the request; don't run the skill.

## Inputs

- Required: `questionnaire` — path to the inbound `.xlsx` (most common),
  `.docx`, or pasted text. The skill preserves the original structure when
  the input is `.xlsx` so the customer receives the file in the format they
  sent.
- Required: `control_library` — path to the firm's mapped control library
  in `references/`. Defaults to `references/1-control-library-template.md`.
  Replace the template with the firm's actual mapped controls, indexed by
  framework (SOC 2 CC, ISO 27001 Annex A, NIST CSF, CIS, etc.) before first
  run.
- Required: `evidence_index` — path to the index of supporting evidence
  documents (SOC 2 report, ISO certificate, pen test summary, BCP, IR plan,
  privacy policy, sub-processor list). Each evidence document has an ID the
  control library cites; the skill emits the ID, never the file contents.
- Optional: `prior_responses` — directory of previously-completed
  questionnaires. The skill pattern-matches new questions against prior
  answers and reuses the answer when the question text and intent match
  (with attribution to the prior questionnaire ID, never silently).
- Optional: `customer_context` — free-text on the customer (industry,
  jurisdiction, deal stage). Used to bias toward more conservative answers
  when the customer is in a regulated industry or the deal is large.

## Reference files

Always read the following from `references/` before drafting. Without them,
every answer is a generic AI-flavored response disconnected from the firm's
actual control posture, and every flagged item lacks a clear escalation
path.

- `references/1-control-library-template.md` — the firm's mapped control
  library. One entry per control, indexed by framework, with the canonical
  answer, the supporting evidence ID, and the date the control was last
  audited. Replace the template with the firm's actual controls before
  first use.
- `references/2-answer-format-reference.md` — the literal answer formats
  expected per question type (Yes/No, Yes/No with description, descriptive,
  document upload, certification reference, N/A with justification).
  The skill emits answers in the format the questionnaire expects, not the
  format the model defaults to.
- `references/3-novel-question-escalation.md` — the rules that decide when
  a question flips from "skill answers with a control citation" to "skill
  flags for security review." Examples: questions that introduce a control
  framework not in the library, questions whose answer would commit the
  firm to a future change (forward-looking representations), questions
  about specific incidents.

## Method

Run the four sub-tasks in order. Do not parallelize: classification feeds
control matching, which feeds answer drafting, which feeds the review-flag
decision.

### 1. Question classification

For each row in the questionnaire, identify:

- **Response type expected** — Yes/No, Yes/No-with-description, free-text
  descriptive, document-upload (the customer wants the actual evidence
  doc), certification-reference (cite a cert and attestation date), or
  N/A-with-justification.
- **Topic** — access control, encryption-at-rest, encryption-in-transit,
  key management, BCP/DR, IR, sub-processor management, change management,
  vulnerability management, secure SDLC, privacy/DSR, etc.
- **Framework hint** — if the question text or column header references a
  specific framework section (`CC6.1`, `A.9.4.2`, `CCM IAM-09`), capture
  it. Framework-aware matching is more reliable than topic-only matching.

Why classification first, not "answer everything in one pass": question
type controls answer format, and topic + framework hint together drive
the control-library lookup. Skipping classification and letting the model
free-draft is the most common reason auto-fill produces inconsistent or
miscategorized answers.

### 2. Control-library matching

For each classified question, look up the matching control in
`references/1-control-library-template.md`. Match priority:

1. Exact framework section match (the question cites `CC6.1`, the
   library has an entry for `CC6.1`).
2. Topic + sub-topic match within the same framework.
3. Cross-framework topic match (e.g. SOC 2 CC6.1 maps to ISO 27001
   A.9.4.2 maps to CCM IAM-09 — the library notes the equivalences).
4. No match → flag as novel-question for escalation. Do not improvise.

Why control-library-first instead of letting the model improvise an
answer from documentation: the library entries have already been
reviewed by security and legal. Improvised answers reintroduce that
review burden on every run, defeat the time saving, and create
contractual-representation risk because every questionnaire answer is a
representation the firm makes to the customer.

### 3. Answer drafting with citations

For every matched question, emit the canonical answer from the library
in the format the question expects (per
`references/2-answer-format-reference.md`). Every answer carries:

- The control ID cited (e.g. `SOC2.CC6.1`).
- The supporting evidence ID (e.g. `EV-SOC2-2025`, `EV-PENTEST-2025-Q1`).
- The library entry's `last_reviewed` date.
- A confidence score: `high` (exact match, library entry under 90 days
  old), `medium` (cross-framework match or library entry 90-180 days
  old), `low` (cross-framework match plus library entry over 180 days
  old, or stale evidence).

Pattern-match against `prior_responses` only as a tie-breaker on
borderline matches; never let a prior answer override the current
control library. Prior answers from 18 months ago can be flatly wrong.

### 4. Review-flag decision

For every question meeting the rules in
`references/3-novel-question-escalation.md`, replace the drafted answer
with a "needs security review" block. The block contains: the question
text, the candidate answer the skill considered (so the analyst has a
starting point), the trigger that fired the escalation, and any
candidate control IDs the matching pass surfaced.

Also flag for review: any answer with `low` confidence, any
forward-looking commitment, any answer that touches a specific incident
or audit finding, and any question whose answer differs from the prior
response on a recent (under 90 days) questionnaire — the divergence
itself is a signal the analyst should look at it.

## Output format

Write the original `.xlsx` back with the answer cells populated, plus a
sibling markdown summary the analyst opens first. The summary's literal
format:

```markdown
# Questionnaire draft — <Customer name>

Questionnaire type: <SIG | SIG-Lite | CAIQ | HECVAT | custom>
Control library version: <control library last_reviewed date>
Total questions: <N>
  - Answered (high confidence): <count>
  - Answered (medium confidence): <count>
  - Answered (low confidence — review): <count>
  - Flagged for security review: <count>
  - Document-upload required: <count>

---

## Q4.2 — "Do you encrypt data at rest using AES-256 or stronger?"

**Response type:** Yes/No-with-description
**Topic:** encryption-at-rest
**Framework hint:** CCM EKM-03

**Drafted answer:**
> Yes. All customer data is encrypted at rest using AES-256-GCM via
> AWS KMS-managed keys. Key rotation is automatic on a 365-day cycle.

**Citation:** control SOC2.CC6.7 / ISO27001.A.10.1.1 / CCM EKM-03
**Evidence:** EV-SOC2-2025 §6.7, EV-KMS-CONFIG-2025-Q1
**Confidence:** high
**Library entry last reviewed:** 2026-02-14

---

## Q9.3 — "Describe your process for handling FedRAMP Moderate boundary changes."

**Flagged for security review**
- **Trigger:** Framework not in control library (FedRAMP Moderate not
  yet mapped).
- **Candidate control:** none — closest is `SOC2.CC8.1` (change
  management), but the framework-specific question requires a
  framework-specific answer.
- **Action:** Security analyst to draft. Do not improvise.

---
```

The `.xlsx` carries the same answers in the customer's original cell
layout, with a comment on each cell containing the control ID,
evidence ID, and confidence so the analyst can audit without flipping
back to the markdown summary.

## Watch-outs

- **Stale control library produces confidently-wrong answers.** A SOC 2
  Type II report from 2024 cited as evidence in 2026 will be rejected by
  any sophisticated customer. Guard: every output's summary header writes
  the control library's `last_reviewed` date and every cited evidence
  document's effective date. The analyst rejects any draft where the
  library is older than 90 days or any cited evidence is past its
  attestation window, and refreshes the library before re-running.
- **Answer-improvisation when the library does not match.** A model under
  pressure to "fill the cell" will free-draft an answer that sounds
  plausible. Guard: the matching pass emits explicit `no match → flag`
  rather than degrading gracefully. The skill refuses to write a cell
  without a control ID; cells without a citation surface in the summary
  as flagged-for-review, never as drafted answers.
- **Certification expiration.** A SOC 2 cited as current may have
  expired between the last library refresh and today. Guard: the
  evidence index carries an `effective_through` date per evidence
  document. If today is past `effective_through`, the skill drops the
  evidence cite and downgrades the answer to `low` confidence with a
  note that the cert is in renewal. The analyst chases the renewed cert
  before the questionnaire goes back.
- **Forward-looking commitments treated as facts.** "Will you support
  customer-managed keys by Q4?" is a roadmap question, not a control
  question. Drafted as Yes/No, it becomes a contractual representation.
  Guard: `references/3-novel-question-escalation.md` lists the linguistic
  patterns ("will you", "do you plan to", "by what date") that force a
  flag-for-review regardless of confidence.
- **Pattern-match drift from prior responses.** Last year's response
  said "365-day key rotation"; this year's policy says 90 days. Reusing
  the prior answer creates a contractual misrepresentation. Guard:
  prior-response matching is a tie-breaker only, never an override.
  When a prior answer differs from the current library entry, the skill
  flags the divergence in the summary so the analyst can see it.
