"""
clari-revops-mcp — MCP server for Clari revenue-operations workflows.

Exposes three read-only tools:
  - get_forecast: submits a Forecast export job, polls until DONE, returns rows
  - get_pipeline_changes: fetches audit events for stage/amount/close-date changes
  - get_deal_risk: fetches Clari AI risk scores and trend history for opportunities

All tools are read-only. No ingestion, no mutation.

Clari API reference: https://developer.clari.com/documentation/external_spec
Authentication: apikey header (org-scoped token from Account Settings → API Token)

STATUS: scaffold — not runtime-tested. Adapt forecast IDs, field names, and
polling parameters to your org before use. See README.md for setup instructions.

Run as: python -m clari_revops_mcp.server
"""

from __future__ import annotations

import asyncio
import os
from typing import Any

import httpx
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ----- Configuration (read from env at startup) -----

CLARI_API_TOKEN = os.environ.get("CLARI_API_TOKEN")
CLARI_BASE_URL = os.environ.get("CLARI_BASE_URL", "https://api.clari.com/v5").rstrip("/")
CLARI_FORECAST_ID = os.environ.get("CLARI_FORECAST_ID", "")

# Async job polling: how many attempts and how long to wait between them.
# Defaults give a 60-second ceiling (12 × 5 s). Raise CLARI_POLL_MAX_ATTEMPTS
# for large orgs where export jobs take longer than 60 seconds.
CLARI_POLL_MAX_ATTEMPTS = int(os.environ.get("CLARI_POLL_MAX_ATTEMPTS", "12"))
CLARI_POLL_INTERVAL_SECONDS = float(os.environ.get("CLARI_POLL_INTERVAL_SECONDS", "5"))

# Hard cap on records returned per tool call to keep response payloads tractable.
MAX_RECORDS = 200

# Audit event types relevant to pipeline review. Clari's audit log is broad;
# we filter to the events that indicate deal movement, not UI navigation.
PIPELINE_AUDIT_EVENTS = [
    "OPPORTUNITY_STAGE_CHANGED",
    "OPPORTUNITY_AMOUNT_CHANGED",
    "OPPORTUNITY_CLOSE_DATE_CHANGED",
    "OPPORTUNITY_OWNER_CHANGED",
    "ADJUSTMENT_CREATED",
    "ADJUSTMENT_UPDATED",
]


def require_config() -> None:
    if not CLARI_API_TOKEN:
        raise RuntimeError(
            "CLARI_API_TOKEN env var is required. "
            "Generate a token in Clari Account Settings → API Token."
        )
    if not CLARI_BASE_URL:
        raise RuntimeError("CLARI_BASE_URL env var is required.")


def auth_headers() -> dict[str, str]:
    return {
        "apikey": CLARI_API_TOKEN or "",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


# ----- Clari REST helpers -----


async def clari_get(path: str, params: dict[str, Any] | None = None) -> Any:
    """GET request against the Clari API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(
            f"{CLARI_BASE_URL}{path}",
            headers=auth_headers(),
            params=params,
        )
        r.raise_for_status()
        return r.json() if r.content else {}


async def clari_post(path: str, body: dict[str, Any]) -> Any:
    """POST request against the Clari API."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{CLARI_BASE_URL}{path}",
            headers=auth_headers(),
            json=body,
        )
        r.raise_for_status()
        return r.json() if r.content else {}


