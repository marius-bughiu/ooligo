---
name: rep-onboarding
description: Generate a personalized 30/60/90-day onboarding plan for a newly hired sales rep. Tailors week-by-week milestones, named call recordings, certifications, and manager check-in cadence to the rep's prior background, the segment they'll work, and your team's actual ramp data. Output is Notion-ready markdown the hiring manager edits in 15 minutes before day one.
---

# Rep onboarding plan

## When to invoke

Use this skill when a new sales rep has signed an offer and you need a personalized 30/60/90-day plan ready before their first day. The skill produces a single Notion-ready markdown brief covering weeks 1-12, with named call recordings, named certifications, named role-play exercises, and a manager check-in cadence calibrated to your team's historical ramp time.

Typical triggers:

- New AE or BDR has accepted an offer and starts in 1-3 weeks
- A tenured rep is being moved to a new segment (e.g. SMB up to mid-market) and needs a re-ramp plan
- A manager is hiring a backfill and wants to compare the auto-generated plan to their manual draft

Do NOT invoke this skill for:

- **Performance management of a ramped rep.** A ramping rep missing milestones is a coaching problem; this skill writes the plan, not the PIP.
- **Replacing the manager-rep conversation.** Day-one alignment, expectations on culture, and personal context belong to the manager. The plan is a scaffold the manager edits, not a script the rep follows in isolation.
- **Comp, quota, or territory decisions.** Quota carry, draws, and territory carve-outs are policy choices that belong to RevOps and Finance. The skill assumes those are already set and reads them as inputs.
- **Generic enablement program design.** The skill produces one plan for one rep, not a curriculum.

## Inputs

Required:

- `rep_name` — full name, used in the output header only
- `rep_background` — one of `first-sales-job`, `competitor`, `adjacent-saas`, `up-market-from-smb`, `down-market-from-enterprise`, or a free-text description if none of the canned categories apply
- `segment` — the segment the rep will sell into: `smb`, `mid-market`, `enterprise`, or a custom segment name your team uses
- `start_date` — ISO date; used to compute calendar week labels in the plan

Optional:

- `linkedin_url` — pulled to enrich `rep_background` if the canned category is too coarse
- `manager_preferences` — free-text from the hiring manager (e.g. "this rep is anxious about cold calling, front-load discovery shadows")
- `prior_ramp_data_path` — path to a CSV of prior reps' time-to-first-deal and time-to-quota in the same segment; the skill calibrates milestone weeks against this data instead of using defaults
- `comp_plan_summary` — one-paragraph summary of the rep's quota and ramp draw, included verbatim in the plan so the rep sees it day one

## Reference files

Always read the following from `references/` before generating the plan. Without them, the output is a generic 30/60/90 template that ignores your motion, your library, and your team's actual ramp curve.

- `references/1-segment-milestones-template.md` — what "ramped" looks like for each segment you sell into; the skill calibrates weekly milestones against this. Replace the template content with your team's real definitions.
- `references/2-resource-library-template.md` — your tagged Gong calls, Notion docs, certifications, and role-play scenarios, organized by stage of the motion. The skill picks from this list rather than inventing resource names.
- `references/3-manager-check-in-template.md` — the question scaffolding the hiring manager runs each week. The skill embeds week-specific questions from this file into the plan output.

## Method

Run these five sub-tasks in order. Steps 3-5 depend on context produced in steps 1-2; do not parallelize.

### 1. Classify the rep against your motion

Read `rep_background` plus optional `linkedin_url`. Map the rep to one of: needs-fundamentals (first sales job), needs-positioning (competitor hire — knows how to sell, doesn't know your story), needs-product (adjacent SaaS — knows the buyer, doesn't know the product), needs- multi-threading (up-market from SMB — single-threaded muscle memory), or needs-velocity (down-market from enterprise — used to long cycles). The rest of the plan keys off this classification.

Engineering choice: a fixed 5-bucket classifier rather than free-form categorization. Free-form classifiers drift across runs; the bucket the plan keys off must be stable so milestones stay comparable across reps.

### 2. Calibrate milestone weeks against actual ramp data

If `prior_ramp_data_path` is set, compute the median week-to-first-deal and week-to-first-quota-month from the CSV for reps in the same segment. Set the plan's milestone weeks to those medians. If no data is available, fall back to defaults from `references/1-segment- milestones-template.md` and add a note: "milestone weeks are defaults; recalibrate after 5+ reps have ramped in this segment."

Engineering choice: median over mean. One outlier rep who ramped in week 3 or week 24 should not pull the plan's milestones. Median is the honest signal of what most reps actually do.

### 3. Pick named resources from the library

For each week of the plan, select 2-4 resources from `references/2- resource-library-template.md` matching the week's focus and the rep's classification. A needs-positioning rep gets more competitive-frame calls in weeks 1-2; a needs-fundamentals rep gets more discovery calls across weeks 1-4. Resources are referenced by name (e.g. "Acme discovery — Gong call ID gc_4821"), never by generic descriptor (e.g. "a good discovery call").

