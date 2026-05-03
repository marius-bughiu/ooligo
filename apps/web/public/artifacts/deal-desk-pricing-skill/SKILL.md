---
name: deal-desk-pricing
description: Review a proposed deal against pricing and discount policy and return a structured recommendation — recommended discount, rubric-cited rationale, comparable-deal evidence, and an explicit escalation flag when the ask sits outside what the rubric covers. The skill is decision support for the deal-desk reviewer; it never auto-approves, never auto-discounts, and never substitutes for the human reviewer.
---

# Deal desk pricing review

## When to invoke

Whenever an AE submits a non-standard pricing ask and a deal-desk reviewer has to decide what to counter with: a multi-year discount request, an upfront-payment-for-discount swap, a ramp structure, a custom payment term, a co-term against an existing contract. The skill takes the proposed deal terms, your discount rubric, and the comparable-deal history, and returns a structured Markdown recommendation that the deal-desk reviewer reads, edits, and decides on.

The output is a reading aid for the human reviewer. It exists to shorten the time between "AE submitted the ask" and "reviewer has the context to counter" — typically from days down to minutes for routine asks — without taking the decision away from the human.

Do NOT invoke this skill for:

- **Final approval.** The skill recommends; it does not approve. Approval authority sits with the named human approver in your DOA (delegation of authority) matrix. The skill output is an input to that decision, not a substitute for it.
- **Auto-discounting.** The skill never applies a discount to a quote or a CPQ record. It produces a recommendation the reviewer types into the quote (or rejects). Wiring auto-discount on the back of an LLM recommendation is the failure mode this skill is designed to avoid.
- **Anything skipping the deal-desk human review.** If your team has a fast-path for in-policy deals, run that fast-path through CPQ rules — not this skill. This skill exists for the asks that need judgment; bypassing the human on those is exactly the wrong place to remove a checkpoint.
- **Non-Tier-A AI vendors.** Run on Claude only (workspace or team plan whose data-handling posture you have reviewed). Pricing rubrics and comparable-deal histories are commercially sensitive; do not pipe them through consumer LLMs.

## Inputs

