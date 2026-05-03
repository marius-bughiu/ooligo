# Hold notice template

Per-matter template the litigation-hold flow personalizes per custodian. Copy this file to `n8n/data/hold-notices/<matter-id>.md` per matter and customize counsel-approved language.

The template uses these placeholders, replaced per custodian by the `Personalize Notice` node:

- `{{custodian_name}}`
- `{{matter_id}}`
- `{{hold_id}}`
- `{{ack_url}}`

---

# Litigation Hold Notice — Matter {{matter_id}} — Hold {{hold_id}}

Dear {{custodian_name}},

The firm's legal department is issuing a litigation hold related to Matter {{matter_id}}. As a custodian whose records may be relevant, you are required to take immediate steps to preserve potentially relevant material.

## What you must preserve

You must preserve all documents, communications, and electronic data related to [counsel-defined scope — replace with matter-specific scope]. This includes, but is not limited to:

- Email (work and any personal email used for work-related communication on this matter)
- Slack messages, including DMs and channel posts
- Documents (Google Drive, SharePoint, OneDrive, local files)
- Calendar entries
- [Other systems specific to this matter — replace with named systems]

The scope covers material from [counsel-defined date range] to the date this hold is released in writing.

## What you must NOT do

You must NOT delete, alter, modify, or destroy any potentially relevant material, even if the firm's normal retention policy would otherwise permit deletion.

You must NOT discuss this hold's scope or substance with anyone outside the legal team and your direct counsel of record.

## What this means in practice

- **Auto-deletion settings:** check email, Slack, and document-system retention settings. If any are set to delete material in the relevant scope, contact [legal-ops contact] immediately.
- **Personal devices:** if you have used personal devices or accounts for any work related to this matter, [legal-ops contact] will work with you on appropriate preservation.
- **Departing the firm:** if you leave the firm while this hold is in effect, [legal-ops contact] will work with HR and IT to preserve your records before any account decommissioning.
- **Replacement of equipment:** do not destroy or recycle hardware in scope until [legal-ops contact] confirms preservation.

## Acknowledgement

You must acknowledge receipt of this notice within 7 business days. Please click the link below:

[{{ack_url}}]({{ack_url}})

If you have not received an automated reminder by [date + 14 days], please contact [legal-ops contact] to confirm your acknowledgement was recorded.

## Questions

For questions about scope or what to preserve, contact:

- [legal-ops contact name and email]
- [outside counsel contact, if applicable]

Do NOT discuss the substance of the matter outside this channel.

## When this hold ends

This hold remains in effect until you receive a written release notice from the legal department. Verbal release is not sufficient. Until you receive written release, you must continue to preserve material in scope.

---

[counsel signature block]

[firm letterhead — match firm's standard hold-notice formatting]
