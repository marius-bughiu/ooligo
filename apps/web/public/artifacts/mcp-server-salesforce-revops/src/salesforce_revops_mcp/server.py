"""
salesforce-revops-mcp — MCP server tuned for revenue-operations workflows on Salesforce.

Exposes object reads (Account, Opportunity, Contact, Lead), a SELECT-only SOQL
endpoint, three RevOps helpers (pipeline_by_stage, stale_opps, at_risk_commits),
and two audit-aware light writes (add_note, update_field). Read-mostly by design;
every write requires a justification and lands in a custom Cleanup_Audit__c row
before the field is touched.

STATUS: scaffold — not runtime-tested. Adapt the audit object name, picklist
labels, and field-level permissions to your org before use.

Run as: python -m salesforce_revops_mcp.server
"""

from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

SFDC_INSTANCE_URL = os.environ.get("SFDC_INSTANCE_URL", "").rstrip("/")
SFDC_ACCESS_TOKEN = os.environ.get("SFDC_ACCESS_TOKEN")
SFDC_API_VERSION = os.environ.get("SFDC_API_VERSION", "v60.0")
SFDC_AUDIT_OBJECT = os.environ.get("SFDC_AUDIT_OBJECT", "Cleanup_Audit__c")
SFDC_COMMIT_STAGE_NAME = os.environ.get("SFDC_COMMIT_STAGE_NAME", "Commit")

# Hard cap for any single REST call we make. Keeps us inside Salesforce's
# 200-record per-batch envelope on bulk endpoints and gives callers a
# predictable token budget on read tools.
MAX_RECORDS_PER_REQUEST = 200

# DML keywords we refuse in the read-only SOQL endpoint. SOQL itself is
# read-only — there is no UPDATE/DELETE/INSERT in the language — but we
# explicitly refuse strings that look like SOSL or apex anonymous to make
# the intent loud.
DML_KEYWORDS = (
    "INSERT",
    "UPDATE",
    "DELETE",
    "UPSERT",
    "MERGE",
    "FIND",  # SOSL
    "EXEC",  # apex anonymous-ish
)


def require_config() -> None:
    if not SFDC_INSTANCE_URL:
        raise RuntimeError("SFDC_INSTANCE_URL env var is required")
    if not SFDC_ACCESS_TOKEN:
        raise RuntimeError("SFDC_ACCESS_TOKEN env var is required")


def auth_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {SFDC_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }


# ----- Salesforce REST helpers -----


async def sf_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{SFDC_INSTANCE_URL}{path}", headers=auth_headers(), params=params
        )
        r.raise_for_status()
        return r.json()


async def sf_post(path: str, body: dict[str, Any]) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{SFDC_INSTANCE_URL}{path}", headers=auth_headers(), json=body
        )
        r.raise_for_status()
        return r.json() if r.content else {}


async def sf_patch(path: str, body: dict[str, Any]) -> None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.patch(
            f"{SFDC_INSTANCE_URL}{path}", headers=auth_headers(), json=body
        )
        r.raise_for_status()


async def sf_query(soql: str) -> dict[str, Any]:
    return await sf_get(f"/services/data/{SFDC_API_VERSION}/query", {"q": soql})


# ----- SOQL safety -----


def harden_soql(raw: str) -> str:
    """
    Validate a user-provided SOQL string.

    - Strip leading/trailing whitespace.
    - Refuse non-SELECT or DML-flavoured input.
    - Inject `LIMIT MAX_RECORDS_PER_REQUEST` if no LIMIT clause present.
    - Inject `WITH SECURITY_ENFORCED` if missing, so FLS errors surface
      instead of silent partial reads.
    """
    soql = raw.strip().rstrip(";").strip()
    if not soql:
        raise ValueError("SOQL string is empty.")
    upper = soql.upper()
    if not upper.startswith("SELECT"):
        raise ValueError("Only SELECT statements are allowed.")
    for kw in DML_KEYWORDS:
        # match whole-word; avoid flagging fields like "Description"
        if re.search(rf"\b{kw}\b", upper):
            raise ValueError(f"Refusing SOQL containing forbidden keyword: {kw}")

    if "WITH SECURITY_ENFORCED" not in upper:
        # Insert just before LIMIT/ORDER BY if present, else append.
        m = re.search(r"\b(LIMIT|ORDER\s+BY|GROUP\s+BY)\b", soql, re.IGNORECASE)
        if m:
            idx = m.start()
            soql = soql[:idx].rstrip() + " WITH SECURITY_ENFORCED " + soql[idx:]
        else:
            soql = soql + " WITH SECURITY_ENFORCED"

    if not re.search(r"\bLIMIT\b", soql, re.IGNORECASE):
        soql = f"{soql} LIMIT {MAX_RECORDS_PER_REQUEST}"
    return soql


# ----- Server + tool registry -----

