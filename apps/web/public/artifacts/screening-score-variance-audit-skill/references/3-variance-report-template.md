# 3 — Variance report template

The scaffold the skill fills. Two sections at the end are load-bearing: the remediation list, which names the next fix, and the not-established list, which stops the report being read as a clean bill of health.

Replace every `<>` placeholder. A placeholder left in the delivered report means that number was never computed, and a reader has no way to tell the difference unless it is still visibly a blank.

---

## Header

```
SCREENING SCORE VARIANCE AUDIT
req:            <req id> "<req title>"
screener:       <product> <version>
model:          <exact model id>       sampling: <set N / not exposed / cannot be set>
rubric:         <version>              parser: <version>
run window:     <start> to <end>
sample:         <K> candidates (<band> band, <hi> high anchor, <lo> low anchor) x <N> runs = <calls> evaluations
distinct raw payloads: <d> of <calls>          <- if d = 1, the run is void; see freeze sheet §D
cutoff audited: <effective cutoff>  (<how it was derived>)
```

Scope line, verbatim from `2-sample-frame.md` step 4:

```
These numbers describe req <> , screened by <> version <> against rubric <> ,
between <> and <> . They do not transfer to another req, another rubric
version, or another model snapshot.
```

## Per-criterion decomposition

`within-SD` is the average across candidates of each candidate's standard deviation over its N runs. `between-SD` is the standard deviation across candidates of their per-candidate means.

```
criterion              within-SD   between-SD   share of total spread   verdict
<name>                    <>           <>              <>%             working
<name>                    <>           <>              <>%             DEAD
<name>                    <>           <>              <>%             NOISY
TOTAL                     <>           <>             100%
```

Verdict rules, applied mechanically:

- `NOISY` — within-SD is at least as large as between-SD. The criterion moves more between runs of one candidate than it does between candidates.
- `DEAD` — between-SD is under 5% of the total's between-SD. The criterion returns near-identical values for everyone. It adds no ranking signal and pads the reliability denominator with a constant.
- `working` — neither.

A `DEAD` verdict on a zero-variance criterion is the finding most likely to be argued with, because a column of identical numbers reads as precision. Note in-line how many of the K candidates received the identical value; "full marks for 39 of 40" ends the argument faster than the standard deviation does.

## Flip rate at the cutoff

Computed on **single draws**. There is deliberately no field here for the standard error of the mean: production takes one draw and decides, so an average of N runs describes a procedure nobody runs.

```
candidates with at least one flip across N runs:  <> of <K>
worst candidate:  <ref>, <k>/<N> runs pass       (flip rate <>%)
flip interval:    scores <lo> - <hi>
anchors that flipped: <> of <hi+lo>              <- any non-zero value is a loud finding
```

Per-candidate detail, band candidates only:

```
candidate    mean    min   max   runs passing   flip rate
<ref>         <>     <>    <>       <>/<N>         <>%
```

## Recommendation

```
cutoff:               <>    (<changed / unchanged, and why>)
manual-review band:   <lo> - <hi>
band rule applied:    <2-SD rule / empirical rule>   <- name the more conservative one
throughput cost:      <>% of applications -> ~<n> manual reviews per req at <applications per req>
```

The throughput number goes in applications, not percentages. "12% of applications" gets nodded at; "48 resumes a week, by hand, per req" gets a decision. If nobody will staff it, say so in the report and recommend widening the automated reject threshold instead — fewer decisions then ride on a coin flip, which is the actual goal. A band nobody works is worse than no band, because it launders the same automated decision through a queue that reads as human review.

## Remediate first

Ordered by each criterion's share of total spread, so the largest reducible source of noise is always the top line.

```
1. <criterion> — within-SD <> is <>% of the total's spread.
   Fix: <split into checkable sub-questions / drop from the weighted total / re-word>
2. <criterion> — contributes <>% of ranking signal.
   Fix: <>
```

For a `NOISY` criterion, resist adding rubric text. The public HackerRank teardown found its noisiest criterion was `projects` — the one with the most detailed rubric and worked examples. More guidance on an open judgment widens the model's search rather than narrowing it. Split the judgment into questions with checkable answers, or drop it.

## Not established by this report

Copy this section unchanged. It is the guard against the report being screenshotted into a deck as a clearance.

```
- Whether the screener predicts job performance. That is validity. This audit
  measured consistency only. A perfectly consistent screener can be consistently
  measuring the wrong thing.
- Whether selection rates differ across sex, race, or ethnicity categories.
  That is a bias audit, it is a different statistic, and where NYC Local Law 144
  applies it requires an independent auditor. Nothing here discharges it.
- Whether the screener behaves the same on any other req, rubric version, or
  model snapshot. See the scope line.
```

## Expiry

```
this audit expires when any of these change:
  model id  <>            prompt version  <>
  rubric    <>            parser version  <>
re-run trigger recorded with: <owner / ticket / change-management hook>
```

An audit with no expiry hook becomes a permanent artifact describing a configuration that shipped over months ago. Wire the re-run to whatever gates prompt changes; if nothing gates them, that is the first finding.
