# Control library — TEMPLATE

> Replace this template's contents with the firm's actual mapped control
> library. The vendor-dd-questionnaire skill reads this file on every run;
> without the firm's real controls, every answer is a generic AI-flavored
> response disconnected from the firm's actual security posture.

## How this file is used

The skill matches every question in the inbound questionnaire to one
entry below. Match priority is: exact framework section → topic +
sub-topic within framework → cross-framework topic → no match (flag for
escalation). The skill never improvises an answer when no entry matches.

Each entry is keyed by canonical control ID and lists the equivalences
across the frameworks the firm has been audited against. Add new
frameworks here, not in the skill body.

## Library metadata

- `library_version`: replace with the firm's library version tag.
- `last_reviewed`: YYYY-MM-DD — the skill prints this in the summary
  header, and the analyst rejects drafts where this is older than 90 days.
- `frameworks_covered`: e.g. `[SOC 2 Type II, ISO 27001:2022, NIST CSF,
  CCM v4]` — questionnaires citing frameworks not on this list are
  flagged for security-team mapping.

---

## Entry: access-control / least-privilege

- **Canonical ID:** `IAM.001`
- **Framework equivalences:**
  - SOC 2: `CC6.1`, `CC6.2`, `CC6.3`
  - ISO 27001:2022: `A.5.15`, `A.5.18`
  - CCM v4: `IAM-08`, `IAM-09`
  - NIST CSF: `PR.AC-1`, `PR.AC-4`
- **Canonical answer:** Replace with the firm's actual one- or
  two-sentence answer. Example shape: "Access is granted role-based via
  <IdP>; quarterly access reviews enforce least privilege; provisioning
  and de-provisioning are logged."
- **Supporting evidence:** `EV-SOC2-<year>` (§<section>), `EV-IDP-CONFIG-<year>`
- **Last audited:** YYYY-MM-DD
- **Notes for the analyst:** any caveats — e.g. "answer differs for
  production vs corporate access; if question scope is corporate-only,
  flag for human review."

---

## Entry: encryption-at-rest

- **Canonical ID:** `CRYPTO.001`
- **Framework equivalences:**
  - SOC 2: `CC6.7`
  - ISO 27001:2022: `A.8.24`
  - CCM v4: `EKM-03`, `EKM-04`
- **Canonical answer:** Replace with the firm's actual answer. Example
  shape: "All customer data at rest encrypted with <algorithm>;
  customer-managed keys available on the <tier> plan; key rotation
  every <N> days via <KMS>."
- **Supporting evidence:** `EV-SOC2-<year>`, `EV-KMS-CONFIG-<year>-Q<n>`
- **Last audited:** YYYY-MM-DD
- **Notes for the analyst:** if the question asks specifically about
  customer-managed keys (CMK / BYOK) and the firm offers them only on a
  higher tier, the answer changes by deal — flag.

---

## Entry: encryption-in-transit

- **Canonical ID:** `CRYPTO.002`
- **Framework equivalences:**
  - SOC 2: `CC6.7`
  - ISO 27001:2022: `A.8.24`
  - CCM v4: `EKM-03`
- **Canonical answer:** Replace with the firm's actual answer. Example
  shape: "TLS <min version> enforced on all external endpoints; HSTS
  enabled; cipher suite restricted to <list>."
- **Supporting evidence:** `EV-PENTEST-<year>-Q<n>`, `EV-SSLLABS-<year>-<month>`
- **Last audited:** YYYY-MM-DD

---

## Entry: incident response

- **Canonical ID:** `IR.001`
- **Framework equivalences:**
  - SOC 2: `CC7.3`, `CC7.4`, `CC7.5`
  - ISO 27001:2022: `A.5.24`, `A.5.25`, `A.5.26`
  - CCM v4: `SEF-02`, `SEF-03`, `SEF-04`
- **Canonical answer:** Replace with the firm's actual answer. Example
  shape: "Documented IR plan reviewed annually; tabletop conducted
  every <N> months; security incidents reported to affected customers
  within <N> hours of confirmation."
- **Supporting evidence:** `EV-IR-PLAN-<year>`, `EV-TABLETOP-<year>-<month>`
- **Last audited:** YYYY-MM-DD
- **Notes for the analyst:** notification SLA varies by contract;
  default to the policy SLA but flag if the customer's MSA carries a
  shorter window.

---

## Entry: business continuity / disaster recovery

- **Canonical ID:** `BCP.001`
- **Framework equivalences:**
  - SOC 2: `A1.2`, `A1.3`
  - ISO 27001:2022: `A.5.29`, `A.5.30`
  - CCM v4: `BCR-01`, `BCR-08`
- **Canonical answer:** Replace with the firm's actual answer. Example
  shape: "RTO <hours>, RPO <minutes>; DR plan tested <frequency>; multi-AZ
  deployment with cross-region failover for <component list>."
- **Supporting evidence:** `EV-BCP-<year>`, `EV-DR-TEST-<year>-<month>`
- **Last audited:** YYYY-MM-DD

---

## Entry: sub-processor management

- **Canonical ID:** `VEND.001`
- **Framework equivalences:**
  - SOC 2: `CC9.2`
  - ISO 27001:2022: `A.5.19`, `A.5.20`, `A.5.21`
  - CCM v4: `STA-07`, `STA-09`
- **Canonical answer:** Replace with the firm's actual answer. Example
  shape: "Sub-processor list maintained at <URL>; customers notified
  <N> days before adding a new sub-processor; right-of-objection per
  DPA §<n>."
- **Supporting evidence:** `EV-SUBPROCESSORS-<year>-<month>`, `EV-DPA-TEMPLATE-<year>`
- **Last audited:** YYYY-MM-DD

---

## Entry template — copy this for new controls

- **Canonical ID:** `<DOMAIN>.<NUMBER>`
- **Framework equivalences:**
  - SOC 2: `<section>`
  - ISO 27001:2022: `<annex section>`
  - CCM v4: `<control ID>`
  - NIST CSF: `<function.category-N>`
- **Canonical answer:** the firm's reviewed answer, one to three sentences.
- **Supporting evidence:** `EV-<DOC>-<year>`
- **Last audited:** YYYY-MM-DD
- **Notes for the analyst:** caveats, scope notes, deal-specific
  variants the analyst needs to know about.
