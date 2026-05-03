# Composite customer health score — n8n flow

## What this flow does

This flow runs nightly at 02:00 in `America/New_York` and computes a composite customer health score for every active account. It pulls 28-day usage telemetry from Gainsight, 90-day CSM activity (calls, meetings, emails, notes) from HubSpot, and call transcripts from the last 30 days from Gong. Each source is normalized to a 0-100 sub-score with explicit guards (usage uses the account's own baseline, not absolute thresholds; activity is recency-weighted with a 21-day half-life; sentiment collapses to neutral when Claude reports confidence below 0.4). The three sub-scores are combined into a weighted composite, compared against the previous run, and written back to Gainsight custom fields along with a one-sentence Claude-generated explanation of why the score moved. Drops into the red band or deltas of -10 or worse fan out to a Slack alert channel for the CS pod to triage.

## Import

In n8n: open **Settings → Import From File → select `customer-health-score-n8n.json`**. After import, open the workflow and confirm the timezone in **Workflow Settings** is `America/New_York` (it ships set, but reconfirm — the schedule trigger relies on it). Activate the workflow only after credentials are wired and the verification run below has passed.

## Credentials

Five placeholder credentials are referenced by name in the export. Create each one in n8n under **Credentials → New** and replace the matching `PLACEHOLDER_*_CRED_ID` reference in the imported nodes (n8n will prompt you to map them on first open).

### `PLACEHOLDER_POSTGRES_CRED_ID` — Postgres — health-score-state

Used by four nodes: `Pull Accounts In Scope`, `Lookup Previous Score`, `Persist History (idempotent per day)`, and the implicit state table. Point this at a Postgres database you control (the same instance you use for other n8n state is fine). Required tables: `accounts_in_scope` (one row per account with `weight_usage`, `weight_activity`, `weight_sentiment`, `baseline_usage_28d`, `last_scored_at`, `gainsight_company_id`, `hubspot_company_id`) and `account_health_history` (append-only with the unique key `(account_id, date_trunc('day', scored_at))`). The repository's setup notes carry the DDL — see the workflow MDX page.

### `PLACEHOLDER_GAINSIGHT_CRED_ID` — Gainsight — Bearer token

Generate an Access Key in Gainsight under **Administration → Connectors → Connectors 2.0 → API Keys**. The key needs read access on the Company object's usage data and write access on the custom fields the flow updates (`OoligoHealthComposite__c`, `OoligoHealthBand__c`, `OoligoHealthUsage__c`, `OoligoHealthActivity__c`, `OoligoHealthSentiment__c`, `OoligoHealthWhy__c`, `OoligoHealthScoredAt__c`). Create those custom fields on the Company object first; the write-back node fails loudly if they are missing.

### `PLACEHOLDER_HUBSPOT_CRED_ID` — HubSpot — private app token

In HubSpot under **Settings → Integrations → Private Apps**, create a private app with scopes `crm.objects.companies.read`, `crm.objects.contacts.read`, `crm.objects.deals.read`, and `tickets.read`. Copy the access token into the n8n credential. Tokens rotate manually; calendar a quarterly rotation reminder.

### `PLACEHOLDER_GONG_CRED_ID` — Gong — Basic Auth

Generate an API key in Gong under **Company Settings → Ecosystem → API**. Gong returns a `key` and a `secret`; concatenate `key:secret`, base64-encode, and store as the Basic Auth value in n8n. Gong rate-limits at three calls per second per workspace — the per-batch wait node downstream gives headroom, but if you scale account count past about 1,000, add a second wait or move to Gong's bulk export.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic — x-api-key

Generate an API key at console.anthropic.com under **API Keys**. Store the value as a header credential with header name `x-api-key`. The flow uses `claude-sonnet-4-6` for sentiment classification and the why-changed sentence; both calls cap `max_tokens` (512 and 200 respectively) so per-account spend stays bounded.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack — bot token

In your Slack workspace under **api.slack.com/apps**, create a bot user with `chat:write` and invite it to the `#cs-health-alerts` channel (or whichever channel you point the alert node at). Store the bot token (`xoxb-...`) as a header credential with header name `Authorization` and prefix value `Bearer `.

## First-run verification

Run the flow manually before activating the schedule. This sequence proves each branch works without writing to production state.

1. **Seed one canary account.** Insert a single row into `accounts_in_scope` with a real `gainsight_company_id`, `hubspot_company_id`, and `account_id` you can point at. Set `baseline_usage_28d` to a known integer so you can predict the usage sub-score.
2. **Run `Pull Accounts In Scope` in isolation.** Execute the node and confirm the row comes back. If not, the SQL filter is the suspect — check `active = true` and `last_scored_at` thresholds.
3. **Run the three branches in turn.** Trigger `Gainsight — Usage`, `HubSpot — Engagements`, and `Gong — Calls` in sequence with the canary account row pinned. Confirm each returns a non-empty payload. A 401 on Gainsight means the Bearer is wrong or scope-limited; a 429 on Gong means you hit the rate cap and should add a wait.
4. **Run `Score Usage`, `Score Activity`, `Score Sentiment`.** Each should produce a number in `[0, 100]`. If sentiment returns 50 with confidence 0, that is intentional — the canary's transcripts are too short to be classified.
5. **Run `Compute Composite`.** With all three sub-scores in hand, confirm the composite matches a manual weighted-sum calculation (`weight_usage * sub_usage + weight_activity * sub_activity + weight_sentiment * sub_sentiment`, divided by the sum of the weights).
6. **Skip the write-back.** Disable `Gainsight — Write Score Fields` and `Persist History` for the first verification run. Inspect the payload from `Compose Write-back Payload` and confirm the why-changed sentence references concrete numbers from the sub-scores, not generic adjectives.
7. **Re-enable write-back; run end-to-end on the canary.** Confirm the Gainsight Company record now has the seven custom fields populated and `account_health_history` has one new row. Re-run the flow against the same canary and confirm only one row remains for that day (the `ON CONFLICT` clause is doing its job).
8. **Force an alert.** Manually edit the canary's previous-day history row to drop the composite by 15 points, then re-run. Confirm the Slack channel receives the alert with the why-changed sentence quoted.

If any step fails, fix it before activating the schedule. A nightly cron silently writing wrong scores into Gainsight is worse than no scores at all — CS will trust the field once it is there.
