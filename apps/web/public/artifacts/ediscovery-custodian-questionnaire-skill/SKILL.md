---
name: ediscovery-custodian-questionnaire
description: Generate a structured custodian interview questionnaire from a legal-hold scope document. Given the hold's matter type, key issues, and custodian role, the skill outputs a draft questionnaire — with organized sections for data locations, communication channels, device inventory, and role-specific follow-up questions — that the legal-ops manager reviews before sending to the custodian. Use during the early data-collection phase of litigation, regulatory investigation, or internal inquiry.
---

# E-discovery custodian questionnaire

## When to invoke

Invoke this skill once per custodian, after the legal-hold scope has been documented and before custodian interviews begin.

Typical callers:

- Legal-ops managers running the custodian identification and data-collection phase of a litigation hold
- Inside counsel coordinating preservation obligations with IT for a regulatory inquiry
- Outside counsel directing in-house staff through the initial scoping interviews for a government investigation

Do NOT invoke this skill for:

- **Legal interpretation of hold obligations.** Whether a particular custodian is legally required to preserve data is a judgment call for counsel. This skill drafts the questionnaire; counsel decides who is a custodian and what the hold covers. Consult counsel before finalizing scope.
- **Attorney-client privileged custodian strategy.** Notes or strategy documents describing which custodians are most significant to the defense theory are work product. This skill generates a data-collection questionnaire, not a privileged strategy memo.
- **Auto-sending questionnaires.** The legal-ops manager reviews and edits the draft before sending. The skill does not distribute.
- **Non-litigation HR investigations with separate privilege considerations.** Dual-purpose investigations (employment matters that may become litigation) have distinct privilege rules; consult counsel before using this questionnaire template in those contexts.

## Inputs

- Required: `hold_scope` — path to, or inline text of, the legal-hold scope document. Must include: matter name, matter type (e.g. `commercial_litigation | regulatory | internal_investigation`), key issues summary (1-5 sentences), relevant date range (start and optional end date), and the specific custodian's name and job title.
- Required: `custodian_role` — one of `executive | sales_ops | finance | engineering | legal | hr | it | other`. Drives the role-specific question modules.
- Optional: `data_sources_known` — array of data sources already identified in prior custodian interviews or the hold notice (e.g. `["Salesforce", "Gmail", "Slack", "local_laptop"]`). Pre-populates the data-location section.
- Optional: `matter_type_overrides` — additional question modules beyond the defaults for the `matter_type`. Examples: `antitrust_pricing`, `trade_secret`, `regulatory_subpoena`, `harassment`.
- Optional: `output_format` — `word_outline | numbered_list`. Default: `numbered_list`.

## Reference files

Read these from `references/` before generating. They are templates — replace the placeholder content with your firm's real hold language and question modules before running on production matters.

- `references/1-question-library.md` — organized library of interview questions by section (data locations, communications, devices, role-specific modules) with the rationale for each question
- `references/2-hold-scope-template.md` — fillable template for the hold scope input. If the caller doesn't have a structured scope document, direct them to fill this template first.
- `references/3-custodian-interview-checklist.md` — the post-interview checklist the legal-ops manager completes after the custodian call, capturing gaps and follow-up items

## Method

Run these steps in order.

### 1. Parse hold scope and custodian context

Extract the following fields from `hold_scope`:

- `matter_name` — string
- `matter_type` — enum
- `key_issues` — string (preserve verbatim; these words drive section titles and question framing)
- `relevant_date_range_start` — ISO date
- `relevant_date_range_end` — ISO date or `ongoing`
- `custodian_name` — string
- `custodian_title` — string

If any required field is missing, emit a structured error before generating any questions:

```
error: "missing_required_fields"
missing: ["<field_name>", ...]
note: "Complete the hold scope document (references/2-hold-scope-template.md) before invoking the skill."
```

Do not generate a questionnaire against an incomplete scope. Incomplete scope produces questions that won't hold up under cross-examination or privilege challenges.

### 2. Select question modules

Map `matter_type` and `custodian_role` to the question modules to include. The base modules run on every questionnaire; role modules and matter-type modules stack on top.

