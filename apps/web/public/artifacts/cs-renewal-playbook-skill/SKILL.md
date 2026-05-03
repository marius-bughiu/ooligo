---
name: cs-renewal-playbook
description: Generate a renewal playbook for an at-risk B2B SaaS account: renewal-probability band, stakeholder-by-stakeholder motions, talk-tracks for the top three objections, and an escalation gate. Use this skill at T-90 to T-120 days before renewal on accounts the CSM has flagged as at-risk, to convert health signals and call evidence into a draft action sheet the CSM reviews and executes.
---

# CS renewal playbook

## When to invoke

Invoke this skill when a CSM has flagged a renewal-window account as at-risk and needs a structured intervention plan. The account must be 90 to 120 days from renewal — earlier and the signal is too noisy, later and there is not enough runway to act on what the playbook recommends. Inputs come from Gainsight (health, success-plan history, stakeholder map) and Gong (last 180 days of calls). The output is a Markdown draft the CSM reviews, edits, and uses as the spine of their renewal motion.

Do NOT invoke this skill for:

- Accounts on auto-renewal where the contract auto-extends without a CSM-led motion. The playbook assumes the renewal is a moment of choice; auto-renewal accounts need an entirely different motion (de-risk the auto-renew trigger, not run a save play).
- Generating any content that will be sent to the customer without CSM review. The Skill produces internal strategy, not customer-facing copy. Talk-tracks are scaffolding for a human conversation, not scripts to paste.
- Drafting contractually-binding emails, commercial proposals, or anything that touches commercial terms. Pricing, discounting, term length, and legal language stay with the CSM and Deal Desk.
- Accounts under 50k ARR where the cost of a custom playbook exceeds the expected save value. Use a templated low-touch motion instead.

## Inputs

Required:

- `account_id` — the Gainsight account ID
- `renewal_date` — ISO date (YYYY-MM-DD); must be 90 to 120 days out
- `arr` — annual recurring revenue, in USD
- `segment` — one of `enterprise`, `mid-market`, `smb` (drives playbook template selection)

Optional:

- `risk_archetype_hint` — if the CSM already suspects an archetype (`champion-lost`, `low-adoption`, `pricing-pushback`, `competitive`, `value-gap`), pass it as a tiebreaker; the Skill still runs its own diagnosis and flags disagreement
- `competitor` — slug of a competitor named in calls, if known
- `executive_sponsor_email` — if the customer's executive sponsor is known, the Skill will tailor the executive-motion section

## Reference files

Always read the following from `references/` before generating the playbook. These contain the segment-aware playbook templates and the stakeholder-motion matrix the output is built from. Without them, the playbook degrades to generic CS advice.

- `references/1-segment-playbook-config.md` — per-segment playbook template (enterprise, mid-market, SMB) and which sections apply
- `references/2-stakeholder-motion-matrix.md` — recommended motion per stakeholder role and per risk archetype
- `references/3-output-format.md` — the literal Markdown shape the Skill must emit, with placeholder-filled example

## Method

Run these steps in order. Do not parallelize — each step depends on context the previous step established. The order is deliberate: contract terms first because they constrain everything else, then diagnosis, then segment-aware template selection, then the human-review gate.

### 1. Pull contract terms first

Fetch the active contract from Gainsight: term length, renewal date, ARR, any pre-negotiated price escalators, multi-year commitments, opt-out windows, auto-renewal clauses. This goes first because every downstream recommendation has to fit inside the commercial reality. Recommending a multi-year extension on an account that already has one is wasted output. Recommending a pricing concession on an account with a contractual escalator is wrong on its face.

If the contract has an auto-renewal clause and the opt-out window has not yet opened, abort and return: "auto-renewal account, opt-out window opens {date}; this skill is not the right motion."

### 2. Diagnose the risk archetype

Pull health-score history (last 180 days), success-plan progress, last 180 days of Gong calls, support-ticket pattern, and stakeholder-engagement frequency. Run a Claude classification pass against the four canonical archetypes:

- `champion-lost` — sponsor LinkedIn departure or a >40% drop in stakeholder-call frequency in the last 60 days
- `low-adoption` — usage trend below segment baseline despite onboarding completion (specifically: weekly active users below the segment p25 for two consecutive months)
- `pricing-pushback` — explicit pricing or budget mention in the last three calls, or a CFO/Procurement role added to the buying committee
- `competitive` — named competitor mentioned in two or more of the last five calls, or a competitor's vendor demo confirmed
- `value-gap` — none of the above, but health score has dropped two bands in 90 days

The Skill returns up to two archetypes ranked by confidence. If the CSM passed `risk_archetype_hint` and it disagrees with the top diagnosis, surface the disagreement explicitly rather than overriding either.

### 3. Compute the renewal-probability band

Renewal probability is bucketed, not point-estimated, because point estimates here are spurious precision. The bands are:

- `>70%` — likely renews; playbook focuses on expansion, not save
- `40-70%` — at risk; standard save motion
- `15-40%` — high risk; executive escalation likely required
- `<15%` — likely churns; the playbook becomes a de-risk-the-loss plan (data export, contract-termination terms, prevent-bad-references motion)

The band is computed from health-score trajectory, archetype confidence, and stakeholder coverage. The Skill emits the band and the three or four signals that drove it. It does not emit a percentage.

### 4. Select the segment-aware playbook template

Read `references/1-segment-playbook-config.md` and pick the template matching the `segment` input. Enterprise playbooks include an executive-sponsor motion, a procurement-engagement section, and a 90-day pacing plan. Mid-market drops the procurement section and compresses pacing to 60 days. SMB collapses to a single motion with a 30-day pacing plan and no executive-sponsor section.

