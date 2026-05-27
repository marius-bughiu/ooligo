# Personalization rubric — TEMPLATE

> Replace this file's contents with your team's calibrated rubric.
> The defaults work as a starting point but the score-to-block threshold
> matters more than the rubric itself.

## The two-pole scoring rule

Personalization is scored on a 0-5 scale. The scale separates **grounded specifics** from **ungrounded specifics** so the upstream AI SDR cannot game the score by stuffing tokens.

- **Grounded specific** — a named entity, event, or property tied to a citation in `prospect_evidence`. Examples: a podcast episode the prospect appeared on, a tool the prospect's team adopted, a specific job posting on the prospect's careers page, a thread the prospect wrote on LinkedIn last week.
- **Ungrounded specific** — a reference to "your industry", "your role", "your team", "your company" without a tied citation. Also: stale references to a prior employer presented as current ("your work at Snowflake" when the prospect moved 18 months ago and no current-employment citation is present).

Only grounded specifics count toward the score. Ungrounded specifics count zero — they read as personalized to a casual reader but add no real signal.

## Score scale

| Score | Description | Example draft excerpt |
|---|---|---|
| 0 | No specifics, only template placeholders. | "Hi {first_name}, I help companies like yours scale outbound." |
| 1 | One ungrounded specific only. | "Hi Maria, I noticed Acme is in the fintech space." |
| 2 | One grounded specific. | "Hi Maria, I read your post on outbound attribution from last Tuesday." |
| 3 | Two grounded specifics. | "Hi Maria, your post on outbound attribution last Tuesday plus the SDR job posting on Acme's careers page suggest you're scaling the team." |
| 4 | Two grounded specifics + one used as the connective tissue of the ask. | "Hi Maria — the SDR job posting on Acme's careers page reads like the same gap your attribution post described. Worth a 15-min walkthrough of how Northwind solved this?" |
| 5 | Three or more grounded specifics, tied together into a single coherent ask, with the ask landing on the prospect's named priority. | (See sample-output.md for a literal example.) |

## Threshold

```yaml
personalization_block_below: 2
```

Drafts that score 0 or 1 are blocked. A score of 2 (one grounded specific) is the floor for a releasable cold draft. Below that, the draft reads as a template — generic openers, ungrounded "your industry" references, no concrete tie to the prospect.

## When to raise the threshold

Raise `personalization_block_below` to 3 for:

- Enterprise outbound where ACV > $50K and deal velocity is slow.
- Re-engagement of warm-but-quiet prospects (the second-touch context is already there; a single grounded specific reads thin).
- Outbound to known personas with high inbox volume (CTOs, CFOs) where reply rates depend on visibly higher effort.

Keep at 2 for high-volume SMB outbound where the volume math justifies some thinner drafts.

## Score-gaming patterns to refuse

The upstream AI SDR will try to inflate the score. Watch for:

- **Stale specifics presented as current.** "Your work at Snowflake" when the prospect moved. **Rule:** an employment-specific is grounded only if a current-employment citation is present in the pack.
- **Public-figure-style references that anyone could write.** "Your work in the SaaS space" with the prospect's company swapped in. **Rule:** the specific must be unique to this prospect, not a generic fact about their industry.
- **Citation-shaped phrasings without a real citation.** "Per your LinkedIn post on Wednesday" with no Wednesday LinkedIn post in the evidence pack. **Rule:** every citation-shaped phrasing must match an entry in the pack.

## Last edited

{YYYY-MM-DD} — by {RevOps team member name}