**Base modules (always included):**
- Data locations (where does the custodian store work-related data — email, shared drives, local devices, personal accounts, third-party services)
- Communication channels (platforms used for work-related communications, including informal channels: SMS, WhatsApp, personal email)
- Device inventory (company-issued and personal devices used for work in the relevant period)
- Data retention practices (does the custodian delete email, clear instant messaging, use auto-delete settings)
- Relevant date range check (did the custodian's role change during the relevant period; was the custodian on leave)

**Role modules (add based on `custodian_role`):**
- `executive`: board communications, document-management platforms, assistant-maintained files, off-channel communications (Signal, encrypted apps)
- `sales_ops`: CRM data, deal documents, pricing approval trails, counterparty communications
- `finance`: ERP exports, expense platforms, wire-approval workflows, financial model files
- `engineering`: version-control repositories, CI/CD logs, issue trackers, internal wikis
- `hr`: HR platform records, performance documentation, separation agreements, confidential complaint files
- `it`: backup schedules, endpoint MDM logs, email archive configuration, litigation-hold system accounts

**Matter-type modules (add based on `matter_type`):**
- `commercial_litigation`: contract documents, communications with named counterparty, approval chains for disputed transactions
- `regulatory`: regulator correspondence, internal compliance reviews, any prior government requests
- `internal_investigation`: subject-related HR records (if permitted by counsel), escalation logs, any prior complaints

### 3. Generate draft questionnaire

Format the questionnaire as numbered sections. Within each section, list questions individually with a blank follow-up line beneath each question labeled "Response:" so the interviewer can fill it in.

Include at the top:
- Matter name and matter number (if provided)
- Custodian name and title
- Interviewer name (blank for interviewer to fill)
- Interview date (blank)
- Confidentiality notice: "This interview is conducted for purposes of legal hold. Responses may be protected by attorney-client privilege and/or work-product doctrine. Do not share the contents of this questionnaire outside the legal team without authorization from counsel."

Why numbered sections rather than a flat list: numbered references survive editing across multiple review rounds and are citation-friendly if the questionnaire is produced in litigation or referenced in a hold-certification record.

Why the confidentiality header is generated by the skill: legal-ops managers sometimes omit it when drafting ad hoc. The skill includes it by default; counsel can delete if the specific matter doesn't warrant it. Consult counsel on privilege framing for each matter.

### 4. Flag high-risk items

After the questionnaire, emit a `## Legal-ops notes` section (not part of the custodian-facing document) flagging:

- Any questions that touch potentially privileged materials (label: `[privilege-flag]`)
- Any questions that reference specific named individuals other than the custodian (label: `[third-party-flag]`)
- Any data-retention answers that may indicate potential spoliation risk (label: `[spoliation-watch]`)

These flags are for the legal-ops manager and counsel only. The custodian does not see this section.

## Output format

Always emit two sections separated by a horizontal rule: the custodian-facing questionnaire and the legal-ops notes section.

**Literal example:**

```
# Custodian Interview Questionnaire
Matter: Acme Corp v. Beta LLC — Case No. 2026-CV-0044
Custodian: Jordan Smith, VP Sales Operations
Interviewer: ________________
Date: ________________

CONFIDENTIALITY NOTICE: This interview is conducted for purposes of legal hold
in the matter referenced above. Responses may be protected by attorney-client
privilege and/or work-product doctrine. Do not share the contents of this
questionnaire outside the legal team without authorization from counsel.

---

## Section 1 — Data Locations

1. Please list all locations where you store work-related documents and files,
   including email accounts, shared drives, local folders, and any personal
   accounts you use for work purposes.
   Response:

2. Do you use any file-sync services (Dropbox, Google Drive personal, iCloud)
   to store work-related files?
   Response:

3. Do you have access to shared network drives or departmental SharePoint sites?
   If yes, please list them.
   Response:

## Section 2 — Communication Channels

4. What platforms do you use for work-related communications? Please include
   all platforms, even ones used informally (Slack, Teams, WhatsApp, personal
   email, SMS).
   Response:

5. Have you communicated with [Counterparty Name] or any Beta LLC employees
   using personal email or messaging apps during the period January 1, 2023
   through June 30, 2025?
   Response:

## Section 3 — Device Inventory

6. List all devices — company-issued and personal — that you used for
   work-related activities during the relevant period.
   Response:

7. Have any devices been replaced, repaired, wiped, or disposed of since
   January 2023?
   Response:

## Section 4 — Sales Operations (Role-Specific)

8. Which CRM do you use to manage deal records and customer communications?
   Do you retain local copies of CRM exports or reports?
   Response:

9. Were you involved in pricing approvals or contract modifications with
   Beta LLC? If yes, where are those approval records stored?
   Response:

---

## Legal-ops notes (not for custodian)

- Q5: References communications with named counterparty. [third-party-flag]
  Confirm with counsel which Beta LLC individuals are covered by the hold.
- Q9: Pricing approval chain may touch financial records separately held
  by finance. Confirm finance custodians are also interviewed. [privilege-flag
  if approvals involved in-house counsel]
```

## Watch-outs

- **Scope creep into legal advice.** The questionnaire asks where data lives; it does not ask whether the custodian believes they had an obligation to preserve it. Guard: the skill never generates questions that ask the custodian to characterize their own legal duties. Questions of the form "Did you know you were required to preserve X?" are legally loaded and are excluded from the question library.
- **Omission of informal channels.** Custodians routinely underreport personal email, SMS, and messaging apps unless explicitly asked. Guard: the base communication-channels module always asks about personal accounts, informal messaging, and encrypted apps — by name, not generically. If `data_sources_known` includes no informal channels, the skill adds a `[completeness-flag]` note in the legal-ops section.
- **Privilege header omission.** Ad hoc custodian questionnaires often lack a privilege/confidentiality header, which can complicate work-product assertions later. Guard: the skill includes the header on every output. Counsel removes it only with intentional deletion, not by accident.
- **Spoliation risk not surfaced.** A custodian who reveals they use 30-day auto-delete in their email client is a spoliation risk if the hold predates notice. Guard: data-retention questions are in the base module on every questionnaire; the legal-ops notes section flags any retention answer that mentions deletion or auto-expiry during the relevant period with a `[spoliation-watch]` label.
- **Matter-type mismatch.** Using the commercial-litigation module for a government regulatory inquiry may omit questions about prior government contact that are standard in regulatory custodian interviews. Guard: the skill selects matter-type modules from the explicit mapping in step 2 and emits a warning if `matter_type` is ambiguous or not in the enum: "Matter type not recognized — defaulting to commercial_litigation. Confirm with counsel before proceeding."
- **Stale question library.** The question library in `references/1-question-library.md` is a template. Legal-ops teams that don't update it for their firm's specific platforms (their actual CRM, their actual archive solution) will generate questions asking about platforms the firm doesn't use. Guard: the question library includes a `last_updated` field and the skill emits a warning when it is more than 12 months old: "Question library has not been updated in over 12 months. Review references/1-question-library.md for platform accuracy."
