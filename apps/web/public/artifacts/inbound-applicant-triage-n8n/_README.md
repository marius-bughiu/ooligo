# Inbound applicant triage — n8n flow

This flow listens for Ashby `application.created` webhooks, scores each application against a per-role rubric using Claude (Sonnet 4.6 by default), and routes the result to one of three Slack channels: `#fast-track`, `#review-needed`, `#surfaced-not-rejected`. It never auto-rejects. The recruiter is the sole rejection authority.

This README covers import, credentials, the rubric file format, the fairness pre-flight, and the dry-run procedure.

## Import

1. Open n8n → Workflows → Import from file → pick `inbound-applicant-triage-n8n.json`.
2. Set workflow timezone (top of the canvas) to your team's working timezone for sane audit-log timestamps. The default is UTC.
3. Do not enable the workflow yet. Configure credentials and rubrics first; complete the dry-run; only then flip to enabled.

## Credentials (three required)

### `PLACEHOLDER_ASHBY_CRED_ID` — Ashby API key

- Ashby admin → Settings → API → Generate new API key. Pick *read* scope only; the flow does not write back to Ashby.
- In n8n, create an HTTP Basic Auth credential. Username = the API key. Password = empty.
- Bind the credential to the `Fetch Candidate (Ashby)` node.

### `PLACEHOLDER_ANTHROPIC_CRED_ID` — Anthropic API key

- console.anthropic.com → API Keys → Create Key. Restrict by IP if your n8n is behind a fixed egress.
- In n8n, create a credential of type "Anthropic API". Paste the key.
- Bind to the `Claude Score` node. The model is set to `claude-sonnet-4-6` in the request body — change it there if you want to test other models.

### `PLACEHOLDER_SLACK_CRED_ID` — Slack bot token

- Create (or reuse) a Slack app with the `chat:write` scope. Install to the workspace. Invite the bot into `#fast-track`, `#review-needed`, `#surfaced-not-rejected`.
- In n8n, create a Slack credential with the bot token (`xoxb-…`).
- Bind to all three Slack nodes.

### Webhook signing secret

