# Record index template

Fill this in once per deponent. **This file is the only source of cites the skill will use.** A row that is not here cannot be cited by any question, and a cite that is not copied from a row here is treated as a fabrication and marked `[UNCITED]`.

Replace the sample rows below with your own.

---

## Header

```yaml
matter: Northgate v. Arbor Systems
matter_number: 3:26-cv-00841
deponent: Dana Reyes
deponent_title: VP Finance
deposition_date: 2026-09-11
production_through: ARB-0041882
production_through_date: 2026-07-30
transcripts_included:
  - Reyes Dep. (2026-05-12), pages 1-214
  - Okonjo Dep. (2026-06-03), pages 1-176
```

`production_through` and `production_through_date` are not optional. The skill prints them in the outline header and warns when the date is more than 14 days before the run date, because a rolling production makes a stale index the most common source of a wrong cite.

## Rows

| id | date | source | author | description | privileged | deponent_statement |
|---|---|---|---|---|---|---|
| ARB-0011204 | 2026-01-14 | email + attachment | D. Reyes | Draft margin model circulated to finance leads | no | yes |
| ARB-0018331 | 2026-03-02 | board deck | M. Okonjo | Q1 board deck, slide 9 states 18% margin floor | no | no |
| ARB-0018340 | 2026-03-02 | memo | outside counsel | Attached counsel memo — clawed back 2026-06-18 | yes | no |
| ARB-0022917 | 2026-04-07 | Slack export | D. Reyes | "I hadn't seen the floor until this week" | no | yes |
| Reyes Dep. 88:4-88:19 | 2026-05-12 | transcript | D. Reyes | Testifies she saw the floor in February | no | yes |

### Column rules

- **`id`** — a stable identifier: a Bates number or range, a `Transcript page:line` reference, or a production document ID. Never a filename, a folder path, or a description. This string is copied verbatim into every question that cites the row.
- **`date`** — the date of the document, not the date of production. Drives the chronology.
- **`source`** — the document type. Used to select authenticity questions in base block 2.
- **`author`** — who created or sent it. When `prior_statement_sources` is omitted, the skill infers the deponent's own statements from this column and reports what it inferred.
- **`description`** — one line, factual. Do not editorialize here; characterizations in the index end up in questions.
- **`privileged`** — `yes` for anything clawed back, withheld, or logged. Rows marked `yes` are excluded from question generation, and adjacent rows draw a `[PRIVILEGE-CHECK]` annotation.
- **`deponent_statement`** — `yes` when the row contains a statement by the deponent. These rows are the raw material for the impeachment block. If fewer than three rows across the index resolve to the deponent, the skill stops rather than drafting impeachment from a thin record.

### Size guidance

A useful index for a single fact witness runs 80 to 400 rows. Below about 50, you are usually indexing a subset and will get a coverage report full of gaps you cannot explain. Above about 800, split by topic and run the skill once per topic — a single oversized index dilutes the chronology and makes the time budget meaningless.

## Noticed matters (Rule 30(b)(6) only)

Required when the deponent role is `rule_30b6_designee`. Copy the numbered matters from the notice verbatim.

```yaml
noticed_matters:
  - number: 1
    text: The organization's pricing approval process from 2025-06-01 to present
  - number: 4
    text: The organization's document retention practices for board materials
```

Blocks are tagged with the matter numbers they serve. Anything untagged is moved to a "beyond the notice" appendix — not deleted, but not mixed into the main outline either.
