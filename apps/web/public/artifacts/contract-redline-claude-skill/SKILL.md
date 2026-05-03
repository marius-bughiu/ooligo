---
name: contract-redline
description: Propose first-pass redlines on an incoming counterparty NDA or MSA by classifying every clause against the firm's playbook (red / yellow / green), drafting fallback language for fallback-position clauses, and flagging anything outside the playbook for human legal review. Use before a lawyer touches the draft, never as the final authority.
---

# Contract redline

## When to invoke

Invoke when a counterparty has sent an inbound `.docx` of an NDA, MSA, DPA, order form, or vendor agreement, and the in-house team wants a first-pass redline grounded in the firm's documented playbook before a human attorney opens the file. Typical trigger: a contract lands in the [Ironclad](/en/tools/ironclad/) intake queue (or email) and the assigned reviewer wants a 60-second head start instead of a blank page.

Do NOT invoke this skill for:
- **Final approval or sending the redline back to the counterparty.** The skill proposes; a named human attorney reviews every change before it leaves.
- **Edits to the firm's own contract-as-source-of-truth template.** Template changes are a playbook update, not a per-deal redline. Update the playbook reference file directly so every future run sees the change.
- **Anything privileged that has not been routed through a Tier-A AI vendor with a signed BAA / DPA covering legal-work product.** If your vendor list excludes the model you would call, escalate to the human attorney instead.
- **Highly bespoke instruments** (M&A definitive agreements, complex IP assignments, regulated-industry side letters). The playbook does not cover these; the skill will flag every clause as out-of-policy and waste tokens.
- **Final-round negotiation drafts.** By the time a contract is in turn 3+, the redlines are deal-specific concessions that the playbook cannot encode.

## Inputs

- Required: `incoming_draft` — path to the counterparty's `.docx` (or the pasted text if `.docx` is not available). The skill does not accept image PDFs unless an OCR pre-step has produced text.
- Required: `playbook` — path to the active red/yellow/green playbook file in `references/`. Defaults to `references/1-playbook-template.md`. Replace the template with your firm's actual positions before first run.
- Optional: `counterparty_profile` — free-text notes on the counterparty (e.g. "Fortune 100 customer, prior contract on file, low leverage on our side"). The skill uses this to bias toward the *fallback* column rather than the *red* column on yellow-zone clauses.
- Optional: `deal_context` — TCV band, strategic value, regulatory overlay, jurisdiction. Drives the escalation criteria in `references/3-escalation-criteria.md`.

## Reference files

Always read the following from `references/` before redlining. Without them, the output is a generic AI-flavored redline disconnected from firm policy.

- `references/1-playbook-template.md` — the red/yellow/green positions per clause type, plus fallback language. Replace the template with your firm's actual playbook before first use.
- `references/2-fallback-positions.md` — pre-drafted fallback paragraphs for the most-negotiated clauses (LoL cap, indemnity, IP ownership, term/termination, governing law, data protection). The skill cites these by section ID in rationale strings instead of re-drafting from scratch each run.
- `references/3-escalation-criteria.md` — the rules that decide whether a given clause flips from "skill proposes redline" to "skill flags for human attorney." Examples: any clause not present in the playbook, any clause whose proposed redline introduces a new defined term, any DPA-adjacent clause when `deal_context` mentions EU/UK data subjects.

## Method

Run the four sub-tasks in order. Do not parallelize: classification feeds fallback selection, which feeds escalation flagging.

### 1. Classify the contract type

Read the document. Identify it as one of: NDA (mutual or one-way), MSA, DPA, order form, vendor agreement, or "other." If "other," stop and emit a single escalation block telling the reviewer the playbook does not cover this instrument. Do not attempt redlines on contract types the playbook does not address — this is the most common silent-drift failure mode.

### 2. Clause-by-clause classification against playbook

Split the contract into clauses (heading-based; fall back to numbered-section parsing). For each clause:

- Match it to the corresponding playbook section by clause-type heuristic ("Limitation of Liability" / "LOL" / "Cap on Damages" all map to the LoL playbook entry).
- Classify the counterparty's drafted language as one of `green` (acceptable as drafted), `yellow` (acceptable with fallback substitution), `red` (requires removal or significant rewrite), or `out-of-playbook` (no matching playbook entry — escalate).
- Record the matched playbook section ID. Every classification cites a section so the reviewer can audit the decision.

