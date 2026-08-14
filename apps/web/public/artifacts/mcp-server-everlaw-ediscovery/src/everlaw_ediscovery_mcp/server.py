"""
everlaw-ediscovery-mcp — a read-only MCP server over the Everlaw REST API.

Exposes the review-management surface Everlaw's own hosted MCP server does not:
assignment groups and their assignments, the project coding schema (categories and
codes), search term reports, and a computed reviewed/not-reviewed progress rollup
per assignment group. Optionally resolves assignee IDs to names.

WHY THIS EXISTS ALONGSIDE THE OFFICIAL SERVER
---------------------------------------------
Everlaw ships a hosted MCP server at https://api.everlaw.com/v1/mcp (server name
everlaw-mcp, version 0.1.0, protocol revision 2025-11-25). It registers eight tools:
GetProjects, GetProjectBinders, GetProjectMetadataFields, GetProjectProcessedUploads,
GetProjectDatasets, PostProjectSearch, GetProjectSearchResult, DescribeProjectSearchTerm.

Two of the search terms PostProjectSearch accepts cannot be constructed from those
eight tools alone:

  ASSIGNED  needs assignmentGroup.id / assignmentId / userId
  CODED     needs labelId (a category or code id) and optionally userId / groupId

Everlaw's own documentation for those terms points the reader at
GetProjectAssignmentGroups, GetProjectCodes, GetProjectUsers and GetProjectGroups.
Those are REST operations, not tools on the hosted server. An agent connected only
to the hosted server can search full text and Bates ranges, but cannot answer
"how far through the second-level privilege batch is the review team?" because it
has no way to learn the batch exists or what its id is.

This scaffold fills exactly that gap and nothing else. It deliberately does NOT
register a general search tool, a document-fetch tool, or a document-text tool —
the hosted server already does those, under the signed-in user's own permissions,
which is the safer place for them.

STATUS: scaffold — not runtime-tested. Endpoint paths, scope groups, permission
names, and response shapes track the published Everlaw OpenAPI specification
(https://api.everlaw.com/docs/everlaw-openapi.yaml) as of 2026-08. Project ids,
category names, and assignment-group names are tenant-specific; verify against your
own project before relying on any of it.

Run as: python -m everlaw_ediscovery_mcp.server
"""

from __future__ import annotations

import asyncio
import json
import os
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

EVERLAW_API_KEY = os.environ.get("EVERLAW_API_KEY")

# Region matters. Everlaw runs separate stacks and separate API hosts per region;
# a US key does not authenticate against the UK host. Set this to the host that
# matches the tenant your projects live in.
EVERLAW_BASE_URL = os.environ.get("EVERLAW_BASE_URL", "https://api.everlaw.com/v1").rstrip("/")

# Projects the agent may touch at all, as a comma-separated list of numeric ids.
# An Everlaw organization routinely holds matters under protective orders with
# different data-handling terms, and an org-admin key can read all of them. Leaving
# this empty means "every project the key can reach", which you should not ship.
EVERLAW_ALLOWED_PROJECTS = {
    s.strip() for s in os.environ.get("EVERLAW_ALLOWED_PROJECTS", "").split(",") if s.strip()
}

# Assignee-name resolution is off by default. Every other tool here needs only the
# REVIEW_READ scope group; GetProjectUsers needs USER_MANAGEMENT_READ, which also
# covers groups, permissions, and invitations across the project. That is a wider
# grant than "show me review progress" justifies, so it is opt-in.
EVERLAW_ENABLE_USER_LOOKUP = os.environ.get("EVERLAW_ENABLE_USER_LOOKUP", "false").lower() == "true"

# Per-call page ceiling. The Everlaw API caps list endpoints at 200 records; 50 is
# enough for a chat answer and keeps a mis-scoped question from pulling a thousand
# assignment rows into the context window.
MAX_LIMIT = 200
DEFAULT_LIMIT = 50

# Everlaw enforces a fixed 25 requests/second per authenticating user account and
# returns 429 above it. review_progress issues 2 searches per group, so a 30-group
# project is 61 requests; without pacing that trips the limit inside three seconds.
REQUESTS_PER_SECOND = 8
_rate_gate = asyncio.Semaphore(4)


def require_config() -> None:
    if not EVERLAW_API_KEY:
        raise RuntimeError("EVERLAW_API_KEY env var is required")


