# mcp-server-clari-revops

An MCP server for revenue-operations teams using Clari. Exposes three read-only tools — `get_forecast`, `get_pipeline_changes`, and `get_deal_risk` — that query Clari's Forecast API and Opportunity API to surface the data RevOps teams most commonly need in a forecast call or pipeline review. Drop it into Claude Desktop or Claude Code and ask "What does Q2 look like by segment in Clari?" or "Which deals moved stages in the last 7 days?" without leaving the chat.

> **STATUS: scaffold — not runtime-tested.** The code is structurally complete and follows the official `mcp` Python SDK conventions, but it has not been executed against a live Clari org. Treat it as a starting point. Clari's Forecast API is asynchronous (submit → poll → download), which means each `get_forecast` call incurs two to three round-trips under the hood. Time per call in practice is 5–30 seconds depending on Clari's job queue depth; see the Known Limits section for details.

## What it exposes

- `get_forecast(forecast_id, time_period?, scope_id?, currency?)` — submits a Forecast export job, polls until `DONE`, and returns the first page of results (up to 200 rows). Read-only.
- `get_pipeline_changes(start_date, end_date, limit?)` — queries the Audit API for pipeline-relevant events (stage changes, amount changes, close-date pushes) in a date window. Returns up to 200 events.
- `get_deal_risk(opp_ids)` — queries the Opportunity API for up to 100 opportunity IDs and returns each deal's Clari AI risk score (`crmScore`), trend history, and key field values.

No write tools. No ingestion endpoints. The server never mutates Clari data.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-clari-revops
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Generate a Clari API token

In Clari: Account Settings → **API Token** → Generate New API Token. Give it a name (e.g. `claude-mcp-readonly`), copy the token immediately — it is not shown again.

**Where to find it:** The API Token tab is at the bottom of your Account Settings page. Only org admins can generate tokens. The token is org-scoped; it is invalidated if the generating user is deactivated, so use a service account.

### 3. Find your Forecast ID

Open the Forecast Tab in Clari. The URL contains `forecastId=<uuid>`. Copy that UUID — it is the `CLARI_FORECAST_ID` env var below. If you manage multiple forecasts (e.g. one per segment), store the most-used one as the default and pass others per-call.

**Where to find it:** Clari UI → Forecast → the URL bar. Example: `https://app.clari.com/forecast?forecastId=abc123de-f456-...`

### 4. Configure environment variables

```bash
export CLARI_API_TOKEN="your-token-here"
export CLARI_BASE_URL="https://api.clari.com/v5"   # default; change only if Clari support directs you to
export CLARI_FORECAST_ID="abc123de-f456-..."        # from the Forecast Tab URL
export CLARI_POLL_MAX_ATTEMPTS="12"                 # optional; default 12 (= 60 s at 5-s intervals)
export CLARI_POLL_INTERVAL_SECONDS="5"              # optional; default 5
```

#### CLARI_API_TOKEN

Your org API token from Account Settings → API Token. Passed as the `apikey` header on every request. Keep it in a secrets manager, not in plain `.env` files committed to version control.

#### CLARI_BASE_URL

The Clari API base URL. As of API v5, this is `https://api.clari.com/v5`. Clari support will tell you if your org uses a different base (uncommon but possible for enterprise-custom deployments).

#### CLARI_FORECAST_ID

The UUID of the forecast configuration you want to query. Each forecast in Clari has a stable ID that appears in the Forecast Tab URL. This is the default used by `get_forecast` when no `forecast_id` argument is supplied.

#### CLARI_POLL_MAX_ATTEMPTS / CLARI_POLL_INTERVAL_SECONDS

Controls how long `get_forecast` waits for Clari's async job to complete. At defaults (12 × 5 s = 60 s total), the tool raises `TimeoutError` if the job is not `DONE` in 60 seconds. Increase `CLARI_POLL_MAX_ATTEMPTS` for large orgs where export jobs routinely take longer.

