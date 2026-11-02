# Corrections log

This is the only mechanism by which the ooligo content quality bar improves. Every reader-reported error gets logged here, triaged, fixed, and — if a class of error recurs — fed back into `CONTENT_PIPELINE.md` and `CONTENT_VOICE.md` as a bar update.

Without this loop, the bar stays static while reality drifts. With it, every reported error is one of: a fix, or a learned rule.

## How to report a correction

- **GitHub Issue**: open an issue at <https://github.com/marius-bughiu/ooligo/issues> with the `correction` label. Include the page URL, the specific claim or section that's wrong, and (if you have it) the source for the correct version.
- **Email**: marius.bughiu@gmail.com with subject `[ooligo correction]` and the same details.

If you spot a bias issue (e.g. a recommendation that seems skewed by an undisclosed affiliation), say so explicitly. Bias reports are routed differently (see "Bias triage" below).

## Triage rules

- **All reports get a response within 7 days**. Either a fix lands and the reporter is notified, or the report is closed-with-reason and the reporter is told why.
- **Factual errors get a same-day fix** when the source is in hand. Pricing, dates, named integrations, regulatory citations.
- **Stale-data reports** trigger a refresh against current sources, not a one-line patch. Re-author the affected sections; bump `last_updated`.
- **Voice / bias reports** route to a quarterly review, not an immediate fix, unless the language is actionable-libel-adjacent (defamation risk). Then immediate.
- **Missing-context reports** ("you didn't mention that X breaks Y") trigger an inline addition + entry in this log so the same gap is checked across sibling pages.

## Quarterly bar review

Every quarter, a single session walks this entire log and asks one question per error class: *did this surface a gap in the bar that needs codifying?*

If a class recurs **3+ times in a quarter**, the bar is missing something. Update `CONTENT_PIPELINE.md` (for substance gaps) or `CONTENT_VOICE.md` (for voice gaps), and link the doc-update commit back to the corrections that triggered it.

The quarterly review also looks at:

- Are we fixing the same page repeatedly? Maybe the page needs a full re-author, not patches.
- Are corrections clustered in one vertical? Maybe that vertical needs deeper editorial review.
- Are corrections clustered against entries from a specific authoring session? Maybe that session's prompt needs revision.

## Log format

Each entry uses this template (most recent at top):

```markdown
### YYYY-MM-DD — [page slug] — [error class]

**Source**: GitHub issue #N | email | Slack | internal review
**Page**: `<full path or URL>`
**Reported by**: name (or "anonymous reporter")
**Class**: factual | stale | voice | missing-context | bias | broken-link | translation
**Severity**: high (page is misleading on a load-bearing claim) | medium (page is partially wrong) | low (typo, minor)

**What was wrong**:
A specific quote of the original content + what the reporter said is wrong.

**Resolution**:
- Fixed in commit `<sha>`: brief description of the fix
- OR closed-with-reason: explanation of why no fix is warranted

**Bar implication** (filled in at quarterly review):
- Class so far this quarter: 1 of N (or "first instance")
- Bar update: none yet (awaiting recurrence) | linked to CONTENT_PIPELINE.md commit `<sha>` | linked to CONTENT_VOICE.md commit `<sha>`
```

## Bias triage

A bias report ("you recommend X but the affiliate-link is set" or "you dismiss Y but Y has 40% market share") gets specific handling:

1. **Same-week response** with the editorial reasoning behind the recommendation, citing the source bucket per `CONTENT_PIPELINE.md`.
2. If the reporter is right and the recommendation is genuinely affiliation-influenced, the affiliate link is removed and the recommendation is re-evaluated against the bar.
3. The bias report is logged here regardless of outcome — even when the recommendation stands. Pattern detection across multiple bias reports is what catches systemic skew.

## Closed-with-reason templates

Not every report results in a fix. Common close-reasons:

- **Out of scope**: "The reporter wants us to add a tool we've explicitly chosen not to cover (e.g. consumer apps for personal use). Catalog scope is in `ARCHITECTURE.md`."
- **Disagree on the recommendation**: "The page recommends X over Y. Reporter prefers Y. We've reviewed the bar evidence and stand by X. Reporter's preference noted; will revisit at quarterly review if pattern emerges."
- **Source unavailable**: "Reporter says claim is wrong but didn't provide a counter-source. Searched current vendor docs / public reports / etc. and could not find a more current number. Original claim stands; flagged for re-check at next refresh SLA."
- **Already addressed**: "Issue was already fixed in commit X (date)." Link the commit.

---

## Log

*New entries below this line. Most recent at the top.*

### 2026-11-02 — Sales-cycle percentiles and SaaS customer economics

