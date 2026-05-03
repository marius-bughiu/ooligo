---
name: deal-room-generator
description: Build a buyer-facing deal-room outline for a late-stage opportunity. Takes an account brief, the current deal stage, the stakeholder map, and an asset-library inventory; produces a structured outline that maps each stakeholder to the assets that move them, the suggested narrative arc, and the gaps where the rep needs to fill in proof or commercial terms before sharing.
---

# Deal-room generator

## When to invoke

Invoke this skill when a late-stage opportunity needs a buyer-facing collateral
package — typically once a mutually-agreed close plan exists, the buying
committee is named, and the AE has to pull together a single artifact (a Notion
page, a DocSend room, a Highspot collection) for the buyer to navigate
internally.

Good moments:

- After a mutual-action-plan call, when the rep needs to send the buyer a
  curated set of assets to drive an internal review.
- Before a procurement / security review kickoff, to assemble the artifacts
  procurement is going to ask for anyway.
- When the AE is rolling up a multi-stakeholder evaluation and wants every
  persona to land on the page that speaks to them first.

Do NOT invoke this skill for:

- **Auto-publishing a deal-room without rep review.** The output is an outline
  and an asset-mapping draft. A human AE must select, redact, and approve
  before the buyer sees anything. The skill never sends, never publishes.
- **Deals that are not yet in a mutually-agreed-plan stage.** Pre-discovery,
  qualification, and early demo stages do not need a deal room. Sending one
  early is a forcing function the buyer did not ask for and reads as
  desperation.
- **Renewals where no new collateral is required.** A QBR deck and a usage
  report are not a deal room.
- **Net-new logos pre-NDA** for the security and pricing sections — the skill
  will refuse to populate those sections without an explicit `nda_signed:
  true` input.

## Inputs

Required:

- `account_brief` — the structured pre-discovery brief produced by the
  `account-research` skill, or an equivalent. Provides industry, scale,
  strategic priorities, persona-relevance hints.
- `deal_stage` — one of `mutual_plan`, `proposal`, `procurement`,
  `legal_redline`. Drives which sections the skill populates and which
  asset categories it pulls from.
- `stakeholder_map` — a list of named stakeholders on the buying committee,
  each with role (`economic_buyer`, `champion`, `technical_evaluator`,
  `end_user`, `procurement`, `legal`, `security`), seniority, and a one-line
  context note (e.g. "burned by previous vendor's pricing surprise").
- `asset_inventory` — the team's current collateral library, in the format
  of `references/asset-inventory-template.md`. Must include each asset's
  type, persona fit, deal-stage fit, last-updated date, and any
  share-restrictions (NDA-only, customer-logos-redacted, etc.).

Optional:

- `nda_signed` — boolean. Defaults to `false`. Gates security artifacts,
  customer reference details, and detailed architecture diagrams.
- `competitor_in_play` — slug of a named competitor the buyer is also
  evaluating. Pulls the relevant battlecard into the outline.
- `narrative_hint` — free-text from the rep, e.g. "land-and-expand framing,
  buyer is anxious about migration risk." Influences the suggested narrative
  arc.

## Reference files

Always read these from `references/` before generating the outline. Without
them, the output is a generic deal-room template and not specific to this
account.

- `references/asset-inventory-template.md` — the format the rep uses to
  describe what is in the asset library. Replace the template content with
  the team's actual inventory before invoking.
- `references/stage-to-asset-matrix.md` — the matrix that controls which asset
  categories appear at which deal stage and which are gated by NDA.
- `references/rep-gap-questions.md` — the question set the skill emits for
  the rep to fill in (proof points, named customers, commercial terms) before
  the deal-room is shared with the buyer.

## Method

Run these five sub-tasks in order. They are sequential — later steps depend on
earlier outputs.

### 1. Validate stage and gating

Read `deal_stage` and `nda_signed`. Cross-reference against
`references/stage-to-asset-matrix.md`. If the stage is `mutual_plan` and
`nda_signed` is `false`, the skill refuses to populate the security,
detailed-architecture, and reference-customer-name sections — these are
listed in the output as "gated: NDA required" rather than silently omitted,
so the rep can see what is being held back and why.

The engineering choice: silent omission would let the rep ship an incomplete
deal-room without realizing what they pushed past. Explicit gates force a
review step.

### 2. Map assets to stakeholders, not to deal stage

For each named stakeholder, walk the `asset_inventory` and select the 1-3
assets that match that stakeholder's role and seniority. A CFO in the
buying committee gets the ROI calculator and the pricing-model one-pager
first; a Director of Engineering gets the architecture diagram and the
SOC 2 summary first; an end-user lead gets the workflow walkthrough video
first.

The engineering choice: deal-stage-driven asset packs (the obvious approach)
produce the same deal-room for every buyer at the same stage. Persona-driven
mapping forces the AE to think about the actual people in the room. The
matrix in `stage-to-asset-matrix.md` is a filter on what is *available* at
each stage, not a substitute for persona matching.

### 3. Build the narrative arc

Propose a three-act structure for the deal-room landing page:

