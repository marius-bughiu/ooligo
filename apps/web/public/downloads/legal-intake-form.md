# Legal intake form and routing worksheet

Copy the blank sections for each request. Keep the example at the end as a reference. This English worksheet can be used in a text editor or copied into a ticket. The routing table illustrates one team's policy. Replace the roles and authority limits with your own.

## 1. Requester fills this in

| Field | Your entry |
| --- | --- |
| Request ID (keep the same ID when adding details) | [ID] |
| Requester, business unit, work contact | [name, team, contact] |
| Decision or help requested | [specific question] |
| Request type and counterparty | [type, organization] |
| Business event and requested review date | [event, date, consequence of delay] |
| Contract version and controlled document reference | [document/version and location accessible to the reviewer] |
| If relevant: proposed start, first renewal, notice period | [dates, units, exact clause, anything still unknown] |
| If relevant: amount and currency | [amount, currency or unknown] |
| Prior approvals, open questions or dependencies | [who confirmed what, what remains unanswered] |

Keep the actual contract and sensitive details in the approved matter system. Provide its controlled reference here. If an input is missing, say what is missing and who can supply it.

## 2. Intake coordinator assigns the next action

| Condition in this example policy | Status | Who acts next | What to record |
| --- | --- | --- | --- |
| Missing information prevents an informed review | Waiting for requester | Requester supplies the missing item; intake coordinator follows up | Specific question, requester, next update |
| Complete request for review of a supplier agreement | Assigned for review | Named commercial counsel | Reviewer, draft version, requested decision |
| A proposed concession requires an exception | Decision pending | Person authorized by the playbook | Exact term, permitted range, reason, decision owner |
| Reviewer communicates a decision | Update or close | Intake coordinator | Outcome and scope, who decided, when and next action |

Assignment only identifies the next reviewer. Record commercial or legal exceptions and signature authority separately. Follow your organization's policy for incidents or restricted matters.

## 3. Coordinator's record

| Request ID | Status | Review owner | Next action owner | Missing input or decision | Next update | Outcome, authority and date |
| --- | --- | --- | --- | --- | --- | --- |
| [ID] | [status] | [name] | [name] | [question] | [when to update requester] | [pending, or decision and who made it] |

## Worked example · JH-042

All organizations, people, clauses and dates below are fictional. Juniper Harbor is the buyer and Alder Relay is its SaaS vendor.

**Completed requester section, as of October 6**

| Field | Example entry |
| --- | --- |
| ID and requester | JH-042 · Maya Chen, Procurement · maya.chen@juniperharbor.example |
| Question for counsel | Which nonrenewal notice term can Procurement propose to Alder Relay? |
| Business event and requested review | Procurement wants a position for its October 9, 2026 vendor discussion. |
| Draft reference | JH-042 / Alder Relay MSA v1 / renewal clause, in the restricted matter folder. |
| Contract dates and term | Proposed start December 1, 2026; proposed first renewal December 1, 2027; vendor asks for notice 90 calendar days before renewal. |
| Remaining decision | Priya Shah to review the vendor's term against the buyer's playbook. No exception or signature approved. |

| Date | What happened | Next action |
| --- | --- | --- |
| October 5, 2026 | Maya Chen in Procurement submits Alder Relay's MSA, v1. She asks Legal to review its 90-calendar-day nonrenewal notice by October 9. The proposed start and first renewal dates are missing. | The coordinator records “Waiting for requester” and asks Maya for both dates on JH-042. |
| October 6, 2026 | Maya confirms the proposed start on December 1, 2026 and first renewal on December 1, 2027. | The coordinator updates the same record, assigns commercial counsel Priya Shah, and tells Maya who owns the review. |
| After assignment | Juniper Harbor's example playbook targets 30 calendar days' notice before renewal. A 45-day fallback requires Priya's explicit exception decision. | Record “Decision pending” if the 45-day option is raised. Do not record a signed agreement, an approved exception or a guaranteed turnaround. |

October 9 is the requested review date. December 1, 2026 and December 1, 2027 are proposed contract dates. None is a calculated deadline for sending notice.

## Optional n8n field map

Use the separate [Ooligo router download](https://ooligo.com/en/workflows/legal-request-intake-router-n8n/) only if your team wants to configure and test its own workflow. The Markdown form does not send anything. The example reviewer, statuses, case history and exception authority live in the matter tracker.

| Worksheet information | Form webhook field |
| --- | --- |
| Request ID, requester contact, unit | `submission_id`, `requester_email`, `business_unit` |
| Request type, question, context | `request_type_hint`, `summary`, `detail` |
| Counterparty, requested review date | `counterparty`, `needed_by` |
| Optional value already expressed in USD | `claimed_value_usd` |

Illustrative intake payload after Maya supplies the dates:

```json
{
  "submission_id": "JH-042",
  "requester_email": "maya.chen@juniperharbor.example",
  "business_unit": "Procurement",
  "request_type_hint": "vendor_contract",
  "summary": "Review Alder Relay MSA v1 nonrenewal notice",
  "detail": "Vendor proposes 90 calendar days of notice before renewal. Proposed start 2026-12-01; proposed first renewal 2027-12-01. Procurement requests review before its October 9 decision.",
  "counterparty": "Alder Relay",
  "needed_by": "2026-10-09"
}
```

The normalization step reads those webhook fields. Start and renewal dates are business facts in `detail`; the router has no dedicated field or decision rule for either date. Do not rely on the export to apply this fictional routing table. Configure its database, credentials and your own assignment rules, then exercise the relevant branches with fictional requests before using it for real work. [Router setup notes](https://github.com/marius-bughiu/ooligo/blob/main/apps/web/public/artifacts/legal-request-intake-router-n8n/_README.md)
