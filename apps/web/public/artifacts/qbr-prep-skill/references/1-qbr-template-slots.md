# QBR template slots — TEMPLATE

> Replace this template's slot list with the actual named placeholders
> in your team's QBR deck (Google Slides or PowerPoint). The qbr-prep
> skill reads this file on every run; without your real slot map, the
> skill emits content keyed to slot names that your deck-assembly script
> cannot find.

## Template identity

- `template_id`: `standard-quarterly`
- `format`: `google-slides` | `pptx`
- `template_url_or_path`: `{Drive URL or local path}`
- `last_edited`: `{YYYY-MM-DD}`

## Slot manifest

Each row is one named placeholder in the deck. The skill emits one fenced block per slot in its output Markdown; the deck-assembly script splits on the slot name and injects.

| Slot name | Slide | Data shape | Required | Notes |
|---|---|---|---|---|
| `cover_account_name` | 1 | string | yes | Pulled from Salesforce Account.Name verbatim |
| `cover_quarter` | 1 | string | yes | Format `Q{N}-{YYYY}` |
| `exec_summary` | 2 | bullet list, 5 items | yes | One fact per bullet, no adjectives |
| `usage_trend` | 3 | paragraph + chart caption | yes | Three sentences max; chart is rendered separately by the deck-assembly script from the usage CSV |
| `top_wins` | 4 | bullet list, 3 items | yes | Each bullet has outcome, metric, optional customer quote |
| `risk_summary` | 5 | table | yes | Columns: Risk, Severity, Mitigation owner, Mitigation |
| `success_plan_progress` | 6 | table | conditional | Emits `SUCCESS_PLAN_UNAVAILABLE` if no plan; deck-assembly blanks the slide |
| `expansion_paths` | 7 | numbered list, 3 items | yes | Each item names signal type and confidence |
| `next_quarter_commitments` | 8 | bullet list | yes | Editable by CSM during live call; skill seeds with carry-over from success plan |
| `appendix_call_themes` | 9 | bullet list | optional | Surfaced from Gong synthesis; only included if Gong coverage was sufficient |

## Severity vocabulary

The `risk_summary` slot uses a fixed three-value scale. Other vocabularies break the deck-assembly script's color logic.

- `red` — active blocker, escalated to AE or product
- `yellow` — emerging concern, owner assigned, no escalation yet
- `green` — resolved within the quarter, listed for visibility

## Confidence vocabulary

The `expansion_paths` slot uses a fixed three-value scale.

- `high` — usage signal AND persona signal AND budget signal present
- `medium` — two of the three signals present
- `low` — one signal, included for the live QBR conversation rather than commitment

## Usage CSV schema

The `usage_trend` slot validates against this header before generating content. Missing columns cause the slot to render blank.

| Column | Type | Description |
|---|---|---|
| `event_date` | date | One row per day |
| `metric_name` | string | Constrained to the team's metric vocabulary (DAU, WAU, key-action count) |
| `metric_value` | number | The value for that metric on that day |
| `seat_count` | integer | Active seats on that day |
| `feature_area` | string | Category for grouping in the trend narrative |
