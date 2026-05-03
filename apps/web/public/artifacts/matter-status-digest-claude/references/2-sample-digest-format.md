# Sample digest format — TEMPLATE

> This is the literal Markdown the matter-status-digest skill renders.
> Edit this file to change the layout — do not edit the skill.
> Replace placeholder text in {curly braces} with the GC's actual preferences.

---

# Matter status digest — {Week of YYYY-MM-DD}

## Portfolio summary

| Phase | Count | Δ vs last digest |
|---|---|---|
| Intake | {N} | {+/-/0} |
| Discovery | {N} | {+/-/0} |
| Motion practice | {N} | {+/-/0} |
| Mediation | {N} | {+/-/0} |
| Trial prep | {N} | {+/-/0} |
| Trial | {N} | {+/-/0} |
| Settlement | {N} | {+/-/0} |
| Closed (last 7d) | {N} | — |
| **Active total** | **{N}** | **{+/-/0}** |

Outside-counsel run-rate (month-to-date): ${N} (vs ${N} prior month at this point)

## Needs GC attention this week

> Maximum 5 items. If more than 5 matters meet escalation criteria, rank by risk tier
> then by spend impact and surface only the top 5. The rest go in "FYI" below.

1. **{Matter name}** (matter #{ID}, owner: {Last name}). {One-sentence what-and-why}. Action: {one verb, one object}.
2. ...

## Deadline cluster — week of {date}

> Surface only if ≥3 deadlines fall in a single 7-day window in the next 30 days.
> Single deadlines go in "FYI" below.

{N} deadlines in this window. Resource check recommended.

- {YYYY-MM-DD}: {deadline type} (matter #{ID})
- ...

## Status changes since last digest

> One bullet per matter that changed phase. Closed matters listed separately.

- Matter #{ID} — phase moved from {A} to {B}
- ...

Closed since last digest:
- Matter #{ID}, #{ID}, #{ID}

## Outside-counsel spend flags

> Surface only firms / matters where MTD spend deviates >20% from prior month at same date.

| Matter | Firm | MTD | vs prior month | Note |
|---|---|---|---|---|
| #{ID} | {Firm} | ${N} | {+/-N%} | {one-line context} |

## FYI — no action requested

> Lower-priority status changes, single deadlines, routine filings.
> Keep this section short — under 10 bullets — or it stops being scannable.

- ...

## Stale status — verify

> Matters whose last_activity_date is >14 days old. The GC should
> not act on these without first confirming current state.

- Matter #{ID} (owner: {Last name}) — last activity {YYYY-MM-DD}, {N} days ago

## Generated

{YYYY-MM-DD HH:MM UTC} · {N} matters processed · {N} escalations · digest SHA `{hash prefix}`
