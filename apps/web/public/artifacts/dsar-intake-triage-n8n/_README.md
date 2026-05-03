# DSAR intake triage — n8n flow

Receives data-subject requests, classifies them with Claude, opens a tracking record with the response-deadline clock, dispatches a verification request to the data subject, and notifies privacy counsel via Slack.

## Import

1. Import `dsar-intake-triage-n8n.json` into n8n.
2. Provision the tracking table (DDL below).
3. Wire credentials.
4. Author per-jurisdiction verification templates.
5. Dry-run on closed DSARs before enabling.

## DSAR tracking table

```sql
CREATE TABLE dsar_tracking (
    dsar_id                    TEXT PRIMARY KEY,
    received_at                TIMESTAMPTZ NOT NULL,
    request_type               TEXT NOT NULL,
    jurisdiction               TEXT NOT NULL,
    subject_email_claimed      TEXT NOT NULL,
    sender_email               TEXT NOT NULL,
    urgency_signal             TEXT NOT NULL CHECK (urgency_signal IN ('low','medium','high')),
    malicious_signal           TEXT NOT NULL CHECK (malicious_signal IN ('low','medium','high')),
    deadline                   TIMESTAMPTZ NOT NULL,
    status                     TEXT NOT NULL CHECK (status IN (
        'pending_verification', 'verified', 'in_progress', 'responded',
        'denied_unverified', 'denied_invalid', 'closed_not_me'
    )),
    raw_subject                TEXT,
    raw_snippet                TEXT,  -- truncated to 1000 chars
    verified_at                TIMESTAMPTZ,
    responded_at               TIMESTAMPTZ,
    response_outcome           TEXT,
    counsel_owner              TEXT,
    notes                      TEXT
);

CREATE INDEX dsar_deadline_idx ON dsar_tracking (deadline) WHERE status NOT IN ('responded', 'denied_unverified', 'denied_invalid', 'closed_not_me');
CREATE INDEX dsar_jurisdiction_idx ON dsar_tracking (jurisdiction);
```

A separate audit table (append-only, similar to the litigation-hold audit pattern) records every state transition. Counsel needs the audit chain for regulator inquiries.

## Credentials

- `PLACEHOLDER_GMAIL_PRIVACY_CRED_ID` — read access to `privacy@` mailbox. Use a dedicated mailbox, not a person's inbox.
- `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic API key. Sonnet 4.6 model.
- `PLACEHOLDER_DSAR_DB_CRED_ID` — write access to the tracking table.
- `PLACEHOLDER_SMTP_CRED_ID` — firm mail relay (NOT third-party SaaS — DSARs may flag the existence of personal data the firm holds, which is itself sensitive).
- `PLACEHOLDER_SLACK_CRED_ID` — `chat:write` scope, bot in `#privacy-counsel`.

## Per-jurisdiction verification templates

Save under `n8n/data/verification/<jurisdiction>.md`. The flow's `Send Verification` node reads the template per the classified jurisdiction.

### EU GDPR / UK GDPR

GDPR Art. 12(6) allows requesting "additional information necessary to confirm the identity of the data subject." Standard is "necessary and proportionate." For most consumer DSARs:

> Please reply with a copy (redacted as appropriate) of a government-issued identification, OR confirm three pieces of personal information you provided to the firm in the past two years (e.g. an order reference, the date you created an account, the email used at signup).

### CCPA-CPRA

CCPA Regulations §7060 require verifying to a "reasonable degree of certainty." For most consumer DSARs:

> Please reply with a copy of a government-issued identification, OR confirm three pieces of personal information that match what we hold on you (e.g. account email, order reference number, and a billing zip code).

### LGPD

LGPD Art. 18 §5 allows verification but doesn't specify standard. Brazilian ANPD guidance suggests proportionality similar to GDPR.

### Customizing per jurisdiction

Each template should:

- Name the legal basis for verification (cite the article).
- State what verification information is sufficient.
- State the consequence of non-verification (no action taken, request closed).
- Reference the response deadline so the data subject understands the clock.

## Dry-run procedure

1. Provision the tracking table and audit table on a non-production DB.
2. Wire credentials to staging endpoints.
3. Forward a sample of historic DSARs to a test inbox the flow polls.
4. Confirm: classification matches counsel's reading; deadline computed correctly; verification template fits jurisdiction; Slack notification reaches `#privacy-counsel`.
5. Switch to production credentials.

## Known limits

- Web-form intake (the alternative to email intake) needs a separate webhook node feeding the same `Classify` step. Not bundled.
- The flow doesn't handle the substantive response — that's counsel's work, supported by a separate data-extraction process per system.
- Reminders to counsel as deadlines approach are a separate cron workflow (similar pattern to the litigation-hold tracker). Not bundled.
- Verification-receipt tracking (when the subject replies with their verification) requires a separate webhook + state-transition workflow. Not bundled.
- The flow does not implement DSAR rate-limiting; abusive request patterns from a single sender are surfaced via the `malicious_signal` flag but the counsel decides how to respond.

## What to do when the malicious_signal is high

Examples that would trigger high `malicious_signal`:

- Sender claims to be a lawyer requesting another person's data (this is a discovery request, not a DSAR — different process).
- Request asks for data on a named third party.
- Request mentions impending litigation.

The counsel reviews. Common dispositions:

- Litigation-related: route to outside counsel, treat as discovery not DSAR.
- Lawyer-on-behalf-of: verify lawyer's authority to act for the data subject (power of attorney, written authorization).
- Attempt to extract third-party data: deny and document the denial (regulators may want to see how the firm handled spoofing attempts).
