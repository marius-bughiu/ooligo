# Escalation criteria — TEMPLATE

> Rules that decide when the contract-redline skill stops proposing redlines
> and instead routes the clause (or the whole contract) to a human attorney.
>
> The skill loads this file every run. If a clause matches any rule below,
> the skill emits an escalation block in the output instead of a tracked
> change. The reviewer sees the original text, the trigger, and "needs human
> attorney." This is the single most important guardrail in the skill —
> every entry below exists because a prior run silently produced a wrong
> redline that should have been escalated.
>
> Replace this template's contents with your firm's actual rules and keep
> the IDs (`ESC.001`, `ESC.002`, etc.) stable for citation in output.

## Allowed-vendors list (precondition)

The skill refuses to run unless the configured AI model appears in this list.
This guards against privilege leakage to a non-Tier-A vendor.

- Anthropic Claude (via API or Claude.ai with the firm's enterprise tenant)
- {Add other Tier-A vendors with signed BAAs / DPAs covering legal-work product}

If the model is not on this list, the skill exits with: "Configured model
{name} is not on the firm's Tier-A allowed-vendors list. Run aborted."

## Per-clause escalation rules

### `ESC.001` — Out-of-playbook clause type

Trigger: the clause does not match any entry in `1-playbook-template.md`.
Action: escalate. Do not propose a redline; the playbook does not encode a
position to fall back on.

Common examples: source-code escrow, most-favored-nation pricing, exclusivity
periods > 12 months, insurance-coverage requirements above firm standard,
data-residency requirements naming a specific country, audit rights with
unannounced on-site inspections.

### `ESC.002` — Novel defined term

Trigger: the proposed redline (after fallback substitution) introduces a new
defined term not present in the playbook or the original contract.
Action: escalate. New defined terms cascade through the rest of the contract
and the skill cannot reason about cascade effects.

### `ESC.003` — Non-US jurisdiction in deal_context

Trigger: `deal_context.jurisdiction` is set to any non-US value.
Action: escalate every Limitation of Liability, IP, indemnification, and
warranty clause. These positions are jurisdiction-sensitive and the playbook
encodes US-law assumptions only.

### `ESC.004` — EU/UK personal data without DPA exhibit

Trigger: contract or `deal_context` mentions EU/UK data subjects AND no DPA
exhibit is attached.
Action: escalate the entire data-protection section to human attorney.
The skill does not propose a DPA from scratch; it only swaps yellow-zone
DPA-exhibit-attached language for the firm-standard DPA reference.

### `ESC.005` — Conflicting overlapping clauses

Trigger: two or more clauses in the same contract appear to address the
same playbook entry (e.g. two Limitation of Liability sections, or
confidentiality language in both the body and an exhibit).
Action: escalate both clauses. Do not propose redlines; the skill cannot
reason about which clause controls in case of conflict.

### `ESC.006` — Bespoke instrument

Trigger: contract type classified as "other" in step 1.
Action: escalate the entire contract. Do not attempt clause-level redlines.

### `ESC.007` — Final-round draft signal

Trigger: the document filename, header, or first paragraph contains the
strings "v3", "round 3", "final draft", "execution copy", or comparable.
Action: escalate the entire contract. The playbook encodes opening positions,
not late-stage concession patterns.

### `ESC.008` — Counterparty-supplied form with no track-changes acceptance

Trigger: counterparty draft is from a counterparty's standard form (clauses
labelled "Customer Standard Terms," "Vendor Master Agreement," or similar)
AND counterparty profile flags "low willingness to redline."
Action: escalate. The skill flags every red-zone clause but does not propose
redlines; the human attorney makes the call on which battles to pick.

### `ESC.009` — Regulated-industry overlay

Trigger: `deal_context.regulatory` includes any of: HIPAA, FedRAMP, PCI-DSS,
SOX, FINRA, FDA-regulated.
Action: escalate every clause touching data handling, audit, breach
notification, sub-processing, and termination. The playbook does not encode
regulator-specific carve-outs.

### `ESC.010` — Confidence drop

Trigger: the skill's clause-classification step produces a confidence score
below the threshold (default: model self-reported "low confidence" or
inability to cite a playbook section ID).
Action: escalate the clause. Better to over-escalate than to silently
mis-classify.

## What to do with escalations

Each escalation block in the output names the trigger by ID. The reviewer's
SOP:

1. Read each escalation block.
2. Decide: handle inline (write the redline yourself), route to outside
   counsel, or accept the counterparty's clause as-drafted.
3. If the same `ESC.xxx` rule fires repeatedly across deals, that's a signal
   the playbook is missing coverage. Update `1-playbook-template.md` to add
   the clause type so the next run handles it autonomously.

## Last edited

`{YYYY-MM-DD}` — bump on every material edit.
