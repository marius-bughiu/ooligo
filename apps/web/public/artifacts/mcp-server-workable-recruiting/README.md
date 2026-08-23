# mcp-server-workable-recruiting

A least-privilege MCP gateway that sits between Claude and Workable's hosted MCP server. Workable's server exposes 94 tools; this one forwards 33 of them, puts 13 more behind a two-phase human approval, and refuses the remaining 48 outright. It also pins the Workable account, caps the call rate, and strips EEO and compensation fields out of every response before they reach model context.

> **STATUS: scaffold — not runtime-tested.** The code follows the official `mcp` Python SDK conventions, and the endpoint, transport, OAuth discovery behaviour, tool names, and the `account` parameter rule all track Workable's published MCP documentation (`workable.readme.io/reference/workable-mcp-server`) as of 2026-08-23. It has not been executed against a live Workable account. Response field names in particular are account-specific. Verify against your own account before trusting the redaction list.

## Read this first: you might not need this

Workable hosts the server itself at `https://mcp.workable.com/mcp`. It is included at no added cost on every Workable subscription plan, it authenticates over OAuth2 with no key to store or rotate, and every session is scoped to the signed-in user's own role and job assignments. Connecting to it directly takes one command:

```bash
claude mcp add workable --transport http https://mcp.workable.com/mcp
```

If your Claude client can restrict tools per connector — Claude Code can, through `permissions.deny` in `settings.json` — do that instead of running this gateway. `claude-code-permissions.example.json` in this bundle is the same policy expressed that way, generated from the same source file, and it costs zero infrastructure.

Run this gateway when at least one of these is true:

- **The allowlist has to hold centrally, not per laptop.** A client-side settings file is enforced by each recruiter's client. A gateway is enforced once, by you, and a recruiter who edits their own `settings.json` does not widen it.
- **You need responses redacted, not just tools blocked.** Blocking `search_employees` does not stop `get_candidate` returning a self-identification field your account happens to collect. Only a response-side filter does.
- **You need your own audit log.** The gateway logs every forwarded call to your infrastructure, including the ones it refused.
- **You need two-phase approval on writes, not a client-side prompt.** A confirmation dialog depends on a human reading it. A token bound to the exact arguments does not.

## Why 48 tools are refused

Workable launched the server on 2026-05-13 with 38 tools and expanded it to 94 on 2026-07-20. The July release added read *and* write access across performance reviews, account and permissions management, and candidate profile updates. That is a wide grant for an assistant that answers pipeline questions, and the hosted server's own scoping does not narrow it — it inherits whatever the signed-in human can do. Recruiting-ops leads, who install this first, are usually admins.

The refusals are grouped in `src/workable_gateway/policy.py`, one set per rationale:

| Group | Tools | Why |
|---|---|---|
| `DENY_IDENTITY` | 4 | `invite_member`, `update_member`, `enable_member`, `delete_member`. An agent that can grant a permission set can widen its own reach on the next session. |
| `DENY_ORG_STRUCTURE` | 4 | `merge_department` has no inverse, and recruiting reports are cut by department. A bad merge rewrites funnel history silently. |
| `DENY_APPROVALS` | 5 | Offer, requisition, and time-off approvals are acts of authority by a named person. Delegating them erases the evidence that a person decided. |
| `DENY_TIME_TRACKING` | 6 | Payroll-adjacent. `bulk_create_time_entries` turns one bad inference into a bulk pay error. |
| `DENY_PERFORMANCE` | 15 | `submit_review` is final — Workable's docs note a second submit fails — and `sign_review` is an attestation. The reads go with them: review content is manager-confidential and has no recruiting use. |
| `DENY_HRIS_READS` | 14 | Employee documents hold contracts, comp letters, and visa or medical paperwork. Time-off records are absence data. |

The tier function is default-deny. Workable added 37 tools in a single release; anything that appears upstream after this file was written stays dark until a human classifies it.

## What it exposes

**33 forwarded directly** — 32 reads plus `add_comment`, the one write that is additive, attributable, and removable in the Workable UI. The reads cover jobs (9), candidate records and activity (6), offers and requisitions (3), members and permission sets (2), pipeline and account config (3), org context (2), advanced candidate search (3), and remaining context (3), plus `get_accounts`.

