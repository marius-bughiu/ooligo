---
name: crm-agent-access-audit
description: Inventories every non-human identity that can write to CRM objects — OAuth connected apps, private-app tokens, MCP servers, and agent integrations — reconciles what the CRM has authorized against what agent clients are actually configured to reach, and ranks over-broad, unattributed, and stale grants by blast radius. Use before or during an access review of Salesforce or HubSpot when agents and MCP servers hold API credentials.
---

# CRM agent access audit

This Skill answers one question: **which non-human identities can change CRM data, and who authorized each one?**

It is read-only. It revokes nothing, blocks nothing, and edits no configuration. Its output is an evidence file and a ranked finding list that a human acts on. That split is deliberate — the remediations here are org-wide and immediate (blocking a connected app in Salesforce kills every user's authorization at once), so the decision to fire one belongs to a named person, not to an agent run.

## The premise

Access reviews for agent integrations get run against the wrong artifact. Two of them, usually:

1. **The MCP tool annotation.** A server declares `readOnlyHint: true` on its tools and the reviewer records it as a read-only integration. That annotation is the server's self-description. The MCP specification is explicit that annotations "are not guaranteed to faithfully describe tool behavior, and clients **must** treat them as untrusted unless they come from a trusted server." What the integration can actually do is set by the OAuth scopes on its token, which live in the CRM, not in the server manifest.
2. **The connected-app list alone.** Salesforce's Connected Apps OAuth Usage page is authoritative for what the org has authorized, and blind to which agent, on whose laptop, is driving that authorization. A single service credential shared across four MCP servers looks like one grant.

The findings live in the gap between those two views. This Skill collects both, plus a third, and reports the deltas.

## When to invoke

- An access review, SOC 2 user-access-review cycle, or security questionnaire covers CRM integrations and agent tooling.
- A vendor with a CRM integration has disclosed an incident and you need the exposure answer today rather than next week.
- Engineers and ops staff add MCP servers themselves, so no single person knows the current set.
- Agent write access to CRM is being expanded and someone asked what is already there.

## When NOT to invoke

- **A single-admin org with under 10 connected apps.** Read the Connected Apps OAuth Usage page directly. Normalization and scoring are overhead at that size.
- **You do not hold read access to both planes.** Without CRM setup read access *and* the ability to read agent client configs, the reconciliation phase produces nothing and the run degrades to a list you already had.
- **You want remediation.** This Skill produces findings. Blocking, revoking, and scope reduction are separate, human-approved actions — see `references/3-finding-dispositions.md` for what each one breaks.
- **Continuous monitoring is the actual requirement.** This is a point-in-time audit. If the org needs alerting on new grants, buy an SSPM product; see the alternatives section of the published page.
- **The owner registry has never been filled in.** Every grant needs a named human owner to be actionable. Running without `references/1-grant-inventory-sources.md` Part C produces findings nobody can route.

## Inputs

Required:

- `crm_platform` (string, `salesforce` | `hubspot` | `both`) — which CRM planes to collect.
- `run_dir` (path) — writable directory for raw collection, normalized records, and the report.
- `agent_config_roots` (list of paths) — where to look for MCP client configuration. Defaults to the current project directory, `~/.claude.json`, and the platform Claude Desktop config path.

Optional:

- `stale_days` (integer, default `90`) — a grant unused for longer is flagged stale. 90 days is the common access-review interval; set it to your own review cadence rather than inheriting the default.
- `owner_registry` (path) — CSV of `app_identifier,owner_email,business_justification,approved_date`. Absent, every grant reports as unowned, which is itself the finding.
- `include_read_only` (boolean, default `false`) — include read-scoped grants in the report body. They still appear in the evidence file either way.

## Reference files

- `references/1-grant-inventory-sources.md` — the collection procedure per plane, the exact queries, the credentials each one needs, and the owner registry template. Fill Part C before the first run.
- `references/2-blast-radius-rubric.md` — the scope-to-tier tables and the modifier arithmetic. Deterministic; edit the tables, not the code path.
- `references/3-finding-dispositions.md` — per finding class: the remediation, who approves it, and what the remediation itself breaks.

## Method

Six phases, fixed order. Phase 5 refuses to run if any of the three planes is missing, because a two-plane run produces confident findings from an incomplete picture — the failure mode this Skill exists to prevent.

### Phase 0 — Pin the audit's own posture

Record the identity and permissions the audit runs under into `run_dir/run-meta.json`. Then assert the audit credential holds no write scopes. An audit that runs under a credential with `full` or `crm.objects.*.write` cannot claim to be read-only, and its own token becomes a finding in the next audit. If the only available credential carries write scopes, record that fact in the report header rather than suppressing it.

### Phase 1 — Collect plane A: CRM-authorized grants

**Salesforce.** The token rows come from a single SOQL query:

```
sf data query --query "SELECT Id, AppName, UserId, CreatedDate, LastUsedDate, UseCount, AppMenuItemId FROM OauthToken" --result-format csv > raw/sfdc-oauthtoken.csv
```

That gives you who authorized what, when, and how recently — and **not** the scopes. This is the single most misread part of the collection: `OauthToken` rows carry usage, not capability. The scope set is a property of the connected app's OAuth policy, so Part A of `references/1-grant-inventory-sources.md` pairs the query with the Setup export from **Setup → Apps → Connected Apps → Connected Apps OAuth Usage** and the per-app scope list. Join on `AppName`. A token whose app no longer appears in the connected-app list is a finding, not a join failure.

**HubSpot.** Private-app tokens introspect one at a time against `POST /oauth/v2/private-apps/get/access-token-info`, which returns the hub id and the scope list for the token you present. Public-app installs are read from **Settings → Integrations → Connected Apps** in the portal; HubSpot exposes no clean public endpoint that lists every installed app for a portal, so this sub-plane is a manual export. Record it as manual in the evidence file — a plane collected by hand and a plane collected by API have different staleness properties and the report should not blur them.

### Phase 2 — Collect plane B: client-side agent configuration

For Claude Code, three scopes hold servers and they are separate files:

```
claude mcp list
claude mcp get <name>
```

- `local` (the default scope) and `user` scope both live in `~/.claude.json`
- `project` scope lives in the repository's `.mcp.json`
- Claude Desktop keeps its own `claude_desktop_config.json`

Walk every path in `agent_config_roots`, not just the first hit. Project-scoped servers awaiting approval still appear in `claude mcp list` marked `⏸ Pending approval` — collect them, because a pending server is a configured intent and the credential in its `env` block already exists. Plugin-provided servers and claude.ai connectors are in scope too.

Extract, for each server: transport, command or URL, every environment variable **name** (never its value), and whether authentication is a static header, a `headersHelper`, or OAuth through `/mcp`.

### Phase 3 — Collect plane C: declared capability

For each server from Phase 2 that touches the CRM, record its tool list and the four annotation hints per tool. Record them as *claims*.

Absence matters more than presence here, because of the specification's defaults: `readOnlyHint` defaults to `false`, `destructiveHint` defaults to `true`, `idempotentHint` to `false`, and `openWorldHint` to `true`. An unannotated tool is therefore presumed write-capable and destructive. That default is the correct reading and the report states it — an unannotated CRM server is not an unknown, it is a presumed writer.

### Phase 4 — Normalize and score

Every collected row becomes one grant record with the same shape regardless of plane. Scoring runs as code against the tables in `references/2-blast-radius-rubric.md` — no model judgment. The reason is reviewability: an access review gets re-run quarterly, and a reviewer signing off on a diff needs the same input to produce the same score. A model asked to rank the same 90 grants twice will not return the same ranking twice, which makes the quarter-over-quarter diff meaningless.

Model judgment appears in exactly one place: drafting the plain-language justification paragraph for each finding. It never sets a tier and never decides a disposition.

### Phase 5 — Reconcile the three planes

Join plane A to plane B on client id, app name, or credential fingerprint. The lists will not match. The mismatches are the output:

- **`orphan-grant`** — a live CRM authorization with no corresponding agent configuration and no registry owner. The token still refreshes. This is the shape that made the Salesloft Drift compromise expensive: the authorization outlived anyone's attention on it.
- **`unattributed-write`** — two or more agent servers configured against one service credential. Every CRM audit row attributes to a single identity, so post-incident you can establish that a write happened and not which agent made it.
- **`annotation-mismatch`** — a server whose tools all declare `readOnlyHint: true` while its credential carries write scopes. The gap between declared and granted capability, stated as a number.
- **`stale-grant`** — `LastUsedDate` older than `stale_days` with a live refresh token. Note the Salesforce behavior that generates most of these: deactivating a user does not revoke that user's OAuth authorizations. Offboarding leaves them live.
- **`scope-excess`** — granted scope tier above what the configured tool set needs. Salesforce `full` on an integration that reads three objects is the standard instance.

### Phase 6 — Report

Findings sorted by tier, then by staleness. Each carries its evidence path, so a reviewer who disputes a finding can read the raw row rather than argue with a summary.

## Output format

`run_dir/report.md`:

```markdown
# CRM agent access audit — 2026-08-04

Planes collected: A (salesforce, api) · B (3 config roots) · C (7 servers)
Audit credential: read-only ✔
Grants: 94 total · 31 write-capable · 12 unowned

## T1 — write-capable, unowned, or unattributed (4)

### T1-01 · orphan-grant · "Drift" (Salesforce connected app)
Scopes: api, refresh_token, offline_access
Last used: 2025-08-11 (359 days)  ·  Use count: 14,203
Owner: none in registry  ·  Config match: none in plane B
Evidence: raw/sfdc-oauthtoken.csv:88, raw/sfdc-connected-apps.csv:12
Action: revoke tokens for this app (see disposition R2 — org-wide, immediate)

### T1-02 · unattributed-write · SVC_AGENT_CRM (shared credential)
Used by: mcp-salesforce-ops, mcp-pipeline-report, internal-router
Scopes: api, refresh_token
Owner: revops-platform@  ·  Config match: 3 servers, 2 config roots
Evidence: raw/mcp-servers.jsonl:3,7,11
Action: split into per-server credentials (see disposition R4 — requires 3 app registrations)

## T2 — scope excess (9)
...

## Unreconciled
2 plane-B servers reference env var names with no matching plane-A grant:
mcp-attio-sync (ATTIO_API_KEY), mcp-notes (NOTION_TOKEN) — out of CRM scope, listed for completeness.
```

Alongside it, `run_dir/grants.jsonl` — one normalized record per grant, which is what the next quarter's run diffs against.

## Watch-outs

- **`OauthToken` has no scope column.** A run that reports scopes without joining the connected-app export is reporting invented data. **Guard:** Phase 4 hard-fails any Salesforce grant record whose `scope_source` field is not `connected-app-export`. Missing scopes render as `unknown` and score at the top tier until resolved, so the gap is loud rather than silent.
- **Tool annotations are the auditee's own testimony.** A compromised or careless server declares whatever it likes. **Guard:** plane C never lowers a tier. It can only raise one, via `annotation-mismatch`. Tiers come from token scopes.
- **Environment variable values are secrets and the audit reads config files full of them.** A report that quotes a config block verbatim leaks the credential into a document that gets emailed to auditors. **Guard:** the collector records env var **names** only and writes a literal `[redacted]` for every value at parse time, before anything reaches `run_dir`. Redacting at report time leaves the secret sitting in the raw file.
- **Blocking a connected app is org-wide and instant.** It revokes every user's authorization for that app simultaneously, which breaks running integrations without warning. **Guard:** dispositions are proposals, never actions. `references/3-finding-dispositions.md` states the breakage for each one, and R2 requires a named approver and a notification window before it fires.
- **A clean report can mean the collection failed.** Zero findings and a broken query look identical downstream. **Guard:** Phase 5 refuses to run on fewer than three planes, and the report header prints per-plane record counts. A plane with zero rows prints as `COLLECTION FAILED`, not as zero findings.
- **`Use Any API Client` overrides API Access Control.** An org that has enabled the allowlist still has a bypass wherever that permission is assigned. **Guard:** Part D of `references/1-grant-inventory-sources.md` collects assignees of that permission as grant records in their own right, tiered as write-capable regardless of which apps are allowlisted.