- Required: `deal_record` — the proposed deal as structured data (Salesforce Opportunity + Quote line items, or pasted JSON). Must include: ACV, term length, payment terms, list price per line, ask (the AE's proposed discount/structure), customer name, segment, competitive context if known.
- Required: `pricing_rubric` — the path to your team's discount rubric (defaults to `references/1-discount-rubric.md`). The skill evaluates the ask against this file deterministically; without it, the skill refuses to render.
- Required: `comparable_deals` — the path to your comparable-deal history (defaults to `references/2-comparable-deal-format.md` for schema, with a sibling CSV the user maintains). The skill pulls the closest 5-10 historical analogs and includes them as evidence.
- Optional: `escalation_criteria` — overrides the default at `references/3-escalation-criteria.md`. Use when a specific deal needs tighter triggers (e.g. a strategic logo where any non-policy ask escalates to the CRO regardless of size).
- Optional: `competitive_context` — free-text notes on competing bids, displacement target, urgency. Folded into the rationale section when present.

## Reference files

Always load the following from `references/` before producing the recommendation. Without them the skill falls back to generic advice and misses the specific thresholds, analogs, and escalation paths that make the recommendation actionable.

- `references/1-discount-rubric.md` — the discount tiers, multi-year incentive math, payment-term boundaries, and approval thresholds the skill evaluates the ask against. Replace the template with your team's actual rubric on first install.
- `references/2-comparable-deal-format.md` — the schema for the comparable-deal history. The skill pulls analogs from a sibling CSV the user maintains in the same shape; this file documents the columns and how the skill ranks "comparable."
- `references/3-escalation-criteria.md` — the trigger list that forces the skill to set the escalation flag and route to a named approver rather than recommending an in-policy counter. Tune this to your DOA matrix; the defaults are conservative.

## Method

Run these five sub-tasks in order. The skill is single-pass per section but two-pass overall: pull comparables and load the rubric first, then evaluate; then re-check against escalation triggers before rendering. Engineering choices are named below.

### 1. Load rubric and pull comparables (first, not last)

Load the discount rubric verbatim. Then query the comparable-deal history for the closest 5-10 analogs by segment, ACV band, term length, and (when present) competitive context. Pull comparables *before* evaluating the ask, not after.

Why first: pulling comparables after evaluating the ask biases the recommendation toward the rubric's nominal answer. A rubric tier might say "10% for 3-year," but if the last eight 3-year deals in this segment all closed at 14-16%, the ask is in line with precedent even if it sits outside the nominal tier. The reviewer needs both signals to counter intelligently.

If fewer than three comparables exist, record that explicitly. Do not pad the list with deals from a different segment to hit a count.

### 2. Apply the rubric deterministically

Walk every line of the proposed quote against the rubric. For each dimension (discount %, term length, payment terms, ramp structure, co-term):

- Compute whether the ask sits in-policy, exception-needed, or out-of-policy according to the rubric.
- Cite the specific rubric section that drove the classification.
- For exception-needed and out-of-policy lines, name the approver in the rubric's DOA column.

Why deterministic: the rubric is the source of truth, not the skill's judgment. The skill renders the rubric's verdict with citations; it does not reinterpret. When the rubric is silent on a dimension, the skill marks the line "rubric does not address — see escalation" rather than improvising a threshold.

### 3. Compute the recommended counter

Given the rubric verdict and the comparable evidence, produce a single recommended counter. Two engineering rules:

- The counter must hit the buyer's effective price target (or be within 2% of it) when the rubric supports a structure that gets there. Trade discount for term, trade upfront discount for ramp, trade list-price hold for payment-term concession — whichever combination the rubric and analogs support.
- The counter must be expressible as a delta from the AE's ask, not a from-scratch quote. The reviewer needs to see "your ask was X, counter Y, here's why" — not a rebuild they have to map back.

If no in-policy counter hits the buyer's target, the recommendation section says so explicitly and the escalation flag in the next step fires.

### 4. Escalation check (the human-review fallback)

Re-read the rendered recommendation against the escalation criteria. For each trigger:

- If a hard trigger fires (discount > X%, term < Y months, custom legal terms, customer on the strategic-logo list, AE has run more than N exception requests this quarter), set `escalation: required` in the output and name the approver.
- If the comparable evidence is thin (< 3 analogs) and the ask is out-of-policy on any dimension, set `escalation: required` with reason "outlier — insufficient analog evidence." Outliers go to a human who can reason about them; the skill does not invent precedent.
- If the rubric is silent on a dimension the ask touches (a new packaging, an unfamiliar geo, a new payment instrument), set `escalation: required` with reason "rubric does not cover."

Why a fallback to "needs human review": the skill is decision support, not decision-making. When the rubric or analogs cannot support a confident counter, the skill explicitly hands the decision to a human rather than picking the closest tier and hoping. The named approver receives the recommendation as context; the decision is theirs.

### 5. Render the structured recommendation

Render exactly the format below. Every line cites either a rubric section or a comparable-deal ID. Anything the rubric does not address renders as `rubric does not address`, never elided.

## Output format

Render exactly this structure. The `escalation` block at the top fires only when step 4 set the flag.

```markdown
# Deal desk recommendation — {Customer} / {Opp ID} ({Date})

> Reviewer: {deal-desk reviewer name}
> Prepared by: deal-desk-pricing skill (Claude). Decision support, not approval.
> Rubric loaded: {filename}, last edited {date}.
> Comparables pulled: {N} analogs from {segment}, {term} band.

## Escalation

- **escalation: {required | not required}**
- Approver: {named approver from DOA matrix, or "n/a"}
- Reason: {trigger that fired, or "in-policy / sufficient evidence"}

## Ask summary

| Dimension | AE ask | List | Verdict | Rubric § |
|---|---|---|---|---|
| Discount % | 22% | — | exception-needed | §3.2 |
| Term | 36 months | — | in-policy | §2.1 |
| Payment terms | Net-60 | Net-30 | exception-needed | §4.1 |
| Ramp | Y1 50% / Y2 100% | flat | rubric does not address | — |

## Recommended counter

- **Discount**: 18% (vs. AE ask of 22%) — within rubric §3.2 for
  3-year deals in this segment; comparable median is 17% (analog
  IDs: D-2284, D-2301, D-2317).
- **Term**: 36 months — matches AE ask; in-policy.
- **Payment terms**: Net-45 (vs. AE ask of Net-60) — rubric §4.1
  caps Net-X at 45 absent CFO approval; comparable median Net-30,
  but Net-45 has 3 recent precedents (D-2298, D-2310, D-2322).
- **Ramp**: defer to escalation — rubric does not cover; closest
  analog (D-2305) used a flat structure with a one-time first-year
  credit.

Effective price to buyer at counter: {$X ACV / $Y over term} — vs.
buyer target of {$Z}. Gap: {amount, % of target}.

## Comparable-deal evidence

| Analog | Segment | ACV | Term | Discount | Payment | Approved by | Notes |
|---|---|---|---|---|---|---|---|
| D-2284 | Mid-market | $180k | 36mo | 17% | Net-30 | VP Sales | Standard close |
| D-2301 | Mid-market | $210k | 36mo | 16% | Net-30 | VP Sales | Competing with X |
| D-2317 | Mid-market | $195k | 36mo | 18% | Net-45 | CRO | Strategic logo |

## Rationale

{2-4 sentences explaining the counter. Cite rubric §s and analog
IDs, not the skill's own opinion. Surface competitive context if
present in the input.}

## Reviewer notes

- {Anything the skill noticed but cannot resolve — e.g. "AE has
  submitted 4 non-policy asks this quarter, threshold is 3 — see
  escalation criteria §2"}
- {Stale-rubric warning if the rubric was last edited > 90 days ago}
```

## Watch-outs

- **Over-discounting recommendation.** The skill can produce a counter that closes the gap to the buyer's target by stacking every available concession (max discount, max term incentive, max payment-term concession). That is mathematically correct against the rubric and commercially terrible — it leaves nothing on the table for the negotiation. Guard: the recommendation section caps total stacked concessions at the lesser of (rubric ceiling) or (comparable median + one standard deviation). Anything above that fires the escalation flag with reason "stacked concessions exceed precedent."
- **Stale rubric.** Pricing policy changes quarterly, sometimes faster. A skill running against a rubric that was edited six months ago will recommend a counter the team no longer offers. Guard: the skill checks the `last_edited` date in the rubric frontmatter and prepends a "Rubric may be stale (last edited {date})" warning to the reviewer notes when the date is more than 90 days old. The reviewer is responsible for refreshing the rubric on a calendar; the skill surfaces the staleness so it does not hide.
- **Ignoring competitive pressure.** A deal where the buyer named a competitor and a tight close date deserves a different counter than a deal in a vacuum, even when the rubric verdicts are identical. Guard: when `competitive_context` is provided, the rationale section must reference it explicitly and the recommendation section must check whether any analog under comparable competitive pressure took a different shape. If `competitive_context` is absent on a deal where the AE flagged a competitor in `deal_record`, the skill prompts the reviewer to re-run with the context filled in rather than producing a context-blind counter.
- **Analog selection bias.** If the comparable-deal history is full of "we approved everything" deals, the analog evidence will rubber-stamp future asks. Guard: the skill includes the approval status of every analog (approved, rejected, lost-to-competitor, withdrawn) in the comparable-deal evidence table. The reviewer sees the approval mix and can spot the curation problem; the skill also flags "no rejected analogs in last 20" as a calibration note in the reviewer notes.
- **Recommendation cited back as approval.** Downstream readers (AE, customer, sometimes the AE's manager) sometimes treat the recommendation as the approved counter. Guard: the output header always includes "Decision support, not approval." and the escalation block names the actual approver in the DOA matrix. If the recommendation is forwarded as the counter without going through the human reviewer, the named approver line makes the process gap self-evident.
