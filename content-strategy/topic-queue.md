# Topic queue

State file consumed by the daily authoring slots (`ooligo-author-am`, `ooligo-author-pm`) and the `ooligo-evergreen-refresh` weekly slot. Refilled weekly by `ooligo-topic-refill`. Append-only — never reorder, never remove. Items are consumed by appending `→ slug: <canonical-slug>` to the line.

Format per item:

```
- [type:tool|comparison|workflow|learn|stack] [vertical:revops|legal-ops|recruiting|cross] <one-line page spec>
```

`refresh:` items live in the top `## Refresh queue` section, prepended by the weekly freshness sweep. New-content items live under `## Tools`, `## Comparisons`, `## Workflows`, `## Learn`, `## Stacks`.

`last-swept:` (no value yet — first sweep will set it).

## Refresh queue

(Empty — the first freshness sweep will populate this.)

## Tools

(Empty — the first topic-refill run will populate this with ~40 unconsumed items spread across the section headers.)

## Comparisons

## Workflows

## Learn

## Stacks
