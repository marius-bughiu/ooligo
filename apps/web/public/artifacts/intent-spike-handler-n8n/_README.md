# Intent spike handler — n8n flow

This bundle contains a complete n8n workflow that catches account-level intent spikes from Common Room, 6sense (via Salesforce CRM sync), and Bombora (via Salesforce CRM sync), deduplicates within a day-level window, looks up the Salesforce account owner, assigns the spike to the right rep or SDR pool by territory, drafts a first-touch message with Claude, posts a Slack notification to the assignee, and creates a Salesforce Task with full context.

Two entry points:

- **Real-time path** — `Webhook — Intent Spike Ingest` accepts `POST /webhook/intent-spike-handler` from Common Room outgoing webhooks (or any system that can POST a structured payload).
- **Polling path** — `Polling Cron — Every 4h` queries Salesforce every 4 hours for Accounts modified with Decision/Purchase buying stage (6sense) or high Bombora surge, then forwards each as a self-POST to the ingest webhook.

## What this flow does

The webhook normalizes multi-source intent payloads (Common Room organization shape, 6sense CRM-sync shape, Bombora CRM-sync shape) into a single internal record. A day-level dedup check prevents the same account from firing multiple times in a day — a direct response to the reality that intent platforms re-evaluate scores on short windows and will otherwise flood reps with repeat notifications for the same signal. The dedup window is set at day-level (not hour-level) because the relevant question is not "did the score tick up again?" but "has this rep been notified today?"

Dedup runs entirely inside one Code node (`Dedup Gate (Static Data)`) using n8n's workflow static data — `$getWorkflowStaticData('global')`. That is the only correct way to persist cross-execution state from a Code node: n8n's public REST API has **no** static-data resource, so an HTTP-based approach would 404 and the gate would never fire. The node reads/writes a `dedup_<domain>_<date>` key, prunes keys from previous days on every run (so the store stays small), and stamps the key before any external call so two concurrent spikes for the same domain can't both pass. Important: workflow static data only persists for **production** executions (webhook / Schedule Trigger) — not manual test runs — so dedup is verified live (see step 2 below), not via the manual Execute Workflow button.

Assignment logic prioritizes the existing Salesforce Account owner. If no Account exists, the spike routes to a territory-based SDR pool (AMER, EMEA, ROW) configured via environment variables. Claude generates a three-part draft: a subject line, a short outreach body anchored to the specific topics the account is researching, and a talking point for the SDR's call prep. The draft is explicitly labeled a starting point in the Slack message — it ships as prose the rep edits, not as a send-ready email.

## Import

1. In n8n, open **Workflows → Import from File** and select `intent-spike-handler-n8n.json`.
2. Open the workflow's **Settings** and confirm `Execution Order` is `v1` and `Timezone` is set to match your business hours (defaults to `America/New_York`). The cron interprets its schedule in this zone. The dedup window rolls over at UTC midnight (the key uses the UTC date); if you need it aligned to a local business day, change the date derivation in `Dedup Gate (Static Data)` to use the workflow timezone.
3. Set the environment variables listed in the **Environment variables** section below.
4. Wire all four credentials listed in the **Credentials** section.
5. Create the three Salesforce custom fields listed in the **Salesforce custom fields** section.
6. Activate the workflow only after the first-run verification below passes.

## Environment variables

Set these in your n8n instance's environment (n8n Cloud: **Settings → Environment Variables**; self-hosted: your `.env` file or container environment):

