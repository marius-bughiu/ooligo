"""
ashby-recruiting-mcp — MCP server tuned for recruiting workflows on Ashby.

Exposes object-read tools, search tools, two recruiting helpers
(stale_candidates, pipeline_velocity), and two light-write tools
(add_note, add_tag). Read-mostly by design — Claude asks, summarizes,
documents; the recruiter drives every candidate-facing change in the
Ashby UI.

STATUS: scaffold — not runtime-tested. Adapt the field paths, stage
names, and pipeline IDs to your workspace before use. Ashby uses POST
for almost every endpoint (yes, even reads); responses are wrapped in
{success, results} and pagination is cursor-based via the `cursor`
field returned in `moreDataAvailable` responses.

Run as: python -m ashby_recruiting_mcp.server
"""

from __future__ import annotations

import base64
import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

ASHBY_API_KEY = os.environ.get("ASHBY_API_KEY")
WORKSPACE_NAME = os.environ.get("ASHBY_WORKSPACE_NAME", "default")
STALE_DEFAULT_DAYS = int(os.environ.get("ASHBY_STALE_DEFAULT_DAYS", "30"))
VELOCITY_LOOKBACK_DAYS = int(os.environ.get("ASHBY_VELOCITY_LOOKBACK_DAYS", "90"))

API_BASE = "https://api.ashbyhq.com"


def require_config() -> None:
    if not ASHBY_API_KEY:
        raise RuntimeError("ASHBY_API_KEY env var is required")


