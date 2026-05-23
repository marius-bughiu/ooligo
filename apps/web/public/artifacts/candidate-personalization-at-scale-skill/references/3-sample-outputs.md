# Sample outputs — for review calibration and sequence wiring

> Three literal examples of what the skill emits for fictional candidates.
> Use these when calibrating recruiter review quality, when building acceptance
> criteria for the sequence enrollment step, and when wiring downstream parsers.

## Output 1 — high confidence (GitHub signal)

```markdown
# Personalization — Alex Rivera (alex.rivera@example.com)

**Signal used:** GitHub — pinned repo "pgvector-cache" (1,200 stars), Rust implementation, last commit 2025-11-08
**Confidence:** high
**JD match:** Infrastructure Engineer (vector search, Rust required)

## Subject line

pgvector-cache + what we're building at [Company]

## Opening paragraph

Your pgvector-cache library — specifically the write-through caching layer you shipped in November — solves exactly the read-latency problem we're hitting at [Company] as we scale our embedding store past 100M vectors. We're hiring for the infrastructure engineer role that owns this layer, and I'd like to share what the next 12 months look like before you see another generic recruiter message. Worth 25 minutes?

---

_Signal source: GitHub public repo (pgvector-cache) | Confidence: high | Fallback used: no_
```

## Output 2 — medium confidence (LinkedIn-only signal)

```markdown
# Personalization — Priya Nair (priya.nair@example.com)

**Signal used:** LinkedIn — role bullet at DataCo: "Rebuilt the real-time feature pipeline handling 2M events/sec, reducing P99 latency from 800ms to 140ms"
**Confidence:** medium
**JD match:** Staff Data Engineer (streaming pipelines, Kafka, latency reduction)
**Recruiter note:** Verify this bullet is current — LinkedIn role end date: present, but role title changed 8 months ago.

## Subject line

The DataCo pipeline work + our streaming infrastructure role

## Opening paragraph

The 2M events/sec latency reduction you described in your DataCo role is the exact problem class we're working on — our Kafka-based pipeline is hitting comparable bottlenecks at 3M events/sec and we're rebuilding the consumer layer. I'm hiring for a staff engineer role that owns this work, and I'd rather send you the architecture diagram than a job description. Worth a 20-minute call?

---

_Signal source: LinkedIn role bullet (DataCo) | Confidence: medium | Recruiter review required: verify bullet is current_
```

## Output 3 — low confidence (generic fallback)

```markdown
# Personalization — Jordan Lee (jordan.lee@example.com)

**Signal used:** none (fallback)
**Confidence:** low
**Reason:** LinkedIn profile is private (headline and current company only visible). No GitHub handle provided. No recruiter notes.

## Subject line

[Recruiter: edit before send — no signal available]

## Opening paragraph

I came across your background while sourcing for our Infrastructure Engineer role and thought your experience at CloudBase was worth a direct note. I'd like to share what we're working on — it's a short conversation, and I'll keep it specific to what I think would interest you.

---

_Signal source: fallback | Confidence: low | Recruiter action required before send_
```

## Field contract for parsers

For downstream sequence enrollment, these are the stable output fields:

- `candidate_id` — pass-through of the input `candidate.email` or an ID field you supply
- `subject_line` — string, ≤ 60 characters
- `opening_paragraph` — string, ≤ 500 characters
- `signal_used` — string describing the signal (or "fallback")
- `signal_source` — enum: `github` / `linkedin_bullet` / `linkedin_headline` / `recruiter_notes` / `fallback`
- `confidence` — enum: `high` / `medium` / `low`
- `fallback_used` — boolean
- `recruiter_review_required` — boolean (true for medium and low confidence)
- `review_note` — string or null (present when `recruiter_review_required: true`)

## Batch summary output

For a batch of N candidates, the skill prepends a summary table before the per-candidate blocks:

```markdown
# Batch summary (24 candidates)

| Name | Confidence | Signal type | Fallback | Review required |
|---|---|---|---|---|
| Alex Rivera | high | github | no | no |
| Priya Nair | medium | linkedin_bullet | no | yes |
| Jordan Lee | low | fallback | yes | yes |
| ... | ... | ... | ... | ... |

---
```