| Variable | Where to find it | Example |
|---|---|---|
| `N8N_SELF_URL_HOST` | Your n8n instance's public hostname, no trailing slash. Used by the polling path to self-POST forwarded spikes to the ingest webhook. | `n8n.example.com` |
| `SFDC_INSTANCE_URL` | Salesforce Setup → Company Information → Salesforce.com Base URL | `https://yourorg.my.salesforce.com` |
| `SFDC_ACCESS_TOKEN` | From your Salesforce connected app OAuth flow | `00D…` |
| `SDR_POOL_AMER_EMAIL` | SDR pool lead email for AMER territory | `sdr-amer@yourcompany.com` |
| `SDR_POOL_AMER_SLACK` | Slack handle (no @) for AMER SDR pool | `sdr-amer` |
| `SDR_POOL_EMEA_EMAIL` | SDR pool lead email for EMEA territory | `sdr-emea@yourcompany.com` |
| `SDR_POOL_EMEA_SLACK` | Slack handle (no @) for EMEA SDR pool | `sdr-emea` |
| `SDR_POOL_ROW_EMAIL` | SDR pool lead email for ROW territory | `sdr-row@yourcompany.com` |
| `SDR_POOL_ROW_SLACK` | Slack handle (no @) for ROW SDR pool | `sdr-row` |

The `SFDC_ACCESS_TOKEN` rotates. For production, use a Connected App with OAuth 2.0 client credentials flow and a short-lived token refresh node, or use the Salesforce OAuth2 credential in n8n instead of the raw Bearer token approach.

## Credentials

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic

Used by `Claude — Draft First Touch`. Generate an API key at `https://console.anthropic.com`. In n8n, add an **HTTP Header Auth** credential with header name `x-api-key` and value set to the key. The node uses `claude-haiku-4-5` to keep the latency under 2 seconds on a typical account payload. Swap to `claude-sonnet-4-6` only if draft quality is consistently off for complex industry segments — the cost difference is roughly 10×.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

Used by `Slack — Notify Assignee`. Create a Slack app at `https://api.slack.com/apps`, add the `chat:write` bot scope, install it to your workspace, and invite the bot user to `#intent-spikes`. In n8n, add an **HTTP Header Auth** credential with header name `Authorization` and value `Bearer xoxb-…`. Create `#intent-spikes` as the landing channel before activating; you can split high-severity spikes to a separate `#intent-spikes-hot` channel by modifying the channel field in `Slack — Notify Assignee`.

### `PLACEHOLDER_SALESFORCE_CRED_ID` — Salesforce Bearer token

Used by `Salesforce — Account Lookup`, `Salesforce — Create Task`, and `Salesforce — Poll Intent Fields`. In n8n, add an **HTTP Header Auth** credential with header name `Authorization` and value `Bearer <your_token>`. For a stable long-running credential, create a Salesforce Connected App with OAuth 2.0 and configure a token refresh; the raw Bearer approach works for initial setup but rotates every 2 hours by default. The credential requires `api`, `read`, `write`, and `chatter_api` OAuth scopes at minimum.

**Task ownership.** When the account lookup finds an existing Account, `Salesforce — Create Task` sets the Task's `OwnerId` to that Account owner's Salesforce **User Id** (a 15/18-char Id starting with `005`), which the lookup returns. Salesforce `OwnerId` does not accept an email address — passing one fails with `MALFORMED_ID`. When no Account is found (the spike routes to a territory SDR pool), `OwnerId` is omitted entirely, so the Task defaults to the user behind this credential (the integration/running user); the intended SDR pool is recorded in the Task Description and the rep is @-mentioned in the Slack notification. To hand these pool Tasks off to a real Salesforce queue or user, add a step that resolves a User/Queue Id (prefix `005`/`00G`) and set `OwnerId` to it.

### `PLACEHOLDER_6SENSE_CRED_ID` / Common Room (for real-time path)

The real-time webhook path accepts payloads from **Common Room outgoing webhooks**. In Common Room, go to **Settings → Webhooks → Add webhook**, set the Payload URL to `https://<your-n8n-host>/webhook/intent-spike-handler`, choose **Organization** as the payload type, and configure a workflow trigger on "contacts meeting criteria" or "new activity" filtered to high-intent signals. No n8n credential is required for this — the webhook is public; optionally verify the `x-commonroom-webhook-secret` header in the `Normalize Intent Payload` node if you add a shared secret.

