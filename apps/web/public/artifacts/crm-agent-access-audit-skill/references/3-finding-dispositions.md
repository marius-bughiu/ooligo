# Reference 3 — Finding dispositions

Every disposition here is a **proposal**. The Skill writes them into the report; a named human fires them. Each entry states what the remediation breaks, because the remediations in this file are mostly org-wide and immediate, and the cost of firing one blindly lands on people who were using the integration.

Fill the approver column before the first run. An unrouted finding is a finding nobody closes.

| Disposition | Approver | Notification window |
|---|---|---|
| R1 — scope reduction | | 5 business days |
| R2 — block connected app | | 24 hours |
| R3 — per-user token revoke | | none required |
| R4 — split shared credential | | 10 business days |
| R5 — assign owner | | none required |
| R6 — restrict permitted users | | 5 business days |
| R7 — remove agent config | | 2 business days |

---

## R1 — Scope reduction

**For:** `scope-excess`.

Re-register the connected app or private app with the narrowest scope set its configured tools actually use. In Salesforce that means editing the connected app's OAuth scopes; in HubSpot it means creating a new private app with the reduced scope set and rotating the integration onto it.

**What it breaks:** every call the integration makes that used the removed scope, immediately and without a deprecation path. HubSpot private-app scope changes issue a new token — the old one stops working, so this is a rotation, not an edit.

**Sequence:** reduce in a sandbox first, run the integration's own test path, then production. Do not reduce and rotate in one change window; if something breaks you will not know which half caused it.

---

## R2 — Block connected app (Salesforce)

**For:** `orphan-grant` at T1, or any app you cannot identify.

Setup → Connected Apps OAuth Usage → **Block**.

**What it breaks:** every user's authorization for that app, across the whole org, at once. There is no per-user variant of Block and no staged rollout. Anything running against that app fails on its next call.

**Before firing:** check `UseCount` and `LastUsedDate` from `raw/sfdc-oauthtoken.csv`. An app with 14,000 uses and a last-use date inside the week is load-bearing for somebody, whatever the registry says. High use count with no owner means the owner search was incomplete, not that the integration is abandoned.

**When to fire immediately anyway:** the app is unrecognized and its publisher cannot be established, or a vendor has disclosed a token compromise. In an incident, breaking a working integration is the cheaper error.

---

## R3 — Per-user token revoke

**For:** `stale-grant` tied to one user, and offboarding cleanup.

Revoke from the user's detail page under **OAuth Connected Apps**, or programmatically:

```
POST https://<MyDomain>.my.salesforce.com/services/oauth2/revoke
token=<refresh_or_access_token>
```

**What it breaks:** that one user's authorization for that one app. The narrowest tool here.

**The offboarding trap this exists for:** deactivating a Salesforce user does not revoke that user's OAuth authorizations. Every departed employee who ever authorized an integration leaves a live grant behind unless someone revokes it explicitly. Run R3 across the full app list for each departure, not just the apps you remember them using.

---

## R4 — Split a shared credential

**For:** `unattributed-write`.

Register one connected app or private app per agent server, rotate each server onto its own credential, then revoke the shared one.

**What it breaks:** nothing, if sequenced correctly — register all N, rotate all N, verify all N, then revoke. Revoking before verification breaks every consumer simultaneously, which is the failure that makes teams abandon the split halfway and leave the shared credential in place.

**Why it is worth the 10-day window:** CRM audit rows attribute to the authenticated identity. With one credential behind four servers, an audit trail proves that a write happened and cannot establish which agent made it. That distinction only matters once — during an incident — and it cannot be reconstructed after the fact.

---

## R5 — Assign an owner

**For:** every unowned grant, before any other disposition.

Add the row to the registry in `references/1-grant-inventory-sources.md` Part C with a real justification and a review interval.

**What it breaks:** nothing. It is also the disposition that closes the most findings on a first run, because an org that has never kept a registry flags a large set of legitimate integrations that simply were not written down. Do this pass first — the unowned set that survives an honest ownership search is smaller and much more interesting.

---

## R6 — Restrict permitted users

**For:** any app set to `All users may self-authorize`.

Set **Permitted Users** to `Admin approved users are pre-authorized`, then grant access through a profile or permission set.

**What it breaks:** access for every user who self-authorized and does not hold the new profile or permission set. Pull the distinct `UserId` list for that app from `raw/sfdc-oauthtoken.csv` first and pre-assign the permission set to those users. Skipping that step converts a configuration change into an outage for an unknown number of people.

**Do this before enabling API Access Control**, not after. Enabling the allowlist against a population of self-authorized users produces a support queue.

---

## R7 — Remove an agent configuration

**For:** `annotation-mismatch` where the server does not need write access, and for servers whose credential you are revoking.

```
claude mcp remove <name>
```

**What it breaks:** that server for that scope only. Check which scope holds it first — `claude mcp get <name>` names the config root. Removing a `project`-scoped server edits `.mcp.json` and lands in the repository, so it affects everyone who clones it; removing a `local` or `user` server touches only `~/.claude.json` on that machine.

**Removing the config does not revoke the credential.** The token in the removed entry's `env` block stays valid until you revoke it in the CRM. Pair R7 with R1 or R3 — on its own it removes the client and leaves the grant.