**13 behind the approval gate** — the candidate and requisition writes: `move_candidate`, `disqualify_candidate`, `revert_disqualification`, `relocate_candidate`, `copy_candidate`, `create_candidate`, `create_talent_pool_candidate`, `update_candidate`, `update_candidate_tags`, `upsert_candidate_rating`, `add_review`, `create_requisition`, `update_requisition`. Calling one without `_gateway_confirm` returns a dry run. The `_gateway_token` in that dry run is a hash of the tool name plus the exact arguments, so an approval for "move candidate 41 to Onsite" cannot be replayed as "move candidate 88 to Offer".

**3 gateway-native tools**, defined in `src/workable_gateway/server.py`:

- `workable_policy_report(include_withheld?)` — what this assistant can and cannot reach, with the tier for each tool and the calls used so far against the process ceiling. Point the model at this when a call is refused, so the recruiter gets "that is blocked, do it in Workable" instead of a retry loop.
- `workable_pipeline_snapshot(shortcode, stalled_after_days=14)` — job title, stage list, candidate count per stage, and the candidates with no activity for N days. One paged sweep capped at `WORKABLE_PAGE_CAP` calls, rather than one call per stage: the cost is the same whether the job has 4 stages or 14.
- `workable_stage_move_review(candidate_id, target_stage, reason, confirm?, dry_run_token?)` — the richer path for the most common write. The dry run resolves the candidate's current stage so the recruiter approves a diff, not a request. On confirm it writes the reason to the activity feed with `add_comment` first, then calls `move_candidate`, so the audit trail exists even if the move fails.

## Setup

### 1. Install

```bash
cd mcp-server-workable-recruiting
python -m venv .venv
source .venv/bin/activate     # .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Choose the Workable identity you connect as

Do this before the first OAuth run, because the browser sign-in decides the ceiling for everything below. The hosted server grants the authenticated user's permissions, so signing in as yourself gives the gateway your access. Create a dedicated Workable member for it and assign a narrowed permission set — `get_permission_sets` lists what your account has defined. The gateway's allowlist is then a second wall, not the only one.

### 3. Set the environment variables

**`WORKABLE_ACCOUNT`** (required). Your Workable subdomain. Every tool except `get_accounts` takes an `account` parameter, and this is that value. Find it in the host of your Workable URL — for `https://acme.workable.com` it is `acme` — or run the hosted server's `get_accounts` once and read the subdomain it returns. The gateway injects this on every forwarded call and rejects any call where the model supplied a different one.

**`WORKABLE_MCP_URL`** (default `https://mcp.workable.com/mcp`). Only change this if Workable publishes a regional endpoint.

**`WORKABLE_TOKEN_PATH`** (default `~/.workable-gateway.json`). Where the OAuth client registration and refresh token are written, mode 0600. On a shared host, put it somewhere only the gateway's service user can read — this file is a live credential.

**`WORKABLE_OAUTH_CALLBACK_PORT`** (default `8765`). The localhost port the one-shot redirect listener binds during authorization. Change it if something else owns 8765. If you see a redirect-URI mismatch on first connect, this is the value that has to agree with what got registered.

**`WORKABLE_RATE_PER_SEC`** (default `4`). Workable's OAuth 2.0 rate bucket is 50 requests per 10 seconds — 5/s sustained — and returns HTTP 429 with `X-Rate-Limit-Reset` above it. The default leaves headroom for whatever else in your tenant holds the same token.

**`WORKABLE_MAX_CALLS_PER_PROCESS`** (default `400`). Hard ceiling per gateway process. A single chat turn that needs hundreds of upstream calls is a report, not a conversation; the ceiling makes that visible instead of letting it drain the rate budget.

**`WORKABLE_PAGE_CAP`** (default `5`). Maximum pages `workable_pipeline_snapshot` drains, at 100 candidates per page. 500 candidates covers a normal req; the response sets `page_cap_reached` when it does not, so the model can say so rather than quietly reporting a partial count.

**`WORKABLE_LOG_LEVEL`** (default `INFO`).

### 4. Register the gateway with your client

Claude Code:

```bash
claude mcp add workable-gateway -- /absolute/path/to/.venv/bin/workable-gateway
```

Claude Desktop — `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "workable-gateway": {
      "command": "/absolute/path/to/.venv/bin/workable-gateway",
      "env": {
        "WORKABLE_ACCOUNT": "acme",
        "WORKABLE_RATE_PER_SEC": "4",
        "WORKABLE_MAX_CALLS_PER_PROCESS": "400"
      }
    }
  }
}
```

Use absolute paths. Claude Desktop does not run a login shell, so `workable-gateway` on your `PATH` is not on its `PATH`.

