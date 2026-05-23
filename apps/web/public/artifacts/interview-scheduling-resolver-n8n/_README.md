# Interview scheduling conflict resolver — n8n flow

This bundle automates the scheduling coordination loop for multi-person interview panels. A Greenhouse webhook fires when a candidate moves to a stage with interviews in `to_be_scheduled` status; the flow fetches free/busy data for every participant via the Google Calendar freeBusy API, intersects those windows against candidate availability, ranks the resulting open slots by a set of tie-break rules, and posts the top 3 proposed times to a Slack channel for the recruiter to confirm and book. A daily backstop cron sweeps for applications that have been stuck unscheduled for more than 48 hours and replays them through the same path.

## Import

1. In your n8n instance open **Workflows → Import from File** and select `interview-scheduling-resolver-n8n.json`.
2. Open **Settings** on the imported workflow and confirm:
   - `Execution Order` is set to `v1`
   - `Timezone` is `America/New_York` (or your team's primary timezone — change this and update the freeBusy query node's `timeMin`/`timeMax` expressions to match)
3. Set the environment variable `GREENHOUSE_WEBHOOK_SECRET` in your n8n instance (Settings → Environment Variables or `.env` file for self-hosted). This is the secret string you configure when registering the webhook in Greenhouse Dev Center. The signature-verification node will throw and halt on every request if this variable is absent.
4. Wire the four credentials described below.
5. Complete the first-run verification before activating the Greenhouse webhook trigger.

## Credentials

### `PLACEHOLDER_GOOGLE_CAL_CRED_ID` — Google Calendar OAuth2

Used by `Google Calendar — freeBusy Query`.

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Enabled APIs → Enable **Google Calendar API**.
2. Create an OAuth 2.0 client ID (Desktop app or Web application, depending on your n8n setup).
3. In n8n, add a **Google Calendar OAuth2 API** credential. Paste the Client ID and Client Secret from GCP; complete the OAuth consent flow.
4. Required scope: `https://www.googleapis.com/auth/calendar.readonly`. The flow reads free/busy data only — it does not create or modify calendar events.
5. The OAuth token must be authorized for each panel member's Google Workspace account if they are on separate accounts. For Workspace-managed organizations, use a service account with domain-wide delegation instead, and grant it the same readonly Calendar scope across the domain.

### `PLACEHOLDER_GREENHOUSE_CRED_ID` — Greenhouse Harvest API

Used by `Greenhouse — List Stale Unscheduled Interviews` (the daily backstop path).

1. In Greenhouse, go to **Configure → Dev Center → API Credential Management** and create a new Harvest API key.
2. Grant scopes: `Scheduled Interviews` (read) and `Applications` (read). No write scope is needed; the flow does not modify Greenhouse records.
3. In n8n, add an **HTTP Header Auth** credential:
   - Header name: `Authorization`
   - Value: `Basic ` + base64 encoding of `your_api_key:` (note the trailing colon — Greenhouse uses the key as the username with a blank password)
4. Greenhouse Harvest API v1 and v2 are scheduled for deprecation on 2026-08-31. After that date, migrate the backstop node to the v3 endpoint.

### `PLACEHOLDER_GREENHOUSE_WEBHOOK` — Greenhouse webhook configuration (not a credential in n8n)

The webhook trigger is not a named n8n credential but requires a configuration step in Greenhouse:

1. Go to **Configure → Dev Center → Web Hooks → Add Web Hook**.
2. Set the endpoint URL to your n8n webhook URL: `https://<your-n8n-host>/webhook/interview-scheduling-resolver`.
3. Subscribe to the `candidate_stage_change` event (the flow filters for interviews with `to_be_scheduled` status inside the signature-verification node).
4. Copy the webhook secret that Greenhouse generates and set it as the `GREENHOUSE_WEBHOOK_SECRET` environment variable in n8n.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

Used by `Slack — Notify Recruiter with Proposed Slots` and `Slack — Escalate No-Availability`.

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and create a new app (from scratch).
2. Add the `chat:write` bot scope under **OAuth & Permissions → Scopes**.
3. Install the app to your workspace and copy the `xoxb-...` Bot User OAuth Token.
4. In n8n, add an **HTTP Header Auth** credential:
   - Header name: `Authorization`
   - Value: `Bearer xoxb-<your-token>`
