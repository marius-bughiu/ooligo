"""MCP server exposing LeanData routing audit logs from Salesforce, read-only.

LeanData writes one `LeanData__Log__c` row per record per trip through a deployed
routing graph. This server queries that object through the Salesforce REST API so an
agent can answer "why did this lead land on this rep?" without opening the LeanData UI.

Scheduling actions (book, cancel, reschedule, host swap) are deliberately absent — those
belong to LeanData's own BookIt MCP server, which enforces BookIt permission sets.

Field API names on the Log object are NOT hardcoded. LeanData ships a managed package and
customers stamp their own fields onto the Log object, so the field inventory differs per
org. Every tool resolves fields at runtime from the Salesforce describe response and caches
the result for the process lifetime.

NOT RUNTIME-TESTED against a live LeanData org. See the numbered TODO list in README.md
before production use.
"""

from __future__ import annotations

import asyncio
import os
import re
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

SF_LOGIN_URL = os.environ.get("SF_LOGIN_URL", "https://login.salesforce.com")
SF_CLIENT_ID = os.environ.get("SF_CLIENT_ID", "")
SF_CLIENT_SECRET = os.environ.get("SF_CLIENT_SECRET", "")
SF_API_VERSION = os.environ.get("SF_API_VERSION", "v61.0")
LD_LOG_OBJECT = os.environ.get("LD_LOG_OBJECT", "LeanData__Log__c")
LD_QUEUE_OBJECT = os.environ.get("LD_QUEUE_OBJECT", "LeanData__CC_Inserted_Object__c")
LD_MAX_ROWS = int(os.environ.get("LD_MAX_ROWS", "200"))
LD_HTTP_TIMEOUT = float(os.environ.get("LD_HTTP_TIMEOUT", "30"))

SF_ID_RE = re.compile(r"^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$")
ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?$")

# Field-name fragments used to rank describe results into roles. Ordered by preference.
_ROLE_HINTS: dict[str, tuple[str, ...]] = {
    "graph": ("graph", "deployment", "flow", "router"),
    "path": ("path", "node", "trace", "route_detail", "routingdetail"),
    "outcome": ("outcome", "action", "result", "status", "disposition"),
    "owner": ("owner", "assign", "assignee", "routedto"),
    "matched": ("matched", "match_account", "matchedaccount", "l2a"),
    "error": ("error", "exception", "failure", "failed"),
    "trigger": ("trigger", "reason", "source", "event"),
}

_ERROR_HINTS = _ROLE_HINTS["error"]


class SalesforceError(RuntimeError):
    """Raised when Salesforce returns a non-success response."""


