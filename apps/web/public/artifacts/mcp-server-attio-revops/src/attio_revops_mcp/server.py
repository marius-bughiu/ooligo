"""
attio-revops-mcp — a read-mostly MCP server over the Attio REST API.

Exposes schema discovery, record query, single-record fetch, and list-entry query
as reads, plus one gated write (update_record_attribute). Every read is bounded by
an object allowlist and a page-size cap; the write is off unless ATTIO_ALLOW_WRITES
is set, restricted to an explicit attribute allowlist, and requires a justification.

This exists alongside Attio's own hosted MCP server at https://mcp.attio.com/mcp.
The hosted server authenticates the individual user over OAuth and grants that
user's full permissions across 30+ tools. This scaffold instead runs on a workspace
API key whose scope set you choose, and narrows what an agent can reach to the
objects and attributes you name. Use the hosted server when you want breadth; use
this when you want a small, auditable surface.

STATUS: scaffold — not runtime-tested. Endpoint paths, scopes, and parameters track
the public Attio API docs (docs.attio.com) as of 2026-07. Attribute slugs are
workspace-specific; verify against your own workspace before relying on it.

Run as: python -m attio_revops_mcp.server
"""

from __future__ import annotations

import json
import os
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

ATTIO_API_KEY = os.environ.get("ATTIO_API_KEY")
ATTIO_BASE_URL = os.environ.get("ATTIO_BASE_URL", "https://api.attio.com/v2").rstrip("/")

# Objects the agent may touch at all, by api_slug. Attio workspaces routinely carry
# custom objects holding contract terms, comp data, or investor notes that have no
# business reaching an LLM. Empty means "no restriction", which you should not ship.
ATTIO_ALLOWED_OBJECTS = [
    s.strip() for s in os.environ.get("ATTIO_ALLOWED_OBJECTS", "companies,people,deals").split(",") if s.strip()
]

# Writes are off unless explicitly enabled. Attio has no undo API — a wrong value
# written from chat is repaired by hand, record by record.
ATTIO_ALLOW_WRITES = os.environ.get("ATTIO_ALLOW_WRITES", "false").lower() == "true"

# Attributes the write tool may set, as "object_slug.attribute_slug" pairs. The
# hosted server can update any attribute the signed-in user can; this list is the
# reason to run your own.
ATTIO_WRITABLE_ATTRIBUTES = [
    s.strip() for s in os.environ.get("ATTIO_WRITABLE_ATTRIBUTES", "").split(",") if s.strip()
]

# Attio's query endpoints default to limit=500. That is a large payload of personal
# data to hand a model for a question that usually wants ten rows.
MAX_LIMIT = 100
DEFAULT_LIMIT = 25


def require_config() -> None:
    if not ATTIO_API_KEY:
        raise RuntimeError("ATTIO_API_KEY env var is required")


def auth_headers() -> dict[str, str]:
    # Attio authenticates with a standard bearer token, whether the credential is a
    # workspace API key or an OAuth access token.
    return {
        "Authorization": f"Bearer {ATTIO_API_KEY}",
        "Content-Type": "application/json",
    }


def clamp_limit(value: Any) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return DEFAULT_LIMIT
    return max(1, min(n, MAX_LIMIT))


def check_object(slug: str) -> str:
    if ATTIO_ALLOWED_OBJECTS and slug not in ATTIO_ALLOWED_OBJECTS:
        raise PermissionError(
            f"Object {slug!r} is not in ATTIO_ALLOWED_OBJECTS "
            f"({', '.join(ATTIO_ALLOWED_OBJECTS)}). Add it deliberately if the agent should read it."
        )
    return slug


# ----- Attio REST helpers -----


