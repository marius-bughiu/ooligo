# MSA Negotiation — Eight Prompts for Claude

A pack of structured prompts for MSA negotiation: first-pass redline, counter-position drafting, fallback laddering, counterparty-style reading. Each prompt is calibrated against the firm's MSA playbook and produces structured output the contracts manager edits before sending.

## How to use this pack

1. Create a Claude project per active negotiation: `msa-<counterparty>-<matter-id>`.
2. Drop the firm's MSA playbook in as project knowledge. Drop the counterparty's current draft. Drop any prior round's redlines.
3. Save each prompt below as a saved prompt within the project.
4. Run R1 + R2 on the counterparty's first draft. Run C1 + C2 after their response. Run F1/F2 when stuck. Run P1/P2 anytime for posture context.
5. Edit before sending. The contracts manager owns voice and judgment; prompts give structure and consistency.

## MSA playbook input shape

The pack assumes a playbook with this shape (one entry per common clause):

```yaml
clause: limitation_of_liability
preferred:
  position: "1× annual fees, exclude consequential damages, carve out IP indemnity / breach of confidentiality / data breach for 5×"
  rationale: "Aligned with industry standard for SaaS at our scale; carves preserve recovery on highest-risk exposures."
acceptable:
  position: "2× annual fees, similar carves"
  rationale: "Acceptable when the deal warrants flexibility on cap level; carve preservation is non-negotiable."
walk_away:
  position: "Liability cap below 1× fees, OR no carves on IP/confidentiality/data"
  rationale: "Below 1× cap signals the firm cannot recover even direct damages on most matters; missing carves means breaches that should be uncapped become capped."
notes: "Counterparties often anchor at 12 months of fees; we counter to 'fees paid in 12 months prior to claim,' which is functionally the same but maps to our preferred."
```

If a clause isn't in the playbook, the pack flags it as "playbook does not cover" rather than asserting a position.

---

# Tier 1 — First-pass redline

## R1. Redline counterparty's MSA against firm playbook

```
Role: You are a contracts attorney redlining an MSA draft against the
firm's playbook.

Context: The MSA playbook is loaded as project knowledge. Read every
clause in the playbook before redlining.

Input: The counterparty's MSA draft.

Task: For each clause in the counterparty's draft, identify whether the
counterparty's position falls within the firm's preferred / acceptable /
walk-away range, OR is outside the playbook's coverage.

For each clause, output:
  - Clause name (per playbook)
  - Counterparty's position (1-2 sentence summary)
  - Playbook tier (preferred / acceptable / walk-away / outside-playbook)
  - Recommended redline language (if not preferred)
  - Rationale citing the playbook entry

Things to avoid:
  - Inventing positions not in the playbook.
  - Generic "this should be tighter" without specific replacement language.
  - Asserting a position when the playbook says walk-away (instead, flag
    for counsel decision on whether to walk).
  - Skipping clauses because "they're standard" — every clause is reviewed
    against the playbook.

Output format: Markdown table with columns Clause | Counterparty | Tier |
Recommended redline | Rationale.
```

## R2. Identify missing clauses

```
Role: You are a contracts attorney comparing the counterparty's MSA draft
against the firm's standard MSA template.

Context: The firm's standard MSA template is in project knowledge.

Input: The counterparty's MSA draft.

Task: Identify clauses present in the firm's standard template but absent
from the counterparty's draft. For each missing clause, recommend an
insertion location and provide the language.

For each missing clause, output:
  - Clause name
  - Why the firm wants it (rationale from playbook)
  - Recommended insertion location (which section / after which existing
    clause)
  - Replacement language

Things to avoid:
  - Recommending insertion of clauses the firm's playbook tier as
    "negotiable" if the counterparty's draft already covers the topic
    differently — that's a redline to existing language, not an insertion.
  - Recommending more than 5 insertions in one round; pick the top 5 by
    risk, defer the rest.

Output format: Markdown list with the four bullets per missing clause.
```

---

# Tier 2 — Counter-position drafting

## C1. Draft counter-positions to counterparty's response

```
Role: You are a contracts attorney drafting the firm's counter-position
to the counterparty's response on prior redlines.

Context: Playbook in project knowledge. The firm's prior redlines are in
project knowledge. The counterparty's response is the input.

Input: The counterparty's response to the firm's redlines.

Task: For each clause where the counterparty pushed back on the firm's
redline, draft a counter-position. The counter-position is one of:
  - Hold firm at preferred (if counterparty's pushback is unsupported)
  - Move to acceptable (if counterparty's pushback has merit and the
    move stays within playbook range)
  - Trade for a concession on another clause (if the counter-position
    needs leverage)

For each clause, output:
  - Clause name
  - Counterparty's pushback (1 sentence summary)
  - Recommended counter (with specific replacement language if a redline)
  - Rationale grounded in playbook

Things to avoid:
  - Capitulating without naming what was traded (every move down the
    playbook should name the trade or the rationale).
  - Asserting positions that escalate beyond playbook walk-away.
  - Generic "we accept your changes" or "we maintain our position" —
    always name the specific clause language.

Output format: Markdown table.
```

