---
name: deposition-outline
description: Build a deposition outline from an indexed record. Given a Bates-indexed record index, the deponent's role, and the examination goals, the skill outputs a chronology, topic blocks with per-question record cites, a list of admissions to lock in, and impeachment pairs built from the deponent's own prior inconsistent statements — plus a time budget against the seven-hour clock and a coverage report naming what the outline does not reach. Use after the record is assembled and before the examining attorney drafts questions.
---

# Deposition outline from the record

## When to invoke

Invoke once per deponent, after the relevant record has been assembled and indexed, and before the examining attorney starts drafting.

Typical callers:

- Litigation-support or legal-ops staff preparing outline drafts for an examining attorney
- Associates working a witness whose prior statements are spread across several productions and transcripts
- Inside counsel preparing a Rule 30(b)(6) examination against a noticed matters list

Do NOT invoke this skill for:

- **Deciding whom to depose, or in what order.** Witness sequencing is a strategic judgment tied to a defense or case theory. This skill drafts an outline for a deponent who has already been noticed.
- **Drafting a case theory, a defense narrative, or a strategy memo.** Those are work product. This skill produces an examination outline built from cited record material.
- **Producing the certified deposition record.** The outline is preparation. Nothing here substitutes for the transcript, the errata process, or Rule 32 designations.
- **Any run where the record index is not cite-resolved.** If exhibit and transcript references have not been reduced to a Bates-numbered or otherwise stable index, stop. See the fabrication guard below.
- **Auto-serving anything.** The skill drafts; the examining attorney edits, and counsel owns every question that reaches the record.

## Inputs

- Required: `record_index` — path to, or inline text of, a completed `references/2-record-index-template.md`. Each row carries a stable identifier (Bates range, transcript page:line, or production document ID), a date, a source, a one-line description, and a `privileged` flag. The skill reads cites **only** from this file.
- Required: `deponent` — object with `name`, `title`, and `role` (one of `executive | custodian_of_records | finance | engineering | sales | hr | third_party | expert | rule_30b6_designee`). Drives which topic-block modules load.
- Required: `examination_goals` — 3 to 8 plain-language goals, in priority order (for example: "establish he approved the pricing change before the March board meeting").
- Optional: `noticed_matters` — required when `role` is `rule_30b6_designee`: the numbered matters for examination from the Rule 30(b)(6) notice. Blocks are tagged to matter numbers; anything untagged is moved to a "beyond the notice" appendix.
- Optional: `time_budget_minutes` — defaults to `330`. See the seven-hour clock below.
- Optional: `prior_statement_sources` — subset of `record_index` rows that contain the deponent's own statements (declarations, prior transcripts, emails they authored, interrogatory verifications). If omitted, the skill infers them from the `author` column and reports what it inferred.

## Reference files

Loaded from `references/` at run time:

- `references/1-topic-block-library.md` — the question modules, organized by block type and deponent role, each with a stated purpose and the reason the question is phrased the way it is.
- `references/2-record-index-template.md` — the fillable record index. This is the primary adaptation point and the only source of cites.
- `references/3-impeachment-pair-worksheet.md` — the confront-then-introduce pair format, plus the pre-deposition checklist the examining attorney completes before the outline is used.

## Method

Two passes, in this order. The separation is load-bearing, not stylistic.

**Pass 1 — build the statement inventory.** The skill reads `record_index` and produces two intermediate artifacts: a dated chronology of events, and an inventory of the deponent's own statements, each row carrying its identifier verbatim from the index. Nothing is drafted in this pass. If a required index column is missing, or if fewer than three rows resolve to the deponent, the skill emits a structured error and stops rather than proceeding on a thin record.

*Why two passes:* the drafting pass may reference only rows that exist in the inventory built by pass one. A question cannot cite a document the extraction step did not find, because the drafting step never sees the raw record — it sees the inventory. This is the structural guard against invented exhibit numbers, and it is the reason a single-pass "read the documents and write questions" prompt is the wrong shape for this job.

**Pass 2 — assemble topic blocks in a fixed order.** Blocks are emitted as: background and foundation; document authenticity and record-keeping; substantive topics in chronological order; admissions to lock in; impeachment pairs.

*Why this order:* admissions come before impeachment. A witness who has been confronted with a prior inconsistent statement becomes guarded and stops conceding, so every concession you want on the record is asked for while the examination is still cooperative. Authenticity comes early because an exhibit the witness will not authenticate changes which substantive questions are worth asking.

**Time budget against the seven-hour clock.** Federal depositions are limited to one day of seven hours under Rule 30(d)(1) absent stipulation or court order. The skill assigns a minute estimate per block and defaults the budget to 330 minutes of question time, holding roughly 90 minutes back for objections, exhibit handling, colloquy, and breaks. When the assembled outline exceeds the budget, the skill does not silently trim: it emits the full outline and a ranked cut list showing which blocks to drop first, ordered by the lowest-priority `examination_goals` they serve.

