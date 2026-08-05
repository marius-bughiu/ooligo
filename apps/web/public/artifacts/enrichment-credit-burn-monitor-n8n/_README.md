# Enrichment credit burn monitor — n8n flow

This bundle contains a complete n8n workflow that tracks credit consumption across Clay, Apollo and ZoomInfo, converts it into a cost per verified record, and alerts in Slack on two things that cost money in opposite directions: spend drifting up per useful record, and allowance expiring unused at the end of a billing cycle.

Three entry points:

- **Hourly usage sweep** — `Schedule — Hourly Usage Sweep` fires at the top of every hour and polls the two vendors that expose usage over an API: ZoomInfo (`GET /gtm/data/v1/users/usage`) and Apollo (`POST /api/v1/usage_stats/api_usage_stats`).
- **Daily reconcile** — `Schedule — Daily Reconcile 07:00` pulls the Clay usage export, recomputes cost per verified record against the 28-day baseline, and runs the expiry forecast for every configured cycle.
- **Clay row ledger** — `Webhook — Clay Row Event` accepts `POST /webhook/clay-credit-event`, one call per enriched row from a Clay HTTP API column. This is the only source in the flow that knows whether a row was *verified*, which is the denominator the whole cost model rests on.

## Why the three vendors are handled differently

Only one of the three publishes a usage endpoint, and the design follows from that.

**ZoomInfo** exposes `GET /gtm/data/v1/users/usage` on base `https://api.zoominfo.com/gtm`, returning an array of limit rows with `limitType`, `description`, `totalLimit`, `currentUsage` and `usageRemaining`. `limitType` distinguishes `request` (throughput) from `record` and `uniqueID` (what ZoomInfo bills). `Parse ZoomInfo Usage` keeps that distinction: request limits are emitted as `kind: 'throughput'` and never priced. The response carries no reset date, so the contract-period end has to come from `ZOOMINFO_CONTRACT_END`.

**Apollo** exposes `POST /api/v1/usage_stats/api_usage_stats`, which costs 0 credits and requires a master API key. It returns per-endpoint counters shaped `{ day: { limit, consumed, left_over }, hour: {...}, minute: {...} }` — those are **requests, not credits**. Apollo's documented credit costs make the conversion lossy in both directions: people enrichment charges 1 credit for demographics or email plus 8 more if a mobile phone is returned, and `/people/bulk_match` accepts up to ten people per request. One request is therefore worth anywhere from 0 to 90 credits. `Derive Apollo Credits` emits `derivedCreditFloor` and `derivedCreditCeiling` rather than pretending to a single number, and downstream nodes tag the midpoint `estimated: true`.

**Clay** publishes no credit-balance endpoint at all. Usage lives in Settings → Usage, broken down by workbook and table, by integration, by signal, and with separate tabs for API and MCP spend, with CSV export. `HTTP — Clay Usage Export` reads that export from a URL you control; `Parse Clay Usage CSV` asserts the columns it needs and **throws** if a header is missing, because a silent zero reads downstream as "spend stopped" and suppresses every alert.

## Import

1. In n8n, open **Workflows → Import from File** and select `enrichment-credit-burn-monitor-n8n.json`.
2. Open the workflow's **Settings** and confirm `Execution Order` is `v1` and `Timezone` matches your finance calendar (the export ships `America/New_York`). Both cron expressions are interpreted in this zone, and the daily reconcile's 07:00 firing time determines which calendar day a cycle boundary lands on.
3. Set the environment variables in the table below. The flow starts in a safe state: with no unit prices configured it still reports unit burn and expiry, and only the drift branch goes quiet.
4. Wire the two credentials in the Credentials section.
5. Point one Clay table's HTTP API column at the webhook URL.
6. Run the five-step verification before activating either Schedule Trigger.

## Credentials

### 1. ZoomInfo GTM Data API (OAuth2) — `PLACEHOLDER_ZOOMINFO_OAUTH2_CRED_ID`

Used by `HTTP — ZoomInfo Usage`. Create a **Generic Credential Type → OAuth2 API** credential in n8n and attach the scopes your contract includes (`api:data:company`, `api:data:contact`, `api:data:intent`, `api:data:news`, `api:data:scoops`, `api:data:lookup`). Client credentials come from **Admin Portal → Integrations → API & Webhooks**.

If your contract is still on the legacy Enterprise API rather than the GTM Data API, the auth model is different: `POST https://api.zoominfo.com/authenticate` with username and password, or a client ID plus private key pair, returns a JWT valid for **one hour**, passed as `Authorization: Bearer <jwt>` on every subsequent call. That flow needs a `Set` node plus an HTTP node in front of the usage call and a re-auth on every execution — an hourly schedule means the token is expired at every firing, so caching it buys nothing. Rate limits on that API are 1 request per second on the authentication endpoint and 25 per second (1,500 per minute) on the standard endpoints.

