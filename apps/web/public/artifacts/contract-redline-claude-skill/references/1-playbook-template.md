# Redline playbook — TEMPLATE

> Replace this template's contents with your firm's actual red/yellow/green
> positions. The contract-redline skill reads this on every run; without
> your real playbook, every output is generic and untrustworthy.
>
> Convention: every entry has a stable ID (`LOL.001`, `IP.002`, etc.) so
> the skill can cite it in rationale strings and the reviewer can audit
> the decision in seconds.

## How to read this file

For each clause type, three columns:

- **Green (acceptable as drafted).** Do nothing. Skill leaves the clause untouched.
- **Yellow (negotiation room — propose fallback).** Skill substitutes the fallback paragraph from `2-fallback-positions.md` §<ID>.
- **Red (must-have — propose walk-away rewrite).** Skill substitutes the must-have paragraph from `2-fallback-positions.md` §<ID>.

Anything not listed below is **out-of-playbook** and goes to escalation.

## Playbook last_reviewed

`{YYYY-MM-DD}` — bump on every material edit. Skill warns if older than 90 days.

---

## Limitation of Liability — `LOL.001`

| Condition | Position |
|---|---|
| Cap ≥ 12mo fees AND ≥ USD 1M floor | green |
| Cap 6-12mo fees, no floor | yellow — propose 12mo + USD 1M floor |
| Cap < 6mo fees OR < USD 250k floor | red — must-have rewrite |
| Uncapped liability for any clause other than IP indemnity, breach of confidentiality, or willful misconduct | red |

## Indemnity — `IDM.001`

| Condition | Position |
|---|---|
| Mutual indemnity for third-party IP claims, capped at LoL | green |
| One-way indemnity (us only) for third-party IP claims | yellow — propose mutual |
| Indemnity for "any breach" or "any claim arising from the Agreement" | red — narrow to third-party IP + willful misconduct |
| Indemnity uncapped without separate uncapped basket carve-out | red |

## IP Ownership — `IP.001`

| Condition | Position |
|---|---|
| We retain ownership of pre-existing IP, customer owns customer data, work-for-hire only when explicitly scoped | green |
| Joint ownership of "improvements" or "derivative works" | yellow — propose us-owned with non-exclusive license back |
| Customer owns all IP including our pre-existing tools / methodologies | red — must-have rewrite |

## Term & Termination — `TERM.001`

| Condition | Position |
|---|---|
| Initial term ≤ 36mo, auto-renew opt-out window 30-90 days, termination for material breach with 30-day cure | green |
| Auto-renew opt-out window < 30 days | yellow — propose 60 days |
| Termination for convenience by counterparty without prorated refund | yellow — propose mutual T-for-C with refund schedule |
| No termination right for material breach | red — must-have rewrite |

## Governing Law & Venue — `LAW.001`

| Condition | Position |
|---|---|
| Delaware, New York, or our home state; venue tied to that state's courts | green |
| Counterparty's home state, US jurisdiction | yellow — propose neutral (Delaware) |
| Non-US jurisdiction (any) | escalate to human attorney; do not propose redline |
| Mandatory arbitration with class-action waiver | yellow — propose carve-out for IP injunctive relief |

## Data Protection — `DPA.001`

| Condition | Position |
|---|---|
| Standard DPA referenced as exhibit, SCCs for non-EU transfers, sub-processor list with notification | green |
| No DPA exhibit but data-handling clauses inline | yellow — propose attaching firm-standard DPA |
| EU/UK personal data + no SCCs OR no transfer impact assessment language | red — must-have rewrite |
| Any reference to GDPR with deal_context.jurisdiction = non-US | escalate |

## Confidentiality — `CONF.001`

| Condition | Position |
|---|---|
| Mutual NDA, 3-5 year survival, standard exclusions (publicly known, independently developed, etc.) | green |
| One-way NDA when we are also disclosing | yellow — propose mutual |
| Survival > 5 years for general Confidential Information (excluding trade secrets, which can be perpetual) | yellow — propose 5 years |
| No standard exclusions | red — must-have rewrite |

## Warranties & Disclaimers — `WAR.001`

| Condition | Position |
|---|---|
| Mutual warranty of authority + non-infringement, standard "as-is" disclaimer for everything else | green |
| Implied warranties of fitness/merchantability not disclaimed | yellow — propose disclaimer |
| Warranty of "uninterrupted" or "error-free" service | red — must-have rewrite |

---

## Out-of-playbook examples (for reviewer awareness)

The skill should escalate, not redline, when it sees:

- Source-code escrow clauses
- Most-favored-nation pricing clauses
- Exclusivity or non-solicitation lasting > 12 months
- Insurance coverage requirements above firm's standard policy limits
- Any clause that introduces a new defined term not in the playbook
