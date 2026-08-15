# Reference 1 — Discovery planes and the known-tools registry

Four planes. Each is blind in a specific direction, which is why Phase 2 refuses to score on fewer than three. Read the blindness column before deciding a plane is redundant.

| Plane | What it sees | What it structurally cannot see |
|---|---|---|
| A — Identity provider | Every app a user granted OAuth access to, with scopes and grant dates | A tool used without SSO or OAuth: a personal account, a browser extension with no OAuth flow, a desktop app holding an API key |
| B — Spend | Anything with an invoice, a card charge, or a procurement record | Free tiers, trials, tools inside a bundle already paid for, anything expensed as something else |
| C — Endpoint and browser | Actual usage, including personal-account usage on corporate devices | Tenant-side configuration; usage on personal devices; anything on an unmanaged endpoint |
| D — Known-tools registry | What the organization has written down, with an owner | Everything nobody wrote down — which is the population you are looking for |

## Part A — Identity provider export

**Entra ID.** Enterprise applications, filtered to those with delegated or application permissions granted in the review window. Export application display name, publisher, permission set, consent type (admin or user), and the user-assignment count. User-consented grants matter more than admin-consented ones here: an admin-consented app went through some process, a user-consented app did not.

**Okta.** The OAuth grants report plus the app assignment report. Okta separates these, and the join is on app ID.

**Google Workspace.** Admin console, Security → API controls → App access control, plus the connected-apps report. Note that Workspace marks apps as trusted, limited, or blocked; export the state, not just the name.

Record for every grant: `tool_name`, `publisher`, `consent_type`, `user_count`, `first_grant_date`, `scopes`.

**Do not filter this export to apps whose name looks AI-related.** Most tools that added AI features did so under their existing name and existing grant, and they are exactly the ones with an unexamined retention change.

## Part B — Spend export

Pull from the SaaS management platform if one exists, otherwise from AP and the corporate-card feed. Twelve months minimum, because annual-billed tools appear once.

Match on merchant descriptor rather than product name; descriptors are frequently the legal entity and will not match the product your users know. Record `merchant_descriptor`, `mapped_tool`, `annual_amount`, `owning_cost_center`, `billing_cadence`.

A tool that appears in Part B but not Part A is either non-SSO or API-key-based, and both mean the identity provider will not show you who is using it.

## Part C — Endpoint and browser export

The three sources worth pulling, in descending order of what they tell you:

1. **Browser extension inventory** from managed-browser policy or the endpoint agent. AI extensions are the sharpest signal available for personal-account usage, because an extension installed against a personal account is invisible to Parts A and B and visible here.
2. **Egress or CASB records** for known AI vendor domains, aggregated to domain and user count. Do not pull request bodies; you are counting usage, not reading it.
3. **Microsoft Purview DSPM for AI**, if licensed, for its discovered-AI-app view. Read it as a discovery plane, not as a preservation answer — it tells you an app is in use and says nothing about whether the record it creates survives.

Record `tool_name`, `detection_source`, `distinct_users`, `first_seen`, `corporate_or_personal_account` where determinable, and leave that last field as `undetermined` rather than guessing. An `undetermined` account type escalates the tool one confidence class, because the unresolved case is the expensive one.

## Part D — Known-tools registry (fill this in)

The one file you complete by hand before the first run. Everything discovered in Parts A through C that is absent here reports as unregistered, which is the intended behavior and the whole point of keeping it.

One row per tool you already know about. Replace the example rows.

```csv
tool_name,vendor,plan_tier,account_type,business_owner_email,records_owner_email,approved_date,contains_privileged_content,contains_personal_data,notes
Microsoft 365 Copilot,Microsoft,M365 E5 add-on,corporate-sso,cio@example.com,legalops@example.com,2025-04-14,yes,yes,Tenant-wide. Licensed users only.
ChatGPT Enterprise,OpenAI,Enterprise,corporate-sso,cto@example.com,legalops@example.com,2025-11-02,no,yes,Engineering and marketing workspaces.
Claude for Work,Anthropic,Team,corporate-sso,cto@example.com,legalops@example.com,2026-01-20,no,yes,Commercial terms; not used for training.
Gemini app,Google,Workspace Enterprise Plus,corporate-sso,cio@example.com,legalops@example.com,2026-02-09,no,yes,Vault add-on present.
```

Field notes:

- **`records_owner_email`** is deliberately separate from `business_owner_email`. The person who bought the tool is rarely the person who can answer whether its output is a record, and routing preservation questions to the buyer is how they stall.
- **`contains_privileged_content`** drives Phase 5. A tool where legal staff draft or discuss matters changes both the questionnaire language and the collection procedure, and it is worth over-flagging.
- **`account_type`** takes `corporate-sso`, `corporate-nonsso`, `personal`, or `mixed`. `mixed` is common and is not a cop-out — a tool with a corporate workspace that people also use on personal accounts genuinely lands in two of the four reachability states at once, and the profile splits into two rows.

## Reconciliation

Join all four planes on a normalized tool key. Vendors rename products, so maintain an alias list; the run is not required to resolve every alias automatically, but an unresolved alias must render as its own row rather than being silently merged.

Output `run_dir/footprint.jsonl`, one record per tool, carrying the plane provenance array. The next run diffs against this file, and the diff is worth more than the first inventory: a tool that appeared between runs, with no registry row, is the standing finding this whole exercise exists to produce.
