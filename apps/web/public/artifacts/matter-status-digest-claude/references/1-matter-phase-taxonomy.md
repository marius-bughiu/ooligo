# Matter phase taxonomy — TEMPLATE

> Replace this template's contents with your firm's actual phase taxonomy.
> The matter-status-digest skill uses this to bucket raw `phase` values
> from the matter export into a stable, GC-readable set. Without it, the
> digest groups by whatever string each attorney typed — and the
> portfolio summary becomes noise.

## Canonical phases

These are the phase buckets that appear in the digest's portfolio summary, in the order they appear. Edit the names; keep the structure.

| Canonical name | Description | GC question this answers |
|---|---|---|
| Intake | Matter opened, conflict check + scoping in flight | "What's coming in?" |
| Discovery | Document review, depositions, written discovery | "Where's the team's time going?" |
| Motion practice | Active motions filed or in preparation | "Where are we burning outside-counsel hours?" |
| Mediation | Active mediation or settlement negotiation | "What's resolving without trial?" |
| Trial prep | Pre-trial filings, witness prep, exhibit prep | "What's coming to a head?" |
| Trial | In active trial | "What needs my immediate availability?" |
| Settlement | Terms agreed, settlement papers in flight | "What's closing?" |
| Closed (last 7d) | Matters closed in the digest period | "What just resolved?" |

## Mapping rules

The export's raw `phase` field may contain attorney-typed values. The skill maps them to canonical phases using these rules. Add to this list as you discover new raw values.

| Raw value (case-insensitive) | Canonical |
|---|---|
| `intake`, `new`, `opened`, `conflict-check` | Intake |
| `discovery`, `doc-review`, `depo`, `written-discovery` | Discovery |
| `motion`, `motion-to-dismiss`, `summary-judgment`, `MSJ` | Motion practice |
| `mediation`, `settlement-talks`, `negotiating` | Mediation |
| `trial-prep`, `pretrial`, `final-prep` | Trial prep |
| `trial`, `in-trial` | Trial |
| `settlement`, `settling`, `papering` | Settlement |
| `closed`, `dismissed`, `judgment-entered`, `settled-and-closed` | Closed (last 7d) — only if `closed_date` within 7 days of digest date |

## Unmapped values

If the skill encounters a raw `phase` value not in the table above, it surfaces it in a "Mapping gaps" footer section in the digest with the matter ID, raw value, and a "needs taxonomy update" flag. Do not let unmapped values silently fall into a default bucket — that is how the portfolio summary drifts from the actual portfolio.

## Last edited

YYYY-MM-DD
