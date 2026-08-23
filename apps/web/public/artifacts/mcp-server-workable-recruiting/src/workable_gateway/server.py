"""Least-privilege MCP gateway in front of Workable's hosted MCP server.

Claude talks to this process over stdio. This process talks to
https://mcp.workable.com/mcp over Streamable HTTP with OAuth. Between the two it
applies four rules:

  1. Tool allowlist. Only tools that policy.RECRUITER_PROFILE marks ALLOW or
     CONFIRM are advertised or forwarded. Everything else - including any tool
     Workable ships after this file was written - is dark.
  2. Account pinning. Every upstream tool except get_accounts takes an `account`
     subdomain. The model never chooses it; WORKABLE_ACCOUNT does.
  3. Rate budget. A token bucket at WORKABLE_RATE_PER_SEC plus a per-process call
     ceiling, so one broad question cannot burn the tenant's API budget.
  4. Field redaction. policy.REDACT_FIELDS are stripped from every response
     before the payload enters model context.

On top of the forwarded set it defines three tools of its own:
workable_policy_report, workable_pipeline_snapshot, workable_stage_move_review.

STATUS: scaffold. Not runtime-tested against a live Workable account. See
README.md, "Limits and TODOs".
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from contextlib import AsyncExitStack
from typing import Any

import mcp.types as types
from mcp import ClientSession
from mcp.client.auth import OAuthClientProvider, TokenStorage
from mcp.client.streamable_http import streamablehttp_client
from mcp.server import NotificationOptions, Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.shared.auth import OAuthClientInformationFull, OAuthClientMetadata, OAuthToken

from .policy import RECRUITER_PROFILE, Policy, Tier

LOG = logging.getLogger("workable_gateway")

UPSTREAM_URL = os.environ.get("WORKABLE_MCP_URL", "https://mcp.workable.com/mcp")
ACCOUNT = os.environ.get("WORKABLE_ACCOUNT", "")
TOKEN_PATH = os.environ.get("WORKABLE_TOKEN_PATH", os.path.expanduser("~/.workable-gateway.json"))
CALLBACK_PORT = int(os.environ.get("WORKABLE_OAUTH_CALLBACK_PORT", "8765"))
RATE_PER_SEC = float(os.environ.get("WORKABLE_RATE_PER_SEC", "4"))
MAX_CALLS = int(os.environ.get("WORKABLE_MAX_CALLS_PER_PROCESS", "400"))
PAGE_CAP = int(os.environ.get("WORKABLE_PAGE_CAP", "5"))

POLICY: Policy = RECRUITER_PROFILE


# ---------------------------------------------------------------------------
# Rate budget
# ---------------------------------------------------------------------------


class TokenBucket:
    """Workable's OAuth bucket is 50 requests per 10 seconds (5/s sustained).

    The gateway runs at 4/s so a burst from a fan-out question leaves headroom for
    whatever else in the tenant is holding the same token. Exceeding the bucket
    upstream returns HTTP 429, and an assistant that retries walks straight back
    into it - hence a hard ceiling, not just a delay.
    """

    def __init__(self, rate_per_sec: float, capacity: float | None = None) -> None:
        self.rate = rate_per_sec
        self.capacity = capacity if capacity is not None else max(rate_per_sec, 1.0)
        self.tokens = self.capacity
        self.updated = time.monotonic()
        self._lock = asyncio.Lock()

    async def take(self) -> None:
        async with self._lock:
            while True:
                now = time.monotonic()
                self.tokens = min(self.capacity, self.tokens + (now - self.updated) * self.rate)
                self.updated = now
                if self.tokens >= 1.0:
                    self.tokens -= 1.0
                    return
                await asyncio.sleep((1.0 - self.tokens) / self.rate)


# ---------------------------------------------------------------------------
# OAuth token storage
# ---------------------------------------------------------------------------


class FileTokenStorage(TokenStorage):
    """Persists the OAuth client registration and tokens to one 0600 file.

    Workable's server advertises RFC 8414 metadata and accepts RFC 7591 dynamic
    client registration, so there is no client ID to provision by hand. The first
    run opens a browser; later runs reuse what lands here.
    """

    def __init__(self, path: str) -> None:
        self.path = path

    def _read(self) -> dict[str, Any]:
        if not os.path.exists(self.path):
            return {}
        with open(self.path, encoding="utf-8") as handle:
            return json.load(handle)

    def _write(self, data: dict[str, Any]) -> None:
        with open(self.path, "w", encoding="utf-8") as handle:
            json.dump(data, handle)
        os.chmod(self.path, 0o600)

    async def get_tokens(self) -> OAuthToken | None:
        raw = self._read().get("tokens")
        return OAuthToken.model_validate(raw) if raw else None

    async def set_tokens(self, tokens: OAuthToken) -> None:
        data = self._read()
        data["tokens"] = tokens.model_dump(mode="json", exclude_none=True)
        self._write(data)

    async def get_client_info(self) -> OAuthClientInformationFull | None:
        raw = self._read().get("client")
        return OAuthClientInformationFull.model_validate(raw) if raw else None

    async def set_client_info(self, info: OAuthClientInformationFull) -> None:
        data = self._read()
        data["client"] = info.model_dump(mode="json", exclude_none=True)
        self._write(data)


# ---------------------------------------------------------------------------
# Redaction
# ---------------------------------------------------------------------------


def redact(value: Any, fields: set[str]) -> Any:
    """Walk a decoded JSON payload and blank every key named in `fields`.

    Recursive rather than top-level: Workable nests candidate detail under
    `candidate`, and detailed search returns rows under `results`, so a shallow
    pass would miss most of what matters.
    """
    if isinstance(value, dict):
        out: dict[str, Any] = {}
        for key, item in value.items():
            if key.lower() in fields:
                out[key] = "[redacted by gateway policy]"
            else:
                out[key] = redact(item, fields)
        return out
    if isinstance(value, list):
        return [redact(item, fields) for item in value]
    return value


def redact_content(blocks: list[types.ContentBlock], fields: set[str]) -> list[types.ContentBlock]:
    out: list[types.ContentBlock] = []
    for block in blocks:
        if isinstance(block, types.TextContent):
            try:
                parsed = json.loads(block.text)
            except (json.JSONDecodeError, TypeError):
                out.append(block)
                continue
            out.append(
                types.TextContent(type="text", text=json.dumps(redact(parsed, fields), indent=2))
            )
        else:
            out.append(block)
    return out


# ---------------------------------------------------------------------------
# Upstream client
# ---------------------------------------------------------------------------


class Upstream:
    """One long-lived authenticated session against mcp.workable.com."""

    def __init__(self) -> None:
        self.session: ClientSession | None = None
        self.tools: dict[str, types.Tool] = {}
        self.bucket = TokenBucket(RATE_PER_SEC)
        self.calls = 0
        self._stack = AsyncExitStack()

    async def connect(self) -> None:
        auth = OAuthClientProvider(
            server_url=UPSTREAM_URL,
            client_metadata=OAuthClientMetadata(
                client_name="ooligo Workable gateway",
                redirect_uris=[f"http://localhost:{CALLBACK_PORT}/callback"],
                grant_types=["authorization_code", "refresh_token"],
                response_types=["code"],
            ),
            storage=FileTokenStorage(TOKEN_PATH),
            redirect_handler=_open_browser,
            callback_handler=_await_callback,
        )
        read, write, _ = await self._stack.enter_async_context(
            streamablehttp_client(UPSTREAM_URL, auth=auth)
        )
        self.session = await self._stack.enter_async_context(ClientSession(read, write))
        await self.session.initialize()

        listed = await self.session.list_tools()
        self.tools = {tool.name: tool for tool in listed.tools}
        exposed = [name for name in self.tools if POLICY.is_exposed(name)]
        LOG.info(
            "upstream advertises %d tools; policy exposes %d, withholds %d",
            len(self.tools),
            len(exposed),
            len(self.tools) - len(exposed),
        )

    async def close(self) -> None:
        await self._stack.aclose()

    async def call(self, name: str, arguments: dict[str, Any]) -> types.CallToolResult:
        if self.session is None:
            raise RuntimeError("upstream session not connected")
        if self.calls >= MAX_CALLS:
            raise RuntimeError(
                f"gateway call ceiling reached ({MAX_CALLS}). Restart the server if this was "
                "a legitimate workload, or narrow the question - a single request that needs "
                "hundreds of upstream calls is usually a report, not a chat turn."
            )
        # Account pinning. Rule 2: the model does not get to pick the tenant.
        if name != "get_accounts":
            supplied = arguments.get("account")
            if supplied and supplied != ACCOUNT:
                raise ValueError(
                    f"tool {name} was called with account={supplied!r}; this gateway is pinned "
                    f"to {ACCOUNT!r}. Run a second gateway process for the other account."
                )
            arguments = {**arguments, "account": ACCOUNT}
        await self.bucket.take()
        self.calls += 1
        return await self.session.call_tool(name, arguments)


async def _open_browser(url: str) -> None:
    import webbrowser

    LOG.info("opening browser for Workable authorization")
    webbrowser.open(url)


async def _await_callback() -> tuple[str, str | None]:
    """Block until the OAuth redirect lands on localhost.

    Kept deliberately small: a single-request HTTP listener on CALLBACK_PORT.
    Swap for your own handler if the machine already runs something there.
    """
    from http.server import BaseHTTPRequestHandler, HTTPServer
    from urllib.parse import parse_qs, urlparse

    captured: dict[str, str] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802 - stdlib naming
            params = parse_qs(urlparse(self.path).query)
            captured["code"] = params.get("code", [""])[0]
            captured["state"] = params.get("state", [""])[0]
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Workable authorization received. Close this tab.")

        def log_message(self, *args: Any) -> None:
            return

    server = HTTPServer(("localhost", CALLBACK_PORT), Handler)
    await asyncio.get_running_loop().run_in_executor(None, server.handle_request)
    server.server_close()
    return captured.get("code", ""), captured.get("state") or None


# ---------------------------------------------------------------------------
# Gateway-native tools
# ---------------------------------------------------------------------------

GATEWAY_TOOLS = [
    types.Tool(
        name="workable_policy_report",
        description=(
            "Report which Workable MCP tools this gateway exposes and which it withholds, "
            "with the tier for each. Call this when the user asks what the assistant can or "
            "cannot do in Workable, or when a tool call was refused."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "include_withheld": {
                    "type": "boolean",
                    "description": "List every withheld tool name, not just the count.",
                    "default": False,
                }
            },
            "additionalProperties": False,
        },
    ),
    types.Tool(
        name="workable_pipeline_snapshot",
        description=(
            "One-call pipeline summary for a job: stage list, candidate count per stage, and "
            "the candidates with no activity for N days. Use this instead of chaining get_job, "
            "get_job_stages and get_candidates, which costs four or more upstream calls."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "shortcode": {
                    "type": "string",
                    "description": "Workable job shortcode. Get it from search_jobs.",
                },
                "stalled_after_days": {
                    "type": "integer",
                    "description": "Flag candidates with no activity for this many days.",
                    "default": 14,
                    "minimum": 1,
                    "maximum": 365,
                },
            },
            "required": ["shortcode"],
            "additionalProperties": False,
        },
    ),
    types.Tool(
        name="workable_stage_move_review",
        description=(
            "Two-phase stage move. Called without confirm, it validates the target stage and "
            "returns the exact change for a human to approve. Called with confirm=true and the "
            "token from that dry run, it performs move_candidate. The only path to a stage "
            "change through this gateway."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "candidate_id": {"type": "string", "description": "Workable candidate id."},
                "target_stage": {
                    "type": "string",
                    "description": "Exact stage name from get_job_stages.",
                },
                "reason": {
                    "type": "string",
                    "description": "Why the candidate is moving. Written to the activity feed.",
                    "minLength": 10,
                },
                "confirm": {
                    "type": "boolean",
                    "description": "Set true only after a human approved the dry run.",
                    "default": False,
                },
                "dry_run_token": {
                    "type": "string",
                    "description": "The token returned by the dry run. Required when confirm is true.",
                },
            },
            "required": ["candidate_id", "target_stage", "reason"],
            "additionalProperties": False,
        },
    ),
]


def _text(payload: Any) -> list[types.ContentBlock]:
    return [types.TextContent(type="text", text=json.dumps(payload, indent=2, default=str))]


def _first_json(result: types.CallToolResult) -> Any:
    for block in result.content:
        if isinstance(block, types.TextContent):
            try:
                return json.loads(block.text)
            except (json.JSONDecodeError, TypeError):
                continue
    return None


async def handle_policy_report(up: Upstream, args: dict[str, Any]) -> list[types.ContentBlock]:
    exposed: dict[str, str] = {}
    withheld: list[str] = []
    for name in sorted(up.tools):
        tier = POLICY.tier(name)
        if tier is Tier.DENY:
            withheld.append(name)
        else:
            exposed[name] = tier.value
    payload: dict[str, Any] = {
        "upstream_tool_count": len(up.tools),
        "exposed_count": len(exposed),
        "withheld_count": len(withheld),
        "exposed": exposed,
        "redacted_response_fields": sorted(POLICY.redact_fields),
        "account": ACCOUNT,
        "calls_used_this_process": up.calls,
        "call_ceiling": MAX_CALLS,
    }
    if args.get("include_withheld"):
        payload["withheld"] = withheld
    return _text(payload)


async def handle_pipeline_snapshot(up: Upstream, args: dict[str, Any]) -> list[types.ContentBlock]:
    shortcode = args["shortcode"]
    stalled_after = int(args.get("stalled_after_days", 14))

    job = _first_json(await up.call("get_job", {"shortcode": shortcode}))
    stages = _first_json(await up.call("get_job_stages", {"shortcode": shortcode})) or {}
    stage_names = [s.get("name") for s in stages.get("stages", []) if s.get("name")]

    # One paged sweep, not one call per stage. Stage counts come from the rows,
    # which keeps the cost at PAGE_CAP calls regardless of how many stages exist.
    rows: list[dict[str, Any]] = []
    since_id: str | None = None
    for _ in range(PAGE_CAP):
        params: dict[str, Any] = {"shortcode": shortcode, "limit": 100}
        if since_id:
            params["since_id"] = since_id
        page = _first_json(await up.call("get_candidates", params)) or {}
        batch = page.get("candidates", [])
        rows.extend(batch)
        if len(batch) < 100:
            break
        since_id = batch[-1].get("id")

    cutoff = time.time() - stalled_after * 86400
    per_stage: dict[str, int] = {name: 0 for name in stage_names}
    stalled: list[dict[str, Any]] = []
    for row in rows:
        stage = row.get("stage") or "unknown"
        per_stage[stage] = per_stage.get(stage, 0) + 1
        updated = row.get("updated_at") or row.get("created_at")
        ts = _parse_ts(updated)
        if ts is not None and ts < cutoff:
            stalled.append(
                {"id": row.get("id"), "name": row.get("name"), "stage": stage, "last_activity": updated}
            )

    return redact_content(
        _text(
            {
                "job": {
                    "shortcode": shortcode,
                    "title": (job or {}).get("title"),
                    "state": (job or {}).get("state"),
                },
                "stages": stage_names,
                "candidates_scanned": len(rows),
                "page_cap_reached": len(rows) >= PAGE_CAP * 100,
                "per_stage": per_stage,
                "stalled_after_days": stalled_after,
                "stalled": stalled[:50],
                "stalled_total": len(stalled),
            }
        ),
        POLICY.redact_fields,
    )


def _parse_ts(value: Any) -> float | None:
    if not isinstance(value, str):
        return None
    from datetime import datetime

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
    except ValueError:
        return None


def _dry_run_token(tool: str, arguments: dict[str, Any]) -> str:
    """Bind an approval to the exact call the human saw.

    Hashing the arguments, not just the tool name, is the point: an approval for
    "move candidate 41 to Onsite" must not authorize "move candidate 88 to
    Offer". Any edit to the arguments invalidates the token and forces a fresh
    dry run.
    """
    import hashlib

    payload = json.dumps(
        {k: v for k, v in arguments.items() if not k.startswith("_gateway")},
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(f"{tool}|{ACCOUNT}|{payload}".encode()).hexdigest()[:16]


async def handle_stage_move_review(up: Upstream, args: dict[str, Any]) -> list[types.ContentBlock]:
    candidate_id = args["candidate_id"]
    target_stage = args["target_stage"]
    reason = args["reason"]
    token = _dry_run_token(
        "move_candidate", {"id": candidate_id, "target_stage": target_stage, "reason": reason}
    )

    if not args.get("confirm"):
        current = _first_json(await up.call("get_candidate", {"id": candidate_id})) or {}
        candidate = current.get("candidate", current)
        return redact_content(
            _text(
                {
                    "phase": "dry_run",
                    "candidate": {
                        "id": candidate_id,
                        "name": candidate.get("name"),
                        "job": (candidate.get("job") or {}).get("title"),
                        "current_stage": candidate.get("stage"),
                    },
                    "target_stage": target_stage,
                    "reason": reason,
                    "dry_run_token": token,
                    "next_step": (
                        "Show this to the recruiter. If they approve, call again with "
                        "confirm=true and this dry_run_token. Do not confirm on your own."
                    ),
                }
            ),
            POLICY.redact_fields,
        )

    if args.get("dry_run_token") != token:
        raise ValueError(
            "dry_run_token does not match this candidate and target stage. Run the dry run "
            "again and have a human approve the result before confirming."
        )

    await up.call("add_comment", {"id": candidate_id, "comment": {"body": f"Stage move: {reason}"}})
    moved = await up.call("move_candidate", {"id": candidate_id, "target_stage": target_stage})
    return redact_content(
        _text({"phase": "committed", "candidate_id": candidate_id, "target_stage": target_stage,
               "upstream": _first_json(moved)}),
        POLICY.redact_fields,
    )


GATEWAY_HANDLERS = {
    "workable_policy_report": handle_policy_report,
    "workable_pipeline_snapshot": handle_pipeline_snapshot,
    "workable_stage_move_review": handle_stage_move_review,
}


# ---------------------------------------------------------------------------
# Server wiring
# ---------------------------------------------------------------------------


CONFIRM_NOTE = (
    " GATEWAY POLICY: this tool writes to Workable and needs a human approval. Call it first "
    "without _gateway_confirm to get a dry run describing the change, show that to the user, "
    "and only after they approve call again with _gateway_confirm=true and the _gateway_token "
    "from the dry run. Never approve on the user's behalf."
)

CONFIRM_ARGS = {
    "_gateway_confirm": {
        "type": "boolean",
        "description": "True only after a human approved the dry run.",
        "default": False,
    },
    "_gateway_token": {
        "type": "string",
        "description": "The _gateway_token returned by the dry run for these exact arguments.",
    },
}


def _with_confirm_gate(tool: types.Tool) -> types.Tool:
    """Advertise a CONFIRM-tier tool with its approval parameters attached."""
    schema = json.loads(json.dumps(tool.inputSchema))
    schema.setdefault("type", "object")
    schema.setdefault("properties", {})
    schema["properties"].update(CONFIRM_ARGS)
    # Upstream schemas can be strict; the gateway adds two properties to them.
    schema["additionalProperties"] = True
    return types.Tool(
        name=tool.name,
        description=(tool.description or "") + CONFIRM_NOTE,
        inputSchema=schema,
    )


def build_server(up: Upstream) -> Server:
    server = Server("workable-gateway")

    @server.list_tools()
    async def list_tools() -> list[types.Tool]:
        forwarded: list[types.Tool] = []
        for name, tool in sorted(up.tools.items()):
            tier = POLICY.tier(name)
            if tier is Tier.ALLOW:
                forwarded.append(tool)
            elif tier is Tier.CONFIRM:
                forwarded.append(_with_confirm_gate(tool))
        return GATEWAY_TOOLS + forwarded

    @server.call_tool()
    async def call_tool(name: str, arguments: dict[str, Any]) -> list[types.ContentBlock]:
        args = dict(arguments or {})
        if name in GATEWAY_HANDLERS:
            return await GATEWAY_HANDLERS[name](up, args)

        tier = POLICY.tier(name)
        if tier is Tier.DENY:
            raise ValueError(
                f"{name} is withheld by gateway policy. Call workable_policy_report for the "
                "list of tools this assistant can reach, and do the rest in the Workable UI."
            )

        if tier is Tier.CONFIRM:
            token = _dry_run_token(name, args)
            if not args.pop("_gateway_confirm", False):
                args.pop("_gateway_token", None)
                return _text(
                    {
                        "phase": "dry_run",
                        "tool": name,
                        "arguments": args,
                        "account": ACCOUNT,
                        "_gateway_token": token,
                        "next_step": (
                            "Show this to the user verbatim. If they approve, call the same "
                            "tool again with identical arguments plus _gateway_confirm=true "
                            "and this _gateway_token."
                        ),
                    }
                )
            if args.pop("_gateway_token", None) != token:
                raise ValueError(
                    f"_gateway_token does not match the arguments passed to {name}. The "
                    "arguments changed after the dry run, so the approval no longer applies. "
                    "Run the dry run again and have the user approve the new version."
                )

        result = await up.call(name, args)
        return redact_content(list(result.content), POLICY.redact_fields)

    return server


async def run() -> None:
    logging.basicConfig(level=os.environ.get("WORKABLE_LOG_LEVEL", "INFO"), stream=None)
    if not ACCOUNT:
        raise SystemExit(
            "WORKABLE_ACCOUNT is required. It is your Workable subdomain - the value "
            "get_accounts returns, and the one every other tool takes."
        )
    up = Upstream()
    await up.connect()
    try:
        server = build_server(up)
        async with stdio_server() as (read, write):
            await server.run(
                read,
                write,
                InitializationOptions(
                    server_name="workable-gateway",
                    server_version="0.1.0",
                    capabilities=server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )
    finally:
        await up.close()


def main() -> None:
    asyncio.run(run())


if __name__ == "__main__":
    main()
