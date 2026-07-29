---
name: ai-interview-fraud-detection
description: Screen an interview record — transcripts plus loop metadata you already hold — for identity-substitution, proxy-interview, and real-time answer-assistance signals, and emit a corroboration report that routes named candidates to a live verification step. Works on text and process facts, never on biometric or affect analysis. Produces a verification queue, never a fraud verdict and never a rejection.
---

# AI interview fraud detection

## When to invoke

Use this skill when a remote hiring loop has finished or is mid-flight and someone needs to know which candidates carry unresolved corroboration gaps before an offer goes out. It reads the interview transcripts and the process record around them, and returns a per-candidate report separating what the record corroborates from what it contradicts.

The output is an input to a verification step — a live structured re-interview, a document check, a reference call. It is not an input to a hiring decision. That separation is load-bearing and section *Method* explains why.

Typical triggers: a fully-remote engineering or IT req, a role with production-system or customer-data access, a candidate whose written work and live answers read as different people, a req where equipment ships before day one.

Do NOT invoke this skill for:

- **Rejecting a candidate.** No output field is a rejection ground. Section *Base rates* shows why: at a 2% prior and a 5% false-positive rate, roughly 3 in 4 flags are innocent candidates. A flag that rejects is a screen that discriminates against the innocent majority of the flagged set.
- **Media forensics.** The skill does not analyze video frames, face geometry, voiceprints, blink rate, or micro-expressions. It never touches the media file. Section *Why text and process, not media* gives the accuracy reason and the legal reason.
- **Inferring emotion, confidence, honesty, or stress.** EU AI Act Article 5(1)(f) prohibits AI systems that infer emotions of a natural person in the workplace from biometric data, and the Commission's February 2025 guidelines on prohibited practices read "workplace" to cover candidates during selection and hiring. Deception detection from demeanor is out of scope regardless of jurisdiction — it does not work, and it converts an interview into a polygraph.
- **Screening for AI use where AI use is permitted.** Decide the policy first. If candidates are told they can use an assistant, answer-provenance signals are noise. Set `ai_use_policy` and the skill drops signal class C.
- **Retroactive sweeps of a closed pipeline.** Running this across last year's rejected candidates manufactures a dataset of unadjudicated accusations against named people, discoverable in any later charge, with no verification step available to clear anyone. Run it forward-looking only.
- **In-person loops.** Identity substitution and real-time assistance both require the remote channel. An onsite final round is the stronger and cheaper control; see `references/3-verification-playbook.md` section 1.

## Inputs

- Required: `interview_record` — per candidate, the transcripts of each round with speaker labels and utterance timestamps, plus the round type and the interviewer. Timestamps are what make answer-latency analysis possible; without them signal class C is unavailable and the skill says so rather than guessing. Template in `references/2-interview-record-intake.md`.
- Required: `claim_set` — the candidate's own assertions available to you before the loop: resume, application answers, portfolio or repository links, and any written take-home. This is the corroboration baseline. A contradiction is only meaningful against a recorded claim.
- Required: `process_facts` — the loop metadata your ATS and IT already hold: scheduling history, reschedule and no-show events, the address on file for equipment, the application-source record, and whether the same contact details appear on other applications. Section B of the intake template.
- Optional: `ai_use_policy` — `prohibited`, `permitted`, or `permitted_with_disclosure`. Default `prohibited`. Anything other than `prohibited` disables signal class C.
- Optional: `base_rate` — your estimated prior for fraudulent candidates reaching a live loop, as a decimal. Default 0.02. The skill uses it to compute expected flag volume and posterior probability; see *Base rates*.
- Optional: `jurisdictions` — work locations in scope. Controls which notice and consent prerequisites the preflight checks.

## Reference files

- `references/1-signal-taxonomy.md` — the four signal classes, per-signal weights, the excluded-signals blocklist, and the base-rate parameters. The skill reads weights from this file and never from model memory.
- `references/2-interview-record-intake.md` — fillable intake template with a lawful-basis column per field, so the collection question is answered before the analysis question.
- `references/3-verification-playbook.md` — what happens after a flag: the live re-verification protocol and script, the decision log, and the candidate-notice scaffolding.

## Method

Six steps, in order. Two structural choices drive the whole design and are worth stating before the steps.

**Two passes, and the extractor never sees the taxonomy.** Pass one extracts claims, timings, and contradictions with no fraud framing in its context at all. Pass two scores those extracted facts against `references/1-signal-taxonomy.md`. A single pass primed with a fraud taxonomy manufactures the signals it was told to look for — every hesitation becomes evasion once the model knows it is hunting for evasion. Splitting the passes costs one extra call per candidate and is the difference between a report about the record and a report about the prompt.

