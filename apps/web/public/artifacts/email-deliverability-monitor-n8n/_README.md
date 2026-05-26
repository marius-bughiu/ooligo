# Email deliverability monitor — n8n flow

This bundle contains a complete n8n workflow that polls Google Postmaster Tools, parses DMARC aggregate reports from a shared IMAP mailbox, runs DNSBL lookups across the major public blocklists, and pulls bounce / complaint metrics from Smartlead and Instantly — then alerts the assigned RevOps owner in Slack the moment any watched domain crosses a documented threshold, with a Claude-drafted remediation step attached.

Three entry points:

- **Hourly Sweep** — `Schedule — Hourly Sweep` fires at the top of every hour and runs the Postmaster, ESP, and DNSBL branches in parallel against every domain in the register.
- **DMARC Poll** — `Schedule — DMARC Poll` runs every 15 minutes and checks the IMAP mailbox for new DMARC aggregate reports.
- **Ad-hoc check** — `Webhook — Ad-hoc Domain Check` accepts `POST /webhook/deliverability-check` for one-off checks against a single domain.

## What this flow does

The hourly sweep loads the static domain register, fans out a Split In Batches (size 3 to stay under the per-second limits on Postmaster Tools and the public DNSBL zones), and runs four parallel polls per domain: Postmaster Tools `trafficStats` for the last 7 days, Smartlead `campaign-statistics` if the domain's `sendingPlatform` is `smartlead`, Instantly `accounts/health` if it's `instantly`, and a DNSBL probe that resolves the MX → IP → queries each configured blocklist zone via two of three resolvers.

The branches converge in `Merge — Per-Domain Snapshot`, which collapses each upstream's shape into one record per `(domain, sourceMetric, dateBucket)` and rejects records older than 26 hours. `Threshold Check (Code)` then applies per-metric alert and critical thresholds against the latest point AND a trailing 7-day rolling mean of the prior points. The thresholds default to the Gmail/Yahoo bulk-sender envelope (spam rate alert at 0.1%, critical at 0.3%) and are overridable via env vars.

`Dedup Gate (Static Data)` reads `$getWorkflowStaticData('global')` for a 12-hour-bucketed `alerted_<domain>_<metric>_<status>` key. If the same alert fired in the last 12 hours, the branch halts silently. Otherwise the gate stamps the key and continues. Static data persists only on production executions — never on manual Execute Workflow runs — which is why the verification below uses live triggers, not the manual-run button.

`Claude — Remediation Draft` posts to the Anthropic API with `claude-haiku-4-5`, an 8-second timeout, and a system prompt that asks for a structured JSON remediation with three fields: `action`, `why`, and `runbookUrl`. The system prompt names what the reader can actually do — pause a sequence, open a delisting request, run a list scrub — so the draft is runnable, not advisory. `Parse Remediation` falls back to a deterministic per-metric template when the LLM call times out or the response fails to parse, and tags `draftSource` so the rep sees whether they got `claude-haiku-4-5` or `template-fallback`.

`Slack — Notify` posts to one of three channels based on alert status and domain severity, using a Block Kit message with a header (severity color), a fields grid (metric, value, alert/critical thresholds, 7-day mean, severity), the remediation as a section block, and a context block @-mentioning the domain owner.

The DMARC branch is independent: `IMAP — DMARC Mailbox` reads new messages matching the `Report Domain` subject pattern, `Parse DMARC XML` unzips `.gz` / `.zip` attachments and walks the XML, and the resulting per-record rows feed into the same `Merge — Per-Domain Snapshot` node. DMARC records with both SPF and DKIM evaluating to `fail` are tagged `spoofingSuspect: true` — the only branch in the flow that can catch a forged-sender attack from outside your sending platforms.

## Import

1. In n8n, open **Workflows → Import from File** and select `email-deliverability-monitor-n8n.json`.
2. Open the workflow's **Settings** and confirm `Execution Order` is `v1` and `Timezone` matches your business hours (defaults to `America/New_York`). The cron expression interprets its schedule in this zone.
3. Edit the `Domain Register (Static)` Code node to your real domains. The default array contains three placeholder entries (`outbound.example.com`, `warm.example.io`, `news.example.com`); replace them.
4. Set the environment variables listed below.
5. Wire all five credentials listed in the Credentials section.
6. Run the five-step verification before activating either Schedule Trigger.

## Domain Register

The watched domains live in the `Domain Register (Static)` Code node — not in env vars, not in a database. The list is short, and putting it in the workflow keeps the version history in n8n's workflow versions alongside the threshold logic.

Each entry:

| Field | Values | Purpose |
|---|---|---|
| `domain` | the FQDN you send from (e.g. `outbound.example.com`) | Used as the API parameter for Postmaster, Smartlead, Instantly; used for MX lookup in DNSBL probe |
| `sendingPlatform` | `smartlead` / `instantly` / `outreach` / `gmail-direct` | Routes which ESP API gets polled (other branches no-op) |
| `owner` | email | Recorded in alert context |
| `slackHandle` | Slack handle without `@` | @-mentioned in the alert |
| `severity` | `primary` / `warmup` / `secondary` | Drives channel routing and on-call paging |

