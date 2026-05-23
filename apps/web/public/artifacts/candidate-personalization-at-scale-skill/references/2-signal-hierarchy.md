# Signal hierarchy — TEMPLATE

> Defines which signal types the personalization skill prefers when multiple
> signals are available for a candidate, and the minimum specificity each
> type must meet to qualify as a personalization hook.
> Adjust the ranking if your team sources differently or prioritizes different
> signal types for different role families.

## How the skill reads this file

- The skill evaluates available signals in the order listed and uses the first 1-2 that (a) meet the minimum specificity for that tier and (b) are relevant to the target JD.
- Lower-tier signals are only used when higher-tier signals are absent or do not meet the relevance filter.
- If no signal in any tier qualifies, the skill returns the generic fallback.

## Signal hierarchy

| Tier | Signal type | Source | Minimum specificity | Notes |
|---|---|---|---|---|
| 1 | Recruiter notes | Sourcer input | Any recruiter-observed context: referral, event interaction, previous conversation. | Highest priority — recruiter context is always more specific than public data. |
| 2 | GitHub pinned repo | GitHub public profile | Named project with ≥1 commit in the last 24 months AND a README that describes scope. | Stars/forks alone are not sufficient — the work must be described. |
| 3 | GitHub recent commit language | GitHub public profile | Specific language or framework used in commits in the last 12 months. | Only qualify if the language/framework is explicitly required in the JD. |
| 4 | LinkedIn publication or talk | LinkedIn profile | Named article, talk title, or podcast episode. Must have a title, not just "published an article." | Verify the title is real before using — hallucination risk on inferred publication names. |
| 5 | LinkedIn specific project | LinkedIn profile | Named project or product at a named company, not just a role title. | "Led the Checkout v2 migration at Stripe" qualifies; "worked on payments" does not. |
| 6 | LinkedIn recent role description | LinkedIn profile | Specific, named responsibility or metric from a current/most recent role bullet. | "Led 12-person team to 99.9% uptime" qualifies; "led teams" does not. |
| 7 | LinkedIn headline or summary | LinkedIn profile | Specific technical claim or framing in the headline/summary. | Only qualifies if the claim is specific enough that it distinguishes the candidate from their role category. |

## Role-family adjustments

Adjust which tiers qualify based on role type:

| Role family | Notes |
|---|---|
| Engineering / Technical | Tier 2-3 (GitHub) carries the highest signal quality. Prefer over LinkedIn. |
| Design / Creative | LinkedIn portfolio link or Behance/Dribbble URL (if present) ranks above GitHub. Add as Tier 1.5. |
| Sales / RevOps | Recruiter notes (Tier 1) and LinkedIn named deal or quota signals (Tier 5-6) are most relevant. GitHub rarely applies. |
| People / HR | LinkedIn publications and conference talks (Tier 4) are common and high-quality for this function. |
| Legal | Publications or named regulatory experience (Tier 4-5) are highest quality. GitHub almost never applies. |

## Relevance filter (applied after hierarchy)

Even high-tier signals are dropped if they are not relevant to the target JD. After extracting the top 1-2 signals from the hierarchy, the skill asks: "Would this candidate recognize that this signal was selected because of this specific role, or would it read as generic research?" If the answer is "generic research," drop it and move to the next tier.

## Last edited

{YYYY-MM-DD} — by {TA team member name}