class SalesforceClient:
    """Minimal Salesforce REST client using the OAuth client-credentials flow.

    Client credentials is chosen over username-password because the latter is disabled by
    default on new Salesforce orgs and ties the integration to one human's password
    lifecycle. The Connected App's "Run As" user carries the object permissions, so
    least-privilege is configured in Salesforce rather than in this code.
    """

    def __init__(self) -> None:
        self._token: str | None = None
        self._instance_url: str | None = None
        self._lock = asyncio.Lock()
        self._describe_cache: dict[str, dict[str, Any]] = {}

    async def _authenticate(self, client: httpx.AsyncClient) -> None:
        if not SF_CLIENT_ID or not SF_CLIENT_SECRET:
            raise SalesforceError(
                "SF_CLIENT_ID and SF_CLIENT_SECRET must be set. See README.md § Environment variables."
            )
        resp = await client.post(
            f"{SF_LOGIN_URL}/services/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": SF_CLIENT_ID,
                "client_secret": SF_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if resp.status_code != 200:
            raise SalesforceError(
                f"Salesforce token request failed ({resp.status_code}). "
                "Check the Connected App's client credentials flow is enabled and a Run As user is set."
            )
        payload = resp.json()
        self._token = payload["access_token"]
        self._instance_url = payload["instance_url"].rstrip("/")

    async def request(self, method: str, path: str, **kwargs: Any) -> Any:
        """Issue an authenticated REST call, re-authenticating once on a 401."""
        async with httpx.AsyncClient(timeout=LD_HTTP_TIMEOUT) as client:
            async with self._lock:
                if self._token is None:
                    await self._authenticate(client)
            for attempt in (1, 2):
                resp = await client.request(
                    method,
                    f"{self._instance_url}{path}",
                    headers={"Authorization": f"Bearer {self._token}"},
                    **kwargs,
                )
                if resp.status_code == 401 and attempt == 1:
                    async with self._lock:
                        await self._authenticate(client)
                    continue
                if resp.status_code >= 400:
                    raise SalesforceError(f"Salesforce {method} {path} -> {resp.status_code}: {resp.text[:400]}")
                return resp.json()
        raise SalesforceError("Unreachable: retry loop exhausted")

    async def query(self, soql: str) -> list[dict[str, Any]]:
        """Run a SOQL query and return the first page of records.

        Deliberately does not follow `nextRecordsUrl`. Every tool caps its own row count;
        silently paging a large result set into an agent's context is the expensive
        failure mode this server is built to avoid.
        """
        payload = await self.request("GET", f"/services/data/{SF_API_VERSION}/query", params={"q": soql})
        return payload.get("records", [])

    async def describe(self, sobject: str) -> dict[str, Any]:
        if sobject not in self._describe_cache:
            self._describe_cache[sobject] = await self.request(
                "GET", f"/services/data/{SF_API_VERSION}/sobjects/{sobject}/describe"
            )
        return self._describe_cache[sobject]


sf = SalesforceClient()


def _validate_id(value: str) -> str:
    if not SF_ID_RE.match(value or ""):
        raise ValueError(f"{value!r} is not a Salesforce record ID (15 or 18 alphanumeric characters).")
    return value


def _validate_datetime(value: str, field: str) -> str:
    if not ISO_RE.match(value or ""):
        raise ValueError(f"{field} must be ISO-8601 (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ), got {value!r}.")
    if "T" not in value:
        value = f"{value}T00:00:00Z"
    if not value.endswith("Z"):
        value = f"{value}Z"
    return value


def _clamp(limit: int | None, default: int) -> int:
    if limit is None:
        return default
    return max(1, min(int(limit), LD_MAX_ROWS))


async def _log_fields() -> list[dict[str, Any]]:
    described = await sf.describe(LD_LOG_OBJECT)
    return described.get("fields", [])


def _queryable_names(fields: list[dict[str, Any]]) -> list[str]:
    return [f["name"] for f in fields if f.get("type") not in {"address", "location"}]


def _rank_by_role(fields: list[dict[str, Any]], role: str) -> list[str]:
    """Return field API names whose name or label matches the hint fragments for `role`."""
    hints = _ROLE_HINTS.get(role, ())
    hits: list[str] = []
    for field in fields:
        haystack = f"{field.get('name', '')} {field.get('label', '')}".lower().replace(" ", "")
        if any(hint in haystack for hint in hints):
            hits.append(field["name"])
    return hits


def _reference_fields(fields: list[dict[str, Any]]) -> list[str]:
    """Lookup fields on the Log object — these hold the routed and matched record IDs."""
    return [f["name"] for f in fields if f.get("type") == "reference" and f["name"] != "OwnerId"]


def _core_select(fields: list[dict[str, Any]], limit: int = 40) -> list[str]:
    """A bounded, deterministic projection: identity fields, then role-matched fields.

    Selecting every field on the Log object would work but is the wrong default — orgs
    stamp dozens of custom fields onto it, and each one costs context on every row.
    """
    names = set(_queryable_names(fields))
    selected: list[str] = []

    def add(candidate: str) -> None:
        if candidate in names and candidate not in selected and len(selected) < limit:
            selected.append(candidate)

    for identity in ("Id", "Name", "CreatedDate", "LastModifiedDate"):
        add(identity)
    for role in ("graph", "trigger", "outcome", "owner", "matched", "error", "path"):
        for name in _rank_by_role(fields, role):
            add(name)
    for name in _reference_fields(fields):
        add(name)
    return selected


def _format(records: list[dict[str, Any]]) -> str:
    if not records:
        return "No matching routing log rows."
    lines: list[str] = []
    for record in records:
        parts = [
            f"{key}={value}"
            for key, value in record.items()
            if key != "attributes" and value not in (None, "")
        ]
        lines.append(" | ".join(parts))
    return "\n".join(lines)


server = Server("leandata-routing")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="describe_routing_log",
            description=(
                "List the field inventory LeanData's Log object exposes in this org, grouped by the "
                "role each field plays (graph, outcome, owner, matched record, error, node path). Run "
                "this first — field API names differ per org because customers stamp their own fields "
                "onto the Log object."
            ),
            inputSchema={"type": "object", "properties": {}, "required": []},
        ),
        Tool(
            name="get_routing_history",
            description=(
                "Return the routing trips recorded for one Salesforce record (Lead, Contact, Account "
                "or Case), newest first. Use this to answer 'how did this record get to this owner?'"
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "record_id": {
                        "type": "string",
                        "description": "15- or 18-character Salesforce ID of the routed record.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": f"Max rows (1-{LD_MAX_ROWS}). Default 20.",
                    },
                },
                "required": ["record_id"],
            },
        ),
        Tool(
            name="explain_assignment",
            description=(
                "Return every populated field on a single routing log row, including the node path and "
                "outcome detail. Use after get_routing_history when one trip needs the full picture."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "log_id": {
                        "type": "string",
                        "description": "Salesforce ID of the LeanData Log row.",
                    }
                },
                "required": ["log_id"],
            },
        ),
        Tool(
            name="find_routing_errors",
            description=(
                "Find routing log rows in a date window whose error or exception fields are populated. "
                "Use this to catch records that entered a graph and did not route cleanly."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "since": {"type": "string", "description": "ISO-8601 start, e.g. 2026-08-01."},
                    "until": {"type": "string", "description": "ISO-8601 end, e.g. 2026-08-02."},
                    "limit": {
                        "type": "integer",
                        "description": f"Max rows (1-{LD_MAX_ROWS}). Default 50.",
                    },
                },
                "required": ["since", "until"],
            },
        ),
        Tool(
            name="get_routing_throughput",
            description=(
                "Count routing log rows in a date window, grouped by the org's primary graph or "
                "deployment field, plus the current depth of LeanData's processing queue object. Use "
                "this to distinguish 'routing is slow' from 'routing never ran'."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "since": {"type": "string", "description": "ISO-8601 start."},
                    "until": {"type": "string", "description": "ISO-8601 end."},
                },
                "required": ["since", "until"],
            },
        ),
    ]


