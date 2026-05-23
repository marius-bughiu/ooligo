"""
vitally-cs-mcp — MCP server for Customer Success workflows on Vitally.

Exposes three read-only tools:
  - get_account_health(account_id)         — single account + health score breakdown
  - list_at_risk_accounts(threshold, limit) — paginated list filtered by health score
  - get_account_conversations(account_id, limit) — recent conversations for an account

All tools are read-only; no write operations are included. Authentication uses
Vitally's HTTP Basic Auth with the API key as the username (empty password).

STATUS: scaffold — not runtime-tested. Adapt the subdomain, field names, and any
custom trait keys to your org before use.

Run as: python -m vitally_cs_mcp.server
"""

from __future__ import annotations

import base64
import os
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

VITALLY_API_KEY = os.environ.get("VITALLY_API_KEY", "")
VITALLY_SUBDOMAIN = os.environ.get("VITALLY_SUBDOMAIN", "")

# VITALLY_BASE_URL can be set explicitly (useful for EU: https://rest.vitally-eu.io)
# or auto-built from VITALLY_SUBDOMAIN.
_base_url_env = os.environ.get("VITALLY_BASE_URL", "").rstrip("/")
VITALLY_BASE_URL: str = _base_url_env or (
    f"https://{VITALLY_SUBDOMAIN}.rest.vitally.io" if VITALLY_SUBDOMAIN else ""
)

# Default health score threshold for list_at_risk_accounts.
# Vitally scores run 0–100; typical red band is 0–33, orange 34–66, green 67–100.
VITALLY_HEALTH_THRESHOLD: int = int(os.environ.get("VITALLY_HEALTH_THRESHOLD", "50"))

# Vitally caps list responses at 100 records per page.
VITALLY_PAGE_LIMIT: int = min(int(os.environ.get("VITALLY_PAGE_LIMIT", "100")), 100)


def require_config() -> None:
    if not VITALLY_API_KEY:
        raise RuntimeError("VITALLY_API_KEY env var is required")
    if not VITALLY_BASE_URL:
        raise RuntimeError(
            "Either VITALLY_SUBDOMAIN or VITALLY_BASE_URL env var is required"
        )


def auth_headers() -> dict[str, str]:
    """
    Vitally uses HTTP Basic Auth with the API key as the username and an empty password.
    The Authorization header value is: Basic base64("<apikey>:")
    """
    token = base64.b64encode(f"{VITALLY_API_KEY}:".encode()).decode("ascii")
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
    }


# ----- Vitally REST helpers -----


async def vitally_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """
    Make an authenticated GET request to the Vitally REST API.
    Path should start with /resources/...
    """
    url = f"{VITALLY_BASE_URL}{path}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(url, headers=auth_headers(), params=params)
        r.raise_for_status()
        return r.json()


# ----- Server + tool registry -----

