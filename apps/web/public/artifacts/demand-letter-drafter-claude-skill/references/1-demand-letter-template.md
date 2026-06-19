# Demand-letter template (firm skeleton — replace with the firm's actual letter)

This is a starting skeleton. Replace it with the firm's real demand letter so the skill assembles into the firm's voice, section order, and boilerplate. Keep the `{{placeholder}}` tokens — the skill fills them. Everything else is the firm's prose.

The skill assembles into this template. It does not invent sections. If the firm's letter has a section this skeleton lacks (e.g. a punitive-damages paragraph, a UM/UIM section), add it here with its own placeholders.

---

**{{firm_letterhead}}**

{{date}}

{{adjuster_name}}
{{insurer_name}}
{{insurer_address}}

**RE:** Claim of {{client_name}} · Claim No. {{claim_number}} · Date of loss: {{date_of_loss}} · Your insured: {{insured_name}}

Dear {{adjuster_name}},

This firm represents {{client_name}} for injuries sustained in the {{incident_type}} of {{date_of_loss}}. This letter presents our client's claim and our demand for settlement.

## 1. Facts and liability

{{facts_narrative}}

<!-- Skill fills from police report + case notes. Statements unsupported by the report are flagged in the checklist, not written here. Report-vs-client conflicts are surfaced, not resolved. -->

## 2. Injuries and treatment

{{injuries_narrative}}

<!-- Skill fills from the medical chronology. Diagnosis, course of treatment, provider impressions, current status as the records state it. No prognosis/permanency/causation beyond what a provider wrote. -->

### Treatment chronology

{{chronology_table}}

<!-- The dated medical chronology, per references/3-medical-chronology-schema.md. -->

## 3. Damages

### Special damages

{{special_damages_itemization}}

<!-- Itemized, each line citing its source page. Missing/unreconciled items are flagged in the checklist and excluded here. -->

**Total special damages: {{special_damages_total}}**

### General damages

{{general_damages_narrative}}

<!-- The pain-and-suffering / non-economic narrative. The amount is the attorney's; the skill provides the range in the checklist, not in this paragraph, unless the firm's template states a number here (in which case the attorney inserts it). -->

## 4. Demand

Based on the foregoing, {{client_name}} demands **{{demand_amount}}** to resolve this claim in full.

<!-- {{demand_amount}} is left for the attorney. The skill never fills it. -->

This demand remains open until **{{response_deadline}}**, after which we reserve all rights, including filing suit.

<!-- {{response_deadline}}: attorney sets it. Commonly 30 days; jurisdiction and pre-suit notice rules vary — confirm. -->

Please direct all communication regarding this claim to this office.

Sincerely,

{{attorney_name}}
{{firm_name}}

**Enclosures:** {{enclosures_list}}

<!-- Medical records, bills, wage documentation, photographs, etc. The skill lists what it indexed; the attorney confirms the production. -->

---

## How to adapt this template

1. Paste the firm's actual demand letter over this skeleton.
2. Mark every spot the skill should fill with a `{{placeholder}}` token. The tokens above are the minimum set; add more (UM/UIM, future medicals, lien summary) as the firm's letter requires.
3. Leave `{{demand_amount}}` and `{{response_deadline}}` as placeholders the attorney fills — the skill is configured never to set them.
4. Keep boilerplate (reservation of rights, confidentiality, FRE 408 "for settlement purposes only" legend if the firm uses one) as fixed prose, not placeholders.
