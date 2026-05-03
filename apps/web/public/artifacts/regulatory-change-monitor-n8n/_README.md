# Regulatory change monitor — n8n flow

Polls a curated set of regulatory feeds hourly, classifies each new item against the firm's exposure profile with Claude, and posts immediate Slack alerts on `high_urgency` items plus a daily 8am digest. Replaces the in-house counsel's "RSS-feed-and-newsletter graveyard" with a relevance-filtered queue.

## Import

1. Import `regulatory-change-monitor-n8n.json`.
2. Provision the database tables (DDL below).
3. Wire credentials (Anthropic, Slack, Postgres).
4. Author the firm's exposure profile.
5. Seed the feed list.
6. Dry-run for two weeks before flipping `active: true`.

## Database tables

```sql
-- The feeds the flow polls.
CREATE TABLE regulatory_feeds (
    feed_id          TEXT PRIMARY KEY,
    feed_url         TEXT NOT NULL,
    feed_format      TEXT NOT NULL CHECK (feed_format IN ('rss', 'atom', 'json')),
    description      TEXT,
    active           BOOLEAN NOT NULL DEFAULT true,
    last_etag        TEXT,
    last_polled_at   TIMESTAMPTZ
);

-- One row per classified item.
CREATE TABLE regulatory_items (
    item_id              BIGSERIAL PRIMARY KEY,
    feed_id              TEXT NOT NULL REFERENCES regulatory_feeds (feed_id),
    item_guid            TEXT NOT NULL,
    title                TEXT NOT NULL,
    link                 TEXT NOT NULL,
    summary_raw          TEXT,
    summary_classified   TEXT,
    published_at         TIMESTAMPTZ,
    relevant_to_profile  BOOLEAN NOT NULL,
    jurisdictions        TEXT[],
    regulatory_areas     TEXT[],
    urgency              TEXT NOT NULL CHECK (urgency IN ('low','medium','high')),
    recommended_owner    TEXT,
    classified_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (feed_id, item_guid)
);

CREATE INDEX reg_items_urgency_idx ON regulatory_items (urgency, classified_at DESC);
CREATE INDEX reg_items_relevant_idx ON regulatory_items (relevant_to_profile, classified_at DESC);
```

## Credentials

- `PLACEHOLDER_REG_DB_CRED_ID` — Postgres write access to the two tables above.
- `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic API key (Sonnet 4.6).
- `PLACEHOLDER_SLACK_CRED_ID` — `chat:write` scope, bot in `#legal-alerts` and `#legal-team`.

## Firm exposure profile

The classifier prompt expects a system message with the firm's exposure profile. Maintain this as a Markdown file (e.g. `firm-exposure-profile.md`) and inject it into the Claude system message at flow runtime (the bundled flow has it in the prompt; for the production version, load from disk and prepend).

```yaml
profile_version: 2026.1
last_updated: 2026-04-15

jurisdictions_in_scope:
  - EU-GDPR
  - UK-GDPR
  - CCPA-CPRA
  - VCDPA  # Virginia
  - CDPA   # Colorado
  - CPA    # Connecticut
  - LGPD   # Brazil
  - US-Federal  # SEC, FTC, DOJ
  - NY-state    # NYC LL 144, NYDFS

regulatory_areas:
  - data-privacy
  - ai-employment-law
  - ai-act-eu
  - securities
  - consumer-protection
  - sector-specific:financial-services

sectors:
  - saas
  - financial-services-adjacent  # firm processes financial data but is not a regulated bank

data_types_processed:
  - eu-personal-data
  - california-personal-information
  - us-employee-data
  - us-customer-data
  - financial-transaction-data

penalty_exposure_thresholds:
  - GDPR Art. 83: 4% global revenue (any GDPR-related rule change is at minimum medium urgency)
  - NYC LL 144: $500-$1500/day per untracked AI hiring tool (any LL 144 change is at minimum medium urgency)
  - SEC: variable (rule changes affecting financial-data processing are at minimum medium urgency)

named_counsel_owners:
  - data-privacy: Privacy Counsel (privacy@firm.com)
  - ai-employment-law: Employment Counsel + DPO
  - securities: Securities Counsel
  - consumer-protection: General Counsel
  - financial-services: External regulatory counsel

urgency_rules:
  high:
    - Enforcement decision against a peer firm in our jurisdictions
    - Final rule with effective date within 90 days
    - Court ruling that materially changes interpretation in our jurisdictions
    - Direct firm-mention or industry-segment-mention in a regulator's press release
  medium:
    - Rule proposal in scope-jurisdiction
    - Guidance document from a regulator we track
    - Enforcement decision against any firm in our regulatory area but outside our jurisdictions
  low:
    - Consultation paper / call for evidence
    - Conference / speech by regulator on topics in scope
    - Academic or trade-association commentary
```

