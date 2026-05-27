# Claim rubric — TEMPLATE

> Replace this file's contents with your team's calibrated thresholds.
> The ai-sdr-draft-qa skill reads this file before every run. A blank or
> default version is usable, but the defaults below are conservative and
> will likely over-block on a high-volume SMB deployment.

## What counts as a claim

A claim is any factual assertion the draft makes about the prospect, the prospect's company, or a public event referenced as context. Examples:

- "I saw your Series B announcement last Tuesday." → claim about a funding event.
- "Your team just hired three data engineers." → claim about a hiring event.
- "Since you moved to Snowflake in March." → claim about the prospect's current employment.
- "Your CEO mentioned the migration on the Lenny podcast." → claim about a public statement.

Not a claim (do not extract):

- Generic industry observation ("RevOps teams are spending more on signal tools").
- A question to the prospect ("Are you still running the manual scoring on weekly leads?") — this is a question, not an assertion.
- A statement about the sender ("We worked with three companies in your space last quarter").

## The evidence-pack contract

`prospect_evidence` is an array of entries shaped:

```json
{
  "source": "linkedin_profile|crunchbase|company_blog|news_api|gong_call|crm_note|press_release",
  "retrieved_at": "ISO 8601 timestamp",
  "claim_text": "the literal evidence supporting the claim",
  "citation_url": "https://... (optional but recommended)"
}
```

The upstream AI SDR is responsible for emitting this pack alongside the draft. If a claim in the draft cannot be matched to any entry, the claim is ungrounded.

## Matching rules

A claim is **grounded** if at least one evidence entry meets all three:

1. **Entity match.** Same person, company, product, or event named in the claim and the evidence.
2. **Fact match.** Consistent fact (a "Series B" claim matched against a Series B entry, not a Series A entry).
3. **Freshness.** `retrieved_at` is within the per-fact-type freshness window:
   - Company-level facts (HQ, employee band, public funding stage) — 90 days.
   - Hiring or product-launch facts — 30 days.
   - Prospect employment or role — 60 days.

A grounded claim outside the freshness window is downgraded to `stale_grounded` and surfaced as an edit-tier finding (suggested fix: refresh the evidence pack and re-run, or remove the time-sensitive specific).

## Thresholds

```yaml
claim_block_threshold: 1      # number of ungrounded claims that trips a block verdict
stale_grounded_block_threshold: 3   # number of stale_grounded findings that escalate from edit to block
```

The conservative default of 1 ungrounded claim → block surfaces every hallucinated claim. Raise to 2 only if you are tolerant of some hallucinated rate in exchange for fewer blocks (high-volume SMB deployments selling at low ACV may justify this).

## What the skill does NOT do

The claim rubric is a verifier, not a fact-checker. It does not call out to the live web, hit news APIs, or query LinkedIn. It only verifies the draft against the supplied evidence pack. If the upstream AI SDR's enrichment was wrong (the pack itself contains a hallucinated Series B), the skill will treat the claim as grounded. The fix lives upstream — pick an enrichment vendor whose retrieval the skill can trust.

## Last edited

{YYYY-MM-DD} — by {RevOps team member name}
