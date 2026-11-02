---
name: contract-redline
description: Prepare an internal, clause-level review against a supplied playbook. Use the fictional Word example to verify a tracked proposal and a decision held for counsel.
---

# Contract redline review

## Inputs and responsibility

Ask for the original draft, the applicable version of a counsel-approved playbook, the selected fallback text and the named reviewer. Record the agreement version and review perspective. Work on a copy. The three files in `references/` contain training positions for a fictional pilot. Replace them before considering a real agreement.

Have the matter owner confirm that the account, client, permissions, retention and document handling are approved for this specific material before using an assistant. These instructions cannot inspect account settings, enforce confidentiality or authorize disclosure. Keep the original, revisions and review notes within the approved location.

## Decide what goes in the review copy

1. Inventory the source. Record headings, clause numbers, cross-references, definitions, tables, exhibits, existing comments and revisions. If the available document editor cannot preserve them, stop at a text-only review note. Do not label that note a tracked DOCX.
2. Map each clause to an approved rule ID and cite the exact source words. Keep wording when the rule accepts it. When the rule permits a substitution, use the approved text and identify the smallest edit.
3. Hold the original text for counsel when the rule is absent, conflicting, expired or unclear, an exhibit is missing, or defined terms and dependencies would change. Identify the decision needed. Do not generate a fallback for an uncovered clause.
4. With an approved Word-compatible editor, save a separate review copy. Add real tracked revisions and an anchored comment with the rule and rationale. An assistant without that editor delivers the review notes for manual entry. No connector, universal DOCX writer, automatic policy enforcement or sending action is included.
5. Reconcile the review copy against the original. On separate disposable copies, reject all revisions and compare with the source, then accept them and confirm each planned substitution. Inspect comments, tables, formatting, definitions and exhibits. Preserve any existing revisions separately from the new proposal.

## Fixture and expected findings

Open `examples/incoming.docx` and `examples/review-copy.docx`. The review period changes from “three” to “ten” with a native deletion and insertion. One comment cites `REVIEW-01`. Renewal receives the `HOLD-01` comment and retains its wording. The report table and clause one remain intact. See `examples/review-notes.md` for all three decisions.

Run `python3 verify_sample.py` from the extracted bundle. The script reads only the provided pair. It checks accept/reject projections, comment anchors and preservation of the other package content. It does not generate a redline for an arbitrary agreement. The sample requires no model, account or network.

## Handoff

For each clause, include the source quotation, rule/version, proposed change or hold reason and named decision owner. Keep open questions and multiple possible positions visible. Counsel checks the legal and commercial implications, existing markup and negotiation history. Obtain the required approvals before accepting changes or sharing any copy, including its comments and metadata.
