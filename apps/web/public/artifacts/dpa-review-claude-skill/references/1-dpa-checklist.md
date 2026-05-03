# DPA checklist (firm template)

The DPA reviewer scores against this checklist. Copy this file to `firm-dpa-checklist.md`, customize for the firm's risk posture and the jurisdictions in scope, and version it in git.

The checklist is the comparison anchor. The reviewer's findings cite obligations by ID (`§1.1`, `§3.2`, etc.) — keep IDs stable across versions or document renumbering in a changelog.

## §0 — Scope

- **§0.1** Jurisdictions covered: EU GDPR (Reg. 2016/679), UK GDPR + DPA 2018, CCPA-CPRA. To extend coverage, add the jurisdiction's required obligations to the relevant section below.
- **§0.2** Scope: this checklist applies to vendor DPAs where the firm is the controller or business and the vendor is the processor or service provider.
- **§0.3** Out of scope for this checklist: joint-controller arrangements, controller-to-controller transfers, intra-group DPAs (handled separately).

## §1 — Definitions

- **§1.1** "Personal Data" defined to track GDPR Art. 4(1) AND CCPA-CPRA "Personal Information" — the broader of the two governs the DPA.
- **§1.2** "Processing" tracks GDPR Art. 4(2).
- **§1.3** "Sub-processor" defined to include any party engaged by Processor to process Personal Data on Controller's behalf.
- **§1.4** "Personal Data Breach" tracks GDPR Art. 4(12).

## §2 — Subject matter, duration, nature, purpose, types of data, categories of data subjects

- **§2.1** DPA names the subject matter and duration of processing.
- **§2.2** DPA names the nature and purpose of processing in specific terms (not just "providing the Services").
- **§2.3** DPA names the types of Personal Data and the categories of data subjects.

## §3 — Processor obligations

- **§3.1** Processor processes Personal Data only on documented instructions from Controller.
- **§3.2** Sub-processor consent: Processor obtains prior written consent for sub-processors. Default: per-sub-processor consent. Acceptable alternative: notification + 30-day objection right.
- **§3.3** Confidentiality: Processor ensures personnel processing data are bound by confidentiality.
- **§3.4** Technical and organizational measures (TOMs): Processor implements appropriate measures per GDPR Art. 32. The DPA names specific measures (encryption at rest and in transit, access controls, logging) — vague "industry-standard" language is a finding.
- **§3.5** Assistance with data-subject rights: Processor assists Controller with data-subject access, rectification, erasure, restriction, portability, and objection requests.
- **§3.6** Assistance with DPIAs: Processor assists Controller with Data Protection Impact Assessments where required.

## §4 — International transfers

- **§4.1** Transfer mechanism named: SCCs (specify modules — usually Module 2: Controller-to-Processor and/or Module 3: Processor-to-Processor for sub-processor transfers), BCRs, or adequacy decision.
- **§4.2** SCC version pinned: EU 2021/914 modules (current as of this checklist version). UK: International Data Transfer Agreement (IDTA) or UK Addendum to EU SCCs.
- **§4.3** Transfer impact assessment (TIA) obligation acknowledged where Schrems II / equivalent applies.
- **§4.4** Onward transfers from sub-processors covered by the same mechanism.

## §5 — Audit rights

- **§5.1** Controller has the right to audit Processor's compliance with the DPA, either directly or through an independent third-party auditor.
- **§5.2** Audit frequency: at least annually, and on material change in processing or breach.
- **§5.3** Audit scope: not limited to "summary findings" — Controller can review the actual evidence (sub-processor lists, log samples, TOM documentation).
- **§5.4** Reasonable notice: Controller provides reasonable advance notice (default: 30 days) for routine audits. Breach-related audits may proceed on shorter notice.

## §6 — Breach notification

- **§6.1** Processor notifies Controller of a Personal Data Breach without undue delay.
- **§6.2** Named timeframe: 48 hours from confirmed discovery (firm preference; GDPR Art. 33 sets the Controller's obligation at 72 hours, so Processor must notify earlier).
- **§6.3** Notification includes: nature of breach, categories and approximate number of data subjects, likely consequences, measures taken or proposed.
- **§6.4** No "reasonable time" or "as soon as practicable" — these are findings.

## §7 — Deletion / return on termination

- **§7.1** On termination, Processor returns or deletes all Personal Data (Controller's choice).
- **§7.2** Named timeframe: within 30 days of termination, or earlier if required by Controller.
- **§7.3** Processor certifies in writing that deletion has occurred (or that data has been returned).
- **§7.4** Retention beyond termination only as required by applicable law, with named legal basis.

## §8 — Liability

- **§8.1** Privacy claims (GDPR Art. 82, equivalent CCPA-CPRA private rights of action) are NOT subject to the master agreement's general liability cap, OR are subject to a higher cap (e.g. 24x monthly fees) reflecting privacy risk.
- **§8.2** Indemnification for Processor's breach of the DPA is separately addressed.

## §9 — CCPA-CPRA-specific (where applicable)

- **§9.1** Vendor classification: Service Provider, Contractor, or Third Party — DPA names which.
- **§9.2** Service-Provider obligations under CCPA-CPRA §1798.140(ag) included.
- **§9.3** Sale / share of Personal Information explicitly prohibited (DPA states Processor does not "sell" or "share" Personal Information as defined under CPRA).
- **§9.4** Notification of unauthorized use as Service Provider.

## §10 — Schedule of TOMs

- **§10.1** Annex / Schedule lists specific Technical and Organizational Measures, not just generic categories.
- **§10.2** TOMs include: encryption at rest, encryption in transit, access controls, logging, vulnerability management, incident response, business continuity.
- **§10.3** Certifications named (SOC 2 Type II, ISO 27001, ISO 27018) where applicable.

## §11 — Sub-processor list (Annex)

- **§11.1** DPA includes a current sub-processor list as an annex, OR references a maintained list (URL) with notification on changes.
- **§11.2** Sub-processor list includes: name, processing activity, location.

## How to customize

When you adapt this template:

1. Tighten or loosen specific obligations to match the firm's risk posture (e.g. shorter breach window for highly regulated industries).
2. Add jurisdictions to §0.1 and the corresponding required-obligation sections.
3. Document the per-vendor exception process — some sub-processor consent waivers are acceptable for hyperscaler dependencies.
4. Versioning: bump the version line in §0 when you make changes; the reviewer captures the SHA per audit.
