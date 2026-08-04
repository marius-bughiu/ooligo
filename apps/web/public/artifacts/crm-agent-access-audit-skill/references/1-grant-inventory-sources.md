# Reference 1 — Grant inventory sources

Fill Part C before the first run. Parts A, B, and D are procedures; Part C is your data.

---

## Part A — Plane A: CRM-authorized grants

### A.1 Salesforce — token usage

Requires: Setup read access, `sf` CLI authenticated to the target org.

```
sf data query \
  --query "SELECT Id, AppName, UserId, CreatedDate, LastUsedDate, UseCount, AppMenuItemId FROM OauthToken" \
  --result-format csv > raw/sfdc-oauthtoken.csv
```

Returns one row per user-app authorization. `AppName` is the join key for A.2. `LastUsedDate` drives the staleness test. `UseCount` separates an integration doing real volume from one authorized and forgotten.

**This query returns no scopes.** Do not infer them. Scope capability comes from A.2.

### A.2 Salesforce — connected app scopes

Setup → Apps → Connected Apps → **Connected Apps OAuth Usage**. Export the list. For each app, open its detail and record the OAuth scopes from its **Permitted Users** and OAuth policy configuration.

Record per app:

| Field | Where it comes from |
|---|---|
| `app_name` | OAuth Usage list — join key to A.1 |
| `scopes` | Connected app detail → OAuth scopes |
| `permitted_users` | `All users may self-authorize` or `Admin approved users are pre-authorized` |
| `installed` | Whether the app appears as installed or only as authorized |
| `publisher` | Salesforce-supplied apps use namespaces such as `sf_com_apps`, `sf_chttr_apps` |

Two rows deserve immediate attention regardless of tier:

- **`All users may self-authorize`** — any user can grant this app access to their own data without an admin in the loop. Every self-authorizing app is a grant path you did not approve individually.
- **A duplicate or near-duplicate `app_name`** — two apps with the same display name means one of them is not what it claims to be. Investigate before scoring.

### A.3 HubSpot — private apps

For each private-app token you hold:

```
curl -X POST https://api.hubapi.com/oauth/v2/private-apps/get/access-token-info \
  -H "Content-Type: application/json" \
  -d '{"tokenKey":"<token>"}'
```

Returns the hub id, the user, and the scope list. One call per token. You can only introspect a token you possess — tokens held by other teams have to be collected from those teams, which is why Part C exists.

### A.4 HubSpot — installed public apps

Settings → Integrations → **Connected Apps**. Export manually. HubSpot exposes no public endpoint that enumerates every installed app for a portal, so this sub-plane is hand-collected. Stamp it:

```
collection_method: manual
collected_at: <ISO8601>
collected_by: <name>
```

A hand-collected plane goes stale between runs in a way an API-collected plane does not. The report distinguishes them so a reviewer knows which half of the picture is a snapshot and which is live.

---

## Part B — Plane B: agent client configuration

### B.1 Claude Code

```
claude mcp list
claude mcp get <name>
```

Three scopes, three locations — walk all of them:

| Scope | File | Shared with |
|---|---|---|
| `local` (default) | `~/.claude.json` | you, this project only |
| `user` | `~/.claude.json` | you, all projects |
| `project` | `<repo>/.mcp.json` | everyone who clones the repo |

Servers marked `⏸ Pending approval` are in scope. Approval is not the gate that matters for an access audit — the credential in the entry's `env` block already exists whether or not the server is approved.

WebSocket (`type: "ws"`) servers do not appear in `claude mcp list`. Read them from the config files directly or via `claude mcp get <name>`.

### B.2 Claude Desktop

`claude_desktop_config.json`. Location differs per platform; on Windows it sits under `%APPDATA%\Claude\`. Same extraction as B.1.

### B.3 What to extract, per server

```json
{
  "server_name": "mcp-salesforce-ops",
  "transport": "stdio | http | sse | ws",
  "endpoint": "<command+args, or URL>",
  "config_root": "~/.claude.json#user",
  "auth_mode": "oauth | static-header | headersHelper | env-credential",
  "env_var_names": ["SFDC_CLIENT_ID", "SFDC_REFRESH_TOKEN"],
  "env_var_values": "[redacted]",
  "status": "connected | pending-approval | failed | disabled"
}
```

**Values are redacted at parse time, not at report time.** A config file read into memory and written to `run_dir` unredacted has already leaked, regardless of what the report prints.

---

## Part C — Owner registry (fill this in)

CSV at the path given as `owner_registry`. One row per grant you already know about. Grants found during collection that are absent here report as unowned — which is the intended behavior, not a gap in the Skill.

```csv
app_identifier,owner_email,business_justification,approved_date,review_interval_days
Salesloft,revops-platform@example.com,"Sequence sync — contacts + activities",2025-03-14,180
SVC_AGENT_CRM,revops-platform@example.com,"Shared agent service account — SPLIT PENDING",2026-01-09,90
mcp-pipeline-report,gtm-eng@example.com,"Read-only forecast Q&A from Claude Code",2026-05-02,180
Dataloader,dataops@example.com,"Bulk import tooling — admin use only",2024-11-20,365
```

`app_identifier` matches `AppName` from A.1, the private-app name from A.3, or `server_name` from B.3.

Two columns people skip and then need:

- **`business_justification`** — one line naming the objects touched and why. "Integration" is not a justification. At review time this is the sentence a reviewer either agrees with or does not.
- **`review_interval_days`** — per-grant, not org-wide. A write-capable grant on a shared credential deserves 90 days; a read-only reporting connector does not need the same cadence.

---

## Part D — API Access Control and its bypass

Salesforce **API Access Control** locks API access to an allowlist of approved connected apps. It is not on by default and cannot be self-enabled — you log a support case to have it turned on for the org.

If it is enabled, record the allowlist as its own plane-A source. If it is not, record that fact; it changes what an orphan grant means. Without the allowlist, an unrecognized connected app has API reach by default.

**Collect assignees of the `Use Any API Client` permission either way.** That permission bypasses API Access Control entirely — a user holding it reaches any connected app in the org regardless of the allowlist. Score every assignee as a write-capable grant in its own right.

```
sf data query --query "SELECT Assignee.Username, PermissionSet.Name FROM PermissionSetAssignment WHERE PermissionSet.PermissionsApiUserOnly = true" --result-format csv
```

Adjust the field to the permission your org actually uses; the point is that the permission-set assignment list belongs in the inventory next to the app list. Grant it through an expiring permission set assignment rather than a profile, and never to a business user.