### 2. Slack — `PLACEHOLDER_SLACK_CRED_ID`

Used by `Slack — Notify`. A Slack app credential with `chat:write` and, if you post to channels the bot is not a member of, `chat:write.public`. Invite the bot to both channels named in `SLACK_CHANNEL_CRITICAL` and `SLACK_CHANNEL_WARNING`.

### 3. Apollo master API key — env var, not a credential

`HTTP — Apollo Usage Stats` sends `x-api-key: {{ $env.APOLLO_MASTER_API_KEY }}`. The usage-stats endpoint needs a **master** key (OAuth scope `api_usage_stats_read`); an ordinary key returns 403. It is kept in an env var rather than an n8n credential so the same key can be read by the derivation node's cost table without a second credential lookup.

### 4. Clay export URL — env var

`CLAY_USAGE_EXPORT_URL` should point at a signed URL or object-store path holding the most recent CSV export from Settings → Usage. Clay has no API for this, so the export is either a manual weekly drop or a small scheduled job of your own. Whichever it is, the freshness guard below matters more than the mechanism.

## Environment variables

| Variable | Default | What it does |
|---|---|---|
| `APOLLO_MASTER_API_KEY` | — | Master key for the usage-stats endpoint |
| `APOLLO_CYCLE_END` | — | `YYYY-MM-DD` end of the Apollo billing cycle. Unset disables the Apollo expiry forecast rather than guessing it |
| `APOLLO_CREDIT_ALLOWANCE` | — | Credits granted this cycle, from your plan |
| `APOLLO_CREDIT_USD` | — | Your contracted dollars per credit. No public list price exists per plan tier, so leaving this unset is the honest default; unit burn still reports |
| `ZOOMINFO_CONTRACT_END` | — | `YYYY-MM-DD` end of the contract period. The usage response has no reset date |
| `ZOOMINFO_RECORD_USD` | — | Contracted dollars per returned record. ZoomInfo does not publish pricing |
| `CLAY_USAGE_EXPORT_URL` | — | Where the Settings → Usage CSV export lands |
| `CLAY_EXPORT_STALE_HOURS` | `36` | Older than this and the snapshot is tagged `stale` and routed away from the cost maths |
| `CLAY_PLAN_MONTHLY_USD` | `495` | Clay plan fee used to price units. Growth is $495/mo billed monthly |
| `CLAY_DATA_CREDIT_ALLOWANCE` | `6000` | Data Credits per month on your plan |
| `CLAY_ACTION_ALLOWANCE` | `40000` | Actions per month on your plan |
| `CLAY_DATA_CREDIT_COST_SHARE` | `0.7` | Share of the Clay plan fee attributed to Data Credits rather than Actions |
| `CLAY_DC_ROLLOVER_MULTIPLE` | `2` | Data Credit rollover cap as a multiple of the monthly allowance |
| `CLAY_CYCLE_END` | — | `YYYY-MM-DD` end of the Clay billing cycle |
| `CPVR_DRIFT_PCT` | `25` | Trailing-7-day cost per verified record above the 28-day baseline by this percentage fires a drift alert |
| `CPVR_MIN_VERIFIED` | `250` | Minimum verified records in both windows before drift can fire |
| `FORFEIT_ALERT_PCT` | `15` | Projected unused share of an allowance that triggers a forfeit alert |
| `CYCLE_WARN_DAYS` | `7` | Days before cycle end that the forfeit alert becomes eligible |
| `ALERT_DEDUP_HOURS` | `12` | Dedup bucket width |
| `SLACK_CHANNEL_CRITICAL` | `#revops-alerts` | Drift and overrun |
| `SLACK_CHANNEL_WARNING` | `#revops-costs` | Forfeit and poll-health |

### The one number that is a modelling choice, not a vendor fact

`CLAY_DATA_CREDIT_COST_SHARE` exists because a Clay plan fee buys Data Credits and Actions together and Clay does not price them separately. At the shipped default — Growth at $495 per month, 70% attributed to 6,000 Data Credits and 30% to 40,000 Actions — a Data Credit costs $0.0578 and an Action costs $0.0037. Move the share and both move. Anyone reading the resulting cost per verified record should know it inherits that assumption; if your spend is overwhelmingly one unit, set the share to match and note it where the number is reported.

