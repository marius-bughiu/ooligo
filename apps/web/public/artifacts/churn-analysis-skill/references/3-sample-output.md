# Sample output

> This file shows the literal markdown shape the churn-analysis skill
> emits. It exists so the skill can validate its own output against a
> known structure and so reviewers can preview what they'll receive.
> Do not modify unless you also update the `Output format` section in
> `SKILL.md` — the two must stay in lockstep.

## Example: a fully populated analysis

```markdown
# Churn analysis — Acme Industries (HUB-5523-ACME)

**Churn date:** 2026-04-15
**Analysis date:** 2026-04-22
**CSM:** Jordan Lee
**Contract value at churn:** $84,000 ARR

## Triggering event
The renewal call on 2026-04-08 in which the new VP of Marketing
declined to commit to a renewal pending a stack consolidation review,
citing the parent company's directive to consolidate on HubSpot.

## Root cause classification

**Primary:** `consolidation` — Acme's parent company issued a
March 2026 directive to consolidate marketing tooling onto HubSpot
across all subsidiaries; Acme was a subsidiary affected by this.
**Contributing:** `champion-departure`, `adoption-failure`

### Evidence supporting primary
- 2026-03-12 (Gong, call ID 18221): "Look, the parent company is
  asking us to justify every non-HubSpot tool. We have to make that
  case and right now I can't."
- 2026-03-28 (CRM note, Sarah K.): "VP confirmed parent-company
  consolidation initiative; Acme expected to comply by Q3."
- 2026-04-08 (Gong, call ID 18445): "I'm not signing the renewal
  until I've heard back from corporate on what we're keeping."

### Evidence supporting each contributing factor
- **champion-departure:**
  - 2026-02-14 (LinkedIn): Maria Chen (former Director of
    Marketing Ops, our champion since 2024) departed for a new role.
  - 2026-02-20 (CRM contact-change): Maria Chen marked inactive;
    no replacement sponsor identified.
- **adoption-failure:**
  - 2026-01 to 2026-04 (Gainsight): WAU dropped from 34 to 11 over
    the final 90 days, below the success-plan threshold of 25.

## Missed signals
- The parent-company consolidation initiative was announced
  publicly on 2026-02-03 in an investor call transcript. The CSM
  did not see this until the renewal call on 2026-04-08 — a 64-day
  gap during which the conversation could have shifted from
  defending the renewal to positioning a smaller, integrated
  footprint.

## Deviation from success plan
The success plan signed on 2025-10-01 committed Acme to ship two
integrations (Salesforce sync by 2025-12-15, lead-scoring webhook
by 2026-02-01). Neither shipped. The lead-scoring webhook was
deprioritized after Maria's departure on 2026-02-14, and no new
sponsor was found to advocate for it. WAU degradation tracks
directly against this missed milestone.

## Prevention recommendation

**Action:** `consolidation-conversation-trigger`
**Trigger:** the parent-company investor-call mention on 2026-02-03
should have fired a watchlist alert that booked a CSM check-in
within 14 days. That check-in would have given Acme 60 days to
position the product against displacement instead of 7.
**Owner:** CSM (Jordan Lee) + AE (Pat Morgan)

## CSM review

- [ ] CSM has read this analysis
- [ ] Factual errors corrected (track changes)
- [ ] Root-cause classification confirmed or overridden (CSM judgment wins)
- [ ] Prevention recommendation accepted, modified, or rejected (with reason)
```

## Example: insufficient-data short-circuit

When the timeline has fewer than 3 events in the 30 days before churn, the skill stops at step 1 and emits:

```markdown
# Churn analysis — Acme Industries (HUB-5523-ACME)

**Churn date:** 2026-04-15
**Analysis date:** 2026-04-22

**Status:** insufficient data — fewer than 3 timeline events in the
30-day pre-churn window; manual CSM postmortem required.

The skill cannot produce a defensible root-cause classification
from the available timeline. Recommended next step: the account's
CSM writes a free-text postmortem and the team reviews whether
instrumentation should be improved for accounts of this profile
(low-touch tier, light Gainsight coverage, or similar).
```

## Example: insufficient-evidence classification

When the evidence pass produces evidence rows but no category clears the 3-row threshold, the skill emits the full structure above with primary set to `insufficient-evidence` and a note that the analysis ends without a prevention recommendation pending CSM input.