The `Verify Signature` node reads `ASHBY_WEBHOOK_SECRET` from the n8n environment. Set it in your n8n container env (or in n8n Cloud's variables panel). Get the value from Ashby admin → Settings → Webhooks → the secret shown when you create the webhook destination. **Do not skip this.** The webhook URL is internet-reachable; without signature verification anyone can post fake applications to your Slack and your audit log.

## Rubric file format

The flow expects one rubric file per role, at `${RUBRIC_DIR}/<role-slug>.json` (default `RUBRIC_DIR=/data/rubrics`). The `role_slug` comes from Ashby's job-slug field. If a rubric is missing, the flow halts with `missing_rubric` and the application stays in the ATS for manual triage.

A working rubric looks like this. Copy it, replace every value, and save as `<role-slug>.json`:

```json
{
  "role": "Senior Backend Engineer (Distributed Systems)",
  "level": "Senior IC (L5)",
  "version": "2026-05-01",
  "dimensions": {
    "skill_match": {
      "must_have": [
        "Production Go or Rust experience (3y+)",
        "Owned a distributed-system migration from monolith"
      ],
      "anchors": {
        "5": "Led a multi-team migration with measurable latency / cost outcomes named in the resume",
        "4": "Owned a service rewrite with measurable outcomes named",
        "3": "Contributed to a distributed-system codebase, no clear ownership signal",
        "2": "Distributed-system exposure but no production ownership",
        "1": "No evidence in the resume of distributed-system work"
      }
    },
    "level_fit": {
      "must_have": [
        "Senior IC scope: cross-team influence, mentors juniors, owns a service end-to-end"
      ],
      "anchors": {
        "5": "Staff or Senior Staff title at a peer-tier company; cross-org scope named",
        "4": "Senior IC at a peer company with explicit ownership scope",
        "3": "Senior title but scope ambiguous; or strong mid-level signal",
        "2": "Mid-level scope only",
        "1": "Junior or new-grad scope"
      }
    },
    "location_fit": {
      "must_have": ["US Pacific or Mountain time zone", "Authorized to work in the US without sponsorship"],
      "anchors": {
        "5": "Same metro as the office",
        "4": "Same time zone, remote",
        "3": "±2 hours, remote",
        "2": "Outside ±2 hours but within US, remote",
        "1": "Time-zone offset >5 hours, or no work auth"
      }
    },
    "response_likelihood": {
      "must_have": [],
      "anchors": {
        "5": "Cover letter cites the company / role specifically; resume updated <30 days ago",
        "4": "Generic cover letter but resume updated <60 days ago",
        "3": "No cover letter; resume updated <90 days ago",
        "2": "Resume updated 90-180 days ago",
        "1": "Resume staler than 180 days, or referral via an exec contact (different workflow)"
      }
    }
  }
}
```

The rubric is hashed (SHA-256, first 16 hex chars) per scoring run and the hash goes into the audit log. If you edit the rubric, the next score for the same application would have a different hash — the diff is visible in the audit log, not invisible.

## Fairness pre-flight (do not edit to make biased rubrics pass)

The `Load Rubric + Pre-Flight` node scans the rubric for these patterns and halts the flow if any match:

- `school[_-]?tier`
- `name[_-]?based`
- `employment[_-]?gap`
- `photo`
- `age`
- `pregnan(t|cy)`
- `culture[_-]?fit` (when standalone — without behavioral anchors it functions as a class proxy)

If you see a `rubric_failed_fairness_preflight` halt, do not edit the regex list. Edit the rubric: rewrite the dimension to score on observable behavior, not the proxy. School-prestige scoring in particular is the most common bias-amplification path in AI screening; rewriting it to score on technical depth and ownership signal closes the gap without losing fit-prediction power.

If your team needs to score on a dimension this list flags, that is exactly the kind of decision a NYC LL 144 bias audit (or EU AI Act conformity assessment for EU-resident candidates) is meant to surface. Get the audit done; do not edit the pre-flight away.

## Routing thresholds

Default in `Parse + Route`:

- `aggregate >= 16` → `#fast-track`
- `aggregate 12-15` → `#review-needed`
- `aggregate < 12` → `#surfaced-not-rejected`

Aggregate range is 4-20 (four dimensions, 1-5 each). The 12-15 band is the "discretion buffer" — applications close to either threshold go to recruiter review, not to either tail. Tune after a week of data.

EU-resident applicants with `aggregate >= 16` are forced to `#review-needed` rather than `#fast-track`, so the recruiter can confirm the AI-screening notice was served before any automated decision is recorded against the candidate.

## Dry-run procedure

1. Pick a role you sourced manually in the past 4-8 weeks. Export the application list from Ashby.
2. Replay each application by triggering the webhook manually (n8n → "Execute workflow" with a sample webhook payload — Ashby's webhook test panel can resend recent events).
3. Compare the flow's `#fast-track` bucket to your actual screen-pass list. The screen-pass set should be a subset of `#fast-track` ∪ `#review-needed`.
4. If your manual screen-passes are landing in `#surfaced-not-rejected`, the rubric anchors are too strict. Tune the anchors before raising the threshold; raising the threshold without re-anchoring just shifts the calibration error.
5. If `#fast-track` includes obvious mis-fits, the rubric is too loose on a dimension. Look at the per-dimension scores in the audit log and find the dimension with consistent over-scoring.

Only switch the workflow `active: true` after the dry-run looks right.

## First-run sanity check

After enabling, watch the next three real applications in the Slack channels:

1. Confirm the per-dimension evidence quotes the resume verbatim. If it doesn't (paraphrased or invented), the model is hallucinating; check that `Claude Score` is on Sonnet 4.6 and not a smaller model.
2. Confirm the `rubric_sha` matches the hash you'd compute locally. Mismatch means the wrong file is loading.
3. Confirm the audit log line shows up at `${AUDIT_DIR}/<YYYY-MM>.jsonl`. No file = the audit append is silently failing and you're operating without the audit trail that NYC LL 144 / EU AI Act requires.

## Known limits

- The flow scores against the resume + Ashby form data only. It does not parse PDFs that were not parsed by Ashby's intake (some legacy PDFs come through with empty `parsedText`). For those, `resume_text` is empty and `skill_match` will land at 1.
- The webhook handler does not implement an explicit dedupe table; n8n's own execution history is the dedupe surface. If your n8n is restarted mid-execution and Ashby re-fires the webhook, you may see a duplicate scoring run. Add a Redis-backed dedupe in front of `Verify Signature` if this matters for your audit posture.
- The flow assumes one application per webhook event. Bulk-imported applications fire one webhook each; if Ashby ever batches, the `Verify Signature` node would need to fan out.
