# Verification log template

The output artifact. It records the inquiry: what was checked, against what text, with what result, and what was not checked at all. Keep it with the matter file.

Adapt the header fields and the sign-off block to your firm's practice. Do not delete the scope statement — it is the section that stops the log from being read as a certification.

---

# Verification log — {{DRAFT_TITLE}}

Draft: `{{DRAFT_FILE}}` | Jurisdiction: {{JURISDICTION}}
Filing date: {{FILING_DATE}} | Run date: {{RUN_DATE}}
Citator run recorded: {{CITATOR_RUN_ON}} ({{CITATOR_TOOL}})
Citation instances: {{N_INSTANCES}} | Distinct authorities: {{N_AUTHORITIES}} | Sources supplied: {{N_SOURCES}}

## Scope of this check

This log records whether each cited source, **as supplied**, states the proposition the draft attributes to it.

It does **not** establish that any authority exists, that it remains good law, or that its subsequent history is clean. Those are citator findings, recorded above by date only. {{N_NO_SOURCE}} authorities in this draft had no supplied source and were not checked.

The signature under Rule 11(b) and the inquiry reasonable under the circumstances that the signature certifies remain with counsel. This log is evidence that an inquiry happened. It is not the inquiry, and it is not the certification.

## Summary

| Status | Rows |
|---|---|
| SUPPORTED | {{N_SUPPORTED}} |
| PIN-MISMATCH | {{N_PIN}} |
| QUOTE-DRIFT | {{N_QUOTE}} |
| SIGNAL-MISMATCH | {{N_SIGNAL}} |
| UNSUPPORTED | {{N_UNSUPPORTED}} |
| NO-SOURCE | {{N_NO_SOURCE}} |

Annotations present: {{STALE_PULL_COUNT}} `[STALE-PULL]`.

## Unresolved

Everything that is not `SUPPORTED`, most severe first: `UNSUPPORTED`, then `QUOTE-DRIFT`, then `PIN-MISMATCH`, then `SIGNAL-MISMATCH`, then `NO-SOURCE`. Read this section before the supported rows; it is the only part with work in it.

### [{{INSTANCE_ID}}] {{STATUS}}

Proposition: "{{PROPOSITION_AS_DRAFTED}}"
Cite as written: {{CITE_AS_WRITTEN}}
Source: {{SOURCE_ID}} | provenance: {{PROVENANCE}} | retrieved_on: {{RETRIEVED_ON}}
Finding: {{WHAT_THE_SOURCE_DOES_AND_DOES_NOT_SAY}}
Action: {{RE_PULL | RE_CITE | STRIKE | RE_SIGNAL | ATTORNEY_CALL}}

For `QUOTE-DRIFT`, include both texts and the diff:

```
Draft:  "{{QUOTED_SPAN_FROM_DRAFT}}"
Source: "{{SPAN_FROM_SOURCE}}"
Diff:   {{CHARACTER_LEVEL_DIFFERENCE}}
```

## Supported

One row each. The verbatim span is the point of the row — a status with no span next to it is the failure this log exists to make visible.

### [{{INSTANCE_ID}}] SUPPORTED

Proposition: "{{PROPOSITION_AS_DRAFTED}}"
Cite as written: {{CITE_AS_WRITTEN}}
Supporting span (verbatim, {{SOURCE_ID}} at {{LOCATOR}}): "{{SPAN}}"

## Alterations and omissions

Quoted material the draft changed on purpose. Listed as a set so a reviewer reads them together rather than meeting them one at a time between diffs.

| Instance | Device | Draft text | What was removed or changed |
|---|---|---|---|
| {{ID}} | ellipsis | {{TEXT}} | {{WHAT_WAS_DROPPED}} |
| {{ID}} | bracket alteration | {{TEXT}} | {{ORIGINAL_WORD}} |
| {{ID}} | (cleaned up) | {{TEXT}} | {{WHAT_THE_PARENTHETICAL_COVERS}} |

An ellipsis that removes a limiting clause changes the proposition. Check every row in this table against the surrounding source text, not against the quoted fragment.

## Not checked

| Authority | Why | Who owns the follow-up |
|---|---|---|
| {{CITE}} | no supplied source | {{NAME}} |
| {{CITE}} | pin cite outside `pages_included` | {{NAME}} |
| {{CITE}} | source is a scanned image, not text | {{NAME}} |

An empty table here means every cited authority had text behind it. That is the state to file in.

## Reviewer sign-off

| Step | Who | Date |
|---|---|---|
| Citator run over every authority | ______________ | ________ |
| Sample of 10 supporting spans opened and confirmed in the source | ______________ | ________ |
| Every unresolved row cleared, re-cited, or struck | ______________ | ________ |
| Alterations table reviewed against surrounding text | ______________ | ________ |
| Draft approved for filing | ______________ | ________ |

The sample check on the third row is not ceremonial. It is the control that tests whether the no-span-no-upgrade rule held on this run, and it is the only step here that a machine cannot perform on its own output.