def auth_headers() -> dict[str, str]:
    # Ashby auth is HTTP Basic with the API key as username and empty password.
    token = base64.b64encode(f"{ASHBY_API_KEY}:".encode()).decode()
    return {
        "Authorization": f"Basic {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


# ----- Ashby HTTP helpers -----
#
# Ashby uses POST for everything (even reads). All responses are shaped
# {"success": bool, "results": ..., "errors": [...], "moreDataAvailable": bool,
#  "nextCursor": "..."}. We unwrap `results` here and surface errors loudly.


async def ashby_post(path: str, body: dict[str, Any] | None = None) -> Any:
    payload = body or {}
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{API_BASE}{path}", headers=auth_headers(), json=payload)
        r.raise_for_status()
        data = r.json()
    if not data.get("success", False):
        raise RuntimeError(f"Ashby API error on {path}: {data.get('errors')}")
    return data.get("results")


async def ashby_post_paginated(
    path: str, body: dict[str, Any] | None = None, max_pages: int = 20
) -> list[Any]:
    """Drains a cursor-paginated list endpoint. Caps at max_pages to bound calls."""
    out: list[Any] = []
    cursor: str | None = None
    payload = dict(body or {})
    for _ in range(max_pages):
        if cursor:
            payload["cursor"] = cursor
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(f"{API_BASE}{path}", headers=auth_headers(), json=payload)
            r.raise_for_status()
            data = r.json()
        if not data.get("success", False):
            raise RuntimeError(f"Ashby API error on {path}: {data.get('errors')}")
        results = data.get("results") or []
        if isinstance(results, list):
            out.extend(results)
        else:
            out.append(results)
        if not data.get("moreDataAvailable"):
            break
        cursor = data.get("nextCursor")
        if not cursor:
            break
    return out


# ----- Server + tool registry -----

server = Server(f"ashby-recruiting-{WORKSPACE_NAME}")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_candidate",
            description="Fetch full candidate record (contact info + current applications).",
            inputSchema={
                "type": "object",
                "properties": {"candidate_id": {"type": "string"}},
                "required": ["candidate_id"],
            },
        ),
        Tool(
            name="get_application",
            description="Fetch an application record (current stage, source, history).",
            inputSchema={
                "type": "object",
                "properties": {"application_id": {"type": "string"}},
                "required": ["application_id"],
            },
        ),
        Tool(
            name="get_job",
            description="Fetch a job record (hiring team, status, pipeline).",
            inputSchema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        ),
        Tool(
            name="get_opening",
            description="Fetch an opening (req) record (target start, headcount).",
            inputSchema={
                "type": "object",
                "properties": {"opening_id": {"type": "string"}},
                "required": ["opening_id"],
            },
        ),
        Tool(
            name="search_candidates",
            description="Search candidates by name / email / company substring.",
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
            name="list_applications",
            description=(
                "List applications for a job. Optional status filter "
                "(Active | Hired | Archived)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "job_id": {"type": "string"},
                    "status": {
                        "type": "string",
                        "enum": ["Active", "Hired", "Archived"],
                    },
                },
                "required": ["job_id"],
            },
        ),
        Tool(
            name="list_jobs",
            description="List jobs in the workspace. Optional status filter (Open | Closed | Draft).",
            inputSchema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["Open", "Closed", "Draft"],
                    },
                },
            },
        ),
        Tool(
            name="stale_candidates",
            description=(
                "Active candidates with no application activity (stage change, note, "
                "interview event) for `days_inactive` days. Output grouped by current stage."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "days_inactive": {
                        "type": "integer",
                        "default": STALE_DEFAULT_DAYS,
                    },
                    "job_id": {
                        "type": "string",
                        "description": "Optional — restrict to a single job's pipeline.",
                    },
                },
            },
        ),
        Tool(
            name="pipeline_velocity",
            description=(
                "Average days-in-stage per stage for a job's pipeline, computed across "
                "the configured lookback window. Surfaces where the funnel is stuck."
            ),
            inputSchema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        ),
        Tool(
            name="add_note",
            description=(
                "Append a note to a candidate's record. Visible in the Ashby UI activity feed. "
                "Use for documenting Claude-summarized context, not for status changes."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "candidate_id": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["candidate_id", "body"],
            },
        ),
        Tool(
            name="add_tag",
            description=(
                "Apply a tag to a candidate. Reserve for descriptive tags "
                "(e.g. `phone-screen-passed`); never use for status-equivalents like `hired`."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "candidate_id": {"type": "string"},
                    "tag": {"type": "string"},
                },
                "required": ["candidate_id", "tag"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    if name == "get_candidate":
        data = await ashby_post(
            "/candidate.info", {"id": arguments["candidate_id"]}
        )
        return [TextContent(type="text", text=str(data))]

    if name == "get_application":
        data = await ashby_post(
            "/application.info", {"id": arguments["application_id"]}
        )
        return [TextContent(type="text", text=str(data))]

    if name == "get_job":
        data = await ashby_post("/job.info", {"id": arguments["job_id"]})
        return [TextContent(type="text", text=str(data))]

    if name == "get_opening":
        data = await ashby_post("/opening.info", {"openingId": arguments["opening_id"]})
        return [TextContent(type="text", text=str(data))]

    if name == "search_candidates":
        data = await ashby_post(
            "/candidate.search",
            {
                "query": arguments["query"],
                "limit": arguments.get("limit", 25),
            },
        )
        return [TextContent(type="text", text=str(data))]

    if name == "list_applications":
        body: dict[str, Any] = {"jobId": arguments["job_id"]}
        if status := arguments.get("status"):
            body["status"] = status
        results = await ashby_post_paginated("/application.list", body)
        return [TextContent(type="text", text=str(results))]

    if name == "list_jobs":
        body = {}
        if status := arguments.get("status"):
            body["status"] = status
        results = await ashby_post_paginated("/job.list", body)
        return [TextContent(type="text", text=str(results))]

    if name == "stale_candidates":
        days_inactive = arguments.get("days_inactive", STALE_DEFAULT_DAYS)
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_inactive)
        # Pull active applications, optionally scoped to one job.
        list_body: dict[str, Any] = {"status": "Active"}
        if jid := arguments.get("job_id"):
            list_body["jobId"] = jid
        applications = await ashby_post_paginated("/application.list", list_body)

        stale_by_stage: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for app in applications:
            # Ashby returns ISO 8601 timestamps; the field name has shifted historically.
            last_activity_str = (
                app.get("lastActivityAt")
                or app.get("updatedAt")
                or app.get("createdAt")
            )
            if not last_activity_str:
                continue
            try:
                last_activity = datetime.fromisoformat(
                    last_activity_str.replace("Z", "+00:00")
                )
            except ValueError:
                continue
            if last_activity < cutoff:
                stage_name = (app.get("currentInterviewStage") or {}).get("title") or "Unknown"
                stale_by_stage[stage_name].append(
                    {
                        "applicationId": app.get("id"),
                        "candidateId": (app.get("candidate") or {}).get("id"),
                        "candidateName": (app.get("candidate") or {}).get("name"),
                        "lastActivityAt": last_activity_str,
                        "daysInactive": (datetime.now(timezone.utc) - last_activity).days,
                    }
                )
        out = {
            "daysInactiveThreshold": days_inactive,
            "totalStale": sum(len(v) for v in stale_by_stage.values()),
            "byStage": dict(stale_by_stage),
        }
        return [TextContent(type="text", text=str(out))]

    if name == "pipeline_velocity":
        job_id = arguments["job_id"]
        cutoff = datetime.now(timezone.utc) - timedelta(days=VELOCITY_LOOKBACK_DAYS)
        # Pull every application (active + archived + hired) in the job, then
        # walk each application's interviewStageChanges to compute durations.
        applications = await ashby_post_paginated("/application.list", {"jobId": job_id})

        durations_by_stage: dict[str, list[float]] = defaultdict(list)
        for app in applications:
            changes = await ashby_post(
                "/application.interviewStageChanges",
                {"applicationId": app.get("id")},
            ) or []
            # Sort changes oldest-first.
            changes_sorted = sorted(
                changes, key=lambda c: c.get("enteredStageAt") or ""
            )
            for i, change in enumerate(changes_sorted):
                entered_str = change.get("enteredStageAt")
                if not entered_str:
                    continue
                try:
                    entered = datetime.fromisoformat(entered_str.replace("Z", "+00:00"))
                except ValueError:
                    continue
                if entered < cutoff:
                    continue
                # Stage exit is the next change's entry, or now if this is the latest.
                exit_dt = datetime.now(timezone.utc)
                if i + 1 < len(changes_sorted):
                    next_entered = changes_sorted[i + 1].get("enteredStageAt")
                    if next_entered:
                        try:
                            exit_dt = datetime.fromisoformat(
                                next_entered.replace("Z", "+00:00")
                            )
                        except ValueError:
                            pass
                duration_days = (exit_dt - entered).total_seconds() / 86400.0
                stage_name = (change.get("interviewStage") or {}).get("title") or "Unknown"
                durations_by_stage[stage_name].append(duration_days)

        velocity = {
            stage: {
                "samples": len(values),
                "avgDays": round(sum(values) / len(values), 2) if values else 0.0,
            }
            for stage, values in durations_by_stage.items()
        }
        out = {
            "jobId": job_id,
            "lookbackDays": VELOCITY_LOOKBACK_DAYS,
            "byStage": velocity,
        }
        return [TextContent(type="text", text=str(out))]

    if name == "add_note":
        result = await ashby_post(
            "/candidate.note.create",
            {
                "candidateId": arguments["candidate_id"],
                "note": arguments["body"],
            },
        )
        return [
            TextContent(
                type="text",
                text=f"Added note to candidate {arguments['candidate_id']}: {result}",
            )
        ]

    if name == "add_tag":
        result = await ashby_post(
            "/candidateTag.create",
            {
                "candidateId": arguments["candidate_id"],
                "tag": arguments["tag"],
            },
        )
        return [
            TextContent(
                type="text",
                text=f"Tagged candidate {arguments['candidate_id']} with `{arguments['tag']}`: {result}",
            )
        ]

    raise ValueError(f"Unknown tool: {name}")


# ----- Entrypoint -----


async def main() -> None:
    require_config()
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
