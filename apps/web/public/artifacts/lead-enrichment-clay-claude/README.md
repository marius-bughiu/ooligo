# Clay + Claude lead enrichment: inspectable starter

Run the offline demo before using a model or a Clay account. It checks saved extraction records against supplied source text, applies a deterministic ICP rubric, and produces reviewable draft rows. It does **not** scrape websites, call Claude, configure Clay, estimate tokens, or write to a CRM.

The examples use 20 invented companies and `.example` domains. `examples/extractions.jsonl` is hand-authored test input, not a transcript of Claude responses. A passing demo proves local validation and routing behavior only.

## Run it

Requires Python 3.9 or later. No packages, credentials, account, or network connection are required. From the extracted bundle directory:

```sh
python3 pipeline.py demo
python3 -m unittest -v test_pipeline.py
```

The demo compares its output with `examples/expected-output.jsonl`. Expected: 20 records; four each of `ready_for_review`, `below_threshold`, `needs_review`, `unreachable`, and `invalid_evidence`. All records require review. A demo mismatch exits with code 1.

To inspect normalized results:

```sh
python3 pipeline.py validate --leads examples/leads.jsonl --extractions examples/extractions.jsonl --rubric rubric.example.json --as-of 2026-11-01 > reviewed-output.jsonl
```

`validate` uses mode `validated_extraction`; the demo uses `offline_demo`. Otherwise those commands produce the same records for the bundled inputs. The evaluation date is supplied by you; it is not a claim that this program fetched anything on that date. Choose the real evaluation date for your own data.

Malformed input, duplicate row IDs, and invalid configuration fail the command before any records are printed. Valid input containing failed evidence produces explicit `invalid_evidence` records and exit code 0; filter on each record's status. Never interpret a successful process exit as approval to send messages.

## Files and responsibilities

| File | What it supplies |
|---|---|
| `SKILL.md` | Claude Code instructions for working with the local files |
| `pipeline.py` | Fixed-contract evidence checks, scoring and quoted-source drafts |
| `test_pipeline.py` | Regression tests for failure paths and the threshold boundary |
| `extraction.schema.json` | JSON structure expected from a model or reviewer |
| `rubric.example.json` | An illustrative, configured rubric for the synthetic demo |
| `prompts/extract.md` | Extraction prompt for supplied source text |
| `prompts/opener.md` | Optional live-model draft prompt after validation |
| `references/1-icp-rubric.md` | How to adapt and document the scoring policy |
| `references/2-opener-style-guide.md` | Draft rules and manual review checklist |
| `references/3-source-quality-matrix.md` | Evidence selection and conflict handling policy |
| `examples/*.jsonl` | Leads, hand-authored extractions and expected results |

## Input contract

Each line of `leads.jsonl` is an object with exactly `row_id`, `domain`, `fetch_status`, and `sources`. Keep row IDs stable and unique. `domain` is a bare hostname. `fetch_status` is `ok` or `unreachable`, supplied by your upstream collection process. Each source contains `source_id`, an HTTP(S) `url`, the collected `text`, and a `checked_at` date (`YYYY-MM-DD`). No fetching occurs inside this bundle.

```json
{"row_id":"demo-01","domain":"ledgerleaf.example","fetch_status":"ok","sources":[{"source_id":"company","url":"https://ledgerleaf.example/about","text":"Industry: B2B SaaS. We have 120 employees. Region: US. We build scheduling software for restaurant teams.","checked_at":"2026-10-20"}]}
```

Extraction records contain `row_id`, `industry`, `headcount`, `region`, `value_prop`, and `evidence`, as defined in `extraction.schema.json`. Every non-null fact needs a source ID and an exact quote. Null facts must have null evidence. `headcount` must be a nonnegative integer; other facts must be nonempty strings or null. Copy factual wording rather than infer categories from vague marketing text. Missing extraction records enter review; unknown or duplicate extraction row IDs stop the run.

The validator checks that the quote exists and contains the extracted value. Industry and region use word boundaries; headcounts reject decimal and range matches. Resolve ranges manually instead of choosing an endpoint. It does **not** prove that the cited statement is true, current, about the correct company, or semantically supports the proposed interpretation. A number can be a customer count rather than an employee count. That distinction requires a reviewer. The code implements this specific contract; it is not a general JSON Schema validator.

