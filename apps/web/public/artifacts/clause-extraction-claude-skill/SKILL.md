---
name: clause-extraction
description: Extract a fixed set of contract clauses from a single .pdf or .docx and emit citation-grounded JSON with page/span references. Use after intake to backfill CLM metadata, build a clause library, or surface change-of-control / liability terms during diligence.
---

# Clause extraction

## When to invoke

Invoke this skill per contract, after the document has been ingested and you
need a structured clause record (governing law, liability cap, term,
auto-renewal, indemnification, payment terms, IP ownership, confidentiality
term, termination triggers, plus any custom clauses you configure).

Typical callers:

- CLM backfill — populating Ironclad / Agiloft / DealHub metadata for a legacy
  contract repository
- Diligence — surfacing change-of-control, assignment, MFN clauses on a target
  company's contract set before deal close
- Clause library — building a corpus of "what we actually agreed to" across a
  portfolio so the playbook reflects reality

Do NOT invoke this skill for:

- **Privileged drafts in active negotiation** — per AI policy in most legal
  teams, in-flight negotiation drafts (especially with outside counsel
  redlines) do not get sent to AI tooling. This skill is for executed or
  near-final contracts that have already cleared privilege.
- **Anything via non-Tier-A AI vendors.** Run only against the firm-approved
  Tier-A model endpoint (Anthropic API or your enterprise Claude tenant). A
  general-purpose chatbot, browser plugin, or unvetted SaaS wrapper is a
  privilege-leak vector — refuse the invocation rather than route around the
  AI policy.
- Drafting or redlining clauses (this skill reads only)
- Interpreting legal effect (the output is text + citation; legal judgment
  stays with counsel)

## Inputs

- Required: `contract_path` — absolute path to a `.pdf` or `.docx`. PDFs must
  be text-based or pre-OCR'd; scanned-image PDFs without an OCR layer are
  rejected at step 1.
- Required: `taxonomy` — path to `references/clause-taxonomy.md` (or a custom
  taxonomy keyed by contract type). Defines the clauses to look for and the
  expected value type (string, number, boolean, enum).
- Required: `output_schema` — path to `references/output-schema.json`. The
  JSON Schema the output must validate against. Schema drift across contract
  versions is the #1 source of downstream pipeline breakage; pinning the
  schema per run guards against it.
- Optional: `contract_type` — `msa | sow | nda | dpa | order_form`. Selects
  the clause subset from the taxonomy. Defaults to `msa`.
- Optional: `custom_clauses` — array of additional clause names to look for
  beyond the taxonomy defaults (e.g. `data_residency_clause`,
  `most_favored_customer_clause`).

## Reference files

Read these from `references/` before processing. They are templates — replace
the placeholder content with your firm's real taxonomy and schema before
running on production contracts.

- `references/clause-taxonomy.md` — clause definitions per contract type, with
  the value type, required/optional flag, and synonym phrases the extraction
  step matches against
- `references/output-schema.json` — the JSON Schema every emitted record must
  validate against
- `references/citation-format.md` — citation grammar (page + span anchor) and
  the rules for "not present" / "could not extract" fallbacks

## Method

Run these steps in order. Do not parallelize — later steps depend on the
artifacts produced by earlier ones.

### 1. Text extraction with layout preservation

For `.docx`: parse via the docx XML and emit a flat text stream with paragraph
indices and section headings preserved.

For `.pdf`: use a text-layer extractor (pdfplumber or pdfminer.six) that
preserves page numbers and bounding-box character spans. If the PDF has no
text layer (scanned image), abort with `error: "ocr_required"` rather than
silently emitting empty text. Routing a scanned PDF to OCR is a separate
upstream concern; this skill does not OCR.

The output of step 1 is a list of `{page, paragraph_index, char_span, text}`
records. Every later citation references these coordinates.

### 2. Citation-grounded extraction (one pass per clause)

For each clause in the taxonomy:

