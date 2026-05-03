---
name: icp-list-builder
description: Build a ranked target-account list from public signals using a closed-won seed pattern. Input is a seed of 10-20 closed-won accounts plus an ICP rubric; output is a ranked list of 100-500 lookalike candidates with per-account evidence, ready to write to a Clay table for outbound or AE territory routing.
---

# ICP list builder (Clay + Claude)

## When to invoke

Invoke this skill when a RevOps or SDR leader needs a fresh target-account list
grounded in what already worked — not in a generic "mid-market SaaS in fintech"
description. The skill takes closed-won accounts as the ground truth, extracts
the firmographic + technographic + intent signature shared across them, then
proposes Clay filters that produce lookalikes plus a ranked candidate list with
evidence.

Typical triggers:

- Quarterly territory refresh — AEs need a new draft list per region
- New product or new wedge launch — the seed list is small (10-20 wins) and you
  want the next 100 to look like them
- Outbound program needs more accounts after the obvious ICP has been worked

Do NOT invoke this skill for:

- Auto-loading the output into outbound sequences without rep review. The
  output is a ranked draft, not a send list. AE or SDR review is mandatory.
- Scoring on protected-class proxies (founder gender, ethnicity, school).
  Rubric weighting must be on firmographic and intent signals only.
- Account lists for ABM tier-1 named accounts — that work is hand-built and
  this skill's lookalike loop has too much variance for tier-1 selection.
- Buying-signal scoring inside an existing CRM record (use a CRM-native intent
  tool — this skill writes new candidates, it does not re-score known ones).

## Inputs

Required:

- `seed_accounts` — CSV with columns `company_name`, `domain`, `why_we_won`
  (two sentences). 10-20 rows. Rows with missing `why_we_won` are dropped
  with a warning rather than silently skipped.
- `icp_rubric` — path to `references/1-icp-rubric-template.md` filled in for
  your team. Defines hard firmographic gates and signal-weight ordering.
- `target_list_size` — integer, the number of ranked candidates to return.
  Default 100. Hard cap 500 (above that, Clay credits and signal noise both
  blow up).

Optional:

- `signal_sources` — path to `references/2-signal-source-matrix.md` to override
  which public sources Clay/Claude should query and which it should ignore.
  Defaults: company website, LinkedIn company page, BuiltWith, public
  hiring pages, last-90-day press/funding announcements.
- `exclusion_list` — path to `references/3-exclusion-criteria.md`. Domains,
  parent companies, or firmographic patterns that must never appear in the
  output (existing customers, active opportunities, do-not-contact, known
  losses inside last 6 months).
- `territory_filter` — geography or vertical filter applied after scoring,
  for splitting the output by AE territory.

## Reference files

Always read the following from `references/` before generating the list. They
contain the team's actual ICP definition, source preferences, and exclusions.
Without them, the list is generic and may write banned domains.

- `references/1-icp-rubric-template.md` — hard firmographic gates plus the
  signal-weight order used for scoring. Replace template contents with your
  real rubric before first run.
- `references/2-signal-source-matrix.md` — which public sources count as
  primary vs corroborating, and which are explicitly disallowed (low-quality
  scraped databases, stale aggregators). Replace with the team's source
  policy.
- `references/3-exclusion-criteria.md` — banned domains, parent companies,
  firmographic patterns to drop. Replace with the team's actual exclusion
  list before first run.

## Method

Run these six steps in order. The deterministic firmographic filter MUST run
before any LLM scoring — running scoring across the full Clay universe wastes
credits and pulls in obvious misfits.

### 1. Load and validate inputs

Read `seed_accounts`, `icp_rubric`, and `exclusion_list`. Drop seed rows with
missing `why_we_won` and warn. Refuse to proceed if fewer than 8 valid seed
rows remain — the signature extraction is unreliable below that floor.

### 2. Extract the seed signature

Send the validated seeds to Claude with the ICP rubric as context. Ask for a
structured signature: industry codes, headcount band, revenue band (if known),
geography, funding stage, technographic markers (specific tools), intent
markers (hiring patterns, page additions, public announcements), and
disqualifiers observed.

Why Claude here, not a SQL query: the `why_we_won` notes encode tacit signals
("they had a security and compliance page" — not a Clay column) that
firmographic queries miss.

### 3. Apply deterministic firmographic filter in Clay

Translate the signature's industry, headcount, revenue, geography, and funding
gates into Clay filters. Run them first to narrow the universe to ~500-3000
candidates before any LLM cost is spent. Drop anything in `exclusion_list`
at this stage.

Why deterministic first, LLM second: a single LLM scoring pass at full Clay
universe scale costs roughly 30-100x more than a filter pass, and 80-90% of
the rejections are obvious firmographic misfits that need no reasoning.

### 4. Enrich and corroborate intent signals

For each remaining candidate, ask Clay to enrich tech stack, hiring page
deltas, and last-90-day announcements. Pass each candidate to Claude with the
seed signature and ask for a per-signal match score (0-3) plus a corroborating
citation URL.