async def clari_patch(path: str, body: dict[str, Any]) -> Any:
    """PATCH request against the Clari API (used for job cancellation)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.patch(
            f"{CLARI_BASE_URL}{path}",
            headers=auth_headers(),
            json=body,
        )
        r.raise_for_status()
        return r.json() if r.content else {}


# ----- Async job helpers -----


async def submit_forecast_export(
    forecast_id: str,
    time_period: str | None = None,
    scope_id: str | None = None,
    currency: str | None = None,
) -> str:
    """
    Submit a Forecast export job via POST /export/forecast/{forecastId}.
    Returns the jobId string.

    Clari's Forecast API is asynchronous: you submit a job, get a jobId,
    poll GET /export/jobs/{jobId} until status=DONE, then download
    GET /export/jobs/{jobId}/results.
    """
    params: dict[str, Any] = {"exportFormat": "JSON"}
    if time_period:
        params["timePeriod"] = time_period
    if scope_id:
        params["scopeId"] = scope_id
    if currency:
        params["currency"] = currency

    # Clari's forecast export uses POST with query params (not request body)
    # per the API spec at developer.clari.com/documentation/external_spec
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            f"{CLARI_BASE_URL}/export/forecast/{forecast_id}",
            headers=auth_headers(),
            params=params,
        )
        r.raise_for_status()
        data = r.json()

    job_id = data.get("jobId")
    if not job_id:
        raise ValueError(
            f"Clari did not return a jobId. Response: {data}. "
            "Check that the forecast_id is valid (from the Forecast Tab URL)."
        )
    return job_id


async def poll_export_job(job_id: str) -> dict[str, Any]:
    """
    Poll GET /export/jobs/{jobId} until status=DONE (or a terminal failure).
    Returns the completed job object.

    Terminal statuses per Clari API spec: DONE, FAILED, CANCELLED, ABORTED.
    SCHEDULED and STARTED are in-progress.
    """
    for attempt in range(CLARI_POLL_MAX_ATTEMPTS):
        job = await clari_get(f"/export/jobs/{job_id}")
        status = job.get("status", "UNKNOWN")
        if status == "DONE":
            return job
        if status in ("FAILED", "CANCELLED", "ABORTED"):
            raise RuntimeError(
                f"Clari export job {job_id} ended with status={status}. "
                f"Full response: {job}"
            )
        # SCHEDULED or STARTED — wait and retry
        if attempt < CLARI_POLL_MAX_ATTEMPTS - 1:
            await asyncio.sleep(CLARI_POLL_INTERVAL_SECONDS)

    raise TimeoutError(
        f"Clari export job {job_id} did not complete within "
        f"{CLARI_POLL_MAX_ATTEMPTS * CLARI_POLL_INTERVAL_SECONDS:.0f} seconds. "
        f"Raise CLARI_POLL_MAX_ATTEMPTS (currently {CLARI_POLL_MAX_ATTEMPTS}) "
        "in your environment to extend the polling window."
    )


async def download_export_results(job_id: str) -> Any:
    """
    Download GET /export/jobs/{jobId}/results once status=DONE.
    Returns the parsed JSON response.
    """
    return await clari_get(f"/export/jobs/{job_id}/results")


# ----- Server + tool registry -----

server = Server("clari-revops")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_forecast",
            description=(
                "Submit a Clari Forecast export job, poll until DONE, and return "
                "forecast rows (quota, commit, best_case, crm_total, adjustments). "
                "Read-only. Takes 5-30 seconds due to Clari's async export model. "
                "Uses CLARI_FORECAST_ID from env if forecast_id is not supplied."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "forecast_id": {
                        "type": "string",
                        "description": (
                            "Clari forecast config UUID (from the Forecast Tab URL). "
                            "Defaults to CLARI_FORECAST_ID env var."
                        ),
                    },
                    "time_period": {
                        "type": "string",
                        "description": (
                            "Time period for the forecast, e.g. 'Q2-2026'. "
                            "Omit to use Clari's current period default."
                        ),
                    },
                    "scope_id": {
                        "type": "string",
                        "description": (
                            "Scope ID to filter by team or segment. "
                            "Omit for org-wide."
                        ),
                    },
                    "currency": {
                        "type": "string",
                        "description": "ISO 4217 currency code, e.g. 'USD'. Defaults to org currency.",
                    },
                },
            },
        ),
        Tool(
            name="get_pipeline_changes",
            description=(
                "Fetch Clari audit events for pipeline-relevant changes — stage moves, "
                "amount edits, close-date pushes, owner changes — within a date window. "
                "Returns up to 200 events, newest first. Read-only."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "start_date": {
                        "type": "string",
                        "description": "ISO 8601 date or datetime, e.g. '2026-05-01' or '2026-05-01T00:00:00Z'.",
                    },
                    "end_date": {
                        "type": "string",
                        "description": "ISO 8601 date or datetime, e.g. '2026-05-22' or '2026-05-22T23:59:59Z'.",
                    },
                    "limit": {
                        "type": "integer",
                        "default": 100,
                        "description": "Max events to return (1–200).",
                    },
                },
                "required": ["start_date", "end_date"],
            },
        ),
        Tool(
            name="get_deal_risk",
            description=(
                "Fetch Clari AI risk scores (crmScore), trend history, and key field "
                "values for a list of CRM opportunity IDs. Accepts up to 100 IDs. "
                "Read-only."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "opp_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of CRM opportunity IDs (max 100).",
                        "maxItems": 100,
                    },
                },
                "required": ["opp_ids"],
            },
        ),
    ]


# ----- Tool dispatch -----


@server.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
    require_config()

    # ------------------------------------------------------------------
    # get_forecast
    # ------------------------------------------------------------------
    if name == "get_forecast":
        forecast_id = arguments.get("forecast_id") or CLARI_FORECAST_ID
        if not forecast_id:
            raise ValueError(
                "forecast_id is required either as an argument or via the "
                "CLARI_FORECAST_ID environment variable."
            )

        time_period = arguments.get("time_period")
        scope_id = arguments.get("scope_id")
        currency = arguments.get("currency")

        # Step 1: submit the export job
        job_id = await submit_forecast_export(
            forecast_id=forecast_id,
            time_period=time_period,
            scope_id=scope_id,
            currency=currency,
        )

        # Step 2: poll until DONE
        await poll_export_job(job_id)

        # Step 3: download results
        results = await download_export_results(job_id)

        # Clari returns forecast rows in a top-level array or nested key.
        # The exact shape depends on exportFormat=JSON. We return up to
        # MAX_RECORDS rows to keep the context window tractable.
        rows = results if isinstance(results, list) else results.get("rows", results)
        if isinstance(rows, list):
            rows = rows[:MAX_RECORDS]

        return [
            TextContent(
                type="text",
                text=str(
                    {
                        "job_id": job_id,
                        "forecast_id": forecast_id,
                        "time_period": time_period,
                        "rows_returned": len(rows) if isinstance(rows, list) else "n/a",
                        "data": rows,
                    }
                ),
            )
        ]

    # ------------------------------------------------------------------
    # get_pipeline_changes
    # ------------------------------------------------------------------
    if name == "get_pipeline_changes":
        start_date = arguments["start_date"]
        end_date = arguments["end_date"]
        limit = min(int(arguments.get("limit", 100)), MAX_RECORDS)

        # Clari's Audit API: GET /audit/events with date filters.
        # The API accepts dateFrom and dateTo as query parameters.
        # We filter to pipeline-relevant event types client-side because
        # Clari's `event` query param accepts a single event type, not an array.
        # We fetch up to limit * 2 raw events and filter down to the types
        # we care about, capping at limit.
        all_events: list[dict[str, Any]] = []
        fetch_limit = min(limit * 2, 1000)  # Clari API max per page is 1000

        raw = await clari_get(
            "/audit/events",
            params={
                "dateFrom": start_date,
                "dateTo": end_date,
                "limit": fetch_limit,
            },
        )

        # Clari returns { activities: [...], nextLink: "..." }
        activities = raw if isinstance(raw, list) else raw.get("activities", [])

        for event in activities:
            event_type = event.get("event", "")
            if event_type in PIPELINE_AUDIT_EVENTS:
                all_events.append(event)
            if len(all_events) >= limit:
                break

        return [
            TextContent(
                type="text",
                text=str(
                    {
                        "start_date": start_date,
                        "end_date": end_date,
                        "events_returned": len(all_events),
                        "event_types_filtered": PIPELINE_AUDIT_EVENTS,
                        "events": all_events,
                    }
                ),
            )
        ]

    # ------------------------------------------------------------------
    # get_deal_risk
    # ------------------------------------------------------------------
    if name == "get_deal_risk":
        opp_ids: list[str] = arguments.get("opp_ids", [])
        if not opp_ids:
            raise ValueError("opp_ids must be a non-empty list of opportunity IDs.")
        if len(opp_ids) > 100:
            raise ValueError(
                f"get_deal_risk accepts up to 100 opportunity IDs per call; "
                f"{len(opp_ids)} were supplied. "
                "Batch your IDs into chunks of 100."
            )

        # Clari Opportunity API: GET /opportunity?oppId=id1&oppId=id2...
        # The `oppId` parameter is repeatable (array).
        # httpx handles list params natively when passed as a list of tuples.
        params: list[tuple[str, str]] = [("oppId", oid) for oid in opp_ids]

        raw = await clari_get("/opportunity", params=params)  # type: ignore[arg-type]

        # Clari returns an array of opportunity objects, each with:
        # { id, crmScore, trendHistory: [...], fields: {...} }
        opps = raw if isinstance(raw, list) else raw.get("opportunities", raw)

        return [
            TextContent(
                type="text",
                text=str(
                    {
                        "opp_ids_requested": opp_ids,
                        "opps_returned": len(opps) if isinstance(opps, list) else "n/a",
                        "opportunities": opps,
                    }
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
    asyncio.run(main())
