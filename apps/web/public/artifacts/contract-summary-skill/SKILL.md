---
name: contract-summary
description: Produce an executive-readable summary of an executed contract for non-lawyer audiences (exec, ops, finance). Takes a contract file plus the audience type and returns a one-page Markdown summary that surfaces what each audience actually needs to act on, with explicit "ambiguous — see legal" fallbacks. Not for legal advice, dispute analysis, or privilege determination.
---

# Contract summary

## When to invoke

Whenever a non-lawyer needs to understand what is in an executed (or near-executed) contract well enough to do their job: an exec deciding whether to sign off, a CFO modeling cash flow, a deal team briefing the board, an ops owner who has just inherited responsibility for the counterparty relationship, a procurement lead preparing a renewal.

The output is a structured one-page Markdown summary tuned to the audience the caller names. It is a reading aid, not a substitute for the contract.

Do NOT invoke this skill for:

- Legal advice. The skill summarizes; it does not opine on whether a clause is enforceable, whether a position is defensible, or whether to sue. That is counsel's job.
- Dispute analysis. If the question is "did they breach?", read the contract with counsel against the specific facts. A summary will flatten the nuance the dispute turns on.
- Privilege determination. The skill cannot decide whether a document is protected. Privilege depends on facts the contract does not contain (who saw it, in what capacity, for what purpose).
- Non-Tier-A AI vendors. Run this on Claude only. Do not pipe contracts to consumer-grade LLMs whose data-handling posture you have not reviewed; contracts contain commercial terms, counterparty PII, and sometimes regulated data.

## Inputs

