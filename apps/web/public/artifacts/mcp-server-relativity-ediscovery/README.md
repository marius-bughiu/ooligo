# mcp-server-relativity-ediscovery

An MCP server for legal-ops and e-discovery teams using RelativityOne or Relativity Server. Exposes workspace listings, review-set metadata, and saved-search summaries as Claude tools — read-only by design. The server surfaces case-level and review-set-level metadata that attorneys and legal-ops managers query repeatedly through the Relativity UI, without exposing document text or review coding decisions.

> **STATUS: scaffold — not runtime-tested.** The code below is structurally
> complete and follows the official `mcp` Python SDK conventions, but it
> has not been executed against a live Relativity tenant. The Relativity
> REST API surface (paths, response shapes, ArtifactTypeIDs for custom
> RDOs) varies by instance version, tenant tier, and installed
> applications. Treat this as a starting point you adapt to your
> environment before any production use. Consult your Relativity
> administrator and, for any legal-data posture decision, qualified counsel.

## What it exposes

### Workspace tools (read-only)
- `list_workspaces` — paginated list of accessible workspaces with name, ArtifactID, status, matter, and document count
- `get_workspace_summary` — single-workspace metadata: document count, file size, active users, creation date

### Review-set tools (read-only)
- `get_review_set_metadata` — review-set object metadata: name, document count, status, coding decisions summary, reviewer assignments (NOT document content or coding values per document)

### Saved-search tools (read-only)
- `get_saved_search_summary` — saved-search definition metadata: name, conditions, fields, owner (NOT the document results of running the search)
- `list_saved_searches` — paginated list of saved searches in a workspace with names, owners, and modification dates

The server **does not** expose document text, review coding values per document, production sets, audit logs, or any write operations. The design principle: Claude can navigate the case structure and surface operational metadata; attorneys drive every substantive review decision.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-relativity-ediscovery
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Obtain API credentials from Relativity

#### Option A — OAuth2 client credentials (recommended for production)

In Relativity: Home → Authentication → OAuth2 Client Manager → New.

- **Name:** anything descriptive (e.g. `mcp-ediscovery-server`)
- **Flow Grant Type:** Client Credentials
- **Context User:** a service account in the Relativity Administrators group (or a user with read access to all intended workspaces)

Save. Copy the **Client ID** and **Client Secret**. Set `RELATIVITY_AUTH_MODE=oauth2` (see §3 below).

The token endpoint follows the pattern: `https://<your-tenant>.relativity.one/Relativity/Identity/connect/token`

The access token is short-lived (~1 hour). The server's `auth_headers()` helper fetches a fresh token on each server start; add OAuth2 token refresh (TODO #2 below) before long-running deployments.

#### Option B — Basic authentication (development / short-lived use)

Use an existing Relativity username and password. The credentials are Base64-encoded and sent as an HTTP Basic header. This is convenient for local development but unsuitable for shared or long-lived deployments because the credentials cannot be revoked granularly and because rotating a user password disrupts all sessions sharing the credential.

Set `RELATIVITY_AUTH_MODE=basic` (see §3 below).

### 3. Configure environment

```bash
# Required for all auth modes
export RELATIVITY_HOST="https://your-tenant.relativity.one"    # no trailing slash
export RELATIVITY_AUTH_MODE="oauth2"                            # or "basic"

# Required for oauth2 mode
export RELATIVITY_CLIENT_ID="your-oauth2-client-id"
export RELATIVITY_CLIENT_SECRET="your-oauth2-client-secret"

# Required for basic mode
export RELATIVITY_USERNAME="serviceaccount@yourfirm.com"
export RELATIVITY_PASSWORD="your-password"

# Optional tuning
export RELATIVITY_DEFAULT_WORKSPACE_ID=""   # if set, skips workspace picker for single-matter deployments
export RELATIVITY_PAGE_SIZE="50"            # default page size for list_workspaces, list_saved_searches
```

#### `RELATIVITY_HOST`
The base URL of your RelativityOne tenant or on-prem Relativity Server. No trailing slash. For RelativityOne cloud this is typically `https://<tenant>.relativity.one`; for on-prem it is the hostname your Relativity Server was installed on.

#### `RELATIVITY_AUTH_MODE`
`oauth2` (recommended) or `basic`. Controls how `auth_headers()` constructs the Authorization header. In `oauth2` mode the server POSTs to the Identity token endpoint at startup and uses the returned Bearer token. In `basic` mode it Base64-encodes `RELATIVITY_USERNAME:RELATIVITY_PASSWORD`.

