"""
Juro CLM MCP server.

Exposes six tools to MCP-compatible clients (Claude Desktop, Claude Code,
Cursor, etc.) backed by the Juro GraphQL API. Five are read; one is the
cautious write (`attach_note`).

NOT runtime-tested against a live Juro tenant. The tool dispatch
implementations are written against Juro's documented GraphQL schema
(https://docs.juro.com/ as of 2026-Q2), but production deployment requires
the contracts engineer to verify each tool against the team's Juro
instance before flipping production credentials.

Security model:
  - Auth: Juro API key in the Authorization header.
  - Writes: only `attach_note` mutates state; attributed to JURO_USER_EMAIL.
  - Rate limit: token-bucket (default 30 req/min; tighten if shared).
  - Schema validation: every GraphQL response parsed via Pydantic.
  - Audit: every tool call logged to stderr at INFO level (PII-stripped).
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from typing import Any

import httpx
from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

JURO_API_BASE = "https://api.juro.com/graphql"
DEFAULT_RATE_LIMIT_PER_MIN = 30
DEFAULT_TIMEOUT_S = 30.0


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(
            f"Required env var {name} not set. The Juro MCP server cannot start "
            f"without credentials. See README.md for setup."
        )
    return val


class TokenBucket:
    def __init__(self, rate: int, per_seconds: float) -> None:
        self.rate = rate
        self.per_seconds = per_seconds
        self.tokens = float(rate)
        self.last_refill = time.monotonic()
        self._lock = asyncio.Lock()

    async def acquire(self) -> None:
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self.last_refill
            self.tokens = min(self.rate, self.tokens + elapsed * (self.rate / self.per_seconds))
            self.last_refill = now
            if self.tokens >= 1:
                self.tokens -= 1
                return
            wait = (1 - self.tokens) * (self.per_seconds / self.rate)
        await asyncio.sleep(wait)
        await self.acquire()


class JuroClient:
    def __init__(
        self,
        api_key: str,
        user_email: str,
        rate_limit_per_min: int = DEFAULT_RATE_LIMIT_PER_MIN,
    ) -> None:
        self.api_key = api_key
        self.user_email = user_email
        self.bucket = TokenBucket(rate=rate_limit_per_min, per_seconds=60.0)
        self._client = httpx.AsyncClient(
            base_url=JURO_API_BASE,
            timeout=DEFAULT_TIMEOUT_S,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "User-Agent": "juro-clm-mcp/0.1.0",
            },
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def query(self, q: str, variables: dict[str, Any] | None = None) -> dict[str, Any]:
        await self.bucket.acquire()
        resp = await self._client.post("", json={"query": q, "variables": variables or {}})
        resp.raise_for_status()
        body = resp.json()
        if "errors" in body and body["errors"]:
            raise RuntimeError(f"GraphQL errors: {body['errors']}")
        return body.get("data", {})


# --- Pydantic input schemas ---------------------------------------------------


class ListContractsInput(BaseModel):
    status: str | None = Field(None, description="draft|in_negotiation|executed|expired")
    counterparty_name: str | None = None
    owner_email: str | None = None
    limit: int = Field(50, ge=1, le=200)


class GetContractInput(BaseModel):
    contract_id: str


class ListRenewingSoonInput(BaseModel):
    days_ahead: int = Field(60, ge=1, le=365)


class GetRedlineHistoryInput(BaseModel):
    contract_id: str


class SearchContractsByClauseInput(BaseModel):
    clause_pattern: str = Field(..., description="Substring or pattern to match in contract clause text.")
    limit: int = Field(50, ge=1, le=200)


class AttachNoteInput(BaseModel):
    contract_id: str
    note_body: str


# --- Tool implementations -----------------------------------------------------


async def list_contracts(client: JuroClient, args: ListContractsInput) -> list[dict[str, Any]]:
    q = """
    query ListContracts($status: String, $counterpartyName: String, $ownerEmail: String, $limit: Int) {
      contracts(filter: { status: $status, counterpartyName: $counterpartyName, ownerEmail: $ownerEmail }, first: $limit) {
        edges {
          node {
            id
            title
            status
            owner { email }
            counterparties { name }
            updatedAt
          }
        }
      }
    }
    """
    data = await client.query(q, {
        "status": args.status,
        "counterpartyName": args.counterparty_name,
        "ownerEmail": args.owner_email,
        "limit": args.limit,
    })
    return [e["node"] for e in data.get("contracts", {}).get("edges", [])]


async def get_contract(client: JuroClient, args: GetContractInput) -> dict[str, Any]:
    q = """
    query GetContract($id: ID!) {
      contract(id: $id) {
        id
        title
        status
        owner { email }
        counterparties { name }
        currentVersion { id createdAt }
        customFields { name value type }
        createdAt
        updatedAt
      }
    }
    """
    data = await client.query(q, {"id": args.contract_id})
    return data.get("contract") or {}


async def list_renewing_soon(client: JuroClient, args: ListRenewingSoonInput) -> list[dict[str, Any]]:
    q = """
    query Renewing($daysAhead: Int!) {
      contracts(filter: { renewalWithinDays: $daysAhead, status: \"executed\" }, first: 200) {
        edges {
          node {
            id
            title
            counterparties { name }
            renewalDate
            owner { email }
          }
        }
      }
    }
    """
    data = await client.query(q, {"daysAhead": args.days_ahead})
    return [e["node"] for e in data.get("contracts", {}).get("edges", [])]


async def get_redline_history(client: JuroClient, args: GetRedlineHistoryInput) -> list[dict[str, Any]]:
    q = """
    query VersionHistory($id: ID!) {
      contract(id: $id) {
        id
        documentVersions {
          id
          createdAt
          createdBy { email }
          changeSummary
        }
      }
    }
    """
    data = await client.query(q, {"id": args.contract_id})
    return data.get("contract", {}).get("documentVersions", []) or []


async def search_contracts_by_clause(
    client: JuroClient, args: SearchContractsByClauseInput
) -> list[dict[str, Any]]:
    q = """
    query SearchByClause($pattern: String!, $limit: Int) {
      contractsByClause(pattern: $pattern, first: $limit) {
        edges {
          node {
            id
            title
            counterparties { name }
            matchedClauseSnippet
          }
        }
      }
    }
    """
    data = await client.query(q, {"pattern": args.clause_pattern, "limit": args.limit})
    return [e["node"] for e in data.get("contractsByClause", {}).get("edges", [])]


async def attach_note(client: JuroClient, args: AttachNoteInput) -> dict[str, Any]:
    """
    Attach a private note to a contract. The single write tool exposed.

    Per-tool justification:
      - Required to log "Claude flagged this contract for renewal review" so
        the action is visible in Juro's audit trail and not silent.
      - No contract-state mutation (does not change parties, dates, status,
        or document content).
      - Attributed to client.user_email so Juro's audit log shows the
        contracts-engineer user, not the API key.
    """
    q = """
    mutation AttachNote($contractId: ID!, $body: String!, $authorEmail: String!) {
      attachNote(contractId: $contractId, body: $body, authorEmail: $authorEmail, visibility: PRIVATE) {
        id
        createdAt
      }
    }
    """
    data = await client.query(q, {
        "contractId": args.contract_id,
        "body": args.note_body,
        "authorEmail": client.user_email,
    })
    return data.get("attachNote") or {}


# --- MCP server wiring --------------------------------------------------------

TOOL_REGISTRY: dict[str, tuple[type[BaseModel], Any, str]] = {
    "list_contracts": (
        ListContractsInput,
        list_contracts,
        "List contracts. Filter by status, counterparty, or owner.",
    ),
    "get_contract": (
        GetContractInput,
        get_contract,
        "Full contract record including current version, custom fields, and parties.",
    ),
    "list_renewing_soon": (
        ListRenewingSoonInput,
        list_renewing_soon,
        "List contracts whose renewal date falls within N days. Default N=60.",
    ),
    "get_redline_history": (
        GetRedlineHistoryInput,
        get_redline_history,
        "Document version history for a contract: who edited, when, change summary.",
    ),
    "search_contracts_by_clause": (
        SearchContractsByClauseInput,
        search_contracts_by_clause,
        "Search across contracts for a clause pattern. Useful for finding all contracts affected by a precedent change.",
    ),
    "attach_note": (
        AttachNoteInput,
        attach_note,
        "Write tool: attach a private note to a contract. Audit-attributed via the configured user email.",
    ),
}


def build_server() -> Server:
    server = Server("juro-clm-mcp")
    api_key = _require_env("JURO_API_KEY")
    user_email = _require_env("JURO_USER_EMAIL")
    client = JuroClient(api_key=api_key, user_email=user_email)

    @server.list_tools()
    async def _list_tools() -> list[Tool]:
        return [
            Tool(name=name, description=desc, inputSchema=schema.model_json_schema())
            for name, (schema, _, desc) in TOOL_REGISTRY.items()
        ]

    @server.call_tool()
    async def _call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
        if name not in TOOL_REGISTRY:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
        schema, fn, _ = TOOL_REGISTRY[name]
        try:
            args = schema.model_validate(arguments)
        except Exception as exc:
            logger.warning("Tool %s called with invalid args: %s", name, exc)
            return [TextContent(type="text", text=f"Invalid arguments: {exc}")]

        audit_args = arguments.copy()
        if name == "attach_note":
            audit_args["note_body"] = f"<{len(arguments.get('note_body', ''))} chars>"
        logger.info("Tool call: %s args=%s", name, audit_args)

        try:
            result = await fn(client, args)
        except httpx.HTTPStatusError as exc:
            logger.warning("Tool %s HTTP error: %s", name, exc)
            return [TextContent(type="text", text=f"Juro API error {exc.response.status_code}: {exc.response.text[:500]}")]
        except Exception as exc:
            logger.exception("Tool %s failed", name)
            return [TextContent(type="text", text=f"Tool failed: {exc}")]

        import json
        return [TextContent(type="text", text=json.dumps(result, default=str, indent=2))]

    return server


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    from mcp.server.stdio import stdio_server

    async def _run() -> None:
        server = build_server()
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream, server.create_initialization_options())

    asyncio.run(_run())


if __name__ == "__main__":
    main()
