# everlaw-ediscovery-mcp

A read-only MCP server over the Everlaw REST API that exposes review-management data: assignment groups, the project coding schema, search term reports, and a computed reviewed / not-reviewed rollup per assignment group.

**Read this first.** Everlaw already runs a hosted MCP server at `https://api.everlaw.com/v1/mcp`. If your question is "find me documents," connect that one instead — it authenticates the signed-in user over OAuth, inherits that user's Everlaw permissions exactly, and needs no infrastructure from you. This scaffold is not a replacement for it and does not duplicate its tools.

It exists because of a specific gap. The hosted server registers eight tools — `GetProjects`, `GetProjectBinders`, `GetProjectMetadataFields`, `GetProjectProcessedUploads`, `GetProjectDatasets`, `PostProjectSearch`, `GetProjectSearchResult`, `DescribeProjectSearchTerm` — and its `PostProjectSearch` accepts an `ASSIGNED` term and a `CODED` term. Those two terms require ids (`assignmentGroup.id`, `assignmentId`, `labelId`, `userId`) that none of the eight tools return. Everlaw's own reference points the reader at `GetProjectAssignmentGroups`, `GetProjectCodes`, `GetProjectUsers` and `GetProjectGroups` for them, and those are REST operations rather than tools on the hosted server. This scaffold registers the missing lookups, plus the progress rollup that has no endpoint of its own.

Run both servers side by side: the hosted one for search and documents, this one for the review-management identifiers and status numbers.

> **Not runtime-tested.** Paths, scope groups, permission names and response shapes track the published Everlaw OpenAPI specification (`https://api.everlaw.com/docs/everlaw-openapi.yaml`) as of August 2026. Nobody has run this against a live tenant. Treat first-run output as unverified until you have checked each tool against numbers you can confirm in the Everlaw UI.

## Install

Python 3.11 or newer.

```bash
cd mcp-server-everlaw-ediscovery
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e .
```

## Environment variables

### `EVERLAW_API_KEY` (required)

An Everlaw organization API key, used as a bearer token. Generate it on the **API keys** tab of the Organizations page in Everlaw; you need Organization Admin rights to do so. Keys look like `everlaw-api.XXXX.YYYYYYYY`.

An API key is not tied to the creator's user account and grants access equivalent to an Organization Admin, bounded by the per-endpoint permissions you grant it. Grant these four and no others:

| Permission | Scope group | Used by |
|---|---|---|
| `GetProjectAssignmentGroups` | `REVIEW_READ` | `list_assignment_groups`, `review_progress` |
| `GetProjectCodes` | `REVIEW_READ` | `list_codes` |
| `PostProjectSearch` | `REVIEW_READ` | `review_progress` |
| `GetProjectSearchTermReports` | `REVIEW_READ` | `list_search_term_reports` |

Do not grant `DATA_WRITE`, `USER_MANAGEMENT_WRITE`, `LEGAL_HOLD_WRITE`, or `SCIM`. No tool here writes anything, and a key that can write is a key that can be made to write.

If your organization has OAuth2 enabled, prefer a client-credentials service account over a long-lived API key: tokens expire in 1800 seconds and requests execute as the bound service account for audit purposes. OAuth2 is disabled in FedRAMP environments, where the API key is the only option.

### `EVERLAW_BASE_URL` (optional, defaults to `https://api.everlaw.com/v1`)

Everlaw runs regional stacks with separate API hosts. UK tenants use `https://api.everlaw.co.uk/v1`. A key issued in one region does not authenticate against another region's host — the symptom is a 401 on every call including `/status`.

### `EVERLAW_ALLOWED_PROJECTS` (strongly recommended)

Comma-separated numeric project ids the agent may touch, e.g. `2,17,204`. Left empty, every project the key can reach is in scope. An organization API key can read across matters governed by different protective orders; the allowlist is what keeps a question about one matter from returning data about another. Find project ids via the hosted server's `GetProjects` tool or in the project URL.

### `EVERLAW_ENABLE_USER_LOOKUP` (optional, defaults to `false`)

Turns on `resolve_assignee_names`. Off by default because `GetProjectUsers` sits in the `USER_MANAGEMENT_READ` scope group, which also covers groups, permissions and invitations — a wider grant than the `REVIEW_READ` every other tool needs. Enable it only if reviewer names, rather than ids, genuinely need to appear in chat transcripts.

## Register with Claude

