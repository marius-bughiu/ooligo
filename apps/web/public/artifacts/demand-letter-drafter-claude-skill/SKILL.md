---
name: demand-letter-drafter
description: Draft a first-pass personal-injury settlement demand letter from a case file (medical records, bills, wage-loss docs, police report, case notes). Build a cited medical chronology, itemize special damages, compute a general-damages range from the firm's playbook, and assemble the letter into the firm's template. Every figure cites a record page; unsupported claims go to an "insufficient data" list. Attorney review required — never sets the demand number, never sends.
---

# Personal-injury demand letter drafter

## When to invoke

Use this skill when a paralegal or attorney has a collected, text-readable PI case file and wants a first-draft demand letter — a cited medical chronology, itemized special damages, a general-damages range, and a letter assembled into the firm's template.

Do NOT invoke this skill for:

- **Setting the final demand number** — output is a range; the attorney sets the figure.
- **Disputed-liability or comparative-fault cases** — the demand is an advocacy document the attorney drafts; this skill is for clear-liability assembly work.
- **Litigation filings** — complaints, motions, discovery responses are court documents, out of scope.
- **Medical opinion** — the skill reports what providers wrote; it does not infer prognosis, causation, or permanency.

**Attorney review is required on every draft.** The skill assembles and cites; the attorney verifies every cited fact, sets the demand number, and signs.

## Inputs

- Required: `case_file_path` — directory of text-readable records (OCR'd PDFs, exports). Bills, medical records, wage-loss docs, police report, case notes.
- Required: `template` — path to the firm's demand-letter template (`references/1-demand-letter-template.md` is the starting skeleton).
- Required: `damages_playbook` — path to the firm's damages methodology (`references/2-damages-playbook.md`).
- Optional: `chronology_schema` — path to the chronology schema (`references/3-medical-chronology-schema.md`); defaults to the bundled schema.
- Optional: `client_account` — the client's written/recorded account of the incident, for the facts-conflict check.

## Reference files

- `references/1-demand-letter-template.md` — the firm's demand-letter skeleton.
- `references/2-damages-playbook.md` — multiplier bands, per-diem rate, jurisdiction notes.
- `references/3-medical-chronology-schema.md` — chronology columns and citation format.

## Method

Seven steps. Chronology before damages, because every special-damages line and every injuries-narrative sentence cites a chronology entry, and every chronology entry cites a record page.

### 1. Index the record set

Ingest every file. Build a page index keyed by document name + page so later citations resolve. List unreadable files (failed OCR, image-only, password-locked) in an `unprocessed` block — never silently skip them. Stop and report if the bills or the medical records are entirely absent; there is no demand to draft without them.

### 2. Build the dated medical chronology

One row per date of service, per the chronology schema:

| Date | Provider | Complaint / treatment | Billed | Record page |

- Sort by date.
- Flag treatment gaps over the playbook's gap threshold (default 30 days between consecutive visits) — adjusters use gaps to argue the injury resolved.
- Flag any entry where the date, provider, or billed amount is unreadable in the source — cite the page and mark `[illegible — confirm]`.

### 3. Itemize special damages

- **Medical specials** — total billed by provider, citing each bill page. Use billed amounts, not paid/adjusted, unless the playbook says otherwise (jurisdictions differ on the collateral-source and billed-vs-paid question — the playbook controls).
- **Wage loss** — from the documentation (employer letter, pay stubs, tax records), citing the page.
- **Out-of-pocket** — mileage, devices, co-pays, with citations.
- Flag bills referenced in records but missing from the file as `missing — retrieve before sending`. Exclude them from the total. Do not estimate a missing bill.
- Flag liens and unreconciled balances for attorney confirmation.

### 4. Draft the liability and facts narrative

From the police report and case notes, draft how the incident happened. Statements the report does not support are flagged, not written. If `client_account` is provided and it conflicts with the report, surface the conflict — do not pick one side.

### 5. Draft the injuries and treatment narrative

Grounded in the chronology: diagnosis, course of treatment, provider impressions, current status as the records state it. No prognosis, permanency, or causation language beyond what a provider wrote. If the firm wants a permanency argument, emit a flag: `permanency argument requires treating-physician statement — not in record`.

### 6. Compute the general-damages range

Per the playbook:

- **Multiplier method** — apply the severity band to the medical specials. Output `range_low = band_low × specials`, `range_high = band_high × specials`. Show the band.
- **Per-diem method** — if the playbook uses it, multiply the daily rate by the documented recovery period.

Output a labelled range, never a single number:

```
General damages (starting point — attorney sets the figure):
  $X – $Y  (2.5–4.0× medical specials of $Z, per playbook §severity-moderate)
```

### 7. Assemble the draft and the review checklist

Fill the firm's template. Leave the response-deadline line as a placeholder (`[ATTORNEY: set response deadline — commonly 30 days]`). Produce the review checklist alongside the letter (see Output format) so the attorney verifies in minutes.

## Output format

Two artifacts: the draft letter (firm template, filled) and the review checklist below.

```markdown
# Demand draft — {matter_id} — REVIEW CHECKLIST

⚠️ DRAFT. Attorney sets the demand number and confirms every cited fact. Not sent.

## Figures and citations
| Item | Amount | Source page |
|---|---|---|
| Medical specials — City ER | $4,210 | bills.pdf p.3 |
| Medical specials — Apex PT | $6,880 | bills.pdf p.7-9 |
| Wage loss | $3,100 | wages.pdf p.1 |
| **Special damages total** | **$14,190** | (sum, verified) |
| General damages range | $35,000–$57,000 | playbook §severity-moderate (2.5–4.0×) |

## Flags — resolve before sending
- ⚠️ Treatment gap: 41 days between ER (03-04) and first PT (04-14). records.pdf p.12.
- ⚠️ Missing bill: imaging referenced (records.pdf p.15) — no bill in file. Retrieve.
- ⚠️ Lien: hospital lien noted (records.pdf p.4) — confirm amount.
- ⚠️ Facts conflict: report says "stopped"; client account says "slowing." report.pdf p.2.

## Insufficient data — not written into the letter
- Permanency: no treating-physician permanency statement in record.
- Future medical: no life-care plan or future-treatment estimate in record.

## Provenance
- Case file: {path} ({N} files indexed, {M} unprocessed)
- Template: {path}
- Playbook: {path} §{section}
- Drafted: {ISO timestamp} · Skill v1.0 · {model}
```

## Watch-outs

- **Hallucinated facts/figures.** *Guard:* every figure and factual claim cites a record page; uncitable claims go to "insufficient data," never into the letter.
- **Range read as a valuation.** *Guard:* general damages is always a labelled range with the band shown; the attorney sets the number.
- **PHI exposure.** *Guard:* run only on a Claude deployment whose data terms (zero-retention, BAA where required) meet the firm's HIPAA program. Never a consumer endpoint.
- **Missing bills counted as zero.** *Guard:* referenced-but-absent bills are flagged and excluded, not estimated.
- **Jurisdiction-wrong playbook.** *Guard:* caps, fee rules, and notice requirements are attorney-confirmed; the skill cites the playbook, it does not assert the law.