### 5. Authorize

The first tool call opens a browser to Workable's authorization page. Sign in as the identity from step 2 and approve. The registration and refresh token land in `WORKABLE_TOKEN_PATH`; later runs do not prompt. Workable's server advertises RFC 8414 authorization-server metadata and accepts RFC 7591 dynamic client registration, so there is no client ID to provision by hand.

## First-run verification

Run these four in order. Each proves one wall works before you let a recruiter near it.

1. **Policy loads.** Ask: *"Run workable_policy_report with include_withheld."* Expect `upstream_tool_count: 94`, `exposed_count: 46`, `withheld_count: 48`. If `upstream_tool_count` is higher than 94, Workable shipped new tools — they are already dark by default-deny, and classifying them is your next task, not an emergency.
2. **Reads work and the account is pinned.** Ask: *"Search Workable for jobs matching 'engineer'."* You should get results. Then check the log line for the forwarded call and confirm `account` matches `WORKABLE_ACCOUNT`.
3. **The deny wall holds.** Ask: *"Deactivate the Workable member for jane@example.com."* Expect a refusal naming `delete_member` and pointing at the Workable UI — not an attempt, and not a hedge.
4. **The approval gate holds.** Ask: *"Move candidate `<id>` to the Onsite stage because the phone screen went well."* Expect a dry run with the current stage, the target stage, and a `dry_run_token` — and no move. Confirm in Workable that the candidate did not move. Then approve and re-check.

Only step 4 writes anything. Do all four against a test job with a fake candidate first.

## Security model

- **The token is a live Workable credential.** It grants whatever the authorizing member can do — read *and* write. Treat `WORKABLE_TOKEN_PATH` as you would an API key. Revoke by removing the connector from the authorizing member's Workable account.
- **The gateway's allowlist is defence in depth, not the boundary.** The boundary is the permission set on the Workable member you authorized as. Anyone who can reach the gateway's stdio can reach every tool in the ALLOW tier; anyone who can edit `policy.py` can reach all 94. Deploy it where recruiters can use it and cannot edit it.
- **Candidate data reaches Anthropic.** Résumés from `get_candidate_files`, notes, and activity feeds enter model context. EU candidates are GDPR data subjects and California candidates are CCPA data subjects. Get the AI policy signed off before this touches a live account, not after.
- **Redaction is name-based and account-specific.** `policy.REDACT_FIELDS` blanks fields by key name, recursively. If your account collects self-identification under a custom attribute with a different key, it is not covered until you add it. Confirm the real names with `get_account_custom_attributes` and `get_candidate_detailed_fields`.
- **Advanced candidate search is plan-gated.** Workable restricts the Advanced Search tools to Premier+ and Enterprise plans. On lower plans those three tools are in the ALLOW tier but will not appear upstream, which is correct — the gateway advertises the intersection of policy and what Workable actually serves.

## Limits and TODOs

Before this runs against a production account:

1. **Verify the redaction field names.** The list in `policy.py` is generic. Pull your account's real attribute keys and replace it. This is the single highest-value item here.
2. **Add a persistent audit log.** Calls currently go to Python `logging` at INFO. Write them to durable storage with the tool name, tier, arguments hash, the authorizing member, and a timestamp — that record is what makes the deployment defensible to a works council or an auditor.
3. **Handle 429 explicitly.** The token bucket avoids the limit; it does not react to one. Read `X-Rate-Limit-Reset` from the upstream error and back off to it instead of retrying blind.
4. **Confirm the write tools' argument names.** `move_candidate` and `add_comment` are called in `handle_stage_move_review` with the argument shapes in this scaffold. Read the live `inputSchema` from `list_tools` and align.
5. **Reconnect on upstream drop.** `Upstream.connect` runs once at startup. A dropped session currently kills the process rather than re-authorizing.
6. **Decide the HRIS profile separately.** `DENY_HRIS_READS` is right for recruiters and wrong for People Ops. Build a second `Policy` instance and a second gateway process rather than widening this one.
7. **Pin the dependency versions.** `pyproject.toml` uses lower bounds. Lock them before deploying.

## Files

```
mcp-server-workable-recruiting/
├── README.md
├── pyproject.toml
├── claude-code-permissions.example.json   # same policy, no gateway
└── src/workable_gateway/
    ├── __init__.py
    ├── policy.py                          # the tiers — edit this file
    └── server.py                          # stdio server, upstream client, gates
```
