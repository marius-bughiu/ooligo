# Dedup rules — TEMPLATE

> Replace this template's contents with your team's actual matching rules.
> The Skill reads this file on every run; without your real rules, the
> dedup proposals will be generic and produce a high false-positive rate
> on the first scan.

## Object scope

Which SObjects this ruleset applies to. The Skill runs the rules per object; rules can differ across Account / Contact / Lead.

- [ ] Account
- [ ] Contact
- [ ] Lead

## Deterministic match keys

Pass one of the dedup pipeline. Two records that match on any single key listed here are surfaced as `high` confidence dedup candidates.

### Account

| Key                       | Normalization                                  | Match strength |
|---------------------------|------------------------------------------------|----------------|
| Primary domain            | lowercase, strip `www.`, strip TLD aliases     | strong         |
| Billing phone             | E.164 normalize, drop extension                | strong         |
| Stripped name + country   | NFKD, lowercase, drop suffixes (Inc/LLC/GmbH)  | medium         |
| D-U-N-S number            | exact                                          | strong         |

### Contact

| Key                       | Normalization                                  | Match strength |
|---------------------------|------------------------------------------------|----------------|
| Email                     | lowercase, strip `+tag`, strip dots in gmail   | strong         |
| Mobile phone              | E.164 normalize                                | strong         |
| Full name + AccountId     | NFKD, lowercase, drop punctuation              | medium         |

### Lead

| Key                       | Normalization                                  | Match strength |
|---------------------------|------------------------------------------------|----------------|
| Email                     | lowercase, strip `+tag`                        | strong         |
| Phone                     | E.164 normalize                                | strong         |

## Fuzzy / semantic similarity threshold

Pass two of the pipeline. Only candidates that share at least one weak signal (same first 6 digits of phone, same first token of name, same parent-domain TLD) are submitted for semantic comparison.

| SObject | Cosine similarity threshold | Notes                                    |
|---------|-----------------------------|------------------------------------------|
| Account | 0.85                        | Lower threshold misses APAC/EU branches  |
| Contact | 0.90                        | Higher because false positives expensive |
| Lead    | 0.80                        | Lower because cleanup tolerates churn    |

## Disqualifiers — never propose merge

Even if rules match, do not propose merge if any of the following holds:

- Records belong to different `RecordType` (e.g. Customer vs Partner)
- Records are owned by different BU `Sales_Region__c` values
- One record has an active Opportunity in `Negotiation` or later — defer to rep review, do not auto-propose
- Records carry a `Do_Not_Merge__c = TRUE` flag set by an admin

## Last edited

{YYYY-MM-DD}
