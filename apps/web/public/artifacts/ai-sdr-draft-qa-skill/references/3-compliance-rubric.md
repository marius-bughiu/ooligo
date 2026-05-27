# Compliance rubric — TEMPLATE

> Replace this file's contents with profiles tuned to your sending footprint.
> The defaults below cover the common jurisdictions for B2B outbound in 2026.
> Confirm with legal before relying on them for production sends.
>
> The ai-sdr-draft-qa skill reads `recipient.country` from the input and
> applies the matching profile. If no profile matches, the skill returns
> `result: insufficient_compliance_context`. The skill does not fall back
> to a generic profile silently — that is a banned behavior in this rubric.

## Required elements (US floor — CAN-SPAM)

Applied to all US recipients regardless of state. Every send must include:

| Element | Where it lives | What the skill checks |
|---|---|---|
| Visible unsubscribe link | Email body footer | A clickable URL whose link text contains "unsubscribe" or equivalent. |
| Physical sender address | Email body footer | A street address line in the footer block. |
| Truthful sender identity | The `From:` line | `draft.from` must match `sender_domain` (no spoofing). |
| Subject line not deceptive | The `draft.subject` field | No subject line that promises a relationship that does not exist ("Re: your reply", "Per our call yesterday") unless those events actually occurred. |

## RFC 8058 — one-click unsubscribe (Google + Yahoo bulk-sender requirement)

Effective February 2024 for any sender exceeding 5,000 messages per day to Gmail or Yahoo addresses. The skill cannot inspect raw email headers; it requires the calling agent to pass either `email_headers` (the literal header block) or set `headers_compliant: true` after the agent's own verification.

Required headers:

- `List-Unsubscribe: <mailto:unsubscribe@yourdomain.com>, <https://yourdomain.com/unsub?id=XYZ>`
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click`

Missing either is a block when sending to Gmail or Yahoo. The skill checks the recipient TLD/domain to determine applicability — if the recipient is on Google Workspace or Yahoo Mail, the requirement applies.

## EU GDPR profile

Applied when `recipient.country` is in the EU/EEA. Required elements:

- **Legitimate interest basis documented in the evidence pack.** A `legitimate_interest_basis` field in any `prospect_evidence` entry, with a non-empty string explaining the basis (e.g., "B2B contact from publicly listed business email, role-aligned to product use case").
- **Visible opt-out language in the body.** Not just an unsubscribe link — an explicit sentence the prospect can read inline: "Reply STOP or click below to opt out of future emails."
- **No personal-data claims beyond what the legitimate interest basis covers.** Hiring intent inferred from "your company is hiring" without a published job posting in the pack is a block — the inference is personal data processing without basis.

Missing any required element → block.

## France Loi Hamon (B2B addition to GDPR)

Applied when `recipient.country` is France. On top of the EU profile:

- Explicit B2B opt-out language stating the recipient can refuse further commercial solicitation.

## California profile (US + state-specific)

Applied when `recipient.us_state` is `US-CA`. On top of the US floor:

- A CCPA-aligned opt-out reference. For B2B, this is the "Do Not Sell or Share My Personal Information" link, the equivalent under CPRA, or an explicit B2B opt-out sentence.

## NYC LL144 awareness (hiring-adjacent outreach only)

Applied when `recipient.us_state` is `US-NY` AND the draft references a hiring, sourcing, or recruiting action by the sender. NYC LL144 governs Automated Employment Decision Tools used in hiring decisions; outbound that references the sender's hiring workflow needs human review for LL144 alignment.

The skill does not block — it flags `human_review: ll144_hiring_outreach` and routes the draft to a reviewer queue. This is a routing decision, not a compliance verdict.

## Profile selection logic

```
function selectProfile(recipient):
  if recipient.country in EU_EEA:
    profile = "eu_gdpr"
    if recipient.country == "FR":
      profile += "+france_loi_hamon"
  elif recipient.country == "US":
    profile = "us_can_spam + rfc_8058"
    if recipient.us_state == "US-CA":
      profile += "+california_ccpa"
    if recipient.us_state == "US-NY" and draft_mentions_hiring:
      profile += "+nyc_ll144_awareness"
  elif recipient.country == "CA":
    profile = "canada_casl"     # not detailed here; CASL has its own consent rules
  elif recipient.country in ["GB", "CH", "NO"]:
    profile = "eu_gdpr_equivalent"
  else:
    return insufficient_compliance_context
```

## Profiles not covered by defaults

Brazil LGPD, India DPDP, Australia Spam Act, Singapore PDPA, Japan APPI — add these as separate profiles if your sending footprint covers those countries. Each needs its own required-elements table. Do not collapse them into a "global" fallback; the variance between regimes is too large.

## Last edited

{YYYY-MM-DD} — by {legal-ops team member name}
