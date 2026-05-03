# Clause taxonomy — TEMPLATE

> Replace this template's contents with your firm's actual clause taxonomy
> per contract type. The clause-extraction skill reads this file on every
> run; without your real taxonomy, extractions will use the generic defaults
> below and miss the clauses your CLM cares about.

The skill keys on `clause_id`. Every clause record in the output JSON uses the `clause_id` as the property name. Adding a clause means: add an entry here AND add the matching property to `output-schema.json`.

## Convention

For each clause:

- `clause_id` — snake_case identifier used as the JSON key
- `value_type` — `string | number | boolean | enum | structured`
- `required` — `true | false` (drives `not_present` vs hard error in validation)
- `headings` — list of section heading strings the locator matches against
- `synonyms` — list of phrase substrings the locator falls back to when no heading matches
- `value_hint` — what the extractor should pull (e.g. "the named jurisdiction state or country", "12-month-fees / 24-month-fees / unlimited / other")

## MSA defaults

### governing_law

- value_type: `string`
- required: true
- headings: `["Governing Law", "Choice of Law", "Applicable Law"]`
- synonyms: `["shall be governed by", "construed in accordance with the laws of"]`
- value_hint: the named jurisdiction (state, province, or country)

### liability_cap

- value_type: `structured` — `{ type: "fees_period" | "fixed_amount" | "unlimited" | "other", amount?: number, period_months?: number, currency?: string }`
- required: true
- headings: `["Limitation of Liability", "Liability Cap", "Cap on Liability"]`
- synonyms: `["aggregate liability shall not exceed", "in no event shall either party's liability exceed"]`
- value_hint: extract the cap amount or formula. Distinguish indirect-damages exclusions (do NOT extract those here) from the cap itself.

### indemnification

- value_type: `structured` — `{ ip_indemnity: boolean, mutual: boolean, carveouts: string[] }`
- required: true
- headings: `["Indemnification", "Indemnity"]`
- synonyms: `["shall defend, indemnify and hold harmless"]`
- value_hint: pull the IP indemnity boolean and the carveouts list (e.g. combinations, modifications, open source).

### term_length_months

- value_type: `number`
- required: true
- headings: `["Term", "Term and Termination"]`
- synonyms: `["initial term of this Agreement", "shall commence on the Effective Date"]`
- value_hint: convert years to months (3-year term → 36).

### auto_renewal

- value_type: `structured` — `{ enabled: boolean, renewal_term_months?: number, notice_period_days?: number }`
- required: true
- headings: `["Renewal", "Term and Termination"]`
- synonyms: `["shall automatically renew", "evergreen", "successive renewal terms"]`

### termination_triggers

- value_type: `structured` — `{ for_convenience: { allowed: boolean, notice_days?: number }, for_cause: { material_breach_cure_days?: number }, for_insolvency: boolean }`
- required: true
- headings: `["Termination"]`
- synonyms: `["may terminate this Agreement", "for material breach"]`

### payment_terms

- value_type: `structured` — `{ net_days: number, currency: string, late_fee_apr?: number }`
- required: true
- headings: `["Payment", "Fees and Payment", "Invoicing"]`
- synonyms: `["payable within", "net thirty (30) days"]`

### ip_ownership

- value_type: `enum` — `vendor | customer | joint | work_for_hire | other`
- required: true
- headings: `["Intellectual Property", "Ownership", "IP Rights"]`
- synonyms: `["all right, title and interest"]`

### confidentiality_term_months

- value_type: `number`
- required: true
- headings: `["Confidentiality", "Non-Disclosure"]`
- synonyms: `["confidentiality obligations shall survive", "for a period of"]`
- value_hint: convert years to months. If trade-secret carveout is "in perpetuity", emit `-1` and set `confidence: medium`.

## NDA defaults

(Replace with your NDA-specific taxonomy. Typical: `term_months`, `survival_period_months`, `permitted_purposes`, `residual_rights`, `return_or_destroy`.)

## DPA defaults

(Replace with your DPA-specific taxonomy. Typical: `data_residency`, `subprocessor_consent`, `audit_rights`, `breach_notification_hours`, `sccs_module_used`.)

## Custom clauses (firm-specific)

Add your firm-specific clauses here. Examples to consider:

- `change_of_control_clause` — boolean + carveouts
- `most_favored_customer_clause` — boolean + scope
- `data_residency_clause` — enum of jurisdictions
- `assignment_restriction` — enum: `no_restriction | consent_required | prohibited`
- `non_solicit_term_months` — number

## Last edited

{YYYY-MM-DD} — bump on every taxonomy change. The extractor records this date in `extractor_version` so downstream consumers can detect schema drift.
