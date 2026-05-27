---
name: ai-sdr-draft-qa
description: Pre-send QA gate for AI SDR drafts (11x Alice, Artisan Ava, aisdr, Unify, homegrown agents). Scores each draft on claim accuracy, personalization grounding, jurisdictional compliance, and deliverability hygiene, then returns a block / edit / send verdict with the specific failing axis cited and an optional rewritten draft. Use as a webhook in front of the AI SDR's send action — not as a substitute for a human reviewer on warm or already-engaged threads.
---

# AI SDR draft QA

## When to invoke

Invoke before any AI-SDR-generated outbound email is released to the send queue. Production patterns:

- A pre-send webhook in 11x, Artisan, aisdr, or Unify that posts `{ draft, prospect_evidence, sender_domain }` to this skill and only releases the send on `verdict: send`.
- A batch pre-send pass over the next 24 hours of queued drafts that pauses any sequence step with `verdict: block`.
- A calibration pass during AI SDR pilot — run 500 drafts through the skill, have a RevOps analyst label the same 500 by hand, use the disagreement set to tune the rubric thresholds before scaling.

Do NOT invoke this skill for:

- **Warm or already-engaged threads.** Replies to a prospect who already booked a meeting will fail the personalization rubric by design — the personalization should be context-aware, not pulled from cold evidence. Route these to a different prompt.
- **Drafts a human SDR or AE will review before send.** The human is a stronger gate than the skill; running the skill in front of the human wastes tokens and adds latency without raising precision.
- **Drafts without a `prospect_evidence` pack.** Without the evidence the upstream model used, the skill cannot verify claims. It returns `insufficient_evidence` rather than guessing. Fix upstream — get the AI SDR to expose its retrieval context — not by loosening the rubric.

## Inputs

Required:

