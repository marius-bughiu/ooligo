# Survivorship policy

Last edited: 2026-08-03 · Owner: `REPLACE_WITH_OWNER` · Portal: `REPLACE_WITH_HUB_ID`

This file decides two things: which records are duplicates, and which value wins per field. The Skill hard-stops if the winner table still contains `REPLACE_` placeholders. There is no default rule — an unfilled file means the argument has not been had yet.

## Part A — match rules

Rules run in priority order. The first rule that matches a pair assigns the group. Lower `id` prefix wins ties only for determinism, never for data quality.

| Rule | Object | Match condition | Confidence | Action |
|---|---|---|---|---|
| M-01 | contacts | Normalized `email` exact match | high | auto-group |
| M-02 | contacts | Normalized `phone` exact match AND same `associatedcompanyid` | high | auto-group |
| M-03 | contacts | `firstname` + `lastname` exact AND same `associatedcompanyid` | medium | ambiguous |
| M-04 | companies | Normalized `domain` exact match | high | auto-group |
| M-05 | companies | `name` exact match AND same `country` | medium | ambiguous |
| M-06 | deals | `dealname` exact AND same `associatedcompanyid` AND same pipeline | medium | ambiguous |

Normalization applied before every comparison: lowercase, trim whitespace, strip `+tag` from the email local part, strip protocol and leading `www.` from domains, reduce phone numbers to digits with country code.

`auto-group` proceeds to the winner table. `ambiguous` is written to `ambiguous.jsonl` and never applied without a human decision.

**Tune the confidence column, not the rule list.** Demoting M-02 to `ambiguous` is the correct first move on a portal with shared switchboard numbers. Promoting M-03 to `auto-group` is almost always wrong — common names inside one large account collide.

## Part B — primary record selection

The primary is the record that survives the merge and keeps its `id`. Downstream integrations key on that `id`, so the choice matters beyond data quality.

Selection order — first non-tied criterion wins:

1. Record with the most associated deals (protects revenue history).
2. Record with the earliest `createdate` (protects original-source attribution).
3. Record with the lowest `id`.

`REPLACE_IF_DIFFERENT` — if an external system (billing, product, warehouse) holds a HubSpot record id as a foreign key, that record must be primary regardless of the above. List those systems and their object types here.

## Part C — field-level winner table

This is the table that makes the merge safe. HubSpot's `objects merge` keeps the **primary's** value wherever both records hold one, so any field where the secondary is better must be pre-written onto the primary before the merge runs. The Skill performs that pre-write automatically for every field marked `pre-write: yes`.

| Field | Winner rule | Pre-write | Notes |
|---|---|---|---|
| `email` | primary | no | The merge preserves the secondary's email as an additional email on the primary. |
| `firstname` / `lastname` | S-01 longest-non-empty | yes | Guards against truncated form imports (`Jo` vs `Johanna`). |
| `jobtitle` | S-02 newest-non-empty | yes | Titles change; newest by `hs_lastmodifieddate` wins. |
| `phone` | S-04 newest-verified | yes | Prefer a value whose source is not a self-serve form. |
| `lifecyclestage` | S-03 furthest-forward | yes | Never regress a customer to a lead. Order: subscriber, lead, MQL, SQL, opportunity, customer, evangelist. |
| `hubspot_owner_id` | primary | no | Reassignment is a separate decision from dedupe. Do not fold it in here. |
| `hs_lead_status` | S-03 furthest-forward | yes | Same ordering argument as lifecycle stage. |
| `REPLACE_CUSTOM_FIELD` | `REPLACE_RULE` | `REPLACE` | Add one row per custom property that carries reporting or routing weight. |

Rule definitions:

- **S-01 longest-non-empty** — the longer string wins; ties go to the primary.
- **S-02 newest-non-empty** — the value on the record with the later `hs_lastmodifieddate` wins, ignoring empties.
- **S-03 furthest-forward** — the value further along the declared ordering wins, regardless of recency.
- **S-04 newest-verified** — among values whose source property is in the trusted-source list, the newest wins; if none are trusted, fall back to S-02.

Trusted sources for S-04: `REPLACE_WITH_TRUSTED_SOURCES` (for example: sales-entered, enrichment vendor, verified-by-support).

## Part D — never touch

Fields excluded from every survivorship decision. The Skill refuses to write these even when a rule would select them.

```
hs_object_id
createdate
hs_analytics_source
hs_analytics_first_touch_converting_campaign
REPLACE_WITH_COMPLIANCE_FIELDS
```

Attribution and consent fields belong here. Rewriting first-touch attribution during a cleanup silently rewrites marketing history, and the change is invisible in a dashboard until a quarter-over-quarter comparison stops reconciling.
