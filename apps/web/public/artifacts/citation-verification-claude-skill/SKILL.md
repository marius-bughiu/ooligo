---
name: citation-verification
description: Verify every legal and factual citation in a draft brief or memo against supplied source text. Given the draft and a provenance-tagged source index, the skill builds one row per citation instance, locates the supporting span verbatim in the supplied text, and assigns a status — SUPPORTED, PIN-MISMATCH, QUOTE-DRIFT, SIGNAL-MISMATCH, UNSUPPORTED, or NO-SOURCE — then emits a certification-ready verification log. It never confirms a citation from model memory and never asserts that an authority exists. Run it after a citator, before filing.
---

# Citation verification against the supplied record

## When to invoke

Invoke on a draft that is substantively finished and before it is filed or sent, after the citator run and after every cited authority has been pulled to text.

Typical callers:

- Litigation associates and paralegals cite-checking a brief before a filing deadline
- Legal-ops staff running a standing pre-filing check across a practice group
- In-house counsel checking a memo that will be relied on by a business owner
- Anyone checking an opposing brief inside a Rule 11(c)(2) safe-harbor window

Do NOT invoke this skill for:

- **Any draft whose authorities have not been pulled to text.** The skill verifies against files you supply. With no source text there is nothing to verify against, and the run returns a page of `NO-SOURCE` rows. Pull first.
- **Confirming that a case exists, or that it is still good law.** That is a citator's job and the skill cannot do it — it has no publisher corpus and no subsequent-history data. Run KeyCite, Shepard's, or an equivalent first. This skill answers the third question, which is whether the source says what the draft says it says.
- **Deciding whether the argument wins.** Verification asks whether the cited source supports the proposition as written. Whether the proposition carries the motion is counsel's judgment.
- **Sealed, protected-order, or privileged material** where the applicable protective order or the tool's data-retention terms have not been checked. ABA Formal Opinion 512 (29 July 2024) puts the confidentiality analysis on the lawyer, and it has to happen before the document is pasted anywhere.
- **Producing the certification itself.** The skill produces a verification log — evidence of the inquiry. The signature under Rule 11(b), and the inquiry reasonable under the circumstances that the signature certifies, stay with counsel.

## Inputs

- Required: `draft` — path to, or inline text of, the brief or memo being checked. Plain text, Markdown, or a Word export. Page and line numbers are preserved when present and reported as-is.
- Required: `source_index` — path to a completed `references/1-source-index-template.md`. One row per supplied source, each carrying a source ID, the authority or record identifier, a `provenance` value, a `retrieved_on` date, and the path to the source text. The skill reads supporting spans **only** from files listed here.
- Required: `sources_dir` — directory holding the source text files named in the index. Excerpts are fine and preferred; see the cost note below.
- Optional: `filing_date` — used for the staleness warning. Defaults to the run date.
- Optional: `staleness_days` — defaults to `30`. Any source whose `retrieved_on` is more than this many days before `filing_date` draws a `[STALE-PULL]` annotation.
- Optional: `citator_run_on` — the date the citator was run over the draft. Printed in the log header. When omitted, the log header states that no citator run was recorded, which is the state a reviewer needs to see.
- Optional: `jurisdiction` — free text, printed in the header and used to select the signal conventions in `references/3-status-vocabulary.md` when local rules depart from The Bluebook.

## Reference files

Loaded from `references/` at run time:

- `references/1-source-index-template.md` — the fillable source index. This is the primary adaptation point and the only place the skill will look for supporting text.
- `references/2-verification-log-template.md` — the output log format, including the scope statement, the per-row fields, and the reviewer signature block.
- `references/3-status-vocabulary.md` — the six statuses and their promotion rules, the signal-match table, and the quote-fidelity rules.

## Method

Three passes. The separation between pass one and pass two is the guard, not a stylistic choice.

**Pass 1 — build the proposition table.** The skill reads the draft and emits one row per **citation instance**, not per authority. Each row carries: an instance ID, the proposition exactly as the draft states it, the citation as written, the pin cite, any quoted span reproduced character-for-character from the draft, the introductory signal, and the authority type.

*Why per-instance:* a table-of-authorities tool deduplicates by authority, and deduplication is precisely what hides the failure class this skill exists to catch. One case cited five times supports five different propositions. The case exists, it is good law, it appears once in the table of authorities — and the fourth pin cite points at a page that says the opposite. Rows keyed to the authority cannot surface that. Rows keyed to the proposition can. The log prints the instance count next to the distinct-authority count; when the two are equal on a brief with repeat cites, the parse missed the repeats and the run should be re-read before anyone trusts it.

**Pass 2 — match against supplied sources only.** For each row, the skill opens the source file named in `source_index` and looks for text that supports the proposition. When it finds one, it copies the supporting span **verbatim** into the row along with the span's locator — page, paragraph, or Bates number as the source provides it.

The refusal rule that makes the output worth reading: **no span, no status upgrade.** A row reaches `SUPPORTED` only when a verbatim span sits in the row. The skill does not confirm from recognition. It is going to recognize plenty of citations — a model trained on public law has read a great deal of it — and every one of those recognitions is worthless here, because recognition is exactly the mechanism that produces a confident cite to a case that does not exist. Rows with no supplied source come out as `NO-SOURCE` and route back to a pull, never to a judgment call.

