# mcp-server-apollo-revops

An MCP server tuned for revenue-operations teams using Apollo.io. Exposes prospect search against the Apollo people database (no credits), search over your team's saved Contacts, sequence listing, and per-sequence engagement stats — plus two gated writes (`create_contact`, `add_contacts_to_sequence`) and one credit-spending enrichment (`enrich_person`). Built so Claude can answer "which VPs of Sales at fintechs under 500 employees aren't in any sequence yet?" without handing the model a button that drains your credit balance or mass-enrolls a list.

> **STATUS: scaffold — not runtime-tested.** The code follows the official `mcp` Python SDK conventions and the endpoint paths/parameters track the public Apollo API docs (docs.apollo.io) as of June 2026, but it has not been executed against a live Apollo account. Endpoint behavior, field names, and plan-gated access vary; verify against your account before relying on it.

## What it exposes

### Prospecting and reads (no credits)
- `search_people(person_titles?, person_seniorities?, person_locations?, organization_domains?, q_keywords?, page=1, per_page=25)` — searches the Apollo database via `POST /mixed_people/api_search`. This endpoint is built for API use and **does not consume credits** and **does not reveal emails or phone numbers** — it returns match metadata for building a list. Reveal is a separate, credit-spending step (`enrich_person`).
- `search_contacts(q_keywords?, contact_stage_ids?, contact_label_ids?, sort_by_field?, page=1, per_page=25)` — searches your team's saved Contacts via `POST /contacts/search`. A *contact* is a person your team has explicitly added; this is distinct from raw database people.

### Sequence reads (require a master API key)
- `list_sequences(q_name?, page=1, per_page=25)` — `POST /emailer_campaigns/search`. Returns sequences in your team's account.
- `sequence_engagement(emailer_campaign_id, date_min?, date_max?, per_page=100)` — `GET /emailer_messages/search` filtered to one sequence, aggregating message counts by status (delivered, opened, clicked, replied, bounced). The summary covers the sampled page(s); page through for full totals.

### Credit-spending enrichment (gated)
- `enrich_person(..., justification)` — `POST /people/match`. **Consumes Apollo credits.** Disabled unless `APOLLO_ALLOW_CREDIT_SPEND=true`, and requires a `justification` of at least 10 characters. `reveal_phone_number` is forced to `False` in this scaffold because Apollo requires a configured `webhook_url` to return phone numbers asynchronously.

### Writes (gated)
- `create_contact(first_name, last_name, organization_name?, title?, email?, run_dedupe=true, justification)` — `POST /contacts`. Requires a `justification`. `run_dedupe` defaults to `true`; Apollo does **not** dedupe by default, so a re-run with the flag off fans out duplicates.
- `add_contacts_to_sequence(sequence_id, contact_ids, send_from_email_account_id?, justification)` — `POST /emailer_campaigns/{sequence_id}/add_contact_ids`. Requires a master key, a `justification`, and a send-from mailbox. Hard-capped at `APOLLO_MAX_SEQUENCE_BATCH` (default 25) contacts per call so an accidental enrollment stays small enough to undo by hand.

