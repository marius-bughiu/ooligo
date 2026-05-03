---
name: churn-analysis
description: Take a churned account and produce a structured root-cause analysis — triggering event, contributing factors, missed signals, taxonomy classification, and a prevention recommendation. Use after every confirmed churn (close-lost or non-renewal) so RevOps can aggregate root causes quarterly without recoding free-text CSM notes.
---

# Churn analysis

## When to invoke

Invoke this skill on a churned account once the close-lost or non-renewal event is recorded in the CRM and the CSM has had at least 24 hours to add their final notes. The output is a post-mortem document the CSM reviews, RevOps stores, and the leadership team aggregates.

Do NOT invoke this skill for:

- **Pre-emptive risk scoring on healthy accounts** — use a health-score model or `risk-scoring-skill` instead. This skill is post-mortem only; running it on a live account anchors the CSM on a churn narrative that has not happened yet.
- **Real-time churn prediction during a renewal cycle** — same reason. The two-pass timeline analysis here assumes the outcome is fixed; using it forward generates false-confidence signals.
- **Win/loss analysis on closed-lost new logos** — those need a different framing (deal narrative, competitor displacement, ICP fit) and a different taxonomy. Use a separate win-loss skill.
- **Single-event explanations** ("they churned because the champion left") — if you already know the cause and just want to record it, edit the CRM field directly. This skill is for cases where the CSM cannot cleanly attribute the churn yet.

## Inputs

- Required: `account_id` — the CRM identifier (HubSpot deal ID, Salesforce account ID, or equivalent)
- Required: `churn_date` — ISO-8601 date the contract ended or close-lost was recorded (e.g. `2026-04-15`)
- Required: `taxonomy` — slug pointing to the team's churn taxonomy file under `references/` (default: `churn-taxonomy`); the skill will refuse to assign a category outside this list
- Optional: `csm_notes` — free-text final notes from the account's CSM, pasted at invocation time
- Optional: `gong_call_ids` — comma-separated list of specific Gong call IDs to weight more heavily in the evidence pass

## Reference files

Always read the following from `references/` before generating the analysis. These define the team-specific vocabulary; without them, the output regresses to generic "champion left, product gap" answers that aggregate poorly across quarters.

- `references/1-churn-taxonomy.md` — the 5-10 root-cause categories the team has agreed on (replace template contents with your actual taxonomy before first run)
- `references/2-prevention-action-library.md` — the menu of prevention recommendations the skill is allowed to propose (replace template contents with your actual playbook entries)
- `references/3-sample-output.md` — the literal markdown shape the skill emits (do not modify; used to validate format)

## Method

Run these four steps in order. Steps 2 and 3 are the two passes — they must remain separate so evidence extraction is not contaminated by classification anchoring.

### 1. Build the 180-day timeline

Pull from CRM, CS platform, support system, and (optionally) Gong:

- Health-score changes (every recorded delta, with the value before and after)
- Contact changes (departures, new sponsors, role changes — use LinkedIn departure dates when CRM lags)
- Support cases (open dates, severity, time-to-resolution, customer-reported severity)
- Gong call summaries (sentiment shifts, pricing objections, competitor mentions)
- Product usage metrics (weekly active users, key-feature adoption, integration health)
- QBR attendance and outcomes

Order events chronologically. Anchor the timeline at `churn_date - 180 days` and end at `churn_date`. If fewer than 3 events exist within the 30 days immediately before `churn_date`, the skill returns the literal output `"insufficient data — fewer than 3 timeline events in the 30-day pre-churn window; manual CSM postmortem required"` and stops. This guard exists because short, sparse timelines invite hindsight-bias narratives that read confident but cannot survive the CSM's lived experience.

### 2. Evidence pass