**Pass 3 — write the log.** Statuses are assigned per `references/3-status-vocabulary.md`, the rows are grouped by status with the unresolved ones first, and the log opens with a scope statement naming what the check did not cover.

**Quote fidelity is character-level, not semantic.** Every quoted span in the draft is compared to the source text character by character; when the two differ, the log prints the diff rather than a verdict. Paraphrase inside quotation marks is the most common false-quote pattern and semantic comparison rates it as a match, which is why the comparison is exact. Alterations flagged with brackets, omissions marked with ellipses, and the `(cleaned up)` and `internal quotation marks omitted` parentheticals are enumerated in a separate list — they legitimately change the text, and a reviewer needs to see them as a set rather than as noise scattered through the diffs.

**Signal matching.** The skill compares the relationship between proposition and source against the introductory signal used. A no-signal cite whose source supports the proposition only by inference is a `SIGNAL-MISMATCH` and wants a `see`. A `see also` cite whose source states the proposition directly is also a mismatch, in the other direction. Signal errors are not sanctionable on their own, but they cluster with the misrepresentation class, and the check costs nothing once the spans are located.

**Staleness.** Each source row's `retrieved_on` date is compared to `filing_date`. A source pulled more than `staleness_days` before filing draws `[STALE-PULL]`. A case that was good law at the pull and was overruled last week reads identically to one that was never checked, and the date is the only thing that separates them.

## Output format

The log is a Markdown document following `references/2-verification-log-template.md`. A literal excerpt:

```markdown
# Verification log — Motion to Dismiss (draft 4)

Draft: motion-to-dismiss-d4.docx | Jurisdiction: N.D. Cal.
Filing date: 2026-09-04 | Run date: 2026-08-20
Citator run recorded: 2026-08-18 (KeyCite)
Citation instances: 47 | Distinct authorities: 31 | Sources supplied: 29

## Scope of this check

This log records whether each cited source, as supplied, states the
proposition the draft attributes to it. It does NOT establish that any
authority exists, that it remains good law, or that its subsequent
history is clean. Those are citator findings and are recorded above by
date only. Two authorities in this draft have no supplied source and
were not checked at all.

## Unresolved — 6 rows

### [C-14] UNSUPPORTED
Proposition: "A forum-selection clause is unenforceable where enforcement
  would contravene a strong public policy of the forum state."
Cite as written: Atl. Marine Constr. Co. v. U.S. Dist. Court, 571 U.S. 49,
  63 (2013)
Source: S-09 | provenance: westlaw | retrieved_on: 2026-08-17
Finding: No span at or near page 63 supports the proposition. The nearest
  passage addresses the § 1404(a) transfer analysis, not enforceability.
Action: re-pull, re-cite, or strike the sentence.

### [C-22] QUOTE-DRIFT
Cite as written: Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009)
Draft:  "a complaint must contain sufficient factual matter, accepted as
        true, to state a claim that is plausible on its face"
Source: "A claim has facial plausibility when the plaintiff pleads factual
        content that allows the court to draw the reasonable inference"
Diff: draft text does not appear at 556 U.S. 678 in the supplied excerpt.
Action: verify against the full opinion; the quotation marks are load-bearing.

## Supported — 39 rows

### [C-01] SUPPORTED
Proposition: "Rule 12(b)(6) dismissal is reviewed de novo."
Cite as written: Dougherty v. City of Covina, 654 F.3d 892, 897 (9th Cir. 2011)
Supporting span (verbatim, S-03 at 897): "We review de novo the district
  court's grant of a motion to dismiss under Rule 12(b)(6)."

## Reviewer sign-off

Citator run by: ______________________  Date: __________
Spans spot-checked (sample of 10): ______________________  Date: __________
Unresolved rows cleared by: ______________________  Date: __________
```

## Watch-outs

- **The skill certifies from memory.** A model asked whether a citation is good will answer from recognition, confidently, and recognition is the exact mechanism behind fabricated authority. Guard: `SUPPORTED` requires a verbatim span copied from a file listed in `source_index` and printed in the row. No span, no upgrade — and the log prints spans rather than verdicts so a reviewer can check the guard held.
- **Circular sources.** A "source" that is itself an AI-generated summary of a case verifies a fabrication against its own fabrication. Guard: `provenance` is a required column with a closed vocabulary — `westlaw | lexis | courtlistener | govinfo | pacer | production | reporter_pdf` — and any row outside it is rejected at pass one rather than flagged at pass three. A summary written by an assistant is not a source.
- **Dedupe hides misrepresentation.** Guard: rows are keyed to citation instances, and the log prints instance count beside distinct-authority count so an equal pair is visible as a parse failure.
- **The log gets treated as the certification.** Guard: the scope statement is the first section of every log, it names existence and subsequent history as out of scope, and the signature block stays unsigned until a person signs it. The log is evidence of the inquiry, not the inquiry.
- **Stale pulls.** Guard: `retrieved_on` is required per source, compared against `filing_date`, and any gap over `staleness_days` draws `[STALE-PULL]` in the row rather than a silent pass.
- **Confidentiality.** Guard: the run happens under whatever data-retention terms the firm has accepted, checked before the first sealed document is pasted, per ABA Formal Opinion 512. The skill has no view on what your protective order permits.
