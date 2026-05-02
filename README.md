# ooligo

**The AI workflow marketplace for ops leaders.**

[ooligo.com](https://ooligo.com)

ooligo is a multi-vertical, multi-language marketplace cataloguing every AI tool, comparison, workflow, prompt, skill, and MCP server that operations teams actually use. We launch with three verticals and three locales — the engine is designed to host many more.

## How it's built

- **AI-first content pipeline.** Every page is drafted, structured, and refreshed by LLMs from canonical sources (official docs, public APIs, structured datasets). Transparently labeled.
- **AI-only localization.** Translation runs through Claude with structured-output prompts, glossary enforcement, and automated QA. No human review — this is a deliberate experiment in fully-automated multilingual operation.
- **Multi-vertical, multi-locale data model from day 1.** Adding a vertical = config + a few curated pages. Adding a locale = config change + translation pipeline run.
- **Public repo, public roadmap, public metrics.** Build in public.

See [ROADMAP.md](./ROADMAP.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CONTENT_PIPELINE.md](./CONTENT_PIPELINE.md)

## License

ooligo uses a split license model:

- **Source code** — [MIT](./LICENSE). Build it, fork it, ship it.
- **Site content** under `content/` — [CC BY-SA 4.0](./LICENSE-CONTENT). Reuse with attribution; derivatives must stay CC BY-SA.
- **Brand** — the name "ooligo", the wordmark, the logo, and the visual brand identity are **not** covered by either license and are reserved by Marius Bughiu. Forks must use a different name and identity.

Contributing? See [CONTRIBUTING.md](./CONTRIBUTING.md).
