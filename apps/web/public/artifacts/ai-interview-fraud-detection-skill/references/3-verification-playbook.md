# Verification playbook

What happens after a flag. The screen produces a queue; this file produces an outcome. A flag with no recorded outcome is the artifact that hurts you in a later charge, so section 4 is not optional.

checked: 2026-07-29

---

## 1. Pick the verification method

Ordered by strength. Use the cheapest one that resolves the specific unresolved items, not the strongest one available.

| Method | Resolves | Cost | Use when |
|---|---|---|---|
| Onsite or in-person final round | Identity substitution, proxy, real-time assistance — all three at once | Travel, 3-6 hours | HIGH role risk and a posterior above 20%. The strongest control on this list, and it needs no skill to run. |
| Live structured re-verification (§2) | Answer provenance, record contradictions | 45 min | The default. Most flags resolve here. |
| Right-to-work document check at offer | Identity, address divergence | Built into your existing offer process | Class A signals. Already happening — just sequence it before equipment ships. |
| Direct employer and institution verification | Record contradictions on employment or education | 2-5 business days | Class D contradictions. Contact the institution directly, never the reference number the candidate supplied. |
| Paid work sample, observed live | Real-time assistance, competence substitution | 2-4 hours, paid at market rate | Where class C is the whole flag and the role is hands-on. Pay for it; an unpaid extra round on a flagged candidate is a fairness problem on top of everything else. |

Do not add a proctoring or lockdown-browser layer as the response. It moves the loop toward surveillance, disadvantages candidates on shared connections and assistive technology, and resolves less than a single well-run live follow-up.

## 2. Live structured re-verification — protocol

45 minutes, same interviewer where possible, camera on for both sides, no recording beyond your standard practice.

**Do not tell the candidate they are suspected of fraud.** Say what is true: there are specifics from the earlier round you want to go deeper on. A candidate told they are under suspicion performs worse whether or not they did anything, which corrupts the only measurement you have left.

Structure:

1. **Rapport, 5 min.** Unscripted, unscored. Establishes the spontaneous-register baseline that step 3 compares against.
2. **Depth probes on the flagged claims, 25 min.** Take each unresolved item from the report. Ask the candidate to walk the specific decision, then ask one unscripted follow-up they could not have prepared: what broke, who disagreed, what you would do differently. Prepared and retrieved answers both thin out here; lived experience does not.
3. **Register comparison, inline.** The interviewer notes whether depth-probe answers match the section-1 baseline in vocabulary and specificity. Written note, contemporaneous.
4. **Contradiction, direct, 10 min.** Read the contradiction back verbatim — the loop quote and the conflicting claim — and ask them to reconcile it. Most contradictions are resume compression or a date error and resolve in one sentence. Give that sentence room.
5. **Close, 5 min.** Standard candidate questions. Do not signal the outcome.

## 3. Scoring the verification

One of four outcomes per flag. Nothing else.

- `RESOLVED` — the unresolved items are now corroborated. Close the flag, proceed with the loop normally, and record it. The candidate carries no residue into the decision.
- `RESOLVED_WITH_CORRECTION` — a claim was wrong and the candidate corrected it. This is a normal resume-accuracy matter and goes to the hiring manager on the ordinary path, not through this workflow.
- `UNRESOLVED` — the items are still open after a fair attempt. Escalate to §5 before any decision. Do not reject on `UNRESOLVED` without that step.
- `CONTRADICTED` — the candidate's account is inconsistent with a document they themselves supplied, restated and unreconciled. Route to §5 with the artifacts attached.

There is no `FRAUDULENT` outcome. That determination sits with counsel and, where sanctions or identity theft are in play, with law enforcement.

## 4. Decision log — fill one per flag

```
flag_id:            F-2291-003
candidate_id:       C-4471
opened:             2026-07-24
posterior_at_open:  0.31
role_risk:          HIGH
unresolved_items:   [D-migration-year, C-latency-inversion, A-address-divergence]
method:             live structured re-verification
conducted:          2026-07-29 by M. Osei
outcome:            RESOLVED_WITH_CORRECTION
notes:              Cutover was Nov 2022 under the prior employer; resume date correct,
                    round-2 recollection wrong. Rollback plan detail was specific and
                    matched the public postmortem the candidate had cited.
                    Address divergence: sublet, lease provided at offer stage.
closed:             2026-07-29
decision_impact:    none — candidate proceeded to offer
```

Every field populated, every flag closed. An open flag on a candidate you declined for unrelated reasons is the worst possible record to hold.

## 5. Escalation and counsel review

Send to counsel, with the report and the decision log, when any of these hold:

- Outcome is `UNRESOLVED` or `CONTRADICTED` on a HIGH-risk role.
- Class A signals point at identity substitution rather than answer assistance. Sanctions exposure attaches to who is employed, not to how well they interviewed — DOJ enforcement to date has treated employers as victims, and OFAC has not filed against inadvertent employers, but both have signaled expectations of diligence.
- The candidate is in Illinois and any biometric artifact was collected at any point in the loop.
- The verification outcome will contribute to a no-hire, and any part of the corroboration input came from a third-party vendor. Under CFPB Circular 2024-06, third-party algorithmic scores about workers used for employment decisions are often consumer reports, which pulls in the pre-adverse-action sequence: the report and a summary of rights to the candidate, a waiting period, then the final notice. Whether your setup crosses that line is a counsel call, not a skill output.

## 6. Candidate notice — scaffolding

Publish this before the first run, not after the first flag. Adapt the bracketed parts.

> **How we review interviews.** We review interview transcripts and application records for consistency, and we do this for every candidate in a requisition, not for selected individuals. We do not analyze video, faces, voices, or emotional expression, and no automated output decides whether you are hired.
>
> If our review leaves something unresolved, we ask you about it directly in a follow-up conversation before any decision is made. You can ask what was unresolved and respond to it.
>
> [Our policy on AI assistance during interviews is here.] Records are retained for [N] months and then deleted, except where a longer retention period is required by law.

The second paragraph is the one that does the work. A screen the candidate can answer is defensible; one they cannot is not.
