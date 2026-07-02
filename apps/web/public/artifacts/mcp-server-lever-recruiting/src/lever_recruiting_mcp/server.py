"""
Lever recruiting MCP server.

Exposes seven tools to MCP-compatible clients (Claude Desktop, Claude Code,
Cursor, etc.) backed by the Lever Data API v1. Six are read; one is the
cautious write (`note_stage_stuck`).

NOT runtime-tested against a live Lever tenant. The tool dispatch
implementations are written against Lever's documented Data API shape
(https://hire.lever.co/developer/documentation as of 2026-Q2), but the
production deployment requires the recruiting engineer to verify each tool
against a Lever Sandbox tenant before flipping the production credentials.

Lever data model note (differs from Greenhouse):
  - The candidate-in-pipeline object is an *Opportunity*, not an application.
    An Opportunity ties a *Contact* (the person) to one or more *Postings*
    (the jobs) and carries a single current `stage`.
  - Timestamps are integer milliseconds since the Unix epoch, NOT ISO-8601
    strings. `lastInteractionAt` (any activity) and `lastAdvancedAt` (last
    stage advance) are the two staleness signals this server uses.
  - Lever exposes the *current* stage and `lastAdvancedAt`, but has no
    public stage-transition-history endpoint. `get_opportunity_detail`
    returns current state + notes, not a full transition log — see the
    docstring there.

Security model:
  - Auth: Lever API key via Basic auth, key as username, empty password —
    Lever's documented pattern.
  - Writes: only `note_stage_stuck` mutates state; uses the `perform_as`
    query parameter (a Lever user ID) for audit attribution.
  - Rate limit: token-bucket (default 8 req/s; Lever steady-state ceiling is
    10 req/s per API key, burst to 20). Application POSTs are separately
    capped by Lever at 2 req/s — the note tool is single-call so it stays
    well under that.
  - Pagination: cursor-based via the `next` offset token in the JSON body;
    the implementations loop while `hasNext` is true.
  - Audit: every tool call logged to stderr at INFO level with tool name,
    parameters (PII-stripped), and response status. Recruiting engineer
    is responsible for capturing these into a durable audit log.
"""

from __future__ import annotations

import asyncio
import logging
import os
import time
from collections.abc import AsyncIterator
from typing import Any

import httpx
from mcp.server import Server
from mcp.types import Tool, TextContent
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


# --- Configuration ------------------------------------------------------------

LEVER_API_BASE = "https://api.lever.co/v1"
DEFAULT_RATE_LIMIT_PER_S = 8  # Lever steady-state ceiling: 10 req/s (burst 20).
DEFAULT_TIMEOUT_S = 30.0
DEFAULT_PER_PAGE = 100


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(
            f"Required env var {name} not set. The Lever MCP server cannot start "
            f"without credentials. See README.md for setup."
        )
    return val


def _ms_to_epoch_s(ms: int | None) -> float | None:
    """Lever timestamps are integer ms since epoch. Convert to float seconds."""
    if ms is None:
        return None
    return ms / 1000.0


# --- Rate limiter -------------------------------------------------------------


class TokenBucket:
    """Simple token-bucket rate limiter, async-safe."""

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


# --- Lever client -------------------------------------------------------------


