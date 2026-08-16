-- Contract Renewal Radar — supporting tables
-- Postgres 13+. Run this before importing the workflow.

-- ---------------------------------------------------------------------------
-- vendor_context: the spend and usage data your CLM does not hold.
-- Populate from your AP export, the vendor's admin API, or your IdP. One row
-- per contract, keyed by the same contract_id the flow builds
-- ("ironclad:<record id>" or "docusign:<agreement id>").
--
-- Every column is nullable on purpose. A contract with no row here still gets
-- a brief; it is flagged context_complete: false and routed for review rather
-- than silently recommended for renewal.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendor_context (
  contract_id                  text PRIMARY KEY,
  licensed_seats               integer,
  active_seats_30d             integer,
  last_term_annual_cents       bigint,
  quoted_renewal_annual_cents  bigint,
  open_support_tickets_90d     integer,
  replacement_effort           text
    CHECK (replacement_effort IN ('low', 'medium', 'high')),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- renewal_radar_log: one row per contract, overwritten each time the contract
-- crosses into a new tier. This is both the audit trail and the deduplication
-- key — last_tier_notified is what stops the flow re-posting the same contract
-- every weekday for 90 days.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS renewal_radar_log (
  contract_id           text PRIMARY KEY,
  source                text NOT NULL,
  counterparty          text,
  notice_deadline       date NOT NULL,
  expiration_date       date NOT NULL,
  tier                  text NOT NULL,
  days_to_deadline      integer NOT NULL,
  notice_source         text NOT NULL
    CHECK (notice_source IN ('contract', 'assumed')),
  recommendation        text NOT NULL
    CHECK (recommendation IN ('renew', 'renegotiate', 'terminate')),
  model_recommendation  text,
  model_agrees          boolean,
  utilization           numeric(5, 4),
  uplift                numeric(6, 4),
  route                 text NOT NULL,
  rationale             text,
  last_tier_notified    text NOT NULL,
  last_notified_on      date NOT NULL DEFAULT CURRENT_DATE
);

-- The dedup read is a full-table scan today. It stays cheap into the low
-- thousands of contracts; index it once the repository is larger than that.
CREATE INDEX IF NOT EXISTS renewal_radar_log_deadline_idx
  ON renewal_radar_log (notice_deadline);

-- ---------------------------------------------------------------------------
-- renewal_decisions: written by a human, not by the flow. This is the table
-- your success metric reads — the flow can only prove it sent a nudge, not
-- that anyone decided anything.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS renewal_decisions (
  id               bigserial PRIMARY KEY,
  contract_id      text NOT NULL,
  decided_on       date NOT NULL,
  notice_deadline  date NOT NULL,
  decision         text NOT NULL
    CHECK (decision IN ('renewed', 'renegotiated', 'terminated', 'lapsed')),
  decided_by       text,
  notes            text
);

-- The number that matters: what share of decisions landed before the notice
-- deadline rather than after it.
--
--   SELECT date_trunc('quarter', decided_on) AS quarter,
--          count(*) FILTER (WHERE decided_on <= notice_deadline)::numeric
--            / count(*) AS on_time_rate
--   FROM renewal_decisions
--   GROUP BY 1 ORDER BY 1;
