# 4 — Sample memo and field contract

The `memo_markdown` field is the deliverable a human reads. Structure is fixed: decision first, the axis that drove it second, the arithmetic third, what would change the answer last. Do not lead with methodology — a reader who trusts the method will not read it, and a reader who does not will read it before the number either way.

Both memos below are literal output. Copy the structure, not the values.

---

## Sample A — `kill`

```markdown
# AI SDR pilot: kill

**Decision: do not renew.** Scored 2026-06-29 against criteria registered 2026-04-28, before the first send. Criteria hash verified; no amendments.

## What drove it

The sending domain's spam complaint rate reached 0.34% in the 14 days after the last pilot send, crossing the 0.30% bulk-sender line. Baseline before the pilot was 0.08%. This is a hard stop independent of the economics: the cost of crossing it is borne by every mailbox the company sends from, including billing and support, and it is not on this pilot's ledger.

Two economic axes were also outside threshold. Fully-loaded cost per qualified meeting came in at 851 against a registered ceiling of 750, and rework ran 5.9 hours per qualified meeting against a ceiling of 3.0, with a worsening trend across the six weeks.

## The arithmetic

42-day window, 14-day tail. 34 meetings attributed by the vendor; 11 excluded (7 on accounts with an open opportunity at booking, 4 with human contact inside the prior 90 days); 19 held; 12 qualified after the 30-day stage-advance gate.

| Line | Value |
|---|---|
| Subscription (annual, prorated) | 5,178 |
| Data and enrichment (bundled) | 0 |
| Sending infrastructure (bundled) | 0 |
| Implementation (amortized over 12 months) | 700 |
| Rework (71 hours at 85) | 6,035 |
| **Total** | **11,913** |

Cost per qualified meeting: **851**. The subscription-only figure is **370** — that is the number in the vendor's business case, and the 481 gap is almost entirely the rework line.

Reply-to-meeting was inside threshold at 6.1% against a floor of 5.0%, and improving. Positive replies were labeled by the vendor's own classifier and discounted by the default factor, unaudited.

## What would change the answer

Nothing available inside this contract term. The reputation reading is a hard stop and would need a full baseline recovery plus a re-run at lower volume on isolated domains before the economics are worth re-testing. If that re-test is worth running, it needs its own pre-registration, separate sending domains, and a volume cap set below the level at which the complaint rate moved.

Note also that 32% of vendor-attributed meetings were on accounts already in cycle or recently human-touched. That ratio is a sourcing finding on its own and would not improve with a discount.
```

---

## Sample B — `extend`

```markdown
# AI SDR pilot: extend, 4 weeks

**Decision: extend for four weeks at current volume, then re-score.** Scored 2026-06-29 against criteria registered 2026-04-28. Criteria hash verified.

## What drove it

One axis outside threshold: rework at 3.8 hours per qualified meeting against a ceiling of 3.0. It is falling — 5.9 in weeks one and two, 3.4 in weeks five and six — which is the pattern of a team learning the tool rather than a tool that does not converge. Reputation is well inside its line, with the tail window at 0.09% against a 0.08% baseline.

## The arithmetic

Cost per qualified meeting: **604** against a ceiling of 750, on 18 qualified meetings from 41 attributed and 9 excluded. Reply-to-meeting 7.2% against a 5.0% floor, on an audited classifier precision of 0.86 from a 60-reply stratified sample.

## What would change the answer

Rework at or below 3.0 hours per qualified meeting across the four extension weeks, with cost per qualified meeting holding under 750 and the tail spam rate staying under 0.10%. If rework flattens above 3.0 rather than continuing to fall, this becomes a kill — the extension is testing the trend, not waiting for a better mood.

Volume is held flat deliberately. This memo scores the configuration at 2,000 contacts per month. Any increase invalidates the reputation reading and requires re-scoring at the new volume.
```

---

## Field contract for parsers

| Field | Type | Notes |
|---|---|---|
| `verdict` | `keep` / `extend` / `kill` / `null` | `null` only when `checkpoint: true` |
| `result` | string | `ok`, `no_preregistration`, `criteria_amended`, `insufficient_sample`, `incomplete_cost_model` |
| `retrospective` | boolean | `true` when `registered_at` does not precede `window_start` |
| `axes[].status` | `inside` / `outside` / `hard_stop_crossed` | `hard_stop_crossed` only on `reputation_delta` |
| `axes[].trend` | `improving` / `flat` / `worsening` | Absent on `reputation_delta`, which reports windows instead |
| `path_to_keep` | object | Present only on `extend` |
| `memo_markdown` | string | Always present when `result` is `ok` |

A non-`ok` `result` carries a populated diagnostic field and a `null` verdict. Never render a memo for a non-`ok` result — surface the diagnostic and the specific field that caused it, because "the tool would not score this" is a legible outcome and a fabricated verdict is not.
