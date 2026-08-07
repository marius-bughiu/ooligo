"""zoominfo-gtm-mcp — a read-only, credit-governed MCP server over the ZoomInfo GTM API.

Exposes five read tools: two free searches, two budgeted enrichments, and a credit-status
tool the agent is told to call before any batch. Every credit-spending call passes through
the governor in budget.py, which holds the worst-case cost, checks a daily ceiling, serves
records from a local cache when they are still inside the Records Under Management window,
and writes an audit row naming the run that spent the money.

This exists alongside ZoomInfo's own hosted MCP server at https://mcp.zoominfo.com/mcp,
which is included with a subscription, exposes 19 tools, and is the right answer for a
person doing interactive research. ZoomInfo's own guidance is that its hosted server is
not for scheduled jobs or bulk pipelines — those run through the API. This scaffold is for
exactly that case: an unattended agent, running on a service identity, against a hard
credit ceiling that a per-user OAuth grant cannot express.

STATUS: scaffold — not runtime-tested. Endpoint paths, scopes, request shapes, and the
credit rules track the public ZoomInfo GTM API docs (docs.zoominfo.com) as of August 2026.
The company paths and the usage path are quoted directly from those docs; the contact
paths follow the documented symmetry and should be confirmed against
https://docs.zoominfo.com/llms.txt before production use.

Run as: python -m zoominfo_gtm_mcp.server
"""

from __future__ import annotations

import json
import os
import time
import uuid
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

from .budget import BudgetExceeded, governor_from_env

# ----- Configuration (read from env at startup) -----

ZI_CLIENT_ID = os.environ.get("ZI_CLIENT_ID")
ZI_CLIENT_SECRET = os.environ.get("ZI_CLIENT_SECRET")
ZI_BASE_URL = os.environ.get("ZI_BASE_URL", "https://api.zoominfo.com/gtm").rstrip("/")

# Client credentials, not the authorization-code flow the hosted server uses. A service
# identity is the point: an unattended agent should carry its own scope set, not borrow
# whichever human happened to authorize it last.
TOKEN_PATH = "/oauth/v1/token"
ZI_SCOPES = os.environ.get("ZI_SCOPES", "api:data:company api:data:contact")

# ZoomInfo caps enrich at 25 records per request and search at 100 per page. Both are the
# vendor's numbers, not ours; sending more is a 4xx, not a slow success.
MAX_ENRICH_BATCH = 25
MAX_SEARCH_PAGE = 100
DEFAULT_SEARCH_PAGE = 25

# Tokens come back with expires_in around 1000 seconds. Refreshing at 80% of the stated
# lifetime avoids the case where a token passes the local check and expires in flight.
TOKEN_REFRESH_MARGIN = 0.8

RUN_ID = os.environ.get("ZI_RUN_ID") or f"run-{uuid.uuid4().hex[:12]}"

_governor = None
_token: dict[str, Any] = {"access_token": None, "expires_at": 0.0}


def governor():
    global _governor
    if _governor is None:
        _governor = governor_from_env(RUN_ID)
    return _governor


def require_config() -> None:
    missing = [n for n, v in (("ZI_CLIENT_ID", ZI_CLIENT_ID), ("ZI_CLIENT_SECRET", ZI_CLIENT_SECRET)) if not v]
    if missing:
        raise RuntimeError(f"{' and '.join(missing)} env var(s) required")


# ----- Auth -----


async def access_token(client: httpx.AsyncClient) -> str:
    if _token["access_token"] and time.time() < _token["expires_at"]:
        return _token["access_token"]
    r = await client.post(
        f"{ZI_BASE_URL}{TOKEN_PATH}",
        auth=(ZI_CLIENT_ID, ZI_CLIENT_SECRET),
        data={"grant_type": "client_credentials", "scope": ZI_SCOPES},
        headers={"Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json"},
    )
    if r.status_code in (400, 401):
        raise PermissionError(
            "ZoomInfo rejected the client credentials. Check ZI_CLIENT_ID/ZI_CLIENT_SECRET, and "
            "confirm the requested scopes are a subset of what the application is configured for "
            f"(requested: {ZI_SCOPES}). Scopes are set on the application, not on the token request."
        )
    r.raise_for_status()
    payload = r.json()
    _token["access_token"] = payload["access_token"]
    _token["expires_at"] = time.time() + float(payload.get("expires_in", 1000)) * TOKEN_REFRESH_MARGIN
    return _token["access_token"]


# ----- HTTP -----


async def zi_request(method: str, path: str, *, json_body: dict[str, Any] | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=45.0) as client:
        token = await access_token(client)
        r = await client.request(
            method,
            f"{ZI_BASE_URL}{path}",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=json_body,
        )
        _raise_for_zi(r)
        return r.json() if r.content else {}


