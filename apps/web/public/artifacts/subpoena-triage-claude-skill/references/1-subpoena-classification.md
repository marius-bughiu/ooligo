# Subpoena classification rubric (firm template)

The triage skill classifies incoming subpoenas per this rubric. Copy and customize for the firm's counsel ownership and procedure.

## Classification by type

### Civil third-party subpoena (firm is non-party witness)

- **Counsel owner:** Senior in-house counsel, litigation specialist if available.
- **Jurisdiction rules:** FRCP Rule 45 (federal) or state equivalent. Default 14-day response window for objections.
- **Routing:** legal-ops opens matter, counsel reviews, paralegal prepares response.
- **Common posture:** comply with reasonable scope, object to overbroad, prepare privilege log.

### Civil party subpoena (firm is party)

- **Counsel owner:** Outside litigation counsel (per matter assignment).
- **Jurisdiction rules:** Per the case's scheduling order; party subpoena timelines differ from third-party.
- **Routing:** outside counsel leads; in-house supports document collection.

### Grand-jury subpoena (federal investigation)

- **Counsel owner:** General Counsel + outside criminal-defense counsel (default per firm policy).
- **Confidentiality:** restricted handling. Do NOT write to standard tracking systems; counsel determines storage per matter.
- **Jurisdiction rules:** F.R.Crim.P. Rule 17 (federal). Tight response windows; objections require court motion.
- **Routing:** GC notified within 24 hours; outside criminal counsel engaged immediately.

### Regulatory subpoena (SEC, DOJ civil, state AG, FTC, etc.)

- **Counsel owner:** Senior in-house counsel (regulatory focus) + outside regulatory counsel.
- **Subtype by agency:**
  - SEC enforcement → SEC enforcement counsel
  - DOJ civil → DOJ civil counsel
  - State AG → in-house government-affairs counsel + outside (jurisdiction-specific)
  - FTC → competition counsel
- **Jurisdiction rules:** Per agency rules; SEC has its own subpoena power under Securities Exchange Act §21(a).
- **Routing:** GC notified within 4 hours.

### Foreign legal-process

- **Counsel owner:** International counsel (per firm's international footprint).
- **Procedure:** Hague Convention on Taking of Evidence (1970), letters rogatory, EU evidence regulation, etc.
- **Routing:** Halt skill triage; escalate to international counsel for procedure determination.

### Law-enforcement request

- **Subtypes:**
  - **Search warrant** — court-ordered, less latitude to object. Counsel reviews scope, supervises execution.
  - **National Security Letter (NSL)** — gag order may apply; restricted handling per firm policy.
  - **Pen-register / Trap-and-trace** — limited to non-content metadata; counsel reviews scope.
  - **2703(d) order** — court order for stored communications; counsel reviews ECPA implications.
  - **Subpoena (administrative)** — IRS, USPS, etc. Counsel reviews jurisdiction.
- **Counsel owner:** GC + outside (criminal or civil per request type).
- **Routing:** GC notified immediately for warrants; within 24 hours for other types.

## Document-category taxonomy

The firm's standard categories for tagging subpoena requests:

| Category | Description | Typical custodians |
|---|---|---|
| Contracts | Commercial agreements, MSAs, NDAs, employment, vendor | Legal, deal team, procurement |
| Communications-internal | Email, Slack, SMS, video meeting recordings | Custodian-specific |
| Communications-external | Email and other comms with third parties (counsel, customers, vendors) | Custodian-specific; legal flagged |
| Financials | Transaction records, invoices, payment data, accounting records | Finance, accounting |
| Tax records | Returns, schedules, supporting documents | Finance, tax, outside CPA |
| Technical specifications | Source code, design docs, technical specifications | Engineering |
| HR records | Personnel files, comp data, performance reviews | HR, People Ops |
| Marketing materials | Marketing collateral, public statements, advertising | Marketing |
| Customer records | Customer data, support tickets, account history | Customer Success, Support |
| Other | Catchall — surface for taxonomy expansion | TBD |

## Overbroad-request flags

The skill flags requests with any of:

- "All documents related to" without temporal limit
- "All communications" without scope (party / topic)
- Time period exceeding the firm's records-retention policy (typically 7 years for most categories)
- Custodian count >10 implied
- Production-volume estimate >100 GB

## Counsel routing matrix

Per type × jurisdiction:

| Type | Federal | State | Foreign |
|---|---|---|---|
| Civil third-party | Litigation counsel | Litigation counsel | International counsel |
| Civil party | Per case assignment | Per case assignment | Per case assignment |
| Grand-jury | GC + outside criminal | n/a | n/a |
| Regulatory (SEC) | SEC enforcement counsel | n/a | n/a |
| Regulatory (DOJ civil) | DOJ civil counsel | n/a | n/a |
| Regulatory (state AG) | n/a | Government-affairs + state-specific counsel | n/a |
| Regulatory (FTC) | Competition counsel | n/a | n/a |
| Law-enforcement | GC + criminal counsel | GC + criminal counsel | International counsel |

The skill's classification step references this matrix for the routing recommendation.

## How to update this rubric

When the firm hires new counsel, restructures the legal team, or expands into new jurisdictions:

1. Update the counsel-owner column for affected types.
2. If a new agency is encountered, add a row to the regulatory subtype list with the agency-specific counsel and procedure.
3. Document the change in the rubric file's changelog. The audit log captures the SHA per triage; rubric changes are visible in retrospect.
