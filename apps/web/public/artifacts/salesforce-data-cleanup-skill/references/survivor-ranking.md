# Survivor ranking — TEMPLATE

> Replace this template's contents with your team's actual weighting.
> The Skill uses these weights when proposing which record survives a
> merge. Defaults below reflect the bias "where the team is actually
> working today" rather than "who has the most history."

## Composite score

For each record in a duplicate pair, the Skill computes:

```
score = 0.40 * activity_recency_signal
      + 0.30 * contact_count_signal
      + 0.20 * opportunity_history_signal
      + 0.10 * not_integration_user_signal
```

Higher score wins survivor status. Ties default to the record with the
lower (older) Salesforce Id, which is conventionally the canonical record.

## Signal definitions

### activity_recency_signal

- 1.0 if Tasks + Events in the last 30 days exist
- 0.7 if in the last 90 days
- 0.3 if in the last 365 days
- 0.0 otherwise

### contact_count_signal

- Normalized count of active Contacts attached to the Account.
  `min(count, 20) / 20`. Capped to avoid one record's bloat dominating.

### opportunity_history_signal

- 0.5 weight on count of Opportunities with `IsClosed = FALSE`
- 0.5 weight on log10(1 + sum of `Amount` across all Opportunities)
- Both halves min-max normalized across the candidate pair only

### not_integration_user_signal

- 1.0 if `LastModifiedById` is not in the integration-user allowlist
- 0.0 otherwise

The integration-user allowlist (set by RevOps admin):

- `dataloader@example.com.invalid`
- `marketo-sync@example.com.invalid`
- `outreach-sync@example.com.invalid`
- {add yours}

## Override columns

Even after the Skill proposes a survivor, RevOps can override per-row in
the dry-run CSV. The columns the Skill respects on read-back:

- `survivor_override` — set to the Id you want as survivor
- `do_not_merge` — set to `Y` to drop this row from `apply_fix`
- `defer_to_owner_review` — set to `Y` to route to the rep instead

## Disqualifiers — never auto-propose a survivor

Skip survivor proposal entirely if any of:

- Both records have an open Opportunity in `Negotiation` or later — too
  much risk of breaking deal motion mid-flight
- Records have different Account Owners and one is in their first 30 days
  on the team (avoid trampling new-hire pipelines)
- One record carries a `Strategic_Account__c = TRUE` flag — kick to a
  RevOps human

## Last edited

{YYYY-MM-DD}