def _raise_for_zi(r: httpx.Response) -> None:
    if r.status_code == 403:
        raise PermissionError(
            "ZoomInfo returned 403. The token is missing a scope this call needs: company "
            "search and enrich need api:data:company, contact calls need api:data:contact. "
            "Scopes are configured on the application in the ZoomInfo admin portal."
        )
    if r.status_code == 429:
        bucket = r.headers.get("X-RateLimit-Rejected-Bucket", "unknown")
        retry_after = r.headers.get("Retry-After", "unknown")
        raise RuntimeError(
            f"ZoomInfo returned 429; rejected bucket: {bucket}, Retry-After: {retry_after}s. "
            "Requests are evaluated against per-second, per-hour and per-day windows at once. "
            "A per-second rejection deserves 1-5s of exponential backoff; an hour or day "
            "rejection needs the full Retry-After, which can exceed 700 seconds. Do not retry "
            "an hour or day rejection immediately."
        )
    r.raise_for_status()


# ----- Server + tool registry -----

server = Server("zoominfo-gtm")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="zi_credit_status",
            description=(
                "Report bulk data credit position: ZoomInfo's own subscription counters "
                "(GET /data/v1/users/usage) plus this server's local ledger — spent today, "
                "daily ceiling, remaining, and per-tool spend for the last 7 days. Free; "
                "charges no credits. CALL THIS FIRST before planning any enrichment batch, "
                "and treat 'remaining' as the number of new records you may enrich today."
            ),
            inputSchema={"type": "object", "properties": {}},
        ),
        Tool(
            name="zi_search_companies",
            description=(
                "Search companies by firmographic criteria (POST /data/v1/companies/search). "
                "Read-only and free — it charges no credits and returned companies do not "
                "count against record limits, though each request counts against rate limits. "
                "Use search to narrow a target set, then enrich only the survivors. Returns "
                "ZoomInfo company ids you pass to zi_enrich_companies."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "criteria": {
                        "type": "object",
                        "description": (
                            "Company search attributes, e.g. {'industryKeywords': 'logistics', "
                            "'revenueMin': 50000000, 'employeeCountMin': 200, 'state': 'CA'}."
                        ),
                    },
                    "page_size": {"type": "integer", "default": DEFAULT_SEARCH_PAGE, "maximum": MAX_SEARCH_PAGE},
                    "page_number": {"type": "integer", "default": 1, "minimum": 1},
                    "sort": {
                        "type": "string",
                        "description": "name, employeeCount, or revenue. Prefix '-' for descending.",
                        "default": "-revenue",
                    },
                },
                "required": ["criteria"],
            },
        ),
        Tool(
            name="zi_search_contacts",
            description=(
                "Search contacts by role, seniority, function, or company "
                "(POST /data/v1/contacts/search). Read-only and free. Returns ZoomInfo contact "
                "ids for zi_enrich_contacts. Search results carry identifying fields only — "
                "verified emails and direct dials come from enrichment, which costs credits."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "criteria": {
                        "type": "object",
                        "description": (
                            "Contact search attributes, e.g. {'companyId': 344589814, "
                            "'managementLevel': 'VP Level Executives', 'department': 'Sales'}."
                        ),
                    },
                    "page_size": {"type": "integer", "default": DEFAULT_SEARCH_PAGE, "maximum": MAX_SEARCH_PAGE},
                    "page_number": {"type": "integer", "default": 1, "minimum": 1},
                },
                "required": ["criteria"],
            },
        ),
        Tool(
            name="zi_enrich_companies",
            description=(
                "Enrich up to 25 companies by ZoomInfo company id "
                "(POST /data/v1/companies/enrich). COSTS CREDITS: one bulk data credit per "
                "record returned, unless the record is already under management. No-match "
                "results and errors are not charged. Served from the local 365-day cache when "
                "possible, which costs nothing. Refuses the call outright if the worst-case "
                "cost would breach the daily ceiling — check zi_credit_status first."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "company_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "maxItems": MAX_ENRICH_BATCH,
                        "description": "ZoomInfo company ids, at most 25 per call.",
                    },
                    "output_fields": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": (
                            "Fields to return, e.g. ['id','name','website','revenue','employeeCount']. "
                            "Narrow this — the field set does not change the credit cost but does "
                            "change how many tokens the answer burns."
                        ),
                    },
                },
                "required": ["company_ids"],
            },
        ),
        Tool(
            name="zi_enrich_contacts",
            description=(
                "Enrich up to 25 contacts by ZoomInfo contact id "
                "(POST /data/v1/contacts/enrich). COSTS CREDITS on the same terms as "
                "zi_enrich_companies: one bulk data credit per matched new record, nothing for "
                "no-match. This is the tool that returns verified business email and direct "
                "dial, so it is both the expensive one and the one carrying personal data. "
                "Cached for 365 days; budget-checked before the call."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "contact_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "maxItems": MAX_ENRICH_BATCH,
                        "description": "ZoomInfo contact ids, at most 25 per call.",
                    },
                    "output_fields": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Fields to return, e.g. ['id','firstName','lastName','jobTitle','email'].",
                    },
                },
                "required": ["contact_ids"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    if name == "zi_credit_status":
        return [TextContent(type="text", text=json.dumps(await _credit_status(), indent=2))]

    if name == "zi_search_companies":
        body = _search_body("CompanySearch", arguments)
        data = await zi_request("POST", "/data/v1/companies/search", json_body=body)
        return [TextContent(type="text", text=json.dumps(_slim_search(data, "companies"), indent=2))]

    if name == "zi_search_contacts":
        body = _search_body("ContactSearch", arguments)
        data = await zi_request("POST", "/data/v1/contacts/search", json_body=body)
        return [TextContent(type="text", text=json.dumps(_slim_search(data, "contacts"), indent=2))]

    if name == "zi_enrich_companies":
        return await _enrich(
            entity="companies",
            path="/data/v1/companies/enrich",
            payload_type="CompanyEnrich",
            match_key="matchCompanyInput",
            id_field="companyId",
            ids=arguments.get("company_ids") or [],
            output_fields=arguments.get("output_fields"),
            tool="zi_enrich_companies",
        )

    if name == "zi_enrich_contacts":
        return await _enrich(
            entity="contacts",
            path="/data/v1/contacts/enrich",
            payload_type="ContactEnrich",
            match_key="matchPersonInput",
            id_field="personId",
            ids=arguments.get("contact_ids") or [],
            output_fields=arguments.get("output_fields"),
            tool="zi_enrich_contacts",
        )

    raise ValueError(f"Unknown tool: {name}")


async def _credit_status() -> dict[str, Any]:
    gov = governor()
    st = gov.state()
    status: dict[str, Any] = {
        "local_ledger": {
            "run_id": RUN_ID,
            "daily_limit": st.daily_limit,
            "spent_today": st.spent_today,
            "held_by_calls_in_flight": st.reserved,
            "available_today": st.available,
        },
        "recent_spend_by_tool": gov.spend_by_tool(days=7),
    }
    # The subscription counters are authoritative for what ZoomInfo will actually allow;
    # the local ledger is authoritative for what this server will allow. They answer
    # different questions and a run can be blocked by either, so report both.
    try:
        usage = await zi_request("GET", "/data/v1/users/usage")
        status["zoominfo_subscription_usage"] = [
            {
                "limitType": u.get("limitType"),
                "description": u.get("description"),
                "totalLimit": u.get("totalLimit"),
                "currentUsage": u.get("currentUsage"),
                "usageRemaining": u.get("usageRemaining"),
            }
            for item in usage.get("data", [])
            for u in (item.get("attributes", {}) or {}).get("usage", [])
        ]
    except Exception as exc:  # noqa: BLE001 — status must degrade, not fail
        status["zoominfo_subscription_usage_error"] = (
            f"{type(exc).__name__}: {exc}. The local ceiling below is still enforced."
        )
    return status


async def _enrich(
    *,
    entity: str,
    path: str,
    payload_type: str,
    match_key: str,
    id_field: str,
    ids: list[str],
    output_fields: list[str] | None,
    tool: str,
) -> list[TextContent]:
    gov = governor()
    ids = [str(i) for i in ids if str(i).strip()]
    if not ids:
        raise ValueError(f"No ids supplied to {tool}.")
    if len(ids) > MAX_ENRICH_BATCH:
        raise ValueError(
            f"{len(ids)} ids supplied; ZoomInfo enriches at most {MAX_ENRICH_BATCH} records per "
            "request. Split the batch — and note that splitting does not reduce the credit cost, "
            "only the request size."
        )

    cached = gov.cache_get(entity, ids)
    to_fetch = [i for i in ids if i not in cached]

    if not to_fetch:
        gov.settle(tool=tool, reserved=0, requested=len(ids), charged=0, cache_hits=len(cached), no_match=0)
        return [
            TextContent(
                type="text",
                text=json.dumps(
                    {
                        "entity": entity,
                        "records": list(cached.values()),
                        "credits_charged": 0,
                        "cache_hits": len(cached),
                        "note": "Every record was served from the local cache inside the 365-day "
                        "Records Under Management window. No request was sent and no credit spent.",
                    },
                    indent=2,
                ),
            )
        ]

    try:
        reserved = gov.reserve(len(to_fetch))
    except BudgetExceeded as exc:
        # Returned as a result, not raised. A refusal the model can read lets it re-plan
        # against the remaining allowance — enrich the top 40, defer the rest — where a
        # protocol error usually just ends the turn.
        st = gov.state()
        return [
            TextContent(
                type="text",
                text=json.dumps(
                    {
                        "refused": True,
                        "reason": str(exc),
                        "requested_new_records": len(to_fetch),
                        "cache_hits_available_free": len(cached),
                        "available_today": st.available,
                        "next_step": "Re-call with at most available_today ids, or stop and tell "
                        "the human the ceiling was reached.",
                    },
                    indent=2,
                ),
            )
        ]
    body = {
        "data": {
            "type": payload_type,
            "attributes": {
                match_key: [{id_field: _coerce_id(i)} for i in to_fetch],
                **({"outputFields": output_fields} if output_fields else {}),
            },
        }
    }

    try:
        data = await zi_request("POST", path, json_body=body)
    except Exception:
        gov.release(reserved)
        raise

    fetched: dict[str, Any] = {}
    no_match = 0
    for rec in data.get("data", []):
        if rec.get("type") == "NoMatch" or (rec.get("meta", {}) or {}).get("matchStatus") == "NO_MATCH":
            no_match += 1
            continue
        rid = str(rec.get("id"))
        fetched[rid] = {"id": rid, **(rec.get("attributes", {}) or {})}

    gov.cache_put(entity, fetched)
    charged = len(fetched)
    gov.settle(
        tool=tool,
        reserved=reserved,
        requested=len(ids),
        charged=charged,
        cache_hits=len(cached),
        no_match=no_match,
    )

    st = gov.state()
    return [
        TextContent(
            type="text",
            text=json.dumps(
                {
                    "entity": entity,
                    "records": list(cached.values()) + list(fetched.values()),
                    "credits_charged": charged,
                    "cache_hits": len(cached),
                    "no_match": no_match,
                    "budget_after": {"spent_today": st.spent_today, "available_today": st.available},
                    "note": "credits_charged counts records ZoomInfo returned as a match. Records "
                    "already under management are returned without a new charge, so the true "
                    "invoice may be lower than this figure; it is never higher.",
                },
                indent=2,
            ),
        )
    ]


# ----- Request/response shaping -----


def _search_body(payload_type: str, arguments: dict[str, Any]) -> dict[str, Any]:
    page_size = max(1, min(int(arguments.get("page_size", DEFAULT_SEARCH_PAGE)), MAX_SEARCH_PAGE))
    attributes = dict(arguments.get("criteria") or {})
    if sort := arguments.get("sort"):
        attributes["sort"] = sort
    return {
        "data": {"type": payload_type, "attributes": attributes},
        "page": {"number": max(1, int(arguments.get("page_number", 1))), "size": page_size},
    }


def _slim_search(data: dict[str, Any], entity: str) -> dict[str, Any]:
    """Return ids and a thin label per hit, not the full record.

    Search is free and enrichment is not, so the only job of a search result here is to let
    the agent decide which ids are worth paying for. Returning the whole payload would
    invite the model to treat unverified search fields as enriched data.
    """
    rows = []
    for rec in data.get("data", []):
        attrs = rec.get("attributes", {}) or {}
        rows.append(
            {
                "id": rec.get("id"),
                "name": attrs.get("name") or " ".join(
                    x for x in (attrs.get("firstName"), attrs.get("lastName")) if x
                ),
                "jobTitle": attrs.get("jobTitle"),
                "company": attrs.get("companyName"),
                "website": attrs.get("website"),
            }
        )
        rows[-1] = {k: v for k, v in rows[-1].items() if v}
    meta = data.get("meta", {}) or {}
    return {
        "entity": entity,
        "returned": len(rows),
        "total_results": meta.get("totalResults"),
        "results": rows,
        "credits_charged": 0,
        "next_step": f"Pass the ids you actually want to zi_enrich_{entity}, at most 25 per call.",
    }


def _coerce_id(value: str) -> Any:
    # ZoomInfo ids are numeric in the documented request examples but arrive as strings
    # through MCP's JSON schema. Send an int when it is one; leave anything else alone.
    try:
        return int(value)
    except (TypeError, ValueError):
        return value


# ----- Entrypoint -----


async def main() -> None:
    require_config()
    governor()
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
