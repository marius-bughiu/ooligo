---
name: qbr-prep
description: Generate a 70%-done QBR draft for a single customer account. Pulls Salesforce account history, Salesforce cases, Gong call themes from the last 90 days, and the success-plan doc, then runs three Claude passes (synthesis, risk + expansion, tone-match) to populate slot-mapped slide content for the team's QBR template.
---

# QBR prep

## When to invoke

When a CSM is opening a fresh QBR deck for a named account and wants a populated draft to edit, not a blank template. Take an account ID, the previous QBR's contents, the current quarter's usage data, and the active success-plan doc as inputs and produce slot-mapped slide content plus a one-page exec summary.

Do NOT invoke this skill for:

- Auto-publishing a QBR deck without CSM review. The skill is a draft engine, not a publisher.
- Customer-facing decks that have not been approved by the named account team. Every QBR goes through the AE/CSM-of-record before the customer sees it.
- Accounts with fewer than 30 days of usage data or no logged Gong calls in the quarter. The skill flags this and refuses rather than padding with generalities.
- Renewal forecasting or churn prediction. Use the churn-risk-summarizer skill for that — its rubric is calibrated for retention scoring, not deck content.

## Inputs

- Required: `account_id` — the Salesforce 18-character account ID
- Required: `quarter` — the QBR quarter label (e.g. `Q1-2026`)
- Required: `last_qbr_path` — local path or Google Drive URL to the previous QBR deck (the skill diffs commitments-then vs reality-now)
- Required: `success_plan_ref` — Notion page ID, Salesforce custom object ID, or Gainsight CTA reference for the active success plan
- Optional: `usage_data_path` — CSV or BigQuery table reference for product usage events. Defaults to the team's standard usage warehouse view if unset.
- Optional: `template_id` — slide template key from `references/qbr-template-slots.md`. Defaults to `standard-quarterly`.
- Optional: `voice_samples` — array of paths to 3 prior QBRs from the same CSM (used by the tone-match pass)

## Reference files

Always read these from `references/` before generating slide content. Without them, the skill's output is generic and the slot mapping will not match the team's actual deck.

- `references/qbr-template-slots.md` — the named placeholder slots in the team's QBR template, with the data shape each slot expects
- `references/success-plan-format.md` — the schema the skill expects for the success-plan doc, plus a fillable template the CSM team adopts
- `references/sample-output.md` — a worked example of populated slot content for a fictional account, used as a tone and structure anchor

## Method

Run these steps in order. Steps 1a-1d run in parallel because they hit independent systems and the bottleneck is API latency, not Claude tokens.

### 1. Parallel data pulls

a. **Salesforce account history.** Pull Account, Opportunity, and Case records for the past 12 months. Compute: ARR trajectory, expansion or contraction events, renewal date, NPS history if captured. Why parallel: Salesforce SOQL is the slowest of the four and gates the rest.

b. **Salesforce cases.** Pull all cases opened in the QBR quarter. Compute: ticket volume vs prior quarter, severity mix, median time-to-resolve, top three case categories.

c. **Gong call themes.** Pull all calls tagged to the account in the past 90 days. Why 90 days: anything older predates the quarter and biases the narrative backward. Surface raw transcripts plus call metadata (attendees, duration, recording URL).

d. **Success-plan doc.** Fetch the success plan referenced by `success_plan_ref`. Parse against the schema in `references/success-plan-format.md`. If the schema does not match, halt and surface the parse error rather than guessing.

If any of 1a-1d returns empty or errors, record `unavailable` for that stream rather than synthesizing. The output template explicitly accommodates missing streams.

### 2. Pass 1 — synthesis

Claude reads all four data streams and the previous QBR. It produces an internal scratchpad: top wins of the quarter, top losses, themes from Gong (what executives said about value, blockers raised, competitors mentioned), and a usage-trend summary keyed to the success-plan goals. Why a dedicated synthesis pass: the next two passes need a single coherent picture, not raw data. Doing synthesis-and-slides in one pass produces uneven slide content because Claude over-weights whichever stream it read last.

### 3. Pass 2 — risks and expansion paths

Claude takes the synthesis scratchpad plus the success plan and produces: open risks with severity (red, yellow, green) and a one-line mitigation per risk; proposed expansion paths ranked by signal strength (usage-led, persona-led, contract-led). Why a separate pass: risks and expansion are the parts a CSM most often edits, so they get focused token budget and explicit reasoning rather than being squeezed alongside slide-writing.

