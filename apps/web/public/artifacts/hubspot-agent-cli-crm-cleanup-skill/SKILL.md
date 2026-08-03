---
name: hubspot-crm-hygiene-governed
description: Runs bulk CRM hygiene in HubSpot through the HubSpot Agent CLI under a written policy — dedupe with field-level survivorship, property backfill with provenance stamping, and stale-deal disposition — producing a reviewable change ledger and a pre-image snapshot before any irreversible write. Use when a hygiene run has to be repeatable, reviewable, or auditable rather than a one-off cleanup.
---

# Governed CRM hygiene via the HubSpot Agent CLI

This Skill does not replace HubSpot's official Agent CLI skills. It governs them. Install the vendor bundle first:

```
npx skills add hubspot/agent-cli-skills
```

That bundle supplies the mechanics — JSONL pipes, batch reads, pagination, `--dry-run`/confirm patterns, and `hubspot history` recovery. What it does not supply is policy: which duplicate wins field by field, where a backfilled value came from, when a deal is dead versus merely quiet, and what record of the run survives afterward. This Skill is that policy layer, plus the safety rails that `--dry-run` alone cannot provide.

## When to invoke

Invoke when a HubSpot hygiene job has to satisfy at least one of these:

- It runs on a schedule, headless, with no human watching each mutation.
- Someone other than the operator will review what changed and why.
- The changed properties feed reporting, routing, scoring, or comp — so a silent bad write has downstream cost.
- The job touches more than ~200 records, where manual pair-by-pair review stops being realistic.

## When NOT to invoke

- **One-off cleanup by the person who owns the portal.** The vendor's `crm-data-quality` skill handles it with less setup. Policy files are overhead when the operator is also the reviewer and the run happens once.
- **No sandbox and no snapshot budget.** Merges cannot be undone. If you cannot write a pre-image snapshot to disk, stop.
- **The survivorship rule has not been decided.** This Skill applies a rule you supply. It will not invent one. An unfilled `references/1-survivorship-policy.md` is a hard stop, not a default.
- **Fewer than ~50 records.** Below that, the in-app duplicate manager and manual review beat the setup cost.
- **Active enrollment triggers on the target properties have not been audited.** Property writes fire HubSpot workflows. See Watch-out 4.

## Inputs

| Input | Required | Type | Notes |
|---|---|---|---|
| `object_type` | yes | string | `contacts`, `companies`, `deals`, `tickets`, or a custom object type. One per run. |
| `job` | yes | enum | `dedupe`, `backfill`, or `stale-deals`. One per run — never combined. |
| `scope_filter` | yes | string | A CLI filter expression narrowing the working set. An unfiltered portal-wide run is refused. |
| `run_dir` | yes | path | Output directory. Defaults to `./crm-hygiene-<object_type>-<job>-<YYYY-MM-DD>/`. |
| `policy_files` | yes | paths | The filled reference files below. |
| `apply` | no | bool | Defaults to `false`. When false the run stops after the ledger. |
| `max_mutations` | no | int | Per-class ceiling. Defaults to 250. Exceeding it aborts rather than truncates. |

## Reference files

Fill these before the first run. Placeholder content is scaffolding, not defaults.

- `references/1-survivorship-policy.md` — match rules for duplicate detection and the field-level winner table.
- `references/2-backfill-provenance.md` — source precedence, provenance property names, rollback procedure.
- `references/3-stale-deal-disposition.md` — staleness thresholds per stage and the disposition decision table.

## Method

The Skill runs six phases in fixed order. It refuses to skip forward.

**Phase 1 — pin and verify.** Record `hubspot --version` into `<run_dir>/ledger/run-meta.json`. Confirm the authenticated identity with `hubspot whoami`. The CLI is in public beta and HubSpot states that commands, flags, and behavior can change without notice, so the version that produced a ledger is part of the ledger. If the recorded version differs from the previous run's, the Skill prints the delta and asks for confirmation before proceeding.

