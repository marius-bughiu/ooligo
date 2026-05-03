-- Litigation hold audit table — append-only DDL.
-- Counsel's defensibility chain depends on this table being immutable.

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

CREATE INDEX hold_audit_lookup_idx
    ON hold_audit (hold_id, custodian_id, action);

CREATE INDEX hold_audit_created_idx
    ON hold_audit (created_at);

-- Immutability constraints. NOT optional.
-- Replace <legal_ops_app_role> with the DB role your n8n flow uses.
REVOKE UPDATE, DELETE, TRUNCATE ON hold_audit FROM PUBLIC;
GRANT INSERT, SELECT ON hold_audit TO <legal_ops_app_role>;

-- Optional: row-level revisioning if you anticipate legitimate
-- corrections (e.g. a custodian acknowledged offline and the lead
-- needs to record it). Even then, NEVER UPDATE existing rows —
-- INSERT a 'corrected_offline' action with a payload_json reference
-- to the prior row's audit_id, preserving the original record.