def auth_headers() -> dict[str, str]:
    # Everlaw accepts the organization API key as a bearer token. Keys look like
    # everlaw-api.XXXX.YYYYYYYY and carry per-endpoint permissions granted on the
    # API keys tab of the Organizations page.
    return {
        "Authorization": f"Bearer {EVERLAW_API_KEY}",
        "Accept": "application/json",
    }


def check_project(project_id: int) -> None:
    if EVERLAW_ALLOWED_PROJECTS and str(project_id) not in EVERLAW_ALLOWED_PROJECTS:
        raise PermissionError(
            f"project {project_id} is not in EVERLAW_ALLOWED_PROJECTS. "
            "Add it there deliberately if this matter is in scope for agent access."
        )


def clamp(limit: int | None) -> int:
    if limit is None:
        return DEFAULT_LIMIT
    return max(1, min(int(limit), MAX_LIMIT))


async def api_get(client: httpx.AsyncClient, path: str, params: dict[str, Any] | None = None) -> Any:
    """GET an Everlaw endpoint, unwrapping the {"data": ...} envelope.

    Retries 429 with exponential backoff. Everlaw documents 429 both for the
    account-wide 25 rps ceiling and for stricter per-endpoint limits, and both are
    transient, so a bounded retry is correct where a 403 is not.
    """
    delay = 1.0
    for attempt in range(4):
        async with _rate_gate:
            resp = await client.get(path, params=params, headers=auth_headers(), timeout=60.0)
            await asyncio.sleep(1.0 / REQUESTS_PER_SECOND)
        if resp.status_code == 429 and attempt < 3:
            await asyncio.sleep(delay)
            delay *= 2
            continue
        break
    raise_for_everlaw(resp)
    return resp.json().get("data")


async def api_post(client: httpx.AsyncClient, path: str, body: dict[str, Any]) -> Any:
    delay = 1.0
    for attempt in range(4):
        async with _rate_gate:
            resp = await client.post(path, json=body, headers=auth_headers(), timeout=60.0)
            await asyncio.sleep(1.0 / REQUESTS_PER_SECOND)
        if resp.status_code == 429 and attempt < 3:
            await asyncio.sleep(delay)
            delay *= 2
            continue
        break
    raise_for_everlaw(resp)
    return resp.json().get("data")


def raise_for_everlaw(resp: httpx.Response) -> None:
    """Translate Everlaw's error envelope into a message an agent can act on.

    Everlaw returns {"title": ..., "status": ...} and deliberately returns the same
    403 whether a project does not exist or the caller cannot see it, so that project
    ids cannot be enumerated. The message below says so, otherwise a model retries a
    valid-but-forbidden project id as though it had fat-fingered the number.
    """
    if resp.status_code < 400:
        return
    try:
        title = resp.json().get("title", resp.text[:200])
    except Exception:
        title = resp.text[:200]
    if resp.status_code == 403:
        raise PermissionError(
            f"{title} (403). Everlaw returns this identically for 'project does not exist' "
            "and 'key lacks access', so do not retry with a different id — confirm the "
            "project id and the key's permissions instead."
        )
    if resp.status_code == 422:
        raise RuntimeError(
            f"{title} (422). Everlaw caps the number of user-visible objects the API may "
            "create, including saved searches. review_progress creates one search per "
            "call; wait for the cap to clear or ask Everlaw Support to raise it."
        )
    raise RuntimeError(f"Everlaw API error {resp.status_code}: {title}")


# ----- Tool implementations -----


async def list_assignment_groups(client: httpx.AsyncClient, project_id: int, limit: int | None) -> Any:
    """GET /projects/{projectId}/assignmentGroups — REVIEW_READ."""
    check_project(project_id)
    data = await api_get(
        client, f"/projects/{project_id}/assignmentGroups", {"limit": clamp(limit)}
    )
    groups = []
    for g in data or []:
        assignments = g.get("assignments") or []
        groups.append(
            {
                "id": g.get("id"),
                "name": g.get("name"),
                "created": g.get("created"),
                "assignment_count": len(assignments),
                # Assignee ids only. Names require USER_MANAGEMENT_READ, which this
                # server does not hold unless EVERLAW_ENABLE_USER_LOOKUP is set.
                "assignee_ids": sorted({a.get("assigneeId") for a in assignments if a.get("assigneeId")}),
            }
        )
    return {
        "project_id": project_id,
        "assignment_groups": groups,
        "_note": (
            "Use an id here as assignmentGroup.id in an ASSIGNED search term, either "
            "through review_progress or through the official Everlaw MCP server's "
            "PostProjectSearch tool."
        ),
    }


