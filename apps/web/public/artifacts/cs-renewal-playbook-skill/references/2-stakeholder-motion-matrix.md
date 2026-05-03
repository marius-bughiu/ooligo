# Stakeholder-motion matrix — TEMPLATE

> Replace this template's contents with your team's actual stakeholder roles
> and the recommended motion per role per archetype. The cs-renewal-playbook
> skill reads this on every run; the matrix is the single source of truth for
> "which stakeholder do we engage, and how, given which risk pattern."

## Roles the Skill recognizes

The Skill matches stakeholder titles in Gainsight to one of these canonical roles. Edit the title patterns to match your buyer language.

| Canonical role | Title patterns | Required for renewal? |
|---|---|---|
| Economic buyer | VP, SVP, C-level in budget-owning function | Yes (caps probability band if missing) |
| Champion | Director or Sr Manager in product-using function | Yes |
| End user | IC or Manager in product-using function | Yes |
| Technical evaluator | IT, Security, RevOps Architect | Optional (required if archetype is `competitive`) |
| Executive sponsor | Customer-side exec who agreed to sponsor at sale | Optional (required if segment is enterprise) |
| Procurement | Procurement, Vendor Management, Sourcing | Optional (required at T-60 if enterprise) |

## Motion matrix

For each (role × archetype) cell, the recommended motion. The Skill cites this matrix when populating the stakeholder-motions table in the output.

### Economic buyer

| Archetype | Motion | Owner | Week | Success signal |
|---|---|---|---|---|
| champion-lost | Re-establish value-realized narrative; introduce new champion | CSM leader + AE | W2 | Meeting accepted |
| low-adoption | Joint EBR with usage data + adoption plan | CSM + CSM leader | W3 | Adoption commitment in writing |
| pricing-pushback | Route to Deal Desk; CSM frames value-realized, AE handles commercial | AE | W4 | Deal Desk engagement opened |
| competitive | Competitive differentiation briefing + customer references | CSM leader | W2 | Reference call scheduled |
| value-gap | Roadmap alignment session | CSM | W3 | Two next-quarter use cases identified |

### Champion

| Archetype | Motion | Owner | Week | Success signal |
|---|---|---|---|---|
| champion-lost | Identify and onboard new champion candidate | CSM | W1 | New champion confirmed in stakeholder map |
| low-adoption | Champion-led adoption office hours for end users | CSM | W2 | At least 5 end users attend |
| pricing-pushback | Equip champion with internal value-justification deck | CSM | W3 | Deck shared internally by champion |
| competitive | Champion-led competitive feature comparison session | CSM | W2 | Champion commits to internal advocacy |
| value-gap | New use-case discovery with champion | CSM | W2 | One new use case scoped |

### End user

| Archetype | Motion | Owner | Week | Success signal |
|---|---|---|---|---|
| champion-lost | Maintain weekly office hours; surface friction | CSM | Ongoing | Friction tickets logged |
| low-adoption | Targeted re-onboarding for the bottom-quartile users | CSM | W2 | Weekly active count moves up one quartile |
| pricing-pushback | Document hours-saved per user | CSM | W3 | Survey response from at least 60% |
| competitive | Workflow comparison: current vs competitor | CSM | W4 | Workflow doc shared with champion |
| value-gap | Feature-discovery session on under-used capabilities | CSM | W2 | Two new features adopted |

### Technical evaluator

| Archetype | Motion | Owner | Week | Success signal |
|---|---|---|---|---|
| competitive | Technical deep-dive on competitor gaps | CSM + Solutions | W3 | Technical questions resolved in writing |
| low-adoption | Integration health review | CSM + Solutions | W2 | At least one integration friction resolved |
| (others) | Skip unless surfaced by champion | — | — | — |

### Executive sponsor

| Archetype | Motion | Owner | Week | Success signal |
|---|---|---|---|---|
| champion-lost | Re-engage with new champion introduction | CSM leader | W3 | Sponsor meeting accepted |
| low-adoption | EBR with adoption commitment | CSM leader | W4 | Sponsor commits to internal mandate |
| pricing-pushback | Sponsor-to-sponsor commercial conversation (with AE) | AE + sponsor | W5 | Commercial path defined |
| competitive | Strategic-fit conversation | CSM leader | W3 | Sponsor reaffirms strategic intent |
| value-gap | Roadmap-aligned strategic review | CSM leader | W4 | Next-quarter expansion identified |

### Procurement

Engage at T-60 only, regardless of archetype. The motion is always: introduction email, terms walkthrough, paper-process scoping. Owner: AE. Success signal: paper process scoped and on calendar.

## Stakeholder gap rules

If a required role is missing, the Skill applies these caps to the renewal-probability band:

- Missing economic buyer → cap at `40-70%`
- Missing champion → cap at `15-40%`
- Missing end-user representation → cap at `40-70%`
- Missing executive sponsor (enterprise only) → cap at `40-70%`

Stacked caps take the lower of the applicable bands.

## Last edited

{YYYY-MM-DD}
