---
name: dpa-reviewer
description: Review a Data Processing Addendum (DPA) against the firm's DPA checklist (GDPR Art. 28 + CCPA-CPRA defaults). Returns a structured Markdown report with per-section citations, the obligation status (present-cited / present-vague / absent), and recommended redlines. Never auto-signs; the privacy counsel reviews and approves.
---

# DPA reviewer

## When to invoke

Use this skill when a privacy counsel or legal-ops lead has a vendor's DPA draft and wants a structured first-pass review against the firm's DPA checklist.

Do NOT invoke this skill for:

- **Auto-signing or approval based on the skill's verdict.** The skill recommends; the counsel approves.
- **DPAs in jurisdictions not in the checklist.** Add the jurisdiction to the checklist first.
- **Final-draft review.** The skill is calibrated for first-pass, where volume is highest.
- **Novel contract structures** (e.g. a master agreement with privacy embedded). Extract the DPA-equivalent provisions first; the skill expects DPA shape.

## Inputs

- Required: `dpa_path` — path to the DPA file (Markdown, plain text, or pre-extracted from PDF).
- Required: `checklist_path` — path to the firm's DPA checklist file.
- Optional: `vendor_profile_path` — vendor-specific notes that shape the review.
- Optional: `jurisdictions_in_scope` — array of jurisdictions, e.g. `["EU-GDPR", "UK-GDPR", "CCPA-CPRA"]`. Defaults to the checklist's stated coverage.

## Reference files

- `references/1-dpa-checklist.md` — the firm's checklist shape and starter content.
- `references/2-vendor-profile-template.md` — vendor-profile shape.

## Method

Five steps.

### 1. Section the DPA

Identify the standard sections by heading and content match:

- Definitions
- Subject matter, duration, nature, purpose
- Processor obligations
- Sub-processors
- International transfers
- Audit rights
- Breach notification
- Deletion / return on termination
- Liability and indemnification

If the document doesn't match a DPA shape (e.g. it's an MSA with privacy buried in §17), halt with a "not a standalone DPA — extract privacy provisions" message.

### 2. Run the checklist per section

For each obligation in the checklist, find the supporting DPA language in the corresponding section. Output per obligation:

- `status: present_cited` — language exists; cite section and quote.
- `status: present_vague` — language exists but doesn't carry the obligation's force ("commercially reasonable" instead of named timeframe; "industry standard" instead of named technical measure).
- `status: absent` — no language found.

### 3. Run the red-flag detector

Scan beyond the checklist for known anti-patterns:

- **International transfer without mechanism**: `processor may transfer data internationally` without naming the transfer mechanism (SCCs by module, BCRs, adequacy decision).
- **Broad sub-processor consent waiver**: `controller consents to use of any sub-processor` without notification or objection rights.
- **Audit rights limited to summaries**: `processor will provide summary of audits` instead of right to audit.
- **Vague breach notification**: `within a reasonable time` instead of named hours (GDPR is "without undue delay"; firm checklist usually pins to 24-72 hours).
- **Deletion-tied to vendor cycle**: `processor will delete data per its ordinary deletion cycle` instead of a named timeframe.
- **Liability cap below underlying agreement**: privacy claims excluded from the master cap, or capped at fees-paid-in-prior-12-months for breaches that could carry GDPR Art. 83 fines.

### 4. Citation per finding

Every finding must cite:

- DPA section number / heading
- The specific clause text (quoted)
- Length: ≤80 words per quoted clause to keep the report scannable.

Findings without a citable section are flagged as "not in document — counsel to verify" rather than asserted.

### 5. Recommended redlines per finding

For each absent or vague obligation, suggest replacement language. Source the redline from:

- The firm's checklist's stated obligation (preferred)
- The firm's prior approved redlines for similar issues (if a `prior_redlines/` corpus is available)
- GDPR Art. 28 / CCPA-CPRA standard language as fallback

Mark the redline source so counsel can weight ("from firm checklist" vs "from prior redline" vs "fallback to standard language").

## Output format

```markdown
# DPA review — {vendor name} — {date received}

Reviewed: {ISO timestamp} · Skill v1.0 · Checklist: {sha} · Jurisdictions: {list}

## Summary

- Sections present: {count}/9
- Obligations present (cited): {count}
- Obligations present (vague): {count}
- Obligations absent: {count}
- Red flags: {count}

Recommended action: {return-with-redlines | escalate-to-counsel | safe-to-counter-sign}

## Section-by-section findings

### Sub-processors (DPA §5)

- **Sub-processor consent (checklist §3.2):** present_vague. DPA quote: "Controller hereby consents to Processor's use of sub-processors as listed on Processor's website, which may be updated from time to time." Concern: blanket consent with no notification or objection right. Recommended redline:

> Controller's consent to sub-processors is limited to those listed in Annex C as of the Effective Date. Processor shall notify Controller of any new sub-processor at least 30 days before engagement, and Controller may object on reasonable grounds; if Controller objects, the parties shall negotiate in good faith, and if no resolution within 30 days, Controller may terminate the affected services.

### International transfers (DPA §6)

- **Transfer mechanism (checklist §4.1):** absent. DPA does not name SCCs, BCRs, or adequacy. Recommended redline:

> The parties agree that any transfer of Personal Data to a country outside the EEA / UK shall be governed by the Standard Contractual Clauses (Module 2: Controller-to-Processor) annexed hereto as Annex D, with the data importer being Processor and the data exporter being Controller.

(further sections...)

## Red flags

- **Vague breach window** (DPA §7.1): "within a reasonable time" — recommend pinning to 48 hours from confirmed discovery.
- **Liability cap on privacy claims** (DPA §9): privacy claims capped at fees-paid-in-prior-12-months. Recommend uncapped for GDPR Art. 83 fines and reasonable cap (12-24 months) for indemnification.

## Provenance

- DPA: `{path}`
- Checklist: `{path}` SHA `{short}`
- Vendor profile: `{path}` (if used)
- Generated: {ISO timestamp}
```

## Watch-outs

- **Citation hallucination.** *Guard:* findings without citable sections get "not in document" tag, not asserted.
- **Jurisdiction drift.** *Guard:* checklist names covered jurisdictions; uncovered jurisdictions trigger warning.
- **Confidentiality.** *Guard:* DPAs carry vendor-confidential terms. Use API access with zero-retention.
- **SCC version drift.** *Guard:* checklist captures accepted SCC modules; older or unidentified modules flagged.
- **Redline grounding.** *Guard:* every redline marks its source (firm checklist / prior redline / fallback) so counsel can weight.
