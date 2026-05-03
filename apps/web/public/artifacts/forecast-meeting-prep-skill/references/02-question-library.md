# Forecast question library — TEMPLATE

> Replace this template with your team's actual question catalog.
> The Skill picks questions from this library by matching the deal
> movement pattern, rather than inventing a question per run.
> Every entry carries a `last_used` date the Skill bumps when it
> picks the question for a given rep, so over-use is visible and the
> question library can be refreshed quarterly.

## How questions are indexed

Each question is filed under one or more **movement patterns**. The
Skill detects the pattern from the snapshot diff and pulls one
question per pattern triggered for the top-N commits. Patterns are
mutually compatible — a deal can fire two patterns and pull two
questions.

If you add or rename a pattern here, update the pattern detection
logic in the Skill so detection and question retrieval stay in sync.

## Pattern: commit added with no prior best-case appearance

**What it means.** A deal showed up in the commit column this week
that was not in best-case last week. The rep skipped the normal
escalation path (upside → best-case → commit). Either the deal
genuinely moved that fast (rare) or the rep is filling a commit gap.

Questions:

- "Walk me through what changed on {deal} between last Friday and
  today that took it straight to commit."
- "Who at {customer} confirmed verbally that they are committing this
  quarter, and when did that conversation happen?"
- "If we were doing this same call two weeks ago, would {deal} have
  been in upside, best-case, or not on the list at all?"

## Pattern: commit dropped, deal moved to best-case or upside

**What it means.** A deal in commit last week moved down a category
this week. Could be honest (deal genuinely slipped) or could be a
late tell that the deal was never really committed.

Questions:

- "What specifically did the customer say or do that moved {deal} out
  of commit?"
- "Was anything new in the deal last week that we missed, or did the
  signal we already had finally land?"
- "What would have to be true for {deal} to come back into commit by
  end of quarter?"

## Pattern: stage advance with no corresponding activity

**What it means.** Deal moved from one stage to a later stage this
week, but the activity log shows no meaningful customer touch
(meetings, emails, calls) tied to that move. Often the rep is
hygiene-cleaning the pipeline and the move is administrative, not
substantive.

Questions:

- "{Deal} advanced from {prior stage} to {current stage} this week.
  What conversation triggered that move?"
- "Is there a meeting, an email, or a verbal commitment we should
  log against this stage change so the next person reading the
  account understands?"

## Pattern: close-date drift (slipped > 7 days)

**What it means.** Close date moved out by more than a week. Once-off
slips are normal; repeat slips on the same deal are a tell.

Questions:

- "What is the customer-side reason {deal} slipped from {prior date}
  to {current date}?"
- "How many times has the close date on {deal} moved this quarter,
  and what was the reason each time?"
- "Are we at a point where the close date is the customer's ask, or
  are we still telling the customer when we want to close?"

## Pattern: stalled (zero meaningful activity in window)

**What it means.** No customer-side touch in the last 14 days on a
deal that is still in commit.

Questions:

- "When was the last time you heard from anyone at {customer} on
  {deal}, and what did they say?"
- "Who is owning the next step on the customer side, and what is
  their stated timeline?"
- "Should {deal} still be in commit if we have not heard from them
  in two weeks?"

## Pattern: thrashing (more than five stage changes in window)

**What it means.** Deal stage moved more than five times in two
weeks. Real deals do not move that much; either the stage definitions
are unclear or the rep is gaming pipeline hygiene reports.

Questions:

- "{Deal} has moved stage five-plus times in the last two weeks.
  What is actually happening on the customer side?"
- "Are our stage definitions clear enough on this one, or do we need
  to talk through what {current stage} means for this deal?"

## Pattern: repeat flag from prior week

**What it means.** Same pattern flagged on the same deal in the
prior briefing. Either the issue did not get addressed, or the
underlying signal is real and ongoing.

Questions:

- "We flagged {pattern} on {deal} last week as well. What changed
  this week, if anything?"
- "Is this turning into a deal where the data is telling us something
  the rep narrative is not?"

## Last edited

{YYYY-MM-DD}
