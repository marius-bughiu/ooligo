# leandata-routing-mcp

A read-only MCP server that puts LeanData's routing audit log in front of an agent, so it can answer *"why did this lead land on this rep?"* without anyone opening the LeanData UI.

LeanData writes one `LeanData__Log__c` row per record per trip through a deployed routing graph. This server queries that object through the Salesforce REST API and exposes five read tools. It writes nothing, anywhere.

**Scheduling is deliberately out of scope.** LeanData ships its own BookIt MCP server covering availability, meeting lookups, booking, cancel/reschedule, reassignment and credit requests. Use that for anything meeting-shaped — see § Use the official server instead, below.

> **Not runtime-tested against a live LeanData org.** The scaffold compiles and the Salesforce REST calls follow documented endpoints, but no maintainer has run it against a production managed-package install. Work the numbered list in § Known limits before production use.

## Use the official server instead, when

- **You want to book, cancel, reschedule or reassign a meeting.** That is BookIt MCP's job and it enforces BookIt permission sets while doing it. This server has no write path to add.
- **A human is asking one-off routing questions in the LeanData UI.** The Q2-2026 Audit Logs experience ships an embedded AI assistant that answers natural-language routing questions and cites node paths and evaluated conditions. It is included, it needs no code, and it is the right tool for interactive debugging.

Build this one when the routing question has to be answerable *by your own agent*, in the same conversation as the rest of your GTM stack, under a service identity rather than a signed-in person.

## Install

Requires Python 3.11+.

```bash
cd mcp-server-leandata-routing
pip install -e .
```

## Salesforce setup

The server authenticates with the OAuth **client-credentials** flow. Username-password is disabled by default on new Salesforce orgs and ties an integration to one human's password lifecycle; client credentials gives the server its own identity.

1. **Setup → App Manager → New Connected App.** Enable OAuth settings, callback URL can be any placeholder — the flow never redirects.
2. Select scopes `api` and `refresh_token`.
3. Under **Flow Enablement**, tick *Enable Client Credentials Flow*.
4. Set a **Run As** user. **This is where least-privilege is configured, not in this code.** The server can read exactly what that user can read.
5. Give the Run As user read-only access to `LeanData__Log__c` — object read, plus field-level read on the fields you want the agent to see. Withhold field-level read on anything you do not want in an LLM transcript; the server projects whatever `describe` returns, so hiding a field in Salesforce hides it from the agent.
6. Copy the consumer key and secret from **Manage Consumer Details**.

## Environment variables

| Variable | Default | Where the value comes from |
|---|---|---|
| `SF_CLIENT_ID` | *(required)* | Connected App → Manage Consumer Details → Consumer Key |
| `SF_CLIENT_SECRET` | *(required)* | Connected App → Manage Consumer Details → Consumer Secret |
| `SF_LOGIN_URL` | `https://login.salesforce.com` | `https://test.salesforce.com` for a sandbox; your My Domain URL if the org enforces one |
| `SF_API_VERSION` | `v61.0` | Setup → Apex Classes → any class → API Version, or the highest your org supports |
| `LD_LOG_OBJECT` | `LeanData__Log__c` | Only change this if your managed-package version names it differently |
| `LD_QUEUE_OBJECT` | `LeanData__CC_Inserted_Object__c` | LeanData's processing-queue object; used only for the backlog reading in `get_routing_throughput` |
| `LD_MAX_ROWS` | `200` | Hard ceiling on rows any single tool may return. Lower it if transcripts get long |
| `LD_HTTP_TIMEOUT` | `30` | Seconds per Salesforce request |

## Register with Claude

Claude Code:

```bash
claude mcp add leandata-routing \
  --env SF_CLIENT_ID=... \
  --env SF_CLIENT_SECRET=... \
  --env SF_LOGIN_URL=https://yourdomain.my.salesforce.com \
  -- python -m leandata_routing_mcp.server
```

