# Candidate rediscovery (silver medalists) — n8n flow

This flow polls Greenhouse for newly-opened reqs, finds past candidates who reached a late stage on a related req and were rejected for a non-disqualifying reason ("silver medalists"), re-scores each against the new req's rubric with Claude (Sonnet 4.6 by default), and posts a ranked shortlist to Slack. It never contacts a candidate, never adds anyone to a pipeline, and never moves a candidate in Greenhouse. The recruiter decides every outreach.

This README covers import, credentials, the per-job-family config format, the consent and fairness gates, and the dry-run procedure.

## Import

1. Open n8n → Workflows → Import from file → pick `candidate-rediscovery-n8n.json`.
2. Set the workflow timezone (top of the canvas) to your team's working timezone for sane audit-log timestamps. The default is UTC.
3. Do not enable the workflow yet. Configure credentials and at least one job-family config, complete the dry-run, then flip to enabled.

## Credentials (three required)

### `PLACEHOLDER_GREENHOUSE_CRED_ID` — Greenhouse Harvest API key

- Greenhouse admin → Configure → Dev Center → API Credential Management → Create New API Key → type "Harvest". Grant only the read permissions the flow uses: `GET` on Jobs, Applications, and Scorecards. The flow never writes to Greenhouse.
- In n8n, create an HTTP Basic Auth credential. Username = the API token. Password = empty. (Harvest authenticates as base64 of `token:` with a trailing colon — n8n's Basic Auth credential does this for you.)
- Bind the credential to the three Greenhouse nodes: `Fetch New Open Reqs`, `Fetch Rejected Pool`, `Fetch Scorecards`.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic API key

- console.anthropic.com → API Keys → Create Key. Restrict by IP if your n8n is behind a fixed egress.
- In n8n, create a credential of type "Anthropic API". Paste the key.
- Bind to the `Claude Re-Match` node. The model is set to `claude-sonnet-4-6` in the request body — change it there if you want to test other models.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

- Create (or reuse) a Slack app with the `chat:write` scope. Install to the workspace. Invite the bot into `#talent-rediscovery`.
- In n8n, create a Slack credential with the bot token (`xoxb-…`).
- Bind to the `Slack Digest` node.

### Environment variables

- `CONFIG_DIR` — directory holding the per-job-family config files. Default `/data/rediscovery`.
- `AUDIT_DIR` — directory for the JSONL audit log. Default `/data/audit`.
- `POLL_LOOKBACK_HOURS` — how far back `Fetch New Open Reqs` looks for newly-opened reqs. Must be **≥** the schedule interval (default 6) or a req opened between polls will be missed. Default 6.

## Config file format (one per job family)

The flow expects one config file per job family at `${CONFIG_DIR}/<family>.json`. The family is resolved from the new req's `job_family` custom field, or — if that is absent — the slugified name of the req's first department. Missing config → the flow halts for that req with `missing_config` and leaves the req for manual sourcing.

The config is the only place the matching rules live. Copy this, replace every value, and save as `<family>.json`:

```json
{
  "job_family": "backend-engineer",
  "version": "2026-06-15",
  "match_job_ids": [4012, 3987, 3654],
  "recency_months": 18,
  "min_stage_reached": ["Onsite", "Final Interview", "Reference Check", "Offer"],
  "rejection_reasons_allow": [
    "Position filled — strong candidate",
    "Hired another candidate",
    "Kept warm for future role",
    "Timing — not ready to move"
  ],
  "rejection_reasons_deny": [
    "Failed background check",
    "Not legally authorized to work",
    "Conduct / values concern",
    "Failed reference check",
    "Withdrew — compensation mismatch",
    "Do not contact"
  ],
  "do_not_contact_tags": ["do-not-contact", "gdpr-erased", "opted-out"],
  "fit_threshold": 4,
  "top_n": 10,
  "rubric": {
    "role": "Senior Backend Engineer (Distributed Systems)",
    "dimensions": {
      "fit": {
        "must_have": [
          "Production Go or Rust (3y+)",
          "Owned a distributed-system migration"
        ],
        "anchors": {
          "5": "Late-stage scorecards show owned, measurable distributed-system outcomes that map to this req's must-haves",
          "4": "Strong scorecards on the core skill; one must-have unconfirmed",
          "3": "Adjacent skills; would need a fresh screen on the core must-have",
          "2": "Partial overlap; likely a stretch for this req",
          "1": "No scorecard evidence the candidate matches this req"
        }
      }
    }
  }
}
```

- `match_job_ids` are the **feeder reqs** — the past Greenhouse job IDs whose late-stage rejects count as silver medalists for this family. Find them in the URL of each job in Greenhouse. This is what scopes "related req"; the flow does not guess relatedness.
- `min_stage_reached` is the late-stage gate. A candidate rejected at "Application Review" or "Phone Screen" is not a silver medalist — they never got a real read. Use your own stage names exactly as they appear in Greenhouse.
- `rejection_reasons_deny` is the safety floor and **deny wins over allow**. Any disqualifying reason — failed background/reference check, conduct, no work authorization, an explicit do-not-contact — must be listed here so the candidate is never re-surfaced.
- The config is hashed (SHA-256, first 16 hex chars) per run and the hash is written to the audit log and the Slack footer, so the exact rules used on a given date are reproducible.

## Consent and fairness gates (do not weaken to widen the pool)

Two layers protect the candidate, both **before** the LLM call:

1. **`Eligibility Filter`** drops any application that is not a feeder-req match, did not reach a late stage, carries a disqualifying or non-allow-listed rejection reason, falls outside the recency window, or whose candidate carries a do-not-contact / erasure / opt-out tag.
2. **`Claude Re-Match`** is instructed not to inherit the prior reject decision and not to score on protected-class proxies (name, school as a standalone signal, age, gender, employment gaps), and to cite verbatim scorecard evidence — no citation forces fit to 1.

The recency window exists because GDPR requires you not to hold or re-process candidate data beyond the retention period you told the candidate about — commonly 12–24 months for unsuccessful applicants. Set `recency_months` to your stated retention period or shorter; never longer. Candidates past the window are dropped, not re-contacted.

If you find yourself wanting to delete a deny-list reason or stretch the recency window to grow the shortlist, that is exactly the decision a recruiter — not the flow — should make case by case, in Greenhouse, with the candidate's consent status in view.

## Dry-run procedure

1. Author one config file for a family where you recently filled a role and remember the runner-up candidates.
2. Temporarily point `match_job_ids` at the feeder reqs and set the new-req trigger to fire manually: in n8n, click "Execute workflow" with `Fetch New Open Reqs` returning the already-open target req (or pin a sample job item).
3. Read the Slack digest. The runner-ups you remember should appear near the top. If a known strong silver medalist is missing, check, in order: were they within the recency window, did they reach a `min_stage_reached` stage, was their rejection reason allow-listed, do they carry a suppression tag.
4. If obvious mis-fits rank high, the rubric anchors are too loose or the scorecards are thin — look at the `evidence` line in the digest. Empty or paraphrased evidence means the model had little to work with (the candidate was rejected before substantive interviews); raise `min_stage_reached`.
5. Only switch the workflow `active: true` after a digest you would actually act on.

## First-run sanity check

After enabling, watch the first real digest:

1. Confirm the `Confirm first:` line on each candidate is specific (e.g. "still in-region; was a 2024 reject so re-screen on the new framework"). Generic lines mean the model is guessing — check it is on Sonnet 4.6.
2. Confirm the `config <sha>` in the Slack footer matches the file you authored. A mismatch means the wrong family file loaded.
3. Confirm `${AUDIT_DIR}/rediscovery-<YYYY-MM>.jsonl` exists and has one line per scored candidate. No file means you are operating without the audit trail that a GDPR / EEOC inquiry about automated re-contact would require.

## Known limits

- **Active-elsewhere check is the recruiter's, not the flow's.** The pool query returns rejected applications only, so it cannot tell whether a candidate is currently active on another open req. The recruiter sees that in Greenhouse before reaching out; the flow does not auto-suppress active candidates.
- **A candidate who matched via two feeder reqs is scored twice**, then de-duplicated in `Build Digest` (the higher fit wins). The duplicate scoring is a small, bounded token cost, not a correctness problem.
- **Scorecard text is the only grounding.** Greenhouse does not return parsed resume text via Harvest, so a candidate rejected before any substantive interview has thin scorecards and will score low even if their resume is a strong match. That is intended: re-surface people you actually evaluated, not your whole archive.
- **No dedupe table across runs.** If the same req stays open across two polls it will not re-fire (the `created_after` filter only catches newly-opened reqs), but re-opening a req would re-digest it. The audit log makes repeats visible; add a seen-reqs check in front of `Load Match Config` if your audit posture needs hard idempotency.