**The output routes to verification, not to a decision.** A flag opens a verification step whose *outcome* is the only thing that reaches the hiring decision. This keeps the skill out of automated-decision-system territory under California's FEHA ADS regulations and NYC Local Law 144, and it keeps the FCRA question narrow — CFPB Circular 2024-06 holds that algorithmic scores about workers obtained from third parties for employment decisions are often governed by the FCRA, with consent, disclosure, and pre-adverse-action duties attached. An in-house screen that gates a verification step rather than a decision sits in a different place than a purchased score that gates an offer. Where the line falls for your setup is a counsel question, and the skill prints it as one.

### 1. Preflight the collection basis

Refuse to run if the record contains material the intake template marks as consent-gated and no consent artifact is cited: voiceprint or face-geometry data under Illinois BIPA, or an Illinois AI Video Interview Act consent where video interviews are AI-analyzed. The skill's own analysis is text-only and does not itself trigger BIPA, but records assembled for it frequently arrive with biometric artifacts attached, and BIPA carries statutory damages of $1,000 for negligent and $5,000 for reckless or intentional violations per person — narrowed to a single recovery per person per collection method by SB 2979 (signed 2 August 2024), which the Seventh Circuit held applies retroactively on 1 April 2026. Strip, do not analyze.

### 2. Extract without framing

Pass one. Produce three artifacts per candidate, with no fraud vocabulary in scope:

- **Claim ledger.** Every checkable assertion made in the loop, with the round and timestamp, normalized against `claim_set`. "Led the migration off Postgres 11 in 2023" is checkable. "I'm a strong collaborator" is not; drop it.
- **Timing profile.** Per answer: elapsed seconds from question end to first substantive word, total answer length, and the position of the longest intra-answer pause. Raw numbers only.
- **Register profile.** Per answer: a description of vocabulary level, sentence structure, and specificity, without comparison across answers.

### 3. Score against the taxonomy

Pass two reads the pass-one artifacts and `references/1-signal-taxonomy.md`. Four classes:

- **A — Identity continuity.** Appearance or voice descriptions that shift across rounds where interviewers noted it in writing; the equipment address diverging from the identity-document address; the same phone or email appearing on unrelated applications.
- **B — Channel and infrastructure.** Repeated declines of unscheduled live video where a policy exists and was applied uniformly; multiple candidates presenting from one IP; remote-desktop artifacts visible in shared screens.
- **C — Answer provenance.** Latency that inverts — long lead-in before easy factual answers, short before hard synthesis ones; register discontinuity between spontaneous exchanges and set-piece answers; answers that restate the interviewer's question near-verbatim before answering; specificity that collapses under an unscripted follow-up. Disabled when `ai_use_policy` is not `prohibited`.
- **D — Record contradiction.** Loop claims contradicted by `claim_set` or by a public artifact the candidate themselves cited.

Each signal returns `corroborated`, `unresolved`, or `contradiction`. There is no `fraudulent` value and no aggregate fraud score. Weights sum to a *verification priority*, which orders a queue and nothing else.

### 4. Apply the excluded-signals blocklist

Before anything is reported, drop every signal on the blocklist in `references/1-signal-taxonomy.md` section 4. Accent, non-native phrasing, name origin, home background, webcam or bandwidth quality, virtual-background use, and timezone alone are excluded. Each correlates with national origin, race, disability, or socioeconomic status, and each is the exact vector by which a fraud screen becomes a disparate-impact claim. The blocklist is enforced at output, so a signal reaching the report has already survived it.

Camera reluctance is a special case and is scored only when a written, uniformly-applied camera policy exists and an accommodation path was offered. Absent both, the skill reports the policy gap instead of the candidate.

### 5. Compute the posterior and the queue

Convert priority to an explicit probability using `base_rate` and the taxonomy's per-class false-positive estimates, and print it next to every flag. See *Base rates*. Then order the verification queue by posterior times role risk, where role risk comes from the intake template's access-level field. A production-credentials role and a marketing-coordinator role with the same posterior are not the same problem.

### 6. Emit the report

Per candidate: the corroboration table, the posterior with its inputs shown, the specific unresolved items phrased as questions for the verification step, and the excluded signals that were dropped and why. Contradictions print with both the loop quote and the conflicting claim verbatim, so a human reads the evidence rather than the conclusion.

## Base rates

The single most common way a fraud screen fails is arithmetic. With prior `p`, recall `r`, and false-positive rate `f`, the probability that a flagged candidate is actually fraudulent is:

```
PPV = (p * r) / (p * r + (1 - p) * f)
```

