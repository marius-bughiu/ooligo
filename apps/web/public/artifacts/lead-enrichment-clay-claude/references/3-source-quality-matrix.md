# Source selection: retain evidence, expose uncertainty

The program consumes saved sources. It does not fetch a site, compare vendors, prove source ownership or resolve conflicting claims.

## Adapt this collection plan

| Field | Starter source | Required evidence | On conflict or missing data |
|---|---|---|---|
| Industry | Company description or reviewed upstream record | Explicit label and literal quote | Return null; operator reviews classification |
| Headcount | Company statement or licensed provider record | An integer explicitly describing employees | Return null; do not pick an endpoint of a range |
| Region | Company statement or reviewed upstream record | Explicit region label | Return null; do not guess from domain suffix |
| Value proposition | Company's product/about text | A short sentence copied verbatim | Return null; do not substitute marketing from another company |

Record your actual provider, access method and refresh owner alongside each row before collecting real data. Check provider terms and your organization's data policy; this template is not a legal assessment.

Each source carries `source_id`, `url`, `text` and `checked_at`. Preserve source text exactly enough for quote matching. A syntactically valid URL does not prove the page exists or belongs to the target company. Do not create a current `checked_at` just because an old export was opened today.

When two sources disagree, preserve both and set the affected extraction field and its evidence to null. Review the discrepancy upstream; the output status is `needs_review`, not an automated “winner.” The code does not scan every source for contradictory numbers, so this is an operator/model instruction rather than a claim about a conflict detector.

Only cited-source ages are checked. The default 30-day limit is illustrative. For your own data, choose a limit that matches how quickly the facts change and supply the actual evaluation date.
