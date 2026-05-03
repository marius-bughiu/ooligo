# mcp-server-ironclad-legal

An MCP server tuned for in-house legal teams using Ironclad CLM. Exposes workflows, records, and documents as Claude tools, plus two legal-helper queries (`clauses_by_type`, `expiring_contracts`), an audit-class summary (`summarize_workflow`), and one privileged write (`add_comment`). Read-mostly by design — drafts inside active workflows are typically privileged content, so the server defaults to metadata-only responses with explicit drill-down.

> **STATUS: scaffold — not runtime-tested.** The code below is structurally
> complete and follows the official `mcp` Python SDK conventions, but it
> has not been executed against a live Ironclad tenant. Treat it as a
> starting point you adapt to your tenant's workflow types, custom-field
> conventions, and clause-extraction model. The Ironclad public API
> surface (paths, response shapes, association labels) varies by tenant
> tier and feature flags.

## What it exposes

### Object-read tools (read-only)
- `get_workflow(workflow_id)` — workflow metadata, current step, participants
- `get_record(record_id)` — executed-contract record (post-signature repository entry)
- `get_document(document_id, version?)` — full document body for a specific version (explicit drill-down only)

### Search tools (read-only)
- `search_records(query, limit?)` — search the executed-contract repository
- `list_workflows(status?, type?)` — active workflows by status and workflow type

### Legal helpers (read-only)
- `clauses_by_type(workflow_id, clause_type)` — extracted clauses of a specific type (e.g. `indemnification`, `liability_cap`, `termination`) from a workflow's documents
- `expiring_contracts(window_days=90)` — records approaching renewal or expiration in the window, sorted by next-action date

### Audit-class tool (truncate-by-default)
- `summarize_workflow(workflow_id)` — metadata-only summary: counterparty, type, status, step history, participants, associated documents (IDs + titles only). Document body fetch is a separate explicit `get_document` call.

### Light writes (privileged)
- `add_comment(record_id, body)` — append a comment to a record. Comments inside Ironclad are themselves discoverable; this tool is the only write path on purpose.

The server **does not** expose `delete_*`, draft edits, workflow-stage transitions, or signer changes. Privileged content (drafts in active workflows, audit logs, redlines) flows through truncate-by-default responses; the user must request the body via an explicit second tool call. The principle: Claude can navigate, summarize, and annotate; the attorney drives every state-changing decision.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-ironclad-legal
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Create an Ironclad API token

In Ironclad: Admin → API Keys → Create. Grant read scope on workflows, records, and documents. Grant comment-write scope only if you intend to use `add_comment`. Copy the token.

The token is bearer-style — it bypasses Ironclad's per-user role permissions, so it sees everything the API key's role can see. Provision a service-account role with the narrowest scope your team can tolerate, not the broadest.

### 3. Configure environment

```bash
export IRONCLAD_API_TOKEN="ic_..."
export IRONCLAD_TRUNCATE_AT="4000"        # chars per body in summary responses
export IRONCLAD_DEFAULT_WORKFLOW_TYPES="msa,nda,sow,dpa"   # narrows list_workflows
```

`IRONCLAD_TRUNCATE_AT` is the character cap for any document-body field returned by `summarize_workflow`. Bodies above this length are truncated and the response includes a `_truncated_at` marker so Claude knows to issue a follow-up `get_document` call when the user explicitly asks.

### 4. Register with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "ironclad-legal": {
      "command": "python",
      "args": ["-m", "ironclad_legal_mcp.server"],
      "env": {
        "IRONCLAD_API_TOKEN": "ic_...",
        "IRONCLAD_TRUNCATE_AT": "4000",
        "IRONCLAD_DEFAULT_WORKFLOW_TYPES": "msa,nda,sow,dpa"
      }
    }
  }
}
```

Restart Claude Desktop. You should see ~9 tools registered under `ironclad-legal`.

### 5. Sanity-check

Ask Claude: "Summarize workflow {known-id}." Confirm the response is metadata-only (no document body inline) and contains a `_truncated_at` marker on any body field. Then ask Claude: "Now get me the full body of document {id} from that workflow." Confirm the body is returned only after the explicit second call. Tune `IRONCLAD_TRUNCATE_AT` until the metadata responses are useful for navigation but not large enough to ship privileged drafts inadvertently.

## Watch-outs

- **Drafts inside active workflows are typically privileged.** A draft MSA mid-redline is attorney work product. The truncate-by-default posture in `summarize_workflow` is the guard — never widen it without an explicit per-team policy review. If your team's matter-management policy treats some draft classes as non-privileged, configure `IRONCLAD_TRUNCATE_AT=999999` per-deployment, not per-tool.
- **The audit log is itself privileged content.** Ironclad's audit log records who looked at what when — surfacing it through an MCP tool would let Claude reason over privileged metadata. This server intentionally does not expose audit-log queries. If you need audit-log access, build a separate tool with a documented legal-hold exception path, not through this scaffold.
- **Search query metadata reveals legal strategy.** "Find all MSAs with uncapped indemnification" is a query whose existence — even without results — discloses the team's review priorities. The dispatch logs only timestamps, user IDs, and result counts (never the query string itself). Do not patch the dispatch to log query text without a privilege review; doing so creates a discoverable record of legal strategy.
- **Bearer tokens bypass per-user permissions.** Anyone with access to the MCP client sees every record the API key's role can reach. Provision the service-account role narrowly and document it with your security team.
- **Clause extraction is model-dependent.** Ironclad's clause extraction may miss non-standard clause headings or clauses inside attachments. `clauses_by_type` returns whatever Ironclad surfaces — never use it as the sole source for compliance attestations.

## Limits and TODOs (before production use)

- [ ] Validate the Ironclad public API base path against your tenant's actual endpoint — some tiers use a regional subdomain.
- [ ] Implement OAuth-with-refresh in place of the static bearer token. Static tokens cannot be revoked granularly when an attorney leaves; OAuth refresh + per-user delegation is the production posture.
- [ ] Add request-level retries with exponential backoff (Ironclad rate-limits aggressively under burst load).
- [ ] Wire structured logging via `python-json-logger` and pipe to your matter-management audit trail.
- [ ] Add a privilege-tag enforcement layer: refuse to return any document marked `privileged: true` in custom properties, even via explicit `get_document`, unless the user passes a documented `--privilege-acknowledged` flag.
- [ ] Write integration tests against an Ironclad sandbox.
- [ ] Add Sentry / OpenTelemetry export — but scrub query strings and document bodies before transmission.
