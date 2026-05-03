# mcp-server-ashby-recruiting

An MCP server tuned for recruiting teams using Ashby. Exposes candidates, applications, jobs, and openings as Claude tools, plus two recruiting-specific helpers (`stale_candidates`, `pipeline_velocity`) and two light-write tools (`add_note`, `add_tag`) that recruiters can drive from a Claude conversation.

> **STATUS: scaffold — not runtime-tested.** The code below is structurally
> complete and follows the official `mcp` Python SDK conventions, but it
> has not been executed against a live Ashby workspace. Treat it as a
> starting point you adapt to your team's pipeline conventions, not as a
> deployable binary. Custom field IDs, stage names, source labels, and
> pipeline structure vary by workspace — re-test every helper against the
> Ashby UI before relying on it.

## What it exposes

### Object-read tools (read-only)
- `get_candidate(candidate_id)` — full candidate properties, contact info, and current applications
- `get_application(application_id)` — application record with current stage, source, and history
- `get_job(job_id)` — job record with hiring team, status, and pipeline reference
- `get_opening(opening_id)` — opening (req) record with target start and headcount

### Search tools (read-only)
- `search_candidates(query, limit?)` — name / email / company substring search across the candidate database
- `list_applications(job_id, status?)` — applications for a job, optionally filtered by status (`Active`, `Hired`, `Archived`)
- `list_jobs(status?)` — jobs in the workspace, optionally filtered by status (`Open`, `Closed`, `Draft`)

### Recruiting-specific helpers (read-only)
- `stale_candidates(days_inactive=30)` — active candidates with no application activity (stage change, note, interview event) for N days; output grouped by current stage
- `pipeline_velocity(job_id)` — average days-in-stage per stage for a job's pipeline, computed across the last 90 days of stage changes; surfaces where the funnel is stuck

### Light-write tools (recruiter-driven)
- `add_note(candidate_id, body)` — append a note to a candidate's record (visible in the Ashby UI activity feed)
- `add_tag(candidate_id, tag)` — apply a tag to a candidate (e.g. `phone-screen-passed`, `do-not-pursue-2026`)

The server **does not** expose stage advances, application archives, offer creation, or candidate deletes. The principle: Claude can ask, summarize, and document; the recruiter drives every candidate-facing change in the Ashby UI where the audit trail and approval workflow already live.

## Setup

### 1. Install

```bash
git clone <wherever you put this>
cd mcp-server-ashby-recruiting
python -m venv .venv
source .venv/bin/activate     # or .venv\Scripts\activate on Windows
pip install -e .
```

### 2. Create an Ashby API key

In Ashby: Admin → API Keys → Create API Key. Grant scopes:

- `candidatesRead` and `candidatesWrite` (write only for `add_note`, `add_tag`)
- `applicationsRead`
- `jobsRead`
- `openingsRead`
- `interviewsRead` (used by `stale_candidates` to detect interview activity)

Copy the generated key. Ashby keys are workspace-scoped and act with the privileges of an admin role — treat them like a production secret.

### 3. Configure environment

```bash
export ASHBY_API_KEY="ashby_live_..."
export ASHBY_WORKSPACE_NAME="acme"          # used in tool descriptions and logs
export ASHBY_STALE_DEFAULT_DAYS="30"        # default for stale_candidates
export ASHBY_VELOCITY_LOOKBACK_DAYS="90"    # window for pipeline_velocity
```

#### `ASHBY_API_KEY`
The generated key from Admin → API Keys. Use HTTP Basic auth: the key is the username, password is blank. The server handles this automatically.

#### `ASHBY_WORKSPACE_NAME`
A short label (no spaces) used in tool descriptions so recruiters know which workspace they are querying when multiple workspaces are wired into one Claude install. Optional — defaults to `default`.

#### `ASHBY_STALE_DEFAULT_DAYS`
Default value for the `days_inactive` parameter when the recruiter does not specify one. 30 is the sane starting point for engineering pipelines; 14 for high-volume sales pipelines.

#### `ASHBY_VELOCITY_LOOKBACK_DAYS`
Window over which `pipeline_velocity` averages stage durations. 90 days smooths out single-candidate noise without going stale across hiring-plan changes.

### 4. Register with Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "ashby-recruiting": {
      "command": "python",
      "args": ["-m", "ashby_recruiting_mcp.server"],
      "env": {
        "ASHBY_API_KEY": "ashby_live_...",
        "ASHBY_WORKSPACE_NAME": "acme",
        "ASHBY_STALE_DEFAULT_DAYS": "30",
        "ASHBY_VELOCITY_LOOKBACK_DAYS": "90"
      }
    }
  }
}
```

Restart Claude Desktop. You should see ~11 tools registered under `ashby-recruiting`.

### 5. Sanity-check

Ask Claude: "Find candidates whose name starts with `Smith`." Then: "Show me stale candidates in the senior backend engineer pipeline." Compare the output against the equivalent filtered view in Ashby. Tune `ASHBY_STALE_DEFAULT_DAYS` until the result matches the recruiter's intuition for "should have heard back by now".

## Watch-outs

- **API keys bypass per-recruiter permissions.** An Ashby API key acts with full admin scope. Anyone with access to the MCP client sees every candidate the workspace contains, including senior-leadership pipelines and rejected candidates with sensitive notes. Guard: scope the MCP install to recruiting-team machines only, document the exposure with security, rotate quarterly.
- **Stage names drift across pipelines.** `pipeline_velocity` reads the pipeline definition fresh on every call so renames don't break the helper, but year-over-year comparisons get noisy when the pipeline shape changes. Guard: snapshot pipeline definitions quarterly if you care about historical trend lines.
- **Light-write tools bypass Ashby approval workflows.** `add_note` and `add_tag` write directly through the API — they do not trigger any approval that would normally fire in the UI. Guard: do not use light-write tools for status-change-equivalent tags (`hired`, `offer-extended`); reserve for descriptive tags only.
- **Rate limits are workspace-shared.** Ashby's API is rate-limited per workspace, not per key. A chatty MCP session can crowd out the candidate-engagement automation that depends on the same workspace. Guard: cap concurrent calls (the scaffold uses one client per call) and watch for 429s in the logs during heavy use.
- **Candidate data is regulated.** EU candidates fall under GDPR; California candidates under CCPA. Surfacing candidate notes through Claude potentially routes regulated data through the Anthropic API. Guard: confirm the workspace's AI policy explicitly authorizes this.

## Limits and TODOs (before production use)

- [ ] Add request-level retries with exponential backoff on 429 and 5xx (Ashby returns 429 readily under sustained load).
- [ ] Replace `str(data)` response stringification with structured JSON serialization that strips PII fields the recruiter did not ask for.
- [ ] Write integration tests against an Ashby sandbox workspace.
- [ ] Add structured logging via `python-json-logger` with candidate IDs and tool names; never log raw note bodies.
- [ ] Wire optional Sentry / OpenTelemetry export for production telemetry.
- [ ] Validate stage IDs returned by `pipeline_velocity` against the live pipeline shape on first call per session, fail loud if cached IDs no longer exist.
- [ ] Add an allow-list env var (`ASHBY_ALLOWED_JOB_IDS`) to scope MCP visibility to a subset of jobs for confidentiality-sensitive roles.
- [ ] Audit-log every light-write tool call to a separate file the recruiting-ops lead reviews weekly.
