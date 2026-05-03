# Internal-vs-external classification rules — TEMPLATE

> Replace this template's contents with your team's actual rules. The
> competitive-battlecard skill stamps every line of every battlecard
> with `[INTERNAL]` or `[EXTERNAL_OK]` per these rules. The
> classification is not advisory — `[INTERNAL]` lines are stripped
> from any export the rep shares with a customer.

## Default

Default classification is `[INTERNAL]`. A line is upgraded to
`[EXTERNAL_OK]` only if it passes every rule below.

## Allowed `[EXTERNAL_OK]`

A line may be classified `[EXTERNAL_OK]` if all of these are true:

1. **No internal-only metric appears.** The blocklist below is
   exhaustive for our team. If any blocklist term appears, the line
   stays `[INTERNAL]`.
2. **Any comparative claim about the competitor traces to a public
   source.** The source URL is in the line or in the same bullet,
   with a `fetched` date no older than 30 days at generation time.
3. **No customer name appears unless that customer is on the public
   reference list** at `/legal/public-references.json` (or the
   equivalent in your CRM).
4. **No FUD.** The handler does not assert anything negative about
   the competitor's product, support, security, or company that is
   not directly attributable to a public source the competitor has
   shipped or to a customer the customer can call.

## Blocklist (these terms force `[INTERNAL]`)

Any line containing any of the following stays internal:

- Deal counts in absolute numbers (e.g. "we won 47 of 89 deals")
- Win rates as percentages
- Internal pricing ranges, discount thresholds, list-vs-paid deltas
- Customer names not on the public reference list
- ARR, MRR, ACV figures
- Internal codenames for products, projects, or initiatives
- Slack channels, Notion URLs, internal Gong call IDs
- Roadmap items not announced publicly
- Personnel names and reporting lines
- The phrase "we always" or "we never" applied to the competitor
  unless backed by a public source URL in the same line

## Borderline cases — the skill's behaviour

When a line is borderline, the skill defaults to `[INTERNAL]` and
logs the reason in the appendix. PMM can flip it on review.

Examples of borderline cases the skill has hit historically:

- A handler that quotes a customer in a public case study but
  paraphrases the quote — flip to verbatim or mark `[INTERNAL]`.
- A pricing comparison that uses our own price list but the
  competitor's price is from a screenshot dated two months ago — the
  competitor side is stale, mark `[INTERNAL]` until refreshed.
- A capability claim about the competitor that is true but stated as
  "they can't do X" rather than "X is not on their public roadmap" —
  rewrite or mark `[INTERNAL]`.

## Auto-redaction

If the second pass finds a blocklist term inside an otherwise
qualifying `[EXTERNAL_OK]` line, the term is replaced with `[REDACTED
— internal metric]` and the line stays `[EXTERNAL_OK]`. This keeps
the talk-track usable without leaking the underlying number.

Example before redaction:

> "We win against {Competitor} 73% of the time when integration depth
> is the deciding factor."

After:

> "We win against {Competitor} [REDACTED — internal metric] when
> integration depth is the deciding factor."

The handler is now usable in front of a customer without the win
rate leaking.

## Reporting

Every battlecard generation logs a count of:

- Lines emitted as `[EXTERNAL_OK]`
- Lines downgraded from `[EXTERNAL_OK]` to `[INTERNAL]` and the
  reason
- Lines auto-redacted and the term that triggered the redaction

The log lives at the bottom of the card under "Classification audit"
so PMM and legal can review.

## Last edited

{YYYY-MM-DD}
