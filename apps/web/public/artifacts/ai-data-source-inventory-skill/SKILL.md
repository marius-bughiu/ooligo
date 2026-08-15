---
name: ai-data-source-inventory
description: Turns an organization's AI-tool footprint into a preservation-scope inventory. For each AI tool in use, records where prompts and outputs persist, what deletes them and on what clock, whether an existing legal hold already reaches that data, and which custodian-questionnaire and hold-notice language has to change as a result. Read-only; produces findings, never places or releases a hold.
---

# AI data source inventory

## When to invoke

Invoke when someone has to answer, for a specific matter or as standing readiness work, the question **"where does our AI usage create records, and does our current preservation reach them?"** Concretely:

- A litigation hold is going out and the custodian list was built from mail, chat, and file shares — the pre-2023 source list.
- Opposing counsel serves an ESI request or a Rule 26(f) proposal that names AI tools, chatbot logs, or prompt history.
- The organization is drafting or revising its data map, records retention schedule, or an ESI protocol.
- A defensible-deletion program is about to start deleting, and nobody has checked what the AI layer copies or leaves behind.
- Security or IT has finished a shadow-AI discovery exercise and the output needs a records-and-preservation reading rather than a security reading.

## When NOT to invoke

- **You need the data collected, not scoped.** This produces an inventory and a gap list. Extraction is a different job with different tooling; see `references/2-retention-behavior-profiles.md` §Export path, which records whether one exists but does not run it.
- **A hold is already late.** If preservation should have attached and has not, issue the hold on the broadest defensible scope first and inventory afterward. An inventory is not a reason to delay a notice.
- **Fewer than about eight AI tools, one identity provider, all SSO-gated.** Read the four vendor admin consoles directly. The schema is overhead at that size.
- **You cannot reach any administrative console.** Every phase after discovery depends on tenant-side configuration you must be able to read. Without it the run produces a list of vendor marketing claims, which is worse than no inventory because it looks like one.
- **The real question is whether employees should be using these tools.** That is an acceptable-use and security question. This Skill assumes the usage exists and asks only what record it leaves.

## Inputs

**Required:**

- `org_identity_provider` (string) — `entra`, `okta`, `google`, or `other`. Determines which OAuth-grant export Phase 1 asks for.
- `discovery_exports` (paths) — at least three, one per discovery plane, per `references/1-ai-tool-discovery-sources.md`. Phase 2 refuses to run on fewer.
- `existing_hold_inventory` (path) — the current set of legal holds with their custodians and scoped locations. Without this the hold-reachability test in Phase 4 has nothing to test against.

**Optional:**

- `matter_scope` (string) — custodian list and date range, if the run is matter-driven rather than standing readiness. Narrows Phase 4 to the named custodians.
- `jurisdictions` (list) — drives which retention obligations Phase 5 flags. Defaults to US federal civil.
- `recheck_interval_days` (integer) — how long a vendor retention profile stays valid. Default 90.

## Reference files

- `references/1-ai-tool-discovery-sources.md` — the discovery planes, what each one sees and structurally cannot see, and the fillable known-tools registry (Part C) you complete before the first run.
- `references/2-retention-behavior-profiles.md` — the per-tool profile schema, the four-state reachability classification, and four worked profiles with sources.
- `references/3-custodian-questionnaire-deltas.md` — the questions to add to a custodian interview and the hold-notice clauses that change, with fillable text.

## Method

Six phases, fixed order. Phases 2 and 4 have hard refusal conditions; they are the two places where a plausible-looking run is worse than no run.

### Phase 0 — Pin the run

Write `run_dir/run-meta.json`: who ran it, against which tenant, with which read permissions, and the `recheck_interval_days` in force. An inventory whose own scope is unrecorded cannot be diffed against the next one, and the diff is the entire long-term value.

### Phase 1 — Discover the footprint

