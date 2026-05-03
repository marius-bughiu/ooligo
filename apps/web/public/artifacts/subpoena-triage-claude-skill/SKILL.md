---
name: subpoena-triage
description: Triage an incoming subpoena, third-party document request, or law-enforcement request. Extract metadata, classify by type, identify implicated custodians, flag privilege exposure, and emit a structured intake report for counsel review. Never auto-acknowledges service; never auto-issues holds; always escalates to counsel.
---

# Subpoena triage

## When to invoke

Use this skill when paralegal or legal-ops has received a subpoena (or third-party document request, or law-enforcement request) and wants a structured triage report before counsel routing.

Do NOT invoke this skill for:

- **Auto-acknowledging service** — counsel decides.
- **Foreign letters rogatory / Hague Convention requests** — different procedure; halt and escalate to international counsel.
- **Replacing counsel's privilege analysis** — the skill flags; counsel decides.
- **Issuing legal holds** — separate workflow; the skill flags but does not issue.

## Inputs

- Required: `subpoena_path` — path to the subpoena document (Markdown, plain text, or pre-extracted from PDF).
- Required: `classification_rubric` — path to the firm's classification rubric file.
- Required: `privilege_rules` — path to the firm's privilege-flag rules.
- Optional: `custodian_map` — path to a current custodian-of-record map.

## Reference files

- `references/1-subpoena-classification.md` — classification rubric template.
- `references/2-privilege-flag-rules.md` — privilege-flag rule template.

## Method

Six steps.

### 1. Extract metadata

From the subpoena document, extract:

- **Issuer** — court (with jurisdiction, division), agency name, or requesting party (with their counsel of record).
- **Case caption** — full caption including parties, case number, court.
- **Service date** — when service was effected. If unclear from the document, ask the user.
- **Response deadline** — the date by which the firm must respond. Compute from service date + the jurisdiction's response window if not stated explicitly.
- **Jurisdiction** — court's jurisdiction, governing rules (FRCP, state rules, agency rules).

If any of the five cannot be determined from the document, halt with a "metadata extraction incomplete — counsel to confirm before triage proceeds" message. Do NOT guess.

### 2. Classify by type

Per the rubric:

- **Civil third-party subpoena** — issued in litigation between two third parties; firm is a non-party witness.
- **Civil party subpoena** — firm is a party; the subpoena is from the opposing party. Different counsel ownership.
- **Grand-jury subpoena** — federal grand jury investigation. Confidential by nature; restricted handling.
- **Regulatory** — SEC, DOJ civil division, state AG, FTC, etc. Subtype by agency.
- **Foreign legal-process** — letters rogatory, Hague Convention requests, foreign agency requests. Halt and escalate.
- **Law-enforcement request** — federal or state law-enforcement; subtype by whether warrant-backed (less latitude to object) or pen-register / NSL / etc. (different latitude).

Output: classification + counsel owner per the rubric + jurisdiction-specific timeline.

### 3. Extract requested document categories

The subpoena's requests are typically itemized (Request No. 1, Request No. 2, ...). Extract each. Tag with the firm's document-category taxonomy:

- Contracts (commercial, employment, M&A)
- Communications (email, Slack, SMS, etc.)
- Financials (transactional records, accounting, tax)
- Technical specifications / source code
- HR records (personnel files, comp data)
- Marketing materials
- Other (catchall, surface to counsel for taxonomy expansion)

Flag overbroad requests:

- "All documents related to X" without temporal limit → flag for objection.
- "All communications" without scope → flag.
- Time period exceeding the relevant statute of limitations or the firm's records-retention policy → flag.

### 4. Estimate custodian implications

From document categories + matter context, identify likely custodians:

- Named individuals if the subpoena names them
- Roles likely to hold responsive material (e.g. "Communications" + "marketing campaign in 2023" → marketing team; "Contracts" + "Acme deal" → deal team + legal department)

Output: list of custodians with role + reasoning. Mark as "estimate — counsel to confirm before any hold is issued."

If `custodian_map` is provided, validate that the named custodians still hold the role. Stale roles trigger a flag.

### 5. Flag privilege exposure

