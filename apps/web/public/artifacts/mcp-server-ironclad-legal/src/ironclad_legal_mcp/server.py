"""
ironclad-legal-mcp — MCP server tuned for in-house legal teams using Ironclad.

Exposes object-read tools (workflows, records, documents), search tools,
two legal helpers (clauses_by_type, expiring_contracts), one audit-class
summary (summarize_workflow, truncate-by-default), and one privileged
write (add_comment). Read-mostly by design — drafts inside active
workflows are typically privileged work product, so document bodies are
truncated by default and the user must request the full body via an
explicit second tool call.

STATUS: scaffold — not runtime-tested. Adapt the workflow type names,
clause-type vocabulary, custom-property paths, and (in particular) the
public API base path to your tenant before use. Some Ironclad tiers use
a regional subdomain.

Run as: python -m ironclad_legal_mcp.server
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

IRONCLAD_API_TOKEN = os.environ.get("IRONCLAD_API_TOKEN")
TRUNCATE_AT = int(os.environ.get("IRONCLAD_TRUNCATE_AT", "4000"))
DEFAULT_WORKFLOW_TYPES = [
    s.strip()
    for s in os.environ.get("IRONCLAD_DEFAULT_WORKFLOW_TYPES", "").split(",")
    if s.strip()
]

API_BASE = "https://ironcladapp.com/public/api/v1"

# Privilege-aware logger: NEVER include query strings, document bodies, or
# clause text in log records. Only metadata: timestamp, user, tool name,
# result count. Surfacing query text would create a discoverable record
# of legal review strategy.
audit_log = logging.getLogger("ironclad_legal_mcp.audit")


def require_config() -> None:
    if not IRONCLAD_API_TOKEN:
        raise RuntimeError("IRONCLAD_API_TOKEN env var is required")


def auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {IRONCLAD_API_TOKEN}",
        "Content-Type": "application/json",
    }


def log_invocation(tool: str, result_count: int | None = None) -> None:
    """Metadata-only audit record. Never includes query text or body."""
    audit_log.info(
        "tool=%s ts=%s results=%s",
        tool,
        datetime.now(timezone.utc).isoformat(),
        result_count if result_count is not None else "n/a",
    )


def truncate_body(body: str | None) -> dict[str, Any]:
    """Return a body field that is truncated to TRUNCATE_AT chars, with a
    `_truncated_at` marker so Claude knows to issue a follow-up
    explicit get_document call when the user asks for the full text."""
    if body is None:
        return {"text": None, "_truncated_at": None}
    if len(body) <= TRUNCATE_AT:
        return {"text": body, "_truncated_at": None}
    return {
        "text": body[:TRUNCATE_AT],
        "_truncated_at": TRUNCATE_AT,
        "_full_length": len(body),
        "_hint": "Call get_document(document_id, version) for the full body.",
    }


# ----- Ironclad HTTP helpers -----


async def ic_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(f"{API_BASE}{path}", headers=auth_headers(), params=params)
        r.raise_for_status()
        return r.json()


async def ic_post(path: str, body: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{API_BASE}{path}", headers=auth_headers(), json=body)
        r.raise_for_status()
        return r.json()


# ----- Server + tool registry -----

server = Server("ironclad-legal")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_workflow",
            description=(
                "Fetch workflow metadata, current step, and participant list "
                "by workflow ID. Does not include document bodies — use "
                "summarize_workflow for that, then get_document for full text."
            ),
            inputSchema={
                "type": "object",
                "properties": {"workflow_id": {"type": "string"}},
                "required": ["workflow_id"],
            },
        ),
        Tool(
            name="get_record",
            description=(
                "Fetch an executed-contract record (post-signature repository "
                "entry) by record ID. Returns metadata + linked document IDs."
            ),
            inputSchema={
                "type": "object",
                "properties": {"record_id": {"type": "string"}},
                "required": ["record_id"],
            },
        ),
        Tool(
            name="get_document",
            description=(
                "Fetch the full body of a document at a specific version. "
                "This is the explicit drill-down call the user must request "
                "after seeing a truncated body in summarize_workflow."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "document_id": {"type": "string"},
                    "version": {"type": "string"},
                },
                "required": ["document_id"],
            },
        ),
        Tool(
            name="search_records",
            description=(
                "Search the executed-contract repository by free-text query. "
                "Query string is NOT logged; only timestamp, user, and "
                "result count are recorded."
            ),
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
            name="list_workflows",
            description=(
                "List active workflows, optionally filtered by status (e.g. "
                "'in_review', 'awaiting_signature') and type (e.g. 'msa', "
                "'nda'). When type is omitted, IRONCLAD_DEFAULT_WORKFLOW_TYPES "
                "is used if set."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "status": {"type": "string"},
                    "type": {"type": "string"},
                    "limit": {"type": "integer", "default": 50},
                },
            },
        ),
        Tool(
            name="clauses_by_type",
            description=(
                "Return extracted clauses of a specific type (e.g. "
                "'indemnification', 'liability_cap', 'termination', "
                "'governing_law') from the documents attached to a workflow. "
                "Backed by Ironclad's clause-extraction model — coverage is "
                "best-effort, not authoritative for compliance attestations."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "workflow_id": {"type": "string"},
                    "clause_type": {"type": "string"},
                },
                "required": ["workflow_id", "clause_type"],
            },
        ),
        Tool(
            name="expiring_contracts",
            description=(
                "Return executed-contract records approaching renewal or "
                "expiration within window_days, sorted by next-action date "
                "ascending."
            ),
            inputSchema={
                "type": "object",
                "properties": {"window_days": {"type": "integer", "default": 90}},
            },
        ),
        Tool(
            name="summarize_workflow",
            description=(
                "Metadata-only summary of a workflow: counterparty, type, "
                "status, step history, participants, document IDs + titles. "
                "Document bodies are truncated to IRONCLAD_TRUNCATE_AT chars "
                "with a _truncated_at marker. Use get_document for full text."
            ),
            inputSchema={
                "type": "object",
                "properties": {"workflow_id": {"type": "string"}},
                "required": ["workflow_id"],
            },
        ),
        Tool(
            name="add_comment",
            description=(
                "Append a comment to an executed-contract record. The only "
                "write path exposed by this server. Comments are themselves "
                "discoverable inside Ironclad — write nothing here you would "
                "not write directly in the Ironclad UI."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "record_id": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["record_id", "body"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    if name == "get_workflow":
        data = await ic_get(f"/workflows/{arguments['workflow_id']}")
        log_invocation("get_workflow", 1)
        return [TextContent(type="text", text=str(data))]

    if name == "get_record":
        data = await ic_get(f"/records/{arguments['record_id']}")
        log_invocation("get_record", 1)
        return [TextContent(type="text", text=str(data))]

    if name == "get_document":
        params: dict[str, Any] = {}
        if v := arguments.get("version"):
            params["version"] = v
        data = await ic_get(f"/documents/{arguments['document_id']}", params or None)
        log_invocation("get_document", 1)
        return [TextContent(type="text", text=str(data))]

    if name == "search_records":
        body = {
            "query": arguments["query"],
            "limit": arguments.get("limit", 25),
        }
        result = await ic_post("/records/search", body)
        # Log result count only — never the query string itself.
        log_invocation("search_records", len(result.get("results", [])))
        return [TextContent(type="text", text=str(result))]

    if name == "list_workflows":
        params: dict[str, Any] = {"limit": arguments.get("limit", 50)}
        if status := arguments.get("status"):
            params["status"] = status
        wf_type = arguments.get("type")
        if wf_type:
            params["type"] = wf_type
        elif DEFAULT_WORKFLOW_TYPES:
            params["type"] = ",".join(DEFAULT_WORKFLOW_TYPES)
        result = await ic_get("/workflows", params)
        log_invocation("list_workflows", len(result.get("workflows", [])))
        return [TextContent(type="text", text=str(result))]

    if name == "clauses_by_type":
        wf = await ic_get(
            f"/workflows/{arguments['workflow_id']}",
            {"include": "documents,clauses"},
        )
        clause_type = arguments["clause_type"].lower()
        # Filter the workflow's surfaced clauses by type. Body of each
        # clause is left intact (clauses are short; truncation is for
        # full document bodies). If a downstream tenant has very long
        # clauses, fold truncate_body() over the `text` field here.
        clauses = []
        for doc in wf.get("documents", []):
            for c in doc.get("clauses", []):
                if c.get("type", "").lower() == clause_type:
                    clauses.append(
                        {
                            "document_id": doc.get("id"),
                            "document_title": doc.get("title"),
                            "clause_type": c.get("type"),
                            "text": c.get("text"),
                            "page": c.get("page"),
                        }
                    )
        log_invocation("clauses_by_type", len(clauses))
        return [TextContent(type="text", text=str({"clauses": clauses}))]

    if name == "expiring_contracts":
        window_days = arguments.get("window_days", 90)
        cutoff = datetime.now(timezone.utc) + timedelta(days=window_days)
        body = {
            "filters": [
                {
                    "property": "next_action_date",
                    "operator": "LTE",
                    "value": cutoff.isoformat(),
                },
                {
                    "property": "status",
                    "operator": "IN",
                    "values": ["active", "auto_renewing"],
                },
            ],
            "sort": [{"property": "next_action_date", "direction": "ASC"}],
            "limit": 200,
        }
        result = await ic_post("/records/search", body)
        log_invocation("expiring_contracts", len(result.get("results", [])))
        return [TextContent(type="text", text=str(result))]

    if name == "summarize_workflow":
        wf = await ic_get(
            f"/workflows/{arguments['workflow_id']}",
            {"include": "documents,participants,history"},
        )
        # Build a metadata-only summary. Any document body present is
        # passed through truncate_body() so the response includes a
        # _truncated_at marker that Claude reads as a hint to call
        # get_document explicitly when the user asks for the full text.
        summary = {
            "id": wf.get("id"),
            "type": wf.get("type"),
            "status": wf.get("status"),
            "counterparty": wf.get("counterparty"),
            "current_step": wf.get("current_step"),
            "participants": [
                {"id": p.get("id"), "role": p.get("role"), "email": p.get("email")}
                for p in wf.get("participants", [])
            ],
            "step_history": wf.get("history", []),
            "documents": [
                {
                    "id": d.get("id"),
                    "title": d.get("title"),
                    "version": d.get("version"),
                    "body_preview": truncate_body(d.get("body")),
                }
                for d in wf.get("documents", [])
            ],
        }
        log_invocation("summarize_workflow", len(summary["documents"]))
        return [TextContent(type="text", text=str(summary))]

    if name == "add_comment":
        body = {
            "body": arguments["body"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        result = await ic_post(
            f"/records/{arguments['record_id']}/comments", body
        )
        log_invocation("add_comment", 1)
        return [
            TextContent(
                type="text",
                text=f"Added comment {result.get('id')} to record {arguments['record_id']}",
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