### 5. Register with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "clari-revops": {
      "command": "python",
      "args": ["-m", "clari_revops_mcp.server"],
      "env": {
        "CLARI_API_TOKEN": "your-token-here",
        "CLARI_BASE_URL": "https://api.clari.com/v5",
        "CLARI_FORECAST_ID": "abc123de-f456-...",
        "CLARI_POLL_MAX_ATTEMPTS": "12",
        "CLARI_POLL_INTERVAL_SECONDS": "5"
      }
    }
  }
}
```

Restart Claude Desktop. You should see 3 tools registered under `clari-revops`.

### 6. Register with Claude Code

Add to your project's `.claude/settings.json` or `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "clari-revops": {
      "command": "python",
      "args": ["-m", "clari_revops_mcp.server"],
      "env": {
        "CLARI_API_TOKEN": "your-token-here",
        "CLARI_FORECAST_ID": "abc123de-f456-..."
      }
    }
  }
}
```

### 7. Sanity-check invocations

After restarting Claude Desktop, run these prompts in order:

1. **Token check:** "Using clari-revops, fetch the deal risk for opportunity IDs ['opp_001', 'opp_002'] and show me the raw response." — Clari will return empty or error objects for fake IDs, but a `200` response confirms the token is valid.
2. **Pipeline changes:** "Using clari-revops, get pipeline changes from 2026-05-01 to 2026-05-22." — Returns audit events. An empty array is valid if there were no changes.
3. **Forecast:** "Using clari-revops, get the forecast for my default forecast ID." — This is the slow path (async job). Expect 5–30 seconds. If it times out, raise `CLARI_POLL_MAX_ATTEMPTS` to 24.

## Security model

**Token scope.** Clari API tokens are org-scoped and tied to the generating user's permissions. There is no per-endpoint scope granularity — the token can read everything the user can read in the Clari UI. Use a dedicated service account with the minimum Clari role (typically "viewer" or "RevOps analyst") rather than an admin account. Revoke the token in Account Settings if the service account is deactivated.

**What this server reads.** `get_forecast` reads forecast export data (quota, commits, CRM totals, adjustments). `get_pipeline_changes` reads audit events. `get_deal_risk` reads opportunity-level AI scores and field values. None of these calls write, ingest, or mutate Clari data.

**Token storage.** The token is read from the environment variable `CLARI_API_TOKEN`. Never commit it to source control. For production use, store it in a secrets manager (Vault, AWS Secrets Manager, 1Password CLI) and inject it at runtime.

**Data in Claude's context.** Every tool call returns structured text that Claude reads as context. If your Clari instance contains PII (customer names, contact details), that data will pass through Claude's API. Review your AI/data-processing policy with your security team before enabling this for a full org.

## Known limits and numbered TODOs before production use

Clari's Forecast API is **asynchronous**. `get_forecast` submits a job, polls at 5-second intervals, and downloads the result when `status=DONE`. This means:
- Each `get_forecast` call takes 5–30 seconds in practice. It is not suitable for real-time conversation flow — tell users to expect a delay.
- Clari enforces **concurrent job limits** per org (visible via `GET /admin/limits`). If your org is already running export jobs, the server may wait for a slot. At high concurrent use, increase `CLARI_POLL_MAX_ATTEMPTS` rather than reducing `CLARI_POLL_INTERVAL_SECONDS`.
- Clari does not publish a specific per-minute rate limit in its public documentation. Treat the API as a low-throughput analytical endpoint (single-digit calls per minute), not a transactional one.

The Opportunity API (`get_deal_risk`) accepts up to **100 opp IDs per request** (Clari API limit, per the `GET /opportunity` spec). Pass more than 100 IDs and the scaffold splits into batches of 100 and merges the responses; this is a TODO — the current scaffold caps at 100 and raises if you exceed it.

- [ ] Implement OAuth / refresh-token flow as an alternative to static tokens, for orgs that rotate credentials.
- [ ] Handle Clari's concurrent-job limit: if `/admin/limits` shows `available=0`, back off and retry instead of failing immediately.
- [ ] Split `get_deal_risk` calls into batches of 100 when more than 100 IDs are supplied.
- [ ] Add `get_admin_limits` tool so users can check org quota before running large export jobs.
- [ ] Add structured logging (one JSON line per tool call: name, args hash, duration ms, HTTP status).
- [ ] Write integration tests against a Clari sandbox or staging environment.
- [ ] Add `--dry-run` flag that returns the constructed request payload without making the HTTP call.
- [ ] Validate `CLARI_FORECAST_ID` against the org on first run; fail loud if the ID does not resolve.
