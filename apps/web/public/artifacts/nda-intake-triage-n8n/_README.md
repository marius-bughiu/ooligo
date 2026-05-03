# NDA intake triage — n8n flow

## What this flow does

This flow watches a dedicated `nda-intake@yourcompany.com` inbox once per minute and processes every inbound message that carries a `.pdf` or `.docx` attachment. For each message the flow extracts the sender domain, looks the counterparty up in your Postgres `counterparty_registry`, sends the contract document to Claude Sonnet 4.6 with the company NDA playbook in the system prompt, parses the structured clause-by-clause output, applies a conservative-tier override (any walk-away clause or sub-0.7 confidence forces escalate; non-low-tier counterparties never auto-approve), then routes to one of three branches via a Switch node — auto-approve (Ironclad record + audit Slack message), lawyer-review (Ironclad review workflow + Slack queue ping with summary and SLA tag), or escalate (Ironclad escalation workflow + GC channel alert). Every path writes to a `nda_audit_log` table for the weekly false-positive review and labels the Gmail message `nda-processed` to keep the trigger query idempotent.

The flow is deliberately one-way — it never sends mail to the counterparty itself. Outbound communication (executed copy back, redline negotiation) stays in Ironclad where the audit trail, version history, and signature workflow already live.

## Import

1. In n8n, go to **Workflows → Import from File** and upload `nda-intake-triage-n8n.json`.
2. Open the imported workflow. Every node will show a red badge against its credential field — that is expected. Bind credentials in the next section before you switch the workflow on.
3. Open **Settings → Timezone** for the workflow and confirm it matches the inbox owner's working hours. The bundled JSON sets `America/New_York`; change to your own.
4. Leave the workflow in **Inactive** state until you have verified the first-run flow below.

## Credentials

### Gmail — `nda-intake` mailbox (`PLACEHOLDER_GMAIL_CRED_ID`)

Used by the trigger node and the final `Mark Gmail Processed` node. Create a Gmail OAuth2 credential authorized against the dedicated intake mailbox (not a shared inbox alias — the trigger needs its own message store). Required scopes: `https://www.googleapis.com/auth/gmail.modify`. The credential must be able to add labels — read-only scopes will fail at the last node. After you connect, create a Gmail label called `nda-processed` in the intake mailbox; capture its label ID from `https://gmail.googleapis.com/gmail/v1/users/me/labels` and replace `Label_NdaProcessed` in the `Mark Gmail Processed` node parameters with the actual ID.

### Postgres — counterparty registry (`PLACEHOLDER_POSTGRES_CRED_ID`)

Used by `Counterparty Lookup` and `Audit Log Write`. Point at the Postgres instance that holds your counterparty registry. The flow expects two tables — `counterparty_registry` with at least the columns `counterparty_id`, `counterparty_name`, `primary_domain`, `secondary_domains text[]`, `risk_tier` (one of `low`, `mid`, `high`, `unknown`), `preferred_paper`, `notes` — and `nda_audit_log` with `id serial primary key`, `message_id text unique`, `thread_id text`, `sender text`, `sender_domain text`, `counterparty_id text`, `counterparty_name text`, `risk_tier text`, `recommendation text`, `override_reason text`, `overall_confidence numeric`, `clauses_json jsonb`, `summary text`, `processed_at timestamptz`. Grant the n8n role `SELECT` on the registry and `INSERT` on the audit log only — no `UPDATE` or `DELETE` rights, so a misbehaving flow cannot rewrite history.

### Anthropic — `x-api-key` (`PLACEHOLDER_ANTHROPIC_CRED_ID`)

Used by `Claude — Playbook Check`. Create an HTTP Header Auth credential in n8n with header name `x-api-key` and value set to your Anthropic API key. Use a workspace key scoped to this single workflow — don't reuse a personal key. The bundled prompt targets `claude-sonnet-4-6`; downgrade to Haiku only after you have measured the false-auto-approve rate at Sonnet (Haiku misses fallback clauses more often).