async def attio_request(method: str, path: str, *, json_body: dict[str, Any] | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.request(
            method, f"{ATTIO_BASE_URL}{path}", headers=auth_headers(), json=json_body
        )
        _raise_for_attio(r)
        return r.json() if r.content else {}


def _raise_for_attio(r: httpx.Response) -> None:
    if r.status_code == 403:
        raise PermissionError(
            "Attio returned 403. The token is missing a scope this call needs. Reads need "
            "record_permission:read, object_configuration:read, list_entry:read, and "
            "list_configuration:read; the write tool additionally needs "
            "record_permission:read-write. Scopes are fixed when the key is created — "
            "generate a new one in workspace settings rather than editing this one."
        )
    if r.status_code == 429:
        retry_after = r.headers.get("Retry-After", "unknown")
        raise RuntimeError(
            f"Attio returned 429 (rate limit); Retry-After: {retry_after}s. The record and "
            "list query endpoints price each request by complexity — sorts, filters, and the "
            "object's total record count all raise the score, and scores are summed over a "
            "10-second sliding window. Narrow the filter or drop the sort and retry."
        )
    r.raise_for_status()


# ----- Server + tool registry -----

server = Server("attio-revops")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="list_objects",
            description=(
                "List the objects configured in the workspace (GET /v2/objects) so you can "
                "discover api_slug values before querying. Attribute slugs are workspace-"
                "specific; never guess one. Read-only."
            ),
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="query_records",
            description=(
                "Query records of one object (POST /v2/objects/{object}/records/query). "
                "Read-only. Pass an Attio filter object and optional sorts. Results are "
                "slimmed to the currently-active value per attribute. Capped at 100 rows "
                "per call; defaults to 25."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "object": {
                        "type": "string",
                        "description": "Object api_slug or UUID, e.g. 'companies'.",
                    },
                    "filter": {
                        "type": "object",
                        "description": "Attio filter object, e.g. {'name': {'$contains': 'Acme'}}.",
                    },
                    "sorts": {
                        "type": "array",
                        "items": {"type": "object"},
                        "description": "Each entry takes direction, attribute, and optional field.",
                    },
                    "limit": {"type": "integer", "default": DEFAULT_LIMIT},
                    "offset": {"type": "integer", "default": 0},
                    "attributes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Attribute slugs to keep in the response. Omit for all.",
                    },
                },
                "required": ["object"],
            },
        ),
        Tool(
            name="get_record",
            description=(
                "Fetch one record by id (GET /v2/objects/{object}/records/{record_id}). "
                "Read-only. Returns the slimmed attribute map plus the record's web_url so "
                "a human can open it in Attio."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "object": {"type": "string"},
                    "record_id": {"type": "string", "description": "Record UUID."},
                },
                "required": ["object", "record_id"],
            },
        ),
        Tool(
            name="query_list_entries",
            description=(
                "Query entries on a list (POST /v2/lists/{list}/entries/query). Read-only. "
                "A list is Attio's pipeline surface — use this for 'what is in stage X' "
                "questions rather than querying the parent object. Capped at 100 entries."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "list": {"type": "string", "description": "List api_slug or UUID."},
                    "filter": {"type": "object"},
                    "sorts": {"type": "array", "items": {"type": "object"}},
                    "limit": {"type": "integer", "default": DEFAULT_LIMIT},
                    "offset": {"type": "integer", "default": 0},
                },
                "required": ["list"],
            },
        ),
        Tool(
            name="update_record_attribute",
            description=(
                "Set ONE attribute on ONE record (PATCH /v2/objects/{object}/records/"
                "{record_id}). A write. Disabled unless ATTIO_ALLOW_WRITES=true, restricted "
                "to ATTIO_WRITABLE_ATTRIBUTES, and requires a justification of at least 10 "
                "characters. PATCH is used deliberately: it prepends to multiselect values "
                "rather than replacing them, so this tool cannot erase existing values."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "object": {"type": "string"},
                    "record_id": {"type": "string"},
                    "attribute": {
                        "type": "string",
                        "description": "Attribute api_slug, e.g. 'owner' or 'lifecycle_stage'.",
                    },
                    "value": {
                        "description": "Scalar for single-value attributes, array for multiselect."
                    },
                    "justification": {"type": "string", "minLength": 10},
                },
                "required": ["object", "record_id", "attribute", "value", "justification"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    if name == "list_objects":
        data = await attio_request("GET", "/objects")
        rows = [
            {
                "api_slug": o.get("api_slug"),
                "singular_noun": o.get("singular_noun"),
                "plural_noun": o.get("plural_noun"),
                "readable": (not ATTIO_ALLOWED_OBJECTS) or o.get("api_slug") in ATTIO_ALLOWED_OBJECTS,
            }
            for o in data.get("data", [])
        ]
        return [TextContent(type="text", text=json.dumps({"objects": rows}, indent=2))]

    if name == "query_records":
        obj = check_object(arguments["object"])
        body: dict[str, Any] = {
            "limit": clamp_limit(arguments.get("limit", DEFAULT_LIMIT)),
            "offset": int(arguments.get("offset", 0)),
        }
        if v := arguments.get("filter"):
            body["filter"] = v
        if v := arguments.get("sorts"):
            body["sorts"] = v
        data = await attio_request("POST", f"/objects/{obj}/records/query", json_body=body)
        keep = arguments.get("attributes")
        rows = [_slim_record(rec, keep) for rec in data.get("data", [])]
        return [
            TextContent(
                type="text",
                text=json.dumps({"object": obj, "returned": len(rows), "records": rows}, indent=2),
            )
        ]

    if name == "get_record":
        obj = check_object(arguments["object"])
        record_id = arguments["record_id"]
        data = await attio_request("GET", f"/objects/{obj}/records/{record_id}")
        return [TextContent(type="text", text=json.dumps(_slim_record(data.get("data", {}), None), indent=2))]

    if name == "query_list_entries":
        list_ref = arguments["list"]
        body = {
            "limit": clamp_limit(arguments.get("limit", DEFAULT_LIMIT)),
            "offset": int(arguments.get("offset", 0)),
        }
        if v := arguments.get("filter"):
            body["filter"] = v
        if v := arguments.get("sorts"):
            body["sorts"] = v
        data = await attio_request("POST", f"/lists/{list_ref}/entries/query", json_body=body)
        rows = [_slim_entry(e) for e in data.get("data", [])]
        return [
            TextContent(
                type="text",
                text=json.dumps({"list": list_ref, "returned": len(rows), "entries": rows}, indent=2),
            )
        ]

    if name == "update_record_attribute":
        justification = (arguments.get("justification") or "").strip()
        if len(justification) < 10:
            raise ValueError("justification is mandatory and must be at least 10 characters.")
        if not ATTIO_ALLOW_WRITES:
            raise PermissionError(
                "update_record_attribute is disabled. Set ATTIO_ALLOW_WRITES=true to allow "
                "chat-driven CRM writes, and list the permitted attributes in "
                "ATTIO_WRITABLE_ATTRIBUTES."
            )
        obj = check_object(arguments["object"])
        attribute = arguments["attribute"]
        qualified = f"{obj}.{attribute}"
        if qualified not in ATTIO_WRITABLE_ATTRIBUTES:
            raise PermissionError(
                f"{qualified!r} is not in ATTIO_WRITABLE_ATTRIBUTES "
                f"({', '.join(ATTIO_WRITABLE_ATTRIBUTES) or 'empty'}). Writes are allowlisted "
                "per attribute, not per object."
            )
        record_id = arguments["record_id"]
        body = {"data": {"values": {attribute: arguments["value"]}}}
        data = await attio_request(
            "PATCH", f"/objects/{obj}/records/{record_id}", json_body=body
        )
        web_url = (data.get("data") or {}).get("web_url")
        return [
            TextContent(
                type="text",
                text=(
                    f"Set {qualified} on record {record_id} ({justification!r}). "
                    f"Multiselect values were prepended, not replaced. Open in Attio: {web_url}"
                ),
            )
        ]

    raise ValueError(f"Unknown tool: {name}")


# ----- Response slimming (keep model payloads tractable) -----


def _slim_record(rec: dict[str, Any], keep: list[str] | None) -> dict[str, Any]:
    """Reduce Attio's value-history shape to one current value per attribute.

    Attio returns every attribute as an array of value objects carrying active_from,
    active_until, created_by_actor, and type-specific fields — the full history, not
    just the present. Handing that to a model multiplies token cost several times over
    for information nobody asked for. We keep the entries where active_until is null.
    """
    values = rec.get("values", {}) or {}
    out: dict[str, Any] = {}
    for slug, entries in values.items():
        if keep and slug not in keep:
            continue
        if not isinstance(entries, list):
            continue
        current = [e for e in entries if isinstance(e, dict) and e.get("active_until") is None]
        simplified = [_simplify_value(e) for e in current]
        if not simplified:
            continue
        out[slug] = simplified[0] if len(simplified) == 1 else simplified
    ids = rec.get("id", {}) or {}
    return {
        "record_id": ids.get("record_id"),
        "web_url": rec.get("web_url"),
        "created_at": rec.get("created_at"),
        "values": out,
    }


def _simplify_value(entry: dict[str, Any]) -> Any:
    """Pull the human-meaningful field out of one Attio value object.

    Attio's value shape is discriminated by `attribute_type`, and each type puts its
    payload under a different key. Rather than enumerate every type, we probe the
    common carriers in order and fall back to the stripped object.
    """
    for key in (
        "value",
        "full_name",
        "email_address",
        "phone_number",
        "domain",
        "status",
        "option",
        "target_record_id",
        "referenced_actor_name",
        "currency_value",
    ):
        if key in entry and entry[key] is not None:
            v = entry[key]
            if isinstance(v, dict):
                return v.get("title") or v.get("name") or v
            return v
    return {k: v for k, v in entry.items() if k not in ("active_from", "active_until", "created_by_actor")}


def _slim_entry(entry: dict[str, Any]) -> dict[str, Any]:
    ids = entry.get("id", {}) or {}
    parent = entry.get("parent_record_id")
    values = entry.get("entry_values", entry.get("values", {})) or {}
    out = {}
    for slug, entries in values.items():
        if isinstance(entries, list) and entries:
            current = [e for e in entries if isinstance(e, dict) and e.get("active_until") is None]
            if current:
                out[slug] = _simplify_value(current[0])
    return {
        "entry_id": ids.get("entry_id"),
        "parent_record_id": parent,
        "parent_object": entry.get("parent_object"),
        "created_at": entry.get("created_at"),
        "values": out,
    }


# ----- Entrypoint -----


async def main() -> None:
    require_config()
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
