# Visitor de-anon to outreach — n8n flow

This bundle contains a complete n8n workflow that turns person-level website de-anonymization signals from **Warmly** and **RB2B** into ICP-filtered, CRM-aware warm outreach. It catches each identified visitor from the vendor's outgoing webhook, scores the person against a configurable ICP rubric (dropping everyone who doesn't fit), deduplicates within a week-level window, checks Salesforce for an existing contact and any active motion, routes the survivor to the account owner or a territory SDR pool, drafts a warm first-touch with Claude anchored to the exact page the person viewed, posts a Slack card to the assignee, and creates a Salesforce Lead (net-new person) or Task (existing contact).

One entry point:

- **Webhook** — `Webhook — Visitor Deanon Ingest` accepts `POST /webhook/visitor-deanon` from Warmly (Settings → Webhooks) and RB2B (Integrations → Webhook / Zapier), or any system that can POST a person-level payload.

## What this flow does

`Normalize Visitor Payload` maps three payload shapes — RB2B (space-cased field names, `Captured URL`), Warmly (nested `contact` / `company` / `signal`), and a generic fallback — into one internal person record. The `pageViewed` field (RB2B `Captured URL` / Warmly signal referrer) is the load-bearing input for the warm draft.

`ICP Fit Gate` is what separates this flow from a plain intent router. It scores each person against a readable rubric — title function (+2), seniority (+1), company-size band (+1), country (+1), high-intent page like `/pricing` or `/demo` (+2) — and hard-drops title-denylist matches (student, intern, agency recruiter, job-seeker) and off-allowlist countries. Anyone below `ICP_FIT_THRESHOLD` (default 3) is dropped and never reaches a rep. The `fitScore` and reasons are attached so a passing visitor's Slack card shows why they qualified, and a misconfigured rubric is auditable from execution history.

`Dedup Gate (Static Data)` uses n8n workflow static data — `$getWorkflowStaticData('global')` — to hold a per-person-per-ISO-week key. Week-level (not day-level) is the right window for warm outreach: someone who visits three times in five days should generate one rep touch. Static data is the only correct way to persist cross-execution state from a Code node — n8n's public REST API has **no** static-data resource — and it only persists for **production** executions (webhook / schedule trigger), not manual runs. The node stamps the key before any external call (race-safe) and prunes prior weeks.

`Salesforce — Contact Lookup` finds an existing contact by exact email and returns the owner plus three suppression signals: open opportunity, active sequence (`Current_Sequence__c`), and customer account type. `Routing & Suppression Logic` suppresses the touch (drops silently) when an existing contact is mid-motion; otherwise it routes an existing clean contact to the account owner (→ Task) or a net-new person to a territory SDR pool (→ Lead).

`Claude — Draft Warm First Touch` generates a three-part draft (subject, body, talking point) anchored to the page viewed. The draft is explicitly a starting point — identity is probabilistic — and the flow never sends. `Slack — Notify Assignee` posts the context and draft to `#visitor-deanon`, leading with the LinkedIn URL for one-click identity verification. `Salesforce — Create Record` writes a Lead or Task.

## Import

1. In n8n, open **Workflows → Import from File** and select `visitor-deanon-to-outreach-n8n.json`.
2. Open the workflow's **Settings** and confirm `Execution Order` is `v1` and `Timezone` matches your business hours (defaults to `America/New_York`). The dedup window rolls over on the ISO-week boundary in UTC; if you need it aligned to a local week, adjust the week derivation in `Dedup Gate (Static Data)`.
3. Set the environment variables in the **Environment variables** section below.
4. Wire the three credentials in the **Credentials** section.
5. Read and tune the **ICP rubric** in `ICP Fit Gate` to your definition of fit.
6. Point the Warmly and RB2B webhooks at your n8n URL (**Webhook setup** below).
7. Activate the workflow only after the **First-run verification** below passes.

## Environment variables

