# ICP rubric — TEMPLATE

> Replace this template's contents with your team's actual ICP rubric
> before the first run of `icp-list-builder`. The skill reads this file to
> set hard firmographic gates and signal-weight ordering. Without your
> real values, the candidate list will be generic.

## Hard firmographic gates

These are AND-gates — a candidate failing any single gate is dropped before
any LLM scoring runs. Keep this list short (5-8 dimensions max). Long gate
lists shrink the candidate universe below the 200-row floor and force the
skill to loosen filters anyway.

| Dimension | In-ICP | Stretch (allowed but downweighted) | Out (dropped pre-scoring) |
|---|---|---|---|
| Industry (NAICS or custom tag) | {list} | {list} | {list} |
| Headcount | {range, e.g. 80-500} | {range, e.g. 50-79 or 501-800} | {below/above} |
| Revenue (where known) | {range} | {range} | {range} |
| Geography | {regions, e.g. US/CA, EMEA-EN} | {regions, e.g. APAC-EN} | {regions, e.g. China, sanctioned countries} |
| Funding stage | {stages, e.g. Series B-D} | {stages, e.g. Series A late or Series E} | {stages, e.g. pre-seed, IPO+} |
| Business model | {e.g. B2B SaaS subscription} | {e.g. usage-based} | {e.g. consulting, services} |

## Technographic signals

Tools that signal a fit (we win when these are present). Each entry should
name a specific product, not a category.

- {Tool 1 — e.g. "Stripe (billing) — strong"}
- {Tool 2 — e.g. "Datadog or New Relic — strong"}
- {Tool 3 — e.g. "Notion (corroborator only, not a primary signal)"}

Tools that signal misfit. The skill downweights candidates with these.

- {Tool A — e.g. "Salesforce + manual CPQ — competing internal build"}
- {Tool B — e.g. "Legacy ERP with no API surface"}

## Intent signals

The signals the skill looks for in Step 4. Each must specify the primary
source AND the required corroborating source. Single-source intent counts as
zero per the skill's guard.

| Signal | Primary source | Required corroborator |
|---|---|---|
| Hired VP Rev / Head of Sales (last 9 months) | LinkedIn job change | Press release, company blog, or 2nd-angle LinkedIn evidence (e.g. announcement post) |
| New compliance page (SOC 2, ISO 27001, HIPAA) | Company website diff | Trust center URL or vendor listing |
| Funding round (Series A+) last 6 months | Crunchbase / company press | TechCrunch, PitchBook, or filed 8-K |
| Active hiring 5+ GTM roles | Public careers page | LinkedIn jobs cross-reference |

## Signal weights

The skill ranks candidates on a 0-15 scale across five signal categories.
Set the per-category weights here. Total must equal 15.

- Industry + business-model match: weight {N, e.g. 4}
- Headcount + revenue match: weight {N, e.g. 3}
- Technographic match: weight {N, e.g. 3}
- Intent signal (corroborated): weight {N, e.g. 4}
- Geography + funding stage match: weight {N, e.g. 1}

## Disqualifiers (skill flags prominently if found)

Single signals that drop a candidate regardless of other fit. Keep narrow.

- {Disqualifier 1 — e.g. "Parent company in Fortune 500 (procurement model wrong for our motion)"}
- {Disqualifier 2 — e.g. "Government contractor (compliance posture we cannot meet)"}
- {Disqualifier 3 — e.g. "Active acquisition in last 90 days (buying frozen)"}

## Last edited

{YYYY-MM-DD} — update on every material change so the skill can warn when the
rubric is stale (more than 6 months old triggers a stale-rubric notice in
the output report).
