# Jurisdictional tests + AI-vendor allowlist — TEMPLATE

> Replace this template's contents with the jurisdictional tests the
> matter is approved to run against, and the matter team's actual
> AI-vendor allowlist. The skill reads this file on every batch and
> hard-checks the configured endpoint at startup.
>
> Privilege tests differ materially across jurisdictions. Defaulting
> to a single test (e.g. US federal) silently when running against
> EU or UK documents is unsafe — the underlying privilege concept
> (attorney-client vs. legal professional privilege) is structurally
> different. The skill refuses to run if the `jurisdiction` input
> does not match a test defined here.

## US federal — attorney-client privilege

Source: Upjohn Co. v. United States, 449 U.S. 383 (1981) and the common-law standard adopted in federal civil practice.

A communication is privileged when ALL of:

1. The communication is between an attorney and a client
2. The communication is for the purpose of obtaining or providing legal advice
3. The communication is intended to be confidential
4. The privilege has not been waived (no third-party present, not disclosed externally)

The skill's step 2 prompt encodes these four prongs as the test set when `jurisdiction = us-federal`. The `basis` field on the output names which prong(s) fired.

### Corporate context (Upjohn)

For corporate clients, the privilege extends to communications between counsel and any employee whose communication relates to a matter within the scope of their corporate duties, where the communication is for the purpose of seeking or providing legal advice. The rubric's privilege circle (file 1) operationalizes this for the matter.

## US federal — work-product doctrine

Source: Hickman v. Taylor, 329 U.S. 495 (1947) and Federal Rule of Civil Procedure 26(b)(3).

Work product is protected when ALL of:

1. The document is a tangible thing (memo, draft, notes, analysis)
2. Prepared in anticipation of litigation or for trial
3. By or for a party or its representative

Opinion work product (mental impressions, conclusions, opinions, legal theories) gets near-absolute protection; fact work product gets qualified protection that can be overcome by substantial need.

The skill flags opinion work product separately when the document contains explicit legal analysis or strategy language; it does NOT attempt to draw the qualified-vs-absolute line — that judgment stays with the attorney.

## US state — California (illustrative)

California's attorney-client privilege is codified in Evidence Code § 950 et seq., not common law. Material differences from the federal standard:

- The privilege belongs to the client, not the attorney, with a specific definitional structure (§ 953)
- "Confidential communication" is defined more broadly (§ 952)
- Specific holder rules apply on death of the client (§ 957)

When `jurisdiction = us-state-CA`, the skill applies the Evidence Code framing rather than the federal common-law framing. Add other state-specific test sets here as the matter team expands the approved-jurisdiction list.

## UK — legal advice privilege + litigation privilege

Source: Three Rivers (No. 5) [2003] QB 1556 and Three Rivers (No. 6) [2004] UKHL 48.

The UK distinguishes:

- **Legal advice privilege** — communications between lawyer and client for the dominant purpose of giving or receiving legal advice. Note the narrower "client" definition under Three Rivers (No. 5) — only personnel authorized to seek and receive legal advice on behalf of the corporate client count, not all employees.
- **Litigation privilege** — communications between lawyer / client / third party for the dominant purpose of pending or contemplated litigation.

When `jurisdiction = uk`, the skill applies these two tests separately and emits the matching test in the `basis` field. The narrower "client" definition is encoded in the rubric's privilege circle for UK matters — populate it carefully.

## EU — legal professional privilege (limited)

Source: AM&S Europe Ltd v Commission (Case 155/79); Akzo Nobel Chemicals Ltd v Commission (Case C-550/07 P).

EU LPP applies only to:

1. Communications with independent (non-in-house) lawyers admitted to a bar of an EEA member state
2. For the purpose of the client's right of defence
3. In the context of EU competition / antitrust proceedings (the case-law origin)

In-house counsel communications are NOT protected under EU law (Akzo Nobel). National laws of member states may protect them domestically but not in EU-level proceedings.

When `jurisdiction = eu`, the skill flags any communication where the only attorney is in-house with `concern: "eu_inhouse_not_protected"` and routes to borderline rather than classifying as privileged. Member-state-specific tests can be added as separate `jurisdiction` values (e.g. `eu-de`, `eu-fr`).

## Common-interest exception

When two parties with aligned legal interests share otherwise-privileged communications, the common-interest doctrine can preserve privilege. Requirements vary by jurisdiction; conservatively, the skill does NOT classify any document with a third-party recipient as `privileged` on common-interest grounds — every such document routes to borderline with `concern: "common_interest_check_required"` and the attorney applies the doctrine on review.

## Crime-fraud exception

Communications in furtherance of a crime or fraud are not privileged even if all four prongs of attorney-client privilege are met. The skill is NOT capable of detecting crime-fraud-triggering content and does not attempt to. Any signal of this from external sources is an attorney decision; the skill's `borderline_queue` is the routing mechanism.

## AI-vendor allowlist policy

Privileged content cannot be routed through a non-approved AI endpoint without risking waiver under a growing line of cases (see the matter team's AI policy doc for the cited cases). The skill enforces the allowlist at startup.

```yaml
# ALLOWED_ENDPOINTS — the skill refuses to run if its configured
# model endpoint is not on this list.
ALLOWED_ENDPOINTS:
  - api.anthropic.com         # Anthropic API direct, enterprise tier
  - <your-enterprise-tenant>  # e.g. enterprise-claude.acme.internal
  # Add additional Tier-A endpoints here, with sign-off from the
  # allowlist owner, before adding to the skill's runtime config.
```

### Allowlist governance

- **Allowlist owner**: {name, role — typically the firm's privacy officer, GC, or AI policy lead}
- **Sign-off required for changes**: {name + alternate}
- **Review cadence**: every {N} months, or on any material change to a vendor's data terms

### What is NOT on the allowlist (illustrative)

- Consumer-tier Claude (claude.ai personal account)
- Browser plugins of any vendor
- General-purpose chatbots (e.g. ChatGPT consumer, Gemini consumer)
- Unvetted SaaS wrappers that call models on the user's behalf
- Local LLMs that have not been formally approved (model weight provenance + data-handling review)

## Last edited

{YYYY-MM-DD}
