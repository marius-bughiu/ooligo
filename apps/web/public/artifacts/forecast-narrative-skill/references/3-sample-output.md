# Sample output — TEMPLATE

> A worked example of what the Skill produces, so a new RevOps reviewer
> can sanity-check structure and tone on a fresh run. Replace the
> placeholder names with your real run before sharing internally — these
> are illustrative, not real customers.

---

# Forecast narrative — Enterprise AMER, week ending 2026-05-01

## Headline

**Commit: $11.4M.** Confidence band: $10.1M to $12.6M based on 14 deals in commit, 79% covered by Gong activity in the last 14 days. Last period landed $9.8M vs $10.5M commit (miss of $0.7M).

## Top 3 deals moving the number

1. **Northwind Logistics — $1.6M, close 2026-05-22.** Moved from best-case to commit on Tuesday after Northwind's CRO confirmed the budget on the Apr 29 call. Gong: Apr 29, procurement timeline confirmed for May.
2. **Helios Health — $0.9M, close 2026-05-15.** Slipped from May 8 to May 15 after a redline round; legal agrees the new date is realistic. Gong: Apr 30, redlines exchanged with their legal team.
3. **Atlas Manufacturing — $1.2M, close 2026-06-12.** Amount increased from $0.9M to $1.2M after they added the EMEA org to scope. Gong: Apr 25, EMEA VP joined the call.

## Single biggest risk

**Concord Industries — $0.8M.** No Gong activity in 19 days; deal has been in commit since Apr 4 with no customer-side call since Apr 12. If this slips, commit lands at $10.6M.

## Ask of Sarah Chen

Get on the Concord call scheduled Thursday 2pm PT — the AE has not been able to engage their VP Procurement directly and your sponsorship would unblock the next redline cycle before the May 22 deadline.

## Sources

- Salesforce report: `0050000000ABCDE`, snapshot 2026-05-01 23:59 PT
- Gong workspace: `enterprise-amer`, activity window 2026-04-17 to 2026-05-01
- Prior-period actuals: April commit close, finance ledger 2026-05-01

---

## Reviewer checklist

Before sending to the exec, the RevOps reviewer scans for:

- [ ] Headline opens with a dollar number, not a verb.
- [ ] Confidence band is in dollars, not a percentage.
- [ ] Top 3 list is exactly 3, ranked, each with a Gong signal date.
- [ ] Risk section names exactly one deal with a specific signal.
- [ ] The ask names a person, an action, and a deadline.
- [ ] No hedge words from `2-hedge-words-blocklist.md` survived.
- [ ] Every specific deal claim traces to a Salesforce field or a Gong call summary visible in the source data — no inferred numbers without an `(inferred)` label.
