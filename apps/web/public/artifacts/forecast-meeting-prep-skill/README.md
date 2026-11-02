# Weekly forecast meeting prep

Prepare questions for one rep's forecast meeting from two dated CSV exports. The download includes four fictional opportunities per snapshot and a complete expected Markdown briefing. The offline runner uses Python 3.9+ and its standard library. It reads local files and writes the report to standard output.

## Run the example

Extract the ZIP and open a terminal in the directory containing `forecast.py`.

```sh
python3 forecast.py demo
python3 -B test_forecast.py
```

`demo` reads `examples/pipeline-2026-10-16.csv` and `examples/pipeline-2026-10-23.csv`, then compares the generated text with `examples/expected-briefing.md`. A match prints the briefing and exits successfully. The sample uses zero vendor requests, model tokens or paid accounts.

Commit rises from $30,000 to $50,000. Pine Mill enters commit, increases from $48,000 to $50,000 and moves its close date out by 14 days. Cedar Loom leaves commit while staying in the export. Maple Ferry disappears from the second file. Ask the rep to explain that absence before assigning an outcome.

## Use two authorized exports

```sh
python3 forecast.py compare prior.csv current.csv
```

The program reads both inputs fully before printing a briefing. Invalid input exits with status 2 and a diagnostic on standard error. Each file must have this header set. Column order can vary.

```csv
snapshot_date,rep_id,opportunity_id,account,category,amount,currency,close_date
```

| Field | Contract |
|---|---|
| `snapshot_date` | ISO calendar date (`YYYY-MM-DD`), identical throughout one file. Current must be 1–10 days after previous. |
| `rep_id` | A single stable rep ID shared by both files. |
| `opportunity_id` | Stable ID, unique within each snapshot and retained across weeks. Both ID fields accept 1–80 ASCII letters, digits, dots, underscores or hyphens and start with a letter or digit. |
| `account` | Nonempty printable single-line display label. Matching uses the opportunity ID. |
| `category` | Exactly `commit`, `best_case` or `upside`. Map your CRM values before exporting. |
| `amount` | Nonnegative plain decimal with up to 15 integer digits and two fractional digits. Omit grouping separators and currency symbols. |
| `currency` | `USD`. Normalize currency upstream using a documented policy. |
| `close_date` | ISO calendar date. A past-due open opportunity can still be present. |

Each file needs at least one row. An empty export lacks rep/date metadata and requires investigation. The reader rejects missing, extra or repeated columns, malformed rows, duplicate IDs, mixed reps or dates, unsupported categories/currencies and reversed or stale pairs. Build both exports with the same open-opportunity filters. The runner cannot detect a silently changed filter or a real opportunity missing from both files.

## Read the result

`forecast.py` sums integer cents by category and compares the union of stable IDs. It reports changes in category, amount, close date and account label. New or absent IDs generate questions about scope and status. Identical rows contribute to the totals and unchanged count. Questions are fixed text selected by observed field changes.

Use `references/01-briefing-format.md` to inspect each section and `references/02-question-library.md` to understand the question mapping. `references/03-deal-deepdive-template.md` is a fillable manager note for adding verified context after the comparison. The runner renders an English briefing in every locale.

## Optional Claude Code use

Copy the entire extracted directory into `.claude/skills/forecast-meeting-prep/` in a project where the inputs are authorized. Invoke `/forecast-meeting-prep` and specify the two CSV paths, or request the fictional demo. `SKILL.md` tells Claude to run the local comparison and preserve facts and uncertainties. Only use an assistant with real pipeline data when its access and processing are approved. [Claude Code skill documentation](https://code.claude.com/docs/en/skills)

## Connecting a real CRM

The included program operates entirely on files readable by its operating-system user. Matching a rep ID checks data consistency. A production adapter must authenticate the requester and establish their authority to view that rep, each opportunity and each requested field before extracting data. A broadly scoped service account establishes its own permissions. Implement and test the caller's narrower permissions separately before any read or export. [Salesforce record, object and field access guidance](https://developer.salesforce.com/docs/platform/lwc/guide/apex-security.html)

An operator also needs to own snapshot scheduling, storage access, retention and consistent filters. Test an allowed manager and a denied caller with controlled records. Keep the briefing private until a manager reviews it. For live costs, record export and storage charges, any assistant usage and reviewer time. The local test establishes fixture behavior only. A human Salesforce/Claude deployment and operational savings have yet to be measured.
