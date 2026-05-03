# Pipeline Review — Twelve Prompts for Claude

Twelve battle-tested prompts for the questions a pipeline review actually
needs to answer. Paste a deal export, paste a prompt, get a structured
answer in your team's vocabulary.

## How to use this pack

1. Create a Claude project named "pipeline-review."
2. Drop your sales-methodology cheat sheet in as project knowledge —
   MEDDPICC, BANT, SPICED, whichever you train on. Every prompt below
   assumes that doc is loaded.
3. Save each prompt below as a saved prompt in the project, tagged by
   tier (portfolio, single-deal, meeting-prep).
4. Paste your pipeline export (or single-deal history) when invoking.

## Pipeline input shape

Most portfolio prompts expect a markdown table or CSV with these columns:

```
deal_name | account | amount | stage | days_in_stage | owner | next_step | last_activity_at | close_date | confidence
```

Single-deal prompts expect that row plus the deal's activity history
(emails, meetings, notes — chronological).

---

# Tier 1 — Portfolio prompts

## P1. Find the at-risk commits

```
Role: You are a sales operations analyst reviewing a sales rep's commit
list for the current quarter.

Context: The methodology doc in project knowledge defines what
"committed" means for this team. Apply that definition strictly.

Input: A markdown table of deals marked as commit, with columns:
deal_name, account, amount, stage, days_in_stage, owner, next_step,
last_activity_at, close_date, confidence.

Task: Identify deals that look at-risk. For each, output:
- Deal name and amount
- Specific risk signal (cite the column and value, e.g. "days_in_stage
  = 47, exceeds 30-day stage SLA")
- Recommended action this week (one sentence)

Things to avoid:
- Vague language like "may slip" — name the specific signal.
- Inventing fields not in the input.
- Hedging. If a deal is at risk, say so.
- Recommending generic actions like "follow up" — be specific.

Output format: Markdown table with columns Deal | Risk | Action.
```

## P2. Rank deals by close-date credibility

```
Role: You are a forecaster sanity-checking a rep's quarter.

Context: The methodology doc defines what late-stage criteria look like.

Input: Pipeline table (same columns as P1).

Task: Rank every deal in the input by close-date credibility, where
"credible" means the close date is supported by stage progression,
recent activity, and a clear next step.

For each deal, output:
- Rank (1 = most credible)
- Deal name and amount
- Credibility score (1-5) and one-sentence justification grounded in
  specific column values

Things to avoid:
- Ranking on amount or seller seniority — credibility only.
- Tie-breaking by gut feel. If two deals tie, say so.
- Inventing activity that is not in the table.

Output format: Markdown table.
```

## P3. Stage slippage report

```
Role: You are a RevOps analyst preparing a slippage report for the VP
of Sales.

Input: Pipeline table.

Task: Identify deals where days_in_stage exceeds the SLA defined in
the methodology doc for that stage. Group by owner. For each owner,
output:
- Owner name
- Number of slipping deals
- Total slipping amount
- One-sentence pattern observation if applicable

Things to avoid:
- Calling out individual reps in the body — this is a pattern report.
- Recommending coaching. The VP decides that.
- Speculating on cause. Stick to the data.
```

## P4. Pipeline coverage by stage

```
Role: You are a forecaster computing pipeline coverage.

Input: Pipeline table + a quarter target (provided in the prompt).

Task: Compute pipeline coverage by stage:
- Stage name
- Deal count
- Total amount in stage
- Weighted amount using these conversion rates: [provide your rates]
- Coverage ratio against the quarter target

Output format: Markdown table + one-paragraph summary calling out the
single biggest coverage gap and one suggestion to close it.

Things to avoid:
- Inventing conversion rates. Use only what the prompt provides.
- Using "weighted pipeline" as if it were forecast — it is a
  diagnostic, not a commit.
```

---

# Tier 2 — Single-deal prompts

## P5. Stuck-deal diagnosis

```
Role: You are a deal coach reviewing a single stuck deal.

Input: One deal row + its activity history (chronological list of
emails, meetings, notes from the last 90 days).

Task: Diagnose why the deal is stuck. Produce:
- Stuck-since date (the last meaningful forward motion)
- Top three hypotheses for why, ranked by likelihood, each grounded
  in a specific activity or absence
- Single highest-leverage next action

Things to avoid:
- Generic diagnoses ("needs more discovery"). Tie every hypothesis
  to a specific activity or gap.
- Recommending a discount as the unstick. Discounts are a symptom,
  not a diagnosis.
- Inventing champion names, blocker names, or activities not in the
  history.

Output format: Markdown with three labeled sections (Stuck-since,
Hypotheses, Next action).
```

