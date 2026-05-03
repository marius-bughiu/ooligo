# mcp-server-salesforce-revops

An MCP server tuned for revenue-operations teams using Salesforce. Exposes account, opportunity, contact, and lead reads, a SELECT-only SOQL endpoint, three RevOps helpers (`pipeline_by_stage`, `stale_opps`, `at_risk_commits`), and two audit-aware light writes (`add_note`, `update_field`). Designed to make Claude useful for "what's actually in the forecast" conversations without handing it the keys to delete or bulk-mutate the org.

> **STATUS: scaffold — not runtime-tested.** The code below is structurally complete and follows the official `mcp` Python SDK conventions, but it has not been executed against a live Salesforce org. Treat it as a starting point you adapt to your org's object model, picklist values, and custom audit object name. Stage labels, owner role hierarchy, and the audit object schema vary by org.

## What it exposes

### Object reads (read-only)
- `get_account(account_id)` — full Account fields
- `get_opportunity(opp_id)` — full Opportunity fields + owner
- `get_contact(contact_id)` — full Contact fields
- `get_lead(lead_id)` — full Lead fields

### SOQL (read-only)
- `query(soql, bypass_sharing=False)` — runs the SOQL string against the REST `/query` endpoint. **Refuses any statement that is not a single `SELECT`.** Any `INSERT`, `UPDATE`, `DELETE`, `UPSERT`, `MERGE`, or DML keyword raises before a request is made. `bypass_sharing` defaults to `False`; when `True`, the helper appends nothing — sharing rules apply via the running user. The flag is reserved for future tooling-API integration and is rejected today with a clear error.

### RevOps helpers (read-only)
- `pipeline_by_stage(close_date_window_days=90, owner_id?)` — open opportunities closing in the window, aggregated by stage. Optionally filtered to one owner.
- `stale_opps(days_in_stage_threshold=30)` — open opportunities whose `LastStageChangeDate` is older than the threshold.
- `at_risk_commits(quarter_end_date)` — Commit-stage opportunities whose `LastActivityDate` is more than 14 days ago **or** whose `CloseDate` is within 14 days of `quarter_end_date` and have no future-dated `Event` on the account.

### Audit-aware light writes
- `add_note(object_type, object_id, body)` — creates a `ContentNote` and links it via `ContentDocumentLink` to the parent record.
- `update_field(object_type, object_id, field_name, new_value, justification)` — single-field update with **mandatory `justification` parameter** (rejected if blank or shorter than 10 chars). Writes a `Cleanup_Audit__c` row first (object name, record id, field, old value, new value, justification, who, when), then performs the field update. If the audit insert fails, the update never runs.

The server **does not** expose `delete_*` tools, bulk DML, or stage-transition shortcuts. All bulk reads cap at 200 records per request to stay inside REST's per-call envelope and to give callers a predictable token budget.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-salesforce-revops
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Create a Salesforce Connected App (OAuth)

In Salesforce Setup: App Manager → New Connected App.

- **API (Enable OAuth Settings):** check.
- **Callback URL:** `http://localhost:1717/callback` (or any URL your OAuth helper accepts — the token is what we keep, not the redirect).
- **Scopes:** `api`, `refresh_token, offline_access`. Add `chatter_api` only if you also want to post Chatter feed items (out of scope for this scaffold).
- **Require Secret for Refresh Token Flow:** check.
- Save, wait 10 minutes for propagation, copy the **Consumer Key** and **Consumer Secret**.

Then run a one-time OAuth web-server flow to obtain a refresh token. The scaffold expects you to bring your own access token (refresh handling is on the TODO list, see below). For local development you can use the `sfdx auth:web:login` CLI to mint one and `sfdx force:org:display --verbose` to read it out.

**Auth choice for this scaffold.** We read a long-lived `SFDC_ACCESS_TOKEN` from env. Refresh-token rotation is documented as a TODO rather than implemented, because every team's secret-store choice (Vault, AWS Secrets Manager, 1Password, plain env) differs. The fields are split out so swapping in a refresh-flow client is a one-file change in `server.py`.

### 3. Configure environment

