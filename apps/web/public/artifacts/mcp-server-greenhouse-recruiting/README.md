# Greenhouse recruiting MCP server

A read-mostly MCP server exposing the Greenhouse Harvest API as tools to Claude Desktop, Claude Code, or any MCP-compatible client. Six read tools cover daily recruiter questions; one cautious write tool (`note_stage_stuck`) adds an internal note.

**This is a scaffold, not a runtime-tested production server.** The tool implementations are written against the Harvest API's documented shape, but the recruiting engineer is responsible for verifying each tool against a Greenhouse staging tenant before flipping production credentials. The disclaimer is repeated in `server.py`'s module docstring.

## Install

```bash
cd apps/web/public/artifacts/mcp-server-greenhouse-recruiting/
pip install -e .
# or
uv pip install -e .
```

The package exposes a `greenhouse-recruiting-mcp` CLI entrypoint.

## Environment variables

### `GREENHOUSE_API_KEY` (required)

The Harvest API key from Greenhouse → Configure → Dev Center → API Credential Management.

When generating the key, pick the **minimum scope** needed:

- `Get` permission on `Candidates`, `Applications`, `Jobs`, `Users`, `Departments`.
- `Post` permission on `Candidate Notes` (only — required for `note_stage_stuck`).

Wider scopes silently turn the server into a higher-blast-radius surface. If you find yourself adding a write permission for a new tool later, document the per-tool justification in `server.py`'s `TOOL_REGISTRY` docstring.

### `GREENHOUSE_USER_ID_FOR_ON_BEHALF_OF` (required)

The Greenhouse user ID that writes will be attributed to. Find this in the Greenhouse user URL when you're logged in as the user (e.g. `app.greenhouse.io/users/123456` → user ID is `123456`).

This is required even if you only use the read tools — the server validates it at startup so writes can't slip through unattributed later.

## MCP client registration

### Claude Desktop

Add to `claude_desktop_config.json` (location varies by OS — `~/Library/Application Support/Claude/` on macOS, `%APPDATA%\Claude\` on Windows):

```json
{
  "mcpServers": {
    "greenhouse-recruiting": {
      "command": "uv",
      "args": ["run", "greenhouse-recruiting-mcp"],
      "cwd": "/absolute/path/to/mcp-server-greenhouse-recruiting",
      "env": {
        "GREENHOUSE_API_KEY": "...",
        "GREENHOUSE_USER_ID_FOR_ON_BEHALF_OF": "..."
      }
    }
  }
}
```

Restart Claude Desktop. The seven tools should appear in the tools panel.

### Claude Code

In your project's `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "greenhouse-recruiting": {
      "command": "uv",
      "args": ["run", "greenhouse-recruiting-mcp"],
      "cwd": "/absolute/path/to/mcp-server-greenhouse-recruiting",
      "env": {
        "GREENHOUSE_API_KEY": "...",
        "GREENHOUSE_USER_ID_FOR_ON_BEHALF_OF": "..."
      }
    }
  }
}
```

### Other MCP clients (Cursor, Continue, etc.)

Most accept the same `command + args + env` shape. Refer to the client's MCP documentation.

## Sanity-check invocation

Before the first real use, run the server against a Greenhouse staging tenant (paid Greenhouse customers can request a staging environment from their CSM).

```bash
GREENHOUSE_API_KEY=staging_key \
GREENHOUSE_USER_ID_FOR_ON_BEHALF_OF=staging_user_id \
greenhouse-recruiting-mcp --help
```

(The CLI is the MCP stdio server; `--help` is not implemented in this scaffold. The intent is to confirm the package installed and the entrypoint resolved.)

For per-tool validation, the recommended flow is:

1. Register the server with Claude Desktop pointed at staging credentials.
2. Ask Claude to call each tool with known staging inputs and verify the responses match what you see in the staging Greenhouse UI.
3. Only after every tool is verified, swap to production credentials.

## Security model

- **Auth.** Greenhouse API key as Basic-auth username, empty password. Greenhouse's documented pattern.
- **Writes.** Only `note_stage_stuck` mutates state. Attributed via `On-Behalf-Of` header so the Greenhouse audit log shows the recruiting engineer's user, not just the API key.
- **Rate limit.** Token-bucket at 40 req/10s by default (Greenhouse ceiling is 50 req/10s). Lower if other systems share the API key.
- **PII in MCP responses.** The server returns the data the API returns — including candidate names and emails. The calling Claude session is downstream; the session's data-handling posture is the recruiter's responsibility. Don't paste session transcripts into shared Slack channels; don't log raw responses to your own audit table.
- **Audit log.** The server logs every tool call to stderr at INFO level with PII-stripped arguments. Recruiting engineer is responsible for capturing stderr into a durable audit log (e.g. via systemd journal, Docker log driver, or a wrapping script that tees to a file).

## Known limits — numbered TODO before production use

The scaffold is honest about what it doesn't do yet. Treat each as a numbered TODO to close before broad production use.

1. **Not runtime-tested.** Every tool needs validation against a Greenhouse staging tenant. The smoke check in this README is a credentials check, not a per-tool validation.
2. **Pagination max page count.** The async iterator caps at 50 pages per call (5,000 records at 100/page). For tenants with very large candidate volumes, the cap needs raising or replacement with a streaming pattern.
3. **No request retry on transient errors.** The 429 handler retries once with a 2-second backoff. Other 5xx errors propagate; the recruiting engineer wraps the calls if more retry resilience is needed.
4. **Stage-name matching is exact-string.** "Phone Screen" and "Phone screen" are different. The tool surfaces this clearly enough but does not normalize.
5. **No multi-tenant support.** One server instance, one Greenhouse account. Multi-tenant requires non-trivial reshape (per-call credential injection, tenant-aware audit logging).
6. **Activity feed parsing is partial.** `get_candidate_history` returns the activity items the Harvest endpoint exposes; some interaction types (system actions, automated emails) may be undertyped. Expand the schema as the team finds gaps.
7. **No tests.** A pytest suite for the rate limiter and the Link-header parser is the obvious first addition; full integration tests against a staging tenant are the second.

## What this server intentionally does NOT do

- **No `delete_*` tools.** Deletes happen in the Greenhouse UI, with the audit trail that produces.
- **No candidate-state mutations** (move stages, advance to offer, reject). Those are recruiter decisions and need explicit per-tool justification — adding them would compromise the read-mostly posture.
- **No bulk send / outbound email.** Outreach belongs in a sourcing tool with proper unsubscribe handling, not in an MCP read-tool surface.
- **No PII normalization** (no name-redaction, no email-hashing in responses). The server returns what Greenhouse returns; downstream redaction is the recruiter's responsibility.

## Adding a new tool

If you need a new tool:

1. Add a Pydantic input schema and an async implementation in `server.py`.
2. Register it in `TOOL_REGISTRY` with a clear description.
3. If it's a write tool, document the per-tool justification in the function's docstring (see `note_stage_stuck` for the template). Confirm the `On-Behalf-Of` attribution flows through.
4. Validate against staging.
5. Update this README's tool list.

The scaffold's structure makes this a 30-60 minute change per tool. The discipline is in the per-tool justification step — it's the only thing that prevents the read-mostly posture from drifting.
