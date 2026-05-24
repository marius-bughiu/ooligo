# Locale register

Consolidated translation rules for the five non-EN locales ooligo ships. Every authoring routine reads this file once per run and applies the rules when drafting the translated variants inline alongside the EN body.

## The contract

**Translate; don't re-author.** Every non-EN variant says the same things the EN variant says — same opinions, same recommendations, same product judgments. If the EN entry says "Apollo is the right pick under $10M ARR," every translated entry says the same. Never inject locale-specific opinions or restructure the argument.

**Frontmatter is structural, not translatable.** Copy these fields verbatim across all 6 locales: `slug`, `canonical_slug`, `verticals`, `name`/`title`, `category`, `subcategories`, `pricing_model`, `pricing_starts_at`, `pricing_url`, `website`, `ai_native`, `mcp_available`, `api_available`, `integrations`, `ooligo_score`, `ooligo_score_breakdown`, `last_updated`, `affiliate_link`, `tool_a`, `tool_b`, `tools`, `tools_used`, `roles`, `difficulty`, `artifact_type`, `target_questions`, `related_tools`, `related_workflows`. Only the `locale` field differs per file. Body prose, headings, and inline alt text are translated; fenced code blocks, inline code spans, URLs, file paths, env vars, and tool/product names stay verbatim.

**`translated_*` frontmatter is optional under the new architecture.** Since translations are produced in the same session and commit as the EN source, the `translated_from`, `translated_at`, `translation_model`, and `source_sha256` fields are no longer required. Existing translated pages keep their values; new authoring runs may omit them.

## Shared glossary — never translate

These stay in their original form across **all 5** non-EN locales. Adding a new proper noun? Add it here, not in a per-locale section.

**Tool / vendor / platform names:**

```
Clay, Apollo, HubSpot, Salesforce, Claude, Claude Code, GPT, ChatGPT, Cursor,
n8n, MCP, Anthropic, OpenAI, Google, Microsoft, GitHub, Slack, Zapier,
Outreach, Salesloft, Gong, Chorus, Default, ZoomInfo, Lemlist, Smartlead,
Instantly, Lusha, RegieAI, Common Room, Pavilion, Gainsight, Reforge,
Maven, MasterClass, AppSumo, Levels.fyi, Wirecutter, Cloudflare, Astro,
Vercel, Netlify, beehiiv, Substack, LinkedIn, Twitter, X, Bluesky, Mastodon

Spellbook, Harvey, Ironclad, ContractPodAi, DraftWise, CARET Legal, Litera,
Kira Systems, Luminance, Everlaw, Logikcull, Casetext, LexisNexis, Clio,
MyCase, Filevine, PandaDoc, DocuSign, Concord, Juro, Agiloft, LinkSquares

Gem, Sense, Paradox, hireEZ, Eightfold, Findem, Greenhouse, Lever, Ashby,
Workday, BambooHR, ICIMS, Jobvite, Recruitee, Manatal, Bullhorn, Avature,
Phenom, Beamery, Loxo, HireVue, Pinpoint, GoodTime, Modernloop, Holly,
Juicebox, BrightHire, Metaview, HackerRank, CodeSignal, Harver, Plum,
Mercor, Disco, Dover
```

**Industry-English abbreviations and terms (stay in English, all locales):**

```
RevOps, GTM, ICP, TCV, ARR, MRR, NRR, GRR, SDR, BDR, AE, CSM, TA, RAG,
LLM, API, SaaS, CRM, MCP, RPA, ETL, ELT, BI, KPI, OKR, NPS, CSAT, QBR,
PLG, ABM, MQL, SQL (as in qualified-lead, not the language), CAC, LTV,
COGS, EBITDA, SOC 2, ISO 27001, HIPAA, GDPR, CCPA, EU AI Act, NYC LL 144

Legal Ops, Recruiting, TA, People Ops, Marketing Ops, Customer Success,
Customer Experience, RevOps
```

**Brand-internal:**

```
ooligo
```

Brand names stay in Latin script even in Japanese — never katakana-ize them.

---

## ES — Spanish (neutral LATAM)

**Register:** default to **"tú"** (informal-but-professional B2B register).

**Audience:** B2B operators across Mexico, Colombia, Argentina, Chile, Peru, and Spain (when reading neutral Spanish).

**Banned forms:**

- Iberian forms — "vosotros", "vale", "ordenador" (use "computadora"), "móvil" used alone (prefer "celular" or context), "coche" (use "auto" or "carro").
- Strongly accented rioplatense — "vos", "che", voseo conjugations ("tenés", "querés") unless in a direct quote.

**Fixed translations (industry English stays English):**

```
lead       → lead
pipeline   → pipeline
outbound   → outbound
inbound    → inbound
stack      → stack
workflow   → workflow
prompt     → prompt
agent      → agente
skill      → skill   (when referring to Claude Skills specifically)
```

**Voice:** confident, opinionated, structured. We rank, we recommend, we say what's bad. Don't soften into G2-style hedging.

---

## pt-BR — Portuguese (Brazilian)

**Register:** **"você"**, colloquial-but-professional B2B register.