server = Server("salesforce-revops")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_account",
            description="Fetch full fields for an Account by Id.",
            inputSchema={
                "type": "object",
                "properties": {"account_id": {"type": "string"}},
                "required": ["account_id"],
            },
        ),
        Tool(
            name="get_opportunity",
            description="Fetch full fields + owner for an Opportunity by Id.",
            inputSchema={
                "type": "object",
                "properties": {"opp_id": {"type": "string"}},
                "required": ["opp_id"],
            },
        ),
        Tool(
            name="get_contact",
            description="Fetch full fields for a Contact by Id.",
            inputSchema={
                "type": "object",
                "properties": {"contact_id": {"type": "string"}},
                "required": ["contact_id"],
            },
        ),
        Tool(
            name="get_lead",
            description="Fetch full fields for a Lead by Id.",
            inputSchema={
                "type": "object",
                "properties": {"lead_id": {"type": "string"}},
                "required": ["lead_id"],
            },
        ),
        Tool(
            name="query",
            description=(
                "Run a read-only SOQL SELECT statement. Refuses INSERT/UPDATE/"
                "DELETE/UPSERT/MERGE. Auto-injects WITH SECURITY_ENFORCED and "
                "caps LIMIT at 200 if missing. bypass_sharing must be False."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "soql": {"type": "string"},
                    "bypass_sharing": {"type": "boolean", "default": False},
                },
                "required": ["soql"],
            },
        ),
        Tool(
            name="pipeline_by_stage",
            description=(
                "Open Opportunities closing within close_date_window_days, aggregated "
                "by StageName. Optional owner_id filter."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "close_date_window_days": {"type": "integer", "default": 90},
                    "owner_id": {"type": "string"},
                },
            },
        ),
        Tool(
            name="stale_opps",
            description=(
                "Open Opportunities whose LastStageChangeDate is older than "
                "days_in_stage_threshold."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "days_in_stage_threshold": {"type": "integer", "default": 30}
                },
            },
        ),
        Tool(
            name="at_risk_commits",
            description=(
                "Commit-stage Opportunities whose LastActivityDate > 14 days ago, "
                "or whose CloseDate is within 14 days of quarter_end_date."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "quarter_end_date": {
                        "type": "string",
                        "description": "ISO date, e.g. 2026-06-30",
                    }
                },
                "required": ["quarter_end_date"],
            },
        ),
        Tool(
            name="add_note",
            description=(
                "Create a ContentNote and link it to a parent record via "
                "ContentDocumentLink."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "object_type": {
                        "type": "string",
                        "enum": ["Account", "Opportunity", "Contact", "Lead"],
                    },
                    "object_id": {"type": "string"},
                    "body": {"type": "string"},
                },
                "required": ["object_type", "object_id", "body"],
            },
        ),
        Tool(
            name="update_field",
            description=(
                "Update a single field on a single record. Justification is "
                "mandatory and must be at least 10 chars; an audit row is written "
                "to Cleanup_Audit__c (or SFDC_AUDIT_OBJECT) before the update."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "object_type": {
                        "type": "string",
                        "enum": ["Account", "Opportunity", "Contact", "Lead"],
                    },
                    "object_id": {"type": "string"},
                    "field_name": {"type": "string"},
                    "new_value": {
                        "description": "New value (string, number, or boolean).",
                    },
                    "justification": {
                        "type": "string",
                        "minLength": 10,
                    },
                },
                "required": [
                    "object_type",
                    "object_id",
                    "field_name",
                    "new_value",
                    "justification",
                ],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    if name == "get_account":
        data = await sf_get(
            f"/services/data/{SFDC_API_VERSION}/sobjects/Account/{arguments['account_id']}"
        )
        return [TextContent(type="text", text=str(data))]

    if name == "get_opportunity":
        data = await sf_get(
            f"/services/data/{SFDC_API_VERSION}/sobjects/Opportunity/{arguments['opp_id']}"
        )
        return [TextContent(type="text", text=str(data))]

    if name == "get_contact":
        data = await sf_get(
            f"/services/data/{SFDC_API_VERSION}/sobjects/Contact/{arguments['contact_id']}"
        )
        return [TextContent(type="text", text=str(data))]

    if name == "get_lead":
        data = await sf_get(
            f"/services/data/{SFDC_API_VERSION}/sobjects/Lead/{arguments['lead_id']}"
        )
        return [TextContent(type="text", text=str(data))]

    if name == "query":
        if arguments.get("bypass_sharing", False):
            raise ValueError(
                "bypass_sharing=True is not supported in this scaffold; "
                "use a Tooling-API client and a documented justification."
            )
        soql = harden_soql(arguments["soql"])
        result = await sf_query(soql)
        # Cap returned record count even if Salesforce paginated.
        records = result.get("records", [])[:MAX_RECORDS_PER_REQUEST]
        return [
            TextContent(
                type="text",
                text=str({"totalSize": result.get("totalSize"), "records": records}),
            )
        ]

    if name == "pipeline_by_stage":
        window = arguments.get("close_date_window_days", 90)
        cutoff = (datetime.now(timezone.utc) + timedelta(days=window)).date().isoformat()
        owner_clause = ""
        if owner := arguments.get("owner_id"):
            # Single-quote escape: SOQL strings use single quotes and \\' escapes them.
            safe = owner.replace("'", "\\'")
            owner_clause = f" AND OwnerId = '{safe}'"
        soql = (
            "SELECT StageName, COUNT(Id) opps, SUM(Amount) total "
            "FROM Opportunity "
            f"WHERE IsClosed = false AND CloseDate <= {cutoff}{owner_clause} "
            "GROUP BY StageName"
        )
        soql = harden_soql(soql)
        result = await sf_query(soql)
        return [TextContent(type="text", text=str(result))]

    if name == "stale_opps":
        threshold = arguments.get("days_in_stage_threshold", 30)
        cutoff = (
            datetime.now(timezone.utc) - timedelta(days=threshold)
        ).date().isoformat()
        soql = (
            "SELECT Id, Name, StageName, Amount, OwnerId, LastStageChangeDate "
            "FROM Opportunity "
            f"WHERE IsClosed = false AND LastStageChangeDate <= {cutoff} "
            "ORDER BY LastStageChangeDate ASC"
        )
        soql = harden_soql(soql)
        result = await sf_query(soql)
        return [TextContent(type="text", text=str(result))]

    if name == "at_risk_commits":
        # Validate the supplied quarter_end_date to fail before hitting the API.
        try:
            qe = datetime.fromisoformat(arguments["quarter_end_date"]).date()
        except ValueError as exc:
            raise ValueError("quarter_end_date must be ISO format YYYY-MM-DD") from exc

        activity_cutoff = (
            datetime.now(timezone.utc) - timedelta(days=14)
        ).date().isoformat()
        close_window_start = (qe - timedelta(days=14)).isoformat()
        close_window_end = qe.isoformat()
        # Single-quote escape on the picklist label.
        commit = SFDC_COMMIT_STAGE_NAME.replace("'", "\\'")
        soql = (
            "SELECT Id, Name, AccountId, Amount, CloseDate, OwnerId, "
            "LastActivityDate, StageName "
            "FROM Opportunity "
            f"WHERE IsClosed = false AND StageName = '{commit}' AND "
            f"(LastActivityDate <= {activity_cutoff} OR "
            f"(CloseDate >= {close_window_start} AND CloseDate <= {close_window_end})) "
            "ORDER BY CloseDate ASC"
        )
        soql = harden_soql(soql)
        result = await sf_query(soql)
        return [TextContent(type="text", text=str(result))]

    if name == "add_note":
        # Step 1: create the ContentNote (Title + Content, base64-encoded).
        import base64

        body_b64 = base64.b64encode(arguments["body"].encode("utf-8")).decode("ascii")
        note = await sf_post(
            f"/services/data/{SFDC_API_VERSION}/sobjects/ContentNote",
            {
                "Title": f"Claude note on {arguments['object_type']} {arguments['object_id']}",
                "Content": body_b64,
            },
        )
        # Step 2: link via ContentDocumentLink.
        await sf_post(
            f"/services/data/{SFDC_API_VERSION}/sobjects/ContentDocumentLink",
            {
                "ContentDocumentId": note["id"],
                "LinkedEntityId": arguments["object_id"],
                "ShareType": "V",  # Viewer
                "Visibility": "AllUsers",
            },
        )
        return [
            TextContent(
                type="text",
                text=(
                    f"Added note {note['id']} to "
                    f"{arguments['object_type']} {arguments['object_id']}"
                ),
            )
        ]

    if name == "update_field":
        justification = (arguments.get("justification") or "").strip()
        if len(justification) < 10:
            raise ValueError(
                "justification is mandatory and must be at least 10 characters."
            )

        object_type = arguments["object_type"]
        object_id = arguments["object_id"]
        field_name = arguments["field_name"]
        new_value = arguments["new_value"]

        # Step 1: read the current value so we can store old_value in the audit row.
        try:
            current = await sf_get(
                f"/services/data/{SFDC_API_VERSION}/sobjects/{object_type}/{object_id}",
                {"fields": field_name},
            )
            old_value = current.get(field_name)
        except httpx.HTTPStatusError:
            old_value = None

        # Step 2: write the audit row FIRST. If this fails, do not mutate.
        await sf_post(
            f"/services/data/{SFDC_API_VERSION}/sobjects/{SFDC_AUDIT_OBJECT}",
            {
                "Object_Name__c": object_type,
                "Record_Id__c": object_id,
                "Field_Name__c": field_name,
                "Old_Value__c": str(old_value) if old_value is not None else "",
                "New_Value__c": str(new_value),
                "Justification__c": justification,
                "Performed_By__c": "claude-mcp",
            },
        )

        # Step 3: perform the field update.
        await sf_patch(
            f"/services/data/{SFDC_API_VERSION}/sobjects/{object_type}/{object_id}",
            {field_name: new_value},
        )
        return [
            TextContent(
                type="text",
                text=(
                    f"Updated {object_type} {object_id}.{field_name} "
                    f"(old={old_value!r}, new={new_value!r}); audit row written."
                ),
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
