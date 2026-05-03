# Competitive intel tracker — n8n bundle

## What this flow does

A daily cron pulls a list of tracked competitor pages from Postgres, fetches each one with a real user-agent and a 4-second throttle, normalizes the HTML by stripping volatile noise (script blocks, build IDs, server-rendered timestamps, current-year strings), hashes the result, and compares it to the previously stored hash. Pages whose hash and length-delta both clear a materiality threshold get diffed by Claude Sonnet against the prior snapshot; the model is instructed to return the literal string `NO_CHANGE` when the diff is cosmetic. Material summaries land in a `competitor_change_log` table. A second cron fires Mondays at 14:30 and aggregates the last seven days of material changes into one Slack Block Kit message per competitor — silent weeks stay silent. A third trigger (a Slack slash command webhook) lets sales reps query the same change log on demand for a single competitor over the last 90 days.

## Import

1. In n8n, open the workflow list and click **Import from File** in the top-right kebab menu.
2. Select `competitive-intel-tracker-n8n.json`.
3. Confirm the workflow opens with 20 nodes across three triggers (the daily crawler, the weekly digest, and the on-demand webhook). The graph should read left-to-right with the digest below the crawler and the webhook below that.
4. Open **Settings** on the workflow and confirm `executionOrder: v1` and a sensible `timezone` (the bundle ships `Europe/London` — change it to your team's working timezone before activating; Cron expressions are interpreted in this zone).
5. Do **not** activate yet. Wire credentials and create the database tables first (next two sections).

## Credentials

The flow references four credential placeholders by name. Each placeholder must be replaced with a real n8n credential of the matching type before the workflow will execute.

### `PLACEHOLDER_POSTGRES_CRED_ID` — Postgres (read/write)

Used by five nodes (`Pull Tracked Pages`, `Persist Change + Update Snapshot`, `Touch Snapshot (No Material Change)`, `Aggregate Last 7 Days Of Material Changes`, `Fetch On-Demand History`). Create an n8n **Postgres** credential pointing at the database that holds your tracked pages and change log. The bundle assumes two tables — create them with:

```sql
CREATE TABLE competitor_tracked_pages (
  page_id            bigserial PRIMARY KEY,
  competitor_name    text NOT NULL,
  page_type          text NOT NULL,        -- 'pricing' | 'blog' | 'hiring' | 'reviews' | 'docs'
  url                text NOT NULL UNIQUE,
  active             boolean NOT NULL DEFAULT true,
  last_content_hash  text,
  last_content_text  text,
  last_seen_at       timestamptz
);

CREATE TABLE competitor_change_log (
  id              bigserial PRIMARY KEY,
  page_id         bigint REFERENCES competitor_tracked_pages(page_id) ON DELETE CASCADE,
  competitor_name text NOT NULL,
  page_type       text NOT NULL,
  url             text NOT NULL,
  content_hash    text NOT NULL,
  summary         text NOT NULL,
  is_material     boolean NOT NULL,
  detected_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON competitor_change_log (competitor_name, detected_at DESC);
CREATE INDEX ON competitor_change_log (detected_at DESC) WHERE is_material;
```

Seed `competitor_tracked_pages` with twenty to thirty rows before the first run. The recommended starter set per competitor: pricing page, two recent blog posts, careers/jobs index, docs landing page. Skip JS-heavy review sites (G2, Capterra, TrustRadius) unless you have a rendering service — the raw HTML they ship is mostly empty.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic API key

Used by `Claude — Diff + Summarize`. Create an n8n **Header Auth** credential with header name `x-api-key` and value set to your Anthropic API key (find it at console.anthropic.com → API Keys). The flow uses `claude-sonnet-4-6` — change the model in the JSON if your account routes elsewhere. Token budget per run: roughly `(pages × ~3000 input tokens) + (material pages × ~200 output tokens)` — see the cost-reality section in the page body for absolute numbers.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

Used by `Slack — Post Weekly Digest`. Create a Slack app at api.slack.com/apps, add the bot scopes `chat:write` and `chat:write.public` (the latter so the bot can post to channels it has not been explicitly invited to), install the app, and copy the **Bot User OAuth Token** (starts with `xoxb-`). Create an n8n **Header Auth** credential with header name `Authorization` and value `Bearer xoxb-...`. Update the channel name in the `Slack — Post Weekly Digest` node from `#competitive-intel` to whatever channel your sales team actually reads.

### Slash command (optional, no credential — webhook URL only)

The `On-Demand Webhook` node exposes a path at `/webhook/intel-on-demand`. To wire a Slack slash command to it: in your Slack app config, add a slash command (e.g. `/whatsnew`), set the request URL to your n8n public URL plus that path, and grant the `commands` scope. No n8n credential is needed because Slack POSTs to the webhook directly. If your n8n is not internet-reachable, either expose it via a tunnel or skip this trigger and run the on-demand query manually from the n8n editor.

## First-run verification

Run these in order. Each step proves a different branch of the flow.

1. **Insert one tracked page that you know changes daily** (a competitor's blog index works well). Verify with `SELECT * FROM competitor_tracked_pages;` that the row exists with `last_content_hash IS NULL`.
2. **Manually execute the `Daily Cron — 5am UTC` trigger** from the n8n editor. The first run should: fetch the page, compute a hash, *fail* the `Material Change?` IF (because there is no prior snapshot to compare — the `had-prior-snapshot` condition is false), and route to `Touch Snapshot (No Material Change)` which writes the initial hash. Confirm `competitor_tracked_pages.last_content_hash` is now populated and `competitor_change_log` is still empty.
3. **Manually execute the trigger a second time, immediately.** The hash should match (page didn't change in two minutes), the IF fails, no Claude call. This proves the cheap path.
4. **Edit the row to force a diff.** Run `UPDATE competitor_tracked_pages SET last_content_text = 'lorem ipsum placeholder', last_content_hash = 'force-diff' WHERE page_id = <id>;` and re-execute the trigger. The IF should now pass, Claude should be called, and you should see a row appear in `competitor_change_log`. Open the row and read the summary — it should describe the page in two sentences. If it returned `NO_CHANGE` despite the forced diff, lower the materiality threshold or check the truncation in the prompt.
5. **Test the no-op materiality filter.** Insert a row pointing at a page that has trivial dynamic content (e.g. a homepage with rotating testimonials). After the first snapshot is captured, re-run the cron. The hash will likely differ but the length delta should be small — confirm it routes to the false branch and does not spend a Claude call.
6. **Test the weekly digest.** Manually execute `Weekly Digest Cron — Mon 14:30`. If `competitor_change_log` has at least one `is_material = true` row from the last 7 days, you should see a Slack message land in the configured channel. If the table is empty for the window, no message fires — that is correct behavior, not a bug.
7. **Test the on-demand webhook.** From a terminal, `curl -X POST https://<your-n8n>/webhook/intel-on-demand -d 'text=acme'` (or trigger your wired Slack slash command). Expect a JSON response with up to 10 of the most recent material changes for any competitor whose name contains `acme`. With an empty change log, expect the "No material changes recorded" fallback.
8. **Activate the workflow** only after all six branches above behaved as described.