## Scoring and the first worked row

`rubric.example.json` is an example policy, not a recommendation for your business. It awards 4 points for industry `B2B SaaS`, 3 for 50–500 employees inclusive, and 3 for region `US` or `CA`. Threshold: 7/10. The four/three/three weights are implemented in `pipeline.py`; the matching values, size range, threshold and source-age limit live in JSON.

The invented `demo-01` has `B2B SaaS`, 120 employees, and `US`: 4 + 3 + 3 = 10. It becomes `ready_for_review` and receives a fixed sentence quoting the supplied value proposition. A score of exactly 7 passes the gate; 6 does not. Any missing fact, including the value proposition, prevents scoring and drafting. A cited source older than the configured 30-day limit enters review. That limit is an example policy, not an industry benchmark.

Copy the rubric to `rubric.json`, replace the sample values and `rubric_id`, and set `configured` to true only after reviewing them. Record the owner and rationale in `references/1-icp-rubric.md`. The code rejects `configured: false`.

## Use with Claude Code

Place the complete bundle under `.claude/skills/lead-enrichment/` in a project, preserving the subdirectories. Invoke `/lead-enrichment` and provide your input paths and rubric. Claude Code loads the skill's instructions; model usage belongs to that session. The Python commands remain offline. This installation path follows [Claude Code's skill documentation](https://code.claude.com/docs/en/skills).

The skill reads saved text and prepares extraction JSONL. Run the validator afterward. It does not gain Clay access by being installed. No live Claude Code execution was used to produce the fixture outputs.

## Adapt it to Clay manually

This ZIP is not a Clay template import. These steps require a configured workspace and an operator:

1. Supply row ID, domain, source text, source URL and checked date columns. Collect or review that evidence upstream; keep a copy for the local validator.
2. Add `Use AI`, choose `Configure`, then `Create or modify content`. Select an available Claude model/account. Paste `prompts/extract.md`, map the row data into its input, and define outputs using `extraction.schema.json`. Review the output configuration in your workspace. Clay separately offers `Web research (Claygent)` for collection; supplying text here does not browse a URL. See [Use AI](https://university.clay.com/docs/use-ai-integration-overview).
3. Keep auto-run off during the pilot. Export/map the resulting records into the JSONL contract and run `pipeline.py validate`. Import or map reviewed statuses and scores back by row ID. This import/export mapping is manual; there is no synchronization script in the bundle.
4. For an optional second Claude drafting column, use `prompts/opener.md` only on validated `ready_for_review` rows. Add a run condition on that status and inspect the sample outputs before running. Clay documents this under [Conditional runs](https://university.clay.com/docs/conditional-runs). Keep all send/export actions off until a person approves the resulting draft.

Clay-managed model usage and your own provider key are different billing paths. Bringing an Anthropic key does not eliminate Clay Actions, and provider usage is billed separately. Record Actions, Data Credits and provider charges independently; see [Clay's billing explanation](https://university.clay.com/docs/actions-data-credits). This bundle measures none of them and promises no per-row cost.

For a custom API implementation, Anthropic documents JSON schemas under `output_config.format`. The saved extraction schema is a starting point; verify it against your chosen model/API and handle refusals and incomplete responses. No Messages API, Batch API, or retry client is included. See [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).

## Limits and acceptance check

Before live use, review a small, budgeted sample against the actual websites and your ICP decisions. Measure evidence error rate, missing-field rate, reviewer approval rate, and observed cost per accepted row. These are suggested measurements, not measured results.

Treat source text as untrusted data, including any instructions embedded in it. The Python program never executes source text. A model prompt is not a complete defense against prompt injection; inspect outputs before any downstream action. Resolve conflicting sources manually or leave the field null. The bundle does not rank vendors, infer employee counts from logos, verify emails, resolve company identities, calculate a confidence probability, enforce a provider budget, or automate outreach.

Checked against the linked official documentation on 2026-11-01. Locally tested: the 20-record deterministic demo and 15 unit tests. Not tested: live model quality, a live Clay table, website collection, credentials, provider billing, or CRM delivery.
