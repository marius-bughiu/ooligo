# mcp-server-hubspot-cs

An MCP server tuned for customer success teams using HubSpot. Exposes
contacts, companies, tickets, and deals as Claude tools, plus three
CS-specific helpers: `at_risk_renewals`, `aging_tickets`,
`accounts_needing_qbr`.

> **STATUS: scaffold — not runtime-tested.** The code below is structurally
> complete and follows the official `mcp` Python SDK conventions, but it
> has not been executed against a live HubSpot portal. Treat it as a
> starting point you adapt to your portal's field conventions, not as a
> deployable binary. Health-score field names, custom property paths, and
> association labels vary by portal.

## What it exposes

### Object-read tools (read-only)
- `get_contact(contact_id)` — full contact properties
- `get_company(company_id)` — full company properties + associated contacts
- `get_deal(deal_id)` — full deal properties + associated contacts/company
- `get_ticket(ticket_id)` — full ticket properties + associated company

### Search tools (read-only)
- `search_contacts(query, limit?)`
- `search_companies(query, limit?)`
- `search_deals(filters, limit?)`
- `search_tickets(filters, limit?)`

### CS-specific helpers (read-only)
- `at_risk_renewals(window_days=90)` — deals in renewal stages closing in
  the window, filtered by configured health-score threshold
- `aging_tickets(min_age_hours=48, limit=500)` — open tickets older than
  the threshold, grouped by company
- `accounts_needing_qbr(months_since_last=3)` — companies with no
  recorded QBR activity in the window

### Light-write tools (CSM-driven)
- `create_ticket(subject, body, company_id?)` — open a new ticket
- `add_note(object_type, object_id, body)` — append a note to a record

The server **does not** expose deal-stage changes, contact merges, or
company property updates. The principle: Claude can ask, summarize, and
document; the CSM drives every customer-facing change.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-hubspot-cs
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Create a HubSpot Private App token

In HubSpot: Settings → Integrations → Private Apps → Create. Grant these
scopes:

- `crm.objects.contacts.read`
- `crm.objects.companies.read`
- `crm.objects.deals.read`
- `tickets` (read)
- `crm.objects.contacts.write` (only for `add_note`)
- `tickets` (write — only for `create_ticket`)

Copy the access token.

### 3. Configure environment

```bash
export HUBSPOT_TOKEN="pat-na1-..."
export HUBSPOT_PORTAL_ID="12345678"
export HUBSPOT_HEALTH_SCORE_PROPERTY="health_score"   # your custom field
export HUBSPOT_RENEWAL_STAGE_IDS="appointmentscheduled,qualifiedtobuy"
export HUBSPOT_RENEWAL_HEALTH_THRESHOLD="60"          # below = at risk
```

The renewal stage IDs are pipeline-specific. Look them up in
HubSpot → Settings → Pipelines.

### 4. Register with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "hubspot-cs": {
      "command": "python",
      "args": ["-m", "hubspot_cs_mcp.server"],
      "env": {
        "HUBSPOT_TOKEN": "pat-na1-...",
        "HUBSPOT_PORTAL_ID": "12345678",
        "HUBSPOT_HEALTH_SCORE_PROPERTY": "health_score",
        "HUBSPOT_RENEWAL_STAGE_IDS": "appointmentscheduled,qualifiedtobuy",
        "HUBSPOT_RENEWAL_HEALTH_THRESHOLD": "60"
      }
    }
  }
}
```

Restart Claude Desktop. You should see ~12 tools registered under
`hubspot-cs`.

### 5. Sanity-check

Ask Claude: "Show me at-risk renewals in the next ninety days." Compare
the output against the equivalent query in HubSpot's UI. Tune the
`HUBSPOT_RENEWAL_HEALTH_THRESHOLD` and stage IDs until they match.

## Watch-outs

- **Private App tokens bypass user-level permissions.** Anyone with
  access to the MCP client sees every record the token can reach.
  Document this with your security team.
- **Health-score field drift.** Teams change the formula every quarter.
  Update `HUBSPOT_HEALTH_SCORE_PROPERTY` and the threshold when the
  formula changes.
- **Aging-ticket queries can return thousands of rows.** The helper
  paginates and caps at 500 by default. Tune for your portal volume.
- **Cross-object joins are slow.** A deal-to-tickets traversal across
  a thousand deals takes minutes — HubSpot's association API is the
  bottleneck.

## Limits and TODOs (before production use)

- [ ] Add request-level retries with exponential backoff (HubSpot
      returns 429 readily under sustained load).
- [ ] Write integration tests against a HubSpot sandbox portal.
- [ ] Add structured logging via `python-json-logger`.
- [ ] Wire optional Sentry / OpenTelemetry export.
- [ ] Validate every helper query against the actual portal's
      pipeline configuration on first run, fail loud if the configured
      stage IDs do not exist.
