# mcp-server-vitally-cs

An MCP server for Customer Success teams using Vitally. Exposes account reads, health score breakdowns, and conversation history — three tools designed for CSMs who want to pull Vitally context into Claude conversations without leaving the chat surface.

> **STATUS: scaffold — not runtime-tested.** The code below is structurally complete and follows the official `mcp` Python SDK conventions, but it has not been executed against a live Vitally tenant. Adapt the subdomain, field names, and any custom trait keys to your org before use.

## What it exposes

### Account reads (read-only)
- `get_account_health(account_id)` — fetches a single account plus its full health score breakdown via the `/accounts/:id/healthScores` endpoint
- `list_at_risk_accounts(health_threshold?, limit?)` — pages through accounts, filters to those whose `healthScore` is at or below the threshold, returns a ranked list
- `get_account_conversations(account_id, limit?)` — fetches the most recent conversations linked to an account, ordered newest-first

The server does **not** expose write endpoints. No note creation, no conversation mutations, no trait updates. Read-only by design so CSMs can drop this into Claude Desktop without a security review of write scope.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-vitally-cs
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Locate your Vitally API key

In Vitally: **Settings → Integrations → API**. Generate or copy an existing API key. Vitally authenticates via HTTP Basic Auth with the API key as the username and an empty password. The `Authorization` header value is `Basic <base64(apikey:)>`.

The server handles this encoding for you — you only need to supply the raw key as `VITALLY_API_KEY`.

### 3. Find your subdomain

Your Vitally base URL is `https://<subdomain>.rest.vitally.io`. The subdomain is the prefix of your Vitally workspace URL (e.g. if you log in at `acme.vitally.io`, your subdomain is `acme`). EU tenants use `rest.vitally-eu.io` — set `VITALLY_BASE_URL` accordingly.

### 4. Configure environment

```bash
export VITALLY_API_KEY="your_api_key_here"
export VITALLY_SUBDOMAIN="acme"                          # your workspace subdomain
export VITALLY_BASE_URL="https://acme.rest.vitally.io"   # full base URL; auto-built from subdomain if omitted
export VITALLY_HEALTH_THRESHOLD="50"                     # default red/orange threshold for list_at_risk_accounts
export VITALLY_PAGE_LIMIT="100"                          # max records per page (Vitally caps at 100)
```

**`VITALLY_API_KEY`** — required. Raw API key from Vitally Settings → Integrations → API. Never commit this to source control.

**`VITALLY_SUBDOMAIN`** — required unless `VITALLY_BASE_URL` is set explicitly. Used to construct `https://{subdomain}.rest.vitally.io`.

**`VITALLY_BASE_URL`** — optional override. Set this explicitly for EU tenants: `https://rest.vitally-eu.io`. If set, it takes precedence over `VITALLY_SUBDOMAIN`.

**`VITALLY_HEALTH_THRESHOLD`** — optional, default `50`. Accounts whose overall health score is ≤ this value are returned by `list_at_risk_accounts`. Vitally health scores run 0–100; typical "red" band is 0–33, "orange" 34–66, "green" 67–100 — adjust to match your org's thresholds.

**`VITALLY_PAGE_LIMIT`** — optional, default `100`. Vitally's REST API caps list responses at 100 records per page. The scaffold respects this ceiling.

### 5. Register with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "vitally-cs": {
      "command": "python",
      "args": ["-m", "vitally_cs_mcp.server"],
      "env": {
        "VITALLY_API_KEY": "your_api_key_here",
        "VITALLY_SUBDOMAIN": "acme",
        "VITALLY_HEALTH_THRESHOLD": "50"
      }
    }
  }
}
```

Restart Claude Desktop. You should see 3 tools registered under `vitally-cs`.

### 6. Register with Claude Code

Add to your project or user `settings.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "vitally-cs": {
      "command": "python",
      "args": ["-m", "vitally_cs_mcp.server"],
      "env": {
        "VITALLY_API_KEY": "your_api_key_here",
        "VITALLY_SUBDOMAIN": "acme"
      }
    }
  }
}
```

### 7. Sanity check

Ask Claude: "Show me the health score for account ID `<any real account id>`." The response should include an overall health score and a breakdown of individual health components. Then ask: "List my at-risk accounts with a threshold of 40." Verify the returned accounts actually have health scores at or below 40 in the Vitally UI.

## Security model

- **Read-only by design.** The three tools call only `GET` endpoints. No write operations are included. This means there is nothing to scope-limit beyond read access to account, health, and conversation data — the entire risk surface is disclosure, not mutation.
- **API key scope.** Vitally API keys give read access to all objects the generating admin can see. There is no per-object scope at the API key level. Create a dedicated Vitally admin user for this integration, give it view-only access to the accounts and conversations your CSMs need, and generate the key from that user. Do not use a full-admin key.
- **Data in Claude's context window.** Account names, health scores, conversation subjects, and message bodies pass through Claude's context. Review your org's AI/data policy before enabling this for accounts that hold PII or contractually sensitive information. The server does not log requests or responses; what Claude does with the data depends on your Claude plan's data-retention settings.
- **Key storage.** The scaffold reads `VITALLY_API_KEY` from env. For team deployments, store the key in your secret manager (Vault, AWS Secrets Manager, 1Password CLI) and inject it at process start, rather than hardcoding it in the Claude Desktop config JSON.

## Known limits and TODOs (before production use)

1. [ ] Add OAuth or service-account key rotation — the current scaffold uses a static API key; implement a refresh path or a key-rotation reminder cron.
2. [ ] Implement cursor-based pagination in `list_at_risk_accounts` — the current scaffold fetches one page (up to 100 accounts) and filters locally; for orgs with >100 accounts, add a loop over the `next` cursor until exhausted or limit reached.
3. [ ] Add structured logging via `python-json-logger` — emit one JSON line per tool call with name, arguments hash, duration ms, and HTTP status code.
4. [ ] Wire optional Sentry / OpenTelemetry export for latency and error tracking.
5. [ ] Add integration tests against a Vitally sandbox or staging tenant.
6. [ ] Validate `VITALLY_SUBDOMAIN` at startup against the Vitally API (a lightweight `GET /resources/accounts?limit=1` can confirm the key and subdomain are valid before accepting tool calls).
7. [ ] Support EU data center (`rest.vitally-eu.io`) configuration with a clearer env var — currently handled via `VITALLY_BASE_URL` override, but a `VITALLY_REGION=eu` flag would be friendlier.
8. [ ] Add `list_at_risk_accounts` sort by health score ascending so the worst accounts surface first without the caller needing to sort client-side.