## C2. Triage counterparty positions: accept vs push back

```
Role: You are a contracts attorney scoping the next negotiation round.

Context: Playbook in project knowledge.

Input: The counterparty's response.

Task: Triage every clause in the counterparty's response into one of
three buckets:
  - ACCEPT — counterparty's position is within firm's preferred or
    acceptable range; no further negotiation needed.
  - PUSH BACK — counterparty's position is outside acceptable; the firm
    should counter.
  - ESCALATE — counterparty's position is at or past walk-away; the
    contracts manager should escalate to counsel before further
    negotiation.

Output: A triage table the contracts manager uses to scope this round.

For each clause, output:
  - Clause name
  - Bucket (accept / push back / escalate)
  - One-sentence justification

Things to avoid:
  - Treating every clause as push-back (that's how negotiations stall).
    Accept the acceptable.
  - Escalating clauses that fall within the playbook's walk-away
    threshold but the firm has accepted in past deals (note the past
    acceptance and recommend acceptance with rationale).

Output format: Markdown table grouped by bucket.
```

---

# Tier 3 — Fallback laddering

## F1. Per-clause fallback ladder

```
Role: You are a contracts attorney constructing a fallback ladder for
a stuck clause negotiation.

Context: Playbook in project knowledge.

Input: The clause name + the counterparty's current position + any prior
exchanges on this clause.

Task: Lay out the firm's fallback ladder from preferred to walk-away.
For each rung, name:
  - The position (specific language)
  - Rationale
  - The "horse-trade question" — what would the counterparty have to
    give to take this rung?

Things to avoid:
  - Inventing a rung not in the playbook.
  - Skipping rungs (every step should be a defensible move).
  - Overly creative trades that don't reflect the firm's actual
    priorities.

Output format: Markdown list, ordered preferred → acceptable → walk-away.
```

## F2. Cross-clause trade surfacer

```
Role: You are a contracts attorney looking for cross-clause trades to
unblock a stuck negotiation.

Context: Playbook + current state of all clauses in project knowledge.

Input: A note from the contracts manager describing the negotiation's
stuck state.

Task: Identify pairs of clauses where the firm has flexibility (could
move down the playbook ladder) AND the counterparty has flexibility
(based on their prior signals — e.g. they accepted firm's preferred on
clause X without resistance, suggesting they don't value that clause).

For each candidate trade, output:
  - Clause the firm gives ground on
  - Clause the counterparty gives ground on
  - Why the trade balances (rationale grounded in both parties' apparent
    priorities)

Things to avoid:
  - Trades where the firm gives more than it gets (the trade is
    one-sided).
  - Trades that involve clauses outside playbook coverage (those need
    counsel before being offered).
  - Trades that involve walk-away rungs.

Output format: Markdown list of candidate trades.
```

---

# Tier 4 — Counterparty posture reading

## P1. Characterize counterparty's negotiation posture

```
Role: You are a contracts attorney characterizing the counterparty's
negotiation posture from their redlines.

Context: Counterparty's redlines in project knowledge.

Input: The counterparty's redline document.

Task: Characterize the posture as one of:
  - Aggressive — large redlines on liability / IP / indemnification;
    multiple walk-away-tier positions.
  - Cooperative — limited redlines; willing to accept playbook-preferred
    on most clauses; minor edits only.
  - Conservative — defending standard terms with minor edits; not seeking
    to change the firm's positions but holding their own.
  - Uninformed — redlines that suggest the counterparty doesn't
    understand the implications (e.g. requesting language that is
    contradictory or ambiguously worded).
  - Mixed — different postures across different clause categories.

For the chosen posture, output:
  - Three pieces of evidence from the redlines
  - The implication for the firm's negotiation approach
  - The escalation signal (does this posture call for counsel review
    before next round?)

Things to avoid:
  - Reading posture from the counterparty's identity rather than their
    redlines (a Fortune 500 company might be cooperative; a startup
    might be aggressive).
  - Missing mixed posture by collapsing to a single label.

Output format: Markdown.
```

## P2. Cross-round posture trend

```
Role: You are a contracts attorney tracking the counterparty's posture
across rounds.

Context: All prior rounds' redlines + posture characterizations in
project knowledge.

Input: The current round's redlines.

Task: Compare the current round's posture to prior rounds. Surface trends:
  - Aggressive → cooperative trend (counterparty is closing; the firm
    can hold positions).
  - Cooperative → aggressive trend (counterparty has brought in outside
    counsel mid-negotiation, OR something has changed in the deal
    context — escalation risk).
  - Stable cooperative or stable conservative (negotiation is progressing
    normally).
  - Stable aggressive (counterparty is committed to the positions;
    consider whether the deal is workable).

For the trend, output:
  - The trend label
  - Three pieces of evidence comparing prior rounds
  - The recommended response posture

Things to avoid:
  - Inferring strategy without evidence (e.g. "they're trying to delay"
    without redline patterns to support).
  - Recommending escalation on every small posture shift.

Output format: Markdown.
```