server = Server("vitally-cs")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_account_health",
            description=(
                "Fetch a Vitally account by ID and its full health score breakdown. "
                "Returns the account record and the healthScores array, which includes "
                "each health component name, score, and status."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "account_id": {
                        "type": "string",
                        "description": (
                            "Vitally account ID or externalId. "
                            "Use the Vitally-assigned UUID or the externalId your system sent."
                        ),
                    }
                },
                "required": ["account_id"],
            },
        ),
        Tool(
            name="list_at_risk_accounts",
            description=(
                "List accounts whose overall health score is at or below a threshold. "
                "Fetches one page of accounts (up to the limit), filters by health score, "
                "and returns matches sorted by health score ascending (worst first). "
                "For orgs with >100 accounts, only the first page is scanned — "
                "see the TODO in the README for full pagination."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "health_threshold": {
                        "type": "integer",
                        "description": (
                            "Accounts with a health score at or below this value are returned. "
                            "Vitally scores run 0–100. Defaults to the VITALLY_HEALTH_THRESHOLD "
                            "env var (default 50)."
                        ),
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max accounts to return in the response (after filtering). Default 20.",
                        "default": 20,
                    },
                },
            },
        ),
        Tool(
            name="get_account_conversations",
            description=(
                "Fetch recent conversations linked to a Vitally account. "
                "Returns conversations in newest-first order with subject, message count, "
                "and traits. Useful for reviewing recent CSM activity before a call."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "account_id": {
                        "type": "string",
                        "description": "Vitally account ID or externalId.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max conversations to return. Default 10, max 100.",
                        "default": 10,
                    },
                },
                "required": ["account_id"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    # ------------------------------------------------------------------
    # get_account_health
    # Fetches /resources/accounts/:id and /resources/accounts/:id/healthScores
    # in two requests, then merges the results.
    # ------------------------------------------------------------------
    if name == "get_account_health":
        account_id = arguments["account_id"]

        # Fetch the base account record.
        account = await vitally_get(f"/resources/accounts/{account_id}")

        # Fetch the health score breakdown.
        # Response: { "results": [ { "name": "...", "score": 72, "healthStatus": "healthy", ... }, ... ] }
        health_data = await vitally_get(f"/resources/accounts/{account_id}/healthScores")
        health_scores = health_data.get("results", [])

        result = {
            "account": {
                "id": account.get("id"),
                "externalId": account.get("externalId"),
                "name": account.get("name"),
                "healthScore": account.get("healthScore"),
                "traits": account.get("traits", {}),
            },
            "healthScores": health_scores,
        }
        return [TextContent(type="text", text=str(result))]

    # ------------------------------------------------------------------
    # list_at_risk_accounts
    # Fetches one page of accounts, filters to those at or below threshold.
    # Returns sorted by healthScore ascending (worst first).
    # ------------------------------------------------------------------
    if name == "list_at_risk_accounts":
        threshold = arguments.get("health_threshold", VITALLY_HEALTH_THRESHOLD)
        return_limit = min(int(arguments.get("limit", 20)), 100)

        # Fetch one full page of active accounts.
        # Vitally's list-accounts endpoint: GET /resources/accounts?limit=100&status=active
        page = await vitally_get(
            "/resources/accounts",
            params={"limit": VITALLY_PAGE_LIMIT, "status": "active"},
        )
        accounts = page.get("results", [])

        # Filter: include only accounts where healthScore is defined and <= threshold.
        # healthScore may be None if Vitally hasn't computed it yet (new accounts, missing data).
        at_risk = [
            {
                "id": a.get("id"),
                "externalId": a.get("externalId"),
                "name": a.get("name"),
                "healthScore": a.get("healthScore"),
                "traits": a.get("traits", {}),
            }
            for a in accounts
            if a.get("healthScore") is not None and a["healthScore"] <= threshold
        ]

        # Sort by healthScore ascending so the worst accounts surface first.
        at_risk.sort(key=lambda a: a["healthScore"])

        # Trim to the requested return limit.
        at_risk = at_risk[:return_limit]

        result = {
            "threshold": threshold,
            "total_scanned": len(accounts),
            "at_risk_count": len(at_risk),
            "note": (
                "Only the first page of accounts was scanned. "
                "See README TODO #2 to add full cursor pagination."
            )
            if page.get("next")
            else "All active accounts were scanned.",
            "accounts": at_risk,
        }
        return [TextContent(type="text", text=str(result))]

    # ------------------------------------------------------------------
    # get_account_conversations
    # Fetches /resources/accounts/:id/conversations?limit=N
    # Conversations are returned by Vitally in newest-first order by default.
    # ------------------------------------------------------------------
    if name == "get_account_conversations":
        account_id = arguments["account_id"]
        limit = min(int(arguments.get("limit", 10)), 100)

        data = await vitally_get(
            f"/resources/accounts/{account_id}/conversations",
            params={"limit": limit},
        )
        conversations = data.get("results", [])

        # Trim each conversation to the fields most useful in a Claude context window.
        trimmed = [
            {
                "id": c.get("id"),
                "externalId": c.get("externalId"),
                "subject": c.get("subject"),
                "messageCount": len(c.get("messages", [])),
                "firstMessage": (c.get("messages") or [{}])[0].get("body", ""),
                "traits": c.get("traits", {}),
                "createdAt": c.get("createdAt"),
                "updatedAt": c.get("updatedAt"),
            }
            for c in conversations
        ]

        result = {
            "account_id": account_id,
            "conversation_count": len(trimmed),
            "conversations": trimmed,
        }
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