A first Claude pass that ONLY extracts evidence. No classification, no prevention recommendation. For each timeline event flagged as inflection-worthy (a health drop greater than the team's configured delta, a sponsor change, a missed QBR, a severity-1 ticket), produce:

- The raw quote, ticket excerpt, or metric delta (verbatim — do not paraphrase)
- The date of the event
- Which timeline source it came from (CRM, Gainsight, Zendesk, Gong)

The output of this pass is a flat list of evidence rows. The skill stores it as an intermediate artifact and passes it to step 3 — it does not classify anything yet.

### 3. Classification pass

A second Claude pass that ONLY classifies. It receives the evidence list from step 2, the taxonomy from `references/1-churn-taxonomy.md`, and nothing else. Two-pass design is the explicit engineering choice: a single-pass model conflates "what happened" with "what category this belongs to," which biases the evidence selection toward whatever category the model already suspects. Forcing the classification pass to work from a frozen evidence list is the guard against that.

The classification pass must produce:

- One **primary** root-cause category (from the taxonomy, exactly — no novel labels)
- Up to two **contributing** root-cause categories (from the taxonomy, exactly)
- For each assigned category: which specific evidence rows support it (cite by date)

If no category passes a 3-evidence-row threshold, the primary category becomes `"insufficient-evidence"` and the analysis ends here. Padding to a category with 1-2 weak evidence rows is the failure mode this threshold guards against.

### 4. Prevention recommendation

Read `references/2-prevention-action-library.md`. Choose ONE prevention action from that library that, if it had been in place 60 days before the churn date, would have surfaced the primary root cause as a watchable signal. The skill is not allowed to invent a new prevention action — if no library entry fits, it returns `"no library match — prevention action requires human design"`. This forces the team to grow the library deliberately rather than letting Claude generate a different bespoke recommendation per churn that nobody can aggregate.

## Output format

Emit exactly this structure. The MDX page references this shape; the format must not drift.

```markdown
# Churn analysis — {Account name} ({account_id})

**Churn date:** {YYYY-MM-DD}
**Analysis date:** {YYYY-MM-DD}
**CSM:** {name}
**Contract value at churn:** {ARR}

## Triggering event
{One sentence naming the single event closest in time to the churn that the evidence supports as the proximate cause. Cite the evidence row.}

## Root cause classification

**Primary:** `{taxonomy-slug}` — {one-sentence rationale}
**Contributing:** `{taxonomy-slug}`, `{taxonomy-slug}` (or "none")

### Evidence supporting primary
- {YYYY-MM-DD} ({source}): "{verbatim quote or metric delta}"
- {YYYY-MM-DD} ({source}): "{verbatim quote or metric delta}"
- {YYYY-MM-DD} ({source}): "{verbatim quote or metric delta}"

### Evidence supporting each contributing factor
- **{contributing-slug-1}:**
  - {YYYY-MM-DD} ({source}): "{verbatim quote or metric delta}"
- **{contributing-slug-2}:**
  - {YYYY-MM-DD} ({source}): "{verbatim quote or metric delta}"

## Missed signals
- {Signal that, in hindsight, was visible but not acted on. Cite the date it became visible and the date action was finally taken (if ever).}

## Deviation from success plan
{One paragraph naming the specific commitments in the success plan that did not happen — onboarding milestones missed, integrations not shipped, executive sponsor not engaged. Reference success-plan dates.}

## Prevention recommendation

**Action:** {action slug from prevention-action-library}
**Trigger:** {the signal that would have fired this action 60 days earlier}
**Owner:** {role — CSM, RevOps, Product, etc.}

## CSM review

- [ ] CSM has read this analysis
- [ ] Factual errors corrected (track changes)
- [ ] Root-cause classification confirmed or overridden (CSM judgment wins)
- [ ] Prevention recommendation accepted, modified, or rejected (with reason)
```

## Watch-outs

- **Hindsight bias.** It is trivial to construct a clean narrative after the fact, especially with 180 days of timeline. Guard: the evidence pass (step 2) is structurally separated from the classification pass (step 3), and the classification pass refuses to assign a category without at least 3 evidence rows that explicitly cite dates and sources. If the CSM disagrees with the classification on review, the CSM's judgment wins and the override is recorded.
- **Taxonomy creep.** The temptation after every analysis is to add a new category that captures the unique flavor of this churn. Guard: the classification pass is constrained to the existing taxonomy file and refuses novel labels — the skill returns `insufficient-evidence` rather than minting a new category. New categories require a deliberate edit of `references/1-churn-taxonomy.md` outside the skill, which keeps growth slow and aggregation possible.
- **Champion-departure over-attribution.** "Champion left" is the easiest narrative and the most-overused category in unaided CSM postmortems. Guard: the `champion-departure` category in the taxonomy template requires a LinkedIn departure date OR a CRM contact-change record dated within 90 days of the churn — the classification pass will not assign it on a Gong-only signal ("they mentioned the new VP doesn't see the value").
- **Hallucinated attribution from sparse data.** Short timelines invite confident fiction. Guard: the 30-day-window / 3-event minimum at the end of step 1 short-circuits the analysis with `insufficient data` rather than producing a polished output that does not deserve to exist.
- **Prevention recommendation as creativity exercise.** Each bespoke recommendation makes the quarterly aggregate useless. Guard: step 4 chooses from a fixed library file (`references/2-prevention-action-library.md`) and refuses to invent. If no library entry fits, the skill says so and a human designs the new entry deliberately.