Discovery runs under `hubspot auth login` OAuth, never under a service key. Reason: OAuth is scoped to the user's own permissions, so a scoping mistake in a read phase fails closed instead of quietly reading everything.

**Phase 2 — scope and snapshot.** Resolve `scope_filter` into a working set and write a pre-image to `<run_dir>/pre-image/<object_type>.jsonl`, one full record per line, with every property the policy touches plus `id`, `createdate`, `hs_lastmodifieddate`.

Why a snapshot when the CLI has `--dry-run` and HubSpot has `hubspot history`: `--dry-run` previews a write you have not made yet, and `history` recovers property values on a record that still exists. Neither helps after a merge. A merge is irreversible — HubSpot documents no unmerge path — and the losing record stops existing. The snapshot is the only artifact that can reconstruct what was there. The Skill refuses to enter Phase 5 if the snapshot file is missing or its line count does not match the working-set count.

**Phase 3 — deterministic candidate generation.** Matching runs as code, not as a model judgment: normalize (lowercase, trim, strip `+tag` from email local parts, strip `www.` and protocol from domains), then apply the match rules from the policy file in priority order. Each candidate group is written to `<run_dir>/candidates.jsonl` with the rule that matched it.

Why deterministic: a model asked to re-rank the same duplicate set twice will not return the same grouping twice, which makes the diff between two runs unreviewable and makes a reviewer's approval meaningless. Model judgment is used in exactly one place — Phase 4's ambiguous band — and its output is advisory, flagged, and never auto-applied.

**Phase 4 — resolve under policy.** For `dedupe`, the Skill computes the surviving value **per field**, not per record. This is the phase that exists because of a specific HubSpot behavior: `hubspot objects merge` keeps the primary record's values where both records have a value. A record-level choice therefore discards good data sitting on the secondary — the newer phone number, the corrected job title, the non-empty lifecycle stage.

So the Skill inverts the order. It writes the winning field values onto the primary with `objects update` **first**, then merges. After the merge the primary already holds every winning value, and the merge only has to fold associations and activity history. Groups where the policy cannot pick a winner go to `<run_dir>/ambiguous.jsonl` for human review and are excluded from apply.

For `backfill`, values resolve by the source precedence in the provenance file, and every write carries the provenance stamp. For `stale-deals`, the disposition table maps stage plus days-since-`hs_lastmodifieddate` to one of `close-lost`, `reassign`, `reopen`, or `leave`.

**Phase 5 — dry-run ledger.** Every planned mutation is issued with `--dry-run` and `--format json`, and the responses are folded into `<run_dir>/ledger/changes.jsonl` — one line per record, carrying `id`, operation, per-field before/after, the policy rule that authorized it, and the matched candidate group. A human-readable digest lands at `<run_dir>/ledger/digest.md`: counts by operation, counts by rule, the 20 largest field-value deltas, and the full ambiguous list.

If any mutation class exceeds `max_mutations`, the run aborts here and writes nothing. It does not truncate to the cap — a truncated hygiene run leaves the portal in a half-applied state that is worse than either endpoint.

**Phase 6 — gated apply.** Only with `apply: true`. Mutations replay from the ledger, so what executes is the reviewed artifact rather than a freshly recomputed plan. Requests are paced under the account's burst ceiling with exponential backoff on `429`. Failures are quarantined to `<run_dir>/failed.jsonl` with the API error attached and are never blind-retried — a merge that failed on the 250-merge cap will fail identically on retry, and a retry loop against a partially applied merge is how a cleanup becomes an incident.

Post-apply, the Skill re-reads every touched record and writes `<run_dir>/ledger/verified.jsonl`, marking any record whose post-state does not match the ledger's intent.

## Output format

`digest.md` looks like this:

