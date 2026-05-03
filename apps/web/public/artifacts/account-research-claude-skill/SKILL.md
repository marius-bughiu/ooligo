---
name: account-research
description: Research a target account and produce a structured pre-discovery brief. Use this skill before every discovery call to ground the AE in company snapshot, strategic priorities, persona map, and three pain hypotheses tied to your product.
---

# Account research

## When to invoke

Whenever you need a pre-call brief on a B2B account: before discovery,
before a renewal conversation, before a strategic review, before
prepping a stakeholder map. Take a company domain or LinkedIn URL as
input and produce a structured Markdown brief.

Do NOT invoke this skill for:
- Personal-name research on individuals (privacy)
- Public-company financial analysis (use a finance tool)
- Anything that requires paid data sources you do not have configured

## Inputs

- Required: `domain` — the company's primary domain (e.g. `acme.com`)
  or a LinkedIn company URL
- Optional: `focus` — a free-text hint about the deal context (e.g.
  "expansion of existing logo, focus on Marketing Ops persona")
- Optional: `comparison` — slug of a competitor whose presence you
  want flagged

## Reference files

Always read the following from `references/` before generating the
brief. They contain the user's positioning and ICP rubric — without
them, the brief is generic.

- `references/positioning-template.md` — the user's product
  one-pager (replace contents with your actual positioning)
- `references/icp-rubric-template.md` — the rubric the brief uses to
  rank pain hypotheses (replace contents with your actual rubric)

## Method

Run these four sub-tasks in order. Do not parallelize — later steps
depend on context from earlier steps.

### 1. Snapshot

Fetch the company homepage, About page, and careers page. Extract:
- One-sentence company summary (industry, scale signal, core offering)
- Headcount range (from About or LinkedIn, never invented)
- Geographic footprint (HQ + notable offices)
- Notable customers or markets they cite publicly

If a fetch fails (404, paywall, etc.), record "unavailable" rather
than guessing.

### 2. Strategic priorities

Search for: earnings transcripts, press releases, blog posts, funding
announcements from the last 90 days. Also: changes to their About page
(if available via web archive).

Output: 3-5 strategic priorities, each with a citation (URL + brief
quote). If no recent signal, write "no recent strategic signal found"
— do not invent priorities.

### 3. Persona map

For each ICP-relevant role at this company (RevOps, Marketing Ops,
Sales Ops, IT — adjust to your ICP from the rubric), find:
- Current incumbent's name and title (from LinkedIn — only if
  public-visible)
- Tenure in role
- Prior company

Constraint: never invent reporting lines. If you cannot see "X reports
to Y" in public data, write "reporting line not public." Hallucinated
org charts is the failure mode this section guards against.

### 4. Pain hypotheses

Cross-reference the snapshot, strategic priorities, and persona map
against the positioning doc and ICP rubric. Produce three pain
hypotheses, ranked. For each:
- The pain (one sentence)
- The signal that supports it (cite snapshot or priority)
- The discovery question that would confirm it (single, specific)

Constraint: every hypothesis must trace to evidence in section 1, 2,
or 3. If you cannot produce three evidenced hypotheses, produce two
or one. Never pad.

## Output format

```markdown
# Account brief — {Company name}

## Snapshot
- Industry: ...
- Scale: ...
- Geo: ...
- Notable customers: ...

## Strategic priorities (last 90 days)
1. ... [citation]
2. ... [citation]
3. ... [citation]

## Persona map
| Role | Name | Tenure | Prior |
|---|---|---|---|
| RevOps | ... | ... | ... |

Reporting lines: not public.

## Pain hypotheses
1. **{Pain}.** Signal: {evidence}. Ask: "{discovery question}"
2. ...
3. ...

## Sources
- {URL 1}
- {URL 2}
```

## Watch-outs

- **LinkedIn scraping breaks frequently.** When persona data is
  unavailable, surface that openly rather than synthesizing names.
- **Earnings transcripts lag.** A "last 90 days" claim is honored
  only by date-stamped sources. Note publication dates in citations.
- **Positioning drift.** The brief reflects the positioning doc as
  loaded. If positioning was updated more than 6 months ago, prepend
  a one-line note: "Positioning doc may be stale (last edited
  {date})."
- **Don't write the deal strategy.** This skill produces a brief.
  The AE writes the strategy.
