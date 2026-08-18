# Legal Request Intake Router — n8n

One front door for every legal request. Two entry points (a form webhook and a `legal-intake@` mailbox) converge into one normalized envelope, get classified against a twelve-type taxonomy, and route into one of five lanes — self-serve, playbook review, lawyer, awaiting-requester, or GC escalation. An hourly sweep chases the SLA clock; a Monday report tells you what the department was actually asked for last week.

**Files**

| File | What it is |
|---|---|
| `legal-request-intake-router-n8n.json` | The workflow export. 26 nodes, three trigger-rooted branches. |
| `schema.sql` | Three Postgres tables. Run this first. |
| `_README.md` | This file. |

---

## 1. Import

1. Run `schema.sql` against your Postgres database. It is idempotent — `CREATE TABLE IF NOT EXISTS` throughout, and the five `legal_sla_policy` rows use `ON CONFLICT DO NOTHING`.
2. In n8n: **Workflows → Import from File →** `legal-request-intake-router-n8n.json`.
3. Open **Workflow settings** and set the timezone. The export ships `Europe/London`. Every cron expression in the file (`0 9-18 * * 1-5` for the SLA sweep, `0 8 * * 1` for the report) reads that setting, and so does the business-hours arithmetic in `Compute Breach Tier`. Setting it wrong does not throw — it silently shifts every SLA deadline.
4. Bind the five credentials by name (next section). The export references them as `PLACEHOLDER_*` ids, which n8n shows as unbound until you map them.
5. Leave the workflow **inactive** until you have run the verification sequence in section 3.

---

## 2. Credentials

Five, one section each.

### `PLACEHOLDER_POSTGRES_CRED_ID` — Postgres (type: Postgres)

The database holding the three tables from `schema.sql`. Used by five nodes. The workflow needs `SELECT`, `INSERT`, and `UPDATE` on `legal_request_log`, `SELECT` on `requester_directory` and `legal_sla_policy`. It never needs `DELETE` or DDL — grant accordingly.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic (type: Header Auth)