5. Invite the bot user to `#scheduling-queue` (or whatever channel you configure in the Slack nodes).

## Candidate availability intake

The `Candidate Availability Intake` node ships as a stub that returns Mon–Fri 9am–6pm ET for the full 14-day window. This means the flow will find all panel-free slots in the window on first run — useful for verifying the algorithm is working — but it does not reflect real candidate constraints.

To wire real candidate availability:

- **Option A — Calendly**: use a Calendly webhook trigger or poll the `/scheduled_events` endpoint after the candidate books their preferred windows. Replace the stub node with an HTTP Request node that reads the booked windows.
- **Option B — Typeform / Tally**: collect availability via a form, store responses in Airtable or Google Sheets, and replace the stub node with an Airtable or Sheets read node keyed on `applicationId`.
- **Option C — embedded availability link**: send the candidate a Calendly or Doodle availability-sharing link via a separate notification email node; the stub makes the flow functional while you build this step.

## Conflict-resolution algorithm (summary)

The `Resolve Conflicts — Intersect + Rank Slots` Code node:

1. Collects all participant busy intervals from the Google Calendar freeBusy response.
2. Merges overlapping busy intervals into a single union per union-find, so a 60-minute block counts as unavailable if any one panelist is busy during any part of it.
3. Subtracts the merged panel-busy union from the candidate's stated available windows, leaving only the sub-intervals where everyone is free.
4. Quantizes the remaining free sub-intervals into 60-minute blocks aligned to :00 or :30 boundaries.
5. Excludes blocks that straddle noon (slots starting within 30 minutes of noon in ET — lunch collision rate is high).
6. Ranks the remaining blocks by: (a) earlier in the day (lower penalty per hour past 9am), (b) lighter recruiter calendar load on that day (fewer existing busy intervals), (c) proximity to today (the first 10 candidate slots get a +10 boost).
7. Returns the top 3 ranked slots, or sets `resolved: false` if no common window exists.

## First-run verification

Activate the workflow only after all five paths below pass. Use n8n's **Test Workflow** or manually trigger each node in isolation.

### 1. Signature verification — valid payload

Send a test POST to your n8n webhook URL with the header `Signature: sha256 <correct-hmac>` (Greenhouse's format is the algorithm, a single space, then the hex HMAC — not `sha256=<hmac>`) computed against the exact raw request body and your `GREENHOUSE_WEBHOOK_SECRET`. The Webhook node uses `rawBody: true` so the HMAC is verified against the original bytes Greenhouse sent. Expected: the `Verify Signature + Extract Participants` node passes and outputs a normalized JSON item. Confirm `applicationId`, `recruiterEmail`, and `interviewerEmails` are populated.

### 2. Signature verification — invalid payload

Send the same POST with a deliberately wrong signature value. Expected: the node throws an error visible in n8n Executions; the flow halts before reaching any downstream node.

### 3. Slots-found path

With valid participant emails configured and the Google Calendar credential authorized, send a well-formed payload for a real application where you know the recruiter and at least one interviewer have some free time in the next 14 days. Expected: `Slots Found?` routes to the true branch; `Slack — Notify Recruiter with Proposed Slots` posts a message to `#scheduling-queue` with at least one proposed slot, the application ID, and the panel member list.

### 4. No-availability path

Temporarily edit the `Candidate Availability Intake` node's `windows` array to return zero windows (empty array). Re-run. Expected: `resolved: false` from the resolver; `Slots Found?` routes to the false branch; `Slack — Escalate No-Availability` posts the escalation message.

### 5. Backstop cron path

Trigger `Daily Backstop Cron — 8am ET weekdays` manually. Expected: `Greenhouse — List Stale Unscheduled Interviews` calls the Harvest API with `created_before=<48h-ago>` (the `scheduled_interviews` endpoint has no `status` query param, so this fetches every interview created more than 48 hours ago); `Filter Stale Unscheduled (client-side)` then drops any interview that already has a confirmed `start.date_time` or is `complete`/`awaiting_feedback`, keeping only the genuinely unscheduled ones; `Split Into Items` outputs one item per remaining interview. If Greenhouse returns an empty array, or every interview is already scheduled, the run ends cleanly with no items — that is correct behavior.

Only after all five paths pass should you activate the Greenhouse webhook trigger and the cron node.
