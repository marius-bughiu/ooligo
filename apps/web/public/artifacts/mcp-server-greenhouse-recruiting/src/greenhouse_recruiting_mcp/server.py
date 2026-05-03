"""
Greenhouse recruiting MCP server.

Exposes seven tools to MCP-compatible clients (Claude Desktop, Claude Code,
Cursor, etc.) backed by the Greenhouse Harvest API. Six are read; one is
the cautious write (`note_stage_stuck`).

NOT runtime-tested against a live Greenhouse tenant. The tool dispatch
implementations are written against Greenhouse's documented Harvest API
shape (https://developers.greenhouse.io/harvest.html as of 2026-Q2), but
the production deployment requires the recruiting engineer to verify each
tool against a staging tenant before flipping the production credentials.

Security model:
  - Auth: Greenhouse API key (Harvest scope) via Basic auth, key as username,
    empty password — Greenhouse's documented pattern.
  - Writes: only `note_stage_stuck` mutates state; uses `On-Behalf-Of`
    header for audit attribution.
  - Rate limit: token-bucket (default 40 req/10s; Greenhouse ceiling is
    50 req/10s per API key per IP).
  - Pagination: cursor-based on most endpoints; the implementations loop
    until no `Link: rel="next"` header is present.
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

GREENHOUSE_API_BASE = "https://harvest.greenhouse.io/v1"
DEFAULT_RATE_LIMIT_PER_10S = 40  # Greenhouse documented ceiling: 50.
DEFAULT_TIMEOUT_S = 30.0


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(
            f"Required env var {name} not set. The Greenhouse MCP server cannot start "
            f"without credentials. See README.md for setup."
        )
    return val


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


# --- Greenhouse client --------------------------------------------------------


class GreenhouseClient:
    """Thin async wrapper around the Harvest API."""

    def __init__(
        self,
        api_key: str,
        on_behalf_of_user_id: str,
        rate_limit_per_10s: int = DEFAULT_RATE_LIMIT_PER_10S,
    ) -> None:
        self.api_key = api_key
        self.on_behalf_of_user_id = on_behalf_of_user_id
        self.bucket = TokenBucket(rate=rate_limit_per_10s, per_seconds=10.0)
        self._client = httpx.AsyncClient(
            base_url=GREENHOUSE_API_BASE,
            auth=(api_key, ""),
            timeout=DEFAULT_TIMEOUT_S,
            headers={"User-Agent": "greenhouse-recruiting-mcp/0.1.0"},
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
        attribute_write: bool = False,
    ) -> httpx.Response:
        await self.bucket.acquire()
        headers: dict[str, str] = {}
        if attribute_write:
            headers["On-Behalf-Of"] = self.on_behalf_of_user_id
        resp = await self._client.request(method, path, params=params, json=json, headers=headers)
        if resp.status_code == 429:
            # Greenhouse does not return Retry-After on 429. Back off conservatively.
            await asyncio.sleep(2.0)
            return await self._request(
                method, path, params=params, json=json, attribute_write=attribute_write
            )
        resp.raise_for_status()
        return resp

    async def paginate(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        *,
        max_pages: int = 50,
    ) -> AsyncIterator[dict[str, Any]]:
        """Yield each item from a paginated Harvest endpoint."""
        url: str | None = path
        page = 0
        while url is not None and page < max_pages:
            resp = await self._request("GET", url, params=params if page == 0 else None)
            for item in resp.json():
                yield item
            link = resp.headers.get("Link", "")
            url = _next_url_from_link_header(link)
            page += 1


def _next_url_from_link_header(link_header: str) -> str | None:
    """Parse RFC-5988 Link header for rel=next."""
    if not link_header:
        return None
    for part in link_header.split(","):
        section = part.split(";")
        if len(section) < 2:
            continue
        url = section[0].strip().strip("<>")
        rel = section[1].strip()
        if rel == 'rel="next"':
            # Greenhouse returns absolute URL; httpx follows but we want the path.
            if url.startswith(GREENHOUSE_API_BASE):
                return url[len(GREENHOUSE_API_BASE):]
            return url
    return None


# --- Pydantic schemas ---------------------------------------------------------


class ListCandidatesInStageInput(BaseModel):
    job_id: int = Field(..., description="Greenhouse job ID")
    stage_name: str = Field(..., description="Stage name as it appears in Greenhouse")
    stale_after_days: int | None = Field(
        None, description="Optional filter: candidates last touched more than N days ago"
    )


class GetCandidateHistoryInput(BaseModel):
    candidate_id: int = Field(..., description="Greenhouse candidate ID")


class ListJobsOpenInput(BaseModel):
    department: str | None = Field(None, description="Optional department name filter")


class GetFunnelForJobInput(BaseModel):
    job_id: int = Field(..., description="Greenhouse job ID")


class ListJobsStalledInput(BaseModel):
    stale_after_days: int = Field(
        7, description="A job is stalled if no candidate progressed in this many days"
    )


class SearchCandidatesByAttributeInput(BaseModel):
    custom_field_name: str
    value: str


class NoteStageStuckInput(BaseModel):
    candidate_id: int
    note_body: str = Field(..., description="The note text. Visible only internally.")


# --- Tool implementations -----------------------------------------------------


async def list_candidates_in_stage(
    client: GreenhouseClient, args: ListCandidatesInStageInput
) -> list[dict[str, Any]]:
    """Return candidates currently in a named stage on a given job."""
    out: list[dict[str, Any]] = []
    cutoff = (
        time.time() - (args.stale_after_days or 0) * 86400 if args.stale_after_days else None
    )
    async for app in client.paginate(
        f"/jobs/{args.job_id}/applications", params={"per_page": 100, "status": "active"}
    ):
        current_stage = app.get("current_stage", {})
        if (current_stage.get("name") or "").strip() == args.stage_name.strip():
            last_activity = app.get("last_activity_at")
            if cutoff and last_activity:
                if time.mktime(time.strptime(last_activity[:19], "%Y-%m-%dT%H:%M:%S")) > cutoff:
                    continue
            out.append(
                {
                    "candidate_id": app.get("candidate_id"),
                    "application_id": app.get("id"),
                    "applied_at": app.get("applied_at"),
                    "last_activity_at": last_activity,
                    "current_stage": current_stage.get("name"),
                }
            )
    return out


async def get_candidate_history(
    client: GreenhouseClient, args: GetCandidateHistoryInput
) -> dict[str, Any]:
    """Return a candidate's stage history."""
    candidate_resp = await client._request("GET", f"/candidates/{args.candidate_id}")
    candidate = candidate_resp.json()
    activity_resp = await client._request(
        "GET", f"/candidates/{args.candidate_id}/activity_feed"
    )
    activity = activity_resp.json()
    return {
        "candidate_id": candidate.get("id"),
        "name": candidate.get("first_name", "") + " " + candidate.get("last_name", ""),
        "current_application_ids": [app.get("id") for app in candidate.get("applications", [])],
        "activities": [
            {
                "type": a.get("subject"),
                "at": a.get("created_at"),
                "by": a.get("user"),
            }
            for a in (activity.get("activities") or [])
        ],
    }