The polling path uses 6sense and Bombora data **already synced into Salesforce** via those platforms' native managed packages. No direct 6sense or Bombora API credentials are needed in n8n — the Salesforce credential covers the poll.

## Salesforce custom fields

Create these three custom fields on the **Task** object in Salesforce Setup → Object Manager → Task → Fields & Relationships:

| API Name | Field Type | Notes |
|---|---|---|
| `Intent_Spike_Source__c` | Text (50) | Stores `common-room`, `6sense`, `bombora`, or `generic` |
| `Intent_Score__c` | Number (18, 0) | Stores the raw intent score (0–100) |
| `Intent_Buying_Stage__c` | Text (50) | Stores the buying stage string from the source |

The 6sense and Bombora **Account** fields queried by `Salesforce — Poll Intent Fields` are installed by each vendor's managed package. Verify the following API names exist on your Account object before activating the polling path:

- **6sense:** `sixsense_Intent_Score__c`, `sixsense_Buying_Stage__c`, `sixsense_Top_Topics__c`
- **Bombora:** `Bombora_Composite_Score__c`, `Bombora_Surge_Level__c`, `Bombora_Top_Topics__c`

If your managed package uses different API names, update the SOQL query in `Salesforce — Poll Intent Fields` to match.

## First-run verification

Run each path before enabling the cron or wiring Common Room:

**Note on testing dedup:** workflow static data only persists across **production** executions (a real `POST` to the webhook URL, or a Schedule Trigger run), not manual **Execute Workflow** runs. Activate the workflow and `curl` the webhook for steps 1–2 so the dedup key actually persists between the two requests.

1. **High-severity spike (Common Room shape).** `POST` to `https://<your-n8n-host>/webhook/intent-spike-handler` (workflow active) with:
   ```json
   {
     "body": {
       "type": "organization",
       "version": "1",
       "name": "Acme Corp",
       "domain": "acme-test-spike.com",
       "industry": "Software",
       "employeeCount": 500,
       "location": { "country": "US" },
       "technologies": ["Salesforce", "Slack"],
       "customFields": {
         "sixsense_buying_stage": "Decision",
         "sixsense_intent_score": 78,
         "sixsense_top_topics": "CRM automation,pipeline management"
       }
     }
   }
   ```
   Expected: dedup passes (no prior key), Slack message lands in `#intent-spikes` with red circle, Salesforce Task created with `Priority: High`, Claude draft present.

2. **Dedup block — same domain same day.** `POST` the identical payload from step 1 a second time (workflow still active). Expected: `Dedup Gate (Static Data)` finds the existing `dedup_acme-test-spike.com_<today>` key and returns an empty array — no Slack message, no Salesforce Task.

3. **Mid-severity spike (Bombora CRM-sync shape).** Send:
   ```json
   {
     "_source": "bombora",
     "domain": "midco-test-spike.com",
     "company_name": "MidCo",
     "country": "DE",
     "composite_score": 55,
     "surge_level": "medium",
     "topics": [{ "topic": "data integration" }, { "topic": "ETL tools" }]
   }
   ```
   Expected: spike severity maps to `medium`, EMEA SDR pool assigned, yellow circle in Slack.

4. **Claude failure fallback.** Temporarily revoke the Anthropic credential and send any payload. Expected: `Parse Draft (with fallback)` outputs a template-based draft tagged `draftSource: template-fallback`; Slack message and Salesforce Task still fire with the fallback draft.

5. **Polling path.** In Salesforce, set one test Account's `sixsense_Buying_Stage__c` to `Decision` and bump `SystemModstamp` (edit any field and save). Trigger `Polling Cron — Every 4h` manually. Expected: the Account appears in the SOQL results, `Build Forward Payloads` fans it out, `Forward to Ingest Webhook` POSTs it to the main webhook, and the full real-time path runs (dedup key will differ since domain is different from steps 1-4).

Only after all five pass should you enable the workflow and wire Common Room.
