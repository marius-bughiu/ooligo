# Demo no-show recovery — n8n bundle

## What this flow does

Recovers demo no-shows automatically. A HubSpot Workflow POSTs to a webhook the moment a meeting is marked `no_show`; n8n pulls the meeting and contact, decides whether to use a "we missed you" or "let's reschedule" tone based on whether the contact has a completed meeting in the last 90 days, asks Claude to write one personalized opener line (with a hard fallback if context is thin), then sends a same-day reschedule email from the AE's delegated Gmail with two pre-picked time slots and the AE's scheduling link. A separate cron sweep advances active recoveries to a step-2 value-forward email after two days and a step-3 soft close after a week. A third independent trigger watches the AE inbox for replies, classifies them (opt-out, reschedule, human reply), exits the sequence, and writes the exit reason back to the HubSpot contact for reporting.

## Import

1. In n8n, open **Settings → Import from File** (top-right menu in the workflow list).
2. Select `demo-no-show-recovery-n8n.json` from this bundle.
3. Open workflow **Settings** (gear icon in the editor) and confirm `Timezone` is set to your AE timezone — the imported default is `America/New_York`. Both the cron node and the date math in `Compose Step 1 Email` rely on this being correct.
4. Save the workflow but leave it **inactive** until credentials are wired and the first-run verification below passes.

## Credentials

You need four credentials. Each placeholder ID in the JSON has a `name` that helps n8n match them on import — re-create them with those names and the bindings reattach.

### `PLACEHOLDER_HUBSPOT_CRED_ID` — HubSpot Private App token

Used by the three HubSpot HTTP nodes (`HubSpot — Pull Meeting + Owner`, `HubSpot — Pull Contact`, `HubSpot — Pull AE Owner`, `HubSpot — Tag Exit on Contact`).

- HubSpot → **Settings → Integrations → Private Apps → Create private app**.
- Scopes required: `crm.objects.contacts.read`, `crm.objects.contacts.write`, `crm.objects.meetings.read`, `crm.objects.owners.read`.
- Copy the access token. In n8n create a **Header Auth** credential named `HubSpot — Private App token` with header `Authorization` and value `Bearer <token>`.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic x-api-key

Used by `Claude — Opener Line`.

- Get a key at **console.anthropic.com → API Keys**.
- In n8n create a **Header Auth** credential named `Anthropic — x-api-key` with header `x-api-key` and the key value. The model is pinned to `claude-sonnet-4-6` in the JSON body — change the body if you want a different model.

### `PLACEHOLDER_GMAIL_CRED_ID` — Gmail OAuth2 (AE delegated mailbox)

Used by `Gmail — Send Step 1 (delegated)`, `Gmail — Send Step 2/3`, and `Reply Trigger — AE Inbox`.

- In Google Cloud Console create OAuth credentials for n8n (**OAuth client ID → Web application**) and add `https://<your-n8n-host>/rest/oauth2-credential/callback` as the redirect URI.
- In n8n create a **Gmail OAuth2** credential named `Gmail — AE delegated mailbox` and authenticate as the AE whose mailbox should send.
- For multi-AE setups, duplicate the workflow per AE or replace the single credential with a credential-selector expression keyed off `ae_email`.

### `PLACEHOLDER_POSTGRES_CRED_ID` — Postgres (recovery-state)

Used by all five Postgres nodes.

- Any reachable Postgres 13+. The bundle assumes two tables; create them once before the first run:

```sql
CREATE TABLE recovery_state (
  meeting_id        text PRIMARY KEY,
  contact_id        text NOT NULL,
  owner_id          text,
  email             text NOT NULL,
  ae_email          text,
  tone              text,
  current_step      int NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'active',
  exit_reason       text,
  step1_sent_at     timestamptz,
  step1_opener      text,
  started_at        timestamptz NOT NULL DEFAULT now(),
  last_touched_at   timestamptz,
  next_due_at       timestamptz,
  exited_at         timestamptz
);

CREATE INDEX recovery_state_due_idx ON recovery_state (status, next_due_at);
CREATE INDEX recovery_state_email_idx ON recovery_state (email);

-- Read-only mirror used by the 90-day prior-meeting lookup.
-- Replace with your own meetings sync (HubSpot → warehouse) if you have one.
CREATE TABLE hubspot_meetings_raw (
  meeting_id   text PRIMARY KEY,
  contact_id   text NOT NULL,
  outcome      text NOT NULL,
  completed_at timestamptz
);
CREATE INDEX hubspot_meetings_contact_idx ON hubspot_meetings_raw (contact_id, completed_at DESC);
```

- In n8n create a **Postgres** credential named `Postgres — recovery-state` with host, db, user, password.

## First-run verification

Run these in order. Each step exercises a specific branch — if one fails, fix before moving on.

1. **Webhook reachability.** With the workflow inactive, click **Execute Workflow** on `Webhook — HubSpot no-show event` and grab the test URL. From a terminal: `curl -X POST <test-url> -H 'content-type: application/json' -d '{"meetingId":"<real-meeting>","contactId":"<real-contact>","ownerId":"<real-owner>"}'`. You should see a 202 in the response and the meeting + contact pulls light up in the editor.
2. **Eligibility guard — happy path.** Use a contact with `hs_email_optout = false`, a real email, and a meeting whose `hs_meeting_start_time` is more than 5 minutes in the past. The IF node should take the true branch.
3. **Eligibility guard — opt-out exit.** Set `hs_email_optout = true` on the contact and re-fire the webhook. The IF node should take the false branch and the flow should stop with no email sent.
4. **Tone branch — `we_missed_you`.** Insert a row into `hubspot_meetings_raw` for the contact with `outcome = 'completed'` and `completed_at = now()`. Re-fire. `Build Personalization Context` should emit `tone: "we_missed_you"`.
5. **Tone branch — `lets_reschedule`.** Delete that row. Re-fire. `Build Personalization Context` should emit `tone: "lets_reschedule"`.
6. **Claude fallback.** Empty the contact's `form_submission_summary` and `recent_form_fill`. The Claude call should return the literal `FALLBACK` and `Compose Step 1 Email` should swap in the safe opener.
7. **Activate the workflow.** Once steps 1-6 pass on test data, point the HubSpot Workflow at the production webhook URL and switch the n8n workflow to **Active**.
8. **Cron sweep.** Wait two days (or hand-edit `next_due_at` to `now() - interval '1 minute'` on a test row) and confirm `Cron — Step 2/3 Sweep` picks it up and advances `current_step` from 1 to 2.
9. **Reply exit.** Send a reply from a different inbox to the AE mailbox containing the word `STOP`. `Reply Trigger — AE Inbox` should classify it as `opt_out`, `Postgres — Exit Sequence` should set status to `opted_out`, and `HubSpot — Tag Exit on Contact` should write `no_show_recovery_status = 'opt_out'` back to the contact.
