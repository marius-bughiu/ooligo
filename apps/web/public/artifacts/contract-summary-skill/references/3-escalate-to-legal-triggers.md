# Escalate-to-legal triggers — TEMPLATE

> When the contract-summary skill detects any of the patterns below,
> it stops summarizing the affected line and emits a
> `Counsel review required` block at the top of the output, naming
> the trigger and the §reference. The skill never paraphrases over
> these patterns; over-summarization here is the highest-risk failure
> mode. Replace the placeholder thresholds with your firm's actual
> escalation criteria — the defaults are a conservative starting
> point.

## Hard triggers (always escalate)

| Pattern | Why it triggers | What the summary emits |
|---|---|---|
| Uncapped liability or "no cap on indemnity for X" | Unbounded exposure | "COUNSEL REVIEW REQUIRED — uncapped liability at §{ref}" |
| Liability cap < 6 months of fees | Unusually low cap | Block + cap stated verbatim |
| Mutual indemnity replaced with one-way (against us) | Asymmetric risk | Block + clause stated verbatim |
| MFN ("most favored nation") clause | Constrains future deals | Block + §ref |
| Unilateral termination for convenience (counterparty only) | We can be exited at will | Block + notice period |
| Change of control without consent | Blocks M&A | Block + §ref |
| Exclusivity or non-compete on us | Limits future business | Block + scope and duration |
| IP assignment beyond deliverables | Over-broad IP transfer | Block + scope |
| Personal guarantee | Individual on the hook | Block + §ref |
| Choice-of-law in counterparty-favorable jurisdiction without arbitration | Litigation venue risk | Block + jurisdiction |
| Auto-renewal > 12 months with notice window < 90 days | High regret risk | Block + the dates |

## Soft triggers (escalate if combined)

Any single one of these does not force an escalation, but two or more
in the same contract trigger a `Counsel review recommended` (lower
severity than `required`):

- Termination for cause without a cure period
- "Sole discretion" wording in an obligation that affects us
- Defined terms used before they are defined
- References to schedules / exhibits that are not attached
- Currency or governing law mentioned inconsistently across sections
- Notice obligations requiring physical mail or specific carriers
- Audit rights without scope or frequency limits
- Data-handling obligations citing standards not named in the
  contract (e.g. "industry-standard practices" with no definition)

## Ambiguity triggers (replace line with "Ambiguous — see legal")

The skill does not paraphrase past these — it leaves the gap visible
so legal review fills it in:

- Two sections appear to conflict on the same point (e.g. term ends
  on different dates in different clauses)
- A defined term is used but never defined
- A monetary amount is given in two different units or currencies
- Dates are inconsistent (e.g. effective date later than first
  payment date)
- A signature block is missing or incomplete
- The contract refers to a counterparty entity name that does not
  match the parties block

## Output format for an escalation block

```markdown
> COUNSEL REVIEW REQUIRED before acting on this summary.
> Trigger(s):
> - {Trigger name} (§{ref}): {one-line description}
> - {Trigger name} (§{ref}): {one-line description}
> Do not rely on any line of this summary as legal interpretation.
> Counsel should review the cited sections before sign-off.
```

## Last edited

{YYYY-MM-DD}
