"""
gong-revops-mcp — read-only MCP server over the Gong public API v2.

Exposes call discovery, tracker definitions, extensive per-call signals (trackers,
tracker occurrences, Spotlight brief, key points, call outcome, per-person interaction
stats), rep interaction stats, and a derived deal-risk digest that joins tracker
definitions to tracker occurrences across a date range.

Two things this server deliberately does NOT do:

1. There is no `get_deals` tool. Gong's public API has no native read endpoint for
   deal-board data. `GET /v2/crm/entities` only reads back objects you previously
   uploaded through a registered generic CRM integration, and Gong's own docs mark it
   as development-phase verification only. Deal risk here is DERIVED from calls plus
   trackers (see `deal_risk_digest`); for authoritative deal fields, query the CRM's
   own API instead.
2. There are no writes. The public API's write surface is call upload and generic-CRM
   object upload, neither of which belongs behind a chat prompt. Read-only removes the
   whole class of "the model misread me and changed the system of record" failure.

STATUS: scaffold — not runtime-tested. Endpoint paths, scopes, and field names track
the public Gong API docs (help.gong.io/apidocs) as of 2026-07; verify against your
account before relying on it. Your base URL is account-specific — see README.

Run as: python -m gong_revops_mcp.server
"""

from __future__ import annotations

import asyncio
import base64
import os
import time
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

GONG_ACCESS_KEY = os.environ.get("GONG_ACCESS_KEY")
GONG_ACCESS_KEY_SECRET = os.environ.get("GONG_ACCESS_KEY_SECRET")

# The Gong API base URL is ACCOUNT-SPECIFIC. api.gong.io is the common default, but
# accounts on regional or dedicated hosts get a different origin. Find yours at
# Company Settings -> API (see README) — a wrong base URL presents as 401, not 404,
# which sends people hunting for a credential problem they do not have.
GONG_BASE_URL = os.environ.get("GONG_BASE_URL", "https://api.gong.io").rstrip("/")

# Transcripts are the highest-PII and highest-token surface in the API: full verbatim
# customer speech, thousands of tokens per call. Off unless explicitly opted in.
GONG_ALLOW_TRANSCRIPTS = os.environ.get("GONG_ALLOW_TRANSCRIPTS", "false").lower() == "true"

# Blast-radius cap on transcript pulls. Three calls of transcript is already a large
# prompt; a date-range transcript pull across a team is how you blow a context window
# and a day's API quota in one question.
GONG_MAX_TRANSCRIPT_CALLS = int(os.environ.get("GONG_MAX_TRANSCRIPT_CALLS", "3"))

# Cursor-following guard. Gong pages at 100 records and allows 10,000 calls/day; an
# unbounded cursor loop over a busy workspace can consume a meaningful share of that
# quota answering one question. Five pages = up to 500 records per tool call.
GONG_MAX_PAGES = int(os.environ.get("GONG_MAX_PAGES", "5"))

# Optional default workspace, so callers do not pass workspaceId on every query.
GONG_WORKSPACE_ID = os.environ.get("GONG_WORKSPACE_ID")

# Tracker names that count as risk signals for deal_risk_digest. Gong ships no
# "this tracker means risk" flag — which trackers are risk is a judgment call your
# team makes, so it is configuration, not a hardcoded list.
GONG_RISK_TRACKERS = [
    t.strip()
    for t in os.environ.get(
        "GONG_RISK_TRACKERS",
        "Pricing Pushback,Competitor Mention,Budget Freeze,Legal Review,Champion Left",
    ).split(",")
    if t.strip()
]

# Gong throttles at 3 requests/second. We serialize requests behind a minimum
# interval rather than firing concurrently and handling 429s reactively — a reactive
# retry storm still burns daily quota on requests that were always going to fail.
MIN_REQUEST_INTERVAL = float(os.environ.get("GONG_MIN_REQUEST_INTERVAL", "0.34"))

PAGE_SIZE = 100

_rate_lock = asyncio.Lock()
_last_request_at = 0.0


def require_config() -> None:
    missing = [
        name
        for name, value in (
            ("GONG_ACCESS_KEY", GONG_ACCESS_KEY),
            ("GONG_ACCESS_KEY_SECRET", GONG_ACCESS_KEY_SECRET),
        )
        if not value
    ]
    if missing:
        raise RuntimeError(f"Required env vars are unset: {', '.join(missing)}")


