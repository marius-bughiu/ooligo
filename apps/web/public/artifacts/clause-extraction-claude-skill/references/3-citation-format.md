# Citation format — TEMPLATE

> The clause-extraction skill emits a citation on every extracted clause so
> the downstream reviewer can verify the extraction in seconds rather than
> re-reading the contract. Without a usable citation grammar, extractions
> are unfalsifiable — and unfalsifiable extractions become silent CLM data
> rot. This file pins the format and the fallback rules.

## Citation grammar

A citation is a structured object, not a string. The skill emits:

```json
{
  "page": 14,
  "char_span": [1820, 1980]
}
```

- `page` — 1-indexed page number in the source PDF, or paragraph cluster index for `.docx` (since `.docx` has no fixed pagination).
- `char_span` — `[start, end]` character offsets within the page's extracted text, where `start` is inclusive and `end` is exclusive.

The `excerpt` field on the clause record is the verbatim substring at that span. The skill enforces that `page_text[char_span[0]:char_span[1]] == excerpt`. If the assertion fails, the extraction is rejected and the clause is recorded with `status: "error", error: "excerpt_not_grounded"`.

## Why structured, not "p. 14, ¶ 3"

Free-text citations like "p. 14, paragraph 3" cannot be machine-verified. A reviewer cannot click them. A pipeline cannot diff them across re-runs. A regression test cannot assert "the citation moved by exactly N characters when we re-ran extraction after taxonomy v2." Structured citations make every extraction reproducible and reviewable.

## Reviewer UX expectations

Downstream tooling (CLM, review queue, audit log) is expected to render the citation as a deep link into the source PDF page with the excerpt highlighted. Without that affordance, reviewers fall back to ctrl-F on the excerpt — which works, but doubles review time.

Recommended renderer behavior:

- Display the excerpt with the citation page badge inline
- On click, open the source PDF at the cited page with the excerpt highlighted (PDF.js supports `#highlight=<text>`)
- Show `confidence` as a colored chip: high = green, medium = amber, low = red

## "Not present" — the load-bearing answer

When a clause is not located, the citation is omitted and `status: "not_present"` is set with a `note` field documenting the search:

```json
{
  "value": null,
  "status": "not_present",
  "note": "Searched headings: ['Most Favored', 'MFN', 'Pricing']; searched synonyms: ['most favored', 'no less favorable']; no matching paragraphs found."
}
```

This is intentionally explicit. CLM backfill pipelines treat a `null` with `status: "not_present"` as confirmed-absent (file the contract without that field) and a `null` with `status: "error"` as needs-rerun (do not file). Conflating the two corrupts CLM data over time.

## Cross-reference handling

When the matched paragraph is a pointer ("as set forth in Schedule A"), the skill emits:

```json
{
  "value": "see Schedule A",
  "excerpt": "Liability shall be limited as set forth in Schedule A.",
  "citation": { "page": 18, "char_span": [220, 274] },
  "confidence": "medium",
  "note": "cross-reference; manual resolution required"
}
```

Resolving cross-references is out of scope. The skill could chase the reference into Schedule A, but the failure modes (mis-numbered schedules, amendments overriding the schedule, partially-resolved chains) make naive resolution worse than an honest "needs human" flag.

## Confidence calibration

| Confidence | Meaning | Reviewer action |
|---|---|---|
| `high` | Heading match + synonym match + clean excerpt grounded in source | Spot-check 10% sample; trust the rest |
| `medium` | Synonym match without heading, OR cross-reference, OR low heading density on the contract overall | Review every record |
| `low` | Multiple candidate paragraphs and the model picked one with weak signal, OR excerpt is ≥ 200 chars | Review every record before filing |

The skill MUST NOT emit `high` for a record that did not pass the byte-identical excerpt check. There is no "high-confidence hallucination" case — by construction.

## Last edited

{YYYY-MM-DD}
