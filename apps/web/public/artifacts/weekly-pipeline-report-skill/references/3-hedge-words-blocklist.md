# Hedge words blocklist

> The weekly-pipeline-report skill runs a hedge-removal pass after the draft.
> If any term below appears in the brief, the skill rewrites the offending
> sentence before shipping. Extend this list whenever a hedge slips through
> in production — the file is meant to evolve.

## Why a blocklist

Hedging language drifts in because the model is being polite about
uncertain data. A weekly brief that hedges every claim is unreadable, and
the VP starts ignoring it. The blocklist enforces flat statements; the
reader pushes back if a claim is wrong, which is the correct shape of the
loop.

## Blocked phrases (rewrite required)

### Modal hedges

- may
- might
- could
- could potentially
- possibly
- perhaps
- presumably

### Epistemic hedges

- seems to
- appears to
- appears to suggest
- looks like it might
- it is unclear whether
- it is unclear if
- it is worth noting that
- it is important to note that

### Quantifier hedges

- somewhat
- relatively
- generally
- broadly
- to some extent
- in some cases
- arguably

### Qualified-recommendation hedges

- you may want to consider
- it might be worth
- one option could be
- it could be useful to
- you could potentially

### Vague intensifiers (allowed in dialog, blocked in the brief)

- significant
- meaningful
- notable

> The intensifiers above are blocked because they describe size without
> quantifying it. The brief carries every metric with a number; size words
> without numbers are noise.

## Allowed alternatives

The hedge-removal pass rewrites blocked phrases into one of these patterns:

- Replace "X may be Y" with "X is Y" (if the data supports it) or with
  "the data does not show whether X is Y" (if it does not).
- Replace "X seems to be growing" with "X grew $N WoW" or drop the claim.
- Replace "you may want to consider Z" with "Z" as an imperative, or with
  "do Z" — the brief is operational; the recommendation is the recommendation.
- Replace "significant increase" with the actual percent or dollar figure.

## Exceptions

The "Recommended ask" section may use an imperative without softening
("review the pushed-twice deals owner-by-owner"). It does not need an
allowed-alternative rewrite — the imperative is already the target shape.

## Last edited

{YYYY-MM-DD}
