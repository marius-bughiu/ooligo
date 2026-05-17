# Roadmap reflection (quarterly)

Diff [../ROADMAP.md](../ROADMAP.md) against repo reality and append a drift report to [../ROADMAP_DRIFT.md](../ROADMAP_DRIFT.md). Scheduled quarterly: 1st of March, June, September, December at 11:00 local.

This routine **does not edit ROADMAP.md**. Drift is surfaced for the user to act on; the roadmap itself stays human-curated.

## Step 1 — Snapshot repo reality

Build a per-quarter snapshot of the current state:

### Pages live (EN canonical)

- Tools: count `content/tools/en/*.mdx`, group by `verticals` (a tool can multi-vertical)
- Comparisons: count `content/comparisons/en/*.mdx`, group by `type` (pairwise/roundup/alternatives) and by `verticals`
- Workflows: count `content/workflows/en/*.mdx`, group by `artifact_type` and `verticals`
- Learn: count `content/learn/en/*.mdx`, group by `type`
- Stacks: count `content/stacks/en/*.mdx`, group by `verticals`

### Locales

For each non-EN locale, count `content/<entity>/<locale>/*.mdx` and compute parity vs EN.

### Newsletter / community / monetization signals

- Count newsletter sign-up Cloudflare Pages Functions logs if available (note: this routine has read-only file access; may need to defer to the manual-fill section of the retro for these)
- Read `CORRECTIONS.md` and bucket entries by error class for the quarter

## Step 2 — Diff against ROADMAP.md

Parse `ROADMAP.md`. For each phase (Phase 0 through Phase 7):

For each checklist item under the phase:

- **Checked (`- [x]`)** — confirm against repo state. If the item claims "X tool entries", verify the count matches. If reality is below the claim, flag as `OVERSTATED`. If reality is above the claim by ≥20%, flag as `UNDERCLAIMED` (the roadmap could be bumped).
- **Unchecked (`- [ ]`)** — check if reality shows the item is actually done (e.g. the roadmap shows `[ ] Per-locale Google Search Console properties`, but `~/.config/ooligo/gsc-service-account.json` exists and `gsc-candidates.json` has data — reality says this might be partly done). Flag as `PROBABLY-DONE-NOT-CHECKED`. Otherwise leave as pending.

Also check phase-level claims:

- "Phase 1 — Goal: ~250 indexed pages in EN/RevOps" — does repo actually have ~250 EN/RevOps pages?
- "Phase 4 — Goal: ~2,500 pages" — total page count vs goal
- Locale-status table at the bottom of ROADMAP.md (Launched / Seeded / etc.) — confirm against actual catalog counts.

## Step 3 — Identify drift categories

- **Achievement drift** — roadmap understates reality (we shipped more than claimed). Suggest a roadmap bump.
- **Aspiration drift** — roadmap overstates reality (we claim something we haven't actually shipped). Suggest either correcting the roadmap or doing the work.
- **Phase confusion** — items claimed for one phase that more naturally belong in another phase based on what they actually are.
- **Stale `as of` date** — the "Public metrics" section's `*as of YYYY-MM-DD*` is older than 90 days.

## Step 4 — Compose the drift report

Append to `ROADMAP_DRIFT.md`:

```markdown
## YYYY-MM-DD — Quarterly drift report

*Generated <today>. Source of truth: ROADMAP.md (unmodified by this routine).*

### Headline numbers

- Total EN content pages: <count> (roadmap's most recent claim: <count>; delta <±N>)
- Total pages × 6 locales: <count>
- Verticals at full parity (≥40 tools, ≥10 workflows, ≥30 learn): <list>
- Locales at full parity with EN: <list>

### Phase-by-phase

#### Phase <N> — <title>

- Item: "<wording from ROADMAP.md>"
  - Status in roadmap: [x] / [ ]
  - Repo reality: <observed state>
  - Drift: <ACHIEVEMENT | ASPIRATION | PHASE-CONFUSION | NONE>
  - Suggestion: <one line>
- ...

(Repeat for each phase that has drift items; skip phases with none.)

### Locale status

| Locale | Roadmap claim | Actual EN parity |
|---|---|---|
| en | Launched | Canonical (407 pages) |
| es | Launched | <count>/<en-count> = X% |
| pt-BR | Launched | ... |
| de | Seeded (3 tools) | ... |
| fr | ... | ... |
| ja | ... | ... |

### CORRECTIONS.md signal

- Open corrections this quarter: <count>
- Recurring error classes (≥3 in quarter): <list, or "none">
- Action: per CONTENT_PIPELINE.md §Correction loop, any class with ≥3 entries should trigger a pipeline/voice doc amendment. See `ooligo-corrections-review` quarterly run.

### Suggested ROADMAP.md edits

(One line per suggestion; the user applies them manually.)

- [ ] Bump Phase 1 tool count from "50" to "120"
- [ ] Mark Phase 5 "EN/Legal Ops" as in-progress (3 newsletter posts shipped to draft folder)
- [ ] Update "as of YYYY-MM-DD" in §Public metrics to <today>
- [ ] ...

### Open questions for the user

- ...
```

## Step 5 — Commit

```
chore: roadmap drift report YYYY-MM-DD
```

Single file changed: `ROADMAP_DRIFT.md`. Include the `Co-Authored-By` trailer. Push to `origin main`.

## Guardrails

- **Never edit ROADMAP.md.** Drift is surfaced as suggestions; the user decides what to apply.
- Phase numbers and item wording should be quoted verbatim from ROADMAP.md so the user can find them.
- If a roadmap item is ambiguous (e.g. "Tagging" — what's the success criterion?), flag the ambiguity rather than guess what counts.

## Autonomous mode

Run end-to-end on the quarter's 1st. If `ROADMAP_DRIFT.md` doesn't exist, create it with a brief header explaining the format.
