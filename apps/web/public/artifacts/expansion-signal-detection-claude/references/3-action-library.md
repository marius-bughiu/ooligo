# Action library — TEMPLATE

> Replace these actions with the next-best actions your CSM team
> actually runs. The skill maps each strong signal to one entry in
> this library; entries that are vague ("follow up", "engage
> stakeholder") are rejected by the post-process filter described in
> the SKILL.md watch-outs section.

## Action shape

Every entry MUST follow the shape:

```
verb + named artifact (a meeting, a person, a doc, or a ticket)
```

Acceptable:
- "Send the SSO setup checklist to the security contact and propose a 30-min walkthrough this week."
- "Forward the Q3 roadmap deck to the new VP of Eng and ask for a 15-min reaction call."
- "Open a Gainsight CTA tagged `enterprise-tier-evaluation` and ping the renewal owner in the linked thread."

Not acceptable:
- "Follow up on the opportunity" (no named artifact)
- "Reach out about expansion" (no verb-and-artifact)
- "Engage the buying committee" (vague)

The skill enforces this with a literal substring check on the
emitted Action field. Anything not from this library — or matching
the vague-language denylist — is replaced with `needs human review`.

## SKU: enterprise-tier

| Trigger pattern                              | Next-best action |
|----------------------------------------------|------------------|
| Call mention of SSO/SAML/SCIM + tier-gated attempt | "Send the SSO setup checklist {link} to the security contact and propose a 30-min walkthrough this week." |
| Compliance language + ticket tagged `compliance` | "Forward the SOC 2 report {link} and the compliance one-pager {link} to the named compliance contact within 48 hours." |
| Seat-count spike at 2x baseline + pricing call mention | "Schedule a 30-min commercial conversation with the EB this week. Bring the enterprise-tier pricing sheet {link}." |

## SKU: additional-team-seats

| Trigger pattern                              | Next-best action |
|----------------------------------------------|------------------|
| Call mention of new team + seat-count spike  | "Open a provisioning thread with the named admin and offer a 15-min onboarding for the new team this week." |
| `feature_first_use` from new department      | "Send the {department} onboarding playbook {link} to the named admin and CC the new department's manager." |

## SKU: premium-feature-pack

| Trigger pattern                              | Next-best action |
|----------------------------------------------|------------------|
| Use-case question + tier-gated attempt       | "Send the premium-feature one-pager {link} and book a 30-min product walkthrough with the asking persona this week." |
| `api_call_spike` on premium endpoints        | "Open a Gainsight CTA tagged `premium-pack-evaluation` and ping the technical evaluator in the linked thread." |

## SKU: {your_next_sku}

(Add a section per SKU. Every SKU listed in the taxonomy file MUST
have at least one matching trigger-action row here, or the skill
will emit `needs human review` for every signal that maps to it.)

## Vague-language denylist

The post-process filter rejects any Action field containing the
following substrings without an accompanying named artifact:

- `follow up`
- `reach out`
- `touch base`
- `align`
- `socialize`
- `engage`
- `circle back`
- `loop in`
- `start a conversation`

If a legitimate action needs one of these verbs, write the action
with a named artifact attached (e.g. "Loop in the Solutions Engineer
{name} on the next call to demo {feature}.").

## Last edited

{YYYY-MM-DD}