At `p = 0.02`, `r = 0.80`, `f = 0.05`: PPV = 0.016 / (0.016 + 0.049) = **24.6%**. Three flags in four are innocent people. At `p = 0.10` and the same screen, PPV rises to 64%.

Two consequences the skill enforces rather than mentions. Flags open a verification step, because a 24.6% posterior cannot carry a rejection. And flag volume is a capacity number: 100 loops per month at `p = 0.02` and `f = 0.05` produces about 6.5 flags per month, of which 1.6 are real. If your verification step cannot absorb 6-7 structured re-interviews a month, tune `f` down in the taxonomy before running, not after the queue backs up.

## Why text and process, not media

Two reasons, and either alone would be sufficient.

**Accuracy.** Deepfake detectors collapse out of distribution. Published cross-dataset benchmarks show detectors near-perfect on their training distribution falling to chance-adjacent on unseen generators — one widely-benchmarked detector drops from 0.998 AUC in-dataset to 0.674 cross-dataset, and to 0.633 on Celeb-DF. The adversary chooses the generator. A detector you cannot benchmark against the generator actually in use gives you a number, not a control.

**Law.** Face-geometry and voiceprint analysis of candidates is biometric collection under BIPA and its successors, with the consent and retention duties and per-person statutory damages in step 1. Affect inference from that same data in a hiring context is prohibited outright in the EU under Article 5(1)(f), with penalties up to €35 million or 7% of worldwide annual turnover. Text-and-process analysis of records you already lawfully hold carries neither exposure.

Real-time media detection has a place — at the stream layer, from a vendor who can attest to their benchmark set. It is a different control at a different layer, and it does not replace corroboration.

## Output format

```markdown
## Verification queue — req ENG-2291, loop closed 2026-07-24

### 1. Candidate C-4471 — posterior 31% — role risk HIGH — VERIFY
Inputs: base_rate 0.02 · recall 0.80 · class-weighted FPR 0.036

| Class | Signal | Status | Evidence |
|---|---|---|---|
| D | Postgres migration year | contradiction | Round 2 14:02 "we cut over in early 2023"; resume lists the role ending Nov 2022 |
| C | Latency inversion | unresolved | Factual recall 9.4s mean lead-in; open-ended design 1.8s mean |
| A | Equipment address | unresolved | Shipping ZIP 07102 vs identity-document ZIP 94103 |
| B | Live video | corroborated | Two unscheduled calls accepted, 2026-07-11 and 2026-07-18 |

Questions for verification (see references/3-verification-playbook.md §2):
1. Walk through the cutover timeline against the employment dates on the application.
2. Unscripted depth probe on the migration's rollback plan.
3. Confirm the shipping address against the identity document at offer stage.

Excluded and not reported: 2 signals (bandwidth quality, phrasing register vs. first language).

### 2. Candidate C-4468 — posterior 6% — role risk LOW — NO ACTION
All four classes corroborated or unresolved-immaterial. No verification step.

---
Loop total: 11 candidates · 1 verification · 0 contradictions unresolved after verification
Counsel review queue: 1 item — FCRA characterization of the corroboration report if the
verification outcome contributes to a no-hire. See references/3-verification-playbook.md §5.
```

## Watch-outs

- **A flag gets treated as a finding.** *Guard:* every flag prints its posterior with inputs beside it, and no output field is a rejection ground. The verification outcome is the only decision input.
- **Confirmation bias from a primed extractor.** *Guard:* pass one runs with no fraud vocabulary in context; the taxonomy loads only in pass two.
- **Proxy discrimination through demeanor signals.** *Guard:* the section-4 blocklist is enforced at output, and dropped signals print in the report so the exclusion is auditable.
- **Camera reluctance scored against a candidate with an accommodation need.** *Guard:* the signal scores only where a written uniform policy and an offered accommodation path both exist; otherwise the skill reports the policy gap.
- **Biometric material arriving with the record.** *Guard:* step 1 refuses to run on consent-gated artifacts without a cited consent record, and instructs stripping rather than analysis.
- **The screen runs where AI use is allowed.** *Guard:* `ai_use_policy` gates signal class C, and the default is `prohibited` so the setting is a deliberate act.
- **Verification capacity is overrun and flags age out silently.** *Guard:* step 5 prints expected monthly flag volume from `base_rate` and the taxonomy FPR before the first run, and the queue is ordered by posterior times role risk so the tail is the part that waits.
- **The report becomes discovery material.** *Guard:* the playbook's decision log records verification outcomes and closes each flag explicitly. An open flag with no recorded outcome is the artifact that hurts you later.
