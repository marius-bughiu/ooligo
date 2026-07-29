# Interview record intake

Fill one copy per requisition. The lawful-basis column is not decoration — answer it before the field is collected, because the cheapest way to fail this workflow is to assemble a record you had no basis to assemble.

req_id: ENG-2291
work_locations: [Remote-US: CA, NY, IL, TX]
ai_use_policy: prohibited
policy_published_at: https://example.com/careers/ai-use-policy
base_rate: 0.02
checked: 2026-07-29

---

## Section A — Per-candidate loop record

One row per round. Timestamps are required for signal class C; mark `NO_TIMESTAMPS` rather than leaving blank, so the skill reports the class as unavailable instead of scoring it silently.

| candidate_id | round | date | interviewer | transcript_path | timestamps | interviewer_written_notes |
|---|---|---|---|---|---|---|
| C-4471 | recruiter screen | 2026-07-08 | R. Ade | records/C-4471/r1.txt | yes | records/C-4471/r1-notes.md |
| C-4471 | technical 1 | 2026-07-14 | M. Osei | records/C-4471/r2.txt | yes | records/C-4471/r2-notes.md |
| C-4471 | system design | 2026-07-21 | M. Osei | records/C-4471/r3.txt | NO_TIMESTAMPS | records/C-4471/r3-notes.md |
| C-4468 | recruiter screen | 2026-07-09 | R. Ade | records/C-4468/r1.txt | yes | records/C-4468/r1-notes.md |

Lawful basis for this section: interview records created by you, in the ordinary course, with candidate notice at scheduling. Recording requires consent in all-party-consent states — confirm the notice text covers analysis, not only recording.

## Section B — Process facts

Pulled from the ATS and IT, not from the candidate. Leave a cell `UNKNOWN` rather than estimating it.

| candidate_id | reschedules | unscheduled_video_declines | equipment_ship_zip | id_document_zip | contact_reuse_hits | application_source | reference_domains_age_days |
|---|---|---|---|---|---|---|---|
| C-4471 | 2 | 0 | 07102 | 94103 | 0 | inbound-careers | 412 |
| C-4468 | 0 | 0 | 30303 | 30303 | 0 | referral | 2100 |

Lawful basis for this section: employment-administration records you already hold. `id_document_zip` is populated at offer stage only, from the right-to-work document — never requested earlier as a screening input, which would invert the order the law expects.

`contact_reuse_hits` counts exact matches of phone or email across applications under a different candidate name, within your own ATS. Do not extend this to purchased identity-graph data; that changes the FCRA analysis in a direction you do not want.

## Section C — Claim set

The corroboration baseline. A contradiction only exists against something written down first.

| candidate_id | resume_path | application_answers_path | portfolio_urls | take_home_path |
|---|---|---|---|---|
| C-4471 | claims/C-4471/resume.pdf | claims/C-4471/application.json | github.com/example, example.dev | claims/C-4471/takehome/ |
| C-4468 | claims/C-4468/resume.pdf | claims/C-4468/application.json | — | — |

## Section D — Role risk

| req_id | day_one_access | role_risk | rationale |
|---|---|---|---|
| ENG-2291 | production DB read/write, customer PII | HIGH | On-call rotation from week 3 |

Answer for day one, not for month six. A role that earns production access after a 90-day probation is MEDIUM, and the probation itself is the control.

## Section E — Consent and notice prerequisites

Check before the first run. A `NO` here halts the run.

| Prerequisite | Applies when | Status | Artifact |
|---|---|---|---|
| Candidate notice that interview records are analyzed | always | YES | https://example.com/careers/ai-use-policy |
| All-party recording consent captured | recording in a two-party-consent state | YES | ats://consent/ENG-2291 |
| Illinois AI Video Interview Act consent | AI analysis of video interviews, IL candidates | N/A | text-only analysis, no video analyzed |
| BIPA written release and retention schedule | any voiceprint or face-geometry collection | N/A | none collected — see taxonomy §6 |
| Written camera policy applied uniformly + accommodation path | scoring camera reluctance | NO | not published — class B camera signal disabled |

The last row is the common one. Absent both artifacts, the skill scores nothing on camera reluctance and reports the gap against the process rather than the candidate.

## Section F — Verification capacity

| Loops per month | base_rate | class-weighted FPR | Expected flags/mo | Verification slots/mo | Headroom |
|---|---|---|---|---|---|
| 100 | 0.02 | 0.05 | 6.5 | 8 | +1.5 |

If headroom is negative, raise the taxonomy weights to tighten the screen before running. A queue that outruns capacity does not fail loudly — it ages, and the tail is where the real case sits.
