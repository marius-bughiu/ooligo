# Headcount plan reconciliation — n8n flow

This flow reconciles the firm's headcount plan against open reqs in the ATS and actual hires in HRIS, every Monday at 8am, and posts a per-team and aggregate variance report to Slack. It catches the failure modes that quietly cost a quarter — reqs opened against teams already at plan, hires booked against the wrong team, contractor conversions counted as new hires.

## Import

1. n8n → Workflows → Import from file → pick `headcount-plan-reconciliation-n8n.json`.
2. Set the workflow timezone (top of the canvas) to your office timezone. The default is `America/New_York`.
3. Do NOT enable yet. Set up credentials, the team mapping, and run the dry-run first.

## Credentials (four required)

### `PLACEHOLDER_PLAN_DB_CRED_ID` — Plan source

The flow's default is Postgres. The query in `Fetch Plan` reads from a `headcount_plan` table with columns `team`, `level`, `count`, `target_start_date`, `req_status`, `last_updated_at`.

If your plan lives elsewhere:

- **Google Sheets** — replace the `Fetch Plan` node with a Google Sheets node reading the plan tab. Field mapping happens in the next node.
- **Snowflake / BigQuery** — replace with the equivalent connector; same query shape works.
- **Carta / Pave / Lattice headcount module** — use their export-to-CSV path or API.

The schema is what matters; the source is interchangeable.

### `PLACEHOLDER_ASHBY_CRED_ID` — Ashby API key

- Ashby admin → Settings → API → Create key (read scope only).
- HTTP Basic Auth: username = the API key, password = empty.

### `PLACEHOLDER_HRIS_CRED_ID` — HRIS API token

The flow's default uses HTTP Header Auth. Per-HRIS specifics:

- **BambooHR** — API key as basic-auth username, password = `x`.
- **Workday** — OAuth 2.0; the n8n Workday connector handles the token refresh.
- **Rippling** — Bearer token in the `Authorization` header.
- **HiBob / Personio / Justworks / Gusto** — each has its own auth flavor; refer to the vendor docs.

Set `HRIS_BASE_URL` in the n8n env to the API base for your HRIS.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

- Slack app with `chat:write` scope.
- Invite the bot into per-team `#hiring-{team}` channels AND `#recruiting-leadership`.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic API key

- console.anthropic.com → API Keys.
- The flow uses `claude-sonnet-4-6` for narrative composition; the model only narrates, it does not compute the variance numbers.

## Team mapping file

Save `team-mapping-template.yml` from this bundle as `/data/team_mapping.yml` (or wherever `TEAM_MAPPING_PATH` env points) and fill it in. The shape:

```yaml
teams:
  Engineering:
    canonical: engineering
    aliases:
      plan: ["Engineering"]
      ashby: ["Engineering", "Eng"]
      hris: ["Engineering Department", "ENGINEERING"]
  Sales:
    canonical: sales
    aliases:
      plan: ["Sales"]
      ashby: ["Sales", "Revenue"]
      hris: ["Sales", "Sales Department"]
  Customer Success:
    canonical: customer-success
    aliases:
      plan: ["CS", "Customer Success"]
      ashby: ["Customer Success"]
      hris: ["Customer Success", "CS"]
```

The mapping is the binding setup cost. Without it, the flow surfaces every team as an anomaly. With it, ongoing maintenance is low — only when teams are created or merged.

## Dry-run procedure

1. Set the cron trigger to manual (deactivate the schedule).
2. Replay last quarter's plan, reqs, and hires (use n8n's "Execute workflow" button after pointing the queries at last-quarter date ranges).
3. Compare the variance numbers to what your finance partner had at quarter-end.
4. If they don't match, the team mapping is incomplete OR the contractor / FTE classification in the HRIS query is off.
5. Tune the team mapping. Re-run.

Only enable the schedule once the dry-run matches finance.

## First-run sanity check

After enabling, check the next two Monday runs:

1. Confirm per-team channels received only their own variance row (privacy posture).
2. Confirm aggregate channel received the cross-team table.
3. Confirm anomaly cells are surfaced (zero anomalies on the first real run usually means the mapping silently dropped unmapped entities — check `Reconcile` output for `unmapped_*` strings).
4. Confirm the LLM narrative did NOT infer causes ("the team is behind because…"). If it did, the system prompt's drift; flag for tuning.

## Known limits

- The flow assumes a single quarter's data. Roll-forward into next quarter requires a separate query change in `Fetch Plan`.
- The LLM narrative is composed in a single call with a 60s timeout. For very large firms (>500 hires/quarter), the structured reconciliation may exceed Sonnet's context window — split the narrative across multiple LLM calls or use the deterministic table only.
- The flow does not write anywhere except Slack. Variance trends over time live in your data warehouse, not in this flow.
