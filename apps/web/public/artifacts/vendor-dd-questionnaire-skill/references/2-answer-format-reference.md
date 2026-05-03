# Answer format reference — TEMPLATE

> The vendor-dd-questionnaire skill emits answers in the format the
> questionnaire expects, not the format the model defaults to. This file
> documents the canonical format per response type. Replace the example
> phrasings with the firm's house style and tone.

## Why this file exists

A SIG question and a CAIQ question on the same control expect different answer shapes. SIG-Lite expects single-cell `Yes/No`. Full SIG expects `Yes/No` plus a free-text justification in the adjacent column. CAIQ expects `Yes/No/NA` plus a CCM-aligned response. The skill picks the shape from this file based on the response-type classification done in Method step 1.

If a question's expected format does not match any of the patterns below, the skill flags it for the analyst rather than guessing the shape.

## Format: Yes/No (single cell)

- **When used:** SIG-Lite, simple binary checklists.
- **Allowed values:** `Yes`, `No`, `N/A`. No prose.
- **Skill behavior:** If the canonical answer in the control library is not a clean binary, the skill downgrades to `low` confidence and flags. Binary cells are the most-misread; never improvise.

## Format: Yes/No-with-description (two cells)

- **When used:** Full SIG, most CAIQ questions, custom questionnaires.
- **Allowed values:** Cell A: `Yes` / `No` / `N/A`. Cell B: free-text description, typically 1-3 sentences.
- **Description shape:** lead with the affirmative, name the control, cite the evidence section. Example skeleton:
  > Yes. <One-sentence statement of what the firm does>. Documented in
  > <evidence ID> §<section>.
- **N/A justification:** when answering N/A, the description must explain why N/A applies (scope, applicability, alternative control). Bare `N/A` triggers a re-flag from the analyst.

## Format: descriptive free-text

- **When used:** "Describe your process for…", "Explain how…", "What is your approach to…".
- **Length target:** 3-6 sentences. Longer answers signal the model is padding.
- **Shape:** state the policy → state the implementing control → state the cadence (testing, review, audit) → cite the evidence ID.
- **Skill behavior:** must cite the canonical answer's source control ID; must not improvise process steps that are not in the library entry. If the library entry is shorter than the answer the skill wants to write, the skill writes only what the library covers and flags for analyst expansion.

## Format: document-upload

- **When used:** "Please attach your <SOC 2 / ISO cert / pen test summary / DPA / sub-processor list>".
- **Skill behavior:** the skill never writes a cell value. Instead, the summary lists the document the customer is asking for and the matching evidence ID from the index. The analyst handles the upload through the firm's evidence-sharing channel (NDA-gated portal, trust center, etc.) — never by attaching docs to the questionnaire file itself.

## Format: certification-reference

- **When used:** "Are you SOC 2 Type II certified?", "Do you hold ISO 27001 certification?".
- **Allowed values:** Cell A: `Yes`. Cell B: certification name + attestation period + auditor name. Example skeleton:
  > Yes. SOC 2 Type II covering <period start> through <period end>,
  > issued by <auditor>. Report available under NDA via <trust center
  > URL>.
- **Skill behavior:** pulls dates from the evidence index, not from the control library entry. If the cert is past `effective_through`, the skill answers "in renewal" and flags. Never claim a current cert when the evidence shows it has lapsed.

## Format: N/A with justification

- **When used:** Question targets a capability the firm does not offer (e.g. on-premises deployment for a SaaS-only firm) or a framework the firm is not subject to.
- **Shape:** `N/A` plus a one-sentence justification naming the reason (scope, applicability, alternative control).
- **Skill behavior:** flag for analyst review even when the library entry says N/A — N/A answers are most likely to draw a follow-up question from the customer's security team, and the analyst should see them before submission.

## Format: forward-looking / roadmap

- **When used:** "Will you support…", "When do you plan to…", "Is this on your roadmap…".
- **Skill behavior:** never answer. Always flag for review. Roadmap answers are contractual representations and require product + legal sign-off, not security alone.

## Format: incident or audit-finding-specific

- **When used:** "Have you had a breach in the last 12 months?", "Describe any open audit findings", "Have you been subject to a regulatory action?".
- **Skill behavior:** never answer. Always flag for review. These questions require the security and legal teams; the skill cannot represent the firm on them.
