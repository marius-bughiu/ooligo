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