async def list_jobs_open(
    client: GreenhouseClient, args: ListJobsOpenInput
) -> list[dict[str, Any]]:
    """List all open jobs."""
    out: list[dict[str, Any]] = []
    async for job in client.paginate(
        "/jobs",
        params={"status": "open", "per_page": 100},
    ):
        if args.department and (job.get("departments") or [{}])[0].get("name") != args.department:
            continue
        out.append(
            {
                "job_id": job.get("id"),
                "name": job.get("name"),
                "department": (job.get("departments") or [{}])[0].get("name"),
                "opened_at": job.get("opened_at"),
                "closed_at": job.get("closed_at"),
                "hiring_managers": [
                    h.get("name") for h in (job.get("hiring_team", {}).get("hiring_managers") or [])
                ],
            }
        )
    return out


async def get_funnel_for_job(
    client: GreenhouseClient, args: GetFunnelForJobInput
) -> dict[str, int]:
    """Return candidate count per stage for a job."""
    counts: dict[str, int] = {}
    async for app in client.paginate(
        f"/jobs/{args.job_id}/applications", params={"per_page": 100, "status": "active"}
    ):
        stage = (app.get("current_stage", {}).get("name") or "unknown").strip()
        counts[stage] = counts.get(stage, 0) + 1
    return counts


