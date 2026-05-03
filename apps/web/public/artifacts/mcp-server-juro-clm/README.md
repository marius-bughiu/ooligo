# Juro CLM MCP server

Read-mostly MCP server exposing Juro CLM (GraphQL API) as tools to Claude Desktop, Claude Code, or any MCP-compatible client. Five read tools cover daily contracts questions; one cautious write tool (`attach_note`) adds a private note.

**Scaffold, not runtime-tested.** The tool implementations are written against Juro's documented GraphQL schema. The contracts engineer is responsible for verifying each tool against the team's Juro instance before flipping production credentials. See `server.py` module docstring.

## Install

```bash
cd apps/web/public/artifacts/mcp-server-juro-clm/
pip install -e .
```

## Environment variables

### `JURO_API_KEY` (required)

From Juro Settings → API → Generate new API key. Pick the minimum scope needed:

- Read scope on `contracts`, `contractsByClause`, `documentVersions`.
- Write scope on `attachNote` (only — required for the single write tool).

Wider scopes silently turn the server into a higher-blast-radius surface.

### `JURO_USER_EMAIL` (required)

The email address writes will be attributed to in Juro's audit log. Required even for read-only setups so that adding a write tool later doesn't leave attribution unset.

## MCP client registration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "juro-clm": {
      "command": "uv",
      "args": ["run", "juro-clm-mcp"],
      "cwd": "/absolute/path/to/mcp-server-juro-clm",
      "env": {
        "JURO_API_KEY": "...",
        "JURO_USER_EMAIL": "..."
      }
    }
  }
}
```

Restart Claude Desktop.

### Claude Code

Add to `.claude/settings.local.json` MCP block with the same shape.

## Pre-production sanity check

Juro doesn't always offer staging tenants. If yours doesn't:

1. Register with production credentials but limit to read tools first (the server makes this easy: don't enable write capability in your client until the read tools are validated).
2. Ask Claude to call each read tool with known inputs and verify responses match what you see in the Juro UI.
3. Only after read-tool validation, enable the write tool for `attach_note`.

If your Juro plan does offer staging:

1. Wire credentials to staging.
2. Validate every tool, including `attach_note`.
3. Switch credentials.

## Security model

- **Auth.** Bearer token in Authorization header; Juro's documented pattern.
- **Writes.** Only `attach_note` mutates state. Attributed to `JURO_USER_EMAIL`.
- **Rate limit.** Token-bucket at 30 req/min by default. Tighten if other systems share the API key.
- **Schema validation.** Every GraphQL response is parsed via Pydantic; schema drift fails-loud.
- **PII / commercial-confidential in MCP responses.** The server returns Juro's data, which includes contract terms and counterparty information. The calling Claude session is downstream; the legal-ops lead is responsible for the session's data-handling posture. Don't paste session transcripts into shared Slack channels.
- **Audit log.** Server logs every tool call to stderr at INFO level with PII-stripped arguments.

## Known limits — numbered TODO before production

1. **Not runtime-tested.** Every tool needs validation against the team's Juro tenant.
2. **GraphQL schema assumptions.** The query strings assume Juro's documented schema as of 2026-Q2; vendor schema changes break the queries.
3. **No pagination beyond `first: N` limit.** Large result sets need cursor-based pagination; not bundled.
4. **Single rate-limit bucket.** Multi-key deployments need per-key limiters.
5. **No request retry.** Transient errors propagate; the contracts engineer wraps if needed.
6. **No tests.** A pytest suite for the rate limiter and the GraphQL response shape is the obvious first addition.

## What this server intentionally does NOT do

- **No `delete_*` tools.** Deletes happen in the Juro UI with the audit trail that produces.
- **No contract-state mutations** (status change, party update, date change). These need explicit per-tool justification per the [CLM engineer cursor rule](/en/workflows/cursor-rules-clm-engineer/) — adding them would compromise read-mostly posture.
- **No bulk send / mass operations.** Outside scope of this server.
- **No PII normalization.** Server returns Juro's data as-is; downstream redaction is the legal-ops lead's responsibility.

## Adding a new tool

1. Add Pydantic input schema and async implementation in `server.py`.
2. Register in `TOOL_REGISTRY` with a clear description.
3. If write, document per-tool justification in the function docstring (see `attach_note`). Confirm `JURO_USER_EMAIL` attribution flows through.
4. Validate against staging or limited-scope production read.
5. Update this README's tool list.
