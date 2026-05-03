# Output format

> The rejection-feedback skill writes drafts in exactly the formats
> below. The recruiter reviews and edits in their own outbox or in
> the ATS; the skill never sends.

## Routing rules

The skill picks a route per the matrix below. The recruiter can
override.

| Stage reached | Seniority | feedback_requested | Default route |
|---|---|---|---|
| onsite | senior+ | true | call |
| onsite | senior+ | false | email (generic if jurisdiction denies) |
| onsite | mid / junior | true | email (specific) |
| onsite | mid / junior | false | email (generic) |
| final loop | any | any | call (overrides above) |
| referred-by-VIP | any | any | call (recruiter judgment) |
| earlier than onsite | any | any | OUT OF SCOPE — use templated decline |

`senior+` = staff, principal, manager, director. `referred-by-VIP` =
candidate has a `referrer_priority: high` flag in the ATS.

## Email format — specific feedback (consent + safe jurisdiction)

```markdown
Subject: Update on your {role_title} interview at {company_name}

Hi {candidate_first_name},

Thank you for the time you invested in our interview process — the
{round_1_label}, {round_2_label}, and the conversations with the
team. We appreciated the care you put into each stage.

After the team's debrief, we have decided not to move forward with
your candidacy for this role.

You asked for feedback, so here is what stood out from the loop:

- **What went well.** {strength_phrasing_from_mapping}.

- **Where the team landed differently.** {gap_phrasing_from_mapping}.
  This was the dimension that drove the team's decision.

This feedback is specific to the loop you ran with us; it is not a
ranking against other candidates and it is not a comment on your
overall engineering ability.

If a future role at {company_name} matches your background, we would
welcome your application.

Best,
{recruiter_first_name}
```

Constraints baked into this template:

- One strength, one gap. No more.
- The phrase "not a ranking against other candidates" is mandatory,
  because it pre-empts the most common candidate response loop
  ("how did I compare").
- The phrase "not a comment on your overall engineering ability" is
  mandatory, because it isolates the feedback to this loop and
  pre-empts the "you said I am bad at engineering" escalation.
- "We would welcome your application" — neutral future language.
  Not "we will reach out", not "next time".

## Email format — generic decline (deny jurisdiction OR no consent OR no surfacable specific)

```markdown
Subject: Update on your {role_title} interview at {company_name}

Hi {candidate_first_name},

Thank you for the time you invested in our interview process. We
appreciated the care you put into each stage.

After the team's debrief, we have decided not to move forward with
your candidacy for this role.

If a future role at {company_name} matches your background, we
would welcome your application.

Best,
{recruiter_first_name}
```

This is the safe default. The skill writes this template byte-for-byte
when:

- `jurisdiction_policy` returned `unsolicited_feedback: deny` and
  `feedback_requested: false`
- step 3 surfaced no rubric dimension with both `mean ≤ 2` AND a
  verbatim evidence string
- a legal flag on the candidate file is present
- the loop has under two signed-off scorecards

Generic decline is honest. Weak specifics are worse than no
specifics.

## Call-notes format

```markdown
# Call notes — {candidate_first_name} {candidate_last_initial}. ({role_title})

## Frame
- Open with thanks for the time invested.
- Lead with the strength: {strength_phrasing_from_mapping}.
- Single gap: {gap_topic_from_approved_list}. One sentence, no piling
  on.

## Suggested phrasing for the gap

"{gap_phrasing_from_mapping}"

## Likely candidate questions

Q: "Was there anything I could have done differently?"
A: Acknowledge the question. Refer back to the single gap. Do NOT
add new feedback dimensions on the call — anything not in the
written draft is off-script and creates inconsistency risk.

Q: "Will you keep me in mind for future roles?"
A: Yes if true; specifics on what kind of role. Do NOT promise a
timeline.

Q: "Can I get a second-look interview?"
A: No. The decision is final. The recruiter reiterates appreciation
and closes.

Q: "Who else interviewed?"
A: Decline. Interviewer identities are protected. "I cannot share
that, but I can tell you the team weighed the input from every
round."

Q: "What did interviewer X think?"
A: Decline. Same reason. "I cannot break out individual scores; the
decision was a team decision."

## Off-script

If the candidate raises a discrimination concern, comparative-ranking
question, or accommodation issue, the recruiter says "let me come
back to you on that" and routes to HR / counsel. The recruiter does
NOT improvise an answer.

## Call duration target

10-15 minutes. Past 20 minutes, the call is no longer feedback —
it is an extended negotiation about the decision, and that is not
a useful place to be.
```

## Audit-log line format

One JSON object per line in `audit/<YYYY-MM>.jsonl`:

```json
{
  "run_id": "uuid-v4",
  "candidate_id_hash": "sha256-of-candidate-id",
  "role_id": "role-slug",
  "jurisdiction": "US-CA",
  "feedback_requested": true,
  "route": "email",
  "rubric_sha256": "abcdef...",
  "blocklist_sha256": "abcdef...",
  "mapping_sha256": "abcdef...",
  "dimensions_surfaced": ["technical_depth"],
  "blocklist_hits": 0,
  "model_id": "claude-sonnet-4-5",
  "timestamp": "2026-05-03T14:00:00Z"
}
```

No raw candidate ID, no candidate name, no scorecard text, no
draft text. The audit log is for run reproducibility, not data
retention. Candidate-facing drafts live in `drafts/<id>.md` under
the recruiter's own retention policy.

## Last edited

{YYYY-MM-DD}
