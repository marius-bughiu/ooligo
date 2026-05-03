# Consent checklist for reference processing

The reference-check-summary skill requires a per-reference consent log as input. This file documents the schema, the warning-header rules, and the halt conditions.

## Per-reference consent record

For each reference, the consent log contains:

```json
{
  "reference_id": "R1",
  "candidate_authorized": true,
  "recording_consent": true,
  "notes_processing_consent": true,
  "jurisdiction": "US-NY",
  "recorded": true,
  "consent_collected_at": "2026-04-28T14:00:00Z",
  "consent_collected_by": "recruiter-email@firm.com"
}
```

### Field definitions

- `candidate_authorized` — the candidate told the recruiter "you can call this person." Without this, the reference call should not have happened. Halt if any reference's value is `false`.
- `recording_consent` — if the call was recorded, the reference consented to recording. The skill needs this only if `recorded: true`.
- `notes_processing_consent` — the reference was told that the notes from the call may be processed by AI to generate a structured report. This is the explicit consent for the skill's processing path under GDPR Art. 6 lawful-basis requirements.
- `jurisdiction` — the state or country the reference was physically in during the call. This determines recording-consent law.
- `recorded` — whether the call was recorded.

## Warning-header rules

If any reference's consent record is missing or has `unknown`/`null` values, the report's top-of-page warning header reads:

```
⚠️ CONSENT WARNING

The following references have incomplete consent records:
- R2: notes_processing_consent is unknown.
- R3: candidate_authorized is unknown.

Verify consent before sharing this report. The skill processed the
notes regardless of the gap; the warning surfaces the gap for the
recruiter to confirm with the candidate and reference.
```

The warning is informational. The skill continues to the report. The recruiter is responsible for either confirming the missing consent (and updating the log for next time) or omitting the affected reference from the shared report.

## Halt conditions

Halt processing for a reference (skip it, do not include in the report) when:

1. **`candidate_authorized: false`** — the reference call should not have happened. Including the reference in the report would compound the underlying consent failure. Surface to the recruiter as a gap to address.

2. **`recorded: true` AND `recording_consent: false` AND `jurisdiction` is in a two-party-consent jurisdiction.** Two-party-consent jurisdictions (CA, IL, FL, MD, MA, MI, MT, NH, PA, WA in the US, plus all EU countries under GDPR) make recording without consent illegal. Processing the recorded notes compounds the violation. The skill refuses to process the reference and surfaces the issue to the recruiter.

   ```
   HALT: R2 was recorded in CA without consent. Recording is illegal
   in CA without two-party consent. The skill will not process this
   reference's notes. Either delete the recording and re-interview the
   reference (with consent this time), or omit the reference from the
   report.
   ```

3. **`notes_processing_consent: false`** — the reference explicitly declined to have notes processed by AI. The skill respects that. The reference's notes can still inform the recruiter's own write-up, but they are not run through the skill.

## Why this matters

GDPR Art. 6 requires a lawful basis for processing personal data. A reference's notes ARE personal data (the reference's, and the candidate's). The lawful basis for AI processing is most commonly explicit consent or legitimate interest with a balancing test. In either case, the reference must have been informed.

NYC LL 144 and the EU AI Act focus on the candidate side, but reference data falls in the same processing pipeline. A defensible recruiting AI posture handles consent on both sides.

The skill cannot enforce that the recruiter actually collected consent. What it can enforce is that the consent is logged before processing, and that missing or contradictory consent surfaces to the recruiter rather than getting buried.

## What goes in the consent log when you didn't collect consent properly

The honest answer: omit the reference from this skill's processing. Use your own write-up. The skill's auditability comes from the consent record being trustworthy; populating it with `unknown` to make the skill run defeats the purpose.

Update your reference-call intake script to collect the four fields above as part of the call opening. The marginal time cost is 30 seconds per call.
