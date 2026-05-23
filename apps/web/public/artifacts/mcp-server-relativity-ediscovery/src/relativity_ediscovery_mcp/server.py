"""
relativity-ediscovery-mcp — MCP server for Relativity / RelativityOne e-discovery metadata.

Exposes workspace listings, review-set metadata, and saved-search summaries
as Claude tools. Read-only by design — no document content, no coding values
per document, no write operations.

STATUS: scaffold — not runtime-tested. Validate all base paths, ArtifactTypeIDs,
and response field names against your Relativity instance before use. On-prem
Relativity Server versions may use different base paths than RelativityOne cloud.

Run as: python -m relativity_ediscovery_mcp.server
"""

from __future__ import annotations

import base64
import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

RELATIVITY_HOST = os.environ.get("RELATIVITY_HOST", "").rstrip("/")
AUTH_MODE = os.environ.get("RELATIVITY_AUTH_MODE", "oauth2").lower()
CLIENT_ID = os.environ.get("RELATIVITY_CLIENT_ID", "")
CLIENT_SECRET = os.environ.get("RELATIVITY_CLIENT_SECRET", "")
USERNAME = os.environ.get("RELATIVITY_USERNAME", "")
PASSWORD = os.environ.get("RELATIVITY_PASSWORD", "")
DEFAULT_WORKSPACE_ID = os.environ.get("RELATIVITY_DEFAULT_WORKSPACE_ID", "")
PAGE_SIZE = int(os.environ.get("RELATIVITY_PAGE_SIZE", "50"))

# Relativity REST API base prefixes (RelativityOne cloud, 2024-2025 conventions).
# Validate these against your specific instance version — on-prem paths may differ.
WS_MANAGER_BASE = "/Relativity.Rest/api/relativity-environment/v1/workspace"
OBJ_MANAGER_BASE = "/Relativity.Rest/api/Relativity.ObjectManager/v1/workspace"
SEARCH_MANAGER_BASE = (
    "/Relativity.Rest/api/Relativity.Services.Search.ISearchModule"
    "/Keyword%20Search%20Manager"
)

# ArtifactTypeID for Document objects in Relativity (fixed across all instances).
DOC_ARTIFACT_TYPE_ID = 10

# Cache the OAuth2 token and the resolved review-set ArtifactTypeID.
_bearer_token: str | None = None
_review_set_artifact_type_id: int | None = None

# Privilege-aware audit logger: NEVER log query strings, search conditions,
# workspace names, or document counts in a way that could reveal legal strategy.
# Only log tool name, timestamp, and result count.
audit_log = logging.getLogger("relativity_ediscovery_mcp.audit")
logging.basicConfig(level=logging.INFO)


def require_config() -> None:
    if not RELATIVITY_HOST:
        raise RuntimeError("RELATIVITY_HOST env var is required")
    if AUTH_MODE == "oauth2" and not (CLIENT_ID and CLIENT_SECRET):
        raise RuntimeError(
            "RELATIVITY_CLIENT_ID and RELATIVITY_CLIENT_SECRET are required "
            "when RELATIVITY_AUTH_MODE=oauth2"
        )
    if AUTH_MODE == "basic" and not (USERNAME and PASSWORD):
        raise RuntimeError(
            "RELATIVITY_USERNAME and RELATIVITY_PASSWORD are required "
            "when RELATIVITY_AUTH_MODE=basic"
        )


def log_invocation(tool: str, result_count: int | None = None) -> None:
    """Metadata-only audit record. Never includes query strings or workspace names."""
    audit_log.info(
        "tool=%s ts=%s results=%s",
        tool,
        datetime.now(timezone.utc).isoformat(),
        result_count if result_count is not None else "n/a",
    )


