---
name: salesforce-data-cleanup
description: Find and propose fixes for Salesforce data-quality issues — duplicate accounts, orphan contacts, junk leads, malformed phones, mismatched account-contact relationships, and stage values that violate funnel definitions. Always proposes; never writes without explicit dry-run review and approval.
---

# Salesforce data cleanup

## When to invoke

Whenever you need to surface and propose fixes for Salesforce data-quality
issues that are quietly distorting reporting: duplicate accounts and contacts,
orphan records (contacts with no account, opportunities with no contact roles),
junk leads (test records, role-address contacts, free-mail in B2B), malformed
phones and websites, account-contact mismatches (contact email domain does
not match account website domain), and stage values that violate the funnel
definition (e.g. "Closed Won" with no Close Date, "Negotiation" with zero
opportunity contact roles).

The Skill takes an object scope, a dedup-rules file, a stage-definition file,
and an ICP rubric. It produces a discovery scan, then per-issue dry-runs as
CSVs the operator approves before any write.

Do NOT invoke this skill for:

- Auto-applying writes without a dry-run + human approval. Every fix goes
  through the dry-run CSV gate. There is no "auto" mode.
- First runs against production with write access. The first two scan cycles
  must use a read-only API token. Write credentials only after the operator
  has reviewed the false-positive rate.
- Hard-deletes. The Skill never bypasses the recycle bin. Deletes are soft
  by default; permanent purges are out of scope and a deliberate manual
  decision.
- Bulk merges in production without a sandbox rehearsal. Account merges
  cascade to opportunities, activities, and contact roles — sandbox first.
- Data residency / PII purge requests under GDPR or CCPA. Use the platform's
  documented right-to-erasure flow, not this Skill.

## Inputs

- Required: `scope` — comma-separated SObject names to scan
  (e.g. `Account,Contact,Lead,Opportunity`). Default: all four.
- Required: `dedup_rules_path` — path to a `references/dedup-rules.md` style
  file naming the deterministic match keys (domain, normalized phone,
  normalized name) and the fuzzy-match thresholds.
- Required: `stage_definitions_path` — path to a `references/stage-definitions.md`
  style file naming the required field set per Opportunity stage.
- Required: `icp_rubric_path` — path to a `references/icp-rubric.md` style file
  used to evaluate whether orphan or low-signal records are worth keeping.
- Optional: `survivor_ranking_path` — path to a `references/survivor-ranking.md`
  style file with weights for activity recency, contact count, opportunity
  history, and last-modified-by user trust. Default weights apply if absent.
- Optional: `sandbox` — boolean, default `true`. Forces the Skill to talk to
  the configured sandbox endpoint, not production.
- Optional: `chunk_size` — integer, default `10000`. Bulk API query chunk size.

## Reference files

Always read the following from `references/` before scanning. Without them,
the discovery output is generic and the dry-run proposals will not match
the operator's actual definitions.

- `references/dedup-rules.md` — deterministic and fuzzy match rules (replace
  the template with your real rules)
- `references/stage-definitions.md` — required fields per Opportunity stage
  (replace with your actual funnel definition)
- `references/survivor-ranking.md` — weights for choosing the survivor in a
  merge proposal (replace with your actual priorities)

## Method

Run these five sub-tasks in order. Do not parallelize: later steps depend on
the survivor-selection context produced by earlier steps.

### 1. Discovery scan

Pull each in-scope SObject via the Bulk API in chunks (default 10k rows). Bulk
API, not REST query, because a full Account scan on a real org is 100k+ rows
and REST chops on governor limits. Chunked because a single 1M-row pull
blows past memory and the job times out at the org's configured Bulk API
batch ceiling.

For each chunk, classify rows into issue buckets:

- `dedup_account` / `dedup_contact` / `dedup_lead`
- `orphan_contact` (no AccountId), `orphan_opp` (no contact roles)
- `junk_lead` (free-mail in B2B, role addresses, test patterns)
- `format_violation_phone` / `format_violation_website` (regex-fail)
- `mismatch_account_contact` (contact email domain != account website)
- `stage_violation` (required field per stage missing)

Output: a one-page scan summary with per-bucket counts and confidence band.

### 2. Dedup pass — deterministic + semantic hybrid

For dedup buckets the Skill runs a two-pass pipeline. Pass one is pure
deterministic regex/normalization: lowercased email domain, E.164-normalized
phone, NFKD-normalized + lowercased + suffix-stripped name. Exact matches on
either domain or normalized phone go straight to the proposal CSV.

Pass two is Claude semantic similarity, applied only to candidate pairs that
share at least one weak deterministic signal (same first 6 digits of phone,
same first token of name, same parent-domain TLD). Hybrid because pure
regex misses "Acme, Inc." vs "Acme Incorporated — APAC", and pure semantic
similarity is too expensive to run pairwise across N^2 records and produces
too many false positives on common names. The narrow-then-rank approach
holds the per-scan token spend to under $5 for a 100k-Account org.

Confidence bands: `high` (deterministic match on 2+ keys), `medium`
(deterministic on 1 key + semantic similarity ≥ 0.85), `low` (semantic
only). The dry-run CSV ships only `high` and `medium` by default.

### 3. Survivor selection for merges

For each duplicate pair, propose a survivor using a weighted score:

- Activity recency (last 90 days of Tasks + Events): weight 0.4
- Contact count attached: weight 0.3
- Opportunity history (count + total Amount): weight 0.2
- LastModifiedBy not equal to integration user: weight 0.1

The Skill ranks both records, proposes the higher score as survivor, and
emits a per-pair rationale line in the dry-run CSV. RevOps reviews and
overrides via a `survivor_override` column before approving.

This composite is used because no single signal is reliable: most-recent
modification often points at an integration backfill, contact count favors
old crusty records, and Opportunity Amount alone discards the active
relationship. The composite tracks "where the team is actually working."

### 4. Dry-run CSV per issue

For the issue the operator picks, emit a CSV with one row per proposed
change. Columns: `Id`, `Object`, `Operation` (`merge` / `update` / `soft_delete`),
`Field`, `Old_Value`, `New_Value`, `Confidence`, `Survivor_Id` (merges only),
`Rationale`, `Approve` (operator-set, default blank).

The Skill writes nothing until a CSV with `Approve=Y` rows is passed back
into `apply_fix`. Rows without `Approve=Y` are skipped, including blanks.
This is the gate.

### 5. Apply with audit

`apply_fix(issue_id, csv_path)` reads the approved CSV and posts the writes
in chunks via the Bulk API. Every write is logged to a custom SObject
`Cleanup_Audit__c` with: `Operation`, `Target_Id`, `Field`, `Old_Value_JSON`,
`New_Value_JSON`, `Survivor_Id`, `Run_Id`, `Approver_User`, `Timestamp`. The
audit record makes the change reversible: a `revert(run_id)` companion
script reads the audit log and re-applies `Old_Value_JSON`.

## Output format

The discovery scan returns a Markdown report and writes one dry-run CSV
per issue picked. Literal example:

```markdown
# Salesforce data-cleanup scan — 2026-05-03

Scope: Account, Contact, Lead, Opportunity
Sandbox: true
Run ID: run_2026-05-03_a8c1

## Summary by issue type

| Issue                       | Count | High conf | Medium conf | Low conf |
|----------------------------|------:|----------:|------------:|---------:|
| dedup_account              | 1,284 |       412 |         736 |      136 |
| dedup_contact              | 8,902 |     3,118 |       4,901 |      883 |
| orphan_contact             | 1,071 |     1,071 |           - |        - |
| junk_lead                  |   942 |       942 |           - |        - |
| format_violation_phone     | 4,820 |     4,820 |           - |        - |
| mismatch_account_contact   |   612 |       612 |           - |        - |
| stage_violation            |   217 |       217 |           - |        - |

Pick one to dry-run: `dry_run_fix(issue_id="dedup_account")`
```

Per-issue dry-run CSV (first three lines):

```csv
Id,Object,Operation,Field,Old_Value,New_Value,Confidence,Survivor_Id,Rationale,Approve
0011x00000ABCD1,Account,merge,,,,high,0011x00000WXYZ9,"E.164 phone match + same primary domain; survivor has 14 activities in last 90d vs 0",
0031x00000EFGH2,Contact,update,Email,john@oldmail.example,john@newmail.example,high,,Domain matches account website,
00Q1x00000IJKL3,Lead,soft_delete,,,,high,,Free-mail (gmail) in B2B segment + no activity 18mo,
```

Audit log entry shape (one row in `Cleanup_Audit__c` per write):

```json
{
  "Operation": "merge",
  "Target_Id": "0011x00000ABCD1",
  "Field": null,
  "Old_Value_JSON": "{\"Name\":\"Acme, Inc.\",\"Phone\":\"+1-415-555-0100\"}",
  "New_Value_JSON": "{\"merged_into\":\"0011x00000WXYZ9\"}",
  "Survivor_Id": "0011x00000WXYZ9",
  "Run_Id": "run_2026-05-03_a8c1",
  "Approver_User": "revops.lead@example.com",
  "Timestamp": "2026-05-03T17:42:11Z"
}
```

## Watch-outs

- **Granting write access on the first run.** The first scan will surface
  false positives because it is also surfacing flaws in the dedup ruleset.
  Guard: the Skill refuses to run `apply_fix` if the configured token
  has write scope and `Cleanup_Audit__c` shows zero prior `Operation=dry_run`
  rows for the run's scope. Two read-only cycles minimum.
- **Account merge cascading to wrong records.** Account merges propagate
  to all child Opportunities, Contacts, Tasks, and Events. A wrong survivor
  destroys the wrong history. Guard: `apply_fix` for `dedup_account` rows
  refuses to run unless `sandbox=true` has been set on at least one prior
  run with the same `Run_Id` prefix in the last 14 days, and the operator
  has set `--rehearsed=true` explicitly.
- **Hard-deletes bypassing recycle bin.** Operators sometimes ask the Skill
  to "really delete" — to skip the recycle bin and free storage. Guard:
  the Skill has no hard-delete code path. `soft_delete` is the only
  delete operation; recycle-bin emptying is a manual platform action.
- **Reps waking up to merged accounts.** A clean dedup run with no comms
  burns trust faster than the bad data did. Guard: the Skill emits a
  `change_brief.md` alongside every applied run, listing the merge map
  (loser-Id → survivor-Id, owner email, count of moved opps) ready to
  paste into a Slack channel before reps log in.
