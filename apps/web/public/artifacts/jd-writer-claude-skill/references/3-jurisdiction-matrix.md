# Jurisdiction compliance matrix — TEMPLATE

> Replace the contents of this file with your team's legal-reviewed
> matrix. The defaults below reflect public legislation as of mid-2025
> but are not legal advice and will age. The jd-writer skill reads
> this file on every run and inserts the verbatim language for the
> target jurisdiction.

For each jurisdiction, the matrix supplies four blocks:
pay-disclosure rule, EEO statement (verbatim), accommodation statement
(verbatim), and application-data restrictions (e.g. salary-history
ban). The skill copies the verbatim blocks into the JD output without
paraphrasing.

## US-NY (New York City + New York State)

- **Pay disclosure**: Required. Must include good-faith minimum and
  maximum annual salary range for the role. NYC Local Law 32 / NY
  State S9427A.
- **EEO statement**: `{Company}` is an equal opportunity employer.
  All qualified applicants will receive consideration for employment
  without regard to race, color, religion, sex, sexual orientation,
  gender identity or expression, national origin, age, disability,
  marital status, veteran status, or any other characteristic
  protected by federal, state, or local law.
- **Accommodation statement**: `{Company}` is committed to providing
  reasonable accommodations to qualified individuals with disabilities.
  If you require an accommodation during the application or interview
  process, please contact `{accommodations email}`.
- **Application-data restrictions**: Salary-history inquiries
  prohibited. Do not include "What is your current salary?" on
  application forms.

## US-CA (California)

- **Pay disclosure**: Required for employers with 15+ employees. Must
  include pay scale (range). SB 1162.
- **EEO statement**: as US-NY, with the addition of "or any
  characteristic protected under California Fair Employment and
  Housing Act."
- **Accommodation statement**: as US-NY.
- **Application-data restrictions**: Salary-history inquiries
  prohibited (Labor Code §432.3). Ban-the-box: criminal-history
  inquiry only after conditional offer.

## US-CO (Colorado)

- **Pay disclosure**: Required. Must include hourly or salary
  compensation, a general description of bonuses/commissions, and a
  general description of benefits. Equal Pay for Equal Work Act.
- **EEO statement**: as US-NY.
- **Accommodation statement**: as US-NY.
- **Application-data restrictions**: Salary-history inquiries
  prohibited.

## US-WA (Washington)

- **Pay disclosure**: Required for employers with 15+ employees. Must
  include wage scale or salary range, and a general description of
  benefits and other compensation. RCW 49.58.110.
- **EEO statement**: as US-NY.
- **Accommodation statement**: as US-NY.
- **Application-data restrictions**: Salary-history inquiries
  prohibited.

## US-IL (Illinois, eff. 2025)

- **Pay disclosure**: Required for employers with 15+ employees. Must
  include pay scale and benefits. PA 103-0539.
- **EEO statement**: as US-NY.
- **Accommodation statement**: as US-NY.
- **Application-data restrictions**: Salary-history inquiries
  prohibited.

## US-other (federal floor)

- **Pay disclosure**: Not required by federal law. Recommended for
  consistency.
- **EEO statement**: as US-NY (federal characteristics only).
- **Accommodation statement**: as US-NY.
- **Application-data restrictions**: Federal floor only. Check state
  and city law before posting.

## EU-DE (Germany)

- **Pay disclosure**: Not required at posting. Required on request
  under Entgelttransparenzgesetz for employers with 200+ employees.
- **EEO statement**: `{Company}` ist Arbeitgeber, der Chancengleichheit
  fördert. Wir berücksichtigen alle qualifizierten Bewerber unabhängig
  von Rasse, Hautfarbe, Religion, Geschlecht, sexueller Orientierung,
  Geschlechtsidentität, nationaler Herkunft, Alter, Behinderung,
  Familienstand oder Veteranenstatus.
- **Accommodation statement**: as US-NY, German equivalent.
- **Application-data restrictions**: Photo and date-of-birth on
  application discouraged under AGG. Do not request.

## UK

- **Pay disclosure**: Not legally required at posting (consultation
  ongoing). Recommended.
- **EEO statement**: `{Company}` is committed to equal opportunities
  and welcomes applications from all sections of the community,
  regardless of age, disability, gender reassignment, marriage and
  civil partnership, pregnancy and maternity, race, religion or
  belief, sex, or sexual orientation.
- **Accommodation statement**: Reasonable adjustments available on
  request — contact `{accommodations email}`.
- **Application-data restrictions**: GDPR / UK GDPR compliance
  required for any data collected.

## Regulated-jurisdictions list

These jurisdictions require pay-range disclosure. The jd-writer skill
treats this list as the trigger for the "pay-range missing" guard:

- US-NY
- US-CA
- US-CO
- US-WA
- US-IL

## Last edited

{YYYY-MM-DD} — review quarterly. This matrix is a starting point, not
legal advice. Have employment counsel review before relying on it for
posting.
