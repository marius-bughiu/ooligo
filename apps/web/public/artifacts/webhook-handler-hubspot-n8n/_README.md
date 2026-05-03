# HubSpot webhook handler (n8n)

A single n8n workflow that receives every HubSpot Workflows webhook your portal fires, verifies the HMAC v3 signature against your app's client secret, deduplicates against a Postgres ledger keyed on HubSpot's `eventId`, routes by `subscriptionType`, and acknowledges with a fast `200` so HubSpot stops retrying.

Bundle layout:

```
webhook-handler-hubspot-n8n/
├── webhook-handler-hubspot-n8n.json   # n8n workflow export
└── _README.md                         # this file
```

## What this flow does

The Webhook node accepts `POST /webhook/hubspot/events` with `rawBody` capture enabled — HubSpot Signature v3 signs the exact request bytes, so any re-serialization of the JSON body breaks the comparison.

`Verify HMAC + Parse` is a Code node that reconstructs HubSpot's signing string (`METHOD + URI + RAW_BODY + TIMESTAMP`), HMAC-SHA256s it with your app's client secret from `$env.HUBSPOT_CLIENT_SECRET`, and compares to the `x-hubspot-signature-v3` header in constant time. Requests with stale timestamps (older than 5 minutes) are rejected before any signature math runs, which kills replay attacks. On success it parses the body and emits one item per event in the batch.

`Dedupe Ledger Insert` writes each event's `eventId` into `hubspot_event_ledger` with `INSERT ... ON CONFLICT (event_id) DO NOTHING RETURNING event_id`. A duplicate delivery (HubSpot retries every 5xx for 24 hours, and your handler will have downtime) returns zero rows. `If New Event` then short-circuits the duplicate path straight to a `200 OK` ack — the downstream side effect already ran the first time.

`Switch — Event Type` fans out to one branch per `subscriptionType`. The bundle ships three concrete branches (`deal.propertyChange` → Slack, `contact.creation` → internal API, `ticket.propertyChange` → sync) plus a fallback that parks unknown types in `hubspot_unhandled_events` instead of crashing. Replace the example URLs with your own.

`Respond 200 OK` is a Respond-to-Webhook node — the handler always acks after the ledger insert succeeds, so HubSpot considers the event delivered even if a downstream branch fails. The Error Trigger sub-flow catches branch failures and posts to Slack so you replay them out-of-band, not by stalling HubSpot's queue.

## Import

1. In n8n, open **Workflows** → **Import from File** and select `webhook-handler-hubspot-n8n.json`.
2. Open the workflow's **Settings**. Confirm `Timezone` is set (default `America/New_York` — change to match your business calendar) and `Save execution progress` is on (the partial state is what you replay against on a retry).
3. On the n8n instance, set two environment variables and restart the worker:
   - `HUBSPOT_CLIENT_SECRET` — your HubSpot app's client secret (used as the HMAC key).
   - `N8N_WEBHOOK_PUBLIC_BASE_URL` — the public origin of the n8n webhook URL, e.g. `https://n8n.example.com`. The signing string is reconstructed against this exact origin; if it differs, every signature fails.
4. Bind credentials to the placeholder IDs (next section), then activate the workflow.
5. In your HubSpot app's webhook settings, register the production URL n8n shows for the Webhook node and subscribe to the event types you actually route on.

## Credentials

### Postgres — hubspot-ledger

Used by `Dedupe Ledger Insert` and `Branch — Unknown Type → Park`.

Required schema (run once before activation):

```sql
CREATE TABLE IF NOT EXISTS hubspot_event_ledger (
  event_id           TEXT PRIMARY KEY,
  subscription_type  TEXT NOT NULL,
  object_id          BIGINT,
  portal_id          BIGINT,
  occurred_at        TIMESTAMPTZ,
  raw_payload        JSONB NOT NULL,
  received_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hubspot_event_ledger_received_at_idx
  ON hubspot_event_ledger (received_at);

CREATE TABLE IF NOT EXISTS hubspot_unhandled_events (
  event_id           TEXT PRIMARY KEY,
  subscription_type  TEXT NOT NULL,
  raw_payload        JSONB NOT NULL,
  received_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The `event_id` PRIMARY KEY is the idempotency contract — the entire flow's correctness depends on it being a real unique constraint, not just an index. Plan to prune rows older than your replay window (HubSpot's is 24 hours; we recommend retaining 30 days for audit). A daily `DELETE FROM hubspot_event_ledger WHERE received_at < now() - interval '30 days'` keeps the table well under a gigabyte for typical mid-market portal volume.

### Slack — bot token

Used by `Branch — Deal Stage → Slack` and `Slack — Failure Alert`.

n8n credential type `httpHeaderAuth`. Header name `Authorization`, header value `Bearer xoxb-...`. The token needs `chat:write` and the bot must be invited to the channels named in the JSON bodies (`#revops-pipeline` and `#alerts-revops` by default — rename to your channels).

## First-run verification

The flow's correctness rests on three behaviors. Verify each one before pointing real HubSpot traffic at it.

### 1. Valid signature happy-path

Use HubSpot's built-in **Test** button on the webhook action in your Workflows UI — it sends a real signed payload from HubSpot's edge, which is the only way to exercise the v3 signing path end-to-end (a curl from your laptop won't have the right signing key).

Expected: `200 OK` response, one new row in `hubspot_event_ledger` with the test event's `eventId`, and one message in `#revops-pipeline` (or whichever branch matches the test event type).

### 2. Invalid signature reject

From a shell:

```bash
curl -i -X POST https://n8n.example.com/webhook/hubspot/events \
  -H 'content-type: application/json' \
  -H 'x-hubspot-signature-v3: AAAAinvalidsignature==' \
  -H "x-hubspot-request-timestamp: $(date +%s000)" \
  -d '{"eventId":"test-1","subscriptionType":"deal.propertyChange","objectId":1,"portalId":1,"occurredAt":1000}'
```

Expected: `401` with `{"ok":false,"reason":"hmac-mismatch"}`. No row in `hubspot_event_ledger`. No Slack message. If you get a `200`, your signing string reconstruction is wrong — most commonly because `N8N_WEBHOOK_PUBLIC_BASE_URL` doesn't match the URL HubSpot is actually POSTing to (check for `http` vs `https`, trailing slashes, port differences).

### 3. Duplicate event-id skip

Send the same valid signed payload twice (re-trigger the HubSpot test, or replay a captured request through a tool that preserves headers and body bytes exactly).

Expected: both responses are `200 OK`, but `hubspot_event_ledger` shows exactly one row, and the downstream branch (Slack message, internal API call, etc.) fired exactly once. If the side effect ran twice, the ledger insert is not actually constraining on `event_id` — verify the PRIMARY KEY exists and that the Code node is emitting a stable `eventId` value (HubSpot uses the field literally named `eventId` on each event in the array).

### 4. Schema drift fallback

Construct a payload with `subscriptionType: "company.propertyChange"` (or any type your switch doesn't handle) and send it through the HubSpot test path. Expected: `200 OK`, one row in `hubspot_unhandled_events`, no error in the execution log. The flow should never crash on an unknown event type — if it does, the Switch node's fallback wiring is broken.