Claude Desktop — add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "leandata-routing": {
      "command": "python",
      "args": ["-m", "leandata_routing_mcp.server"],
      "env": {
        "SF_CLIENT_ID": "3MVG9...",
        "SF_CLIENT_SECRET": "ABCD...",
        "SF_LOGIN_URL": "https://yourdomain.my.salesforce.com"
      }
    }
  }
}
```

## Sanity check

Ask Claude:

> Run `describe_routing_log` and tell me which fields this org uses for the routing graph and for errors.

A healthy response names real field API names per role. Two failure shapes worth recognising immediately:

- *"SF_CLIENT_ID and SF_CLIENT_SECRET must be set"* — the env block did not reach the process. Check the client config, not Salesforce.
- *`describe` returns few fields, most roles `(none matched)`* — the Run As user has object read but little field-level read. Fix in Salesforce profile/permission set.

Then, with a Lead ID that you know routed:

> Use `get_routing_history` on 00Q5e00000ABCDEF and explain how it reached its current owner.

## Tools

All five are reads. None writes.

| Tool | What it does |
|---|---|
| `describe_routing_log` | Field inventory for this org, grouped by role (graph, outcome, owner, matched, error, path). Run first |
| `get_routing_history` | Routing trips for one record ID, newest first |
| `explain_assignment` | Every populated field on one log row — the full picture for a single trip |
| `find_routing_errors` | Rows in a date window whose error fields are populated |
| `get_routing_throughput` | Row counts grouped by graph, plus current processing-queue depth |

**Field API names are resolved at runtime, never hardcoded.** LeanData ships a managed package and customers stamp their own fields onto the Log object, so the inventory differs per org. Every tool calls `describe` and matches field names and labels against the role hints in `_ROLE_HINTS` (`server.py`), caching the result for the process lifetime.

## Security model

- **Read-only by construction.** The dispatch table in `server.py` contains no write path — no DML, no PATCH, no POST to any sObject endpoint. Adding one would mean adding a tool, not flipping a flag.
- **Scope lives in Salesforce.** The Run As user's profile is the access boundary. This code cannot read anything that user cannot.
- **Routing logs carry PII.** Log rows reference Leads and Contacts and, depending on the org's custom fields, may carry names, emails and territory attributes. Everything returned enters the conversation and lives in the transcript. Withhold field-level read on anything that must not.
- **Injection surface is closed.** Record IDs are matched against `^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$` and dates against an ISO-8601 pattern before either reaches a SOQL string. Values failing the check raise before the query is built.
- **Paging is deliberately not followed.** `SalesforceClient.query` returns the first page and ignores `nextRecordsUrl`. Every tool clamps its own row count to `LD_MAX_ROWS`. Silently paging a large result set into an agent's context is the failure this design refuses.

## Known limits — work these before production

1. **Not runtime-tested.** No maintainer has run this against a live managed-package install. Verify every tool against a sandbox with real routing history first.
2. **Role hints are heuristics.** `_ROLE_HINTS` matches substrings like `graph`, `outcome`, `error`. An org with unusual field naming will get `(none matched)` for a role and the affected tool degrades to a message instead of an answer. Run `describe_routing_log` on day one and extend the hints to your org's naming.
3. **`find_routing_errors` infers error fields by name.** A field named for something else that happens to contain `error` will be included; a genuine failure field named `LeanData__Disposition__c` will not. Confirm the inferred list — the tool prints which fields it checked.
4. **Retention silently bounds every answer.** Default log retention is 90 days, configurable in LeanData Admin → Settings → Reporting, and a daily job deletes past it. A question about a lead routed last quarter may return "no rows" when the truth is "the log aged out". The tool says so in its empty-result message; humans still misread it.
5. **The new Audit Logs experience is a different store.** LeanData v8.x moves audit logs to cloud infrastructure with 24-month storage and a 15-minute sync. This server reads the Salesforce object. Confirm which experience your org is on and whether `LeanData__Log__c` is still populated for you before trusting throughput counts.
6. **`LD_QUEUE_OBJECT` is version-sensitive.** The processing-queue object name varies across package versions. `get_routing_throughput` degrades to a message rather than failing if it is unreadable, but the backlog reading is the useful half of that tool.
7. **No API-call budget.** Every tool call spends Salesforce API requests against the org's daily allocation, shared with every other integration. Enterprise orgs get 100,000 + 1,000 per license. An agent in a loop is a noisy neighbour to the whole org — add a counter before running it unattended.
8. **`describe` is cached for the process lifetime.** An admin adding a field mid-session will not see it until restart.
