# Evidence collection for ediscovery — n8n flow (skeleton)

Orchestrates the EDRM "Collection" stage: per-custodian per-source dispatch against Google Workspace Vault, M365 Compliance, Slack Discovery, and custom SaaS sources. Hashes every export, writes chain-of-custody to an immutable audit table, uploads to the e-discovery platform.

**This is a skeleton flow.** The bundled n8n JSON shows the structure (request → load plan → dispatch per source → audit) and includes a working Google Vault saved-query node as an exemplar. Production deployment requires the firm's ediscovery engineer to:

1. Complete the per-source nodes (Google Vault has create-query → start-export → poll-export → fetch-blob; bundled flow shows only create-query).
2. Wire the M365 Compliance and Slack Discovery branches (skeleton has placeholders).
3. Replace the placeholder hash in `Hash + Chain-of-Custody` with actual export-bytes hashing.
4. Add the upload-to-Relativity / Everlaw / Logikcull node at the end.
5. Add per-source rate limiters.

The flow's value is in the structure (audit shape, dispatch pattern, chain-of-custody discipline) — the per-source connector code is firm-specific.

## Database tables

```sql
-- Counsel-approved collection plan. One row per (custodian, source) pair.
CREATE TABLE collection_plans (
    collection_plan_id   TEXT NOT NULL,
    plan_sha             TEXT NOT NULL,
    matter_id            TEXT NOT NULL,
    custodian_id         TEXT NOT NULL,
    source               TEXT NOT NULL,
    scope_json           JSONB NOT NULL,
    status               TEXT NOT NULL CHECK (status IN ('draft','approved','executed','superseded')),
    approved_by          TEXT,
    approved_at          TIMESTAMPTZ,
    PRIMARY KEY (collection_plan_id, custodian_id, source)
);

-- Chain-of-custody, append-only.
CREATE TABLE collection_audit (
    audit_id                          BIGSERIAL PRIMARY KEY,
    matter_id                         TEXT NOT NULL,
    collection_id                     TEXT NOT NULL,
    custodian_id                      TEXT NOT NULL,
    source                            TEXT NOT NULL,
    plan_sha                          TEXT NOT NULL,
    collected_at                      TIMESTAMPTZ NOT NULL,
    collected_by_service_account      TEXT NOT NULL,
    hash                              TEXT NOT NULL,
    file_count                        INTEGER NOT NULL,
    byte_count                        BIGINT NOT NULL,
    scope_summary                     TEXT,
    upload_load_id                    TEXT,  -- e-discovery platform load ID, written when upload completes
    upload_completed_at               TIMESTAMPTZ
);

CREATE INDEX collection_audit_matter_idx ON collection_audit (matter_id, collected_at);

-- Immutability:
REVOKE UPDATE, DELETE, TRUNCATE ON collection_audit FROM PUBLIC;
GRANT INSERT, SELECT ON collection_audit TO <ediscovery_app_role>;
-- upload_load_id and upload_completed_at can be UPDATEd via a function that
-- enforces "only when previously NULL" — implement as a stored procedure
-- if you need to record platform-side load IDs after collection.
```

## Per-source connector notes

### Google Workspace Vault

API doc: https://developers.google.com/vault/

- Service account with delegated authority to access user data.
- Create-query → start-export → poll-export-status → fetch-blob sequence. Exports are async; polling can take minutes to hours.
- Vault matter must exist; the flow can create-or-reuse.
- Hold should be in place at the matter level before query (separate workflow — see [litigation hold orchestration](../litigation-hold-orchestration-n8n/)).
- Rate limits: per-project quotas. Vault tends to be export-job-bound rather than rate-limit-bound.

### Microsoft 365 Compliance

API doc: https://learn.microsoft.com/en-us/microsoft-365/compliance/

- Per-tenant app registration with Compliance Center scopes (eDiscovery.Manage etc.).
- Content search → run-search → start-export → download-export sequence.
- Advanced eDiscovery (eDiscovery Premium) is an E5 add-on — confirm tenant licensing.
- Rate limits: per-tenant; varies by SKU.

### Slack Discovery

API doc: https://api.slack.com/enterprise/discovery (Enterprise Grid only)

- Discovery API only available on Slack Enterprise Grid.
- Per-channel and per-user export endpoints. The Discovery API is rate-limited aggressively (single-digit req/sec for most endpoints).
- Output is JSON-line message records; preserve files via separate file-export endpoint.
- Pagination is cursor-based; loop until empty.

### Custom SaaS

For internal tools or smaller SaaS that the team uses:

- Document the source's export shape and chain-of-custody implications.
- Build a connector node that writes to the same per-source pattern as the bundled examples.
- Hash the export at fetch time, append to audit table.

## Chain-of-custody record format

Each `collection_audit` row is the chain-of-custody record. Counsel demonstrates collection adequacy via these records:

```
Matter: M-2026-0042
Collection: coll-20260503-abc123
Custodian: jane-doe@firm.com
Source: google-vault
Collected at: 2026-05-03T14:00:00Z
Service account: ediscovery-bot@firm
Hash (SHA-256): a3f2b1c4...
File count: 1,247
Byte count: 4,231,789,022
Scope: { "email": "jane-doe@firm.com", "start_time": "2024-01-01", "end_time": "2026-04-30", "terms": "(\"Acme deal\" OR \"Project X\") AND -from:counsel@firm" }
Upload to e-discovery: load-2026-05-03-abc123 (Relativity workspace 'M-2026-0042')
```

For court submissions, the chain-of-custody records typically need to be produced in a more formal format — a paralegal exports the audit records and formats per jurisdictional requirements. The flow's records are the source data.

## Credentials

- `PLACEHOLDER_PLAN_DB_CRED_ID` — read access to `collection_plans`.
- `PLACEHOLDER_AUDIT_DB_CRED_ID` — write access to `collection_audit`.
- `PLACEHOLDER_GOOGLE_VAULT_CRED_ID` — service account with delegated authority.
- `PLACEHOLDER_M365_CRED_ID` — per-tenant app registration with Compliance Center scopes.
- `PLACEHOLDER_SLACK_DISCOVERY_CRED_ID` — Slack org-admin token with `discovery:read` scope.
- `PLACEHOLDER_RELATIVITY_CRED_ID` — Relativity REST API credentials (or Everlaw / Logikcull equivalent).

## Dry-run procedure

1. Provision tables on a non-production DB.
2. Wire credentials to staging endpoints (test Google project, test M365 tenant, test Slack workspace).
3. Replay a closed matter's collection plan against staging sources (with anonymized custodian data).
4. Verify chain-of-custody records and platform-side load IDs.
5. Switch to production credentials only after a full successful dry-run.

## Known limits / production-readiness gaps

This is a skeleton. Before production:

1. Per-source export polling — Google Vault and M365 Compliance exports are async; the flow needs a poll-and-resume pattern (not bundled).
2. Per-source export-blob fetching — once the export is ready, the flow needs to download the blob and hash it (skeleton uses placeholder hash).
3. M365 Compliance branch — entirely skeleton; needs Content Search + Search Result Export wiring.
4. Slack Discovery branch — entirely skeleton; needs cursor-based per-channel paging.
5. E-discovery platform upload — not bundled; per-platform Relativity / Everlaw / Logikcull connector required.
6. Per-source rate limiting — the per-source nodes need rate limiters in production.
7. Error recovery — failed-export retry / replay logic not bundled.

This skeleton's value is in the orchestration shape and the audit / chain-of-custody discipline; the connector layer is the firm's ediscovery engineering work.