The server **does not** expose delete tools, bulk enrichment, or unbounded sequence enrollment. Every search caps at 100 records per page (Apollo's own ceiling is 100/page × 500 pages = 50,000 rows).

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-apollo-revops
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Generate an Apollo API key

In Apollo: **Settings → Integrations → API**. Create a key.

- **Master vs. non-master.** The sequence and outreach-email endpoints (`list_sequences`, `sequence_engagement`, `add_contacts_to_sequence`) require a **master** API key — a non-master key returns `403` on those. If you want the full tool set, make the key a master key. If you only need prospecting (`search_people`, `search_contacts`, `enrich_person`), a non-master key is enough.
- **Plan gating.** All Apollo plans get basic API access, but advanced API access is gated to the Organization plan ($119/user/month on annual billing, 3-seat minimum as of 2026-06). Confirm your plan exposes the endpoints you need before wiring this up — see [API Pricing](https://docs.apollo.io/docs/api-pricing).

### 3. Configure environment

```bash
export APOLLO_API_KEY="your-master-or-standard-key"
export APOLLO_BASE_URL="https://api.apollo.io/api/v1"   # optional, this is the default
export APOLLO_ALLOW_CREDIT_SPEND="false"                # set true to enable enrich_person
export APOLLO_MAX_SEQUENCE_BATCH="25"                   # cap on add_contacts_to_sequence
export APOLLO_DEFAULT_SEND_ACCOUNT_ID=""                # optional default sending mailbox
```

Env var notes:

- **`APOLLO_API_KEY`** — found in Settings → Integrations → API. Sent as the `x-api-key` header (Apollo does *not* use Bearer auth). Use a master key for the sequence tools.
- **`APOLLO_BASE_URL`** — only change this if Apollo moves the API host or you front it with a proxy.
- **`APOLLO_ALLOW_CREDIT_SPEND`** — the credit kill-switch. While `false`, `enrich_person` refuses to run. Flip to `true` only once you've decided enrichment-via-chat is allowed and have a credit budget.
- **`APOLLO_MAX_SEQUENCE_BATCH`** — the blast-radius cap on `add_contacts_to_sequence`. Keep it small (25 is a sane default); raise it deliberately, never to "just get the import done."
- **`APOLLO_DEFAULT_SEND_ACCOUNT_ID`** — the Apollo ID of the mailbox sequences send from. Find it via the linked-accounts settings. Lets callers omit `send_from_email_account_id` per call.

### 4. Register with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "apollo-revops": {
      "command": "python",
      "args": ["-m", "apollo_revops_mcp.server"],
      "env": {
        "APOLLO_API_KEY": "your-master-or-standard-key",
        "APOLLO_BASE_URL": "https://api.apollo.io/api/v1",
        "APOLLO_ALLOW_CREDIT_SPEND": "false",
        "APOLLO_MAX_SEQUENCE_BATCH": "25",
        "APOLLO_DEFAULT_SEND_ACCOUNT_ID": ""
      }
    }
  }
}
```

Restart Claude Desktop. You should see 7 tools registered under `apollo-revops`.

### 5. Sanity-check

Ask Claude: "Search Apollo for VPs of Sales at companies using HubSpot, limit 10." Confirm you get names and titles back with no credit consumption (check the credit balance before and after — it should not move). Then ask "List my sequences" to confirm the master-key path works. Only after both succeed should you flip `APOLLO_ALLOW_CREDIT_SPEND=true` and test `enrich_person` on a single record.

## Security model

- **Token scope.** The `x-api-key` can do whatever your plan permits — including credit-spending enrichment and triggering sends. Treat it as a production secret. Prefer a dedicated API user / key over a personal one so you can rotate it without breaking a human's login.
- **Who sees what data.** Search results (names, titles, companies) flow into Claude's context. Enrichment results (emails, and — if you wire the webhook — phone numbers) are PII. If your compliance regime forbids pushing prospect PII into a third-party LLM, keep `APOLLO_ALLOW_CREDIT_SPEND=false` and use the server for list-building only, then reveal inside Apollo.
- **Spend and send are gated, not free-text.** Enrichment is behind an env flag; both writes require a 10-character justification; sequence enrollment is capped per call. There is no delete tool. Every irreversible or billable action has its own named tool, never a generic "do X" command.

## Limits and TODOs (before production use)

- [ ] Add request-level retries with exponential backoff and jitter on `429` (Apollo enforces per-minute, per-hour, and per-day limits that vary by plan; read them via the View API Usage Stats endpoint).
- [ ] Implement the `reveal_phone_number` path with a real `webhook_url` receiver (Apollo returns phone numbers asynchronously to a webhook, not inline).
- [ ] Page through `sequence_engagement` to produce true totals instead of a sampled-page summary.
- [ ] Write integration tests against a sandbox/throwaway Apollo seat (mock `httpx` with `pytest-httpx`).
- [ ] Add structured logging: one JSON line per tool call with name, arguments hash, duration, status, and (for `enrich_person`) credits estimated to be spent.
- [ ] Validate `APOLLO_DEFAULT_SEND_ACCOUNT_ID` against the account's linked mailboxes on first run; fail loud if it doesn't exist.
- [ ] Add a `--dry-run` flag that returns the request body/params without executing, for the two writes and enrichment.
- [ ] Surface remaining credit balance as a tool so Claude can warn before a large enrichment batch.
