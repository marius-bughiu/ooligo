# Corrections review (quarterly)

Bucket [../CORRECTIONS.md](../CORRECTIONS.md) entries by error class; flag any class with ≥3 entries in the last quarter; draft amendments to [../CONTENT_PIPELINE.md](../CONTENT_PIPELINE.md) or [../CONTENT_VOICE.md](../CONTENT_VOICE.md) as a PR.

This is the only routine that opens a PR rather than pushing direct to main — pipeline-doc changes warrant the review surface even when the author is autonomous. Scheduled quarterly: 1st of March, June, September, December at 12:00 local.

## Step 1 — Read CORRECTIONS.md

`CORRECTIONS.md` lives at the repo root. Per CONTENT_PIPELINE.md §Correction loop, entries should record:

- date
- source (GitHub issue / email / Slack)
- affected page
- error class (factual / stale / voice / missing context / bias)
- resolution commit SHA
- reviewer

Parse the file into a structured list. Tolerate format drift — if entries are partly free-form prose, do best-effort extraction and flag anomalies.

## Step 2 — Filter to the quarter

Today's date is `YYYY-MM-DD`. The quarter bracket is:

- **Q1**: Jan 1 – Mar 31 (run 1st of March → bracket is the previous Dec 1 – Feb 28/29 OR the running Jan 1 – Feb end; pick the calendar quarter that just ended)
- **Q2**: Apr 1 – Jun 30 (run 1st of June)
- **Q3**: Jul 1 – Sep 30 (run 1st of Sep)
- **Q4**: Oct 1 – Dec 31 (run 1st of Dec)

Use the calendar quarter that just ended. So a run on `2026-06-01` brackets Q1 2026 (Jan 1 – Mar 31). A run on `2026-09-01` brackets Q2 2026 (Apr 1 – Jun 30). And so on.

Filter `CORRECTIONS.md` entries to those dated within the bracket.

## Step 3 — Bucket by error class

Standard classes (per CONTENT_PIPELINE.md §Correction loop):

- **factual** — wrong tool capability, wrong price, wrong integration, etc.
- **stale** — claim was true at `last_reviewed` but is no longer; suggests an SLA issue
- **voice** — banned vocab, hedging, padding signal that escaped pre-commit
- **missing context** — claim is technically true but missing the constraint that makes it actionable
- **bias** — affiliate or sponsor relationship influenced the recommendation
- **other / uncategorized** — bucket for anything that doesn't fit

For each class, count entries.

## Step 4 — Identify recurring classes

A class is **recurring** if it has ≥3 entries in the bracket. Per CONTENT_PIPELINE.md §Correction loop, this triggers a pipeline-doc or voice-doc amendment.

For each recurring class:

1. Read the entries. Identify the common failure mode (what specifically was wrong? what does it suggest the bar is missing?).
2. Draft a specific amendment to CONTENT_PIPELINE.md or CONTENT_VOICE.md that, if applied, would have caught the kind of error these entries represent at pre-commit time.
3. The amendment is NOT a band-aid for the specific pages — those are already fixed per the `resolution commit SHA` in each entry. The amendment is a tightening of the bar so future authoring catches this class.

Examples:

- **factual recurring (price errors)** — amend CONTENT_PIPELINE.md §Tools pre-commit checklist to require: "Pricing band cited matches vendor's pricing page within the last 14 days; if older, refresh `last_reviewed` and re-cite."
- **voice recurring (vague-superlatives slipping past `check:vocab`)** — amend CONTENT_VOICE.md banned-vocab list and update `check:vocab` script to catch the new terms.
- **bias recurring (affiliate entries trending more favorable than non-affiliate equivalents)** — amend CONTENT_PIPELINE.md §Affiliate disclosure with a stricter independence test, possibly requiring side-by-side verdict comparison against the non-affiliate alternative.

## Step 5 — Open a PR

If any recurring classes were found:

1. Create a branch: `corrections-review-YYYY-QQ` (e.g. `corrections-review-2026-Q2`).
2. Apply the drafted amendments to CONTENT_PIPELINE.md and/or CONTENT_VOICE.md.
3. Run `npm run validate:config` to confirm no schema/format breaks.
4. Commit:

```
docs(pipeline|voice): amend per QQ YYYY corrections review

Recurring classes (≥3 in bracket): <list>

Amendments:
- CONTENT_PIPELINE.md §<section>: <one-line summary>
- CONTENT_VOICE.md §<section>: <one-line summary>

Source: see ROADMAP_DRIFT.md and CORRECTIONS.md (Q-bracket: YYYY-MM-DD to YYYY-MM-DD)
```

5. Push the branch. Open a PR via `gh pr create`:

```
gh pr create \
  --title "Corrections review — QQ YYYY" \
  --body "$(cat <<'EOF'
## Summary

Quarterly review of CORRECTIONS.md per CONTENT_PIPELINE.md §Correction loop. The classes below recurred ≥3 times in <bracket> and trigger a bar tightening:

- <class>: <count> entries — <one-line common mode>
- ...

## Amendments

(Lists each amended doc + section + the change.)

## Source entries

(Links to CORRECTIONS.md entries by date + page, so the user can verify each one.)

## Test plan

- [ ] Validate `npm run validate:config` still passes
- [ ] Validate `npm run check:vocab` against a sample of post-merge entries
- [ ] Spot-check the next 5 authoring runs after merge against the tightened bar
EOF
)"
```

This is the ONLY routine that opens a PR (rather than push direct to main) — the pipeline contract is foundational enough that a review surface adds value even when there's no second reviewer.

## Step 6 — If no recurring classes

If zero classes hit ≥3 entries:

1. Append a short log entry to a new file `content-strategy/corrections-review-log.md` (create if missing):

```markdown
## QQ YYYY (run YYYY-MM-DD)

- Entries in bracket: <total count>
- Classes:
  - factual: <count>
  - stale: <count>
  - voice: <count>
  - missing context: <count>
  - bias: <count>
  - other: <count>
- No class recurred ≥3 times — no amendment proposed.
```

2. Commit:

```
chore: corrections review QQ YYYY — no recurring classes
```

Push direct to main (no PR needed for a status log).

## Guardrails

- **Never auto-merge the PR** — the user reviews and merges. This routine pushes the branch and opens the PR; that's the end of its job.
- **Never edit prior CONTENT_PIPELINE.md / CONTENT_VOICE.md content unrelated to the amendments** — keep the diff focused.
- Don't pad with weak amendments. If the recurring class has a fix that's already implied by existing text, the action is to clarify or strengthen the existing section, not to invent a new one.

## Autonomous mode

Run end-to-end on the quarter's 1st. The PR awaits human review.
