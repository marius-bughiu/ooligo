---
name: lost-deal-postmortem
description: Turn closed-lost notes, call transcripts, and CRM activity timelines into a structured deal postmortem. Returns a categorized loss reason, a timeline of key decision moments, a competitor or alternative mentioned, what the seller could have done differently, and a confidence score for the analysis. Use after a deal closes lost — not as a substitute for live deal-desk review during an active opportunity.
---

# Lost-deal postmortem

## When to invoke

Invoke after a deal is marked closed-lost in Salesforce, once you have at least one of: a Gong call transcript from the final 30 days of the deal, closed-lost notes from the AE or SDR in the CRM, or a structured loss form already filled in. The skill ingests all available inputs, reconciles conflicts between them, and produces a postmortem ready to paste into Salesforce, a Gong call summary field, or a shared loss log.

Typical entry points:

- A Salesforce Flow that fires on `Stage = Closed Lost`, pulls the opportunity activity history and last N call transcript IDs, and posts them to this skill.
- A manual AE paste after a loss call, when they want a structured output before the next pipeline review.
- A RevOps batch run over last quarter's losses to produce a category distribution for the QBR deck.

Do NOT invoke this skill for:

- **Active deals.** Postmortems require a closed outcome. Running this mid-deal produces a speculative analysis that AEs misread as prescriptive coaching. Use the AE coaching skill for live deals.
- **Losses with fewer than 3 timeline events in the last 30 days of the deal.** With too little signal, the skill returns `insufficient_data` rather than guessing. A single "closed-lost notes: budget" entry is not a postmortem — it is a one-field form. See the guard in Watch-outs.
- **Churned customers.** This skill covers sales-cycle losses, not post-sale churn. Use the churn-analysis skill for post-sale outcomes.

## Inputs

Required (at least one):

- `gong_transcript` — string or array of strings. Raw Gong call transcript text or structured transcript JSON for the relevant calls in the deal. Minimum useful input: a single transcript from a call in the last 30 days of the deal. Preferred: all calls from the final sales stage.
- `crm_notes` — string. Closed-lost notes, AE notes, SDR call notes, or any free-text activity history from Salesforce. Can be a concatenated dump.

Optional:

- `opportunity_id` — string. Salesforce opportunity ID. Used for the postmortem header and for the skill to emit a Salesforce-pasteable output.
- `deal_metadata` — object with fields: `account_name`, `deal_value_usd`, `close_date`, `stage_history` (array of `{stage, date}` pairs), `competitor_mentioned` (string or null), `loss_category` (string or null — from whatever form your team uses). All optional but each narrows ambiguity.
- `postmortem_config` — path to or inline contents of `references/1-postmortem-config.md`. Contains your team's loss category taxonomy, the minimum-event threshold, and the output fields required by your Salesforce layout. If omitted, the skill uses the defaults in that file.

## Reference files

Load these from `references/` before first run. The config file is the main calibration point — the defaults work but your team's category taxonomy matters more than the skill's.

- `references/1-postmortem-config.md` — loss category taxonomy, minimum timeline-event threshold, Salesforce field mapping, and hindsight-bias guard configuration. Replace the placeholder rows with your team's actual categories.
- `references/2-timeline-reconstruction-template.md` — the template the skill fills when assembling the event timeline. Edit the "Key moments" list if your team tracks different signals.
- `references/3-sample-output.md` — a literal example of the full postmortem the skill emits for a fictional deal. Use this when wiring the Salesforce writeback or the loss-log paste target.

## Method

The skill runs these steps in order. Earlier steps gate later steps.

### 1. Input validation and data-sufficiency check

Before any analysis, count the distinct timeline events recoverable from all inputs combined. A "timeline event" is a datable interaction or signal: a Gong call, a CRM note with a date, a stage change, a pricing email, a meeting booked or missed. If the total is fewer than `min_timeline_events` (default: 3, configurable in `references/1-postmortem-config.md`), return `result: insufficient_data` with the event count and the threshold. Do not produce a postmortem.

Why: a postmortem with one or two events is hindsight bias packaged as analysis. The skill surfacing `insufficient_data` is the correct behavior — it forces the AE or SDR to go back and log the calls they did not log. A mandatory minimum is the only reliable guard against the most common postmortem failure mode: a confident narrative built on a single field.

### 2. Timeline reconstruction

Extract all datable events from the inputs and sort them chronologically. For each event, record: date, event type (call / email / proposal / demo / stage change / competitor mention), source (Gong / CRM note / deal metadata), and a one-sentence summary of what happened.

Why explicit timeline construction before analysis: if the model jumps straight to loss reason, it anchors on the most emotionally salient event (usually the final call) and ignores earlier signals. The timeline forces the analysis to move forward in time, not backward from the conclusion.

### 3. Loss reason classification

Against your loss category taxonomy (from `references/1-postmortem-config.md`), classify the primary loss reason and up to two secondary reasons. For each reason:

- Name the category (e.g. `budget_freeze`, `competitor_win`, `champion_lost`, `timing_not_right`, `product_gap`, `price_too_high`, `no_decision`).
- Cite the specific event(s) in the timeline that support the classification — not inference.
- Flag any conflict between sources (e.g. AE notes say "budget" but the final Gong call mentions a competitor by name).

Why cite-over-infer: postmortems are used in QBR analysis and win/loss reporting. A fabricated or inferred loss reason that sounds plausible will pollute category distributions for quarters. The skill refuses to classify without a citation; if no event supports a category, it is not assigned.

