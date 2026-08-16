# Contract Renewal Radar — setup

An n8n flow that watches vendor-contract notice windows, pulls spend and usage context, and drafts a renew / renegotiate / terminate brief before the notice deadline — not before the expiration date.

Files in this bundle:

- `contract-renewal-radar-n8n.json` — the workflow export (15 nodes, one schedule trigger)
- `schema.sql` — the three Postgres tables the flow reads and writes
- `_README.md` — this file

## Before you import

Run `schema.sql` against the database you will point the Postgres credential at. The flow reads `vendor_context`, reads and writes `renewal_radar_log`, and never touches `renewal_decisions` — that last table is written by humans and is what your success metric reads.

`vendor_context` can start empty. Contracts with no row still produce a brief; they are flagged `context_complete: false` and routed to the escalation channel rather than being recommended for renewal on missing data.

## Import

n8n → **Workflows** → **Import from File** → select `contract-renewal-radar-n8n.json`. The workflow imports with the trigger **inactive**. Leave it that way until you have run the verification sequence below.

Open **Workflow settings** and confirm **Timezone** reads `America/New_York`, or change it to yours. The notice-deadline math is calendar-date based; a timezone mismatch shifts every deadline by one day, and one day is the whole point of this flow.

## Credentials

Four credentials, each referenced in the export by a `PLACEHOLDER_*` id. n8n will show them as broken until you map each node to a real credential.

### `PLACEHOLDER_POSTGRES_CRED_ID` — Postgres

Standard Postgres credential against the database holding the three tables. Needs `SELECT` on `vendor_context`, and `SELECT`/`INSERT`/`UPDATE` on `renewal_radar_log`. Used by **Load Radar State**, **Load Spend + Usage**, and **Upsert Radar Log**.

### `PLACEHOLDER_IRONCLAD_CRED_ID` — Ironclad

Create a **Header Auth** credential with name `Authorization` and value `Bearer <your token>`. Generate the token in Ironclad under **Company Settings → API**; it needs the OAuth scope `public.records.readRecords`. Used by **Ironclad — Record Schema** and **Ironclad — List Records**.

If your Ironclad instance is on the EU or demo environment, change the host in both nodes — the export points at `ironcladapp.com`.

### `PLACEHOLDER_DOCUSIGN_CRED_ID` — Docusign

An **OAuth2 API** credential against Docusign's Agreement Manager API (formerly Navigator). You will also need `DOCUSIGN_ACCOUNT_ID` set as an environment variable on your n8n instance — the URL interpolates it. The Agreement Manager API reached general availability for eligible Agreement Manager customers in May 2026; if your account predates that, confirm entitlement before wiring this node.

If you run only one contract repository, **disable the node for the one you do not use**. The Merge node is in append mode and passes through whichever branch produces items.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic

An **Anthropic** credential holding your API key. Used by **Claude — Renewal Brief**, which calls `claude-sonnet-5` on the Messages API with adaptive thinking at `medium` effort.

## Configure before first run

Two Code nodes hold the values you will actually tune. Open them and read the constants at the top before you run anything.

**Normalize + Compute Notice Window**

- `RENEWAL_FIELD_NAMES` — the display names of the Ironclad record fields holding expiration date, notice period, renewal type, annual value, and owner email. **These are per-tenant.** The node resolves them against the live schema and throws `schema_field_missing` if it cannot find the expiration or notice-period field. That is deliberate: a silent miss here would mark every contract safe.
- `DEFAULT_NOTICE_DAYS` (90) — what to assume when the paper does not state a notice period. Contracts that hit this default are stamped `notice_source: 'assumed'` and the Slack card says so.
- `TIERS` (90 / 60 / 30 / 7) — how many days before the notice deadline to nudge.

**Score + Route**

- `LOW_UTILIZATION` (0.40) and `SOFT_UTILIZATION` (0.70) — the seat-utilization bands that drive terminate and renegotiate.
- `UPLIFT_RENEGOTIATE` (0.10) — quoted increase above which the flow argues for pushing back.
- `ESCALATION_VALUE_CENTS` (5000000, i.e. $50,000/yr) — above this, contracts go to legal rather than to the business owner.

