# 2 — Sample frame

The sample decides what the audit can conclude. A convenience sample — the last 40 applications, or the 40 the recruiter remembers — produces numbers that describe that accident rather than the screener.

Pull from a **closed req** with real applications. Synthetic resumes score differently from real ones, and the difference is not a constant you can subtract back out.

## Step 1 — Establish the effective cutoff

Write down what actually gates the stage, which is rarely the number in the configuration screen.

```
config threshold field:        ______
applications per req:          ______
how many a human actually reads: ______
effective cutoff:              ______
what it gates:  ☐ auto-reject  ☐ auto-advance  ☐ recruiter works a sorted list top-down
```

If a recruiter works the top 40 of a ranked list of 410, the effective cutoff is the 40th score. Rank-ordering is a filter whatever the settings page calls it, and auditing the unused threshold field measures nothing.

## Step 2 — Estimate the band half-width

You need a rough score spread before you can pick band candidates, and you do not have one yet. Bootstrap it: pick any 3 applications near the cutoff and run each 5 times (15 calls, a few cents). Take the largest of the three per-candidate standard deviations, call it `s0`.

```
pilot candidate 1 scores: ___ ___ ___ ___ ___    SD: ____
pilot candidate 2 scores: ___ ___ ___ ___ ___    SD: ____
pilot candidate 3 scores: ___ ___ ___ ___ ___    SD: ____

s0 (largest)     = ______
band half-width  = 1.5 x s0 = ______
```

If all 15 pilot scores are identical, do not celebrate. Go back to `references/1-harness-freeze-sheet.md` §D and confirm you are not reading a cache. Only after distinct raw payloads are confirmed does an identical set mean the screener is stable.

## Step 3 — Fill the three strata

Default K is 40. Every row needs a first-pass score before it can be assigned to a stratum.

### Band — 24 candidates

First-pass score inside `effective cutoff ± band half-width`. These are the only candidates whose outcome can flip, so they carry the decision-relevant signal.

| # | candidate ref | first-pass score | distance from cutoff |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| … | | | |
| 24 | | | |

### High anchors — 8 candidates

First-pass score at least `3 x s0` **above** the cutoff.

| # | candidate ref | first-pass score |
|---|---|---|
| 1 | | |
| … | | |
| 8 | | |

### Low anchors — 8 candidates

First-pass score at least `3 x s0` **below** the cutoff.

| # | candidate ref | first-pass score |
|---|---|---|
| 1 | | |
| … | | |
| 8 | | |

## Why the anchors are not optional

Reliability is between-candidate variance divided by total variance. Sample only from a narrow band around the cutoff and the between-candidate term is truncated by construction — every candidate has nearly the same score, because that is how you selected them. The ratio then collapses toward zero and the screener reads as far worse than it is.

The skill refuses to emit a reliability ratio with fewer than 6 anchors on either side. It emits the flip rates alone and prints the reason, because flip rates survive a truncated sample and the ratio does not.

The anchors carry a second job: an anchor that flips is a much louder finding than a band candidate that flips. A candidate 3 standard deviations clear of the cutoff should never land on the wrong side. If one does, the spread is not normal-shaped and step 6's 2-sigma band rule will under-protect — the empirical rule takes over.

## Step 4 — Record the scope line

This sentence goes verbatim into the report header. It is the guard against the audit being quoted about a req it never touched.

```
These numbers describe req ________ , screened by ________ version ________
against rubric ________ , between ________ and ________ .
They do not transfer to another req, another rubric version, or another model snapshot.
```

## Sample-size variants

| Situation | K | N | Calls | Why |
|---|---|---|---|---|
| Default internal decision | 40 | 15 | 600 | SD interval ~0.73-1.58x |
| Number goes to counsel or a regulator | 40 | 30 | 1,200 | SD interval ~0.80-1.34x |
| Per-screen vendor SKU, tight budget | 36 | 6 | 216 | 24 band + 6 anchors each side; wider interval, stated in the report |
| Screener returns total only, no criteria | 40 | 15 | 600 | Step 4 of the method is skipped; report says so |
