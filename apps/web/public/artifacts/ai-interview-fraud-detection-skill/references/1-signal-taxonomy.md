# Signal taxonomy

checked: 2026-07-29
maintainer: <your name>
review cadence: every 90 days, or on any change to the hiring AI-use policy

The skill reads weights, false-positive estimates, and the exclusion blocklist from this file. Edit the numbers to match your pipeline; do not edit them to make a candidate fit.

---

## 0. Parameters

| Parameter | Default | Set it from |
|---|---|---|
| `base_rate` | 0.02 | Your own confirmed cases over loops run in the last 12 months. If you have none, keep 0.02 and treat every posterior as an upper bound. |
| `recall` | 0.80 | Assumption, not a measurement. Lower it to 0.6 if your loops are under 45 minutes — short loops give class C almost nothing to work with. |
| `role_risk` | see §5 | The access the role gets on day one, not seniority. |
| `ai_use_policy` | `prohibited` | Your published candidate-facing policy. If nothing is published, the answer is `permitted` — you cannot screen against an unstated rule. |

Class-weighted false-positive rate is computed from the per-signal `fpr` column below across the classes that are enabled.

---

## 1. Class A — Identity continuity

Whether the person in round 3 is the person in round 1, and whether that person is the applicant.

| Signal | Weight | fpr | Notes |
|---|---|---|---|
| Interviewer noted in writing that appearance or voice differed from a prior round | 0.30 | 0.02 | Only counts from a contemporaneous written note, never from a later recollection. |
| Equipment-shipping address diverges from the identity-document address | 0.20 | 0.08 | High innocent base — sublets, family addresses, mid-move candidates. |
| Same phone or email on an unrelated application under a different name | 0.30 | 0.01 | Strong when it is exact-match, worthless when it is fuzzy. |
| Application-source record inconsistent with the candidate's account of how they applied | 0.10 | 0.15 | Weak. Included because it is cheap, excluded from the queue on its own. |
| Reference contact details resolve to a domain registered inside 90 days | 0.20 | 0.03 | Check the domain, not the person. |

## 2. Class B — Channel and infrastructure

| Signal | Weight | fpr | Notes |
|---|---|---|---|
| Declined 2+ unscheduled live video requests under a written uniform policy | 0.20 | 0.10 | Scores ONLY with the policy and the accommodation path in place. See §4. |
| Multiple concurrent candidates presenting from one IP | 0.35 | 0.01 | Ask IT for the join records; do not infer from the recording. |
| Remote-desktop or screen-relay artifacts visible during a shared screen | 0.25 | 0.05 | Chrome Remote Desktop, AnyDesk, TeamViewer, RustDesk banners. Legitimate on a work-issued machine — check whose machine it is before scoring. |
| Second voice audible or a second person's cursor visible | 0.35 | 0.02 | Also fires on a noisy household. Requires the interviewer's written note. |

## 3. Class C — Answer provenance

Disabled entirely unless `ai_use_policy` is `prohibited`. All four need utterance timestamps; without them the class returns `unavailable`, not `corroborated`.

| Signal | Weight | fpr | Notes |
|---|---|---|---|
| Latency inversion — longer lead-in on factual recall than on open synthesis | 0.25 | 0.12 | The characteristic shape of retrieval-then-read. Also the shape of an anxious candidate warming up; treat 0.12 as optimistic. |
| Register discontinuity between spontaneous exchange and set-piece answer | 0.20 | 0.15 | Highest innocent rate in the taxonomy. Prepared answers are prepared. |
| Interviewer's question restated near-verbatim before the answer begins | 0.15 | 0.10 | Artifact of transcription-then-generation. Also a normal stalling habit. |
| Specificity collapses on an unscripted follow-up to a detailed answer | 0.30 | 0.06 | The strongest signal in the class, and the one that needs an interviewer trained to ask the follow-up. |

If your interviewers do not routinely ask one unscripted depth follow-up per detailed answer, fix that before running this skill. It costs nothing and it outperforms every other signal here.

## 4. Excluded signals — never reported, enforced at output

Each of these correlates with a protected characteristic and produces a disparate-impact vector rather than a fraud signal. The skill drops them and prints that it dropped them.

- Accent, prosody, or non-native phrasing
- Name origin, transliteration, or spelling convention
- Home or office background, furnishings, or visible household members
- Webcam resolution, lighting, or bandwidth quality
- Virtual-background or background-blur use
- Timezone, or working hours, in isolation
- Employment gaps
- Typing speed, or written-English fluency, as a standalone signal
- Any inference of emotion, confidence, honesty, nervousness, or engagement from voice or video — prohibited in the EU under AI Act Article 5(1)(f) for workplace and recruitment contexts, and unsupported everywhere else

Camera reluctance is scored under class B only where BOTH a written camera policy applied uniformly across the req AND an offered accommodation path are recorded. Where either is missing, the skill reports the policy gap and scores nothing.

## 5. Role risk

| Level | Definition | Multiplier |
|---|---|---|
| HIGH | Production credentials, customer PII, payments, or source-code write access on day one | 1.5 |
| MEDIUM | Internal systems, no production or customer data | 1.0 |
| LOW | No systems access beyond email and documents in the first 30 days | 0.6 |

Role risk orders the queue. It never changes a posterior — a 6% posterior on a HIGH-risk role is still 6%.

## 6. Biometric and consent-gated material — strip, do not analyze

Presence of any of these in the record halts the run until a consent artifact is cited:

- Voiceprint or speaker-embedding files
- Face-geometry templates or facial-landmark exports
- Third-party AI-video-analysis scores attached to an Illinois-based candidate
- Any vendor "authenticity", "integrity", or "confidence" score derived from the media stream

The skill's analysis is text and metadata only. These arrive attached to exports and are the most common reason a text-only screen acquires biometric exposure it never needed.
