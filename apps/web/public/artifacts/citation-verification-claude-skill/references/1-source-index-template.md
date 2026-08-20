# Source index

The only place the skill looks for supporting text. A citation whose authority is not listed here comes out as `NO-SOURCE` — it is not checked, and the log says so.

Fill one row per supplied source. Replace the sample rows; they are there to show the shape and the rejection rules, not to be kept.

## Header

```yaml
matter: "Ramirez v. Vantage Logistics, No. 3:26-cv-01184 (N.D. Cal.)"
draft: "motion-to-dismiss-d4.docx"
filing_date: "2026-09-04"
citator_run_on: "2026-08-18"
citator_tool: "KeyCite"
jurisdiction: "N.D. Cal."
sources_dir: "./sources/"
staleness_days: 30
```

`citator_run_on` and `citator_tool` are printed in the log header verbatim. Leave them blank if no citator was run — the log will then state that no citator run was recorded, which is the state a reviewing partner needs to see rather than a silent gap.

## Rows

| source_id | authority_or_record_id | type | provenance | retrieved_on | file | pages_included | notes |
|---|---|---|---|---|---|---|---|
| S-01 | Ashcroft v. Iqbal, 556 U.S. 662 (2009) | case | westlaw | 2026-08-17 | sources/S-01-iqbal.txt | 674-687 | excerpt, majority only |
| S-02 | 15 U.S.C. § 1681e(b) | statute | govinfo | 2026-08-17 | sources/S-02-fcra-1681e.txt | full | current through P.L. 119-xx |
| S-03 | Dougherty v. City of Covina, 654 F.3d 892 (9th Cir. 2011) | case | courtlistener | 2026-08-17 | sources/S-03-dougherty.txt | full | — |
| S-04 | RAMIREZ_0004412-0004418 | record | production | 2026-08-11 | sources/S-04-onboarding-packet.txt | full | Bates range as produced |
| S-05 | Ramirez Dep. 118:4-121:19 (2026-07-22) | transcript | production | 2026-08-11 | sources/S-05-ramirez-dep.txt | 112-126 | rough transcript |

### Column rules

- **`source_id`** — stable, referenced from every log row. Do not renumber between runs on the same draft; a reviewer comparing draft 4 to draft 5 needs the IDs to hold.
- **`authority_or_record_id`** — the citation in full form for authorities, the Bates range or transcript page:line for record material. Copy it from the source, not from the draft. Copying it from the draft imports the draft's error into the thing that is supposed to catch the draft's error.
- **`type`** — `case | statute | regulation | rule | record | transcript | secondary`.
- **`provenance`** — closed vocabulary, and the skill rejects anything outside it at pass one:

  ```
  westlaw | lexis | courtlistener | govinfo | pacer | production | reporter_pdf
  ```

  There is no `other`, and there is deliberately no value for a summary or a synopsis. A source generated or paraphrased by an assistant verifies a fabrication against itself, so the index has no way to express one. If the text you have is a headnote or an editorial summary rather than the opinion, do not index it — pull the opinion.
- **`retrieved_on`** — the date this text was pulled, not the date of the decision. Compared against `filing_date`; a gap over `staleness_days` draws `[STALE-PULL]` on every row citing this source.
- **`file`** — path relative to `sources_dir`. Plain text or Markdown. PDFs need to be converted first; the skill compares characters and cannot do that against a scanned image.
- **`pages_included`** — the reporter pages, paragraph numbers, or Bates range actually present in the file. Load-bearing: when a pin cite falls outside this range, the row comes out `NO-SOURCE` rather than `UNSUPPORTED`, because the absence of support has not been established. Getting this column wrong is the fastest way to turn a real problem into a clean-looking log.
- **`notes`** — free text. Note excerpts, rough transcripts, dissent-only pulls, and translations.

## Excerpting

Excerpts are preferred over full text, and not only for cost. Pull the cited page plus two pages on either side. A five-page window around a pin cite is enough to find the supporting span or to establish that it is not there, and it keeps the run inside a standard context window.

Full-text pulls across a 40-authority brief run past 600,000 tokens, which does not fit a standard context window — the 1M-token window is available through the Anthropic API, not in the Claude apps — so a full-text run has to be chunked or split across sessions. That is a worse check as well as a more expensive one: chunking breaks the guarantee that pass two saw every supplied source before assigning a status.

Two cases where the wider pull is right:

- The proposition is about what a court **held** rather than what it said in passing. Holdings need the procedural posture, and the posture is rarely on the pin-cited page.
- The draft's cite carries a `see generally` signal or points at an opinion as a whole. There is no pin cite to build a window around.

## Before the run

1. Every authority cited in the draft has a row here, or you accept a `NO-SOURCE` row for it in the log.
2. Every `file` path resolves and opens as text.
3. Every `retrieved_on` is a real pull date, not the date you filled the spreadsheet.
4. `pages_included` covers the pin cites in the draft. Check this against the draft's table of authorities before running, not after.
5. No row's text came from an AI summary, a headnote, a brief bank, or another party's brief.
