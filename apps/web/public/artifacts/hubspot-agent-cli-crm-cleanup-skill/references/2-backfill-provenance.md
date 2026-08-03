# Backfill provenance

Last edited: 2026-08-03 · Owner: `REPLACE_WITH_OWNER`

A backfilled value that carries no provenance is a value nobody can audit, roll back, or exclude from an analysis. Six months after the run, a blank-turned-populated `industry` field looks exactly like one a rep typed. This file defines where values come from, what gets stamped alongside them, and how to reverse the run.

## Part A — provenance properties

Create these two custom properties on every object type this Skill backfills, before the first run. The Skill hard-stops if they do not exist.

| Property | Type | Purpose |
|---|---|---|
| `hygiene_source` | single-line text | Which source supplied the value (`enrichment:REPLACE_VENDOR`, `derived:domain`, `inherited:company`, `default:policy`). |
| `hygiene_run_id` | single-line text | The run that wrote it. Format `hygiene_<job>_<YYYY-MM-DD>`. Rollback keys on this. |

Both are set on the same `objects update` call as the backfilled value, never in a second pass. A second pass leaves a window where a crash produces stamped-but-unwritten or written-but-unstamped records, and reconciling that window by hand costs more than the backfill saved.

Exclude both properties from every enrollment trigger, list definition, and report filter. They are metadata about the record, not facts about the customer.

## Part B — source precedence

Per target property, the first source that returns a non-empty value wins. Sources below the line marked `STOP` are never used to overwrite an existing value.

| Target property | 1st source | 2nd source | 3rd source | Overwrite non-empty? |
|---|---|---|---|---|
| `industry` | enrichment vendor | inherited from associated company | — | no |
| `numberofemployees` | enrichment vendor | — | — | yes, when the existing value is older than 365 days |
| `country` | enrichment vendor | derived from phone country code | derived from email TLD | no |
| `lifecyclestage` | derived from deal stage | — | — | no, forward-only per the S-03 ordering |
| `hubspot_owner_id` | territory rule | — | — | no |
| `REPLACE_TARGET` | `REPLACE_SOURCE` | — | — | `REPLACE` |

**Default to `no` in the overwrite column.** A backfill exists to fill blanks. The moment it overwrites populated fields it stops being hygiene and becomes a data migration, which needs a different review and a different approval.

The one row above that overwrites (`numberofemployees`) does so on an explicit staleness test, not on a blanket rule. Copy that shape for any other field you promote.

## Part C — derived-value rules

Derived values are computed, not fetched. Each one needs a stated rule so a reviewer can check the arithmetic.

- **`country` from phone** — map the country calling code to ISO 3166 alpha-2. Ambiguous codes (`+1` covers the US, Canada, and several Caribbean nations) resolve to `unknown`, never to a guess.
- **`country` from email TLD** — country-code TLDs only. Never derive from `.com`, `.io`, `.ai`, or any gTLD.
- **`lifecyclestage` from deal stage** — an associated deal in a closed-won stage implies `customer`. No other deal stage implies a forward move.

Anything you cannot state as a rule this short does not belong in a backfill. It belongs in a reviewed enrichment workflow with a human in the loop.

## Part D — rollback

Rollback is why the stamp exists. To reverse run `hygiene_backfill_2026-08-03`:

1. Read every record where `hygiene_run_id` equals the run id. This is the authoritative affected set — do not reconstruct it from the ledger, which records intent rather than result.
2. For each, look up the pre-image line in `<run_dir>/pre-image/<object_type>.jsonl` by `id`.
3. Write back only the properties the ledger lists for that record. Restoring the whole pre-image record would revert unrelated edits made by humans since the run.
4. Clear `hygiene_source` and `hygiene_run_id`.
5. Re-read the affected set and confirm the property values match the pre-image.

Step 3 is the one people get wrong. A blanket restore looks safer and is not — it silently discards every legitimate edit made in the intervening days.

## Part E — retention

Keep `run_dir` for `REPLACE_WITH_RETENTION_PERIOD` (suggested: 13 months, so a year-over-year comparison can still explain a discontinuity). The pre-image contains customer personal data, so store it where your CRM data-handling policy already applies and delete it on the same schedule as other CRM exports.