Constraint: any single intent signal (e.g. "hired a VP of Revenue") requires a
primary corroborating signal (LinkedIn job change visible from a second angle,
or a press release citing the hire). Single-source intent claims are scored
0 with reason "uncorroborated" rather than guessed. This is the guard against
intent-signal noise.

### 5. Rank, dedupe, and batch-write to Clay

Sort by total signal-match score, descending. Dedupe by domain (parent
companies via Clay's parent-company column where present — same parent counts
once). Write the top `target_list_size` rows to a new Clay table, one batch
write at the end rather than per-row.

Why batch + dedupe before write: Clay enrichment is metered per row, and
duplicate parent writes burn credits without adding accounts. A single batch
write also keeps the table consistent if the run is interrupted.

### 6. Produce the output report

Generate the markdown output (format below). Include a top section that
explains the seed signature so the AE/SDR reviewer can sanity-check the
shape of the list before working it.

## Output format

Output is a single markdown document, written to disk and surfaced to the
caller. Literal example shape:

```markdown
# ICP list — {date}

## Seed signature

- Industry: B2B SaaS — DevTools and Observability (NAICS 5415)
- Headcount: 80-350
- Revenue (where known): $10M-$60M ARR
- Geo: US + Canada, EMEA-EN
- Funding: Series B and C
- Technographic markers: Stripe, Datadog OR New Relic, Notion (corroborator)
- Intent markers: hired VP of Revenue or Head of Sales in last 9 months, or
  shipped a new public security/compliance page in last 6 months
- Disqualifiers observed: government contractor, parent in F500

## Ranked candidates (top 100 of 217 scored)

| Rank | Company | Domain | Score | Top signal | Exclusions flagged |
|---|---|---|---|---|---|
| 1 | Acme Observability | acme.io | 14/15 | Hired VP Rev (LinkedIn + Sept 2026 press release) | none |
| 2 | Beacon Logs | beaconlogs.com | 13/15 | Stripe + Datadog + Series B Aug 2026 | none |
| 3 | Ledger Trace | ledgertrace.dev | 12/15 | New SOC 2 page Oct 2026 | EU-only — territory split required |
| ... | ... | ... | ... | ... | ... |

## Signal-type breakdown across the top 100

- Hiring-signal-driven: 38
- Technographic-driven: 29
- Funding/announcement-driven: 22
- Multi-signal (3+): 11

## Exclusion-flag explanations

- 14 candidates flagged "EU-only — territory split required": these passed
  ICP but fall outside US/CA territories and should route to the EMEA pod.
- 3 candidates flagged "parent in F500": these were dropped from the ranked
  list per `exclusion_list`. Listed for audit only.
- 9 candidates flagged "uncorroborated intent": dropped per Step 4 guard.

## Run metadata

- Seeds used: 14 (2 dropped for missing why_we_won)
- Clay universe after firmographic filter: 1,847
- Candidates scored by Claude: 217
- Final ranked list: 100
- Clay credits consumed: ~870 (enrichment) + 217 (scoring lookups)
```

## Watch-outs

- **Junk firmographic data from public sources.** Aggregator headcount and
  revenue numbers lag reality by 6-18 months and are wrong by 30-50% on
  growth-stage companies. Guard: treat any single firmographic source as
  directional, require headcount or revenue agreement across two independent
  sources before applying a hard gate, and surface conflicts in the output
  ("LinkedIn says 120, BuiltWith says 380 — flagged for manual review").
- **Intent-signal noise.** A "hired a VP of Sales" signal scraped from
  LinkedIn alone misclassifies promotions, contract roles, and job-title
  inflation as net-new hires. Guard: Step 4 requires a primary corroborating
  signal (press release, second-angle LinkedIn evidence) before any intent
  signal scores above 0.
- **List poisoning from outdated databases.** Some Clay enrichment sources
  carry zombie companies (acquired, merged, defunct) that pass filters but
  cannot buy. Guard: drop any candidate whose website returns a 4xx/5xx, has
  no LinkedIn activity in last 90 days, or whose parent-company field
  resolves to a known acquirer. These are reported in the run metadata, not
  silently dropped.
- **Seed bias.** A seed list of 10 wins from one AE in one vertical produces
  a list that looks like that AE's territory, not the company's ICP. Guard:
  the skill warns if more than 60% of seeds share the same primary AE,
  vertical, or close-month, and asks the operator to broaden the seed before
  proceeding.
- **Filter over-fit.** A signature so tight it matches only the 14 seeds
  produces 0-30 candidates and feels precise but is useless. Guard: if the
  Clay firmographic-filter step returns fewer than 200 candidates, the
  skill loosens the headcount and revenue bands by one notch and re-runs
  rather than proceeding.
- **AE review is non-optional.** Skill output is a ranked draft. The output
  format is markdown (not a Clay-to-sequence webhook) deliberately to force
  a human review step before any send.
