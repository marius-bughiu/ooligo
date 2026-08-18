-- legal-request-intake-router-n8n — schema
-- Run this once against the Postgres database bound to PLACEHOLDER_POSTGRES_CRED_ID
-- before importing the workflow. Three tables: who is allowed to ask, what was
-- asked, and how fast each lane is expected to answer.

-- ---------------------------------------------------------------------------
-- 1. requester_directory
-- Maps a requester's email domain or exact address to their business unit and
-- the unit's standing risk posture. The router degrades gracefully when a
-- requester is missing (posture defaults to 'unknown', which blocks the
-- self-serve lane), so an empty table is safe on day one — but every row you
-- add moves requests out of the lawyer queue.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requester_directory (
    id                BIGSERIAL PRIMARY KEY,
    match_value       TEXT NOT NULL,           -- 'jane@acme.com' or '@acme-emea.com'
    match_type        TEXT NOT NULL            -- 'email' | 'domain'
                      CHECK (match_type IN ('email', 'domain')),
    business_unit     TEXT NOT NULL,
    region            TEXT,
    risk_posture      TEXT NOT NULL DEFAULT 'standard'
                      CHECK (risk_posture IN ('standard', 'elevated', 'restricted')),
    default_assignee  TEXT,                    -- Slack member ID of the unit's named lawyer
    notes             TEXT,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (match_value, match_type)
);

CREATE INDEX IF NOT EXISTS requester_directory_match_idx
    ON requester_directory (match_type, lower(match_value));

-- ---------------------------------------------------------------------------
-- 2. legal_sla_policy
-- One row per lane. The SLA sweep reads these; the router stamps the tier onto
-- each logged request. Hours are BUSINESS hours, not calendar hours — the
-- Compute Breach Tier code node converts using BUSINESS_HOURS.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_sla_policy (
    lane                 TEXT PRIMARY KEY
                         CHECK (lane IN ('self_serve', 'playbook', 'lawyer',
                                         'awaiting_requester', 'gc_escalation')),
    sla_business_hours   INTEGER,              -- NULL = no clock (self-serve is instant)
    escalation_channel   TEXT NOT NULL,
    description          TEXT
);

INSERT INTO legal_sla_policy (lane, sla_business_hours, escalation_channel, description) VALUES
    ('self_serve',         NULL, '#legal-ops',            'Template or policy answer returned at intake. No clock.'),
    ('playbook',             16, '#legal-queue',          'Standard-paper review against a written playbook. 2 business days.'),
    ('lawyer',               40, '#legal-lawyer-queue',   'Needs a lawyer''s judgment. 5 business days.'),
    ('awaiting_requester',    8, '#legal-ops',            'Blocked on the requester supplying named missing fields.'),
    ('gc_escalation',         8, '#legal-gc-escalations', 'Privileged, litigation, or regulator-facing. 1 business day, GC-visible.')
ON CONFLICT (lane) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. legal_request_log
-- The audit trail, the SLA clock, and the only honest source for the weekly
-- demand report. source_message_id is the idempotency key: n8n retries on
-- transient Postgres errors and you do not want a duplicate row (or a duplicate
-- Slack post) for one request.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_request_log (
    id                     BIGSERIAL PRIMARY KEY,
    source_message_id      TEXT NOT NULL UNIQUE,   -- Gmail message id, or form submission id
    source                 TEXT NOT NULL           -- where it actually arrived from
                           CHECK (source IN ('form', 'email', 'backfill')),
    requester_email        TEXT NOT NULL,
    business_unit          TEXT,
    risk_posture           TEXT,
    request_type           TEXT NOT NULL,          -- from the taxonomy in the Claude prompt
    lane                   TEXT NOT NULL
                           REFERENCES legal_sla_policy (lane),
    model_lane             TEXT,                   -- what Claude said, before overrides
    override_reason        TEXT,                   -- why the policy node disagreed, if it did
    confidence             NUMERIC(4,3),
    sla_business_hours     INTEGER,
    risk_flags             TEXT[]  NOT NULL DEFAULT '{}',
    missing_fields         TEXT[]  NOT NULL DEFAULT '{}',
    claimed_value_usd      NUMERIC(14,2),
    assignee               TEXT,                   -- Slack member ID
    status                 TEXT NOT NULL DEFAULT 'open'
                           CHECK (status IN ('open', 'awaiting_requester', 'closed')),
    last_escalated_tier    INTEGER NOT NULL DEFAULT 0,  -- 0 none, 1 = 50%, 2 = 100%, 3 = 150%
    received_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    first_touch_at         TIMESTAMPTZ,
    closed_at              TIMESTAMPTZ,
    recontacted_within_7d  BOOLEAN                 -- backfilled by the weekly report job
);

CREATE INDEX IF NOT EXISTS legal_request_log_open_idx
    ON legal_request_log (status, lane, received_at)
    WHERE status <> 'closed';

CREATE INDEX IF NOT EXISTS legal_request_log_received_idx
    ON legal_request_log (received_at DESC);

CREATE INDEX IF NOT EXISTS legal_request_log_requester_idx
    ON legal_request_log (lower(requester_email), received_at DESC);
