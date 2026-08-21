---
name: screening-score-variance-audit
description: Measure how much your AI candidate screener's score moves when the same application is scored repeatedly, decompose the movement per rubric criterion, and convert it into a defensible cutoff plus a manual-review band. Reports the single-draw flip rate at your cutoff — the probability an identical application clears the bar on one run and fails on the next — not the standard error of an average nobody uses in production. Produces a measurement report, never a validity or fairness conclusion.
---

# Screening score variance audit

## When to invoke

Use this skill when an AI screener produces a numeric score, a rank, or a pass/fail on candidate applications, and that output gates a stage — auto-advance, auto-reject, or a recruiter working a sorted list top-down. It answers one question: how much of the score is the candidate, and how much is the draw.

The trigger is usually one of four. A screener is about to go live and someone asked what the cutoff should be. A recruiter noticed the same candidate scoring differently across two reqs. Counsel asked whether the score is reproducible. Or a vendor quoted a reliability figure computed on their data, and you need one computed on yours.

Inputs are a re-runnable screener and a candidate sample. The skill drives replications, then reads the resulting score matrix.

Do NOT invoke this skill for:

- **The bias audit.** NYC Local Law 144 requires an independent auditor and measures selection rates across sex, race, and ethnicity categories. That is disparate impact. This is consistency. A screener can be perfectly consistent and still produce a selection-rate disparity, and it can be wildly inconsistent with no measurable disparity at all. The two audits share no statistics. Running this one does not discharge that duty.
- **Proving the screener works.** Reliability is not validity. A criterion that returns the same number on every run and the same number for every candidate is perfectly stable and measures nothing — see the `experience` case in step 4. This skill can tell you a score is noise. It cannot tell you a stable score is signal.
- **Deterministic screeners.** Keyword matching, boolean filters, and rules engines return the same output on the same input by construction. Run one 3-run sanity check; if all three agree exactly, stop.
- **Screeners you cannot re-run without writing to the candidate record.** See the third watch-out. Get a sandbox first.
- **A stack already under a charge or demand letter.** At that point the score history is discovery material and counsel drives. Generating a parallel internal variance study of the same decisions creates a document you did not need.

## Inputs

- Required: `screener` — a callable that takes one application and returns the score payload, with the rubric criteria broken out and not only the total. An API endpoint, a CLI, or a sandbox job. If the screener returns only a total, say so at invocation; the skill drops step 4 and marks the report accordingly.
- Required: `harness_freeze` — the pinned configuration the replications run against, filled from `references/1-harness-freeze-sheet.md`. Model ID, prompt version, rubric version, parsing code, and the sampling settings the endpoint actually accepts.
- Required: `sample` — the candidate applications and their first-pass scores, framed per `references/2-sample-frame.md`.
- Required: `cutoff` — the score that gates the stage today, and what it gates. Give the real operating number, not the configuration default. If a recruiter works the top 40 of a ranked list of 400, the effective cutoff is the 40th score, not the threshold field.
- Optional: `n_runs` — replications per candidate. Defaults to 15. Raise to 30 when the number goes to counsel or a regulator; see step 3.
- Optional: `criteria_weights` — the rubric's weighting, if the total is not a plain sum.

## Reference files

- `references/1-harness-freeze-sheet.md` — what to pin before the first replication, and the cache-defeat checklist that stops the run from measuring zero variance for the wrong reason.
- `references/2-sample-frame.md` — the stratified sample template: band candidates, high anchors, low anchors, and why the anchors are not optional.
- `references/3-variance-report-template.md` — the output scaffold, with the per-criterion table, the flip-rate table, and the two statements the report is not allowed to make.

## Method

Six steps. The order matters: the harness freezes before anything runs, because a variance number computed across two prompt versions measures your deploy history rather than your screener.

### 1. Freeze the harness, and record what the endpoint will not let you fix

Fill `references/1-harness-freeze-sheet.md`. Pin the model ID exactly — a floating alias that resolves to a new snapshot mid-run splits the sample into two populations without announcing it.

Then record the sampling regime honestly, because there are three and they license different claims:

- **Temperature is set and settable.** Record the value. A low temperature narrows the output distribution; it does not close it.
- **Temperature is not exposed** by the vendor's screening product. Record it as unknown and treat the endpoint as the black box it is.
- **Temperature cannot be set at all.** On current frontier Claude models — Claude Opus 5, Opus 4.8, Opus 4.7, Sonnet 5, and Fable 5 — `temperature`, `top_p`, and `top_k` were removed from the Messages API, and a request carrying them returns a 400. If your screener runs on one of those, "we pinned temperature to 0" is not a statement anyone can make about it, and a vendor who claims it is describing a different model than the one they are running.