If two clauses both seem to match a single playbook entry (e.g. two overlapping confidentiality sections), classify both and note the overlap in the output — do not silently merge.

### 3. Redline proposal with fallback selection

For every `yellow` clause, pull the corresponding fallback paragraph from `references/2-fallback-positions.md` and propose it as the replacement. For every `red` clause, propose the playbook's "must-have" position (the walk-away language). Distinguish must-have vs nice-to-have in the rationale string so the reviewer knows which redlines are negotiation-floor and which are negotiation-room.

Why this method (not "let the model rewrite freely"): pre-drafted fallback paragraphs have already been reviewed by counsel. Free-form rewrites would introduce novel language each run and force the reviewer to re-read the fallback every time — defeating the time saving.

### 4. Escalation flagging

For every clause classified `out-of-playbook`, and for every clause meeting the rules in `references/3-escalation-criteria.md`, emit an escalation block instead of a redline. The reviewer sees the original text, the trigger (why this hit escalation), and a "needs human attorney" stamp. The skill does not guess on these.

## Output format

Write a single `.docx` of the contract with tracked changes plus a sibling markdown summary. The summary's literal format:

```markdown
# Redline summary — {Contract title}

Contract type: {NDA mutual | MSA | DPA | order form | vendor agreement | other}
Playbook version: {playbook last_reviewed date}
Total clauses: {N}
  - Green (no change): {count}
  - Yellow (fallback proposed): {count}
  - Red (must-have rewrite proposed): {count}
  - Out-of-playbook (escalated): {count}

---

## Clause 4.2 — Limitation of Liability

**Original (counterparty draft):**
> Provider's aggregate liability under this Agreement shall not exceed
> the fees paid in the three (3) months preceding the claim.

**Classification:** red — playbook section LOL.001

**Proposed redline (must-have):**
> Provider's aggregate liability under this Agreement shall not exceed
> the greater of (a) twelve (12) months of fees paid preceding the claim
> or (b) USD 1,000,000.

**Rationale:** Playbook LOL.001 sets the floor at 12 months of fees with a
USD 1M minimum; 3-month caps are walk-away. Pulled fallback paragraph from
`references/2-fallback-positions.md` §LOL.001.

---

## Clause 9.3 — Source-Code Escrow

**Original:**
> Provider shall deposit source code with a mutually agreed escrow agent
> within thirty (30) days of execution.

**Escalation: out-of-playbook**
- **Trigger:** No source-code-escrow position in playbook v2026-04-12.
- **Action:** Human attorney to draft position. Do not propose redline.

---
```

The Word `.docx` carries the same redlines as native tracked changes with the rationale string attached as a Word comment on each edit. The reviewer works in Word; the markdown summary is for the deal channel and the audit trail.

## Watch-outs

- **Silent playbook drift.** If the playbook file is months out of date, the skill will confidently propose stale positions. Guard: every output writes the playbook's `last_reviewed` date in the summary header. Reviewer rejects any output where that date is older than 90 days and the playbook is refreshed before re-running.
- **Privilege leakage via non-Tier-A vendors.** Counterparty drafts can contain attorney-client-privileged context (especially in DPAs and side letters). Guard: the skill refuses to run unless the configured model appears in `references/3-escalation-criteria.md`'s allowed-vendors list. Treat this as a hard precondition; do not bypass with a CLI flag.
- **Novel clauses that pattern-match a playbook entry incorrectly.** A "non-solicitation" clause is not a "non-compete" clause, but the headings rhyme. Guard: every clause classification cites the matched playbook section ID in the output. Reviewer scans the cited IDs; mismatches surface visually and can be corrected before the redline goes back.
- **Jurisdiction differences.** A LoL position legal in Delaware may be unenforceable in Germany. Guard: `deal_context.jurisdiction`, when set to any non-US value, escalates LOL, IP, and warranty clauses to the human attorney instead of proposing a redline. Default behavior assumes US law and the summary header makes that explicit.
- **Free-form rewrites instead of fallback substitution.** The skill must pull the fallback paragraph from `references/2-fallback-positions.md` verbatim, not paraphrase. Guard: rationale strings include the fallback section ID; if any rationale lacks an ID, the reviewer treats it as a hallucinated rewrite and rejects.
