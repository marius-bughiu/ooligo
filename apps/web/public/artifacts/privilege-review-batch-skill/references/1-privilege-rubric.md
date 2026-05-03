# Privilege rubric — TEMPLATE

> Replace this template's contents with the matter's real privilege rubric
> before running the skill on production documents. The skill reads this
> file on every batch; without the matter's actual rubric, the
> classification output is generic and will mis-call attorney-client
> communications.
>
> Update `last_reviewed` on every material change so calibration runs can
> tell when the rubric drifted relative to a prior review pass.

## Matter context

- **Matter name**: {e.g. "Acme v. Beta — commercial litigation"}
- **Matter ID**: {internal docket / matter management ID}
- **Privilege standard in force**: {`attorney-client` | `work-product` | `both`}
- **Lead jurisdiction**: {e.g. `us-federal` — must match the `jurisdiction` input passed to the skill}
- **Last reviewed**: {YYYY-MM-DD}
- **Rubric owner**: {name, role — the attorney who signs off on rubric changes}

## Attorney custodian list

Every name and email here counts as an attorney for the purposes of attorney-client analysis. Use the email address that appears on the production metadata, lowercased. The skill resolves `author` and each `recipient` against this list in step 1.

### In-house attorneys

| Name | Title | Email | Bar admission(s) | Period covered |
|---|---|---|---|---|
| {Name} | General Counsel | {first.last@acme.com} | {state(s)} | {YYYY-MM to present} |
| {Name} | Senior Counsel | {first.last@acme.com} | {state(s)} | {YYYY-MM to YYYY-MM} |
| {Name} | Compliance Counsel | {first.last@acme.com} | {state(s)} | {YYYY-MM to present} |

### Outside counsel

| Firm | Attorney | Email | Matter scope | Period engaged |
|---|---|---|---|---|
| {Firm name} | {Name} | {name@firm.com} | {matter scope} | {YYYY-MM to YYYY-MM} |
| {Firm name} | {Name} | {name@firm.com} | {matter scope} | {YYYY-MM to present} |

### Paralegals and legal staff (working under attorney supervision)

Communications routed through these custodians count as privileged when the supervising attorney is also on the document or the communication is clearly in furtherance of legal advice.

| Name | Role | Email | Supervising attorney |
|---|---|---|---|
| {Name} | Paralegal | {email} | {supervising attorney name} |

## Subject-matter scope

Communications fall within the matter's privilege scope when they touch any of the following subjects. List the specific topics — generic terms like "legal matters" do not constrain the rubric usefully.

- {Specific subject 1 — e.g. "the Beta Corp commercial dispute, including contract interpretation, damages analysis, and litigation strategy"}
- {Specific subject 2 — e.g. "regulatory inquiries from the FTC related to the 2024 acquisition"}
- {Specific subject 3}

Communications outside this scope, even between attorney and client, are generally NOT privileged and should be classified `not-privileged` unless another basis applies.

## Privilege circle

The set of internal personnel whose presence on a communication does NOT break privilege. Anyone outside this circle on a recipient line is a waiver indicator and triggers the `potential_waiver` route in step 3.

- {Role pattern 1 — e.g. "C-suite officers"}
- {Role pattern 2 — e.g. "VPs and Directors of Legal, Finance, HR for matters touching their function"}
- {Role pattern 3 — e.g. "Board members for board-level matters"}

Specific named individuals in the privilege circle (override the role pattern when needed):

- {Name, title, scope}
- {Name, title, scope}

## Waiver indicators

The skill flags any of the following as `potential_waiver` and routes to the borderline queue rather than classifying.

- Recipient outside the privilege circle
- External email domain (not `@{your-domain}.com` or `@{outside-counsel-domain}.com`) on the to / cc line
- Subject line contains "FYI", "FW:", or "FWD:" combined with an external recipient (forwarded privileged content to outside party)
- Document is a final / executed contract (privilege generally does not attach to the document itself, only to the attorney advice about it)
- Document was filed publicly with a court or regulator
- Communication is with a public-facing PR or communications agency

## Work-product test triggers

Used only when `privilege standard in force` is `work-product` or `both`. The skill applies this test in step 2 when the attorney-client test does not fire on its own.

A document qualifies for work-product protection when ALL of:

1. It was prepared in anticipation of litigation or for trial
2. The litigation was reasonably anticipated at the time of preparation (not just a generic "we might get sued someday")
3. The document was prepared by or at the direction of an attorney, OR by a party representative whose work the attorney directed

The matter's anticipation-of-litigation date: {YYYY-MM-DD or "see litigation hold notice dated {date}"}. Documents created before this date generally do not qualify under the work-product doctrine.

## Always-route document types

Document types that always go to the borderline queue regardless of classification confidence. The skill checks `metadata_csv.doc_type` against this list in step 3.

- `settlement_communication`
- `mediation_brief`
- `expert_report_draft`
- `litigation_hold_notice`
- {add matter-specific types}

## Calibration sample

For the first 100 documents per batch, the skill samples results into the borderline queue regardless of confidence so the matter team can spot-check before relying on the broader output. Adjust the sample size here if the matter requires a different calibration cadence.

- Sample size: 100
- Sample policy: every 1 in N high-confidence calls after the first 100 (default N = 50)

## Last edited

{YYYY-MM-DD}