```markdown
# CRM hygiene digest — contacts / dedupe — 2026-08-03
CLI version: 1.4.2  ·  Auth: oauth (user: ops@example.com)  ·  Mode: DRY RUN
Working set: 12,480  ·  Candidate groups: 604  ·  Records affected: 1,247

## Operations
| Operation | Count | Authorizing rule |
|---|---|---|
| objects update (survivorship pre-write) | 1,247 | S-02 newest-non-empty |
| objects merge                           |   604 | M-01 exact-email |
| deferred to ambiguous.jsonl             |    38 | — |

## Largest field deltas
| id | field | before | after | rule |
|---|---|---|---|---|
| 701 | jobtitle | (empty) | VP Revenue Operations | S-02 |
| 884 | phone | +1-555-0134 | +1-555-0199 | S-04 newest-verified |

## Blocked
| id | reason |
|---|---|
| 2291 | merge cap: 250 lifetime merges reached |
```

`changes.jsonl`, one line:

```json
{"run_id":"2026-08-03T09:14:02Z","object_type":"contacts","op":"objects update","id":"701","before":{"jobtitle":null},"after":{"jobtitle":"VP Revenue Operations"},"rule":"S-02","group":"g-0117","provenance":"hygiene_run_2026-08-03"}
```

## Watch-outs

1. **A merge cannot be undone, and `--dry-run` does not change that.** The preview shows the intended result; it does not create a restore point. **Guard:** Phase 2's pre-image snapshot is mandatory and Phase 5 hard-fails without it. Keep `run_dir` for at least one renewal cycle — it is the only reconstruction path for a record that no longer exists.

2. **Merges fail at the 250-merge lifetime cap.** HubSpot blocks a merge when the two records have been involved in 250 or more merges combined, and merges also fail when the result would exceed configured association limits. On a portal with years of accumulated cleanup, these failures cluster in the middle of a run. **Guard:** failures quarantine to `failed.jsonl` and stop that group. No blind retry, and the run continues with the remaining groups rather than aborting.

3. **A backfilled value is indistinguishable from a human-entered one unless you stamp it.** Six months later nobody can tell which records were touched, so nobody can roll the backfill back or exclude it from an analysis. **Guard:** every backfill write also sets the two provenance properties defined in `references/2-backfill-provenance.md` (`hygiene_source`, `hygiene_run_id`). Create them before the first run; the rollback procedure in that file keys on `hygiene_run_id`.

4. **Property writes fire workflow enrollment triggers.** A lifecycle-stage backfill across 4,000 contacts can enroll all of them in a nurture sequence and send 4,000 emails to customers. This is the failure mode with the largest blast radius on this page, and it originates outside the CLI entirely. **Guard:** before any `backfill` run, enumerate active workflows whose enrollment triggers reference the target properties, and either pause them or exclude the working set for the duration. The Skill prints the target property list at Phase 4 and requires explicit confirmation that this audit happened.

5. **Admin mode widens the blast radius past your own permissions.** A `HUBSPOT_ACCESS_TOKEN` service key is account-level, and HubSpot requires it for schema operations and most deletes. A key exported into a long-lived shell stays live for every later command in that session. **Guard:** discovery and dry-run phases run under OAuth. When admin mode is genuinely required, export the key inside a subshell scoped to that single command so it does not leak into the rest of the run.

6. **Beta drift breaks a pinned run silently.** HubSpot states flags and behavior can change without notice, and the CLI auto-upgrades by default. A flag that vanishes between two scheduled runs turns a governed run into an ungoverned one. **Guard:** set `HUBSPOT_NO_AUTO_UPGRADE=1` for scheduled runs, pin the version in `run-meta.json`, and treat a version delta as a review trigger rather than a routine upgrade.

7. **The Search API caps at 10,000 results per query.** A working set larger than that silently stops at the cap, or returns a `400` when paging past it, and the hygiene run then reports clean on records it never read. **Guard:** the Skill shards `scope_filter` by `createdate` ranges when the working-set estimate exceeds 9,000 and asserts that the union of shard counts matches the unsharded count estimate.