class LeverClient:
    """Thin async wrapper around the Lever Data API v1."""

    def __init__(
        self,
        api_key: str,
        perform_as_user_id: str,
        rate_limit_per_s: int = DEFAULT_RATE_LIMIT_PER_S,
    ) -> None:
        self.api_key = api_key
        self.perform_as_user_id = perform_as_user_id
        self.bucket = TokenBucket(rate=rate_limit_per_s, per_seconds=1.0)
        self._client = httpx.AsyncClient(
            base_url=LEVER_API_BASE,
            auth=(api_key, ""),
            timeout=DEFAULT_TIMEOUT_S,
            headers={"User-Agent": "lever-recruiting-mcp/0.1.0"},
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
    ) -> httpx.Response:
        await self.bucket.acquire()
        resp = await self._client.request(method, path, params=params, json=json)
        if resp.status_code == 429:
            # Lever returns 429 on rate-limit breach; Retry-After is not
            # reliably documented. Back off conservatively and retry once.
            await asyncio.sleep(1.0)
            await self.bucket.acquire()
            resp = await self._client.request(method, path, params=params, json=json)
        resp.raise_for_status()
        return resp

    async def paginate(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        *,
        max_pages: int = 50,
    ) -> AsyncIterator[dict[str, Any]]:
        """
        Yield each item from a paginated Lever list endpoint.

        Lever list responses have shape {"data": [...], "next": "<token>",
        "hasNext": bool}. The `next` token is passed back as the `offset`
        query parameter on the following request.
        """
        params = dict(params or {})
        params.setdefault("limit", DEFAULT_PER_PAGE)
        offset: str | None = None
        page = 0
        while page < max_pages:
            call_params = dict(params)
            if offset:
                call_params["offset"] = offset
            resp = await self._request("GET", path, params=call_params)
            body = resp.json()
            for item in body.get("data", []):
                yield item
            if not body.get("hasNext"):
                return
            offset = body.get("next")
            if not offset:
                return
            page += 1

    async def get_one(self, path: str) -> dict[str, Any]:
        """Fetch a single resource. Lever wraps it as {"data": {...}}."""
        resp = await self._request("GET", path)
        return resp.json().get("data", {})

    async def stage_id_to_text(self) -> dict[str, str]:
        """Build a {stage_id: stage_text} map from /stages."""
        out: dict[str, str] = {}
        async for stage in self.paginate("/stages"):
            out[stage.get("id", "")] = stage.get("text", "")
        return out


# --- Pydantic schemas ---------------------------------------------------------


class ListOpportunitiesInStageInput(BaseModel):
    posting_id: str = Field(..., description="Lever posting ID")
    stage_id: str = Field(..., description="Lever stage ID (from list_stages)")
    stale_after_days: int | None = Field(
        None,
        description="Optional filter: opportunities whose last interaction was more than N days ago",
    )


class GetOpportunityDetailInput(BaseModel):
    opportunity_id: str = Field(..., description="Lever opportunity ID")


class ListPostingsOpenInput(BaseModel):
    team: str | None = Field(None, description="Optional team/department name filter")


class GetFunnelForPostingInput(BaseModel):
    posting_id: str = Field(..., description="Lever posting ID")


class ListPostingsStalledInput(BaseModel):
    stale_after_days: int = Field(
        7, description="A posting is stalled if no opportunity advanced in this many days"
    )


class SearchOpportunitiesByTagInput(BaseModel):
    tag: str = Field(..., description="Lever opportunity tag to match exactly")


class ListStagesInput(BaseModel):
    pass


class NoteStageStuckInput(BaseModel):
    opportunity_id: str = Field(..., description="Lever opportunity ID")
    note_body: str = Field(..., description="The note text. Visible internally in Lever.")


# --- Tool implementations -----------------------------------------------------


async def list_opportunities_in_stage(
    client: LeverClient, args: ListOpportunitiesInStageInput
) -> list[dict[str, Any]]:
    """Return opportunities currently in a stage on a given posting."""
    out: list[dict[str, Any]] = []
    cutoff_s = (
        time.time() - args.stale_after_days * 86400 if args.stale_after_days else None
    )
    async for opp in client.paginate(
        "/opportunities",
        params={"posting_id": args.posting_id, "stage_id": args.stage_id},
    ):
        last_interaction_s = _ms_to_epoch_s(opp.get("lastInteractionAt"))
        if cutoff_s is not None and last_interaction_s is not None:
            if last_interaction_s > cutoff_s:
                continue
        out.append(
            {
                "opportunity_id": opp.get("id"),
                "name": opp.get("name"),
                "stage_id": opp.get("stage"),
                "last_interaction_at_ms": opp.get("lastInteractionAt"),
                "last_advanced_at_ms": opp.get("lastAdvancedAt"),
                "archived": opp.get("archived"),
            }
        )
    return out