Per the privilege-flag rules:

- **Attorney-client communications** — flag if requests cover communications with named counsel, in-house lawyers, or outside firms.
- **Work-product** — flag if requests cover analyses, drafts, or strategy documents prepared in anticipation of litigation.
- **Joint-defense / common-interest** — flag if the matter has joint-defense agreements covering related parties.
- **Settlement communications** (FRE 408) — flag if requests overlap with settlement discussions.
- **Other privileges** — per firm rules (clergy, marital, doctor-patient, etc.).

Each flag includes paired guard:

- "Flagging because category 'all communications with counsel' implicates attorney-client privilege; recommend privilege log preparation."
- "Flagging because category 'litigation strategy memos' implicates work-product doctrine; recommend Rule 26 work-product objection."

### 6. Emit triage report + audit log

Write the structured report. Append a JSONL audit-log line per intake — counsel needs the audit chain for matter-management.

Audit log line:

```json
{
  "subpoena_id": "uuid",
  "received_at": "ISO-8601",
  "issuer": "...",
  "classification": "civil-third-party",
  "deadline": "ISO-8601",
  "custodian_estimate_count": 5,
  "privilege_flags": ["attorney-client", "work-product"],
  "skill_version": "1.0",
  "model": "claude-sonnet-4-6",
  "service_acknowledged": false
}
```

The `service_acknowledged: false` is explicit — the skill never acknowledges service.

## Output format

```markdown
# Subpoena triage — {subpoena_id}

Triaged: {ISO timestamp} · Skill v1.0

⚠️ Service NOT acknowledged. Counsel handles acknowledgement.

## Metadata

- **Issuer:** {court / agency / requesting party}
- **Case caption:** {caption}
- **Service date:** {date}
- **Response deadline:** {date} ({N} days from service)
- **Jurisdiction:** {jurisdiction}

## Classification

- **Type:** {civil-third-party / grand-jury / regulatory / etc.}
- **Counsel owner (per firm rubric):** {role / name}
- **Timeline (per jurisdiction rules):** {N days standard, with motion-to-quash deadline at +{M} days}

## Requested document categories

| Request No. | Category | Scope | Flag |
|---|---|---|---|
| 1 | Contracts | "All MSAs with Customer Acme 2020-2024" | none |
| 2 | Communications | "All communications regarding the dispute" | overbroad — no temporal limit |
| 3 | Financials | "All revenue records 2020-2024" | none |

## Custodian estimate (counsel to confirm before hold)

- Named: Jamie Liu (Acme deal owner)
- Role-based: Legal Department (privilege concerns), Finance (financials), Customer Success (Acme account)

Custodian count: 5-8 implicated.

## Privilege flags

- ⚠️ Attorney-client privilege: Request 2 covers "all communications" which implicates attorney-client communications. Recommend privilege log preparation.
- ⚠️ Work-product doctrine: Request 4's "litigation strategy memos" is core work-product. Recommend Rule 26 objection.

## Recommended actions for counsel

1. Acknowledge service per jurisdiction rules.
2. Confirm custodian list and issue litigation hold (see [litigation hold orchestration](/en/workflows/litigation-hold-orchestration-n8n/)).
3. Prepare objections per overbroad-request flags (Requests 2, 5).
4. Plan privilege-log preparation for Requests 2, 4.
5. Confirm response deadline calendar entry.

## Provenance

- Subpoena: `{path}`
- Rubric: `{path}` SHA `{short}`
- Privilege rules: `{path}` SHA `{short}`
- Audit log: `audit/2026-05.jsonl` line {N}
```

## Watch-outs

- **Citation hallucination.** *Guard:* findings cite rubric / privilege-rule sections; without citation, flagged as "rubric does not cover."
- **Privilege miss.** *Guard:* over-flag is the default posture.
- **Service implication.** *Guard:* every report and audit line includes `service_acknowledged: false`.
- **Grand-jury confidentiality.** *Guard:* grand-jury classifications route to restricted destination per firm procedure; not written to standard tracking.
- **Foreign-process miscategorization.** *Guard:* halt and escalate, not classify.