### 4. Competitor and alternative identification

Identify any competitor, internal build alternative ("we'll build it ourselves"), or status-quo alternative ("we'll keep doing it manually") mentioned in any input. Return `null` if none are present — never infer a competitor from vague language like "we're evaluating other options."

### 5. Seller action review

Based on the timeline and classified loss reason, identify the specific moment (if any) where a different seller action might have changed the outcome. This is the highest-risk step for hindsight bias. The skill only names a seller action if: (a) the signal was present in the deal at the time, not just in retrospect, and (b) a comparable closed-won deal in the team's history would typically have taken that action. If neither condition holds, this field is left blank rather than invented.

### 6. Confidence scoring

Emit a confidence score from 1-5:

- 5 — multiple Gong transcripts + complete stage history + filled loss form. High signal.
- 4 — one Gong transcript + CRM notes. Adequate.
- 3 — CRM notes only, ≥ 5 timeline events. Borderline.
- 2 — CRM notes only, 3-4 timeline events. Low signal; treat analysis as directional.
- 1 — single call transcript with no CRM notes, or CRM notes with exactly 3 events.

### 7. Output assembly

Render the postmortem per the format in "Output format" below. Confidence score and data sources go in the header. Timeline, classification, competitor, seller action, and Salesforce-ready field dump go in the body.

## Output format

Literal markdown the skill emits for a single closed deal:

```markdown
# Postmortem — Acme Corp (SF-OPP-12345)

**Close date:** 2025-10-14
**Deal value:** $84,000
**Confidence:** 4 / 5
**Sources used:** Gong (2 calls), Salesforce notes (4 entries)

## Loss reason

**Primary:** competitor_win — Acme signed with Vendor X after a bake-off demo on 2025-10-09 (Gong call 2, 14:32). Champion confirmed "they had the feature we needed natively."
**Secondary:** product_gap — No native Slack integration; mentioned as friction in Gong call 1 (2025-09-28, 08:14).

## Competitor / alternative

Vendor X (named in Gong call 2, 2025-10-09).

## Timeline

| Date | Event | Source | Summary |
|---|---|---|---|
| 2025-08-12 | Stage: Qualification → Demo Set | Salesforce | Champion agreed to a discovery call. |
| 2025-09-03 | Call: Discovery | Gong | Identified Slack integration as a key requirement. |
| 2025-09-28 | Call: Technical demo | Gong | Champion asked about native Slack connector; AE deferred to roadmap. |
| 2025-10-07 | Stage: Proposal → Negotiation | Salesforce | MSA sent. |
| 2025-10-09 | Call: Final decision | Gong | Champion disclosed bake-off with Vendor X. Outcome went to Vendor X. |
| 2025-10-14 | Stage: Closed Lost | Salesforce | AE notes: "Lost to competitor on native integration." |

## Seller action review

At the 2025-09-28 demo, the Slack integration requirement was on the table. The AE deferred to roadmap without offering an interim workaround (e.g. Zapier connector + documented steps). A comparable won deal (Northwind, closed 2025-08-01) used this workaround successfully for 90 days until native was shipped. Surfacing it here would not have guaranteed the win but would have removed the objection from the final bake-off.

## Salesforce fields (paste-ready)

```
Loss_Reason__c: competitor_win
Loss_Reason_Secondary__c: product_gap
Competitor_Mentioned__c: Vendor X
Postmortem_Confidence__c: 4
Postmortem_Summary__c: Lost to Vendor X primarily on native Slack integration. Product gap was the deciding factor in the bake-off.
```

---

_Postmortem generated: 2025-10-15 | Inputs: Gong (2), SF notes (4) | Timeline events: 6_
```

## Watch-outs

- **Hindsight bias on thin timelines.** When a deal has only one or two logged events, any analysis is reverse-engineered from the outcome, not derived from the deal itself. Postmortems like this pollute QBR category data for quarters. **Guard:** the skill returns `insufficient_data` when the recoverable timeline has fewer than `min_timeline_events` (default: 3). Raising the threshold to 4 or 5 in `references/1-postmortem-config.md` tightens this further for teams whose AEs under-log.
- **Loss category inflation.** AEs under time pressure default to "budget" as the loss reason because it is the least self-implicating option. A model trained on sales data will replicate this bias if it infers rather than cites. **Guard:** the skill only assigns a category when it can cite a specific timeline event. If CRM notes say "budget" but a Gong transcript shows a competitor mentioned by name, the skill flags the conflict explicitly and promotes the cited category.
- **Fabricated seller counterfactuals.** The "what could have been done differently" section is the highest-risk section for plausible-sounding confabulation. A fabricated counterfactual that reads as coaching will be used — and trusted — by managers. **Guard:** the skill only names a seller action if the signal was present at the time (not only visible in retrospect) and if a comparable closed-won deal supports the action. If neither condition holds, the field is explicitly left blank and labeled `insufficient_data_for_seller_review`.
- **Conflicting source accounts.** AE notes and Gong transcripts disagree about 20-30% of the time in typical deals — not from dishonesty, but from recollection gaps and note-taking timing. A skill that silently picks one source is misleading. **Guard:** when sources conflict on a material point (loss reason, competitor identity, last key meeting outcome), the skill surfaces the conflict explicitly rather than reconciling it silently: "CRM notes: budget. Gong call 2: competitor named. Primary classification uses the Gong citation; flag for AE review."