### 4. Pass 3 — tone-match and slot mapping

Claude reads the optional `voice_samples` (or falls back to `references/sample-output.md`) and rewrites the synthesis + risks + expansion content into the team's voice — neutral, data-led, no superlatives. Then it maps the rewritten content to the named slots from `references/qbr-template-slots.md`. Why per-template slot mapping: every team's QBR template differs (some have a "wins" slide, some fold wins into "value delivered"). Mapping at the end means swapping templates does not require rerunning the upstream passes.

### 5. Emit output

Write a single Markdown file with one section per slot. Each section is wrapped in a fenced block tagged with the slot name, so a downstream importer (the deck-assembly script the team runs separately) can split it back out. Also write a one-page exec summary as a separate file for the CSM to skim before opening the deck.

## Output format

````markdown
# QBR draft — {Account name} — {Quarter}

> Generated {YYYY-MM-DD HH:MM}. Status: {complete | partial: missing streams listed below}.
> Missing streams: {gong | success_plan | usage | none}

## Slot: `usage_trend`

```text
{Three-sentence summary of usage trajectory keyed to the prior quarter.
Names the metric, the delta, and one likely cause from the synthesis pass.}
```

## Slot: `top_wins`

```text
- {Win 1 — outcome, metric, customer quote if available}
- {Win 2 — outcome, metric, customer quote if available}
- {Win 3 — outcome, metric, customer quote if available}
```

## Slot: `risk_summary`

```text
| Risk | Severity | Mitigation owner | Mitigation |
|---|---|---|---|
| {Risk 1} | red | {CSM | AE | Product} | {one line} |
| {Risk 2} | yellow | ... | ... |
```

## Slot: `success_plan_progress`

```text
| Goal | Target | Actual | Status |
|---|---|---|---|
| {Goal 1} | ... | ... | on-track |
| {Goal 2} | ... | ... | at-risk |
```

If success plan is `unavailable`, this slot emits the literal string `SUCCESS_PLAN_UNAVAILABLE` so the deck-assembly script can blank the slide rather than render stale content.

## Slot: `expansion_paths`

```text
1. **{Path 1}.** Signal: {usage | persona | contract}. Confidence: high | medium | low. Next step: {one sentence}.
2. **{Path 2}.** ...
3. **{Path 3}.** ...
```

## Slot: `exec_summary`

```text
{Five-bullet summary intended for the cover slide. Each bullet is one
fact, no adjectives. Always ends with the proposed agenda for the
live QBR call.}
```
````

## Watch-outs

- **Usage-data drift.** If the usage warehouse view changes shape (column rename, metric redefinition), the trend summary is silently wrong. Guard: the skill validates the usage CSV header against `references/qbr-template-slots.md` schema and refuses to populate `usage_trend` if columns are missing or renamed. The deck-assembly script then renders the slide blank rather than misleading content.
- **Success-plan staleness.** Success plans that have not been touched in over 60 days produce confident-sounding but stale `success_plan_progress` slots. Guard: the skill checks the success-plan doc's `last_updated` field; if older than 60 days, it prepends a `SUCCESS_PLAN_STALE` flag to that slot so the CSM has to acknowledge before the slide is approved.
- **Tone mismatch with the customer.** Default tone is the CSM team's voice — that may not match how this specific customer is used to being talked to (e.g. an enterprise customer expects more formal phrasing than a startup). Guard: when `voice_samples` are passed, the tone-match pass weights customer-facing artifacts (prior QBRs the customer received) over internal docs. If no voice samples, the skill emits content in neutral register and flags `TONE_REVIEW_NEEDED` on the exec summary.
- **Gong coverage gaps.** If fewer than three Gong calls were logged in the quarter, the themes section is thin and over-weights whichever calls did log. Guard: the skill counts Gong calls during the parallel pull; under three, the `top_wins` slot is generated from Salesforce signal only and prefixed with `GONG_COVERAGE_LOW` so the CSM knows to add color manually.
- **Diffing to the wrong prior QBR.** If `last_qbr_path` points at a deck from a different account or quarter, the "commitments then vs reality now" framing breaks silently. Guard: the synthesis pass extracts the account name and quarter label from the prior QBR's title slide and halts if they do not match the inputs.
