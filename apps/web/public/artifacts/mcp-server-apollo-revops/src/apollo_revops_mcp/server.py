"""
apollo-revops-mcp — MCP server tuned for revenue-operations prospecting on Apollo.io.

Exposes prospect search against the Apollo database (no credits), search over your
team's saved Contacts, sequence listing, and per-sequence engagement stats — plus
two gated actions: person enrichment (spends Apollo credits) and two writes
(create_contact, add_contacts_to_sequence). Read-mostly by design. The two writes
and the credit-spending enrichment each require a justification string; enrichment
additionally requires the APOLLO_ALLOW_CREDIT_SPEND env flag, so Claude cannot burn
credits or mass-enroll contacts by misreading a question.

STATUS: scaffold — not runtime-tested. Endpoint paths and parameters track the
public Apollo API docs (docs.apollo.io) as of 2026-06; verify against your account's
plan limits and field names before use.

Run as: python -m apollo_revops_mcp.server
"""

from __future__ import annotations

import os
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

APOLLO_API_KEY = os.environ.get("APOLLO_API_KEY")
APOLLO_BASE_URL = os.environ.get("APOLLO_BASE_URL", "https://api.apollo.io/api/v1").rstrip("/")

# Enrichment (POST /people/match) spends Apollo credits. Off unless explicitly
# opted in, so a misread question cannot quietly drain the team's credit balance.
APOLLO_ALLOW_CREDIT_SPEND = os.environ.get("APOLLO_ALLOW_CREDIT_SPEND", "false").lower() == "true"

# Hard cap on contacts added to a sequence per call. The add-to-sequence endpoint
# happily enrolls hundreds at once; this cap keeps an accidental enrollment small
# enough to undo by hand.
APOLLO_MAX_SEQUENCE_BATCH = int(os.environ.get("APOLLO_MAX_SEQUENCE_BATCH", "25"))

# Optional default sending mailbox for add_contacts_to_sequence. Apollo requires a
# send-from account id; set this so callers do not have to pass it every time.
APOLLO_DEFAULT_SEND_ACCOUNT_ID = os.environ.get("APOLLO_DEFAULT_SEND_ACCOUNT_ID")

# Page-size ceiling. Apollo caps every search at 100/page, 500 pages (50,000 rows).
# We default smaller and never exceed 100 to keep response payloads tractable for
# the model.
MAX_PER_PAGE = 100
DEFAULT_PER_PAGE = 25


def require_config() -> None:
    if not APOLLO_API_KEY:
        raise RuntimeError("APOLLO_API_KEY env var is required")


def auth_headers() -> dict[str, str]:
    # Apollo authenticates with an x-api-key header, NOT a Bearer token. The
    # sequence and outreach-email endpoints additionally require a *master* key;
    # a non-master key returns 403 on those.
    return {
        "x-api-key": APOLLO_API_KEY or "",
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
    }


def clamp_per_page(value: Any) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return DEFAULT_PER_PAGE
    return max(1, min(n, MAX_PER_PAGE))


# ----- Apollo REST helpers -----


