"""
outreach-revops-mcp — a read-only MCP server over the Outreach REST API v2.

Five tools: sequence listing, sequence performance, stalled/errored sequence states,
prospect search, and single-prospect engagement. No POST, PATCH, or DELETE path
exists anywhere in the dispatch table, so no instruction reaching the model can
write to or delete from Outreach through this process.

This exists alongside Outreach's own hosted MCP server at https://api.outreach.io/mcp/.
That server authenticates the individual user over OAuth 2.1, requires the Amplify
add-on on the seat, and exposes read, create, and delete tools across prospecting,
accounts, deals, users, and calendar. Use it when you want breadth and per-user
identity. Use this scaffold when you want a service-account identity, a surface with
no create or delete on it, and aggregate reads that do not page the whole org.

Three engineering choices are load-bearing and documented at their call sites:
  1. Every request carries an explicit sparse fieldset. The prospect resource
     defines 230 attributes, 150 of which are custom1..custom150; the default
     payload is mostly nulls that cost tokens.
  2. Filter keys are checked against the attributes Outreach actually marks
     filterable before the request goes out. An unrecognized filter is not an
     error upstream — it comes back as an unfiltered list, which the model then
     reports as a real answer.
  3. Refresh tokens rotate on every use and are persisted before the new access
     token is returned. Losing the rotated token ends the grant.

STATUS: scaffold — not runtime-tested against a live Outreach org. Endpoint paths,
attribute names, filterable-attribute sets, and query syntax track the machine-
readable OpenAPI definition at https://api.outreach.io/api/v2/schema/openapi.json
and the developer portal (developers.outreach.io) as of 2026-08. Verify against your
own org before relying on it; custom fields are per-org and not in that definition.

Run as: python -m outreach_revops_mcp.server
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from pathlib import Path
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

OUTREACH_BASE_URL = os.environ.get("OUTREACH_BASE_URL", "https://api.outreach.io/api/v2").rstrip("/")
OUTREACH_TOKEN_URL = os.environ.get("OUTREACH_TOKEN_URL", "https://api.outreach.io/oauth/token")

OUTREACH_CLIENT_ID = os.environ.get("OUTREACH_CLIENT_ID")
OUTREACH_CLIENT_SECRET = os.environ.get("OUTREACH_CLIENT_SECRET")
OUTREACH_REDIRECT_URI = os.environ.get("OUTREACH_REDIRECT_URI")

# Where the rotated refresh token lives. Outreach issues a NEW refresh token with
# every access token and invalidates the old one, so this file is the grant. If it
# is not writable the server refuses to start rather than dying silently in 2 hours.
OUTREACH_TOKEN_FILE = Path(os.environ.get("OUTREACH_TOKEN_FILE", "~/.outreach-mcp-token.json")).expanduser()

# Sequences the agent may read at all, by numeric id. Empty means no restriction.
# Populate this when some sequences carry customer names in their titles, or when a
# shared agent should only see the sequences its own team runs.
OUTREACH_ALLOWED_SEQUENCE_IDS = {
    s.strip() for s in os.environ.get("OUTREACH_ALLOWED_SEQUENCE_IDS", "").split(",") if s.strip()
}

# Outreach allows 10,000 requests per hour per user and returns the remaining count
# on every response. Below this floor the server stops answering rather than burning
# the last of the org's budget on a chatty agent loop.
RATE_LIMIT_FLOOR = int(os.environ.get("OUTREACH_RATE_LIMIT_FLOOR", "250"))

MAX_LIMIT = 100
DEFAULT_LIMIT = 25

# ----- Sparse fieldsets -----
#
# Once fields[<type>] is supplied, Outreach returns only the attributes named, so
# each list below must be complete for its tool. These are deliberately short: the
# cost of an over-wide projection is paid on every row of every answer.

PROSPECT_FIELDS = [
    "firstName", "lastName", "title", "company", "occupation",
    "emails", "optedOut", "emailOptedOut", "callOptedOut",
    "engagedScore", "engagedAt", "touchedAt",
    "openCount", "clickCount", "replyCount",
]

SEQUENCE_FIELDS = [
    "name", "enabled", "locked", "shareType", "sequenceType", "salesMotion",
    "sequenceStepCount", "durationInDays", "lastUsedAt",
    "numContactedProspects", "numRepliedProspects",
    "deliverCount", "openCount", "clickCount", "replyCount",
    "bounceCount", "optOutCount", "failureCount", "scheduleCount",
    "positiveReplyCount", "negativeReplyCount", "neutralReplyCount",
    "throttleMaxAddsPerDay", "throttlePaused",
]

SEQUENCE_STATE_FIELDS = [
    "state", "stateChangedAt", "activeAt", "pauseReason", "errorReason",
    "deliverCount", "openCount", "clickCount", "replyCount",
    "bounceCount", "failureCount", "optOutCount", "repliedAt", "callCompletedAt",
]

MAILING_FIELDS = [
    "subject", "mailingType", "state", "stateChangedAt",
    "scheduledAt", "deliveredAt", "openedAt", "clickedAt", "repliedAt",
    "bouncedAt", "unsubscribedAt", "markedAsSpamAt", "errorReason",
]

# ----- Filterable attributes -----
#
# Outreach marks a subset of each resource's attributes as filterable. A filter on
# anything else does not 400 — the parameter is ignored and the full collection
# comes back. The model then answers "3,812 prospects match" for a filter that never
# applied. These sets are transcribed from the OpenAPI definition's filterable
# badges and are the preflight check in _check_filters().

FILTERABLE: dict[str, set[str]] = {
    "prospect": {
        "createdAt", "updatedAt", "emails", "engagedAt", "engagedScore",
        "externalSource", "firstName", "lastName", "githubUsername",
        "linkedInId", "linkedInSlug", "sharingTeamId", "stackOverflowId",
        "timeZone", "title", "touchedAt", "twitterUsername",
    },
    "sequence": {
        "createdAt", "updatedAt", "name", "clickCount", "deliverCount",
        "enabledAt", "lastUsedAt", "lockedAt", "openCount", "replyCount",
        "salesMotion", "shareType", "throttleCapacity", "throttleMaxAddsPerDay",
    },
    "sequenceState": {
        "createdAt", "updatedAt", "state", "stateChangedAt", "pauseReason",
        "callCompletedAt", "clickCount", "deliverCount", "openCount",
        "repliedAt", "replyCount",
    },
    "mailing": {
        "createdAt", "updatedAt", "state", "stateChangedAt", "mailingType",
        "messageId", "bouncedAt", "clickedAt", "deliveredAt", "openedAt",
        "repliedAt", "retryAt", "scheduledAt", "unsubscribedAt",
        "notifyThreadScheduledAt", "notifyThreadStatus",
    },
}

# Relationship filters are addressed as filter[<relationship>][id] and are not part
# of the attribute badge set above, so they get their own allowlist per resource.
FILTERABLE_RELATIONSHIPS: dict[str, set[str]] = {
    "prospect": {"account", "owner", "stage"},
    "sequence": {"owner", "creator"},
    "sequenceState": {"prospect", "sequence", "mailbox", "user", "account"},
    "mailing": {"prospect", "sequence", "mailbox", "user"},
}

# Attributes readers most often want to filter on that Outreach does not support as
# filters. Naming them in the error is the difference between the agent adapting and
# the agent inventing a workaround.
KNOWN_UNFILTERABLE_HINT = {
    "prospect": "company, optedOut, emailOptedOut, callOptedOut, tags, and openCount "
                "are returned but not filterable — fetch and filter client-side",
    "sequence": "enabled, locked, and sequenceType are returned but not filterable",
    "sequenceState": "errorReason and activeAt are returned but not filterable",
    "mailing": "subject is returned but not filterable",
}


class OutreachError(RuntimeError):
    """Raised for configuration, auth, and upstream failures surfaced to the model."""


# ----- Token handling -----


class TokenStore:
    """
    Holds the access token and persists the rotating refresh token.

    Outreach access tokens live 2 hours. Each refresh returns a new refresh token and
    retires the one used; the old value is dead the moment the new one is issued. The
    write therefore happens BEFORE the new access token is handed to a caller — if the
    process dies between the two, a saved-but-unused refresh token still works, while
    an unsaved one loses the grant and forces a manual re-authorization.
    """

    def __init__(self, path: Path) -> None:
        self.path = path
        self._access_token: str | None = None
        self._expires_at: float = 0.0
        self._refresh_token: str | None = None
        self._lock = asyncio.Lock()

    def load(self) -> None:
        if not self.path.exists():
            raise OutreachError(
                f"token file {self.path} not found — complete the OAuth authorization code "
                f"flow once and write {{'refresh_token': '...'}} to it (see README)"
            )
        data = json.loads(self.path.read_text(encoding="utf-8"))
        self._refresh_token = data.get("refresh_token")
        if not self._refresh_token:
            raise OutreachError(f"token file {self.path} has no 'refresh_token' key")
        # Startup writability check. A read-only token file is a server that works for
        # 2 hours and then fails every call with a 401 that looks like a scope problem.
        try:
            self.path.write_text(json.dumps({"refresh_token": self._refresh_token}), encoding="utf-8")
        except OSError as exc:
            raise OutreachError(f"token file {self.path} is not writable: {exc}") from exc

    def _persist(self, refresh_token: str) -> None:
        tmp = self.path.with_suffix(self.path.suffix + ".tmp")
        tmp.write_text(json.dumps({"refresh_token": refresh_token}), encoding="utf-8")
        tmp.replace(self.path)
        try:
            self.path.chmod(0o600)
        except OSError:
            pass  # Windows and some mounts do not honour chmod; not fatal.

    async def access_token(self, client: httpx.AsyncClient) -> str:
        async with self._lock:
            # 120s of slack so a request issued just under the wire does not land expired.
            if self._access_token and time.time() < self._expires_at - 120:
                return self._access_token
            await self._refresh(client)
            assert self._access_token is not None
            return self._access_token

    async def _refresh(self, client: httpx.AsyncClient) -> None:
        if not (OUTREACH_CLIENT_ID and OUTREACH_CLIENT_SECRET and OUTREACH_REDIRECT_URI):
            raise OutreachError(
                "OUTREACH_CLIENT_ID, OUTREACH_CLIENT_SECRET and OUTREACH_REDIRECT_URI are required"
            )
        resp = await client.post(
            OUTREACH_TOKEN_URL,
            data={
                "client_id": OUTREACH_CLIENT_ID,
                "client_secret": OUTREACH_CLIENT_SECRET,
                "redirect_uri": OUTREACH_REDIRECT_URI,
                "grant_type": "refresh_token",
                "refresh_token": self._refresh_token,
            },
        )
        if resp.status_code != 200:
            raise OutreachError(
                f"token refresh failed ({resp.status_code}). Refresh tokens expire 14 days "
                f"after issue — if this server sat idle longer than that, re-run the "
                f"authorization code flow. Body: {resp.text[:300]}"
            )
        payload = resp.json()
        new_refresh = payload.get("refresh_token")
        if not new_refresh:
            raise OutreachError("token refresh returned no refresh_token; refusing to continue")
        self._persist(new_refresh)  # persist before use, see class docstring
        self._refresh_token = new_refresh
        self._access_token = payload["access_token"]
        self._expires_at = time.time() + int(payload.get("expires_in", 7200))


TOKENS = TokenStore(OUTREACH_TOKEN_FILE)


# ----- HTTP -----


def _check_filters(resource: str, filters: dict[str, Any] | None) -> dict[str, str]:
    """
    Reject filter keys Outreach does not honour, before the request is sent.

    Silent-ignore is the failure this guards. Outreach answers a request carrying an
    unsupported filter with the unfiltered collection and a 200, so nothing downstream
    can tell a narrow answer from a whole-org answer.
    """
    if not filters:
        return {}
    allowed = FILTERABLE.get(resource, set())
    allowed_rel = FILTERABLE_RELATIONSHIPS.get(resource, set())
    out: dict[str, str] = {}
    for key, value in filters.items():
        if key in allowed_rel:
            out[f"filter[{key}][id]"] = str(value)
        elif key in allowed:
            out[f"filter[{key}]"] = str(value)
        else:
            hint = KNOWN_UNFILTERABLE_HINT.get(resource, "")
            raise OutreachError(
                f"'{key}' is not a filterable {resource} attribute. Outreach ignores unknown "
                f"filters and returns everything, so this server refuses the call instead. "
                f"Filterable: {', '.join(sorted(allowed | allowed_rel))}."
                + (f" Note: {hint}." if hint else "")
            )
    return out


async def _get(
    client: httpx.AsyncClient,
    path: str,
    resource: str,
    *,
    fields: list[str] | None = None,
    filters: dict[str, Any] | None = None,
    include: str | None = None,
    sort: str | None = None,
    limit: int | None = None,
    extra_fields: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    params: dict[str, str] = {}
    params.update(_check_filters(resource, filters))
    if fields:
        params[f"fields[{resource}]"] = ",".join(fields)
    for extra_resource, extra in (extra_fields or {}).items():
        params[f"fields[{extra_resource}]"] = ",".join(extra)
    if include:
        params["include"] = include
    if sort:
        params["sort"] = sort
    if limit is not None:
        params["page[limit]"] = str(max(1, min(limit, MAX_LIMIT)))

    token = await TOKENS.access_token(client)
    resp = await client.get(
        f"{OUTREACH_BASE_URL}{path}",
        params=params,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/vnd.api+json",
        },
    )

    remaining = resp.headers.get("X-RateLimit-Remaining")
    if remaining is not None and remaining.isdigit() and int(remaining) < RATE_LIMIT_FLOOR:
        reset = resp.headers.get("X-RateLimit-Reset", "unknown")
        raise OutreachError(
            f"stopping: {remaining} of the org's 10,000 hourly API calls remain, below the "
            f"configured floor of {RATE_LIMIT_FLOOR}. Window resets at {reset}. Outreach's "
            f"limit is shared with your CRM sync, so burning it here breaks that too."
        )
    if resp.status_code == 429:
        raise OutreachError("Outreach returned 429. The hourly request budget is exhausted.")
    if resp.status_code == 403:
        raise OutreachError(
            f"403 from Outreach on {path}. The OAuth application is missing a scope — "
            f"this server needs prospects.read, sequences.read, sequenceStates.read, "
            f"and mailings.read. Body: {resp.text[:200]}"
        )
    if resp.status_code >= 400:
        raise OutreachError(f"{resp.status_code} from Outreach on {path}: {resp.text[:300]}")
    return resp.json()


# ----- Shaping -----


def _flatten(item: dict[str, Any]) -> dict[str, Any]:
    """Collapse a JSON:API resource object into {id, ...attributes} with nulls dropped."""
    out: dict[str, Any] = {"id": item.get("id")}
    for key, value in (item.get("attributes") or {}).items():
        if value not in (None, [], ""):
            out[key] = value
    return out


def _rates(attrs: dict[str, Any]) -> dict[str, Any]:
    """
    Derive the rates a human actually asks for from Outreach's raw counters.

    Reply rate is computed against numRepliedProspects / numContactedProspects rather
    than replyCount / deliverCount: replyCount counts messages, so one prospect replying
    four times reads as four replies against four different sends. The prospect-level
    pair is the one that answers "is this sequence working".
    """
    contacted = attrs.get("numContactedProspects") or 0
    replied = attrs.get("numRepliedProspects") or 0
    delivered = attrs.get("deliverCount") or 0
    bounced = attrs.get("bounceCount") or 0
    opted_out = attrs.get("optOutCount") or 0
    attempted = delivered + bounced

    def pct(num: int, den: int) -> float | None:
        return round(100.0 * num / den, 2) if den else None

    return {
        "prospect_reply_rate_pct": pct(replied, contacted),
        "bounce_rate_pct": pct(bounced, attempted),
        "opt_out_rate_pct": pct(opted_out, delivered),
        "_basis": {
            "contacted_prospects": contacted,
            "replied_prospects": replied,
            "delivered": delivered,
            "bounced": bounced,
            "opted_out": opted_out,
        },
    }


def _sequence_allowed(seq_id: str | None) -> bool:
    return not OUTREACH_ALLOWED_SEQUENCE_IDS or str(seq_id) in OUTREACH_ALLOWED_SEQUENCE_IDS


def _ok(payload: Any) -> list[TextContent]:
    return [TextContent(type="text", text=json.dumps(payload, indent=2, default=str))]


# ----- Tools -----

TOOLS = [
    Tool(
        name="list_sequences",
        description=(
            "List Outreach sequences with their engagement counters, newest-used first. "
            "Use this to find a sequence id before asking about its performance. Filterable "
            "keys: name, salesMotion, shareType, lastUsedAt, createdAt, updatedAt, owner, creator."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "filters": {
                    "type": "object",
                    "description": "Filter keys checked against Outreach's filterable set before sending.",
                    "additionalProperties": {"type": "string"},
                },
                "limit": {"type": "integer", "minimum": 1, "maximum": MAX_LIMIT},
            },
        },
    ),
    Tool(
        name="get_sequence_performance",
        description=(
            "Fetch one sequence and return its counters plus derived prospect reply rate, "
            "bounce rate, and opt-out rate. Answers 'how is this sequence doing' in a single "
            "API call — do not page sequence states to compute this."
        ),
        inputSchema={
            "type": "object",
            "properties": {"sequence_id": {"type": "string"}},
            "required": ["sequence_id"],
        },
    ),
    Tool(
        name="find_stalled_sequence_states",
        description=(
            "Find prospects sitting in a non-running sequence state (paused, bounced, failed, "
            "finished) with the pause and error reasons attached. Use for 'what is stuck in "
            "sequence X'. State is a filterable attribute; errorReason is not."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "state": {
                    "type": "string",
                    "description": "Outreach sequence state, e.g. paused, bounced, failed, finished, active.",
                },
                "sequence_id": {"type": "string"},
                "limit": {"type": "integer", "minimum": 1, "maximum": MAX_LIMIT},
            },
            "required": ["state"],
        },
    ),
    Tool(
        name="search_prospects",
        description=(
            "Search prospects on filterable attributes and return a fixed 15-field projection "
            "including opt-out status. Filterable keys: firstName, lastName, title, emails, "
            "engagedScore, engagedAt, touchedAt, createdAt, updatedAt, account, owner, stage. "
            "Company name and opt-out flags are NOT filterable — filter those from the results."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "filters": {"type": "object", "additionalProperties": {"type": "string"}},
                "limit": {"type": "integer", "minimum": 1, "maximum": MAX_LIMIT},
            },
            "required": ["filters"],
        },
    ),
    Tool(
        name="get_prospect_engagement",
        description=(
            "Fetch one prospect plus their most recent mailings with delivery, open, click, "
            "reply, and bounce timestamps. Use before a call or before deciding whether a "
            "prospect has already been contacted."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "prospect_id": {"type": "string"},
                "mailing_limit": {"type": "integer", "minimum": 1, "maximum": 50},
            },
            "required": ["prospect_id"],
        },
    ),
]


async def _list_sequences(client: httpx.AsyncClient, args: dict[str, Any]) -> Any:
    data = await _get(
        client, "/sequences", "sequence",
        fields=SEQUENCE_FIELDS,
        filters=args.get("filters"),
        sort="-lastUsedAt",
        limit=args.get("limit", DEFAULT_LIMIT),
    )
    rows = [_flatten(i) for i in data.get("data", []) if _sequence_allowed(i.get("id"))]
    return {"count": len(rows), "sequences": rows}


async def _get_sequence_performance(client: httpx.AsyncClient, args: dict[str, Any]) -> Any:
    seq_id = str(args["sequence_id"])
    if not _sequence_allowed(seq_id):
        raise OutreachError(f"sequence {seq_id} is outside OUTREACH_ALLOWED_SEQUENCE_IDS")
    data = await _get(client, f"/sequences/{seq_id}", "sequence", fields=SEQUENCE_FIELDS)
    item = data.get("data") or {}
    attrs = item.get("attributes") or {}
    return {"sequence": _flatten(item), "derived": _rates(attrs)}


async def _find_stalled(client: httpx.AsyncClient, args: dict[str, Any]) -> Any:
    filters: dict[str, Any] = {"state": args["state"]}
    if args.get("sequence_id"):
        seq_id = str(args["sequence_id"])
        if not _sequence_allowed(seq_id):
            raise OutreachError(f"sequence {seq_id} is outside OUTREACH_ALLOWED_SEQUENCE_IDS")
        filters["sequence"] = seq_id
    data = await _get(
        client, "/sequenceStates", "sequenceState",
        fields=SEQUENCE_STATE_FIELDS,
        filters=filters,
        include="prospect,sequence",
        sort="-stateChangedAt",
        limit=args.get("limit", DEFAULT_LIMIT),
        # Included resources carry their own full payload unless projected too. Without
        # these two lines every stalled row drags a 230-attribute prospect behind it.
        extra_fields={
            "prospect": ["firstName", "lastName", "title", "company", "optedOut"],
            "sequence": ["name"],
        },
    )
    included = {(i["type"], i["id"]): _flatten(i) for i in data.get("included", [])}
    rows = []
    for item in data.get("data", []):
        row = _flatten(item)
        rels = item.get("relationships") or {}
        for rel_name in ("prospect", "sequence"):
            ref = ((rels.get(rel_name) or {}).get("data")) or {}
            if ref:
                row[rel_name] = included.get((ref.get("type"), ref.get("id")), {"id": ref.get("id")})
        rows.append(row)
    return {"state": args["state"], "count": len(rows), "sequence_states": rows}


async def _search_prospects(client: httpx.AsyncClient, args: dict[str, Any]) -> Any:
    data = await _get(
        client, "/prospects", "prospect",
        fields=PROSPECT_FIELDS,
        filters=args["filters"],
        sort="-touchedAt",
        limit=args.get("limit", DEFAULT_LIMIT),
    )
    rows = [_flatten(i) for i in data.get("data", [])]
    contactable = [r for r in rows if not r.get("optedOut") and not r.get("emailOptedOut")]
    return {
        "count": len(rows),
        "contactable_count": len(contactable),
        "note": "opt-out flags are not filterable upstream; contactable_count is computed here",
        "prospects": rows,
    }


async def _get_prospect_engagement(client: httpx.AsyncClient, args: dict[str, Any]) -> Any:
    pid = str(args["prospect_id"])
    prospect = await _get(client, f"/prospects/{pid}", "prospect", fields=PROSPECT_FIELDS)
    mailings = await _get(
        client, "/mailings", "mailing",
        fields=MAILING_FIELDS,
        filters={"prospect": pid},
        sort="-createdAt",
        limit=args.get("mailing_limit", 10),
    )
    return {
        "prospect": _flatten(prospect.get("data") or {}),
        "mailings": [_flatten(i) for i in mailings.get("data", [])],
    }


HANDLERS = {
    "list_sequences": _list_sequences,
    "get_sequence_performance": _get_sequence_performance,
    "find_stalled_sequence_states": _find_stalled,
    "search_prospects": _search_prospects,
    "get_prospect_engagement": _get_prospect_engagement,
}


# ----- Server -----

app = Server("outreach-revops-mcp")


@app.list_tools()
async def list_tools() -> list[Tool]:
    return TOOLS


@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    handler = HANDLERS.get(name)
    if handler is None:
        return _ok({"error": f"unknown tool: {name}"})
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            return _ok(await handler(client, arguments or {}))
    except OutreachError as exc:
        # Surfaced as content rather than raised so the model can read the guidance in
        # the message (which filter to use, which scope is missing) and correct itself.
        return _ok({"error": str(exc)})
    except httpx.HTTPError as exc:
        return _ok({"error": f"network error talking to Outreach: {exc}"})


async def main() -> None:
    TOKENS.load()
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
