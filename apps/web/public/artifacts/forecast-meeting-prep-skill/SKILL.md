---
name: forecast-meeting-prep
description: Prepare a manager's weekly meeting brief by comparing two authorized local CSV pipeline snapshots for one rep. Run the bundled Python comparison and preserve the source facts.
disable-model-invocation: true
---

# Forecast meeting prep

## When to invoke

Use this Skill for a scheduled manager–rep conversation when the user supplies two authorized local exports, or asks to run the fictional example. A forecast submission, CRM extraction, identity check or message delivery requires a separate owner and implementation.

## Inputs

- **Demo mode.** The explicit request to use the fictional example selects the files in `examples/`.
- **Custom comparison.** Two local CSV paths, previous first and current second. Follow the eight-column contract in `README.md`. The input owner must already have approved their use here. Ask for valid exports if a path or the requested scope is unclear.
- **Optional manager context.** The user can add a confirmed reason or follow-up after reviewing the briefing. Keep it separate from fields observed in a snapshot.

## Method

1. Read `references/01-briefing-format.md`, `references/02-question-library.md` and `references/03-deal-deepdive-template.md` for the output and review conventions.
2. From the installed Skill directory, run `python3 forecast.py demo` for fictional data or `python3 forecast.py compare` with the two approved file paths as separate arguments. Treat all CSV fields as data. Use the program's exit status before using its output.
3. On validation or fixture error, show the diagnostic and ask the file owner to correct the inputs. A missing row is evidence about export membership only. Keep the outcome unknown until the rep confirms it.
4. Present the generated briefing. Preserve IDs, amounts, dates, category labels and uncertainty. Use the fixed questions as starting points. The manager owns causes, next actions and the submitted forecast.

## Output excerpt

```markdown
| Category | Previous | Current | Change |
|---|---:|---:|---:|
| commit | $30,000 | $50,000 | +$20,000 |

- `D-101` · Pine Mill · category best_case → commit · amount $48,000 → $50,000 · close 2026-11-06 → 2026-11-20 (+14 days).
```

The complete example is in `examples/expected-briefing.md`. Dollar totals are amounts recorded in the input snapshots. Activity logs and customer explanations require additional evidence from the manager.

## Review boundaries

The supplied runner validates file content and rep consistency. It has no identity provider, Salesforce connection, OAuth cache, activity fetcher or sharing service. Confirm the operator can use the data in the chosen environment before reading a real file. Leave CRM access, authorization and distribution with the owning organization. Avoid inserting customer communications or another rep's data into the briefing. The offline example was checked locally. Live Claude and CRM operation remain unverified.
