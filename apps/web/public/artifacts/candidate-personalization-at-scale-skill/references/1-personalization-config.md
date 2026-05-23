# Personalization config — TEMPLATE

> Replace this file's contents with your team's actual tone guidelines,
> guard thresholds, and protected-class proxy field list.
> The candidate-personalization skill reads this file before every run.

## How the skill reads this file

- **Tone register** — defines the voice guidelines applied when drafting messages. Replace the defaults with your employer brand guidelines.
- **Message length cap** — the skill truncates opening paragraphs to this many characters. Adjust based on the channels your team uses.
- **Fallback template** — the generic message the skill emits when no qualifying signal exists. Edit so it reflects your team's standard opening.
- **Fabrication guard thresholds** — the minimum specificity a signal must meet before use. The defaults are conservative; lower them at your own risk.
- **Protected-class proxy field list** — fields the skill refuses to use as personalization hooks. Review annually with your legal or HR team.
- **Signal recency window** — signals older than this threshold are excluded.

## Tone register

```
register: professional-direct
exclamation_marks: forbidden
opener_banned_phrases:
  - "Hope this finds you well"
  - "I came across your profile"  [too generic — replace with specific signal]
  - "We're a fast-growing company"
  - "Exciting opportunity"
closing_ask: "Worth 25 minutes?" or "Happy to share more if the timing is right."
```

Replace the above with your org's tone guidelines. If your employer brand is more conversational, adjust the register accordingly — but keep `exclamation_marks: forbidden` unless your brand explicitly uses them.

## Message length cap

```
subject_line_max_chars: 60
opening_paragraph_max_chars: 500
```

## Fallback template

Used when no qualifying signal is found. Edit to match your standard outreach voice.

```
subject: [Recruiter: edit before send — add candidate-specific signal]
opening: I came across your background while sourcing for our {role_title} role and thought your experience at {current_company} was worth a direct note. I'd like to share what we're working on — it's a short conversation, and I'll keep it specific to what I think would interest you.
```

## Fabrication guard thresholds

```
minimum_signal_specificity: candidate-identifiable
  # Signal must be specific enough that the candidate recognizes themselves from it
  # (not just their job title and company).
  # Examples of QUALIFYING signals:
  #   - A named public project or repo
  #   - A specific talk or publication title
  #   - A named company initiative mentioned in their public profile
  # Examples of NON-QUALIFYING signals:
  #   - "senior engineer at Acme" (visible to all recruiters)
  #   - "background in distributed systems" (inferred from role titles)
  #   - "worked at FAANG companies" (aggregated, not specific)

inference_allowed: false
  # The skill does not infer signals. Only use fields explicitly present
  # in the input data. "You seem to care about X" based on inferred themes
  # is not a qualifying signal.

recency_window_months: 24
  # Signals from activity older than 24 months are excluded unless
  # the candidate's recent activity explicitly references them.
```

## Protected-class proxy field list

The skill refuses to use these fields as personalization hooks. Review and extend this list annually with your legal or HR team.

```
blocked_fields:
  - photo_url
  - inferred_gender
  - name_derived_ethnicity_signals
  - nationality_inferred
  - religious_affiliation_signals
  - disability_signals
  - age_signals
  - marital_status_signals
  - pregnancy_signals

blocked_school_signals:
  # Schools that function as demographic proxies when used selectively.
  # This list does NOT mean these schools are impermissible in all contexts —
  # it means the skill will not use them as personalization hooks without
  # explicit legal/HR sign-off for an affirmative program.
  - historically_black_colleges_and_universities  [HBCU classification]
  - single_gender_institutions
  - religiously_affiliated_institutions_when_used_as_faith_proxy
```

**Important:** this list blocks selective use of these signals. If your organization has a documented affirmative recruitment program that intentionally uses school affiliation (e.g., an HBCU partnership), configure that in a separate affirmative-program section with the legal basis documented, and remove the relevant item from `blocked_school_signals`. Do not remove items without legal review.

## Last edited

{YYYY-MM-DD} — by {TA/HR/Legal reviewer name}
