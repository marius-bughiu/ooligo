# Timeline reconstruction template

> This template defines the event types the skill recognizes when reconstructing
> a deal timeline from Gong transcripts and Salesforce activity history.
> Add or remove rows to match what your team actually tracks.
> The skill maps raw input text to these event types before sorting chronologically.

## How the skill uses this file

- Each event type in the "Recognized events" table is a pattern the skill looks for in Gong transcripts and CRM notes when reconstructing the timeline.
- The "Key moments" list is the set of signals the skill flags as high-weight — these are the events most likely to carry a loss reason or decision signal. Adjust the list if your team tracks different signals.
- Events not matching any recognized type are bucketed as `other` with the raw text preserved.

## Recognized event types

| Event type | Source(s) | How the skill recognizes it |
|---|---|---|
| call_discovery | Gong | Call title or notes contain "discovery", "intro", "first call", "qualification call". |
| call_demo | Gong | Call title or notes contain "demo", "product walk", "technical review", "walkthrough". |
| call_pricing | Gong | Call title or notes contain "pricing", "commercial", "proposal review", "negotiation". |
| call_final_decision | Gong | Call title or notes contain "final", "decision", "bake-off", "last call", "executive sponsor". |
| email_proposal | CRM / Gong | CRM note or Gong snippet references a proposal, MSA, SOW, or contract being sent. |
| stage_change | Salesforce | Stage field updated — captured in `stage_history` from deal metadata. |
| competitor_mention | Gong / CRM | Competitor name or phrase "evaluating other options", "bake-off", "comparing vendors" appears. |
| champion_signal | Gong / CRM | Notes reference internal champion role change, departure, or loss of authority. |
| stall_signal | Gong / CRM | Multi-week gap with no activity, or note containing "going dark", "no response", "pushed". |
| budget_signal | Gong / CRM | Notes or transcript contain "budget freeze", "budget cycle", "no budget", "CFO approval". |
| other | Any | Any datable event not matching the above patterns. |

## Key moments (high-weight signals)

The skill treats these as the highest-weight moments when classifying loss reason:

1. The final scheduled call before closed-lost (typically `call_final_decision`).
2. Any `competitor_mention` event.
3. Any `champion_signal` event.
4. The first `stall_signal` — when the deal started going quiet.
5. Any `budget_signal` that appeared after the proposal was sent (pre-proposal budget signals are expected friction; post-proposal signals are a deal risk).

## Last edited

{YYYY-MM-DD} — by {RevOps team member name}