### Ironclad — API token (`PLACEHOLDER_IRONCLAD_CRED_ID`)

Used by all three Ironclad nodes. Create an HTTP Header Auth credential with header `Authorization` and value `Bearer <your token>`. The token needs `records:write` and `workflows:write` scopes. Pre-create three workflow templates in Ironclad named `nda-review` and `nda-escalation`, plus a record type `nda` with the property fields named in the node bodies (`counterparty`, `risk_tier`, `contract_type`, `status`, `intake_email`, `ai_confidence`, `summary`, `escalation_reason`, `override_reason`, `sla_hours`, `ai_summary`). The HTTP request bodies are written against Ironclad's `properties` shape — if you use a different CLM, replace the three Ironclad nodes wholesale and keep the Switch outputs and audit log path intact.

### Slack — bot token (`PLACEHOLDER_SLACK_CRED_ID`)

Used by `Slack — Audit Log`, `Slack — Lawyer Queue`, and `Slack — GC Escalation`. Create an HTTP Header Auth credential with header `Authorization` and value `Bearer xoxb-...`. The bot needs `chat:write` and must be invited to three channels: `#legal-ops-firehose` (auto-approve audit), `#legal-nda-queue` (lawyer review queue), and `#legal-gc-escalations` (GC alerts). The lawyer queue payload is built with Block Kit so the reviewer gets a one-click "Open in Ironclad" button — replace the placeholder URL in the `Slack — Lawyer Queue` node with the Ironclad workflow URL field returned by the API.

## First-run verification

Run these five smoke tests in order with the workflow still **Inactive** and the trigger swapped for a manual run on a single Gmail message ID. Use your own real-paper NDA samples, not synthetic ones — the playbook check is calibrated against actual paper.

1. **Auto-approve happy path.** Send an NDA from a domain you have inserted into `counterparty_registry` with `risk_tier = 'low'` and a contract that uses your standard mutual paper unmodified. Trigger the flow. Expect: `Routing Switch` fires output 1, an Ironclad record appears with status `Executed — Auto-Approved`, a `:white_check_mark:` message lands in `#legal-ops-firehose`, and `nda_audit_log` has one row with `recommendation = 'auto-approve'`, `override_reason IS NULL`.
2. **Lawyer-review on fallback clause.** Send the same low-tier counterparty an NDA where the term clause is 5 years instead of your standard 3. Expect: `Routing Switch` fires output 2, an Ironclad `nda-review` workflow exists with `sla_hours = 24`, the Slack lawyer queue post shows `override_reason: none` and the summary references the 5-year term, audit log row has `recommendation = 'lawyer-review'`.
3. **Conservative override on unknown counterparty.** Send a clean standard-paper NDA from a domain that does NOT exist in the registry. Expect: even though every clause is acceptable, the audit row shows `override_reason = 'non_low_risk_tier'` and the message routes to the lawyer queue, not auto-approve. This is the guard against silently approving anything from an unknown sender.
4. **Escalate on walk-away clause.** Send an NDA that includes a non-mutual indemnity that is outside your fallback library. Expect: `Routing Switch` fires output 3, the `nda-escalation` workflow exists in Ironclad, `#legal-gc-escalations` receives a `:rotating_light:` post, `has_walk_away = true` in the audit row.
5. **Parser-error fallback.** Temporarily edit the `Claude — Playbook Check` system prompt to ask for prose instead of JSON, then re-run any sample. Expect: the flow does not auto-approve. `Apply Risk Rules` catches the JSON parse failure and forces `recommendation = 'escalate'` with `escalation_reason: 'parser_error'`. Revert the prompt before activating the workflow.

Once all five behave as expected, label the original Gmail messages with `nda-processed` (so the trigger does not re-fire on them), switch the workflow to **Active**, and watch the audit log + `#legal-ops-firehose` for the first 30 days. Treat any auto-approve with `overall_confidence < 0.85` as a manual-spot-check candidate during that window.