Engineering choice: named resources with stable IDs. Generic descriptors mean the manager has to re-pick everything; named resources mean the rep can self-serve from day one.

### 4. Set named-deal targets, not activity targets

By week 8, each rep should have a written list of 5-10 named target accounts from their territory (pulled from CRM via the optional `crm_query_path`). The plan asks the rep to produce account briefs for each, and the manager to score them in the week-8 check-in.

Engineering choice: named-deal targets over activity targets (e.g. "50 calls per week"). Activity targets reward motion without progress and hide rep struggle behind the dialer. Named-deal targets force both rep and manager to look at the actual work.

### 5. Embed manager check-in questions inline

Each week ends with a section labeled "Manager check-in" containing 3-5 specific questions pulled from `references/3-manager-check-in- template.md`, week-numbered. Generic check-ins ("how's it going?") get skipped; named questions ("what did you learn from the Acme discovery call you shadowed Tuesday?") force the conversation to specifics.

## Output format

The skill writes a single markdown file named `<rep_name>-onboarding- plan.md`. Literal example:

```markdown
# Onboarding plan — Jane Doe

**Start date:** 2026-05-12
**Segment:** mid-market
**Classification:** needs-positioning (competitor hire)
**Manager:** [hiring manager name]
**Quota / ramp:** [comp_plan_summary verbatim, or "TBD — confirm with manager day one"]

## Week 1 (May 12-16) — Product fundamentals + competitive frame

**Focus:** Learn the product enough to demo the wedge use case. Internalize the competitive frame against your prior employer.

**Activities:**
- Mon: Onboarding logistics, laptop, tools, intros
- Tue: Product walkthrough with PM (90 min); self-paced demo recording
- Wed: Read `positioning-one-pager.md`; watch competitive-frame calls listed below
- Thu: Shadow Acme discovery call with [senior AE]; debrief 30 min after
- Fri: Manager check-in (see questions below)

**Named resources:**
- Gong: "Acme discovery vs Competitor X" — gc_4821
- Gong: "Beta Corp objection-handling — pricing" — gc_5102
- Notion: `positioning-one-pager.md`
- Cert: Product fundamentals quiz (must pass week 2)

**Milestone:** Recorded 5-min walkthrough of the wedge use case, reviewed by manager.

**Manager check-in questions:**
1. Where does our positioning feel weak compared to your prior employer?
2. What's the one demo move you'd steal from the calls you watched?
3. Anything blocking you from starting week 2 on Monday?

## Week 2 (May 19-23) — Internal certifications + first role play
[...weeks 2-12 follow the same shape...]

## Milestones summary

| Week | Milestone | Calibrated from |
|---|---|---|
| 4 | First independent discovery call | median ramp data, n=12 prior reps |
| 8 | Named-target account list (5-10 accounts) with briefs | default |
| 10 | First closed-won deal | median ramp data, n=12 prior reps |
| 12 | Full quota carry | comp plan |

## Resource library used

[Flat list of every resource referenced above, with stable IDs.]
```

## Watch-outs

- **Over-prescriptive plans don't survive contact with reality.** A day-by-day plan for week 5 is a fantasy — by then the rep is in live deals on their own schedule. **Guard:** the skill writes day-by-day detail only for weeks 1-4; weeks 5-12 are weekly themes with milestone gates, not daily tasks.
- **Missing context-specific deal patterns.** A generic mid-market plan ignores that your mid-market motion has a specific procurement quirk (e.g. always a security review, always a 30-day legal cycle). **Guard:** the segment milestones template includes a "non-obvious motion quirks" section the skill embeds verbatim into the week-6 and week-9 plan sections, so the rep is not surprised by the first one they hit.
- **Milestone-as-performance-metric drift.** Once a milestone week ("first deal by week 10") becomes a number the rep is graded on, managers stop using it as a coaching signal and start using it as a stick. Reps then game the milestone (closing a tiny deal in week 10 to clear the bar) instead of building the muscle. **Guard:** the plan's milestones section explicitly labels each milestone as "calibration signal, not performance metric" and the manager check-in template's week-10 question is "if the rep didn't hit the milestone, what's the coaching action?" — never "is the rep on track?"
- **Stale resource library.** A Gong library tagged 18 months ago references calls with reps who have left, deals that lost, and a competitive landscape that no longer applies. **Guard:** the resource library template includes a `last_reviewed` field per resource; the skill skips any resource older than 12 months and surfaces a TODO for the enablement owner to refresh.
- **Resume-driven assumptions.** The 5-bucket classifier from step 1 is a starting hypothesis, not ground truth — resumes overstate, LinkedIn understates. **Guard:** the manager check-in for week 1 includes the question "did the classification we used (needs-positioning) match what you're seeing day-to-day?" and the plan can be regenerated with a corrected `rep_background` after week 2.
