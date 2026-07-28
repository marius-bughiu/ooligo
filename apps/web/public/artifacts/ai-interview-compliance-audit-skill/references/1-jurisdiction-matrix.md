# Jurisdiction matrix

```yaml
checked: 2026-07-28
checked_by: REPLACE_WITH_YOUR_NAME
```

The skill reads every threshold from this file and never from model memory. Update `checked:` whenever you re-verify against primary sources. The skill warns and refuses to grade if the date is more than 90 days old — this landscape moved three times between August 2025 and May 2026, and a stale matrix produces a confident report against rules that no longer apply.

This is a working parameter table maintained by the employer, not legal advice. Have counsel review it once and then keep it current.

---

## NYC Local Law 144 of 2021 — automated employment decision tools

**Status:** in effect; enforced by the Department of Consumer and Worker Protection since 2023-07-05.

**Attaches when:** an automated employment decision tool (AEDT) is used to substantially assist or replace discretionary decision-making for a job or promotion, for a position located in New York City. Employment agencies are covered alongside employers.

| Control | Parameter | Notes |
|---|---|---|
| Independent bias audit | Within the 12 months preceding use, renewed annually | Auditor must have no involvement in using, developing, or distributing the tool and no employment or financial relationship with the employer that compromises independence |
| Published audit summary | Publicly available on the careers or jobs section of the website | Must include the date of the most recent bias audit and the distribution date of the tool |
| Metrics published | Selection or scoring rates and impact ratios by sex, by race/ethnicity, and by intersectional sex × race/ethnicity categories | The four-fifths screen is the conventional read on the impact ratio |
| Candidate notice | At least **10 business days** before use | Business days, not calendar days |
| Notice contents | That an AEDT will be used; the job qualifications and characteristics it assesses | |
| Data disclosure on request | Within **30 days** of a written request, if not already published | Data collected, source of the data, retention policy |
| Penalty — first violation | Up to $500 | |
| Penalty — subsequent violations | $500 to $1,500 each | |
| Accrual | Each day an AEDT is used in violation is a separate violation; each failure to provide a required notice is a separate violation | This is what makes notice gaps on high-volume reqs the top remediation item |

**The load-bearing determination** is whether the tool substantially assists or replaces discretionary decision-making. It turns on your configuration, not the vendor's product description.

---

## Illinois Artificial Intelligence Video Interview Act (820 ILCS 42)

**Status:** in effect since 2020-01-01.

**Attaches when:** an employer asks applicants to record video interviews and uses AI analysis of those videos to consider applicants' fitness, for positions based in Illinois.

| Control | Parameter | Source |
|---|---|---|
| Notice before the interview | Applicant is told AI may be used to analyze the video and consider fitness | Section 5 |
| Explanation before the interview | How the AI works and the general types of characteristics it uses to evaluate applicants | Section 5 |
| Consent before the interview | Consent to be evaluated by the AI as described; no consent means no AI evaluation | Section 5 |
| Sharing limited | Videos shared only with persons whose expertise or technology is necessary to evaluate fitness | Section 10 |
| Destruction on request | Within **30 days** of the applicant's request, delete the interviews and instruct every other recipient to delete their copies, including all electronically generated backup copies | Destruction section |
| Demographic reporting | Applies only to employers that rely **solely** on AI analysis of the video to decide whether an applicant advances to an in-person interview. Report race and ethnicity of applicants afforded and not afforded in-person interviews, and of applicants hired | Reporting section |
| Reporting deadline | Annually by **December 31**, covering the 12-month period ending the preceding November 30, to the Department of Commerce and Economic Opportunity | DCEO reports to the Governor and General Assembly by July 1 on whether the data discloses racial bias |

**Ordering is the control.** Notice, explanation, and consent must all precede the interview. A post-interview acknowledgment does not cure it.

**The sole-reliance trigger** is narrow and most stacks fall outside it because a recruiter reviews before the in-person decision. Record the fact that puts you outside it; do not assume it.

---

## Illinois Human Rights Act, as amended by HB 3773

**Status:** statutory obligations in effect since 2026-01-01. Illinois Department of Human Rights rulemaking is still open — proposed amendments to Title 44, Part 2520 of the Illinois Administrative Code were published 2026-05-15, after an earlier draft was withdrawn.

| Control | Parameter |
|---|---|
| Discriminatory-effect prohibition | AI may not be used with the effect of subjecting employees or applicants to discrimination on a protected basis, in recruitment, hiring, promotion, renewal, selection for training or apprenticeship, discharge, discipline, tenure, or terms and conditions of employment. Intent is not required |
| Proxy prohibition | Using zip code as a proxy for a protected class is prohibited outright |
| Notice | Required whenever AI is used in a covered employment decision, regardless of whether the use has any discriminatory purpose or effect |

**Notice mechanics — timing, form, and content — are the subject of the open rulemaking.** Grade the notice-existence row now and put the mechanics row in `counsel-review` until the rules land.

---

## California — FEHA regulations on automated-decision systems

**Status:** in effect since 2025-10-01.

**Attaches when:** an employer uses artificial intelligence, machine learning, algorithms, statistics, or other data processing to facilitate human decision-making on recruitment, hiring, or promotion of applicants or employees in California.

| Control | Parameter |
|---|---|
| Records retention | **Four years** for automated-decision-system records, including selection criteria, relevant outputs, and audit findings |
| Third-party liability | The employer is answerable for discriminatory outcomes of a tool sourced from a vendor or run by an agent |
| Anti-bias testing | Not mandated. Evidence of testing may support a defense; the absence of it is admissible against the employer |

**The retention floor conflicts with privacy-minimization defaults and with deletion requests.** Surface the tension; do not resolve it in the report.

---

## Colorado SB 26-189 — automated decision-making technology

**Status:** signed 2026-05-14; effective **2027-01-01**. Attorney General rulemaking pending, and key terms will be defined there.

This replaced SB 24-205, the 2024 Colorado AI Act, which never took effect. SB 24-205's delayed start moved from 2026-02-01 to 2026-06-30 (SB 25B-004, signed 2025-08-28) and was then superseded. **The risk-management program, annual impact assessments, and broad algorithmic-discrimination duties of SB 24-205 are gone.** Any checklist still grading against them is auditing a repealed statute.

| Control | Parameter |
|---|---|
| Pre-use notice | Clear notice that a covered automated decision-making technology will be applied, before use |
| Post-adverse-outcome disclosure | Plain-language description of the technology's role, within **30 days** after a consequential decision producing an adverse outcome |
| Human review | The individual may request meaningful human review and reconsideration of the decision |
| Records | Retain relevant records at least **three years** |

Grade Colorado rows as forward-looking readiness until the effective date. Do not report a Colorado gap as accruing exposure today.

---

## Federal posture — context, not a control

Executive Order "Ensuring a National Policy Framework for Artificial Intelligence" (signed 2025-12-11) directs a Department of Justice AI Litigation Task Force, stood up from 2026-01-10, to challenge state AI laws in federal court, and directed Commerce to identify state laws suitable for challenge by March 2026.

**No state law in this matrix has been displaced by it.** Preemption of a state statute requires a court to say so or Congress to act. Treat the federal posture as a reason to keep controls documented and portable — not as a reason to retire any row above. Note it in the report's assumptions section so the reader knows it was considered.

---

## Not covered by this matrix

Add rows before relying on the skill for any of these: EU AI Act Annex III employment obligations; Maryland's facial-recognition consent requirement; Texas TRAIGA; New York State requirements distinct from the City's; sector rules for federal contractors; and any collective-bargaining commitments on automated evaluation.