Also change the two Slack channels (`#legal-ops-renewals` and `#vendor-renewals`) to yours.

## First-run verification

Run these in order with the trigger still inactive. Each step proves one branch works before the next one can hide a failure.

1. **Schema resolution.** Execute **Ironclad — Record Schema** alone. Confirm the response lists your record fields, then execute **Normalize + Compute Notice Window** and check it does not throw `schema_field_missing`. If it does, fix `RENEWAL_FIELD_NAMES` — do not work around it downstream.

2. **Date math.** Temporarily set `RADAR_HORIZON_DAYS` to `3650` and execute up to **Normalize + Compute Notice Window**. Pick three contracts you know by hand and check `notice_deadline` equals `expiration_date` minus the notice period on the paper. Check that at least one contract shows `notice_source: 'assumed'` if any of your records lack a notice period. Set the horizon back to `90`.

3. **Empty-state dedup.** With `renewal_radar_log` empty, execute through **New Tier Only** and note the item count. Run the whole flow once, then execute through **New Tier Only** again — the count should now be zero, because every contract was logged at its current tier. This is the check that stops daily re-notification.

4. **Context degradation.** Delete the `vendor_context` row for one in-window contract and run that contract through **Score + Route**. Confirm `context_complete` is `false`, the recommendation is `renegotiate` (never `renew`), and `route` is `legal_escalation`.

5. **Model disagreement.** Find or force a contract where `model_agrees` is `false`. Confirm the escalation card carries the "Model recommended X; rules recommended Y" context line and that `recommendation` is the deterministic value, not the model's.

6. **Brief failure.** Temporarily point the Anthropic credential at an invalid key and run one contract. The flow must complete, `brief_error` must be populated, `rationale` must read "Model brief unavailable", and the Slack card must still post with the deterministic recommendation. Restore the key.

7. **Idempotency.** Re-run the full flow immediately. `renewal_radar_log` row count must not change, and no new Slack messages should post.

Once all seven pass, activate the trigger.

## Cost

Per contract that enters the radar: one Claude Sonnet 5 call at roughly 5–8k input tokens and 800–1,500 output tokens, plus adaptive thinking billed as output. At list pricing of $3 per million input and $15 per million output, that lands around $0.05–$0.07 per brief. A 400-contract vendor portfolio typically pushes 30–40 contracts across a tier boundary in a month, so inference runs $2–3 monthly.

n8n execution cost is a rounding error here and worth understanding, because it is the opposite of a per-item webhook flow: the fan-out across contracts happens *inside* one workflow run, so a weekday cron is about 22 executions a month. n8n Cloud Starter is €24/month for 2,500 executions, with unlimited workflows and users on every Cloud plan as of 2026 — this flow uses under 1% of the entry tier.

The real cost is getting notice periods out of the paper and into the repository. Budget that as the project, not the automation.

## Known limits

- **Ironclad pagination is capped** at 50 pages of 100 records (5,000 records). Raise `maxRequestsFetched` on **Ironclad — List Records** if your repository is larger, and re-check the dropped-record count the Normalize node logs.
- **The flow reads; it never writes back to the CLM.** Decisions are recorded by a human in `renewal_decisions`. Wiring the decision back into Ironclad or Docusign is a deliberate omission — a write scope on the contract repository is a much larger security review than a read scope, and the flow's value does not depend on it.
- **No holiday or business-day handling.** `days_to_deadline` counts calendar days. If your notice clauses specify business days, the deadline this flow computes is later than the real one, and you should shorten the tiers to compensate.
- **Not runtime-tested against a live Ironclad or Docusign tenant.** The endpoint paths, scopes, and provision field names come from vendor documentation; the response-shape handling in the Normalize node is defensive but you should expect to adjust the field extraction on first contact with your own data.