async def get_opportunity_detail(
    client: LeverClient, args: GetOpportunityDetailInput
) -> dict[str, Any]:
    """
    Return an opportunity's current state plus its notes.

    Lever exposes the *current* stage and `lastAdvancedAt`, but has NO public
    stage-transition-history endpoint. This tool returns what Lever exposes:
    current stage, staleness timestamps, tags, sources, and the notes feed.
    It does not reconstruct a full stage-by-stage transition log — Lever's
    Data API does not offer one. Do not present the output as a complete
    audit trail of every stage move.
    """
    opp = await client.get_one(f"/opportunities/{args.opportunity_id}")
    notes: list[dict[str, Any]] = []
    async for note in client.paginate(f"/opportunities/{args.opportunity_id}/notes"):
        notes.append(
            {
                "at_ms": note.get("createdAt"),
                "by_user_id": note.get("user"),
                "value": note.get("value"),
            }
        )
    return {
        "opportunity_id": opp.get("id"),
        "name": opp.get("name"),
        "current_stage_id": opp.get("stage"),
        "last_interaction_at_ms": opp.get("lastInteractionAt"),
        "last_advanced_at_ms": opp.get("lastAdvancedAt"),
        "tags": opp.get("tags"),
        "sources": opp.get("sources"),
        "posting_ids": opp.get("postings"),
        "archived": opp.get("archived"),
        "notes": notes,
    }


async def list_postings_open(
    client: LeverClient, args: ListPostingsOpenInput
) -> list[dict[str, Any]]:
    """List published (open) postings."""
    out: list[dict[str, Any]] = []
    async for posting in client.paginate("/postings", params={"state": "published"}):
        categories = posting.get("categories") or {}
        team = categories.get("team")
        if args.team and team != args.team:
            continue
        out.append(
            {
                "posting_id": posting.get("id"),
                "title": posting.get("text"),
                "state": posting.get("state"),
                "team": team,
                "department": categories.get("department"),
                "location": categories.get("location"),
                "created_at_ms": posting.get("createdAt"),
                "hiring_manager_id": posting.get("hiringManager"),
                "owner_id": posting.get("owner"),
            }
        )
    return out


async def list_stages(client: LeverClient, args: ListStagesInput) -> list[dict[str, Any]]:
    """List all pipeline stages with their IDs and display text."""
    out: list[dict[str, Any]] = []
    async for stage in client.paginate("/stages"):
        out.append({"stage_id": stage.get("id"), "text": stage.get("text")})
    return out


async def get_funnel_for_posting(
    client: LeverClient, args: GetFunnelForPostingInput
) -> dict[str, int]:
    """Return opportunity count per stage (human-readable stage names) for a posting."""
    stage_map = await client.stage_id_to_text()
    counts: dict[str, int] = {}
    async for opp in client.paginate(
        "/opportunities", params={"posting_id": args.posting_id}
    ):
        stage_id = opp.get("stage") or "unknown"
        stage_name = stage_map.get(stage_id, stage_id)
        counts[stage_name] = counts.get(stage_name, 0) + 1
    return counts


async def list_postings_stalled(
    client: LeverClient, args: ListPostingsStalledInput
) -> list[dict[str, Any]]:
    """List postings where no opportunity has advanced a stage in N days."""
    cutoff_s = time.time() - args.stale_after_days * 86400
    stalled: list[dict[str, Any]] = []
    async for posting in client.paginate("/postings", params={"state": "published"}):
        latest_advance_s = 0.0
        async for opp in client.paginate(
            "/opportunities", params={"posting_id": posting["id"]}
        ):
            advanced_s = _ms_to_epoch_s(opp.get("lastAdvancedAt"))
            if advanced_s and advanced_s > latest_advance_s:
                latest_advance_s = advanced_s
        if latest_advance_s > 0 and latest_advance_s < cutoff_s:
            stalled.append(
                {
                    "posting_id": posting.get("id"),
                    "title": posting.get("text"),
                    "days_since_advance": int((time.time() - latest_advance_s) / 86400),
                }
            )
    return stalled


async def search_opportunities_by_tag(
    client: LeverClient, args: SearchOpportunitiesByTagInput
) -> list[dict[str, Any]]:
    """Search opportunities by an exact tag match (Lever `tag` filter)."""
    out: list[dict[str, Any]] = []
    async for opp in client.paginate("/opportunities", params={"tag": args.tag}):
        out.append(
            {
                "opportunity_id": opp.get("id"),
                "name": opp.get("name"),
                "stage_id": opp.get("stage"),
                "tags": opp.get("tags"),
            }
        )
    return out


