# Narrative structure — TEMPLATE

> This file defines the literal section template the forecast narrative
> follows. Adjust the headings to match what your exec scans for, but do
> not delete sections — every section here exists because removing it
> created a confusion in past forecast calls.

## Section order (do not reorder)

1. **Headline** — number + confidence band + last-period beat/miss
2. **Top 3 deals moving the number** — only three, ranked
3. **Single biggest risk** — one, not five
4. **Ask of the VP/CRO** — one specific action with an owner and a date
5. **Sources** — the report ID, the Gong workspace, the snapshot timestamp

## Per-section rules

### Headline

- Lead with the dollar number. Not "we are tracking to..." Not "our forecast is..."  Just `**Commit: $X.YM.**`
- Confidence band is in dollars, not percentages. "$11M-$13M" beats "75% confidence" because the exec is doing the math against the number target, not the math against a probability.
- Always include last period's actual vs prior-period commit. Without it the exec has no baseline for whether the current number is trustworthy.

### Top 3 deals moving the number

- Each deal: account, amount, close date, what changed this week, Gong signal.
- "What changed" is one sentence. If you cannot say what changed in one sentence, the deal does not belong in the top three.
- Gong signal is a date and a topic line, not a transcript summary. ("Gong: Apr 28, customer raised SOC2 question." not "Gong: the customer expressed concerns about security posture and asked several follow-up questions about our compliance roadmap.")

### Single biggest risk

- Exactly one deal. Not "the biggest risks include..."
- Name the specific signal. "17 days no Gong activity," "second close slip in 60 days," "added to commit Tuesday with no customer call since." Vague risk descriptions ("execution risk," "competitive pressure") do not pass.
- Include the dollar impact: "If this slips, commit lands at $X − Y."

### Ask of the VP/CRO

- One ask. Specific. With a deadline.
- Good: "Get on the Acme call Thursday at 2pm to unblock procurement."
- Bad: "Help drive deals to close." "Engage on top deals."

### Sources

- Always include. The exec needs to know which snapshot they are reading against, especially when challenged in the call.

## Tone rules

- Direct. Numbers in the first sentence of every section.
- No hedging — see `2-hedge-words-blocklist.md`.
- No internal jargon the exec does not use.
- No emoji. No bold-italic. Markdown bold is fine on the headline number and on the deal name in each list item.

## Last edited

{YYYY-MM-DD} — bump on every material change so the Skill can warn when the structure may have drifted from what the exec expects.