async def list_jobs_stalled(
    client: GreenhouseClient, args: ListJobsStalledInput
) -> list[dict[str, Any]]:
    """List jobs where no candidate has progressed in N days."""
    cutoff = time.time() - args.stale_after_days * 86400
    stalled: list[dict[str, Any]] = []
    async for job in client.paginate("/jobs", params={"status": "open", "per_page": 100}):
        latest_activity = 0.0
        async for app in client.paginate(
            f"/jobs/{job['id']}/applications", params={"per_page": 100, "status": "active"}
        ):
            la = app.get("last_activity_at")
            if la:
                try:
                    t = time.mktime(time.strptime(la[:19], "%Y-%m-%dT%H:%M:%S"))
                    if t > latest_activity:
                        latest_activity = t
                except ValueError:
                    continue
        if latest_activity > 0 and latest_activity < cutoff:
            stalled.append(
                {
                    "job_id": job.get("id"),
                    "name": job.get("name"),
                    "days_since_progress": int((time.time() - latest_activity) / 86400),
                }
            )
    return stalled


async def search_candidates_by_attribute(
    client: GreenhouseClient, args: SearchCandidatesByAttributeInput
) -> list[dict[str, Any]]:
    """Search candidates by a custom field value."""
    out: list[dict[str, Any]] = []
    async for c in client.paginate("/candidates", params={"per_page": 100}):
        for cf in c.get("custom_fields", []) or []:
            if cf.get("name") == args.custom_field_name and str(cf.get("value")) == args.value:
                out.append(
                    {
                        "candidate_id": c.get("id"),
                        "name": c.get("first_name", "") + " " + c.get("last_name", ""),
                        "matched_field": cf.get("name"),
                        "matched_value": cf.get("value"),
                    }
                )
                break
    return out


async def note_stage_stuck(
    client: GreenhouseClient, args: NoteStageStuckInput
) -> dict[str, Any]:
    """
    Add an internal note to a candidate. The single write tool exposed.

    Per-tool justification:
      - Required to log "Claude flagged this candidate as stage-stuck" so the
        action is visible in the audit trail and not silent.
      - No candidate-state mutation (does not move stages, does not send
        emails, does not change scorecards).
      - Attributed via On-Behalf-Of header so the Greenhouse audit log
        shows the recruiting-engineer user, not just the API key.
    """
    body = {
        "user_id": int(client.on_behalf_of_user_id),
        "body": args.note_body,
        "visibility": "private",  # internal note, not visible to candidate
    }
    resp = await client._request(
        "POST",
        f"/candidates/{args.candidate_id}/activity_feed/notes",
        json=body,
        attribute_write=True,
    )
    return {"status": "ok", "note": resp.json()}


# --- MCP server wiring --------------------------------------------------------

TOOL_REGISTRY: dict[str, tuple[type[BaseModel], Any, str]] = {
    "list_candidates_in_stage": (
        ListCandidatesInStageInput,
        list_candidates_in_stage,
        "List candidates currently in a named stage on a given job. Optionally filter by staleness.",
    ),
    "get_candidate_history": (
        GetCandidateHistoryInput,
        get_candidate_history,
        "Return a candidate's stage history and activity feed.",
    ),
    "list_jobs_open": (
        ListJobsOpenInput,
        list_jobs_open,
        "List open jobs. Optional department filter.",
    ),
    "get_funnel_for_job": (
        GetFunnelForJobInput,
        get_funnel_for_job,
        "Return candidate counts per stage for a single job.",
    ),
    "list_jobs_stalled": (
        ListJobsStalledInput,
        list_jobs_stalled,
        "List jobs where no candidate has progressed in N days.",
    ),
    "search_candidates_by_attribute": (
        SearchCandidatesByAttributeInput,
        search_candidates_by_attribute,
        "Search candidates by custom field name and value.",
    ),
    "note_stage_stuck": (
        NoteStageStuckInput,
        note_stage_stuck,
        "Write tool: add a private internal note to a candidate. Audit-attributed via On-Behalf-Of.",
    ),
}


def build_server() -> Server:
    server = Server("greenhouse-recruiting-mcp")

    api_key = _require_env("GREENHOUSE_API_KEY")
    on_behalf_of = _require_env("GREENHOUSE_USER_ID_FOR_ON_BEHALF_OF")
    client = GreenhouseClient(api_key=api_key, on_behalf_of_user_id=on_behalf_of)

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
                    text=f"Greenhouse API error {exc.response.status_code}: {exc.response.text[:500]}",
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
    """Entry point for `greenhouse-recruiting-mcp` CLI."""
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