The sales-cycle guide called P90 a worst-case estimate. In the revised nine-opportunity example, the five wins have a 30-day median, a 76-day inclusive P90 and a 100-day maximum. Loss durations and the age of open deals are reported separately. [Sales cycle length](https://ooligo.com/en/learn/sales-cycle-length/)

The LTV:CAC and unit economics guides used universal spending thresholds and blurred revenue from new and existing customers. The new example attributes acquisition spending to ten new subscribers. It yields a 20-month simple payback, while a separate calculation for existing customers yields 102.5% net revenue retention. All six language editions link to the same editable workbook and explain the fictional inputs and assumptions. [LTV:CAC](https://ooligo.com/en/learn/ltv-cac/) · [Unit economics](https://ooligo.com/en/learn/unit-economics/) · [Example workbook](https://ooligo.com/downloads/revops-cohort-workbook.xlsx)

### 2026-11-02 — Attio stack budgets and Claude versus Cursor

The Attio CRM stack budget assumed ten Fathom Team seats while leaving readers to infer which CRM could receive all ten users’ summaries. All six editions now separate a manual Attio note from a supported ten-user HubSpot connection. The illustrative annual software totals start at USD 16,554 plus EUR 240 with Fathom Team and USD 17,754 plus EUR 240 with Business. They exclude implementation, usage overages and the cost of HubSpot. The guides give acceptance criteria for a custom Fathom-to-Attio handoff that still needs a workspace trial. [Fathom CRM connections](https://www.fathom.ai/integrations-crm) · [Fathom team prices](https://www.fathom.ai/pricing?plan=teams)

The Claude versus Cursor comparisons previously treated Cursor as a single-model editor and described buying both products as typical. All six editions now distinguish Claude chat, Claude Code and Cursor, explain individual pricing and model charges, and include a two-record CRM import exercise. The supporting Cursor profiles also correct the listed API capability, personal pricing and Privacy Mode coverage. [Claude Code](https://code.claude.com/docs/en/overview) · [Cursor plans](https://cursor.com/pricing) · [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints) · [Cursor security](https://cursor.com/security)

### 2026-11-02 — Workflow downloads and reproducible examples

An internal review found that the candidate sourcing, forecast prep, renewal playbook and contract redlining guides described integrations or results beyond their downloaded instructions. The hiring-funnel detector also omitted data setup, missed inactive roles and referred to another schedule's output while processing time-to-hire alerts.

Commit `5d9558651d64a40befbde7a2f4766a1b9176e31d` corrects all five guides in English, Spanish, Brazilian Portuguese, German, French and Japanese and updates their five download bundles.

- The hiring detector now reads a documented Ashby API format, uses complete dated snapshots and supplies its PostgreSQL schema. The one-alert fixture queues one alert and zero more on replay. In seven n8n executions using native PostgreSQL, manual test triggers and local model and Slack responses, the larger fixture yielded four distinct deliveries and zero additional calls on replay. Live credentials and wall-clock scheduling still need an operator trial.
- Forecast prep includes two dated CSVs and a local program that reproduces the expected briefing. Candidate sourcing includes a local evidence worksheet with explicit hold handling. The renewal example traces a change from 12 to 8 active seats, out of the same 20, to a named review owner and date.
- Contract redlining includes two fictional Word documents. The review copy has a native replacement and two anchored comments. The verifier checks the accepted and rejected text and preservation of the rest of the fixture. The guides identify the editing tools and human review needed for a real matter.

The examples use fictional records. The guides distinguish the checks performed from live account access, outcome measurement and human approval. Workflow file panels offer Word downloads and treat JSON fixtures as data files.

### 2026-11-02 — Vendor access, module pricing and related shortlists — factual

**Source**: internal editorial review
**Pages**: ZoomInfo and Metaview tool profiles; conversation-intelligence and legal-operations shortlists. All six locales: en, es, pt-BR, de, fr, ja.
**Reported by**: Codex-assisted internal review
**Class**: factual / stale / missing-context
**Severity**: high — capability and pricing premises changed the buying recommendations

**What was wrong**:

- ZoomInfo was marked as having no MCP server. The profiles also asserted regional data superiority, contract norms and numeric scores without a documented evaluation.
- Metaview's Notetaker was described as quote-only, with Sourcing treated as the paid entry point. Application Review billing was incorrectly reduced to a per-user assumption. The MCP description said read-only despite current documentation describing writes and candidate messages.
- The conversation-intelligence shortlist carried unsupported scores, bundle savings and adoption claims. Its Fathom description omitted paid deal/coaching features, and its Metaview framing was inconsistent with the module-specific purchase options.
- The legal-operations shortlist used an outdated Claude Team seat minimum, an unverified combined Claude/Spellbook budget, and unsupported price ratios and buying thresholds. It also described Spellbook as limited to one document despite Associate's multi-document scope.

**Resolution**:

- Fixed in commit `76912887429599822dc156506ebae1b0755f5d26`: refreshed 24 localized pages against current official sources, corrected access and billing scope, removed unsupported ratings and commercial claims, and replaced them with task-specific evaluation criteria.
- The shortlist price labels now use the same qualified pricing information as their articles. Internal links and metadata are localized; meaningful body revision dates are November 2.
- Primary evidence includes [ZoomInfo MCP](https://docs.gtm.ai/docs/connect-to-zoominfo-mcp), [Metaview Notetaker pricing](https://www.metaview.ai/pricing?product=notes), [Application Review pricing](https://www.metaview.ai/pricing?product=application-review), [Metaview MCP actions](https://support.metaview.ai/integrations/mcp-integration/mcp-overview), [Claude pricing](https://claude.com/pricing), and [Spellbook scope/pricing](https://spellbook.com/pricing). Additional product sources are linked beside the relevant claims in each article.
- Reviewed through primary-source checks, an independent editorial pass, locale parity checks, targeted builds and desktop/mobile browser QA. No paid-account benchmark or measured customer outcome is claimed.

**Bar implication**: apply the existing source-verification rules to capability flags, billing units and recommendations derived from prices, including displayed summary labels. Review recurrence at the next quarterly corrections review.