## Environment variables

Set these in your n8n instance's environment (n8n Cloud: **Settings → Environment Variables**; self-hosted: your `.env` file or container environment):

| Variable | Where to find it | Example |
|---|---|---|
| `DNSBL_ZONES` | Comma-separated list of blocklist zones to query. Defaults to Spamhaus, Barracuda, SpamCop. | `zen.spamhaus.org,b.barracudacentral.org,bl.spamcop.net` |
| `DNSBL_RESOLVERS` | Comma-separated resolver IPs. The probe queries 2-of-3 by default. | `8.8.8.8,1.1.1.1,9.9.9.9` |
| `SPAM_RATE_ALERT_THRESHOLD` | Decimal — value at which the alert fires. Default 0.001 (0.1%). | `0.001` |
| `SPAM_RATE_CRITICAL_THRESHOLD` | Decimal — value at which the critical fires. Default 0.003 (0.3%, the Gmail/Yahoo bulk-sender ceiling). | `0.003` |
| `BOUNCE_RATE_ALERT_THRESHOLD` | Decimal — alert. Default 0.05. | `0.05` |
| `BOUNCE_RATE_CRITICAL_THRESHOLD` | Decimal — critical. Default 0.10. | `0.10` |
| `COMPLAINT_RATE_ALERT_THRESHOLD` | Decimal — alert. Default 0.0008 (0.08%). | `0.0008` |
| `COMPLAINT_RATE_CRITICAL_THRESHOLD` | Decimal — critical. Default 0.003. | `0.003` |
| `POSTMASTER_MIN_POINTS_FOR_CRITICAL` | Integer — minimum trailing-72h points required before a Postmaster critical fires. Downgrades to alert when fewer points are available. | `2` |
| `SLACK_CHANNEL_CRITICAL` | Channel name (with `#`) for critical alerts. | `#deliverability-primary` |
| `SLACK_CHANNEL_WARMUP` | Channel for warmup-severity alerts. | `#deliverability-warmup` |
| `SLACK_CHANNEL_SECONDARY` | Channel for secondary-severity alerts. | `#deliverability-secondary` |

The DNSBL public lists allow non-commercial query volume free of charge. If your domain register grows past roughly 30 watched domains, switch to a paid data feed for the Spamhaus zone you query most often — public-resolver rate limits will start to drop queries silently.

## Credentials

### `PLACEHOLDER_POSTMASTER_CRED_ID` — Google Postmaster OAuth

Used by `HTTP — Postmaster Tools`. Postmaster Tools requires a Google Workspace account with the domain already verified in `https://postmaster.google.com`. Create an OAuth 2.0 client in Google Cloud Console with the `https://www.googleapis.com/auth/postmaster.readonly` scope, add it as a **Google OAuth2 API** credential in n8n, and authorize against the same account that owns the Postmaster Tools verification.

### `PLACEHOLDER_IMAP_CRED_ID` — DMARC RUA Mailbox

Used by `IMAP — DMARC Mailbox`. Create a dedicated mailbox (`dmarc-reports@yourcompany.com` is the convention) and point every DMARC RUA record at it. In n8n, add an **IMAP** credential with the mailbox host, port (993 for IMAPS), username, and an app password if your provider requires one. Google Workspace and Microsoft 365 both require app passwords or service-account delegation rather than the primary account password.

### `PLACEHOLDER_SMARTLEAD_CRED_ID` — Smartlead API key

Used by `HTTP — Smartlead Stats`. Generate an API key in Smartlead under **Settings → API Keys**. In n8n, add an **HTTP Header Auth** credential with header name `Authorization` and value `Bearer <your_key>`. Smartlead's API rate-limit is 1 request/second per key as of 2026-05; the Split In Batches batch size of 3 with the default Schedule Trigger interval of 1 hour stays well under this.

### `PLACEHOLDER_INSTANTLY_CRED_ID` — Instantly API key

Used by `HTTP — Instantly Health`. Generate an API key in Instantly under **Settings → Integrations → API Keys**. In n8n, add an **HTTP Header Auth** credential with header name `Authorization` and value `Bearer <your_key>`. Instantly's `/api/v2` endpoints require an account on the Growth plan or above.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

Used by `Slack — Notify`. Create a Slack app at `https://api.slack.com/apps`, add the `chat:write` bot scope, install it to your workspace, and invite the bot user to each of the three deliverability channels. In n8n, add an **HTTP Header Auth** credential with header name `Authorization` and value `Bearer xoxb-…`. Create the channels (`#deliverability-primary`, `#deliverability-warmup`, `#deliverability-secondary`, `#deliverability-ops`) before activating; the channel names are env-overridable but must exist.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic API key

Used by `Claude — Remediation Draft`. Generate an API key at `https://console.anthropic.com`. In n8n, add an **HTTP Header Auth** credential with header name `x-api-key` and value set to the key. The node uses `claude-haiku-4-5` to keep the call under 2 seconds at typical payload size. Cost is roughly $0.005 per alert on the median payload (~500 input + 120 output tokens).

