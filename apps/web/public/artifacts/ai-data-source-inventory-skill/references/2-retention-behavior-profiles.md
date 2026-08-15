# Reference 2 — Retention profile schema and worked profiles

## The schema

One profile per tool, or per tool-and-account-type where a tool is used both ways. Every factual field carries `source_url` and `checked_on`. A field missing either renders as `unknown` and scores as a gap; it never falls back to a default, because a plausible default is how an inventory becomes wrong quietly.

```yaml
tool: ""
account_type: ""          # corporate-sso | corporate-nonsso | personal | mixed
persists: ""              # yes | no | partial — some features retain, others do not
storage_side: ""          # tenant | vendor | both
storage_location: ""      # be specific: the mailbox folder, the Vault service, the workspace
policy_period: ""         # what the configured retention says
observed_deletion_lag: "" # how long until it actually stops being returned by search
deleted_by: ""            # end user | admin | automatic expiry | never
survives_source_deletion: ""   # does deleting the conversation delete the derived artifact
reachable_by_existing_hold: "" # yes | no — and by WHICH control
reachability_state: ""    # held | retained-not-held | not-retained | vendor-held-only
discoverable: ""          # the actual mechanism, or none
export_path: ""           # who can run it and what it produces
audit_trail: ""           # yes | no | partial
source_url: ""
checked_on: ""
```

**`reachable_by_existing_hold` may not be inferred.** It must name the control that does the reaching — a mailbox litigation hold, a Vault matter hold, a vendor-side compliance retention setting. "The vendor says they retain it" is not a hold; vendor-side retention for the vendor's own purposes is a policy the vendor can change and is not preservation on your instruction.

## The four states

| State | Meaning | What it obligates you to do |
|---|---|---|
| `held` | An existing hold already attaches to this data | Verify with a search that returns a hit count; then nothing further |
| `retained-not-held` | Data exists and is discoverable, but no hold attaches | Affirmative collection, with a date. This is the state with a deadline |
| `not-retained` | The interaction leaves no durable record | Document the basis; revisit at the recheck interval |
| `vendor-held-only` | Record exists only in vendor systems outside your control | Escalate to counsel as a possession-custody-or-control question |

`retained-not-held` is the state teams collapse into `held`, and it is the expensive mistake, because the data is discoverable — so it will be found — and unprotected — so it can disappear between the hold notice and the collection.

## Worked profile 1 — Microsoft 365 Copilot, chat interactions

```yaml
tool: "Microsoft 365 Copilot — chat"
account_type: "corporate-sso"
persists: "yes"
storage_side: "tenant"
storage_location: "Hidden folder in the Exchange Online mailbox of the user who ran the AI app; mailbox RecipientTypeDetails is UserMailbox. Soft-deleted items move to the SubstrateHolds folder."
policy_period: "As configured. Retention locations are now split: Microsoft Copilot experiences, Enterprise AI apps, Other AI apps."
observed_deletion_lag: "Timer job runs on a 1-7 day cycle; SubstrateHolds holds items a minimum of 1 day. Microsoft's worked example shows a delete-after-1-day policy taking up to 16 days before items stop being returned by eDiscovery."
deleted_by: "Retention policy expiry, or the user deleting the chat, or a request to delete the user's Copilot interaction history."
survives_source_deletion: "n/a for chat itself"
reachable_by_existing_hold: "yes — Litigation Hold, delay hold, eDiscovery hold, or another retention policy on the same mailbox location all suspend permanent deletion from SubstrateHolds"
reachability_state: "held"
discoverable: "yes — eDiscovery, searching the Exchange mailbox location. Item class filter: Copilot activity."
export_path: "Purview eDiscovery export, by the eDiscovery admin"
audit_trail: "yes"
source_url: "https://learn.microsoft.com/en-us/purview/retention-policies-copilot"
checked_on: "2026-08-15"
```

**The consequence people miss:** every custodian already on a mailbox litigation hold has their Copilot chat preserved right now, intentionally or not. Check this before writing a retention schedule that says otherwise.

## Worked profile 2 — Microsoft 365 Copilot, memory

The same product, a different answer, which is why the schema splits by feature and not only by tool.

```yaml
tool: "Microsoft 365 Copilot — memory and personalization"
account_type: "corporate-sso"
persists: "yes"
storage_side: "tenant"
storage_location: "User's Exchange mailbox, hidden folder. Item class IPM.Contact; the memory sits in the CopilotMemory folder."
policy_period: "none — no retention applies"
observed_deletion_lag: "n/a"
deleted_by: "End user only, in Settings > Personalization. Chat-history-derived details drop within 7 days if every source chat is deleted; all chat-history details are deleted after 30 days if the control is turned off."
survives_source_deletion: "yes — deleting the chat does not delete a saved memory generated from it"
reachable_by_existing_hold: "no — Purview retention policies and retention labels do not apply to Copilot memory, and there are no admin controls to enforce retention rules for it"
reachability_state: "retained-not-held"
discoverable: "partial — saved and inferred memories are discoverable via eDiscovery and Graph Explorer. Custom instructions are NOT discoverable and must be exported by the user."
export_path: "eDiscovery plus Microsoft Graph Explorer, by the eDiscovery admin. Custom instructions: the custodian, manually."
audit_trail: "no — memory and personalization actions generate no Purview audit log entries"
source_url: "https://learn.microsoft.com/en-us/microsoft-365/copilot/copilot-personalization-memory"
checked_on: "2026-08-15"
```

