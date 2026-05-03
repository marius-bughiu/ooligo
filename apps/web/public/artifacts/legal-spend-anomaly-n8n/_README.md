# Outside-counsel invoice anomaly detection (n8n)

## What this flow does

Polls your e-billing system every weekday morning for newly submitted outside-counsel invoices, fetches the LEDES 1998B file for each one, parses every line item, runs deterministic billing-guideline checks against your matter database (approved timekeepers, rate cards, block-billing rules, vague-description keywords, no-travel-class rules), then asks Claude for a second pass over anomalies that are hard to express as rules (duplicative timekeepers on the same task, disproportionate task time relative to scope, scope-creep narrative, off-engagement-letter work). Each invoice is scored, routed to one of four buckets — auto-approve, auto-deduct with notice, reviewer queue in Slack, or director escalation — and written to an idempotent audit log.

The flow is single-trigger (the daily cron); the watermark on `invoice_audit_log.checked_at` makes re-runs safe. Every decision is reproducible from the audit log row.

## Import

1. In your n8n instance, open **Workflows → Import from File** and select `legal-spend-anomaly-n8n.json`.
2. The workflow imports as inactive. Do not activate it yet — you need to wire credentials and create the supporting Postgres tables first.
3. Open workflow **Settings** and confirm `executionOrder: v1` and `timezone: America/New_York` (or change the timezone to match your billing day boundary). The `Daily Cron — 7am Mon-Fri` node inherits this timezone.

## Credentials

The workflow ships with four placeholder credential references. Each must be replaced with a real credential in n8n before the flow runs. In each node, open the credential picker and either select an existing credential of the right type or create a new one.

### `PLACEHOLDER_BRIGHTFLAG_CRED_ID` — Brightflag (or your e-billing system) API token

Used by the `Brightflag — List New Invoices` and `Fetch LEDES File` nodes. Type: **Header Auth**. Header name: `Authorization`. Header value: `Bearer <your-token>`. If you are on Onit, BusyLamp, SimpleLegal, or a self-hosted e-billing system, swap the host and path in the `Brightflag — List New Invoices` node URL and adjust the header to whatever your vendor expects. The downstream `Parse LEDES` and `Rule-Based Checks` nodes assume the list endpoint returns `{ invoices: [{ id, firm_id, matter_id, ledes_url, total_amount, currency }] }`; if your vendor's shape differs, add a `Code` node after the list call to normalise.

### `PLACEHOLDER_POSTGRES_CRED_ID` — Postgres for matter database + audit log

Used by `Lookup Watermark`, `Load Matter + Rate Card`, and `Audit Log Insert`. Type: **Postgres**. The flow expects four tables: `matters` (matter_id, matter_type, budget_remaining_cents, scope_summary), `matter_approved_timekeepers` (matter_id, timekeeper_id, max_rate_cents, classification), `firm_billing_guidelines` (law_firm_id, block_billing_min_units, vague_keywords text[], after_hours_window, no_travel_class text[]), and `invoice_audit_log` (id serial pk, invoice_id unique, plus the columns the `Audit Log Insert` node writes). Add a unique index on `invoice_audit_log.invoice_id` so the `ON CONFLICT` clause works, and indexes on `matter_approved_timekeepers.matter_id` and `firm_billing_guidelines.law_firm_id`.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic API key

Used by `Claude — Anomaly Detection`. Type: **Header Auth**. Header name: `x-api-key`. Header value: your Anthropic API key. The node targets `claude-sonnet-4-6`; switch to a smaller model only after you have calibrated against historical invoices, since the recall on subtle scope-creep narratives degrades quickly with cheaper models.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

Used by `Slack — Escalate to Director` and `Slack — Reviewer Queue`. Type: **Header Auth**. Header name: `Authorization`. Header value: `Bearer xoxb-...`. The bot needs `chat:write` and must be invited into both `#legal-ops-escalations` and `#legal-ops-invoice-review` (or whatever channels you rename them to in the two Slack node bodies).

## First-run verification

Before you flip the schedule trigger to active, walk every branch on a small set of inputs.

1. **Empty list path.** Temporarily edit the `Brightflag — List New Invoices` URL to query a status that returns no invoices. Run the workflow manually. Expected: `Split Invoices` produces zero items, the rest of the flow short-circuits, and no rows appear in `invoice_audit_log`.
2. **Clean invoice path.** Pick a known-clean historical invoice (no rate breaches, all timekeepers on the approved list, no vague descriptions). Run the workflow manually with that invoice's `ledes_url` injected. Expected: `Score + Route` returns `decision: auto_approve`; one row in `invoice_audit_log` with `rule_flag_count = 0` and `ai_flag_count = 0`.
3. **Rule-only flag path.** Pick an invoice where you know one timekeeper billed slightly above the rate card. Expected: `decision: auto_deduct` with `reason: low_value_rule_flags_only`, the `Reviewer or Deduct?` node routes to the audit log directly, no Slack message goes out (or change the `Slack — Reviewer Queue` body to also handle `auto_deduct` if you prefer notice).
4. **AI-flag path.** Run a historical invoice your team manually flagged for scope creep. Expected: `decision: reviewer_queue` and a Slack message in `#legal-ops-invoice-review` with both rule and AI findings. Cross-check the AI findings against your team's manual notes; if Claude is missing the same items your team caught, tighten the system prompt before going further.
5. **Escalation path.** Run the most egregious historical invoice you have (large overrun, off-scope work). Expected: `decision: escalate_director` and a Slack message in `#legal-ops-escalations`. Confirm the `:rotating_light:` block format renders correctly.
6. **Idempotency.** Re-run any of the above with the same invoice. Expected: the existing `invoice_audit_log` row is updated in place (the `ON CONFLICT (invoice_id) DO UPDATE` clause), not duplicated. The watermark advances correctly on the next scheduled run.

Once all six branches behave as expected, activate the workflow. The `Daily Cron — 7am Mon-Fri` node will then drive everything from there. Watch the audit log for the first two weeks; expect to retune the AI system prompt and the `Score + Route` thresholds at least twice before the routing distribution stabilises.