def auth_headers() -> dict[str, str]:
    # Gong's API-key method is HTTP Basic with base64("<access key>:<secret>").
    # OAuth apps use "Authorization: Bearer <token>" instead; swap this function if
    # you register the server as a Gong app rather than using an account API key.
    token = base64.b64encode(
        f"{GONG_ACCESS_KEY}:{GONG_ACCESS_KEY_SECRET}".encode()
    ).decode()
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
    }


# ----- Gong REST helpers -----


async def _throttle() -> None:
    global _last_request_at
    async with _rate_lock:
        wait = MIN_REQUEST_INTERVAL - (time.monotonic() - _last_request_at)
        if wait > 0:
            await asyncio.sleep(wait)
        _last_request_at = time.monotonic()


async def gong_request(
    method: str, path: str, *, params: dict[str, Any] | None = None, json: dict[str, Any] | None = None
) -> dict[str, Any]:
    await _throttle()
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.request(
            method, f"{GONG_BASE_URL}{path}", headers=auth_headers(), params=params, json=json
        )
        _raise_for_gong(r, path)
        return r.json() if r.content else {}


def _raise_for_gong(r: httpx.Response, path: str) -> None:
    if r.status_code == 401:
        raise PermissionError(
            "Gong returned 401. Two causes, in order of likelihood: (1) GONG_BASE_URL "
            f"is wrong for this account — {GONG_BASE_URL} is a guess unless you copied it "
            "from Company Settings -> API; (2) the access key/secret pair is wrong or "
            "revoked. A wrong base URL does NOT return 404."
        )
    if r.status_code == 403:
        raise PermissionError(
            f"Gong returned 403 on {path}. The API key is missing a scope. This server "
            "needs api:calls:read:basic, api:calls:read:extensive, "
            "api:calls:read:transcript, api:settings:trackers:read, and "
            "api:stats:interaction. Scopes are set per key by a technical administrator."
        )
    if r.status_code == 429:
        retry_after = r.headers.get("Retry-After", "unknown")
        raise RuntimeError(
            f"Gong returned 429 (rate limit; Retry-After={retry_after}s). Default limits "
            "are 3 requests/second and 10,000 requests/day. Lower GONG_MAX_PAGES, raise "
            "GONG_MIN_REQUEST_INTERVAL, or ask Gong support to raise the account limit."
        )
    r.raise_for_status()


async def paged_post(path: str, body: dict[str, Any], record_key: str) -> tuple[list[Any], bool]:
    """POST through cursor pagination up to GONG_MAX_PAGES. Returns (records, truncated)."""
    records: list[Any] = []
    cursor: str | None = None
    for _ in range(max(1, GONG_MAX_PAGES)):
        payload = dict(body)
        if cursor:
            payload["cursor"] = cursor
        data = await gong_request("POST", path, json=payload)
        records.extend(data.get(record_key, []) or [])
        cursor = (data.get("records") or {}).get("cursor")
        if not cursor:
            return records, False
    return records, True