async def list_codes(client: httpx.AsyncClient, project_id: int) -> Any:
    """GET /projects/{projectId}/codes — REVIEW_READ."""
    check_project(project_id)
    data = await api_get(client, f"/projects/{project_id}/codes")
    categories = [
        {
            "id": c.get("id"),
            "name": c.get("name"),
            "mutually_exclusive": c.get("mutuallyExclusive"),
            "codes": [{"id": k.get("id"), "name": k.get("name")} for k in (c.get("codes") or [])],
        }
        for c in (data or [])
    ]
    return {
        "project_id": project_id,
        "categories": categories,
        "_note": (
            "A CODED search term takes labelId, which accepts either a category id or "
            "a code id. Category id matches any code in that category."
        ),
    }


async def review_progress(
    client: httpx.AsyncClient, project_id: int, assignment_group_id: int | None
) -> Any:
    """Reviewed / not-reviewed counts per assignment group.

    Everlaw has no progress endpoint. The counts come from running the ASSIGNED
    search term twice per group with reviewStatus REVIEWED and NOT_REVIEWED and
    reading numDocs off each response.

    The engineering choice worth naming: this aggregates at ALL_IN_GROUP level —
    two searches per group — rather than per assignment. Per-assignment detail would
    be two searches per assignee, and every PostProjectSearch call materializes a
    saved search object that is visible in the project's search history and counts
    against Everlaw's cap on API-created user-visible objects (422). A 12-assignee
    group costs 2 searches here and 24 the other way, for a number nobody asked for.
    """
    check_project(project_id)
    groups = await api_get(client, f"/projects/{project_id}/assignmentGroups", {"limit": MAX_LIMIT})
    targets = [g for g in (groups or []) if assignment_group_id in (None, g.get("id"))]
    if assignment_group_id is not None and not targets:
        raise ValueError(f"assignment group {assignment_group_id} not found on project {project_id}")

    rows = []
    for g in targets:
        counts = {}
        for status in ("REVIEWED", "NOT_REVIEWED"):
            body = {
                "term": "ASSIGNED",
                "query": {
                    "assignmentGroup": {
                        "id": g.get("id"),
                        "criteria": "ALL_IN_GROUP",
                        "reviewStatus": status,
                    }
                },
            }
            result = await api_post(client, f"/projects/{project_id}/search", body)
            counts[status] = (result or {}).get("numDocs", 0)
        total = counts["REVIEWED"] + counts["NOT_REVIEWED"]
        rows.append(
            {
                "assignment_group_id": g.get("id"),
                "name": g.get("name"),
                "reviewed": counts["REVIEWED"],
                "not_reviewed": counts["NOT_REVIEWED"],
                "total": total,
                "percent_reviewed": round(100.0 * counts["REVIEWED"] / total, 1) if total else None,
            }
        )
    return {
        "project_id": project_id,
        "groups": rows,
        "_note": (
            "'Reviewed' means reviewed per the assignment group's own review criteria, "
            "which the group's creator configured — it is not a synonym for 'coded'. "
            "Each row cost two saved searches, now visible in the project's search history."
        ),
    }


async def list_search_term_reports(client: httpx.AsyncClient, project_id: int, limit: int | None) -> Any:
    """GET /projects/{projectId}/searchTermReports — REVIEW_READ."""
    check_project(project_id)
    data = await api_get(
        client, f"/projects/{project_id}/searchTermReports", {"limit": clamp(limit)}
    )
    return {
        "project_id": project_id,
        "search_term_reports": [
            {
                "id": r.get("id"),
                "name": r.get("name"),
                "num_searches": r.get("numSearches"),
                "last_updated": r.get("lastUpdated"),
                "user_id": r.get("userId"),
            }
            for r in (data or [])
        ],
        "_note": (
            "Names and counts only. Term hit counts are not returned here; a term list "
            "negotiated with opposing counsel can itself be work product."
        ),
    }


async def resolve_assignee_names(client: httpx.AsyncClient, project_id: int, limit: int | None) -> Any:
    """GET /projects/{projectId}/users — USER_MANAGEMENT_READ. Opt-in."""
    if not EVERLAW_ENABLE_USER_LOOKUP:
        raise PermissionError(
            "assignee-name lookup is disabled. It needs the USER_MANAGEMENT_READ scope "
            "group, which is broader than the REVIEW_READ the other tools use. Set "
            "EVERLAW_ENABLE_USER_LOOKUP=true and grant the GetProjectUsers permission "
            "only if reviewer names are genuinely needed in chat."
        )
    check_project(project_id)
    data = await api_get(client, f"/projects/{project_id}/users", {"limit": clamp(limit)})
    return {
        "project_id": project_id,
        # Names and ids only — the endpoint also returns per-user permission sets to
        # project administrators, which is access-control configuration and does not
        # belong in a chat transcript.
        "users": [
            {"id": u.get("id"), "name": u.get("name"), "email": u.get("email")}
            for u in (data or [])
        ],
    }