## Default feed seed

Seed `regulatory_feeds` with these to start:

```sql
INSERT INTO regulatory_feeds (feed_id, feed_url, feed_format, description) VALUES
  ('eu-commission-ai-act', 'https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai/feed', 'rss', 'EU Commission AI Act updates'),
  ('edpb-news', 'https://www.edpb.europa.eu/news/news_en?type=All', 'rss', 'European Data Protection Board news'),
  ('ico-news', 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/feed/', 'rss', 'UK ICO press releases and enforcement'),
  ('sec-rules', 'https://www.sec.gov/rules-regulations/rss/proposed', 'rss', 'SEC proposed rules'),
  ('ftc-press', 'https://www.ftc.gov/news-events/news/press-releases/feed', 'rss', 'FTC press releases'),
  ('nyc-consumer-affairs', 'https://www.nyc.gov/site/dca/about/dca-news.page', 'rss', 'NYC Department of Consumer and Worker Protection (LL 144 source)'),
  ('cppa-news', 'https://cppa.ca.gov/news/feed.xml', 'rss', 'California Privacy Protection Agency news'),
  ('edps-news', 'https://www.edps.europa.eu/news_en?language=en', 'rss', 'European Data Protection Supervisor');
```

Add or remove based on the firm's exposure profile. Each feed should be one the firm would otherwise ask a counsel to monitor manually; if no one would otherwise monitor it, drop it.

## Daily digest (separate workflow)

The bundled flow handles the per-item path. The daily 8am digest is a separate small workflow:

1. Cron at 8am office TZ.
2. Postgres query: items with `relevant_to_profile = true AND classified_at > NOW() - INTERVAL '24 hours'`.
3. Group by `regulatory_areas` and order by urgency.
4. Compose digest Markdown.
5. Post to `#legal-team`.

The digest workflow is small enough to assemble from this README; not bundled separately.

## Dry-run procedure

1. Provision tables on a non-production DB.
2. Wire credentials with a test Slack workspace.
3. Run for 2 weeks. Counsel reviews the daily digest + immediate alerts.
4. Counsel marks each digest item as relevant / not-relevant.
5. After 2 weeks: tune the exposure profile (add/remove jurisdictions, areas, urgency rules) based on the false-positive and false-negative patterns.
6. Promote to production.

## Known limits

- Feed-format support: RSS / Atom only via `rss-parser`. JSON-feed support requires a different parser node; not bundled.
- Duplicate detection on `(feed_id, item_guid)` via the unique constraint. Some feeds re-issue items with different GUIDs on minor edits — re-classification is the cost.
- Hourly polling cadence; for sub-hour latency on high-urgency feeds, add a webhook-triggered flow (not bundled).
- The classifier sees only the item title + summary + link. For deep-content classification, fetch the link content and inject it before classification (more tokens, more cost; usually not necessary).
- The audit-trail of profile changes is the git history of the profile file; the flow doesn't track in-DB.
