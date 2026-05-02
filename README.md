# ooligo

**The AI workflow marketplace for ops leaders.**

ooligo is a multi-vertical, multi-language marketplace cataloguing every AI tool, comparison, workflow, prompt, skill, and MCP server that operations teams actually use. We launch with three verticals and three locales — the engine is designed to host many more.

## The trinity

| Verticals | Locales |
|---|---|
| **RevOps** (flagship) | **English** |
| **Legal Ops** | **Spanish** |
| **Recruiting / TA** | **Portuguese (Brazil)** |

Adjacent verticals (Marketing Ops, Customer Success, Sales, Insurance, etc.) and additional locales (DE, FR, IT, etc.) follow the engine, on the cadence in [ROADMAP.md](./ROADMAP.md).

## What's on the marketplace

- **`/tools`** — directory of AI tools, MCP servers, agents, GPTs, plugins, with structured comparison data and proprietary scoring
- **`/vs`** — pairwise comparisons (`Clay vs Apollo`), category roundups (`best AI dialers`), alternatives (`alternatives to Outreach`)
- **`/workflows`** — production-ready prompt packs, Claude Skills, Cursor rules, n8n flows, agent templates, by role and tool stack
- **`/learn`** — AEO-optimized FAQ + glossary + frameworks hub, structured for citation by ChatGPT, Claude, Perplexity, AI Overviews
- **`/r/[vertical]`** — vertical-specific landing pages, recommended stacks, curated workflow tracks

## How it's built

- **AI-first content pipeline.** Every page is drafted, structured, and refreshed by LLMs from canonical sources (official docs, public APIs, structured datasets). Transparently labeled.
- **AI-only localization.** Translation runs through Claude with structured-output prompts, glossary enforcement, and automated QA. No human review — this is a deliberate experiment in fully-automated multilingual operation.
- **Multi-vertical, multi-locale data model from day 1.** Adding a vertical = config + a few curated pages. Adding a locale = config change + translation pipeline run.
- **Public repo, public roadmap, public metrics.** Build in public.

See [ROADMAP.md](./ROADMAP.md) · [STACK.md](./STACK.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CONTENT_PIPELINE.md](./CONTENT_PIPELINE.md) · [DEPLOYMENT.md](./DEPLOYMENT.md)

## Live

- **Production:** [ooligo.com](https://ooligo.com)
- **Cloudflare backup URL:** [ooligo.pages.dev](https://ooligo.pages.dev)
- **Repo:** [github.com/marius-bughiu/ooligo](https://github.com/marius-bughiu/ooligo)
- **CI/Deploy:** every push to `main` builds and uploads via Wrangler — see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Status

**Pre-launch — Day 0.** Star/watch this repo to follow.

## License

MIT. See [LICENSE](./LICENSE).