# ----- MCP wiring -----

server = Server("everlaw-ediscovery")

PROJECT_ID_SCHEMA = {
    "type": "integer",
    "description": "Everlaw project id. Get it from the official Everlaw MCP server's GetProjects tool, or from the project URL.",
}


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="list_assignment_groups",
            description=(
                "List review assignment groups on an Everlaw project with assignment counts "
                "and assignee ids. Read-only. Use this to get the assignmentGroup.id that an "
                "ASSIGNED search term requires — the official Everlaw MCP server has no tool "
                "that returns it."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "project_id": PROJECT_ID_SCHEMA,
                    "limit": {"type": "integer", "description": f"Max groups, 1-{MAX_LIMIT}. Default {DEFAULT_LIMIT}."},
                },
                "required": ["project_id"],
            },
        ),
        Tool(
            name="list_codes",
            description=(
                "List the coding schema of an Everlaw project: categories, their codes, and "
                "whether each category is mutually exclusive. Read-only. Returns the labelId "
                "values a CODED search term requires. Returns the schema, not any document's "
                "coding decisions."
            ),
            inputSchema={
                "type": "object",
                "properties": {"project_id": PROJECT_ID_SCHEMA},
                "required": ["project_id"],
            },
        ),
        Tool(
            name="review_progress",
            description=(
                "Reviewed / not-reviewed document counts and percent complete for one or all "
                "assignment groups on an Everlaw project. Read-only, but each group costs two "
                "saved searches that appear in the project's search history."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "project_id": PROJECT_ID_SCHEMA,
                    "assignment_group_id": {
                        "type": "integer",
                        "description": "Restrict to one group. Omit for every group on the project.",
                    },
                },
                "required": ["project_id"],
            },
        ),
        Tool(
            name="list_search_term_reports",
            description=(
                "List search term reports on an Everlaw project by name, owner, term count, "
                "and last-updated date. Read-only. Does not return the terms themselves or "
                "their hit counts."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "project_id": PROJECT_ID_SCHEMA,
                    "limit": {"type": "integer", "description": f"Max reports, 1-{MAX_LIMIT}. Default {DEFAULT_LIMIT}."},
                },
                "required": ["project_id"],
            },
        ),
        Tool(
            name="resolve_assignee_names",
            description=(
                "Map Everlaw user ids to reviewer names on a project. Read-only and disabled "
                "unless EVERLAW_ENABLE_USER_LOOKUP=true, because it needs a wider scope group "
                "than every other tool here."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "project_id": PROJECT_ID_SCHEMA,
                    "limit": {"type": "integer", "description": f"Max users, 1-{MAX_LIMIT}. Default {DEFAULT_LIMIT}."},
                },
                "required": ["project_id"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()
    async with httpx.AsyncClient(base_url=EVERLAW_BASE_URL) as client:
        try:
            if name == "list_assignment_groups":
                result = await list_assignment_groups(
                    client, int(arguments["project_id"]), arguments.get("limit")
                )
            elif name == "list_codes":
                result = await list_codes(client, int(arguments["project_id"]))
            elif name == "review_progress":
                gid = arguments.get("assignment_group_id")
                result = await review_progress(
                    client, int(arguments["project_id"]), int(gid) if gid is not None else None
                )
            elif name == "list_search_term_reports":
                result = await list_search_term_reports(
                    client, int(arguments["project_id"]), arguments.get("limit")
                )
            elif name == "resolve_assignee_names":
                result = await resolve_assignee_names(
                    client, int(arguments["project_id"]), arguments.get("limit")
                )
            else:
                raise ValueError(f"unknown tool: {name}")
        except (PermissionError, ValueError, RuntimeError) as exc:
            # Surface as a tool error, not an exception. The agent needs to read the
            # reason — "not in the allowlist" and "key lacks the permission" call for
            # different fixes and neither is solved by retrying.
            return [TextContent(type="text", text=json.dumps({"error": str(exc)}, indent=2))]
    return [TextContent(type="text", text=json.dumps(result, indent=2, ensure_ascii=False))]


async def main() -> None:
    require_config()
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