async def note_stage_stuck(
    client: LeverClient, args: NoteStageStuckInput
) -> dict[str, Any]:
    """
    Add an internal note to an opportunity. The single write tool exposed.

    Per-tool justification:
      - Required to log "Claude flagged this opportunity as stage-stuck" so
        the action is visible in the Lever activity feed and not silent.
      - No opportunity-state mutation (does not move stages, does not send
        candidate emails, does not archive, does not change the owner).
      - Attributed via the `perform_as` query parameter (a Lever user ID) so
        the Lever activity feed shows the recruiting-engineer user, not just
        the API key. Lever caps application POSTs at 2 req/s; this is one
        call so it stays well under.
    """
    body = {"value": args.note_body}
    resp = await client._request(
        "POST",
        f"/opportunities/{args.opportunity_id}/notes",
        params={"perform_as": client.perform_as_user_id},
        json=body,
    )
    return {"status": "ok", "note": resp.json().get("data", {})}


# --- MCP server wiring --------------------------------------------------------

TOOL_REGISTRY: dict[str, tuple[type[BaseModel], Any, str]] = {
    "list_opportunities_in_stage": (
        ListOpportunitiesInStageInput,
        list_opportunities_in_stage,
        "List opportunities currently in a named stage on a given posting. Optionally filter by staleness.",
    ),
    "get_opportunity_detail": (
        GetOpportunityDetailInput,
        get_opportunity_detail,
        "Return an opportunity's current stage, staleness timestamps, tags, and notes feed. Not a full stage-transition log.",
    ),
    "list_postings_open": (
        ListPostingsOpenInput,
        list_postings_open,
        "List published (open) postings. Optional team filter.",
    ),
    "list_stages": (
        ListStagesInput,
        list_stages,
        "List all pipeline stages with their IDs and display text. Needed to resolve stage_id inputs.",
    ),
    "get_funnel_for_posting": (
        GetFunnelForPostingInput,
        get_funnel_for_posting,
        "Return opportunity counts per stage (human-readable names) for a single posting.",
    ),
    "list_postings_stalled": (
        ListPostingsStalledInput,
        list_postings_stalled,
        "List postings where no opportunity has advanced a stage in N days.",
    ),
    "search_opportunities_by_tag": (
        SearchOpportunitiesByTagInput,
        search_opportunities_by_tag,
        "Search opportunities by an exact tag match.",
    ),
    "note_stage_stuck": (
        NoteStageStuckInput,
        note_stage_stuck,
        "Write tool: add an internal note to an opportunity. Audit-attributed via the perform_as user ID.",
    ),
}


def build_server() -> Server:
    server = Server("lever-recruiting-mcp")

    api_key = _require_env("LEVER_API_KEY")
    perform_as = _require_env("LEVER_PERFORM_AS_USER_ID")
    client = LeverClient(api_key=api_key, perform_as_user_id=perform_as)

    @server.list_tools()
    async def _list_tools() -> list[Tool]:
        return [
            Tool(
                name=name,
                description=desc,
                inputSchema=schema.model_json_schema(),
            )
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

        # Audit: log tool call with PII-light args (drop free-text body for note tool).
        audit_args = arguments.copy()
        if name == "note_stage_stuck":
            audit_args["note_body"] = f"<{len(arguments.get('note_body', ''))} chars>"
        logger.info("Tool call: %s args=%s", name, audit_args)

        try:
            result = await fn(client, args)
        except httpx.HTTPStatusError as exc:
            logger.warning("Tool %s HTTP error: %s", name, exc)
            return [
                TextContent(
                    type="text",
                    text=f"Lever API error {exc.response.status_code}: {exc.response.text[:500]}",
                )
            ]
        except Exception as exc:
            logger.exception("Tool %s failed", name)
            return [TextContent(type="text", text=f"Tool failed: {exc}")]

        # Result returned as JSON-shaped text content; the calling Claude session parses it.
        import json
        return [TextContent(type="text", text=json.dumps(result, default=str, indent=2))]

    return server


def main() -> None:
    """Entry point for `lever-recruiting-mcp` CLI."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    from mcp.server.stdio import stdio_server

    async def _run() -> None:
        server = build_server()
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options(),
            )

    asyncio.run(_run())


if __name__ == "__main__":
    main()
