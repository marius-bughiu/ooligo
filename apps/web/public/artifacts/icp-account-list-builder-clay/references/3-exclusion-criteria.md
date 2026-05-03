# Exclusion criteria — TEMPLATE

> Replace this template's contents with your team's actual exclusion list
> before the first run of `icp-list-builder`. The skill reads this file in
> method Step 1 and Step 3, and refuses to write any matched domain to the
> output Clay table.

## Why this file matters

A list builder that writes existing customers, active opportunities, or
known-loss accounts back into outbound is worse than no list — it burns
trust with AEs, with the prospect (who gets contacted as a stranger), and
with CS (who finds out when the customer escalates). This file is the
backstop. The skill treats it as a hard filter, not a downweighting signal.

## Banned domains

Exact-match domains that must never appear in the output. The skill matches
on root domain and known parent-company domains.

```
# Existing customers
{customer1.com}
{customer2.com}

# Active opportunities (export from CRM monthly and paste here)
{opp1.com}
{opp2.com}

# Closed-lost in last 6 months (do not re-engage from outbound; route to AE for hand-touch)
{lost1.com}
{lost2.com}

# Do-not-contact requests honored
{dnc1.com}
{dnc2.com}

# Internal / partners / investors (never outbound)
{partner1.com}
{investor1.com}
```

## Banned parent companies

If the skill's enrichment step resolves a candidate to a parent in this list,
the candidate is dropped regardless of root-domain match.

- {Parent 1 — e.g. "BigCo Inc — all subsidiaries flagged"}
- {Parent 2}

## Firmographic exclusion patterns

Patterns broader than a single domain. The skill applies these in Step 3
after firmographic enrichment.

- {Pattern 1 — e.g. "Any company tagged as government contractor by NAICS prefix 5417"}
- {Pattern 2 — e.g. "Any company headquartered in {sanctioned-country-list}"}
- {Pattern 3 — e.g. "Any company with active M&A announcement in last 90 days"}

## Audit posture

Excluded candidates are not silently dropped. The skill's run metadata
section reports counts per exclusion category. This lets RevOps verify the
exclusion file is current and catches the case where the customer list export
was forgotten and a customer slipped through.

## Refresh cadence

This file is regenerated from CRM exports on a fixed cadence. Stale exclusion
files are the most common source of bad list output.

- Customers: refresh weekly (every Monday)
- Active opportunities: refresh weekly (every Monday)
- Closed-lost: refresh monthly (first of month)
- DNC: refresh on every request received
- Partners / investors: refresh quarterly

## Last refreshed

{YYYY-MM-DD} — exports as of this date. The skill warns in its output report
if this date is more than 14 days old.
