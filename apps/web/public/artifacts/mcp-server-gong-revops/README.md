# mcp-server-gong-revops

A read-only MCP server over the Gong public API v2, tuned for RevOps questions that currently require a human to open Gong, filter a call list, read four calls, and write down what they saw. Exposes call discovery, tracker definitions, per-call analyzed signals (tracker matches with speaker attribution, Spotlight brief, key points, call outcome, talk-ratio stats), per-rep interaction stats, and one derived tool — `deal_risk_digest` — that joins tracker definitions to tracker occurrences and splits them by who actually said the thing.

> **STATUS: scaffold — not runtime-tested.** The code follows the official `mcp` Python SDK conventions and the endpoint paths, scopes, and field names track the public Gong API docs (help.gong.io/apidocs) as of 2026-07. It has not been executed against a live Gong account. Response field names in particular vary by account configuration — verify before you rely on it.

## Two things this server refuses to do

**No `get_deals` tool.** Gong's public API has no native read endpoint for deal-board data. The CRM endpoints (`GET /v2/crm/entities`) only read back objects you previously *uploaded* through a registered generic CRM integration, and Gong's own documentation marks that endpoint as development-phase verification only. Any MCP server advertising "ask Claude about your Gong deals" is either wrapping the UI, reading your CRM, or inventing the answer. `deal_risk_digest` is the honest substitute: it derives risk signals from conversations and tells you to join to the CRM for stage and amount.

**No writes.** The public API's write surface is call upload and generic-CRM object upload. Neither belongs behind a chat prompt, and read-only removes the entire class of "the model misread me and mutated the system of record" failure. If you need writes later, add them as separately-named tools with mandatory justification strings — never as a free-text command.

## What it exposes

- `find_calls(fromDateTime, toDateTime?, workspace_id?)` — `GET /v2/calls`. Cheap metadata: id, title, start, duration, direction, Gong URL. Scope a question here first, then pass ids to `call_signals`. Follows at most `GONG_MAX_PAGES` cursor pages of 100.
- `list_trackers(workspace_id?)` — `GET /v2/settings/trackers`. Tracker **definitions only** — ids, names, keywords, affiliation. No match counts; Gong does not return occurrence statistics from this endpoint. Call it to learn what your workspace actually tracks before guessing a tracker name in a question.
- `call_signals(call_ids? | fromDateTime, toDateTime?, workspace_id?)` — `POST /v2/calls/extensive` with a fixed `contentSelector`: parties, tracker matches, tracker occurrences, Spotlight brief, key points, auto call outcome, topics, speaker talk time, per-person interaction stats, public comments. The workhorse tool.
- `call_transcript(call_ids, justification)` — `POST /v2/calls/transcript`. Verbatim monologues with speaker id and millisecond offsets. Disabled unless `GONG_ALLOW_TRANSCRIPTS=true`, capped at `GONG_MAX_TRANSCRIPT_CALLS` (default 3), and requires a justification of at least 10 characters.
- `rep_interaction_stats(fromDate, toDate, user_ids?)` — `POST /v2/stats/interaction`. Longest monologue, longest customer story, interactivity, patience, question rate, per rep.
- `deal_risk_digest(fromDateTime, toDateTime?, tracker_names?, workspace_id?)` — derived. Scans calls in the range, keeps only occurrences of the trackers named in `GONG_RISK_TRACKERS`, and reports each hit split into `customer` / `internal` / `unattributed` by the speaker's party affiliation.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-gong-revops
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Generate Gong API credentials

A **technical administrator** creates these — a standard user seat cannot. In Gong: **Company Settings → Ecosystem → API**, then generate an Access Key and Access Key Secret. Copy the secret immediately; Gong shows it once.

The same page displays **your account's base URL**. Copy it. `https://api.gong.io` is the common value but not a universal one — accounts on regional or dedicated hosts get a different origin, and a wrong base URL returns **401, not 404**, which sends people debugging a credential problem they do not have.

### 3. Grant scopes

Scopes are attached to the key by the administrator who creates it. This server needs five:

| Scope | Used by |
|---|---|
| `api:calls:read:basic` | `find_calls` |
| `api:calls:read:extensive` | `call_signals`, `deal_risk_digest` |
| `api:calls:read:transcript` | `call_transcript` |
| `api:settings:trackers:read` | `list_trackers` |
| `api:stats:interaction` | `rep_interaction_stats` |

Grant only what you intend to use. Omitting `api:calls:read:transcript` is a second, key-level lock on transcripts on top of `GONG_ALLOW_TRANSCRIPTS`. Note what is deliberately **absent**: `api:calls:read:media-url`. The server never requests media URLs, so it never mints the 8-hour signed audio/video links that would otherwise outlive the conversation they appeared in.

### 4. Configure environment

```bash
export GONG_ACCESS_KEY="your-access-key"
export GONG_ACCESS_KEY_SECRET="your-access-key-secret"
export GONG_BASE_URL="https://api.gong.io"          # COPY YOURS from Company Settings -> API
export GONG_ALLOW_TRANSCRIPTS="false"               # true enables call_transcript
export GONG_MAX_TRANSCRIPT_CALLS="3"                # cap per transcript call
export GONG_MAX_PAGES="5"                           # cursor pages followed per tool call
export GONG_WORKSPACE_ID=""                         # optional default workspace
export GONG_MIN_REQUEST_INTERVAL="0.34"             # seconds between requests (3/s limit)
export GONG_RISK_TRACKERS="Pricing Pushback,Competitor Mention,Budget Freeze,Legal Review,Champion Left"
```

Env var notes:

- **`GONG_ACCESS_KEY` / `GONG_ACCESS_KEY_SECRET`** — from Company Settings → Ecosystem → API. Combined as `base64("key:secret")` and sent as `Authorization: Basic <token>`. If you register this as a Gong OAuth app instead, replace `auth_headers()` with a `Bearer` token.
- **`GONG_BASE_URL`** — account-specific. Copy it rather than trusting the default. This is the single most common setup failure.
- **`GONG_ALLOW_TRANSCRIPTS`** — the PII kill-switch. Transcripts put full verbatim customer speech into model context. Off by default; flip it only after someone has decided that is allowed for this data.
- **`GONG_MAX_TRANSCRIPT_CALLS`** — blast-radius cap. Three transcripts is already a large prompt. Raise it deliberately, never to "just get the analysis done."
- **`GONG_MAX_PAGES`** — the quota guard. Gong pages at 100 records and allows 10,000 requests/day by default; an unbounded cursor loop over a busy workspace can spend a real share of that answering one question. 5 pages = up to 500 records per tool call, and the response reports `truncated: true` so the model knows it did not see everything.
- **`GONG_RISK_TRACKERS`** — which tracker names count as risk. Gong ships no "this tracker means risk" flag, so this is a judgment your team makes. Replace the defaults with your actual tracker names from `list_trackers` — the defaults are placeholders and will match nothing in most workspaces.
- **`GONG_MIN_REQUEST_INTERVAL`** — requests are serialized behind this interval to stay under 3/second. Reactive 429 retries still burn daily quota on requests that were always going to fail.

### 5. Register with Claude

`claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`, Windows: `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "gong-revops": {
      "command": "/absolute/path/to/mcp-server-gong-revops/.venv/bin/python",
      "args": ["-m", "gong_revops_mcp.server"],
      "env": {
        "GONG_ACCESS_KEY": "your-access-key",
        "GONG_ACCESS_KEY_SECRET": "your-access-key-secret",
        "GONG_BASE_URL": "https://api.gong.io",
        "GONG_ALLOW_TRANSCRIPTS": "false",
        "GONG_MAX_PAGES": "5",
        "GONG_RISK_TRACKERS": "Pricing Pushback,Competitor Mention,Legal Review"
      }
    }
  }
}
```

For Claude Code, the same block goes in `.mcp.json` at the project root. Restart the client after editing.

### 6. Sanity check

Run these three in order. Each one isolates a different failure.

1. **"List the Gong trackers in my workspace."** → exercises auth, base URL, and `api:settings:trackers:read` on the cheapest possible request. A 401 here means base URL or credentials; a 403 means scopes. Copy the real tracker names out of the response into `GONG_RISK_TRACKERS`.
2. **"Find Gong calls from the last 7 days."** → exercises `GET /v2/calls` and cursor pagination. If `truncated` comes back `true`, your workspace has more than `GONG_MAX_PAGES × 100` calls in a week; narrow the range in real questions.
3. **"Pull the signals for the three most recent of those calls and tell me which trackers the customer raised."** → exercises `/v2/calls/extensive`, the fixed `contentSelector`, and speaker attribution. If tracker occurrences come back empty while counts are non-zero, your account does not expose `content.trackerOccurrences` and `deal_risk_digest` will report everything as `unattributed`.

## Security model

- **Token scope.** One account-level API key with five read scopes. It is not per-user: the key sees every call in the workspaces it covers, regardless of which human is chatting. Anyone who can talk to this MCP server can read any recorded call. If your Gong instance relies on per-user visibility rules, this server bypasses them — run it per-analyst with narrowly-scoped keys, or do not run it.
- **What leaves Gong.** Call metadata, party names/emails/titles, tracker matches, Spotlight briefs, key points, topics, and interaction stats go into the model context on every `call_signals` call. Verbatim customer speech goes only through `call_transcript`, which is off by default.
- **What never leaves.** Audio and video. The server does not request the `media` field and does not hold `api:calls:read:media-url`, so no signed recording links are minted.
- **Recording consent is upstream.** This server inherits whatever consent posture your Gong instance already has. It does not create a new consent question, but it does widen who can read the result — a recording a customer consented to being *recorded* is not automatically one they consented to being *summarized by a third-party model*. Check your DPA before enabling transcripts.

## Known limits — numbered TODO list before production use

1. **Not runtime-tested.** Every response-slimming function assumes field names from the docs (`metaData.id`, `content.trackers[].occurrences[].speakerId`, `usersAggregateActivity`). Run each tool once against a real account and fix the shapes before trusting output.
2. **No retry with backoff.** A 429 raises with the `Retry-After` value in the message instead of sleeping and retrying. Fine for interactive chat, wrong for unattended use.
3. **`deal_risk_digest` matches tracker names case-insensitively and exactly.** A renamed tracker silently stops matching and the digest reports zero risk — which reads as good news. Add a warning when a configured name matches no tracker returned by `list_trackers`.
4. **No caching.** Asking the same question twice spends the quota twice. A short-lived cache keyed on the filter would cut the common repeat-question cost.
5. **`rep_interaction_stats` has no call-count denominator.** Gong's stats derive only from calls with Whisper enabled, so a rep with three recorded calls looks statistically identical to a rep with a real problem. Join `find_calls` counts before showing these numbers to a manager.
6. **Single workspace assumption in the digest.** `deal_risk_digest` accepts one `workspace_id`; multi-workspace accounts need one call per workspace and a merge step.
7. **Account name comes from party emails, not the CRM.** `external_parties` is a list of names/emails, not a resolved account. Joining on email domain is the usual fix and it is not implemented here.