1. Locate candidate paragraphs by heading match (e.g. "Governing Law", "Term")
   and synonym phrase match (e.g. "shall be governed by", "initial term of
   this Agreement").
2. Pass the candidate paragraphs (not the full contract) to Claude with the
   clause definition and ask for: the value, the verbatim source excerpt
   (≤ 280 chars), the `{page, char_span}` citation, and a `confidence`
   score (`high | medium | low`).
3. **Reject any extracted excerpt that is not byte-identical to a substring
   of the source paragraphs.** This is the hallucination guard — if the
   model returns text not actually in the contract, drop the extraction and
   record `value: null, error: "excerpt_not_grounded"`.

Why one pass per clause and not a single mega-prompt: per-clause prompts let
you retry only the failures, cap each call's input tokens (cheaper, faster),
and isolate hallucination failures to a single field instead of the whole
record.

### 3. Schema validation

Validate the assembled record against `output-schema.json`. If validation
fails, emit the validation error in the output's `errors` array. Do not
silently coerce types.

### 4. "Not present" fallback

If a clause is not located in step 2 (no candidate paragraphs above
confidence threshold), emit `value: null, status: "not_present", note:
"Searched headings: [...]; no matching paragraphs found."` Do not guess.
"Not present" is a load-bearing answer; CLM backfill pipelines treat
`null + status:not_present` differently from `null + error:*`.

## Output format

Always emit a single JSON object per contract. Soft constraints below are
enforced by `references/output-schema.json`.

```json
{
  "contract_file": "vendor_msa_2026.pdf",
  "contract_type": "msa",
  "extracted_at": "2026-05-03T14:22:00Z",
  "extractor_version": "clause-extraction@2026.05",
  "clauses": {
    "governing_law": {
      "value": "Delaware",
      "excerpt": "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.",
      "citation": { "page": 14, "char_span": [1820, 1980] },
      "confidence": "high",
      "status": "extracted"
    },
    "liability_cap": {
      "value": "12 months fees",
      "excerpt": "In no event shall either party's aggregate liability exceed the fees paid by Customer in the twelve (12) months preceding the event giving rise to the claim.",
      "citation": { "page": 18, "char_span": [220, 410] },
      "confidence": "high",
      "status": "extracted"
    },
    "auto_renewal": {
      "value": true,
      "renewal_term_months": 12,
      "notice_period_days": 90,
      "excerpt": "This Agreement shall automatically renew for successive 12-month terms unless either party provides 90 days' written notice of non-renewal.",
      "citation": { "page": 3, "char_span": [50, 230] },
      "confidence": "high",
      "status": "extracted"
    },
    "most_favored_customer_clause": {
      "value": null,
      "status": "not_present",
      "note": "Searched headings: ['Most Favored', 'MFN', 'Pricing']; no matching paragraphs found."
    }
  },
  "errors": []
}
```

## Watch-outs

- **Privilege leak via Tier-B vendor.** Routing a privileged or
  attorney-work-product document through a non-approved AI endpoint can
  waive privilege. Guard: hard-coded allowlist of model endpoints
  (`ALLOWED_ENDPOINTS = ["api.anthropic.com", "<your-enterprise-tenant>"]`)
  checked at skill startup. Refuse to run if the configured endpoint is not
  on the list. Document the allowlist owner in your AI policy.
- **OCR-induced text gaps on scanned PDFs.** If step 1 silently emits empty
  pages from a scanned image PDF, the skill will report many clauses as
  `not_present` and look like a clean extraction. Guard: step 1 detects
  pages with < 50 extracted characters and aborts with `ocr_required`
  rather than producing a misleading "clean" record.
- **Hallucinated clauses.** Models will helpfully invent a "termination for
  convenience" clause that doesn't exist if asked. Guard: byte-identical
  excerpt-substring check in step 2 — any excerpt not literally present in
  the source paragraphs is rejected. Pair with `confidence: low` flagging
  for human review on the rest.
- **Schema drift across contract versions.** A taxonomy update that changes
  `liability_cap` from a string to a structured `{type, amount, period}`
  silently breaks every downstream consumer. Guard: pin
  `extractor_version` in the output and bump it on every taxonomy or
  schema change. Downstream consumers key on version, not on the assumption
  that the schema is stable.
- **Defined-term resolution.** When a clause says "as set forth in Schedule
  A" the excerpt is the reference, not the value. Guard: detect the
  substring "as set forth in" / "as defined in" and emit `confidence:
  medium, note: "cross-reference, manual resolution required"` rather than
  treating the reference as the answer.
- **Heading-light contracts.** Contracts without clear section headings
  (older or short-form) extract less reliably. Guard: when fewer than 60%
  of expected headings match in step 2, mark the whole record
  `confidence: medium` and note `"heading_density: low"` so downstream QA
  routes it to human review.