- `draft.subject` — string. The proposed subject line.
- `draft.body` — string. The proposed plain-text body. HTML drafts are rejected; convert upstream.
- `draft.from` — string. The literal `From:` line that will appear in the sent email.
- `sender_domain` — string. The sending domain (used for the deliverability rubric's identity check).
- `recipient.country` — ISO 3166-1 alpha-2 country code. Drives jurisdictional profile selection in the compliance rubric.
- `prospect_evidence` — object. The exact enrichment payload the upstream AI SDR used. Required shape: an array of `{ source, retrieved_at, claim_text, citation_url? }` entries. Every claim the AI SDR made in the draft must trace to an entry here.

Optional:

- `recipient.us_state` — ISO 3166-2 subdivision code. Required for the US profile when CCPA-aligned opt-out applies.
- `brand_guide` — string. Path to or inline contents of a brand voice file with banned phrasings beyond the defaults. Loaded alongside the deliverability rubric.
- `cache_key_prefix` — string. Optional prompt-cache prefix for batch runs; see the cache-key convention below.
- `request_rewrite` — boolean. Default `false`. When `true`, the skill returns a rewritten draft alongside the verdict on `edit` or `block`.

## Reference files

Load these from `references/` before first run. The four rubric files are stable across calls within a deployment — cache them.

- `references/1-claim-rubric.md` — what counts as a claim, the evidence-pack contract, per-axis pass/block thresholds. `claim_block_threshold` is set here.
- `references/2-personalization-rubric.md` — grounded vs ungrounded specifics, the 0-5 scoring scale with example outputs at each score. `personalization_block_below` is set here.
- `references/3-compliance-rubric.md` — per-jurisdiction profiles (US CAN-SPAM, RFC 8058 one-click unsubscribe, EU GDPR legitimate interest, NYC LL144 awareness, French Loi Hamon, California CCPA-aligned opt-out).
- `references/4-sample-output.md` — literal `send`, `edit`, and `block` outputs plus the structured-field contract for parsers.

## Method

Run these steps in order. Earlier steps gate later steps.

### 1. Input validation

Reject the call if any required field is missing or malformed. Return `result: insufficient_input` with the specific field name. Do not score on a partial record. A malformed `prospect_evidence` pack (missing the array, entries missing `source` or `claim_text`) is a hard rejection — the verifier cannot run without the contract.

### 2. Claim extraction and verification

Extract every factual claim about the prospect, the prospect's company, or a public event the draft references. Examples: "I saw your Series B announcement", "your hiring spike on the data team", "your podcast appearance with Lenny last month", "since you moved to [Company] in March".

For each claim:

- Match against the `prospect_evidence` pack. A claim is **grounded** if at least one entry in the pack supports it (same entity, consistent date, consistent fact).
- If no entry supports the claim, mark it **ungrounded**.
- A grounded claim with a stale `retrieved_at` (older than 90 days for company facts, older than 30 days for hiring or product-launch facts) is downgraded to **stale_grounded** and flagged as an edit-tier finding.

Apply the threshold from `references/1-claim-rubric.md`: `claim_block_threshold` ungrounded claims (default 1) trips a block.

### 3. Personalization scoring

Score the draft on the 0-5 scale defined in `references/2-personalization-rubric.md`:

- **Grounded specifics** — entities, events, or properties tied to a citation in the evidence pack. Each counts toward the score.
- **Ungrounded specifics** — references to "your industry", "your role", "your team", "your company" without a tied citation. These count zero.

Apply `personalization_block_below` (default 2). Drafts under the threshold are blocked.

The grounded/ungrounded separation is the guard against score gaming — if the rubric rewarded specificity alone, the upstream AI SDR would learn to stuff specific-looking tokens. A "Snowflake" mention without a current-employment citation reads as ungrounded.

### 4. Compliance scan

Read `recipient.country` (and `recipient.us_state` if present). Load the matching jurisdictional profile from `references/3-compliance-rubric.md`. If no profile matches, return `result: insufficient_compliance_context` — do not fall back to a generic profile.

For the matched profile, check every required element:

- US CAN-SPAM floor: physical sender address in the footer, visible unsubscribe link, sender identity matching the `From:` line.
- RFC 8058 (Google + Yahoo bulk-sender requirement since February 2024): the `List-Unsubscribe` header must include both `mailto:` and `https://` options, and the `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header must be present. The skill cannot inspect headers directly; it requires the calling agent to pass `email_headers` or to confirm `headers_compliant: true`.
- EU GDPR profile: legitimate interest basis documented, opt-out language present, no third-country transfers without standard contractual clauses noted in the evidence pack.
- France Loi Hamon: B2B opt-out language present.
- California: CCPA-aligned "Do Not Sell or Share" link or its B2B equivalent.
- NYC LL144 awareness: if the draft references a hiring or recruiting action and the recipient is in NYC, flag for human review.

Missing any required element for the matched profile is a block.

### 5. Deliverability and voice scan

Run the bundled checks:

- Spam-trigger phrasings — "guaranteed", "free money", "act now", "click here now", "100% free", "no obligation", excessive currency symbols.
- Subject line over 70 characters or in all caps.
- Body under 40 words or over 250 words.
- Image-only body (no plain text content).
- More than 3 outbound links.
- Link-cloaking patterns (link text that does not match the destination domain).
- Stock AI tells — "I hope this email finds you well", "I wanted to reach out", "I came across your profile" (these read as AI-generated to trained recipients and lower reply rate).
- Banned phrasings from `brand_guide` if supplied.

A single flag triggers an `edit` verdict. Two or more flags stacked trigger a `block`.

### 6. Verdict assembly

Return one verdict:

- `send` — no blocks, no edit-tier flags. The draft is releasable.
- `edit` — one or more edit-tier flags. The draft is releasable after applying the suggested rewrites (returned inline when `request_rewrite: true`).
- `block` — one or more blocking issues. The draft must not send. The blocking axis is named; the suggested fix is included.

The output format is in `references/4-sample-output.md`.

## Output format

Literal JSON the skill emits for a `block` verdict:

```json
{
  "verdict": "block",
  "result": "ok",
  "blocking_issues": [
    {
      "axis": "claim_accuracy",
      "finding": "Ungrounded claim: 'I saw your Series B announcement last week'. No entry in prospect_evidence supports a recent Series B.",
      "fix": "Remove the claim or attach a citation to prospect_evidence and re-run."
    }
  ],
  "edit_flags": [
    {
      "axis": "voice",
      "finding": "Stock opener detected: 'I hope this email finds you well'",
      "fix": "Replace with a grounded opener tied to a specific entry in prospect_evidence."
    }
  ],
  "personalization_score": 3,
  "rewritten_draft": null,
  "qa_metadata": {
    "model": "claude-sonnet-4-6",
    "input_tokens": 2840,
    "output_tokens": 420,
    "rubric_version": "1.0.0"
  }
}
```

A `send` verdict has empty `blocking_issues` and empty `edit_flags`. An `edit` verdict has empty `blocking_issues` and a populated `edit_flags` (plus `rewritten_draft` when `request_rewrite: true`).

## Cache-key convention

The four rubric files are stable across calls within a deployment. To use Claude prompt caching:

- Cache prefix: the concatenation of `references/1-claim-rubric.md` + `references/2-personalization-rubric.md` + `references/3-compliance-rubric.md` + `references/4-sample-output.md` is the cacheable prefix. Mark it with `cache_control: { type: "ephemeral" }` in the Anthropic SDK call.
- The variable suffix is the draft, the prospect evidence pack, and the recipient context.
- Expected cost reduction at production volume: 30-50% on input tokens. At 50,000 calls per month and an average 2,500 input tokens, that is roughly $1,500/month in savings against Sonnet 4.x list pricing.

## Watch-outs

- **False blocks on legitimate AI-pulled specifics.** If the upstream AI SDR retrieved a recent press release the evidence pack does not include, the skill flags the claim as ungrounded. **Guard:** the skill verifies against the supplied evidence pack only, never against model knowledge. The contract is that the AI SDR includes everything it used to write the draft in the pack. The fix is upstream, not loosening the rubric.
- **Personalization score gaming.** A skill that rewards specificity teaches the upstream model to stuff specific-looking tokens. **Guard:** grounded and ungrounded specifics score separately. A named entity counts only if a citation in the pack supports it; a stale specific without a current-employment citation is ungrounded.
- **Compliance creep across jurisdictions.** Different rules per recipient. **Guard:** per-jurisdiction profiles; missing context returns `insufficient_compliance_context` rather than falling back to a generic profile.
- **The skill becomes the bottleneck.** At 50,000 sends per month and a 3-second p95 per draft, serial QA adds roughly 42 hours of wall-clock. **Guard:** parallelize per-draft (20-50 in flight), cache the rubrics, alert when p95 climbs above 5 seconds.
- **Hallucinated compliance.** The skill could claim a header is present when it is not. **Guard:** the skill requires the calling agent to pass `email_headers` or set `headers_compliant: true` — it does not infer header state from the body.
