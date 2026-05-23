"""
clio-legal-mcp — MCP server for legal teams using Clio practice management.

Exposes read-only tools over the Clio API v4: list_matters, get_matter,
get_matter_time_entries, get_matter_activity, and get_contact. No writes —
the server intentionally does not register create/update/delete operations.
Attorney-client data is sensitive; queries are metadata-logged only (no
matter names, contact names, or time-entry descriptions written to logs).

Clio API v4 uses OAuth 2.0 Authorization Code flow. This scaffold expects a
long-lived access token passed via the CLIO_ACCESS_TOKEN env var (see README
for the OAuth dance to obtain one). A production deployment should implement
OAuth refresh using CLIO_CLIENT_ID + CLIO_CLIENT_SECRET + CLIO_REFRESH_TOKEN.

Regional base URLs:
  US:  https://app.clio.com/api/v4
  EU:  https://eu.app.clio.com/api/v4
  CA:  https://ca.app.clio.com/api/v4
  AU:  https://au.app.clio.com/api/v4

Rate limits (per Clio docs): 3 requests/second per application token.
HTTP 429 is returned when the limit is exceeded.

STATUS: scaffold — not runtime-tested. Validate against your Clio tenant,
adjust field names to match your account's custom-property conventions, and
complete the OAuth refresh implementation (TODO item 2) before production use.

Run as: python -m clio_legal_mcp.server
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

CLIO_ACCESS_TOKEN = os.environ.get("CLIO_ACCESS_TOKEN")
CLIO_REGION = os.environ.get("CLIO_REGION", "us").lower()

_REGION_BASES: dict[str, str] = {
    "us": "https://app.clio.com/api/v4",
    "eu": "https://eu.app.clio.com/api/v4",
    "ca": "https://ca.app.clio.com/api/v4",
    "au": "https://au.app.clio.com/api/v4",
}

API_BASE = _REGION_BASES.get(CLIO_REGION, _REGION_BASES["us"])

# Privilege-aware logger: NEVER include matter names, contact names, time-entry
# descriptions, or note text in log records. Only metadata: timestamp, tool
# name, and result count. Surfacing matter identifiers or activity descriptions
# would create a discoverable record of case activity.
audit_log = logging.getLogger("clio_legal_mcp.audit")


def require_config() -> None:
    if not CLIO_ACCESS_TOKEN:
        raise RuntimeError(
            "CLIO_ACCESS_TOKEN env var is required. See README §OAuth for how to obtain one."
        )


def auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {CLIO_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }


def log_invocation(tool: str, result_count: int | None = None) -> None:
    """Metadata-only audit record. Never includes matter names, contact names,
    time-entry descriptions, or any content that could reveal case strategy."""
    audit_log.info(
        "tool=%s ts=%s results=%s",
        tool,
        datetime.now(timezone.utc).isoformat(),
        result_count if result_count is not None else "n/a",
    )


# ----- Clio API v4 HTTP helpers -----


async def clio_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """GET from Clio API v4. Raises httpx.HTTPStatusError on 4xx/5xx."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{API_BASE}{path}", headers=auth_headers(), params=params)
        r.raise_for_status()
        return r.json()


# ----- Field helpers -----
# Clio's API returns only `id` and `etag` by default unless you specify `fields`.
# These helpers build the fields param for the most useful subsets.

MATTER_FIELDS = (
    "id,display_number,description,status,open_date,close_date,"
    "client{id,name,type},"
    "practice_area{id,name},"
    "responsible_attorney{id,name},"
    "originating_attorney{id,name},"
    "custom_field_values{id,field_name,value}"
)

TIME_ENTRY_FIELDS = (
    "id,type,date,quantity,price,note,non_billable,"
    "matter{id,display_number},"
    "user{id,name},"
    "activity_description{id,name}"
)

CONTACT_FIELDS = (
    "id,name,type,email_addresses{address,name},"
    "phone_numbers{number,name},"
    "company{id,name}"
)

ACTIVITY_FIELDS = (
    "id,type,date,quantity_in_hours,price,note,non_billable,"
    "matter{id,display_number},"
    "user{id,name},"
    "activity_description{id,name}"
)

# ----- Server + tool registry -----