Set these in your n8n instance's environment (n8n Cloud: **Settings → Environment Variables**; self-hosted: your `.env` file or container environment). Every variable has an in-code fallback, so a missing one won't throw — but the ICP defaults are generic, so set them before going live.

| Variable | What it does | Example |
|---|---|---|
| `SFDC_INSTANCE_URL` | Salesforce Setup → Company Information → Salesforce.com Base URL | `https://yourorg.my.salesforce.com` |
| `SFDC_ACCESS_TOKEN` | Salesforce OAuth access token (see note below) | `00D…` |
| `ICP_MIN_EMPLOYEES` | Lower bound of the in-ICP company-size band | `25` |
| `ICP_MAX_EMPLOYEES` | Upper bound of the in-ICP company-size band | `5000` |
| `ICP_FIT_THRESHOLD` | Minimum fit score to pass the gate | `3` |
| `ICP_COUNTRY_ALLOWLIST` | Comma-separated ISO country codes; empty = allow all | `US,CA,GB` |
| `ICP_TITLE_ALLOWLIST` | Comma-separated lowercase title substrings that score +2 | `revops,sales,marketing,growth,founder` |
| `ICP_TITLE_DENYLIST` | Comma-separated lowercase substrings that hard-drop | `student,intern,seeking,recruiter,job` |
| `SDR_POOL_AMER_EMAIL` | SDR pool lead email for AMER territory | `sdr-amer@yourcompany.com` |
| `SDR_POOL_AMER_SLACK` | Slack handle (no @) for AMER SDR pool | `sdr-amer` |
| `SDR_POOL_EMEA_EMAIL` | SDR pool lead email for EMEA territory | `sdr-emea@yourcompany.com` |
| `SDR_POOL_EMEA_SLACK` | Slack handle (no @) for EMEA SDR pool | `sdr-emea` |
| `SDR_POOL_ROW_EMAIL` | SDR pool lead email for ROW territory | `sdr-row@yourcompany.com` |
| `SDR_POOL_ROW_SLACK` | Slack handle (no @) for ROW SDR pool | `sdr-row` |

The `SFDC_ACCESS_TOKEN` rotates. For production, use a Connected App with OAuth 2.0 client-credentials flow and a short-lived token refresh, or the Salesforce OAuth2 credential in n8n instead of the raw Bearer token.

## Credentials

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic

Used by `Claude — Draft Warm First Touch`. Generate an API key at `https://console.anthropic.com`. In n8n, add an **HTTP Header Auth** credential with header name `x-api-key` and value set to the key. The node uses `claude-haiku-4-5` to keep latency under ~2 seconds on a typical person payload. Swap to `claude-sonnet-4-6` only if draft quality is consistently off for a segment — roughly 10× the cost.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack

Used by `Slack — Notify Assignee`. Create a Slack app with a bot token (`xoxb-…`) that has `chat:write` scope, and invite the bot to `#visitor-deanon`. In n8n, add an **HTTP Header Auth** credential with header name `Authorization` and value `Bearer xoxb-…`.

### `PLACEHOLDER_SALESFORCE_CRED_ID` — Salesforce

Used by `Salesforce — Contact Lookup` and `Salesforce — Create Record`. For a quick pilot, add an **HTTP Header Auth** credential with header name `Authorization` and value `Bearer <sfdc_token>`. For production, use a Connected App (OAuth 2.0 client credentials) so the token refreshes automatically.

## Salesforce fields used

The flow reads `Current_Sequence__c` on the Contact object as an active-sequence suppression signal, and the standard `Owner.Slack_Handle__c` custom field on User for Slack @-mentions. If your org doesn't have these:

- **`Current_Sequence__c` (Contact, Text)** — set by your sequencer's integration when a contact is enrolled; if you don't populate it, the suppression check simply never fires on that signal (open opportunity and customer type still work). Remove the field from the SOQL in `Salesforce — Contact Lookup` if it doesn't exist, or the query errors.
- **`Slack_Handle__c` (User, Text)** — the owner's Slack handle for @-mentions. If absent, remove it from the SOQL; the flow falls back to no @-mention.