One more line goes on the sheet, because it is the fact that makes this audit necessary rather than paranoid: **temperature 0 is not determinism.** Thinking Machines Lab sampled 1,000 completions from Qwen3-235B-A22B-Instruct-2507 at temperature 0 with greedy decoding and got 80 distinct completions, first diverging at token 103. The cause is not floating-point luck — inference kernels are not batch-invariant, so the reduction tree a request runs through depends on how many other requests shared its batch. Their batch-invariant kernels do produce 1,000 identical completions, at roughly 1.6x the wall clock after optimization (26s to 42s on Qwen3-8B for 1,000 sequences). No hosted screening product ships them. Your screener's score depends, in small part, on how busy the endpoint was.

### 2. Frame a stratified sample, not a convenience sample

Pull K candidates per `references/2-sample-frame.md`. Default K is 40, split three ways:

- **24 in the band** — candidates whose first-pass score sits within roughly 1.5 points of the cutoff for every 1 point of expected score spread. These are the only candidates whose outcome can flip, so they carry the decision-relevant signal.
- **8 high anchors** and **8 low anchors** — candidates well clear of the cutoff in each direction.

The anchors are the part teams skip, and skipping them breaks the arithmetic rather than merely weakening it. Reliability is between-candidate variance divided by total variance. Sample only from a narrow band around the cutoff and you have truncated the between-candidate term by construction, so the ratio collapses toward zero and the screener looks worse than it is. The skill refuses to emit a reliability ratio when the sample has fewer than 6 anchors on either side; it emits the flip rates alone and says why.

Use real applications from a closed req. Synthetic resumes score differently, and the difference is not a constant you can subtract out.

### 3. Run N replications per candidate, and pick N for the interval you need

Default N is 15. That is not a round number chosen for comfort — it is where the estimate of the within-candidate spread becomes worth quoting. For a normal sample, the 95% confidence interval on a standard deviation estimated from 15 runs spans about 0.73 to 1.58 times the estimate. Wide, and honest about it. At 30 runs it tightens to about 0.80 to 1.34.

So: 15 when the output drives an internal cutoff decision, 30 when someone outside the team will quote the number back at you. Going past 30 buys little — the interval narrows with the square root of N, and the fourth digit of a noise estimate is not the constraint on the decision.

Run the replications independently. Do not batch a candidate's 15 runs into one prompt and ask for 15 scores; the model conditions on its own earlier answers and the spread you measure will be far narrower than production, where every application arrives cold.

### 4. Decompose per criterion before touching the total

The total's spread is an aggregate, and aggregates hide the two distinct pathologies that need different fixes. For each criterion, compute the within-candidate standard deviation (averaged across candidates) and the between-candidate standard deviation, then classify:

- **Noisy** — high within-candidate spread. The criterion is unstable and drags the total around. Its rubric language is the thing to fix.
- **Dead** — near-zero between-candidate spread. The criterion returns the same value for everyone. It is perfectly stable, contributes nothing to ranking, and inflates the apparent reliability of the total by padding the denominator with a constant.
- **Working** — low within, meaningful between.

The public HackerRank hiring-agent teardown shows both pathologies in one rubric. Running an unchanged resume PDF through it 100 times on `gemma3:4b` at temperature 0.1 returned totals from 66 to 99 out of 100. Underneath that: `technical skills` returned 8/10 on 98 of the 100 runs — working. `experience` returned 25/25 on every single run, which reads as rock-solid and is in fact dead, because it awards full marks position-agnostically and therefore never separates two candidates. And `projects`, the criterion with the most detailed rubric and the worked examples, was the noisiest of the set. More rubric text did not buy more stability.

That last observation is the one to carry into remediation: a criterion is unstable because it asks for a judgment the model resolves differently on different draws, and adding paragraphs of guidance to an open judgment widens the search rather than narrowing it. Split it into checkable sub-questions or drop it.

### 5. Compute the flip rate on single draws — never on the mean

This is the step that makes the audit useful, and the step every spreadsheet version gets wrong.

The audit has N scores per candidate. The temptation is to report the standard error of that mean, which shrinks by the square root of N and yields a reassuring figure. It is the wrong statistic, because production does not average 15 runs. Production takes exactly one draw and decides. The decision-relevant spread is the single-draw spread, undivided.

For each candidate, compute the empirical flip rate: the share of the N runs landing on the minority side of the cutoff. Report the maximum across the sample, the count of candidates with any flip at all, and the score interval those candidates occupy. That interval is the honest width of the machine's indecision.

The public example again, because it shows how completely cutoff placement drives the answer: with the score distribution ranging 66 to 99 and an 85-point cutoff, the same resume was rejected on about 65% of runs and accepted on the rest. The same teardown's second configuration — `Gemini-3.1-flash-lite`, 50 runs, scores clustered 45 to 65 — put the failure rate at 28% against a 60-point cutoff. Same class of instability, wildly different decision consequences, because the cutoff sat in a different part of the density. This is why a vendor-supplied reliability coefficient cannot answer your question: the number that matters is a joint property of their model and your cutoff.

