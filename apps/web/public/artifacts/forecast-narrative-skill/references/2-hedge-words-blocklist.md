# Hedge-words blocklist — TEMPLATE

> This file is the input to the hedge-removal pass in step 6 of the Skill.
> Every phrasing here is rewritten on the second pass. Add to the list
> whenever a hedge slips past — the blocklist is the durable artifact,
> not the prompt.

## Categorical hedges (rewrite to a direct claim or a "do not know")

| Hedge phrase | Rewrite to |
|---|---|
| may | will / will not / unknown |
| might | will / will not / unknown |
| could | will / will not / unknown |
| should (as in "should close") | will close on {date} / no committed close date |
| potentially | drop the word |
| possibly | drop the word |
| likely | use the dollar number or drop the word |
| appears to | is / is not / unknown |
| seems to | is / is not / unknown |
| tends to | drop the word |
| in most cases | drop unless followed by a percentage with a source |

## Forecast-specific weasels (rewrite or remove)

| Weasel phrase | Rewrite to |
|---|---|
| tracking to | committed at $X.YM / forecasting $X.YM |
| trending toward | committed at $X.YM / forecasting $X.YM |
| in line with expectations | name the dollar delta vs commit |
| executing well | drop — say what closed, what slipped |
| strong pipeline | name the coverage ratio with a number |
| healthy coverage | name the coverage ratio with a number |
| good momentum | name what closed this week, in dollars |
| positive trajectory | drop — name the deltas |
| some risk on | the specific deal name and the specific signal |
| a few deals to watch | name the deals and why |

## Soft modal stacking (drop the redundant modal)

- "may potentially" → drop both
- "could possibly" → drop both
- "might be able to" → "will" or "cannot"
- "we are working to" → "we will" or omit
- "we will look to" → "we will" or omit

## Confidence theater (drop unless there is a number)

- "high confidence" → only with a dollar band
- "low confidence" → name the specific risk that is driving low confidence
- "we feel good about" → drop entirely
- "we are bullish on" → drop entirely
- "we are cautious on" → name the specific risk

## Things that are NOT hedges (do not strip)

These are sometimes flagged by overzealous filters. Keep them.

- "If {Account} slips, commit lands at $X." — this is a dollar consequence,
  not a hedge.
- "Inferred from Gong call summary" — this is a source citation, not a
  hedge. Source labels increase trust; they do not undermine the claim.
- "No recent customer activity" — direct admission. Keep.
- "Reporting line not public" — direct admission. Keep.

## Last edited

{YYYY-MM-DD} — extend whenever a new hedge survives the removal pass in
production. The list grows; it does not shrink.
