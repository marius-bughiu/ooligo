# Privilege flag rules (firm template)

The triage skill flags requests that likely overlap with privileged material. The rules are conservative — over-flag rather than under-flag, because missed privilege is harder to claw back than over-flagged scope is to negotiate.

## Privilege types covered

### Attorney-client privilege

Triggers a flag when a request covers any of:

- Communications with named in-house lawyers, by name OR by role ("legal department," "in-house counsel," "GC's office").
- Communications with named outside law firms, by name OR by role ("outside counsel," "litigation counsel," "regulatory counsel").
- "All communications" or "all email" requests where any of the firm's lawyers may be in the corpus (almost always true).
- "Legal advice on X" or "legal opinions regarding Y" requests.

Recommended response posture: privilege log preparation; assertion under FRE 502 (federal) or state equivalent.

### Work-product doctrine (Hickman v. Taylor / FRCP 26(b)(3))

Triggers a flag when a request covers any of:

- "Litigation strategy memos" or "case analysis."
- "Drafts" of pleadings, motions, briefs.
- Materials prepared "in anticipation of litigation" — the test is whether the document was prepared because of the prospect of litigation, not in the ordinary course of business.
- Investigations conducted by counsel (internal investigations).
- Counsel's notes from meetings or interviews.

Recommended response posture: Rule 26(b)(3) objection; if non-opinion work product, may produce on substantial-need showing but withhold opinion work product.

### Joint-defense / common-interest privilege

Triggers a flag when:

- The firm has joint-defense agreements covering the matter (counsel maintains the JDA registry).
- Communications cross between the firm and joint-defense counterparts about shared legal strategy.

Recommended response posture: assert with JDA cited; may need to redact or withhold depending on scope.

### Settlement communications (FRE 408)

Triggers a flag when a request covers:

- "Settlement discussions" or "negotiations to resolve."
- Communications with mediators or settlement counsel.
- Communications labeled "FRE 408" or "settlement-confidential."

Recommended response posture: object under FRE 408 (admissibility) and any applicable confidentiality agreement.

### Self-evaluation / critical analysis privilege

Limited recognition. Triggers a flag in jurisdictions that recognize it for:

- Internal audit findings (limited recognition under HHS regs for healthcare).
- Peer-review of medical care (state-by-state recognition).
- Self-critical environmental audits (limited recognition in some states).

Recommended response posture: counsel to research jurisdictional recognition before asserting.

### Other firm-specific privileges

Add per the firm's industry and jurisdiction:

- **Clergy** — for religious institutions.
- **Doctor-patient** — for healthcare providers (HIPAA also implicates).
- **Academic peer review** — for universities.
- **Trade secret** — protection from disclosure (not strictly privilege but commonly grouped).

## Flag severity

Each flag carries a severity:

- **High** — privilege is clearly implicated; assertion is the default.
- **Medium** — privilege may be implicated; counsel reviews scope.
- **Low** — privilege exposure is theoretical; counsel notes for awareness.

The triage report's privilege-flag section orders by severity.

## Per-flag guard language

Every flag in the triage output pairs with a recommended action. Sample guard language:

### Attorney-client (high)

> Request {N} covers "{quoted phrase}" which captures attorney-client communications. Recommend privilege log preparation per the firm's standard practice and assertion under FRE 502. Privilege log entries should include date, sender, recipient, subject (general), basis for privilege.

### Work-product (high)

> Request {N} covers "{quoted phrase}" which is core work product (litigation strategy / case analysis prepared because of prospect of litigation). Recommend Rule 26(b)(3) objection. Opinion work product (counsel's mental impressions) should be withheld absolutely; non-opinion work product may be produced on substantial-need showing.

### Joint-defense (medium)

> Request {N} may overlap with material covered by the joint-defense agreement with {counterpart}. Counsel to review JDA scope before producing or asserting.

### Settlement (medium)

> Request {N} covers settlement discussions in the {matter} dispute. Recommend objection under FRE 408 and any confidentiality terms in the settlement-discussion agreement.

## What the skill does NOT do

- Does NOT decide which privileges to assert (that's counsel's call).
- Does NOT prepare the privilege log (that's a separate workflow / paralegal task).
- Does NOT redact documents (that happens during production prep).
- Does NOT advise on waiver risk (counsel evaluates whether prior disclosures waived privilege).

The skill's role is to flag — comprehensively, conservatively, with paired guards — so counsel doesn't miss exposure during triage.

## Updating these rules

When the firm encounters a new privilege issue, or when a court ruling shifts the landscape:

1. Add the new trigger to the relevant section.
2. Document the citation (case law, statute, ethics opinion).
3. Set severity per counsel's assessment.
4. Bump the file's version line. Audit-log captures the SHA per triage.
