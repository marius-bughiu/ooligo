# Asset inventory — TEMPLATE

> Replace this template's contents with your team's actual collateral
> inventory. The `deal-room-generator` skill reads this on every run and
> uses it to map assets to stakeholders. Without your real inventory, the
> output is a generic deal-room template.

The skill expects every asset to declare: `id`, `title`, `type`, `personas`,
`stages`, `last_updated`, `nda_required`, and `link`. Anything missing is
treated as "do not select" — the skill prefers omission over guessing.

## Asset format

Each entry in this table corresponds to one piece of collateral.

| id | title | type | personas | stages | last_updated | nda_required | link |
|---|---|---|---|---|---|---|---|
| roi-calc-v3 | ROI calculator (v3) | calculator | economic_buyer | proposal, procurement | 2026-02-14 | false | {url} |
| arch-diagram-2026 | Reference architecture | diagram | technical_evaluator, security | mutual_plan, proposal, procurement | 2026-01-09 | true | {url} |
| soc2-summary | SOC 2 Type II summary | security_doc | security, technical_evaluator | proposal, procurement | 2026-03-30 | true | {url} |
| workflow-tour-4min | Workflow walkthrough | video | end_user | mutual_plan, proposal | 2025-11-22 | false | {url} |
| customer-acme-case | Acme Corp case study | case_study | economic_buyer, champion | mutual_plan, proposal | 2025-09-01 | true | {url} |
| pricing-model-1pg | Pricing model one-pager | pricing | economic_buyer, procurement | proposal, procurement | 2026-04-04 | false | {url} |
| msa-preview | MSA preview (clean copy) | legal | legal, procurement | legal_redline | 2026-04-22 | true | {url} |
| dpa-preview | DPA preview | legal | legal, security | legal_redline | 2026-04-22 | true | {url} |
| insurance-certs | Insurance certificate list | compliance | procurement | procurement, legal_redline | 2026-04-15 | false | {url} |
| vendor-quest-response | Vendor questionnaire response | compliance | procurement, security | procurement | 2026-03-12 | true | {url} |

## Field meanings

- **id** — short slug, used in the deal-room outline tables.
- **type** — one of `case_study`, `calculator`, `diagram`, `video`,
  `security_doc`, `pricing`, `legal`, `compliance`, `battlecard`, `faq`.
  The skill uses this to group assets in the persona shelf.
- **personas** — list, drawn from: `economic_buyer`, `champion`,
  `technical_evaluator`, `end_user`, `procurement`, `legal`, `security`.
- **stages** — list, drawn from: `mutual_plan`, `proposal`, `procurement`,
  `legal_redline`.
- **last_updated** — ISO date. Anything older than 9 months from today is
  surfaced as `stale?` in the output so the rep refreshes or removes it.
- **nda_required** — boolean. The skill cross-references this against the
  `nda_signed` input; gated assets appear in the outline as "gated: NDA
  required" rather than being silently omitted.
- **link** — internal URL to the canonical version of the asset (Highspot,
  DocSend, Notion, Drive, Seismic — whatever your team uses).

## Battlecards (optional sub-section)

If the deal has a `competitor_in_play` input, the skill also reads this
sub-section and pulls the matching battlecard into the persona shelf for
the technical evaluator and economic buyer.

| competitor_slug | battlecard_id | last_updated | link |
|---|---|---|---|
| {competitor-1} | bc-{competitor-1} | YYYY-MM-DD | {url} |
| {competitor-2} | bc-{competitor-2} | YYYY-MM-DD | {url} |

## Last edited

{YYYY-MM-DD} — update on every material change so the deal-room outline
can flag stale entries.
