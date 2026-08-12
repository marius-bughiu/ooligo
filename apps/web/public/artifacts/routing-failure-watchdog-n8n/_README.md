# Routing Failure Watchdog — n8n bundle

Watches lead routing from the outside and pages a human before the reps notice. Three detectors run every 15 minutes over one Salesforce query; a fourth runs once a weekday morning over an aggregate query. Findings are deduplicated, auto-resolved when the condition clears, and split between PagerDuty (things the on-call can fix now) and Slack (things a manager reads at 09:00).

Files:

- `routing-failure-watchdog-n8n.json` — the complete workflow export, 20 nodes.
- `_README.md` — this file.

---

## 1. Import

1. n8n → **Workflows → Import from File** → `routing-failure-watchdog-n8n.json`.
2. Open **Settings** on the imported workflow. The export ships `executionOrder: v1` and `timezone: America/New_York`. **Change the timezone to your org's operating timezone** — both cron expressions read it, and the 08:00 fairness job's window boundary depends on it.
3. Do not activate yet. Section 5 verifies each branch first.

The two triggers are independent:

| Trigger | Cron | Timezone source |
|---|---|---|
| `Schedule — Routing Sweep` | `*/15 * * * *` | workflow settings |
| `Schedule — Fairness + Digest 08:00` | `0 8 * * 1-5` | workflow settings |

`BUSINESS_HOURS_TZ` is a *separate* setting from the workflow timezone. The workflow timezone decides when the flow wakes up; `BUSINESS_HOURS_TZ` decides which minutes count against an SLA. They are usually the same value and do not have to be — a US-East n8n instance watching a London sales team sets `America/New_York` on the workflow and `Europe/London` on the business clock.

---

## 2. Credentials

### 2a. Salesforce — `PLACEHOLDER_SALESFORCE_OAUTH2_CRED_ID`

Type: **OAuth2 API** (generic), used by four HTTP Request nodes.

Create a Connected App in Salesforce (**Setup → App Manager → New Connected App**) with OAuth enabled and the `api` and `refresh_token` scopes. The watchdog is a job, not a person, so use the **client credentials** flow and set a Run As user on the Connected App policy — an integration user whose profile can read the routed object, `User`, `Task`, and (if you enable it) `LeanData__Log__c`.

In n8n:

| Field | Value |
|---|---|
| Grant Type | Client Credentials |
| Access Token URL | `https://<your-domain>.my.salesforce.com/services/oauth2/token` |
| Client ID / Secret | from the Connected App |
| Authentication | Send as Body |

Give the Run As user **read-only** access. The workflow issues no writes anywhere — every Salesforce call in the export is a `GET` against `/query/` or `/limits`. If your integration user has write permissions, that is your org's choice and not something this flow needs.

### 2b. Slack — `PLACEHOLDER_SLACK_CRED_ID`

Type: **Slack API**. A bot token with `chat:write`, invited to both channels. Nothing else is required — the flow posts Block Kit and never reads a channel.

### 2c. PagerDuty — no n8n credential

PagerDuty's Events API v2 authenticates with the `routing_key` inside the request body, not a header, so there is no credential object. Create an **Events API v2** integration on the service that owns your RevOps on-call rotation and put its integration key in `PAGERDUTY_ROUTING_KEY`.

Treat that key as a secret: anything holding it can open incidents on your rotation.

---

## 3. Environment variables

Set these on the n8n instance (self-hosted: the container environment; n8n Cloud: **Settings → Variables**, referenced identically as `$env.NAME`).

### Required

| Variable | Example | What it does |
|---|---|---|
| `SFDC_INSTANCE_URL` | `https://acme.my.salesforce.com` | Base for every REST call. No trailing slash needed; the flow strips one. |
| `PARKING_OWNER_IDS` | `00G5f000004ABCD,0055f00000XYZAB` | **The unrouted detector does not work without this.** See section 4. |
| `SLACK_CHANNEL_ID` | `C08ABCDEF12` | Channel for posts and resolves. |
| `PAGERDUTY_ROUTING_KEY` | `R0ABCDEF...` | Events API v2 integration key. |

### Thresholds — set these deliberately

| Variable | Default | What it does |
|---|---|---|
| `UNROUTED_GRACE_MINUTES` | `10` | Business minutes a record may sit in a parking queue before it counts. Below your routing platform's own processing latency this generates pure noise. |
| `UNROUTED_BACKLOG_WARN` | `25` | Parked-record count that posts to Slack. |
| `UNROUTED_BACKLOG_PAGE` | `100` | Parked-record count that pages the on-call. |
| `ROUTING_SLA_MINUTES` | `2` | Business minutes from create to owner. Breaches **page** — this is the router failing. |
| `RESPONSE_SLA_MINUTES` | `5` | Business minutes from owner to first logged touch. Breaches **post** — this is a rep, and never pages. |
| `RENOTIFY_MINUTES` | `120` | How long a fired condition stays suppressed before re-alerting. |
| `MAX_ITEMS_PER_ALERT` | `25` | Sample size carried in an alert payload; the count is always exact. |