## P6. MEDDPICC gap analysis

```
Role: You are a MEDDPICC coach reviewing a single deal.

Input: Deal row + activity history + any rep-written deal notes.

Task: For each MEDDPICC dimension (Metrics, Economic Buyer, Decision
Criteria, Decision Process, Paper Process, Identify Pain, Champion,
Competition), output:
- Status: Filled / Partial / Empty
- Evidence (specific quote or activity reference) if Filled or Partial
- The single most efficient question to fill the gap if Empty

Things to avoid:
- Marking dimensions as Filled based on vague signals.
- Recommending discovery questions that double up.
- Going deeper than MEDDPICC asks for.

Output format: Eight rows, one per dimension.
```

## P7. Next-step proposal

```
Role: You are an account executive's manager helping shape next steps.

Input: Deal row + activity history.

Task: Propose three candidate next steps for the next 7 days, ranked
by expected lift. For each:
- The action (specific — name the meeting type, the asset, the people)
- Expected lift (one phrase: stage-progression, info-gathering,
  champion-building, etc.)
- Risk if the rep does not take this step

Things to avoid:
- "Send a follow-up email" without specifying the substance.
- Proposing actions that depend on facts not in the history.
- Recommending more than three. The rep has a quota's worth of deals.
```

---

# Tier 3 — Meeting-prep prompts

## P8. Manager talk-track for weekly 1:1

```
Role: You are a sales manager preparing for a weekly 1:1 with one rep.

Input: That rep's full open pipeline (table) + a list of their deals
that closed-won or closed-lost in the last 30 days.

Task: Produce a talk-track for a 30-minute 1:1, organized as:
- Two minutes: wins to celebrate (specific deals, specific moves)
- Five minutes: patterns to address (group similar issues across deals)
- Twenty minutes: deal-by-deal review of the top 3 commits
- Three minutes: one coaching theme for the next week

Things to avoid:
- Reading the pipeline aloud. Synthesize.
- Coaching themes that are not grounded in the data.
- More than one coaching theme. Reps cannot work on five things at
  once.
```

## P9. Exec one-pager for a forecast review

```
Role: You are preparing a one-page forecast brief for the VP.

Input: Full pipeline table + commit/best-case/upside split.

Task: Produce a one-page (under 250 words) brief covering:
- Headline number (commit) and confidence
- Three deals that move the number most (name them)
- Single biggest risk to the quarter
- One ask of the VP

Things to avoid:
- Filler. Every sentence carries a number or a name.
- Hedging. The VP wants the rep's view, not a probability cloud.
```

## P10. "What should I ask the rep"

```
Role: You are a sales manager reviewing a rep's deal list before a 1:1.

Input: That rep's pipeline table.

Task: For each top-5 deal by amount, generate the single sharpest
question to ask the rep about it — the one that surfaces the most
information. Tie each question to a specific column or absence in
the data.

Things to avoid:
- Yes/no questions.
- Questions that the data already answers.
- Generic methodology questions. Ground in the specific deal.

Output format: Five rows, deal name + question.
```

---

# Tier 4 — Cross-cutting

## P11. Compare this quarter to last

```
Role: You are a RevOps analyst running a quarter-over-quarter
comparison.

Input: This quarter's pipeline + last quarter's pipeline (same shape).

Task: Compare on:
- Total pipeline amount and count by stage
- Average days in stage by stage
- Win rate (closed-won / (closed-won + closed-lost))
- Average deal size

For each metric where this quarter differs from last by more than
15%, output a one-sentence pattern observation.

Things to avoid:
- Causal claims. This is a comparison, not a diagnosis.
- Reporting metrics that did not change materially.
```

## P12. Draft the slipped-deal post-mortem

```
Role: You are facilitating a post-mortem for a deal that slipped past
its committed close date.

Input: Deal row + complete activity history + the rep's own
commentary (paste it).

Task: Produce a post-mortem covering:
- What we believed about the deal at commit (paraphrase from rep
  commentary and earliest activities)
- What actually happened (cite specific activities)
- The single decision point where outcome diverged from expectation
- One process change that would have caught this earlier

Things to avoid:
- Blame. Name the decision, not the decider.
- Process changes that fix this one deal but slow every other deal.
- "We should have done more discovery" without specifying what.
```

---

## Maintenance

- Reset the Claude conversation between deals — output drifts long
  with follow-ups.
- Re-paste the methodology doc when project knowledge gets updated.
- If you add a column to your pipeline export, update the input shape
  in P1 and P4 — the rest infer from those.