Three separate problems in one row: no hold attaches, the artifact outlives the conversation that produced it, and there is no audit trail to establish what happened to it. Where a matter turns on what the organization knew, the memory is the part that says what the assistant was told to remember.

## Worked profile 3 — Gemini app in Google Workspace

```yaml
tool: "Gemini app (web and mobile)"
account_type: "corporate-sso"
persists: "yes"
storage_side: "tenant"
storage_location: "Workspace, covered by Google Vault"
policy_period: "As configured — default retention rules, or custom rules by OU or whole domain"
observed_deletion_lag: "unknown"
deleted_by: "Vault retention rule expiry, or the user"
survives_source_deletion: "unknown"
reachable_by_existing_hold: "yes — Vault litigation holds on Gemini app data, by OU or user list, available since 2026-06-11"
reachability_state: "held"
discoverable: "yes — Vault search and export"
export_path: "Vault export, by the Vault admin"
audit_trail: "yes — Vault audit"
source_url: "https://workspaceupdates.googleblog.com/2026/06/google-vault-now-supports-retention-rules-and-litigation-holds-for-Gemini-app.html"
checked_on: "2026-08-15"
```

**Two carve-outs that change the answer.** Vault's Gemini app support requires the Vault add-on and the listed editions — Business Plus, Frontline Standard and Plus, Enterprise Essentials Plus, Enterprise Standard and Plus, Education Fundamentals, Standard and Plus. Below that, there is no native hold. And Google states the support does not apply to Gemini in Google Workspace features embedded in other apps, such as "Help me write" in Gmail and Docs, because those interactions are not retained the same way — a separate row, in state `not-retained`.

## Worked profile 4 — ChatGPT, personal account on a corporate device

The hardest and most common row.

```yaml
tool: "ChatGPT — personal account"
account_type: "personal"
persists: "yes"
storage_side: "vendor"
storage_location: "OpenAI systems, under the consumer terms"
policy_period: "Deleted chats are removed from OpenAI systems within about 30 days; conversations with history disabled are retained about 30 days for abuse review"
observed_deletion_lag: "unknown"
deleted_by: "The individual account holder"
survives_source_deletion: "no"
reachable_by_existing_hold: "no — the organization holds no administrative relationship with this account"
reachability_state: "vendor-held-only"
discoverable: "only through the account holder, or third-party process to the vendor"
export_path: "The account holder's own data export"
audit_trail: "no"
source_url: "https://openai.com/business-data/"
checked_on: "2026-08-15"
```

Where a corporate workspace also exists, that is a **separate profile** in a different state: ChatGPT Enterprise appears in Microsoft's Purview retention location list under Enterprise AI apps, and workspace administrators control retention on the workspace side.

**A caution about assuming vendor-side preservation.** In the New York Times matter, a court order required OpenAI to preserve output log data that would otherwise have been deleted. That obligation ended on 2025-09-26 and the order was terminated by stipulation on 2025-10-09. For a window, consumer chats that users had deleted still existed; after it, the ordinary deletion schedule resumed. Nothing about that order was a control the organization held, and an inventory that recorded "OpenAI is preserving everything" in mid-2025 was wrong by that autumn. Vendor-side retention is not preservation on your instruction — record it as context, never as coverage.

## A note on the two other major vendors

**Anthropic.** Consumer accounts: deleted conversations leave chat history immediately and back-end storage within 30 days; where a user has enabled model improvement, data may be retained in de-identified form for up to 5 years in training pipelines. Commercial products — Claude for Work, Claude Enterprise, Claude for Education, Claude Gov — sit under commercial terms and are not used for model training. Some Claude Platform and Claude Code enterprise customers hold zero-data-retention arrangements by approval. Confirm which of these applies to your contract; the four cases produce four different rows.

**Microsoft, for non-Microsoft AI apps.** Purview's retention locations reach ChatGPT, Google Gemini, consumer Microsoft Copilot, and DeepSeek — but only when a collection policy with content capture is configured, which requires the **Content contains classifiers** condition set to **All**, and which does not include content in files shared with generative AI. Record the collection-policy state per tool as a tenant-configuration field. Absent that policy, the licence is present and the capture is not.