def _date_filter(arguments: dict[str, Any], *, keys: tuple[str, str]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key in keys:
        if v := arguments.get(key):
            out[key] = v
    workspace = arguments.get("workspace_id") or GONG_WORKSPACE_ID
    if workspace:
        out["workspaceId"] = workspace
    return out


# ----- Server + tool registry -----

server = Server("gong-revops")

# The contentSelector this server sends to /v2/calls/extensive. Fixed, not
# caller-controlled: `media` is deliberately absent so the server never requests
# 8-hour signed audio/video URLs (a separate scope, and a link that outlives the
# conversation it appeared in). `content.trackerOccurrences` is included because
# tracker *counts* without speaker and timestamp cannot tell you whether the customer
# raised pricing or your rep did — which inverts the meaning of the signal.
SIGNALS_CONTENT_SELECTOR: dict[str, Any] = {
    "context": "Extended",
    "contextTiming": ["Now"],
    "exposedFields": {
        "parties": True,
        "content": {
            "trackers": True,
            "trackerOccurrences": True,
            "brief": True,
            "keyPoints": True,
            "callOutcome": True,
            "topics": True,
        },
        "interaction": {
            "speakers": True,
            "personInteractionStats": True,
            "questions": True,
        },
        "collaboration": {"publicComments": True},
    },
}


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="find_calls",
            description=(
                "List calls in a date range (GET /v2/calls). Cheap metadata only — id, "
                "title, start time, duration, participant count. Use this first to scope "
                "a question, then pass the ids you care about to call_signals. Pages at "
                "100 records; follows at most GONG_MAX_PAGES pages."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "fromDateTime": {
                        "type": "string",
                        "description": "ISO-8601, e.g. 2026-07-01T00:00:00Z. Calls starting at or after.",
                    },
                    "toDateTime": {
                        "type": "string",
                        "description": "ISO-8601. Calls starting before.",
                    },
                    "workspace_id": {"type": "string"},
                },
                "required": ["fromDateTime"],
            },
        ),
        Tool(
            name="list_trackers",
            description=(
                "List keyword/smart tracker DEFINITIONS (GET /v2/settings/trackers). "
                "Returns configuration only — names, ids, keywords, affiliation — and no "
                "match counts. Occurrence counts come from call_signals. Call this to "
                "learn what your workspace actually tracks before assuming a tracker name."
            ),
            inputSchema={
                "type": "object",
                "properties": {"workspace_id": {"type": "string"}},
            },
        ),
        Tool(
            name="call_signals",
            description=(
                "Retrieve analyzed signals for specific calls (POST /v2/calls/extensive): "
                "parties, tracker matches with speaker and timestamp, Spotlight brief, key "
                "points, auto call outcome, topics, talk ratio and interactivity stats, and "
                "public comments. No transcript, no media URLs. This is the workhorse tool."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "call_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Specific Gong call ids. Preferred over a date range.",
                    },
                    "fromDateTime": {"type": "string", "description": "ISO-8601, used when call_ids is omitted."},
                    "toDateTime": {"type": "string", "description": "ISO-8601."},
                    "workspace_id": {"type": "string"},
                },
            },
        ),
        Tool(
            name="call_transcript",
            description=(
                "Retrieve verbatim transcripts for up to GONG_MAX_TRANSCRIPT_CALLS calls "
                "(POST /v2/calls/transcript). Disabled unless GONG_ALLOW_TRANSCRIPTS=true. "
                "Requires a justification. Prefer call_signals — the brief and key points "
                "answer most questions at a fraction of the tokens and the PII exposure."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "call_ids": {"type": "array", "items": {"type": "string"}},
                    "justification": {
                        "type": "string",
                        "description": "Why the verbatim transcript is needed instead of the brief. Min 10 chars.",
                    },
                },
                "required": ["call_ids", "justification"],
            },
        ),
        Tool(
            name="rep_interaction_stats",
            description=(
                "Per-rep aggregated interaction stats over a date range "
                "(POST /v2/stats/interaction): longest monologue, longest customer story, "
                "interactivity, patience, question rate. Covers only calls that had Whisper "
                "enabled, so a rep with few recorded calls looks like a rep with bad numbers."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "fromDate": {"type": "string", "description": "YYYY-MM-DD"},
                    "toDate": {"type": "string", "description": "YYYY-MM-DD"},
                    "user_ids": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["fromDate", "toDate"],
            },
        ),
        Tool(
            name="deal_risk_digest",
            description=(
                "Derived signal, not a Gong endpoint. Joins tracker definitions to tracker "
                "occurrences across a date range and reports which calls and accounts hit "
                "the risk trackers named in GONG_RISK_TRACKERS, split by whether the "
                "CUSTOMER or your own rep said it. Gong has no public deals endpoint; this "
                "is the closest honest substitute. Attribute nothing to a deal stage from "
                "this output — join it to your CRM for that."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "fromDateTime": {"type": "string", "description": "ISO-8601"},
                    "toDateTime": {"type": "string", "description": "ISO-8601"},
                    "tracker_names": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Override GONG_RISK_TRACKERS for this call.",
                    },
                    "workspace_id": {"type": "string"},
                },
                "required": ["fromDateTime"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    if name == "find_calls":
        params = _date_filter(arguments, keys=("fromDateTime", "toDateTime"))
        rows: list[dict[str, Any]] = []
        cursor: str | None = None
        truncated = False
        for page in range(max(1, GONG_MAX_PAGES)):
            q = dict(params)
            if cursor:
                q["cursor"] = cursor
            data = await gong_request("GET", "/v2/calls", params=q)
            rows.extend(data.get("calls", []) or [])
            cursor = (data.get("records") or {}).get("cursor")
            if not cursor:
                break
            truncated = page == max(1, GONG_MAX_PAGES) - 1
        return [TextContent(type="text", text=str(_slim_calls(rows, truncated)))]

    if name == "list_trackers":
        params: dict[str, Any] = {}
        workspace = arguments.get("workspace_id") or GONG_WORKSPACE_ID
        if workspace:
            params["workspaceId"] = workspace
        data = await gong_request("GET", "/v2/settings/trackers", params=params)
        trackers = [
            {
                "trackerId": t.get("trackerId"),
                "trackerName": t.get("trackerName"),
                "affiliation": t.get("affiliation"),
                "keywords": [
                    kw
                    for lang in (t.get("languageKeywords") or [])
                    for kw in (lang.get("keywords") or [])
                ][:20],
            }
            for t in (data.get("keywordTrackers") or [])
        ]
        return [
            TextContent(
                type="text",
                text=str(
                    {
                        "trackers": trackers,
                        "note": "Definitions only — no match counts. Occurrences come from call_signals.",
                    }
                ),
            )
        ]

    if name == "call_signals":
        body: dict[str, Any] = {"contentSelector": SIGNALS_CONTENT_SELECTOR}
        call_ids = arguments.get("call_ids")
        if call_ids:
            body["filter"] = {"callIds": [str(c) for c in call_ids]}
        else:
            if not arguments.get("fromDateTime"):
                raise ValueError("Pass call_ids, or fromDateTime to scope a date range.")
            body["filter"] = _date_filter(arguments, keys=("fromDateTime", "toDateTime"))
        calls, truncated = await paged_post("/v2/calls/extensive", body, "calls")
        return [TextContent(type="text", text=str(_slim_signals(calls, truncated)))]

    if name == "call_transcript":
        justification = (arguments.get("justification") or "").strip()
        if len(justification) < 10:
            raise ValueError("justification is mandatory and must be at least 10 characters.")
        if not GONG_ALLOW_TRANSCRIPTS:
            raise PermissionError(
                "call_transcript is disabled. Verbatim transcripts put full customer "
                "speech into the model context. Set GONG_ALLOW_TRANSCRIPTS=true only "
                "after confirming that is allowed for this data."
            )
        call_ids = [str(c) for c in (arguments.get("call_ids") or [])]
        if not call_ids:
            raise ValueError("call_ids must be a non-empty list.")
        if len(call_ids) > GONG_MAX_TRANSCRIPT_CALLS:
            raise ValueError(
                f"Refusing {len(call_ids)} transcripts in one call; the cap is "
                f"{GONG_MAX_TRANSCRIPT_CALLS}. Narrow the question with call_signals "
                "first, or raise GONG_MAX_TRANSCRIPT_CALLS deliberately."
            )
        data = await gong_request(
            "POST", "/v2/calls/transcript", json={"filter": {"callIds": call_ids}}
        )
        return [
            TextContent(
                type="text",
                text=str(
                    {
                        "justification": justification,
                        "callTranscripts": data.get("callTranscripts", []),
                    }
                ),
            )
        ]

    if name == "rep_interaction_stats":
        body: dict[str, Any] = {
            "filter": {
                "fromDate": arguments["fromDate"],
                "toDate": arguments["toDate"],
            }
        }
        if v := arguments.get("user_ids"):
            body["filter"]["userIds"] = [str(u) for u in v]
        rows, truncated = await paged_post("/v2/stats/interaction", body, "usersAggregateActivity")
        return [
            TextContent(
                type="text",
                text=str(
                    {
                        "users": rows,
                        "truncated": truncated,
                        "caveat": (
                            "Stats derive only from calls with Whisper enabled. Low call "
                            "volume reads as poor metrics; check call counts before coaching."
                        ),
                    }
                ),
            )
        ]

    if name == "deal_risk_digest":
        wanted = [t.lower() for t in (arguments.get("tracker_names") or GONG_RISK_TRACKERS)]
        body = {
            "filter": _date_filter(arguments, keys=("fromDateTime", "toDateTime")),
            "contentSelector": SIGNALS_CONTENT_SELECTOR,
        }
        calls, truncated = await paged_post("/v2/calls/extensive", body, "calls")
        return [TextContent(type="text", text=str(_risk_digest(calls, wanted, truncated)))]

    raise ValueError(f"Unknown tool: {name}")


# ----- Response slimming (keep model payloads tractable) -----


def _slim_calls(calls: list[dict[str, Any]], truncated: bool) -> dict[str, Any]:
    rows = [
        {
            "id": c.get("id"),
            "title": c.get("title"),
            "started": c.get("started"),
            "duration_s": c.get("duration"),
            "direction": c.get("direction"),
            "url": c.get("url"),
        }
        for c in calls
    ]
    return {"count": len(rows), "truncated": truncated, "calls": rows}


def _external_parties(call: dict[str, Any]) -> list[str]:
    return [
        p.get("name") or p.get("emailAddress") or "?"
        for p in (call.get("parties") or [])
        if (p.get("affiliation") or "").lower() == "external"
    ]


def _slim_signals(calls: list[dict[str, Any]], truncated: bool) -> dict[str, Any]:
    rows = []
    for c in calls:
        meta = c.get("metaData") or {}
        content = c.get("content") or {}
        rows.append(
            {
                "id": meta.get("id"),
                "title": meta.get("title"),
                "started": meta.get("started"),
                "outcome": (content.get("callOutcome") or {}).get("category"),
                "external_parties": _external_parties(c),
                "trackers": [
                    {"name": t.get("name"), "count": t.get("count")}
                    for t in (content.get("trackers") or [])
                    if t.get("count")
                ],
                "brief": content.get("brief"),
                "key_points": [kp.get("text") for kp in (content.get("keyPoints") or [])],
                "topics": [
                    {"name": t.get("name"), "duration_s": t.get("duration")}
                    for t in (content.get("topics") or [])
                ],
            }
        )
    return {"count": len(rows), "truncated": truncated, "calls": rows}


def _risk_digest(
    calls: list[dict[str, Any]], wanted: list[str], truncated: bool
) -> dict[str, Any]:
    """Join tracker occurrences to speaker affiliation, per call.

    Speaker affiliation is the load-bearing part. "Pricing Pushback" said by your own
    rep is a rep-behavior signal; said by the customer it is a deal signal. Counting
    them together produces a risk number that moves for the wrong reasons.
    """
    hits = []
    for c in calls:
        meta = c.get("metaData") or {}
        parties = {p.get("speakerId"): p for p in (c.get("parties") or []) if p.get("speakerId")}
        matched = []
        for tracker in (c.get("content") or {}).get("trackers") or []:
            if (tracker.get("name") or "").lower() not in wanted:
                continue
            by_side = {"customer": 0, "internal": 0, "unattributed": 0}
            for occ in tracker.get("occurrences") or []:
                party = parties.get(occ.get("speakerId"))
                affiliation = (party or {}).get("affiliation", "")
                if affiliation.lower() == "external":
                    by_side["customer"] += 1
                elif affiliation.lower() == "internal":
                    by_side["internal"] += 1
                else:
                    by_side["unattributed"] += 1
            if not any(by_side.values()):
                # Tracker matched but occurrences were not exposed; report the count
                # rather than dropping the signal, and mark it unattributed.
                by_side["unattributed"] = tracker.get("count") or 0
            matched.append({"tracker": tracker.get("name"), "said_by": by_side})
        if matched:
            hits.append(
                {
                    "call_id": meta.get("id"),
                    "title": meta.get("title"),
                    "started": meta.get("started"),
                    "external_parties": _external_parties(c),
                    "risk_trackers": matched,
                }
            )
    return {
        "calls_scanned": len(calls),
        "calls_with_risk_signals": len(hits),
        "truncated": truncated,
        "risk_trackers_checked": wanted,
        "hits": hits,
        "note": (
            "Derived from tracker occurrences on calls. Gong's public API exposes no "
            "deal-board read endpoint — join call_id or account name to your CRM for "
            "stage, amount, and close date. Do not treat this as a forecast."
        ),
    }


# ----- Entrypoint -----


async def main() -> None:
    require_config()
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
