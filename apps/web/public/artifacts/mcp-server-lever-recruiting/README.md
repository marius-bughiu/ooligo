# Lever recruiting MCP server

A read-mostly MCP server exposing the Lever Data API v1 as tools to Claude Desktop, Claude Code, or any MCP-compatible client. Six read tools cover daily recruiter questions; one cautious write tool (`note_stage_stuck`) adds an internal note.

**This is a scaffold, not a runtime-tested production server.** The tool implementations are written against the Lever Data API's documented shape, but the recruiting engineer is responsible for verifying each tool against a Lever Sandbox tenant before flipping production credentials. The disclaimer is repeated in `server.py`'s module docstring.

## Lever data model (read this before wiring)

Lever's model differs from Greenhouse/Ashby in ways that matter for every tool:

- The candidate-in-pipeline object is an **Opportunity**, not an application. An Opportunity ties a **Contact** (the person) to one or more **Postings** (the jobs) and carries a single current `stage`.
- A **Posting** is the job. Postings have a `state` (`published`, `internal`, `closed`, `draft`, `pending`, `rejected`). This server treats `published` as "open."
- **Stages** are pipeline stages. An Opportunity's `stage` field is a stage **ID**, not a name — run `list_stages` first to resolve IDs to display text. `get_funnel_for_posting` does this resolution for you.
- Timestamps are **integer milliseconds since the Unix epoch**, not ISO-8601 strings. `lastInteractionAt` (any activity) and `lastAdvancedAt` (last stage advance) are the two staleness signals.
- Lever exposes the *current* stage and `lastAdvancedAt`, but has **no public stage-transition-history endpoint**. `get_opportunity_detail` returns current state + notes, not a full transition log.

## Install

```bash
cd apps/web/public/artifacts/mcp-server-lever-recruiting/
pip install -e .
# or
uv pip install -e .
```

The package exposes a `lever-recruiting-mcp` CLI entrypoint.

## Environment variables

### `LEVER_API_KEY` (required)

The Data API key from Lever → Settings → Integrations and API → API credentials. Generate a key scoped to the **minimum** resources needed:

- **Read** on `opportunities`, `postings`, `stages`, `notes`, `archive_reasons`.
- **Write** on `notes` only (required for `note_stage_stuck`).

Lever API keys are all-or-nothing on the account they belong to; there is no per-endpoint scoping the way Greenhouse Harvest offers. Compensate by using a dedicated integration user with the narrowest Lever role that still exposes the postings you need, and by keeping the key out of shared config. Wider account access silently turns the server into a higher-blast-radius surface.

### `LEVER_PERFORM_AS_USER_ID` (required)

The Lever user ID that writes will be attributed to via the `perform_as` query parameter. Find it by calling `GET https://api.lever.co/v1/users` and matching on the integration user's email.

This is required even if you only use the read tools — the server validates it at startup so writes can't slip through unattributed later.

## MCP client registration

### Claude Desktop