**Impeachment pairs are sequenced, not just listed.** Each pair is emitted in three steps — lock the current testimony, confront with the prior statement, then introduce. Rule 613(b), as amended effective 1 December 2024, provides that extrinsic evidence of a prior inconsistent statement may not be admitted until the witness has had an opportunity to explain or deny it and an adverse party has had an opportunity to examine on it. The pair template puts the confrontation step ahead of the introduction step so the outline cannot be worked in an order that forfeits the impeachment.

**Coverage report.** The last section lists every `record_index` row that no question cites, every `examination_goals` entry that no block serves, and every block that carries no exhibit. This is the section the examining attorney reads first.

## Output format

The skill emits one Markdown document with this literal structure:

```markdown
# Deposition outline — Dana Reyes (VP Finance)
Matter: Northgate v. Arbor Systems | Prepared: 2026-08-19
Record index: 214 rows, production through ARB-0041882 (2026-07-30)
Estimated question time: 288 min of 330 budgeted

## Chronology
| Date | Event | Cite |
|---|---|---|
| 2026-01-14 | Reyes circulates draft margin model | ARB-0011204 |
| 2026-03-02 | Board deck states margin floor of 18% | ARB-0018331 |

## Block 1 — Background and foundation (18 min)
Purpose: establish role, reporting line, and document-handling practice.
1. What was your title in January 2026?
2. Who did you report to? [follow-up: any change during the relevant period?]
3. Did you review the margin model before it went to the board? [ARB-0011204]

## Block 4 — Pricing approval (52 min) [goal 1, goal 3]
1. Exhibit 12 is the 2 March board deck. Do you recognize it? [ARB-0018331]
2. Did you prepare the margin figure on slide 9? [ARB-0018331]
   [PRIVILEGE-CHECK: index row ARB-0018340 is flagged privileged — do not
    examine on the counsel memo attached to this deck]

## Admissions to lock in
| # | Admission sought | Supporting cite | Fallback if denied |
|---|---|---|---|
| A1 | She saw the 18% floor before 2 March | ARB-0018331 | Walk the distribution list |

## Impeachment pairs
### IP-1 — Timing of first knowledge
1. LOCK: "So you first saw the margin floor in April?"
2. CONFRONT: "Do you recall testifying on 12 May 2026 that you saw it in
   February?" [Reyes Dep. 88:4-88:19]
3. INTRODUCE: offer Reyes Dep. 88:4-88:19 only after step 2 is answered.

## Coverage report
- Uncited index rows: 31 of 214 (list follows)
- Goals with no block: none
- Blocks without an exhibit: Block 1
- [UNCITED] questions: 2 (Block 6, questions 4 and 7)
```

Any question the skill wants to ask but cannot tie to an index row is emitted with an `[UNCITED]` marker and counted in the coverage report. It is never dropped silently and never given a plausible-looking cite.

## Watch-outs

- **Fabricated record cites.** A model asked to write questions about documents will invent document numbers that look correct. Guard: cites are copied verbatim from `record_index` rows and never composed; any question whose cite does not resolve to an index row is emitted as `[UNCITED]` and counted in the coverage report. Verify a sample against the production before the outline is used — as of 19 August 2026 the AI Hallucination Cases database lists 1,933 decisions worldwide, 1,324 of them in the United States, in which a court found a party relied on hallucinated material.
- **Impeachment sequenced wrongly.** Introducing the prior statement before confronting the witness forfeits the impeachment under amended Rule 613(b). Guard: pairs are emitted only in the lock/confront/introduce format from `references/3-impeachment-pair-worksheet.md`, and the introduce step carries an explicit "only after step 2 is answered" instruction.
- **Running past the clock.** Outlines drafted without a time model routinely overrun the seven hours in Rule 30(d)(1), and the topics that get cut are whichever ones happened to be last. Guard: per-block minute estimates, a 330-minute default budget, and a ranked cut list tied to goal priority rather than block order.
- **Privileged material pulled into the examination.** A record index assembled from a production can include clawed-back or inadvertently produced material. Guard: rows flagged `privileged` in the index are excluded from question generation, and any block touching a document adjacent to a flagged row carries a `[PRIVILEGE-CHECK]` annotation naming the row.
- **Rule 30(b)(6) topic drift.** Questions outside the noticed matters can be refused by the designee and invite a protective-order fight mid-deposition. Guard: when `noticed_matters` is supplied, every block is tagged with the matter numbers it serves and untagged blocks are moved to a "beyond the notice" appendix rather than folded into the main outline.
- **A record index that predates a rolling production.** Guard: the index header carries `production_through` (Bates range and date). The skill prints it in the outline header and emits a warning when that date is more than 14 days before the run date, so the drafter knows to re-index before the deposition.
- **Instructions not to answer treated as an obstacle to route around.** Rule 30(c)(2) permits an instruction not to answer only to preserve a privilege, to enforce a court-ordered limitation, or to present a Rule 30(d)(3) motion. Guard: the outline does not draft workaround questions for anticipated instructions; it flags the block and leaves the response to counsel on the record.
