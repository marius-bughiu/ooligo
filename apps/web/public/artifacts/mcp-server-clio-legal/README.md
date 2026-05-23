# mcp-server-clio-legal

An MCP server for legal teams using Clio practice management. Exposes five read-only tools over the Clio API v4: `list_matters`, `get_matter`, `get_matter_time_entries`, `get_matter_activity`, and `get_contact`. No writes — the server intentionally does not register create, update, or delete operations. Attorney-client data is sensitive; queries are metadata-logged only (matter names, contact names, time-entry notes, and activity descriptions are never written to logs).

> **STATUS: scaffold — not runtime-tested.** The code is structurally complete and follows the official `mcp` Python SDK conventions, but it has not been executed against a live Clio tenant. Validate endpoint paths, field names, and filter syntax against your Clio account before use. Clio's API surface (response shapes, custom-field conventions, activity type labels) varies by account tier.

## What it exposes

- `list_matters(status?, client_id?, limit?, page_token?)` — paginated matter list filtered by status and/or client
- `get_matter(matter_id)` — full matter metadata including practice area, attorneys, and custom fields
- `get_matter_time_entries(matter_id, start_date?, end_date?, limit?)` — time entries logged against a matter
- `get_matter_activity(matter_id, type?, limit?)` — all activity records (time, expense, flat-rate) for a matter
- `get_contact(contact_id)` — contact metadata: name, type, email, phone, company

The server does **not** expose document retrieval, calendar events, billing/invoice operations, task creation, or any endpoint that modifies Clio records. The read-only posture is intentional — adding any write tool requires an explicit code change reviewed against your firm's privilege and security policies.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-clio-legal
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. OAuth — create a Clio developer application

Clio uses OAuth 2.0 Authorization Code flow. There is no static API key; you must register an application and obtain tokens.

1. Sign in to the Clio developer portal: https://app.clio.com/settings/developer_applications
2. Click **Create Application**. Set the redirect URI to `http://localhost:8080/callback` for local development.
3. Under **Permissions**, select read-only access for: Matters, Contacts, Activities. Do not select write permissions unless you are extending the server with write tools and have completed a privilege review.
4. Copy the **App Key** (this is your `CLIO_CLIENT_ID`) and **App Secret** (your `CLIO_CLIENT_SECRET`).

The OAuth token exchange produces an **access token** and a **refresh token**. Access tokens expire (typically after one hour); the production posture is to use the refresh token to obtain a new access token automatically (see TODO item 2). For local development, a static access token obtained via the Authorization Code dance is sufficient.

To obtain an initial access token manually:

1. Direct your browser to: `https://app.clio.com/oauth/authorize?response_type=code&client_id=<YOUR_CLIENT_ID>&redirect_uri=http://localhost:8080/callback`
2. Authorize the application in your Clio account.
3. Clio redirects to `http://localhost:8080/callback?code=<AUTH_CODE>`.
4. Exchange the code for tokens:

```bash
curl -X POST https://app.clio.com/oauth/token \
  -d "grant_type=authorization_code" \
  -d "code=<AUTH_CODE>" \
  -d "client_id=<YOUR_CLIENT_ID>" \
  -d "client_secret=<YOUR_CLIENT_SECRET>" \
  -d "redirect_uri=http://localhost:8080/callback"
```

The response JSON includes `access_token` and `refresh_token`. Copy the `access_token`.

For EU, CA, or AU regions, replace `app.clio.com` with the regional host in all OAuth URLs and API calls.

### 3. Configure environment variables

#### `CLIO_ACCESS_TOKEN`

Required. The OAuth access token obtained in step 2. Set to the `access_token` value from the token exchange response.

#### `CLIO_REGION`

Optional. Clio hosts accounts in four regions; the server must use the correct regional base URL. Accepted values: `us` (default), `eu`, `ca`, `au`. Corresponds to:

- `us` → `https://app.clio.com/api/v4`
- `eu` → `https://eu.app.clio.com/api/v4`
- `ca` → `https://ca.app.clio.com/api/v4`
- `au` → `https://au.app.clio.com/api/v4`

If you are unsure of your region, check the URL you use to sign in to Clio.

#### `CLIO_CLIENT_ID` / `CLIO_CLIENT_SECRET` / `CLIO_REFRESH_TOKEN`

Not consumed by the scaffold today. Placeholder for the OAuth refresh implementation in TODO item 2. Set them now so the variables are available when you add refresh logic.