Add to `claude_desktop_config.json` (location varies by OS — `~/Library/Application Support/Claude/` on macOS, `%APPDATA%\Claude\` on Windows):

```json
{
  "mcpServers": {
    "lever-recruiting": {
      "command": "uv",
      "args": ["run", "lever-recruiting-mcp"],
      "cwd": "/absolute/path/to/mcp-server-lever-recruiting",
      "env": {
        "LEVER_API_KEY": "...",
        "LEVER_PERFORM_AS_USER_ID": "..."
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
    "lever-recruiting": {
      "command": "uv",
      "args": ["run", "lever-recruiting-mcp"],
      "cwd": "/absolute/path/to/mcp-server-lever-recruiting",
      "env": {
        "LEVER_API_KEY": "...",
        "LEVER_PERFORM_AS_USER_ID": "..."
      }
    }
  }
}
```

### Other MCP clients (Cursor, Continue, etc.)

Most accept the same `command + args + env` shape. Refer to the client's MCP documentation.

## Sanity-check invocation

Before the first real use, run the server against a Lever **Sandbox** tenant. Lever provides a separate sandbox environment (`hire.sandbox.lever.co`) with its own API host and credentials — request one from your Lever CSM or through the developer portal.

```bash
LEVER_API_KEY=sandbox_key \
LEVER_PERFORM_AS_USER_ID=sandbox_user_id \
lever-recruiting-mcp --help
```

(The CLI is the MCP stdio server; `--help` is not implemented in this scaffold. The intent is to confirm the package installed and the entrypoint resolved.)

For per-tool validation, the recommended flow is:

1. Register the server with Claude Desktop pointed at sandbox credentials.
2. Ask Claude to call each tool with known sandbox inputs and verify the responses match what you see in the sandbox Lever UI.
3. Only after every tool is verified, swap to production credentials.

## Security model

- **Auth.** Lever API key as Basic-auth username, empty password. Lever's documented pattern.
- **Writes.** Only `note_stage_stuck` mutates state. Attributed via the `perform_as` query parameter so the Lever activity feed shows the integration user, not just the API key.
- **Rate limit.** Token-bucket at 8 req/s by default (Lever steady-state ceiling is 10 req/s per API key, burst to 20). Lever separately caps application POSTs at 2 req/s — the single-call note tool stays well under. Lower the default if other systems share the key.
- **PII in MCP responses.** The server returns the data the API returns — including candidate names. The calling Claude session is downstream; the session's data-handling posture is the recruiter's responsibility. Don't paste session transcripts into shared Slack channels; don't log raw responses to your own audit table.
- **Audit log.** The server logs every tool call to stderr at INFO level with PII-stripped arguments. Recruiting engineer is responsible for capturing stderr into a durable audit log (e.g. via systemd journal, Docker log driver, or a wrapping script that tees to a file).

## Known limits — numbered TODO before production use

The scaffold is honest about what it doesn't do yet. Treat each as a numbered TODO to close before broad production use.

1. **Not runtime-tested.** Every tool needs validation against a Lever Sandbox tenant. The smoke check in this README is a credentials check, not a per-tool validation.
2. **Pagination max page count.** The async iterator caps at 50 pages per call (5,000 records at 100/page). For accounts with very large opportunity volumes, the cap needs raising or replacement with a streaming pattern.
3. **`list_postings_stalled` is O(postings × opportunities).** It walks every opportunity on every published posting to find the latest advance. On large accounts this is slow and quota-heavy — run it off-peak, or narrow by team first. A webhook-fed cache is the real fix.
4. **No stage-transition history.** Lever's Data API has no endpoint for a full stage-by-stage transition log. `get_opportunity_detail` returns current stage + `lastAdvancedAt` + notes only. Do not present its output as a complete audit trail of every stage move.
5. **No request retry beyond 429.** The 429 handler retries once after a 1-second backoff. Other 5xx errors propagate; the recruiting engineer wraps the calls if more retry resilience is needed.
6. **API-key blast radius.** Lever keys are account-scoped, not endpoint-scoped. The server cannot narrow what the key can reach; that has to be done at the Lever integration-user level. See the env-var note above.
7. **No tests.** A pytest suite for the rate limiter and the offset-pagination loop is the obvious first addition; full integration tests against a sandbox tenant are the second.

## What this server intentionally does NOT do

- **No `delete_*` tools.** Deletes happen in the Lever UI, with the audit trail that produces.
- **No opportunity-state mutations** (advance stage, archive, change owner, send email). Those are recruiter decisions and need explicit per-tool justification — adding them would compromise the read-mostly posture.
- **No bulk send / outbound email.** Outreach belongs in a sourcing tool with proper unsubscribe handling, not in an MCP read-tool surface.
- **No PII normalization** (no name-redaction in responses). The server returns what Lever returns; downstream redaction is the recruiter's responsibility.

## Adding a new tool

If you need a new tool:

1. Add a Pydantic input schema and an async implementation in `server.py`.
2. Register it in `TOOL_REGISTRY` with a clear description.
3. If it's a write tool, document the per-tool justification in the function's docstring (see `note_stage_stuck` for the template). Confirm the `perform_as` attribution flows through and stays under Lever's 2 req/s POST cap.
4. Validate against sandbox.
5. Update this README's tool list.

The scaffold's structure makes this a 30-60 minute change per tool. The discipline is in the per-tool justification step — it's the only thing that prevents the read-mostly posture from drifting.