Collect from every plane in `references/1-ai-tool-discovery-sources.md`. The planes are deliberately redundant because each is blind in a different direction: the IdP sees OAuth-connected apps and not the tool someone pays for with a personal card; expense data sees paid tools and not free tiers; browser and endpoint telemetry sees usage and not the tenant configuration behind it; the known-tools registry sees what people admit to.

Record each tool once with the union of planes that found it, and keep the per-plane provenance. **A tool found by exactly one plane is a different confidence class than one found by three**, and it is usually the single-plane finds that carry the preservation problem, because a tool nobody procured is a tool nobody configured.

### Phase 2 — Refuse, or proceed

Hard stop if fewer than three planes returned data, or if any plane returned zero records. A plane with zero records is a collection failure and renders in the report as `COLLECTION FAILED`, never as a clean result. This phase exists because the characteristic failure of this work is a tidy inventory of the twelve tools that were easy to find.

### Phase 3 — Build a retention profile per tool

For each tool, fill the profile schema in `references/2-retention-behavior-profiles.md` from **vendor documentation and tenant configuration only**. Model knowledge of a vendor's retention policy is not admissible input here, and the schema enforces it: every field carries a `source_url` and a `checked_on` date, and a field without both renders as `unknown`, not as a default.

The profile answers five questions in this order, because each one is only meaningful if the one before it is answered:

1. **Does the interaction persist at all?** Some AI features retain nothing. Google states that the June 2026 Vault support for Gemini app retention rules and litigation holds does not apply to Gemini in Google Workspace features embedded in other apps, such as "Help me write" in Gmail and Docs, because those interactions are not retained the same way. A feature that retains nothing is a finding, not a gap.
2. **Where does it persist — tenant-side or vendor-side?** This is the field that decides everything downstream. Microsoft 365 Copilot prompts and responses are copied into a hidden folder in the user's own Exchange Online mailbox, which puts them inside a location your existing controls already address. A consumer chatbot account holds its data only on the vendor's systems.
3. **What deletes it, and on what clock?**
4. **Does an existing hold reach it?** Phase 4.
5. **Is there an export path, and who can run it?**

### Phase 4 — Test hold reachability, both directions

Classify every tool into exactly one of four states. The four-state split is the engineering choice that makes this Skill different from a data map, because "we retain it" and "a hold reaches it" are independent facts and the failure modes run in opposite directions:

- **`held`** — an existing hold already attaches. Microsoft documents that permanent deletion of AI-app messages from the SubstrateHolds folder is suspended if the mailbox is under Litigation Hold, a delay hold, another retention policy for the same location, or an eDiscovery hold. A custodian whose mailbox is on hold therefore already has Copilot chat preserved, whether or not anyone intended that.
- **`retained-not-held`** — the data exists and is discoverable, but no hold mechanism attaches to it. Microsoft 365 Copilot memory is the reference case: Microsoft states that Purview retention policies and retention labels do not apply to Copilot memory and that there are no admin controls to enforce retention rules for it, while saved and inferred memories remain discoverable through eDiscovery and Graph Explorer. Preservation here is an affirmative collection task with a deadline, not a hold you place and forget.
- **`not-retained`** — the interaction leaves no record. Document it and move on.
- **`vendor-held-only`** — the record exists solely in vendor systems your holds cannot touch, typically personal or free-tier accounts. This is the row that turns into a possession-custody-or-control question rather than a configuration task, and it belongs in front of counsel, not in front of IT.

Then run the test in reverse. For each **existing** hold, list which AI data sources it silently sweeps in. Over-preservation is a reportable finding: it inflates review volume, it contradicts a written policy that says AI interactions are not preserved, and it is discovered at the worst possible moment when it is discovered by the other side.

### Phase 5 — Derive the questionnaire and notice deltas

Diff the inventory against the current custodian questionnaire and hold-notice text. Emit only the deltas, with the specific tool that motivated each one, using the fillable language in `references/3-custodian-questionnaire-deltas.md`. A generic "do you use AI tools?" question returns a yes and nothing actionable; the questions that work name the tool and ask about the account, because the account type — corporate SSO or personal — is what determines which of the four states the custodian's data lands in.

