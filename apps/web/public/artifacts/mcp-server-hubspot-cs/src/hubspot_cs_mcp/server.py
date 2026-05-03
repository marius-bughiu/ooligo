"""
hubspot-cs-mcp — MCP server tuned for customer success workflows on HubSpot.

Exposes object-read tools, search tools, three CS-specific helpers
(at_risk_renewals, aging_tickets, accounts_needing_qbr), and two light
write tools (create_ticket, add_note). Read-mostly by design — Claude
asks, summarizes, documents; the CSM drives every customer-facing change.

STATUS: scaffold — not runtime-tested. Adapt the property names,
pipeline stage IDs, and association labels to your portal before use.

Run as: python -m hubspot_cs_mcp.server
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

HUBSPOT_TOKEN = os.environ.get("HUBSPOT_TOKEN")
HUBSPOT_PORTAL_ID = os.environ.get("HUBSPOT_PORTAL_ID")
HEALTH_SCORE_PROPERTY = os.environ.get("HUBSPOT_HEALTH_SCORE_PROPERTY", "health_score")
RENEWAL_STAGE_IDS = [
    s.strip()
    for s in os.environ.get("HUBSPOT_RENEWAL_STAGE_IDS", "").split(",")
    if s.strip()
]
RENEWAL_HEALTH_THRESHOLD = int(os.environ.get("HUBSPOT_RENEWAL_HEALTH_THRESHOLD", "60"))

API_BASE = "https://api.hubapi.com"


def require_config() -> None:
    if not HUBSPOT_TOKEN:
        raise RuntimeError("HUBSPOT_TOKEN env var is required")
    if not HUBSPOT_PORTAL_ID:
        raise RuntimeError("HUBSPOT_PORTAL_ID env var is required")


def auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {HUBSPOT_TOKEN}",
        "Content-Type": "application/json",
    }


# ----- HubSpot HTTP helpers -----


async def hs_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{API_BASE}{path}", headers=auth_headers(), params=params)
        r.raise_for_status()
        return r.json()


async def hs_post(path: str, body: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{API_BASE}{path}", headers=auth_headers(), json=body)
        r.raise_for_status()
        return r.json()


# ----- Server + tool registry -----

server = Server("hubspot-cs")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_contact",
            description="Fetch full properties for a contact by ID.",
            inputSchema={
                "type": "object",
                "properties": {"contact_id": {"type": "string"}},
                "required": ["contact_id"],
            },
        ),
        Tool(
            name="get_company",
            description="Fetch full properties + associated contacts for a company by ID.",
            inputSchema={
                "type": "object",
                "properties": {"company_id": {"type": "string"}},
                "required": ["company_id"],
            },
        ),
        Tool(
            name="get_deal",
            description="Fetch full properties + associated contacts/company for a deal by ID.",
            inputSchema={
                "type": "object",
                "properties": {"deal_id": {"type": "string"}},
                "required": ["deal_id"],
            },
        ),
        Tool(
            name="get_ticket",
            description="Fetch full properties + associated company for a ticket by ID.",
            inputSchema={
                "type": "object",
                "properties": {"ticket_id": {"type": "string"}},
                "required": ["ticket_id"],
            },
        ),
        Tool(
            name="search_contacts",
            description="Search contacts by name/email substring.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "limit": {"type": "integer", "default": 25},
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="search_companies",
            description="Search companies by name/domain substring.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "limit": {"type": "integer", "default": 25},
                },
                "required": ["query"],
            },
        ),
        Tool(
            name="at_risk_renewals",
            description=(
                "Renewals closing within window_days, filtered by health-score below "
                "the configured threshold. Returns deal id, name, amount, close date, "
                "owner, health score."
            ),
            inputSchema={
                "type": "object",
                "properties": {"window_days": {"type": "integer", "default": 90}},
            },
        ),
        Tool(
            name="aging_tickets",
            description=(
                "Open tickets older than min_age_hours, grouped by company. "
                "Caps at limit (default 500) to bound response size."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "min_age_hours": {"type": "integer", "default": 48},
                    "limit": {"type": "integer", "default": 500},
                },
            },
        ),
        Tool(
            name="accounts_needing_qbr",
            description=(
                "Companies with no recorded QBR-tagged activity in the last "
                "months_since_last months."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "months_since_last": {"type": "integer", "default": 3}
                },
            },
        ),
        Tool(
            name="create_ticket",
            description="Open a new ticket. Optionally associate with a company.",
            inputSchema={
                "type": "object",
                "properties": {
                    "subject": {"type": "string"},
                    "body": {"type": "string"},
                    "company_id": {"type": "string"},
                },
                "required": ["subject", "body"],
            },
        ),
        Tool(
            name="add_note",
            description="Append a note engagement to a CRM record.",
            inputSchema={
                "type": "object",
                "properties": {
                    "object_type": {
                        "type": "string",
                        "enum": ["contact", "company", "deal", "ticket"],
                    },
                    "object_id": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["object_type", "object_id", "body"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    if name == "get_contact":
        data = await hs_get(f"/crm/v3/objects/contacts/{arguments['contact_id']}")
        return [TextContent(type="text", text=str(data))]

    if name == "get_company":
        company = await hs_get(
            f"/crm/v3/objects/companies/{arguments['company_id']}",
            {"associations": "contacts"},
        )
        return [TextContent(type="text", text=str(company))]

    if name == "get_deal":
        deal = await hs_get(
            f"/crm/v3/objects/deals/{arguments['deal_id']}",
            {"associations": "contacts,companies"},
        )
        return [TextContent(type="text", text=str(deal))]

    if name == "get_ticket":
        ticket = await hs_get(
            f"/crm/v3/objects/tickets/{arguments['ticket_id']}",
            {"associations": "companies"},
        )
        return [TextContent(type="text", text=str(ticket))]

    if name == "search_contacts":
        result = await hs_post(
            "/crm/v3/objects/contacts/search",
            {
                "query": arguments["query"],
                "limit": arguments.get("limit", 25),
                "properties": ["firstname", "lastname", "email", "company"],
            },
        )
        return [TextContent(type="text", text=str(result))]

    if name == "search_companies":
        result = await hs_post(
            "/crm/v3/objects/companies/search",
            {
                "query": arguments["query"],
                "limit": arguments.get("limit", 25),
                "properties": ["name", "domain", "industry", "owner"],
            },
        )
        return [TextContent(type="text", text=str(result))]

    if name == "at_risk_renewals":
        if not RENEWAL_STAGE_IDS:
            raise RuntimeError(
                "HUBSPOT_RENEWAL_STAGE_IDS env var is required for at_risk_renewals."
            )
        window_days = arguments.get("window_days", 90)
        cutoff = datetime.now(timezone.utc) + timedelta(days=window_days)
        body = {
            "filterGroups": [
                {
                    "filters": [
                        {
                            "propertyName": "dealstage",
                            "operator": "IN",
                            "values": RENEWAL_STAGE_IDS,
                        },
                        {
                            "propertyName": "closedate",
                            "operator": "LTE",
                            "value": int(cutoff.timestamp() * 1000),
                        },
                        {
                            "propertyName": HEALTH_SCORE_PROPERTY,
                            "operator": "LT",
                            "value": RENEWAL_HEALTH_THRESHOLD,
                        },
                    ]
                }
            ],
            "properties": [
                "dealname",
                "amount",
                "closedate",
                "hubspot_owner_id",
                "dealstage",
                HEALTH_SCORE_PROPERTY,
            ],
            "limit": 100,
            "sorts": [{"propertyName": "closedate", "direction": "ASCENDING"}],
        }
        result = await hs_post("/crm/v3/objects/deals/search", body)
        return [TextContent(type="text", text=str(result))]

    if name == "aging_tickets":
        min_age_hours = arguments.get("min_age_hours", 48)
        limit = min(arguments.get("limit", 500), 500)
        cutoff = datetime.now(timezone.utc) - timedelta(hours=min_age_hours)
        body = {
            "filterGroups": [
                {
                    "filters": [
                        {"propertyName": "hs_pipeline_stage", "operator": "NEQ", "value": "closed"},
                        {
                            "propertyName": "createdate",
                            "operator": "LTE",
                            "value": int(cutoff.timestamp() * 1000),
                        },
                    ]
                }
            ],
            "properties": [
                "subject",
                "hs_pipeline_stage",
                "hs_ticket_priority",
                "createdate",
                "hubspot_owner_id",
            ],
            "limit": limit,
            "sorts": [{"propertyName": "createdate", "direction": "ASCENDING"}],
        }
        result = await hs_post("/crm/v3/objects/tickets/search", body)
        return [TextContent(type="text", text=str(result))]

    if name == "accounts_needing_qbr":
        months_since_last = arguments.get("months_since_last", 3)
        cutoff = datetime.now(timezone.utc) - timedelta(days=months_since_last * 30)
        # Companies whose `last_qbr_at` (custom property) is null or before cutoff.
        body = {
            "filterGroups": [
                {
                    "filters": [
                        {"propertyName": "last_qbr_at", "operator": "NOT_HAS_PROPERTY"},
                    ]
                },
                {
                    "filters": [
                        {
                            "propertyName": "last_qbr_at",
                            "operator": "LTE",
                            "value": int(cutoff.timestamp() * 1000),
                        }
                    ]
                },
            ],
            "properties": ["name", "domain", "owner", "last_qbr_at"],
            "limit": 100,
            "sorts": [{"propertyName": "last_qbr_at", "direction": "ASCENDING"}],
        }
        result = await hs_post("/crm/v3/objects/companies/search", body)
        return [TextContent(type="text", text=str(result))]

    if name == "create_ticket":
        body = {
            "properties": {
                "subject": arguments["subject"],
                "content": arguments["body"],
                "hs_pipeline_stage": "1",  # adjust to your portal's "new" stage id
            }
        }
        ticket = await hs_post("/crm/v3/objects/tickets", body)
        if cid := arguments.get("company_id"):
            await hs_post(
                f"/crm/v4/objects/tickets/{ticket['id']}/associations/companies/{cid}",
                {"types": [{"associationCategory": "HUBSPOT_DEFINED", "associationTypeId": 26}]},
            )
        return [TextContent(type="text", text=f"Created ticket {ticket['id']}")]

    if name == "add_note":
        ot = arguments["object_type"]
        oid = arguments["object_id"]
        # Notes are a separate engagement object in v3. Create then associate.
        note = await hs_post(
            "/crm/v3/objects/notes",
            {
                "properties": {
                    "hs_note_body": arguments["body"],
                    "hs_timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                }
            },
        )
        # Association type IDs are object-pair specific — these are HubSpot defaults.
        assoc_type_id = {
            "contact": 202,
            "company": 190,
            "deal": 214,
            "ticket": 228,
        }[ot]
        await hs_post(
            f"/crm/v4/objects/notes/{note['id']}/associations/{ot}s/{oid}",
            {
                "types": [
                    {
                        "associationCategory": "HUBSPOT_DEFINED",
                        "associationTypeId": assoc_type_id,
                    }
                ]
            },
        )
        return [TextContent(type="text", text=f"Added note {note['id']} to {ot} {oid}")]

    raise ValueError(f"Unknown tool: {name}")


# ----- Entrypoint -----


async def main() -> None:
    require_config()
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
