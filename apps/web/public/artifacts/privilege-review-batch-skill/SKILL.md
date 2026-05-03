---
name: privilege-review-batch
description: Run a first-pass privilege classification across a batch of documents from an eDiscovery export or contract repository. Emits per-document calls (privileged / not-privileged / borderline) with grounded citations and draft privilege-log entries for the privileged set. Designed as a triage layer that routes the borderline queue to attorneys, not as a final determination.
---

# Privilege review — batch

## When to invoke

Invoke once per review batch — typically a folder of documents exported from an eDiscovery platform (Relativity, Everlaw, DISCO) or a directory of contracts pulled from a CLM repository. The skill is a triage layer: it classifies, drafts log entries, and surfaces borderline calls. Attorneys review and finalize.

Typical callers:

- eDiscovery first pass — running across a 5k-50k document review universe before attorney eyes touch it, so attorneys spend their time on the 10-20% the skill flags rather than the 80% of obviously-not-privileged email
- CLM privilege audit — sweeping a contract repository for documents mistakenly tagged "privileged" or vice versa, ahead of a regulator request or M&A diligence
- Investigation triage — classifying a custodian's mailbox before producing to outside counsel, so privileged communications are routed through counsel rather than included in a bulk hand-off

Do NOT invoke this skill for:

- **Final privilege determination on any document.** This skill produces a recommendation with citations. The privilege call is the attorney's. A document marked `privileged` here still needs attorney sign-off before withholding from a production; a document marked `not-privileged` still needs attorney spot-check before release.
- **Anything via non-Tier-A AI vendors.** Privileged content cannot be routed through a general-purpose chatbot, browser extension, consumer-tier Claude, or unvetted SaaS wrapper. Doing so risks waiver. The skill hard-checks the configured endpoint against an allowlist at startup — see `references/3-jurisdictional-tests.md` for the policy framing.
- **Automated production decisions.** No document should be released to a requesting party based on this skill's output alone. Production decisions require attorney review of the full record, not a confidence score.
- **Documents already in active negotiation with outside counsel.** In-flight privileged drafts sit outside the AI policy in most firms. Use this skill on executed documents and inbound communications, not on live drafts.

## Inputs

- Required: `batch_path` — absolute path to a directory of documents (`.eml`, `.msg`, `.pdf`, `.docx`, `.txt`). PDFs must be text-based or pre-OCR'd; the skill rejects scanned-image PDFs at extraction rather than silently producing empty text.
- Required: `metadata_csv` — path to the platform's metadata export. Must include columns: `doc_id`, `custodian`, `author`, `recipients`, `date`, `subject`, `doc_type`. Without metadata, attorney-client analysis is guesswork — the skill refuses to run if the CSV is absent.
- Required: `rubric_path` — path to `references/1-privilege-rubric.md` (or a matter-specific clone). Defines the matter's attorney custodian list, subject-matter scope, applicable privilege standard (attorney-client / work-product / both), and waiver indicators.
- Required: `jurisdiction` — one of `us-federal | us-state-<XX> | uk | eu | other`. Selects the test set from `references/3-jurisdictional-tests.md`. Privilege tests differ materially across jurisdictions; defaulting silently is unsafe.
- Optional: `prior_decisions_csv` — path to a CSV of `doc_id, prior_call, attorney_initials, decided_at` from earlier review passes on overlapping custodians. Used as a calibration signal in step 4, not as ground truth.
- Optional: `borderline_threshold` — float `0.0-1.0`. Default `0.7`. Below this confidence, the document routes to the borderline queue rather than being classified.

## Reference files

Read these from `references/` before processing. They are templates — the matter team replaces the placeholder content with the matter's real rubric, log format, and jurisdictional test set before the skill runs against production documents.

- `references/1-privilege-rubric.md` — attorney custodian list, subject scope, the privilege standard in force, waiver indicators
- `references/2-privilege-log-format.md` — the log entry schema and field conventions the matter uses (court-acceptable format varies by venue)
- `references/3-jurisdictional-tests.md` — the privilege tests per jurisdiction the skill is approved to run against, plus the AI-vendor allowlist policy