Segment-aware selection matters because the same archetype demands a different motion at different deal sizes. A "low adoption" save on a 500k enterprise account warrants a CSM-and-CSM-leader joint executive business review; the same archetype on an 80k mid-market account warrants a 30-minute working session with the end-user team.

### 5. Generate stakeholder-by-stakeholder motions

For each stakeholder in the account's Gainsight stakeholder map, look up the recommended motion in `references/2-stakeholder-motion-matrix.md` based on (role × archetype). Output one motion per stakeholder with: who runs it (CSM, AE, CSM leader, exec sponsor), when (specific week in the 30/60/90 plan), what (a one-sentence objective), and the success signal (how the CSM knows it landed).

If a required role (per the stakeholder-motion matrix) is missing from the stakeholder map, surface that as a gap: "no economic buyer in stakeholder map; renewal-probability band is capped at 40-70% until one is identified."

### 6. Draft talk-tracks for the top three likely objections

Based on the archetype, generate three talk-tracks. Each is structured as: the objection (verbatim, in the customer's likely phrasing), the underlying concern, the response posture (acknowledge → reframe → ask), and the bridge question. These are scaffolding for the CSM's preparation — not scripts to read aloud. The Skill states this explicitly in the output.

### 7. Define the escalation gate

Specify the explicit signal that triggers escalation to the CSM leader, and from CSM leader to VP CS. Examples: "if executive sponsor declines the EBR within 14 days," "if renewal-probability band drops to <15% after week 4 motions," "if competitor confirms a signed pilot." The escalation gate is what prevents the CSM from grinding through a doomed save motion past the point of recoverability.

### 8. Human-review gate

The Skill emits the playbook with a top-banner instruction: "Draft for CSM review. Do not execute any motion until the CSM has reviewed, customized, and converted to Gainsight CTAs. No section of this output is customer-ready as-is." This is non-optional. Skipping it is the highest-severity failure mode — see watch-outs.

## Output format

The Skill emits a single Markdown file with this exact shape:

```markdown
# Renewal playbook — {Account name}

> **Draft for CSM review.** Do not execute any motion until the CSM has reviewed,
> customized, and converted to Gainsight CTAs. No section of this output is
> customer-ready as-is.

## Account context
- ARR: ${arr}
- Renewal date: {YYYY-MM-DD} (T-{N} days)
- Segment: {enterprise|mid-market|smb}
- Contract terms: {term length, escalators, opt-out window}

## Risk diagnosis
- **Primary archetype**: {archetype} (confidence: high|medium|low)
- **Secondary archetype** (if any): {archetype}
- **Signals**:
  - {signal 1, with citation: Gong call date or Gainsight metric}
  - {signal 2}
  - {signal 3}

## Renewal-probability band
**{>70% | 40-70% | 15-40% | <15%}**

Drivers:
- {driver 1}
- {driver 2}
- {driver 3}

## Stakeholder motions
| Stakeholder | Role | Owner | Week | Motion | Success signal |
|---|---|---|---|---|---|
| {Name} | Economic buyer | CSM leader | W2 | {one-sentence objective} | {signal} |
| {Name} | Champion | CSM | W1 | {one-sentence objective} | {signal} |
| {Name} | End user | CSM | W3 | {one-sentence objective} | {signal} |

Stakeholder gaps:
- {e.g. "no economic buyer in map; renewal-probability band capped until identified"}

## Talk-tracks for top objections

### Objection 1: "{verbatim objection in customer phrasing}"
- Underlying concern: {one sentence}
- Response posture: acknowledge → reframe → ask
  - Acknowledge: {one sentence}
  - Reframe: {one sentence anchored in value-realized data}
  - Ask: {single specific bridge question}

### Objection 2: ...
### Objection 3: ...

## Escalation gate
- Escalate to CSM leader if: {specific signal, specific date}
- Escalate to VP CS if: {specific signal}

## 30/60/90 pacing
- **Week 1-4 (T-90 to T-60)**: {summary of motions}
- **Week 5-8 (T-60 to T-30)**: {summary of motions}
- **Week 9-12 (T-30 to renewal)**: {summary of motions}
```

## Watch-outs

- **Over-confident probability bands.** The Skill's classifier will sometimes confidently bucket an account into `>70%` based on a strong health trend that masks a recent stakeholder loss. Guard: the band must always be paired with at least three drivers; if the Skill cannot produce three independent drivers, it downgrades the band one level. The CSM treats every band as a hypothesis, not a forecast.
- **Stakeholder-map drift.** Gainsight stakeholder maps go stale fast — sponsors leave, titles change, someone gets reorged into a different BU. The Skill compares Gainsight roles against LinkedIn current titles where possible and flags every stakeholder it cannot reconcile within the last 90 days. If more than half the map is unreconciled, the Skill aborts with: "stakeholder map staleness >50%; refresh in Gainsight before re-running."
- **Scripted talk-tracks losing trust.** If the CSM reads the talk-tracks as scripts, the customer will hear it and the renewal save dies. Guard: every talk-track is labeled "scaffolding for preparation, not a script" in the output, and the CSM is instructed to rewrite each one in their own voice before any conversation. The Skill does not produce conversational copy at all — it produces objection structure.
- **Recommending discounts.** The Skill is forbidden from recommending specific discount amounts or commercial concessions. If the archetype is `pricing-pushback`, the playbook routes the conversation to Deal Desk rather than proposing a number. Pricing decisions are out of scope.
- **Treating the playbook as the work.** The playbook is worthless if interventions are not converted to tracked Gainsight CTAs and reviewed weekly. The output's footer reminds the CSM of this; the workflow setup ties the output to a CTA-creation step.
