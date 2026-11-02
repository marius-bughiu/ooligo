# Briefing format

`forecast.py` prints the following sections in this order. The complete fictional result is in `examples/expected-briefing.md`.

1. **Rep and snapshot dates.** Confirm the same rep and the expected export window.
2. **Pipeline by category.** Previous, current and signed change for `commit`, `best_case` and `upside`, in USD. The program sums whole cents and includes every input row.
3. **Changed opportunities.** One bullet for each ID with a field or membership change. IDs are sorted for reproducibility. The unchanged count covers matching IDs with identical tracked fields.
4. **Questions for the rep.** One prompt per observed change, linked to its ID. Establish causes during the meeting.

Use this space for team-specific meeting notes after the generated facts have been reviewed.

| Opportunity ID | Fact to verify | Rep-confirmed context | Owner / next action |
|---|---|---|---|
| D-101 | Close date moved 14 days | To confirm in meeting | Assign during review |