async def fetch_oauth2_token() -> str:
    """Fetch a Bearer token from the Relativity Identity endpoint.
    Tokens expire in ~1 hour. This scaffold fetches once at startup; add
    a refresh loop (TODO #2 in README) for long-running deployments.
    """
    token_url = f"{RELATIVITY_HOST}/Relativity/Identity/connect/token"
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            token_url,
            data={
                "grant_type": "client_credentials",
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "scope": "SystemUserInfo",
            },
        )
        r.raise_for_status()
        return r.json()["access_token"]


async def auth_headers() -> dict[str, str]:
    """Return authentication headers for the configured auth mode.

    X-CSRF-Header is required by all Relativity REST endpoints regardless of
    auth method. Per the Relativity docs, any non-empty value works; '-' is
    the conventional placeholder.
    """
    global _bearer_token

    base = {
        "Content-Type": "application/json",
        "X-CSRF-Header": "-",
    }

    if AUTH_MODE == "oauth2":
        if _bearer_token is None:
            _bearer_token = await fetch_oauth2_token()
        base["Authorization"] = f"Bearer {_bearer_token}"
    else:
        encoded = base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode()
        base["Authorization"] = f"Basic {encoded}"

    return base


async def rel_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """HTTP GET against the Relativity REST API."""
    headers = await auth_headers()
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{RELATIVITY_HOST}{path}",
            headers=headers,
            params=params,
        )
        r.raise_for_status()
        return r.json()


async def rel_post(path: str, body: dict[str, Any]) -> dict[str, Any]:
    """HTTP POST against the Relativity REST API."""
    headers = await auth_headers()
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{RELATIVITY_HOST}{path}",
            headers=headers,
            json=body,
        )
        r.raise_for_status()
        return r.json()


async def resolve_review_set_artifact_type_id(workspace_id: int) -> int:
    """Resolve the ArtifactTypeID for the Relativity Review Set object type.

    Review Sets are Relativity Dynamic Objects (RDOs) installed by the Review
    application. Their ArtifactTypeID is assigned when the application is
    installed and is not fixed across instances (unlike Documents = 10).
    This helper queries the Object Type Manager to find the numeric ID by name.

    If the lookup fails (e.g. the Review application is not installed, or the
    object type has a different name in your tenant), the scaffold falls back
    to raising a descriptive error rather than silently querying the wrong type.
    """
    global _review_set_artifact_type_id
    if _review_set_artifact_type_id is not None:
        return _review_set_artifact_type_id

    obj_type_base = "/Relativity.Rest/api/Relativity.ObjectManager/v1"
    # Query object types in the workspace by name. The Relativity Review Set
    # object type is typically named "Review Set" in the UI.
    result = await rel_post(
        f"{obj_type_base}/workspace/{workspace_id}/object/queryslim",
        {
            "request": {
                "objectType": {"artifactTypeID": 25},  # 25 = Object Type in Relativity
                "fields": [{"name": "Name"}, {"name": "ArtifactTypeID"}],
                "condition": "'Name' == 'Review Set'",
            },
            "start": 1,
            "length": 1,
        },
    )
    objects = result.get("Objects", [])
    if not objects:
        raise RuntimeError(
            "Could not resolve ArtifactTypeID for 'Review Set' object type in "
            f"workspace {workspace_id}. Confirm the Review application is installed "
            "and that the object type name matches exactly."
        )
    # The ArtifactTypeID is surfaced as a field value in the response.
    # Field order matches the request's `fields` array (Name=0, ArtifactTypeID=1).
    artifact_type_id = int(objects[0]["Values"][1])
    _review_set_artifact_type_id = artifact_type_id
    return artifact_type_id


# ----- Server + tool registry -----