### Phase 6 — Report

Sort by state, then by custodian count. Each row carries its evidence path so a reviewer reads the vendor documentation rather than arguing with a summary. The `vendor-held-only` and `retained-not-held` rows lead, because those are the two that require a decision this week.

## Output format

`run_dir/report.md`, literally:

```
# AI data source inventory — Contoso Legal Ops
Run: 2026-08-15 | Tenant: contoso.onmicrosoft.com | Planes: 4 of 4 | Tools: 31
Existing holds tested: 7 | Profiles unverified past 90 days: 2

## retained-not-held (2)

### Microsoft 365 Copilot — memory
custodians: 340 (all licensed users)  |  plane: idp, expense, registry
persists: yes — user Exchange mailbox, hidden folder, item class IPM.Contact,
          folder CopilotMemory
deleted by: end user only, in Settings > Personalization. Deleting the source
          chat does not delete a saved memory generated from it.
hold reaches it: NO. Purview retention policies and labels do not apply to
          Copilot memory; no admin control enforces retention on it.
discoverable: yes — eDiscovery and Graph Explorer. Custom instructions are NOT
          discoverable and must be exported by the user.
audit trail: none — memory and personalization actions write no Purview audit
          log entries.
action: affirmative collection for the 12 matter custodians, by 2026-08-22.
source: learn.microsoft.com/microsoft-365/copilot/copilot-personalization-memory
checked_on: 2026-08-15

## vendor-held-only (5)
...

## held (19)
...

## not-retained (5)
...

## Over-preservation findings (3)
HOLD-2024-11 sweeps Copilot chat for 43 custodians. Retention schedule
section 4.2 states AI interactions are not preserved. One of the two is wrong.

## Questionnaire deltas (6)
## Notice deltas (2)
## Unverified profiles (2)
```

## Watch-outs

- **The app UI is not evidence of preservation.** Microsoft states plainly that messages visible in AI apps are not an accurate reflection of whether they are retained or permanently deleted, and that deletion timing runs on a timer job. **Guard:** Phase 4 verification is an eDiscovery search returning a hit count against a known custodian, never a screenshot of the chat pane.
- **Deletion lags far behind the configured period.** Microsoft's own worked example shows a delete-after-one-day policy taking up to 16 days before the message stops being returned by eDiscovery, because the timer job runs on a 1-7 day cycle and the SubstrateHolds folder adds a minimum of one more day. **Guard:** the profile schema separates `policy_period` from `observed_deletion_lag`, and defensible-deletion certifications cite the second.
- **Purview does not capture third-party AI content by default.** Retention for non-Microsoft AI apps depends on a collection policy with content capture enabled, which requires the **Content contains classifiers** condition set to **All**, and Microsoft states the capability does not include content in files shared with generative AI. **Guard:** Phase 3 records the collection-policy state as a tenant-configuration field per tool. "We have Purview" is not an answer to whether anything is being captured.
- **Vendor retention terms move, and they move both ways.** The preservation order in the New York Times matter required OpenAI to preserve output log data that would otherwise have been deleted; that obligation ended on 2025-09-26 and the order was terminated by stipulation on 2025-10-09. Google Vault gained retention rules and litigation holds for the Gemini app on 2026-06-11 — before that date there was no native hold. Anthropic retains consumer chats for up to five years in de-identified form in training pipelines when a user has enabled model improvement, and deletes from back-end storage within 30 days when they have not. **Guard:** every profile carries `checked_on`; anything past `recheck_interval_days` renders as `unverified` and is counted in the report header, so staleness is loud rather than invisible.
- **Free and personal-tier usage is the hardest class and the one a procurement-driven inventory misses entirely.** **Guard:** Phase 2's three-plane minimum exists for this; the browser and endpoint plane is the only one that sees an employee using a personal account on a corporate device.
- **An inventory that names individuals doing something unapproved becomes an HR document.** **Guard:** Phase 1 aggregates to tool and count by default and writes custodian-level detail only into `run_dir/custodians/`, which the report references by path and never inlines.
