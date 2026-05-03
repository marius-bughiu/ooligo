# Litigation hold orchestration — n8n flow

Orchestrates a litigation-hold issue cycle: notification, acknowledgement tracking, reminder cadence, escalation paths, and an immutable audit log. Replaces the spreadsheet-and-Outlook-rules manual cycle with a deterministic flow that can't drop a custodian.

## Import

1. Import `litigation-hold-orchestration-n8n.json` into n8n.
2. Set workflow timezone to your office TZ.
3. Provision the audit table (DDL in `audit-table-schema.sql`).
4. Wire credentials.
5. Do NOT enable until dry-run confirms behavior on a closed hold.

## What ships in this bundle

This n8n export covers the **issuance** half of the cycle (Phase 1). The tracking + escalation half (Phase 2 — daily cron, reminders, escalation) is intentionally a separate workflow you wire to the same audit table; that lets the issuance flow be triggered fresh per hold while the tracker runs continuously across all active holds.

The Phase 2 tracker is a 4-node workflow:

1. Cron daily 9am office TZ.
2. Postgres query against the audit table: select hold/custodian pairs without `acknowledged` action.
3. Code node: determine action (reminder at +3, +7; escalation to legal-ops lead at +14; escalation to manager at +21).
4. Email send + audit-log append.

The DDL and the audit-query are in this README's appendix below; the Phase 2 export is left to the legal-ops engineer to assemble per the firm's escalation paths (which vary by jurisdiction and matter type more than the issuance step does).

## Credentials

### `PLACEHOLDER_CUSTODIAN_DB_CRED_ID` — Custodian source

Read access to wherever the custodian list lives:

- **In-house Postgres** — the default. Schema documented in the `Load Custodian List` node.
- **Relativity / Everlaw / Logikcull** — replace the Postgres node with an HTTP node calling the platform's custodian endpoint.
- **HRIS** — possible if HRIS is the source of truth, but legal-ops typically maintains the custodian list separately.

### `PLACEHOLDER_SMTP_CRED_ID` — SMTP

Use the **firm's own mail relay**, not a third-party SaaS like SendGrid. Hold notices may flag the existence of a litigation matter; routing them through a third party expands the privilege exposure.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

`chat:write` scope. The bot needs to be invited to the workspaces where custodians live; per-custodian DMs require user-level scope which Slack handles automatically when the bot is in the workspace.

### `PLACEHOLDER_AUDIT_DB_CRED_ID` — Audit table

Write access to the audit table. The table itself must be append-only at the DB level (DDL below).

## Audit table schema

```sql
CREATE TABLE hold_audit (
    audit_id        BIGSERIAL PRIMARY KEY,
    hold_id         TEXT NOT NULL,
    custodian_id    TEXT NOT NULL,
    action          TEXT NOT NULL CHECK (action IN (
        'notice_sent',
        'reminder_sent',
        'escalated_to_lead',
        'escalated_to_manager',
        'acknowledged',
        'released'
    )),
    template_sha    TEXT,
    payload_json    JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX hold_audit_lookup_idx ON hold_audit (hold_id, custodian_id, action);

-- Immutability: the audit table is the firm's defensibility chain.
-- Counsel needs to be able to demonstrate the log can't be edited.
REVOKE UPDATE, DELETE, TRUNCATE ON hold_audit FROM PUBLIC;
REVOKE UPDATE, DELETE, TRUNCATE ON hold_audit FROM <legal_ops_app_role>;
GRANT INSERT, SELECT ON hold_audit TO <legal_ops_app_role>;
```

The `REVOKE` statements are NOT optional. Without them the table is editable, and counsel cannot demonstrate the audit log's defensibility under e-discovery scrutiny.

## Hold-notice template

Save per-matter templates as `n8n/data/hold-notices/<matter-id>.md`. The template uses these placeholders, replaced per custodian by the `Personalize Notice` node:

- `{{custodian_name}}` — custodian's full name
- `{{matter_id}}` — matter identifier
- `{{hold_id}}` — hold identifier
- `{{ack_url}}` — per-custodian acknowledgement URL

Sample template structure (counsel approves the actual language):

```
Dear {{custodian_name}},

This is a litigation hold notice for Matter {{matter_id}}.

You are required to preserve all documents, communications, and electronic
data related to [counsel-defined scope]. This includes [specific systems
and document types].

You must NOT delete, alter, or destroy any potentially relevant material,
even if it would be deleted under normal retention policy.

Please acknowledge receipt of this notice by clicking the link below
within 7 business days:

{{ack_url}}

If you have questions about scope or what to preserve, contact [legal-ops
contact].

This hold remains in effect until you receive a written release notice
from the legal department.

[counsel signature block]
```

## Phase 2 tracker query

The Phase 2 daily cron uses this query to find non-acknowledgers:

```sql
WITH last_action AS (
    SELECT hold_id, custodian_id, MAX(created_at) AS last_action_at,
           BOOL_OR(action = 'acknowledged') AS acknowledged
    FROM hold_audit
    WHERE action IN ('notice_sent', 'reminder_sent', 'acknowledged', 'released')
    GROUP BY hold_id, custodian_id
)
SELECT
    la.hold_id,
    la.custodian_id,
    la.last_action_at,
    EXTRACT(EPOCH FROM (NOW() - la.last_action_at)) / 86400 AS days_since_last_action,
    (SELECT MIN(created_at) FROM hold_audit ha
        WHERE ha.hold_id = la.hold_id AND ha.custodian_id = la.custodian_id
        AND ha.action = 'notice_sent') AS first_notice_at
FROM last_action la
WHERE la.acknowledged = false
  AND NOT EXISTS (
      SELECT 1 FROM hold_audit ha
      WHERE ha.hold_id = la.hold_id AND ha.custodian_id = la.custodian_id
      AND ha.action = 'released'
  );
```

The tracker computes `days_since_first_notice`, decides action, dispatches.

## Dry-run procedure

1. Provision the audit table on a non-production DB.
2. Wire credentials against staging endpoints (test SMTP, test Slack workspace).
3. Replay a closed hold's custodian list manually.
4. Confirm: notification fires once per custodian; audit log records each send; per-custodian acknowledgement URLs are unique.
5. Switch to production DB. Issue your next real hold via the flow.

## Known limits

- Phase 1 issuance only ships in this n8n export; Phase 2 tracker is documented but not bundled.
- The flow assumes per-custodian email + Slack. Custodians without Slack accounts (contractors, alumni) get email only — the Slack node fails gracefully but the failure is silent in the audit log. The Phase 2 tracker should treat email-only custodians the same as Slack+email.
- Acknowledgement URL routing requires a separate webhook endpoint (the `/ack/<hold>/<custodian>/<token>` URL) — deploy that as a small Express / Flask endpoint that writes `action: acknowledged` to the audit table. The endpoint is NOT bundled.
- The flow does not handle hold-release. Release is its own action — when counsel releases, a separate webhook writes `action: released` to the audit table per custodian. The tracker stops sending reminders to released custodian/hold pairs.
