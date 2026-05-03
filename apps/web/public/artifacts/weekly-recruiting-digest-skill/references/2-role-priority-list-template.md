# Role priority list — TEMPLATE

> Replace this template with your team's actual role priority list
> before each weekly run. The skill reads this file to decide which
> roles get a per-role drill-down vs which get rolled up into the
> appendix. Without it the skill defaults to alphabetical, which is
> wrong every week.

## How the skill uses this file

- **Top-N drill-down selection.** The skill drills down on the top N
  roles ranked by `priority` (critical first, then high, then
  medium). N defaults to 5; configurable up to 12 in the skill run
  config.
- **Stage SLA loading.** The per-stage SLAs in the role rows are
  what step 2 of the skill checks against when computing
  "time-in-stage exceeded SLA".
- **Confidentiality flagging.** Roles with `confidentiality: restricted`
  are summarised, not drilled, regardless of priority.
- **Critical-role validation.** Step 1 of the skill validates that
  every `priority: critical` role still exists in the current ATS
  snapshot, and surfaces any that have been closed or paused since
  this file was last edited.

## Per-role rows

Edit weekly. Drop closed roles. Add new opens. The skill captures
this file's SHA-256 in its run output so weekly diffs are visible
in retro.

```yaml
roles:
  - requisition_id: REQ-2026-118
    role_title: Senior Backend Engineer
    team: Platform
    priority: critical            # critical | high | medium | low
    target_time_to_fill_days: 35
    target_start_date: 2026-06-15
    confidentiality: standard      # standard | restricted
    stage_slas_days:
      recruiter_screen: 3
      hiring_manager_review: 5
      technical_screen: 7
      onsite: 10
      offer: 5
    notes: "Senior IC backfill; previous incumbent leaves 2026-05-20."

  - requisition_id: REQ-2026-141
    role_title: Director of Sales
    team: Revenue
    priority: critical
    target_time_to_fill_days: 60
    target_start_date: 2026-08-01
    confidentiality: restricted    # exec search; appendix-only summary
    stage_slas_days:
      recruiter_screen: 5
      hiring_manager_review: 7
      panel_round_1: 14
      panel_round_2: 14
      offer: 10
    notes: "Replacement search. Limit visibility to Head of Talent + CEO."

  - requisition_id: REQ-2026-203
    role_title: Account Executive (NYC)
    team: Revenue
    priority: high
    target_time_to_fill_days: 45
    target_start_date: 2026-07-01
    confidentiality: standard
    stage_slas_days:
      recruiter_screen: 3
      hiring_manager_review: 5
      hiring_manager_call: 5
      panel: 10
      offer: 5
    notes: "Two NYC HQ openings on same panel; share scorecard."

  - requisition_id: REQ-2026-219
    role_title: Senior Product Manager
    team: Product
    priority: high
    target_time_to_fill_days: 50
    target_start_date: 2026-07-15
    confidentiality: standard
    stage_slas_days:
      recruiter_screen: 3
      hiring_manager_review: 5
      portfolio_review: 7
      panel: 10
      offer: 5
    notes: "B2B SaaS PM background required."

  - requisition_id: REQ-2026-244
    role_title: Customer Success Manager
    team: Customer Success
    priority: medium
    target_time_to_fill_days: 40
    target_start_date: 2026-08-15
    confidentiality: standard
    stage_slas_days:
      recruiter_screen: 3
      hiring_manager_review: 5
      panel: 7
      offer: 5
    notes: "Backfill, not net new."
```

## Priority-level definitions

To keep priority assignment defensible week-to-week:

- **critical** — revenue-blocking, leadership-blocking, or
  regulatory-deadline-driven. Every critical role drills down even
  if the priority list overflows N.
- **high** — important to the quarter's plan but not blocking. Drills
  down only if the top-N slots are not all consumed by critical roles.
- **medium** — normal-priority backfills and growth roles. Appendix
  by default.
- **low** — exploratory or speculative reqs (talent pipelining,
  pre-funding hiring). Appendix only; never drilled.

## Last edited

<YYYY-MM-DD> — bump weekly. The skill warns if this file is older
than 7 days, on the assumption that a stale priority list produces
a digest pointed at the wrong roles.