Clay's published plan anchors, checked 2026-08-05: Free 100 Data Credits and 500 Actions; Launch $185/mo for 2,500 Data Credits and 15,000 Actions; Growth $495/mo for 6,000 and 40,000. Annual billing is roughly 10% lower per month ($167 and $446).

## Clay row events

Point a Clay HTTP API column at `POST https://<your-n8n>/webhook/clay-credit-event` with a JSON body:

```json
{
  "rowId": "{{row_id}}",
  "table": "outbound-icp-q3",
  "workbook": "GTM",
  "integration": "prospeo",
  "dataCredits": 2,
  "actions": 1,
  "verified": true
}
```

`rowId` is required and is the dedup key — Clay retries failed HTTP columns, and `Clay Ledger Append` will otherwise double-count the retry. `verified` should be the output of whatever verification step you already run (a deliverability check, a catch-all filter, a manual QA column), not the enrichment's own "found" flag. The ledger is a 45-day ring buffer in `$getWorkflowStaticData('global')`.

## What the monitor itself costs

Worth knowing before you activate it, because two of the three branches are not free:

- **ZoomInfo**: one usage call per hour, 24 per day. It counts against the `request` limit, not the `record` limit, so it consumes throughput, not credits.
- **Apollo**: `api_usage_stats` costs 0 credits. It does count against that endpoint's own rate limit.
- **Clay**: each row event costs **1 Action**, because HTTP requests consume Actions under Clay's March 2026 pricing model. On a 20,000-row month at the Growth allowance of 40,000 Actions, instrumenting every row spends 20,000 Actions — half the allowance — to measure the other half. Instrument the tables whose spend you actually need to attribute, not all of them. The CSV export path costs nothing and covers the rest.

## First-run verification

Run these in order, before activating either schedule. Each one proves a branch in isolation.

1. **ZoomInfo parse, auth-failure path.** Temporarily break the OAuth2 credential (change the client secret to `x`) and execute `HTTP — ZoomInfo Usage` manually. Expect one item with `ok: false, reason: 'auth_401'` and **no** usage records. If you see `used: 0` instead, the `neverError` option was lost in import — restore it, or an expired credential will silently read as zero spend forever.
2. **ZoomInfo parse, success path.** Restore the credential and re-run. Expect one item per limit row, with `billable: true` only on `record` and `uniqueID` rows.
3. **Apollo bracket.** Execute `HTTP — Apollo Usage Stats` then `Derive Apollo Credits`. Confirm `derivedCreditFloor` is at or below `derivedCreditCeiling` and that `perEndpoint` lists only the credit-consuming endpoints — record management endpoints should be absent, since they cost 0 credits.
4. **Clay export guard.** Point `CLAY_USAGE_EXPORT_URL` at a CSV whose header row you have deliberately renamed (`credits` → `credit_total`) and execute `Parse Clay Usage CSV`. Expect a thrown error naming the headers it saw. Restore the real export and confirm you get one item per day with `stale: false`.
5. **Ledger and dedup.** POST the sample body above to the webhook twice with the same `rowId`. The first returns `duplicate: false`, the second `duplicate: true`, and the ledger holds one entry. Then activate `Schedule — Daily Reconcile 07:00` and let it fire twice within the dedup window: the second firing should post nothing to Slack. Static data does not persist across manual executions, so this last check only works with an activated schedule.

## Watch-outs

**Drift alerts are meaningless on small denominators.** Twelve verified rows on a quiet Sunday produce a cost per verified record that is arithmetically correct and operationally useless. `CPVR_MIN_VERIFIED` defaults to 250 verified records in *both* windows; below that the node returns `status: 'insufficient_data'` and no alert fires. Raise it if your weekly volume is high enough to support it.

**A stale Clay export looks exactly like a spend freeze.** Both produce flat daily numbers. `CLAY_EXPORT_STALE_HOURS` tags snapshots older than 36 hours, and the alert gate routes those to the warning channel as a poll-health message instead of feeding them into the baseline.

**The Apollo number is a bracket, not a measurement.** If your Apollo usage is mostly `bulk_match`, the ceiling can be an order of magnitude above the floor. When the split matters, ledger the Apollo calls at their call sites the same way the Clay column does — the usage endpoint cannot get you there on its own.

**Cycle-end dates are configuration, not discovery.** No vendor in this flow returns its reset date. Every unset `*_CYCLE_END` disables that vendor's expiry forecast and says so in the item, rather than assuming a calendar month. Diarise updating them when a contract renews.

**Static data is per-workflow and not backed up.** Re-importing the workflow as a new record starts the ledger and the dedup map empty, which means a fresh 28-day baseline. Export before you re-import if the history matters.
