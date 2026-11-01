# ICP rubric: configure before using real rows

The runnable example targets a fictional seller of operations software. It is a scoring demonstration, not a researched ICP or a recommendation for your pipeline.

## Editable policy record

Copy this table into your working record and replace the sample values. Put executable matching values in your own `rubric.json`, copied from `rubric.example.json`.

| Decision | Example value | Your value |
|---|---|---|
| Rubric ID | synthetic-b2b-saas-v1 | Replace with a versioned business rubric ID |
| Owner | Demo only | Assign the operator who approves changes |
| Matching industries | B2B SaaS | List exact, evidenced industry labels |
| Matching regions | US, CA | List explicit labels supplied by sources |
| Headcount range | 50–500 inclusive | Set lower and upper employee counts |
| Draft threshold | 7/10 | Set an integer from 0 to 10 |
| Source-age limit | 30 days | Set the maximum age for this use case |
| Review date | 2026-11-01 | Record the actual policy review date |

The code gives 4 points for industry, 3 for headcount, and 3 for region. It gives no partial credit. Change weights in `pipeline.py` only with new expected results and tests. A score is a rule outcome, not a probability of buying.

The example makes one deliberate tradeoff: a matching industry plus either size or region reaches 7. If both size and region are mandatory, change the rule rather than pretending the current threshold enforces both. There are no hard disqualifiers in this starter.

Missing or conflicting facts stay null and enter review. Do not guess geography from a domain suffix, company size from customer logos, or industry from a vague product slogan. Headcount ranges and decimal values need manual resolution; the validator accepts a cited integer count only.

Set `configured: false` in your working JSON while adapting it. Set it to true after reviewing the criteria and assigning the rubric ID. The fixture rubric remains configured only so the offline demo runs without setup.