**Audience:** B2B operators in Brazil.

**Banned forms:**

- European Portuguese — "tu" as default subject pronoun, "estás", "comboio" (use "trem"), "rapariga", "telemóvel" (use "celular"), Portugal-specific orthography pre-Acordo.

**Fixed translations:**

```
lead       → lead
pipeline   → pipeline
outbound   → outbound
inbound    → inbound
stack      → stack
workflow   → workflow
prompt     → prompt
agent      → agente
skill      → skill   (when referring to Claude Skills specifically)
deploy, feature, release, trigger → stay English
```

**Anglicisms are normal** in Brazilian B2B/tech writing — don't fight them. When the natural Brazilian usage is the English word, keep the English word.

**Voice:** confident, opinionated, structured. Same rule as ES — no hedging.

---

## DE — German (Bundesdeutsch, formal Sie)

**Register:** formal **Sie** (capitalized when addressing the reader). Standard for B2B.

**Audience:** B2B operators across Germany, Austria, Switzerland (DACH region).

**Banned forms:**

- Austrian-only — "Jänner" (use "Januar"), "Advokat" for lawyer (use "Anwalt"), "Sessel" for office chair in business contexts.
- Swiss-only — "Velo", "Natel", absent ß (Switzerland drops ß; we use it).

**Spelling:** use ß (Eszett) per Bundesdeutsch convention. Reformed orthography ("dass" not "daß").

**Fixed translations (capitalized loanword nouns, German convention):**

```
lead       → Lead
pipeline   → Pipeline
outbound   → Outbound
inbound    → Inbound
stack      → Stack
workflow   → Workflow
prompt     → Prompt
agent      → Agent
skill      → Skill   (when referring to Claude Skills specifically)
tool       → Tool
```

German capitalizes all nouns, including loanwords: **das Tool**, **der Workflow**, **die Pipeline**, **das Lead**, **der Agent**.

**Anglicisms are standard** in German tech writing — keep loanword nouns capitalized. Don't force translations like "Vertriebspipeline" when "Sales Pipeline" or just "Pipeline" reads more naturally.

**Voice:** confident, opinionated, structured. Same rule. No hedging.

---

## FR — French (Metropolitan, formal vous)

**Register:** formal **"vous"**. Standard for B2B.

**Audience:** French-speaking B2B operators across France, Belgium, Switzerland, Luxembourg, and Quebec readers comfortable with Metropolitan French.

**Banned forms:**

- Quebec-only — "courriel" (use "email"), "téléversement" (use "upload"), "fin de semaine" (use "week-end"), "magasinage".
- Académie-prescribed neologisms that nobody uses in tech — "fluence", "octet" only when bytes are specifically meant (not as a generic stand-in for "byte" the colloquialism).

**Fixed translations (anglicisms standard in French tech):**

```
lead       → lead
pipeline   → pipeline
outbound   → outbound
inbound    → inbound
stack      → stack
workflow   → workflow
prompt     → prompt
agent      → agent
skill      → skill   (when referring to Claude Skills specifically)
email      → email
upload     → upload
deploy     → déployer (verb) / déploiement (noun)
```

**Typography:** use French typographic conventions — non-breaking space before `: ; ! ?` and inside « » quotes. (HTML/MDX: use `&nbsp;` or the Unicode NBSP ` `; never a regular space.)

**Voice:** confident, opinionated, structured. Same rule. No hedging.

---

## JA — Japanese (business polite, です/ます)

**Register:** **です/ます** (business polite). Confident and professional.

**Audience:** Japanese B2B operators across SaaS, AI infrastructure, GTM teams.

**Banned forms:**

- Plain/dictionary form (だ/である) — too casual for B2B.
- Heavy keigo (お〜になる, 〜いたします, 〜申し上げます) — too formal/stiff for tech writing.

**Numerals:** Arabic digits only (5, 10, 100). Never Chinese-Japanese kanji numerals (五, 十, 百) in body text.

**Punctuation:**

- Full-width 「」 for quotes within Japanese sentences. ASCII quotes inside code blocks.
- Japanese commas/periods (、 and 。) for body prose. Standard ASCII punctuation inside code or English-only phrases.
- No space between Japanese characters; one half-width space between Japanese and Latin script (e.g. `Claude を使って`).

**Fixed translations (katakana for general loanwords; Latin for tech/brand):**

```
lead       → リード
pipeline   → パイプライン
outbound   → アウトバウンド
inbound    → インバウンド
stack      → スタック
workflow   → ワークフロー
prompt     → プロンプト
agent      → エージェント
skill      → スキル   (when referring to Claude Skills specifically)
```

Brand and tool names stay in **Latin script** (Claude, Apollo, GitHub, HubSpot) — never katakana-ize them.

**Voice:** confident, opinionated, structured. Japanese hedging defaults are stronger than English — resist them. We rank, we recommend, we say what's bad.

---

## When you spot a factual error in the EN source

Stop and surface it. Do **not** silently "fix" it in the translation. The fix belongs in the EN source as a separate change, and once it's there the next maintenance pass propagates it to all locales. Translation-time fixes diverge the locales from EN and break the contract.
