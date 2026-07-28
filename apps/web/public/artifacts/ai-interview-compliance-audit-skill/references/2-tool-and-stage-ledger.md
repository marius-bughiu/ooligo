# Tool and stage ledger

Fill this out before the first run. It is the input the classification step reasons over, and it is the artifact that makes a later audit reproducible. Replace every `REPLACE_` value.

## Part A — Requisitions in scope

Jurisdiction attaches by where the job is located and where the candidate applies from, not by where the company is headquartered. A remote-eligible req attaches every state in its accepted-candidate list.

| Req ID | Title | Work locations | Remote-eligible states accepted | Volume (applicants/mo) | Status |
|---|---|---|---|---|---|
| REPLACE_ENG-411 | Backend Engineer | New York, NY | US-wide except CO | 400 | open |
| REPLACE_SLS-102 | Account Executive | Chicago, IL | IL only | 120 | open |
| REPLACE_OPS-220 | RevOps Analyst | Remote US | CA, NY, IL, TX | 60 | planned |

If a req's accepted-state list is "anywhere in the US," write that out and expect the matrix to attach every jurisdiction in `1-jurisdiction-matrix.md`. That is usually the finding, not a formality.

## Part B — Tool ledger

One row per tool that touches a candidate between application and offer. Include tools you did not buy for screening but that score or rank anyway — ATS match scores and sourcing-tool fit scores are the ones teams forget.

| Tool | Stage | What it outputs | Who sees it and when | Does it gate a transition? | Threshold | Video/audio analysis? | Vendor's own label |
|---|---|---|---|---|---|---|---|
| REPLACE_HireVue | async video screen | competency scores 1-5 | recruiter, before advance/reject | no auto-advance; recruiter decides | none | yes | "decision support" |
| REPLACE_Greenhouse | application review | match score, sorts the list | recruiter, list is worked top-down | no | none | no | "ranking aid" |
| REPLACE_vendor | resume screen | pass/fail | nobody; auto-rejects | yes | score under 60 auto-rejects | no | "efficiency filter" |

### The four classification questions

Answer from configuration. The vendor's label goes in its own column and is never the answer.

1. **Does the output gate a stage transition automatically, at any threshold?** An auto-reject threshold is the clearest case.
2. **Does it sort or rank a list a recruiter works top-down?** Rank order changes who gets reviewed at all when volume exceeds review capacity. Record the review-capacity number — "400 applicants, recruiter reviews the top 40" is the fact that matters.
3. **Does a human see the score before making the call?** A score presented before the decision is a different fact from a score available afterward on request.
4. **Does it analyze video or audio for characteristics used to evaluate fitness?** Independent of the other three, and it is what pulls the Illinois AI Video Interview Act in for Illinois-based positions.

### Configuration facts to capture per tool

- Where the score appears in the recruiter's interface, and whether it can be hidden.
- Whether the score is recorded on the candidate record and for how long.
- Whether the vendor retrains on your candidate data, and whether that is contractually disclaimed.
- Which sub-processors receive candidate video or audio. This is the list the Illinois destruction obligation reaches.
- Who at the vendor can access candidate video, and under what contractual limit.

## Part C — Review-capacity reality

Fill this in honestly; it decides whether a ranking tool is functionally a filter.

| Req | Applicants/mo | Applications actually reviewed by a human | Effective filter rate |
|---|---|---|---|
| REPLACE_ENG-411 | 400 | 40 | 90% never human-reviewed |

A ranking tool with a 90% effective filter rate is doing decision-making work regardless of what the configuration screen calls it. Record this and let the classification step use it.