async def _describe_routing_log() -> str:
    fields = await _log_fields()
    lines = [f"{LD_LOG_OBJECT}: {len(fields)} fields visible to this integration user.", ""]
    for role in _ROLE_HINTS:
        hits = _rank_by_role(fields, role)
        lines.append(f"{role}: {', '.join(hits) if hits else '(none matched)'}")
    lines.append("")
    lines.append(f"lookups: {', '.join(_reference_fields(fields)) or '(none)'}")
    lines.append("")
    lines.append(f"default projection: {', '.join(_core_select(fields))}")
    return "\n".join(lines)


async def _get_routing_history(record_id: str, limit: int | None) -> str:
    _validate_id(record_id)
    rows = _clamp(limit, 20)
    fields = await _log_fields()
    lookups = _reference_fields(fields)
    if not lookups:
        return (
            f"{LD_LOG_OBJECT} exposes no lookup fields to this integration user. Grant read on the "
            "Log object's relationship fields, then retry."
        )
    projection = ", ".join(_core_select(fields))
    where = " OR ".join(f"{name} = '{record_id}'" for name in lookups)
    soql = f"SELECT {projection} FROM {LD_LOG_OBJECT} WHERE ({where}) ORDER BY CreatedDate DESC LIMIT {rows}"
    records = await sf.query(soql)
    if not records:
        return (
            f"No routing log rows reference {record_id}. Either the record never entered a deployed "
            "graph, or its logs aged past the retention window configured in Admin > Settings > Reporting."
        )
    return _format(records)


async def _explain_assignment(log_id: str) -> str:
    _validate_id(log_id)
    fields = await _log_fields()
    # Full projection here — a single row is a bounded context cost, unlike a list query.
    projection = ", ".join(_queryable_names(fields))
    records = await sf.query(f"SELECT {projection} FROM {LD_LOG_OBJECT} WHERE Id = '{log_id}' LIMIT 1")
    if not records:
        return f"No {LD_LOG_OBJECT} row with Id {log_id}."
    return _format(records)


