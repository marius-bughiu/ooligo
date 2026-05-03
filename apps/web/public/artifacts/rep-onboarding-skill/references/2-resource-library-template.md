# Resource library — TEMPLATE

> Replace this template's contents with your team's actual resource
> library. The rep-onboarding skill picks from this list when building
> the week-by-week plan. Resources without stable IDs (Gong call IDs,
> Notion page slugs, certification codes) are unusable — the rep
> cannot self-serve from "watch a good discovery call."

The skill expects each resource to have a stable ID, a tag, and a
`last_reviewed` date. It skips any resource older than 12 months.

## Format

```yaml
- id: gc_4821              # stable ID from source system
  type: gong-call          # gong-call | notion-doc | cert | role-play | reading
  tag: discovery           # discovery | demo | objection-handling | negotiation | competitive | onboarding
  segment: mid-market      # smb | mid-market | enterprise | all
  classification_fit:      # which rep classifications this resource is most useful for
    - needs-positioning
    - needs-fundamentals
  title: "Acme discovery vs Competitor X"
  url: https://...
  duration_min: 42
  last_reviewed: 2026-04-12
  notes: "AE handles competitor mention at 18:30, worth re-watching twice"
```

## Discovery calls

```yaml
- id: gc_XXXX
  type: gong-call
  tag: discovery
  segment: smb
  classification_fit: [needs-fundamentals]
  title: "{call title}"
  url: {gong url}
  duration_min: {N}
  last_reviewed: {YYYY-MM-DD}
  notes: "{what to listen for}"

- id: gc_XXXX
  type: gong-call
  tag: discovery
  segment: mid-market
  classification_fit: [needs-positioning, needs-multi-threading]
  title: "{call title}"
  url: {gong url}
  duration_min: {N}
  last_reviewed: {YYYY-MM-DD}
  notes: "{what to listen for}"
```

Add 5-10 more discovery calls covering the segments your team sells.

## Demo recordings

```yaml
- id: gc_XXXX
  type: gong-call
  tag: demo
  segment: mid-market
  classification_fit: [needs-product]
  title: "{call title}"
  url: {gong url}
  duration_min: {N}
  last_reviewed: {YYYY-MM-DD}
  notes: "{specific demo move to study}"
```

## Objection-handling clips

Short clips (5-15 min) covering pricing pushback, competitive displacement, no-decision risk.

```yaml
- id: gc_XXXX
  type: gong-call
  tag: objection-handling
  segment: all
  classification_fit: [needs-positioning, needs-velocity]
  title: "{clip title}"
  url: {gong url}
  duration_min: {N}
  last_reviewed: {YYYY-MM-DD}
```

## Internal documentation (Notion / Confluence)

```yaml
- id: notion-positioning-one-pager
  type: notion-doc
  tag: onboarding
  segment: all
  classification_fit: [needs-positioning, needs-product, needs-fundamentals]
  title: "Positioning one-pager"
  url: {notion url}
  last_reviewed: {YYYY-MM-DD}
```

List your: positioning one-pager, ICP rubric, competitive battle cards, pricing playbook, security/legal FAQ.

## Certifications

```yaml
- id: cert-product-fundamentals
  type: cert
  tag: onboarding
  segment: all
  classification_fit: [all]
  title: "Product fundamentals quiz"
  url: {LMS url}
  duration_min: 60
  last_reviewed: {YYYY-MM-DD}
  notes: "Must pass before week 3"
```

## Role-play scenarios

```yaml
- id: rp-discovery-cfo
  type: role-play
  tag: discovery
  segment: enterprise
  classification_fit: [needs-multi-threading]
  title: "Discovery with skeptical CFO"
  url: {scenario doc url}
  duration_min: 45
  last_reviewed: {YYYY-MM-DD}
  notes: "Run with manager + one peer rep observing"
```

## Reading

```yaml
- id: reading-segment-playbook
  type: reading
  tag: onboarding
  segment: mid-market
  classification_fit: [all]
  title: "Mid-market segment playbook"
  url: {url}
  last_reviewed: {YYYY-MM-DD}
```

## Last edited

{YYYY-MM-DD}
