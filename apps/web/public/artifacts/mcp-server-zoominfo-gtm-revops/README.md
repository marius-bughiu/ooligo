# mcp-server-zoominfo-gtm-revops

A read-only MCP server over the [ZoomInfo](https://www.zoominfo.com) GTM API with a credit governor in front of it. Five tools: two free searches, two budgeted enrichments, and a credit-status tool. Every credit-spending call is checked against a daily ceiling before it goes out, served from a local cache when the record is still inside the Records Under Management window, and written to an append-only audit log naming the run that spent the money.

> **STATUS: scaffold — not runtime-tested.** The code follows the official `mcp` Python SDK conventions. Endpoint paths, OAuth scopes, request shapes, rate-limit behaviour and the credit rules track the public ZoomInfo GTM API docs (docs.zoominfo.com) as of August 2026. The company enrich/search paths and the usage path are quoted directly from those docs; the contact paths follow the documented symmetry and should be confirmed against `https://docs.zoominfo.com/llms.txt` before you rely on them. It has not been executed against a live ZoomInfo tenant.

## Read this first: ZoomInfo ships an official hosted MCP server

ZoomInfo hosts its own MCP server at `https://mcp.zoominfo.com/mcp`. It authenticates over OAuth 2.0 in the browser, is included with every subscription at no extra cost, and exposes 19 tools — 16 data tools (company and contact search and enrich, intent, scoops, news, lookup, lookalikes, recommended contacts, audiences, GTM context) plus three agentic ones (Account Research, Contact Research, Update GTM Context). Admins enable it per user in the Admin Portal.

**For a person doing interactive research, that is the correct answer and this scaffold is wasted work.** Connect it and move on:

```bash
claude mcp add --transport http zoominfo https://mcp.zoominfo.com/mcp
```

Build this instead when one of the following is true.

**Your agent runs unattended or on a schedule.** This is ZoomInfo's own guidance, not a preference of ours: the hosted MCP server is documented as unsuitable for bulk exports, CRM write-back, and scheduled jobs, and scheduled pipelines are directed to the API instead. If your agent wakes up at 06:00 and enriches an account list without a human in the loop, the hosted server is the wrong instrument by the vendor's own description.

**You need a service identity, not a user identity.** The hosted server runs as the signed-in person, with that person's entitlements, enabled per user by an admin. A shared agent triggered from Slack or a job runner has no person to be. The client-credentials flow this scaffold uses gives it its own client id and its own scope set.

**You need a hard spend ceiling.** The hosted server has no per-run credit cap. Enrichment charges one bulk data credit per returned record, so an agent looping over an account list can spend real money before anyone notices — see the arithmetic below. `ZI_DAILY_CREDIT_LIMIT` is a number the agent cannot argue with.

**Your subscription runs on recurring monthly credits.** The hosted MCP server uses bulk data credits and does not work with recurring monthly credits. If that is your contract shape, the hosted server will not function for you at all and the API is the only route.

If none of those apply, use the hosted server.

## What a runaway costs

Enrichment charges one bulk data credit per record returned, up to 25 records per request, with no charge for no-match results or errors. Bulk credits are commonly quoted in the range of $0.60–$1.00 each at small volumes, falling toward roughly $0.20 at high volume — those are third-party resale figures, not a ZoomInfo rate card, and your contract governs.

An agent researching 200 accounts and pulling four contacts each is 800 new records. That is 32 enrich calls and 800 bulk data credits — on the order of $480–$800 for one unattended afternoon, using the third-party band above.

The 32 calls are nothing against the rate limits: even the smallest documented package, Builder, allows 5 requests/second, 10,800/hour and 129,600/day (Standard: 25/s, 54,000/hr, 648,000/day; Scaling: 35/s, 75,600/hr, 907,200/day). **The binding constraint on an enrichment agent is the credit pool, not throughput.** That is why this scaffold governs credits and merely reports rate limits.

## What it exposes

All five tools are reads. There is no write tool, no audience-mutation tool, and no GTM-config tool — the scopes in `ZI_SCOPES` do not request them.

- `zi_credit_status()` — free. Combines ZoomInfo's subscription counters (`GET /data/v1/users/usage`, returning `limitType` / `totalLimit` / `currentUsage` / `usageRemaining`) with this server's local ledger: spent today, ceiling, held by calls in flight, available, and per-tool spend over 7 days. The tool description tells the agent to call this before planning a batch. If ZoomInfo's usage endpoint fails, the tool degrades to the local ledger rather than erroring — the local ceiling is still enforced.
- `zi_search_companies(criteria, page_size=25, page_number=1, sort='-revenue')` — `POST /data/v1/companies/search`. Free: charges no credits and returned companies do not count against record limits, though each request counts against rate limits. Page size is clamped to 100.
- `zi_search_contacts(criteria, page_size=25, page_number=1)` — `POST /data/v1/contacts/search`. Free, same terms.
- `zi_enrich_companies(company_ids, output_fields?)` — `POST /data/v1/companies/enrich`. Costs credits. At most 25 ids.
- `zi_enrich_contacts(contact_ids, output_fields?)` — `POST /data/v1/contacts/enrich`. Costs credits. At most 25 ids. This is the tool that returns verified business email and direct dial, so it is both the expensive one and the one carrying personal data.

Search results are deliberately slimmed to ids plus a thin label. Search is free and enrichment is not, so the job of a search result here is to let the agent pick which ids are worth paying for — returning full search payloads invites the model to treat unverified search fields as enriched data.

## How the credit governor works

The cost of an enrich call is not knowable before the response is parsed: no-match records and records already under management are not charged. So the budget is enforced in two steps, in `src/zoominfo_gtm_mcp/budget.py`.

1. **Reserve the worst case.** Before the request, hold one credit per record not already in the cache — every input matching, every match new. If that worst case exceeds the remaining ceiling, the call is refused. Refusal is all-or-nothing: a partial reservation would let an agent enrich the first 8 of 25 accounts and report success, which reads as a complete answer and is not one.
2. **Settle against reality.** After the response, count records ZoomInfo returned as a match, write that to the durable ledger, and release the difference.

The refusal comes back as a **result**, not an exception — a JSON object with `refused: true`, the remaining allowance, and a next step. A model can read that and re-plan against what is left; a protocol error usually just ends the turn.

The cache is SQLite, keyed on ZoomInfo's own record id, TTL 365 days to match the 12-month Records Under Management window during which re-enrichment is free. A hit costs no credit *and* no HTTP request, which is what matters when an agent re-asks the same question four times in one session.

Reservations are in-process; the ledger is on disk. If the process dies between reserve and settle, the reservation dies with it and the ledger never records that spend — the next run's ceiling is then slightly generous rather than slightly strict. That is the safer direction to be wrong for a guard that could otherwise deadlock an agent against a phantom hold.

## Setup

### 1. Install

```bash
cd mcp-server-zoominfo-gtm-revops
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Create an API application in ZoomInfo

You need a ZoomInfo subscription with API access and bulk data credits enabled. In the ZoomInfo admin portal, create an API application and configure it for the **client credentials** grant, then copy its client id and secret. Scopes are configured on the application, not requested freely at token time — a token request for a scope the application does not hold is rejected.

Grant the application exactly two scopes for this server:

- `api:data:company` — search and enrich company data
- `api:data:contact` — search and enrich contact data

Do not add `api:gtm-config:manage`, `api:audience:manage`, or `api:gtm-data-model:manage`. Nothing here uses them, and a scope an agent holds is a scope an agent can be talked into using.

### 3. Environment variables

| Variable | Required | Default | Where the value comes from |
|---|---|---|---|
| `ZI_CLIENT_ID` | yes | — | The API application you created in step 2. |
| `ZI_CLIENT_SECRET` | yes | — | Same application. Shown once at creation; store it in your secret manager, not in the MCP config file. |
| `ZI_DAILY_CREDIT_LIMIT` | no | `250` | Your call. Set it to the number of new records you are willing to buy in one day. 250 credits is roughly $150–$250 at the third-party band above. |
| `ZI_STATE_PATH` | no | `./zi_state.db` | Path to the SQLite ledger + cache. Put it somewhere durable — deleting it resets today's spend counter to zero and empties the cache. |
| `ZI_AUDIT_LOG` | no | unset | Path to an append-only JSONL audit file. Unset means no audit trail is written, which is fine for a laptop and not fine for a shared agent. |
| `ZI_SCOPES` | no | `api:data:company api:data:contact` | Space-delimited. Must be a subset of what the application holds. |
| `ZI_RUN_ID` | no | random | Stamped on every ledger and audit row. Set it to your job's run id so spend attributes to the run that caused it. |
| `ZI_BASE_URL` | no | `https://api.zoominfo.com/gtm` | Override only if ZoomInfo gives you a different host. |

### 4. Register with Claude

Claude Code:

```bash
claude mcp add zoominfo-gtm -- python -m zoominfo_gtm_mcp.server
```

Claude Desktop — add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "zoominfo-gtm": {
      "command": "/absolute/path/to/.venv/bin/python",
      "args": ["-m", "zoominfo_gtm_mcp.server"],
      "env": {
        "ZI_CLIENT_ID": "your-client-id",
        "ZI_CLIENT_SECRET": "your-client-secret",
        "ZI_DAILY_CREDIT_LIMIT": "250",
        "ZI_STATE_PATH": "/absolute/path/to/zi_state.db",
        "ZI_AUDIT_LOG": "/absolute/path/to/zi_audit.jsonl"
      }
    }
  }
}
```

### 5. Sanity check

Run these three in order. They prove auth, the free path, and the governor without spending much.

1. **"What is my ZoomInfo credit status?"** — calls `zi_credit_status`. Proves the client credentials work and the ledger initialised. Costs nothing. If the subscription-usage block reports an error but the local ledger renders, your token works and the usage scope or endpoint does not — the server is still safe to run.
2. **"Find software companies in California with revenue over $50M."** — calls `zi_search_companies`. Costs nothing. Returns ids.
3. **"Enrich the first two of those."** — calls `zi_enrich_companies` with 2 ids. Should charge at most 2 credits. Run it a second time with the same ids: `credits_charged` must be `0` and `cache_hits` must be `2`. That is the cache doing its job. Then set `ZI_DAILY_CREDIT_LIMIT=1`, restart, and ask for three new ids — you should get the structured `refused: true` object rather than an enrichment.

## Security model

**The token is a service identity with two read scopes.** It cannot write to ZoomInfo, cannot modify audiences or GTM config, and cannot reach intent, news, or scoops without scopes this server does not request.

**Enriched contact data enters the conversation.** `zi_enrich_contacts` returns verified business email and direct dial. Every field it returns is visible to the model and lives in the transcript. Narrow `output_fields` to what the task actually needs — the field set does not change the credit cost, but it does change what personal data is exposed and how many tokens the answer burns. If contact PII cannot reach an LLM at all, no MCP server over a contact database is the right project.

**ZoomInfo's own connection guidance requires model training to be turned off** in your AI account or client settings before connecting. That applies here too.

**The audit log is the accountability record.** Each line carries timestamp, run id, tool, records requested, cache hits, credits charged, no-match count, and the running daily total. That is what a finance chargeback conversation needs and what the hosted server does not give you locally.

**The state file is security-relevant.** `zi_state.db` holds cached enrichment payloads — real contact records — in plaintext SQLite. Put it on an encrypted volume and treat deleting it as both a cache flush and a spend-counter reset.

## Known limits — work through these before production

1. **Not runtime-tested.** Verify every path against `https://docs.zoominfo.com/llms.txt` before trusting it, starting with the two contact paths, which are inferred from the documented company symmetry rather than quoted.
2. **`credits_charged` is an upper bound, not an invoice.** It counts matched records returned. Records already under management are returned without a new charge, so the true bill can be lower — never higher. Reconcile against ZoomInfo's own usage reporting before using these numbers for chargeback.
3. **The daily ceiling rolls at UTC midnight**, not local midnight. Change `_today()` in `budget.py` if your finance day differs.
4. **No cross-process reservation.** Two servers sharing one `ZI_STATE_PATH` see each other's *settled* spend but not each other's in-flight holds, so concurrent runs can jointly overshoot the ceiling by up to 25 records each. Give each agent its own state file, or move reservations into the database, before running several at once.
5. **No retry or backoff.** A 429 raises with the rejected bucket and `Retry-After` in the message and the reservation is released, but nothing retries. Add backoff — 1–5s exponential for a per-second rejection, the full `Retry-After` for hour or day rejections, which can exceed 700 seconds.
6. **Search criteria are passed through unvalidated.** The tool schemas take a free-form `criteria` object, so a malformed filter surfaces as a ZoomInfo 4xx rather than a local error. Pin the fields your team actually uses into the schema once you know them.
7. **The cache never invalidates on change.** A 364-day-old cached record is served as current. If a use case needs freshness inside the RUM window, add a `max_age_days` argument that bypasses the cache and knowingly spends a credit.
