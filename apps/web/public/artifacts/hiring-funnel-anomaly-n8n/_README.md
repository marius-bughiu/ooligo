# Hiring funnel detector

Start with the synthetic fixture. It needs Python 3.10+ and runs offline. Run these commands in the extracted bundle directory.

```sh
python3 -B check_fixture.py
python3 -B ashby_adapter.py --config config.example.json --fixture fixtures/ashby-pages.json --as-of 2026-11-02
```

The first command checks pagination, missing data, duplicates, timestamp boundaries, role coverage and the export's two detection paths. The second prints the aggregates consumed by PostgreSQL. Five invented applications belong to the Analyst role. Four left Screen with an observed successor during November 1 UTC, one advanced to Onsite and the median completed dwell was 48 hours. A separate application first reached the configured hire stage 59 days after creation. A watched role has zero activity. Another role was added too recently to qualify for the seven-day rule.

`fixtures/expected-alerts.json` gives the four expected alert payloads. `check_postgres.mjs` starts a disposable PostgreSQL engine via PGlite, applies the actual `schema.sql`, runs the hire branch before the stage branch, and checks those payloads, snapshot immutability, replay, samples and delivery states. Install the pinned test dependency in the extracted directory and run the SQL checks.

```sh
npm install --prefix . --no-save --package-lock=false --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.14
node check_postgres.mjs
node check_postgres.mjs --one-alert
```
 Alternatively, set `HFA_PGLITE_MODULE` to the installed package's absolute `dist/index.js` path. For the smaller example, run `node check_postgres.mjs --one-alert`. It uses `fixtures/one-alert-config.json` in a fresh, isolated database. The first run queues one quiet-role alert. A second run queues zero new alerts, and one pending row remains. The complete fixture ran on PostgreSQL 18.6 via PGlite 0.5.14. Independent native PostgreSQL 18.4 execution also produced three stage alerts and one hire alert, followed by zero new alerts on replay. The Python and SQL checks use synthetic responses.

The unmodified export was also imported into n8n 2.45.7. Seven CLI runs used disposable copies with manual CLI triggers, local test credentials, test channel IDs and loopback mock URLs for Anthropic and Slack. With native PostgreSQL 18.4, the stage run queued three alerts and sent one, the hire run queued one and sent one, and two outbox runs sent the remaining two. Repeating stage, hire and drain left four delivered rows, four mock model requests and four mock Slack acknowledgements. Two alerts routed to the stage channel and two to leadership. These runs exercise the n8n SQL, Code and HTTP nodes using synthetic records. Wall-clock trigger firing and live Ashby, Anthropic and Slack services require a separate operator check.

## Data contract

`ashby_adapter.py` is a separate collector. The n8n export reads its completed snapshot. Schedule the collector before 02:00 UTC. Use a read-only Ashby API key with `candidatesRead`, exported as `ASHBY_API_KEY`. The collector sends Basic authentication with the key as username and an empty password, and pins `Ashby-Version: 2026-01-01`. Keep the key out of configuration, command arguments and fixtures.

For each explicitly watched job, the collector posts `jobId`, `createdBefore`, `cursor` and `limit` to `application.list`. It retrieves all pages and posts each `applicationId` to `application.listHistory`, following that endpoint's own pagination. `stageNumber` orders the stage records. `stageId`, `enteredStageAt` and `leftStageAt` identify transitions and durations. The collector uses `createdAt` from the application to measure elapsed time to the first configured hire-stage entry. See [Ashby application list](https://developers.ashbyhq.com/reference/applicationlist), [stage history](https://developers.ashbyhq.com/reference/applicationlisthistory) and [API versioning](https://developers.ashbyhq.com/reference/versioning).

This is a bounded full scan per watched job, with a maximum of 5,000 applications per job and 100 pages per list. Estimate request volume from the number of applications and history pages. No incremental checkpoint or Greenhouse/Lever adapter is included. A failed request, inconsistent job, broken pagination, duplicate record or invalid stage sequence aborts the entire collection before a snapshot is written. Review the error and rerun the same date. An empty but successful job response retains a zero row for its configured role.

Copy `config.example.json`. Replace every invented ID, date, label, advancing-successor list and reference value. Use the stage IDs in your Ashby account. `monitor_since` is the earliest date on which you can vouch for coverage of that role. Choose neutral aggregate labels that may be sent to Claude and Slack. The collector reads applications in memory. It persists role/stage aggregates, counts and policy values; the output contains no application ID, candidate name, email or source transcript.

The `reference_mean`, `reference_sd` and `reference_days` inputs are operator-supplied. For a comparable historical period, calculate each eligible day's advancing exits divided by completed exits with an observed successor, then compute the mean and standard deviation of those daily rates. Record the number of eligible days and reference update date. Use the same stage IDs, opportunity definition and daily minimum as the live rule. A taxonomy change needs a new reference. The adapter rejects a reference updated in the future or more than 35 days before the snapshot date. The example thresholds are policy choices, not population benchmarks. Reference backfill and refresh scheduling are your responsibility.

## PostgreSQL and schedules

Use a database approved for these aggregates and the standard `psql` client. Configure the appropriate `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` and credential mechanism. Apply the schema in that database, then load a fixture into a disposable database or collect real data into the configured destination:

