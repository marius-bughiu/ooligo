# Reference 3 — Custodian questionnaire and hold-notice deltas

Fillable text. Replace bracketed placeholders with the tools your Phase 3 inventory actually found; a question naming a tool nobody uses trains custodians to skim.

## Why the generic question fails

"Do you use any AI tools for work?" returns a yes, a no, or a shrug, and none of the three tells you which of the four reachability states the custodian's data sits in. The determining variable is almost never whether they use AI — it is **which account** they used, on **whose device**, and whether the output **left the tool**. Ask for those three directly.

## Part A — Questions to add to the custodian interview

Ask per named tool from the inventory, not in the abstract.

**A1 — Account identification.** "For [TOOL], which account do you sign in with — your [COMPANY] account, or a personal account?" Follow-up when the answer is personal or both: "Roughly when did you start, and is any of that work related to [MATTER SUBJECT]?"

*Why it is worded this way:* the answer routes the custodian's data between `held` and `vendor-held-only`, and those two have entirely different next steps. "Both" is a frequent and correct answer; accept it and record two rows.

**A2 — Device.** "Did you use [TOOL] on a [COMPANY]-managed device, a personal device, or both?"

**A3 — Output destination.** "When [TOOL] produced something you kept, where did it go — pasted into a document, an email, a ticket, or did it stay in the tool?"

*Why it matters more than it looks:* output that landed in a document is already inside your ordinary preservation, and the AI tool is then a secondary source rather than the record. This question is what stops an inventory from over-collecting an entire chat corpus to recover text that is sitting in a file share.

**A4 — Uploads.** "Did you upload or attach any files to [TOOL]? What kind?"

*Why:* Microsoft states that content capture for AI interactions does not include content in files shared with generative AI. A prompt referencing an attached document may be captured while the document itself is not, so the file's own location has to be established separately.

**A5 — Persistent instructions and memory.** "Have you set up custom instructions, saved memories, projects, or a custom assistant in [TOOL]?"

*Why:* these are `retained-not-held` in the reference case. Microsoft 365 Copilot custom instructions are not discoverable through eDiscovery at all and must be exported by the custodian themselves, which means this question is the only mechanism that reaches them.

**A6 — Deletion.** "Have you deleted conversations in [TOOL] since [TRIGGER DATE]? Do you have anything set to auto-delete?"

*Why:* asked plainly and without accusation, this surfaces routine hygiene before it becomes a spoliation argument. Record the answer verbatim.

**A7 — Extensions and connectors.** "Do you use any AI browser extensions, meeting notetakers, or assistants connected to your email or calendar?"

*Why:* this is the plane the identity provider misses. Notetakers in particular create a recording and a transcript in a third system that the custodian does not think of as a tool they use.

## Part B — Hold-notice clauses that change

**B1 — Scope clause.** Replace an enumerated list of systems with a formulation that reaches the AI layer explicitly:

> Your preservation obligation covers all information relating to [MATTER SUBJECT], regardless of where it is stored or what created it. This includes prompts you enter and responses you receive from AI assistants and chatbots — including [TOOL], [TOOL], and [TOOL] — whether accessed through your [COMPANY] account or a personal account, and whether on a [COMPANY] device or a personal one. It also includes saved memories, custom instructions, and stored projects within those tools.

**B2 — Anti-deletion clause, extended to derived artifacts.** The standard "do not delete" text assumes deleting the record deletes the record. In this layer that is not reliably true and the notice should say so:

> Do not delete conversations, and do not delete or edit saved memories, custom instructions, or stored project content in these tools. Deleting a conversation does not necessarily delete a memory the tool generated from it, and turning a feature off does not delete what it already stored.

**B3 — Personal-account clause.** The clause counsel should draft rather than copy, because its scope is a legal question about possession, custody, or control and about employee privacy in your jurisdiction. What the inventory contributes is the fact pattern: which tools showed personal-account usage, on how many devices, and for how long. Give counsel that and let them set the ask.

**B4 — Acknowledgement.** Add a per-tool acknowledgement line rather than one blanket signature. A custodian who checks a box next to a named tool has made a specific representation; a signature at the bottom of a page has not.

## Part C — Questions for IT and the records owner, not the custodian

Custodians cannot answer these and asking them wastes the interview.

- Is a collection policy with content capture configured for [TOOL]? Set to **All** classifiers?
- Which retention location covers [TOOL], and what is its period?
- Is the Vault add-on present, and is the edition one that supports holds for the tools in scope?
- Which existing holds already sweep in AI data sources, and for which custodians? (The over-preservation direction from Phase 4.)
- Who can run an export, how long does it take, and has anyone run one?

That last question is the one worth insisting on. An export path documented in a vendor help article and never once executed in your tenant is an assumption, and the moment to discover it does not work is not the week the production is due.
