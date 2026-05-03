# Privilege log format — TEMPLATE

> Replace this template's contents with the matter's actual privilege log
> format. Court-acceptable log fields vary by venue — check local rules
> and the protective order before relying on the default schema below.
>
> The skill reads this file on every batch and drafts log entries that
> match the schema. Drafts are NOT final; an attorney finalizes every
> entry before the log is produced to the requesting party.

## Schema

Every log entry is a row with the following fields. Required fields fail the draft if missing; optional fields are blank in the draft if the underlying signal is not present.

| Field | Required | Source | Notes |
|---|---|---|---|
| `log_entry_id` | yes | generated | sequential per batch |
| `doc_id` | yes | metadata_csv.doc_id | links back to the source record |
| `bates_range` | yes | metadata_csv.bates_range | matter's Bates numbering |
| `date` | yes | metadata_csv.date | document date, ISO 8601 |
| `doc_type` | yes | metadata_csv.doc_type | email, memo, draft, etc. |
| `author` | yes | metadata_csv.author | resolved name + email |
| `recipients_to` | yes | metadata_csv.recipients | normalized, lowercased |
| `recipients_cc` | optional | metadata_csv.recipients_cc | normalized, lowercased |
| `recipients_bcc` | optional | metadata_csv.recipients_bcc | normalized, lowercased |
| `subject` | yes | metadata_csv.subject | verbatim from metadata |
| `privilege_basis` | yes | skill output | `attorney-client` / `work-product` / `both` |
| `privilege_description` | yes | skill output | one sentence, neutral, see below |
| `attorney_on_document` | yes | skill output | resolved against rubric |
| `confidentiality_basis` | optional | skill output | only if log format requires |
| `attorney_review_status` | yes | generated | always `draft — pending attorney review` |
| `evidence_citation` | yes | skill output | `{part_index, char_span}` from step 2 |

## Privilege description rules

The `privilege_description` field is the load-bearing prose that describes the document on the log without revealing privileged content. Get this wrong and either you waive privilege (too much detail) or opposing counsel moves to compel because the description is inadequate (too little).

The skill drafts the description following these rules. Attorneys edit on finalization.

### What goes in

- The general subject category (e.g. "legal advice regarding indemnification terms in pending vendor contract")
- The privilege basis prong that fired (attorney-client, work-product, or both)
- The fact that the communication was between attorney and client, or prepared in anticipation of litigation, as applicable

### What stays out

- The specific advice given
- The legal theory or strategy discussed
- Any privileged content of the document itself
- Verbatim quotes from the document
- The names of opposing parties or witnesses (unless already public via the case caption)

### Templates

Use the matching template based on the `privilege_basis` value. The skill substitutes the placeholders from metadata and rubric context.

**Attorney-client (in-house)**:

> Email between {author} ({author_role}) and {primary_recipient}
> ({recipient_role}) seeking / providing legal advice regarding
> {subject_category}.

**Attorney-client (outside counsel)**:

> Email between {firm_name} attorney {attorney_name} and {client_name}
> ({client_role}) seeking / providing legal advice regarding
> {subject_category}.

**Work-product (attorney-prepared)**:

> {Doc_type} prepared by {author} ({author_role}) in anticipation of
> litigation regarding {subject_category}.

**Work-product (party-representative under attorney direction)**:

> {Doc_type} prepared by {author} ({author_role}) at the direction of
> counsel in anticipation of litigation regarding {subject_category}.

**Both**:

> {Doc_type} reflecting legal advice between counsel and client and
> prepared in anticipation of litigation regarding {subject_category}.

## Output format

The skill emits the draft log as a single Markdown table in `draft_privilege_log.md`. Markdown is chosen so attorneys can review, edit, and red-line in any text editor; the matter's production tool exports to the venue's required format (`.csv`, `.xlsx`, or court-specific schema).

Sample row:

```markdown
| log_entry_id | doc_id | bates_range | date | doc_type | author | recipients_to | subject | privilege_basis | privilege_description | attorney_review_status |
|---|---|---|---|---|---|---|---|---|---|---|
| LOG-0001 | DOC-00041 | ACME-00001234 | 2025-11-14 | email | Sarah Chen (General Counsel) | john.doe@acme.com | RE: Vendor MSA — indemnification | attorney-client | Email between Sarah Chen (General Counsel) and John Doe (Head of Procurement) providing legal advice regarding indemnification terms in pending vendor contract. | draft — pending attorney review |
```

## Court-format crosswalks

Common court formats and how the schema maps. Verify the matter's specific local rule before relying on these defaults.

- **Federal Rule 26(b)(5)(A)** — minimum: nature of withheld material, date, author, recipients, subject. Description must be sufficient for the requesting party to assess the claim. The default schema satisfies the federal floor.
- **Delaware Court of Chancery** — additionally requires `attorneys_present` listed separately. The skill emits this as a derived field from `recipients_to + recipients_cc` filtered by the attorney custodian list.
- **EDNY / SDNY** — categorical privilege logs are sometimes acceptable by stipulation. The skill does NOT generate categorical logs; if the matter has stipulated to one, the per-document draft is the source data the attorney aggregates from.

## Attorney finalization checklist

The draft log includes this checklist at the top so the finalizing attorney has a forcing function before the log is produced.

- [ ] Every `privilege_description` reviewed for over- or under-disclosure
- [ ] Every `attorney_review_status` flipped from `draft — pending` to `attorney finalized {YYYY-MM-DD} {initials}`
- [ ] Sample of `not-privileged` calls (10-20 docs) spot-checked
- [ ] All `borderline_queue.csv` entries individually decided
- [ ] Bates numbers reconciled against the production set
- [ ] Format converted to the venue's required format (CSV / XLSX / court-specific schema)
- [ ] Log served per the protective order's service requirements

## Last edited

{YYYY-MM-DD}