#### `RELATIVITY_CLIENT_ID` / `RELATIVITY_CLIENT_SECRET`
OAuth2 client credentials from the OAuth2 Client Manager. Required when `RELATIVITY_AUTH_MODE=oauth2`.

#### `RELATIVITY_USERNAME` / `RELATIVITY_PASSWORD`
Relativity login credentials. Required when `RELATIVITY_AUTH_MODE=basic`. The account must have read access to all workspaces you intend to surface. Provision a service account; do not use a named attorney's credentials.

#### `RELATIVITY_DEFAULT_WORKSPACE_ID`
If set, `list_saved_searches` and `get_review_set_metadata` default to this workspace's ArtifactID when no `workspace_id` argument is passed. Useful for single-matter deployments.

#### `RELATIVITY_PAGE_SIZE`
Default page size for paginated list operations. Default: 50. Reduce if your Relativity instance rate-limits aggressively on large result sets.

### 4. Register with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "relativity-ediscovery": {
      "command": "python",
      "args": ["-m", "relativity_ediscovery_mcp.server"],
      "env": {
        "RELATIVITY_HOST": "https://your-tenant.relativity.one",
        "RELATIVITY_AUTH_MODE": "oauth2",
        "RELATIVITY_CLIENT_ID": "your-client-id",
        "RELATIVITY_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

Restart Claude Desktop. You should see 5 tools registered under `relativity-ediscovery`.

### 5. Sanity check

Ask Claude: "List the workspaces I have access to in Relativity." Confirm you receive a list of workspace names with ArtifactIDs and that no error appears. Then ask: "Give me the saved searches in workspace {ArtifactID}." Confirm the response contains search names and owners only — no document text or coding values should appear. If the response includes document body content, something in your Relativity configuration is surfacing document data through the metadata endpoints; stop and investigate before sharing the server beyond the engineer who set it up.

## Security model

**Read-only.** The server registers zero write operations. No documents are modified, no coding decisions are recorded, no productions are triggered. The blast radius of a compromised credential is limited to read access over whatever workspaces the service account can reach.

**Metadata only, not document content.** `get_review_set_metadata` returns review-set-level counts and status fields, not per-document review values. `get_saved_search_summary` returns the search definition (conditions, fields list, owner), not the search results (the documents it returns). This posture matters because a saved search's existence and conditions can themselves be attorney work product — the query string is never logged (see `log_invocation()` in `server.py`).

**Service account scoping.** The credentials you provision see every workspace accessible to the Context User (OAuth2) or the login account (Basic). Scope the service account to only the workspaces the MCP deployment is intended to cover. In Relativity this means adding the service account to workspace groups with read-only permissions and explicitly removing it from workspaces it should not reach.

**Credential rotation.** For OAuth2 deployments, the client secret can be rotated in the OAuth2 Client Manager without changing the service account. Rotate on any personnel change. For Basic auth deployments, the password rotation also affects any other system using the same account — a strong reason to prefer OAuth2 for shared environments.

**This server touches data that may be subject to litigation hold, privilege assertions, and protective orders.** Consult qualified counsel before deploying in any active matter to confirm the deployment is consistent with your firm's or client's data-handling protocols and any governing protective orders.

## Known limits and TODOs (before production use)

1. Validate all API base paths against your specific Relativity version. The path prefixes (`Relativity.Rest/api/relativity-environment/v1/workspace/` for the Workspace Manager; `Relativity.Rest/api/Relativity.ObjectManager/v1/workspace/{id}/object/` for the Object Manager) follow the RelativityOne REST API conventions as of 2024–2025, but on-prem Relativity Server versions may differ. Confirm against your Relativity administrator's API documentation before first use.
2. Implement OAuth2 token refresh. The current scaffold fetches a token once at startup. Tokens expire (~1 hour). For deployments longer than one session, add a refresh loop that re-fetches the token when a 401 is returned.
3. Add request-level retries with exponential backoff. Relativity rate-limits REST clients; burst queries (e.g. listing all saved searches across dozens of workspaces) will hit 429s without backoff.
4. Pin the review-set ArtifactTypeID for your tenant. `get_review_set_metadata` queries for objects of the `Relativity.ReviewSet` type. The numeric ArtifactTypeID for this object type is tenant-specific (it is assigned when the Review application is installed). The scaffold uses a name-based lookup at startup to resolve the ID; validate this lookup resolves correctly in your environment before relying on it.
5. Wire structured logging via `python-json-logger` and route to your matter audit trail. The current scaffold logs to stderr only.
6. Add Sentry or OpenTelemetry export — but scrub query strings, search conditions, and workspace names before transmission if those are privileged under your matter's protective order.
7. Write integration tests against a Relativity sandbox workspace before any production matter deployment.