Claude Desktop — `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "everlaw-ediscovery": {
      "command": "/absolute/path/to/.venv/bin/python",
      "args": ["-m", "everlaw_ediscovery_mcp.server"],
      "env": {
        "EVERLAW_API_KEY": "everlaw-api.XXXX.YYYYYYYY",
        "EVERLAW_BASE_URL": "https://api.everlaw.com/v1",
        "EVERLAW_ALLOWED_PROJECTS": "2,17"
      }
    }
  }
}
```

Claude Code — from the repo root:

```bash
claude mcp add everlaw-ediscovery -- /absolute/path/to/.venv/bin/python -m everlaw_ediscovery_mcp.server
```

To connect Everlaw's hosted server alongside it, add its resource URL as a remote MCP server; it advertises RFC 9728 protected-resource metadata, so a standards-compliant client completes the OAuth flow with no manual setup beyond the URL:

```bash
claude mcp add --transport http everlaw-hosted https://api.everlaw.com/v1/mcp
```

## First-run verification

Run these four in order. Each one proves a different failure mode is absent, and each has an answer you can confirm in the Everlaw UI. Do not skip to real questions until all four pass.

1. **Credential and region.** Ask Claude to list assignment groups for a project id you know exists. A 401 means the key or the region host is wrong. A 403 means the key is valid but lacks `GetProjectAssignmentGroups` or read access to that project — Everlaw returns the same 403 for "no such project," so check the permission before you doubt the id.
2. **Allowlist.** Ask for a project id you deliberately left out of `EVERLAW_ALLOWED_PROJECTS`. You should get an allowlist error from this server, with no HTTP request made. If real data comes back, the variable is not being read — check for a typo in the config `env` block.
3. **Coding schema.** Ask for the coding schema. Compare category and code names against the project's coding panel in the Everlaw UI. Mismatched or missing categories mean the key is reading a different project than you think.
4. **Progress arithmetic.** Ask for review progress on one assignment group by id. Open that group in Everlaw and compare the reviewed count. If they disagree, the group's review criteria are not what you assumed — that is the tool reporting correctly, not a bug, but confirm it before quoting the number to anyone.

After step 4, open the project's search history in Everlaw. You should see two new saved searches per group you queried. That is expected and is the cost of the tool; see below.

## What this server does not do

- **No document retrieval and no document text.** The hosted server's `GetProjectSearchResult` does that under the signed-in user's own permissions, which is the right place for it. An organization API key is a blunter instrument and should not be pointed at document content.
- **No per-document coding decisions.** `list_codes` returns the coding schema — which categories and codes exist — not how any document was coded. A reviewer's coding calls on specific documents are work product.
- **No audit log and no user analytics.** `GetProjectAnalytics` and the project event endpoints sit in the `SECURITY_READ` scope group and require org-admin access. Reviewer-by-reviewer activity data raises supervision questions this tool should not answer by accident.
- **No writes of any kind.** Nothing here codes a document, creates an assignment, or modifies a project.

## Known limits — resolve before production use

1. **Nothing here has been run against a live tenant.** Verify each tool's output against the Everlaw UI before anyone relies on a number from it.
2. **`review_progress` creates saved searches.** Two per assignment group per call, each visible in the project's search history with a `https://app.everlaw.com/<searchId>` URL. Everlaw caps the number of user-visible objects the API may create and returns 422 when you hit it. Decide with your review-team lead whether that history noise is acceptable before wiring this to anything scheduled, and never put this tool behind a polling loop.
3. **"Reviewed" is a per-group setting.** Each assignment group defines its own review criteria; the percentage this server returns follows that definition and is not a synonym for "coded" or "QC-complete." Two groups on the same project can mean different things by the same number.
4. **Rate limiting is coarse here.** The client paces itself at 8 requests/second against Everlaw's documented 25 rps per authenticating user account, with a four-way concurrency gate and exponential backoff on 429. That budget is shared with anything else using the same key. If you run this alongside a nightly export job on the same credential, give the export its own key.
5. **Pagination is single-page.** Every list tool sends `limit` and reads the first page; it does not follow the `links.next` cursor. A project with more than 200 assignment groups will silently under-report. Add cursor-following before using this on a project that large.
6. **No caching.** Every question re-queries. The coding schema and assignment-group list change rarely; a short-lived cache would cut most of the traffic, and is the first thing to add if you hit rate limits.
7. **Region and FedRAMP.** OAuth2 is disabled in FedRAMP environments, so those tenants must use an API key. Confirm which stack your matters live on before provisioning credentials.