async def _find_routing_errors(since: str, until: str, limit: int | None) -> str:
    start = _validate_datetime(since, "since")
    end = _validate_datetime(until, "until")
    rows = _clamp(limit, 50)
    fields = await _log_fields()
    error_fields = [
        f["name"]
        for f in fields
        if any(hint in f["name"].lower() for hint in _ERROR_HINTS) and f.get("type") in {"string", "textarea", "picklist"}
    ]
    if not error_fields:
        return (
            f"{LD_LOG_OBJECT} exposes no error-shaped text fields in this org. Run describe_routing_log "
            "and pick the field your admin uses for routing failures, then set it via LD_LOG_OBJECT's "
            "sibling override documented in README.md § Known limits."
        )
    projection = ", ".join(_core_select(fields))
    where = " OR ".join(f"{name} != null" for name in error_fields)
    soql = (
        f"SELECT {projection} FROM {LD_LOG_OBJECT} "
        f"WHERE CreatedDate >= {start} AND CreatedDate <= {end} AND ({where}) "
        f"ORDER BY CreatedDate DESC LIMIT {rows}"
    )
    records = await sf.query(soql)
    header = f"Error-flagged routing rows between {start} and {end} (checked: {', '.join(error_fields)})"
    return f"{header}\n\n{_format(records)}"


async def _get_routing_throughput(since: str, until: str) -> str:
    start = _validate_datetime(since, "since")
    end = _validate_datetime(until, "until")
    fields = await _log_fields()
    group_candidates = _rank_by_role(fields, "graph")
    lines: list[str] = []

    if group_candidates:
        group_by = group_candidates[0]
        soql = (
            f"SELECT {group_by}, COUNT(Id) total FROM {LD_LOG_OBJECT} "
            f"WHERE CreatedDate >= {start} AND CreatedDate <= {end} "
            f"GROUP BY {group_by} ORDER BY COUNT(Id) DESC LIMIT {LD_MAX_ROWS}"
        )
        records = await sf.query(soql)
        lines.append(f"Routing rows by {group_by}, {start} to {end}:")
        if records:
            lines.extend(
                f"  {record.get(group_by) or '(blank)'}: {record.get('total')}" for record in records
            )
        else:
            lines.append("  (no rows in window)")
    else:
        total = await sf.query(
            f"SELECT COUNT(Id) total FROM {LD_LOG_OBJECT} "
            f"WHERE CreatedDate >= {start} AND CreatedDate <= {end}"
        )
        lines.append(f"No graph/deployment field matched; total rows: {total[0].get('total') if total else 0}")

    lines.append("")
    try:
        backlog = await sf.query(f"SELECT COUNT(Id) total FROM {LD_QUEUE_OBJECT}")
        depth = backlog[0].get("total") if backlog else 0
        lines.append(f"Processing queue depth ({LD_QUEUE_OBJECT}): {depth}")
        lines.append(
            "A depth that climbs across consecutive calls means LeanData's continuous batch is behind, "
            "not that routing rules are wrong."
        )
    except SalesforceError:
        lines.append(
            f"Processing queue depth unavailable — {LD_QUEUE_OBJECT} is not readable by this integration "
            "user, or the object name differs in this package version. Set LD_QUEUE_OBJECT to override."
        )
    return "\n".join(lines)


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    try:
        if name == "describe_routing_log":
            text = await _describe_routing_log()
        elif name == "get_routing_history":
            text = await _get_routing_history(arguments["record_id"], arguments.get("limit"))
        elif name == "explain_assignment":
            text = await _explain_assignment(arguments["log_id"])
        elif name == "find_routing_errors":
            text = await _find_routing_errors(
                arguments["since"], arguments["until"], arguments.get("limit")
            )
        elif name == "get_routing_throughput":
            text = await _get_routing_throughput(arguments["since"], arguments["until"])
        else:
            text = f"Unknown tool: {name}"
    except (ValueError, KeyError) as exc:
        text = f"Invalid arguments for {name}: {exc}"
    except SalesforceError as exc:
        text = f"Salesforce error in {name}: {exc}"
    except httpx.HTTPError as exc:
        text = f"Network error in {name}: {exc}"
    return [TextContent(type="text", text=text)]


async def main() -> None:
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