- **Name:** `x-api-key`
- **Value:** your Anthropic API key, from [console.anthropic.com](https://console.anthropic.com) → API Keys.

Used only by `Claude — Classify + Route`. The `anthropic-version: 2023-06-01` header is set on the node itself, not in the credential.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack (type: Header Auth)

- **Name:** `Authorization`
- **Value:** `Bearer xoxb-...` — a bot token from your Slack app's **OAuth & Permissions** page.

Scopes required: `chat:write` and `chat:write.public`. Invite the bot into `#legal-ops`, `#legal-queue`, `#legal-lawyer-queue`, and `#legal-gc-escalations` before the first run; a post to a channel the bot is not in returns `not_in_channel` with HTTP 200, so it fails quietly.

The two requester-facing nodes (`Slack — Self-Serve Reply`, `Slack — Ask For Missing Fields`) derive a Slack handle from the email local part. If your handles do not match your email prefixes, replace that expression with a `users.lookupByEmail` call and add the `users:read.email` scope.

### `PLACEHOLDER_CLM_CRED_ID` — Ironclad (type: Header Auth)

- **Name:** `Authorization`
- **Value:** `Bearer ...` — an Ironclad API token with workflow-create permission.

Used by `CLM — Open Playbook Matter` only. The node's `template` value (`legal-playbook-review`) and its attribute names are **per-tenant** — read them off your own workflow designer and edit the node body. If you do not have a CLM, disable this node; the playbook lane still posts to Slack and still writes its audit row.

### `PLACEHOLDER_GMAIL_CRED_ID` — Gmail (type: Gmail OAuth2)

The dedicated `legal-intake@` mailbox — a shared mailbox, never an individual lawyer's inbox. Used by `Intake Mailbox Poll — legal@` and `Mark Email Processed`.

### `PLACEHOLDER_WEBHOOK_ID_LEGAL_INTAKE`

Not a credential. n8n assigns a real webhook id on import; copy the production URL from the `Intake Form Webhook` node and point your intake form at it. Expected JSON body:

```json
{
  "submission_id": "form-2026-08-18-0042",
  "requester_email": "jane@acme.com",
  "business_unit": "EMEA Sales",
  "request_type_hint": "vendor_contract",
  "summary": "Renewal of the Datadog MSA",
  "detail": "Free-text description of what they need and by when.",
  "counterparty": "Datadog Inc.",
  "claimed_value_usd": 84000,
  "needed_by": "2026-09-05"
}
```

Only `submission_id` and `requester_email` are load-bearing. `Normalize Request` defaults everything else, and a submission with no requester email is force-routed to the GC channel rather than guessed at.

---

## 3. First-run verification

Run these six in order, with the workflow **inactive**, using **Execute Workflow** and pinned test data on the trigger node. Each one proves a different branch. Do not activate until all six pass.

### Test 1 — the happy path, self-serve lane

Pin a webhook body for a standard NDA from a requester you have inserted into `requester_directory` with `risk_posture = 'standard'`. Expect: `Lane Switch` takes output 1, the requester gets a Slack DM with a template link, and one row lands in `legal_request_log` with `lane = 'self_serve'` and `override_reason IS NULL`.

This is the only test where an automated answer goes out. If it routes anywhere else, check that your directory row actually matched — `SELECT * FROM requester_directory WHERE lower(match_value) = lower('jane@acme.com')`.

### Test 2 — the unknown requester is not self-served

Same body, but change `requester_email` to an address with no directory row and no matching domain. Expect: `lane = 'playbook'` and `override_reason = 'risk_posture_unknown'`. This proves that `Merge Requester Context` defaults a missing row to `unknown` rather than `standard` — the guard that stops an unrecognised sender receiving an automated legal answer.

### Test 3 — the walk-away override beats the model

Pin a body describing an employment matter with the word `termination` in the detail (but not in the subject, so the privilege gate does not catch it first). Expect: whatever Claude proposed, `lane = 'gc_escalation'` and `override_reason` starts with `walk_away_flag:`. Check the `#legal-gc-escalations` post arrived.

### Test 4 — the privilege gate skips the model entirely

Pin a body with `"summary": "Subpoena received from the state AG"`. Expect: `Privileged-Content Gate` takes its TRUE branch, `Claude — Classify + Route` **never executes** (confirm in the execution view — the node should be untouched, not merely fast), and the GC channel post says explicitly that no classification was run.

This is the test that proves privileged content cannot reach the Anthropic API through the normal path. Re-run it after every edit to `PRIVILEGE_PATTERNS`.

### Test 5 — parse failure escalates rather than failing open

Temporarily edit `Claude — Classify + Route` to point at `https://api.anthropic.com/v1/messages-broken` so the call returns an error body. Execute. Expect: `Apply Routing Policy` catches it, emits `lane = 'gc_escalation'` with `override_reason` starting `parser_error:`, and a human gets the request unread. **Restore the URL afterwards.**

This is the test most teams skip and most regret. A classifier that fails open is worse than no classifier, because the failure is invisible.

### Test 6 — the SLA sweep counts business hours, not calendar hours

Insert a row directly:

```sql
INSERT INTO legal_request_log (source_message_id, source, requester_email, request_type, lane, sla_business_hours, received_at)
VALUES ('sla-test-1', 'form', 'jane@acme.com', 'vendor_contract', 'playbook', 16, now() - interval '3 days');
```

Execute the `SLA Sweep — Hourly Weekdays` branch. Expect one escalation post naming an elapsed figure **lower** than 72, because weekends and nights are excluded. If it reports something close to 72, your workflow timezone and `BUSINESS_START`/`BUSINESS_END` in `Compute Breach Tier` disagree. Then re-execute immediately: the second run must post **nothing**, because `Record Escalation Tier` wrote the tier back. Delete the test row when done.

### Optional — the weekly report on an empty week

Execute the `Weekly Demand Report — Mon 08:00` branch against an empty table. It should post the "no requests logged" message rather than dividing by zero.

---

## 4. What to tune, and when

Ship with the defaults. Change them after a quarter of real traffic, not before.

| Setting | Node | Default | Change it when |
|---|---|---|---|
| `CONFIDENCE_FLOOR` | Apply Routing Policy | `0.75` | The weekly report shows more than ~25% low-confidence and sampling proves they were genuinely routable. |
| `VALUE_ESCALATION_USD` | Apply Routing Policy | `250000` | Your signature-authority matrix says a different number. It should match that document, not a round figure. |
| `WALK_AWAY_FLAGS` | Apply Routing Policy | 6 flags | Never shrink this list to reduce escalation volume. Fix the taxonomy or the intake form instead. |
| `PRIVILEGE_PATTERNS` | Normalize Request | 8 patterns | Add to it freely. Every addition costs you one unclassified request and buys certainty about a category of content. |
| `BUSINESS_START` / `BUSINESS_END` | Compute Breach Tier | `9` / `18` | Your team is not on a single working day — split by `region` from the directory if you support follow-the-sun. |
| SLA hours per lane | `legal_sla_policy` table | 16 / 40 / 8 / 8 | Your published service catalog says otherwise. The table is the right place to change it; no node edit needed. |
| Report thresholds | Format Demand Report | 15 / 10 / 30 / 20 / 25 % | After a quarter, set each to the level your team actually treats as a problem. |

---

## 5. Known limits

1. **The classification is a routing decision, never legal advice.** The system prompt states this and the self-serve reply points at a template rather than answering. Do not extend the prompt to answer the underlying question.
2. **Attachments are not read.** `has_attachment` is a boolean the classifier can use as a signal; the file itself is never sent. For clause-level review of an attached contract, this router hands off to a per-contract-type flow — the NDA triage flow is the worked example.
3. **The recontact metric is a proxy.** It counts any later request from the same person within seven days, so a requester with two unrelated matters registers as a recontact. It is directionally right at the volumes this report is read at; treat a spike as a prompt to read five threads, not as a measurement.
4. **`Mark Email Processed` uses `markAsRead`.** If your `legal-intake@` mailbox has other readers, switch it to `addLabels` with a dedicated `legal-intake-processed` label and rely on the trigger filter (already set to `-label:legal-intake-processed`) for deduplication.
5. **Not runtime-tested against a live Anthropic, Slack, Ironclad, or Gmail tenant.** The workflow JSON is complete and every Code node's logic has been exercised against the routing cases in section 3, but the HTTP node bodies are written from published API shapes and should be verified against your own tenant during the first-run sequence.