server = Server("relativity-ediscovery")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="list_workspaces",
            description=(
                "List Relativity workspaces accessible to the service account, "
                "paginated. Returns workspace name, ArtifactID, status, matter, "
                "and document count. Use ArtifactID values in subsequent tool calls."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "start": {
                        "type": "integer",
                        "description": "1-based page start index (default: 1)",
                        "default": 1,
                    },
                    "length": {
                        "type": "integer",
                        "description": "Number of workspaces to return (default: page size from env)",
                    },
                },
            },
        ),
        Tool(
            name="get_workspace_summary",
            description=(
                "Get metadata for a single Relativity workspace: document count, "
                "total file size, creation date. Returns operational stats only — "
                "no document content."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "integer",
                        "description": "Workspace ArtifactID (from list_workspaces)",
                    }
                },
                "required": ["workspace_id"],
            },
        ),
        Tool(
            name="get_review_set_metadata",
            description=(
                "Get metadata for a Relativity review set: name, document count, "
                "status, and reviewer assignments. Does NOT return per-document "
                "coding decisions or document text — review-set-level counts only."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "integer",
                        "description": "Workspace ArtifactID. Defaults to RELATIVITY_DEFAULT_WORKSPACE_ID if set.",
                    },
                    "review_set_id": {
                        "type": "integer",
                        "description": "ArtifactID of the review set to retrieve.",
                    },
                },
                "required": ["review_set_id"],
            },
        ),
        Tool(
            name="get_saved_search_summary",
            description=(
                "Get the definition of a Relativity saved search: name, conditions, "
                "field list, owner, and modification date. Returns the search "
                "definition only — NOT the document results of executing the search. "
                "Search conditions are not logged (privilege-aware posture)."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "integer",
                        "description": "Workspace ArtifactID. Defaults to RELATIVITY_DEFAULT_WORKSPACE_ID if set.",
                    },
                    "search_artifact_id": {
                        "type": "integer",
                        "description": "ArtifactID of the saved search.",
                    },
                },
                "required": ["search_artifact_id"],
            },
        ),
        Tool(
            name="list_saved_searches",
            description=(
                "List saved searches in a Relativity workspace. Returns search "
                "names, ArtifactIDs, owners, and last-modified dates. Use "
                "get_saved_search_summary to read a specific search's conditions."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "workspace_id": {
                        "type": "integer",
                        "description": "Workspace ArtifactID. Defaults to RELATIVITY_DEFAULT_WORKSPACE_ID if set.",
                    },
                    "length": {
                        "type": "integer",
                        "description": "Max results to return (default: page size from env)",
                    },
                },
            },
        ),
    ]


# ----- Tool dispatch -----


