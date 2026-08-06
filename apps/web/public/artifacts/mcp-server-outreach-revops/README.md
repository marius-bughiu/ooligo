# outreach-revops-mcp

A read-only MCP server over the [Outreach REST API v2](https://developers.outreach.io/api/). It gives Claude five tools — sequence listing, sequence performance, stalled sequence states, prospect search, and single-prospect engagement — and no way to write anything.

**Read this first: Outreach ships its own MCP server.** It runs at `https://api.outreach.io/mcp/`, authenticates the signed-in user over OAuth 2.1, and exposes read, create, and delete tools across workflow, prospecting, account, deal, user, and calendar categories. It requires the Amplify add-on on the seat and an admin toggle in Organization settings. If that fits, install it and stop reading — this scaffold is wasted work.

Build this instead when one of these is true:

- **The agent should not be able to delete a prospect.** The hosted server exposes prospect create and delete. This one has no `POST`, `PATCH`, or `DELETE` in its dispatch table, so a prompt-injected instruction to "clean up these duplicates" has nothing to call.
- **You need a service-account identity.** The hosted server runs as the signed-in human with that human's permissions. A shared agent — one wired into Slack, a reporting job, something the whole team triggers — cannot be expressed that way.
- **Not every seat has Amplify.** The hosted server is gated on the add-on per user. A standard API OAuth application is not.
- **You want aggregate reads.** `get_sequence_performance` answers "how is this sequence doing" in one request against Outreach's own pre-aggregated counters instead of paging sequence states.

**Status: scaffold, not runtime-tested.** Endpoint paths, attribute names, filterable-attribute sets, and query syntax were transcribed from the machine-readable OpenAPI definition at `https://api.outreach.io/api/v2/schema/openapi.json` and the developer portal as of 2026-08. Custom fields are per-org and are not in that definition. Verify against your own org before relying on it.

## Install

```bash
cd mcp-server-outreach-revops
pip install -e .
```

Requires Python 3.11+.

## Environment variables

### `OUTREACH_CLIENT_ID` / `OUTREACH_CLIENT_SECRET` (required)

Register an application at [developers.outreach.io](https://developers.outreach.io/) under your Outreach org. The identifier and secret appear on the application page after creation. Request exactly these scopes — the server needs no others and asking for more widens the blast radius of a leaked token:

```
prospects.read
sequences.read
sequenceStates.read
mailings.read
```

Outreach scopes are `<pluralized-resource>.<read|write|delete|all>`. Do not request `.all` on anything.

### `OUTREACH_REDIRECT_URI` (required)

The exact redirect URI registered on the application. It is sent again on every refresh, and a mismatch fails the refresh with a 400 that reads like a credential problem.

### `OUTREACH_TOKEN_FILE` (default `~/.outreach-mcp-token.json`)

Where the rotating refresh token lives. Complete the authorization code flow once by hand, then write the result:

```bash
echo '{"refresh_token":"PASTE_REFRESH_TOKEN_HERE"}' > ~/.outreach-mcp-token.json
chmod 600 ~/.outreach-mcp-token.json
```

**This file is the grant.** Outreach issues a new refresh token with every access token and retires the old one. The server writes the new value before using the new access token, and refuses to start if the file is not writable — a read-only token file produces a server that works for two hours and then 401s on everything.

### `OUTREACH_ALLOWED_SEQUENCE_IDS` (optional, comma-separated)

Numeric sequence ids the agent may read. Empty means no restriction. Set it when sequence names carry customer or campaign names that should not reach an LLM, or when a shared agent should only see its own team's sequences.

### `OUTREACH_RATE_LIMIT_FLOOR` (default `250`)

The server stops answering when fewer than this many of the org's 10,000 hourly API calls remain. That budget is shared with your CRM sync and every other integration on the org, so an agent loop that drains it breaks more than chat.

### `OUTREACH_BASE_URL` / `OUTREACH_TOKEN_URL` (optional)

Default to `https://api.outreach.io/api/v2` and `https://api.outreach.io/oauth/token`.

## Register with Claude

Claude Desktop — `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "outreach-revops": {
      "command": "python",
      "args": ["-m", "outreach_revops_mcp.server"],
      "env": {
        "OUTREACH_CLIENT_ID": "...",
        "OUTREACH_CLIENT_SECRET": "...",
        "OUTREACH_REDIRECT_URI": "https://example.com/oauth/callback",
        "OUTREACH_TOKEN_FILE": "/Users/you/.outreach-mcp-token.json",
        "OUTREACH_RATE_LIMIT_FLOOR": "500"
      }
    }
  }
}
```

Claude Code:

```bash
claude mcp add outreach-revops -- python -m outreach_revops_mcp.server
```

## Sanity check

Ask, in order:

1. **"List my 5 most recently used Outreach sequences."** — exercises `list_sequences`, the token refresh, and the sparse fieldset. If this 401s, the refresh token is stale or the redirect URI does not match.
2. **"How is sequence 1234 performing?"** — exercises `get_sequence_performance`. The `derived` block should show `prospect_reply_rate_pct` computed from `numRepliedProspects / numContactedProspects`, with the raw counters under `_basis` so you can check the arithmetic against the Outreach UI.
3. **"Find prospects at companies called Acme."** — should fail. `company` is not a filterable prospect attribute, and the server refuses rather than returning an unfiltered list. The error names the filterable set. This is the check that the preflight is working; if it returns rows, `_check_filters` is not being reached.
4. **"What is paused in sequence 1234?"** — exercises `find_stalled_sequence_states` and confirms included prospects come back projected to five fields rather than 230.

## Security model

The OAuth application's token carries four read scopes and nothing else. Anything the tools return enters the conversation: prospect names, work emails, job titles, engagement history, sequence names. `OUTREACH_ALLOWED_SEQUENCE_IDS` narrows that; it does not eliminate it. If prospect data cannot reach an LLM at all under your policy, do not run this or the hosted server.

The token file is the sensitive artifact — it holds a credential that regenerates access indefinitely until it expires or an admin revokes the application. Keep it at mode 600, outside any directory the agent can read as a file, and outside version control.

Revocation is per-application in Outreach admin settings, which kills every token issued to it at once.

## Known limits — do these before production

1. **No test suite.** `pyproject.toml` declares `pytest` and `pytest-httpx` under `dev` but ships no tests. Write them against recorded fixtures before anyone trusts a number out of `_rates()`.
2. **No pagination.** Every tool caps at `page[limit]=100` and returns the first page. A question whose honest answer needs 400 rows silently gets 100. Add cursor following, or have the tools report when a result is truncated.
3. **`FILTERABLE` is a transcription and will drift.** It was copied from the OpenAPI definition's filterable badges. When Outreach adds a filterable attribute, this server keeps rejecting it. Regenerate the sets from `https://api.outreach.io/api/v2/schema/openapi.json` on a schedule rather than by hand.
4. **Custom fields are invisible.** `custom1`–`custom150` on prospects and opportunities are excluded from the projections deliberately. If your org keeps something load-bearing in `custom17`, add it to `PROSPECT_FIELDS` and know what it holds first — these fields are where orgs put comp bands, contract terms, and notes nobody meant to publish.
5. **No audit log.** Tool calls go nowhere. Add structured logging of `(timestamp, tool, arguments, row count)` if you need to answer "what did the agent look at" later.
6. **Rate-limit accounting is per-response, not global.** The floor check reads `X-RateLimit-Remaining` off each response, so a burst of concurrent calls can overshoot before any of them sees a low number.
7. **`_rates()` divides by Outreach's counters, not yours.** `numContactedProspects` counts prospects the sequence contacted, which is not the same denominator your reporting layer may use. Reconcile once against a sequence you know before quoting the output to a leadership audience.

## Files

```
mcp-server-outreach-revops/
├── README.md
├── pyproject.toml
└── src/outreach_revops_mcp/
    ├── __init__.py
    └── server.py
```

`server.py` holds the configuration block, the `TokenStore` refresh-rotation logic, the `FILTERABLE` sets and `_check_filters` preflight, the sparse-fieldset constants, the five tool definitions, and their handlers.
