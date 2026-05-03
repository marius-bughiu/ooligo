# Summary format by audience — TEMPLATE

> The contract-summary skill renders one of the templates below
> depending on the `audience` input. Replace the bracketed placeholders
> with your firm's preferred section names if your house style differs;
> the section *order* is what matters for reader scannability.

The skeleton is shared across audiences (Parties / Term / Key
obligations / Key money flows / Renewal / Termination). Only the
**Watch-outs** block changes by audience — that is where the skill
applies the question library from `1-audience-question-library.md`.

## Exec template

```markdown
# Contract summary — {Counterparty} / {Contract type} ({Effective date})

> Audience: exec
> Source: {filename}, {N} pages, executed {date}
> Prepared by: contract-summary skill (Claude). Not legal advice.

## What this commits us to (one paragraph)

{2-3 sentences. What the deal is, what we get, what we owe, in plain
English. No legalese.}

## Parties / Term / Money / Renewal / Termination

{Standard blocks per the SKILL.md output format.}

## Watch-outs for exec

- **{Lock-in length}** — {worst-case end date if all auto-renewals
  trigger}. Action: {decision the exec must make on day one to control
  this}.
- **{Unusual clause}** — {one-sentence why this is unusual}. Action:
  {ask counsel; consider re-negotiating before signing}.
- **{Operational obligation requiring exec attention}** — {one
  sentence}. Action: {assign owner; add to OKRs}.
```

## Ops template

```markdown
# Contract summary — {Counterparty} / {Contract type} ({Effective date})

> Audience: ops
> Source: {filename}, {N} pages, executed {date}
> Prepared by: contract-summary skill (Claude). Not legal advice.

## What we owe them, on what cadence

{Bulleted list of recurring obligations: deliverables, reports,
notices, with §refs and the calendar trigger.}

## What they owe us, on what cadence

{Bulleted list, same shape.}

## Parties / Term / Money / Renewal / Termination

{Standard blocks.}

## Service levels and remedies

| SLA | Threshold | Measurement window | Remedy | §ref |
|---|---|---|---|---|
| {e.g. uptime} | {99.5%} | {monthly} | {service credit X%} | §{ref} |

## Named contacts

| Role | Our side | Their side | §ref |
|---|---|---|---|
| Account contact | {name/title} | {name/title} | §{ref} |
| Escalation | {name/title} | {name/title} | §{ref} |
| Notices (legal) | {address} | {address} | §{ref} |

## Watch-outs for ops

- **{Reporting cadence not yet wired}** — {one sentence}. Action:
  {add to ops calendar / assign owner}.
- **{Notice obligation that requires formal delivery}** — {one
  sentence}. Action: {set up the delivery channel before the trigger
  date}.
- **{Audit cooperation requirement}** — {one sentence}. Action:
  {brief security / IT lead}.
```

## Finance template

```markdown
# Contract summary — {Counterparty} / {Contract type} ({Effective date})

> Audience: finance
> Source: {filename}, {N} pages, executed {date}
> Prepared by: contract-summary skill (Claude). Not legal advice.

## Cash flow profile (initial term)

| Period | Amount | Cadence | Notes |
|---|---|---|---|
| Year 1 | {amount} | {monthly/etc} | {notes} |
| Year 2 | {amount} | ... | {escalator applied} |
| Year 3 | {amount} | ... | ... |

## Payment terms

- Net terms: {Net X} (§{ref})
- Payment method: {ACH / wire / card} (§{ref})
- Currency: {USD / EUR / etc.} (§{ref})
- FX risk: {who bears it, if cross-currency} (§{ref})
- Late payment: {interest rate, grace period} (§{ref})

## Price escalation

- Mechanism: {CPI / fixed % / market reset} (§{ref})
- Cap: {amount or "uncapped — exposure"}
- First escalation date: {date}

## Renewal pricing

- Pricing on renewal: {locked / market / capped escalator} (§{ref})
- Notice deadline: {date}
- Worst-case renewal cost: {modeled amount over typical renewal term}

## Tax treatment

- Sales/VAT: {who pays, rate, jurisdiction} (§{ref})
- Withholding: {applicable? rate?} (§{ref})

## Watch-outs for finance

- **{Uncapped escalator}** — {one sentence}. Action: {model worst case
  in budget; flag for re-negotiation at renewal}.
- **{Auto-renewal with locked-in price increase}** — {one sentence}.
  Action: {add notice deadline to procurement calendar}.
- **{Withholding tax obligation}** — {one sentence}. Action: {confirm
  AP team has the right tax forms}.
```

## Last edited

{YYYY-MM-DD}