## DMARC mailbox setup

For each watched domain, the DNS DMARC record should look like:

```
_dmarc.outbound.example.com.  IN  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yourcompany.com; ruf=mailto:dmarc-reports@yourcompany.com; fo=1; adkim=r; aspf=r; pct=100"
```

Use `p=quarantine` or `p=reject` once you have established baseline reports show all legitimate sources passing. Starting on `p=none` will produce reports but no quarantining — the alert flow works either way; the policy choice is unrelated.

Most major mailbox providers deliver DMARC XML attachments without rewriting. Three known sources of silent attachment loss:

1. **Microsoft 365 with the default Anti-Malware Policy** — the Common Attachment Filter strips `.zip` from inbound mail. Setting: **Microsoft 365 Defender → Email & collaboration → Policies & rules → Anti-malware → Default policy → Protection settings → Common Attachment Filter → File types**. Remove `zip` from the blocked list, or create a transport rule that exempts messages from `dmarc-reports@yourcompany.com`.
2. **Gmail with strict attachment scanning** — `.gz` files are sometimes flagged. Gmail does not strip them but may quarantine the message. If reports stop arriving from a specific reporter, check the Quarantine in Google Workspace admin.
3. **Provider-side rewriting** — a few providers rename `.gz` to `.gz_renamed`. The parser will skip these and log `attachmentMatched: false`. Add a filename rule at the mailbox level to revert the name.

## Verification

Run all five before activating either Schedule Trigger. The flow should NOT be Active during steps 1-4.

### 1. Manual webhook hit against a known domain

POST a single-domain check to the webhook endpoint:

```bash
curl -X POST "https://<your-n8n-host>/webhook/deliverability-check" \
  -H "Content-Type: application/json" \
  -d '{"domain": "outbound.example.com"}'
```

Expected: 202 response, and within ~30 seconds you see the Slack message in `#deliverability-primary` IF the domain has any threshold trip. If not, the execution log in n8n should show all four branches running with `status: ok` outputs from `Threshold Check (Code)`.

### 2. Forced threshold trip

Temporarily set `SPAM_RATE_ALERT_THRESHOLD=0` and `SPAM_RATE_CRITICAL_THRESHOLD=0`, then re-run the manual webhook. Every Postmaster point will trip. You should see one Slack alert per domain — NOT multiple, because the dedup gate within a 12-hour window collapses them. Reset the env vars afterward.

### 3. Stale-report test

Edit `Merge — Per-Domain Snapshot` temporarily to set the `MAX_AGE_MS` constant to `0`. Re-run. Every Postmaster record should be rejected (collected-at older than 0ms), and you should see the resulting `status: ok` (no data → no alert) rather than spurious alerts on missing data. Revert the constant.

### 4. DNSBL false-positive test

In `DNSBL Probe (Code)`, hardcode a known-clean IP (e.g. `8.8.8.8`) in place of the MX lookup result and re-run. The probe should return `dnsblStatus: ok` with an empty `listings` array. Then hardcode a known-listed test IP from `127.0.0.2` (the standard Spamhaus self-test address — listed on `zen.spamhaus.org` by design) and confirm `dnsblStatus: critical` with the listing recorded. Revert.

### 5. Multi-domain burst test

Add five extra domains to `Domain Register (Static)` temporarily and run the manual webhook. Confirm the Split In Batches handles them without rate-limit errors from Postmaster Tools. The execution log should show the second batch starting ~1 second after the first. Revert.

After verifying all five, set both Schedule Triggers to Active and confirm the next top-of-hour execution runs cleanly in production mode (the dedup gate's static data only persists on production runs).

## Known limits

1. **Single-file zip assumption.** `Parse DMARC XML` uses a minimal zip reader that assumes one file per archive (the DMARC norm). Multi-file zips will fail to parse. If you see `dmarc-parse-error` rows with `error: 'not a zip'` for `.zip` attachments, replace the unwrap function with a real zip library (`adm-zip` is available in most n8n environments).
2. **Postmaster Tools data lag.** Google publishes the previous day's data in batches throughout the next day. The `POSTMASTER_MIN_POINTS_FOR_CRITICAL` env var downgrades single-point days from critical to alert; do not lower it below 2 without accepting noisier paging.
3. **DNSBL public-resolver rate limits.** Spamhaus, Barracuda, and SpamCop all rate-limit queries from common public resolvers. At a register size of 5-10 domains with hourly polling this is well within limits; past ~30 domains, switch the high-volume zone to a paid data feed.
4. **No automatic delisting requests.** The flow surfaces the delisting URL in the Claude remediation draft. Filing the request still requires a human; most blocklists require account creation and a reason-for-listing explanation.
5. **Not runtime-tested in this repo.** The bundle is a complete export and has been hand-walked node by node, but it has not been imported into a live n8n instance against a production Google Workspace and Smartlead account. Treat the verification above as a real first run, not a smoke test.
