# Usage-drop alert for CSMs — n8n flow

## What this flow does

This flow runs every Monday at 09:00 in `America/New_York` and checks every active account for a week-over-week drop in product usage. For each account it pulls two weekly buckets of unique active users from Amplitude (last week and the week before), computes the percentage drop, and compares it against a per-account threshold stored in Postgres. Accounts whose drop crosses the threshold — and that are not inside a 14-day cooldown from a prior alert — trigger a Slack direct message to the owning CSM naming the account, the before/after active-user counts, and the percentage drop. Every alert is logged to a history table so a sustained dip pings the CSM once, not every week.

The flow is deliberately small: one external read (Amplitude), one decision (threshold), one suppression check (cooldown), one notification (Slack), one write (history). It is the leading-indicator companion to a full composite health score, not a replacement for one.

## Import

In n8n: open **Settings → Import From File → select `usage-drop-alert-n8n.json`**. After import, open the workflow and confirm the timezone in **Workflow Settings** is `America/New_York` (it ships set, but reconfirm — the schedule trigger and the cron's `13:00 UTC` expression both assume it). Activate the workflow only after credentials are wired and the verification run below has passed.

## Credentials

Two placeholder credentials are referenced by name in the export. Create each in n8n under **Credentials → New** and map the matching `PLACEHOLDER_*_CRED_ID` reference on first open. (Postgres is the third — it backs the state tables and is also referenced by name.)

### `PLACEHOLDER_POSTGRES_CRED_ID` — Postgres — usage-alert-state

Used by three nodes: `Pull Accounts In Scope`, `Lookup Recent Alert`, and `Persist Alert (idempotent per week)`. Point this at a Postgres database you control. Required tables:

```sql
CREATE TABLE accounts_in_scope (
  account_id           text PRIMARY KEY,
  account_name         text NOT NULL,
  amplitude_project_id text,
  segment              text,
  active               boolean NOT NULL DEFAULT true,
  drop_threshold_pct   int  NOT NULL DEFAULT 40,   -- per-account % drop that triggers an alert
  min_baseline_events  int  NOT NULL DEFAULT 10,   -- floor below which the account is too small to judge
  csm_slack_user_id    text,                       -- Slack user id of the owning CSM (e.g. U0123ABCD)
  last_alerted_at      timestamptz
);

CREATE TABLE usage_alert_history (
  account_id   text NOT NULL,
  alerted_at   timestamptz NOT NULL DEFAULT now(),
  week_before  int,
  last_week    int,
  drop_pct     int,
  threshold    int,
  reason       text
);
-- Idempotence key: one row per account per week, so retries do not double-log or double-DM.
CREATE UNIQUE INDEX usage_alert_history_week_uniq
  ON usage_alert_history (account_id, date_trunc('week', alerted_at));
```

### `PLACEHOLDER_AMPLITUDE_CRED_ID` — Amplitude — API key:secret (Basic)

Amplitude's Dashboard REST API uses HTTP Basic auth where the username is the project **API Key** and the password is the project **Secret Key**. Find both in Amplitude under **Settings → Projects → [your project] → General**. In n8n create a **Basic Auth** credential: username = API Key, password = Secret Key. The flow calls the `/api/2/events/segmentation` endpoint, which needs no extra scope beyond a valid key pair. Note the endpoint returns event-segmentation series; the node's query segments on a `gp:account_id` user property — rename that to whatever account identifier your Amplitude taxonomy uses, and replace the `_active` event with your own activity event if you do not track a synthetic `_active` event.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack — bot token

In your Slack workspace under **api.slack.com/apps**, create an app with a bot user and the scopes `chat:write` and `im:write` (the latter is required to open a DM channel with a user). Install the app to the workspace and copy the bot token (`xoxb-...`). Store it as a header credential with header name `Authorization` and prefix value `Bearer `. Because the flow DMs the CSM by Slack user id, each CSM must have **"Allow users in your workspace to send you direct messages"** enabled and the app must not be blocked. If your org restricts app DMs, point the `channel` field at a shared channel such as `#cs-usage-alerts` and tag the CSM in the message text instead.

## First-run verification

Run the flow manually before activating the schedule. This sequence proves each branch without spamming CSMs.

1. **Seed one canary account.** Insert a single row into `accounts_in_scope` with a real `account_id` that exists in Amplitude, your own Slack user id in `csm_slack_user_id`, `drop_threshold_pct = 1` (so any drop fires), and `min_baseline_events = 1`.
2. **Run `Pull Accounts In Scope` in isolation.** Confirm the canary row comes back. If empty, check `active = true` and that `csm_slack_user_id` is non-null (the `WHERE` clause filters out null Slack ids).
3. **Run `Amplitude — Weekly Actives (14d)`.** Confirm a non-empty `data.series` array with at least two weekly values. A 400 usually means the `gp:account_id` property name or the event name does not match your taxonomy; a 401 means the Basic auth key/secret pair is wrong.
4. **Run `Compute WoW Drop`.** Confirm `week_before`, `last_week`, `drop_pct`, and `status` are populated. Temporarily hand-edit the canary's Amplitude data (or pin a fixture) so `last_week` is well below `week_before` and confirm `status` becomes `alert`. Then set `min_baseline_events` above `week_before` and confirm `status` becomes `skipped_low_baseline` — that proves the noise guard works.
5. **Check the cooldown path.** With `usage_alert_history` empty, `Outside Cooldown?` should route to the Slack node. Manually insert a row into `usage_alert_history` for the canary dated yesterday, re-run, and confirm `Outside Cooldown?` now routes to the throttle (suppressed). Delete the test row afterward.
6. **Fire one real DM.** With the cooldown clear, let the flow run end-to-end on the canary. Confirm you receive the Slack DM with the account name, the before/after counts, and the drop percentage, and that one row landed in `usage_alert_history`.
7. **Re-run the same day.** Confirm no second DM arrives and `usage_alert_history` still has exactly one row for the week (the `ON CONFLICT` clause is doing its job).
8. **Restore real thresholds.** Set `drop_threshold_pct` and `min_baseline_events` back to production values (40 and 10 are sensible defaults) before activating the schedule.

If any step fails, fix it before activating. A weekly cron that DMs CSMs about phantom drops will train them to mute the bot inside a month — the noise guard and the cooldown exist specifically to keep that from happening.