async def apollo_post(path: str, body: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{APOLLO_BASE_URL}{path}", headers=auth_headers(), json=body)
        _raise_for_apollo(r)
        return r.json() if r.content else {}


async def apollo_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{APOLLO_BASE_URL}{path}", headers=auth_headers(), params=params)
        _raise_for_apollo(r)
        return r.json() if r.content else {}


def _raise_for_apollo(r: httpx.Response) -> None:
    if r.status_code == 403:
        raise PermissionError(
            "Apollo returned 403. The sequence and outreach-email endpoints require a "
            "MASTER API key; generate one in Settings -> Integrations -> API and set it "
            "as APOLLO_API_KEY."
        )
    if r.status_code == 429:
        raise RuntimeError(
            "Apollo returned 429 (rate limit). Check per-minute/hour/day limits with the "
            "View API Usage Stats endpoint; back off and retry."
        )
    r.raise_for_status()


# ----- Server + tool registry -----

server = Server("apollo-revops")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="search_people",
            description=(
                "Prospect the Apollo people database (POST /mixed_people/api_search). "
                "Does NOT consume credits and does NOT reveal emails/phones — it returns "
                "match metadata for building a list. Filter by title, seniority, location, "
                "and company domain. Max 100 per page."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "person_titles": {"type": "array", "items": {"type": "string"}},
                    "person_seniorities": {"type": "array", "items": {"type": "string"}},
                    "person_locations": {"type": "array", "items": {"type": "string"}},
                    "organization_domains": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Company domains, e.g. ['stripe.com'].",
                    },
                    "q_keywords": {"type": "string"},
                    "page": {"type": "integer", "default": 1},
                    "per_page": {"type": "integer", "default": DEFAULT_PER_PAGE},
                },
            },
        ),
        Tool(
            name="search_contacts",
            description=(
                "Search your team's saved Apollo Contacts (POST /contacts/search). A "
                "contact is a person your team has explicitly added — distinct from raw "
                "database people. Filter by keyword, stage, and label."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "q_keywords": {"type": "string"},
                    "contact_stage_ids": {"type": "array", "items": {"type": "string"}},
                    "contact_label_ids": {"type": "array", "items": {"type": "string"}},
                    "sort_by_field": {"type": "string"},
                    "page": {"type": "integer", "default": 1},
                    "per_page": {"type": "integer", "default": DEFAULT_PER_PAGE},
                },
            },
        ),
        Tool(
            name="list_sequences",
            description=(
                "List sequences in your team's account (POST /emailer_campaigns/search). "
                "Requires a MASTER API key. Optional q_name keyword filter."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "q_name": {"type": "string"},
                    "page": {"type": "integer", "default": 1},
                    "per_page": {"type": "integer", "default": DEFAULT_PER_PAGE},
                },
            },
        ),
        Tool(
            name="sequence_engagement",
            description=(
                "Summarize outreach-email engagement for one sequence "
                "(GET /emailer_messages/search), aggregating message counts by status "
                "(delivered, opened, clicked, replied, bounced). Requires a MASTER API key."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "emailer_campaign_id": {"type": "string"},
                    "date_min": {"type": "string", "description": "ISO date, e.g. 2026-06-01"},
                    "date_max": {"type": "string", "description": "ISO date, e.g. 2026-06-30"},
                    "per_page": {"type": "integer", "default": MAX_PER_PAGE},
                },
                "required": ["emailer_campaign_id"],
            },
        ),
        Tool(
            name="enrich_person",
            description=(
                "Enrich one person via waterfall (POST /people/match). CONSUMES CREDITS. "
                "Disabled unless APOLLO_ALLOW_CREDIT_SPEND=true. Requires a justification "
                "(>= 10 chars). reveal_phone_number is refused here because it needs a "
                "configured webhook_url."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "first_name": {"type": "string"},
                    "last_name": {"type": "string"},
                    "name": {"type": "string"},
                    "email": {"type": "string"},
                    "domain": {"type": "string"},
                    "linkedin_url": {"type": "string"},
                    "reveal_personal_emails": {"type": "boolean", "default": False},
                    "justification": {"type": "string", "minLength": 10},
                },
                "required": ["justification"],
            },
        ),
        Tool(
            name="create_contact",
            description=(
                "Create a Contact in your team's account (POST /contacts). A write. "
                "Requires a justification (>= 10 chars). run_dedupe defaults true so a "
                "re-run does not fan out duplicates."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "first_name": {"type": "string"},
                    "last_name": {"type": "string"},
                    "organization_name": {"type": "string"},
                    "title": {"type": "string"},
                    "email": {"type": "string"},
                    "run_dedupe": {"type": "boolean", "default": True},
                    "justification": {"type": "string", "minLength": 10},
                },
                "required": ["first_name", "last_name", "justification"],
            },
        ),
        Tool(
            name="add_contacts_to_sequence",
            description=(
                "Add existing contacts to a sequence "
                "(POST /emailer_campaigns/{id}/add_contact_ids). A write that triggers "
                "sends. Requires a MASTER API key, a justification (>= 10 chars), and a "
                "send-from mailbox. Hard-capped at APOLLO_MAX_SEQUENCE_BATCH contacts/call."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "sequence_id": {"type": "string"},
                    "contact_ids": {"type": "array", "items": {"type": "string"}},
                    "send_from_email_account_id": {"type": "string"},
                    "justification": {"type": "string", "minLength": 10},
                },
                "required": ["sequence_id", "contact_ids", "justification"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    if name == "search_people":
        body: dict[str, Any] = {
            "page": int(arguments.get("page", 1)),
            "per_page": clamp_per_page(arguments.get("per_page", DEFAULT_PER_PAGE)),
        }
        if v := arguments.get("person_titles"):
            body["person_titles"] = v
        if v := arguments.get("person_seniorities"):
            body["person_seniorities"] = v
        if v := arguments.get("person_locations"):
            body["person_locations"] = v
        if v := arguments.get("organization_domains"):
            body["q_organization_domains_list"] = v
        if v := arguments.get("q_keywords"):
            body["q_keywords"] = v
        data = await apollo_post("/mixed_people/api_search", body)
        return [TextContent(type="text", text=str(_slim_people(data)))]

    if name == "search_contacts":
        body = {
            "page": int(arguments.get("page", 1)),
            "per_page": clamp_per_page(arguments.get("per_page", DEFAULT_PER_PAGE)),
        }
        for key in ("q_keywords", "sort_by_field"):
            if v := arguments.get(key):
                body[key] = v
        for key in ("contact_stage_ids", "contact_label_ids"):
            if v := arguments.get(key):
                body[key] = v
        data = await apollo_post("/contacts/search", body)
        return [TextContent(type="text", text=str(_slim_contacts(data)))]

    if name == "list_sequences":
        body = {
            "page": int(arguments.get("page", 1)),
            "per_page": clamp_per_page(arguments.get("per_page", DEFAULT_PER_PAGE)),
        }
        if v := arguments.get("q_name"):
            body["q_name"] = v
        data = await apollo_post("/emailer_campaigns/search", body)
        return [TextContent(type="text", text=str(data))]

    if name == "sequence_engagement":
        params: dict[str, Any] = {
            "emailer_campaign_ids[]": arguments["emailer_campaign_id"],
            "per_page": clamp_per_page(arguments.get("per_page", MAX_PER_PAGE)),
            "page": 1,
        }
        if v := arguments.get("date_min"):
            params["emailer_message_date_range[min]"] = v
        if v := arguments.get("date_max"):
            params["emailer_message_date_range[max]"] = v
        data = await apollo_get("/emailer_messages/search", params)
        return [TextContent(type="text", text=str(_summarize_engagement(data)))]

    if name == "enrich_person":
        justification = (arguments.get("justification") or "").strip()
        if len(justification) < 10:
            raise ValueError("justification is mandatory and must be at least 10 characters.")
        if not APOLLO_ALLOW_CREDIT_SPEND:
            raise PermissionError(
                "enrich_person consumes Apollo credits and is disabled. Set "
                "APOLLO_ALLOW_CREDIT_SPEND=true to allow credit-spending enrichment."
            )
        body = {k: arguments[k] for k in ("first_name", "last_name", "name", "email", "domain") if arguments.get(k)}
        if v := arguments.get("linkedin_url"):
            body["linkedin_url"] = v
        body["reveal_personal_emails"] = bool(arguments.get("reveal_personal_emails", False))
        # reveal_phone_number requires a webhook_url; not wired in this scaffold.
        body["reveal_phone_number"] = False
        data = await apollo_post("/people/match", body)
        return [TextContent(type="text", text=str(data))]

    if name == "create_contact":
        justification = (arguments.get("justification") or "").strip()
        if len(justification) < 10:
            raise ValueError("justification is mandatory and must be at least 10 characters.")
        body = {
            "first_name": arguments["first_name"],
            "last_name": arguments["last_name"],
            "run_dedupe": bool(arguments.get("run_dedupe", True)),
        }
        for key in ("organization_name", "title", "email"):
            if v := arguments.get(key):
                body[key] = v
        data = await apollo_post("/contacts", body)
        contact = data.get("contact", {})
        return [
            TextContent(
                type="text",
                text=f"Created contact {contact.get('id', '?')} ({justification!r}).",
            )
        ]

    if name == "add_contacts_to_sequence":
        justification = (arguments.get("justification") or "").strip()
        if len(justification) < 10:
            raise ValueError("justification is mandatory and must be at least 10 characters.")
        contact_ids = arguments.get("contact_ids") or []
        if not contact_ids:
            raise ValueError("contact_ids must be a non-empty list.")
        if len(contact_ids) > APOLLO_MAX_SEQUENCE_BATCH:
            raise ValueError(
                f"Refusing to add {len(contact_ids)} contacts in one call; the cap is "
                f"{APOLLO_MAX_SEQUENCE_BATCH}. Split the batch or raise "
                "APOLLO_MAX_SEQUENCE_BATCH deliberately."
            )
        send_account = arguments.get("send_from_email_account_id") or APOLLO_DEFAULT_SEND_ACCOUNT_ID
        if not send_account:
            raise ValueError(
                "send_from_email_account_id is required (or set APOLLO_DEFAULT_SEND_ACCOUNT_ID)."
            )
        seq_id = arguments["sequence_id"]
        body = {
            "emailer_campaign_id": seq_id,
            "contact_ids": contact_ids,
            "send_email_from_email_account_id": send_account,
        }
        data = await apollo_post(f"/emailer_campaigns/{seq_id}/add_contact_ids", body)
        return [
            TextContent(
                type="text",
                text=(
                    f"Added {len(contact_ids)} contact(s) to sequence {seq_id} "
                    f"from mailbox {send_account} ({justification!r}). Response: {data}"
                ),
            )
        ]

    raise ValueError(f"Unknown tool: {name}")


# ----- Response slimming (keep model payloads tractable) -----


def _slim_people(data: dict[str, Any]) -> dict[str, Any]:
    people = data.get("people", []) or data.get("contacts", [])
    rows = [
        {
            "id": p.get("id"),
            "name": p.get("name"),
            "title": p.get("title"),
            "organization": (p.get("organization") or {}).get("name"),
            "linkedin_url": p.get("linkedin_url"),
        }
        for p in people
    ]
    return {"pagination": data.get("pagination"), "people": rows}


def _slim_contacts(data: dict[str, Any]) -> dict[str, Any]:
    contacts = data.get("contacts", [])
    rows = [
        {
            "id": c.get("id"),
            "name": c.get("name"),
            "title": c.get("title"),
            "email": c.get("email"),
            "stage": c.get("contact_stage_id"),
        }
        for c in contacts
    ]
    return {"pagination": data.get("pagination"), "contacts": rows}


def _summarize_engagement(data: dict[str, Any]) -> dict[str, Any]:
    messages = data.get("emailer_messages", [])
    counts: dict[str, int] = {}
    for m in messages:
        status = m.get("status") or m.get("email_status") or "unknown"
        counts[status] = counts.get(status, 0) + 1
    total = len(messages)
    return {
        "sampled_messages": total,
        "by_status": counts,
        "note": "Counts cover the sampled page(s) only; page through for full totals.",
    }


# ----- Entrypoint -----


async def main() -> None:
    require_config()
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