1. **Why act** — the strategic priority of the buyer that this purchase
   addresses, drawn from the `account_brief`. One paragraph, the buyer's own
   language where possible.
2. **Why us** — the wedge differentiation, with one proof point per
   stakeholder persona present in the buying committee. Pulls from the
   asset inventory's case-study and proof entries.
3. **Why now** — the close-plan summary: what the next 14-30 days look like,
   what the buyer's internal review needs from each role.

The narrative is a *suggestion* — the AE may rewrite it. The skill outputs
the proposed arc inline so it is reviewable, not buried in a separate file.

### 4. Layer in stage-specific sections

Walk the matrix from step 1 and add the sections that this `deal_stage`
unlocks:

- `mutual_plan` — landing narrative, persona-mapped assets, mutual close
  plan template, FAQ.
- `proposal` — adds the pricing model summary, ROI calculator link, contract
  preview (terms only, not signed).
- `procurement` — adds vendor questionnaire responses, security overview,
  insurance certificates list.
- `legal_redline` — adds MSA + DPA preview, jurisdictional appendices.

Pricing only appears at `proposal` or later. The engineering choice:
exposing pricing in the `mutual_plan` stage trains buyers to anchor on the
list price before the value conversation lands. The matrix enforces this
even if the rep is impatient.

### 5. Emit gap questions

For every section where the rep needs to make a judgment call — pick a
specific customer reference, confirm a discount band, confirm an
implementation date — emit a question pulled from
`references/rep-gap-questions.md`. These appear at the bottom of the output
under "Rep gaps to fill" and are deliberately blocking: the deal-room
outline is not "done" until the rep answers them.

## Output format

```markdown
# Deal-room outline — {Account name}

**Stage:** {deal_stage}    **NDA signed:** {true|false}    **Competitor in
play:** {competitor or "none"}

## Suggested narrative arc

1. **Why act.** {Buyer's strategic priority, one paragraph in their language.}
2. **Why us.** {Wedge differentiation + one proof point per persona present.}
3. **Why now.** {Close-plan summary — what the next 14-30 days require from
   each role.}

## Stakeholder → asset mapping

| Stakeholder | Role | Lead asset | Supporting asset | Asset gated? |
|---|---|---|---|---|
| {Name} | Economic buyer | ROI calculator (v3, 2025-03) | Pricing model 1-pager | No |
| {Name} | Technical evaluator | Architecture diagram | SOC 2 summary | NDA-gated |
| {Name} | End user | Workflow walkthrough (4 min) | Product tour | No |
| {Name} | Procurement | Vendor questionnaire response | Insurance certs list | No |

## Sections to publish

- [x] Landing narrative (above)
- [x] Persona-mapped asset shelf
- [x] Mutual close plan (template attached: `mutual-close-plan.md`)
- [x] FAQ (rep edits before publishing)
- [ ] Pricing model summary — **gated: stage is `mutual_plan`, requires
      `proposal` or later**
- [ ] Security overview — **gated: NDA required**
- [ ] Reference-customer detail — **gated: NDA required**

## Rep gaps to fill before sharing

1. **Pick the reference customer for the technical evaluator's persona.**
   Three candidates from the inventory match: {A}, {B}, {C}. Which is the
   closest analog to the buyer's environment?
2. **Confirm the implementation date in "Why now."** The narrative says
   "go-live within 60 days of signature" — confirm engineering capacity.
3. **Confirm any commercial concessions to mention in the FAQ.** The FAQ
   currently says "standard terms"; if a discount or extended payment
   terms are on the table, the FAQ should be updated before publishing.

## Sources

- Account brief: {ref}
- Asset inventory: {ref}
- Stage-to-asset matrix: `references/stage-to-asset-matrix.md`
```

## Watch-outs

- **Sharing collateral pre-NDA.** The skill refuses to populate security,
  detailed-architecture, and named-customer-reference sections without
  `nda_signed: true`. *Guard:* gated sections appear in the output as
  "gated: NDA required" so the rep can see what is missing and chase the
  NDA explicitly, rather than silently shipping an incomplete deal-room.
- **Persona mismatch.** Title-based mapping can put the wrong asset in
  front of the wrong person — a "VP Operations" might be the economic buyer
  at one company and a blocker at another. *Guard:* the skill emits a
  per-stakeholder confidence note (`high` if the title pattern matches the
  ICP rubric exactly, `low` if it is inferred) and surfaces low-confidence
  mappings under "Rep gaps to fill" instead of locking them in.
- **Stale assets.** Deal-rooms full of 2-year-old case studies and
  superseded pricing pages do more damage than no deal-room at all. *Guard:*
  the asset inventory format requires a `last_updated` date on every entry;
  the skill flags any selected asset older than 9 months in the output as
  `stale?` so the rep refreshes or removes before publishing.
- **Narrative drift from the brief.** It is easy for the suggested narrative
  to wander into generic positioning. *Guard:* the "Why act" paragraph must
  cite a strategic priority from the `account_brief`; if no strategic
  priority is available, the section is emitted as `[REQUIRES INPUT — no
  strategic priority in brief]` rather than filled with platitudes.
