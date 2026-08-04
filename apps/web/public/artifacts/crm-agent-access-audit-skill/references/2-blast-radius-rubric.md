# Reference 2 — Blast radius rubric

Scoring runs as code against these tables. Edit the tables; do not move the decision into a prompt. A quarterly access review is only useful if the same input produces the same score, and a model re-ranking 90 grants produces a different order each run — which turns the quarter-over-quarter diff into noise.

Base tier comes from the scope set. Modifiers adjust it. The result is T1 (highest) through T4.

---

## Part A — Salesforce scope tiers

| Scope | Base tier | Why |
|---|---|---|
| `full` | T1 | Everything the authorizing user can reach. On an admin's authorization, that is the org. |
| `api` | T2 | Read and write across standard and custom objects, bounded only by the user's own permissions. |
| `web`, `visualforce` | T3 | Session-scoped UI access. Reaches data, does not persist independently. |
| `openid`, `id`, `profile`, `email` | T4 | Identity only. |
| `chatter_api`, `content` | T3 | Bounded to Chatter and Files. Files carry more than people expect — raise to T2 if contracts or exports live there. |
| `custom_permissions` | T4 | Reads permission assignments; grants nothing itself. |
| *unknown / not collected* | **T1** | Fail loud. A missing scope set is not a low-risk scope set. |

`refresh_token` / `offline_access` is not a tier of its own — it is the **persistence modifier** below. On its own it grants no data access; combined with `api` it is what makes a stale grant still live 359 days later.

## Part B — HubSpot scope tiers

| Scope pattern | Base tier | Why |
|---|---|---|
| `crm.objects.*.write` (contacts, companies, deals, tickets) | T2 | Direct record mutation on core objects. |
| `crm.schemas.*.write` | **T1** | Changes property definitions, not just values. A schema change breaks every downstream consumer at once and is not row-level reversible. |
| `crm.export` | T2 | Bulk read-out. Read-only in the CRM sense, exfiltration-shaped in the incident sense. |
| `crm.objects.*.read` | T3 | Read-only on core objects. |
| `settings.users.write` | **T1** | Reaches the permission system itself. |
| `automation` | T2 | Workflow enrollment. See the enrollment blast-radius note below. |
| `oauth` | T4 | Token lifecycle only. |
| *unknown / not collected* | **T1** | Same rule as Salesforce. |

**The enrollment note.** A scope that writes properties reaches further than the properties. A backfill across 4,000 contacts can enroll all 4,000 in an active workflow whose trigger references the touched property. Score `crm.objects.*.write` against the workflows currently active in the portal, not against the property list in isolation.

---

## Part C — Modifiers

Applied in order. Tier movement is capped at two steps up and zero steps down — nothing in this table lowers a tier, because every entry describes an aggravating condition.

| Modifier | Condition | Effect |
|---|---|---|
| **Persistence** | `refresh_token` or `offline_access` present | +1 tier |
| **Unowned** | No row in the owner registry | +1 tier |
| **Unattributed** | Credential shared by 2+ agent servers | +1 tier |
| **Self-authorizing** | Salesforce `Permitted Users` = all users may self-authorize | +1 tier |
| **Annotation mismatch** | All tools declare `readOnlyHint: true`, credential carries write scopes | +1 tier |
| **Stale** | `LastUsedDate` older than `stale_days` **and** persistence modifier present | +1 tier |
| **Unannotated CRM server** | MCP server touching CRM with no tool annotations | +1 tier |
| **High volume** | `UseCount` in the top decile of collected grants | no tier change — sort key only |

### Why stale requires persistence

An unused grant with no refresh token expires on its own and is housekeeping. An unused grant *with* a live refresh token is an open door nobody is watching. Only the second one earns the modifier. Flagging both floods T2 with dormant rows and trains reviewers to skim.

### Why unannotated raises rather than lowers

The MCP specification's annotation defaults are `readOnlyHint: false`, `destructiveHint: true`, `idempotentHint: false`, `openWorldHint: true`. An unannotated tool is therefore specified as write-capable and destructive. Treating a missing annotation as "probably fine" inverts the spec's own default.

---

## Part D — Calibration

Set these to your org. The defaults are starting points, not findings.

```yaml
stale_days: 90              # match your access-review interval
high_volume_percentile: 90  # UseCount decile for the sort key
t1_response_hours: 24       # T1 findings need an owner decision inside this window
t2_response_days: 14
max_findings_in_body: 40    # beyond this the report links to grants.jsonl
```

**A note on `max_findings_in_body`.** A first run against an org that has never audited this produces 60-120 findings and the report becomes unreadable. Cap the body, keep every record in `grants.jsonl`, and print the truncation explicitly — a silently truncated list reads as a complete one.

---

## Part E — Worked example

Salesforce connected app, scopes `api` + `refresh_token`, no registry row, `LastUsedDate` 359 days ago, `Permitted Users` = admin approved.

```
base(api)                    = T2
+ persistence (refresh_token)  → T1
+ unowned                      → T1 (capped, already at ceiling)
+ stale (359 > 90, persists)   → T1
final                        = T1
```

Three independent modifiers all pointing at the same grant is the signature the reviewer should learn to read. One modifier is a configuration choice. Three is an integration nobody owns.
