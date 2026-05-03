# Inbound lead triage and routing — n8n flow

This bundle contains a complete n8n workflow that triages every inbound demo
request the moment it lands. A HubSpot form submission fires a webhook,
the flow normalizes the payload, enriches the company via Apollo, asks
Claude to score the lead against your ICP rubric (with a rule-based
fallback if Claude is slow or returns malformed JSON), writes the score
back to HubSpot, and routes the contact to one of four destinations:
self-serve nurture, SDR queue by territory, AE Slack page, or an ops
alert if anything looks wrong.

A second independent trigger — a nightly cron — sweeps HubSpot for any
demo-submission contact created in the last 26 hours that has no
`icp_score__c` property and replays it through the webhook. This is the
backstop for silent webhook failures.

## What this flow does

The flow has two entry points:

- **Real-time path** — `Webhook — HubSpot Form Submit` accepts
  `POST /webhook/inbound-lead-triage`, immediately returns 202 to
  HubSpot so the form submission is never blocked, and processes the
  lead asynchronously.
- **Nightly backstop** — `Nightly Backstop Cron` (02:15 daily) finds
  any HubSpot contact in `subscriber` lifecycle stage with a
  `recent_conversion_date` in the last 26 hours and no `icp_score__c`,
  then replays each through the webhook with `batchSize: 5,
  batchInterval: 2000ms` so the catch-up doesn't burn through the
  Apollo or Anthropic rate limits.

The scoring prompt enforces a JSON-only response shape and tells Claude
to bias the score down by 1 when firmographics are missing and to cap
free-mail addresses at 4 unless the form responses prove a real role.
If Claude times out (6s) or returns anything other than parseable JSON,
the `Parse Score (with fallback)` Code node computes a deterministic
score from headcount + job title + free-mail status so the flow never
strands a lead.

## Import

1. In n8n, open **Workflows → Import from File** and select
   `inbound-lead-triage-n8n.json`.
2. Open the workflow's **Settings** and confirm `Execution Order` is
   `v1` and `Timezone` matches your business hours (defaults to
   `America/New_York`). The cron and the `recent_conversion_date`
   window both interpret times in this zone.
3. Set the workflow variable `ICP_RUBRIC` (Settings → Variables) to
   your ICP rubric Markdown. Keep it under ~2k tokens — it ships in
   every Claude call.
4. Set the environment variable `N8N_SELF_URL` to the public base URL
   of your n8n instance so the backstop can call its own webhook.
5. Activate the workflow only after the credentials below are wired
   and you've completed the first-run verification.

## Credentials

### `PLACEHOLDER_HUBSPOT_CRED_ID` — HubSpot OAuth

Used by `HubSpot — Upsert Score`, `HubSpot — Create SDR Task (mid)`,
and `HubSpot — Find Missed Submissions`. Create a private app in
HubSpot with scopes `crm.objects.contacts.read`,
`crm.objects.contacts.write`, and `crm.objects.tasks.write`. In n8n,
add a **HubSpot OAuth2 API** credential and complete the OAuth dance.
Before activating, create the custom contact properties
`icp_score__c` (number 1-10), `icp_score_reasoning__c` (single-line
text), `icp_pain_hypothesis__c` (single-line text), and
`icp_scoring_method__c` (single-line text, values `claude` or
`rule-based`).

### `PLACEHOLDER_APOLLO_CRED_ID` — Apollo

Used by `Apollo — Enrich Domain`. In Apollo, generate an API key under
**Settings → Integrations → API**. In n8n, add an **HTTP Header Auth**
credential with header name `X-Api-Key` and value set to the key.
Apollo's organization-enrich endpoint is rate-limited per plan; the
node is configured with `neverError: true` so a 429 or timeout flows
through to the rule-based fallback rather than killing the run.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic

Used by `Claude — Score Lead`. Generate an API key at
`https://console.anthropic.com`. In n8n, add an **HTTP Header Auth**
credential with header name `x-api-key` and value set to the key. The
node uses `claude-haiku-4-5` to keep the call under a second on the
typical payload; swap to `claude-sonnet-4-6` only if you see scoring
quality drop in your weekly audit.

### `PLACEHOLDER_GSHEETS_CRED_ID` — Google Sheets

Used by `Sheets — Territory Lookup`. Add a **Google Sheets OAuth2 API**
credential. The sheet referenced by `PLACEHOLDER_TERRITORY_SHEET_ID`
must have a tab named `Territories` with columns `country`,
`sdr_email`, `sdr_owner_id`, `sdr_slack_handle`, `ae_email`,
`ae_owner_id`, `ae_slack_handle`. Include a `default` row keyed on
country code `*` so leads without a country still route somewhere.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

Used by `Slack — Page AE (high)` and `Slack — Ops Alert (unrouted)`.
Create a Slack app, add the `chat:write` bot scope, install it to the
workspace, and invite the bot user to `#inbound-hot` and
`#inbound-ops-alerts`. In n8n, add an **HTTP Header Auth** credential
with header name `Authorization` and value `Bearer xoxb-...`.

### `PLACEHOLDER_SMTP_CRED_ID` — SMTP

Used by `Email — Self-serve Nurture (low)`. Any transactional SMTP
provider works (Postmark, SendGrid, SES). Replace the
`fromEmail: no-reply@example.com` and the four `https://example.com/...`
links in the HTML body before activating.

## First-run verification

Before enabling the HubSpot trigger that fires this webhook in
production, prove every branch with manual inputs:

1. **Low-score path.** Use n8n's **Execute Workflow** on the webhook
   node with a test payload from a free-mail address
   (`{ "body": { "contactId": "test-1", "contact": { "email":
   "test@gmail.com", "firstName": "Pat", "company": "Acme" } } }`).
   Expected: score capped at 4, the `Email — Self-serve Nurture (low)`
   branch fires, HubSpot upsert writes `icp_score__c: 4`.
2. **Mid-score path.** Send a payload with a corporate domain you
   know Apollo enriches (your own company is fine). Expected: score
   between 4 and 7, `HubSpot — Create SDR Task (mid)` creates a task
   on the contact.
3. **High-score path.** Manually edit the `Parse Score` node output to
   force `score: 9` and run from there. Expected: Slack message lands
   in `#inbound-hot` with the company name and pain hypothesis.
4. **Claude failure path.** Temporarily revoke the Anthropic
   credential and run any payload. Expected: `scoringMethod:
   "rule-based"` in the HubSpot record and the lead routes by the
   deterministic rule.
5. **Backstop path.** In HubSpot, set one test contact to lifecycle
   `subscriber` with a recent conversion event and no `icp_score__c`,
   then trigger `Nightly Backstop Cron` manually. Expected: the
   contact appears in the search results and gets replayed through
   the webhook within one batch interval.

Only after all five paths complete cleanly should you enable the
HubSpot workflow that pushes form submissions to this webhook.
