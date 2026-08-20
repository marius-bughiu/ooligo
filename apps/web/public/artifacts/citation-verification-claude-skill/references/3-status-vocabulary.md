# Status vocabulary, signal rules, and quote fidelity

The rules pass three applies. Edit the signal table for your jurisdiction and the quote rules for your style manual; leave the promotion rules alone unless you are prepared to explain the change to a reviewing partner.

## The six statuses

| Status | Means | Requires | Who resolves it |
|---|---|---|---|
| `SUPPORTED` | A verbatim span in the supplied source states the proposition, at or within the pin cite | The span, copied into the row, with its locator | Nobody — but 10 rows get spot-checked |
| `PIN-MISMATCH` | The source supports the proposition, at a different page than the pin cite | The span plus both locators | Drafter corrects the pin cite |
| `QUOTE-DRIFT` | Quoted text in the draft does not match the source character for character | Both texts plus the diff | Drafter re-quotes or removes the quotation marks |
| `SIGNAL-MISMATCH` | The support relationship does not match the introductory signal | The span plus the signal actually warranted | Drafter changes the signal |
| `UNSUPPORTED` | Source supplied, pin cite inside `pages_included`, no span supports the proposition | A statement of what the source does say | Attorney call: re-pull, re-cite, or strike |
| `NO-SOURCE` | No source text supplied, or the pin cite falls outside `pages_included` | The reason | Pull the source and re-run |

### Promotion rules

1. **No span, no `SUPPORTED`.** A row reaches `SUPPORTED` only when a verbatim span copied from a file listed in the source index sits in the row. Recognition is not verification, and a model that "knows" the case is producing exactly the signal that fabrication produces.
2. **`NO-SOURCE` never becomes `UNSUPPORTED`.** Absence of supplied text is not absence of support. Collapsing the two turns a gap in the pull into a finding against the drafter, and reviewers stop trusting the log.
3. **`UNSUPPORTED` never becomes `SUPPORTED` on a second look.** If the first pass found no span and a later pass finds one, the finding is that `pages_included` was wrong. Fix the index and re-run the whole draft; do not patch the row.
4. **A row can carry one status and any number of annotations.** `[STALE-PULL]` and `[PRIVILEGE-CHECK]` are annotations, not statuses.
5. **Record cites follow the same rules as authorities.** A Bates range that does not contain the asserted fact is `UNSUPPORTED`, and a produced document nobody indexed is `NO-SOURCE`.

## Signal matching

Compare the relationship the span actually has to the proposition against the signal the draft used. Bluebook conventions; adjust for local rules and for jurisdictions that use a different citation manual.

| Signal | The source must | Common mismatch |
|---|---|---|
| *(none)* | State the proposition directly, or identify the source of a quotation | Used where the proposition follows only by inference — wants `see` |
| `see` | Support the proposition by an inferential step the reader makes without help | Used where the source states the proposition outright — drop the signal |
| `see also` | Provide additional support beyond authority already cited | Used as the first and only cite for a proposition |
| `cf.` | Support a different proposition analogous enough to lend support | Used as a synonym for `see`, which it is not |
| `compare … with …` | Both sources present, and the comparison stated in a parenthetical | Parenthetical missing, so the reader has to reconstruct the point |
| `but see` | Contradict the proposition | Used where the source merely distinguishes on facts |
| `see generally` | Provide background; no pin cite expected | Used to avoid finding a pin cite for a specific proposition |
| `e.g.` | Be one of several sources stating the proposition | Used where only one source exists |

Signal errors are not sanctionable on their own. They are worth flagging because they cluster with the misrepresentation class — a proposition that needed a `see` and got a bare cite is one where the drafter's reading and the source's text have already drifted apart.

## Quote fidelity

The comparison is character-level. Semantic comparison rates a paraphrase inside quotation marks as a match, and that paraphrase is the most common false-quote pattern in the sanctions record.

Exact match required on: every character between the quotation marks, internal punctuation, capitalization at the start of the quoted span unless bracketed, and any citation embedded in the quoted text.

Flagged as `QUOTE-DRIFT` and shown as a diff:

- Any word substituted, dropped, or added without brackets or an ellipsis
- Case changed at the start of the span without a bracketed letter
- Internal citations silently deleted with no `(citation omitted)` parenthetical
- A quotation reproduced from a second source's quotation of the first, where the intermediate source altered it

Enumerated in the alterations table rather than flagged as drift — these change the text on purpose:

| Device | What to check |
|---|---|
| Ellipsis | Whether the removed text was a limiting clause. "The rule applies … in every case" is a different sentence from the original if the removed span was "absent exigent circumstances" |
| Bracketed alteration | Whether the bracket changes the grammatical subject or the tense in a way that changes who the sentence is about |
| `(cleaned up)` | What the parenthetical is standing in for. The convention covers internal quotation marks, citations, brackets, and ellipses — it does not cover substantive edits, and it does not license paraphrase |
| `(emphasis added)` | That the emphasis is in the draft and not in the original, and that the reverse case carries `(emphasis in original)` |
| `(citation omitted)` | That what was removed was a citation and not text |

## Reading the output

Read the unresolved section first, and read it in this order: `UNSUPPORTED`, `QUOTE-DRIFT`, `PIN-MISMATCH`, `SIGNAL-MISMATCH`, `NO-SOURCE`.

Two counts are worth watching across runs rather than within one:

- **Unresolved rate at first pass** — `NO-SOURCE` plus `UNSUPPORTED` over total instances. A rate that stays high after the pull discipline settles is a source-index problem, not a drafting problem, and the fix is in `pages_included`.
- **Instances per distinct authority** — under 1.3 on a brief of any length means the parse is deduplicating when it should not be. Re-read pass one before trusting the run.
