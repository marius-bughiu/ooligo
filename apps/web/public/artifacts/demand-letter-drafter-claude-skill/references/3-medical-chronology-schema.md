# Medical chronology schema (citation format the attorney verifies against)

The chronology is the spine of the demand. Every special-damages line and every sentence of the injuries narrative cites a chronology row; every chronology row cites a record page. Keep the citation format identical to what the firm uses so the attorney verifies against the same references.

## Columns

| Column | Content | Rule |
|---|---|---|
| `Date` | Date of service (YYYY-MM-DD) | Sort ascending. Illegible date → `[illegible — confirm]` + page cite. |
| `Provider` | Treating provider / facility | As named in the record. No normalization that loses the source name. |
| `Complaint / treatment` | The visit's complaint and what was done | From the record only. No inferred diagnosis. |
| `Billed` | Billed amount for the date of service | Per the playbook's billed-vs-paid rule. `[no bill in file]` if records reference it but the bill is absent. |
| `Record page` | `document.pdf p.N` | Every row. A row with no citation is invalid — drop it to the checklist instead. |

## Citation format

`{document_name} p.{page}` — e.g. `records-apex-pt.pdf p.7`. For a page range: `bills.pdf p.7-9`. The skill reuses the exact filenames from the indexed case file so the attorney opens the same document.

## Worked row

| Date | Provider | Complaint / treatment | Billed | Record page |
|---|---|---|---|---|
| 2026-03-04 | City General ER | Neck/back pain post-MVA; X-ray, discharged | $4,210 | bills.pdf p.3 |
| 2026-04-14 | Apex Physical Therapy | Eval + start of PT, 2×/week | $880 | records-apex.pdf p.2 |

## Gaps and flags

- A gap between consecutive `Date` rows at or above the playbook's gap threshold (default 30 days) is flagged in the review checklist with both dates and the page cites bracketing the gap.
- An entry the skill cannot fully read (illegible billed amount, ambiguous provider) is kept in the chronology with the legible fields, the unreadable field marked `[illegible — confirm]`, and the page cited.

## What does NOT go in the chronology

- Prognosis, permanency, causation — unless a provider wrote it, and then it is quoted, not paraphrased into a stronger claim.
- Bills with no corresponding date of service in the records — those go to the checklist as `bill — no matching service date — confirm`, not into a chronology row.