No custom fields are required on Lead or Task — the flow uses only standard fields (`LeadSource`, `Description`, `WhoId`, `WhatId`, etc.).

## Webhook setup

- **Warmly** — **Settings → Webhooks**, add `https://<your-n8n-host>/webhook/visitor-deanon`, save. Configure the orchestrator to fire the webhook on an identified-visitor event.
- **RB2B** — **Integrations → Webhook** (or the **Zapier** integration with a "Catch Hook" → POST to the same URL). RB2B sends person-level fields (LinkedIn URL, First/Last Name, Title, Company Name, Business Email, Website, Industry, Employee Count, Captured URL, Referrer, etc.).

## First-run verification

Run these against the **live** webhook URL (not the Execute Workflow button — static data and production behavior only apply to real webhook executions). Sample payloads are minimal; add fields as needed.

1. **In-ICP passes and drafts.** POST an RB2B-shaped payload for a clearly in-ICP person on a high-intent page:

   ```bash
   curl -X POST https://<your-n8n-host>/webhook/visitor-deanon \
     -H 'Content-Type: application/json' \
     -d '{"First Name":"Jordan","Last Name":"Lee","Title":"VP Sales","Company Name":"Acme","Website":"acme.com","Business Email":"jordan@acme.com","Employee Count":"400","Industry":"Software","State":"CA","Captured URL":"https://yoursite.com/pricing","LinkedIn URL":"https://linkedin.com/in/jordanlee"}'
   ```

   Expect: a Slack card in `#visitor-deanon` with a fit score ≥ 3 and a draft, and a new Salesforce Lead (no matching contact).

2. **Out-of-ICP drops at the gate.** POST a payload that should fail — a student, or a sub-`ICP_MIN_EMPLOYEES` company:

   ```bash
   curl -X POST https://<your-n8n-host>/webhook/visitor-deanon \
     -H 'Content-Type: application/json' \
     -d '{"First Name":"Sam","Last Name":"Kim","Title":"Student","Company Name":"University","Website":"uni.edu","Business Email":"sam@uni.edu","Employee Count":"3","State":"NY","Captured URL":"https://yoursite.com/blog/post"}'
   ```

   Expect: no Slack card, no Salesforce record. Check the execution — it should stop at `ICP Fit Gate`.

3. **Dedup drops the repeat.** Re-run the payload from step 1 within the same week.

   Expect: no second Slack card. The execution stops at `Dedup Gate (Static Data)`. (This only works against the live webhook — manual runs don't persist static data.)

4. **Existing contact → Task, not Lead.** POST step 1's payload with an email that already exists as a Salesforce Contact whose account has no open opportunity and no active sequence.

   Expect: a Task on the existing contact assigned to the account owner (not a Lead), and a Slack card that reads "existing contact → Task."

5. **Suppression holds.** Repeat step 4 with a contact whose account has an open opportunity (or a customer account type).

   Expect: no Slack card, no record — the execution stops at `Routing & Suppression Logic`.

## Notes and limits

- **Identity is probabilistic.** RB2B's person-level identification runs roughly 50-70% accurate on US ICP traffic; Warmly resolves ~15-25% of visitors (largely account-level). The Slack card leads with the LinkedIn URL so the SDR verifies before sending. The flow never auto-sends.
- **Compliance is out of scope for this flow.** Restrict the snippet to US traffic in Warmly/RB2B, run identified people through your suppression list, and review CA/VA/CO/CT handling with counsel. The `ICP_COUNTRY_ALLOWLIST` is a routing convenience, not a legal control.
- **Static data self-cleans.** The dedup node prunes prior-week keys on every run, so the store doesn't grow unbounded; no separate maintenance cron is needed.