### 6. Emit a cutoff and a manual-review band

The output is two numbers and a routing rule.

Set the manual-review band to the cutoff plus and minus twice the pooled within-candidate standard deviation. Everything inside the band routes to a human. Everything outside keeps its automated disposition.

The 2-sigma choice is the standard normal-approximation argument: for a candidate whose true score sits exactly at a band edge, a single draw lands on the wrong side of the cutoff about 2.3% of the time. But screener scores are usually not normal — they clump hard on rubric integers, as the 8/10-on-98-runs case shows — so the skill computes the empirical rate at the band edge as well and widens the band to whichever rule is more conservative. The report states which rule bound it.

Then state the throughput cost in applications, not in percentages, because that is the number the recruiting manager will push back on: with 400 applications per req and a band that catches 12% of them, someone reviews 48 applications by hand per req. If nobody will, the band is theatre, and the honest move is to widen the automated reject threshold instead, so fewer decisions ride on a coin the machine flipped.

## Output format

```
SCREENING SCORE VARIANCE AUDIT — req ENG-2291 "Senior Backend Engineer"
Harness: acme-screener v4.2 / claude-haiku-4-5 / rubric r7 / temperature 0.1
Sample: 40 candidates (24 band, 8 high anchor, 8 low anchor) x 15 runs = 600 evaluations
Cutoff audited: 78 (effective; config field reads 70, recruiter works top 40 of ~410)

PER-CRITERION
  criterion            within-SD   between-SD   verdict
  technical_skills          0.4          2.1    working
  experience                0.0          0.1    DEAD — full marks for 39/40 candidates
  projects                  3.8          2.4    NOISY — within exceeds between
  communication             1.1          1.7    working
  TOTAL                     4.6          5.2

FLIP RATE AT CUTOFF 78 (single draw, not mean)
  candidates with any flip across 15 runs: 11 of 40
  worst candidate: c-0318, 7/15 runs pass  (flip rate 47%)
  flip interval: scores 71 - 86

RECOMMENDED
  cutoff:              78  (unchanged — the cutoff is not the problem)
  manual-review band:  69 - 87  (empirical rule; 2-SD rule gave 69-87, same width)
  throughput cost:     ~14% of applications -> ~57 manual reviews per req at n=410

REMEDIATE FIRST
  1. projects — within-SD 3.8 is 83% of the total's spread. Split into checkable
     sub-questions or drop from the weighted total.
  2. experience — contributes 0 ranking signal. Removing it changes no ordering
     and stops it inflating the reliability of the total.

NOT ESTABLISHED BY THIS REPORT
  - whether the screener measures job performance (validity — not tested)
  - whether selection rates differ across protected categories (LL 144 bias
    audit — different statistic, independent auditor required)
```

## Watch-outs

- **Reporting the standard error of the mean.** It shrinks with N, it looks great, and it describes a procedure your production screener does not run. Guard: the report template has no field for it, and step 5 computes flip rates from raw single draws only.
- **Caching returning zero variance.** If the screener sits behind a result cache keyed on candidate ID, the replications return stored answers and the audit concludes the screener is perfectly stable. This failure is silent, and it is the most likely way this audit produces a confidently wrong answer. Guard: `references/1-harness-freeze-sheet.md` requires distinct request IDs across runs and a recorded count of distinct raw payloads before any statistic is computed. If all N payloads are byte-identical, the run is a cache test, not a variance test. Caching the *prompt prefix* is fine and cuts cost sharply — cached input reads bill at roughly a tenth of the input rate — because prefix reuse does not remove sampling variance. It is result-level caching that destroys the measurement.
- **Re-running live candidates through the production screener.** Fifteen replications of a real applicant can write 15 score events onto that person's record, fire 15 webhook deliveries into the ATS, and in the worst case send automated rejection mail 15 times. Guard: run against a sandbox req or a staging instance, and confirm before the first replication that the screener call is side-effect free. If it is not, this audit is blocked until it is — that is the correct outcome, not a reason to proceed carefully.
- **Auditing one req and generalizing.** Spread is a property of the rubric plus the model plus the applicant pool, and a req with a tight pool produces different between-candidate variance than an open one. Guard: the report names the req in its header, and the template's scope line states that the numbers bind to that req only.
- **Treating a stable score as a good score.** The `experience` case is the whole warning: 25/25 on every run for nearly every candidate. Guard: the per-criterion table always shows between-SD next to within-SD, and the skill labels a low-between criterion `DEAD` rather than leaving a zero to be read as excellence.
- **Letting the band become permanent.** A manual-review band is a mitigation for a screener you have not fixed. Guard: the report's remediation list is ordered by each criterion's share of total spread, so the next fix is always named, and the header carries the harness version so the audit's expiry is visible the moment the prompt changes.
