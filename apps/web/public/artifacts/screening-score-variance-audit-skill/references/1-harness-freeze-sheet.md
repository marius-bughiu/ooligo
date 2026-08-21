# 1 — Harness freeze sheet

Fill this before the first replication runs. Everything below is a fact about the configuration the audit's numbers will describe. If any of it changes mid-run, the run is void — restart rather than patch, because a spread computed across two configurations is a measure of your deploy history.

```
frozen_at:      2026-__-__T__:__      # timestamp of the freeze, not of the report
frozen_by:
req_id:                               # the audit binds to one req; see watch-out 4
audit_owner:
```

## A. Screener identity

| Field | Value | Notes |
|---|---|---|
| Product / service name | | vendor product, or internal service name |
| Version or build | | the exact deployed build, not "latest" |
| Prompt version | | commit SHA or vendor prompt ID |
| Rubric version | | the criteria list the scores decompose into |
| Response parser version | | a parser change moves scores without the model moving |
| Scoring scale | | e.g. 0-100 total, 4 criteria |
| Criteria weights | | leave blank if the total is a plain sum |

## B. Model and sampling regime

Pin the model ID **exactly**. A floating alias (`-latest`, an unversioned product name) that resolves to a new snapshot part-way through 600 calls silently splits your sample into two populations.

| Field | Value |
|---|---|
| Model ID (exact string) | |
| Model ID is pinned, not a floating alias | ☐ yes ☐ no |
| Hosting | ☐ vendor SaaS ☐ our API key ☐ self-hosted |

Then tick exactly one sampling regime. They license different claims, and writing down which one applies is the point of this section:

- ☐ **Settable and set.** `temperature = ______`, `top_p = ______`. A low temperature narrows the output distribution. It does not close it.
- ☐ **Not exposed.** The vendor's screening product gives no sampling controls. Record as unknown and treat the endpoint as a black box. This is the most common case for bought screeners, and it is not a blocker — the audit measures the endpoint you actually run.
- ☐ **Cannot be set.** The model rejects sampling parameters outright. On current frontier Claude models — Claude Opus 5, Opus 4.8, Opus 4.7, Sonnet 5, Fable 5 — `temperature`, `top_p`, and `top_k` were removed from the Messages API and a request carrying them returns a 400. If a vendor tells you they pinned temperature to 0 on one of these, ask which model they are actually running.

**Determinism note, to be copied into the report verbatim:** temperature 0 does not mean reproducible. Thinking Machines Lab sampled 1,000 completions from Qwen3-235B-A22B-Instruct-2507 at temperature 0 with greedy decoding and got 80 distinct completions, diverging first at token 103, because inference kernels are not batch-invariant — the reduction tree depends on how many other requests shared the batch. Batch-invariant kernels fix it at roughly 1.6x wall clock, and no hosted screening product ships them.

## C. Side-effect clearance — blocking

Every box must be ticked before replication 1. A "no" anywhere blocks the audit; it does not license care.

- ☐ The screener call writes **no** score event to the candidate record
- ☐ The screener call fires **no** webhook into the ATS
- ☐ The screener call sends **no** candidate-facing mail
- ☐ The screener call increments **no** metered billing counter, or the cost is accepted and budgeted below
- ☐ The run targets a sandbox req / staging instance, **or** the four boxes above are all confirmed on production

Environment used: ______________________

## D. Cache-defeat checklist — blocking

A result cache keyed on candidate ID returns the stored answer to every replication, and the audit reports perfect stability. This is the single most likely way this audit produces a confidently wrong answer, and it produces no error while doing it.

- ☐ Result-level caching is disabled for the audit path, **or** each replication carries a cache-busting field the screener ignores for scoring
- ☐ Each replication carries a distinct request ID, and the IDs are logged
- ☐ After the run: count of **distinct raw response payloads** = ______ out of ______ total calls

If distinct payloads = 1, stop. You measured a cache. Fix the path and re-run.

Prompt-*prefix* caching is fine and is worth leaving on — cached input reads bill at roughly a tenth of the input rate, and prefix reuse does not remove sampling variance. Only result-level caching destroys the measurement.

## E. Run budget

Fill before starting so nobody discovers the bill afterwards. Default plan is 40 candidates x 15 runs = 600 evaluations.

| Field | Value |
|---|---|
| Candidates (K) | 40 |
| Replications (N) | 15 |
| Total evaluations | 600 |
| Cost per evaluation | $ |
| **Total estimated cost** | $ |
| Concurrency | |
| Estimated wall clock | |

Two cost regimes, and they differ by orders of magnitude:

- **Own API key.** A screening prompt of roughly 6,000 input and 800 output tokens costs about $0.01 per evaluation on Claude Haiku 4.5 ($1.00 / $5.00 per million input / output tokens) — about **$6** for the full 600-call run. On Claude Opus 5 ($5.00 / $25.00 per million) the same prompt runs about $0.05 per evaluation, or about **$30**. Either is a rounding error against one bad hire.
- **Per-screen vendor SKU.** If the screener bills per assessment at, say, $2, then 600 evaluations is **$1,200**. That is the reason K is 40 and not 400. Negotiate audit-mode calls, or drop N to 15 and K to 24 band candidates plus 6 anchors each side (216 calls) and accept the wider interval.

## F. Sign-off

```
harness frozen and side-effect cleared:  ______________  date: __________
cache-defeat verified post-run:          ______________  date: __________
```
