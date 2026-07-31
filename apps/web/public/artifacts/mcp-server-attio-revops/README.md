# mcp-server-attio-revops

A read-mostly MCP server over the [Attio](https://attio.com) REST API. Gives Claude four read tools — object discovery, record query, single-record fetch, list-entry query — and exactly one gated write, `update_record_attribute`, which is off by default and allowlisted per attribute. Built so a RevOps team can ask "which companies in the Q3 pipeline list have no owner set?" in chat without granting an agent the run of the CRM.

> **STATUS: scaffold — not runtime-tested.** The code follows the official `mcp` Python SDK conventions and the endpoint paths, scopes, and parameters track the public Attio API docs (docs.attio.com) as of July 2026, but it has not been executed against a live Attio workspace. Attribute slugs are workspace-specific and object configuration varies; verify against your own workspace before relying on it.

## Read this first: Attio ships an official hosted MCP server

Attio hosts its own MCP server at `https://mcp.attio.com/mcp`. It authenticates over OAuth (no key to store or rotate), exposes 30+ tools across nine areas — records, lists, comments, notes, tasks, meetings, emails, workspace, reporting — plus an SQL tool, auto-approves reads, and prompts for confirmation on writes. It is the right default for most teams, and it is less work than this.

Run this scaffold instead when one of the following is true:

- **You need a service-account identity, not a user identity.** The hosted server grants the signed-in user's own permissions. If a shared agent should see less than any individual human does, a workspace API key with a chosen scope set is the only way to express that.
- **You need to narrow the tool surface.** 30+ tools including SQL and semantic email search is a wide grant for an agent that only answers pipeline questions. Here you get five, and `ATTIO_ALLOWED_OBJECTS` bounds even the reads.
- **You need writes allowlisted per attribute.** Confirmation prompts depend on a human reading them. `ATTIO_WRITABLE_ATTRIBUTES` does not.
- **You need your own audit log.** A local process logs to your infrastructure.

If none of those apply, use the hosted server.

## What it exposes

### Reads

- `list_objects()` — `GET /v2/objects`. Returns each object's `api_slug`, nouns, and whether it is inside your allowlist. Call this before guessing a slug; Attio object and attribute slugs are per-workspace.
- `query_records(object, filter?, sorts?, limit=25, offset=0, attributes?)` — `POST /v2/objects/{object}/records/query`. The object must be in `ATTIO_ALLOWED_OBJECTS`. `limit` is clamped to 100 (Attio's own default is 500). Pass `attributes` to keep only the columns you care about.
- `get_record(object, record_id)` — `GET /v2/objects/{object}/records/{record_id}`. Returns the slimmed attribute map plus `web_url` so a human can open the record.
- `query_list_entries(list, filter?, sorts?, limit=25, offset=0)` — `POST /v2/lists/{list}/entries/query`. Lists are Attio's pipeline surface; use this rather than querying the parent object for stage questions.

### Write (gated)

- `update_record_attribute(object, record_id, attribute, value, justification)` — `PATCH /v2/objects/{object}/records/{record_id}`. Requires `ATTIO_ALLOW_WRITES=true`, a `{object}.{attribute}` entry in `ATTIO_WRITABLE_ATTRIBUTES`, and a justification of at least 10 characters. One attribute, one record, per call.

There is no delete tool, no bulk update, no SQL tool, and no `PUT` path. `PUT` is what overwrites and removes multiselect values; only `PATCH` is wired, and `PATCH` prepends. This server cannot erase an existing multiselect value.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-attio-revops
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Create an Attio API key

In Attio: **Workspace settings → Developers → create an integration**, then generate an access token for it. Scopes are chosen at creation and cannot be edited afterwards — to change them, create a new integration.

Grant the minimum for the tools you want:

| Tool | Scopes |
|---|---|
| `list_objects` | `object_configuration:read` |
| `query_records`, `get_record` | `record_permission:read`, `object_configuration:read` |
| `query_list_entries` | `list_entry:read`, `list_configuration:read` |
| `update_record_attribute` | `record_permission:read-write`, `object_configuration:read` |

If writes stay off — the default — do not grant `record_permission:read-write`. A read-only token means the write tool cannot fire even if someone flips `ATTIO_ALLOW_WRITES` by accident.

### 3. Configure environment

#### `ATTIO_API_KEY` (required)

The access token from step 2. Sent as `Authorization: Bearer <token>`. Store it in your OS keychain or secret manager, not in a dotfile that syncs.

#### `ATTIO_BASE_URL` (optional)

Defaults to `https://api.attio.com/v2`. Override only to point at a proxy.

#### `ATTIO_ALLOWED_OBJECTS` (recommended)

Comma-separated object `api_slug` values the agent may read. Defaults to `companies,people,deals`. Run `list_objects` first to see what your workspace actually has — custom objects holding contract terms, compensation, or investor notes are common in Attio, and they should not be in this list. An empty value disables the check; do not ship that.

#### `ATTIO_ALLOW_WRITES` (default `false`)

Master switch for `update_record_attribute`. Attio has no undo API. Leave it off unless you have decided, deliberately, that chat-driven CRM writes are acceptable.

#### `ATTIO_WRITABLE_ATTRIBUTES` (required if writes are on)

Comma-separated `object_slug.attribute_slug` pairs, e.g. `companies.lifecycle_stage,deals.owner`. Anything not listed is refused. Empty means no write is permitted regardless of `ATTIO_ALLOW_WRITES`.

### 4. Register with Claude

Claude Desktop — edit `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`; Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "attio-revops": {
      "command": "/absolute/path/to/mcp-server-attio-revops/.venv/bin/python",
      "args": ["-m", "attio_revops_mcp.server"],
      "env": {
        "ATTIO_API_KEY": "your-token-here",
        "ATTIO_ALLOWED_OBJECTS": "companies,people,deals",
        "ATTIO_ALLOW_WRITES": "false"
      }
    }
  }
}
```

Claude Code — from the repo root:

```bash
claude mcp add attio-revops -- /absolute/path/to/.venv/bin/python -m attio_revops_mcp.server
```

Then set the environment variables in the shell Claude Code inherits, or add them to the generated config.

### 5. Sanity check

Restart Claude, then ask, in order:

1. **"List the objects in my Attio workspace."** Exercises `list_objects` and confirms auth. A `403` here means the token lacks `object_configuration:read`.
2. **"Query 5 companies and show me their name and domain."** Exercises `query_records`, the object allowlist, and the slimming layer. If `values` comes back with attribute slugs you do not recognize, that is the workspace's real schema — note the slugs you care about.
3. **"Set the lifecycle stage on company X to Customer."** With writes off, this must refuse and name `ATTIO_ALLOW_WRITES`. If it succeeds, your config is not what you think it is.

## Security model

- **The token is a workspace credential, not a user credential.** Everything the agent reads is what the token's scopes allow, independent of who is chatting. Scope it down, and treat the key as production infrastructure.
- **Records reach the model as text.** Every field returned by `query_records` — names, emails, deal values, notes stored as attributes — enters the Claude conversation. `ATTIO_ALLOWED_OBJECTS` and the `attributes` parameter are the controls that keep that set small. If any object is off-limits for a third-party LLM, it must not be in the allowlist.
- **Writes are three-gated:** the env flag, the per-attribute allowlist, and the mandatory justification. The justification is for the audit trail, not the enforcement — the first two gates are what actually stop a write.
- **`PATCH` only, by construction.** Multiselect values can be added, never removed.
- **The credential never reaches the model.** It lives in the server process; Claude sees tool names and results.

## Known limits

None of the following are wired. Address them before any unattended or multi-user deployment:

1. **No retry or backoff on 429.** The error is surfaced with `Retry-After` and an explanation of Attio's score-based query limits, but nothing retries. Add exponential backoff if an agent will loop.
2. **No pagination loop.** `offset` is exposed; walking pages is left to the caller. This is deliberate — an automatic loop is how a "quick question" turns into ten thousand records of PII in the context window.
3. **No audit log.** Tool calls are not written anywhere. Wrap `call_tool` with structured logging to your own sink before this serves more than one person.
4. **`_simplify_value` probes rather than dispatches.** It checks common payload keys in order instead of switching on `attribute_type`. Rare attribute types fall through to a stripped object. Replace it with an explicit type map once you know which types your workspace uses.
5. **No tests.** `pytest` and `pytest-httpx` are in the dev extras and nothing uses them. Record fixtures from your workspace and pin the slimming behavior first.
6. **Single-record writes only.** Intentional, but it means a 40-record cleanup is 40 calls. Do bulk work with a script and Attio's own API, reviewed as a diff — not from chat.