```bash
export SFDC_INSTANCE_URL="https://yourdomain.my.salesforce.com"
export SFDC_ACCESS_TOKEN="00D...!ARQAQ..."
export SFDC_API_VERSION="v60.0"                 # optional, default v60.0
export SFDC_AUDIT_OBJECT="Cleanup_Audit__c"     # custom object for write audits
export SFDC_COMMIT_STAGE_NAME="Commit"          # picklist label for commit-stage opps
```

The `Cleanup_Audit__c` object must exist with at least these custom fields: `Object_Name__c` (text), `Record_Id__c` (text 18), `Field_Name__c` (text), `Old_Value__c` (long text), `New_Value__c` (long text), `Justification__c` (long text), `Performed_By__c` (text). If you use a different object name, set `SFDC_AUDIT_OBJECT` accordingly.

### 4. Register with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "salesforce-revops": {
      "command": "python",
      "args": ["-m", "salesforce_revops_mcp.server"],
      "env": {
        "SFDC_INSTANCE_URL": "https://yourdomain.my.salesforce.com",
        "SFDC_ACCESS_TOKEN": "00D...!ARQAQ...",
        "SFDC_API_VERSION": "v60.0",
        "SFDC_AUDIT_OBJECT": "Cleanup_Audit__c",
        "SFDC_COMMIT_STAGE_NAME": "Commit"
      }
    }
  }
}
```

Restart Claude Desktop. You should see ~10 tools registered under `salesforce-revops`.

### 5. Sanity-check

Ask Claude: "Show me pipeline by stage for the next ninety days." Compare the per-stage totals against the equivalent Pipeline report in Salesforce. Then run `update_field` against a sandbox opportunity with a short justification and confirm both the field changed **and** a `Cleanup_Audit__c` row was written.

## Watch-outs

- **Connected App scope discipline.** A Connected App with `api` scope can read every object the running user can read. Create a dedicated integration user with a profile that exposes only the objects this server needs (Account, Opportunity, Contact, Lead, the audit object), and assign field-level permissions narrowly. Document this with your security team. **Guard:** integration-user profile reviewed quarterly; record the review date in the audit object.
- **Governor limits on bulk reads.** A naive `query("SELECT Id FROM Opportunity")` against a 500K-row org will paginate forever and exhaust your daily API quota. **Guard:** every helper caps `LIMIT` at 200; the `query` tool also injects `LIMIT 200` if the SOQL has none.
- **FLS bypass risk.** Salesforce's REST `/query` endpoint does **not** enforce field-level security unless you explicitly ask for `WITH SECURITY_ENFORCED`. **Guard:** the `query` tool appends `WITH SECURITY_ENFORCED` when missing, so a user without read on a field gets a clear error rather than silent data leakage.
- **Audit log gap on writes.** If the audit insert succeeds but the field update fails (or vice versa), you have a recorded change with no actual change (or a change with no record). **Guard:** the scaffold writes the audit row first; if the field update raises, the audit row is left in place tagged as `Failed__c=true` (you will need to add this field if you want to use the flag — TODO listed below). Reconcile via a weekly report.
- **OAuth token refresh failure.** Long-lived access tokens expire; a 401 on a Friday afternoon is the worst time to discover this. **Guard:** front the server with a token-refresh sidecar (or implement the refresh flow per the TODO). Fail loud on 401, do not silently retry.

## Limits and TODOs (before production use)

- [ ] Implement OAuth refresh-token flow so the server self-heals on 401, instead of crashing.
- [ ] Add request-level retries with exponential backoff (Salesforce returns 503 under maintenance windows).
- [ ] Write integration tests against a Salesforce sandbox org (Trailhead Playground works).
- [ ] Add structured logging via `python-json-logger`; emit one JSON line per tool call with name, arguments hash, duration, status.
- [ ] Wire optional Sentry / OpenTelemetry export.
- [ ] Add `Failed__c` boolean to `Cleanup_Audit__c` and flip it true if the post-audit field update raises.
- [ ] Validate `SFDC_AUDIT_OBJECT` and `SFDC_COMMIT_STAGE_NAME` against the org on first run; fail loud if either does not exist.
- [ ] Replace the long-lived token env var with a secret-store lookup (Vault, AWS Secrets Manager, 1Password CLI).
- [ ] Add a per-tool `--dry-run` flag that returns the SOQL/DML payload without executing.