## Method

Run these steps in order. Do not parallelize — later steps depend on artifacts produced by earlier ones, and the borderline-queue logic depends on the calibration step having already executed.

### 1. Two-pass extraction (text + structured metadata)

For each document in `batch_path`:

- **Pass A — text.** Extract plain text with paragraph indices preserved. For `.eml` / `.msg`, parse the MIME tree and emit one record per part (header, body, each attachment) so attachment privilege can be evaluated independently of the cover email. For `.pdf`, use a text-layer extractor (pdfplumber); abort with `error: "ocr_required"` on scanned images rather than producing empty text.
- **Pass B — metadata.** Join the document to its row in `metadata_csv` on `doc_id`. Normalize email addresses to lowercase. Resolve `author` and each `recipient` against the rubric's attorney custodian list — the result is a per-party flag `is_attorney: true | false | unknown`.

The output of step 1 is a list of `{doc_id, parts[], parties[], metadata}` records. Why two passes and not a single mega-extraction: metadata-driven flags (was an attorney on the to/from line?) are the strongest signal for attorney-client privilege, and surfacing them as explicit pre-classification context prevents the model from re-deriving them noisily from the body. It also means a metadata-only fallback path exists when text extraction fails.

### 2. Citation-grounded classification (one pass per document)

For each document record:

1. Build a per-document prompt with: the rubric's privilege standard, the jurisdiction's test from `references/3-jurisdictional-tests.md`, the resolved party list, and the document text (truncated at the model's context budget — long documents get a chunked second pass on the largest contiguous attorney-touched section).
2. Ask Claude to return: `classification` (`privileged | not-privileged
   | borderline`), `basis` (which test prong fired), `evidence`
   (1-3 verbatim spans from the document with `{part_index, char_span}` citations), `confidence` (`0.0-1.0`), and an optional `concern` field for borderline calls naming the specific doubt (attorney role unclear, third-party present, subject borderline, waiver indicator present).
3. **Reject any evidence span that is not byte-identical to a substring of the document parts.** Same hallucination guard as the clause-extraction skill: if the model returns a span not literally in the document, drop the evidence and force the document into the borderline queue with `concern: "evidence_not_grounded"`.

Why one pass per document and not a single mega-prompt: per-document prompts let you retry only the failures, cap each call's input tokens (critical at eDiscovery scale where token spend is the dominant cost), and isolate hallucinations to a single record instead of the whole batch.

### 3. Borderline routing

Apply the borderline rules in this order. The first matching rule wins.

- `confidence < borderline_threshold` → borderline queue, `concern: "low_confidence"`
- Any party flagged `is_attorney: unknown` → borderline queue, `concern: "attorney_role_unknown"`
- Document contains a third-party recipient outside the rubric's privilege circle (waiver indicator) → borderline queue, `concern: "potential_waiver"`
- Document type matches a configured "always-route" pattern (e.g. `doc_type IN ['settlement_communication', 'mediation_brief']`) → borderline queue, `concern: "policy_route"`

A well-tuned rubric produces a 10-20% borderline rate. Substantially higher means the rubric is hedging or the matter genuinely sits in gray territory; substantially lower means the rubric is over-confident (validate by sampling high-confidence calls — see step 5).

### 4. Calibration against prior decisions (optional)

If `prior_decisions_csv` is supplied, compute agreement between the skill's call and the attorney's prior call on overlapping `doc_id`s. Emit:

- `agreement_rate` — fraction of overlapping docs where the skill's classification matches the prior attorney call
- `false_privileged_rate` — skill said `privileged`, attorney said `not-privileged` (over-claim risk)
- `false_not_privileged_rate` — skill said `not-privileged`, attorney said `privileged` (production risk — the more dangerous error)

Agreement below 90% is a signal that the rubric needs a tuning pass before relying on the batch output. The skill emits the calibration report but does not auto-adjust thresholds — rubric tuning is a human decision.

### 5. Draft log entries for the privileged set

For each document classified `privileged`, draft a log entry using the schema from `references/2-privilege-log-format.md`. Every field that sources from the document must include the citation from step 2; every field sourced from metadata cites the metadata column. Log entries are drafts — the output explicitly states they require attorney review and finalization before production.

## Output format

Always emit three artifacts per batch: a `classifications.csv`, a `borderline_queue.csv`, and a `draft_privilege_log.md`. The console summary follows.

```markdown
# Privilege review — batch summary

- Batch: `2026-Q2-custodian-jdoe`
- Documents processed: 4,812
- Privileged: 612 (12.7%)
- Not privileged: 3,402 (70.7%)
- Borderline (routed to attorney queue): 798 (16.6%)
- Errors (extraction failed, schema invalid): 0

## Borderline breakdown
- attorney_role_unknown: 312
- potential_waiver: 187
- low_confidence: 244
- policy_route: 55

## Calibration vs. prior decisions
- Overlapping documents: 412
- Agreement: 94.2%
- False-privileged rate (over-claim risk): 1.7%
- False-not-privileged rate (production risk): 0.5%

## Artifacts
- `classifications.csv`
- `borderline_queue.csv`
- `draft_privilege_log.md` (612 entries — attorney finalization required)

## Per-document record (sample row from classifications.csv)

doc_id: DOC-00041
classification: privileged
basis: attorney-client (legal advice from in-house counsel to business team)
confidence: 0.93
evidence:
  - part: body
    char_span: [142, 318]
    excerpt: "Per our discussion with Sarah Chen (General Counsel) yesterday, the recommended position on the indemnification clause is..."
status: extracted
log_entry_drafted: true
```

## Watch-outs

- **Privilege over-claim.** Over-flagging non-privileged documents as privileged inflates the log, draws sanctions risk if a court compels production, and burns attorney review hours unwinding mistakes. Guard: step 4's `false_privileged_rate` is computed against prior attorney decisions whenever a `prior_decisions_csv` is supplied; rates above 5% trigger a console warning recommending a rubric review before the batch is acted on. Without prior decisions, the skill samples 10% of `privileged` calls into the borderline queue for attorney spot-check before the batch closes.
- **Partial-privilege documents.** A single email can be privileged in part (legal advice paragraph) and non-privileged in part (forwarded business update). Treating the whole document as one call is the failure mode. Guard: step 1 emits one record per MIME part; the classification step runs per part; the output flags any document with mixed-classification parts as `redaction_required` and routes it to the borderline queue with `concern: "partial_privilege"`. Redaction itself is attorney work, not skill work.
- **Work-product vs. attorney-client confusion.** Work-product doctrine (anticipation of litigation) and attorney-client privilege protect different things, and the work-product test does not require an attorney on the communication. Guard: the rubric (step 2 input) names which standard is in force for the matter; the `basis` field on the output names the prong that fired; if the skill cannot resolve which standard applies (rubric says "both" and the document fits neither cleanly), it routes to borderline with `concern: "standard_resolution_required"`.
- **Waiver via third-party recipient.** A privileged communication cc'ing a non-client third party generally waives privilege. Guard: step 3's `potential_waiver` rule routes any document with a recipient outside the rubric's privilege circle to the borderline queue with the third-party recipient named in the `concern` field, so the attorney can decide whether the third party falls under a recognized exception (common interest, agent of the attorney, etc.).
- **Hallucinated evidence spans.** Same risk as clause-extraction — models will helpfully invent a verbatim quote. Guard: byte-identical substring check in step 2; failed grounding forces the document into the borderline queue rather than emitting a confident-but-fictional evidence record.
- **Tier-A vendor enforcement.** Routing a privileged document through a non-approved AI endpoint can waive privilege under a growing line of cases. Guard: the skill's startup hook reads the `ALLOWED_ENDPOINTS` allowlist from `references/3-jurisdictional-tests.md` and refuses to run if the configured endpoint is not on the list. The allowlist owner is named in the AI policy; changes require sign-off.