```sh
psql -X -v ON_ERROR_STOP=1 -f schema.sql
# Disposable fixture only
python3 -B ashby_adapter.py --config config.example.json --fixture fixtures/ashby-pages.json --as-of 2026-11-02 --persist
# Operator-configured live collector; replace the date with today's completed UTC cutoff
python3 -B ashby_adapter.py --config watched-roles.json --as-of YYYY-MM-DD --persist
```

`as_of` is the UTC midnight **ending** the window. For `2026-11-02`, the daily interval is `[Nov 1 00:00, Nov 2 00:00)` and the weekly interval starts October 26. A single immutable snapshot contains all watched roles for that date. Identical replay is accepted. A changed replay raises an error so a correction cannot silently rewrite evidence for delivered alerts. `hfa.snapshots` and `hfa.alerts` are the complete table requirements. The hire trend comes from the snapshot, without a separate unprovided `hires` table.

Import `hiring-funnel-anomaly-n8n.json` into n8n. It ships inactive, with `executionOrder: v1` and timezone `UTC`. Bind the PostgreSQL nodes to the database with the `hfa` schema. Bind the Anthropic HTTP node to Header Auth `x-api-key`. Bind the Slack HTTP node to Header Auth `Authorization` with your bot bearer token. Invite the bot to both channels and grant `chat:write`. In **Check channel configuration**, replace `REPLACE_STAGE_CHANNEL_ID` and `REPLACE_LEADERSHIP_CHANNEL_ID` with approved channel IDs before enabling the schedules. The Claude request uses aggregate alert data, model `claude-haiku-5-5` and a 120-token output cap. Verify current model access and prices in your account. See [Anthropic models](https://platform.claude.com/docs/en/models/overview) and [Slack chat.postMessage](https://api.slack.com/methods/chat.postMessage).

The 02:00 UTC schedule calls `hfa.detect_stages(date)`. The 03:00 schedule calls `hfa.detect_tth(date)` independently. Both require that exact day's completed snapshot. An absent snapshot raises an error. After correcting a failed collection, rerun the relevant detector for the original date using SQL or the node's date parameter. Confirm the calls in a disposable database:

```sql
SELECT hfa.detect_tth('2026-11-02');     -- 1 new alert on the fixture
SELECT hfa.detect_stages('2026-11-02');  -- 3 new alerts on the fixture
SELECT hfa.detect_tth('2026-11-02');     -- 0 on replay
SELECT hfa.detect_stages('2026-11-02');  -- 0 on replay
SELECT payload, state FROM hfa.alerts ORDER BY payload->>'kind';
```

## Rules and delivery

- **Stage conversion.** Compare the observed share of completed departures that reached a configured advancing successor with the historical daily mean. The rule requires the configured minimum daily departures, at least 20 reference days and a positive reference deviation. It fires at or below `mean - 2 × standard deviation`. Pending candidates, terminal exits without a successor, gaps in stage ordering and successors starting after the cutoff are outside this denominator. Nonzero starting stage numbers are supported. Duplicate or invalid order values abort collection.
- **Completed dwell.** With the same daily sample gate, flag a median completed dwell above `1.5 × dwell_limit_hours`. This describes completed transitions. It does not identify individual candidates who are currently stuck.
- **Quiet role.** Flag a configured role after at least seven monitored days when no stage-history row has an entry or exit in the seven-day window. Empty application lists qualify only after successful collection. A new role with fewer than seven monitored days is suppressed.
- **Hire trend.** Average days from application creation to first entry into the configured hire stage for hires within the seven-day window. Flag when the average exceeds `tth_limit_days` and the configured minimum hire count is met. Count a hire only when its observed history has a contiguous ordinal prefix from zero through the first configured hire-stage entry. A missing prefix leaves the first hire date unverified and excludes that application from the hire statistic. Confirm the chosen stage means an actual hire in your taxonomy.

Each alert key includes UTC date, job, stage and type. Both detectors enqueue rows through the same SQL function. Reruns generate zero additional rows for an existing key. A delivery tick runs every 15 minutes and after either detector. Each tick claims at most one pending alert with a 15-minute lease. Watch the oldest pending row and queue depth if you expect more alerts than this schedule can drain.

The shared delivery path checks the channel, requests a short aggregate explanation, records that a Slack send is about to start, sends the message, and persists the response. A pre-send failure leaves a lease that can be retried. Three expired pre-send attempts mark the row failed for operator review. Repeated explanations can incur additional model usage. Slack `ok:true` with a channel and timestamp marks delivery confirmed. `ok:false` with `channel_not_found`, `not_in_channel`, `invalid_auth`, `missing_scope`, `no_text` or `msg_too_long` records a definite rejection. Other error codes and incomplete acknowledgements stay uncertain. Slack documents that `internal_error` and `fatal_error` can follow a partially successful operation. A timeout after the send starts also leaves an uncertain outcome when its lease expires. That outcome is never automatically reposted. Check the channel for the message's `Ref` before deciding how to reconcile the row. A DB transaction cannot make a remote Slack call exactly-once.

Inspect `state`, `last_error`, `slack_channel` and `slack_ts` in `hfa.alerts`. Correct a definite rejection before explicitly returning that row to `pending` with its lease fields cleared and attempts reset. For an uncertain send, first establish whether Slack accepted the message. Keep the row held if you cannot establish the outcome. Test your approved account bindings with aggregate-only sandbox data before activating production schedules. Record actual API requests, tokens, execution counts, alert acknowledgement and human review latency in your own environment.