- Required: `contract` — the executed contract as `.docx`, `.pdf`, or pasted Markdown. If it is a redline or draft, the skill prepends a warning to the output that the summary may be stale.
- Required: `audience` — one of `exec`, `ops`, `finance`. Drives which questions the watch-outs section answers and which clauses get emphasis. See `references/2-summary-format-by-audience.md` for the per-audience question library.
- Optional: `template` — path to a firm-specific summary template that overrides the default output format (e.g. your GC's preferred structure for board-pack approvals).
- Optional: `prior_version` — a previous executed version of the same contract. When provided, the skill adds a "What changed since the prior version" section instead of the standard intro.

## Reference files

Always load the following from `references/` before summarizing. Without them, the skill falls back to a generic format and misses the audience-specific questions that make the summary actionable.

- `references/1-audience-question-library.md` — the canonical questions exec, ops, and finance audiences ask of a contract. The skill uses this to decide which clauses to surface and how to phrase the watch-outs.
- `references/2-summary-format-by-audience.md` — the literal Markdown scaffold for each audience. Copy the matching template, fill it in from the contract, leave any unanswered field as `Ambiguous — see legal`.
- `references/3-escalate-to-legal-triggers.md` — the list of clause patterns and ambiguity signals that force the skill to stop summarizing and emit an escalation block. When a trigger fires, the skill returns the partial summary plus an explicit "Counsel review required before acting on this summary" header.

## Method

Run these five sub-tasks in order. The skill is single-pass per section but two-pass overall: extraction first, then audience-aware filtering.

### 1. Clause-by-clause extraction

Walk the contract top to bottom and extract a structured list of every clause that affects: parties, term, payment, renewal, termination, liability, indemnity, IP, confidentiality, data handling, change control, governing law. Do not summarize yet. Capture the clause verbatim or near-verbatim, with section reference (e.g. "§7.2"), so the next pass has citations to point at.

If a clause type is absent, record "not present in contract" rather than inferring its content from boilerplate. Absent clauses are often the most important watch-out (e.g. no liability cap, no termination for convenience).

### 2. Audience-aware filtering

Load the question set for the named `audience` from `references/1-audience-question-library.md`. For each question, find the clause(s) from step 1 that answer it. If no clause answers a question, mark it `Not addressed in contract` — do not invent an answer from "industry standard" defaults.

This step is the reason the skill is two-pass: extracting first and filtering second prevents the audience lens from causing the skill to overlook a clause it would have judged irrelevant on first read.

### 3. Structured summary

Render the audience-matched template from `references/2-summary-format-by-audience.md`. Quote section references in every line so the reader can jump back to the source. Use plain language; never use legalese the audience would have to translate.

### 4. Ambiguity and escalation pass

Re-read the rendered summary against `references/3-escalate-to-legal-triggers.md`. For each trigger:

- If a trigger fires (e.g. uncapped indemnity, MFN clause, unilateral termination for convenience by counterparty only, ambiguous governing-law fork), prepend the output with a `Counsel review required` block naming the trigger and the §.
- If a clause is genuinely ambiguous (drafting error, contradicting sections, undefined defined term), replace the rendered line with `Ambiguous — see legal` plus the § reference. Never paper over ambiguity with a confident paraphrase.

### 5. Watch-outs section

Render the per-audience watch-outs from the question library. Each watch-out is paired with the specific clause that triggered it and the action the audience should take (read §X, ask counsel about Y, model scenario Z in the budget).

## Output format

Render exactly this structure (substitute the audience block for the named audience). Anything the contract does not answer is rendered as `Ambiguous — see legal` or `Not addressed in contract`, never elided.

```markdown
# Contract summary — {Counterparty} / {Contract type} ({Effective date})

> Audience: {exec | ops | finance}
> Source: {filename}, {N} pages, executed {date}
> Prepared by: contract-summary skill (Claude). Not legal advice.

## Parties

- Customer: {legal entity, jurisdiction} (§{ref})
- Vendor: {legal entity, jurisdiction} (§{ref})
- Affiliates in scope: {list or "none"} (§{ref})

## Term

- Effective date: {date} (§{ref})
- Initial term: {duration} (§{ref})
- Initial term ends: {date}
- Renewal mechanism: {auto-renew / opt-in / none} (§{ref})
- Renewal notice deadline: {date or "n/a"}

## Key obligations

- Our side: {plain-language obligations, with §refs}
- Their side: {plain-language obligations, with §refs}
- Service levels / acceptance criteria: {summary or "Not addressed"} (§{ref})

## Key money flows

- Total contract value: {amount, currency} (§{ref})
- Payment cadence: {monthly / quarterly / annual / milestone} (§{ref})
- Payment terms: {Net X} (§{ref})
- Price escalators: {CPI / fixed / none} (§{ref})
- Late payment penalties: {summary or "Not addressed"} (§{ref})
- Taxes: {who pays} (§{ref})

## Renewal terms

- Auto-renewal: {yes / no} (§{ref})
- Renewal length: {duration}
- Notice to prevent renewal: {duration} before term end
- Pricing on renewal: {locked / market / capped escalator} (§{ref})

## Termination rights

- Termination for convenience — us: {yes / no, notice} (§{ref})
- Termination for convenience — them: {yes / no, notice} (§{ref})
- Termination for cause: {triggers, cure period} (§{ref})
- Effect of termination: {data return, transition assistance} (§{ref})

## Watch-outs for {audience}

- **{Watch-out 1}** — {one-sentence why this matters to this audience}.
  Action: {read §X / ask counsel about Y / model scenario Z}.
- **{Watch-out 2}** — ...
- **{Watch-out 3}** — ...
```

If a `Counsel review required` trigger fires, the entire output is prepended with:

```markdown
> COUNSEL REVIEW REQUIRED before acting on this summary.
> Trigger(s): {list}, see §{refs}.
```

## Watch-outs

- **Over-summarization losing nuance.** A "12-month liability cap" reads simply but the carve-outs (gross negligence, IP indemnity, data-breach claims) often define the actual exposure. Guard: the skill always emits the cap line *and* a separate "Cap carve-outs" line citing the carve-out section verbatim; if no carve-outs are found, the line reads "No carve-outs found — verify with counsel."
- **Audience mismatch.** Surfacing renewal-pricing detail to an exec who only needs the sign-off gist creates noise; surfacing only the sign-off gist to finance leaves the budget model wrong. Guard: the audience parameter is required; if absent, the skill refuses to render and asks the caller to specify.
- **Citing the summary back as legal interpretation.** Downstream readers sometimes treat the summary as the contract. Guard: every output is prefixed with `Not legal advice` and every line carries a §reference so the reader can verify against the source. If the caller forwards the summary as the basis of a legal position, the reference back to the §s in the contract is built into the document.
- **Stale draft summarized as executed.** Summaries written from redlines are wrong by the time the contract is signed. Guard: the skill detects draft markers (track changes, "DRAFT" watermark, "v" in filename) and prepends a warning that the summary may not match the executed text; re-run after signature.