def _resolve_workspace_id(arguments: dict[str, Any]) -> int:
    """Resolve workspace_id from arguments or the DEFAULT_WORKSPACE_ID env var."""
    ws_id = arguments.get("workspace_id") or DEFAULT_WORKSPACE_ID
    if not ws_id:
        raise ValueError(
            "workspace_id is required (or set RELATIVITY_DEFAULT_WORKSPACE_ID)"
        )
    return int(ws_id)


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    # ---- list_workspaces ----
    if name == "list_workspaces":
        start = arguments.get("start", 1)
        length = arguments.get("length", PAGE_SIZE)
        # Workspace Manager: GET /Relativity.Rest/api/relativity-environment/v1/workspace/
        # Returns a paged list of workspaces. The /summary helper gives doc counts.
        result = await rel_get(
            WS_MANAGER_BASE,
            params={"start": start, "length": length},
        )
        workspaces = result.get("Results", result.get("Workspaces", [result]))
        log_invocation("list_workspaces", len(workspaces) if isinstance(workspaces, list) else 1)
        return [TextContent(type="text", text=str({"workspaces": workspaces, "_start": start}))]

    # ---- get_workspace_summary ----
    if name == "get_workspace_summary":
        workspace_id = int(arguments["workspace_id"])
        # Workspace Manager summary helper: GET /{workspaceID}/summary
        # Returns document count and total file size for the workspace.
        summary = await rel_get(f"{WS_MANAGER_BASE}/{workspace_id}/summary")
        log_invocation("get_workspace_summary", 1)
        return [TextContent(type="text", text=str(summary))]

    # ---- get_review_set_metadata ----
    if name == "get_review_set_metadata":
        workspace_id = _resolve_workspace_id(arguments)
        review_set_id = int(arguments["review_set_id"])

        # Review Sets are RDOs. Query the Object Manager with the review set's
        # ArtifactTypeID (resolved from the object type registry at first call).
        artifact_type_id = await resolve_review_set_artifact_type_id(workspace_id)

        # Fetch metadata fields for the specific review set.
        # We request operational metadata only: Name, Status, document count fields.
        # The exact field names depend on the Review application version in your tenant.
        result = await rel_post(
            f"{OBJ_MANAGER_BASE}/{workspace_id}/object/read",
            {
                "request": {
                    "Object": {"ArtifactID": review_set_id},
                    "Fields": [
                        {"Name": "Name"},
                        {"Name": "Status"},
                        {"Name": "Total Documents"},
                        {"Name": "Reviewed Documents"},
                        {"Name": "Reviewers"},
                    ],
                }
            },
        )

        # Build a metadata-only response. Strip any fields that surface
        # per-document coding values — those are privileged review work product.
        review_set_meta = {
            "artifact_id": review_set_id,
            "workspace_id": workspace_id,
            "artifact_type_id": artifact_type_id,
            "fields": result.get("Object", {}).get("FieldValues", []),
            "_note": (
                "Review-set-level metadata only. Per-document coding values "
                "are not surfaced by this tool."
            ),
        }
        log_invocation("get_review_set_metadata", 1)
        return [TextContent(type="text", text=str(review_set_meta))]

    # ---- get_saved_search_summary ----
    if name == "get_saved_search_summary":
        workspace_id = _resolve_workspace_id(arguments)
        search_artifact_id = int(arguments["search_artifact_id"])

        # Keyword Search Manager: ReadSingleAsync returns the saved search DTO
        # with name, conditions, field list, owner, and modification metadata.
        # Search conditions can reveal attorney review strategy — they are returned
        # to the Claude session but are never written to logs (see log_invocation).
        result = await rel_post(
            f"{SEARCH_MANAGER_BASE}/ReadSingleAsync",
            {
                "workspaceArtifactID": workspace_id,
                "searchArtifactID": search_artifact_id,
            },
        )
        # Return the DTO as-is; it does not include document results.
        # log_invocation omits the search conditions intentionally.
        log_invocation("get_saved_search_summary", 1)
        return [TextContent(type="text", text=str(result))]

    # ---- list_saved_searches ----
    if name == "list_saved_searches":
        workspace_id = _resolve_workspace_id(arguments)
        length = arguments.get("length", PAGE_SIZE)

        # Keyword Search Manager: QueryAsync returns a paged list of saved search
        # folder items. An empty Condition string returns all accessible searches.
        result = await rel_post(
            f"{SEARCH_MANAGER_BASE}/QueryAsync",
            {
                "workspaceArtifactID": workspace_id,
                "query": {"Condition": "", "Sorts": []},
                "length": length,
            },
        )
        results = result.get("Results", [])
        # Return names, ArtifactIDs, and modification dates — not conditions.
        slim = [
            {
                "ArtifactID": item.get("ArtifactID"),
                "Name": item.get("Name"),
                "Owner": item.get("Owner"),
                "SystemLastModifiedBy": item.get("SystemLastModifiedBy"),
                "SystemLastModifiedOn": item.get("SystemLastModifiedOn"),
            }
            for item in results
        ]
        log_invocation("list_saved_searches", len(slim))
        return [TextContent(type="text", text=str({"saved_searches": slim, "total_count": result.get("TotalCount")}))]

    raise ValueError(f"Unknown tool: {name}")


# ----- Entrypoint -----


async def main() -> None:
    require_config()
    async with stdio_server() as (read, write):
        await server.run(read, write, server.create_initialization_options())


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
