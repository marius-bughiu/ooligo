# Hiring funnel anomaly detection — n8n bundle

## What this flow does

This bundle contains a complete n8n workflow that watches your applicant tracking system for funnel-shaped problems and surfaces them in Slack within 24 hours of the metric moving. Two scheduled triggers wake up nightly. The 2am job pulls the last 24 hours of stage-transition events from Ashby, aggregates them per role-by-stage, joins each row to a rolling baseline stored in Postgres, and emits an alert when today's conversion rate is at least two standard deviations below the baseline mean, when median dwell time in a stage exceeds the role's stage SLA by 50%, or when a role has had zero applicant movement in seven days. The 3am job recomputes a rolling 7-day time-to-hire per role and flags any role exceeding its threshold. Alerts are written to a deduplicated `anomaly_alerts` table so re-running the flow on the same day cannot re-fire. Newly inserted alerts are explained by Claude in one or two sentences and posted to a routing-aware Slack channel.

The two scheduled triggers are independent, which is deliberate. The per-stage detector reads a high-volume application feed; the time-to-hire trend check runs a heavier SQL aggregate. Splitting them by an hour avoids contention on the baselines table and lets you disable one path without breaking the other.

## Import

1. In n8n, open `Workflows`, click `Add workflow`, then `Import from file`.
2. Select `hiring-funnel-anomaly-n8n.json` from this bundle.
3. The workflow imports inactive. Do not toggle it active until credentials are wired and the first-run verification below passes.
4. Open `Settings` (top right) and confirm `Timezone` is the value you want — the JSON ships with `America/New_York` and both Cron expressions evaluate in that zone.

## Credentials

The flow references four placeholder credentials by name. Create each one under `Credentials` in n8n before running.

### Ashby — API

The HTTP Request node `Ashby — Application Feed (24h)` uses Basic Auth with your Ashby API key as the username and an empty password. Generate the key under `Settings → API` in Ashby. The default scope (`Read Applications`) is sufficient. If your ATS is Greenhouse, swap the URL to `https://harvest.greenhouse.io/v1/applications?updated_after={{ $now.minus({hours:24}).toISO() }}` and use the Greenhouse Harvest API key. For Lever, point at `https://api.lever.co/v1/opportunities?expand=stage&updated_at_start={{ ... }}` and use a Lever API key.

### Postgres — funnel-baselines

A standard Postgres connection. The flow expects three tables in the same database:

- `funnel_baselines (role_id text, from_stage text, to_stage text, conversion_rate_mean numeric, conversion_rate_stddev numeric, dwell_seconds_p50 numeric, stage_sla_seconds integer, sample_size integer, refreshed_at timestamptz, primary key (role_id, from_stage, to_stage))`
- `role_tth_baselines (role_id text primary key, role_name text, tth_baseline_days numeric, tth_threshold_days numeric)`
- `anomaly_alerts (id bigserial primary key, role_id text, from_stage text, to_stage text, anomaly_type text, severity text, current_value numeric, baseline_value numeric, window_end timestamptz, dedupe_key text unique, created_at timestamptz default now())`

The DDL is intentionally not bundled because every team's role and stage taxonomy is different. Build the baselines once from a 90-day backfill of the same Ashby feed before turning the flow active. Refresh `funnel_baselines` and `role_tth_baselines` monthly using the same query that built them.

### Anthropic — x-api-key

The narrative explanation step uses Anthropic's HTTP API directly via Header Auth. Create a Header Auth credential with `Name: x-api-key` and `Value: <your Anthropic API key>`. The model is pinned to `claude-sonnet-4-6` in the node body — change it there if you prefer Haiku for cost or Opus for higher-stakes alerts. Token spend scales with new alerts only because the explanation node sits behind the dedupe insert.

### Slack — bot token

Create a Slack app, install it to your workspace, grant `chat:write` and `chat:write.public`, and store the bot token in a Header Auth credential with `Name: Authorization` and `Value: Bearer xoxb-…`. The `Format Slack Message` code node maps each `anomaly_type` to a destination channel (`#recruiting-alerts`, `#sourcing`, `#recruiting-leadership`); make sure the bot has been invited to each channel or `chat.postMessage` will silently 200 with `ok: false`.

## First-run verification

Before flipping the workflow active, walk through these checks. Each one exercises a different branch of the graph; running them in order proves the whole flow without waiting for a real anomaly.

1. **Disable the 2am Cron, then click `Execute Workflow` from the Cron node manually.** Confirm the Ashby HTTP node returns at least one event. If it returns an empty array, your API token is scoped wrong or the time window has no activity.
2. **Insert one synthetic baseline row that is guaranteed to flag.** `INSERT INTO funnel_baselines (role_id, from_stage, to_stage, conversion_rate_mean, conversion_rate_stddev, sample_size) VALUES ('ROLE_TEST','phone_screen','onsite', 0.50, 0.05, 200);`. Then craft an aggregator output that reports `conversion_rate_today = 0.10` for the same key. Run the workflow and confirm a row appears in `anomaly_alerts` and a message lands in `#recruiting-alerts`.
3. **Run the same execution a second time.** Confirm the dedupe insert returns no rows, no Claude call is made, and no Slack message is sent. This validates the cost guard.
4. **Manually run the 3am Cron node.** With no roles exceeding their threshold, it should complete without writing a row. Insert a fake `hires` row that exceeds threshold, re-run, and confirm a `time_to_hire_trend` alert is persisted and posted to `#recruiting-leadership`.
5. **Delete the test rows from `anomaly_alerts` and `funnel_baselines`** before activating the flow. Forgetting this step pollutes your real baseline.

Once all five steps pass, toggle the workflow `Active`. Watch `#recruiting-alerts` for the first three nights and tighten the `Z_THRESHOLD` or `DWELL_MULTIPLIER` constants in the `Detect Anomalies` code node if the volume is wrong for your team.
