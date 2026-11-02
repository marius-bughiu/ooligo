# Questions tied to observed movement

The runner chooses fixed prompts in `movement()` in `forecast.py`. It uses only fields present in the two snapshots. This reference explains the mapping and provides a space for your manager's preferred wording.

| Observed pattern | Question purpose | Evidence to request |
|---|---|---|
| New ID in current export | Explain first appearance | Source status, export scope, creation or reassignment details |
| ID absent from current export | Explain absence | CRM status and filters before assigning any outcome |
| Category changed | Establish the basis for the new label | Customer statement or reviewed opportunity update |
| Amount changed | Identify the commercial change | Confirmed scope, quantity, price or correction |
| Close date changed | Confirm the revised milestone | Owner, evidence and next decision date |
| Account label changed | Check the record mapping | Same stable opportunity ID and correct account |

For a custom question, record the observed field, the wording and the evidence expected in the answer. To change generated wording, update `movement()` and review the intended change in `examples/expected-briefing.md`. Editing this explanation alone does not change the program.

| Observed field | Team question | Evidence requested |
|---|---|---|
| close_date | Who confirmed the new milestone? | Rep supplies the source during review |