```bash
export CLIO_ACCESS_TOKEN="eyJ..."
export CLIO_REGION="us"
export CLIO_CLIENT_ID="<your app key>"
export CLIO_CLIENT_SECRET="<your app secret>"
export CLIO_REFRESH_TOKEN="<your refresh token>"
```

### 4. Register with Claude Desktop or Claude Code

**Claude Desktop** — edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "clio-legal": {
      "command": "python",
      "args": ["-m", "clio_legal_mcp.server"],
      "env": {
        "CLIO_ACCESS_TOKEN": "eyJ...",
        "CLIO_REGION": "us"
      }
    }
  }
}
```

**Claude Code** — add to your project's `.claude/mcp.json` or run:

```bash
claude mcp add clio-legal python -m clio_legal_mcp.server
```

Restart Claude Desktop (or reload Claude Code). You should see 5 tools registered under `clio-legal`.

### 5. Sanity-check

Ask Claude: "List my open matters in Clio." If the response returns a list of matters with `display_number` and `status` fields, the server is working. If you receive a 401, the access token has expired — re-run the token exchange (step 2). If you receive a 429, you have exceeded the 3 req/s rate limit; add a delay between rapid successive calls.

Confirm that the response does **not** include activity note text or contact addresses unless you called `get_contact` or `get_matter_activity` explicitly. The audit log should show only `tool=list_matters ts=... results=N`.

## Security model

**Read-only.** The server registers no create, update, or delete tools. Adding any write path requires editing `server.py` — a deliberate friction point so that write access is a reviewed decision, not an accidental addition.

**Token scope.** The OAuth token's permissions are bounded by the scopes granted during the authorization dance (step 2). If you granted read-only Matters + Contacts + Activities, the token cannot modify records even if a write call were attempted. Provision the narrowest scope your use case requires.

**Who sees what.** Any user with access to the Claude Desktop or Claude Code session that has the `clio-legal` MCP registered can query any matter, contact, or activity the OAuth token's account can see. This means:

- If the token is a partner's Clio account, that partner's entire matter list is queryable.
- If you share the MCP registration across a team, every team member's Claude session can query any matter in the token holder's account.

In a multi-attorney firm, the appropriate posture is a dedicated service-account Clio user with restricted matter access, not a partner's personal account. Document the service account in your security policy.

**Attorney-client confidentiality.** Matter descriptions, time-entry notes, activity notes, and contact records are protected by attorney-client privilege and confidentiality rules. The MCP server routes all responses to Claude's context window, which means:

- The data flows through Anthropic's API (governed by Anthropic's data processing terms).
- Claude's context window is not permanently stored beyond the session, but the conversation log in Claude Desktop may persist on disk.

Review these implications with counsel before deploying to production. The scaffold is not a substitute for a firm-level AI policy that addresses privilege and confidentiality.

**Audit log.** The logger records tool name, timestamp, and result count only — never matter names, contact names, activity descriptions, or any content that could reveal case strategy or client identity.

## Known limits and TODOs (before production use)

1. Validate Clio API v4 field names and filter parameter syntax against your tenant — Clio's response shapes differ by account tier and feature flags. The `fields` strings in `server.py` follow the documented v4 conventions but have not been executed against a live account.
2. Implement OAuth token refresh using `CLIO_CLIENT_ID`, `CLIO_CLIENT_SECRET`, and `CLIO_REFRESH_TOKEN`. Static access tokens expire after approximately one hour; a production deployment needs automatic refresh via `POST https://app.clio.com/oauth/token` with `grant_type=refresh_token`.
3. Add request-level retries with exponential backoff for HTTP 429 responses. Clio enforces a 3 requests/second per-application rate limit; burst patterns (e.g., fetching all matters then all time entries immediately) will hit this.
4. Wire structured logging via `python-json-logger` piped to your matter-management audit trail. The current logger writes plain text; structured JSON simplifies downstream aggregation and privilege-compliant log scrubbing.
5. Add a matter-access guard: refuse to return matters that the authenticated user does not have explicit permission to see in Clio. The current scaffold relies entirely on Clio's API access control — if the OAuth token's account has broad matter access, so does the MCP server.
6. Write integration tests against a Clio sandbox account. The Clio developer portal provides sandbox credentials for testing without touching production data.
7. Add Sentry / OpenTelemetry export — but scrub matter names, contact names, and note text before transmission. Only identifiers (matter_id, contact_id) and counts are safe to export.