### Optional

| Variable | Default | What it does |
|---|---|---|
| `SFDC_API_VERSION` | `v67.0` | Summer '26. Older orgs can drop this; `TYPEOF` needs 46.0 or later. |
| `SFDC_API_BUDGET_PCT` | `85` | Org-wide API usage at which the watchdog stands down and says so. |
| `ROUTING_OBJECT` | `Lead` | `Case` and custom objects work if they carry `OwnerId`, `IsConverted`, and child `Tasks`. Drop `IsConverted` from `Build Sweep Query` for objects without it. |
| `LOOKBACK_HOURS` | `48` | Sweep window. Keep it under your LeanData log retention if you enable that branch. |
| `SWEEP_ROW_CAP` | `2000` | Row cap. Hitting it produces an explicit `truncated_sweep` finding rather than silently short counts. |
| `ROUTING_TS_FIELD` | *(unset)* | API name of a routed-at field on the object, if you stamp one. The most reliable routing clock available. |
| `LEANDATA_LOG_ENABLED` | `false` | Turn on to derive the routing clock from `LeanData__Log__c`. |
| `LEANDATA_RECORD_ID_FIELD` | `LeanData__Lead__c` | The Log field pointing back at the routed record. **Verify this against your own org** — see section 4. |
| `BUSINESS_HOURS_TZ` | `America/New_York` | IANA zone for the SLA clock. |
| `BUSINESS_HOURS_START_MIN` | `480` | Minutes past midnight, so 08:00. |
| `BUSINESS_HOURS_END_MIN` | `1080` | 18:00. |
| `BUSINESS_DAYS` | `1,2,3,4,5` | 0 = Sunday. |
| `BUSINESS_HOLIDAYS` | *(unset)* | `2026-11-26,2026-12-25`. Excluded from the SLA clock. |
| `STAMPEDE_MIN_BATCH` | `250` | Parked-record count above which a single-source cluster is read as a bulk import, not a failure. |
| `STAMPEDE_SUPPRESS_MINUTES` | `30` | Reported in the suppression message. |
| `RR_POOL_OWNER_IDS` | *(unset)* | Round-robin pool members. Fewer than two disables the fairness check. |
| `RR_WINDOW_DAYS` | `7` | Fairness window. |
| `RR_MIN_ASSIGNMENTS` | `40` | Pool-total floor below which share is not computed at all. |
| `RR_MIN_SHARE_RATIO` | `0.5` | Fraction of equal share below which a member is "starved". |

---

## 4. The two settings that decide whether this works

### `PARKING_OWNER_IDS`

`Lead.OwnerId` is never null. When no assignment rule matches, Salesforce assigns the record to the **Default Lead Owner** in **Setup → Lead Settings**. There is no field that says "this lead was not routed" — the record looks owned, by design.

So the unrouted detector is a membership test against a set you configure, not a null test. Populate it with:

1. The Default Lead Owner from Lead Settings (user or queue).
2. Every unsorted / holding / catch-all queue your assignment rules or routing graph can drop into.
3. Any queue a routing platform uses as its own error or fallback destination.

Get the Ids from **Setup → Queues** (the URL carries the `00G...` Id) or **Setup → Users** for a user owner. Both 15- and 18-character forms work; the flow compares on the 15-character prefix, because pasting a 15-character Id from the URL bar and comparing it to the 18-character Id the API returns is the most common way this detector ends up matching nothing and reporting a permanent all-clear.

Leaving this unset does not fail silently. The flow emits a `parking_unconfigured` finding on every sweep until you set it.

### `LEANDATA_RECORD_ID_FIELD`

Enable the LeanData branch only if you have no routed-at field of your own. LeanData writes one `LeanData__Log__c` row per record per trip through a deployed routing graph, and that row's `CreatedDate` is a usable routing timestamp. Two things to know:

- **Retention defaults to 90 days**, configurable under LeanData Dashboard → Admin → Settings → Reporting. Keep `LOOKBACK_HOURS` well inside it. A missing log row means "not routed" *or* "aged out", and the flow will not guess: it marks `routedAtSource: 'none'` and leaves the routing clock dark for that record rather than defaulting to `CreatedDate` and reporting a fake latency of zero.
- **The link field's API name varies** with what you route and how the package is configured. `LeanData__Lead__c` is the default here; confirm yours in **Setup → Object Manager → LeanData Log → Fields & Relationships**. A wrong value produces an `INVALID_FIELD` error, which the flow surfaces as a `leandata_log_query_failed` warning rather than swallowing.

