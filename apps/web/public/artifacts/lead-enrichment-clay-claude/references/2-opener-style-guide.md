# Opener style and review

The local program uses a fixed quoted-source template. It does not claim to generate persuasive copy or predict reply rates. `prompts/opener.md` is a separate prompt for an optional model-written draft after validation.

## Editable team settings

| Setting | Starter value | Your policy |
|---|---|---|
| Voice | Plain, direct, no flattery | Name your actual voice |
| Length | At most 50 whitespace-separated words | Keep or lower the cap |
| Supported content | One source-backed company fact | Specify permitted fact types |
| Close | An invitation without assumed internal pain | Supply a permitted close |
| Delivery | Human review only | Name the approving role |

A draft must cite one supplied source ID in the model output. It must not invent a funding round, technology purchase, hiring plan, revenue figure or internal problem. Do not infer that public product positioning proves a private operational difficulty.

Avoid “I noticed,” “love what you’re doing,” unsupported superlatives, guessed customer references and manufactured urgency. The quoted-source template does not remove banned words inside source text automatically; a reviewer must edit or reject that draft. There is no semantic style classifier in the Python program.

## Synthetic example

Evidence: “We build scheduling software for restaurant teams.”

Local draft:

> Your site says, “We build scheduling software for restaurant teams.” Would a conversation about that work be useful?

This is deliberately plain. It demonstrates traceability and gating, not measured outreach quality. Every result has `review_required: true`. A reviewer must confirm the correct company, factual support, tone, relevance and the operator's permission to use the record before any downstream action.

Model-written drafts from `prompts/opener.md` require the same review. They are not validated by `pipeline.py`, which validates extraction records and generates its own fixed template.