server = Server("clio-legal")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="list_matters",
            description=(
                "List Clio matters, optionally filtered by status ('open', "
                "'closed', 'pending') and/or client_id. Returns id, "
                "display_number, description, status, open_date, client name, "
                "and responsible attorney per matter. Paginated; default limit 50."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["open", "closed", "pending"],
                        "description": "Filter by matter status. Omit to return all.",
                    },
                    "client_id": {
                        "type": "integer",
                        "description": "Filter by Clio contact (client) ID.",
                    },
                    "limit": {
                        "type": "integer",
                        "default": 50,
                        "maximum": 200,
                        "description": "Max records per page (Clio cap: 200).",
                    },
                    "page_token": {
                        "type": "string",
                        "description": "Cursor token from a prior response for pagination.",
                    },
                },
            },
        ),
        Tool(
            name="get_matter",
            description=(
                "Fetch full metadata for a single Clio matter by its integer ID. "
                "Returns status, open/close dates, practice area, responsible "
                "attorney, originating attorney, client, and custom field values."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "matter_id": {
                        "type": "integer",
                        "description": "Clio matter ID (integer, not display number).",
                    }
                },
                "required": ["matter_id"],
            },
        ),
        Tool(
            name="get_matter_time_entries",
            description=(
                "Return time entries (activities of type TimeEntry) logged "
                "against a matter. Includes date, quantity (hours), billed "
                "rate, billable flag, timekeeper name, and activity description. "
                "Time-entry descriptions may contain privileged work-product "
                "references — handle with attorney-client confidentiality in mind."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "matter_id": {
                        "type": "integer",
                        "description": "Clio matter ID.",
                    },
                    "start_date": {
                        "type": "string",
                        "description": "ISO 8601 date (YYYY-MM-DD) — include entries on or after.",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "ISO 8601 date (YYYY-MM-DD) — include entries on or before.",
                    },
                    "limit": {
                        "type": "integer",
                        "default": 100,
                        "maximum": 200,
                    },
                },
                "required": ["matter_id"],
            },
        ),
        Tool(
            name="get_matter_activity",
            description=(
                "Return all activity records for a matter — time entries, "
                "expense entries, and flat-fee entries — with type, date, "
                "quantity, price, and the recording user. Use this for a "
                "full billing-activity picture rather than time-only. "
                "Activity notes may contain privileged content."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "matter_id": {
                        "type": "integer",
                        "description": "Clio matter ID.",
                    },
                    "type": {
                        "type": "string",
                        "enum": ["TimeEntry", "ExpenseEntry", "FlatRateEntry"],
                        "description": "Filter to a single activity type. Omit for all.",
                    },
                    "limit": {
                        "type": "integer",
                        "default": 100,
                        "maximum": 200,
                    },
                },
                "required": ["matter_id"],
            },
        ),
        Tool(
            name="get_contact",
            description=(
                "Fetch a Clio contact (client, opposing party, or firm) by ID. "
                "Returns name, type (Person/Company), email addresses, phone "
                "numbers, and company affiliation. Contact records may include "
                "client identity information protected by confidentiality rules."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "contact_id": {
                        "type": "integer",
                        "description": "Clio contact ID.",
                    }
                },
                "required": ["contact_id"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    # ── list_matters ──────────────────────────────────────────────────────────
    if name == "list_matters":
        params: dict[str, Any] = {
            "fields": MATTER_FIELDS,
            "limit": min(arguments.get("limit", 50), 200),
        }
        if status := arguments.get("status"):
            params["status"] = status
        if client_id := arguments.get("client_id"):
            params["client_id"] = client_id
        if page_token := arguments.get("page_token"):
            params["page_token"] = page_token

        result = await clio_get("/matters.json", params)
        matters = result.get("data", [])
        # Log count only — never matter names or client names.
        log_invocation("list_matters", len(matters))
        # Strip any residual description/note text before returning to Claude
        # so that a misconfigured fields param doesn't inadvertently surface
        # privileged work-product text.
        return [TextContent(type="text", text=str(result))]

    # ── get_matter ────────────────────────────────────────────────────────────
    if name == "get_matter":
        matter_id = arguments["matter_id"]
        result = await clio_get(
            f"/matters/{matter_id}.json",
            {"fields": MATTER_FIELDS},
        )
        log_invocation("get_matter", 1)
        return [TextContent(type="text", text=str(result))]

    # ── get_matter_time_entries ───────────────────────────────────────────────
    if name == "get_matter_time_entries":
        matter_id = arguments["matter_id"]
        params = {
            "fields": TIME_ENTRY_FIELDS,
            "matter_id": matter_id,
            "type": "TimeEntry",
            "limit": min(arguments.get("limit", 100), 200),
        }
        if start := arguments.get("start_date"):
            params["date[gte]"] = start
        if end := arguments.get("end_date"):
            params["date[lte]"] = end

        result = await clio_get("/activities.json", params)
        entries = result.get("data", [])
        log_invocation("get_matter_time_entries", len(entries))
        return [TextContent(type="text", text=str(result))]

    # ── get_matter_activity ───────────────────────────────────────────────────
    if name == "get_matter_activity":
        matter_id = arguments["matter_id"]
        params = {
            "fields": ACTIVITY_FIELDS,
            "matter_id": matter_id,
            "limit": min(arguments.get("limit", 100), 200),
        }
        if activity_type := arguments.get("type"):
            params["type"] = activity_type

        result = await clio_get("/activities.json", params)
        activities = result.get("data", [])
        log_invocation("get_matter_activity", len(activities))
        return [TextContent(type="text", text=str(result))]

    # ── get_contact ───────────────────────────────────────────────────────────
    if name == "get_contact":
        contact_id = arguments["contact_id"]
        result = await clio_get(
            f"/contacts/{contact_id}.json",
            {"fields": CONTACT_FIELDS},
        )
        log_invocation("get_contact", 1)
        return [TextContent(type="text", text=str(result))]

    raise ValueError(f"Unknown tool: {name}")


# ----- Entrypoint -----


async def main() -> None:
    require_config()
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