`Query LeanData Log` executes on every sweep even when `LEANDATA_LOG_ENABLED=false` — the merge node ignores its output, but the API call is still spent. If you are not using this branch, **disable the node on the canvas** and save one call per sweep.

---

## 5. First-run verification

Run these in order. Steps 1–4 use the manual **Execute Workflow** button; step 5 requires activation.

**1 — Prove the credential and the budget gate.** Execute. `HTTP — Salesforce Limits` should return `statusCode: 200` and a body containing `DailyApiRequests`. `API Budget Gate` should emit `proceed: true` with a `usedPct` under your threshold. Now break it on purpose: change the Connected App secret in the n8n credential to garbage and execute again. The gate must emit `proceed: false, reason: 'auth_401'` and route to `Alert Gate + Resolve` — **not** an empty success. Restore the secret.

This is the step worth doing carefully. A watchdog that reports "nothing wrong" when it cannot see the system it watches is worse than no watchdog, because the silence is indistinguishable from health.

**2 — Prove the denominator.** Execute normally. `Parse Routing State` must emit one `sweep_summary` item with `sampled` greater than zero during business hours. Then temporarily set `LOOKBACK_HOURS=0` and execute again: `Run Detectors` must emit the `watchdog::no_denominator` finding at severity `error`, not an all-clear. Restore `LOOKBACK_HOURS`.

**3 — Prove the unrouted detector.** In a sandbox, create a lead that your assignment rules will not match, wait past `UNROUTED_GRACE_MINUTES`, and execute. You should get an `unrouted_backlog` finding at `warning` with that record in `sample`. If you get nothing, the Id-form problem in section 4 is the first thing to check: compare `PARKING_OWNER_IDS` against the `ownerId` value the flow reports on that record.

**4 — Prove the two clocks are separate.** Pick a routed record with no activity, older than `RESPONSE_SLA_MINUTES`. `Run Detectors` should report it under `response_latency` with `channel: 'post'` — and `Page or Post?` should route it to the Slack branch. Confirm no PagerDuty event fires. Rep slowness must never reach the on-call; if it does here, it will at 02:00.

**5 — Prove dedup and resolve.** Activate the workflow and leave the condition from step 3 in place. Over the next hour you should see exactly one Slack post, not four — `Alert Gate + Resolve` keys on `dedupKey` and suppresses for `RENOTIFY_MINUTES`. Then fix the record's owner. Within 15 minutes you should see a `Resolved: watchdog::unrouted_backlog` message, and any PagerDuty incident opened by that key should close itself.

Do this step activated. `$getWorkflowStaticData` persists on **production executions only**; manual runs will show no deduplication whatsoever, which is documented n8n behaviour and not a bug in this flow.

---

## 6. What this costs to run

**Salesforce API.** Two calls per sweep with the LeanData node disabled (limits + query), three with it enabled. At `*/15` that is 192 or 288 calls/day, plus 2 for the fairness job — call it 200–300 against an Enterprise allocation that starts at 100,000 requests per rolling 24 hours and rises by 1,000 per user licence. Under 0.3%. The budget gate exists for the case where something *else* in the org is at 95%, not for this flow's own consumption.

**n8n executions.** One execution per trigger firing: 96/day for the sweep plus 1 for the fairness job, roughly **2,950 per month**. n8n Cloud's Starter plan includes 2,500 executions/month, so a `*/15` cadence overruns Starter on this workflow alone. Either move to Pro (10,000 executions), self-host, or drop the sweep to `*/30` — which costs you up to 15 extra minutes of detection latency on the unrouted backlog and is a reasonable trade below a few hundred inbound leads a day.

**PagerDuty.** Events API v2 has no per-event charge; the cost is the on-call rotation you already pay for. The routing rules in this flow exist so that stays true — if everything paged, you would be paying in attention instead.

---

## 7. Known limits

1. **Polling, not events.** Detection latency is bounded by the sweep interval. Salesforce Platform Events or Change Data Capture would cut it to seconds and would also mean maintaining a subscriber; that is a different artifact.
2. **`LastActivityDate` is a date, not a datetime.** When no `Task` exists, the first-touch fallback resolves to midnight UTC of that day and the response clock is coarse. Records with a real logged `Task` are exact. If first-touch precision matters, require Tasks.
3. **The fairness check reads assignment counts, not routing intent.** A pool member at zero may have been deliberately removed. The finding names the possibilities rather than asserting a cause.
4. **Territory mis-assignment is not detected.** Checking that a record went to the *right* owner needs your territory map, which is org-specific. The inactive-owner check is the subset that is deterministic from CRM data alone.
5. **Not runtime-tested against a live org.** The SOQL, the endpoints, and the payload shapes are from current vendor documentation; the node logic has not been executed against production data. Section 5 exists to be run before you trust it.
